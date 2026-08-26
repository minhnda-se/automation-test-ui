---
name: write-bdd-feature
description: Write Gherkin .feature files for this framework's FROZEN BDD compiler, which supports exactly six step patterns. Use when the user asks for Gherkin scenarios, BDD test cases, or a .feature file - and to explain why most requirements should become a JSON scenario instead.
---

# Write BDD Feature (frozen compiler)

`scripts/compile-bdd.ts` is **frozen**. It supports **six step patterns** out of the framework's **40 action keywords** (`docs/ACTIONS.md`). It has no support for `Background`, `Scenario Outline` / `Examples`, preconditions, postconditions, `dataTable`, or `call_flow`.

Suite config is set by two header directives, `# locatorFile:` and `# tags:`, written above the `Feature:` line. Native Gherkin `@tag` lines are an error - use `# tags:` instead.

Your first job is usually to say so. Most requirements cannot be expressed in six patterns, and a `.feature` file that half-covers a requirement is worse than a JSON scenario that covers it fully - the missing half becomes invisible.

## The complete dictionary

These six patterns are everything that compiles. Any other phrasing fails the build with an error listing them.

| Gherkin step | Compiles to |
|---|---|
| `I go to "<url>"` | `goto` |
| `I click "<element>" on "<Page>"` | `click` |
| `I fill "<value>" into "<element>" on "<Page>"` | `fill` |
| `I verify "<element>" is visible on "<Page>"` | `verify_visible` |
| `I verify "<element>" on "<Page>" has text "<value>"` | `verify_text` |
| `I save text from "<element>" on "<Page>" as "<VARIABLE>"` | `store_text` |

Word order, articles, and quoting are part of the regex. Do not adapt the wording - a small change stops it matching.

Verify against `scripts/compile-bdd.ts` before relying on this table. If the two disagree, the file wins and this table is stale - say so rather than generating against it.

## When to use BDD at all

Use a `.feature` file only when **both** hold:

1. Someone outside the QA team actually reads these files. Gherkin's only real payoff is stakeholder communication; if the audience is QA, it is a lossy duplicate of the JSON.
2. The whole scenario fits inside the six patterns above.

Otherwise use `generate-json-test` or `map-manual-tc` and write a JSON scenario. That is not a workaround - JSON is this framework's primary input, and the compiler exists to serve a small legacy surface.

## Procedure

1. Read `scripts/compile-bdd.ts` and confirm the dictionary above still matches.
2. Read the requirement and map each interaction to one of the six patterns.
3. **Before writing anything, list what does not fit.** Present it plainly:

```
## Fits the frozen BDD dictionary
- Navigate to login page, fill credentials, click submit, assert inventory visible

## Does NOT fit - needs a JSON scenario
- "Given a user already exists" -> api_post precondition, no BDD mapping
- Three credential variations -> dataTable, no Scenario Outline support
- Assert the URL contains /inventory.html -> verify_url_contains, no BDD mapping

## Recommendation
Write this as data/scenarios/login.json instead. BDD would cover roughly half of it.
```

4. **Pause for the user's decision.** Do not generate a partial `.feature` file to be helpful.
5. If they confirm BDD: write to `data/features/<name>.feature`. Feature and Scenario titles describe behaviour, not implementation (`Scenario: User cannot log in with an incorrect password`, not `Scenario: Verify passwordError is visible`). English only.
6. Compile and validate:

```
npm run compile-bdd
npm run validate
```

Compilation writes `data/scenarios/<name>-generated.json`. Test ids are deterministic (`BDD_<FEATURE>_<NN>`), so recompiling produces no diff unless the feature changed.

## Guardrails

- Never invent a step phrasing. Six patterns, exact wording.
- Never write a `.feature` file that silently drops part of a requirement - list the gaps and let the user choose.
- Never propose extending the compiler as a quick fix. Adding a pattern means maintaining a second dictionary that the generated action reference cannot check, for every future action. If BDD should become first-class, that is a scoped project: see `docs/claude/CLAUDE_ADOPTION_FEASIBILITY.md`, section C, option 3.
- Never hand-edit `data/scenarios/*-generated.json`. It is compiler output; edit the `.feature` file and recompile.
