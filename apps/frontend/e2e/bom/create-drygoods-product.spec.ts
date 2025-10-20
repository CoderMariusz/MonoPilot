import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('BOM - Create DRYGOODS Product', () => {
  let helpers: TestHelpers;
  const testProductNumber = `DRY-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // Cleanup: delete test product
    await helpers.cleanupTestProduct(testProductNumber);
  });

  test('should create DRYGOODS product', async ({ page }) => {
    // Navigate to BOM module
    await helpers.navigateToBOM();

    // Open add item modal
    await helpers.openAddItemModal();

    // Select DRYGOODS category
    await helpers.selectCategory('DRYGOODS');

    // Fill product details
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should NOT show supplier field for DRYGOODS', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Verify supplier field is NOT visible
    await expect(page.locator('select[name="preferred_supplier_id"]')).toBeHidden();
  });

  test('should NOT show expiry policy field for DRYGOODS', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Verify expiry policy field is NOT visible
    await expect(page.locator('select[name="expiry_policy"]')).toBeHidden();
  });

  test('should NOT show shelf life field for DRYGOODS', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Verify shelf life field is NOT visible
    await expect(page.locator('input[name="shelf_life_days"]')).toBeHidden();
  });

  test('should validate required fields for DRYGOODS product', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('input[name="part_number"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="description"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="uom"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="std_price"]')).toHaveAttribute('required');
  });

  test('should validate price is a positive number', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with invalid price
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '-2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Price must be a positive number');
  });

  test('should validate part number is unique', async ({ page }) => {
    // First, create a product
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });
    await helpers.saveProduct();

    // Try to create another product with same part number
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'Another Test Flour',
      uom: 'kg',
      price: '3.00',
    });
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Part number already exists');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });

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
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should validate UOM field', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with empty UOM
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: '',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('UOM is required');
  });

  test('should validate description field', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with empty description
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: '',
      uom: 'kg',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Description is required');
  });

  test('should validate part number field', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with empty part number
    await helpers.fillProductForm({
      partNumber: '',
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Part number is required');
  });

  test('should validate part number format', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with invalid part number format
    await helpers.fillProductForm({
      partNumber: 'invalid part number!',
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Part number must contain only alphanumeric characters and hyphens');
  });

  test('should validate price format', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with invalid price format
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      price: 'invalid price',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Price must be a valid number');
  });

  test('should validate UOM format', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with invalid UOM format
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: 'invalid uom!',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('UOM must contain only alphanumeric characters');
  });

  test('should validate description length', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with description that's too long
    const longDescription = 'A'.repeat(256);
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: longDescription,
      uom: 'kg',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Description must be less than 255 characters');
  });

  test('should validate part number length', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with part number that's too long
    const longPartNumber = 'A'.repeat(51);
    await helpers.fillProductForm({
      partNumber: longPartNumber,
      description: 'E2E Test Flour',
      uom: 'kg',
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Part number must be less than 50 characters');
  });

  test('should validate UOM length', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');

    // Fill form with UOM that's too long
    const longUOM = 'A'.repeat(11);
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'E2E Test Flour',
      uom: longUOM,
      std_price: '2.50',
    });

    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('UOM must be less than 10 characters');
  });
});
