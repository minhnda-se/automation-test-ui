import { test, expect } from '@playwright/test';
import { ElementHelper } from '../../src/helpers/ElementHelper';
import { AssertHelper } from '../../src/helpers/AssertHelper';

/**
 * The two P2 actions added on evidence rather than on a list: `clear` and
 * `verify_unchecked`.
 *
 * `clear` closes a hole with no workaround. scripts/validate-scenarios.ts
 * rejects a `fill` step with empty `data`, and .claude/rules/step-decomposition
 * forbids it independently, so before this action there was no expressible way
 * to empty a field - which blocks the common negative case of clearing a
 * pre-filled input and asserting the validation error.
 *
 * `verify_unchecked` closes an asymmetry: `check`, `uncheck` and
 * `verify_checked` all existed, the negative assertion did not, while
 * .claude/rules/testing.md requires a negative case per feature.
 *
 * Offline: page.setContent, no network.
 */

const FORM = `
  <form>
    <input id="email" type="text" value="pre-filled@example.com" />
    <input id="terms" type="checkbox" />
    <input id="newsletter" type="checkbox" checked />
  </form>
`;

test.describe('clear', () => {
  test('empties a pre-filled input', async ({ page }, testInfo) => {
    await page.setContent(FORM);
    const element = new ElementHelper(page, testInfo);

    await expect(page.locator('#email')).toHaveValue('pre-filled@example.com');

    await element.clear('#email');

    await expect(page.locator('#email')).toHaveValue('');
  });

  test('is the only expressible way to empty a field', async ({ page }, testInfo) => {
    // fill() rejects null/undefined at the helper, and the validator rejects an
    // empty-string `data` before a step ever reaches it. Pinning both halves
    // here so the justification for this action does not quietly evaporate if
    // one of them is relaxed later.
    await page.setContent(FORM);
    const element = new ElementHelper(page, testInfo);

    await expect(element.fill('#email', undefined, 'email')).rejects.toThrow();

    const notes = require('../../schema/action-notes.json');
    expect(notes.fill.note).toContain('non-empty');
  });

  test('is dispatched by the UI handler, not treated as an unknown action', async ({
    page,
  }, testInfo) => {
    await page.setContent(FORM);
    const { UIActionHandler } = require('../../src/handlers/UIActionHandler');
    const { DataManager } = require('../../src/core/DataManager');

    const handler = new UIActionHandler(new ElementHelper(page, testInfo), new DataManager({}));

    expect(handler.canHandle('clear')).toBe(true);

    await handler.handle({ action: 'clear', page: 'Form', element: 'email' }, '#email', undefined, 'clear email');

    await expect(page.locator('#email')).toHaveValue('');
  });
});

test.describe('verify_unchecked', () => {
  test('passes on an unchecked box', async ({ page }, testInfo) => {
    await page.setContent(FORM);
    const assert = new AssertHelper(page, testInfo);

    await assert.verifyUnchecked('#terms', 'terms checkbox is unchecked');
  });

  test('fails on a checked box', async ({ page }, testInfo) => {
    // The assertion has to be capable of failing - an assertion that cannot is
    // the defect Phase 13a found in verify_element_count.
    await page.setContent(FORM);
    const assert = new AssertHelper(page, testInfo);

    await expect(assert.verifyUnchecked('#newsletter', 'newsletter is unchecked')).rejects.toThrow();
  });

  test('is the exact negative of verify_checked', async ({ page }, testInfo) => {
    await page.setContent(FORM);
    const assert = new AssertHelper(page, testInfo);

    await assert.verifyChecked('#newsletter', 'newsletter is checked');
    await assert.verifyUnchecked('#terms', 'terms is unchecked');

    await expect(assert.verifyChecked('#terms', 'terms is checked')).rejects.toThrow();
    await expect(assert.verifyUnchecked('#newsletter', 'newsletter is unchecked')).rejects.toThrow();
  });
});

test.describe('Generated artifacts', () => {
  test('both actions reached all four generated artifacts', () => {
    // npm run actions:sync owns these. A hand-edited enum or union is either
    // overwritten by the next sync or caught by actions:check, so the thing
    // worth pinning is that the sync was actually run.
    const actions = require('../../schema/actions.json');
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '../..');

    const union = fs.readFileSync(path.join(root, 'src/types/actions.generated.ts'), 'utf-8');
    const docs = fs.readFileSync(path.join(root, 'docs/ACTIONS.md'), 'utf-8');
    const schema = JSON.parse(fs.readFileSync(path.join(root, 'schema/scenario-schema.json'), 'utf-8'));
    const schemaEnum = schema.definitions.Step.properties.action.enum;

    for (const action of ['clear', 'verify_unchecked']) {
      expect(actions.names, `actions.json lists ${action}`).toContain(action);
      expect(schemaEnum, `the schema enum lists ${action}`).toContain(action);
      expect(union, `the ActionType union lists ${action}`).toContain(`'${action}'`);
      expect(docs, `ACTIONS.md documents ${action}`).toContain(`\`${action}\``);
    }
  });
});
