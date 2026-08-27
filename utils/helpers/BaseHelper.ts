// File: utils/helpers/BaseHelper.ts
import { Page, TestInfo } from '@playwright/test';

export class BaseHelper {
  public page: Page;
  protected testInfo: TestInfo;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  // Attaches to the Playwright report rather than writing to disk, so evidence
  // travels with the test result instead of needing a separate artifact path.
  public async captureEvidence(stepName: string, status: 'PASS' | 'FAIL') {
    const screenshot = await this.page.screenshot();
    await this.testInfo.attach(`[${status}] ${stepName}`, {
      body: screenshot,
      contentType: 'image/png',
    });
  }
}
