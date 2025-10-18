import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Admin - User Management', () => {
  let helpers: TestHelpers;
  const testUserName = `USER-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestUser(testUserName);
  });

  test('should display users table', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Verify users table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Click Create User button
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill user details
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');

    // Save user
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('User created successfully');
    await helpers.assert.expectTableRowToBeVisible(testUserName);
  });

  test('should assign user role', async ({ page }) => {
    // First create a user
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.click('button:has-text("Save")');

    // Now assign a different role
    const userRow = page.locator(`tr:has-text("${testUserName}")`);
    await userRow.locator('button[aria-label="Edit Role"]').click();

    // Select new role
    await page.selectOption('select[name="role"]', 'PLANNER');

    // Save role assignment
    await page.click('button:has-text("Save Role")');

    // Verify role assignment
    await helpers.verifyToast('User role updated successfully');
  });

  test('should edit user details', async ({ page }) => {
    // First create a user
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.click('button:has-text("Save")');

    // Now edit user details
    const userRow = page.locator(`tr:has-text("${testUserName}")`);
    await userRow.locator('button[aria-label="Edit"]').click();

    // Modify user details
    await page.fill('input[name="name"]', `${testUserName} Updated`);

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('User updated successfully');
  });

  test('should deactivate user', async ({ page }) => {
    // First create a user
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.click('button:has-text("Save")');

    // Now deactivate user
    const userRow = page.locator(`tr:has-text("${testUserName}")`);
    await userRow.locator('button[aria-label="Deactivate"]').click();

    // Confirm deactivation
    await page.click('button:has-text("Confirm")');

    // Verify deactivation
    await helpers.verifyToast('User deactivated successfully');
  });

  test('should filter users by role', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Filter by role
    await page.selectOption('select[name="role_filter"]', 'ADMIN');

    // Verify filter is applied
    await expect(page.locator('select[name="role_filter"]')).toHaveValue('ADMIN');
  });

  test('should filter users by status', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'ACTIVE');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('ACTIVE');
  });

  test('should search users', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Search for specific user
    await helpers.searchInTable('admin');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should export users', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('input[name="name"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="role"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required');
  });

  test('should validate unique email', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill with existing email
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Email already exists');
  });

  test('should validate email format', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill with invalid email
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', 'invalid-email');
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Invalid email format');
  });

  test('should validate password confirmation', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill with mismatched passwords
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'differentpassword');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Passwords do not match');
  });

  test('should validate password strength', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill with weak password
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirm_password"]', '123');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Password must be at least 8 characters long');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/admin/users/**', route => route.abort());

    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', `${testUserName}@example.com`);
    await page.selectOption('select[name="role"]', 'OPERATOR');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display user status indicators', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show user role information', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Verify user role information is displayed
    await expect(page.locator('[data-testid="user-role-info"]')).toBeVisible();
  });

  test('should display user creation date', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Verify user creation date is displayed
    await expect(page.locator('[data-testid="user-creation-date"]')).toBeVisible();
  });

  test('should show user last login date', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Verify user last login date is displayed
    await expect(page.locator('[data-testid="user-last-login-date"]')).toBeVisible();
  });

  test('should display user permissions', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('user-management');

    // Verify user permissions are displayed
    await expect(page.locator('[data-testid="user-permissions"]')).toBeVisible();
  });
});
