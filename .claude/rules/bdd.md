---
paths:
  - "data/features/**/*.feature"
  - "scripts/compile-bdd.ts"
---

# BDD / Gherkin - FROZEN

## Status

`scripts/compile-bdd.ts` is frozen at **six step patterns**, against the framework's **40 action keywords**. No `Background`, no `Scenario Outline` / `Examples`, no preconditions or postconditions, no `dataTable`, no `call_flow`.

Two header directives set suite-level config: `# locatorFile:` and `# tags:`. Neither is a step pattern, and neither is exempt from the freeze rationale below - they exist because config hand-written into a `-generated.json` is destroyed by the next recompile. Native Gherkin `@tag` lines are rejected with an error rather than silently dropped.

It is kept for the existing `.feature` files, not because BDD is a supported first-class input. JSON scenarios in `data/scenarios/` are the primary input and support everything.

## Source of truth

`scripts/compile-bdd.ts`'s `STEP_MAPPINGS` array is the only valid step phrasing - not any dictionary written into a doc, including this one. A plausible Gherkin sentence that does not match fails the build. The compiler prints the full supported list on failure, so a mismatch is self-explanatory.

See `.claude/skills/write-bdd-feature/SKILL.md` for the six patterns and the decision procedure.

## Do not extend it casually

Adding a step pattern commits the project to keeping a second action dictionary in sync with the handler layer forever, in a place `npm run actions:check` cannot verify. Anything the six patterns cannot express belongs in a JSON scenario. If BDD should become first-class, that is a scoped project - see `docs/claude/CLAUDE_ADOPTION_FEASIBILITY.md`, section C, option 3.

## Titles and language

Feature and Scenario titles: concise, business-readable, describing behaviour rather than implementation. English only, like everything else in this repository.

## Output

`.feature` files live in `data/features/` (confirmed - the directory exists). Compiling writes `data/scenarios/<name>-generated.json`, which the runner picks up alongside hand-written suites. Test ids are deterministic (`BDD_<FEATURE>_<NN>`), so a recompile produces no git diff unless the feature actually changed.

Never hand-edit a `-generated.json` file. Edit the `.feature` and recompile.
