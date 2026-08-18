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
npx playwright test <path-to-scenario-file>      # run one file
npx playwright test --ui                         # UI mode
npx playwright show-report                       # HTML report
npx playwright codegen <url>                     # resolve TODO_LOCATOR stubs
```

## Core rules (full detail in `.claude/rules/`)

- **English only** in code, identifiers, comments — no exceptions.
- **Zero icon policy** — no emojis/symbols in code, config, JSON, or terminal output.
- **Clean Architecture** — `utils/core/` never calls Playwright/HTTP directly; always delegate to `utils/helpers/`.
- **Locators are centralized** — never hardcode a CSS/XPath selector inside a scenario step; reference via `page`/`element` fields.
- **Scenario JSON must validate** against `schema/scenario-schema.json` before being considered done.

## Naming conventions

- Locator keys: `page` PascalCase (`LoginPage`), `element` camelCase (`emailInput`).
- Test IDs: `TC_[FEATURE]_[NN]` (e.g. `TC_LOGIN_01`), sequential per feature file.
- Unresolved locators: `"TODO_LOCATOR"` placeholder, never a fabricated selector.

## Where to look next

- `.claude/rules/` — topic-specific conventions, some path-scoped (only load when relevant files are touched)
- `.claude/skills/` — step-by-step playbooks for test generation, BDD, locator fixes, action extension, codegen mapping
- `.claude/commands/` — task-specific slash commands (`/plan`, `/implement`, `/test`, etc.)

## Open items

- `.claude/rules/bdd.md` assumes `.feature` files live in `data/features/` — confirm this against the actual repo before trusting it; the originally documented directory tree didn't show this folder.
- Auto-Healing (`utils/core/AutoHealer.ts`) can silently pass a test whose locator broke for a real reason. Treat any heal event on a `critical`-tagged test as something to review, not just log.
