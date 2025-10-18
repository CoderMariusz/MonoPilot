import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Admin - System Settings', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test('should display settings form', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Verify settings form is displayed
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="company_name"]')).toBeVisible();
    await expect(page.locator('input[name="company_email"]')).toBeVisible();
    await expect(page.locator('input[name="company_phone"]')).toBeVisible();
  });

  test('should update system settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update company name
    await page.fill('input[name="company_name"]', 'Updated Company Name');

    // Update company email
    await page.fill('input[name="company_email"]', 'updated@company.com');

    // Update company phone
    await page.fill('input[name="company_phone"]', '+1234567890');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await helpers.verifyToast('System settings updated successfully');
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Clear required fields
    await page.fill('input[name="company_name"]', '');
    await page.fill('input[name="company_email"]', '');
    await page.fill('input[name="company_phone"]', '');

    // Try to save
    await page.click('button:has-text("Save Settings")');

    // Verify validation errors
    await helpers.verifyToast('Company name is required');
    await helpers.verifyToast('Company email is required');
    await helpers.verifyToast('Company phone is required');
  });

  test('should validate email format', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Fill with invalid email
    await page.fill('input[name="company_email"]', 'invalid-email');

    // Try to save
    await page.click('button:has-text("Save Settings")');

    // Verify validation error
    await helpers.verifyToast('Invalid email format');
  });

  test('should validate phone format', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Fill with invalid phone
    await page.fill('input[name="company_phone"]', 'invalid-phone');

    // Try to save
    await page.click('button:has-text("Save Settings")');

    // Verify validation error
    await helpers.verifyToast('Invalid phone format');
  });

  test('should update notification settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update notification settings
    await page.check('input[name="email_notifications"]');
    await page.check('input[name="sms_notifications"]');
    await page.uncheck('input[name="push_notifications"]');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await helpers.verifyToast('System settings updated successfully');
  });

  test('should update security settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update security settings
    await page.fill('input[name="session_timeout"]', '30');
    await page.fill('input[name="password_min_length"]', '8');
    await page.check('input[name="require_strong_passwords"]');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await helpers.verifyToast('System settings updated successfully');
  });

  test('should update integration settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update integration settings
    await page.fill('input[name="api_rate_limit"]', '1000');
    await page.fill('input[name="webhook_timeout"]', '30');
    await page.check('input[name="enable_api_logging"]');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await helpers.verifyToast('System settings updated successfully');
  });

  test('should update appearance settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update appearance settings
    await page.selectOption('select[name="theme"]', 'dark');
    await page.selectOption('select[name="language"]', 'en');
    await page.selectOption('select[name="timezone"]', 'UTC');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await helpers.verifyToast('System settings updated successfully');
  });

  test('should update backup settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update backup settings
    await page.check('input[name="enable_automatic_backups"]');
    await page.fill('input[name="backup_frequency"]', 'daily');
    await page.fill('input[name="backup_retention_days"]', '30');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await helpers.verifyToast('System settings updated successfully');
  });

  test('should reset settings to defaults', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Reset settings to defaults
    await page.click('button:has-text("Reset to Defaults")');

    // Confirm reset
    await page.click('button:has-text("Confirm")');

    // Verify success
    await helpers.verifyToast('Settings reset to defaults successfully');
  });

  test('should export settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click export button
    await page.click('button:has-text("Export Settings")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should import settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click import button
    await page.click('button:has-text("Import Settings")');

    // Verify import modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Import Settings');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/admin/settings/**', route => route.abort());

    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Try to save settings
    await page.fill('input[name="company_name"]', 'Updated Company Name');
    await page.click('button:has-text("Save Settings")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Update settings
    await page.fill('input[name="company_name"]', 'Updated Company Name');

    // Click save and check for loading state
    await page.click('button:has-text("Save Settings")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save Settings")')).toContainText('Saving...');
  });

  test('should display settings categories', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Verify settings categories are displayed
    await expect(page.locator('[data-testid="settings-categories"]')).toBeVisible();
    await expect(page.locator('text="General"')).toBeVisible();
    await expect(page.locator('text="Security"')).toBeVisible();
    await expect(page.locator('text="Notifications"')).toBeVisible();
    await expect(page.locator('text="Integrations"')).toBeVisible();
  });

  test('should navigate between settings categories', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click on Security category
    await page.click('button:has-text("Security")');

    // Verify Security settings are displayed
    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();

    // Click on Notifications category
    await page.click('button:has-text("Notifications")');

    // Verify Notifications settings are displayed
    await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible();
  });

  test('should display current settings values', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Verify current settings values are displayed
    await expect(page.locator('input[name="company_name"]')).toHaveValue('MonoPilot');
    await expect(page.locator('input[name="company_email"]')).toHaveValue('admin@monopilot.com');
  });

  test('should show settings validation in real-time', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Type invalid email
    await page.fill('input[name="company_email"]', 'invalid-email');

    // Verify validation error appears
    await expect(page.locator('.validation-error')).toBeVisible();
  });

  test('should handle settings import validation', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click import button
    await page.click('button:has-text("Import Settings")');

    // Try to import invalid settings file
    await page.click('button:has-text("Select File")');
    // Note: File selection would need to be mocked in actual implementation

    // Verify validation error
    await helpers.verifyToast('Invalid settings file format');
  });

  test('should display settings history', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click on settings history
    await page.click('button:has-text("View History")');

    // Verify settings history is displayed
    await expect(page.locator('[data-testid="settings-history"]')).toBeVisible();
  });

  test('should restore previous settings', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click on settings history
    await page.click('button:has-text("View History")');

    // Click restore on a previous setting
    await page.click('button:has-text("Restore")');

    // Confirm restore
    await page.click('button:has-text("Confirm")');

    // Verify success
    await helpers.verifyToast('Settings restored successfully');
  });

  test('should display settings documentation', async ({ page }) => {
    await helpers.navigateToAdmin();
    await helpers.clickTab('system-settings');

    // Click on help/documentation
    await page.click('button:has-text("Help")');

    // Verify documentation is displayed
    await expect(page.locator('[data-testid="settings-documentation"]')).toBeVisible();
  });
});
