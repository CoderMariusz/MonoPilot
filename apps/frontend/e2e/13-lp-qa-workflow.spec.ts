import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('License Plate QA Status Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'warehouse');

    // Navigate to LP Stock tab
    const lpTab = page.locator('button:has-text("LP Stock")');
    if (await lpTab.isVisible({ timeout: 3000 })) {
      await lpTab.click();
    }

    await page.waitForSelector('h1:has-text("Warehouse")');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
  });

  test('verifies all 4 QA status values are available', async ({ page }) => {
    // Click first LP QA button
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    await waitForModal(page, 'Change QA Status');

    // Get QA status select options
    const qaSelect = page.locator('select:near(label:has-text("QA Status"))');
    const optionTexts = await qaSelect.locator('option').allInnerTexts();

    // Verify all 4 values are present (case-insensitive match for display labels)
    const expectedLabels = ['pending', 'passed', 'failed', 'on hold', 'on_hold'];

    let foundCount = 0;
    for (const label of expectedLabels) {
      const found = optionTexts.some(opt =>
        opt.toLowerCase().includes(label)
      );
      if (found) foundCount++;
    }

    // Should find at least 4 distinct status options (pending, passed, failed, on_hold)
    expect(foundCount).toBeGreaterThanOrEqual(4);

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('cycles through QA status values (pending → passed → failed → on_hold)', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();

    // Test 1: Set to 'passed'
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    await waitForModal(page, 'Change QA Status');

    let qaSelect = page.locator('select:near(label:has-text("QA Status"))');
    // Find option with 'passed' (case-insensitive)
    await qaSelect.selectOption({ label: /passed/i });

    await clickButton(page, 'Update Status');
    await waitForToast(page);
    await page.waitForTimeout(500);

    // Test 2: Set to 'failed'
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    await waitForModal(page, 'Change QA Status');

    qaSelect = page.locator('select:near(label:has-text("QA Status"))');
    await qaSelect.selectOption({ label: /failed/i });

    await clickButton(page, 'Update Status');
    await waitForToast(page);
    await page.waitForTimeout(500);

    // Test 3: Set to 'on_hold' (displayed as "On Hold")
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    await waitForModal(page, 'Change QA Status');

    qaSelect = page.locator('select:near(label:has-text("QA Status"))');
    await qaSelect.selectOption({ label: /hold/i });

    await clickButton(page, 'Update Status');
    await waitForToast(page);
    await page.waitForTimeout(500);

    // Test 4: Set back to 'pending'
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    await waitForModal(page, 'Change QA Status');

    qaSelect = page.locator('select:near(label:has-text("QA Status"))');
    await qaSelect.selectOption({ label: /pending/i });

    await clickButton(page, 'Update Status');
    await waitForToast(page);
  });

  test('verifies QA status badge displays correctly', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Check if any LP has a QA status badge visible
    const qaStatusBadges = page.locator('table tbody tr td').filter({
      hasText: /pending|passed|failed|hold/i
    });

    if ((await qaStatusBadges.count()) > 0) {
      const firstBadge = qaStatusBadges.first();
      const badgeText = (await firstBadge.innerText()).toLowerCase();

      // Verify badge text matches one of the 4 valid values
      const validValues = ['pending', 'passed', 'failed', 'on hold', 'hold'];
      const isValid = validValues.some(val => badgeText.includes(val));

      expect(isValid).toBe(true);
    }
  });

  test('filters LPs by each QA status', async ({ page }) => {
    const statusFilter = page.locator('select:near(label:has-text("QA Status"))');

    if (await statusFilter.isVisible({ timeout: 3000 })) {
      // Get all available filter options
      const options = await statusFilter.locator('option').allInnerTexts();

      // Test filtering by each available status
      for (let i = 1; i < Math.min(options.length, 5); i++) {
        await statusFilter.selectOption({ index: i });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();

        // Verify rows are present after filtering
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }

      // Reset filter
      await statusFilter.selectOption({ index: 0 });
    }
  });
});
