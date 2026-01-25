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

  // Wait for login form to be ready - use placeholder text which is stable
  await page.waitForSelector('input[placeholder="name@example.com"]', {
    state: 'visible',
    timeout: 10000
  });

  // Fill login form - use placeholder as selector since name may be set by react-hook-form
  await page.fill('input[placeholder="name@example.com"]', email);
  await page.fill('input[placeholder="Enter your password"]', password);

  // Submit login - use getByRole for better reliability
  const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
  await submitButton.click();

  // Wait for successful redirect (dashboard or any authenticated page)
  // Increase timeout for slow auth
  await page.waitForURL(/\/(dashboard|settings|planning|production|warehouse|quality|shipping|technical)/, {
    timeout: 30000,
  });

  // Verify we're logged in by checking for sidebar nav or any main content
  await expect(page.locator('nav, aside, [role="navigation"]').first()).toBeVisible({
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
