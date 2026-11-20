---
paths:
  - "data/scenarios/**/*.json"
  - "schema/**"
---

# JSON Scenario Files

## Shape

```json
{
  "config": { "locatorFile": "locators.json", "tags": ["@saucedemo", "@ci"] },
  "scenario": "Suite Name",
  "testCases": [
    {
      "testId": "TC_LOGIN_01",
      "testName": "...",
      "dataTable": [],
      "preconditions": [],
      "steps": [ ],
      "postconditions": []
    }
  ]
}
```

- `config.locatorFile` must point at the actual locator file this suite uses — don't default to `locators.json` if the feature already uses a different one.
- Validate against `schema/scenario-schema.json` before considering a scenario file done.
- `dataTable`, `preconditions`, `postconditions`, `description` are optional — omit rather than leaving them empty for padding.
- `config.tags` must carry exactly one target-application tag: `@saucedemo`, `@demoblaze`, `@demoqa` or `@booking`. Tags are appended to the generated test title, and `--grep` is how a run is scoped to one site.
- **`@ci` is tagged per test case, never at suite level.** It is a hand-picked 8-test smoke set, one test per critical path. The target sites rate-limit, so CI volume is itself a source of red builds - see `docs/internal/fix-reports/phase-10a-pilot-saucedemo.md`. Adding a scenario does not add it to `@ci`; prefer swapping a smoke test for a better one over growing the set, and only on the evidence of a green run.
- A test case may carry its own `tags`, merged with the suite's. Use it only when one file genuinely spans two target sites (see `advanced-scenarios.json`); otherwise tag at suite level.

## Legacy format

The framework also supports a legacy JSON array format for backward compatibility. Prefer the standard format above for anything new.
