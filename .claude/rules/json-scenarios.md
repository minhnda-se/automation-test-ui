---
paths:
  - "data/scenarios/**/*.json"
  - "schema/**"
---

# JSON Scenario Files

## Shape

```json
{
  "config": { "locatorFile": "locators.json" },
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

## Legacy format

The framework also supports a legacy JSON array format for backward compatibility. Prefer the standard format above for anything new.
