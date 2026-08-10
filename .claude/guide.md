# Guild — How to Work With Claude on This Project

This is the onboarding doc for prompting Claude effectively in this repo. If you're new, read this once — it'll save you from re-explaining the framework every session.

## What lives in `.claude/`

- **`project-rules.md`** — global rules Claude should follow on every task in this repo (coding standards, architecture rules, framework conventions). Always relevant, not tied to any specific task type.
- **`skills/`** — four task-specific playbooks, each a `.md` file with detailed step-by-step instructions for one kind of work:
  - `generate-json-test.md` — requirement doc → JSON test scenario
  - `write-bdd-feature.md` — requirement doc → Gherkin `.feature` file
  - `fix-locator.md` — broken locator diagnosis + fix
  - `extend-action.md` — add a new ActionEngine keyword

## How to get Claude to use the right skill

**Try natural language first.** Each skill file is written so Claude can recognize when it applies just from how you describe the task — you shouldn't need to name the file:

- _"Generate test scenarios for the login flow from docs/login-requirements.md"_
- _"Write a Gherkin feature file for checkout based on docs/checkout.md"_
- _"This test keeps timing out on the submit button, here's the error and DOM"_
- _"I need to add a drag_and_drop keyword to the framework"_

**A note on reliability**: because the skills live as flat files in `.claude/skills/` rather than the nested `skill-name/SKILL.md` folder structure some tools expect for automatic discovery, whether natural-language triggering works depends on how your specific Claude setup is configured. If a request doesn't seem to pull in the right playbook — the response feels generic, skips steps, or doesn't reference the framework's real conventions — fall back to referencing the file explicitly. This always works regardless of auto-discovery:

```
Follow the instructions in .claude/skills/generate-json-test.md.
Requirement doc: docs/login-requirements.md
```

If you find yourself doing this constantly, it's worth flagging to whoever set up the Claude integration — it likely means auto-discovery isn't wired up, and either the setup needs adjusting or this doc should just tell everyone to always reference skills explicitly.

## Does Claude actually see `project-rules.md`?

Same caveat applies. If your Claude setup auto-loads project context (e.g. a `CLAUDE.md` that imports it), you don't need to do anything. If you're not sure, the safe move is referencing it at the start of a session:

```
Read .claude/project-rules.md before we start — I want you to follow those conventions for this session.
```

If Claude's output ever conflicts with what's in `project-rules.md` (wrong file paths, hardcoded selectors, non-English identifiers), that's a sign it wasn't loaded — paste it in directly.

## What to expect once a skill kicks in

These playbooks are built to check in with you, not dump a finished file in one shot:

| Skill                | Where it pauses                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-json-test` | Shows proposed test cases + open questions, waits for confirmation before generating anything                                                                        |
| `write-bdd-feature`  | Same — proposed scenarios + any steps with no BDD equivalent, waits for confirmation                                                                                 |
| `fix-locator`        | Tells you if the real issue looks like timing or an app change rather than a dead selector, before proposing a selector fix                                          |
| `extend-action`      | Shows the actual code diffs (Helper, ActionEngine, schema) and waits for your go-ahead before anything is written — a mistake here affects every test in the project |

If Claude generates a full file immediately with no questions and no pause, double-check the output against the schema/conventions — it may have skipped the skill's grounding steps.

## Quick reference: fallback prompts

**Generate JSON test cases**

```
Follow .claude/skills/generate-json-test.md. Requirement doc: docs/[your-file].md
```

Don't tell it which "phase" to run — let it work through analysis → confirmation → generation on its own. Telling it to "just do Phase 1" will make it stop after analysis.

**Generate a BDD feature file**

```
Follow .claude/skills/write-bdd-feature.md. Requirement doc: docs/[your-file].md
```

**Debug a broken locator** — give it all three inputs, not just the locator name:

```
Follow .claude/skills/fix-locator.md.

Error log: [paste the full Playwright error/timeout output]
DOM snippet: [paste the relevant HTML]
Current locator entry: [paste the existing page/element/selector from data/locators/locators.json]
```

**Add a new framework action**

```
Follow .claude/skills/extend-action.md.
New keyword: [name]
Behavior: [what it should do, e.g. "upload a file via Playwright's setInputFiles"]
```

## Known open item

`project-rules.md` states `.feature` files live in `data/features/`. The `write-bdd-feature.md` skill currently doesn't trust that path and searches the repo instead, because the framework's documented directory tree didn't originally show that folder. Once `data/features/` is confirmed as correct, it's worth simplifying that skill to just use it directly instead of searching every time.
