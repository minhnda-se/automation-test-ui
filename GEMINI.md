# GEMINI.md - Project Context Map

## 1. Tech Stack & Key Dependencies
- **Runtime & Language:** Node.js (v18+, CommonJS), TypeScript (`^7.0.2`, strict mode, `NodeNext`), `tsx` (`^4.23.12`)
- **Test Engine:** Playwright (`@playwright/test` `^1.62.1`)
- **Reporting:** Playwright HTML Reporter, Allure (`allure-playwright` `^3.10.2`, `allure-commandline` `^2.43.0`) under unified `reports/`
- **Configuration & AI:** `dotenv` (`^17.4.2`), optional OpenAI API (`gpt-4o-mini`) for opt-in runtime locator healing

## 2. High-Level Architecture & Folder Map
Hybrid keyword-driven automation framework using the Strategy Pattern (`ActionEngine` -> `IActionHandler` -> `BaseHelper` subclasses) to execute declarative JSON scenarios, reusable sub-flows, and coded specs.

- `src/core/` - Orchestration layer (`ActionEngine`, `DataManager`, `LocatorManager`, `FlowManager`, `SuiteStatus`, `AutoHealer`).
- `src/handlers/` - Strategy handlers dispatching 43 action keywords (`UIActionHandler`, `AssertActionHandler`, `APIActionHandler`, `NetworkActionHandler`, `FlowActionHandler`).
- `src/helpers/` - Low-level Playwright wrappers (`BaseHelper`, `ElementHelper`, `AssertHelper`, `APIHelper`) owning all `page.*` and `request.*` calls.
- `src/types/` - Domain interfaces (`scenario.ts`, `engine.ts`) and generated `ActionType` union (`actions.generated.ts`).
- `schema/` - Authoritative JSON schema (`scenario-schema.json`), generated action catalog (`actions.json`), and hand-maintained field notes (`action-notes.json`).
- `scripts/` - Build/validation CLI tools (`generate-action-reference.ts`, `validate-scenarios.ts`, `assertion-presence.ts`, `english-only.ts`, `probe-locators.ts`, `generate-locator-todo.ts`, `csv-to-json.ts`, `compile-bdd.ts`).
- `data/scenarios/` - Declarative JSON test suites (`IScenario`) organized by target application.
- `data/locators/` - Centralized page/element CSS/XPath selector maps (`ILocatorStore`).
- `data/flows/` - Reusable parameterized step sequences invoked via `call_flow` (`IFlowDefinition`).
- `data/csv/` - CSV spreadsheet scenario sources compiled via `npm run csv2json`.
- `data/features/` - Legacy Gherkin `.feature` files compiled to `-generated.json` scenarios.
- `tests/hybrid-json/` - Dynamic Playwright test generator (`keyword-runner.spec.ts`) executing `data/scenarios/*.json`.
- `tests/hybrid-coded/` - Traditional TypeScript Playwright specs consuming centralized locator JSON files.
- `tests/framework/` - Offline framework invariant and contract guard specs (no network access required).
- `config/probe/` - State/action configuration files for `scripts/probe-locators.ts`.
- `docs/` - Generated action reference (`ACTIONS.md`), onboarding guide (`NEW_USER_GUIDE.md`), and gitignored `docs/internal/` archive.
- `reports/` - Unified gitignored output directory (`playwright-html/`, `allure-results/`, `allure-html/`, `test-results/`, `probe/`).

## 3. Key Entry Points & Data Flow
- **Test Execution Flow:**
  1. `playwright.config.ts` configures timeouts, retries, unified `reports/` outputs, env overrides (`PW_CHANNEL`, `SLOW_MO`, `WORKERS`), and browser projects.
  2. `tests/hybrid-json/keyword-runner.spec.ts` loads `data/scenarios/*.json` and matching `data/locators/*.json`, applies suite tags/status (`src/core/SuiteStatus.ts`), and registers Playwright `test()` blocks (expanding `dataTable` rows for DDT).
  3. For each test, `ActionEngine` (`src/core/ActionEngine.ts`) executes `preconditions`, `steps`, and `postconditions` (bounded by `TEARDOWN_STEP_TIMEOUT_MS = 5000`).
  4. `ActionEngine.executeStep()` resolves locators via `LocatorManager.getLocator()` (`src/core/LocatorManager.ts`) and dynamic tokens (`{{TIMESTAMP}}`, `{{RANDOM_EMAIL}}`, runtime variables) via `DataManager.resolve()` (`src/core/DataManager.ts`).
  5. `ActionEngine.dispatchAction()` delegates to the matching `IActionHandler` in `src/handlers/*.ts`, which calls `src/helpers/*.ts` to drive Playwright and attach screenshot/API evidence.
