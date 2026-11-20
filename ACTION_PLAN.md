# Project Audit & Action Plan

## 1. Executive Summary
- **Project Overview:** Playwright Hybrid Keyword-Driven Automation Framework (`v1.10.0`) enabling low-code E2E UI and API test authoring via JSON scenarios (`data/scenarios/`), reusable sub-flows (`data/flows/`), centralized locator maps (`data/locators/`), BDD/CSV transpilers (`scripts/compile-bdd.ts`, `scripts/csv-to-json.ts`), and coded Playwright specs (`tests/hybrid-coded/`). At runtime, `tests/hybrid-json/keyword-runner.spec.ts` dynamically generates Playwright tests and dispatches 43 action keywords through `ActionEngine` to modular strategy handlers and Playwright helpers.
- **Current Maturity:** **Pre-production (`v1.10.0`)** - The core keyword engine, single-source action reference generator (`scripts/generate-action-reference.ts`), static scenario validator (`scripts/validate-scenarios.ts`), and 8 offline framework guard test suites (`tests/framework/*.spec.ts`) are operational. Before tackling P0 runtime/validator bug fixes, the project will undergo a full structural standardization (Option B: `src/` source boundary, unified `reports/` output directory, `data/csv/` separation, `docs/internal/` archival, and clean configs/`README.md`).
- **Top 3 Risks / Bottlenecks:**
  1. **Fragmented Directory Layout, Reports & Config Drift:** Six separate report/output folders exist at root (`allure-results/`, `allure-report/`, `playwright-report/`, `test-results/`, `report/`, untracked `reports/`), `docs/` mixes CSV test inputs with documentation, `.editorconfig` (`indent_size = 4`) conflicts with `.prettierrc` (`tabWidth = 2`), and `README.md` / `docs/NEW_USER_GUIDE.md` have drifted from the actual codebase.
  2. **Silent False-Positive Negative Assertions & Broken Multi-Tab Context:** `AssertHelper.verifyNotContainsText` strips all whitespace from expected `data` (`String(data).replace(/\s+/g, '')`), causing multi-word negative assertions to pass unconditionally; `ElementHelper.switchNewTab` mutates `this.page` only on `ElementHelper`, leaving `AssertHelper`, `NetworkActionHandler`, and `AutoHealer` bound to the old tab.
  3. **JSON Injection in Object Resolution & Validation Blind Spots:** `ActionEngine` resolves object variables via `JSON.parse(resolve(JSON.stringify(data)))` (crashing on quotes/newlines), `APIActionHandler` never resolves `{{VARIABLE}}` tokens in `step.headers`, sub-flows in `data/flows/*.json` bypass step/locator/assertion validation, and `npm run csv2json` breaks `npm run validate`.

---

## 2. Execution Roadmap

### Phase 0: Project Restructuring & Standardization (Run First - Option B)

