# Error Handling & Auto-Healing Accountability

## Auto-Healing

`AutoHealer.ts` retries a broken locator with an AI-generated selector and continues the test. This is good for maintenance, but it can silently mask a real regression: if an element genuinely disappeared or broke, a heal event can let a test pass when it should have failed.

- Every heal event should be visible in the report/logs even when the test ultimately passes — never suppress it just because the run was green.
- Once `tags` exists (see `testing.md`), a heal event on a `critical`-tagged test should surface for human review rather than pass silently.

## Test failures generally

- Assertion failures should carry enough context to act on without re-running (expected vs. actual, the `page`/`element` involved) — rely on the framework's automatic screenshot capture on every assertion rather than adding redundant custom logging.
- Don't swallow errors in Helper methods to make a test "pass" — a helper that catches and ignores a Playwright error defeats the point of the assertion.

## When debugging a failure

Diagnose before patching: distinguish a genuinely broken locator from timing/flakiness or an intentional app change before reaching for a selector fix (`.claude/skills/fix-locator/SKILL.md` covers this in detail).
