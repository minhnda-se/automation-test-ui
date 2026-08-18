---
paths:
  - "utils/helpers/APIHelper.ts"
  - "data/scenarios/**/*.json"
---

# API Testing

## Actions

`api_get`(url) · `api_post`(url,data) · `api_put`(url,data) · `api_patch`(url,data) · `api_delete`(url). Optional: `headers`, `expected_status`, `store_response`.

## Response capture

`store_response` pulls a value from the JSON response into a runtime variable:

```json
{ "store_response": { "key": "id", "variable": "USER_ID" } }
```

Reference it downstream as `{{USER_ID}}`.

## Usage pattern

Use API actions for `preconditions`/`postconditions` (seed data, clean up) rather than driving the UI to reach a starting state. Always pair a `postconditions` teardown with anything created in `preconditions` — don't leave test data behind.

## Assertions on API responses

Set `expected_status` to assert the HTTP status explicitly rather than only checking for the absence of an error.
