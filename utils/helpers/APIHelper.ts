import { APIRequestContext, TestInfo } from '@playwright/test';

export class APIHelper {
  private request: APIRequestContext;
  private testInfo: TestInfo;

  constructor(request: APIRequestContext, testInfo: TestInfo) {
    this.request = request;
    this.testInfo = testInfo;
  }

  async post(url: string, data: any, headers?: any) {
    const response = await this.request.post(url, { data, headers });
    const responseBody = await response.json().catch(() => ({}));

    // Gắn log API vào HTML Report để dễ truy vết
    await this.testInfo.attach(`[API POST] ${url}`, {
      body: JSON.stringify(
        { requestBody: data, status: response.status(), response: responseBody },
        null,
        2
      ),
      contentType: 'application/json',
    });

    if (!response.ok()) throw new Error(`API POST thất bại với mã lỗi ${response.status()}`);
    return responseBody;
  }

  async get(url: string, headers?: any) {
    const response = await this.request.get(url, { headers });
    const responseBody = await response.json().catch(() => ({}));

    await this.testInfo.attach(`[API GET] ${url}`, {
      body: JSON.stringify({ status: response.status(), response: responseBody }, null, 2),
      contentType: 'application/json',
    });

    if (!response.ok()) throw new Error(`API GET thất bại với mã lỗi ${response.status()}`);
    return responseBody;
  }

  async delete(url: string, headers?: any) {
    const response = await this.request.delete(url, { headers });

    await this.testInfo.attach(`[API DELETE] ${url}`, {
      body: `Status: ${response.status()}`,
      contentType: 'text/plain',
    });

    if (!response.ok()) throw new Error(`API DELETE thất bại với mã lỗi ${response.status()}`);
  }
}
