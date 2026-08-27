import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AssertHelper } from '../../utils/helpers/AssertHelper';
import { ElementHelper } from '../../utils/helpers/ElementHelper';
import { checkTestCaseAsserts, isAssertion } from '../../scripts/assertion-presence';

/**
 * Every test case asserts something, and verify_value can see what was typed.
 *
 * An audit of all 115 test cases found 9 that asserted nothing - they ran steps
 * and verified nothing, so they passed as long as the clicks landed. Their
 * names claimed otherwise: "Close button dismisses the log in modal" clicked
 * close and never looked at the modal, so it passed even if close did nothing.
 *
 * Third appearance of this defect class here, after the blanket nth=0 that made
 * verify_element_count measure one element forever (Phase 13a) and DDT_01's
 * assertion-free rows (D2). Both were fixed one instance at a time; this pins
 * the property.
 *
 * Two of the nine could not be fixed with the actions that existed:
 * verify_attribute reads the HTML attribute, which typing never updates, so
 * "Enter customer details" had no way to check the details were entered. Hence
 * verify_value, and hence its tests here.
 *
 * Offline: page.setContent and file reads.
 */

const ROOT = path.join(__dirname, '../..');

const FORM = `
  <form>
    <input id="name" type="text" value="original" />
    <input id="empty" type="text" />
  </form>
`;

test.describe('verify_value', () => {
  test('sees a typed value that verify_attribute cannot', async ({ page }, testInfo) => {
    // The justification for the action, expressed as a test. Typing updates the
    // DOM value property and leaves the HTML attribute alone, so toHaveAttribute
    // still reports the original. If this ever stops being true, verify_value
    // has lost its reason to exist and this test says so.
    await page.setContent(FORM);
    const element = new ElementHelper(page, testInfo);
    const assert = new AssertHelper(page, testInfo);

    await element.fill('#name', 'typed by the test', 'name');

    await expect(page.locator('#name')).toHaveAttribute('value', 'original');
    await assert.verifyValue('#name', 'typed by the test', 'name', 'name holds the typed value');
  });

  test('fails when the value differs', async ({ page }, testInfo) => {
    await page.setContent(FORM);
    const assert = new AssertHelper(page, testInfo);

    await expect(
      assert.verifyValue('#name', 'something else', 'name', 'name holds the typed value')
    ).rejects.toThrow();
  });

  test('rejects a missing expected value rather than passing vacuously', async ({
    page,
  }, testInfo) => {
    // An assertion with nothing to compare against is the defect this whole
    // change is about, in miniature.
    await page.setContent(FORM);
    const assert = new AssertHelper(page, testInfo);

    await expect(assert.verifyValue('#empty', undefined, 'empty', 'no expected value')).rejects.toThrow(
      /requires "data"/
    );
  });
});

test.describe('Assertion presence', () => {
  test('recognises the verify_* family and nothing else', () => {
    expect(isAssertion('verify_visible')).toBe(true);
    expect(isAssertion('verify_value')).toBe(true);
    expect(isAssertion('click')).toBe(false);
    expect(isAssertion('fill')).toBe(false);
    expect(isAssertion(undefined)).toBe(false);
  });

  test('a test case with no assertion is rejected', () => {
    const message = checkTestCaseAsserts(
      { steps: [{ action: 'goto' }, { action: 'click' }] },
      'demo.json -> TC_01'
    );

    expect(message).toContain('no assertion');
    expect(message).toContain('step-decomposition.md');
  });

  test('an assertion in postconditions counts', () => {
    expect(
      checkTestCaseAsserts(
        { steps: [{ action: 'click' }], postconditions: [{ action: 'verify_visible' }] },
        'demo.json -> TC_01'
      )
    ).toBeNull();
  });

  test('an assertion in preconditions does not count', () => {
    // Setup succeeding is not the behaviour under test. A test whose only
    // verify_* sits in preconditions still never checks its own subject.
    const message = checkTestCaseAsserts(
      { preconditions: [{ action: 'verify_visible' }], steps: [{ action: 'click' }] },
      'demo.json -> TC_01'
    );

    expect(message).toContain('no assertion');
  });

  test('call_flow is exempt, because the flow may hold the assertion', () => {
    expect(
      checkTestCaseAsserts(
        { steps: [{ action: 'call_flow', flow: 'login' }] },
        'demo.json -> TC_01'
      )
    ).toBeNull();
  });

  test('every test case in the repository asserts something', () => {
    const scenariosDir = path.join(ROOT, 'data/scenarios');
    const offenders: string[] = [];

    for (const file of fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.json'))) {
      const data = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf-8'));
      const cases = Array.isArray(data) ? data : data.testCases || [];

      for (const testCase of cases) {
        const message = checkTestCaseAsserts(testCase, `${file} -> ${testCase.testId}`);
        if (message) offenders.push(`${file} -> ${testCase.testId}`);
      }
    }

    expect(offenders, `test cases that cannot fail:\n${offenders.join('\n')}`).toEqual([]);
  });
});