- [x] **[RESTRUCT-01] Consolidate source code into `src/` (`src/core`, `src/handlers`, `src/helpers`, `src/types`)** *(Effort: M | Depends on: None)*
  - **Why:** Confirmed by user decision (Option B). Separating framework runtime code (`utils/` + `types/`) under `src/` establishes a clean TypeScript project boundary distinct from `tests/`, `scripts/`, `data/`, and `schema/`.
  - **Target Files:** `utils/**` -> `src/**`, `types/**` -> `src/types/**`, `scripts/generate-action-reference.ts`, `scripts/validate-scenarios.ts`, `scripts/probe-locators.ts`, `tests/hybrid-json/keyword-runner.spec.ts`, `tests/framework/*.spec.ts`
  - **Implementation Notes:**
    1. Move `utils/core/` -> `src/core/`, `utils/handlers/` -> `src/handlers/`, `utils/helpers/` -> `src/helpers/`, and `types/` -> `src/types/`, then remove empty `utils/` and `types/` directories.
    2. Update internal relative imports inside `src/` (`../../types/*` -> `../types/*`, and `../utils/core/SuiteStatus` -> `../core/SuiteStatus` in `src/types/scenario.ts`). Verify `path.join(__dirname, '../../data/...')` in `src/core/AutoHealer.ts` and `src/core/FlowManager.ts` remains 2 levels deep.
    3. Update `scripts/generate-action-reference.ts` (`HANDLERS_DIR = 'src/handlers'`, `OUT_TYPES = 'src/types/actions.generated.ts'`, and generated source-of-truth headers) and run `npm run actions:sync`.
    4. Update imports in `scripts/validate-scenarios.ts`, `scripts/probe-locators.ts`, `tests/hybrid-json/keyword-runner.spec.ts`, and all 8 specs in `tests/framework/` (including `CODE_DIRS = ['src', 'scripts', 'tests']` in `tests/framework/english-only.spec.ts` and `src/types/actions.generated.ts` in `tests/framework/action-list-single-source.spec.ts` and `tests/framework/clear-and-unchecked.spec.ts`).
  - **Verification:** `npm run actions:check && npm run validate && npm run typecheck && npm run test:framework`

- [x] **[RESTRUCT-02] Unify all test/probe outputs under `reports/` and archive local docs into `docs/internal/`** *(Effort: M | Depends on: RESTRUCT-01)*
  - **Why:** Confirmed by user decision #2. Eliminates 6 scattered output folders at root (`allure-results/`, `allure-report/`, `playwright-report/`, `test-results/`, `report/`, untracked `reports/`, `_to_delete/`) so every generated runtime artifact lives inside a single gitignored `reports/` directory, and separates test CSV inputs (`data/csv/`) from documentation (`docs/`).
  - **Target Files:** `playwright.config.ts`, `src/core/AutoHealer.ts`, `scripts/probe-locators.ts`, `config/probe/*.probe.json`, `scripts/csv-to-json.ts`, `package.json`, `.github/workflows/playwright.yml`, `.gitignore`, `docs/swag-labs-login.csv` -> `data/csv/swag-labs-login.csv`, `docs/booking-app.csv` -> `data/csv/booking-app.csv`
  - **Implementation Notes:**
    1. Configure unified report paths in `playwright.config.ts`: `outputDir: 'reports/test-results'`, HTML reporter `outputFolder: 'reports/playwright-html'`, and Allure reporter `outputFolder: 'reports/allure-results'`.
    2. Update `src/core/AutoHealer.ts` to write `heal-report.json` into `reports/test-results/heal-report.json`.
    3. Update `scripts/probe-locators.ts` default output and all `config/probe/*.probe.json` `"output"` fields to `reports/probe/probe-<name>.txt`.
    4. Update `package.json` Allure scripts (`allure:clean`, `allure:report`, `report`) to use `reports/allure-results` and `reports/allure-html`, add `clean: "npx rimraf reports"`, and update `.github/workflows/playwright.yml` artifact upload path to `reports/playwright-html/`.
    5. Move `docs/swag-labs-login.csv` and `docs/booking-app.csv` into `data/csv/` and update `scripts/csv-to-json.ts` default CSV lookup directory from `../docs` to `../data/csv` (while also accepting an explicit path).
    6. Archive local ignored folders: move `report/fix/*` -> `docs/internal/fix-reports/`, `docs/claude/` -> `docs/internal/claude/`, `docs/REQ_product-sorting-and-detail.md` & `docs/UserStories_Booking_app_v0.1.pdf` -> `docs/internal/specs/`. Remove old `report/`, `allure-results/`, `playwright-report/`, `test-results/`, `_to_delete/`, and stale standalone HTML files in `reports/`.
    7. Simplify `.gitignore`: ignore `reports/`, `docs/internal/`, `plan/`, `.auth/`, `.env`, removing the brittle `docs/*` negation rules.
  - **Verification:** `npm run validate && npm run typecheck && npm run test:framework`

