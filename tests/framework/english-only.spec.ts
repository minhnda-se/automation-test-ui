import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { checkAuthoredText, containsNonEnglish, findNonEnglish } from '../../scripts/english-only';

/**
 * English only, enforced rather than asserted.
 *
 * .claude/rules/coding-standards.md says "English only ... no exceptions" and
 * nothing checked it, so 53 Vietnamese test names accumulated across five
 * suites - 11 of them in a file generated the day before this check existed.
 * Same shape as the action list before Phase 11: a written rule with no gate.
 *
 * The rule governs text this team writes, not text the application displays.
 * That distinction is the whole design, and the last test here pins it: a
 * scenario asserting a Vietnamese error message is correct precisely because it
 * quotes the app under test, and must keep passing.
 *
 * One regex covers two rules. The zero-icon policy in the same standards file
 * bans emoji in code and terminal output, and an emoji is non-ASCII, so the
 * code scan below enforces both at once. It found 23 of them in the validator's
 * own output on first run - including one this check had just introduced.
 *
 * Offline: reads files only.
 */

const ROOT = path.join(__dirname, '../..');

// Directories holding code and authored prose. data/ is covered by the
// validator, which knows which fields are authored and which quote the app.
const CODE_DIRS = ['utils', 'scripts', 'types', 'tests'];
const CODE_EXTENSIONS = ['.ts'];

/**
 * This spec is the one file that must contain non-English text: it feeds
 * samples to the detector it is testing. Exempting it by name keeps the scan
 * honest - a blanket "skip test files" would hide real drift in every other
 * spec.
 */
const FIXTURE_FILE = 'english-only.spec.ts';

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      files.push(...walk(full));
    } else if (CODE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

test.describe('English-only detection', () => {
  test('plain English passes', () => {
    expect(containsNonEnglish('[Auth] Standard user logs in successfully')).toBe(false);
    expect(containsNonEnglish('')).toBe(false);
    expect(findNonEnglish(undefined)).toBeNull();
    expect(checkAuthoredText('testName', 'Log in succeeds', 'demo.json -> TC_01')).toBeNull();
  });

  test('non-English is located precisely, not merely detected', () => {
    // The position and code point are what make the error actionable - a bare
    // "contains non-English text" leaves someone hunting through a 2000-line
    // scenario file for a character they cannot see.
    const finding = findNonEnglish('[Login] Đăng nhập');

    expect(finding).not.toBeNull();
    expect(finding!.character).toBe('Đ');
    expect(finding!.codePoint).toBe('U+0110');
    expect(finding!.index).toBe(8);
  });

  test('the error message names the data exemption', () => {
    // Someone hitting this error while writing a Vietnamese assertion needs to
    // know immediately that they should be in `data`, not that the rule is
    // wrong.
    const message = checkAuthoredText('testName', 'Đăng nhập', 'demo.json -> TC_01');

    expect(message).toContain('English only');
    expect(message).toContain('"data"');
  });

  test('non-ASCII that is not Vietnamese is caught too', () => {
    // The rule is "English only", not "no Vietnamese". A smart quote or an
    // accented loanword gets rewritten rather than argued about.
    expect(containsNonEnglish('Don\u2019t log in')).toBe(true);
    expect(containsNonEnglish('caf\u00e9 checkout')).toBe(true);
  });
});

test.describe('The repository is English', () => {
  test('no TypeScript file contains non-English text or an icon', () => {
    const offenders: string[] = [];

    for (const dir of CODE_DIRS) {
      const full = path.join(ROOT, dir);
      if (!fs.existsSync(full)) continue;

      for (const file of walk(full)) {
        if (path.basename(file) === FIXTURE_FILE) continue;

        const content = fs.readFileSync(file, 'utf-8');
        content.split('\n').forEach((line, index) => {
          const finding = findNonEnglish(line);
          if (finding) {
            offenders.push(
              `${path.relative(ROOT, file)}:${index + 1} ${JSON.stringify(finding.character)}`
            );
          }
        });
      }
    }

    expect(offenders, `non-English text in code:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('every scenario suite and test case name is English', () => {
    const scenariosDir = path.join(ROOT, 'data/scenarios');
    const offenders: string[] = [];

    for (const file of fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.json'))) {
      const data = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf-8'));
      if (Array.isArray(data)) continue;

      if (containsNonEnglish(data.scenario)) offenders.push(`${file} -> scenario`);

      for (const tc of data.testCases || []) {
        for (const field of ['testName', 'description']) {
          if (containsNonEnglish(tc[field])) {
            offenders.push(`${file} -> ${tc.testId} -> ${field}`);
          }
        }
      }
    }

    expect(offenders, `non-English authored text:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('expected application copy stays untouched', () => {
    // The check must not have been satisfied by translating the app's own
    // error messages, which would silently break those assertions. The booking
    // app renders Vietnamese - probed live in Phase 10b - so its `data` values
    // are correct as they are, and this test fails if someone "fixes" them.
    const booking = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'data/scenarios/booking-app-regen.json'), 'utf-8')
    );

    const nonEnglishData: string[] = [];
    for (const tc of booking.testCases || []) {
      const steps = [
        ...(tc.preconditions || []),
        ...(tc.steps || []),
        ...(tc.postconditions || []),
      ];
      for (const step of steps) {
        if (containsNonEnglish(step.data)) nonEnglishData.push(String(step.data));
      }
    }

    expect(
      nonEnglishData.length,
      'the booking app renders Vietnamese copy; those assertions must not be translated'
    ).toBeGreaterThan(0);
    expect(nonEnglishData).toContain('Email đã tồn tại');
  });
});
