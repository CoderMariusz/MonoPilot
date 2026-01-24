/**
 * Example E2E Test
 *
 * This file demonstrates the test structure and POM usage.
 * Delete this file once you have real tests.
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, LoginPage } from '../pages';
import { ROUTES } from '../fixtures/test-data';

test.describe('Example Tests', () => {
  test('dashboard loads after login', async ({ page }) => {
    // Page objects are pre-authenticated via storageState
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await dashboard.expectLoggedIn();
  });

  test('can navigate to settings', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await dashboard.goToSettings();

    await expect(page).toHaveURL(new RegExp(ROUTES.settings));
  });
});

test.describe('Login Tests (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth

  test('shows login page when not authenticated', async ({ page }) => {
    const login = new LoginPage(page);

    await page.goto(ROUTES.dashboard);

    // Should redirect to login
    await login.expectOnLoginPage();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.fillEmail('invalid@test.com');
    await login.fillPassword('wrongpassword');
    await login.submit();

    await login.expectLoginError();
  });
});
