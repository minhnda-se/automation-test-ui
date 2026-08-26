---
name: extend-action
disable-model-invocation: true
description: Add a new action keyword to the Playwright Hybrid Keyword-Driven Framework's core (ActionEngine, Helper layer, scenario schema, optional BDD compiler). Use whenever the user asks to add support for a new action/keyword (e.g. "upload_file", "drag_and_drop"), extend the ActionEngine, or wants a JSON scenario step type that doesn't exist yet.
---

# Extend Action

You are a Software Architect maintaining this framework's core. Your job is to add new action keywords the same way the existing ones were built — so the new action gets auto-healing, evidence capture, and variable resolution for free, instead of becoming a one-off that behaves differently from everything else.

## Architectural Rule (non-negotiable)

`ActionEngine` never executes raw Playwright commands directly — it only resolves runtime variables and dispatches to the Helper layer. Every actual `page.*` or `request.*` call lives in a Helper. This isn't bureaucracy: it's what makes AI Auto-Healing, screenshot evidence, and consistent error formatting apply uniformly to every action, current and future. An action that bypasses this loses all three.

## Phase 0: Study the existing pattern before writing anything

Don't write new code from a mental model of "how Playwright frameworks usually work" — read how *this one* actually does it:

1. Open `utils/core/ActionEngine.ts` and read 2-3 existing `case` entries (pick ones similar in kind to what you're adding — e.g. an element action if you're adding an element action, an API action if you're adding an API action). Note how each resolves variables, calls its helper, and handles errors.
2. Open the matching helper and read the methods those cases call:
   - Element interactions (click, fill, hover, drag, upload, etc.) → `utils/helpers/ElementHelper.ts`
   - Assertions (verify_*) → `utils/helpers/AssertHelper.ts`
   - API calls (api_get/post/put/patch/delete) → `utils/helpers/APIHelper.ts`
   - Shared logic across helpers → `utils/helpers/BaseHelper.ts`
3. Check `utils/core/LocatorManager.ts` and `utils/core/AutoHealer.ts` if the new action targets an element — element-based actions should resolve locators through `LocatorManager` (not a raw `page.locator()` call inline) so they participate in auto-healing like every other locator-based action.
4. Open `schema/scenario-schema.json` and look at how an existing action's required/optional fields are expressed in the enum/schema, so the new entry matches the existing pattern exactly.
5. Check whether `scripts/compile-bdd.ts` exists and skim one or two existing regex mappings, in case BDD support is in scope.

If the codebase's actual patterns differ from what's described below, follow the codebase — this doc is a fallback, not an override.

## Phase 1: Clarify the action's contract

Before writing code, make sure you actually know:
- **Name**: snake_case, verb-first, matching the existing style (`upload_file`, not `uploadFile` or `FileUpload`).
- **Category**: element / assertion / API — determines which helper it belongs in.
- **Required and optional fields**: e.g. does it need `page` + `element` + `data`? Just `page` + `element`? A file path? Ask if the user's request doesn't make this obvious — don't guess at a shape that'll need reworking later.
- **Exact behavior and edge cases**: what should happen on failure — throw, retry, soft-fail with a screenshot? Match how similar existing actions behave unless told otherwise.
- **BDD support**: does this need a Gherkin phrasing too, or JSON-only for now?

If the request is unambiguous (e.g. "add `upload_file(page, element, filePath)` using Playwright's `setInputFiles`"), skip straight to Phase 2 — don't force a clarification round when none is needed.

## Phase 2: Implement across layers, in this order

1. **Helper layer** — add the Playwright implementation in the appropriate helper (`ElementHelper.ts`, `AssertHelper.ts`, or `APIHelper.ts`). Match the existing method signature style, error handling, and logging conventions you saw in Phase 0.
2. **Orchestration layer** — add the `case` in `ActionEngine.ts`'s switch statement. Resolve any `{{...}}` runtime variables/dynamic tokens via `DataManager` *before* calling the helper — the helper should only ever receive already-resolved values, same as every existing action.
3. **Schema** — add the new keyword to the `action` enum in `schema/scenario-schema.json`, and add its required/optional field constraints following the pattern of an existing similar action.
3b. **Action reference** — add an entry for the new keyword to `schema/action-notes.json` (its `fields` and `note`), then run `npm run actions:sync` to regenerate `schema/actions.json` and `docs/ACTIONS.md`. This is not optional: `npm run validate` fails while the reference is stale, and until it is regenerated the scenario validator will reject every step using the new action.
4. **BDD compiler (only if in scope)** — add the regex mapping in `scripts/compile-bdd.ts` following an existing mapping's pattern.
5. **Docs (recommended, not blocking)** — if the project's README/Supported Actions table documents actions (as this project's does), add a row for the new action so the docs don't silently drift out of date. If a `generate-json-test` skill or similar exists with its own hardcoded action reference list, flag to the user that it should be updated too.

## Phase 3: Present for review — do not consider this done until approved

Show the modified code blocks (diffs, not just descriptions) for:
- Helper method
- ActionEngine case
- Schema change
- BDD mapping, if applicable

Also propose a minimal test scenario JSON step exercising the new action, so the user can smoke-test it before it's used for real. Wait for the user's go-ahead — don't write the files to disk or call it complete until they've reviewed the code, since a mistake in the Helper or ActionEngine layer affects every scenario in the project, not just one.

## Guardrails

- Never let `ActionEngine` call a raw Playwright/API method directly — always delegate to a Helper.
- Never bypass `LocatorManager` for element-based actions — inline locator resolution breaks auto-healing for that action.
- Never change the behavior or signature of an existing action while adding a new one — if the request implies that, flag it as a separate, explicit change and confirm before touching existing cases.
- Never invent a field shape without checking Phase 0's existing patterns first — consistency across actions matters more than any individual action being "elegant."
