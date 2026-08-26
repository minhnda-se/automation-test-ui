---
name: generate-json-test
description: Generate Playwright Hybrid Keyword-Driven Framework test artifacts (scenario JSON files and locator files) from requirement or specification documents. Use whenever the user asks to create test cases, generate test scenarios, write locators, or produce a "[feature]-scenarios.json" file from a requirements doc, PRD, user story, spec sheet, or Jira ticket — even if they don't use the word "automation" or name the framework explicitly.
---

# Generate JSON Test Scenarios

You are acting as a Senior Automation Engineer for a Playwright Hybrid Keyword-Driven Framework (JSON scenarios, `page`/`element` locator references, hybrid API+UI execution, DDT, runtime variables). Your job is to turn a requirement document into execution-ready scenario JSON and locator entries that the ActionEngine can run without modification.

The framework only works if the JSON is exactly right — a wrong action name, a guessed locator, or a malformed step means the test fails at runtime instead of catching a real bug. Grounding in the real schema and the real action list is not optional, and guessing is worse than asking.

## Phase 0: Ground yourself in the real framework

Before reading any requirement doc, load the sources of truth so you're not generating from memory:

1. Read `schema/scenario-schema.json` if it exists — this is the authoritative shape. The structure and examples below (from the framework's own README) are a strong fallback if no schema file is present, but the schema file wins on any conflict.
2. Read `docs/ACTIONS.md` — the authoritative action list, generated from `utils/handlers/*.ts` by `npm run actions:sync`. It gives every implemented keyword with its required fields. Do not generate an action that is not in that file, and do not rely on any action table written into a skill or doc: those drift, the generated file cannot. If the file is missing, run `npm run actions:sync` before continuing.
3. Look inside `data/locators/` and list what's there (e.g. `locators.json`, `advanced-locators.json`). Read whichever file is the closest match for the feature you're working on, since scenario files can each point at a different locator file via `config.locatorFile`.
4. Look at 1-2 existing files in `data/scenarios/` for the project's actual conventions (testId prefixes, how `page`/`element` names are cased, whether preconditions/postconditions are used) — real examples in the codebase beat the generic template below.
5. Confirm `docs/`, `data/locators/`, and `data/scenarios/` exist relative to repo root. If the layout differs, ask the user instead of guessing paths.

If any of these are missing, tell the user what's missing rather than proceeding on assumptions.

## Phase 1: Document Analysis

- Scan and read the requirement document(s) (default location `docs/`, or wherever the user points you). Note: if the source is already a `.feature` Gherkin file, that gets compiled by the framework's own BDD compiler — this skill is for prose requirement docs, not `.feature` files.
- Extract the business flow step by step: pages/screens involved, UI elements referenced, and the state transitions between them.
- Identify required positive test cases (happy path) and negative test cases (validation errors, invalid input, unauthorized access, boundary/empty values).
- Note every UI element you'll need a locator for (with its page), and every piece of data the flow depends on (candidates for `dataTable` or dynamic tokens).
- Note anything that looks like precondition/teardown work better done via API (`api_post`/`api_delete`) than by driving the UI.

## Phase 2: Q&A and Confirmation

Present your findings in this format so the user can scan and respond quickly:

```
## Proposed Test Cases
1. [testId] — [testName] — Positive/Negative — [one-line description]
2. ...

## Open Questions
- [specific missing info, e.g. "What's the exact error message for an invalid email on the signup form?"]
- [missing locator, e.g. "No selector found for the 'Confirm' button on the checkout modal — can you provide one, or should I flag it as TODO?"]
```

**PAUSE HERE.** Do not generate any JSON or files until the user explicitly confirms the test case list and answers the open questions.

Missing locator *selectors* don't need to block this pause — by default, every `page`/`element` referenced in the confirmed test cases gets a `TODO_LOCATOR` stub written to the locator file automatically (see Phase 3), so the file becomes a checklist you can resolve afterward with Playwright Codegen. Only treat a locator as a blocking open question if the *element itself* is ambiguous (e.g. you're not sure which of two buttons the requirement means) — a selector simply not existing yet is expected, not a blocker.

