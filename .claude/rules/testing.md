# Testing Conventions

## Test case structure

Every `testCases` entry: `testId`, `testName` (required), `description`, `dataTable`, `preconditions`, `postconditions` (optional — omit or leave empty rather than padding them out), `steps` (required).

## Preconditions/postconditions

Prefer `api_post`/`api_get`/`api_delete`/`api_put`/`api_patch` for setup and teardown over driving the UI to reach a starting state — faster, less flaky, and keeps the main `steps` focused on the behavior under test.

## Data-Driven Testing

Use `dataTable` (array of row objects) for the same flow run with multiple input variations, referencing row keys directly as tokens (`"data": "{{username}}"`) — don't duplicate near-identical test cases instead.

## Tagging (planned, not yet in schema)

The schema doesn't have a `tags` field yet. When it's added, use it to separate `smoke` (fast, every commit), `regression` (full suite, scheduled), and `critical` (must never silently pass on a locator heal — see `error-handling.md`). Until then, keep this distinction in mind when naming/organizing scenario files so the migration is straightforward later.

## Positive and negative coverage

Every feature should get both a happy-path case and at least one negative case (validation error, invalid input, boundary/empty value) — don't generate only the positive path.
