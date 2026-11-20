---
description: Check a proposed or existing change against this project's Clean Architecture rule specifically. Narrower than /review — architecture only.
---

Check $ARGUMENTS against `.claude/rules/architecture.md`:

- Does anything in `src/core/` or `src/handlers/` call Playwright or an HTTP API directly?
- Does a new action delegate to the correct Helper (`ElementHelper`, `AssertHelper`, or `APIHelper`)?
- Do element-based actions resolve through `LocatorManager` rather than an inline `page.locator()` call?

Report violations with the specific file/line, not just a general pass/fail.
