# Playwright Hybrid Keyword-Driven Automation Framework

A TypeScript + Playwright hybrid test automation framework using the Strategy Pattern to run declarative JSON scenarios, reusable sub-flows, CSV test suites, legacy BDD `.feature` files, and coded Playwright specs against a single centralized locator store.

## Architecture Overview

```text
  Test Definitions (data/scenarios/*.json, data/flows/*.json, data/csv/*.csv)
                               |
                               v
         tests/hybrid-json/keyword-runner.spec.ts
             (Dynamic Playwright Test Generator)
                               |
                               v
                  src/core/ActionEngine.ts
        (Orchestration, DataManager, LocatorManager, FlowManager)
                               |
     +------------+------------+------------+------------+
     v            v            v            v            v
UIAction      AssertAction  APIAction   NetworkAction FlowAction
Handler       Handler       Handler     Handler       Handler
(19)          (16)          (5)         (2)           (1)
     |            |            |            |            |
     +------------+------------+------------+------------+
                               |
                               v
             src/helpers/ (Element, Assert, API, Base)
                               |
                               v
              Playwright -> reports/ (HTML & Allure)
```

Clean architecture rule: `src/core/` and `src/handlers/` dispatch and orchestrate; Playwright `page.*` / `request.*` calls live in `src/helpers/`.

## Project Structure

```text
swag-labs-hybrid/
|-- src/
|   |-- core/                   # ActionEngine, DataManager, LocatorManager, FlowManager, SuiteStatus, AutoHealer
|   |-- handlers/               # 5 strategy handlers (authoritative source of all 43 action keywords)
|   |-- helpers/                # BaseHelper, ElementHelper, AssertHelper, APIHelper
|   `-- types/                  # scenario.ts, engine.ts, actions.generated.ts
|-- data/
|   |-- scenarios/              # Declarative JSON test suites (IScenario)
|   |-- locators/               # Centralized Page -> Element CSS/XPath maps
|   |-- flows/                  # Reusable parameterized sub-flows invoked by call_flow
|   |-- csv/                    # CSV spreadsheet test sources compiled by csv2json
|   `-- features/               # Legacy Gherkin .feature files (frozen at 6 step patterns)
|-- tests/
|   |-- hybrid-json/            # Dynamic keyword runner (keyword-runner.spec.ts)
|   |-- hybrid-coded/           # Hand-written Playwright specs reusing data/locators/
|   `-- framework/              # Offline invariant and contract guard suites (no network)
|-- scripts/                    # Validation, action sync, locator probe/stub, CSV/BDD compilers
|-- schema/                     # scenario-schema.json, actions.json (generated), action-notes.json
|-- config/probe/               # Site-agnostic DOM probe configs for scripts/probe-locators.ts
|-- docs/                       # ACTIONS.md (generated) and NEW_USER_GUIDE.md
`-- reports/                    # Unified gitignored output (playwright-html, allure-results, allure-html, test-results, probe)
```

## Quick Start

Requirements: Node.js v18+.

```bash
npm install
npx playwright install chromium

# Static CI gates (action sync, scenario/locator validation, typecheck, offline guards)
npm run validate
npm run typecheck
npm run test:framework

# Run the fast CI smoke suite
npm run test:ci
```

Environment configuration is optional. Copy `.env.example` to `.env` only if you want to override `PW_CHANNEL`, `SLOW_MO`, `WORKERS`, `CAPTURE_EVIDENCE_ON_PASS`, or opt in to AI locator healing (`OPENAI_API_KEY`).

## Action Keyword Catalog

The complete, generated catalog of all 43 action keywords lives in [docs/ACTIONS.md](docs/ACTIONS.md). It is generated from `src/handlers/*.ts` and `schema/action-notes.json` via `npm run actions:sync`, and `npm run validate` fails if generated artifacts are stale.

| Category | Handler | Count | Responsibility |
|---|---|---|---|
| UI | `UIActionHandler` | 19 | Navigation, clicks, typing, selects, tabs, waits, storage state |
| Assertion | `AssertActionHandler` | 16 | Visibility, text, value, attributes, classes, counts, URLs, snapshots |
| API | `APIActionHandler` | 5 | `api_get`, `api_post`, `api_put`, `api_patch`, `api_delete` with `expected_status` |
| Network | `NetworkActionHandler` | 2 | Route interception (`mock_route`, `unmock_route`) |
| Flow | `FlowActionHandler` | 1 | Parameterized reusable step sequences (`call_flow`, max depth 10) |

## Authoring Workflows

