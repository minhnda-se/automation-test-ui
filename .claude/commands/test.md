---
description: Run the test suite (or a subset) and summarize results.
---

Run: `npx playwright test $ARGUMENTS` (default to `tests/hybrid-json/` if no scope given).

Summarize: pass/fail counts, which test cases failed and why (from the HTML report), and whether any failures involve an Auto-Healing event that should be reviewed rather than trusted (see `.claude/rules/error-handling.md`).
