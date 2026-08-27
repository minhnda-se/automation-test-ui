import { BaseHelper } from './BaseHelper';
import * as path from 'path';

export class ElementHelper extends BaseHelper {
  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async click(locatorStr: string) {
    await this.page.locator(locatorStr).click();
  }

  async rightClick(locatorStr: string) {
    await this.page.locator(locatorStr).click({ button: 'right' });
  }

  async leftClick(locatorStr: string) {
    await this.page.locator(locatorStr).click({ button: 'left' });
  }

  async doubleClick(locatorStr: string) {
    await this.page.locator(locatorStr).dblclick();
  }

  async hover(locatorStr: string) {
    await this.page.locator(locatorStr).hover();
  }

  async fill(locatorStr: string, data: any, stepElement?: string) {
    if (data === undefined || data === null) {
      throw new Error(`[Lỗi JSON]: 'fill' tại ${stepElement || 'element'} bắt buộc phải có data.`);
    }
    await this.page.locator(locatorStr).fill(String(data));
  }

  async pressKey(locatorStr: string, key: string) {
    if (locatorStr) {
      await this.page.locator(locatorStr).press(key);
    } else {
      await this.page.keyboard.press(key);
    }
  }

  async selectOption(locatorStr: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      await this.page.locator(locatorStr).selectOption(value);
    } else {
      await this.page.locator(locatorStr).selectOption(String(value));
    }
  }

  async check(locatorStr: string) {
    await this.page.locator(locatorStr).check();
  }

  async uncheck(locatorStr: string) {
    await this.page.locator(locatorStr).uncheck();
  }

  // Playwright's clear() is fill('') plus the editability checks, which is why
  // this is not just fill(locator, ''): the framework rejects a fill step with
  // empty data - see scripts/validate-scenarios.ts - so emptying a field had no
  // expressible form before this action existed.
  async clear(locatorStr: string) {
    await this.page.locator(locatorStr).clear();
  }

  async uploadFile(locatorStr: string, relativeOrAbsolutePath: string) {
    const resolvedPath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(process.cwd(), relativeOrAbsolutePath);
    await this.page.locator(locatorStr).setInputFiles(resolvedPath);
  }

  async scrollTo(locatorStr: string) {
    await this.page.locator(locatorStr).scrollIntoViewIfNeeded();
  }

  async wait(ms: number) {
    await this.page.waitForTimeout(Number(ms) || 1000);
  }

  /**
   * Waits for a specific element to reach a state, instead of sleeping for a
   * fixed duration. Prefer this over wait() everywhere it applies: a fixed
   * sleep is both slower than it needs to be and still too short under load.
   */
  async waitForElement(
    locatorStr: string,
    state: 'attached' | 'detached' | 'visible' | 'hidden' = 'visible',
    timeout: number = 10000
  ) {
    await this.page.locator(locatorStr).waitFor({ state, timeout: Number(timeout) || 10000 });
  }

  async switchNewTab() {
    const context = this.page.context();
    const pages = context.pages();

    if (pages.length > 1) {
      this.page = pages[pages.length - 1];
    } else {
      this.page = await context.waitForEvent('page');
    }

    await this.page.bringToFront();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getText(locatorStr: string): Promise<string> {
    const text = await this.page.locator(locatorStr).innerText();
    return text.trim();
  }
}
