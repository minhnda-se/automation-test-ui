// ActionType is generated from the handler layer - see types/actions.generated.ts
// and scripts/generate-action-reference.ts. It is re-exported here so consumers
// keep importing it from types/scenario, the way they always have.
import { ActionType } from './actions.generated';
import { SuiteStatus } from '../utils/core/SuiteStatus';

export type { ActionType, SuiteStatus };

export interface IStoreResponse {
  key: string;
  variable: string;
}

export interface IStep {
  action: ActionType;
  page?: string;
  element?: string;
  data?: any;
  variable?: string;
  storeAs?: string;
  url?: string;
  headers?: Record<string, string>;
  store_response?: IStoreResponse;
  expected_status?: number;
  attribute?: string;
  count?: number;
  key?: string;
  timeout?: number;
  /** wait_for_element target state. Defaults to 'visible'. */
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  // Sub-Flow fields
  flow?: string;
  params?: Record<string, any>;
  // Network Mocking fields
  status?: number;
  mockData?: any;
  contentType?: string;
  // Visual Snapshot fields
  snapshotName?: string;
  maxDiffPixelRatio?: number;
}

export interface ITestCase {
  testId: string;
  testName: string;
  description?: string;
  /**
   * Selection tags appended to the generated test title, e.g. ['@ci'].
   * Combined with the suite-level config.tags and matched by `--grep`.
   */
  tags?: string[];
  dataTable?: Array<Record<string, string>>;
  preconditions?: IStep[];
  steps: IStep[];
  postconditions?: IStep[];
}

export interface IScenarioConfig {
  locatorFile?: string;
  /**
   * Tags applied to every test case in this suite, e.g. ['@saucedemo', '@ci'].
   * Each entry is appended to the generated test title so Playwright's
   * `--grep` can select it.
   */
  tags?: string[];
  /**
   * Suite lifecycle status, default 'ready'. See utils/core/SuiteStatus.ts for
   * what 'wip' exempts - and, more to the point, what it does not.
   */
  status?: SuiteStatus;
  enableAutoHealing?: boolean;
  storageState?: string;
}

export interface IScenario {
  $schema?: string;
  config?: IScenarioConfig;
  scenario: string;
  testCases: ITestCase[];
}

export interface IFlowDefinition {
  $schema?: string;
  flowName: string;
  description?: string;
  params?: string[];
  steps: IStep[];
}

export type ILocatorStore = Record<string, Record<string, string>>;
export type IDataRow = Record<string, string>;
