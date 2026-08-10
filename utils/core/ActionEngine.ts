import { APIRequestContext, Page, TestInfo } from '@playwright/test';
import { DataManager } from './DataManager';
import { LocatorManager } from './LocatorManager';
import { ElementHelper } from '../helpers/ElementHelper';
import { AssertHelper } from '../helpers/AssertHelper';
import { APIHelper } from '../helpers/APIHelper';
import { AutoHealer } from './AutoHealer';

export class ActionEngine {
  private dataManager: DataManager;
  private locatorManager: LocatorManager;
  private element: ElementHelper;
  private assert: AssertHelper;
  private api: APIHelper;
  private autoHealer: AutoHealer;

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

    // Defaulting locator file name for AutoHealer
    this.autoHealer = new AutoHealer(page, 'locators.json');
  }

  async executeStep(step: any, isRetry: boolean = false): Promise<void> {
    const locatorStr =
      step.page && step.element ? this.locatorManager.getLocator(step.page, step.element) : '';
    const stepDesc = `${step.action} - ${step.element || step.url || ''}`;

    let resolvedData = step.data;
    if (typeof step.data === 'object' && step.data !== null) {
      const strData = JSON.stringify(step.data);
      resolvedData = JSON.parse(this.dataManager.resolve(strData));
    } else {
      resolvedData = this.dataManager.resolve(step.data);
    }

    try {
      await this.performAction(step, locatorStr, resolvedData, stepDesc);
    } catch (error: any) {
      // If a timeout error occurs and it has not been retried yet, trigger the Auto-Healer
      if (
        !isRetry &&
        step.page &&
        step.element &&
        error.message &&
        error.message.includes('Timeout')
      ) {
        console.warn(`[Engine] Locator failed for ${step.element}. Triggering Auto-Healer...`);
        try {
          const newLocator = await this.autoHealer.healLocator(step.page, step.element, locatorStr);

          // Update the runtime locator manager with the newly generated locator
          this.locatorManager.updateRuntimeLocator(step.page, step.element, newLocator);

          console.log(`[Engine] Retrying action with new locator...`);
          await this.executeStep(step, true);
        } catch (healingError) {
          console.error(`[Engine] Auto-Healing failed.`);
          throw error;
        }
      } else {
        throw error; // Throw original error if it is not a timeout or healing fails
      }
    }
  }

  private async performAction(
    step: any,
    locatorStr: string,
    resolvedData: any,
    stepDesc: string
  ): Promise<void> {
    switch (step.action) {
      // Interactions
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
        // Synchronize page context for assertions after switching tabs
        this.assert.page = this.element.page;
        break;
      case 'store_text':
        const text = await this.element.getText(locatorStr);
        this.dataManager.saveRuntimeVariable(step.variable, text);
        break;

      // Assertions
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

      // API Integrations
      case 'api_post':
        if (!step.url) throw new Error(`[JSON Error]: 'api_post' requires a "url"`);
        const postRes = await this.api.post(step.url, resolvedData, step.headers);

        // Extract a specific field from the JSON response to store as a runtime variable
        if (step.store_response) {
          const valueToStore = postRes[step.store_response.key];
          this.dataManager.saveRuntimeVariable(step.store_response.variable, valueToStore);
        }
        break;

      case 'api_get':
        if (!step.url) throw new Error(`[JSON Error]: 'api_get' requires a "url"`);
        const getUrl = this.dataManager.resolve(step.url);
        await this.api.get(getUrl, step.headers);
        break;

      case 'api_delete':
        if (!step.url) throw new Error(`[JSON Error]: 'api_delete' requires a "url"`);
        const deleteUrl = this.dataManager.resolve(step.url);
        await this.api.delete(deleteUrl, step.headers);
        break;

      default:
        throw new Error(`Action not supported: ${step.action}`);
    }
  }
}