- [x] **[RESTRUCT-03] Standardize configs (`playwright.config.ts`, `package.json`, `.editorconfig`, `.env.example`, CI)** *(Effort: S | Depends on: RESTRUCT-02)*
  - **Why:** Resolves `.editorconfig` (`indent_size = 4`) vs `.prettierrc` (`tabWidth = 2`) conflict, removes dead boilerplate in `playwright.config.ts` and `"main": "index.js"` in `package.json`, aligns browser launch config with CI, and documents all optional environment variables.
  - **Target Files:** `.editorconfig`, `package.json`, `playwright.config.ts`, `.env.example`, `.github/workflows/playwright.yml`
  - **Implementation Notes:**
    1. Set `indent_size = 2` in `.editorconfig:6`.
    2. Clean up `package.json`: remove unused `"main": "index.js"`, add meaningful `"description"`, add `"test:coded": "npx playwright test tests/hybrid-coded/"`, add `"test:saucedemo:json"` (or drop from README), and keep script naming consistent.
    3. Clean up `playwright.config.ts`: remove commented boilerplate (`dotenv`, `webServer`, unused browser projects); default to bundled `chromium` on CI (`process.env.CI`) and allow opting into branded Chrome via `PW_CHANNEL=chrome`; allow `SLOW_MO` and `WORKERS` overrides via env vars.
    4. Update `.github/workflows/playwright.yml:23` to `npx playwright install --with-deps chromium` so CI does not waste time downloading unused Firefox/WebKit binaries.
    5. Update `.env.example` to document optional `PW_CHANNEL`, `SLOW_MO`, `WORKERS`, `CAPTURE_EVIDENCE_ON_PASS`, and `OPENAI_API_KEY`.
  - **Verification:** `npm run typecheck && npm run test:framework`

- [x] **[RESTRUCT-04] Rewrite `README.md` and realign `docs/NEW_USER_GUIDE.md`, `GEMINI.md`, and `.claude/`** *(Effort: M | Depends on: RESTRUCT-03)*
  - **Why:** `README.md` (474 lines) violates the zero-icon policy, has an outdated folder tree and stale CLI commands (`test:saucedemo:json`, `demoqa`), and overlaps with `docs/NEW_USER_GUIDE.md`. `docs/NEW_USER_GUIDE.md` has duplicate `## 9.` headers and wrong `update-locators` docs (`""` vs `"TODO_LOCATOR"`). `.claude/` and `GEMINI.md` must reflect the new `src/`, `data/csv/`, and `reports/` paths.
  - **Target Files:** `README.md`, `docs/NEW_USER_GUIDE.md`, `GEMINI.md`, `.claude/CLAUDE.md`, `.claude/rules/architecture.md`, `.claude/rules/ui-testing.md`, `.claude/rules/api-testing.md`, `.claude/rules/coding-standards.md`, `.claude/skills/extend-action/SKILL.md`, `.claude/skills/fix-locator/SKILL.md`, `.claude/skills/generate-json-test/SKILL.md`, `.claude/skills/map-codegen-locators/SKILL.md`
  - **Implementation Notes:**
    1. Rewrite `README.md` concisely (~180-220 lines), pure ASCII English with zero emojis/icons: Overview & 5-handler Architecture diagram, accurate `src/` + `data/` + `reports/` tree, Quick Start, Action Catalog summary table (preserving the exact format checked by `tests/framework/action-list-single-source.spec.ts`), Authoring Workflows (JSON, CSV, BDD frozen), Suite Tags & `wip` status, Locator Discovery (`probe-locators` vs `codegen`), CLI Reference matching `package.json`, and links to `docs/`.
    2. Fix `docs/NEW_USER_GUIDE.md`: remove emojis, update CSV path (`data/csv/`) and report path (`reports/`), fix `update-locators` to state `"TODO_LOCATOR"`, and fix section numbering (`## 8.`, `## 9.`, `## 10.`).
    3. Update `GEMINI.md` and `.claude/` files (`CLAUDE.md`, rules, skills) to reference `src/core/`, `src/handlers/`, `src/helpers/`, `src/types/`, `data/csv/`, and `reports/`.
  - **Verification:** `npm run actions:check && npm run validate && npm run typecheck && npm run test:framework`

