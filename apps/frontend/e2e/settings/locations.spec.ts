import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Settings - Locations', () => {
  let helpers: TestHelpers;
  const testLocationName = `LOC-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestLocation(testLocationName);
  });

  test('should display locations table', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify locations table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Code")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should create location', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Click Create Location button
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Fill location details
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', 'LOC-001');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');

    // Save location
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Location created successfully');
    await helpers.assert.expectTableRowToBeVisible(testLocationName);
  });

  test('should edit location', async ({ page }) => {
    // First create a location
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', 'LOC-001');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');
    await page.click('button:has-text("Save")');

    // Now edit it
    const locationRow = page.locator(`tr:has-text("${testLocationName}")`);
    await locationRow.locator('button[aria-label="Edit"]').click();

    // Modify description
    await page.fill('textarea[name="description"]', 'Updated test warehouse location');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('Location updated successfully');
  });

  test('should delete location', async ({ page }) => {
    // First create a location
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', 'LOC-001');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');
    await page.click('button:has-text("Save")');

    // Now delete it
    const locationRow = page.locator(`tr:has-text("${testLocationName}")`);
    await locationRow.locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify deletion
    await helpers.verifyToast('Location deleted successfully');
    await helpers.assert.expectTableRowToBeHidden(testLocationName);
  });

  test('should filter locations', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Filter by type
    await page.selectOption('select[name="type_filter"]', 'WAREHOUSE');

    // Verify filter is applied
    await expect(page.locator('select[name="type_filter"]')).toHaveValue('WAREHOUSE');
  });

  test('should search locations', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Search for specific location
    await helpers.searchInTable('WAREHOUSE');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should export locations', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('input[name="name"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="code"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="type"]')).toHaveAttribute('required');
  });

  test('should validate unique location code', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Fill with existing location code
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', 'EXISTING-CODE');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Location code already exists');
  });

  test('should validate location name format', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Fill with invalid location name
    await page.fill('input[name="name"]', '');
    await page.fill('input[name="code"]', 'LOC-001');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Location name is required');
  });

  test('should validate location code format', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Fill with invalid location code
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', '');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Location code is required');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/settings/locations/**', route => route.abort());

    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', 'LOC-001');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testLocationName);
    await page.fill('input[name="code"]', 'LOC-001');
    await page.selectOption('select[name="type"]', 'WAREHOUSE');
    await page.fill('textarea[name="description"]', 'Test warehouse location');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');
    await page.click('button:has-text("Create Location")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display location status indicators', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show location type information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location type information is displayed
    await expect(page.locator('[data-testid="location-type-info"]')).toBeVisible();
  });

  test('should display location description', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location description is displayed
    await expect(page.locator('[data-testid="location-description"]')).toBeVisible();
  });

  test('should show location creation date', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location creation date is displayed
    await expect(page.locator('[data-testid="location-creation-date"]')).toBeVisible();
  });

  test('should display location modification date', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location modification date is displayed
    await expect(page.locator('[data-testid="location-modification-date"]')).toBeVisible();
  });

  test('should show location user information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location user information is displayed
    await expect(page.locator('[data-testid="location-user-info"]')).toBeVisible();
  });

  test('should display location capacity information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location capacity information is displayed
    await expect(page.locator('[data-testid="location-capacity-info"]')).toBeVisible();
  });

  test('should show location address information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location address information is displayed
    await expect(page.locator('[data-testid="location-address-info"]')).toBeVisible();
  });

  test('should display location contact information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('locations');

    // Verify location contact information is displayed
    await expect(page.locator('[data-testid="location-contact-info"]')).toBeVisible();
  });
});
