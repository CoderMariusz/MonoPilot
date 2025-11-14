import { test, expect } from '@playwright/test';
import {
  login,
  gotoPlanningTab,
  clickButton,
  waitForModal,
  waitForToast,
} from './helpers';

/**
 * Work Order E2E Tests - Basic Skeleton
 *
 * Coverage:
 * - Create WO (basic flow)
 * - View WO details
 * - Cancel WO
 *
 * TODO - Full Coverage (add later):
 * - Material reservations workflow
 * - By-products recording
 * - Conditional materials (order flags)
 * - Operation execution
 * - Production outputs
 * - Complete WO workflow
 */

async function createDraftWorkOrder(page) {
  await clickButton(page, 'Create Work Order');
  await waitForModal(page, 'Create Work Order');

  // Select product (first option after placeholder)
  await page
    .locator('[data-testid="wo-product-select"]')
    .selectOption({ index: 1 });

  // Wait for BOM to load (if product has BOM)
  await page.waitForTimeout(500);

  // Enter quantity
  await page.locator('[data-testid="wo-quantity-input"]').fill('10');

  // Select production line (if available)
  await page
    .locator('[data-testid="wo-line-select"]')
    .selectOption({ index: 1 })
    .catch(() => {
      // Line selection might be optional or not present
    });

  // Set scheduled date
  await page
    .locator('label:has-text("Scheduled Date")')
    .locator('..')
    .locator('input[type="date"]')
    .first()
    .fill('2025-12-31');

  // Submit
  await page.locator('[data-testid="wo-submit-button"]').click();
  await page.waitForTimeout(1000);
}

test.describe('Work Order Flow - Basic', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await gotoPlanningTab(page, 'Work Orders');
    await page.waitForSelector('button:has-text("Create Work Order")', {
      timeout: 10000,
    });
  });

  test('should create a new work order', async ({ page }) => {
    await createDraftWorkOrder(page);

    // Verify WO appears in table with "planned" or "draft" status
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // WO should appear in table (status might be "planned" or "draft")
    const tableContent = await table.textContent();
    const hasPlannedStatus =
      tableContent?.includes('planned') || tableContent?.includes('draft');
    expect(hasPlannedStatus).toBeTruthy();
  });

  test('should view work order details', async ({ page }) => {
    await createDraftWorkOrder(page);

    // Click first WO row to view details
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Wait for details modal or navigation
    await page.waitForTimeout(1000);

    // Check if details modal opened (or details page loaded)
    const hasDetails = await page
      .locator('text=/Work Order|WO-/')
      .first()
      .isVisible();
    expect(hasDetails).toBeTruthy();
  });

  test('should cancel a work order', async ({ page }) => {
    await createDraftWorkOrder(page);

    // Find first WO row with "planned" status
    const firstRow = page
      .locator('table tbody tr')
      .filter({ hasText: /planned|draft/i })
      .first();

    // Click cancel button (if available)
    const cancelButton = firstRow.locator('button[title="Cancel"]');
    const hasCancelButton = (await cancelButton.count()) > 0;

    if (hasCancelButton) {
      await cancelButton.click();

      // Confirm cancellation
      await page.locator('button:has-text("Confirm")').click();
      await waitForToast(page, 'cancelled');

      // Verify status changed to "cancelled"
      await page.waitForTimeout(500);
      await expect(firstRow).toContainText(/cancelled/i);
    } else {
      // Cancel might be in details modal or via status dropdown
      await firstRow.click();
      await page.waitForTimeout(500);

      // Try to find cancel action in modal
      const modalCancelButton = page
        .locator('button:has-text("Cancel")')
        .first();
      if (await modalCancelButton.isVisible()) {
        await modalCancelButton.click();
        await page.locator('button:has-text("Confirm")').click();
        await waitForToast(page, 'cancelled');
      }
    }
  });

  test('should filter work orders by status', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Look for status filter (might be dropdown or tabs)
    const statusFilter = page
      .locator('select')
      .filter({ hasText: /status|all/i })
      .first();
    const hasStatusFilter = (await statusFilter.count()) > 0;

    if (hasStatusFilter) {
      // Select "planned" status
      await statusFilter.selectOption({ label: /planned/i }).catch(() => {
        // Try by value if label doesn't work
        statusFilter.selectOption({ value: 'planned' }).catch(() => {});
      });

      await page.waitForTimeout(500);

      // Verify filtered results
      const table = page.locator('table');
      const tableText = await table.textContent();
      expect(tableText).toContain('planned');
    }
  });
});

test.describe('Work Order Flow - TODO (Advanced Features)', () => {
  /**
   * TODO: Add these tests in full E2E coverage phase
   *
   * 1. Material Reservations:
   *    - Reserve LP for WO material
   *    - Release reservation
   *    - Verify available qty updates
   *
   * 2. By-Products:
   *    - Create WO with by-products configured
   *    - Record by-product output
   *    - Verify by-product LP created
   *
   * 3. Conditional Materials (Order Flags):
   *    - Create WO with order flags (organic, gluten_free)
   *    - Verify BOM preview shows correct inclusions/exclusions
   *    - Create WO and verify wo_materials snapshot is correct
   *
   * 4. Production Execution:
   *    - Release WO (planned → released)
   *    - Start WO (released → in_progress)
   *    - Record operation weights (scanner flow)
   *    - Complete operation
   *    - Complete WO (in_progress → completed)
   *
   * 5. Production Outputs:
   *    - Record finished good output
   *    - Verify output LP created
   *    - Verify genealogy recorded
   *    - Check production_outputs table
   *
   * 6. Yield Analysis:
   *    - Complete WO with variance
   *    - Verify yield calculations
   *    - Check consume variance report
   */

  test.skip('should reserve materials for WO', async () => {
    // TODO: Implement material reservation test
  });

  test.skip('should record by-product output', async () => {
    // TODO: Implement by-product recording test
  });

  test.skip('should create WO with conditional materials', async () => {
    // TODO: Implement conditional materials test
  });

  test.skip('should execute production operations', async () => {
    // TODO: Implement operation execution test
  });

  test.skip('should record production output', async () => {
    // TODO: Implement output recording test
  });

  test.skip('should complete WO workflow end-to-end', async () => {
    // TODO: Implement full WO lifecycle test
  });
});
