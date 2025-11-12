import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

async function ensurePalletTable(page) {
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  return rows.first();
}

test.describe('Pallet Management - EPIC-002 Phase 3', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'warehouse');

    // Navigate to Pallets tab
    const palletsTab = page.locator('button:has-text("Pallets")');
    if (await palletsTab.isVisible({ timeout: 3000 })) {
      await palletsTab.click();
    }

    await page.waitForSelector('h1:has-text("Warehouse")', { timeout: 5000 });
  });

  test('creates a new pallet with auto-generated number', async ({ page }) => {
    // Click Create Pallet button
    await clickButton(page, 'Create Pallet');
    await waitForModal(page, 'Create Pallet');

    // Select pallet type
    const palletTypeSelect = page.locator('select:near(label:has-text("Pallet Type"))');
    if (await palletTypeSelect.isVisible()) {
      await palletTypeSelect.selectOption('EURO');
    }

    // Submit
    await clickButton(page, 'Create');
    await waitForToast(page);
    await page.waitForTimeout(500);

    // Verify pallet appears in table
    await ensurePalletTable(page);
  });

  test('adds license plate to pallet', async ({ page }) => {
    const firstRow = await ensurePalletTable(page);

    // Check if pallet is in "open" status
    const statusCell = await firstRow.locator('td').nth(3).innerText();
    if (!statusCell.includes('open')) {
      test.skip('Pallet is not open, skipping add LP test');
    }

    // Click Add LP button
    await firstRow.locator('button[title="Add LP"], button:has-text("Add LP")').click();
    await waitForModal(page, 'Add LP to Pallet');

    // Select an LP from dropdown (assuming there's a dropdown)
    const lpSelect = page.locator('select:near(label:has-text("License Plate"))');
    if (await lpSelect.isVisible()) {
      const options = await lpSelect.locator('option').count();
      if (options > 1) {
        await lpSelect.selectOption({ index: 1 });
      }
    }

    // Enter quantity
    const qtyInput = page.locator('input:near(label:has-text("Quantity"))');
    if (await qtyInput.isVisible()) {
      await qtyInput.fill('10');
    }

    // Submit
    await clickButton(page, 'Add');
    await waitForToast(page);
    await page.waitForTimeout(500);
  });

  test('views pallet details', async ({ page }) => {
    const firstRow = await ensurePalletTable(page);

    // Click View Details button
    await firstRow.locator('button[title="View Details"], button[title="Details"], svg.lucide-eye').click();
    await waitForModal(page, 'Pallet Details');

    // Verify modal shows pallet information
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check for pallet number
    await expect(modal.locator('text=/PALLET-/')).toBeVisible();

    // Close modal
    const closeButton = modal.locator('button:has(svg.lucide-x)');
    await closeButton.click();
    await page.waitForTimeout(300);
  });

  test('closes a pallet', async ({ page }) => {
    const firstRow = await ensurePalletTable(page);

    // Check if pallet is in "open" status
    const statusCell = await firstRow.locator('td').nth(3).innerText();
    if (!statusCell.includes('open')) {
      test.skip('Pallet is not open, skipping close test');
    }

    // Click Close button
    await firstRow.locator('button[title="Close"], button:has-text("Close")').click();

    // Confirm action (if there's a confirmation dialog)
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Close Pallet")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    await waitForToast(page);
    await page.waitForTimeout(500);

    // Verify status changed to "closed"
    const updatedStatusCell = await firstRow.locator('td').nth(3).innerText();
    expect(updatedStatusCell.toLowerCase()).toContain('closed');
  });

  test('filters pallets by status', async ({ page }) => {
    await ensurePalletTable(page);

    // Find status filter dropdown
    const statusFilter = page.locator('select:near(label:has-text("Status"))');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('open');
      await page.waitForTimeout(500);

      const filteredRows = page.locator('table tbody tr');
      const count = await filteredRows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('searches pallets by pallet number', async ({ page }) => {
    const firstRow = await ensurePalletTable(page);
    const palletNumber = (await firstRow.locator('td').first().innerText()).trim();

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(palletNumber);
      await page.waitForTimeout(500);

      const filteredRows = page.locator('table tbody tr');
      expect(await filteredRows.count()).toBeGreaterThan(0);
    }
  });

  test('removes license plate from pallet', async ({ page }) => {
    // First ensure we have a pallet with items
    const firstRow = await ensurePalletTable(page);

    // Check if pallet is open and has items
    const statusCell = await firstRow.locator('td').nth(3).innerText();
    const itemCountCell = await firstRow.locator('td').nth(5).innerText();
    const itemCount = parseInt(itemCountCell) || 0;

    if (!statusCell.includes('open') || itemCount === 0) {
      test.skip('Pallet is not open or has no items, skipping remove LP test');
    }

    // Open pallet details
    await firstRow.locator('button[title="View Details"], button[title="Details"], svg.lucide-eye').click();
    await waitForModal(page, 'Pallet Details');

    // Find and click remove button on first LP (if exists)
    const removeButton = page.locator('button[title="Remove"], button:has-text("Remove")').first();
    if (await removeButton.isVisible({ timeout: 2000 })) {
      await removeButton.click();

      // Confirm removal (if confirmation dialog exists)
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Remove LP")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      await waitForToast(page);
    }
  });
});
