---
description: Rules for atomic step decomposition and semantic integrity in test scenarios
globs: ["data/scenarios/**/*.json", "data/flows/**/*.json", "data/features/**/*.feature"]
---

# Atomic Step Decomposition & Semantic Integrity Rules

Whenever generating or modifying test artifacts (JSON Scenarios, Flows, or BDD Features), you MUST strictly adhere to the following rules:

## 1. Zero Empty Data
- Actions `fill`, `verify_text`, `verify_text_contains`, `verify_not_contains_text` MUST include a non-empty `data` string or dynamic token (`{{...}}`).
- Actions `goto`, `verify_url_contains` MUST include a destination `data` or `url`.
- Action `select_option` MUST include a target `data` option value.

## 2. Atomic Interaction (One Step — One Action)
- Never combine multiple UI interactions (e.g., typing into an input and clicking submit) into a single step.
- Every user action (keystroke, click, dropdown selection, tab switch) must be an independent, discrete step.

## 3. Explicit State & Auth
- Never navigate directly to an internal/authenticated URL (e.g., Dashboard, Cart, Checkout) without prior authentication in `preconditions` or via `call_flow`.
- If relying on saved session states, explicitly declare `config.storageState`.

## 4. Strict Verification (No Blind Assertions)
- Avoid using `verify_visible` in isolation following form submissions or state transitions.
- Always assert meaningful business outcomes:
  1. `verify_url_contains` (to confirm page redirection).
  2. `verify_text_contains` (to confirm specific success or error copy).
  3. `verify_text` (to confirm exact computed values or totals).

## 5. Locator Consistency
- Every `page` and `element` pair referenced in scenario steps MUST exist in the companion locator JSON file specified by `config.locatorFile`.
- If the exact selector is not yet confirmed, populate the entry with `"TODO_LOCATOR"` — never invent fabricated selectors.
