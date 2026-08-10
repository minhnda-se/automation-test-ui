// File: utils/helpers/ElementHelper.ts
import { BaseHelper } from './BaseHelper';

export class ElementHelper extends BaseHelper {
  async goto(url: string) {
    await this.page.goto(url);
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

  async fill(locatorStr: string, data: any, stepElement: string) {
    if (data === undefined || data === null) {
      throw new Error(`[Lỗi JSON]: 'fill' tại ${stepElement} bắt buộc phải có data.`);
    }
    await this.page.locator(locatorStr).fill(String(data));
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
