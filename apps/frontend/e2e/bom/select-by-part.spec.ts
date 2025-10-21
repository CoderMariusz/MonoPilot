import { test, expect } from '@playwright/test';

test.describe('BOM Product Selection by Part Number', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technical/bom');
  });

  test('Select component by Item Number auto-fills Name', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab to see products with BOMs
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Wait for products to load
    await expect(page.getByText('FG-ROAST-200')).toBeVisible();
    
    // Click Edit BOM button for FG-ROAST-200
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Wait for BOM editor modal to open
    await expect(page.getByText('Edit BOM v1.0')).toBeVisible();
    
    // Click Add Item button
    await page.getByRole('button', { name: 'Add Item' }).click();
    
    // Find the Item Number input field in the new row
    const itemNumberInput = page.locator('input[placeholder*="Type item number"]').last();
    await itemNumberInput.fill('RM-001');
    
    // Wait for dropdown to appear and click on the first result
    await expect(page.getByText('RM-001')).toBeVisible();
    await page.getByText('RM-001').first().click();
    
    // Verify that the Name field is auto-filled with "Beef trim"
    const nameCell = page.locator('tr').filter({ hasText: 'RM-001' }).locator('td').nth(1);
    await expect(nameCell).toContainText('Beef trim');
    
    // Verify UoM is auto-filled
    const uomInput = page.locator('tr').filter({ hasText: 'RM-001' }).locator('input[type="text"]').nth(1);
    await expect(uomInput).toHaveValue('kg');
  });

  test('Search filters products by part number', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Click Edit BOM button for FG-ROAST-200
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Click Add Item button
    await page.getByRole('button', { name: 'Add Item' }).click();
    
    // Test search functionality
    const itemNumberInput = page.locator('input[placeholder*="Type item number"]').last();
    
    // Search for meat products
    await itemNumberInput.fill('RM-');
    await expect(page.getByText('RM-001')).toBeVisible();
    await expect(page.getByText('RM-002')).toBeVisible();
    
    // Search for dry goods
    await itemNumberInput.fill('DG-');
    await expect(page.getByText('DG-WEB-123')).toBeVisible();
    await expect(page.getByText('DG-LABEL-001')).toBeVisible();
    
    // Search for specific product
    await itemNumberInput.fill('DG-WEB-123');
    await expect(page.getByText('DG-WEB-123')).toBeVisible();
    await expect(page.getByText('Web 123')).toBeVisible();
  });

  test('Product selection shows correct details', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Click Edit BOM button for FG-ROAST-200
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Click Add Item button
    await page.getByRole('button', { name: 'Add Item' }).click();
    
    // Select a product
    const itemNumberInput = page.locator('input[placeholder*="Type item number"]').last();
    await itemNumberInput.fill('RM-001');
    await page.getByText('RM-001').first().click();
    
    // Verify all product details are displayed correctly
    const row = page.locator('tr').filter({ hasText: 'RM-001' });
    
    // Check part number
    await expect(row.locator('td').nth(0)).toContainText('RM-001');
    
    // Check name (auto-filled)
    await expect(row.locator('td').nth(1)).toContainText('Beef trim');
    
    // Check UoM (auto-filled)
    const uomInput = row.locator('input[type="text"]').nth(1);
    await expect(uomInput).toHaveValue('kg');
    
    // Check that quantity defaults to 1
    const qtyInput = row.locator('input[type="number"]').first();
    await expect(qtyInput).toHaveValue('1');
  });
});