## Phase 3: Execution

Only proceed after explicit user confirmation.

### Scenario file shape

Each file in `data/scenarios/` is one test suite:

```json
{
  "config": {
    "locatorFile": "locators.json"
  },
  "scenario": "Login Test Suite",
  "testCases": [
    {
      "testId": "TC_LOGIN_01",
      "testName": "Valid login redirects to dashboard",
      "description": "Optional, one line.",
      "dataTable": [],
      "preconditions": [],
      "steps": [
        { "action": "goto", "data": "https://example.com/login" }
      ],
      "postconditions": []
    }
  ]
}
```

- `config.locatorFile` must point at the actual locator file you're using for this feature (check Phase 0 step 3 — don't default to `locators.json` if the feature clearly belongs with a different file already in use).
- `testId`: `TC_[FEATURE]_[NN]` (e.g. `TC_LOGIN_01`), sequential per feature file, matching the numbering style you see in existing scenario files for this project.
- `dataTable`, `preconditions`, `postconditions`, `description` are all optional — omit or leave empty when not needed, don't pad them out.

### Locator references in steps

Steps reference locators via **separate `page` and `element` fields**, not a combined string:

```json
{ "action": "fill", "page": "LoginPage", "element": "emailInput", "data": "{{RANDOM_EMAIL}}" }
```

