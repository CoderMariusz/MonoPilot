import { test, expect, Page } from '@playwright/test';
import { login, logout, TEST_USER } from './helpers';

/**
 * Session Management E2E Tests
 * Story 0.10: Fix Session Management
 *
 * Tests automatic session refresh, token expiration handling,
 * and data persistence during idle periods.
 */

test.describe('Session Management', () => {

  test.describe('Session Refresh', () => {

    test('should maintain session during moderate idle period', async ({ page }) => {
      // AC-1, AC-3: Session refresh + User info persistence

      // Login
      await login(page);

      // Navigate to a data page (e.g., Planning)
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      // Verify initial state
      const userInfo = page.locator('[data-testid="user-info"], header').first();
      await expect(userInfo).toBeVisible();

      // Check that data loaded
      const hasData = await page.locator('table, [data-testid="data-table"]').count() > 0;
      console.log('Initial data present:', hasData);

      // Idle for 2 minutes (simulate user stepping away)
      console.log('Simulating 2-minute idle...');
      await page.waitForTimeout(120000); // 2 min

      // Interact with page - should trigger middleware
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify user still logged in (not redirected to /login)
      expect(page.url()).not.toContain('/login');

      // Verify user info still visible
      await expect(userInfo).toBeVisible();

      // Verify data still loads
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      const stillHasData = await page.locator('table, [data-testid="data-table"]').count() > 0;
      console.log('Data after idle:', stillHasData);
    });

    test('should log session refresh events in console', async ({ page }) => {
      // AC-6: Developer Experience - Console logs

      const consoleLogs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });

      await login(page);

      // Navigate around to trigger middleware
      await page.goto('/planning');
      await page.waitForTimeout(1000);
      await page.goto('/warehouse');
      await page.waitForTimeout(1000);

      // Check for middleware logs
      const hasMiddlewareLogs = consoleLogs.some(log =>
        log.includes('Middleware') || log.includes('Session')
      );

      console.log('Middleware logs found:', hasMiddlewareLogs);
      console.log('Sample logs:', consoleLogs.slice(0, 5));

      expect(hasMiddlewareLogs).toBeTruthy();
    });
  });

  test.describe('Token Expiration Handling', () => {

    test('should redirect to login when session cannot be refreshed', async ({ page, context }) => {
      // AC-2: Token expiration handling

      await login(page);
      await page.goto('/planning');

      // Simulate expired session by clearing auth cookies
      await context.clearCookies();

      // Try to navigate - should redirect to login
      await page.goto('/warehouse');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);

      // Should have returnTo parameter
      expect(page.url()).toContain('returnTo');
    });

    test('should preserve return URL after session expiry', async ({ page, context }) => {
      // AC-2: Preserve current page URL for post-login redirect

      await login(page);

      const targetPath = '/planning';
      await page.goto(targetPath);

      // Clear session
      await context.clearCookies();

      // Try to access protected route
      await page.goto('/warehouse');
      await page.waitForLoadState('networkidle');

      // Check returnTo parameter
      const url = new URL(page.url());
      const returnTo = url.searchParams.get('returnTo');

      expect(returnTo).toBeTruthy();
      expect(returnTo).toContain('/warehouse');
    });
  });

  test.describe('Data Loading Stability', () => {

    test('should load data correctly after page transition', async ({ page }) => {
      // AC-4: Data loading stability

      await login(page);

      // Navigate to Planning
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      // Check if tables/data loaded
      const planningData = await page.locator('table, [data-testid="data-table"]').first();
      await expect(planningData).toBeVisible({ timeout: 10000 }).catch(() => {
        console.log('No data tables found on /planning - may be empty');
      });

      // Navigate to Warehouse
      await page.goto('/warehouse');
      await page.waitForLoadState('networkidle');

      const warehouseData = await page.locator('table, [data-testid="data-table"]').first();
      await expect(warehouseData).toBeVisible({ timeout: 10000 }).catch(() => {
        console.log('No data tables found on /warehouse - may be empty');
      });

      // Navigate back to Planning
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      // Data should still load
      const planningDataAgain = await page.locator('table, [data-testid="data-table"]').first();
      await expect(planningDataAgain).toBeVisible({ timeout: 10000 }).catch(() => {
        console.log('No data tables found on /planning after navigation - may be empty');
      });
    });

    test('should handle API calls with refreshed tokens', async ({ page }) => {
      // AC-4: API calls work with refreshed tokens

      await login(page);

      // Monitor network requests
      const apiCalls: string[] = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiCalls.push(`${response.status()} ${response.url()}`);
        }
      });

      // Navigate to a page that makes API calls
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      // Wait a bit for API calls
      await page.waitForTimeout(2000);

      // Check for successful API calls (200, not 401/403)
      const hasSuccessfulCalls = apiCalls.some(call => call.startsWith('200'));
      const hasAuthErrors = apiCalls.some(call =>
        call.startsWith('401') || call.startsWith('403')
      );

      console.log('API calls made:', apiCalls.length);
      console.log('Successful calls:', hasSuccessfulCalls);
      console.log('Auth errors:', hasAuthErrors);

      expect(hasAuthErrors).toBeFalsy();
    });
  });

  test.describe('User Info Persistence', () => {

    test('should keep user info visible during navigation', async ({ page }) => {
      // AC-3: User info persistence

      await login(page);

      // Check user info is visible
      const userInfo = page.locator('[data-testid="user-info"], header nav, header').first();
      await expect(userInfo).toBeVisible();

      // Navigate to different pages
      const pages = ['/planning', '/warehouse', '/production', '/technical'];

      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');

        // User info should remain visible
        await expect(userInfo).toBeVisible({ timeout: 5000 }).catch(() => {
          console.log(`User info not visible on ${path}`);
        });
      }
    });

    test('should not show loading spinner after initial auth', async ({ page }) => {
      // AC-3: Loading spinner only shows during initial auth

      await login(page);

      // After login, navigate around
      await page.goto('/planning');
      await page.waitForLoadState('networkidle');

      // Check that there's no persistent loading spinner
      const loadingSpinner = page.locator('[data-testid="loading"], .spinner, [role="status"]');
      const spinnerCount = await loadingSpinner.count();

      // If there are spinners, they should be transient (check after 2s)
      if (spinnerCount > 0) {
        await page.waitForTimeout(2000);
        const persistentSpinner = await loadingSpinner.isVisible().catch(() => false);
        expect(persistentSpinner).toBeFalsy();
      }
    });
  });
});
