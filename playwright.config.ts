import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

function parseOptionalInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const isCI = !!process.env.CI;
const workers = parseOptionalInt(process.env.WORKERS, isCI ? 1 : 2);
const slowMo = parseOptionalInt(process.env.SLOW_MO, isCI ? 0 : 500);
const browserChannel = process.env.PW_CHANNEL?.trim() || undefined;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: 'reports/test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  /* One retry everywhere, including locally.
   *
   * - A retry after a timeout or a failed assertion indicates a missing wait.
   *   Fix the scenario rather than relying on the retry.
   * - A retry after net::ERR_CONNECTION_RESET at `goto` covers third-party
   *   demo site rate limiting. */
  retries: 1,
  /* Raised from Playwright's 30s default to leave headroom for 15+ step
   * checkout scenarios and local slowMo. */
  timeout: 60_000,
  /* Capped rather than left to CPU core count so third-party demo sites do not
   * rate-limit parallel runs. Override via WORKERS env var if needed. */
  workers,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'reports/playwright-html' }],
    [
      'allure-playwright',
      {
        detail: true,
        resultsDir: 'reports/allure-results',
        suiteTitle: false,
      },
    ],
  ],
  use: {
    launchOptions: {
      /* Local runs default to 500ms slowMo so a human can follow execution.
       * CI defaults to 0. Override via SLOW_MO env var. */
      slowMo,
    },
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: browserChannel ? `Desktop Chrome (${browserChannel})` : 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(browserChannel ? { channel: browserChannel } : {}),
      },
    },
  ],
});
