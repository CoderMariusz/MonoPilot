import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Scanner - Process Terminal', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should select work order', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify work order is selected
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
  });

  test('should load routing operations', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify routing operations are loaded
    await expect(page.locator('[data-testid="routing-operations"]')).toBeVisible();
  });

  test('should scan input materials', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify input material is scanned
    await helpers.verifyToast('Input material scanned successfully');
  });

  test('should perform quality checks', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Perform quality check
    await page.click('button:has-text("Quality Check")');

    // Verify quality check modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Quality Check');

    // Fill quality check data
    await page.fill('input[name="temperature"]', '75');
    await page.fill('input[name="humidity"]', '60');
    await page.selectOption('select[name="quality_status"]', 'PASS');

    // Save quality check
    await page.click('button:has-text("Save Quality Check")');

    // Verify quality check is saved
    await helpers.verifyToast('Quality check saved successfully');
  });

  test('should record processing parameters', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Record processing parameters
    await page.fill('input[name="processing_time"]', '120');
    await page.fill('input[name="processing_temperature"]', '80');
    await page.fill('input[name="processing_pressure"]', '2.5');

    // Save processing parameters
    await page.click('button:has-text("Save Parameters")');

    // Verify processing parameters are saved
    await helpers.verifyToast('Processing parameters saved successfully');
  });

  test('should track material transformation', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Record material transformation
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');
    await page.fill('input[name="loss_weight"]', '15');

    // Save material transformation
    await page.click('button:has-text("Save Transformation")');

    // Verify material transformation is saved
    await helpers.verifyToast('Material transformation saved successfully');
  });

  test('should complete processing operation', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Perform quality check
    await page.click('button:has-text("Quality Check")');
    await page.fill('input[name="temperature"]', '75');
    await page.fill('input[name="humidity"]', '60');
    await page.selectOption('select[name="quality_status"]', 'PASS');
    await page.click('button:has-text("Save Quality Check")');

    // Record processing parameters
    await page.fill('input[name="processing_time"]', '120');
    await page.fill('input[name="processing_temperature"]', '80');
    await page.fill('input[name="processing_pressure"]', '2.5');
    await page.click('button:has-text("Save Parameters")');

    // Record material transformation
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');
    await page.fill('input[name="loss_weight"]', '15');
    await page.click('button:has-text("Save Transformation")');

    // Complete processing operation
    await page.click('button:has-text("Complete Processing")');

    // Verify processing operation is completed
    await helpers.verifyToast('Processing operation completed successfully');
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Try to scan input material without selecting work order
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify validation error
    await helpers.verifyToast('Work order is required');
  });

  test('should validate input material format', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan invalid input material
    await page.fill('input[name="input_material"]', 'INVALID');
    await page.click('button:has-text("Scan Input")');

    // Verify validation error
    await helpers.verifyToast('Invalid input material format');
  });

  test('should validate quality check parameters', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Perform quality check without filling required fields
    await page.click('button:has-text("Quality Check")');
    await page.click('button:has-text("Save Quality Check")');

    // Verify validation errors
    await helpers.verifyToast('Temperature is required');
    await helpers.verifyToast('Humidity is required');
    await helpers.verifyToast('Quality status is required');
  });

  test('should validate processing parameters', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Try to save processing parameters without filling required fields
    await page.click('button:has-text("Save Parameters")');

    // Verify validation errors
    await helpers.verifyToast('Processing time is required');
    await helpers.verifyToast('Processing temperature is required');
    await helpers.verifyToast('Processing pressure is required');
  });

  test('should validate material transformation parameters', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Try to save material transformation without filling required fields
    await page.click('button:has-text("Save Transformation")');

    // Verify validation errors
    await helpers.verifyToast('Input weight is required');
    await helpers.verifyToast('Output weight is required');
    await helpers.verifyToast('Loss weight is required');
  });

  test('should validate weight values are positive', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Record material transformation with negative weights
    await page.fill('input[name="input_weight"]', '-10');
    await page.fill('input[name="output_weight"]', '-5');
    await page.fill('input[name="loss_weight"]', '-5');
    await page.click('button:has-text("Save Transformation")');

    // Verify validation errors
    await helpers.verifyToast('Weight must be a positive number');
  });

  test('should validate output weight is not greater than input weight', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Record material transformation with output weight greater than input weight
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '150');
    await page.fill('input[name="loss_weight"]', '15');
    await page.click('button:has-text("Save Transformation")');

    // Verify validation error
    await helpers.verifyToast('Output weight cannot be greater than input weight');
  });

  test('should validate loss weight calculation', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Record material transformation with incorrect loss weight
    await page.fill('input[name="input_weight"]', '100');
    await page.fill('input[name="output_weight"]', '85');
    await page.fill('input[name="loss_weight"]', '20');
    await page.click('button:has-text("Save Transformation")');

    // Verify validation error
    await helpers.verifyToast('Loss weight must equal input weight minus output weight');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/scanner/process/**', route => route.abort());

    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading states during operations', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Scan Input")')).toContainText('Scanning...');
  });

  test('should clear input material', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Clear input material
    await page.click('button:has-text("Clear Input")');

    // Verify input material is cleared
    await helpers.verifyToast('Input material cleared');
  });

  test('should reset process terminal state', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Reset process terminal state
    await page.click('button:has-text("Reset")');

    // Verify process terminal state is reset
    await helpers.verifyToast('Process terminal state reset');
  });

  test('should display work order information', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify work order information is displayed
    await expect(page.locator('[data-testid="work-order-info"]')).toBeVisible();
  });

  test('should show routing operations information', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify routing operations information is displayed
    await expect(page.locator('[data-testid="routing-operations-info"]')).toBeVisible();
  });

  test('should display input material information', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify input material information is displayed
    await expect(page.locator('[data-testid="input-material-info"]')).toBeVisible();
  });

  test('should show quality check information', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify quality check information is displayed
    await expect(page.locator('[data-testid="quality-check-info"]')).toBeVisible();
  });

  test('should display processing parameters information', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify processing parameters information is displayed
    await expect(page.locator('[data-testid="processing-parameters-info"]')).toBeVisible();
  });

  test('should show material transformation information', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify material transformation information is displayed
    await expect(page.locator('[data-testid="material-transformation-info"]')).toBeVisible();
  });

  test('should display processing progress', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify processing progress is displayed
    await expect(page.locator('[data-testid="processing-progress"]')).toBeVisible();
  });

  test('should show processing metrics', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify processing metrics are displayed
    await expect(page.locator('[data-testid="processing-metrics"]')).toBeVisible();
  });

  test('should display error messages for invalid operations', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Try to perform quality check without scanning input material
    await page.selectOption('select[name="work_order"]', { index: 1 });
    await page.click('button:has-text("Quality Check")');

    // Verify error message
    await helpers.verifyToast('Please scan an input material first');
  });

  test('should maintain process terminal state across operations', async ({ page }) => {
    await helpers.navigateToScannerProcess();

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify process terminal state is maintained
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
    await expect(page.locator('input[name="input_material"]')).toHaveValue('LP-001');
  });
});
