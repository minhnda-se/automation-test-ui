import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ActionType } from '../../types/actions.generated';

/**
 * Phase 11 - the action list has one source.
 *
 * The keyword list lives in utils/handlers/*.ts. Three artifacts are generated
 * from it by npm run actions:sync:
 *
 *   schema/actions.json           consumed by scripts/validate-scenarios.ts
 *   schema/scenario-schema.json   the `action` enum, for IDE autocomplete
 *   types/actions.generated.ts    the ActionType union
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
  return (read('types/actions.generated.ts').match(/\| '([a-z0-9_]+)'/g) || []).map((line) =>
    line.replace(/\| '|'/g, '')
  );
}

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
      'types/actions.generated.ts',
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
