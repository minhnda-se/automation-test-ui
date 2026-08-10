// File: utils/helpers/BaseHelper.ts
import { Page, TestInfo } from '@playwright/test';

export class BaseHelper {
  public page: Page;
  protected testInfo: TestInfo;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  // Tiện ích chụp ảnh dùng chung cho mọi file kế thừa
  public async captureEvidence(stepName: string, status: 'PASS' | 'FAIL') {
    const screenshot = await this.page.screenshot();
    await this.testInfo.attach(`[${status}] ${stepName}`, {
      body: screenshot,
      contentType: 'image/png',
    });
  }
}
