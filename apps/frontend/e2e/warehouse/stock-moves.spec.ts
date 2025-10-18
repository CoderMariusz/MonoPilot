import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Warehouse - Stock Moves', () => {
  let helpers: TestHelpers;
  const testStockMoveNumber = `SM-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.warehouse.email, testUsers.warehouse.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestStockMove(testStockMoveNumber);
  });

  test('should create stock move', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Click Create Stock Move button
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill stock move details
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Save stock move
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Stock move created successfully');
  });

  test('should select move type', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Click Create Stock Move button
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Test different move types
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await expect(page.locator('select[name="move_type"]')).toHaveValue('TRANSFER');

    await page.selectOption('select[name="move_type"]', 'ADJUSTMENT');
    await expect(page.locator('select[name="move_type"]')).toHaveValue('ADJUSTMENT');

    await page.selectOption('select[name="move_type"]', 'ISSUE');
    await expect(page.locator('select[name="move_type"]')).toHaveValue('ISSUE');

    await page.selectOption('select[name="move_type"]', 'RECEIPT');
    await expect(page.locator('select[name="move_type"]')).toHaveValue('RECEIPT');
  });

  test('should view stock move details', async ({ page }) => {
    // First create a stock move
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // View details
    const stockMoveRow = page.locator(`tr:has-text("${testStockMoveNumber}")`);
    await stockMoveRow.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Stock Move Details');
  });

  test('should filter by move type', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Filter by move type
    await page.selectOption('select[name="move_type_filter"]', 'TRANSFER');

    // Verify filter is applied
    await expect(page.locator('select[name="move_type_filter"]')).toHaveValue('TRANSFER');
  });

  test('should filter by date', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Filter by date range
    await page.fill('input[name="date_from"]', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.fill('input[name="date_to"]', new Date().toISOString().split('T')[0]);

    // Apply filter
    await page.click('button:has-text("Apply Filter")');

    // Verify filter is applied
    await expect(page.locator('input[name="date_from"]')).toHaveValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  test('should filter by location', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Filter by location
    await page.selectOption('select[name="location_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="location_filter"]')).toHaveValue('1');
  });

  test('should export stock moves', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('select[name="move_type"]')).toHaveAttribute('required');
    await helpers.verifyToast('Move type is required');
  });

  test('should validate line item required fields', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });

    // Add line item without filling required fields
    await page.click('button:has-text("Add Line Item")');
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Product is required');
    await helpers.verifyToast('Quantity is required');
  });

  test('should validate quantity is positive', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });

    // Add line item with negative quantity
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '-10');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be a positive number');
  });

  test('should validate different source and destination locations for transfer', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill with same source and destination location
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 1 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Source and destination locations must be different for transfer');
  });

  test('should remove line item', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Remove line item
    await page.click('button[aria-label="Remove Line Item"]');

    // Verify line item is removed
    await expect(page.locator('select[name="items[0].product_id"]')).toBeHidden();
  });

  test('should calculate stock move total quantities', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '25');

    // Verify stock move total is calculated
    await expect(page.locator('[data-testid="stock-move-total"]')).toContainText('75');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/warehouse/stock-moves/**', route => route.abort());

    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="move_type"]', 'TRANSFER');
    await page.selectOption('select[name="from_location_id"]', { index: 1 });
    await page.selectOption('select[name="to_location_id"]', { index: 2 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');
    await page.click('button:has-text("Create Stock Move")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display stock move status indicators', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show stock move progress indicators', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify progress indicators are displayed
    const progressIndicators = page.locator('[data-testid="progress-indicator"]');
    if (await progressIndicators.count() > 0) {
      await expect(progressIndicators.first()).toBeVisible();
    }
  });

  test('should display stock move quantity information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify quantity information is displayed
    await expect(page.locator('[data-testid="quantity-info"]')).toBeVisible();
  });

  test('should show stock move date information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify date information is displayed
    await expect(page.locator('[data-testid="date-info"]')).toBeVisible();
  });

  test('should display stock move location information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify location information is displayed
    await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
  });

  test('should show stock move user information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify user information is displayed
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should display stock move notes', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify notes are displayed
    await expect(page.locator('[data-testid="notes"]')).toBeVisible();
  });

  test('should show stock move attachments', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('stock-move');

    // Verify attachments are displayed
    await expect(page.locator('[data-testid="attachments"]')).toBeVisible();
  });
});
