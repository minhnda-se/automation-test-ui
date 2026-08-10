import { APIRequestContext, Page, TestInfo } from '@playwright/test';
import { DataManager } from './DataManager';
import { LocatorManager } from './LocatorManager';
import { ElementHelper } from '../helpers/ElementHelper';
import { AssertHelper } from '../helpers/AssertHelper';
import { APIHelper } from '../helpers/APIHelper';

export class ActionEngine {
  private dataManager: DataManager;
  private locatorManager: LocatorManager;
  private element: ElementHelper;
  private assert: AssertHelper;
  private api: APIHelper;

  constructor(
    page: Page,
    request: APIRequestContext,
    testInfo: TestInfo,
    locators: any,
    dataRow: Record<string, string> = {}
  ) {
    this.dataManager = new DataManager(dataRow);
    this.locatorManager = new LocatorManager(locators);
    this.element = new ElementHelper(page, testInfo);
    this.assert = new AssertHelper(page, testInfo);
    this.api = new APIHelper(request, testInfo);
  }

  async executeStep(step: any) {
    const locatorStr = this.locatorManager.getLocator(step.page, step.element);
    const resolvedData = this.dataManager.resolve(step.data);
    const stepDesc = `${step.action} - ${step.element || 'URL'}`;

    switch (step.action) {
      // (Interactions)
      case 'goto':
        await this.element.goto(resolvedData);
        break;
      case 'click':
        await this.element.click(locatorStr);
        break;
      case 'right_click':
        await this.element.rightClick(locatorStr);
        break;
      case 'left_click':
        await this.element.leftClick(locatorStr);
        break;
      case 'double_click':
        await this.element.doubleClick(locatorStr);
        break;
      case 'fill':
        await this.element.fill(locatorStr, resolvedData, step.element);
        break;
      case 'switch_new_tab':
        await this.element.switchNewTab();
        this.assert.page = this.element.page; // Đồng bộ lại page cho assert sau khi nhảy tab
        break;
      case 'store_text':
        const text = await this.element.getText(locatorStr);
        this.dataManager.saveRuntimeVariable(step.variable, text);
        break;

      // (Assertions)
      case 'verify_visible':
        await this.assert.verifyVisible(locatorStr, stepDesc);
        break;
      case 'verify_text':
        await this.assert.verifyText(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_text_contains':
        await this.assert.verifyTextContains(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_not_contains_text':
        await this.assert.verifyNotContainsText(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_not_contains_class':
        await this.assert.verifyNotContainsClass(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_class_contains':
        await this.assert.verifyClassContains(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_url_contains':
        await this.assert.verifyUrlContains(resolvedData, stepDesc);
        break;

      // API
      case 'api_post':
        if (!step.url) throw new Error(`[Lỗi JSON]: 'api_post' bắt buộc phải có "url"`);
        // Bắn API bằng data đã được nội suy (biến ngẫu nhiên, runtime var)
        const postRes = await this.api.post(step.url, resolvedData, step.headers);

        // Tính năng cực xịn: Bắn API xong, chộp lấy 1 trường trong JSON trả về để lưu làm biến tạm
        // Ví dụ: Lưu Token, Lưu User ID để dùng cho UI step phía sau
        if (step.store_response) {
          const valueToStore = postRes[step.store_response.key];
          this.dataManager.saveRuntimeVariable(step.store_response.variable, valueToStore);
        }
        break;

      case 'api_get':
        if (!step.url) throw new Error(`[Lỗi JSON]: 'api_get' bắt buộc phải có "url"`);
        // URL có thể chứa biến động: /api/users/{{MY_USER_ID}}
        const getUrl = this.dataManager.resolve(step.url);
        await this.api.get(getUrl, step.headers);
        break;

      case 'api_delete':
        if (!step.url) throw new Error(`[Lỗi JSON]: 'api_delete' bắt buộc phải có "url"`);
        const deleteUrl = this.dataManager.resolve(step.url);
        await this.api.delete(deleteUrl, step.headers);
        break;

      default:
        throw new Error(`Action không được hỗ trợ: ${step.action}`);
    }
  }
}
