---
description: Prepare a release — full regression run, changelog, version tag.
disable-model-invocation: true
---

Prepare a release for: $ARGUMENTS

1. Run the full regression suite (`npx playwright test tests/hybrid-json/`) — do not proceed if anything fails.
2. Summarize what changed since the last release (scenarios added, actions extended, locators fixed).
3. Flag any unresolved `TODO_LOCATOR` entries or open items from `CLAUDE.md` that should block release.
4. Propose a changelog entry and version bump — wait for confirmation before tagging.
