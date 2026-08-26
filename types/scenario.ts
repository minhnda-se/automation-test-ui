export type ActionType =
  // Interactions
  | 'goto'
  | 'click'
  | 'right_click'
  | 'left_click'
  | 'double_click'
  | 'hover'
  | 'fill'
  | 'press_key'
  | 'select_option'
  | 'check'
  | 'uncheck'
  | 'upload_file'
  | 'scroll_to'
  | 'wait'
  | 'wait_for_element'
  | 'switch_new_tab'
  | 'store_text'
  | 'save_storage_state'
  // Sub-Flows
  | 'call_flow'
  // Network Mocking
  | 'mock_route'
  | 'unmock_route'
  // Assertions
  | 'verify_visible'
  | 'verify_not_visible'
  | 'verify_text'
  | 'verify_text_contains'
  | 'verify_not_contains_text'
  | 'verify_class_contains'
  | 'verify_not_contains_class'
  | 'verify_url_contains'
  | 'verify_enabled'
  | 'verify_disabled'
  | 'verify_checked'
  | 'verify_attribute'
  | 'verify_element_count'
  | 'verify_visual_snapshot'
  // API Actions
  | 'api_post'
  | 'api_put'
  | 'api_patch'
  | 'api_get'
  | 'api_delete';

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
