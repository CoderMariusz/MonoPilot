import { test, expect } from '@playwright/test';

test.describe('Scanner Consume Whole LP Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scanner');
  });

  test('Consume whole LP enforces 1:1 consumption', async ({ page }) => {
    // Navigate to scanner page
    await expect(page.getByText('Scanner')).toBeVisible();
    
    // Scan a material that has consume_whole_lp = true (RM-001 from test data)
    const scanInput = page.getByPlaceholder(/Scan barcode/i);
    await scanInput.fill('RM-001');
    await scanInput.press('Enter');
    
    // Should show material details
    await expect(page.getByText('Beef trim')).toBeVisible();
    await expect(page.getByText('1:1 Consumption Required')).toBeVisible();
    
    // Try to consume partial quantity (should be blocked)
    const quantityInput = page.getByLabel(/Quantity/i);
    await quantityInput.fill('0.5');
    
    const consumeButton = page.getByRole('button', { name: /Consume/i });
    await consumeButton.click();
    
    // Should show error message
    await expect(page.getByText(/This material requires 1:1 LP consumption/i)).toBeVisible();
    
    // Try to consume exact quantity (should work)
    await quantityInput.fill('1');
    await consumeButton.click();
    
    // Should show success message
    await expect(page.getByText(/Consumed successfully/i)).toBeVisible();
  });

  test('Consume whole LP blocks LP split action', async ({ page }) => {
    // Navigate to scanner page
    await expect(page.getByText('Scanner')).toBeVisible();
    
    // Scan a material that has consume_whole_lp = true
    const scanInput = page.getByPlaceholder(/Scan barcode/i);
    await scanInput.fill('RM-001');
    await scanInput.press('Enter');
    
    // Should show material details
    await expect(page.getByText('Beef trim')).toBeVisible();
    
    // Try to access split LP functionality
    const splitButton = page.getByRole('button', { name: /Split LP/i });
    if (await splitButton.isVisible()) {
      await splitButton.click();
      
      // Should show error message about 1:1 requirement
      await expect(page.getByText(/Cannot split LP for 1:1 materials/i)).toBeVisible();
    }
  });

  test('Non-1:1 materials allow partial consumption', async ({ page }) => {
    // Navigate to scanner page
    await expect(page.getByText('Scanner')).toBeVisible();
    
    // Scan a material that has consume_whole_lp = false (DG-WEB-123 from test data)
    const scanInput = page.getByPlaceholder(/Scan barcode/i);
    await scanInput.fill('DG-WEB-123');
    await scanInput.press('Enter');
    
    // Should show material details
    await expect(page.getByText('Web 123')).toBeVisible();
    
    // Try to consume partial quantity (should work)
    const quantityInput = page.getByLabel(/Quantity/i);
    await quantityInput.fill('50');
    
    const consumeButton = page.getByRole('button', { name: /Consume/i });
    await consumeButton.click();
    
    // Should show success message
    await expect(page.getByText(/Consumed successfully/i)).toBeVisible();
  });

  test('Scanner shows 1:1 indicator for appropriate materials', async ({ page }) => {
    // Navigate to scanner page
    await expect(page.getByText('Scanner')).toBeVisible();
    
    // Scan a 1:1 material
    const scanInput = page.getByPlaceholder(/Scan barcode/i);
    await scanInput.fill('RM-001');
    await scanInput.press('Enter');
    
    // Should show 1:1 indicator
    await expect(page.getByText('1:1 Consumption Required')).toBeVisible();
    await expect(page.getByText('🔒')).toBeVisible(); // Lock icon
    
    // Scan a non-1:1 material
    await scanInput.fill('DG-WEB-123');
    await scanInput.press('Enter');
    
    // Should not show 1:1 indicator
    await expect(page.getByText('1:1 Consumption Required')).not.toBeVisible();
  });

  test('Consume whole LP validation in batch operations', async ({ page }) => {
    // Navigate to scanner page
    await expect(page.getByText('Scanner')).toBeVisible();
    
    // Access batch consume functionality
    const batchButton = page.getByRole('button', { name: /Batch Consume/i });
    if (await batchButton.isVisible()) {
      await batchButton.click();
      
      // Add 1:1 material to batch
      const addMaterialButton = page.getByRole('button', { name: /Add Material/i });
      await addMaterialButton.click();
      
      const materialSelect = page.getByLabel(/Material/i);
      await materialSelect.selectOption('RM-001');
      
      const quantityInput = page.getByLabel(/Quantity/i);
      await quantityInput.fill('0.5'); // Partial quantity
      
      // Try to save batch
      const saveBatchButton = page.getByRole('button', { name: /Save Batch/i });
      await saveBatchButton.click();
      
      // Should show validation error
      await expect(page.getByText(/1:1 materials require exact quantity/i)).toBeVisible();
      
      // Fix quantity
      await quantityInput.fill('1');
      await saveBatchButton.click();
      
      // Should save successfully
      await expect(page.getByText(/Batch saved successfully/i)).toBeVisible();
    }
  });
});
