// File: utils/helpers/AssertHelper.ts
import { expect } from '@playwright/test';
import { BaseHelper } from './BaseHelper';

export class AssertHelper extends BaseHelper {
  async verifyVisible(locatorStr: string, stepDescription: string) {
    try {
      await expect(this.page.locator(locatorStr)).toBeVisible();
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyText(locatorStr: string, data: any, stepElement: string, stepDescription: string) {
    if (data === undefined || data === null)
      throw new Error(`[Lỗi JSON]: 'verify_text' tại ${stepElement} bắt buộc có data.`);
    try {
      await expect(this.page.locator(locatorStr)).toHaveText(String(data));
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyTextContains(
    locatorStr: string,
    data: any,
    stepElement: string,
    stepDescription: string
  ) {
    if (data === undefined || data === null)
      throw new Error(`[Lỗi JSON]: 'verify_text_contains' tại ${stepElement} bắt buộc có data.`);
    try {
      const expectedString = String(data).replace(/\s+/g, '');
      await expect(this.page.locator(locatorStr)).toContainText(expectedString);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyNotContainsText(
    locatorStr: string,
    data: any,
    stepElement: string,
    stepDescription: string
  ) {
    if (data === undefined || data === null)
      throw new Error(
        `[Lỗi JSON]: 'verify_not_contains_text' tại ${stepElement} bắt buộc có data.`
      );
    try {
      const expectedString = String(data).replace(/\s+/g, '');
      await expect(this.page.locator(locatorStr)).not.toContainText(expectedString);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyClassContains(
    locatorStr: string,
    data: any,
    stepElement: string,
    stepDescription: string
  ) {
    if (data === undefined || data === null)
      throw new Error(`[Lỗi JSON]: 'verify_class_contains' tại ${stepElement} bắt buộc có data.`);
    try {
      const regexClass = new RegExp(String(data));
      await expect(this.page.locator(locatorStr)).toHaveClass(regexClass);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyNotContainsClass(
    locatorStr: string,
    data: any,
    stepElement: string,
    stepDescription: string
  ) {
    if (data === undefined || data === null)
      throw new Error(
        `[Lỗi JSON]: 'verify_not_contains_class' tại ${stepElement} bắt buộc có data.`
      );
    try {
      const regexClass = new RegExp(String(data));
      await expect(this.page.locator(locatorStr)).not.toHaveClass(regexClass);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyUrlContains(data: any, stepDescription: string) {
    if (data === undefined || data === null)
      throw new Error(`[Lỗi JSON]: 'verify_url_contains' bắt buộc có data.`);
    try {
      const urlRegex = new RegExp(String(data));
      await expect(this.page).toHaveURL(urlRegex);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }
}
