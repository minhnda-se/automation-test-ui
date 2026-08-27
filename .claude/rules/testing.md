# Testing Conventions

## Test case structure

Every `testCases` entry: `testId`, `testName` (required), `description`, `dataTable`, `preconditions`, `postconditions` (optional — omit or leave empty rather than padding them out), `steps` (required).

## Preconditions/postconditions

Prefer `api_post`/`api_get`/`api_delete`/`api_put`/`api_patch` for setup and teardown over driving the UI to reach a starting state — faster, less flaky, and keeps the main `steps` focused on the behavior under test.

## Data-Driven Testing

Use `dataTable` (array of row objects) for the same flow run with multiple input variations, referencing row keys directly as tokens (`"data": "{{username}}"`) — don't duplicate near-identical test cases instead.

## Tagging

`tags` is in the schema, at suite level (`config.tags`) and per test case. Each
tag is appended to the generated test title, and `--grep` selects on it. Exactly
one target-application tag per test case (`@saucedemo`, `@demoblaze`, `@demoqa`,
`@booking`); `@ci` marks the hand-picked smoke set that runs on every pull
request, and is added on the evidence of a green run, never speculatively.

`critical` is still not a tag. When it is added, a locator heal on a
`critical`-tagged test must surface for human review rather than pass silently -
see `error-handling.md`.

## Suite status

`config.status` is `"ready"` (the default) or `"wip"`. Mark a suite `wip` only
while it is genuinely waiting on the codegen locator handoff: unresolved
`TODO_LOCATOR` stubs stop failing `npm run validate`, and the runner marks the
suite `fixme` with a `@wip` tag.

It exempts the stub sentinel and nothing else. A missing locator entry, an
unknown action or a malformed tag still fails. Set it back to `"ready"` as soon
as the stubs are resolved - the validator names every wip suite on every run so
the state cannot quietly become permanent.

## Positive and negative coverage

Every feature should get both a happy-path case and at least one negative case (validation error, invalid input, boundary/empty value) — don't generate only the positive path.
