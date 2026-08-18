---
description: Work on API-only test scenarios or preconditions/postconditions. Use for setup/teardown design, not full UI flows.
---

For: $ARGUMENTS

Follow `.claude/rules/api-testing.md`. Design `api_post`/`api_get`/`api_delete`/`api_put`/`api_patch` steps for setup/teardown, using `store_response` to carry values into the main flow. Pair every `preconditions` creation with a matching `postconditions` cleanup.
