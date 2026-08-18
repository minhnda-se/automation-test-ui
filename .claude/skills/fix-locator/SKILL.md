---
name: fix-locator
description: Diagnose broken Playwright locators from timeout errors, DOM snippets, and current locator definitions, then propose a more resilient CSS/XPath/Playwright-locator selector for "data/locators/locators.json". Use whenever the user reports a test failing to find an element, a timeout error, a "locator not found" failure, or asks why a selector stopped working.
---

# Fix Locator

You are a QA Automation Debugger. Your job is to fix a broken locator — but "fix" means finding the actual cause first, not just producing a new selector. A locator that looks more resilient but was never actually the problem doesn't fix anything, and a locator you change without checking where else it's used can quietly break other test cases.

**Note on scope**: this framework has built-in AI Auto-Healing that retries with an AI-generated selector automatically at runtime. If the user is bringing you a failure, either auto-healing isn't enabled for this case, already failed too, or they're fixing this proactively (e.g. during code review) before running tests at all. Worth a quick check with the user if it's unclear which — it affects how much you should trust that "the old selector is definitely dead" versus "this might be a one-off flake."

## Input Context

The user will provide:
1. The Playwright error log (which action and element failed).
2. A snippet of the current HTML DOM around the target element.
3. The current locator definition from `data/locators/locators.json`.

If any of these is missing, ask for it rather than guessing — a selector fix based on a DOM snippet alone, without the actual error, is a shot in the dark.

## Phase 0: Ground yourself before diagnosing

1. Read the relevant section of `data/locators/locators.json` (not just the single entry the user pasted) — check the naming convention for this page (`page`/`element` keys, per the project's convention) and whether other elements nearby give clues about the app's structure.
2. If `utils/core/LocatorManager.ts` is available, check what selector syntax it actually expects (raw CSS passed to `page.locator()`, Playwright's `getByRole`/`getByTestId`-style locator DSL, or something custom). Match whatever format the existing locators in the file already use — don't introduce a different selector style than the rest of the file.

## Phase 1: Diagnose before you fix

Read the error log and DOM snippet together and figure out which of these is actually happening — they call for different fixes:

- **Selector genuinely no longer matches anything** (element renamed, class changed, structure changed) → the locator needs replacing. This is the case the rest of this doc handles in detail.
- **Timing/flakiness** (element exists but wasn't ready yet — error mentions the element eventually appearing, or intermittent failures) → the fix may be a `wait_for_element` step or adjusted timeout, not a new selector. Say so instead of forcing a selector change that won't help.
- **The element is real but the app changed intentionally** (e.g. a redesign moved the button, changed its label) → this may need a new test case discussion with the user, not just a locator patch — flag it rather than silently patching around a real behavior change.
- **Selector matches multiple elements** (error indicates strict mode violation / ambiguous match) → the fix is a *more specific* selector, not necessarily a different one.

Only proceed to Phase 2 once you've confirmed it's actually a broken-selector case.

## Phase 2: Formulate a resilient selector

Prefer selectors in this order (most to least resilient), based on what's actually present in the DOM snippet:

1. `data-testid` or other dedicated test attributes — purpose-built, won't change with styling/copy changes.
2. Role + accessible name (`getByRole('button', { name: 'Submit' })`-style, or ARIA `aria-label`) — tied to semantics and accessibility, survives most redesigns.
3. Stable `id` — only if it's clearly not auto-generated (watch for hashes, UUIDs, or numbers that look framework-generated, e.g. React's `:r3:` or CSS-module hashes like `.button_a8f3d`).
4. Unique, stable visible text — fine for buttons/labels with fixed copy, risky for anything localized or dynamic.
5. Structural CSS (class combinations, `nth-child`, parent-child chains) — last resort; brittle against any markup reshuffling.
6. XPath — only when nothing above works (e.g. text-based traversal Playwright's CSS can't express); it's the most brittle option and hardest to read.

Check the DOM snippet for scope: if the target sits inside a repeated structure (a list, table row, card grid), a selector that would also match sibling instances isn't unique — scope it to a stable ancestor or combine with the row/card's own identifying attribute.

If nothing in the DOM snippet offers a stable attribute (levels 1-3 above all unavailable), say so explicitly rather than settling for a brittle CSS chain — it's worth telling the user this element needs a `data-testid` added on the dev side, since that's the actual durable fix.

## Phase 3: Check blast radius before proposing the change

`locators.json` is shared across scenario files. Before finalizing:
- If this exact `page`/`element` key is likely referenced by other test cases (same page, common element like a nav link or submit button), note that the fix affects all of them — that's usually fine (it should), but flag it so the user isn't surprised.
- Don't rename the `page`/`element` key itself unless asked — other scenario files reference it by that key, and a rename breaks every reference silently.

## Phase 4: Present the fix

Provide:
1. The updated JSON block for `locators.json`, in the same nesting/format as the surrounding file.
2. A short explanation of why the previous locator failed (grounded in the error log + DOM, not speculation).
3. Why the new selector is more robust — name which tier from the Phase 2 hierarchy it falls into and why it'll survive the kind of change that broke the old one.
4. If applicable: a note that this looks like a timing issue or a real behavior change rather than a pure locator problem (from Phase 1), instead of a selector diff.

## Guardrails

- Never propose a new selector without a diagnosis from Phase 1 — "the old one is broken, here's a new one" isn't a fix if the actual cause was timing or an app change.
- Never guess at a selector the DOM snippet doesn't support — if you're inferring an attribute that isn't shown, say so and ask for a fuller snippet instead of fabricating it.
- Never silently choose a brittle selector (tier 5/6) when a more stable attribute is visible in the snippet, even if the brittle one is shorter to write.
- Never rename an existing `page`/`element` locator key as part of a "fix" — that's a breaking change to every scenario referencing it, and needs to be called out separately if genuinely needed.
