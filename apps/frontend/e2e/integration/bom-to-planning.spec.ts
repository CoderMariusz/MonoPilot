import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Integration - BOM to Planning', () => {
  let helpers: TestHelpers;
  const testProductName = `BOM-PLAN-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestProduct(testProductName);
  });

  test('should create product in BOM then use in work order', async ({ page }) => {
    // Step 1: Create product in BOM module
    await helpers.navigateToBOM();

    // Create component products first
    const componentName = helpers.data.generateUniqueName('Comp');
    const componentSku = helpers.data.generateUniqueSku('C');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: componentName,
      description: 'Component for BOM to Planning integration',
      sku: componentSku,
      unit: 'kg',
      category: 'DRY_GOODS',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Create finished goods product with BOM
    const fgProductName = testProductName;
    const fgProductSku = helpers.data.generateUniqueSku('FG');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: fgProductName,
      description: 'Finished goods for BOM to Planning integration',
      sku: fgProductSku,
      unit: 'unit',
      category: 'FINISHED_GOODS',
      oneToOne: true,
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Edit FG to add BOM component
    await helpers.openEditModal(fgProductName);
    await helpers.addBomComponent(componentName, '10', 'kg');
    await helpers.saveProduct();
    await helpers.assert.toast('Product updated successfully');

    // Step 2: Create work order in Planning module using the product
    await helpers.navigateToPlanning();

    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');

    await page.click('button:has-text("Save")');
    await helpers.assert.toast('Work order created successfully');

    // Step 3: Verify work order includes BOM components
    await helpers.assert.expectTableRowToBeVisible(testProductName);

    // Click on work order to view details
    const workOrderRow = page.locator(`tr:has-text("${testProductName}")`);
    await workOrderRow.locator('button[aria-label="View Details"]').click();

    // Verify BOM components are displayed in work order details
    await expect(page.locator('[data-testid="bom-components"]')).toBeVisible();
    await expect(page.locator('text="Component"')).toBeVisible();
  });

  test('should validate BOM components in work order creation', async ({ page }) => {
    // Create product without BOM
    await helpers.navigateToBOM();

    const productName = testProductName;
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: productName,
      description: 'Product without BOM',
      sku: helpers.data.generateUniqueSku('NO-BOM'),
      unit: 'unit',
      category: 'FINISHED_GOODS',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Try to create work order without BOM
    await helpers.navigateToPlanning();

    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.assert.toast('Product must have BOM components to create work order');
  });

  test('should sync BOM changes to existing work orders', async ({ page }) => {
    // Create product with BOM
    await helpers.navigateToBOM();

    const componentName = helpers.data.generateUniqueName('Comp');
    const componentSku = helpers.data.generateUniqueSku('C');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: componentName,
      description: 'Component for BOM sync test',
      sku: componentSku,
      unit: 'kg',
      category: 'DRY_GOODS',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    const fgProductName = testProductName;
    const fgProductSku = helpers.data.generateUniqueSku('FG');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: fgProductName,
      description: 'Finished goods for BOM sync test',
      sku: fgProductSku,
      unit: 'unit',
      category: 'FINISHED_GOODS',
      oneToOne: true,
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Edit FG to add BOM component
    await helpers.openEditModal(fgProductName);
    await helpers.addBomComponent(componentName, '10', 'kg');
    await helpers.saveProduct();
    await helpers.assert.toast('Product updated successfully');

    // Create work order
    await helpers.navigateToPlanning();

    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');
    await helpers.assert.toast('Work order created successfully');

    // Modify BOM in BOM module
    await helpers.navigateToBOM();
    await helpers.openEditModal(fgProductName);
    await helpers.addBomComponent(componentName, '15', 'kg'); // Change quantity
    await helpers.saveProduct();
    await helpers.assert.toast('Product updated successfully');

    // Verify work order reflects BOM changes
    await helpers.navigateToPlanning();
    const workOrderRow = page.locator(`tr:has-text("${fgProductName}")`);
    await workOrderRow.locator('button[aria-label="View Details"]').click();

    // Verify BOM changes are reflected
    await expect(page.locator('text="15 kg"')).toBeVisible();
  });

  test('should handle BOM component availability in work orders', async ({ page }) => {
    // Create product with BOM
    await helpers.navigateToBOM();

    const componentName = helpers.data.generateUniqueName('Comp');
    const componentSku = helpers.data.generateUniqueSku('C');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: componentName,
      description: 'Component for availability test',
      sku: componentSku,
      unit: 'kg',
      category: 'DRY_GOODS',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    const fgProductName = testProductName;
    const fgProductSku = helpers.data.generateUniqueSku('FG');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: fgProductName,
      description: 'Finished goods for availability test',
      sku: fgProductSku,
      unit: 'unit',
      category: 'FINISHED_GOODS',
      oneToOne: true,
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Edit FG to add BOM component
    await helpers.openEditModal(fgProductName);
    await helpers.addBomComponent(componentName, '100', 'kg');
    await helpers.saveProduct();
    await helpers.assert.toast('Product updated successfully');

    // Create work order
    await helpers.navigateToPlanning();

    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');
    await helpers.assert.toast('Work order created successfully');

    // Verify component availability is checked
    const workOrderRow = page.locator(`tr:has-text("${fgProductName}")`);
    await workOrderRow.locator('button[aria-label="View Details"]').click();

    // Verify availability status is displayed
    await expect(page.locator('[data-testid="component-availability"]')).toBeVisible();
  });

  test('should validate BOM component quantities in work orders', async ({ page }) => {
    // Create product with BOM
    await helpers.navigateToBOM();

    const componentName = helpers.data.generateUniqueName('Comp');
    const componentSku = helpers.data.generateUniqueSku('C');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: componentName,
      description: 'Component for quantity validation test',
      sku: componentSku,
      unit: 'kg',
      category: 'DRY_GOODS',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    const fgProductName = testProductName;
    const fgProductSku = helpers.data.generateUniqueSku('FG');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: fgProductName,
      description: 'Finished goods for quantity validation test',
      sku: fgProductSku,
      unit: 'unit',
      category: 'FINISHED_GOODS',
      oneToOne: true,
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Edit FG to add BOM component
    await helpers.openEditModal(fgProductName);
    await helpers.addBomComponent(componentName, '10', 'kg');
    await helpers.saveProduct();
    await helpers.assert.toast('Product updated successfully');

    // Create work order with large quantity
    await helpers.navigateToPlanning();

    await page.click('button:has-text("Create Work Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '1000'); // Large quantity
    await page.selectOption('select[name="line_number"]', 'Line 1');
    await page.fill('input[name="scheduled_date"]', new Date().toISOString().split('T')[0]);
    await page.selectOption('select[name="priority"]', 'Normal');
    await page.click('button:has-text("Save")');
    await helpers.assert.toast('Work order created successfully');

    // Verify BOM component quantities are calculated correctly
    const workOrderRow = page.locator(`tr:has-text("${fgProductName}")`);
    await workOrderRow.locator('button[aria-label="View Details"]').click();

    // Verify component quantities are calculated (10kg * 1000 units = 10000kg)
    await expect(page.locator('text="10000 kg"')).toBeVisible();
  });
});
