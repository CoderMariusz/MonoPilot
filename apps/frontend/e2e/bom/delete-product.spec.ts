import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('BOM - Delete Product', () => {
  let helpers: TestHelpers;
  const testProductNumber = `DELETE-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Create a test product first
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'Product to Delete',
      uom: 'kg',
      price: '10.00',
    });
    await helpers.saveProduct();
  });

  test('should delete product after confirmation', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeHidden();
  });

  test('should cancel delete operation', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Cancel deletion
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
    
    // Verify product is still in table
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should close delete modal on escape key', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
    
    // Verify product is still in table
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should not allow delete if product is in use', async ({ page }) => {
    // First create a work order that uses the product
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: `FG-${Date.now()}`,
      description: 'FG Product using test product',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await helpers.saveProduct();

    // Now try to delete the test product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify error message
    await helpers.verifyToast('Cannot delete product that is in use');
    
    // Verify product is still in table
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should display confirmation dialog with product details', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Verify confirmation dialog shows product details
    await expect(page.locator('.modal')).toContainText('Are you sure you want to delete this product?');
    await expect(page.locator('.modal')).toContainText(testProductNumber);
    await expect(page.locator('.modal')).toContainText('Product to Delete');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/products/**', route => route.abort());

    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify error handling
    await helpers.verifyToast('Network error');
    
    // Verify product is still in table
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should display loading state during deletion', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Confirm")')).toContainText('Deleting...');
  });

  test('should refresh table after successful deletion', async ({ page }) => {
    await helpers.navigateToBOM();

    // Click delete button for test product
    const productRow = page.locator(`tr:has-text("${testProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeHidden();
    
    // Verify table is refreshed (no loading state)
    await expect(page.locator('[data-testid="loading"]')).toBeHidden();
  });

  test('should handle deletion of product with BOM components', async ({ page }) => {
    // First create a FINISHED_GOODS product with BOM
    const fgProductNumber = `FG-DELETE-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product to Delete',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await helpers.saveProduct();

    // Now delete the FG product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${fgProductNumber}")`)).toBeHidden();
  });

  test('should handle deletion of product with MEAT-specific fields', async ({ page }) => {
    // First create a MEAT product
    const meatProductNumber = `MEAT-DELETE-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('MEAT');
    await helpers.fillProductForm({
      partNumber: meatProductNumber,
      description: 'MEAT Product to Delete',
      uom: 'kg',
      price: '25.50',
    });
    await page.selectOption('select[name="expiry_policy"]', 'FROM_DELIVERY_DATE');
    await page.fill('input[name="shelf_life_days"]', '7');
    await page.selectOption('select[name="preferred_supplier_id"]', { index: 1 });
    await helpers.saveProduct();

    // Now delete the MEAT product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${meatProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${meatProductNumber}")`)).toBeHidden();
  });

  test('should handle deletion of product with PROCESS-specific fields', async ({ page }) => {
    // First create a PROCESS product
    const processProductNumber = `PROC-DELETE-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('PROCESS');
    await helpers.fillProductForm({
      partNumber: processProductNumber,
      description: 'PROCESS Product to Delete',
      uom: 'kg',
      price: '15.00',
    });
    await helpers.saveProduct();

    // Now delete the PROCESS product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${processProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${processProductNumber}")`)).toBeHidden();
  });

  test('should handle deletion of product with DRYGOODS-specific fields', async ({ page }) => {
    // First create a DRYGOODS product
    const dryProductNumber = `DRY-DELETE-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: dryProductNumber,
      description: 'DRYGOODS Product to Delete',
      uom: 'kg',
      price: '5.00',
    });
    await helpers.saveProduct();

    // Now delete the DRYGOODS product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${dryProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${dryProductNumber}")`)).toBeHidden();
  });

  test('should handle deletion of product with multiple BOM components', async ({ page }) => {
    // First create a FINISHED_GOODS product with multiple BOM components
    const fgProductNumber = `FG-MULTI-DELETE-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product with Multiple BOM Components',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    
    // Add first BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    
    // Add second BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[1].material_id"]', { index: 2 });
    await page.fill('input[name="bom_components[1].quantity"]', '5');
    await page.fill('input[name="bom_components[1].uom"]', 'kg');
    
    await helpers.saveProduct();

    // Now delete the FG product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${fgProductNumber}")`)).toBeHidden();
  });

  test('should handle deletion of product with BOM component flags', async ({ page }) => {
    // First create a FINISHED_GOODS product with BOM component flags
    const fgProductNumber = `FG-FLAGS-DELETE-${Date.now()}`;
    
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');
    await helpers.fillProductForm({
      partNumber: fgProductNumber,
      description: 'FG Product with BOM Component Flags',
      uom: 'box',
      price: '50.00',
    });
    await page.click('button:has-text("Next")');
    
    // Add BOM component with flags
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await page.check('input[name="bom_components[0].is_optional"]');
    await page.check('input[name="bom_components[0].is_phantom"]');
    await page.check('input[name="bom_components[0].one_to_one"]');
    
    await helpers.saveProduct();

    // Now delete the FG product
    await helpers.navigateToBOM();
    const productRow = page.locator(`tr:has-text("${fgProductNumber}")`);
    await productRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await helpers.verifyToast('Product deleted successfully');
    
    // Verify product is removed from table
    await expect(page.locator(`tr:has-text("${fgProductNumber}")`)).toBeHidden();
  });
});
