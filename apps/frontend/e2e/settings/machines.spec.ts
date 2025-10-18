import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Settings - Machines', () => {
  let helpers: TestHelpers;
  const testMachineName = `MACHINE-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestMachine(testMachineName);
  });

  test('should display machines table', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machines table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Code")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should create machine', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Click Create Machine button
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Fill machine details
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', 'MACH-001');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');

    // Save machine
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Machine created successfully');
    await helpers.assert.expectTableRowToBeVisible(testMachineName);
  });

  test('should edit machine', async ({ page }) => {
    // First create a machine
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', 'MACH-001');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');
    await page.click('button:has-text("Save")');

    // Now edit it
    const machineRow = page.locator(`tr:has-text("${testMachineName}")`);
    await machineRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('textarea[name="description"]', 'Updated test production machine');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('Machine updated successfully');
  });

  test('should delete machine', async ({ page }) => {
    // First create a machine
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', 'MACH-001');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');
    await page.click('button:has-text("Save")');

    // Now delete it
    const machineRow = page.locator(`tr:has-text("${testMachineName}")`);
    await machineRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify deletion
    await helpers.verifyToast('Machine deleted successfully');
    await helpers.assert.expectTableRowToBeHidden(testMachineName);
  });

  test('should filter machines', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Filter by type
    await page.selectOption('select[name="type_filter"]', 'PRODUCTION');

    // Verify filter is applied
    await expect(page.locator('select[name="type_filter"]')).toHaveValue('PRODUCTION');
  });

  test('should search machines', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Search for specific machine
    await helpers.searchInTable('PRODUCTION');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should export machines', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('input[name="name"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="code"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="type"]')).toHaveAttribute('required');
  });

  test('should validate unique machine code', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Fill with existing machine code
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', 'EXISTING-CODE');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Machine code already exists');
  });

  test('should validate machine name format', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Fill with invalid machine name
    await page.fill('input[name="name"]', '');
    await page.fill('input[name="code"]', 'MACH-001');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Machine name is required');
  });

  test('should validate machine code format', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Fill with invalid machine code
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', '');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Machine code is required');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/settings/machines/**', route => route.abort());

    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', 'MACH-001');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testMachineName);
    await page.fill('input[name="code"]', 'MACH-001');
    await page.selectOption('select[name="type"]', 'PRODUCTION');
    await page.fill('textarea[name="description"]', 'Test production machine');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');
    await page.click('button:has-text("Create Machine")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display machine status indicators', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show machine type information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine type information is displayed
    await expect(page.locator('[data-testid="machine-type-info"]')).toBeVisible();
  });

  test('should display machine description', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine description is displayed
    await expect(page.locator('[data-testid="machine-description"]')).toBeVisible();
  });

  test('should show machine creation date', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine creation date is displayed
    await expect(page.locator('[data-testid="machine-creation-date"]')).toBeVisible();
  });

  test('should display machine modification date', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine modification date is displayed
    await expect(page.locator('[data-testid="machine-modification-date"]')).toBeVisible();
  });

  test('should show machine user information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine user information is displayed
    await expect(page.locator('[data-testid="machine-user-info"]')).toBeVisible();
  });

  test('should display machine capacity information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine capacity information is displayed
    await expect(page.locator('[data-testid="machine-capacity-info"]')).toBeVisible();
  });

  test('should show machine specifications', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine specifications are displayed
    await expect(page.locator('[data-testid="machine-specifications"]')).toBeVisible();
  });

  test('should display machine maintenance information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('machines');

    // Verify machine maintenance information is displayed
    await expect(page.locator('[data-testid="machine-maintenance-info"]')).toBeVisible();
  });
});
