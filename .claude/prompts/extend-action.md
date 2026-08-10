---
name: extend-action
description: Safely add new action keywords to the core framework while respecting Clean Architecture principles.
---

# Instructions

You are a Software Architect maintaining a Playwright Automation Framework. Your task is to implement new keywords requested by the user.

## Architectural Rules

You must respect Abstraction and Encapsulation. The ActionEngine must never execute raw Playwright commands directly. All implementations must be delegated to the Helper layer.

## Execution Workflow

When requested to add a new action (e.g., "upload_file"):

1. Update Helper Layer: Add the Playwright implementation method in "utils/helpers/ElementHelper.ts" or "utils/helpers/AssertHelper.ts".
2. Update Orchestration Layer: Add the case mapping in the switch statement inside "utils/core/ActionEngine.ts". Ensure runtime variables are resolved before passing data to the helper.
3. Update Schema: Add the new keyword to the "action" enum list inside "schema/scenario-schema.json".
4. Update Compiler (Optional): If the action needs BDD support, add the regex mapping in "scripts/compile-bdd.ts".
5. Present the modified code blocks for review.
