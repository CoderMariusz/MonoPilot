import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Production - Operations Tab', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should select work order', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order from dropdown
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify work order is selected
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
  });

  test('should display operations list', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify operations list is displayed
    await expect(page.locator('[data-testid="operations-list"]')).toBeVisible();
    await expect(page.locator('text="Operation 1"')).toBeVisible();
    await expect(page.locator('text="Operation 2"')).toBeVisible();
  });

  test('should record operation weights', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Verify record weights modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Record Operation Weights');

    // Fill weight data
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');

    // Save weights
    await page.click('button:has-text("Save")');

    // Verify success message
    await helpers.verifyToast('Weights recorded successfully');
  });

  test('should show per-operation yield', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify per-operation yield is displayed
    await expect(page.locator('[data-testid="operation-yield"]')).toBeVisible();
  });

  test('should display loss tracking (cooking, trim, marinade)', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify loss tracking is displayed
    await expect(page.locator('[data-testid="loss-tracking"]')).toBeVisible();
    await expect(page.locator('text="Cooking Loss"')).toBeVisible();
    await expect(page.locator('text="Trim Loss"')).toBeVisible();
    await expect(page.locator('text="Marinade Loss"')).toBeVisible();
  });

  test('should track operation progress', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify operation progress is displayed
    await expect(page.locator('[data-testid="operation-progress"]')).toBeVisible();
  });

  test('should show operation status indicators', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify status indicators are displayed
    await expect(page.locator('[data-testid="status-indicator"]')).toBeVisible();
  });

  test('should display operation timestamps', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify timestamps are displayed
    await expect(page.locator('[data-testid="operation-timestamps"]')).toBeVisible();
  });

  test('should show operation quality checks', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify quality checks are displayed
    await expect(page.locator('[data-testid="quality-checks"]')).toBeVisible();
  });

  test('should display operation parameters', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify operation parameters are displayed
    await expect(page.locator('[data-testid="operation-parameters"]')).toBeVisible();
  });

  test('should show operation notes', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify operation notes are displayed
    await expect(page.locator('[data-testid="operation-notes"]')).toBeVisible();
  });

  test('should validate weight inputs', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Try to save without filling weights
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Input weight is required');
    await helpers.verifyToast('Output weight is required');
  });

  test('should validate weight values are positive', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Fill with negative weights
    await page.fill('input[name="input_weight"]', '-10');
    await page.fill('input[name="output_weight"]', '-5');

    // Try to save
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Weight must be a positive number');
  });

  test('should validate output weight is not greater than input weight', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Fill with output weight greater than input weight
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '150');

    // Try to save
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Output weight cannot be greater than input weight');
  });

  test('should close record weights modal on cancel', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close record weights modal on escape key', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display loading state during weight recording', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Fill weight data
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/production/operations/**', route => route.abort());

    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click record weights button
    await page.click('button:has-text("Record Weights")');

    // Fill weight data
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');

    // Click save
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should refresh operations data', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Click refresh button
    await page.click('button[aria-label="Refresh"]');

    // Verify loading state appears briefly
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle empty operations list', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/production/operations/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });

    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify empty state message
    await expect(page.locator('text="No operations found"')).toBeVisible();
  });

  test('should maintain work order selection on refresh', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Refresh page
    await page.reload();

    // Verify work order selection is maintained
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
  });

  test('should display operation yield calculations', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify yield calculations are displayed
    await expect(page.locator('[data-testid="yield-calculations"]')).toBeVisible();
  });

  test('should show operation efficiency metrics', async ({ page }) => {
    await helpers.navigateToProduction();
    await helpers.clickTab('operations');

    // Select work order first
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify efficiency metrics are displayed
    await expect(page.locator('[data-testid="efficiency-metrics"]')).toBeVisible();
  });
});
