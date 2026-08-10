---
name: write-bdd-feature
description: Generate Gherkin .feature files from requirement documents or user stories, using the Playwright Hybrid Keyword-Driven Framework's BDD compiler dictionary. Use whenever the user asks for Gherkin scenarios, BDD test cases, a .feature file, or wants a requirement doc translated into "Given/When/Then" steps for this framework.
---

# Write BDD Feature

You are a QA specialist translating requirement documents into Gherkin `.feature` files for this framework's BDD compiler. The value of Gherkin here is entirely dependent on using step phrasing the compiler actually recognizes — a grammatically fine sentence that doesn't match the compiler's regex will fail to compile, not just look slightly off. So the real work isn't writing nice Gherkin, it's writing Gherkin that matches the exact dictionary this project's compiler uses.

**Known conflict worth resolving before you rely on any fixed dictionary**: this project's own README shows a BDD example using dot-notation locator references inside the step text (e.g. `I fill "LoginPage.username" with "standard_user"`, `Then I should see "DashboardPage.inventoryContainer"`) — no `"on [page]"` clause, different verb phrasing than a `"[element]" on "[page]"` pattern. If you've been handed a fixed step dictionary elsewhere, don't assume it's current without checking Phase 0 below; `scripts/compile-bdd.ts`'s actual regex patterns are the only thing that decides what compiles.

## Phase 0: Ground yourself in the real dictionary and file layout

1. Read `scripts/compile-bdd.ts` and extract every regex-to-action mapping it defines. This is the authoritative step dictionary — build your working dictionary from this file, not from memory or any dictionary written into a doc (including this one).
2. If `scripts/compile-bdd.ts` isn't found, ask the user for its location before generating anything — guessing at step phrasing risks producing a feature file that silently fails to compile.
3. Check where existing `.feature` files actually live (search the repo — the project's documented directory tree doesn't show a `data/features/` folder, so don't assume that path). Read 1-2 existing `.feature` files if present, for real examples of house style (Background usage, tagging, Scenario Outline conventions).
4. Note which actions from the full ActionEngine list (see the `generate-json-test` skill's reference table, or `utils/core/ActionEngine.ts` directly) have a BDD mapping and which don't. Not every JSON action necessarily has Gherkin coverage — API setup/teardown steps in particular may not be exposed to BDD at all.

## Phase 1: Document Analysis

- Read the requirement document or user story.
- Identify the logical flow: pages involved, elements interacted with, and the sequence of actions.
- Identify required positive and negative test cases.
- For each interaction, check against the Phase 0 dictionary whether a matching step exists. If something in the flow has no BDD equivalent (e.g. an API precondition, an action type the compiler doesn't map), don't force an awkward step to cover it — flag it as something to handle as a JSON precondition/postcondition instead, or ask whether it needs a new BDD mapping first (that's the `extend-action` skill's territory, not this one).

## Phase 2: Confirm before generating

Present, and pause for confirmation:

```
## Proposed Scenarios
1. [Scenario title] — Positive/Negative — [one-line description]
2. ...

## Steps with no BDD dictionary match
- [interaction] — no compiler mapping found; suggest: [JSON-only fallback / needs new mapping via extend-action]

## Open Questions
- [anything the doc leaves ambiguous]
```

Don't generate the `.feature` file until the user confirms the scenario list and you've agreed what to do about any unmapped steps.

## Phase 3: Generate the feature file

- Use only step phrasing confirmed against `compile-bdd.ts` in Phase 0. Do not invent new sentence structures, and do not "adapt" an existing pattern's wording — even a small change (word order, added article) can break the regex match.
- Feature and Scenario titles: concise, business-readable — describe the behavior under test, not the implementation (`Scenario: User cannot log in with an incorrect password`, not `Scenario: Verify passwordError element is visible`).
- If multiple scenarios in the same feature share the same opening steps (e.g. always starting by navigating to the same page), use `Background:` rather than repeating the steps in every scenario — but only if you saw this pattern used in Phase 0's existing `.feature` files, since not every project's compiler necessarily supports `Background`.
- For data-driven cases, use `Scenario Outline` + `Examples` only if you confirmed in Phase 0 that the compiler supports it — otherwise fall back to separate scenarios, or note that this case should be expressed as `dataTable` in the compiled JSON instead.
- Keep each scenario focused on one behavior — don't chain unrelated assertions into a single scenario just to save a Background block.

## Phase 4: Output

State the exact file path you're saving to (based on Phase 0's actual directory finding, not an assumed path), and list:

- Scenarios generated
- Any steps left unmapped and how they're being handled (JSON fallback vs. flagged for a new BDD mapping)
- The command to compile/run, if the project has one (check `package.json` scripts or the README's execution section)

## Guardrails

- Never invent a new Gherkin step phrasing — every step must match an existing `compile-bdd.ts` regex, confirmed in Phase 0.
- Never assume the file output path — confirm where `.feature` files actually live in this repo before saving.
- Never silently drop an interaction that has no BDD mapping — flag it so the user can decide whether it needs a new mapping, a JSON-only fallback, or isn't actually needed.
- Never trust a step dictionary handed to you (including the one that might already be in this file) over what `scripts/compile-bdd.ts` actually defines — docs drift, regexes don't.
