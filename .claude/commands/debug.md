---
description: Debug a failing test — broader than a locator issue. NOTE — check this command's name against Claude Code's bundled /debug (run /help to check) before relying on it; rename to debug-test or similar if it collides.
---

Debug the failure described in: $ARGUMENTS

1. Determine the failure category first: broken locator, timing/flakiness, real app behavior change, or a bug in the test's own logic (wrong assertion, bad test data).
2. If it's a locator issue, hand off to `.claude/skills/fix-locator/SKILL.md`.
3. Otherwise, propose the fix appropriate to the actual category — don't default to a locator fix for a non-locator problem.
