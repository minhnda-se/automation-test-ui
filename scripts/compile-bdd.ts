import * as fs from 'fs';
import * as path from 'path';

/**
 * BDD Gherkin compiler - FROZEN.
 *
 * This compiler is intentionally frozen at the six step patterns listed below.
 * It is kept because existing .feature files depend on it, not because it is a
 * complete BDD layer: it covers 6 of the 40 action keywords the framework
 * implements (see docs/ACTIONS.md), and it does not support Background,
 * Scenario Outline / Examples, tags, preconditions, postconditions, dataTable,
 * or call_flow.
 *
 * Do not extend it casually. Adding a step pattern means committing to keep a
 * second dictionary in sync with the handler layer for every future action, in
 * a place the generated action reference cannot check. Anything the six
 * patterns cannot express belongs in a JSON scenario, which supports the full
 * action set.
 *
 * If BDD is to become a first-class input, that is a deliberate project of its
 * own: deterministic identifiers, Background and Scenario Outline support, tag
 * passthrough, output into its own directory, and a dictionary generated from
 * the handlers rather than hand-written. See docs/claude/CLAUDE_ADOPTION_FEASIBILITY.md,
 * section C, option 3.
 *
 * Usage: npm run compile-bdd
 */

interface StepMapping {
  /** Human-readable form shown in error output. */
  pattern: string;
  regex: RegExp;
  build: (match: string[]) => Record<string, unknown>;
}

const STEP_MAPPINGS: StepMapping[] = [
  {
    pattern: 'I go to "<url>"',
    regex: /I go to "(.*)"/,
    build: (m) => ({ action: 'goto', data: m[1] }),
  },
  {
    pattern: 'I click "<element>" on "<Page>"',
    regex: /I click "(.*)" on "(.*)"/,
    build: (m) => ({ action: 'click', element: m[1], page: m[2] }),
  },
  {
    pattern: 'I fill "<value>" into "<element>" on "<Page>"',
    regex: /I fill "(.*)" into "(.*)" on "(.*)"/,
    build: (m) => ({ action: 'fill', data: m[1], element: m[2], page: m[3] }),
  },
  {
    pattern: 'I verify "<element>" is visible on "<Page>"',
    regex: /I verify "(.*)" is visible on "(.*)"/,
    build: (m) => ({ action: 'verify_visible', element: m[1], page: m[2] }),
  },
  {
    pattern: 'I verify "<element>" on "<Page>" has text "<value>"',
    regex: /I verify "(.*)" on "(.*)" has text "(.*)"/,
    build: (m) => ({ action: 'verify_text', element: m[1], page: m[2], data: m[3] }),
  },
  {
    pattern: 'I save text from "<element>" on "<Page>" as "<VARIABLE>"',
    regex: /I save text from "(.*)" on "(.*)" as "(.*)"/,
    build: (m) => ({ action: 'store_text', element: m[1], page: m[2], variable: m[3] }),
  },
];

const FEATURES_DIR = path.join(__dirname, '../data/features');
const SCENARIOS_DIR = path.join(__dirname, '../data/scenarios');
const LOCATORS_DIR = path.join(__dirname, '../data/locators');

function supportedPatternList(): string {
  return STEP_MAPPINGS.map((mapping) => `    ${mapping.pattern}`).join('\n');
}

/** Translates one Gherkin line into a JSON step, or throws with the full dictionary. */
function parseStep(line: string, file: string): Record<string, unknown> {
  const cleanLine = line.replace(/^(Given|When|Then|And|But)\s+/, '').trim();

  for (const mapping of STEP_MAPPINGS) {
    const match = cleanLine.match(mapping.regex);
    if (match) {
      return mapping.build(match);
    }
  }

  throw new Error(
    `[compile-bdd] No step mapping matched in ${file}:\n` +
      `    ${line}\n\n` +
      `  This compiler is frozen and supports exactly these six patterns:\n` +
      `${supportedPatternList()}\n\n` +
      `  Anything else must be written as a JSON scenario in data/scenarios/ instead,\n` +
      `  which supports the full action set (see docs/ACTIONS.md).`
  );
}

