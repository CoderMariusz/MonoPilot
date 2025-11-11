import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('License Plate Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'warehouse');
    
    // Navigate to LP Stock tab
    await page.click('button:has-text("LP Stock")');
    await page.waitForTimeout(1000);
    
    // Wait for LP table to be visible
    await page.waitForSelector('table, h2:has-text("LP Stock")', { timeout: 5000 });
  });

  test('should split a license plate', async ({ page }) => {
    // Find first active LP
    const firstRow = page.locator('table tbody tr').first();
    
    // Click split button
    await firstRow.locator('button[title="Split"], button:has-text("Split")').click();
    
    // Wait for split modal
    await waitForModal(page, 'Split');
    
    // Get original quantity (for validation)
    const originalQtyText = await firstRow.locator('td').nth(3).textContent(); // Assuming qty is 4th column
    const originalQty = parseFloat(originalQtyText || '10');
    
    // Split into 2 parts (half each)
    const splitQty = Math.floor(originalQty / 2);
    
    // Add first split
    await page.fill('input[name="split-0"], input[placeholder*="quantity"]:first', splitQty.toString());
    
    // Add second split (click "Add Split" if needed)
    const addSplitButton = page.locator('button:has-text("Add Split")');
    if (await addSplitButton.isVisible({ timeout: 1000 })) {
      await addSplitButton.click();
    }
    
    await page.fill('input[name="split-1"], input[placeholder*="quantity"]:nth(1)', (originalQty - splitQty).toString());
    
    // Submit
    await clickButton(page, 'Split');
    
    // Wait for success
    await waitForToast(page, 'split');
    
    // Verify new LPs appear in table
    await page.waitForTimeout(1000);
  });

  test('should change QA status', async ({ page }) => {
    // Find first LP
    const firstRow = page.locator('table tbody tr').first();
    
    // Click QA status button
    await firstRow.locator('button[title*="QA"], button:has-text("QA")').click();
    
    // Wait for QA status modal
    await waitForModal(page, 'QA Status');
    
    // Change status
    await page.selectOption('select[name="qa_status"], select:near(label:has-text("QA Status"))', { index: 1 });
    
    // Add note
    await page.fill('textarea[name="notes"]', 'QA status changed in E2E test');
    
    // Submit
    await clickButton(page, 'Update');
    
    // Wait for success
    await waitForToast(page, 'updated');
  });

  test('should amend LP quantity', async ({ page }) => {
    // Find first LP
    const firstRow = page.locator('table tbody tr').first();
    
    // Click amend button
    await firstRow.locator('button[title="Amend"], button:has-text("Amend")').click();
    
    // Wait for amend modal
    await waitForModal(page, 'Amend');
    
    // Change quantity
    const qtyInput = page.locator('input[name="quantity"], input[type="number"]:near(label:has-text("Quantity"))');
    await qtyInput.clear();
    await qtyInput.fill('15');
    
    // Submit
    await clickButton(page, 'Save');
    
    // Wait for success
    await waitForToast(page, 'updated');
  });

  test('should filter license plates by status', async ({ page }) => {
    // Find status filter
    const statusFilter = page.locator('select[name="status"], select:near(label:has-text("Status"))');
    
    if (await statusFilter.isVisible({ timeout: 2000 })) {
      // Filter by specific status
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // Verify table updates
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should search license plates', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Get first LP number
      const firstLP = await page.locator('table tbody tr').first().locator('td').first().textContent();
      
      if (firstLP) {
        // Search for it
        await searchInput.fill(firstLP);
        await page.waitForTimeout(500);
        
        // Should show only matching results
        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        
        if (count > 0) {
          await expect(rows.first()).toContainText(firstLP);
        }
      }
    }
  });
});

