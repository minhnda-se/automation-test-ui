import { test, expect } from '@playwright/test';
import { LocatorManager } from '../../utils/core/LocatorManager';
import { ElementHelper } from '../../utils/helpers/ElementHelper';
import { AssertHelper } from '../../utils/helpers/AssertHelper';

/**
 * Guards the Phase 13a invariant: LocatorManager returns selectors verbatim.
 *
 * The framework used to append `>> nth=0` to every selector that did not already
 * carry an index. That suppressed Playwright's strict-mode ambiguity error - the
 * only runtime signal that a locator is bound to the wrong element - and it made
 * verify_element_count measure exactly one element forever.
 *
 * These tests run against page.setContent, not a live site, so they cost nothing
 * and cannot go red because a third-party demo store was slow.
 */

const AMBIGUOUS_PAGE = `
  <ul class="inventory_list">
    <li class="item"><span class="item_name">Sauce Labs Backpack</span></li>
    <li class="item"><span class="item_name">Sauce Labs Bike Light</span></li>
    <li class="item"><span class="item_name">Sauce Labs Bolt T-Shirt</span></li>
  </ul>
`;

const locators = {
  InventoryPage: {
    ambiguousItemName: '.item_name',
    firstItemName: '.item_name >> nth=0',
    inventoryList: '.inventory_list',
  },
};

test.describe('Locator strictness', () => {
  test('getLocator returns an ambiguous selector unchanged', () => {
    const manager = new LocatorManager(locators);

    expect(manager.getLocator('InventoryPage', 'ambiguousItemName')).toBe('.item_name');
  });

  test('getLocator preserves an explicit index', () => {
    const manager = new LocatorManager(locators);

    expect(manager.getLocator('InventoryPage', 'firstItemName')).toBe('.item_name >> nth=0');
  });

  test('an ambiguous locator fails with a strict mode violation', async ({ page }, testInfo) => {
    await page.setContent(AMBIGUOUS_PAGE);
    const manager = new LocatorManager(locators);
    const elementHelper = new ElementHelper(page, testInfo);

    const resolved = manager.getLocator('InventoryPage', 'ambiguousItemName');

    await expect(elementHelper.click(resolved)).rejects.toThrow(/strict mode violation/);
  });

  test('an explicitly indexed locator resolves to the intended element', async ({ page }, testInfo) => {
    await page.setContent(AMBIGUOUS_PAGE);
    const manager = new LocatorManager(locators);
    const assertHelper = new AssertHelper(page, testInfo);

    const resolved = manager.getLocator('InventoryPage', 'firstItemName');

    await assertHelper.verifyText(resolved, 'Sauce Labs Backpack', 'first item name');
  });

  test('verify_element_count sees every match, not one', async ({ page }, testInfo) => {
    await page.setContent(AMBIGUOUS_PAGE);
    const manager = new LocatorManager(locators);
    const assertHelper = new AssertHelper(page, testInfo);

    const resolved = manager.getLocator('InventoryPage', 'ambiguousItemName');

    await assertHelper.verifyElementCount(resolved, 3, 'item count');
  });
});
