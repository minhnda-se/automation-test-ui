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

  async verifyNotVisible(locatorStr: string, stepDescription: string) {
    try {
      await expect(this.page.locator(locatorStr)).not.toBeVisible();
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyEnabled(locatorStr: string, stepDescription: string) {
    try {
      await expect(this.page.locator(locatorStr)).toBeEnabled();
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyDisabled(locatorStr: string, stepDescription: string) {
    try {
      await expect(this.page.locator(locatorStr)).toBeDisabled();
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyChecked(locatorStr: string, stepDescription: string) {
    try {
      await expect(this.page.locator(locatorStr)).toBeChecked();
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyText(locatorStr: string, data: any, stepElement?: string, stepDescription?: string) {
    if (data === undefined || data === null) {
      throw new Error(`[Lỗi JSON]: 'verify_text' tại ${stepElement || 'element'} bắt buộc có data.`);
    }
    const desc = stepDescription || `verify_text - ${stepElement}`;
    try {
      await expect(this.page.locator(locatorStr)).toHaveText(String(data));
      await this.captureEvidence(desc, 'PASS');
    } catch (error) {
      await this.captureEvidence(desc, 'FAIL');
      throw error;
    }
  }

  async verifyTextContains(
    locatorStr: string,
    data: any,
    stepElement?: string,
    stepDescription?: string
  ) {
    if (data === undefined || data === null) {
      throw new Error(
        `[Lỗi JSON]: 'verify_text_contains' tại ${stepElement || 'element'} bắt buộc có data.`
      );
    }
    const desc = stepDescription || `verify_text_contains - ${stepElement}`;
    try {
      const expectedString = String(data);
      await expect(this.page.locator(locatorStr)).toContainText(expectedString);
      await this.captureEvidence(desc, 'PASS');
    } catch (error) {
      await this.captureEvidence(desc, 'FAIL');
      throw error;
    }
  }

  async verifyNotContainsText(
    locatorStr: string,
    data: any,
    stepElement?: string,
    stepDescription?: string
  ) {
    if (data === undefined || data === null) {
      throw new Error(
        `[Lỗi JSON]: 'verify_not_contains_text' tại ${stepElement || 'element'} bắt buộc có data.`
      );
    }
    const desc = stepDescription || `verify_not_contains_text - ${stepElement}`;
    try {
      const expectedString = String(data).replace(/\s+/g, '');
      await expect(this.page.locator(locatorStr)).not.toContainText(expectedString);
      await this.captureEvidence(desc, 'PASS');
    } catch (error) {
      await this.captureEvidence(desc, 'FAIL');
      throw error;
    }
  }

  async verifyClassContains(
    locatorStr: string,
    data: any,
    stepElement?: string,
    stepDescription?: string
  ) {
    if (data === undefined || data === null) {
      throw new Error(
        `[Lỗi JSON]: 'verify_class_contains' tại ${stepElement || 'element'} bắt buộc có data.`
      );
    }
    const desc = stepDescription || `verify_class_contains - ${stepElement}`;
    try {
      const regexClass = new RegExp(String(data));
      await expect(this.page.locator(locatorStr)).toHaveClass(regexClass);
      await this.captureEvidence(desc, 'PASS');
    } catch (error) {
      await this.captureEvidence(desc, 'FAIL');
      throw error;
    }
  }

  async verifyNotContainsClass(
    locatorStr: string,
    data: any,
    stepElement?: string,
    stepDescription?: string
  ) {
    if (data === undefined || data === null) {
      throw new Error(
        `[Lỗi JSON]: 'verify_not_contains_class' tại ${stepElement || 'element'} bắt buộc có data.`
      );
    }
    const desc = stepDescription || `verify_not_contains_class - ${stepElement}`;
    try {
      const regexClass = new RegExp(String(data));
      await expect(this.page.locator(locatorStr)).not.toHaveClass(regexClass);
      await this.captureEvidence(desc, 'PASS');
    } catch (error) {
      await this.captureEvidence(desc, 'FAIL');
      throw error;
    }
  }

  async verifyUrlContains(data: any, stepDescription: string) {
    if (data === undefined || data === null) {
      throw new Error(`[Lỗi JSON]: 'verify_url_contains' bắt buộc có data.`);
    }
    try {
      const urlRegex = new RegExp(String(data));
      await expect(this.page).toHaveURL(urlRegex);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyAttribute(
    locatorStr: string,
    attributeName: string,
    expectedValue: any,
    stepDescription: string
  ) {
    try {
      await expect(this.page.locator(locatorStr)).toHaveAttribute(
        attributeName,
        new RegExp(String(expectedValue))
      );
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyElementCount(locatorStr: string, expectedCount: number, stepDescription: string) {
    try {
      await expect(this.page.locator(locatorStr)).toHaveCount(expectedCount);
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }

  async verifyVisualSnapshot(
    locatorStr: string,
    snapshotName: string,
    maxDiffPixelRatio: number = 0.05,
    stepDescription: string
  ) {
    const options = { maxDiffPixelRatio };
    try {
      if (locatorStr) {
        await expect(this.page.locator(locatorStr)).toHaveScreenshot(snapshotName, options);
      } else {
        await expect(this.page).toHaveScreenshot(snapshotName, options);
      }
      await this.captureEvidence(stepDescription, 'PASS');
    } catch (error) {
      await this.captureEvidence(stepDescription, 'FAIL');
      throw error;
    }
  }
}
