/**
 * E2E Tests for Story 1-4-1: Spreadsheet Mode Bulk Creation
 *
 * Test Coverage:
 * - Page navigation and mode switching
 * - Row addition and inline editing
 * - Excel paste functionality
 * - Product validation and lookup
 * - Drag-drop row reordering
 * - Batch WO/PO creation
 * - Auto-save and draft recovery
 * - Clear all functionality
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Story 1-4-1: Spreadsheet Mode Bulk Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect to home page
    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to spreadsheet mode
    await page.goto('/planning/spreadsheet');
    await page.waitForLoadState('networkidle');
  });

  test('AC-1: Page loads with correct UI elements', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: /Spreadsheet Mode - Bulk Entry/i })).toBeVisible();

    // Check mode selection buttons
    await expect(page.getByRole('button', { name: /Work Orders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Purchase Orders/i })).toBeVisible();

    // Check WO mode is selected by default
    await expect(page.getByRole('button', { name: /Work Orders/i })).toHaveClass(/bg-blue-600/);

    // Check action buttons
    await expect(page.getByRole('button', { name: /Clear All/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create.*Work Order/i })).toBeVisible();
  });

  test('AC-1: Mode switching works (WO ↔ PO)', async ({ page }) => {
    // Start in WO mode
    await expect(page.getByRole('button', { name: /Work Orders/i })).toHaveClass(/bg-blue-600/);

    // Switch to PO mode
    await page.getByRole('button', { name: /Purchase Orders/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: /Purchase Orders/i })).toHaveClass(/bg-blue-600/);
    await expect(page.getByRole('button', { name: /Create.*Purchase Order/i })).toBeVisible();

    // Switch back to WO mode
    await page.getByRole('button', { name: /Work Orders/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: /Work Orders/i })).toHaveClass(/bg-blue-600/);
    await expect(page.getByRole('button', { name: /Create.*Work Order/i })).toBeVisible();
  });

  test('AC-2: Auto-save draft persists on page reload (WO)', async ({ page, context }) => {
    // Add a row manually by typing in the grid
    // Note: This test assumes SpreadsheetTable has an "Add Row" button or initial empty row
    const productCodeCell = page.locator('[role="gridcell"]').first();
    await productCodeCell.click();

    // Type product code
    await page.keyboard.type('PROD-001');
    await page.keyboard.press('Tab');

    // Type quantity
    await page.keyboard.type('100');
    await page.keyboard.press('Tab');

    // Wait for auto-save (debounced)
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check draft notification appears
    await expect(page.getByText(/Draft Recovered/i)).toBeVisible();

    // Check row count shows 1 row
    await expect(page.getByText(/1 row/i)).toBeVisible();
  });

  test('AC-3: Excel paste works with tab-separated data (WO)', async ({ page, context }) => {
    // Prepare TSV data (simulating Excel copy)
    const tsvData = `Product Code\tQuantity\tScheduled Start\tDue Date\tShift\tNotes
PROD-001\t100\t2025-11-20T08:00\t2025-11-20\tday\tUrgent - High priority
PROD-002\t200\t2025-11-20T10:00\t2025-11-21\tday\tStandard production
PROD-003\t150\t2025-11-20T14:00\t2025-11-22\tday\tLow priority`;

    // Click on grid to focus
    const gridCell = page.locator('[role="gridcell"]').first();
    await gridCell.click();

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Write to clipboard
    await page.evaluate((data) => {
      navigator.clipboard.writeText(data);
    }, tsvData);

    // Paste using Ctrl+V
    await page.keyboard.press('Control+V');

    // Wait for paste processing
    await page.waitForTimeout(1500);

    // Check validation summary shows 3 rows
    await expect(page.getByText(/3 rows/i)).toBeVisible();

    // Check row count in summary (should show Total: 3)
    await expect(page.getByText(/Total Rows/).locator('..').getByText('3')).toBeVisible();
  });

  test('AC-4: Product validation shows errors for invalid products', async ({ page }) => {
    // Add invalid product code
    const productCodeCell = page.locator('[role="gridcell"]').first();
    await productCodeCell.click();

    await page.keyboard.type('INVALID-PRODUCT-999');
    await page.keyboard.press('Tab');
    await page.keyboard.type('100');

    // Wait for validation
    await page.waitForTimeout(1500);

    // Check validation summary shows errors
    const validationSummary = page.locator('.bg-white').filter({ hasText: /Validation Summary/i });
    await expect(validationSummary).toBeVisible();

    // Check error count > 0
    await expect(validationSummary.getByText(/Errors/).locator('..').locator('.text-red-600')).toHaveText(/[1-9]/);
  });

  test('AC-5: Batch creation is disabled when there are validation errors', async ({ page }) => {
    // Add invalid product
    const productCodeCell = page.locator('[role="gridcell"]').first();
    await productCodeCell.click();

    await page.keyboard.type('INVALID-999');
    await page.keyboard.press('Tab');

    // Wait for validation
    await page.waitForTimeout(1500);

    // Check create button is disabled
    const createButton = page.getByRole('button', { name: /Create.*Work Order/i });
    await expect(createButton).toBeDisabled();
  });

  test('AC-7: Clear All button clears rows and draft', async ({ page, context }) => {
    // Add a row
    const productCodeCell = page.locator('[role="gridcell"]').first();
    await productCodeCell.click();

    await page.keyboard.type('PROD-001');
    await page.keyboard.press('Tab');
    await page.keyboard.type('100');

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Click Clear All
    await page.getByRole('button', { name: /Clear All/i }).click();

    // Check rows cleared
    await expect(page.getByText(/0 rows/i)).toBeVisible();

    // Reload page to verify draft was cleared
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Draft notification should NOT appear
    await expect(page.getByText(/Draft Recovered/i)).not.toBeVisible();

    // Row count should be 0
    await expect(page.getByText(/0 rows/i)).toBeVisible();
  });

  test('AC-9: Sample data is visible with copy instructions', async ({ page }) => {
    // Check sample data section exists
    await expect(page.getByText(/Sample Data to Paste/i)).toBeVisible();

    // Check WO sample data is visible (default mode)
    await expect(page.locator('pre').filter({ hasText: /PROD-001/ })).toBeVisible();
    await expect(page.locator('pre').filter({ hasText: /Product Code.*Quantity.*Scheduled Start/i })).toBeVisible();

    // Switch to PO mode
    await page.getByRole('button', { name: /Purchase Orders/i }).click();
    await page.waitForTimeout(500);

    // Check PO sample data is visible
    await expect(page.locator('pre').filter({ hasText: /Unit Price.*Currency.*Delivery Date/i })).toBeVisible();
  });

  test('AC-9: Instructions panel shows correct usage steps', async ({ page }) => {
    // Check instructions section exists
    await expect(page.getByText(/How to Use/i)).toBeVisible();

    // Check key instructions are present
    await expect(page.getByText(/Add Row:/i)).toBeVisible();
    await expect(page.getByText(/Paste from Excel:/i)).toBeVisible();
    await expect(page.getByText(/Edit Cell:/i)).toBeVisible();
    await expect(page.getByText(/Reorder Rows:/i)).toBeVisible();
    await expect(page.getByText(/Delete Row:/i)).toBeVisible();
    await expect(page.getByText(/Create Batch:/i)).toBeVisible();
  });

  test.skip('AC-5: Batch WO creation succeeds with valid data', async ({ page }) => {
    // Note: This test requires migration 106 to be applied and valid products in DB
    // Skipped for now until database is ready

    // Add valid product rows
    const productCodeCell = page.locator('[role="gridcell"]').first();
    await productCodeCell.click();

    // Row 1
    await page.keyboard.type('PROD-001');
    await page.keyboard.press('Tab');
    await page.keyboard.type('100');
    await page.keyboard.press('Tab');
    await page.keyboard.type('EA');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2025-11-20T08:00');

    // Wait for validation
    await page.waitForTimeout(1500);

    // Check validation passed (no errors)
    await expect(page.getByText(/✓ 1/i)).toBeVisible(); // 1 valid row

    // Click Create button
    const createButton = page.getByRole('button', { name: /Create.*Work Order/i });
    await expect(createButton).toBeEnabled();

    await createButton.click();

    // Wait for success alert
    await page.waitForTimeout(2000);

    // Check success message (Playwright dialog)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Successfully created');
      await dialog.accept();
    });

    // Rows should be cleared after success
    await expect(page.getByText(/0 rows/i)).toBeVisible();
  });

  test.skip('AC-5: Batch PO creation prompts for warehouse and succeeds', async ({ page }) => {
    // Note: This test requires migration 106 and valid data
    // Skipped for now until database is ready

    // Switch to PO mode
    await page.getByRole('button', { name: /Purchase Orders/i }).click();
    await page.waitForTimeout(500);

    // Add valid product row
    const productCodeCell = page.locator('[role="gridcell"]').first();
    await productCodeCell.click();

    await page.keyboard.type('PROD-001');
    await page.keyboard.press('Tab');
    await page.keyboard.type('500');

    // Wait for validation
    await page.waitForTimeout(1500);

    // Click Create button
    const createButton = page.getByRole('button', { name: /Create.*Purchase Order/i });
    await expect(createButton).toBeEnabled();

    // Handle warehouse ID prompt
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('1'); // Enter warehouse ID 1
      } else if (dialog.message().includes('Successfully created')) {
        expect(dialog.message()).toContain('Purchase Order');
        await dialog.accept();
      }
    });

    await createButton.click();

    // Wait for completion
    await page.waitForTimeout(2000);

    // Rows should be cleared
    await expect(page.getByText(/0 rows/i)).toBeVisible();
  });
});
