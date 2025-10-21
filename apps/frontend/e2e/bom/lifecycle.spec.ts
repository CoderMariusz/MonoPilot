import { test, expect } from '@playwright/test';

test.describe('BOM Lifecycle Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technical/bom');
  });

  test('Edit active BOM creates draft copy', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Find FG-ROAST-200 which has an active BOM
    await expect(page.getByText('FG-ROAST-200')).toBeVisible();
    
    // Verify it shows as active
    const statusBadge = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByText('active');
    await expect(statusBadge).toBeVisible();
    
    // Click Edit BOM button
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Should show clone warning modal
    await expect(page.getByText('Clone Active BOM')).toBeVisible();
    await expect(page.getByText('This BOM is currently active. Editing will create a new draft copy.')).toBeVisible();
    
    // Click Clone & Edit
    await page.getByRole('button', { name: 'Clone & Edit' }).click();
    
    // Should show success message
    await expect(page.getByText('BOM cloned and saved as draft')).toBeVisible();
    
    // Modal should close
    await expect(page.getByText('Edit BOM v1.0')).not.toBeVisible();
  });

  test('Activate draft BOM archives previous active', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Find FG-ROAST-200 which has a draft BOM (v1.1)
    await expect(page.getByText('FG-ROAST-200')).toBeVisible();
    
    // Click Edit BOM button for the draft
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Should open BOM editor for draft
    await expect(page.getByText('Edit BOM v1.1')).toBeVisible();
    
    // Click Activate button
    await page.getByRole('button', { name: 'Activate' }).click();
    
    // Should show success message
    await expect(page.getByText('BOM activated successfully')).toBeVisible();
    
    // Modal should close
    await expect(page.getByText('Edit BOM v1.1')).not.toBeVisible();
    
    // Verify the BOM is now active
    const statusBadge = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByText('active');
    await expect(statusBadge).toBeVisible();
  });

  test('Archive BOM changes status', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Find FG-ROAST-300 which has an active BOM
    await expect(page.getByText('FG-ROAST-300')).toBeVisible();
    
    // Click Edit BOM button
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-300' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Click Archive button
    await page.getByRole('button', { name: 'Archive' }).click();
    
    // Should show success message
    await expect(page.getByText('BOM archived successfully')).toBeVisible();
    
    // Modal should close
    await expect(page.getByText('Edit BOM v1.0')).not.toBeVisible();
    
    // Verify the BOM is now archived
    const statusBadge = page.locator('tr').filter({ hasText: 'FG-ROAST-300' }).getByText('archived');
    await expect(statusBadge).toBeVisible();
  });

  test('Hard delete only works for draft BOMs', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Find FG-ROAST-200 which has an active BOM
    await expect(page.getByText('FG-ROAST-200')).toBeVisible();
    
    // Click Edit BOM button
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Try to click Hard Delete button (should be disabled for active BOM)
    const hardDeleteButton = page.getByRole('button', { name: 'Hard Delete' });
    await expect(hardDeleteButton).toBeDisabled();
  });

  test('BOM status filtering works', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Should see both products with BOMs
    await expect(page.getByText('FG-ROAST-200')).toBeVisible();
    await expect(page.getByText('FG-ROAST-300')).toBeVisible();
    
    // Both should show BOM status badges
    const statusBadges = page.locator('tr').filter({ hasText: 'FG-ROAST' }).getByText(/active|draft|archived/);
    await expect(statusBadges).toHaveCount(2);
  });

  test('BOM editor shows correct fields', async ({ page }) => {
    // Navigate to BOM catalog
    await expect(page.getByText('BOM & Items Catalog')).toBeVisible();
    
    // Click on Finished Goods tab
    await page.getByRole('button', { name: 'Finished Goods' }).click();
    
    // Click Edit BOM button for FG-ROAST-200
    const editBomButton = page.locator('tr').filter({ hasText: 'FG-ROAST-200' }).getByRole('button', { name: 'Edit BOM' });
    await editBomButton.click();
    
    // Should show clone warning for active BOM
    await expect(page.getByText('Clone Active BOM')).toBeVisible();
    await page.getByRole('button', { name: 'Clone & Edit' }).click();
    
    // Should show BOM editor with all required fields
    await expect(page.getByText('Version')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Requires Routing')).toBeVisible();
    await expect(page.getByText('BOM Items')).toBeVisible();
    
    // Should show BOM items table with correct columns
    await expect(page.getByText('Item Number')).toBeVisible();
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Qty')).toBeVisible();
    await expect(page.getByText('UoM')).toBeVisible();
    await expect(page.getByText('Scrap %')).toBeVisible();
    await expect(page.getByText('Optional')).toBeVisible();
    await expect(page.getByText('Phantom')).toBeVisible();
    await expect(page.getByText('1:1')).toBeVisible();
    await expect(page.getByText('Lead Time')).toBeVisible();
    await expect(page.getByText('MOQ')).toBeVisible();
    await expect(page.getByText('Unit Cost')).toBeVisible();
  });
});
