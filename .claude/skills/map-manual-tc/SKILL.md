---
name: map-manual-tc
description: Convert manual test cases from Excel, CSV, Google Sheets, Jira tickets, or free-form prose into executable Playwright Hybrid Keyword-Driven JSON scenarios and locator files. Use whenever the user provides manual test cases or spreadsheets and requests automation scenarios without missing intermediate steps or generating empty verifications.
---

# Map Manual Test Cases to Executable JSON Scenarios

You are a Senior SDET responsible for mapping manual test cases (from Excel, CSV, Google Sheets, Jira, or requirements documents) into **executable JSON Scenarios and Locator files** conforming to the Playwright Hybrid Framework (`data/scenarios/` and `data/locators/`).

## ⚠️ Anti-Patterns to Eliminate
1. **Granularity Mismatch (Missing intermediate steps)**: A single sentence in Excel describing multiple actions (e.g., "Fill first name, last name, zip and click Continue") must NEVER be collapsed into a single JSON step. It must be decomposed into discrete atomic steps.
2. **Blind Assertions (Empty / Contextless Verification)**: Never use `verify_visible` in isolation on generic wrappers or body containers. All verifications must assert concrete outcomes using `verify_text_contains`, `verify_text`, or `verify_url_contains` with specific non-empty `data`.
3. **Implicit Preconditions (Skipping Auth / State Setup)**: If a test case assumes "User is logged in", never jump straight to an internal URL without executing login steps or calling a reusable flow (`call_flow`).

---

## 4-Phase Execution Workflow

```
[ Excel / Manual Test Case ]
            │
            ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Phase 1: Atomic Action Decomposition                      │
 │   - Split compound sentences into discrete atomic actions  │
 │   - Determine: ActionType, Page, Element, Data            │
 └──────────────────────────┬────────────────────────────────┘
                            │
                            ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Phase 2: Preconditions & Reusable Flow Mapping            │
 │   - Detect Auth / Setup state requirements                │
 │   - Map to "call_flow" or explicit precondition steps     │
 └──────────────────────────┬────────────────────────────────┘
                            │
                            ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Phase 3: Strict Verifications & Locators                  │
 │   - Translate Expected Results to verify_text / verify_url│
 │   - Build `page.element` -> Selector / TODO_LOCATOR map   │
 └──────────────────────────┬────────────────────────────────┘
                            │
                            ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Phase 4: Output Scenario & Locator Files + Validate       │
 │   - Write data/scenarios/[feature].json                   │
 │   - Write data/locators/[feature].json                    │
 │   - Run self-check: npm run validate                      │
 └───────────────────────────────────────────────────────────┘
```

---

## Phase 1: Atomic Action Decomposition

### Intent Translation Dictionary (Manual Action $\rightarrow$ Framework Keyword):

The table below covers the common manual phrasings only. **`docs/ACTIONS.md` is the authoritative list of what the framework actually implements** — generated from `src/handlers/*.ts`, never hand-maintained. Check any keyword not in the table below against that file before using it.

| Manual QA Phrasing in Excel | Framework `action` | Required Companion Properties |
| :--- | :--- | :--- |
| "Navigate to / Open URL `...`" | `goto` | `data: "https://..."` |
| "Enter / Fill `[value]` into `[input]`" | `fill` | `page, element, data: "[value]"` |
| "Click / Tap `[button/link]`" | `click` | `page, element` |
| "Select `[option]` from dropdown" | `select_option` | `page, element, data: "[option]"` |
| "Check / Uncheck checkbox" | `check` / `uncheck` | `page, element` |
| "Wait for `[x]` seconds / Wait for element"| `wait` | `data: 3000` (milliseconds) |
| "Switch to newly opened tab" | `switch_new_tab` | (no element needed) |
| "Store / Extract text into variable" | `store_text` | `page, element, variable: "ORDER_ID"` |

### Decomposition Rule for Compound Descriptions:
If a single test step in Excel contains multiple actions connected with *"and"*, *"then"*, *"after that"*:
- *Example in Excel*: "Enter username 'standard_user', password 'secret_sauce' and click Login."
- *Must be decomposed into 3 JSON steps*:
  1. `{ "action": "fill", "page": "LoginPage", "element": "usernameInput", "data": "standard_user" }`
  2. `{ "action": "fill", "page": "LoginPage", "element": "passwordInput", "data": "secret_sauce" }`
  3. `{ "action": "click", "page": "LoginPage", "element": "loginBtn" }`

---

## Phase 2: Preconditions & Reusable Flows

1. **Authentication / Setup Requirements**:
   - Prefer `call_flow` if a reusable flow exists in `data/flows/`:
     ```json
     {
       "action": "call_flow",
       "flow": "login-flow",
       "params": { "username": "standard_user", "password": "secret_sauce" }
     }
     ```
   - Otherwise, declare explicit setup steps within `preconditions: [...]`.
2. **Dynamic / Unique Test Data**:
   - Use built-in template tokens: `{{TIMESTAMP}}`, `{{RANDOM_EMAIL}}`, `{{RANDOM_STRING}}`, `{{UUID}}`.

---

## Phase 3: Strict Business Verifications (Assertions)

### Golden Rules:
- ❌ **FORBIDDEN**: `{ "action": "verify_visible", "page": "CheckoutPage", "element": "contentWrapper" }` (Blind assertion — cannot catch data or logic errors).
-  **CORRECT**:
  - URL / Redirection verification: `{ "action": "verify_url_contains", "data": "/checkout-complete.html" }`
  - Exact or partial text assertion: `{ "action": "verify_text_contains", "page": "CheckoutCompletePage", "element": "completeHeader", "data": "Thank you for your order!" }`
  - Price / Calculation assertion: `{ "action": "verify_text", "page": "CartPage", "element": "totalPriceLabel", "data": "$32.39" }`
  - Disabled / Enabled state: `{ "action": "verify_disabled", "page": "FormPage", "element": "submitBtn" }`

---

## Phase 4: Output Files & Validation

Always generate/update both companion files:

### 1. Scenario File: `data/scenarios/[feature].json`
Strictly complies with `schema/scenario-schema.json`:
```json
{
  "config": {
    "locatorFile": "[feature].json",
    "enableAutoHealing": true
  },
  "scenario": "Suite Name",
  "testCases": [
    {
      "testId": "TC_[FEATURE]_01",
      "testName": "Clear Test Case Title",
      "description": "Objective description",
      "preconditions": [],
      "steps": [],
      "postconditions": []
    }
  ]
}
```

### 2. Locator File: `data/locators/[feature].json`
Every `page` and `element` referenced in steps must exist in the locator file. If real selectors are not yet known, populate with `"TODO_LOCATOR"` for subsequent resolution via Playwright Codegen:
```json
{
  "LoginPage": {
    "usernameInput": "TODO_LOCATOR",
    "passwordInput": "TODO_LOCATOR",
    "loginBtn": "TODO_LOCATOR"
  }
}
```

### 3. Mandatory Self-Check:
After writing files, always run:
```bash
npm run validate
```
Fix any reported schema, missing locator, or empty data errors before marking the task complete.
