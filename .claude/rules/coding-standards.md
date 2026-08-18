# Coding Standards

1. **English only.** All source code, variable/function names, object keys, and comments — English, regardless of what language a requirement doc or conversation uses.
2. **Zero icon policy.** No emojis, icons, or graphical symbols in source code, config files, Markdown docs, JSON files, or terminal output strings.
3. **TypeScript in `utils/`** — strict typing preferred; avoid `any` in `utils/core/` and `utils/helpers/` where the existing code doesn't already use it.

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Locator `page` key | PascalCase | `LoginPage` |
| Locator `element` key | camelCase | `emailInput` |
| Test ID | `TC_[FEATURE]_[NN]` | `TC_LOGIN_01` |
| Action keyword | snake_case, verb-first | `upload_file` |
| Unresolved locator | literal string | `"TODO_LOCATOR"` |

Match whatever's already in a file you're editing over these defaults if they genuinely differ — consistency within a file beats a rule written before that file existed.
