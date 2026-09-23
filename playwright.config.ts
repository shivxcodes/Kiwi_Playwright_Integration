import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration
 */
export default defineConfig({
  // Folder where our test files are located
  testDir: './tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the test if test.only is accidentally used in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests only in CI
  retries: process.env.CI ? 2 : 0,

  // Use one worker in CI
  workers: process.env.CI ? 1 : undefined,

  // HTML test report
  reporter: [
  ['html'],
  ['./kiwi-reporter/kiwi-reporter.ts']
],

  // Settings shared by all tests
  use: {
    // We are using the installed Google Chrome browser
    channel: 'chrome',

    // Show browser actions while running
    headless: false,

    // Collect trace when retrying a failed test
    trace: 'on-first-retry',
  },

  // Browser project
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});