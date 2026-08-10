# Global Project Context and Agent Rules

## Project Overview

This workspace contains a Playwright Hybrid Keyword-Driven Framework. The core engine is built with TypeScript, while test execution relies on JSON scenario files and Gherkin feature files.

## Strict Coding Standards

You must adhere to the following rules in all your responses, generated code, and file modifications:

1. Language Requirement: All source code, variable names, function names, object keys, and code comments must be written exclusively in English.
2. Zero Icon Policy: Do not use any emojis, icons, or graphical symbols in source code, configuration files, Markdown documentation, JSON files, or terminal output strings.
3. Clean Architecture: Strictly follow the Single Responsibility Principle. The core orchestration logic (located in "utils/core/") must remain independent of the execution wrappers (located in "utils/helpers/").

## Framework Workflows

- Test Scenarios: Test cases are written in JSON format and must validate against "schema/scenario-schema.json".
- Locators: UI elements are centralized in JSON files under "data/locators/". Do not hardcode CSS/XPath selectors inside test scenarios.
- BDD Integration: Feature files written in "data/features/" are parsed and compiled into JSON scenarios using the script at "scripts/compile-bdd.ts".

## Agent Responsibilities

When asked to generate test cases or update the framework, automatically read the relevant requirement documents in the "docs/" directory and apply the rules defined in this file. Always verify that your JSON output is structurally valid before presenting it.
