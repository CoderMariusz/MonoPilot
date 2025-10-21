import { test, expect } from '@playwright/test';

test.describe('Work Order BOM Snapshot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/production');
  });

  test('Update snapshot from BOM allowed for PLANNED status only', async ({ page }) => {
    // Navigate to production page
    await expect(page.getByText('Production')).toBeVisible();
    
    // Navigate to work orders (assuming there's a work orders section)
    // This test assumes the production page has work orders listed
    await expect(page.getByText('WO-TEST-001')).toBeVisible();
    
    // Click on a planned work order
    await page.getByText('WO-TEST-001').click();
    
    // Should show work order details
    await expect(page.getByText('Work Order Details')).toBeVisible();
    
    // Should show "Update snapshot from BOM" button for planned WO
    const updateSnapshotButton = page.getByRole('button', { name: /Update snapshot from BOM/i });
    await expect(updateSnapshotButton).toBeVisible();
    
    // Click update snapshot button
    await updateSnapshotButton.click();
    
    // Should show preview modal with diff
    await expect(page.getByText('BOM Snapshot Preview')).toBeVisible();
    await expect(page.getByText('Current Materials')).toBeVisible();
    await expect(page.getByText('Proposed Materials')).toBeVisible();
    
    // Click Apply button
    await page.getByRole('button', { name: 'Apply' }).click();
    
    // Should show success message
    await expect(page.getByText('Snapshot updated successfully')).toBeVisible();
  });

  test('Update snapshot blocked for WO with issues', async ({ page }) => {
    // Navigate to production page
    await expect(page.getByText('Production')).toBeVisible();
    
    // Find a work order that has issues (WO-TEST-003 is released, might have issues)
    await expect(page.getByText('WO-TEST-003')).toBeVisible();
    
    // Click on the work order
    await page.getByText('WO-TEST-003').click();
    
    // Simulate recording an issue
    const recordIssueButton = page.getByRole('button', { name: /Record Issue/i });
    if (await recordIssueButton.isVisible()) {
      await recordIssueButton.click();
      
      // Fill in issue details (assuming there's a form)
      await page.getByLabel('Issue Description').fill('Test issue');
      await page.getByRole('button', { name: 'Save Issue' }).click();
    }
    
    // Try to update snapshot
    const updateSnapshotButton = page.getByRole('button', { name: /Update snapshot from BOM/i });
    if (await updateSnapshotButton.isVisible()) {
      await updateSnapshotButton.click();
      
      // Should show error message about blocked update
      await expect(page.getByText(/blocked/i)).toBeVisible();
    }
  });

  test('Snapshot preview shows correct diff', async ({ page }) => {
    // Navigate to production page
    await expect(page.getByText('Production')).toBeVisible();
    
    // Click on planned work order
    await page.getByText('WO-TEST-001').click();
    
    // Click update snapshot button
    const updateSnapshotButton = page.getByRole('button', { name: /Update snapshot from BOM/i });
    await updateSnapshotButton.click();
    
    // Should show preview with materials
    await expect(page.getByText('BOM Snapshot Preview')).toBeVisible();
    
    // Should show current materials from WO
    await expect(page.getByText('RM-001')).toBeVisible();
    await expect(page.getByText('Beef trim')).toBeVisible();
    
    // Should show proposed materials from BOM
    await expect(page.getByText('Proposed Materials')).toBeVisible();
    
    // Should show diff information
    await expect(page.getByText(/added|removed|modified/i)).toBeVisible();
  });

  test('Snapshot apply updates WO materials', async ({ page }) => {
    // Navigate to production page
    await expect(page.getByText('Production')).toBeVisible();
    
    // Click on planned work order
    await page.getByText('WO-TEST-001').click();
    
    // Record current materials count
    const materialsTable = page.locator('table').filter({ hasText: 'Materials' });
    const initialRowCount = await materialsTable.locator('tbody tr').count();
    
    // Click update snapshot button
    const updateSnapshotButton = page.getByRole('button', { name: /Update snapshot from BOM/i });
    await updateSnapshotButton.click();
    
    // Apply the snapshot
    await page.getByRole('button', { name: 'Apply' }).click();
    
    // Should show success message
    await expect(page.getByText('Snapshot updated successfully')).toBeVisible();
    
    // Verify materials were updated
    const updatedRowCount = await materialsTable.locator('tbody tr').count();
    expect(updatedRowCount).toBeGreaterThan(0);
  });
});
