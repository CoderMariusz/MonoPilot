import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('BOM - Search & Filter', () => {
  let helpers: TestHelpers;
  const testProductNumber = `SEARCH-TEST-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Create test products
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('DRYGOODS');
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'Search Test Product',
      uom: 'kg',
      std_price: '10.00',
    });
    await helpers.saveProduct();
  });

  test.afterEach(async () => {
    await helpers.cleanupTestProduct(testProductNumber);
  });

  test('should search products by part number', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable(testProductNumber);
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should search products by description', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable('Search Test');
    await expect(page.locator(`tr:has-text("Search Test Product")`)).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await helpers.navigateToBOM();
    await page.selectOption('select[name="category_filter"]', 'DRYGOODS');
    await expect(page.locator(`tr:has-text("${testProductNumber}")`)).toBeVisible();
  });

  test('should clear search and filters', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable(testProductNumber);
    await helpers.clearSearch();
    await expect(page.locator('input[type="search"]')).toHaveValue('');
  });

  test('should handle empty search results', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable('NonExistentProduct');
    await expect(page.locator('text="No products found"')).toBeVisible();
  });

  test('should paginate search results', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable('Test');
    // Verify pagination controls are visible
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
  });

  test('should sort search results', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable('Test');
    await helpers.clickSort('Part Number');
    await helpers.verifySorting('Part Number', 'asc');
  });

  test('should export search results', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.searchInTable('Test');
    await page.click('button:has-text("Export")');
    await helpers.verifyExportStarted();
  });
});
