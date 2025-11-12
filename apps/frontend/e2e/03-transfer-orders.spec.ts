import { test, expect } from '@playwright/test';
import {
  login,
  gotoPlanningTab,
  clickButton,
  waitForModal,
  waitForToast,
} from './helpers';

async function createTransferOrder(page, options: { status?: 'draft' | 'submitted' | 'in_transit' } = {}) {
  await clickButton(page, 'Create Transfer Order');
  await waitForModal(page, 'Create Transfer Order');

  await page.locator('[data-testid="to-from-warehouse-select"]').selectOption({ index: 1 });
  await page.locator('[data-testid="to-destination-warehouse-select"]').selectOption({ index: 2 });

  await page.locator('[data-testid="to-planned-ship-input"]').fill('2025-12-01');
  await page.locator('[data-testid="to-planned-receive-input"]').fill('2025-12-05');

  await page.locator('[data-testid="to-status-select"]').selectOption(options.status ?? 'draft');

  await page.locator('[data-testid$="product-select"]').first().selectOption({ index: 1 });
  await page.locator('[data-testid$="quantity-input"]').first().fill('5');

  await page.locator('[data-testid="to-submit-button"]').click();
  await waitForToast(page);
  await page.waitForTimeout(1000);
}

test.describe('Transfer Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await gotoPlanningTab(page, 'Transfer Orders');
    await page.waitForSelector('button:has-text("Create Transfer Order")', {
      timeout: 10000,
    });
  });

  test('should create and display transfer order details', async ({ page }) => {
    await createTransferOrder(page);

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button[title="View Details"]').click();
    await waitForModal(page, 'Transfer Order Details');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toContainText('Transfer Order');
    await expect(modal).toContainText(/From Warehouse/i);
    await expect(modal).toContainText(/To Warehouse/i);
  });

  test('should ship and receive a transfer order', async ({ page }) => {
    await createTransferOrder(page, { status: 'submitted' });

    const submittedRow = page.locator('table tbody tr').filter({ hasText: 'submitted' }).first();
    await submittedRow.locator('button[title="View Details"]').click();
    await waitForModal(page, 'Transfer Order Details');

    await clickButton(page, 'Mark as Shipped');
    const shipDateInput = page.locator('input[type="date"]:near(label:has-text("Actual Ship Date"))');
    if (await shipDateInput.isVisible({ timeout: 2000 })) {
      await shipDateInput.fill('2025-12-02');
      await clickButton(page, 'Confirm');
    }
    await waitForToast(page);

    await clickButton(page, 'Mark as Received');
    const receiveDateInput = page.locator('input[type="date"]:near(label:has-text("Actual Receive Date"))');
    if (await receiveDateInput.isVisible({ timeout: 2000 })) {
      await receiveDateInput.fill('2025-12-05');
      await clickButton(page, 'Confirm');
    }
    await waitForToast(page);
  });

  test('should validate receive date after planned ship date', async ({ page }) => {
    await clickButton(page, 'Create Transfer Order');
    await waitForModal(page, 'Create Transfer Order');

    await page.locator('[data-testid="to-from-warehouse-select"]').selectOption({ index: 1 });
    await page.locator('[data-testid="to-destination-warehouse-select"]').selectOption({ index: 2 });

    await page.locator('[data-testid="to-planned-ship-input"]').fill('2025-12-10');
    await page.locator('[data-testid="to-planned-receive-input"]').fill('2025-12-05');

    await page.locator('[data-testid$="product-select"]').first().selectOption({ index: 1 });
    await page.locator('[data-testid$="quantity-input"]').first().fill('5');

    await page.locator('[data-testid="to-submit-button"]').click();

    const errorMessage = page.locator('text=Planned receive date must be after planned ship date');
    await expect(errorMessage).toBeVisible();
  });
});

