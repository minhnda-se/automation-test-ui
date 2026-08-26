import { Page } from '@playwright/test';
import { IActionHandler } from '../../types/engine';
import { IStep } from '../../types/scenario';
import { DataManager } from '../core/DataManager';

export class NetworkActionHandler implements IActionHandler {
  private page: Page;
  private dataManager: DataManager;
  private supportedActions = new Set(['mock_route', 'unmock_route']);

  constructor(page: Page, dataManager: DataManager) {
    this.page = page;
    this.dataManager = dataManager;
  }

  canHandle(action: string): boolean {
    return this.supportedActions.has(action);
  }

  async handle(step: IStep, _locatorStr: string, resolvedData: any, _stepDesc: string): Promise<void> {
    switch (step.action) {
      case 'mock_route': {
        if (!step.url) {
          throw new Error(`[Lỗi JSON]: 'mock_route' bắt buộc phải có trường "url" (URL pattern).`);
        }
        const resolvedUrl = this.dataManager.resolve(step.url);
        const status = step.status || step.expected_status || 200;
        const contentType = step.contentType || 'application/json';

        let bodyPayload: string;
        const rawMockData = step.mockData !== undefined ? step.mockData : resolvedData;
        if (typeof rawMockData === 'object' && rawMockData !== null) {
          const resolvedString = this.dataManager.resolve(JSON.stringify(rawMockData));
          bodyPayload = resolvedString;
        } else {
          bodyPayload = this.dataManager.resolve(String(rawMockData || ''));
        }

        console.log(`[NetworkHandler] Mocking route "${resolvedUrl}" with status ${status}`);
        await this.page.route(resolvedUrl, async (route) => {
          await route.fulfill({
            status,
            contentType,
            body: bodyPayload,
          });
        });
        break;
      }

      case 'unmock_route': {
        if (!step.url) {
          throw new Error(`[Lỗi JSON]: 'unmock_route' bắt buộc phải có trường "url".`);
        }
        const resolvedUrl = this.dataManager.resolve(step.url);
        console.log(`[NetworkHandler] Unmocking route "${resolvedUrl}"`);
        await this.page.unroute(resolvedUrl);
        break;
      }

      default:
        throw new Error(`[NetworkActionHandler] Unhandled action: ${step.action}`);
    }
  }
}
