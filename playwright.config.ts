import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test for E2E tests
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Auth storage paths
const STORAGE_STATE = {
  admin: '.auth/admin.json',
  manager: '.auth/manager.json',
  planner: '.auth/planner.json',
  operator: '.auth/operator.json',
};

/**
 * Playwright Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* Global setup for authentication */
  globalSetup: './e2e/global-setup.ts',

  /* Run tests in parallel - enabled with auth caching */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Parallel workers - more workers with cached auth */
  workers: process.env.CI ? 4 : 2,

  /* Test timeout: 60 seconds */
  timeout: 60 * 1000,

  /* Assertion timeout: 15 seconds */
  expect: {
    timeout: 15 * 1000,
    /* Visual comparison settings */
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL from environment or default to localhost:3000 */
    baseURL: process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    /* Collect trace on first retry */
    trace: 'retain-on-failure',

    /* Screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video only on failure */
    video: 'retain-on-failure',

    /* Action timeout: 15 seconds */
    actionTimeout: 15 * 1000,

    /* Navigation timeout: 30 seconds */
    navigationTimeout: 30 * 1000,

    /* Viewport */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects */
  projects: [
    /* Authentication setup - runs first */
    {
      name: 'auth-setup',
      testDir: './e2e',
      testMatch: /auth\.setup\.ts/,
      teardown: 'auth-cleanup',
    },
    {
      name: 'auth-cleanup',
      testDir: './e2e',
      testMatch: /auth\.cleanup\.ts/,
    },

    /* Main test projects - use cached auth */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE.admin,
      },
      dependencies: ['auth-setup'],
    },

    /* Firefox - optional, uncomment for cross-browser testing */
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: STORAGE_STATE.admin,
    //   },
    //   dependencies: ['auth-setup'],
    // },

    /* WebKit - optional, uncomment for Safari testing */
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: STORAGE_STATE.admin,
    //   },
    //   dependencies: ['auth-setup'],
    // },

    /* Mobile viewport tests */
    // {
    //   name: 'mobile-chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: STORAGE_STATE.admin,
    //   },
    //   dependencies: ['auth-setup'],
    // },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'cd apps/frontend && pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    // Pass .env.test vars to the dev server process
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  },
});

export { STORAGE_STATE };
