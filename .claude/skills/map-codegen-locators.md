---
name: map-codegen-locators
description: Map a raw Playwright Codegen recording (a .ts/.js script produced by "npx playwright codegen") against the project's locators.json to resolve TODO_LOCATOR stubs into real selectors. Use whenever the user has run Playwright Codegen, pasted or uploaded a codegen output file, or asks to "fill in the locators", "finalize locators.json", or "map codegen to locators" for this framework.
---

# Map Codegen Locators

You are closing the loop that `generate-json-test.md` opens: it produces `locators.json` entries with `TODO_LOCATOR` placeholders for every element a scenario references, and the user resolves them by running `npx playwright codegen <url>` and recording the real flow. Your job is to read that raw recording and map its locators onto the right stub entries — turning `locators.json` from a checklist into something the test suite can actually run against.

This mapping is inherently fuzzy — Codegen doesn't know your `page`/`element` naming scheme, it just records what was clicked in order. Getting the match wrong (e.g. writing the "Confirm Password" field's selector into `passwordInput`) produces a test that runs without error but asserts the wrong thing, which is worse than an obvious `TODO_LOCATOR` failure. Confirm ambiguous matches rather than guessing.

## Phase 0: Ground yourself

1. Read `data/locators/locators.json` (or whichever locator file the relevant scenario's `config.locatorFile` points to) and list every `TODO_LOCATOR` entry that needs resolving — this is your target list.
2. Read `utils/core/LocatorManager.ts` to determine what a locator _value_ actually needs to look like when consumed at runtime: a raw CSS string passed to `page.locator()`, a specific prefixed engine string (`text=`, `xpath=`, a custom `data-testid=` convention), or something else. This matters a lot — Codegen's output uses Playwright's locator _methods_ (`getByRole`, `getByLabel`, `getByTestId`, `getByText`, `locator(css)`), which don't all convert cleanly into a plain string. If `LocatorManager.ts` only accepts raw CSS/XPath, some Codegen output will need lossy translation (see Phase 3); if it's unclear how to translate a given call, ask rather than guess.
3. Read the raw codegen file(s) the user provides. If the location isn't given, ask where it was saved rather than assuming a path — this project has no established convention for storing raw codegen output.
4. Check for an existing "raw codegen archive" convention in the repo (e.g. a `codegen-raw/` folder). If none exists, ask the user whether to keep a copy of the raw recording alongside the resolved locators for audit purposes, since Codegen output can't be regenerated identically later if the app changes.

## Phase 1: Parse the codegen recording

Walk through the recorded actions in order and extract, for each one:

- The action type (click, fill, check, etc.)
- The exact locator call Codegen used (`page.getByLabel('Email')`, `page.getByRole('button', { name: 'Log in' })`, `page.locator('#submit')`, etc.)
- Any value involved (what was typed/selected) — useful context for matching, not something you need to preserve
- The surrounding sequence — order and nearby actions help disambiguate which `TODO_LOCATOR` stub an action corresponds to

Ignore recording noise that doesn't correspond to a locator you need (e.g. `page.goto()` calls, or interactions with elements outside the flow you're resolving).

## Phase 2: Propose the mapping — pause for confirmation

Match each `TODO_LOCATOR` stub to a codegen entry using the strongest available signal: matching element names/labels (`emailInput` ↔ `getByLabel('Email')`), then action type and value being entered, then sequence order as a last resort. Present the proposed mapping like this:

```
## Proposed Locator Mapping — LoginPage
| Stub (page.element)      | Codegen locator                              | Confidence |
|---------------------------|-----------------------------------------------|------------|
| LoginPage.emailInput      | getByLabel('Email')                           | High       |
| LoginPage.passwordInput   | getByLabel('Password')                        | High       |
| LoginPage.loginButton     | getByRole('button', { name: 'Log in' })       | High       |
| LoginPage.passwordError   | (not found in recording)                      | —          |

## Needs your input
- No codegen entry matched `passwordError` — was the error message recorded? If not, it needs a separate Codegen pass that actually triggers the error state.
- `getByRole('button', { name: 'Log in' })` appears twice in the recording (once before a validation error, once after) — same element, using the first occurrence.
```

**PAUSE HERE.** Don't write to `locators.json` until the user confirms the mapping, especially anything marked below "High" confidence or flagged as ambiguous.

## Phase 3: Apply the confirmed mapping

- Convert each confirmed codegen locator into the format `LocatorManager.ts` expects (from Phase 0). Preference order when a translation choice exists:
  1. `getByTestId(...)` → `[data-testid="..."]` — clean, near-lossless conversion.
  2. A literal `id`/`name` attribute visible in `page.locator('#...')` or `[name="..."]` — direct, reliable.
  3. `getByRole`/`getByLabel`/`getByText` → only approximate as CSS (e.g. `[aria-label="..."]`) if the underlying attribute is actually visible in the DOM; if the accessible name comes from associated text rather than a literal attribute, flag this as a lower-confidence conversion rather than inventing a selector that looks plausible but may not match at runtime.
  - If `LocatorManager.ts` can consume Playwright's locator methods/chains directly (some implementations store the method call itself rather than a string), prefer preserving the Codegen locator as-is over lossy CSS conversion — check Phase 0's findings before choosing.
- Never overwrite an already-resolved (non-`TODO_LOCATOR`) entry without flagging the conflict to the user first — the same rule as `generate-json-test` and `fix-locator`.
- Never invent a selector for a stub that had no matching codegen entry — leave it as `TODO_LOCATOR` and report it as still outstanding rather than filling it with a guess.
- Keep `page`/`element` key names exactly as they were in the stub — this phase resolves values, it doesn't rename keys.

## Phase 4: Validate and report

- Confirm the updated `locators.json` is still valid JSON and, if a schema/format check exists for locator files, run it.
- Report:
  - Stubs resolved vs. still outstanding (and why, if a codegen match wasn't found)
  - Any conversions flagged as lower-confidence (approximated from role/label rather than a literal attribute) that are worth a manual double-check
  - Any conflicts found with pre-existing non-stub entries
  - Whether the raw codegen file was archived, and where

## Guardrails

- Never guess a page/element mapping without the confidence table and pause in Phase 2 — a wrong mapping produces a test that passes while checking the wrong element, which is worse than a visible `TODO_LOCATOR` failure.
- Never fabricate a selector for an element that isn't actually present in the codegen recording.
- Never overwrite a real, already-resolved locator without surfacing the conflict first.
- Never silently choose a lossy CSS approximation over a cleaner conversion (data-testid, id) when a cleaner option exists in the same recording.
- Never rename a `page`/`element` key while resolving its value — that's a different change and needs to be called out separately if genuinely needed.
