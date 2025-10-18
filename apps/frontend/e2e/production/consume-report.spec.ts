import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Production - Consume Report', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should display material consumption data', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify consume report table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Material")')).toBeVisible();
    await expect(page.locator('th:has-text("Standard Qty")')).toBeVisible();
    await expect(page.locator('th:has-text("Actual Qty")')).toBeVisible();
    await expect(page.locator('th:has-text("Variance")')).toBeVisible();
    await expect(page.locator('th:has-text("Variance %")')).toBeVisible();
  });

  test('should show variance calculations', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify variance calculations are displayed
    const varianceCells = page.locator('td:has-text("%")');
    if (await varianceCells.count() > 0) {
      await expect(varianceCells.first()).toBeVisible();
    }
  });

  test('should highlight positive variances', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Look for positive variance indicators
    const positiveVariances = page.locator('.variance-positive');
    if (await positiveVariances.count() > 0) {
      await expect(positiveVariances.first()).toBeVisible();
    }
  });

  test('should highlight negative variances', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Look for negative variance indicators
    const negativeVariances = page.locator('.variance-negative');
    if (await negativeVariances.count() > 0) {
      await expect(negativeVariances.first()).toBeVisible();
    }
  });

  test('should export consume report', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should link to BOM details', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Click on material to view BOM details
    const materialLink = page.locator('a:has-text("View BOM")').first();
    if (await materialLink.count() > 0) {
      await materialLink.click();

      // Verify BOM details modal opens
      await expect(page.locator('.modal')).toBeVisible();
      await expect(page.locator('.modal')).toContainText('BOM Details');
    }
  });

  test('should filter by work order', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Filter by work order
    await page.selectOption('select[name="work_order_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="work_order_filter"]')).toHaveValue('1');
  });

  test('should filter by material', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Filter by material
    await page.selectOption('select[name="material_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="material_filter"]')).toHaveValue('1');
  });

  test('should filter by date range', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Set date range
    await page.fill('input[name="date_from"]', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.fill('input[name="date_to"]', new Date().toISOString().split('T')[0]);

    // Apply filter
    await page.click('button:has-text("Apply Filter")');

    // Verify filter is applied
    await expect(page.locator('input[name="date_from"]')).toHaveValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  test('should show consumption trends chart', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify consumption trends chart is displayed
    await expect(page.locator('[data-testid="consumption-chart"]')).toBeVisible();
  });

  test('should display consumption summary', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify consumption summary is displayed
    await expect(page.locator('[data-testid="consumption-summary"]')).toBeVisible();
    await expect(page.locator('text="Total Standard Quantity"')).toBeVisible();
    await expect(page.locator('text="Total Actual Quantity"')).toBeVisible();
    await expect(page.locator('text="Overall Variance %"')).toBeVisible();
  });

  test('should show material efficiency indicators', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify efficiency indicators are displayed
    const efficiencyIndicators = page.locator('[data-testid="efficiency-indicator"]');
    if (await efficiencyIndicators.count() > 0) {
      await expect(efficiencyIndicators.first()).toBeVisible();
    }
  });

  test('should display consumption alerts', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Check for consumption alerts
    const alerts = page.locator('[data-testid="consumption-alert"]');
    if (await alerts.count() > 0) {
      await expect(alerts.first()).toBeVisible();
    }
  });

  test('should refresh consumption data', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Click refresh button
    await page.click('button[aria-label="Refresh"]');

    // Verify loading state appears briefly
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle empty consumption data', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/production/consume/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });

    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify empty state message
    await expect(page.locator('text="No consumption data found"')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/production/consume/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 })
        });
      }, 1000);
    });

    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify loading state appears
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/production/consume/**', route => route.abort());

    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify error message
    await helpers.verifyErrorMessage('Failed to load consumption data');
  });

  test('should maintain filter state on refresh', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Apply filter
    await page.selectOption('select[name="work_order_filter"]', { index: 1 });

    // Refresh page
    await page.reload();

    // Verify filter is maintained
    await expect(page.locator('select[name="work_order_filter"]')).toHaveValue('1');
  });

  test('should display consumption data with proper formatting', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify quantities are formatted correctly
    const quantityCells = page.locator('td:has-text("kg")');
    if (await quantityCells.count() > 0) {
      const firstQuantity = await quantityCells.first().textContent();
      expect(firstQuantity).toMatch(/\d+\.\d+kg/);
    }
  });

  test('should show consumption data tooltips', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Hover over consumption data to show tooltip
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.hover();
      await expect(page.locator('[data-testid="tooltip"]')).toBeVisible();
    }
  });

  test('should calculate variance percentages correctly', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify variance calculation logic
    const standardQty = await page.locator('td:has-text("kg")').first().textContent();
    const actualQty = await page.locator('td:has-text("kg")').nth(1).textContent();
    const variancePercent = await page.locator('td:has-text("%")').first().textContent();

    if (standardQty && actualQty && variancePercent) {
      const standard = parseFloat(standardQty.replace('kg', ''));
      const actual = parseFloat(actualQty.replace('kg', ''));
      const variance = parseFloat(variancePercent.replace('%', ''));
      const expectedVariance = ((actual - standard) / standard) * 100;
      expect(variance).toBeCloseTo(expectedVariance, 1);
    }
  });

  test('should show consumption comparison with previous period', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify comparison data is displayed
    await expect(page.locator('[data-testid="consumption-comparison"]')).toBeVisible();
  });

  test('should display consumption by operation', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify operation breakdown is displayed
    await expect(page.locator('[data-testid="operation-breakdown"]')).toBeVisible();
  });

  test('should show consumption by material category', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('consume-report');

    // Verify material category breakdown is displayed
    await expect(page.locator('[data-testid="category-breakdown"]')).toBeVisible();
  });
});
