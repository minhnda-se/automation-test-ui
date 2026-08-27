# Playwright Hybrid Keyword-Driven Automation Framework ⚡

An enterprise-grade, clean-architecture automation testing framework powered by **Playwright** and **TypeScript**. 

Designed for scalability and collaboration, this framework bridges the gap between **technical SDETs**, **manual QA engineers**, and **business stakeholders** by enabling robust end-to-end testing through **Low-Code JSON Scenarios**, **BDD Gherkin**, **CSV Spreadsheets**, and **Traditional Coded Playwright Specs**.

---

## 🌟 Key Highlights

- 🧩 **Zero-Code & Low-Code Scripting**: Write full UI and API automated test suites entirely in structured JSON.
- 📐 **Clean Architecture (Strategy Pattern)**: Handlers for UI, API, and Assertions are completely decoupled for high maintainability.
- 🔄 **Hybrid UI & API Workflows**: Set up test entities instantly via API calls in `preconditions`, test the UI in `steps`, and tear down via API in `postconditions`.
- 📊 **Data-Driven Testing (DDT)**: Run tests against parameterized datasets with dynamic variable interpolation (`{{TIMESTAMP}}`, `{{RANDOM_EMAIL}}`, `{{UUID}}`, etc.).
- 🥒 **BDD Gherkin & CSV Transpilers**: Write tests in standard Gherkin `.feature` syntax or tabular CSVs and transpile them directly into executable JSON.
- 📸 **Automatic Evidence Capture**: Automatic full-page screenshot attachments for every assertion (PASS / FAIL) and network trace logging.
- 📑 **Comprehensive Reporting**: Dual reporting support with Playwright HTML Reporter and **Allure Reports**.
- 🤖 **Optional AI Assist**: Everything above runs with no AI service and no API key. Two opt-in extras exist - runtime locator healing (off by default) and the assistant configuration in `.claude/` - and the framework is fully functional without either.

---

## 🚀 Quick Navigation