- **Single-Source Action Sync Flow:**
  1. Handlers in `src/handlers/*.ts` declare keywords in `supportedActions` (or `canHandle`) + `schema/action-notes.json`.
  2. `scripts/generate-action-reference.ts` parses handlers and generates `schema/actions.json`, `docs/ACTIONS.md`, the `action` enum in `schema/scenario-schema.json`, and `src/types/actions.generated.ts`.
- **Static Validation Gate Flow:**
  1. `scripts/validate-scenarios.ts` checks all scenarios and flows against `schema/actions.json`, `scripts/english-only.ts`, `scripts/assertion-presence.ts`, `src/core/SuiteStatus.ts`, and `data/locators/*.json`.

## 4. Build, Run & Test Commands
- `npm run validate` - CI gate: runs `actions:check` + strict scenario/flow/locator validation (fails on `TODO_LOCATOR` in `ready` suites).
- `npm run validate:wip` - Runs validation with `TODO_LOCATOR` downgraded to warnings (`--allow-todo`).
- `npm run actions:sync` - Regenerates `schema/actions.json`, `docs/ACTIONS.md`, `schema/scenario-schema.json` enum, and `src/types/actions.generated.ts`.
- `npm run actions:check` - Verifies generated action artifacts match `src/handlers/*.ts`.
- `npm run typecheck` - Runs `tsc --noEmit`.
- `npm run test:framework` - Runs offline guard specs in `tests/framework/` (fast, deterministic, no network).
- `npm run test:ci` - Runs the `@ci` smoke set (`npx playwright test tests/hybrid-json/ --grep @ci`).
- `npm test` - Cleans Allure folders and runs all JSON suites in `tests/hybrid-json/`.
- `npm run test:coded` - Runs traditional coded specs in `tests/hybrid-coded/`.
- `npm run test:saucedemo` / `npm run test:demoblaze` / `npm run test:booking` - Runs suites filtered by target tag.
- `npm run csv2json -- <file.csv>` - Compiles `data/csv/<file.csv>` into `data/scenarios/<file.json>`.
- `npm run compile-bdd` - Compiles `data/features/*.feature` into `data/scenarios/*-generated.json` (frozen at 6 step patterns).
- `npm run update-locators -- <scenario.json>` - Populates missing `page.element` keys as `"TODO_LOCATOR"` in the suite's locator file.
- `npm run probe-locators -- <config.json>` - Dumps live DOM attributes and strict-mode ambiguity warnings from `config/probe/*.json` into `reports/probe/`.
- `npm run clean` - Removes `reports/`.

## 5. Coding Conventions & Constraints
- **English-Only & Zero-Icon Policy:** All code, comments, terminal logs, and authored scenario fields (`scenario`, `testName`, `description`, `flowName`) must be printable ASCII English with zero emojis/icons (enforced by `scripts/english-only.ts` and `tests/framework/english-only.spec.ts`). Expected app copy in `step.data` is exempt.
- **Clean Architecture Boundary:** `src/core/` and `src/handlers/` must never call Playwright (`page.*`, `request.*`) or mutate files directly; delegate all driver/IO operations to `src/helpers/`.
- **Strict Locator Resolution:** Never hardcode selectors in scenario steps; use `page` (PascalCase) and `element` (camelCase). `LocatorManager` passes selectors verbatim without implicit `>> nth=0`. Unresolved selectors must use `"TODO_LOCATOR"`.
- **Single-Source Action Catalog:** Never hand-edit `schema/actions.json`, `docs/ACTIONS.md`, `src/types/actions.generated.ts`, or the `action` enum in `schema/scenario-schema.json`. Edit the handler and `schema/action-notes.json`, then run `npm run actions:sync`. Prose action counts in `README.md` and `.claude/` are guarded by `tests/framework/action-list-single-source.spec.ts`.
- **Mandatory Assertions:** Every test case must include at least one `verify_*` step in `steps` or `postconditions` (enforced by `scripts/assertion-presence.ts`).
- **AutoHealer Safety:** Runtime locator healing (`src/core/AutoHealer.ts`) is opt-in (`config.enableAutoHealing: true` + `OPENAI_API_KEY`) and writes proposals only to `reports/test-results/heal-report.json`, never mutating `data/locators/*.json`.
- **Git Discipline:** Do not commit unless explicitly requested by the user.

## 6. Current Roadmap Pointer
- Active audit findings, prioritized Phase 0-3 tasks (`RESTRUCT-01` through `RESTRUCT-04`, `TASK-01` through `TASK-13`), target files, and architectural decisions are tracked in `ACTION_PLAN.md`.
