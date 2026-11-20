import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ActionType } from '../../src/types/actions.generated';

/**
 * Phase 11 - the action list has one source.
 *
 * The keyword list lives in src/handlers/*.ts. Three artifacts are generated
 * from it by npm run actions:sync:
 *
 *   schema/actions.json             consumed by scripts/validate-scenarios.ts
 *   schema/scenario-schema.json     the `action` enum, for IDE autocomplete
 *   src/types/actions.generated.ts  the ActionType union
 *
 * Two of those were hand-maintained until now, and nothing checked they agreed.
 * `npm run actions:check` catches drift in CI; this suite catches it in a plain
 * test run too, and pins the invariant rather than the command.
 *
 * Offline: reads files, nothing else.
 */

const ROOT = path.join(__dirname, '../..');

function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf-8');
}

function schemaEnum(): string[] {
  const schema = JSON.parse(read('schema/scenario-schema.json'));

  const find = (node: unknown): string[] | null => {
    if (node && typeof node === 'object') {
      const candidate = node as Record<string, unknown>;
      if (Array.isArray(candidate.enum) && (candidate.enum as string[]).includes('click')) {
        return candidate.enum as string[];
      }
      for (const value of Object.values(candidate)) {
        const found = find(value);
        if (found) return found;
      }
    }
    return null;
  };

  const found = find(schema);
  expect(found, 'the scenario schema has an action enum').not.toBeNull();
  return found as string[];
}

function unionMembers(): string[] {
  // Parsed from the generated file rather than reflected, because a TypeScript
  // union has no runtime representation to inspect.
  return (read('src/types/actions.generated.ts').match(/\| '([a-z0-9_]+)'/g) || []).map((line) =>
    line.replace(/\| '|'/g, '')
  );
}

/**
 * Counts written into prose are the last hand-maintained derivative of the
 * generated action list, and they have now drifted twice in two commits - 40 to
 * 42 when `clear` and `verify_unchecked` landed, 42 to 43 the next day with
 * `verify_value`. Generating them into five documents would be worse than the
 * problem; failing loudly when they disagree costs nothing, which is what these
 * tests already do for every other artifact.
 */
const DOCS_CLAIMING_A_TOTAL = [
  'README.md',
  '.claude/CLAUDE.md',
  '.claude/rules/bdd.md',
  '.claude/skills/write-bdd-feature/SKILL.md',
];

test.describe('Documented action counts', () => {
  test('every prose total matches the generated action list', () => {
    const total = JSON.parse(read('schema/actions.json')).names.length;
    const wrong: string[] = [];

    for (const doc of DOCS_CLAIMING_A_TOTAL) {
      // "40 actions", "42 action keywords" - the shapes actually in use.
      for (const match of read(doc).matchAll(/(\d+)\s+action(?:\s+keywords?|s)\b/g)) {
        if (Number(match[1]) !== total) {
          wrong.push(doc + ': claims ' + match[1] + ', actual ' + total);
        }
      }
    }

    expect(wrong, 'stale action counts: ' + wrong.join(', ')).toEqual([]);
  });

  test('the README per-handler table sums to the generated total', () => {
    const total = JSON.parse(read('schema/actions.json')).names.length;
    const rows = [...read('README.md').matchAll(/\|\s*`(\w+ActionHandler)`\s*\|\s*(\d+)\s*\|/g)];

    expect(rows.length, 'the README documents a per-handler count table').toBeGreaterThan(0);

    const sum = rows.reduce((acc, row) => acc + Number(row[2]), 0);
    expect(sum, 'per-handler counts sum to ' + sum + ', generated list has ' + total).toBe(total);
  });
});

test.describe('Action list single source', () => {
  test('actions.json and the schema enum agree, in the same order', () => {
    expect(schemaEnum()).toEqual(JSON.parse(read('schema/actions.json')).names);
  });

  test('actions.json and the ActionType union agree, in the same order', () => {
    expect(unionMembers()).toEqual(JSON.parse(read('schema/actions.json')).names);
  });

  test('the count in actions.json matches the list it ships', () => {
    const reference = JSON.parse(read('schema/actions.json'));

    expect(reference.names).toHaveLength(reference.count);
  });

  test('every generated artifact is present', () => {
    for (const file of [
      'schema/actions.json',
      'schema/scenario-schema.json',
      'src/types/actions.generated.ts',
      'docs/ACTIONS.md',
    ]) {
      expect(fs.existsSync(path.join(ROOT, file)), `${file} exists`).toBe(true);
    }
  });

  test('the generated union is assignable, so a stale union breaks the build', () => {
    // Compile-time proof: if actions:sync had not run, these would not typecheck.
    const sample: ActionType[] = ['click', 'api_get', 'mock_route', 'call_flow'];

    expect(sample).toHaveLength(4);
  });
});
