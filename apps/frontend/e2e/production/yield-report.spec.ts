import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Production - Yield Report', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should toggle between PR and FG yield views', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify PR view is active by default
    await helpers.verifyTabActive('yield-pr');

    // Switch to FG view
    await helpers.clickTab('yield-fg');
    await helpers.verifyTabActive('yield-fg');

    // Switch back to PR view
    await helpers.clickTab('yield-pr');
    await helpers.verifyTabActive('yield-pr');
  });

  test('should change time bucket (day/week/month)', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Test day bucket
    await page.selectOption('select[name="time_bucket"]', 'day');
    await expect(page.locator('select[name="time_bucket"]')).toHaveValue('day');

    // Test week bucket
    await page.selectOption('select[name="time_bucket"]', 'week');
    await expect(page.locator('select[name="time_bucket"]')).toHaveValue('week');

    // Test month bucket
    await page.selectOption('select[name="time_bucket"]', 'month');
    await expect(page.locator('select[name="time_bucket"]')).toHaveValue('month');
  });

  test('should display KPI cards correctly', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify KPI cards are displayed
    await expect(page.locator('[data-testid="kpi-card"]')).toHaveCount(4);
    await expect(page.locator('text="Total Yield %"')).toBeVisible();
    await expect(page.locator('text="Total Loss %"')).toBeVisible();
    await expect(page.locator('text="Total Input Weight"')).toBeVisible();
    await expect(page.locator('text="Total Output Weight"')).toBeVisible();
  });

  test('should show yield data table', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify yield data table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Work Order")')).toBeVisible();
    await expect(page.locator('th:has-text("Input Weight")')).toBeVisible();
    await expect(page.locator('th:has-text("Output Weight")')).toBeVisible();
    await expect(page.locator('th:has-text("Yield %")')).toBeVisible();
  });

  test('should export yield report (PR)', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');
    await helpers.verifyTabActive('yield-pr');

    // Click export button
    await page.click('button:has-text("Export PR Yield")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should export yield report (FG)', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');
    await helpers.clickTab('yield-fg');

    // Click export button
    await page.click('button:has-text("Export FG Yield")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should filter yield data by date range', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Set date range
    await page.fill('input[name="date_from"]', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.fill('input[name="date_to"]', new Date().toISOString().split('T')[0]);

    // Apply filter
    await page.click('button:has-text("Apply Filter")');

    // Verify filter is applied
    await expect(page.locator('input[name="date_from"]')).toHaveValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  test('should filter yield data by production line', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Filter by production line
    await page.selectOption('select[name="production_line_filter"]', 'Line 1');

    // Verify filter is applied
    await expect(page.locator('select[name="production_line_filter"]')).toHaveValue('Line 1');
  });

  test('should display yield trends chart', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify chart is displayed
    await expect(page.locator('[data-testid="yield-chart"]')).toBeVisible();
  });

  test('should show yield breakdown by loss type', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify loss breakdown is displayed
    await expect(page.locator('[data-testid="loss-breakdown"]')).toBeVisible();
    await expect(page.locator('text="Cooking Loss"')).toBeVisible();
    await expect(page.locator('text="Trim Loss"')).toBeVisible();
    await expect(page.locator('text="Marinade Loss"')).toBeVisible();
  });

  test('should display yield comparison with previous period', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify comparison data is displayed
    await expect(page.locator('[data-testid="yield-comparison"]')).toBeVisible();
  });

  test('should show yield alerts for low performance', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Check for yield alerts
    const alerts = page.locator('[data-testid="yield-alert"]');
    if (await alerts.count() > 0) {
      await expect(alerts.first()).toBeVisible();
    }
  });

  test('should refresh yield data', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Click refresh button
    await page.click('button[aria-label="Refresh"]');

    // Verify loading state appears briefly
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle empty yield data', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/production/yield/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });

    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify empty state message
    await expect(page.locator('text="No yield data found"')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/production/yield/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 })
        });
      }, 1000);
    });

    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify loading state appears
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/production/yield/**', route => route.abort());

    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify error message
    await helpers.verifyErrorMessage('Failed to load yield data');
  });

  test('should maintain filter state on tab switch', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Apply filter
    await page.selectOption('select[name="production_line_filter"]', 'Line 1');

    // Switch tabs
    await helpers.clickTab('yield-fg');
    await helpers.clickTab('yield-pr');

    // Verify filter is maintained
    await expect(page.locator('select[name="production_line_filter"]')).toHaveValue('Line 1');
  });

  test('should display yield data with proper formatting', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify yield percentages are formatted correctly
    const yieldCells = page.locator('td:has-text("%")');
    if (await yieldCells.count() > 0) {
      const firstYield = await yieldCells.first().textContent();
      expect(firstYield).toMatch(/\d+\.\d+%/);
    }
  });

  test('should show yield data tooltips', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Hover over yield data to show tooltip
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.hover();
      await expect(page.locator('[data-testid="tooltip"]')).toBeVisible();
    }
  });

  test('should calculate yield percentages correctly', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('yield-report');

    // Verify yield calculation logic
    const inputWeight = await page.locator('td:has-text("kg")').first().textContent();
    const outputWeight = await page.locator('td:has-text("kg")').nth(1).textContent();
    const yieldPercent = await page.locator('td:has-text("%")').first().textContent();

    if (inputWeight && outputWeight && yieldPercent) {
      const input = parseFloat(inputWeight.replace('kg', ''));
      const output = parseFloat(outputWeight.replace('kg', ''));
      const yieldValue = parseFloat(yieldPercent.replace('%', ''));
      const expectedYield = (output / input) * 100;
      expect(yieldValue).toBeCloseTo(expectedYield, 1);
    }
  });
});
