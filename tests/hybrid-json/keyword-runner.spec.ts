import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ActionEngine } from '../../utils/core/ActionEngine';
import { IScenario, ITestCase } from '../../types/scenario';
import { isWipSuite, WIP_TAG } from '../../utils/core/SuiteStatus';

const scenariosDirPath = path.join(__dirname, '../../data/scenarios');
const jsonFiles = fs.readdirSync(scenariosDirPath).filter((file) => file.endsWith('.json'));

/**
 * Tags are appended to the generated test title so that Playwright's `--grep`
 * can select a subset of the suite (e.g. `--grep @ci`). Projects are the wrong
 * tool here: every test case in the repository is generated from this one spec
 * file, so a per-application project would only re-filter the same file.
 *
 * Suite-level tags (config.tags) apply to every test case in the file and are
 * merged with any test-case-level tags. Duplicates are collapsed and order is
 * preserved so titles stay stable between runs.
 */
function buildTagSuffix(suiteTags?: string[], testCaseTags?: string[]): string {
  const merged = [...(suiteTags || []), ...(testCaseTags || [])]
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '')
    .map((tag) => (tag.startsWith('@') ? tag : `@${tag}`));

  const unique = Array.from(new Set(merged));
  return unique.length > 0 ? ` ${unique.join(' ')}` : '';
}

/**
 * Upper bound on a single teardown step. Deliberately far below the global
 * actionTimeout: teardown runs after a failure, when the page may be unusable,
 * and cleanup must not consume the test's remaining time budget.
 */
const TEARDOWN_STEP_TIMEOUT_MS = 5000;

