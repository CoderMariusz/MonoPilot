import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Warehouse - LP Operations', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.warehouse.email, testUsers.warehouse.password);
  });

  test('should display license plates list', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify license plates table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("License Plate")')).toBeVisible();
    await expect(page.locator('th:has-text("Product")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible();
    await expect(page.locator('th:has-text("Location")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should split license plate', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click split button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();

    // Verify split modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Split License Plate');

    // Enter split quantity
    await page.fill('input[name="split_quantity"]', '25');

    // Click split button
    await page.click('button:has-text("Split")');

    // Verify success message
    await helpers.verifyToast('License plate split successfully');
  });

  test('should amend LP quantity', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click amend button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Amend LP"]').click();

    // Verify amend modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Amend License Plate');

    // Enter new quantity
    await page.fill('input[name="new_quantity"]', '75');

    // Click amend button
    await page.click('button:has-text("Amend")');

    // Verify success message
    await helpers.verifyToast('License plate quantity amended successfully');
  });

  test('should change LP location', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click change location button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Change Location"]').click();

    // Verify change location modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Change Location');

    // Select new location
    await page.selectOption('select[name="new_location"]', { index: 2 });

    // Click change location button
    await page.click('button:has-text("Change Location")');

    // Verify success message
    await helpers.verifyToast('Location changed successfully');
  });

  test('should update QA status', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click update QA status button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Update QA Status"]').click();

    // Verify update QA status modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Update QA Status');

    // Select new QA status
    await page.selectOption('select[name="qa_status"]', 'APPROVED');

    // Click update button
    await page.click('button:has-text("Update")');

    // Verify success message
    await helpers.verifyToast('QA status updated successfully');
  });

  test('should view LP details', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click view details button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('License Plate Details');
  });

  test('should filter by status', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'AVAILABLE');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('AVAILABLE');
  });

  test('should filter by location', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Filter by location
    await page.selectOption('select[name="location_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="location_filter"]')).toHaveValue('1');
  });

  test('should filter by product', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Filter by product
    await page.selectOption('select[name="product_filter"]', { index: 1 });

    // Verify filter is applied
    await expect(page.locator('select[name="product_filter"]')).toHaveValue('1');
  });

  test('should search license plates', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Search for specific license plate
    await helpers.searchInTable('LP-');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should export license plates', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate split quantity', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click split button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();

    // Try to split without entering quantity
    await page.click('button:has-text/-text("Split")');

    // Verify validation error
    await helpers.verifyToast('Split quantity is required');
  });

  test('should validate split quantity is positive', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click split button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();

    // Enter negative split quantity
    await page.fill('input[name="split_quantity"]', '-10');

    // Click split button
    await page.click('button:has-text("Split")');

    // Verify validation error
    await helpers.verifyToast('Split quantity must be a positive number');
  });

  test('should validate split quantity is not greater than available quantity', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click split button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();

    // Enter split quantity greater than available
    await page.fill('input[name="split_quantity"]', '1000');

    // Click split button
    await page.click('button:has-text("Split")');

    // Verify validation error
    await helpers.verifyToast('Split quantity cannot be greater than available quantity');
  });

  test('should validate amend quantity is positive', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click amend button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Amend LP"]').click();

    // Enter negative amend quantity
    await page.fill('input[name="new_quantity"]', '-10');

    // Click amend button
    await page.click('button:has-text("Amend")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be a positive number');
  });

  test('should validate amend quantity is not zero', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click amend button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Amend LP"]').click();

    // Enter zero amend quantity
    await page.fill('input[name="new_quantity"]', '0');

    // Click amend button
    await page.click('button:has-text("Amend")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be greater than zero');
  });

  test('should validate location change', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click change location button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Change Location"]').click();

    // Try to change location without selecting new location
    await page.click('button:has-text("Change Location")');

    // Verify validation error
    await helpers.verifyToast('New location is required');
  });

  test('should validate QA status update', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click update QA status button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Update QA Status"]').click();

    // Try to update QA status without selecting new status
    await page.click('button:has-text("Update")');

    // Verify validation error
    await helpers.verifyToast('QA status is required');
  });

  test('should close modals on cancel', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Test split modal
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal')).toBeHidden();

    // Test amend modal
    await firstLP.locator('button[aria-label="Amend LP"]').click();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal')).toBeHidden();

    // Test change location modal
    await firstLP.locator('button[aria-label="Change Location"]').click();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal')).toBeHidden();

    // Test update QA status modal
    await firstLP.locator('button[aria-label="Update QA Status"]').click();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modals on escape key', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Test split modal
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).toBeHidden();

    // Test amend modal
    await firstLP.locator('button[aria-label="Amend LP"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).toBeHidden();

    // Test change location modal
    await firstLP.locator('button[aria-label="Change Location"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).toBeHidden();

    // Test update QA status modal
    await firstLP.locator('button[aria-label="Update QA Status"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display loading states during operations', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Test split loading state
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();
    await page.fill('input[name="split_quantity"]', '25');
    await page.click('button:has-text("Split")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Split")')).toContainText('Splitting...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/warehouse/lp-operations/**', route => route.abort());

    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Click split button on first license plate
    const firstLP = page.locator('table tbody tr').first();
    await firstLP.locator('button[aria-label="Split LP"]').click();
    await page.fill('input[name="split_quantity"]', '25');
    await page.click('button:has-text("Split")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display LP status badges', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify status badges are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show LP quantity information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify quantity information is displayed
    await expect(page.locator('[data-testid="quantity-info"]')).toBeVisible();
  });

  test('should display LP location information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify location information is displayed
    await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
  });

  test('should show LP product information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify product information is displayed
    await expect(page.locator('[data-testid="product-info"]')).toBeVisible();
  });

  test('should display LP date information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify date information is displayed
    await expect(page.locator('[data-testid="date-info"]')).toBeVisible();
  });

  test('should show LP user information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify user information is displayed
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should display LP quality information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify quality information is displayed
    await expect(page.locator('[data-testid="quality-info"]')).toBeVisible();
  });

  test('should show LP batch information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify batch information is displayed
    await expect(page.locator('[data-testid="batch-info"]')).toBeVisible();
  });

  test('should display LP expiry information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify expiry information is displayed
    await expect(page.locator('[data-testid="expiry-info"]')).toBeVisible();
  });

  test('should show LP supplier information', async ({ page }) => {
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');

    // Verify supplier information is displayed
    await expect(page.locator('[data-testid="supplier-info"]')).toBeVisible();
  });
});
