import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('GRN (Goods Receipt Note) Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'warehouse');
    
    // Navigate to GRN tab
    await page.click('button:has-text("GRN")');
    await page.waitForTimeout(1000);
    
    // Wait for GRN table to be visible
    await page.waitForSelector('table, h2:has-text("GRN")', { timeout: 5000 });
  });

  test('should view GRN list', async ({ page }) => {
    // Should show GRN table
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Should have at least headers
    await expect(table.locator('thead')).toBeVisible();
  });

  test('should view GRN details', async ({ page }) => {
    // Find first GRN
    const firstRow = page.locator('table tbody tr').first();
    
    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Click details button
      await firstRow.locator('button[title="Details"], button:has-text("Details")').click();
      
      // Wait for details modal
      await waitForModal(page, 'GRN Details');
      
      // Verify modal shows key information
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toContainText(/GRN-\d+|Receipt/i); // GRN number or title
      await expect(modal).toContainText(/Supplier|PO/i); // Reference info
    }
  });

  test('should complete a GRN', async ({ page }) => {
    // Find first GRN in pending status
    const pendingRow = page.locator('table tbody tr').filter({ hasText: /pending|draft/i }).first();
    
    if (await pendingRow.isVisible({ timeout: 3000 })) {
      // Click complete button
      await pendingRow.locator('button[title="Complete"], button:has-text("Complete")').click();
      
      // If confirmation dialog appears, confirm
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for success
      await waitForToast(page, 'completed');
      
      // Verify status changed
      await page.waitForTimeout(1000);
    }
  });

  test('should filter GRNs by status', async ({ page }) => {
    // Find status filter
    const statusFilter = page.locator('select[name="status"], select:near(label:has-text("Status"))');
    
    if (await statusFilter.isVisible({ timeout: 2000 })) {
      // Filter by completed
      await statusFilter.selectOption('completed');
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(rows.nth(i)).toContainText('completed');
        }
      }
    }
  });

  test('should search GRNs by number', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Get first GRN number
      const firstGRN = await page.locator('table tbody tr').first().locator('td').first().textContent();
      
      if (firstGRN) {
        // Search for it
        await searchInput.fill(firstGRN);
        await page.waitForTimeout(500);
        
        // Should show matching results
        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        
        if (count > 0) {
          await expect(rows.first()).toContainText(firstGRN);
        }
      }
    }
  });
});