---

### Phase 1: Critical Fixes & Blockers (P0)

- [ ] **[TASK-01] Fix false-positive whitespace stripping in `verify_not_contains_text` and escape Regex assertions** *(Effort: S | Depends on: RESTRUCT-01)*
  - **Why:** In `AssertHelper.verifyNotContainsText` (`src/helpers/AssertHelper.ts`, originally `utils/helpers/AssertHelper.ts:114`), `String(data).replace(/\s+/g, '')` removes all spaces before calling `not.toContainText(expectedString)`, causing multi-word negative assertions to pass unconditionally against spaced DOM text. Additionally, `verifyClassContains`, `verifyNotContainsClass`, `verifyUrlContains`, and `verifyAttribute` construct `new RegExp(String(data))` without escaping regex metacharacters (`?`, `.`, `+`, `(`, `)`, `[`, `]`).
  - **Target Files:** `src/helpers/AssertHelper.ts`, `tests/framework/assertion-presence.spec.ts`
  - **Implementation Notes:**
    1. Remove `.replace(/\s+/g, '')` in `verifyNotContainsText` so `expectedString = String(data)`.
    2. Add a private `escapeRegExp(str: string): string` helper in `AssertHelper.ts` and apply it in `verifyClassContains`, `verifyNotContainsClass`, `verifyUrlContains`, and `verifyAttribute`.
    3. Add offline guard tests in `tests/framework/assertion-presence.spec.ts` proving `verifyNotContainsText` fails when a multi-word string is present, passes when absent, and `verifyUrlContains`/`verifyAttribute` handle `?` and `.` safely.
  - **Verification:** `npm run typecheck && npm run test:framework`

- [ ] **[TASK-02] Unify active `Page` reference across helpers and handlers via `IEngineContext` to fix `switch_new_tab`** *(Effort: M | Depends on: RESTRUCT-01)*
  - **Why:** `ActionEngine` (`src/core/ActionEngine.ts`) passes the initial `page` by value into `ElementHelper`, `AssertHelper`, `NetworkActionHandler`, and `AutoHealer`. `ElementHelper.switchNewTab()` only mutates `this.page` on `ElementHelper`, leaving assertions, screenshots, network mocks, and healing stuck on the old tab. Meanwhile, `IEngineContext` in `src/types/engine.ts` is unused dead code.
  - **Target Files:** `src/types/engine.ts`, `src/helpers/BaseHelper.ts`, `src/helpers/ElementHelper.ts`, `src/handlers/NetworkActionHandler.ts`, `src/core/AutoHealer.ts`, `src/core/ActionEngine.ts`, `tests/framework/multi-tab-context.spec.ts`
  - **Implementation Notes:**
    1. Use a shared mutable page holder / `IEngineContext` so `BaseHelper.page`, `NetworkActionHandler`, and `AutoHealer` read/write the active `Page` from one source of truth.
    2. Update `ElementHelper.switchNewTab()` to write the newly focused `Page` back to the shared context.
    3. Add an offline framework guard test `tests/framework/multi-tab-context.spec.ts` verifying `verify_text` asserts against the newly opened tab after `switch_new_tab`.
  - **Verification:** `npm run typecheck && npm run test:framework`

