/**
 * Authentication Setup for E2E Tests
 *
 * This file runs before tests to authenticate users and save their sessions.
 * Sessions are cached in .auth/ folder and reused across test runs.
 */

import { test as setup, expect } from '@playwright/test';
import { TEST_CREDENTIALS } from './fixtures/test-data';

// Auth storage paths
const AUTH_FILES = {
  admin: '.auth/admin.json',
  manager: '.auth/manager.json',
  planner: '.auth/planner.json',
  operator: '.auth/operator.json',
};

/**
 * Authenticate a user and save their session state
 */
async function authenticateUser(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  storagePath: string
) {
  // Go to login page
  await page.goto('/login');

  // Wait for login form to be ready
  await page.waitForSelector('input[name="email"], input[type="email"]', {
    state: 'visible',
    timeout: 10000
  });

  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for successful redirect (dashboard or any authenticated page)
  await page.waitForURL(/\/(dashboard|settings|planning|production|warehouse|quality|shipping|technical)/, {
    timeout: 15000,
  });

  // Verify we're logged in by checking for user menu or sidebar
  await expect(page.locator('[data-testid="user-menu"], [data-testid="sidebar"], nav')).toBeVisible({
    timeout: 5000,
  });

  // Save storage state
  await page.context().storageState({ path: storagePath });

  console.log(`✅ Authenticated: ${email} -> ${storagePath}`);
}

// Setup: Authenticate Admin user (primary test user)
setup('authenticate admin', async ({ page }) => {
  const { email, password } = TEST_CREDENTIALS.admin;
  await authenticateUser(page, email, password, AUTH_FILES.admin);
});

// Skip other roles for now - using same admin user
// Uncomment when separate test users are created
setup.skip('authenticate manager', async ({ page }) => {
  const { email, password } = TEST_CREDENTIALS.manager;
  await authenticateUser(page, email, password, AUTH_FILES.manager);
});

setup.skip('authenticate planner', async ({ page }) => {
  const { email, password } = TEST_CREDENTIALS.planner;
  await authenticateUser(page, email, password, AUTH_FILES.planner);
});

setup.skip('authenticate operator', async ({ page }) => {
  const { email, password } = TEST_CREDENTIALS.operator;
  await authenticateUser(page, email, password, AUTH_FILES.operator);
});
