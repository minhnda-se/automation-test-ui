# Documentation

- When `.claude/skills/extend-action/SKILL.md` is used to add a new action, update the README's Supported Actions table (or equivalent project docs) so it doesn't silently drift from `ActionEngine.ts`.
- If a new action affects the reference action list embedded in `.claude/skills/generate-json-test/SKILL.md`, flag it for update too — that list is a fallback reference, not the source of truth (`ActionEngine.ts` is), but a stale fallback still misleads.
- Keep Helper methods with a one-line comment on non-obvious Playwright behavior (retry logic, timeout handling) — not a comment restating what the method name already says.
- When a skill file's stated convention conflicts with what's actually in the codebase (a path, a naming pattern), trust the codebase and update the skill file rather than leaving the drift for the next person to rediscover.