- [ ] **[TASK-03] Fix JSON injection crash in object variable resolution and resolve tokens in API headers** *(Effort: S | Depends on: RESTRUCT-01)*
  - **Why:** `ActionEngine.executeStep` and `NetworkActionHandler.handle` resolve variables inside objects via `JSON.parse(this.dataManager.resolve(JSON.stringify(step.data)))`, which throws `SyntaxError` whenever a variable contains `"`, `\`, or `\n`. Furthermore, `APIActionHandler` never passes `step.headers` through `DataManager.resolve()`, and `DataManager` generates `{{RANDOM_EMAIL}}` using only `Date.now()`, which can collide within the same millisecond.
  - **Target Files:** `src/core/DataManager.ts`, `src/core/ActionEngine.ts`, `src/handlers/NetworkActionHandler.ts`, `src/handlers/APIActionHandler.ts`, `tests/framework/api-expected-status.spec.ts`
  - **Implementation Notes:**
    1. Upgrade `DataManager.resolve(data: any): any` to recursively traverse arrays and plain objects and resolve string leaves directly.
    2. Remove `JSON.stringify`/`JSON.parse` token resolution from `ActionEngine.ts` and `NetworkActionHandler.ts`.
    3. Append a random alphanumeric suffix to `RANDOM_EMAIL` in `DataManager.ts`.
    4. Resolve `step.headers` via `this.dataManager.resolve(step.headers)` in `APIActionHandler.ts`.
    5. Add unit tests in `tests/framework/api-expected-status.spec.ts` covering quotes/newlines inside object payloads and `{{TOKEN}}` interpolation inside headers.
  - **Verification:** `npm run typecheck && npm run test:framework`

- [ ] **[TASK-04] Align `store_text` runtime handling with validator (`variable`, `storeAs`, and literal `data`)** *(Effort: S | Depends on: RESTRUCT-01)*
  - **Why:** `scripts/validate-scenarios.ts` accepts `step.variable` or `step.storeAs` on `store_text`, and `.claude/skills/generate-json-test/SKILL.md` documents literal assignment (`variable` + `data`, no locator). However, `UIActionHandler.handle` throws if `step.variable` is missing (ignoring `step.storeAs`) and unconditionally calls `this.element.getText(locatorStr)`.
  - **Target Files:** `src/handlers/UIActionHandler.ts`, `scripts/validate-scenarios.ts`, `schema/action-notes.json`, `docs/ACTIONS.md`, `schema/actions.json`
  - **Implementation Notes:**
    1. In `src/handlers/UIActionHandler.ts`, resolve `const targetVar = step.variable || step.storeAs`. Support DOM extraction when `locatorStr` is set, or literal/computed `String(resolvedData)` assignment when `locatorStr` is empty and `resolvedData` is non-empty.
    2. In `scripts/validate-scenarios.ts`, validate that `store_text` has `(step.page && step.element)` or non-empty `step.data`.
    3. Update `schema/action-notes.json` for `store_text` and run `npm run actions:sync`.
  - **Verification:** `npm run actions:check && npm run validate && npm run test:framework`

- [ ] **[TASK-05] Upgrade `csv-to-json.ts` to first-class status and translate sample CSVs to English** *(Effort: M | Depends on: RESTRUCT-02, TASK-04)*
  - **Why:** Per user decision, `csv2json` is a first-class tool. Currently, `scripts/csv-to-json.ts` lacks `# locatorFile:` / `# tags:` / `# status:` header directives, overwrites `storeAs` with `variable`, and `data/csv/swag-labs-login.csv` + `data/csv/booking-app.csv` contain Vietnamese text and wrong page names (`Menu`), breaking `npm run validate` and `english-only.spec.ts` upon recompilation.
  - **Target Files:** `scripts/csv-to-json.ts`, `data/csv/swag-labs-login.csv`, `data/csv/booking-app.csv`, `data/scenarios/swag-labs-login.json`
  - **Implementation Notes:**
    1. Parse leading `#` header directives (`# locatorFile:`, `# tags:`, `# status:`, `# scenario:`) in `scripts/csv-to-json.ts` and validate tags against `/^@[a-z0-9][a-z0-9._-]*$/`.
    2. Fix `variable` vs `storeAs` mapping in `scripts/csv-to-json.ts` so `variable` does not copy into `storeAs`.
    3. Update `data/csv/swag-labs-login.csv` with `# locatorFile: swag-lab.json`, `# tags: @saucedemo`, English `TestName`/`Description`, and `InventoryPage` on teardown rows.
    4. Translate authored `TestName`/`Description` in `data/csv/booking-app.csv` to English and add `# locatorFile: booking-app-regen.json`, `# tags: @booking`, `# status: wip`.
  - **Verification:** `npm run csv2json -- swag-labs-login.csv && npm run validate && npm run test:framework`

