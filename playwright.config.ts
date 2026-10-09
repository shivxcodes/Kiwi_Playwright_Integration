import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Tell playwright-bdd where to find our .feature files
// and our step definition files.
const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'features/steps/*.ts',
});

// Kiwi runs locally only (skipped in CI). TestRail runs everywhere.
const reporters: ReporterDescription[] = [
  ['html'],
  ...(process.env.SKIP_KIWI ? [] : ([['./kiwi-reporter/kiwi-reporter.ts']] as ReporterDescription[])),
  ['./testrail-reporter/testrail-reporter.ts'],
];

export default defineConfig({
  // Use the folder that playwright-bdd generates from our feature files
  testDir,

  // Run tests in parallel
  fullyParallel: true,

  // Fail the test if test.only is accidentally used in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests only in CI
  retries: process.env.CI ? 2 : 0,

  // Use one worker in CI
  workers: process.env.CI ? 1 : undefined,

  // HTML report + Kiwi (local only) + TestRail
  reporter: reporters,

  // Settings shared by all tests
  use: {
    headless: !!process.env.CI,
    trace: 'on-first-retry',
  },

  // Browser project
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});