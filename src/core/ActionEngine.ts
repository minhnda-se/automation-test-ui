import { APIRequestContext, Page, TestInfo } from '@playwright/test';
import { IStep, ILocatorStore, IDataRow } from '../types/scenario';
import { IActionHandler } from '../types/engine';
import { DataManager } from './DataManager';
import { LocatorManager } from './LocatorManager';
import { FlowManager } from './FlowManager';
import { ElementHelper } from '../helpers/ElementHelper';
import { AssertHelper } from '../helpers/AssertHelper';
import { APIHelper } from '../helpers/APIHelper';
import { AutoHealer } from './AutoHealer';
import { UIActionHandler } from '../handlers/UIActionHandler';
import { AssertActionHandler } from '../handlers/AssertActionHandler';
import { APIActionHandler } from '../handlers/APIActionHandler';
import { NetworkActionHandler } from '../handlers/NetworkActionHandler';
import { FlowActionHandler } from '../handlers/FlowActionHandler';

export class ActionEngine {
  private dataManager: DataManager;
  private locatorManager: LocatorManager;
  private autoHealer: AutoHealer;
  private flowManager: FlowManager;
  private handlers: IActionHandler[] = [];
  private enableAutoHealing: boolean;

  constructor(
    page: Page,
    request: APIRequestContext,
    testInfo: TestInfo,
    locators: ILocatorStore,
    dataRow: IDataRow = {},
    locatorFileName: string = 'locators.json',
    enableAutoHealing: boolean = false
  ) {
    this.dataManager = new DataManager(dataRow);
    this.locatorManager = new LocatorManager(locators);
    this.enableAutoHealing = enableAutoHealing;
    this.flowManager = new FlowManager();

    const elementHelper = new ElementHelper(page, testInfo);
    const assertHelper = new AssertHelper(page, testInfo);
    const apiHelper = new APIHelper(request, testInfo);

    this.autoHealer = new AutoHealer(page, locatorFileName);

    // Register modular action handlers
    this.handlers = [
      new UIActionHandler(elementHelper, this.dataManager),
      new AssertActionHandler(assertHelper),
      new APIActionHandler(apiHelper, this.dataManager),
      new NetworkActionHandler(page, this.dataManager),
      new FlowActionHandler(this.flowManager, this.dataManager, (step) => this.executeStep(step)),
    ];
  }

  async executeStep(step: IStep, isRetry: boolean = false): Promise<void> {
    const locatorStr =
      step.page && step.element ? this.locatorManager.getLocator(step.page, step.element) : '';
    const stepDesc = `${step.action} - ${step.element || step.url || step.variable || step.flow || ''}`;

    let resolvedData = step.data;
    if (typeof step.data === 'object' && step.data !== null) {
      const strData = JSON.stringify(step.data);
      resolvedData = JSON.parse(this.dataManager.resolve(strData));
    } else {
      resolvedData = this.dataManager.resolve(step.data);
    }

    try {
      await this.dispatchAction(step, locatorStr, resolvedData, stepDesc);
    } catch (error: any) {
      // Trigger Auto-Healer on Timeout error if enabled and not already retried
      if (
        this.enableAutoHealing &&
        !isRetry &&
        step.page &&
        step.element &&
        error.message &&
        error.message.includes('Timeout')
      ) {
        console.warn(`[Engine] Locator failed for "${step.element}". Triggering Auto-Healer...`);
        try {
          const newLocator = await this.autoHealer.healLocator(step.page, step.element, locatorStr);

          // Update runtime locator store
          this.locatorManager.updateRuntimeLocator(step.page, step.element, newLocator);

          console.log(`[Engine] Retrying step with healed locator...`);
          await this.executeStep(step, true);
        } catch (healingError) {
          console.error(`[Engine] Auto-Healing failed.`);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  private async dispatchAction(
    step: IStep,
    locatorStr: string,
    resolvedData: any,
    stepDesc: string
  ): Promise<void> {
    for (const handler of this.handlers) {
      if (handler.canHandle(step.action)) {
        await handler.handle(step, locatorStr, resolvedData, stepDesc);
        return;
      }
    }

    throw new Error(`[ActionEngine] Unsupported action keyword: "${step.action}"`);
  }
}
