import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers, testProducts } from '../fixtures/test-data';

test.describe('BOM - Create MEAT Product', () => {
  let helpers: TestHelpers;
  const testProductNumber = `MEAT-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // Cleanup: delete test product
    await helpers.cleanupTestProduct(testProductNumber);
  });

  test('should create MEAT product with all required fields', async ({ page }) => {
    // Navigate to BOM module
    await helpers.navigateToBOM();

    // Open add item modal
    await helpers.openAddItemModal();

    // Select MEAT category
    await helpers.selectCategory('MEAT');

    // Fill product details
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Beef',
      uom: 'kg',
      price: '25.50',
    });

    // Fill MEAT-specific fields
    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should show supplier field for MEAT category', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Verify supplier field is visible
    await expect(page.locator('select[name="preferred_supplier_id"]')).toBeVisible();
  });

  test('should show expiry policy field for MEAT category', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Verify expiry policy field is visible
    await expect(page.locator('select[name="expiry_policy"]')).toBeVisible();
  });

  test('should show shelf life field for MEAT category', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Verify shelf life field is visible
    await expect(page.locator('input[name="shelf_life_days"]')).toBeVisible();
  });

  test('should validate required fields for MEAT product', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('input[name="part_number"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="description"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="uom"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="std_price"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="preferred_supplier_id"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="expiry_policy"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="shelf_life_days"]')).toHaveAttribute('required');
  });

  test('should validate shelf life is a positive number', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Fill form with invalid shelf life
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Beef',
      uom: 'kg',
      price: '25.50',
    });

    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '-5');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Shelf life must be a positive number');
  });

  test('should validate price is a positive number', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Fill form with invalid price
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Beef',
      uom: 'kg',
      price: '-10.00',
    });

    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Price must be a positive number');
  });

  test('should validate part number is unique', async ({ page }) => {
    // First, create a product
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Beef',
      uom: 'kg',
      price: '25.50',
    });
    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });
    await helpers.saveProduct();

    // Try to create another product with same part number
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'Another Test Beef',
      uom: 'kg',
      price: '30.00',
    });
    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Part number already exists');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Beef',
      uom: 'kg',
      price: '25.50',
    });
    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/products/**', route => route.abort());

    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Beef',
      uom: 'kg',
      price: '25.50',
    });
    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });
});
