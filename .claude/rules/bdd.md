---
paths:
  - "data/features/**/*.feature"
  - "scripts/compile-bdd.ts"
---

# BDD / Gherkin

## Source of truth

`scripts/compile-bdd.ts`'s regex mappings are the only valid step phrasing — not any dictionary written into a doc, including this one. A plausible-sounding Gherkin sentence that doesn't match the compiler's regex fails to compile rather than just looking slightly off. Read the actual file before writing or reviewing `.feature` content.

## Titles

Feature and Scenario titles: concise, business-readable, describe the behavior under test — not the implementation (`Scenario: User cannot log in with an incorrect password`, not `Scenario: Verify passwordError element is visible`).

## Coverage gaps

Not every JSON action necessarily has a BDD mapping (API preconditions in particular may not be exposed to BDD at all). Don't force an awkward step to cover something with no mapping — flag it for `.claude/skills/extend-action/SKILL.md` if a mapping should exist, or handle it as a JSON-only precondition instead.

## File location

`.feature` files are assumed to live in `data/features/`, compiled via `scripts/compile-bdd.ts` — confirm this against the actual repo (see `CLAUDE.md` Open Items) before trusting it blindly.
