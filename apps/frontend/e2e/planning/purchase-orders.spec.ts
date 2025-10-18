import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Planning - Purchase Orders', () => {
  let helpers: TestHelpers;
  const testPONumber = `PO-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.purchasing.email, testUsers.purchasing.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestPurchaseOrder(testPONumber);
  });

  test('should create purchase order', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');

    // Click Create Purchase Order button
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill purchase order details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');

    // Save purchase order
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Purchase order created successfully');
  });

  test('should add multiple line items to PO', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');

    // Click Create Purchase Order button
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill purchase order details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].price"]', '15.75');

    // Save purchase order
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Purchase order created successfully');
  });

  test('should edit PO details', async ({ page }) => {
    // First create a PO
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');
    await page.click('button:has-text("Save")');

    // Now edit it
    const poRow = page.locator(`tr:has-text("${testPONumber}")`);
    await poRow.locator('button[aria-label="Edit"]').click();

    // Modify expected delivery date
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('Purchase order updated successfully');
  });

  test('should view PO details modal', async ({ page }) => {
    // First create a PO
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');
    await page.click('button:has-text("Save")');

    // View details
    const poRow = page.locator(`tr:has-text("${testPONumber}")`);
    await poRow.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Purchase Order Details');
  });

  test('should filter POs by supplier', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');

    // Filter by supplier
    await page.selectOption('select[name="supplier_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="supplier_filter"]')).toHaveValue('1');
  });

  test('should filter POs by status', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'Draft');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('Draft');
  });

  test('should export purchase orders', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('select[name="supplier_id"]')).toHaveAttribute('required');
    await helpers.verifyToast('Supplier is required');
  });

  test('should validate line item required fields', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item without filling required fields
    await page.click('button:has-text("Add Line Item")');
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Product is required');
    await helpers.verifyToast('Quantity is required');
    await helpers.verifyToast('Price is required');
  });

  test('should validate quantity is positive', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item with negative quantity
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '-10');
    await page.fill('input[name="items[0].price"]', '10.50');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be a positive number');
  });

  test('should validate price is positive', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item with negative price
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '-10.50');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Price must be a positive number');
  });

  test('should remove line item', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');

    // Remove line item
    await page.click('button[aria-label="Remove Line Item"]');

    // Verify line item is removed
    await expect(page.locator('select[name="items[0].product_id"]')).toBeHidden();
  });

  test('should calculate PO total', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].price"]', '15.75');

    // Verify PO total is calculated (1050 + 787.5 = 1837.5)
    await expect(page.locator('[data-testid="po-total"]')).toContainText('1837.50');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/purchase-orders/**', route => route.abort());

    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');
    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });
});
