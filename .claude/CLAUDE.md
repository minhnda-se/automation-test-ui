# Playwright Hybrid Keyword-Driven Framework

TypeScript core engine; test execution runs off JSON scenario files and Gherkin `.feature` files compiled to JSON. QA/BAs write JSON/Gherkin without touching the TypeScript engine — that separation only holds if `utils/core/` never calls Playwright directly (see `.claude/rules/architecture.md`).

## Directory layout

```
data/locators/      # centralized locator files (page/element -> selector)
data/scenarios/      # JSON test suites, validated against schema/scenario-schema.json
data/features/       # Gherkin .feature files, compiled by scripts/compile-bdd.ts   [confirm path — see Open Items]
tests/hybrid-json/   # Playwright runner that executes JSON scenarios
utils/core/          # ActionEngine, LocatorManager, DataManager, AutoHealer — orchestration only
utils/helpers/       # ElementHelper, AssertHelper, APIHelper, BaseHelper — actual Playwright/API calls
schema/              # scenario-schema.json
scripts/             # compile-bdd.ts
docs/                # requirement/spec documents
```

## Build & test commands

```
npm install
npx playwright install
npx playwright test tests/hybrid-json/          # run all
npm run test:ci                                  # run the @ci smoke set (8 tests; what CI runs)
npm run test:saucedemo                           # run one target app by tag
npx playwright test <path-to-scenario-file>      # run one file
npx playwright test --ui                         # UI mode
npx playwright show-report                       # HTML report
npx playwright codegen <url>                     # resolve TODO_LOCATOR stubs
npm run validate                                 # action reference check + scenario/flow validation
npm run test:framework                           # offline engine guard tests (no network; gated in CI)
npm run actions:sync                             # regenerate action reference after a handler change
```

## Core rules (full detail in `.claude/rules/`)

- **English only** in code, identifiers, comments — no exceptions.
- **Zero icon policy** — no emojis/symbols in code, config, JSON, or terminal output.
- **Clean Architecture** — `utils/core/` never calls Playwright/HTTP directly; always delegate to `utils/helpers/`.
- **Locators are centralized** — never hardcode a CSS/XPath selector inside a scenario step; reference via `page`/`element` fields.
- **Scenario JSON must validate** — run `npm run validate` before considering any scenario file done.
- **Action keywords come from `docs/ACTIONS.md`** — generated from `utils/handlers/*.ts` by `npm run actions:sync`. Never generate an action that is not listed there, and never trust an action table written into a doc or skill.
- **Atomic Steps & Non-Empty Assertions** — All manual steps must be decomposed into atomic actions; `fill`, `verify_text`, `verify_url_contains` must never have empty `data` (see `.claude/rules/step-decomposition.md` and `.claude/skills/map-manual-tc/`).

## Naming conventions

- Locator keys: `page` PascalCase (`LoginPage`), `element` camelCase (`emailInput`).
- Test IDs: `TC_[FEATURE]_[NN]` (e.g. `TC_LOGIN_01`), sequential per feature file.
- Unresolved locators: `"TODO_LOCATOR"` placeholder, never a fabricated selector.

## Where to look next

- `.claude/rules/` — topic-specific conventions, some path-scoped (only load when relevant files are touched)
- `docs/ACTIONS.md` — authoritative action keyword reference (generated, do not edit)
- `schema/actions.json` — same list, machine-readable; consumed by `scripts/validate-scenarios.ts`
- `types/actions.generated.ts` — the `ActionType` union, generated; re-exported by `types/scenario.ts`. The `action` enum in `schema/scenario-schema.json` is generated in place as well. All four artifacts come from `npm run actions:sync`, and `npm run actions:check` fails if any has drifted.
- `schema/action-notes.json` — hand-maintained field descriptions merged into the generated reference
- `.claude/skills/` — step-by-step playbooks for test generation, BDD, locator fixes, action extension, codegen mapping

## BDD status

The Gherkin compiler (`scripts/compile-bdd.ts`) is **frozen** at six step patterns out of 43 actions. JSON scenarios are the primary input. Do not extend the compiler without a scoped decision — see `.claude/rules/bdd.md`.
- `.claude/commands/` — task-specific slash commands (`/plan`, `/implement`, `/test`, etc.)

## Open items

- Auto-Healing is off by default and no longer writes to `data/locators/` (see `report/fix/phase-1-autohealer.md`). It still cannot distinguish a dead selector from a timing issue from a real behaviour change — treat any entry in `test-results/heal-report.json` as something to investigate, not a fix.

Resolved: `.feature` files do live in `data/features/`; the BDD compiler is frozen (`.claude/rules/bdd.md`). CI no longer runs the full suite against four live sites - suites carry target tags and CI runs `npm run test:ci`, the `@ci` (SauceDemo) subset (`report/fix/phase-9-ci-trustworthy.md`). `expected_status` is now asserted by `APIHelper` on all five API actions - exact match when set, `response.ok()` when omitted - and `mock_route` no longer reads it, so the name means one thing (`report/fix/phase-12-expected-status.md`). `LocatorManager` no longer appends `>> nth=0`, so an ambiguous locator fails under strict mode (`report/fix/phase-13a-locator-strictness.md`). Adding an action now means editing the handler and `schema/action-notes.json` only - the schema enum and the `ActionType` union are generated and checked (`report/fix/phase-11-action-list-single-source.md`).
