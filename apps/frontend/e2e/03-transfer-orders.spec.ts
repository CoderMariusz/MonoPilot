import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('Transfer Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'planning');
    
    // Switch to Transfer Orders tab
    await page.click('button:has-text("Transfer Orders")');
    await page.waitForTimeout(1000);
    
    // Wait for TO table or buttons to be visible
    await page.waitForSelector('button:has-text("Create Transfer Order"), h2:has-text("Transfer Orders")', { timeout: 5000 });
  });

  test('should create a new transfer order', async ({ page }) => {
    // Click "Create Transfer Order" button
    await clickButton(page, 'Create Transfer Order');
    
    // Wait for modal
    await waitForModal(page, 'Create Transfer Order');
    
    // Fill form - find date inputs by their position in modal (only 2 dates)
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2025-12-25'); // Planned ship
    await dateInputs.nth(1).fill('2025-12-30'); // Planned receive
    
    // Select from/to warehouses
    const fromWarehouse = page.locator('select:near(label:has-text("From Warehouse"))');
    await fromWarehouse.selectOption({ index: 1 });
    
    const toWarehouse = page.locator('select:near(label:has-text("To Warehouse"))');
    await toWarehouse.selectOption({ index: 2 }); // Different warehouse
    
    // Add line item
    await page.selectOption('select:near(label:has-text("Product"))', { index: 1 });
    await page.fill('input[name="quantity"], input[type="number"]:near(label:has-text("Quantity"))', '5');
    
    // Submit
    await clickButton(page, 'Create');
    
    // Wait for success
    await waitForToast(page, 'successfully');
    
    // Verify TO appears in table
    await page.waitForTimeout(1000);
    const table = page.locator('table');
    await expect(table).toContainText('draft');
  });

  test('should mark transfer order as shipped', async ({ page }) => {
    // Find first TO in draft status
    const firstRow = page.locator('table tbody tr').filter({ hasText: 'draft' }).first();
    
    // Check if there are any draft TOs
    if (await firstRow.isVisible({ timeout: 2000 })) {
      // Click details button (Eye icon - first button)
      await firstRow.locator('button[title="View Details"]').click();
    
      // Wait for details modal
      await waitForModal(page, 'Transfer Order Details');
      
      // Click "Mark as Shipped" button
      await clickButton(page, 'Mark as Shipped');
      
      // If a ship date input appears, fill it
      const shipDateInput = page.locator('input[type="date"]:near(label:has-text("Ship Date"))');
      if (await shipDateInput.isVisible({ timeout: 2000 })) {
        await shipDateInput.fill('2025-12-25');
        await clickButton(page, 'Confirm');
      }
      
      // Wait for success
      await waitForToast(page, 'shipped');
    } else {
      console.log('No draft TOs available to test shipping');
    }
  });

  test('should mark transfer order as received', async ({ page }) => {
    // Find first TO in shipped status
    const shippedRow = page.locator('table tbody tr').filter({ hasText: 'shipped' }).first();
    
    if (await shippedRow.isVisible({ timeout: 2000 })) {
      // Click details
      await shippedRow.locator('button[title="Details"], button:has-text("Details")').click();
      
      // Wait for details modal
      await waitForModal(page, 'Transfer Order Details');
      
      // Click "Mark as Received" button
      await clickButton(page, 'Mark as Received');
      
      // If a receive date input appears, fill it
      const receiveDateInput = page.locator('input[type="date"]:near(label:has-text("Receive Date"))');
      if (await receiveDateInput.isVisible({ timeout: 2000 })) {
        await receiveDateInput.fill('2025-12-30');
        await clickButton(page, 'Confirm');
      }
      
      // Wait for success
      await waitForToast(page, 'received');
    }
  });

  test('should view transfer order details', async ({ page }) => {
    // Click first row details button
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button[title="View Details"]').click();
    
    // Wait for modal
    await waitForModal(page, 'Transfer Order Details');
    
    // Verify modal has key information
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toContainText(/TO-\d+/); // TO number
    await expect(modal).toContainText(/Warehouse|From|To/i); // Warehouse info
  });

  test('should validate date order (ship before receive)', async ({ page }) => {
    await clickButton(page, 'Create Transfer Order');
    await waitForModal(page, 'Create Transfer Order');
    
    // Fill dates in wrong order (receive before ship)
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2025-12-30'); // Planned ship
    await dateInputs.nth(1).fill('2025-12-20'); // Planned receive (before ship - invalid)
    
    // Select warehouses
    await page.selectOption('select:near(label:has-text("From Warehouse"))', { index: 1 });
    await page.selectOption('select:near(label:has-text("To Warehouse"))', { index: 2 });
    
    // Add line item
    await page.selectOption('select:near(label:has-text("Product"))', { index: 1 });
    await page.fill('input[name="quantity"]', '5');
    
    // Try to submit
    await clickButton(page, 'Create');
    
    // Should show error
    const errorMessage = page.locator('text=/receive.*before.*ship|invalid.*date/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});

