import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* One retry everywhere, including locally.
   *
   * Phase 9 set this to 0 locally on the rule that a retry means a missing
   * `wait_for_element`. Measurement on 2026-08-26 showed that rule is only half
   * right, and the distinction matters:
   *
   *   - A retry after a timeout or a failed assertion IS a missing wait. Fix the
   *     scenario; do not let the retry stand in for it.
   *   - A retry after net::ERR_CONNECTION_RESET at `goto` is rate limiting by the
   *     target site. Four consecutive local runs of the 42 @saucedemo tests failed
   *     4 to 12 tests each, a different set every time, rejected in 1.3-1.8s before
   *     any element existed to wait for. No scenario change can fix that.
   *
   * The second kind is what a retry is legitimately for. Any retry is still worth
   * looking at - check which of the two it was before dismissing it. */
  retries: 1,
  /* Raised from Playwright's 30s default. A full checkout scenario runs 15 steps,
     and the local slowMo alone adds several seconds to that before any network
     time. 30s left no headroom; a passing test costs nothing extra here. */
  timeout: 60_000,
  /* Every target is a third-party demo site, and they rate-limit. Measured on
     2026-08-26: a local `npm run test:saucedemo` at the default worker count
     (roughly half the CPU cores) produced 9 net::ERR_CONNECTION_RESET and 3 test
     timeouts out of 42 - and a different set of tests failed on each run, with
     zero assertion failures either time. The tests were fine; the concurrency
     was not. Capped rather than left to the machine's core count, so the result
     does not depend on who runs it. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'], // Stream results to the terminal as they run
    ['html', { open: 'never' }], // Playwright's built-in HTML report
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: false,
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    launchOptions: {
      /* Local runs are slowed down so a human can follow them. In CI nobody is
         watching, and half a second per action costs minutes across the suite. */
      slowMo: process.env.CI ? 0 : 500,
    },
    /* Raised deliberately: the target sites are third-party demos that can be
       slow to respond. Generous timeouts are cheaper than retries. */
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
