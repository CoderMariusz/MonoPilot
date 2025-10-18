import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Production - Trace Tab', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should perform forward trace from LP', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Select forward trace
    await page.click('button:has-text("Forward Trace")');

    // Enter LP code
    await page.fill('input[name="lp_code"]', 'LP-001');

    // Click trace button
    await page.click('button:has-text("Trace")');

    // Verify trace results are displayed
    await expect(page.locator('[data-testid="trace-results"]')).toBeVisible();
  });

  test('should perform backward trace from FG', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Select backward trace
    await page.click('button:has-text("Backward Trace")');

    // Enter FG product code
    await page.fill('input[name="product_code"]', 'FG-001');

    // Click trace button
    await page.click('button:has-text("Trace")');

    // Verify trace results are displayed
    await expect(page.locator('[data-testid="trace-results"]')).toBeVisible();
  });

  test('should display trace tree', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify trace tree is displayed
    await expect(page.locator('[data-testid="trace-tree"]')).toBeVisible();
  });

  test('should show node details on click', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Click on a trace node
    const traceNode = page.locator('[data-testid="trace-node"]').first();
    if (await traceNode.count() > 0) {
      await traceNode.click();

      // Verify node details are displayed
      await expect(page.locator('[data-testid="node-details"]')).toBeVisible();
    }
  });

  test('should display QA status badges', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify QA status badges are displayed
    await expect(page.locator('[data-testid="qa-status-badge"]')).toBeVisible();
  });

  test('should show stage suffixes', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify stage suffixes are displayed
    await expect(page.locator('[data-testid="stage-suffix"]')).toBeVisible();
  });

  test('should export trace report', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate LP code input', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Select forward trace
    await page.click('button:has-text("Forward Trace")');

    // Try to trace without entering LP code
    await page.click('button:has-text("Trace")');

    // Verify validation error
    await helpers.verifyToast('LP code is required');
  });

  test('should validate product code input', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Select backward trace
    await page.click('button:has-text("Backward Trace")');

    // Try to trace without entering product code
    await page.click('button:has-text("Trace")');

    // Verify validation error
    await helpers.verifyToast('Product code is required');
  });

  test('should handle invalid LP code', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Select forward trace
    await page.click('button:has-text("Forward Trace")');

    // Enter invalid LP code
    await page.fill('input[name="lp_code"]', 'INVALID-LP');

    // Click trace button
    await page.click('button:has-text("Trace")');

    // Verify error message
    await helpers.verifyErrorMessage('LP code not found');
  });

  test('should handle invalid product code', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Select backward trace
    await page.click('button:has-text("Backward Trace")');

    // Enter invalid product code
    await page.fill('input[name="product_code"]', 'INVALID-PRODUCT');

    // Click trace button
    await page.click('button:has-text("Trace")');

    // Verify error message
    await helpers.verifyErrorMessage('Product code not found');
  });

  test('should clear trace results', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Clear trace results
    await page.click('button:has-text("Clear")');

    // Verify trace results are cleared
    await expect(page.locator('[data-testid="trace-results"]')).toBeHidden();
  });

  test('should display trace loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/production/trace/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      }, 1000);
    });

    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify loading state appears
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/production/trace/**', route => route.abort());

    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify error handling
    await helpers.verifyErrorMessage('Network error');
  });

  test('should display trace statistics', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify trace statistics are displayed
    await expect(page.locator('[data-testid="trace-statistics"]')).toBeVisible();
  });

  test('should show trace timeline', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify trace timeline is displayed
    await expect(page.locator('[data-testid="trace-timeline"]')).toBeVisible();
  });

  test('should display trace quality information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify quality information is displayed
    await expect(page.locator('[data-testid="trace-quality"]')).toBeVisible();
  });

  test('should show trace quantity information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify quantity information is displayed
    await expect(page.locator('[data-testid="trace-quantity"]')).toBeVisible();
  });

  test('should display trace location information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify location information is displayed
    await expect(page.locator('[data-testid="trace-location"]')).toBeVisible();
  });

  test('should show trace date information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify date information is displayed
    await expect(page.locator('[data-testid="trace-date"]')).toBeVisible();
  });

  test('should display trace user information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify user information is displayed
    await expect(page.locator('[data-testid="trace-user"]')).toBeVisible();
  });

  test('should show trace operation information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify operation information is displayed
    await expect(page.locator('[data-testid="trace-operation"]')).toBeVisible();
  });

  test('should display trace material information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify material information is displayed
    await expect(page.locator('[data-testid="trace-material"]')).toBeVisible();
  });

  test('should show trace work order information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify work order information is displayed
    await expect(page.locator('[data-testid="trace-work-order"]')).toBeVisible();
  });

  test('should display trace supplier information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify supplier information is displayed
    await expect(page.locator('[data-testid="trace-supplier"]')).toBeVisible();
  });

  test('should show trace batch information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify batch information is displayed
    await expect(page.locator('[data-testid="trace-batch"]')).toBeVisible();
  });

  test('should display trace expiry information', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('trace');

    // Perform forward trace
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');

    // Verify expiry information is displayed
    await expect(page.locator('[data-testid="trace-expiry"]')).toBeVisible();
  });
});