- **JSON Scenarios (Primary):** Author suites under `data/scenarios/*.json` with `"$schema": "../../schema/scenario-schema.json"` for IDE autocomplete. Each test supports `preconditions`, `steps`, `postconditions`, `dataTable` (DDT), and dynamic tokens (`{{TIMESTAMP}}`, `{{RANDOM_EMAIL}}`, `{{RANDOM_STRING}}`, `{{RANDOM_PHONE}}`, `{{UUID}}`, `{{DATE_TODAY}}`, `{{RANDOM_NUMBER}}`).
- **CSV Spreadsheets:** Author tabular test cases in `data/csv/<suite>.csv` and compile them into `data/scenarios/<suite>.json` via `npm run csv2json -- <suite>.csv`.
- **BDD Gherkin (Frozen):** Legacy `.feature` files in `data/features/` compile via `npm run compile-bdd`. The compiler is intentionally frozen at 6 basic step patterns; author new tests in JSON or CSV.
- **Coded Specs:** Complex business logic or arithmetic assertions live in `tests/hybrid-coded/` and still import selectors from `data/locators/`.

## Suite Tags & Work-in-Progress Status

Suites declare tags in `config.tags` (e.g., `["@saucedemo", "@ci"]`) and optional per-case `tags` so Playwright `--grep` can target subsets cleanly.

Suites with unresolved `"TODO_LOCATOR"` entries block `npm run validate` by default. Set `"status": "wip"` in `config` while locator discovery is in progress:
- `npm run validate` reports unresolved stubs as non-blocking warnings for `wip` suites.
- `keyword-runner.spec.ts` tags `wip` tests with `@wip` and registers them via `test.fixme()`.
- Flip `"status"` back to `"ready"` once all stubs are resolved.

## Locator Discovery

Selectors are never hardcoded inside scenario steps; steps reference `page` (PascalCase) and `element` (camelCase) from `data/locators/*.json`. `LocatorManager` passes selectors verbatim without implicit `>> nth=0` so Playwright strict mode catches ambiguous selectors.

1. Generate missing locator stubs as `"TODO_LOCATOR"`:
   ```bash
   npm run update-locators -- my-scenario.json
   ```
2. Discover verified selectors:
   - Use `npm run probe-locators -- config/probe/<app>.probe.json` to dump live DOM attributes and strict-mode ambiguity warnings into `reports/probe/`.
   - Or run `npx playwright codegen <url>` for interactive flow recording.
3. Optional runtime healing (`AutoHealer`) is disabled by default (`config.enableAutoHealing: true` + `OPENAI_API_KEY`) and writes proposals only to `reports/test-results/heal-report.json` without mutating `data/locators/`.

## CLI Reference

| Command | Description |
|---|---|
| `npm run validate` | Runs `actions:check` and validates all scenarios, flows, assertions, and locators |
| `npm run validate:wip` | Runs validation with `TODO_LOCATOR` downgraded to warnings (`--allow-todo`) |
| `npm run actions:sync` | Regenerates `schema/actions.json`, `docs/ACTIONS.md`, schema enum, and `ActionType` |
| `npm run actions:check` | Fails if generated action artifacts are out of sync with `src/handlers/*.ts` |
| `npm run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run test:framework` | Runs fast, offline framework contract guard tests in `tests/framework/` |
| `npm run test:ci` | Runs the `@ci` smoke subset across `tests/hybrid-json/` |
| `npm test` | Cleans Allure results and executes all JSON scenarios in `tests/hybrid-json/` |
| `npm run test:coded` | Runs traditional coded specs in `tests/hybrid-coded/` |
| `npm run test:saucedemo` | Runs scenarios tagged `@saucedemo` |
| `npm run test:demoblaze` | Runs scenarios tagged `@demoblaze` |
| `npm run test:booking` | Runs scenarios tagged `@booking` |
| `npm run test-ui` | Launches Playwright interactive UI mode |
| `npm run csv2json -- <file.csv>` | Compiles `data/csv/<file.csv>` into `data/scenarios/<file.json>` |
| `npm run compile-bdd` | Compiles `data/features/*.feature` into `data/scenarios/*-generated.json` |
| `npm run update-locators -- <file.json>` | Populates missing locator keys as `"TODO_LOCATOR"` |
| `npm run probe-locators -- <config.json>` | Dumps live DOM attributes from `config/probe/*.probe.json` to `reports/probe/` |
| `npm run report` | Generates and opens the Allure HTML report from `reports/allure-results` |
| `npm run allure:report` | Serves Allure results directly from `reports/allure-results` |
| `npm run clean` | Removes the entire `reports/` directory |

## Documentation

- [docs/ACTIONS.md](docs/ACTIONS.md) - Generated reference for all 43 action keywords.
- [docs/NEW_USER_GUIDE.md](docs/NEW_USER_GUIDE.md) - Step-by-step onboarding guide for QA engineers and contributors.
