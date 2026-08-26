# Clean Architecture

`utils/core/` (`ActionEngine.ts`, `LocatorManager.ts`, `DataManager.ts`, `AutoHealer.ts`) is orchestration only. It must never call Playwright or HTTP APIs directly — every `page.*` / `request.*` call lives in `utils/helpers/` (`ElementHelper.ts`, `AssertHelper.ts`, `APIHelper.ts`, `BaseHelper.ts`).

This isn't SRP for its own sake — it's what lets `AutoHealer` intercept locator resolution and lets evidence capture (screenshots on every assertion) apply uniformly to every action, current and future. An action that bypasses a Helper loses both.

## Layering

```
Feature File / JSON Scenario
        |
   Keyword Runner
        |
   Action Engine  (resolves runtime variables, dispatches only)
        |
  +-----+-----+-----+
  |     |     |
Element Assert  API
Helper  Helper Helper
  |     |     |
  +-----+-----+
        |
    Playwright
```

## When adding a new action

Follow `.claude/skills/extend-action/SKILL.md` rather than improvising. In short: Helper implementation first, then the `ActionEngine` case (resolve variables via `DataManager` before calling the helper), then an entry in `schema/action-notes.json` followed by `npm run actions:sync` - which generates the schema enum and the `ActionType` union, neither of which is hand-edited any more - then BDD mapping if in scope. Element-based actions resolve locators through `LocatorManager`, never an inline `page.locator()` call — bypassing it silently breaks auto-healing for that action.

## Never

- Never let `ActionEngine` call a raw Playwright/API method directly.
- Never change an existing action's behavior or signature while adding a new one without flagging it as a separate, explicit change.
