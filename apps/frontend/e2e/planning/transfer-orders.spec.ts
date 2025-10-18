import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Planning - Transfer Orders', () => {
  let helpers: TestHelpers;
  const testTONumber = `TO-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.warehouse.email, testUsers.warehouse.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestTransferOrder(testTONumber);
  });

  test('should create transfer order', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');

    // Click Create Transfer Order button
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill transfer order details
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Save transfer order
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Transfer order created successfully');
  });

  test('should add items to transfer order', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');

    // Click Create Transfer Order button
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill transfer order details
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '25');

    // Save transfer order
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Transfer order created successfully');
  });

  test('should edit transfer order', async ({ page }) => {
    // First create a transfer order
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // Now edit it
    const transferRow = page.locator(`tr:has-text("${testTONumber}")`);
    await transferRow.locator('button[aria-label="Edit"]').click();

    // Modify quantity
    await page.fill('input[name="items[0].quantity"]', '75');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('Transfer order updated successfully');
  });

  test('should view transfer order details', async ({ page }) => {
    // First create a transfer order
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // View details
    const transferRow = page.locator(`tr:has-text("${testTONumber}")`);
    await transferRow.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Transfer Order Details');
  });

  test('should filter by source warehouse', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');

    // Filter by source warehouse
    await page.selectOption('select[name="from_warehouse_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="from_warehouse_filter"]')).toHaveValue('1');
  });

  test('should filter by destination warehouse', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');

    // Filter by destination warehouse
    await page.selectOption('select[name="to_warehouse_filter"]', { index: 2 });

    // Verify filter is applied
    await expect(page.locator('select[name="to_warehouse_filter"]')).toHaveValue('2');
  });

  test('should filter by status', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'Draft');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('Draft');
  });

  test('should export transfer orders', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('select[name="from_warehouse_id"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="to_warehouse_id"]')).toHaveAttribute('required');
  });

  test('should validate different source and destination warehouses', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill with same source and destination warehouse
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 1 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Source and destination warehouses must be different');
  });

  test('should validate line item required fields', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item without filling required fields
    await page.click('button:has-text("Add Line Item")');
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Product is required');
    await helpers.verifyToast('Quantity is required');
  });

  test('should validate quantity is positive', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item with negative quantity
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '-10');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be a positive number');
  });

  test('should remove line item', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Remove line item
    await page.click('button[aria-label="Remove Line Item"]');

    // Verify line item is removed
    await expect(page.locator('select[name="items[0].product_id"]')).toBeHidden();
  });

  test('should calculate transfer total quantities', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill basic details
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add first line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Add second line item
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '25');

    // Verify transfer total is calculated
    await expect(page.locator('[data-testid="transfer-total"]')).toContainText('75');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/transfer-orders/**', route => route.abort());

    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.selectOption('select[name="from_warehouse_id"]', { index: 1 });
    await page.selectOption('select[name="to_warehouse_id"]', { index: 2 });
    await page.fill('input[name="expected_transfer_date"]', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '50');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToPlanning();
    await helpers.clickTab('transfer-orders');
    await page.click('button:has-text("Create Transfer Order")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });
});
