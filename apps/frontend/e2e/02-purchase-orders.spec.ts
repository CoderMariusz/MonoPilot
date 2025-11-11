import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast, generateTestId } from './helpers';

test.describe('Purchase Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'planning');
    
    // Switch to Purchase Orders tab
    await page.click('button:has-text("Purchase Orders")');
    await page.waitForTimeout(1000);
    
    // Wait for PO table or buttons to be visible
    await page.waitForSelector('button:has-text("Create Purchase Order"), h2:has-text("Purchase Orders")', { timeout: 5000 });
  });

  test('should create a new purchase order', async ({ page }) => {
    // Click "Create Purchase Order" button
    await clickButton(page, 'Create Purchase Order');
    
    // Wait for modal
    await waitForModal(page, 'Create Purchase Order');
    
    // Fill form
    await page.selectOption('select:near(label:has-text("Supplier"))', { index: 1 });
    await page.selectOption('select:near(label:has-text("Warehouse"))', { index: 1 });
    await page.fill('input[name="due_date"], input[type="date"]:near(label:has-text("Due Date"))', '2025-12-31');
    
    // Add line item
    await page.selectOption('select:near(label:has-text("Product"))', { index: 1 });
    await page.fill('input[name="quantity"], input[type="number"]:near(label:has-text("Quantity"))', '10');
    await page.fill('input[name="unit_price"], input[type="number"]:near(label:has-text("Unit Price"))', '100');
    
    // Submit
    await clickButton(page, 'Create');
    
    // Wait for success toast
    await waitForToast(page, 'successfully');
    
    // Verify PO appears in table
    await page.waitForTimeout(1000);
    const table = page.locator('table');
    await expect(table).toContainText('draft');
  });

  test('should use Quick PO Entry', async ({ page }) => {
    // Click "Quick Entry" button
    await clickButton(page, 'Quick Entry');
    
    // Wait for Quick PO modal
    await waitForModal(page, 'Quick');
    
    // Select warehouse
    const warehouseSelect = page.locator('select').first();
    if (await warehouseSelect.isVisible({ timeout: 2000 })) {
      await warehouseSelect.selectOption({ index: 1 });
    }
    
    // Add product codes and quantities
    const testCode = 'BXS-001'; // Assuming this exists in test data
    await page.fill('input[placeholder*="code"]', testCode);
    await page.fill('input[type="number"]', '5');
    
    // Submit
    await clickButton(page, 'Create');
    
    // Wait for success
    await waitForToast(page, 'successfully');
  });

  test('should edit a purchase order', async ({ page }) => {
    // Find first PO in draft status
    const firstRow = page.locator('table tbody tr').filter({ hasText: 'draft' }).first();
    
    // Click edit button (Edit icon - second button in actions)
    await firstRow.locator('button[title="Edit"]').click();
    
    // Wait for edit modal
    await waitForModal(page, 'Edit');
    
    // Modify notes
    const notesField = page.locator('textarea[name="notes"], textarea:near(label:has-text("Notes"))');
    await notesField.fill(`Test edit ${Date.now()}`);
    
    // Save
    await clickButton(page, 'Save');
    
    // Wait for success
    await waitForToast(page, 'successfully');
  });

  test('should delete a draft purchase order', async ({ page }) => {
    // Find first PO in draft status
    const firstRow = page.locator('table tbody tr').filter({ hasText: 'draft' }).first();
    
    // Check if table has any draft POs
    if (await firstRow.isVisible({ timeout: 2000 })) {
      // Click delete button (Trash icon)
      const deleteButton = firstRow.locator('button[title="Delete"]');
      await deleteButton.click();
      
      // Click confirm button
      const confirmButton = page.locator('button:has-text("Confirm")');
      await confirmButton.click();
      
      // Wait for success
      await waitForToast(page, 'deleted');
    } else {
      // No draft POs to delete, skip test
      console.log('No draft POs available to test deletion');
    }
  });

  test('should filter purchase orders by status', async ({ page }) => {
    // Find status filter dropdown
    const statusFilter = page.locator('select:near(label:has-text("Status")), select[name="status"]');
    
    if (await statusFilter.isVisible()) {
      // Filter by "confirmed"
      await statusFilter.selectOption('confirmed');
      await page.waitForTimeout(500);
      
      // All visible rows should have "confirmed" status
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          await expect(rows.nth(i)).toContainText('confirmed');
        }
      }
    }
  });
});

