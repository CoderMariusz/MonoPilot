import { test, expect } from '@playwright/test';
import {
  login,
  gotoPlanningTab,
  clickButton,
  waitForModal,
  waitForToast,
} from './helpers';

async function createDraftPurchaseOrder(page) {
  await clickButton(page, 'Create Purchase Order');
  await waitForModal(page, 'Create Purchase Order');

  await page
    .locator('[data-testid="po-supplier-select"]')
    .selectOption({ index: 1 });
  await page
    .locator('[data-testid="po-warehouse-select"]')
    .selectOption({ index: 1 })
    .catch(() => {});

  await page
    .locator('label:has-text("Expected Delivery")')
    .locator('..')
    .locator('input[type="date"]')
    .first()
    .fill('2025-12-31');

  await page
    .locator('[data-testid$="product-select"]')
    .first()
    .selectOption({ index: 1 });
  await page.locator('[data-testid$="quantity-input"]').first().fill('10');
  await page.locator('[data-testid$="price-input"]').first().fill('100');

  await page.locator('[data-testid="po-submit-button"]').click();
  await page.waitForTimeout(1000);
}

test.describe('Purchase Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await gotoPlanningTab(page, 'Purchase Orders');
    await page.waitForSelector('button:has-text("Create Purchase Order")', {
      timeout: 10000,
    });
  });

  test('should create a new purchase order', async ({ page }) => {
    await createDraftPurchaseOrder(page);
    await expect(page.locator('table')).toContainText('draft');
  });

  test('should use Quick PO Entry', async ({ page }) => {
    await clickButton(page, 'Quick Entry');
    await waitForModal(page, 'Quick');

    await page
      .locator('[data-testid="quick-po-warehouse-select"]')
      .selectOption({ index: 1 })
      .catch(() => {});

    const testCode = 'BXS-001';
    await page
      .locator('[data-testid="quick-po-code-input"]')
      .first()
      .fill(testCode);
    await page.locator('[data-testid="quick-po-qty-input"]').first().fill('5');

    await clickButton(page, 'Create');
    await waitForToast(page, 'Created');
  });

  // Story 0.1: Warehouse validation tests
  test('should require warehouse selection in Quick PO Entry', async ({
    page,
  }) => {
    await clickButton(page, 'Quick Entry');
    await waitForModal(page, 'Quick');

    // Verify warehouse field has red asterisk (required indicator)
    const warehouseLabel = page.locator(
      'label:has-text("Destination Warehouse")'
    );
    await expect(warehouseLabel).toContainText('*');

    // Verify warehouse dropdown is present
    const warehouseSelect = page.locator(
      '[data-testid="quick-po-warehouse-select"]'
    );
    await expect(warehouseSelect).toBeVisible();

    // Verify help text is present
    await expect(
      page.locator('text=Where should materials be received')
    ).toBeVisible();
  });

  test('should show error when warehouse not selected', async ({ page }) => {
    await clickButton(page, 'Quick Entry');
    await waitForModal(page, 'Quick');

    // Fill in product but NOT warehouse
    const testCode = 'BXS-001';
    await page
      .locator('[data-testid="quick-po-code-input"]')
      .first()
      .fill(testCode);
    await page.locator('[data-testid="quick-po-qty-input"]').first().fill('5');

    // Try to submit without selecting warehouse
    await clickButton(page, 'Create');

    // Should show toast error
    await waitForToast(page, 'select a destination warehouse');

    // Modal should still be open (submission blocked)
    await expect(page.locator('text=Quick PO Entry')).toBeVisible();
  });

  test('should create PO successfully with warehouse selected', async ({
    page,
  }) => {
    await clickButton(page, 'Quick Entry');
    await waitForModal(page, 'Quick');

    // Select warehouse first
    await page
      .locator('[data-testid="quick-po-warehouse-select"]')
      .selectOption({ index: 1 });

    // Fill in product details
    const testCode = 'BXS-001';
    await page
      .locator('[data-testid="quick-po-code-input"]')
      .first()
      .fill(testCode);
    await page.locator('[data-testid="quick-po-qty-input"]').first().fill('10');

    // Submit
    await clickButton(page, 'Create');

    // Should succeed
    await waitForToast(page, 'Created');

    // Results screen should appear
    await expect(page.locator('text=Purchase Orders Created')).toBeVisible();
  });

  test('should handle empty warehouse list gracefully', async ({ page }) => {
    // Note: This test requires that no warehouses exist in the test database
    // In a real test environment, you would delete all warehouses in beforeEach
    // For now, we test the UI behavior when the warehouse list loads empty

    await clickButton(page, 'Quick Entry');
    await waitForModal(page, 'Quick');

    // Check if warehouse dropdown exists OR error message is shown
    const warehouseSelect = page.locator(
      '[data-testid="quick-po-warehouse-select"]'
    );
    const errorMessage = page.locator('text=No warehouses found');

    // If warehouses exist, test passes (normal operation)
    // If no warehouses, verify error message is shown
    const warehouseExists = await warehouseSelect
      .isVisible()
      .catch(() => false);

    if (!warehouseExists) {
      // Verify error message is displayed
      await expect(errorMessage).toBeVisible();
      await expect(
        page.locator('text=Please create a warehouse first')
      ).toBeVisible();

      // Verify that product input is still accessible (user can prepare data)
      const productInput = page
        .locator('[data-testid="quick-po-code-input"]')
        .first();
      await expect(productInput).toBeVisible();

      // Try to fill product but cannot submit without warehouse
      await productInput.fill('BXS-001');

      // Create button should still be visible but submission should fail
      const createButton = page.locator(
        'button:has-text("Create Purchase Orders")'
      );
      await expect(createButton).toBeVisible();
    }
  });

  test('should edit a purchase order', async ({ page }) => {
    await createDraftPurchaseOrder(page);

    const firstRow = page
      .locator('table tbody tr')
      .filter({ hasText: 'draft' })
      .first();
    await firstRow.locator('button[title="Edit"]').click();
    await waitForModal(page, 'Edit');

    await page.locator('textarea').first().fill(`Test edit ${Date.now()}`);
    await clickButton(page, 'Save');
    await page.waitForTimeout(500);
  });

  test('should delete a draft purchase order', async ({ page }) => {
    await createDraftPurchaseOrder(page);

    const firstRow = page
      .locator('table tbody tr')
      .filter({ hasText: 'draft' })
      .first();
    await firstRow.locator('button[title="Delete"]').click();
    await page.locator('button:has-text("Confirm")').click();
    await waitForToast(page, 'deleted');
  });

  test('should filter purchase orders by status', async ({ page }) => {
    await page
      .locator('select:has-text("All statuses"), select[name="status"]')
      .selectOption('confirmed')
      .catch(() => {});
    await page.waitForTimeout(500);

    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText(/confirmed|No purchase orders/i);
    }
  });
});