/** Stable per-feature identifier prefix, e.g. login.feature -> BDD_LOGIN. */
function testIdPrefix(featureFileName: string): string {
  const base = featureFileName.replace(/\.feature$/, '');
  const slug = base.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
  return `BDD_${slug}`;
}

function compileAll(): void {
  console.log('[compile-bdd] BDD compiler is FROZEN: 6 supported step patterns, 40 framework actions.');
  console.log('[compile-bdd] Use JSON scenarios for anything the six patterns cannot express.\n');

  if (!fs.existsSync(FEATURES_DIR)) fs.mkdirSync(FEATURES_DIR, { recursive: true });
  if (!fs.existsSync(SCENARIOS_DIR)) fs.mkdirSync(SCENARIOS_DIR, { recursive: true });

  const featureFiles = fs.readdirSync(FEATURES_DIR).filter((file) => file.endsWith('.feature'));

  if (featureFiles.length === 0) {
    console.log('[compile-bdd] No .feature files found in data/features/. Nothing to do.');
    return;
  }

  for (const file of featureFiles) {
    const fileContent = fs.readFileSync(path.join(FEATURES_DIR, file), 'utf-8');
    const lines = fileContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const baseName = file.replace('.feature', '');
    const customLocatorName = `${baseName}-locators.json`;
    const defaultLocator = fs.existsSync(path.join(LOCATORS_DIR, customLocatorName))
      ? customLocatorName
      : 'locators.json';

    const outputJson: any = {
      $schema: '../../schema/scenario-schema.json',
      config: { locatorFile: defaultLocator },
      scenario: '',
      testCases: [],
    };

    const prefix = testIdPrefix(file);
    let scenarioIndex = 0;
    let currentTestCase: any = null;

    for (const line of lines) {
      if (line.startsWith('#')) {
        // Only the locatorFile directive is honoured; other comments are ignored.
        if (line.startsWith('# locatorFile:')) {
          outputJson.config.locatorFile = line.replace('# locatorFile:', '').trim();
        }
      } else if (line.startsWith('Feature:')) {
        outputJson.scenario = line.replace('Feature:', '').trim();
      } else if (line.startsWith('Scenario:')) {
        if (currentTestCase) outputJson.testCases.push(currentTestCase);

        scenarioIndex++;
        currentTestCase = {
          // Deterministic: same feature file always produces the same ids, so a
          // recompile does not churn the git diff.
          testId: `${prefix}_${String(scenarioIndex).padStart(2, '0')}`,
          testName: line.replace('Scenario:', '').trim(),
          steps: [],
        };
      } else if (/^(Given|When|Then|And|But)/.test(line)) {
        if (!currentTestCase) {
          throw new Error(
            `[compile-bdd] Step found before any "Scenario:" line in ${file}:\n    ${line}`
          );
        }
        currentTestCase.steps.push(parseStep(line, file));
      } else if (line.startsWith('Background:') || line.startsWith('Scenario Outline:') || line.startsWith('Examples:')) {
        throw new Error(
          `[compile-bdd] "${line}" is not supported by this frozen compiler (${file}).\n` +
            `  Background, Scenario Outline, and Examples have no mapping. Express this as a\n` +
            `  JSON scenario in data/scenarios/ instead - dataTable covers the Examples case.`
        );
      }
    }

    if (currentTestCase) outputJson.testCases.push(currentTestCase);

    const outputFileName = file.replace('.feature', '-generated.json');
    fs.writeFileSync(
      path.join(SCENARIOS_DIR, outputFileName),
      JSON.stringify(outputJson, null, 2) + '\n'
    );

    console.log(
      `[compile-bdd] Compiled ${file} -> data/scenarios/${outputFileName} (${outputJson.testCases.length} test case(s))`
    );
  }

  console.log('\n[compile-bdd] Run "npm run validate" to check the generated scenarios.');
}

try {
  compileAll();
} catch (error: any) {
  console.error(error.message);
  process.exit(1);
}
