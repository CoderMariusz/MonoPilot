import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Admin - Sessions Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test('should display active sessions', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify sessions table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("IP Address")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Activity")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should show session details', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click on first session to view details
    const firstSession = page.locator('table tbody tr').first();
    await firstSession.locator('button[aria-label="View Details"]').click();

    // Verify session details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Session Details');
  });

  test('should terminate user session', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click terminate session button on first session
    const firstSession = page.locator('table tbody tr').first();
    await firstSession.locator('button[aria-label="Terminate Session"]').click();

    // Confirm termination
    await page.click('button:has-text("Confirm")');

    // Verify session termination
    await helpers.verifyToast('Session terminated successfully');
  });

  test('should filter sessions by user', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Filter by user
    await page.selectOption('select[name="user_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="user_filter"]')).toHaveValue('1');
  });

  test('should filter sessions by status', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'ACTIVE');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('ACTIVE');
  });

  test('should filter sessions by date range', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Filter by date range
    await page.fill('input[name="date_from"]', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.fill('input[name="date_to"]', new Date().toISOString().split('T')[0]);

    // Apply filter
    await page.click('button:has-text("Apply Filter")');

    // Verify filter is applied
    await expect(page.locator('input[name="date_from"]')).toHaveValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  test('should search sessions', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Search for specific session
    await helpers.searchInTable('admin');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should export sessions', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should display session status indicators', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show session user information', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session user information is displayed
    await expect(page.locator('[data-testid="session-user-info"]')).toBeVisible();
  });

  test('should display session IP address', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session IP address is displayed
    await expect(page.locator('[data-testid="session-ip-address"]')).toBeVisible();
  });

  test('should show session last activity', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session last activity is displayed
    await expect(page.locator('[data-testid="session-last-activity"]')).toBeVisible();
  });

  test('should display session creation time', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session creation time is displayed
    await expect(page.locator('[data-testid="session-creation-time"]')).toBeVisible();
  });

  test('should show session duration', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session duration is displayed
    await expect(page.locator('[data-testid="session-duration"]')).toBeVisible();
  });

  test('should display session device information', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session device information is displayed
    await expect(page.locator('[data-testid="session-device-info"]')).toBeVisible();
  });

  test('should show session location information', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session location information is displayed
    await expect(page.locator('[data-testid="session-location-info"]')).toBeVisible();
  });

  test('should display session browser information', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify session browser information is displayed
    await expect(page.locator('[data-testid="session-browser-info"]')).toBeVisible();
  });

  test('should handle session termination confirmation', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click terminate session button
    const firstSession = page.locator('table tbody tr').first();
    await firstSession.locator('button[aria-label="Terminate Session"]').click();

    // Cancel termination
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/admin/sessions/**', route => route.abort());

    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify error handling
    await helpers.verifyErrorMessage('Failed to load sessions');
  });

  test('should display loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/admin/sessions/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      }, 1000);
    });

    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify loading state appears
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle empty sessions list', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/admin/sessions/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });

    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Verify empty state message
    await expect(page.locator('text="No sessions found"')).toBeVisible();
  });

  test('should refresh sessions list', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click refresh button
    await page.click('button[aria-label="Refresh"]');

    // Verify loading state appears briefly
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should maintain filter state on refresh', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Apply filter
    await page.selectOption('select[name="status_filter"]', 'ACTIVE');

    // Refresh page
    await page.reload();

    // Verify filter is maintained
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('ACTIVE');
  });

  test('should display session activity timeline', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click on first session to view details
    const firstSession = page.locator('table tbody tr').first();
    await firstSession.locator('button[aria-label="View Details"]').click();

    // Verify session activity timeline is displayed
    await expect(page.locator('[data-testid="session-activity-timeline"]')).toBeVisible();
  });

  test('should show session security information', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click on first session to view details
    const firstSession = page.locator('table tbody tr').first();
    await firstSession.locator('button[aria-label="View Details"]').click();

    // Verify session security information is displayed
    await expect(page.locator('[data-testid="session-security-info"]')).toBeVisible();
  });

  test('should display session permissions', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('sessions');

    // Click on first session to view details
    const firstSession = page.locator('table tbody tr').first();
    await firstSession.locator('button[aria-label="View Details"]').click();

    // Verify session permissions are displayed
    await expect(page.locator('[data-testid="session-permissions"]')).toBeVisible();
  });
});