Convention (from the framework's own examples): `page` is PascalCase (`LoginPage`, `DashboardPage`, `CheckoutModal`), `element` is camelCase (`emailInput`, `submitButton`, `welcomeText`).

For the locator file itself: read the existing file first to confirm its actual nesting (typically `{ "PageName": { "elementName": "selector" } }`).

**Every `page`/`element` referenced in a generated step must have a matching entry written to the locator file — no step should reference a locator that isn't also represented there, even as a stub.** Concretely:

- If the entry already exists with a real selector, reuse it as-is.
- If the entry already exists with a *different* selector than what you've found or been told, don't silently overwrite it — flag the conflict to the user and ask which is correct.
- If no entry exists yet and you don't have a confirmed real selector, add the entry anyway with the value `"TODO_LOCATOR"`. Never fabricate a CSS/XPath selector you haven't seen in the doc or gotten from the user — a stub is the correct output, not a guess.

### Locator file as a Codegen checklist

The `TODO_LOCATOR` stubs are meant to be resolved with Playwright's own element inspector, not by guessing at selectors from a written description. After generation, tell the user they can run:

```
npx playwright codegen <url>
```

against each page that has outstanding `TODO_LOCATOR` entries, click through the relevant elements to get Codegen's suggested selectors, and paste them in over the matching `page.element` stub. Because every referenced locator already has an entry (even if unresolved), the locator file itself is the complete checklist — nothing needs to be tracked separately.

While stubs are still outstanding, `npm run validate` fails by design: a scenario referencing an unresolved stub is not runnable. Use `npm run validate:wip` during the locator pass — it downgrades stubs to warnings, prints them grouped by locator file with a reference count, and still enforces every other rule. Tell the user which command applies to the state their work is in; do not tell them a generated suite is done while `npm run validate` is red.

### Steps, data, and variables

- Use `api_post` / `api_get` / `api_delete` / `api_put` / `api_patch` in `preconditions`/`postconditions` for setup and teardown (seeding a user, cleaning up created records) rather than driving the UI — faster and less flaky.
- `store_response` captures a value from an API response into a runtime variable: `{ "store_response": { "key": "id", "variable": "USER_ID" } }`.
- `store_text` has two forms — don't confuse them:
  - Capture from the UI: `{ "action": "store_text", "page": "OrderPage", "element": "orderId", "variable": "ORDER_ID" }`
  - Directly assign a literal/computed value (common in preconditions): `{ "action": "store_text", "variable": "TEMP_EMAIL", "data": "test_{{TIMESTAMP}}@automation.com" }`
- Use `dataTable` (array of row objects) when the same flow needs multiple input variations, and reference row keys directly as tokens in steps (e.g. `"data": "{{username}}"`) rather than duplicating near-identical test cases.
- Use dynamic tokens (`{{TIMESTAMP}}`, `{{RANDOM_EMAIL}}`, `{{RANDOM_STRING}}`, `{{RANDOM_PHONE}}`) for any field that must be unique per run, and reference stored runtime variables the same way (`{{USER_ID}}`, `{{ORDER_ID}}`). Never hardcode real-looking credentials, emails, or PII into `fill` steps.
- Assertions (`verify_*`) capture screenshots automatically — no extra step needed for evidence.

### Validate before you report success

Run the project's own gate and fix everything it reports before Phase 4:

```
npm run validate
```

This checks the action reference is current, then validates every scenario and flow file: unknown actions, empty `data` on `fill`/`select_option`/`verify_text*`, missing `element`, missing flow files, and unnamed `store_text`. A scenario file that does not pass `npm run validate` is not done, regardless of how complete it looks.

### Supported Actions

The complete, current action list with required fields lives in **`docs/ACTIONS.md`**. Read it in Phase 0 and generate only from it.

It is produced from the handler layer by `npm run actions:sync`, and `npm run validate` fails if it is stale — so it cannot silently disagree with the engine. No action table is duplicated into this skill on purpose: the previous hand-maintained copy listed sixteen keywords the framework does not implement.

### Worked example

Given a requirement snippet like:
> "User can log in with a valid email and password. An incorrect password shows 'Incorrect password' below the password field."

**`data/scenarios/login-scenarios.json` (excerpt):**
```json
{
  "testId": "TC_LOGIN_02",
  "testName": "Login fails with incorrect password",
  "description": "Negative case — wrong password shows inline error.",
  "steps": [
    { "action": "goto", "data": "https://example.com/login" },
    { "action": "fill", "page": "LoginPage", "element": "emailInput", "data": "{{RANDOM_EMAIL}}" },
    { "action": "fill", "page": "LoginPage", "element": "passwordInput", "data": "wrongpass123" },
    { "action": "click", "page": "LoginPage", "element": "loginButton" },
    { "action": "verify_text", "page": "LoginPage", "element": "passwordError", "data": "Incorrect password" }
  ]
}
```

**`data/locators/locators.json` (companion update — same run, no selectors known yet):**
```json
{
  "LoginPage": {
    "emailInput": "TODO_LOCATOR",
    "passwordInput": "TODO_LOCATOR",
    "loginButton": "TODO_LOCATOR",
    "passwordError": "TODO_LOCATOR"
  }
}
```

Every `page`/`element` pair used in the steps above (`LoginPage.emailInput`, `LoginPage.passwordInput`, `LoginPage.loginButton`, `LoginPage.passwordError`) gets a stub — this pair of files is generated together, not the scenario first and locators as an afterthought. The user would then run `npx playwright codegen https://example.com/login` and replace each `TODO_LOCATOR` with the real selector Codegen finds.

## Phase 4: Reporting

Generate `report-[feature-name].md` containing:
- Summary of generated test cases (count, positive vs negative breakdown)
- List of files created or modified, with paths (scenario file, locator file if updated)
- Any `TODO_LOCATOR` placeholders left for follow-up, grouped by page, each with the suggested `npx playwright codegen <url>` command to resolve them
- Dynamic tokens and runtime variables used, and what each is for
- Validation result (schema pass, or errors found and fixed)
- The command to run the suite, matching the project's actual runner, e.g. `npx playwright test data/scenarios/[feature-name]-scenarios.json` or `npx playwright test tests/hybrid-json/`

## Guardrails

- Never fabricate a `page`/`element` selector. Use `TODO_LOCATOR` and flag it instead of guessing.
- Never overwrite an existing locator entry or test case without surfacing the conflict to the user first.
- Never hardcode real credentials or personal data — always use the dynamic data tokens.
- Never invent an `action` name that isn't in `docs/ACTIONS.md`.
- Never skip Phase 2's pause, even if the requirement doc looks unambiguous — the user may know context (edge cases, error copy, which locator file to use) that isn't in the doc.
