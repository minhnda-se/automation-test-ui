---
description: Produce a concrete implementation plan for a change before writing code. Use before non-trivial refactors, new actions, or multi-file changes.
---

Plan the implementation for: $ARGUMENTS

Produce, without writing code yet:

1. Files that will be created or modified, and why
2. Order of operations (which layer first — Helper, ActionEngine, schema, docs, per `.claude/rules/architecture.md`)
3. Open questions that need an answer before starting
4. Risks — what existing behavior could this affect

Wait for confirmation before moving to implementation.
