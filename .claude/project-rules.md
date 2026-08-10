# Global Project Context and Agent Rules

## Project Overview

This workspace contains a Playwright Hybrid Keyword-Driven Framework. The core engine is TypeScript; test execution runs off JSON scenario files and Gherkin feature files compiled into JSON. QA Engineers and Business Analysts write scenarios in JSON/Gherkin without touching the TypeScript engine directly — that separation only holds if the rules below are actually followed.

## Coding Standards

1. **English only.** All source code, variable names, function names, object keys, and code comments — English, no exceptions, regardless of what language the requirement doc or conversation is in.
2. **Zero icon policy.** No emojis, icons, or graphical symbols in source code, config files, Markdown docs, JSON files, or terminal output strings.
3. **Clean Architecture — enforced, not aspirational.** `utils/core/` (orchestration: `ActionEngine.ts`, `LocatorManager.ts`, `DataManager.ts`, `AutoHealer.ts`) must never call Playwright or HTTP APIs directly. Every actual `page.*` / `request.*` call lives in `utils/helpers/`. This isn't just SRP for its own sake — it's what lets `AutoHealer` intercept locator resolution and lets evidence capture apply uniformly to every action. An action that bypasses a Helper loses both. See `.claude/skills/extend-action.md` for the concrete workflow this applies to.

## Framework Conventions

- **Test scenarios** (`data/scenarios/*.json`) must validate against `schema/scenario-schema.json`. A scenario file that doesn't validate isn't done, no matter how complete it looks.
- **Locators** (`data/locators/*.json`) are centralized — never hardcode a CSS/XPath selector inside a scenario step. Reference locators via `page`/`element` fields, matching whichever locator file the scenario's `config.locatorFile` points to.
- **BDD feature files** live in `data/features/` and are compiled into JSON scenarios via `scripts/compile-bdd.ts`. Gherkin step wording in a `.feature` file must match `compile-bdd.ts`'s regex patterns exactly — a plausible-sounding sentence that doesn't match the compiler's dictionary will fail to compile, not just look slightly off. When writing or reviewing feature files, treat `compile-bdd.ts` as the source of truth for valid step phrasing, not any dictionary written into a doc (including this one — docs drift, regexes don't).

## Agent Responsibilities

- When asked to generate test cases, feature files, fix a locator, or extend an action, check `.claude/skills/` for a matching playbook and follow it rather than improvising a workflow from scratch — those files encode conventions and failure modes specific to this project.
- Read requirement documents relevant to the _current_ task from `docs/` — don't blanket-read the whole directory unprompted.
- Never fabricate a locator selector, an action name, or a file path. If something needed isn't confirmed by a doc, an existing file, or the user, say so and ask rather than guessing — a plausible-looking guess that's wrong fails silently at runtime, which is worse than a paused question.
- Verify JSON output is structurally valid (and against `schema/scenario-schema.json` where applicable) before presenting it as finished.
- If a skill file's stated convention conflicts with what you find in the actual codebase (a path, a naming pattern, a schema field), trust the codebase and flag the conflict — skill docs describe the intended pattern but can drift out of date.

## Open Items

- `data/features/` is stated above as the location for `.feature` files. `.claude/skills/write-bdd-feature.md` currently doesn't assume this and searches the repo instead, since the framework's originally documented directory tree didn't list this folder. Once confirmed, that skill should be simplified to use this path directly.