- [Architecture Overview](#-architecture-overview)
- [Folder Structure](#-folder-structure)
- [Action & Assertion Catalog](#-action--assertion-catalog)
- [Data & State Management](#-data--state-management)
- [Optional AI Assist](#-optional-ai-assist)
- [BDD & CSV Compilers](#-bdd--csv-compilers)
- [Getting Started](#-getting-started)
- [CLI Reference](#-cli-reference)
- [Guides & Documentation](#-guides--documentation)

---

## 🏗 Architecture Overview

```
                        ┌──────────────────────────────┐
                        │   Test Definitions (Input)   │
                        │  - JSON Scenarios            │
                        │  - BDD Features (.feature)   │
                        │  - CSV Spreadsheets          │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │     keyword-runner.spec      │
                        │   (Dynamic Test Generator)   │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │         ActionEngine         │
                        │  (Orchestrator & Dispatcher) │
                        └──────┬───────────────┬───────┘
                               │               │
            ┌──────────────────┴───┐       ┌───┴──────────────────┐
            ▼                      ▼       ▼                      ▼
┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│   UIActionHandler    │ │AssertActionHandler│ │ APIActionHandler │ │    AutoHealer     │
│ (Clicks, Forms, Tabs)│ │ (Verifications)   │ │  (REST requests) │ │ (optional, off)   │
└──────────┬───────────┘ └─────────┬─────────┘ └────────┬─────────┘ └─────────┬─────────┘
           │                       │                    │                     │
           └───────────────────────┼────────────────────┴─────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────────┐
                        │ Playwright / Browser Engine  │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │    Allure & HTML Reports     │
                        └──────────────────────────────┘
```

---

## 📁 Folder Structure

```text
swag-labs-hybrid/
├── data/
│   ├── features/               # BDD Gherkin .feature files
│   ├── locators/               # Centralized JSON Page Object locator maps
│   └── scenarios/              # JSON test scenario suites
├── docs/                       # CSV test templates and User Guides
│   ├── NEW_USER_GUIDE.md       # Onboarding guide for new team members
│   └── swag-labs-login.csv     # Example CSV scenario
├── schema/
│   └── scenario-schema.json    # JSON Schema definition for IDE autocomplete
├── scripts/
│   ├── compile-bdd.ts          # BDD .feature -> JSON scenario compiler
│   ├── csv-to-json.ts          # CSV -> JSON scenario compiler
│   ├── generate-locator-todo.ts# Auto-populates missing locator keys
│   └── validate-scenarios.ts   # Scenario syntax & locator validator
├── tests/
│   ├── hybrid-coded/           # Traditional code-based Playwright spec files
│   └── hybrid-json/            # Dynamic keyword runner executing all JSON tests
├── types/
│   ├── engine.ts               # Handler and Engine interfaces
│   └── scenario.ts             # Domain models (IStep, ITestCase, IScenario)
└── utils/
    ├── core/                   # ActionEngine, DataManager, LocatorManager, AutoHealer
    ├── handlers/               # UIActionHandler, AssertActionHandler, APIActionHandler
    └── helpers/                # ElementHelper, AssertHelper, APIHelper, BaseHelper
```

---

## 🕹 Action & Assertion Catalog

**The complete, always-current catalog lives in [`docs/ACTIONS.md`](docs/ACTIONS.md)** - every keyword with its required fields and behaviour notes.

That file is generated from `utils/handlers/*.ts` by `npm run actions:sync`, and `npm run validate` fails if it is stale, so it cannot drift from the engine. This README deliberately does not duplicate it: the table that used to sit here had fallen out of step with the code.

Actions can be declared in the `preconditions`, `steps`, or `postconditions` array of any test case.

| Category | Handler | Count |
| :--- | :--- | :--- |
| UI interactions | `UIActionHandler` | 18 |
| Assertions | `AssertActionHandler` | 14 |
| API requests | `APIActionHandler` | 5 |
| Network mocking | `NetworkActionHandler` | 2 |
| Sub-flows | `FlowActionHandler` | 1 |

```
npm run actions:sync     # regenerate docs/ACTIONS.md after adding an action
npm run actions:check    # fail if the reference is stale
```

---

## 🗃 Data & State Management

### 1. Dynamic Generator Tokens
Easily generate randomized test data by embedding tokens in `"data"` or `"url"`:
- `{{TIMESTAMP}}`: Unix millisecond timestamp.
- `{{RANDOM_EMAIL}}`: Unique email (`qa_<timestamp>@test.com`).
- `{{RANDOM_STRING}}`: Random 6-character uppercase string.
- `{{RANDOM_PHONE}}`: 10-digit phone number.
- `{{UUID}}`: Standard v4 UUID string.
- `{{DATE_TODAY}}`: Current date in `YYYY-MM-DD` format.
- `{{RANDOM_NUMBER}}`: Random 4-digit number.

### 2. Runtime State Sharing
Extract values dynamically and reuse them in downstream steps:
```json
{
  "action": "store_text",
  "page": "OrderSummaryPage",
  "element": "orderIdLabel",
  "variable": "SAVED_ORDER_ID"
},
{
  "action": "fill",
  "page": "SearchPage",
  "element": "searchInput",
  "data": "{{SAVED_ORDER_ID}}"
}
```

### 3. Data-Driven Testing (DDT)
Parameterize test cases with a `dataTable` array:
```json
{
  "testId": "DDT_AUTH",
  "testName": "Login with various user roles",
  "dataTable": [
    { "user": "standard_user", "pass": "secret_sauce", "expected": "Products" },
    { "user": "problem_user", "pass": "secret_sauce", "expected": "Products" }
  ],
  "steps": [
    { "action": "goto", "data": "https://www.saucedemo.com/" },
    { "action": "fill", "page": "LoginPage", "element": "usernameInput", "data": "{{user}}" },
    { "action": "fill", "page": "LoginPage", "element": "passwordInput", "data": "{{pass}}" },
    { "action": "click", "page": "LoginPage", "element": "loginBtn" },
    { "action": "verify_text", "page": "InventoryPage", "element": "title", "data": "{{expected}}" }
  ]
}
```

---

## 🤖 Optional AI Assist

This framework runs entirely locally. No part of authoring, validating, or executing tests requires an AI service or an API key. Two optional extras are available on top.

### 1. Runtime locator healing - opt-in, off by default

When a locator times out and healing is enabled, `AutoHealer` takes a sanitized DOM snapshot, asks an AI service for a more resilient selector, and retries the step once with it.

**The proposal is never written back to `data/locators/`.** A heal applies to the current run only and is recorded in `test-results/heal-report.json` for review. This is deliberate: a healed locator that silently overwrote the source file could turn a genuine regression into a passing test.

Enable it per scenario file, and set a key:

```json
{ "config": { "locatorFile": "swag-lab.json", "enableAutoHealing": true } }
```

```env
OPENAI_API_KEY=sk-proj-...
```

With no key set, healing is skipped with a warning and the test fails normally. Treat a heal entry as a signal to investigate, not as a fix - the healer cannot tell a dead selector from a timing issue from a real behaviour change.

### 2. AI assistant configuration - `.claude/`

`.claude/` holds project rules and task playbooks for Claude: generating scenarios from requirement documents, mapping manual test cases, resolving locators from a Codegen recording, diagnosing broken selectors.

It is entirely optional. No script, test, or CI step reads from it - the framework's own inputs live in `schema/` and `docs/`. Deleting `.claude/` costs you the assistant workflows and nothing else.

---

## 🥒 BDD & CSV Compilers

### BDD Gherkin Support (frozen)

> **The BDD compiler is frozen at six step patterns**, against the framework's 40 action keywords. It has no `Background`, `Scenario Outline` / `Examples`, preconditions, postconditions, `dataTable`, or `call_flow`. Suite tags and the locator file are set by the `# tags:` and `# locatorFile:` header directives. It is kept for the existing `.feature` files. **JSON scenarios are the primary input** and support everything; reach for BDD only when someone outside the QA team actually reads these files *and* the whole scenario fits the six patterns.

Supported steps, in full:

| Gherkin step | Action |
| :--- | :--- |
| `I go to "<url>"` | `goto` |
| `I click "<element>" on "<Page>"` | `click` |
| `I fill "<value>" into "<element>" on "<Page>"` | `fill` |
| `I verify "<element>" is visible on "<Page>"` | `verify_visible` |
| `I verify "<element>" on "<Page>" has text "<value>"` | `verify_text` |
| `I save text from "<element>" on "<Page>" as "<VARIABLE>"` | `store_text` |

```gherkin
Feature: User login

Scenario: Successful login with a standard account
  Given I go to "https://www.saucedemo.com/"
  When I fill "standard_user" into "usernameInput" on "LoginPage"
  And I click "loginBtn" on "LoginPage"
  Then I verify "cartIcon" is visible on "InventoryPage"
```

Compile to JSON:
```bash
npm run compile-bdd
```

Output lands in `data/scenarios/<name>-generated.json` with deterministic test ids (`BDD_<FEATURE>_<NN>`), so recompiling produces no diff unless the feature changed. Any unsupported step fails the build with the full list of supported patterns. Never hand-edit a `-generated.json` file.

### CSV Scenario Support
Maintain test cases in Excel / Google Sheets and export as CSV in `docs/`:
```bash
npm run csv2json -- swag-labs-login.csv
```

---

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

No API key or AI service is required. `.env` is only needed for the optional locator healing described above:

```bash
cp .env.example .env      # optional
```

### 2. Validate Scenarios & Locators
```bash
npm run validate          # strict: fails on unresolved TODO_LOCATOR stubs
npm run validate:wip      # same checks, stubs downgraded to warnings
```

### 3. Run Tests
```bash
# Run all keyword JSON tests (all four target sites)
npm test

# Run only the CI-stable subset
npm run test:ci

# Run one target application
npm run test:saucedemo
npm run test:demoblaze
npm run test:demoqa
npm run test:booking

# Run interactive visual UI mode
npm run test-ui

# Run coded test specs
npx playwright test tests/hybrid-coded/
```

#### Suite tags

Every test case in this repository targets one of four third-party demo sites.
A suite declares which one with `config.tags`, and each tag is appended to the
generated test title so Playwright's `--grep` can select it:

```json
{
  "config": { "locatorFile": "swag-lab.json", "tags": ["@saucedemo", "@ci"] },
  "scenario": "Swag Labs E2E Test Scenarios"
}
```

produces test titles like `[TC_01] Valid login @saucedemo @ci`.

| Tag | Meaning |
|---|---|
| `@saucedemo` `@demoblaze` `@demoqa` `@booking` | Target application. Exactly one per test case. |
| `@ci` | Runs on every pull request. A hand-picked **8-test smoke set**, tagged per test case, not per suite. |

`@ci` is deliberately narrow, and narrower than it first looks. A red build that
means "somebody else's website was slow" trains a team to click through the gate,
which is exactly what the gate exists to prevent.

Two separate things cause that, and both are handled here:

1. **Which sites.** Only SauceDemo, the most stable of the four. The booking app
   is excluded permanently - it is the least stable target and its value is as a
   demonstration, not a gate.
2. **How much traffic.** SauceDemo rate-limits. Measured across five runs of the
   42 `@saucedemo` tests: 6 to 12 `net::ERR_CONNECTION_RESET` failures per run, a
   different set each time, zero assertion failures. `@ci` is therefore an 8-test
   smoke set covering login (positive and negative), inventory, cart, checkout
   validation, checkout end to end, sorting, and the product detail page - one
   test per critical path, roughly a quarter of the request volume.

Add `@ci` to a test case only on the evidence of a green run, and prefer replacing
a smoke test with a better one over growing the set. See
`report/fix/phase-9-ci-trustworthy.md` and `report/fix/phase-10a-pilot-saucedemo.md`.

Tags are optional and additive - a file without them still validates and still
runs under `npm test`. A test case may add its own `tags` array, which is merged
with the suite's.

#### Suite status - work in progress

A generated suite arrives with `TODO_LOCATOR` stubs and stays unrunnable until
someone resolves them at a browser. `npm run validate` fails on an unresolved
stub, which is correct for a finished suite and wrong for one mid-handoff: it
puts an unfinished data file in the way of every unrelated change.

`config.status` gives that suite somewhere to sit:

```json
{
  "config": { "locatorFile": "booking-app-regen.json", "tags": ["@booking"], "status": "wip" },
  "scenario": "Booking app - regenerated from the user stories"
}
```

| Status | Effect |
|---|---|
| `ready` (default) | Every locator must be resolved or `npm run validate` fails. Applies to any suite without the field, so nothing changed for existing files. |
| `wip` | Unresolved `TODO_LOCATOR` stubs are reported as outstanding work instead of errors. The runner appends `@wip` to the suite's test titles and marks them `fixme`, so they appear in the report as unfinished rather than vanishing. |

What `wip` does **not** exempt: unknown actions, malformed tags, a missing
locator file, and a `page`/`element` pair with no entry at all. Those are
authoring mistakes rather than pending codegen work - the generator writes a
`TODO_LOCATOR` entry for every locator a step references, so an absent one means
the scenario and its locator file disagree. Only the sentinel is waiting on a
human.

An unrecognised value - `"WIP"`, `"draft"`, `true` - is a validation error and
resolves to `ready`, never to `wip`. A typo must not silently exempt a suite from
the gate.

Set the status back to `ready` once the stubs are resolved. The validator names
every wip suite in its summary on every run, so the state is visible rather than
quietly permanent. Guarded by `tests/framework/wip-suite-status.spec.ts`.

### 4. View Test Reports
```bash
# Generate and open Allure report
npm run report
```

---

## Resolving Locators - probe or codegen

`npm run validate` fails on any `TODO_LOCATOR` stub, so every generated scenario
ends with a locator pass. There are two tools for it, and they are good at
different things.

### `npm run probe-locators -- <config.json>`

Drives a headless browser through a list of application states declared in a
config file and dumps, for every state, each candidate element with **all of its
attributes**. Output goes to stdout and to the config's `output` path.

Reach for it when you are resolving many locators at once, or when you need to
know how the application behaves before writing assertions.

- Locator files here hold **plain selector strings**. A raw attribute dump maps
  onto them directly; codegen's `getByRole(...)` chains need lossy conversion.
- It shows **every candidate at once**, which is how colliding attributes get
  caught. On SauceDemo, `data-test="inventory-item-name"` appears on both the
  list and the detail page - visible immediately in a full dump, easy to miss
  one element at a time.
- Each dumped selector is annotated `[ambiguous under strict mode]` when it
  matches more than one element, so ambiguity is caught while writing the
  locator rather than at run time.
- `capture` records named values per state (`text`, `count`, `selectedOption`,
  `options`, `url`), which answers behavioural questions **before** any test is
  written - whether a sort order survives a page visit, whether a list is
  paginated, how many cards render.

Example configs live in `config/probe/`. A config declares `baseUrl`, an optional
`auth` block, and an ordered list of `states`; each state may `navigate`, run
`actions`, `dump` selectors, run the repeated-container `structure` heuristic,
and `capture` values.

```bash
SAUCE_USERNAME=standard_user SAUCE_PASSWORD=secret_sauce   npm run probe-locators -- config/probe/saucedemo.probe.json

BOOKING_PASSWORD='...' npm run probe-locators -- config/probe/booking-app.probe.json
```

Credentials are referenced as `${ENV_VAR}` and read from the environment, never
written into the config file. Values are also resolved through `DataManager`, so
`{{RANDOM_EMAIL}}` and the other generator tokens work exactly as they do in a
scenario - which is how the booking app is probed, since registering an account
is what signs you in. Fill values whose selector looks like a secret are logged
as `***`.

### `npx playwright codegen <url>`

Records a flow interactively and emits a script. Better when you want to explore
an application by hand, confirm that a multi-step flow is even possible, or
capture a sequence you cannot describe up front. See
`.claude/skills/map-codegen-locators/SKILL.md` for mapping its output onto
`TODO_LOCATOR` stubs.

**Rule of thumb:** probe to resolve locators in bulk and to answer questions
about the application; codegen to discover a flow interactively.

---

## ⌨️ CLI Reference

| Command | Description |
| :--- | :--- |
| `npm run validate` | Checks the action reference is current, then validates every scenario and flow: unknown actions, empty assertion data, missing locator entries, unresolved `TODO_LOCATOR` stubs. Exits non-zero on failure. This is the CI gate. |
| `npm run validate:wip` | Same as above, but unresolved `TODO_LOCATOR` stubs are warnings rather than errors. For use during a locator pass; never in CI. |
| `npm run actions:sync` | Regenerates `schema/actions.json` and `docs/ACTIONS.md` from the handler layer. Run after adding or removing an action. |
| `npm run actions:check` | Fails if the generated action reference is stale. Included in `npm run validate`. |
| `npm test` | Cleans previous allure results and executes all JSON keyword scenarios. |
| `npm run test:ci` | Runs the `@ci` smoke set (8 tests). This is what the CI workflow executes. |
| `npm run test:saucedemo:json` | As `test:saucedemo`, but writes a machine-readable run report to `pw-results.json`. For diagnosing failures. |
| `npm run test:saucedemo` | Runs every `@saucedemo`-tagged test case. Same pattern for `test:demoblaze`, `test:demoqa`, `test:booking`. |
| `npm run test-ui` | Opens Playwright's interactive visual UI test runner. |
| `npm run report` | Generates Allure HTML report and launches local browser preview. |
| `npm run allure:report` | Serves live Allure results without generating standalone folder. |
| `npm run compile-bdd` | Transpiles `.feature` files in `data/features/` into JSON scenarios. |
| `npm run csv2json -- <file.csv>` | Transpiles CSV spreadsheets in `docs/` into JSON scenarios. |
| `npm run update-locators -- <file.json>` | Auto-populates skeleton element keys into locator JSON files. |
| `npm run probe-locators -- <config.json>` | Dumps DOM evidence for every candidate element in each state declared by the config, for resolving `TODO_LOCATOR` stubs. See Resolving Locators above. |
| `npm run test:framework` | Runs the offline framework guard tests in `tests/framework/`. No network; gated unconditionally in CI. |

---

## 📚 Guides & Documentation

- [📖 **New User & Onboarding Guide**](docs/NEW_USER_GUIDE.md): Step-by-step onboarding walkthrough for beginners, manual testers, and BAs.
- [📋 **Scenario JSON Schema**](schema/scenario-schema.json): Schema definition enabling auto-completion in VS Code.
- [🕹 **Action Catalog**](docs/ACTIONS.md): Every action keyword with required fields (generated - do not edit by hand).
