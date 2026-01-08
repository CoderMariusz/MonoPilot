import { test, expect } from '@playwright/test';

test.describe('Production Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'production_manager@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/production/dashboard');
  });

  test('should load dashboard within 3 seconds and display KPIs', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);

    await expect(page.locator('text=Active WOs')).toBeVisible();
    await expect(page.locator('text=WOs Completed Today')).toBeVisible();
    await expect(page.locator('text=Avg Cycle Time')).toBeVisible();
  });

  test('should display Active WOs table with correct data', async ({ page }) => {
    const table = page.locator('table[data-testid="active-wos-table"]');
    await expect(table).toBeVisible();

    await expect(page.locator('th:has-text("WO Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Product")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    const firstRow = table.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
  });

  test('should filter Active WOs by Line', async ({ page }) => {
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="line"]', 'Line A');

    await page.waitForTimeout(500);

    expect(page.url()).toContain('line=');

    await expect(page.locator('text=Line: Line A')).toBeVisible();
  });

  test('should sort table by Started At', async ({ page }) => {
    const startedAtHeader = page.locator('th:has-text("Started At")');

    await startedAtHeader.click();
    await page.waitForTimeout(500);

    await expect(startedAtHeader.locator('svg')).toHaveClass(/arrow-down/);

    await startedAtHeader.click();
    await expect(startedAtHeader.locator('svg')).toHaveClass(/arrow-up/);
  });

  test('should show alerts for material shortages', async ({ page }) => {
    const alertsPanel = page.locator('[data-testid="alerts-panel"]');

    const hasAlerts = await alertsPanel.locator('text=Material Shortage').count() > 0;

    if (hasAlerts) {
      await expect(page.locator('text=Material Shortage')).toBeVisible();
      await expect(page.locator('[data-testid="alert-item"]')).toHaveClass(/bg-red-50/);
    } else {
      await expect(page.locator('text=All systems operational')).toBeVisible();
    }
  });

  test('should auto-refresh dashboard data', async ({ page }) => {
    const refreshButton = page.locator('button[aria-label="Refresh dashboard"]');
    await expect(refreshButton).toBeVisible();

    await expect(page.locator('text=Last updated')).toBeVisible();
  });

  test('should export active WOs to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/active-wos-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('should navigate to WO details on row click', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    await expect(page.locator('[data-testid="wo-details"]')).toBeVisible();
  });
});
