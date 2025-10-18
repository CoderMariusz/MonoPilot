import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Scanner - Pack Terminal', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should select production line', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line
    await page.selectOption('select[name="production_line"]', 'Line 1');

    // Verify production line is selected
    await expect(page.locator('select[name="production_line"]')).toHaveValue('Line 1');
  });

  test('should select work order', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line first
    await page.selectOption('select[name="production_line"]', 'Line 1');

    // Select work order
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify work order is selected
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
  });

  test('should scan license plate', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify license plate is scanned
    await helpers.verifyToast('License plate scanned successfully');
  });

  test('should stage materials', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Verify materials are staged
    await helpers.verifyToast('Materials staged successfully');
  });

  test('should display staged materials list', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Verify staged materials list is displayed
    await expect(page.locator('[data-testid="staged-materials"]')).toBeVisible();
  });

  test('should validate material quantities', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Verify material quantities are validated
    await expect(page.locator('[data-testid="quantity-validation"]')).toBeVisible();
  });

  test('should record production output', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Record production output
    await page.fill('input[name="output_quantity"]', '50');
    await page.click('button:has-text("Record Output")');

    // Verify production output is recorded
    await helpers.verifyToast('Production output recorded successfully');
  });

  test('should track material consumption', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Record production output
    await page.fill('input[name="output_quantity"]', '50');
    await page.click('button:has-text("Record Output")');

    // Verify material consumption is tracked
    await expect(page.locator('[data-testid="material-consumption"]')).toBeVisible();
  });

  test('should complete packing operation', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Record production output
    await page.fill('input[name="output_quantity"]', '50');
    await page.click('button:has-text("Record Output")');

    // Complete packing operation
    await page.click('button:has-text("Complete Packing")');

    // Verify packing operation is completed
    await helpers.verifyToast('Packing operation completed successfully');
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Try to scan without selecting production line
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify validation error
    await helpers.verifyToast('Production line is required');
  });

  test('should validate work order selection', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line but not work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify validation error
    await helpers.verifyToast('Work order is required');
  });

  test('should validate license plate format', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan invalid license plate
    await page.fill('input[name="license_plate"]', 'INVALID');
    await page.click('button:has-text("Scan")');

    // Verify validation error
    await helpers.verifyToast('Invalid license plate format');
  });

  test('should validate output quantity is positive', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Record negative output quantity
    await page.fill('input[name="output_quantity"]', '-10');
    await page.click('button:has-text("Record Output")');

    // Verify validation error
    await helpers.verifyToast('Output quantity must be a positive number');
  });

  test('should validate material quantities match BOM', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials with insufficient quantities
    await page.click('button:has-text("Stage Materials")');

    // Verify validation error
    await helpers.verifyToast('Material quantities do not match BOM requirements');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/scanner/pack/**', route => route.abort());

    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading states during operations', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Scan")')).toContainText('Scanning...');
  });

  test('should clear staged materials', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Clear staged materials
    await page.click('button:has-text("Clear Staged")');

    // Verify staged materials are cleared
    await helpers.verifyToast('Staged materials cleared');
  });

  test('should reset scanner state', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Reset scanner state
    await page.click('button:has-text("Reset")');

    // Verify scanner state is reset
    await helpers.verifyToast('Scanner state reset');
  });

  test('should display production line information', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Verify production line information is displayed
    await expect(page.locator('[data-testid="production-line-info"]')).toBeVisible();
  });

  test('should show work order information', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify work order information is displayed
    await expect(page.locator('[data-testid="work-order-info"]')).toBeVisible();
  });

  test('should display material requirements', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify material requirements are displayed
    await expect(page.locator('[data-testid="material-requirements"]')).toBeVisible();
  });

  test('should show production progress', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify production progress is displayed
    await expect(page.locator('[data-testid="production-progress"]')).toBeVisible();
  });

  test('should display quality check information', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify quality check information is displayed
    await expect(page.locator('[data-testid="quality-check-info"]')).toBeVisible();
  });

  test('should show production metrics', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify production metrics are displayed
    await expect(page.locator('[data-testid="production-metrics"]')).toBeVisible();
  });

  test('should display error messages for invalid operations', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Try to stage materials without scanning license plate
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });
    await page.click('button:has-text("Stage Materials")');

    // Verify error message
    await helpers.verifyToast('Please scan a license plate first');
  });

  test('should maintain scanner state across operations', async ({ page }) => {
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Verify scanner state is maintained
    await expect(page.locator('select[name="production_line"]')).toHaveValue('Line 1');
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
    await expect(page.locator('input[name="license_plate"]')).toHaveValue('LP-001');
  });
});
