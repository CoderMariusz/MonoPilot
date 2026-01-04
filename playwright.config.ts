import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test for E2E tests
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests sequentially to avoid Supabase Auth rate limiting */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Use single worker to prevent auth rate limiting */
  workers: 1,

  /* Test timeout: 120 seconds */
  timeout: 120 * 1000,

  /* Assertion timeout: 30 seconds */
  expect: {
    timeout: 30 * 1000,
  },

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL from environment or default to localhost:3000 (Next.js default port) */
    baseURL: process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    /* Collect trace on first retry */
    trace: 'retain-on-failure',

    /* Screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video only on failure */
    video: 'retain-on-failure',

    /* Action timeout: 30 seconds */
    actionTimeout: 30 * 1000,

    /* Navigation timeout: 60 seconds */
    navigationTimeout: 60 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'cd apps/frontend && pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
