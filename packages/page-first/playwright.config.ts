import { defineConfig, devices } from '@playwright/test'

/**
 * Identical in both packages, on purpose.
 *
 * The comparison is only worth reading if neither style is quietly helped by
 * a different timeout, retry count or worker setting. Anything changed here
 * must be changed in the sibling package too, or `docs/comparison.md` stops
 * being a comparison and becomes an anecdote.
 */
export default defineConfig({
  testDir: './tests',

  // Every test signs in through its own fixture and touches nothing another
  // test owns, so they are safe in parallel. If that stops being true the fix
  // is the test, not this setting.
  fullyParallel: true,

  // A test that only passes on a retry is a test that is lying. Retries are on
  // in CI only, and a flaky result is reported rather than hidden — see
  // docs/flake.md.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI
    ? [['line'], ['allure-playwright', { resultsDir: 'allure-results' }]]
    : [['list']],

  /*
   * The application publishes `data-test`, not Playwright's default
   * `data-testid`. Setting it here means every `getByTestId` in both packages
   * binds to the contract the app actually offers, instead of each locator
   * spelling out an attribute selector.
   */
  expect: { timeout: 5_000 },

  use: {
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
