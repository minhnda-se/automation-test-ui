import { test, expect } from '@playwright/test';
import { NetworkActionHandler } from '../../src/handlers/NetworkActionHandler';
import { DataManager } from '../../src/core/DataManager';

/**
 * Phase 12 companion guard.
 *
 * `NetworkActionHandler` used to read `step.status || step.expected_status || 200`,
 * which is what made one field name mean two different things: a mocked response
 * status here, and an assertion target on the API actions. The fallback is gone.
 *
 * These tests pin both halves of that: `status` still drives the mock, and
 * `expected_status` is ignored by `mock_route`. Without the second test, someone
 * could reinstate the fallback and nothing would notice - no scenario in the
 * repository uses `expected_status` on a mock, so a live run would not catch it.
 *
 * Offline: routes are fulfilled by Playwright itself, nothing leaves the machine.
 */

const MOCK_URL = 'https://framework-guard.invalid/api/thing';

async function statusOf(page: import('@playwright/test').Page): Promise<number> {
  await page.setContent('<html><body>guard</body></html>');
  return page.evaluate(async (url) => {
    const res = await fetch(url);
    return res.status;
  }, MOCK_URL);
}

test.describe('mock_route status', () => {
  test('status drives the mocked response', async ({ page }) => {
    const handler = new NetworkActionHandler(page, new DataManager());

    await handler.handle(
      { action: 'mock_route', url: MOCK_URL, status: 503, mockData: { ok: false } } as never,
      '',
      undefined,
      'mock'
    );

    expect(await statusOf(page)).toBe(503);
  });

  test('mock_route ignores expected_status', async ({ page }) => {
    const handler = new NetworkActionHandler(page, new DataManager());

    await handler.handle(
      { action: 'mock_route', url: MOCK_URL, expected_status: 503, mockData: { ok: true } } as never,
      '',
      undefined,
      'mock'
    );

    // 200, not 503: expected_status belongs to the API actions now.
    expect(await statusOf(page)).toBe(200);
  });

  test('status defaults to 200 when omitted', async ({ page }) => {
    const handler = new NetworkActionHandler(page, new DataManager());

    await handler.handle(
      { action: 'mock_route', url: MOCK_URL, mockData: { ok: true } } as never,
      '',
      undefined,
      'mock'
    );

    expect(await statusOf(page)).toBe(200);
  });
});
