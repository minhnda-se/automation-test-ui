import { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';

export class APIHelper {
  private request: APIRequestContext;
  private testInfo: TestInfo;

  constructor(request: APIRequestContext, testInfo: TestInfo) {
    this.request = request;
    this.testInfo = testInfo;
  }

  /**
   * Two modes, deliberately.
   *
   * With `expectedStatus`, the status must match exactly - that is what makes a
   * negative API test expressible: a step expecting 404 fails on a 200 just as
   * loudly as on a 500.
   *
   * Without it, the original `response.ok()` behaviour is kept, so every existing
   * scenario behaves exactly as before.
   */
  private assertStatus(response: APIResponse, method: string, expectedStatus?: number): void {
    const actual = response.status();

    if (expectedStatus !== undefined) {
      if (actual !== expectedStatus) {
        throw new Error(
          `API ${method} expected status ${expectedStatus} but received ${actual} (${response.url()})`
        );
      }
      return;
    }

    if (!response.ok()) {
      throw new Error(`API ${method} failed with status code ${actual} (${response.url()})`);
    }
  }

  /** Attaches the request/response pair to the report so a failure is traceable without a re-run. */
  private async attach(
    method: string,
    url: string,
    response: APIResponse,
    body: unknown,
    requestBody?: unknown,
    expectedStatus?: number
  ): Promise<void> {
    const payload: Record<string, unknown> = { status: response.status(), response: body };
    if (requestBody !== undefined) payload.requestBody = requestBody;
    if (expectedStatus !== undefined) payload.expectedStatus = expectedStatus;

    await this.testInfo.attach(`[API ${method}] ${url}`, {
      body: JSON.stringify(payload, null, 2),
      contentType: 'application/json',
    });
  }

  async post(url: string, data: any, headers?: any, expectedStatus?: number) {
    const response = await this.request.post(url, { data, headers });
    const responseBody = await response.json().catch(() => ({}));

    await this.attach('POST', url, response, responseBody, data, expectedStatus);
    this.assertStatus(response, 'POST', expectedStatus);
    return responseBody;
  }

  async get(url: string, headers?: any, expectedStatus?: number) {
    const response = await this.request.get(url, { headers });
    const responseBody = await response.json().catch(() => ({}));

    await this.attach('GET', url, response, responseBody, undefined, expectedStatus);
    this.assertStatus(response, 'GET', expectedStatus);
    return responseBody;
  }

  async put(url: string, data: any, headers?: any, expectedStatus?: number) {
    const response = await this.request.put(url, { data, headers });
    const responseBody = await response.json().catch(() => ({}));

    await this.attach('PUT', url, response, responseBody, data, expectedStatus);
    this.assertStatus(response, 'PUT', expectedStatus);
    return responseBody;
  }

  async patch(url: string, data: any, headers?: any, expectedStatus?: number) {
    const response = await this.request.patch(url, { data, headers });
    const responseBody = await response.json().catch(() => ({}));

    await this.attach('PATCH', url, response, responseBody, data, expectedStatus);
    this.assertStatus(response, 'PATCH', expectedStatus);
    return responseBody;
  }

  async delete(url: string, headers?: any, expectedStatus?: number) {
    const response = await this.request.delete(url, { headers });

    await this.testInfo.attach(`[API DELETE] ${url}`, {
      body: JSON.stringify(
        expectedStatus !== undefined
          ? { status: response.status(), expectedStatus }
          : { status: response.status() },
        null,
        2
      ),
      contentType: 'application/json',
    });

    this.assertStatus(response, 'DELETE', expectedStatus);
  }
}
