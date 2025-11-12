import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

async function ensureLpTable(page) {
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  return rows.first();
}

test.describe('License Plate Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'warehouse');

    const lpTab = page.locator('button:has-text("LP Stock")');
    if (await lpTab.isVisible({ timeout: 3000 })) {
      await lpTab.click();
    }

    await page.waitForSelector('h1:has-text("Warehouse")');
    await ensureLpTable(page);
  });

  test('splits a license plate into two', async ({ page }) => {
    const firstRow = await ensureLpTable(page);

    const qtyCellText = await firstRow.locator('td').nth(3).innerText();
    const numericMatch = qtyCellText.match(/([0-9]+(?:\.[0-9]+)?)/);
    const originalQty = numericMatch ? parseFloat(numericMatch[1]) : 20;
    const firstSplitQty = Math.max(1, Math.floor(originalQty / 2));
    const secondSplitQty = Math.max(1, Math.round(originalQty - firstSplitQty));

    await firstRow.locator('button[title="Split"], button:has-text("Split")').click();
    await waitForModal(page, 'Split License Plate');

    const splitInputs = page.locator('input[type="number"]');
    await splitInputs.first().fill(firstSplitQty.toString());
    await splitInputs.nth(1).fill(secondSplitQty.toString());

    await clickButton(page, 'Split LP');
    await waitForToast(page);
    await page.waitForTimeout(500);
  });

  test('updates QA status of a license plate', async ({ page }) => {
    const firstRow = await ensureLpTable(page);
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    await waitForModal(page, 'Change QA Status');

    const qaSelect = page.locator('select:near(label:has-text("QA Status"))');
    const options = await qaSelect.locator('option').count();
    if (options > 1) {
      await qaSelect.selectOption({ index: 1 });
    }

    const notesField = page.locator('textarea:near(label:has-text("Notes"))');
    if (await notesField.isVisible()) {
      await notesField.fill('QA status adjusted via E2E scenario');
    }

    await clickButton(page, 'Update Status');
    await waitForToast(page);
  });

  test('amends license plate quantity', async ({ page }) => {
    const firstRow = await ensureLpTable(page);
    await firstRow.locator('button[title="Amend"], button:has-text("Amend")').click();
    await waitForModal(page, 'Amend License Plate');

    const qtyInput = page.locator('input:near(label:has-text("New Quantity"))');
    await qtyInput.fill('25');

    await clickButton(page, 'Update LP');
    await waitForToast(page);
  });

  test('filters license plates by QA status', async ({ page }) => {
    await ensureLpTable(page);
    const statusFilter = page.locator('select:near(label:has-text("QA Status"))');

    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      const filteredRows = page.locator('table tbody tr');
      expect(await filteredRows.count()).toBeGreaterThan(0);
    }
  });

  test('searches license plates by number', async ({ page }) => {
    const firstRow = await ensureLpTable(page);
    const lpNumber = (await firstRow.locator('td').first().innerText()).trim();

    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.fill(lpNumber);
    await page.waitForTimeout(500);

    const filteredRows = page.locator('table tbody tr');
    expect(await filteredRows.count()).toBeGreaterThan(0);
    await expect(filteredRows.first()).toContainText(lpNumber);
  });
});

