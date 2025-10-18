import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Settings - Suppliers', () => {
  let helpers: TestHelpers;
  const testSupplierName = `SUPPLIER-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    await helpers.cleanupTestSupplier(testSupplierName);
  });

  test('should display suppliers table', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify suppliers table is displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Code")')).toBeVisible();
    await expect(page.locator('th:has-text("Contact")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should create supplier', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Click Create Supplier button
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Fill supplier details
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', '+1234567890');

    // Save supplier
    await page.click('button:has-text("Save")');

    // Verify success
    await helpers.verifyToast('Supplier created successfully');
    await helpers.assert.expectTableRowToBeVisible(testSupplierName);
  });

  test('should edit supplier', async ({ page }) => {
    // First create a supplier
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Save")');

    // Now edit it
    const supplierRow = page.locator(`tr:has-text("${testSupplierName}")`);
    await supplierRow.locator('button[aria-label="Edit"]').click();

    // Modify contact person
    await page.fill('input[name="contact_person"]', 'Jane Smith');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await helpers.verifyToast('Supplier updated successfully');
  });

  test('should manage supplier products', async ({ page }) => {
    // First create a supplier
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Save")');

    // Manage supplier products
    const supplierRow = page.locator(`tr:has-text("${testSupplierName}")`);
    await supplierRow.locator('button[aria-label="Manage Products"]').click();

    // Verify supplier products modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Supplier Products');

    // Add product to supplier
    await page.click('button:has-text("Add Product")');
    await page.selectOption('select[name="product_id"]', { index: 1 });
    await page.fill('input[name="supplier_product_code"]', 'SUP-PROD-001');
    await page.fill('input[name="price"]', '10.50');
    await page.click('button:has-text("Save Product")');

    // Verify product is added
    await helpers.verifyToast('Product added to supplier successfully');
  });

  test('should filter suppliers', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'ACTIVE');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('ACTIVE');
  });

  test('should search suppliers', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Search for specific supplier
    await helpers.searchInTable('SUPPLIER');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should export suppliers', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should validate required fields', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('input[name="name"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="code"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="contact_person"]')).toHaveAttribute('required');
  });

  test('should validate unique supplier code', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Fill with existing supplier code
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'EXISTING-CODE');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Supplier code already exists');
  });

  test('should validate email format', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Fill with invalid email
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Invalid email format');
  });

  test('should validate phone format', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Fill with invalid phone
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', 'invalid-phone');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Invalid phone format');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/settings/suppliers/**', route => route.abort());

    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Fill form
    await page.fill('input[name="name"]', testSupplierName);
    await page.fill('input[name="code"]', 'SUP-001');
    await page.fill('input[name="contact_person"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@supplier.com');
    await page.fill('input[name="phone"]', '+1234567890');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');
    await page.click('button:has-text("Create Supplier")');
    await page.waitForSelector('.modal');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should display supplier status indicators', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify status indicators are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show supplier contact information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier contact information is displayed
    await expect(page.locator('[data-testid="supplier-contact-info"]')).toBeVisible();
  });

  test('should display supplier address information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier address information is displayed
    await expect(page.locator('[data-testid="supplier-address-info"]')).toBeVisible();
  });

  test('should show supplier creation date', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier creation date is displayed
    await expect(page.locator('[data-testid="supplier-creation-date"]')).toBeVisible();
  });

  test('should display supplier modification date', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier modification date is displayed
    await expect(page.locator('[data-testid="supplier-modification-date"]')).toBeVisible();
  });

  test('should show supplier user information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier user information is displayed
    await expect(page.locator('[data-testid="supplier-user-info"]')).toBeVisible();
  });

  test('should display supplier products information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier products information is displayed
    await expect(page.locator('[data-testid="supplier-products-info"]')).toBeVisible();
  });

  test('should show supplier pricing information', async ({ page }) => {
    await helpers.navigateToSettings();
    await helpers.clickTab('suppliers');

    // Verify supplier pricing information is displayed
    await expect(page.locator('[data-testid="supplier-pricing-info"]')).toBeVisible();
  });
});
