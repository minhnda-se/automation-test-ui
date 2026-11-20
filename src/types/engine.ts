import { Page, APIRequestContext, TestInfo } from '@playwright/test';
import { IStep, IDataRow } from './scenario';

export interface IEngineContext {
  page: Page;
  request: APIRequestContext;
  testInfo: TestInfo;
  locatorFileName?: string;
  enableAutoHealing?: boolean;
}

export interface IActionHandler {
  canHandle(action: string): boolean;
  handle(step: IStep, locatorStr: string, resolvedData: any, stepDesc: string): Promise<void>;
}
