import * as fs from 'fs';
import * as path from 'path';
import { resolveSuiteStatus } from '../utils/core/SuiteStatus';
import { checkAuthoredText } from './english-only';
import { checkTestCaseAsserts } from './assertion-presence';

const SCENARIOS_DIR = path.join(__dirname, '../data/scenarios');
const FLOWS_DIR = path.join(__dirname, '../data/flows');
const LOCATORS_DIR = path.join(__dirname, '../data/locators');

const ACTIONS_REFERENCE_PATH = path.join(__dirname, '../schema/actions.json');

/**
 * The valid action list is generated from utils/handlers/*.ts by
 * scripts/generate-action-reference.ts. It is never hand-maintained here:
 * a hand-copied list is how the action reference drifted from the engine before.
 * Run "npm run actions:sync" after adding or removing an action.
 */
function loadValidActions(): Set<string> {
  if (!fs.existsSync(ACTIONS_REFERENCE_PATH)) {
    console.error(
      '[Error] Action reference not found at schema/actions.json. Run: npm run actions:sync'
    );
    process.exit(1);
  }

  try {
    const reference = JSON.parse(fs.readFileSync(ACTIONS_REFERENCE_PATH, 'utf-8'));
    const names: string[] = reference.names || [];

    if (!Array.isArray(names) || names.length === 0) {
      console.error('[Error] Action reference is empty or malformed. Run: npm run actions:sync');
      process.exit(1);
    }

    return new Set(names);
  } catch (error: any) {
    console.error(`[Error] Could not read action reference: ${error.message}`);
    process.exit(1);
  }
}

const VALID_ACTIONS = loadValidActions();

const TODO_LOCATOR = 'TODO_LOCATOR';

/**
 * A locator is unresolved if it is the TODO_LOCATOR sentinel or blank.
 *
 * Blank counts because it is what the generator used to write: an empty string
 * is not `undefined`, so it passed the "entry exists" check and was accepted as
 * a real selector. A whole generated suite could clear this gate with every
 * selector still missing - found during the Phase 10a pilot, which is the first
 * time the generate-then-codegen handoff was actually run.
 */
function isUnresolved(selector: any): boolean {
  return selector === TODO_LOCATOR || (typeof selector === 'string' && selector.trim() === '');
}

/**
 * TODO_LOCATOR is the handoff contract between test generation and locator
 * discovery: a generated scenario references locators that do not exist yet,
 * and the locator file is the checklist for resolving them with Playwright
 * Codegen. A scenario that still references an unresolved stub is not runnable,
 * so it fails validation by default.
 *
 * Pass --allow-todo while that work is genuinely still in progress. It downgrades
 * unresolved stubs to warnings and is deliberately not what CI runs.
 *
 * `config.status: "wip"` does the same thing for one suite instead of all of
 * them, which is the difference that matters in CI: --allow-todo is a blanket
 * amnesty nobody should run on a gate, while a wip suite is a named exemption
 * recorded in the file it applies to. Every other check stays strict for a wip
 * suite - see the locator branch below for where the line is drawn.
 */
const ALLOW_TODO = process.argv.includes('--allow-todo');

const TAG_PATTERN = /^@[a-z0-9][a-z0-9._-]*$/;

/**
 * Tags are optional and additive - no existing file is required to carry them.
 * They are validated only for shape, because a malformed tag fails silently:
 * it is appended to the test title and simply never matches `--grep @ci`,
 * which looks exactly like a suite that was deliberately excluded.
 */
function validateTags(tags: any, label: string): string[] {
  if (tags === undefined) return [];

  if (!Array.isArray(tags)) {
    return [`[FAIL] [${label}] "tags" must be an array of strings (e.g. ["@saucedemo", "@ci"]).`];
  }

  const errors: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string' || !TAG_PATTERN.test(tag)) {
      errors.push(
        `[FAIL] [${label}] Invalid tag ${JSON.stringify(tag)}. Tags must look like "@saucedemo" - a leading "@" followed by lowercase letters, digits, ".", "_" or "-".`
      );
    }
  }
  return errors;
}

