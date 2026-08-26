import { test, expect, request as playwrightRequest } from '@playwright/test';
import * as http from 'http';
import { AddressInfo } from 'net';
import { APIHelper } from '../../utils/helpers/APIHelper';

/**
 * Phase 12 - `expected_status` on API actions.
 *
 * Before this, APIHelper only checked `response.ok()`, so any 2xx or 3xx passed
 * and everything else threw. A negative API test - one that expects a 404 or a
 * 422 - could not be written at all.
 *
 * Served from a throwaway localhost server rather than a real API, so these run
 * in CI and cannot go red because somebody else's endpoint was down. The status
 * comes from the path, e.g. /status/404.
 */

let server: http.Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const match = /^\/status\/(\d{3})$/.exec(req.url || '');
    const code = match ? Number(match[1]) : 200;
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ requested: code, path: req.url }));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function helper(testInfo: any): Promise<APIHelper> {
  return new APIHelper(await playwrightRequest.newContext(), testInfo);
}

test.describe('API expected_status', () => {
  test('a 404 passes when expected_status is 404', async ({}, testInfo) => {
    const api = await helper(testInfo);

    const body = await api.get(`${baseUrl}/status/404`, undefined, 404);

    expect(body).toEqual({ requested: 404, path: '/status/404' });
  });

  test('a 200 fails when expected_status is 404', async ({}, testInfo) => {
    const api = await helper(testInfo);

    await expect(api.get(`${baseUrl}/status/200`, undefined, 404)).rejects.toThrow(
      /expected status 404 but received 200/
    );
  });

  test('a 422 passes when expected_status is 422', async ({}, testInfo) => {
    const api = await helper(testInfo);

    await api.post(`${baseUrl}/status/422`, { any: 'body' }, undefined, 422);
  });

  test('without expected_status a 404 still throws, as before', async ({}, testInfo) => {
    const api = await helper(testInfo);

    await expect(api.get(`${baseUrl}/status/404`)).rejects.toThrow(/failed with status code 404/);
  });

  test('without expected_status a 200 still passes, as before', async ({}, testInfo) => {
    const api = await helper(testInfo);

    const body = await api.get(`${baseUrl}/status/200`);

    expect(body).toEqual({ requested: 200, path: '/status/200' });
  });

  test('expected_status is honoured on every API verb', async ({}, testInfo) => {
    const api = await helper(testInfo);

    await api.post(`${baseUrl}/status/201`, {}, undefined, 201);
    await api.put(`${baseUrl}/status/409`, {}, undefined, 409);
    await api.patch(`${baseUrl}/status/418`, {}, undefined, 418);
    await api.delete(`${baseUrl}/status/404`, undefined, 404);
  });

  test('a 204 passes when expected exactly, and fails when a 200 is demanded', async ({}, testInfo) => {
    const api = await helper(testInfo);

    await api.delete(`${baseUrl}/status/204`, undefined, 204);
    await expect(api.delete(`${baseUrl}/status/204`, undefined, 200)).rejects.toThrow(
      /expected status 200 but received 204/
    );
  });
});
