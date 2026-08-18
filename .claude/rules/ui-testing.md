---
paths:
  - "utils/helpers/ElementHelper.ts"
  - "data/locators/**/*.json"
---

# UI Testing & Locators

## Locator reference format

Steps use separate `page` (PascalCase) and `element` (camelCase) fields — never a combined dot-notation string, never a raw selector inline in a scenario step.

```json
{ "action": "fill", "page": "LoginPage", "element": "emailInput", "data": "{{RANDOM_EMAIL}}" }
```

## Selector quality hierarchy (most to least resilient)

1. `data-testid` — purpose-built, survives styling/copy changes.
2. Role + accessible name / `aria-label` — tied to semantics, survives most redesigns.
3. Stable `id` — only if clearly not auto-generated (watch for hashes/UUIDs).
4. Unique stable visible text — fine for fixed copy, risky if localized/dynamic.
5. Structural CSS (class chains, `nth-child`) — last resort, brittle.
6. XPath — only when nothing above works.

## Unresolved locators

Use `"TODO_LOCATOR"` as the value when the real selector isn't known yet — never fabricate one. Resolve via `npx playwright codegen <url>`, or `.claude/skills/map-codegen-locators/SKILL.md` if a raw Codegen recording already exists.

## Fixing a broken locator

Diagnose the actual cause first (dead selector vs. timing vs. intentional app change) — see `.claude/skills/fix-locator/SKILL.md`. Element-based actions resolve through `LocatorManager`, so a working selector still needs to go through that path to keep auto-healing intact.
