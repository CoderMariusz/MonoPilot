import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Warehouse - GRN (Goods Receipt Note)', () => {
  let helpers: TestHelpers;
  const testGRNNumber = `GRN-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.warehouse.email, testUsers.warehouse.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestGRN(testGRNNumber);
  });

  test('should create GRN from PO', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Click Create GRN button
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Select purchase order
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    // Save GRN
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('GRN created successfully');
  });

  test('should add line items to GRN', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Click Create GRN button
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Select purchase order
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].received_quantity"]', '50');

    // Save GRN
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('GRN created successfully');
  });

  test('should generate license plates automatically', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Click Create GRN button
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Select purchase order
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    // Save GRN
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('GRN created successfully');

    // Verify license plates were generated
    await expect(page.locator('text="License plates generated"')).toBeVisible();
  });

  test('should view GRN details', async ({ page }) => {
    // First create a GRN
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');
    await page.click('button:has-text("Save")');

    // View details
    const grnRow = page.locator(`tr:has-text("${testGRNNumber}")`);
    await grnRow.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('GRN Details');
  });

  test('should filter GRNs by date', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Filter by date range
    await page.fill('input[name="date_from"]', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.fill('input[name="date_to"]', new Date().toISOString().split('T')[0]);

    // Apply filter
    await page.click('button:has-text("Apply Filter")');

    // Verify filter is applied
    await expect(page.locator('input[name="date_from"]')).toHaveValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  });

  test('should filter GRNs by status', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'Draft');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('Draft');
  });

  test('should filter GRNs by supplier', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Filter by supplier
    await page.selectOption('select[name="supplier_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="supplier_filter"]')).toHaveValue('1');
  });

  test('should export GRNs', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('select[name="purchase_order_id"]')).toHaveAttribute('required');
    await helpers.verifyToast('Purchase order is required');
  });

  test('should validate line item required fields', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add line item without filling required fields
    await page.click('button:has-text("Add Line Item")');
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Product is required');
    await helpers.verifyToast('Quantity is required');
    await helpers.verifyToast('Received quantity is required');
  });

  test('should validate received quantity is not greater than ordered quantity', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add line item with received quantity greater than ordered quantity
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '150');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Received quantity cannot be greater than ordered quantity');
  });

  test('should validate quantities are positive', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add line item with negative quantities
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '-10');
    await page.fill('input[name="items[0].received_quantity"]', '-5');
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Quantity must be a positive number');
    await helpers.verifyToast('Received quantity must be a positive number');
  });

  test('should remove line item', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    // Remove line item
    await page.click('button[aria-label="Remove Line Item"]');

    // Verify line item is removed
    await expect(page.locator('select[name="items[0].product_id"]')).toBeHidden();
  });

  test('should calculate GRN total quantities', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].received_quantity"]', '50');

    // Verify GRN total is calculated
    await expect(page.locator('[data-testid="grn-total"]')).toContainText('150');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/warehouse/grn/**', route => route.abort());

    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');
    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display GRN status indicators', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show GRN progress indicators', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify progress indicators are displayed
    const progressIndicators = page.locator('[data-testid="progress-indicator"]');
    if (await progressIndicators.count() > 0) {
      await expect(progressIndicators.first()).toBeVisible();
    }
  });

  test('should display GRN quantity information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify quantity information is displayed
    await expect(page.locator('[data-testid="quantity-info"]')).toBeVisible();
  });

  test('should show GRN date information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify date information is displayed
    await expect(page.locator('[data-testid="date-info"]')).toBeVisible();
  });

  test('should display GRN supplier information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify supplier information is displayed
    await expect(page.locator('[data-testid="supplier-info"]')).toBeVisible();
  });

  test('should show GRN purchase order information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify purchase order information is displayed
    await expect(page.locator('[data-testid="purchase-order-info"]')).toBeVisible();
  });

  test('should display GRN license plate information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify license plate information is displayed
    await expect(page.locator('[data-testid="license-plate-info"]')).toBeVisible();
  });

  test('should show GRN quality information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify quality information is displayed
    await expect(page.locator('[data-testid="quality-info"]')).toBeVisible();
  });

  test('should display GRN location information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify location information is displayed
    await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
  });

  test('should show GRN user information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify user information is displayed
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should display GRN notes', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify notes are displayed
    await expect(page.locator('[data-testid="notes"]')).toBeVisible();
  });

  test('should show GRN attachments', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    // Verify attachments are displayed
    await expect(page.locator('[data-testid="attachments"]')).toBeVisible();
  });
});
