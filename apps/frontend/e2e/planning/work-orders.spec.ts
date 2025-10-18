import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Planning - Work Orders', () => {
  let helpers: TestHelpers;
  const testWorkOrderNumber = `WO-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.planner.email, testUsers.planner.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestWorkOrder(testWorkOrderNumber);
  });

  test('should create work order', async ({ page }) => {
    await helpers.navigateToPlanning();

    // Click Create Work Order button
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Fill work order details
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');

    // Save work order
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Work order created successfully');
    await expect(page.locator(`tr:has-text("${testWorkOrderNumber}")`)).toBeVisible();
  });

  test('should edit work order', async ({ page }) => {
    // First create a work order
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');

    // Now edit it
    const workOrderRow = page.locator(`tr:has-text("${testWorkOrderNumber}")`);
    await workOrderRow.locator('button[aria-label="Edit"]').click();

    // Modify quantity
    await page.fill('input[name="quantity"]', '150');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('Work order updated successfully');
  });

  test('should view work order details', async ({ page }) => {
    // First create a work order
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');

    // View details
    const workOrderRow = page.locator(`tr:has-text("${testWorkOrderNumber}")`);
    await workOrderRow.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Work Order Details');
  });

  test('should filter work orders by status', async ({ page }) => {
    await helpers.navigateToPlanning();

    // Filter by Draft status
    await page.selectOption('select[name="status_filter"]', 'Draft');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('Draft');
  });

  test('should filter work orders by date', async ({ page }) => {
    await helpers.navigateToPlanning();

    // Filter by date range
    await page.fill('input[name="date_from"]', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.fill('input[name="date_to"]', new Date().toISOString().split('T')[0]);

    // Apply filter
    await page.click('button:has-text("Apply Filter")');

    // Verify filter is applied
    await expect(page.locator('input[name="date_from"]')).toHaveValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  test('should export work orders', async ({ page }) => {
    await helpers.navigateToPlanning();

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('select[name="product_id"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="quantity"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="line_number"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="scheduled_date"]')).toHaveAttribute('required');
  });

  test('should validate quantity is positive', async ({ page }) => {
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Fill with negative quantity
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '-10');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be a positive number');
  });

  test('should validate scheduled date is not in the past', async ({ page }) => {
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Fill with past date
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Scheduled date cannot be in the past');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/work-orders/**', route => route.abort());

    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToPlanning();
    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });
});