/**
 * Resolve or reject `promise`, but give up after `ms`.
 *
 * Note this abandons the wait rather than cancelling the underlying Playwright
 * call - there is no cancellation to hand. That is fine here: the fixture tears
 * the page down immediately afterwards.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms and was abandoned`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer)) as Promise<T>;
}

async function runTestCaseSteps(engine: ActionEngine, testCase: ITestCase): Promise<void> {
  try {
    // 1. Execute Setup / Preconditions
    if (Array.isArray(testCase.preconditions)) {
      for (const [index, step] of testCase.preconditions.entries()) {
        const stepTitle = `Setup ${index + 1}: ${step.action} - ${step.element || step.url || step.variable || step.flow || ''}`;
        await test.step(stepTitle, async () => {
          await engine.executeStep(step);
        });
      }
    }

    // 2. Execute Main Test Steps
    if (Array.isArray(testCase.steps)) {
      for (const [stepIndex, step] of testCase.steps.entries()) {
        const stepTitle = `Step ${stepIndex + 1}: ${step.action} - ${step.element || step.url || step.variable || step.flow || ''}`;
        await test.step(stepTitle, async () => {
          await engine.executeStep(step);
        });
      }
    }
  } finally {
    // 3. Execute Teardown / Postconditions (Always runs even on failure)
    //
    // Each step is bounded by TEARDOWN_STEP_TIMEOUT_MS rather than the global
    // actionTimeout. When a test fails early - a navigation reset, say - the page
    // is dead, and every teardown click then burns the full action timeout
    // against it. Measured on 2026-08-26: a 1.1s connection reset in `goto` became
    // a 30s test timeout, because two teardown clicks at 15s each exhausted the
    // test budget. The retry then did the same, so a transient network blip
    // presented as a hard, unretryable failure.
    //
    // Cleanup is best-effort by definition, so it gets a short leash. Losing a
    // logout costs nothing - the next test opens its own context.
    if (Array.isArray(testCase.postconditions)) {
      for (const [index, step] of testCase.postconditions.entries()) {
        const stepTitle = `Teardown ${index + 1}: ${step.action} - ${step.element || step.url || step.variable || step.flow || ''}`;
        await test.step(stepTitle, async () => {
          try {
            await withTimeout(
              engine.executeStep(step),
              TEARDOWN_STEP_TIMEOUT_MS,
              `Teardown step ${index + 1} (${step.action})`
            );
          } catch (error: any) {
            console.error(
              `[Teardown] Postcondition ${index + 1} (${step.action}) did not complete: ${error?.message || error}`
            );
          }
        });
      }
    }
  }
}

for (const file of jsonFiles) {
  const filePath = path.join(scenariosDirPath, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let rawData: any;
  try {
    rawData = JSON.parse(fileContent);
  } catch (err) {
    console.error(`[Runner Error] Failed to parse JSON scenario: ${file}`, err);
    continue;
  }

  const isOldFormat = Array.isArray(rawData);
  const scenarioData: IScenario = isOldFormat
    ? { scenario: file, testCases: rawData }
    : rawData;

  const testCasesArray: ITestCase[] = scenarioData.testCases || [];
  const locatorFileName = scenarioData.config?.locatorFile || 'locators.json';
  const enableAutoHealing = scenarioData.config?.enableAutoHealing ?? false;
  const storageStateConfig = scenarioData.config?.storageState;
  // A wip suite is still waiting on the codegen locator handoff, so its steps
  // reference selectors that are literally the string "TODO_LOCATOR". Running
  // them produces an invalid-selector error per step, which says nothing the
  // validator has not already said more clearly. Register the tests and mark
  // them fixme instead: they stay visible in the report as unfinished rather
  // than disappearing, and the @wip tag makes them greppable.
  const suiteIsWip = isWipSuite(scenarioData.config?.status);
  const suiteTags = suiteIsWip ? [...(scenarioData.config?.tags || []), WIP_TAG] : scenarioData.config?.tags;

  const locatorFilePath = path.join(__dirname, '../../data/locators', locatorFileName);
  let dynamicLocators: any = {};
  if (fs.existsSync(locatorFilePath)) {
    try {
      dynamicLocators = JSON.parse(fs.readFileSync(locatorFilePath, 'utf-8'));
    } catch (err) {
      console.warn(`[Runner Warning] Could not parse locator file: ${locatorFileName}`);
    }
  }

  const suiteName = scenarioData.scenario || file;

  test.describe(`Suite: [${suiteName}]`, () => {
    if (suiteIsWip) {
      test.fixme(true, 'Suite is config.status "wip" - unresolved TODO_LOCATOR stubs');
    }

    // If storageState is configured and exists on disk, apply it to the test suite
    if (storageStateConfig) {
      const resolvedStatePath = path.isAbsolute(storageStateConfig)
        ? storageStateConfig
        : path.join(process.cwd(), storageStateConfig);

      if (fs.existsSync(resolvedStatePath)) {
        test.use({ storageState: resolvedStatePath });
      }
    }

    for (const testCase of testCasesArray) {
      // Data-Driven Test Case (Multiple data rows)
      if (Array.isArray(testCase.dataTable) && testCase.dataTable.length > 0) {
        for (const [rowIndex, rowData] of testCase.dataTable.entries()) {
          const testTitle = `[${testCase.testId || 'TC'}] ${testCase.testName} - [Data Row ${rowIndex + 1}]${buildTagSuffix(suiteTags, testCase.tags)}`;

          test(testTitle, async ({ page, request }, testInfo) => {
            const isolatedLocators = JSON.parse(JSON.stringify(dynamicLocators));
            const engine = new ActionEngine(
              page,
              request,
              testInfo,
              isolatedLocators,
              rowData,
              locatorFileName,
              enableAutoHealing
            );

            await runTestCaseSteps(engine, testCase);
          });
        }
      } else {
        // Standard Single-Execution Test Case
        const testTitle = `[${testCase.testId || 'TC'}] ${testCase.testName}${buildTagSuffix(suiteTags, testCase.tags)}`;

        test(testTitle, async ({ page, request }, testInfo) => {
          const isolatedLocators = JSON.parse(JSON.stringify(dynamicLocators));
          const engine = new ActionEngine(
            page,
            request,
            testInfo,
            isolatedLocators,
            {},
            locatorFileName,
            enableAutoHealing
          );

          await runTestCaseSteps(engine, testCase);
        });
      }
    }
  });
}
