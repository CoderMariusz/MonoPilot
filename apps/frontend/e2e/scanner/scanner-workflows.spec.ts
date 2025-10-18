import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Scanner - Scanner Workflows', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should navigate between pack and process terminals', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();
    await expect(page).toHaveURL('/scanner/pack');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();
    await expect(page).toHaveURL('/scanner/process');

    // Navigate back to pack terminal
    await helpers.navigateToScannerPack();
    await expect(page).toHaveURL('/scanner/pack');
  });

  test('should maintain scanner state', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify scanner state is maintained
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');

    // Navigate back to pack terminal
    await helpers.navigateToScannerPack();

    // Verify scanner state is maintained
    await expect(page.locator('select[name="production_line"]')).toHaveValue('Line 1');
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
  });

  test('should handle barcode scanning', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Simulate barcode scanning
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify barcode is scanned
    await helpers.verifyToast('License plate scanned successfully');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Simulate barcode scanning
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify barcode is scanned
    await helpers.verifyToast('Input material scanned successfully');
  });

  test('should validate staged materials', async ({ page }) => {
    // Navigate to pack terminal
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

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify staged materials are validated
    await expect(page.locator('[data-testid="staged-materials-validation"]')).toBeVisible();
  });

  test('should handle scanner workflow errors', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Try to stage materials without scanning license plate
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });
    await page.click('button:has-text("Stage Materials")');

    // Verify error message
    await helpers.verifyToast('Please scan a license plate first');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Try to perform quality check without scanning input material
    await page.selectOption('select[name="work_order"]', { index: 1 });
    await page.click('button:has-text("Quality Check")');

    // Verify error message
    await helpers.verifyToast('Please scan an input material first');
  });

  test('should maintain workflow state across terminal switches', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify workflow state is maintained
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Navigate back to pack terminal
    await helpers.navigateToScannerPack();

    // Verify workflow state is maintained
    await expect(page.locator('select[name="production_line"]')).toHaveValue('Line 1');
    await expect(page.locator('select[name="work_order"]')).toHaveValue('1');
    await expect(page.locator('input[name="license_plate"]')).toHaveValue('LP-001');
  });

  test('should handle concurrent scanner operations', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Start staging materials
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');
    await page.click('button:has-text("Stage Materials")');

    // Navigate to process terminal while staging is in progress
    await helpers.navigateToScannerProcess();

    // Verify concurrent operations are handled
    await expect(page.locator('[data-testid="concurrent-operations"]')).toBeVisible();
  });

  test('should validate scanner workflow permissions', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Verify pack terminal permissions
    await expect(page.locator('[data-testid="pack-terminal-permissions"]')).toBeVisible();

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify process terminal permissions
    await expect(page.locator('[data-testid="process-terminal-permissions"]')).toBeVisible();
  });

  test('should handle scanner workflow timeouts', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/scanner/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      }, 5000);
    });

    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify timeout handling
    await expect(page.locator('[data-testid="timeout-handling"]')).toBeVisible();
  });

  test('should handle scanner workflow network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/scanner/**', route => route.abort());

    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify network error handling
    await helpers.verifyToast('Network error');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify network error handling
    await helpers.verifyToast('Network error');
  });

  test('should display scanner workflow progress', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Verify workflow progress is displayed
    await expect(page.locator('[data-testid="workflow-progress"]')).toBeVisible();

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify workflow progress is displayed
    await expect(page.locator('[data-testid="workflow-progress"]')).toBeVisible();
  });

  test('should show scanner workflow status', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Verify workflow status is displayed
    await expect(page.locator('[data-testid="workflow-status"]')).toBeVisible();

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify workflow status is displayed
    await expect(page.locator('[data-testid="workflow-status"]')).toBeVisible();
  });

  test('should display scanner workflow metrics', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Verify workflow metrics are displayed
    await expect(page.locator('[data-testid="workflow-metrics"]')).toBeVisible();

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify workflow metrics are displayed
    await expect(page.locator('[data-testid="workflow-metrics"]')).toBeVisible();
  });

  test('should handle scanner workflow validation errors', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Try to scan without selecting production line
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Verify validation error
    await helpers.verifyToast('Production line is required');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Try to scan without selecting work order
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify validation error
    await helpers.verifyToast('Work order is required');
  });

  test('should maintain scanner workflow history', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Scan input material
    await page.fill('input[name="input_material"]', 'LP-001');
    await page.click('button:has-text("Scan Input")');

    // Verify workflow history is maintained
    await expect(page.locator('[data-testid="workflow-history"]')).toBeVisible();
  });

  test('should handle scanner workflow rollback', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Scan license plate
    await page.fill('input[name="license_plate"]', 'LP-001');
    await page.click('button:has-text("Scan")');

    // Stage materials
    await page.click('button:has-text("Stage Materials")');

    // Rollback workflow
    await page.click('button:has-text("Rollback")');

    // Verify workflow rollback
    await helpers.verifyToast('Workflow rolled back successfully');
  });

  test('should display scanner workflow notifications', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Verify workflow notifications are displayed
    await expect(page.locator('[data-testid="workflow-notifications"]')).toBeVisible();

    // Navigate to process terminal
    await helpers.navigateToScannerProcess();

    // Verify workflow notifications are displayed
    await expect(page.locator('[data-testid="workflow-notifications"]')).toBeVisible();
  });

  test('should handle scanner workflow conflicts', async ({ page }) => {
    // Navigate to pack terminal
    await helpers.navigateToScannerPack();

    // Select production line and work order
    await page.selectOption('select[name="production_line"]', 'Line 1');
    await page.selectOption('select[name="work_order"]', { index: 1 });

    // Simulate workflow conflict
    await page.click('button:has-text("Simulate Conflict")');

    // Verify conflict handling
    await expect(page.locator('[data-testid="workflow-conflict"]')).toBeVisible();
  });
});
