import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('BOM - Edit Product', () => {
  let helpers: TestHelpers;
  const testProductNumber = `EDIT-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Create a test product first
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'Original Description',
      uom: 'kg',
      price: '10.00',
    });
    await helpers.saveProduct();
  });

  test.afterEach(async () => {
    await helpers.cleanupTestProduct(testProductNumber);
  });

  test('should edit existing product', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('input[name="description"]', 'Updated Description');
    
    // Save changes
    await helpers.saveProduct();

    // Verify update
    await helpers.verifyToast('Product updated successfully');
    await expect(page.locator(`tr:has-text("Updated Description")`)).toBeVisible();
  });

  test('should edit product price', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify price
    await page.fill('input[name="std_price"]', '15.50');
    
    // Save changes
    await helpers.saveProduct();

    // Verify update
    await helpers.verifyToast('Product updated successfully');
    await expect(page.locator(`tr:has-text("15.50")`)).toBeVisible();
  });

  test('should edit product UOM', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify UOM
    await page.fill('input[name="uom"]', 'box');
    
    // Save changes
    await helpers.saveProduct();

    // Verify update
    await helpers.verifyToast('Product updated successfully');
    await expect(page.locator(`tr:has-text("box")`)).toBeVisible();
  });

  test('should update BOM components for FINISHED_GOODS', async ({ page }) => {
    // First create a FINISHED_GOODS product with BOM
    const fgProductNumber = `FG-EDIT-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product for Edit Test',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await helpers.saveProduct();

    // Now edit the BOM components
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify BOM component quantity
    await page.fill('input[name="bom_components[0].quantity"]', '15');
    
    // Save changes
    await helpers.saveProduct();

    // Verify update
    await helpers.verifyToast('Product updated successfully');

    // Cleanup
    await helpers.cleanupTestProduct(fgProductNumber);
  });

  test('should remove BOM components', async ({ page }) => {
    // First create a FINISHED_GOODS product with BOM
    const fgProductNumber = `FG-EDIT-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product for Edit Test',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await helpers.saveProduct();

    // Now edit the BOM components
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Remove BOM component
    await page.click('button[aria-label="Remove Component"]');
    
    // Save changes
    await helpers.saveProduct();

    // Verify update
    await helpers.verifyToast('Product updated successfully');

    // Cleanup
    await helpers.cleanupTestProduct(fgProductNumber);
  });

  test('should validate required fields during edit', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Clear required fields
    await page.fill('input[name="description"]', '');
    await page.fill('input[name="std_price"]', '');
    
    // Try to save
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Description is required');
    await helpers.verifyToast('Price is required');
  });

  test('should validate price is positive during edit', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Set negative price
    await page.fill('input[name="std_price"]', '-10.00');
    
    // Try to save
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Price must be a positive number');
  });

  test('should validate UOM format during edit', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Set invalid UOM
    await page.fill('input[name="uom"]', 'invalid uom!');
    
    // Try to save
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('UOM must contain only alphanumeric characters');
  });

  test('should cancel edit without saving', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('input[name="description"]', 'Modified Description');
    
    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
    
    // Verify original description is still there
    await expect(page.locator(`tr:has-text("Original Description")`)).toBeVisible();
  });

  test('should close edit modal on escape key', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('input[name="description"]', 'Updated Description');
    
    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/products/**', route => route.abort());

    await helpers.navigateToBOM();

    // Click edit button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('input[name="description"]', 'Updated Description');
    
    // Click save
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should preserve BOM components when editing basic fields', async ({ page }) => {
    // First create a FINISHED_GOODS product with BOM
    const fgProductNumber = `FG-EDIT-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product for Edit Test',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await helpers.saveProduct();

    // Now edit basic fields
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('input[name="description"]', 'Updated FG Product');
    
    // Save changes
    await helpers.saveProduct();

    // Verify update
    await helpers.verifyToast('Product updated successfully');
    
    // Verify BOM components are preserved
    await expect(page.locator(`tr:has-text("${fgProductNumber}")`)).toBeVisible();

    // Cleanup
    await helpers.cleanupTestProduct(fgProductNumber);
  });

  test('should validate BOM component fields during edit', async ({ page }) => {
    // First create a FINISHED_GOODS product with BOM
    const fgProductNumber = `FG-EDIT-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product for Edit Test',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await helpers.saveProduct();

    // Now edit the BOM components
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Edit"]').click();

    // Clear BOM component fields
    await page.fill('input[name="bom_components[0].quantity"]', '');
    await page.fill('input[name="bom_components[0].uom"]', '');
    
    // Try to save
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Quantity is required');
    await helpers.verifyToast('UOM is required');

    // Cleanup
    await helpers.cleanupTestProduct(fgProductNumber);
  });
});
