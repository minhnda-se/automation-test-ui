/**
 * English-only enforcement for authored text.
 *
 * `.claude/rules/coding-standards.md` states the rule with "no exceptions", and
 * nothing enforced it. 53 Vietnamese test names accumulated across five suites,
 * 11 of them in a file generated the day before this check was written - the
 * same "written rule, no gate" pattern that let the action list drift before
 * Phase 11.
 *
 * The distinction that makes this checkable: the rule governs text *this team
 * writes*, not text *the application under test displays*. A scenario asserting
 * a Vietnamese error message is correct precisely because it quotes the app.
 * So the check is scoped to authored prose fields by name, and every value that
 * describes application behaviour - `data`, `url`, and every selector in
 * data/locators - is deliberately out of scope.
 *
 * Pure string handling: imported by scripts/validate-scenarios.ts and by
 * tests/framework/english-only.spec.ts, which is why it is not inside the
 * validator itself - that module runs its own entry point on import.
 */

/**
 * Anything outside printable ASCII. Deliberately blunt: the rule is not "no
 * Vietnamese", it is "English only", so a curly quote or an accented loanword
 * is flagged too and gets rewritten rather than argued about.
 */
const NON_ASCII = /[^\x00-\x7F]/;

/**
 * Scenario fields the rule applies to - the ones a person writes to describe
 * the test. Everything else in a step describes the application.
 */
export const AUTHORED_TEXT_FIELDS = ['scenario', 'testName', 'description', 'flowName'] as const;

export interface NonEnglishFinding {
  character: string;
  index: number;
  codePoint: string;
}

export function findNonEnglish(text: unknown): NonEnglishFinding | null {
  if (typeof text !== 'string') return null;

  const match = NON_ASCII.exec(text);
  if (!match) return null;

  const character = match[0];
  return {
    character,
    index: match.index,
    codePoint: `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`,
  };
}

export function containsNonEnglish(text: unknown): boolean {
  return findNonEnglish(text) !== null;
}

/**
 * Check one named field and return an error line, or null when it is clean.
 * `label` identifies the file and test case for the message.
 */
export function checkAuthoredText(field: string, value: unknown, label: string): string | null {
  const finding = findNonEnglish(value);
  if (!finding) return null;

  return `[FAIL] [${label}] "${field}" contains non-English text: ${JSON.stringify(finding.character)} (${finding.codePoint}) at position ${finding.index}. Authored text is English only - see .claude/rules/coding-standards.md. Expected application copy belongs in "data", which is not checked.`;
}