- [ ] **[TASK-06] Validate sub-flow steps, locator references, and flow assertion presence** *(Effort: M | Depends on: TASK-04)*
  - **Why:** `scripts/validate-scenarios.ts` does not validate steps inside `data/flows/*.json` (actions, empty data, locator existence against calling suite's `locatorFile`), `scripts/assertion-presence.ts` blindly exempts any test calling `call_flow` even when the flow has zero `verify_*` steps, and `scripts/generate-locator-todo.ts` ignores locators inside called flows.
  - **Target Files:** `scripts/validate-scenarios.ts`, `scripts/assertion-presence.ts`, `scripts/generate-locator-todo.ts`, `tests/framework/assertion-presence.spec.ts`
  - **Implementation Notes:**
    1. Validate every step inside `data/flows/*.json` with the same semantic rules used for scenario steps, and verify all flow `page`/`element` pairs against the calling scenario's `locatorFile`.
    2. Update `scripts/assertion-presence.ts` so `call_flow` only satisfies assertion presence when the resolved flow chain actually contains at least one `verify_*` step.
    3. Update `scripts/generate-locator-todo.ts` to traverse `call_flow` steps when populating `TODO_LOCATOR` entries.
    4. Add unit tests in `tests/framework/assertion-presence.spec.ts` proving an assertion-free flow no longer bypasses the gate.
  - **Verification:** `npm run validate && npm run test:framework`

- [ ] **[TASK-07] Remove `demoqa.com` target suite, locators, npm script, and documentation references** *(Effort: S | Depends on: RESTRUCT-04)*
  - **Why:** Confirmed by user decision ("Remove demoqa.com") and `docs/internal/fix-reports/phase-13b-demoblaze-demoqa.md`: `demoqa.com` hangs `domcontentloaded` past 60s.
  - **Target Files:** `data/scenarios/demoqa-scenarios.json`, `data/locators/demoqa.json`, `package.json`, `README.md`, `.claude/rules/json-scenarios.md`, `.claude/rules/testing.md`, `.github/workflows/playwright.yml`
  - **Implementation Notes:**
    1. Delete `data/scenarios/demoqa-scenarios.json` and `data/locators/demoqa.json`.
    2. Remove `"test:demoqa"` from `package.json`.
    3. Remove `@demoqa` and `test:demoqa` references from `README.md`, `.claude/rules/json-scenarios.md`, `.claude/rules/testing.md`, and `.github/workflows/playwright.yml`.
  - **Verification:** `npm run validate && npm run typecheck && npm run test:framework`

---

### Phase 2: Architecture, Refactoring & Testing (P1)

- [ ] **[TASK-08] Enforce Clean Architecture helper delegation in `NetworkActionHandler` and `UIActionHandler`** *(Effort: M | Depends on: TASK-02)*
  - **Why:** `.claude/rules/architecture.md` mandates that every Playwright `page.*` and filesystem call lives in `src/helpers/`. Currently, `NetworkActionHandler` calls `page.route()`/`page.unroute()` directly, and `UIActionHandler` calls `fs.mkdirSync` and `page.context().storageState()` directly.
  - **Target Files:** `src/helpers/ElementHelper.ts`, `src/helpers/NetworkHelper.ts` (new), `src/handlers/UIActionHandler.ts`, `src/handlers/NetworkActionHandler.ts`, `src/core/ActionEngine.ts`, `tests/framework/mock-route-status.spec.ts`
  - **Implementation Notes:**
    1. Move `saveStorageState(filePath: string)` into `src/helpers/ElementHelper.ts`.
    2. Extract `src/helpers/NetworkHelper.ts` (extending `BaseHelper`) to own `mockRoute`/`unmockRoute`, and inject it into `NetworkActionHandler`.
    3. Update `ActionEngine.ts` and `tests/framework/mock-route-status.spec.ts`.
  - **Verification:** `npm run typecheck && npm run test:framework`

- [ ] **[TASK-09] Support nested JSON path extraction in `store_response` and response capture on `api_delete`** *(Effort: S | Depends on: TASK-03)*
  - **Why:** `APIActionHandler` reads only top-level keys (`postRes[key]`), does not stringify primitive values before saving, duplicates extraction across 4 branches, and ignores `store_response` on `api_delete`.
  - **Target Files:** `src/helpers/APIHelper.ts`, `src/handlers/APIActionHandler.ts`, `schema/action-notes.json`, `docs/ACTIONS.md`, `schema/actions.json`, `tests/framework/api-expected-status.spec.ts`
  - **Implementation Notes:**
    1. Update `APIHelper.delete()` to parse and return `responseBody` and attach evidence via `this.attach('DELETE', ...)`.
    2. Extract a dot-notation path resolver helper in `APIActionHandler` and apply it to all 5 API verbs.
    3. Update `schema/action-notes.json`, run `npm run actions:sync`, and add nested `store_response` tests.
  - **Verification:** `npm run actions:check && npm run validate && npm run test:framework`

- [ ] **[TASK-10] Add native browser dialog handling action (`handle_dialog`) for JS `alert`/`confirm`/`prompt`** *(Effort: M | Depends on: TASK-08)*
  - **Why:** Demoblaze reports `register()` and `addToCart()` results via native JS `alert()`, and the framework has no action to assert or capture dialog messages.
  - **Target Files:** `src/helpers/ElementHelper.ts`, `src/handlers/UIActionHandler.ts`, `schema/action-notes.json`, `schema/scenario-schema.json`, `docs/ACTIONS.md`, `schema/actions.json`, `src/types/actions.generated.ts`, `README.md`, `.claude/CLAUDE.md`, `.claude/rules/bdd.md`, `.claude/skills/write-bdd-feature/SKILL.md`, `scripts/compile-bdd.ts`, `tests/framework/action-list-single-source.spec.ts`
  - **Implementation Notes:**
    1. Implement dialog listener/assertion helper in `src/helpers/ElementHelper.ts` and wire it in `src/handlers/UIActionHandler.ts`.
    2. Document in `schema/action-notes.json`, run `npm run actions:sync`, and update documented prose action counts across README and `.claude/`.
    3. Add offline guard tests in `tests/framework/` exercising `window.alert`.
  - **Verification:** `npm run actions:check && npm run validate && npm run test:framework`

- [ ] **[TASK-11] Resolve remaining 10 `TODO_LOCATOR` stubs and 2 expected copy strings in `booking-app-regen.json` and retire `_baseline/`** *(Effort: M | Depends on: TASK-06)*
  - **Why:** `data/scenarios/booking-app-regen.json` is stuck in `"status": "wip"` (`test.fixme`) due to 10 `TODO_LOCATOR` entries in `data/locators/booking-app-regen.json` and 2 `TODO_EXPECTED_COPY_*` strings. Legacy `_baseline/` files also remain tracked in `data/`.
  - **Target Files:** `config/probe/booking-slots.probe.json`, `data/locators/booking-app-regen.json`, `data/scenarios/booking-app-regen.json`, `data/scenarios/_baseline/booking-app.json`, `data/locators/_baseline/booking-app.json`
  - **Implementation Notes:**
    1. Probe the live booking app via `npm run probe-locators -- config/probe/booking-slots.probe.json` to resolve the 10 selectors and 2 Vietnamese copy strings.
    2. Flip `config.status` from `"wip"` to `"ready"` and delete `data/scenarios/_baseline/booking-app.json` and `data/locators/_baseline/booking-app.json`.
  - **Verification:** `npm run validate && npm run test:framework`

---

### Phase 3: Enhancements, DX & Nice-to-Have (P2)

- [ ] **[TASK-12] Make `PASS` screenshot evidence configurable and mask sensitive data in `APIHelper` and `AutoHealer`** *(Effort: S | Depends on: RESTRUCT-01)*
  - **Why:** Taking full PNG screenshots on every passing assertion adds execution overhead; `APIHelper.attach` logs unmasked credentials/tokens; `AutoHealer` sends raw `<input value="...">` attributes to OpenAI and triggers on assertion value timeouts.
  - **Target Files:** `src/helpers/BaseHelper.ts`, `src/helpers/APIHelper.ts`, `src/core/AutoHealer.ts`, `src/core/ActionEngine.ts`
  - **Implementation Notes:**
    1. Respect `process.env.CAPTURE_EVIDENCE_ON_PASS === 'false'` in `BaseHelper.captureEvidence` (keep `'FAIL'` always on).
    2. Mask sensitive keys (`/password|passwd|pwd|token|secret|authorization/i`) in `APIHelper.attach()`.
    3. Scrub `value="[^"]*"` in `AutoHealer` DOM snapshots and prevent `ActionEngine` from invoking `AutoHealer` on `verify_*` assertion steps.
  - **Verification:** `npm run typecheck && npm run test:framework`

- [ ] **[TASK-13] Build Offline Hostile-DOM Fixture & Verified Locator Engine (`src/dom/`)** *(Effort: L | Depends on: TASK-12)*
  - **Why:** `AutoHealer` currently truncates raw `document.body.innerHTML` at 8,000 characters and asks an LLM for an unverified selector. Implementing `plan/inspect-element/` under `src/dom/` replaces raw HTML guessing with strict-mode verified candidate ranking.
  - **Target Files:** `src/dom/index.ts`, `tests/fixtures/hostile-page/`, `scripts/inspect-page.ts`, `src/core/AutoHealer.ts`
  - **Implementation Notes:**
    1. Build the offline hostile-DOM fixture and one-way-dependency `src/dom/` locator engine per `plan/inspect-element/TASKS.md` (adapted from `utils/dom/` to `src/dom/`).
    2. Rewire `src/core/AutoHealer.ts` to select from verified unique candidates.
  - **Verification:** `npm run typecheck && npm run test:framework`

---

## 3. Open Questions / Decisions Needed

### Confirmed Decisions (Locked in by User)
1. **Restructuring Scope:** **Option B** - Consolidate `utils/` and `types/` into `src/` (`src/core`, `src/handlers`, `src/helpers`, `src/types`), move CSV inputs to `data/csv/`, unify all test/probe outputs under `reports/`, archive `report/fix/` and internal notes under `docs/internal/`, standardize configs, and rewrite `README.md`.
2. **Execution Order:** Execute **Phase 0 (Restructuring: `RESTRUCT-01` -> `RESTRUCT-04`)** first, then proceed one by one through **Phase 1 (P0: `TASK-01` -> `TASK-07`)**.
3. **Target Site `demoqa.com`:** Remove completely (`TASK-07`).
4. **CSV Transpiler (`csv2json`):** Maintain as a first-class compiler (`TASK-05` with `# tags:` / `# locatorFile:` directives and English sample CSVs).

### Remaining Open Questions for Later Phases (P1)
1. **Booking App Baseline Cleanup (`TASK-11`):** Once `data/scenarios/booking-app-regen.json` is `"ready"`, delete `data/*/_baseline/booking-app.json` permanently or move to `docs/internal/`?
2. **Native Browser Dialog Action Contract (`TASK-10`):** Prefer a declarative pre-arming step (e.g., `handle_dialog` placed right before the `click` that opens the alert) or an inline property on `click`?
