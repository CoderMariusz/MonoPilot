/**
 * Planning Settings - Section Navigation Tests
 * Bug Fix: P0 CRITICAL - Section header clicks causing navigation to /dashboard
 *
 * Tests that clicking section headers (PO/TO/WO Settings) does not:
 * - Navigate away from the page
 * - Submit the form
 * - Lose unsaved changes
 */

import { test, expect } from '@playwright/test';

const PLANNING_SETTINGS_ROUTE = '/settings/planning';

test.describe('Planning Settings - Section Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLANNING_SETTINGS_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('should not navigate when clicking PO Settings header', async ({ page }) => {
    // Verify we're on the planning settings page
    expect(page.url()).toContain('/settings/planning');

    // Find the PO Settings section header button
    const poHeaderButton = page.locator('[data-testid="po-settings-collapse"]');
    await expect(poHeaderButton).toBeVisible();

    // Click the header to collapse the section
    await poHeaderButton.click();
    await page.waitForTimeout(500); // Wait for any potential navigation

    // Verify we're STILL on the planning settings page
    expect(page.url()).toContain('/settings/planning');
    expect(page.url()).not.toContain('/dashboard');

    // Verify the section collapsed
    const poContent = page.locator('[data-testid="po-settings-content"]');
    await expect(poContent).not.toBeVisible();

    // Click again to expand
    const poExpandButton = page.locator('[data-testid="po-settings-expand"]');
    await poExpandButton.click();
    await page.waitForTimeout(500);

    // Still on same page
    expect(page.url()).toContain('/settings/planning');

    // Section expanded
    await expect(poContent).toBeVisible();
  });

  test('should not navigate when clicking TO Settings header', async ({ page }) => {
    expect(page.url()).toContain('/settings/planning');

    const toHeaderButton = page.locator('[data-testid="to-settings-collapse"]');
    await expect(toHeaderButton).toBeVisible();
    await toHeaderButton.click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/settings/planning');
    expect(page.url()).not.toContain('/dashboard');

    const toContent = page.locator('[data-testid="to-settings-content"]');
    await expect(toContent).not.toBeVisible();
  });

  test('should not navigate when clicking WO Settings header', async ({ page }) => {
    expect(page.url()).toContain('/settings/planning');

    const woHeaderButton = page.locator('[data-testid="wo-settings-collapse"]');
    await expect(woHeaderButton).toBeVisible();
    await woHeaderButton.click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/settings/planning');
    expect(page.url()).not.toContain('/dashboard');

    const woContent = page.locator('[data-testid="wo-settings-content"]');
    await expect(woContent).not.toBeVisible();
  });

  test('should not lose unsaved changes when clicking section headers', async ({ page }) => {
    // Make a change to the form
    const poRequireApprovalCheckbox = page.locator('[name="po_require_approval"]');
    
    // Get initial state
    const initialChecked = await poRequireApprovalCheckbox.isChecked();
    
    // Toggle the checkbox
    await poRequireApprovalCheckbox.click();
    await page.waitForTimeout(300);
    
    // Verify state changed
    const newChecked = await poRequireApprovalCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Click section headers multiple times
    const poHeader = page.locator('[data-testid="po-settings-collapse"]');
    await poHeader.click();
    await page.waitForTimeout(300);

    const poExpand = page.locator('[data-testid="po-settings-expand"]');
    await poExpand.click();
    await page.waitForTimeout(300);

    const toHeader = page.locator('[data-testid="to-settings-collapse"]');
    await toHeader.click();
    await page.waitForTimeout(300);

    // Verify the form change is still there
    const finalChecked = await poRequireApprovalCheckbox.isChecked();
    expect(finalChecked).toBe(newChecked);

    // Verify we're still on the same page
    expect(page.url()).toContain('/settings/planning');
  });

  test('should warn before navigating away with unsaved changes', async ({ page }) => {
    // Make a change to mark form as dirty
    const poRequireApprovalCheckbox = page.locator('[name="po_require_approval"]');
    await poRequireApprovalCheckbox.click();
    await page.waitForTimeout(300);

    // Set up dialog handler to capture the confirm dialog
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message().toLowerCase()).toContain('unsaved changes');
      // Dismiss to stay on page
      await dialog.dismiss();
    });

    // Try to navigate via sidebar link
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    await dashboardLink.click();
    await page.waitForTimeout(500);

    // Verify dialog was shown
    expect(dialogShown).toBe(true);

    // Verify we're still on planning settings page
    expect(page.url()).toContain('/settings/planning');
  });

  test('should allow navigation after saving changes', async ({ page }) => {
    // Make a change
    const poRequireApprovalCheckbox = page.locator('[name="po_require_approval"]');
    await poRequireApprovalCheckbox.click();
    await page.waitForTimeout(300);

    // Save the form
    const saveButton = page.locator('button[type="submit"]').filter({ hasText: /Save Changes/i });
    await saveButton.click();

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Try to navigate - should NOT show dialog
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      await dialog.accept();
    });

    const usersLink = page.locator('a[href="/settings/users"]').first();
    await usersLink.click();
    await page.waitForURL('**/settings/users**', { timeout: 5000 });

    // Verify no dialog was shown
    expect(dialogShown).toBe(false);

    // Verify we navigated successfully
    expect(page.url()).toContain('/settings/users');
  });

  test('section headers should be buttons, not submit buttons', async ({ page }) => {
    // Verify all section header buttons have type="button"
    const poHeader = page.locator('[data-testid^="po-settings-"]').first();
    const toHeader = page.locator('[data-testid^="to-settings-"]').first();
    const woHeader = page.locator('[data-testid^="wo-settings-"]').first();

    // Check that they're buttons (not links or divs)
    await expect(poHeader).toHaveAttribute('type', 'button');
    await expect(toHeader).toHaveAttribute('type', 'button');
    await expect(woHeader).toHaveAttribute('type', 'button');
  });
});
