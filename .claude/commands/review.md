---
description: Review a diff or a set of changes against this project's architecture and coding standards. NOTE — check this command's name against Claude Code's bundled /code-review and its /review alias (run /help to check) before relying on it; rename to review-scenario or similar if it collides.
---

Review the changes in $ARGUMENTS against:

- `.claude/rules/architecture.md` — no raw Playwright/HTTP calls outside Helpers
- `.claude/rules/coding-standards.md` — naming, English-only, zero icons
- `.claude/rules/security.md` — no hardcoded credentials/PII
- Whether locators are fabricated vs. sourced from a real DOM/Codegen inspection

Report findings as pass/flag per area, not a rewritten diff, unless asked to fix issues directly.
