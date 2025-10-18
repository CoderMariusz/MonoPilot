import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Integration - Complete Production Flow', () => {
  let helpers: TestHelpers;
  const testProductName = `PROD-FLOW-${Date.now()}`;
  const testWorkOrderNumber = `WO-FLOW-${Date.now()}`;
  const testPONumber = `PO-FLOW-${Date.now()}`;
  const testGRNNumber = `GRN-FLOW-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // Cleanup all test data
    await helpers.cleanupTestProduct(testProductName);
    await helpers.cleanupTestWorkOrder(testWorkOrderNumber);
    await helpers.cleanupTestPurchaseOrder(testPONumber);
    await helpers.cleanupTestGRN(testGRNNumber);
  });

  test('should complete full production flow from BOM to trace', async ({ page }) => {
    // Step 1: Create product with BOM in BOM module
    await helpers.navigateToBOM();

    // Create component products first
    const component1Name = helpers.data.generateUniqueName('CompA');
    const component1Sku = helpers.data.generateUniqueSku('CA');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: component1Name,
      description: 'Component A for production flow',
      sku: component1Sku,
      unit: 'kg',
      category: 'DRY_GOODS',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    const component2Name = helpers.data.generateUniqueName('CompB');
    const component2Sku = helpers.data.generateUniqueSku('CB');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: component2Name,
      description: 'Component B for production flow',
      sku: component2Sku,
      unit: 'pcs',
      category: 'MEAT',
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Create finished goods product with BOM
    const fgProductName = testProductName;
    const fgProductSku = helpers.data.generateUniqueSku('FG');
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: fgProductName,
      description: 'Finished goods for production flow',
      sku: fgProductSku,
      unit: 'unit',
      category: 'FINISHED_GOODS',
      oneToOne: true,
    });
    await helpers.saveProduct();
    await helpers.assert.toast('Product created successfully');

    // Edit FG to add BOM components
    await helpers.openEditModal(fgProductName);
    await helpers.addBomComponent(component1Name, '10', 'kg');
    await helpers.addBomComponent(component2Name, '2', 'pcs');
    await helpers.saveProduct();
    await helpers.assert.toast('Product updated successfully');

    // Step 2: Create purchase order in Planning module
    await helpers.navigateToPlanning();
    await helpers.clickTab('purchase-orders');

    await page.click('button:has-text("Create Purchase Order")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="supplier_id"]', { index: 1 });
    await page.fill('input[name="expected_delivery_date"]', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Add line items for components
    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].price"]', '10.50');

    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].price"]', '15.75');

    await page.click('button:has-text("Save")');
    await helpers.assert.toast('Purchase order created successfully');

    // Step 3: Create GRN in Warehouse module
    await helpers.navigateToWarehouse();
    await helpers.clickTab('grn');

    await page.click('button:has-text("Create GRN")');
    await page.waitForSelector('.modal');
    await page.selectOption('select[name="purchase_order_id"]', { index: 1 });

    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[0].product_id"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].received_quantity"]', '100');

    await page.click('button:has-text("Add Line Item")');
    await page.selectOption('select[name="items[1].product_id"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].received_quantity"]', '50');

    await page.click('button:has-text("Save")');
    await helpers.assert.toast('GRN created successfully');

    // Step 4: Create work order in Planning module
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

    // Step 5: Stage materials in Scanner Pack Terminal
    await helpers.navigateToScannerPack();

    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');
    await helpers.assert.toast('License plate scanned successfully');

    await page.click('button:has-text("Stage Materials")');
    await helpers.assert.toast('Materials staged successfully');

    // Step 6: Process materials in Scanner Process Terminal
    await helpers.navigateToScannerProcess();

    await page.selectOption('select[name="work_order"]', { index: 1 });
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');
    await helpers.assert.toast('Input material scanned successfully');

    // Perform quality check
    await page.click('button:has-text("Quality Check")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="temperature"]', '75');
    await page.fill('input[name="humidity"]', '60');
    await page.selectOption('select[name="quality_status"]', 'PASS');
    await page.click('button:has-text("Save Quality Check")');
    await helpers.assert.toast('Quality check saved successfully');

    // Record processing parameters
    await page.fill('input[name="processing_time"]', '120');
    await page.fill('input[name="processing_temperature"]', '80');
    await page.fill('input[name="processing_pressure"]', '2.5');
    await page.click('button:has-text("Save Parameters")');
    await helpers.assert.toast('Processing parameters saved successfully');

    // Record material transformation
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');
    await page.fill('input[name="loss_weight"]', '15');
    await page.click('button:has-text("Save Transformation")');
    await helpers.assert.toast('Material transformation saved successfully');

    // Complete processing operation
    await page.click('button:has-text("Complete Processing")');
    await helpers.assert.toast('Processing operation completed successfully');

    // Step 7: Record production output in Pack Terminal
    await helpers.navigateToScannerPack();

    await page.fill('input[name="output_quantity"]', '85');
    await page.click('button:has-text("Record Output")');
    await helpers.assert.toast('Production output recorded successfully');

    await page.click('button:has-text("Complete Packing")');
    await helpers.assert.toast('Packing operation completed successfully');

    // Step 8: View yield and consumption reports in Production module
    await helpers.navigateToProduction();

    // Check yield report
    await helpers.clickTab('yield-report');
    await expect(page.locator('[data-testid="yield-chart"]')).toBeVisible();

    // Check consume report
    await helpers.clickTab('consume-report');
    await expect(page.locator('[data-testid="consumption-chart"]')).toBeVisible();

    // Step 9: Perform traceability check
    await helpers.clickTab('trace');

    // Forward trace from LP
    await page.click('button:has-text("Forward Trace")');
    await page.fill('input[name="lp_code"]', 'LP-001');
    await page.click('button:has-text("Trace")');
    await expect(page.locator('[data-testid="trace-results"]')).toBeVisible();

    // Backward trace from FG
    await page.click('button:has-text("Backward Trace")');
    await page.fill('input[name="product_code"]', fgProductSku);
    await page.click('button:has-text("Trace")');
    await expect(page.locator('[data-testid="trace-results"]')).toBeVisible();

    // Verify complete traceability
    await expect(page.locator('[data-testid="trace-tree"]')).toBeVisible();
    await expect(page.locator('[data-testid="qa-status-badge"]')).toBeVisible();

    // Step 10: Verify data consistency across modules
    // Check work order status in Planning
    await helpers.navigateToPlanning();
    await helpers.assert.expectTableRowToBeVisible(testWorkOrderNumber);

    // Check production data in Production module
    await helpers.navigateToProduction();
    await helpers.clickTab('work-orders');
    await helpers.assert.expectTableRowToBeVisible(testWorkOrderNumber);

    // Check warehouse data in Warehouse module
    await helpers.navigateToWarehouse();
    await helpers.clickTab('lp-operations');
    await expect(page.locator('text="LP-001"')).toBeVisible();

    // Verify complete production flow success
    await helpers.assert.toast('Production flow completed successfully');
  });

  test('should handle production flow errors gracefully', async ({ page }) => {
    // Test error handling in production flow
    await helpers.navigateToBOM();

    // Create a product without BOM
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

    // Verify error handling
    await helpers.assert.toast('Product must have BOM components to create work order');
  });

  test('should validate production flow permissions', async ({ page }) => {
    // Test with different user roles
    await helpers.logout();
    await helpers.login(testUsers.operator.email, testUsers.operator.password);

    // Try to access admin functions
    await helpers.navigateToAdmin();
    await helpers.verifyErrorMessage('Access denied');

    // Try to access settings
    await helpers.navigateToSettings();
    await helpers.verifyErrorMessage('Access denied');

    // Verify operator can access production modules
    await helpers.navigateToProduction();
    await expect(page).toHaveURL('/production');

    await helpers.navigateToScannerPack();
    await expect(page).toHaveURL('/scanner/pack');
  });

  test('should handle concurrent production operations', async ({ page }) => {
    // Test concurrent operations in production flow
    await helpers.navigateToScannerPack();

    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Start staging materials
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Navigate to process terminal while staging
    await helpers.navigateToScannerProcess();

    // Verify concurrent operations are handled
    await expect(page.locator('[data-testid="concurrent-operations"]')).toBeVisible();
  });

  test('should maintain data integrity across modules', async ({ page }) => {
    // Test data integrity across production flow
    await helpers.navigateToBOM();

    // Create product
    const productName = testProductName;
    await helpers.openAddItemModal();
    await helpers.fillProductForm({
      name: productName,
      description: 'Data integrity test product',
      sku: helpers.data.generateUniqueSku('DI-TEST'),
      unit: 'unit',
      category: 'FINISHED_GOODS',
    });
    await helpers.saveProduct();

    // Verify product exists in BOM
    await helpers.assert.expectTableRowToBeVisible(productName);

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

    // Verify work order exists in Planning
    await helpers.assert.expectTableRowToBeVisible(testWorkOrderNumber);

    // Verify work order appears in Production
    await helpers.navigateToProduction();
    await helpers.clickTab('work-orders');
    await helpers.assert.expectTableRowToBeVisible(testWorkOrderNumber);

    // Verify data consistency
    await expect(page.locator('[data-testid="data-integrity-check"]')).toBeVisible();
  });
});
