import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  DEFAULT_SUITE_STATUS,
  SUITE_STATUSES,
  WIP_TAG,
  isWipSuite,
  resolveSuiteStatus,
} from '../../utils/core/SuiteStatus';

/**
 * config.status - a suite can be work in progress without failing the build.
 *
 * Before this field the framework had two states for a scenario file: every
 * locator resolved, or npm run validate exits 1. A generated suite waiting on
 * the codegen handoff had nowhere to sit, so one unfinished data file turned
 * CI red at the validate step - a gate failing for a reason unrelated to the
 * change, which is what trains a team to ignore the gate.
 *
 * What these tests pin is the shape of the exemption, because the risk of a
 * field like this is that it becomes a way to silence the gate entirely:
 *
 *   - an unrecognised value falls back to the strict status, never to wip
 *   - the schema and the module agree on the list of statuses
 *   - the auto-applied @wip tag is a tag the validator will accept
 *   - the repository's own gate is green
 *
 * Offline: reads files and runs the validator, which touches no network.
 */

const ROOT = path.join(__dirname, '../..');

test.describe('Suite status - resolution', () => {
  test('a suite with no status is ready', () => {
    expect(resolveSuiteStatus(undefined).status).toBe('ready');
    expect(resolveSuiteStatus(null).status).toBe('ready');
    expect(DEFAULT_SUITE_STATUS).toBe('ready');
    expect(isWipSuite(undefined)).toBe(false);
  });

  test('both documented statuses resolve without error', () => {
    for (const status of SUITE_STATUSES) {
      const result = resolveSuiteStatus(status);
      expect(result.status).toBe(status);
      expect(result.error).toBeUndefined();
    }
    expect(isWipSuite('wip')).toBe(true);
    expect(isWipSuite('ready')).toBe(false);
  });

  test('an unrecognised status falls back to ready and reports an error', () => {
    // The direction is the whole point. "WIP", "in-progress" and true are all
    // plausible typos, and treating any of them as an opt-in would silently
    // exempt a suite from the locator gate - the failure this field exists to
    // prevent. Falling back to the strict status turns a typo into a
    // validation error instead of a hole.
    for (const bad of ['WIP', 'in-progress', 'draft', true, 1, {}]) {
      const result = resolveSuiteStatus(bad);
      expect(result.status, `${JSON.stringify(bad)} must not resolve to wip`).toBe('ready');
      expect(result.error, `${JSON.stringify(bad)} must be reported`).toBeTruthy();
      expect(isWipSuite(bad)).toBe(false);
    }
  });
});

test.describe('Suite status - contracts', () => {
  test('the schema enum and SUITE_STATUSES agree', () => {
    const schema = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'schema/scenario-schema.json'), 'utf-8')
    );
    const schemaEnum = schema.properties?.config?.properties?.status?.enum;

    expect(schemaEnum, 'config.status is declared in the scenario schema').toBeDefined();
    expect([...schemaEnum].sort()).toEqual([...SUITE_STATUSES].sort());
  });

  test('the auto-applied @wip tag satisfies the tag pattern the validator enforces', () => {
    // The runner appends WIP_TAG to a wip suite's test titles. A malformed tag
    // fails silently - it never matches --grep - so it has to satisfy the same
    // pattern a hand-written tag does.
    const schema = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'schema/scenario-schema.json'), 'utf-8')
    );
    const pattern = schema.properties?.config?.properties?.tags?.items?.pattern;

    expect(pattern, 'the schema declares a tag pattern').toBeTruthy();
    expect(new RegExp(pattern).test(WIP_TAG)).toBe(true);
  });
});

test.describe('Suite status - the gate', () => {
  test('npm run validate passes with the repository as committed', () => {
    // The end-to-end assertion: a wip suite with unresolved stubs present in
    // data/scenarios does not fail the build. If this goes red, either a suite
    // regressed or the exemption stopped working - both worth knowing before CI
    // says so.
    let exitCode = 0;
    let output = '';
    try {
      output = execSync('npm run validate', { cwd: ROOT, encoding: 'utf-8', timeout: 120000 });
    } catch (error: any) {
      exitCode = error.status ?? 1;
      output = `${error.stdout || ''}${error.stderr || ''}`;
    }

    expect(exitCode, `validate exited ${exitCode}:\n${output}`).toBe(0);
  });

  test('a wip suite is named in the validator output rather than passing silently', () => {
    // An exemption nobody can see is how a temporary state becomes permanent.
    // Only assert the reporting when there is actually a wip suite to report,
    // so this stays true once the stubs are resolved and the suite goes ready.
    const scenariosDir = path.join(ROOT, 'data/scenarios');
    const wipFiles = fs
      .readdirSync(scenariosDir)
      .filter((file) => file.endsWith('.json'))
      .filter((file) => {
        const data = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf-8'));
        return !Array.isArray(data) && isWipSuite(data.config?.status);
      });

    test.skip(wipFiles.length === 0, 'no suite is currently marked wip');

    const output = execSync('npm run validate', { cwd: ROOT, encoding: 'utf-8', timeout: 120000 });
    expect(output).toContain('Work in progress');
    for (const file of wipFiles) {
      expect(output).toContain(file);
    }
  });
});