function validateAll() {
  console.log('Validating all scenario JSON files & flows against framework rules...\n');

  let totalErrors = 0;
  let totalFiles = 0;

  // key: "<locatorFile> -> <Page>.<element>", value: number of steps referencing it
  const unresolvedStubs = new Map<string, number>();

  // A locator problem is a property of the locator entry, not of each step that
  // uses it. One shared entry can be referenced by dozens of steps, so report it
  // once and count it once - otherwise a single missing selector buries every
  // other error in the run.
  const reportedLocatorIssues = new Set<string>();

  // Scenario files carrying config.status: "wip", for the summary. Their stubs
  // are outstanding work rather than build errors, and the summary says which
  // is which so a wip suite cannot quietly become permanent.
  const wipSuites = new Set<string>();
  const wipLocatorFiles = new Set<string>();

  // 1. Validate Scenarios
  if (fs.existsSync(SCENARIOS_DIR)) {
    const files = fs.readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      totalFiles++;
      const filePath = path.join(SCENARIOS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      let json: any;
      try {
        json = JSON.parse(content);
      } catch (e: any) {
        console.error(`[FAIL] [Scenario: ${file}] Invalid JSON syntax: ${e.message}`);
        totalErrors++;
        continue;
      }

      const isOldFormat = Array.isArray(json);
      const testCases = isOldFormat ? json : json.testCases;

      if (!Array.isArray(testCases)) {
        console.error(`[FAIL] [Scenario: ${file}] Missing 'testCases' array.`);
        totalErrors++;
        continue;
      }

      let suiteIsWip = false;

      if (!isOldFormat) {
        for (const message of validateTags(json.config?.tags, `Scenario: ${file} -> config`)) {
          console.error(message);
          totalErrors++;
        }

        const scenarioNameError = checkAuthoredText(
          'scenario',
          json.scenario,
          `Scenario: ${file}`
        );
        if (scenarioNameError) {
          console.error(scenarioNameError);
          totalErrors++;
        }

        const suiteStatus = resolveSuiteStatus(json.config?.status);
        if (suiteStatus.error) {
          console.error(`[FAIL] [Scenario: ${file} -> config] ${suiteStatus.error}`);
          totalErrors++;
        }
        suiteIsWip = suiteStatus.status === 'wip';
        if (suiteIsWip) wipSuites.add(file);
      }

      const locatorFile = isOldFormat
        ? 'locators.json'
        : json.config?.locatorFile || 'locators.json';
      const locatorPath = path.join(LOCATORS_DIR, locatorFile);
      let locatorsData: any = {};

      let locatorFileUsable = false;

      if (fs.existsSync(locatorPath)) {
        try {
          locatorsData = JSON.parse(fs.readFileSync(locatorPath, 'utf-8'));
          locatorFileUsable = true;
        } catch (e: any) {
          console.error(
            `[FAIL] [Scenario: ${file}] Referenced locator file is not valid JSON: ${locatorFile} (${e.message})`
          );
          totalErrors++;
        }
      } else {
        console.error(
          `[FAIL] [Scenario: ${file}] Referenced locator file does not exist: data/locators/${locatorFile}`
        );
        totalErrors++;
      }

      testCases.forEach((tc: any, tcIndex: number) => {
        const tcId = tc.testId || `TC#${tcIndex + 1}`;

        for (const message of validateTags(tc.tags, `${file} -> ${tcId}`)) {
          console.error(message);
          totalErrors++;
        }

        for (const field of ['testName', 'description'] as const) {
          const message = checkAuthoredText(field, tc[field], `${file} -> ${tcId}`);
          if (message) {
            console.error(message);
            totalErrors++;
          }
        }

        const assertionError = checkTestCaseAsserts(tc, `${file} -> ${tcId}`);
        if (assertionError) {
          console.error(assertionError);
          totalErrors++;
        }
        const allSteps = [
          ...(Array.isArray(tc.preconditions) ? tc.preconditions : []),
          ...(Array.isArray(tc.steps) ? tc.steps : []),
          ...(Array.isArray(tc.postconditions) ? tc.postconditions : []),
        ];

        allSteps.forEach((step: any, sIdx: number) => {
          if (!step.action) {
            console.error(`[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Missing "action" property.`);
            totalErrors++;
            return;
          }

          if (!VALID_ACTIONS.has(step.action)) {
            console.error(
              `[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Unknown action: "${step.action}".`
            );
            totalErrors++;
          }

          if (step.action === 'call_flow') {
            const flowName = step.flow?.endsWith('.json') ? step.flow : `${step.flow}.json`;
            const flowPath = path.join(FLOWS_DIR, flowName);
            if (!step.flow || !fs.existsSync(flowPath)) {
              console.error(
                `[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Referenced flow "${step.flow}" not found in data/flows/.`
              );
              totalErrors++;
            }
          }

          // Semantic Integrity Checks (Prevent Empty / Malformed Steps)
          if (['fill', 'select_option'].includes(step.action)) {
            if (step.data === undefined || step.data === '') {
              console.error(
                `[${file} -> ${tcId} -> Step ${sIdx + 1}] Action "${step.action}" requires non-empty "data" property.`
              );
              totalErrors++;
            }
            if (!step.element) {
              console.error(
                `[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Action "${step.action}" requires "element" property.`
              );
              totalErrors++;
            }
          }

          if (
            ['verify_text', 'verify_text_contains', 'verify_not_contains_text', 'verify_value'].includes(
              step.action
            )
          ) {
            if (step.data === undefined || step.data === '') {
              console.error(
                `[${file} -> ${tcId} -> Step ${sIdx + 1}] Assertion "${step.action}" requires non-empty "data" to compare against.`
              );
              totalErrors++;
            }
          }

          if (step.action === 'goto' && !step.data && !step.url) {
            console.error(
              `[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Action "goto" requires "data" or "url" containing the destination URL.`
            );
            totalErrors++;
          }

          if (step.action === 'verify_url_contains' && !step.data && !step.url) {
            console.error(
              `[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Assertion "verify_url_contains" requires "data" or "url".`
            );
            totalErrors++;
          }

          if (step.action === 'store_text' && !step.variable && !step.storeAs) {
            console.error(
              `[FAIL] [${file} -> ${tcId} -> Step ${sIdx + 1}] Action "store_text" requires "variable" or "storeAs" to name the target variable.`
            );
            totalErrors++;
          }

          if (step.page && step.element && locatorFileUsable) {
            const stepRef = `${file} -> ${tcId} -> Step ${sIdx + 1}`;

            const locatorKey = `${locatorFile} -> ${step.page}.${step.element}`;
            const firstReport = !reportedLocatorIssues.has(locatorKey);

            if (!locatorsData[step.page]) {
              if (firstReport) {
                reportedLocatorIssues.add(locatorKey);
                console.error(
                  `[FAIL] [${stepRef}] Page "${step.page}" not found in "${locatorFile}". Add it, or run: npm run update-locators -- ${file}`
                );
                totalErrors++;
              }
            } else if (locatorsData[step.page][step.element] === undefined) {
              if (firstReport) {
                reportedLocatorIssues.add(locatorKey);
                console.error(
                  `[FAIL] [${stepRef}] Element "${step.element}" not found in Page "${step.page}" (${locatorFile}). Add it, or run: npm run update-locators -- ${file}`
                );
                totalErrors++;
              }
            } else if (isUnresolved(locatorsData[step.page][step.element])) {
              unresolvedStubs.set(locatorKey, (unresolvedStubs.get(locatorKey) || 0) + 1);
              if (suiteIsWip) wipLocatorFiles.add(locatorFile);

              if (firstReport) {
                reportedLocatorIssues.add(locatorKey);

                // A missing page or element entry - the two branches above -
                // stays an error even for a wip suite. Those are authoring
                // mistakes, not pending codegen work: the generator writes a
                // TODO_LOCATOR entry for every locator a step references, so an
                // absent one means the scenario and its locator file disagree.
                // Only the sentinel is waiting on a human at a browser.
                if (ALLOW_TODO || suiteIsWip) {
                  console.warn(
                    `[WARN] [${stepRef}] Unresolved locator stub "${step.page}.${step.element}" in "${locatorFile}" (first of several references).`
                  );
                } else {
                  console.error(
                    `[FAIL] [${stepRef}] Unresolved locator stub "${step.page}.${step.element}" in "${locatorFile}" (value: ${JSON.stringify(locatorsData[step.page][step.element])}). Resolve it with Playwright Codegen, or re-run with --allow-todo while it is still in progress.`
                  );
                  totalErrors++;
                }
              }
            }
          }
        });
      });
    }
  }

  // 2. Validate Flows
  if (fs.existsSync(FLOWS_DIR)) {
    const flowFiles = fs.readdirSync(FLOWS_DIR).filter((f) => f.endsWith('.json'));
    for (const flowFile of flowFiles) {
      totalFiles++;
      const flowPath = path.join(FLOWS_DIR, flowFile);
      try {
        const flowData = JSON.parse(fs.readFileSync(flowPath, 'utf-8'));

        for (const field of ['flowName', 'description'] as const) {
          const message = checkAuthoredText(field, flowData[field], `Flow: ${flowFile}`);
          if (message) {
            console.error(message);
            totalErrors++;
          }
        }

        if (!Array.isArray(flowData.steps)) {
          console.error(`[FAIL] [Flow: ${flowFile}] Flow definition missing "steps" array.`);
          totalErrors++;
        }
      } catch (err: any) {
        console.error(`[FAIL] [Flow: ${flowFile}] Invalid JSON: ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n--------------------------------------------------`);

  if (wipSuites.size > 0) {
    console.log(
      `Work in progress: ${wipSuites.size} suite(s) marked config.status "wip" - ${Array.from(wipSuites).sort().join(', ')}`
    );
    console.log(
      `  Their unresolved stubs are reported below as outstanding work, not as errors.`
    );
    console.log(`  Set status back to "ready" once the locators are resolved.\n`);
  }

  if (unresolvedStubs.size > 0) {
    const label = ALLOW_TODO ? 'Outstanding locator work' : 'Unresolved locator stubs';
    console.log(`${label}: ${unresolvedStubs.size} element(s) still set to ${TODO_LOCATOR}\n`);

    const byFile = new Map<string, string[]>();
    for (const key of Array.from(unresolvedStubs.keys()).sort()) {
      const [locatorFile, reference] = key.split(' -> ');
      if (!byFile.has(locatorFile)) byFile.set(locatorFile, []);
      byFile.get(locatorFile)!.push(reference);
    }

    for (const [locatorFile, references] of byFile) {
      const suffix = wipLocatorFiles.has(locatorFile) ? '  (wip suite - not blocking)' : '';
      console.log(`  data/locators/${locatorFile}${suffix}`);
      for (const reference of references) {
        console.log(
          `    - ${reference} (${unresolvedStubs.get(`${locatorFile} -> ${reference}`)} step reference(s))`
        );
      }
    }

    console.log(`\n  Resolve these with: npx playwright codegen <url>`);
    console.log(
      `  Then replace each ${TODO_LOCATOR} value in the locator file with the recorded selector.\n`
    );
  }

  if (totalErrors === 0) {
    console.log(
      `[OK] Validation Passed: Processed ${totalFiles} scenario and flow files with 0 critical errors.`
    );
  } else {
    console.error(`[FAIL] Validation Failed: Found ${totalErrors} errors across ${totalFiles} files.`);
    process.exit(1);
  }
}

validateAll();
