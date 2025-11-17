import { test, expect } from '@playwright/test';

test.describe('Grouped Dashboard - Technical Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to technical page
    await page.goto('/technical');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Technical")');
  });

  test('E2E: Navigate Raw Materials → Finished Products → Settings', async ({ page }) => {
    // Should start on Raw Materials tab (default)
    await expect(page.locator('button:has-text("Raw Materials")')).toHaveClass(/border-blue-500/);

    // Check that Raw Materials products are visible
    await expect(page.locator('h2:has-text("Raw Materials")')).toBeVisible();

    // Click Finished Products tab
    await page.click('button:has-text("Finished Products")');

    // Verify Finished Products tab is active
    await expect(page.locator('button:has-text("Finished Products")')).toHaveClass(/border-blue-500/);
    await expect(page.locator('h2:has-text("Finished Products")')).toBeVisible();

    // Click Settings tab
    await page.click('button:has-text("Settings")');

    // Verify Settings tab is active
    await expect(page.locator('button:has-text("Settings")')).toHaveClass(/border-blue-500/);
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
    await expect(page.locator('h3:has-text("Allergens")')).toBeVisible();
  });

  test('E2E: Toggle column visibility → columns hide/show', async ({ page }) => {
    // Ensure we're in table view (default)
    await expect(page.locator('button:has-text("Table")')).toHaveClass(/bg-blue-50/);

    // Check that all columns are initially visible
    await expect(page.locator('th:has-text("SKU")')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("UoM")')).toBeVisible();
    await expect(page.locator('th:has-text("Allergens")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    // Open column toggle dropdown
    await page.click('button:has-text("Columns")');

    // Wait for dropdown to be visible
    await page.waitForSelector('label:has-text("Type")');

    // Uncheck "Type" column
    await page.click('label:has-text("Type") input[type="checkbox"]');

    // Verify "Type" column is hidden
    await expect(page.locator('th:has-text("Type")')).not.toBeVisible();

    // Other columns should still be visible
    await expect(page.locator('th:has-text("SKU")')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();

    // Re-check "Type" column
    await page.click('label:has-text("Type") input[type="checkbox"]');

    // Verify "Type" column is visible again
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
  });

  test('E2E: Quick filter "Has Allergens" → only products with allergens shown', async ({ page }) => {
    // Get initial product count
    const initialCountText = await page.locator('span:has-text("of") >> text=/\\d+/').first().textContent();
    const initialCount = parseInt(initialCountText || '0');

    // Apply "Has Allergens" filter
    await page.selectOption('select:near(:text("Filters:"))', { label: 'Has Allergens' });

    // Wait for filtering to complete
    await page.waitForTimeout(500);

    // Get filtered product count
    const filteredCountText = await page.locator('span:has-text("of") >> text=/\\d+/').first().textContent();
    const filteredCount = parseInt(filteredCountText || '0');

    // Filtered count should be less than or equal to initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify that displayed products have allergen badges
    const productRows = page.locator('tbody tr');
    const rowCount = await productRows.count();

    if (rowCount > 0) {
      // Check first row has allergen badge
      const firstRowAllergens = productRows.first().locator('td >> text=/\\d+ allergen/');
      await expect(firstRowAllergens).toBeVisible();
    }

    // Reset filter
    await page.selectOption('select:near(:text("Filters:"))', { label: 'All Allergens' });
  });

  test('E2E: Switch to Card View → cards render correctly', async ({ page }) => {
    // Should start in Table view
    await expect(page.locator('button:has-text("Table")')).toHaveClass(/bg-blue-50/);

    // Verify table is visible
    await expect(page.locator('table')).toBeVisible();

    // Click Cards button
    await page.click('button:has-text("Cards")');

    // Verify Cards view is active
    await expect(page.locator('button:has-text("Cards")')).toHaveClass(/bg-blue-50/);

    // Verify table is no longer visible
    await expect(page.locator('table')).not.toBeVisible();

    // Verify card grid is visible
    await expect(page.locator('div.grid')).toBeVisible();

    // Verify at least one product card is rendered
    const cards = page.locator('div.grid > div');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verify first card has expected elements
    const firstCard = cards.first();
    await expect(firstCard.locator('h3')).toBeVisible(); // SKU
    await expect(firstCard.locator('p')).toBeVisible(); // Description
    await expect(firstCard.locator('button:has-text("Edit")')).toBeVisible();
    await expect(firstCard.locator('button:has-text("View BOMs")')).toBeVisible();

    // Switch back to Table view
    await page.click('button:has-text("Table")');

    // Verify table is visible again
    await expect(page.locator('table')).toBeVisible();
  });

  test('E2E: Search functionality works across views', async ({ page }) => {
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('BEEF');

    // Wait for filtering
    await page.waitForTimeout(500);

    // Verify filtered results in table view
    const tableRows = page.locator('tbody tr');
    const tableRowCount = await tableRows.count();

    // At least one result should contain "BEEF" if products exist
    if (tableRowCount > 0) {
      const firstRowText = await tableRows.first().textContent();
      expect(firstRowText?.toUpperCase()).toContain('BEEF');
    }

    // Switch to card view
    await page.click('button:has-text("Cards")');

    // Verify filtered results in card view
    const cards = page.locator('div.grid > div');
    const cardCount = await cards.count();

    // Card count should match table row count
    expect(cardCount).toBe(tableRowCount);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  test('E2E: Bulk actions select multiple products', async ({ page }) => {
    // Ensure we're in table view
    await expect(page.locator('button:has-text("Table")')).toHaveClass(/bg-blue-50/);

    // Select first product
    const firstCheckbox = page.locator('tbody tr').first().locator('input[type="checkbox"]');
    await firstCheckbox.check();

    // Verify bulk action toolbar appears
    await expect(page.locator('text=/\\d+ selected/')).toBeVisible();
    await expect(page.locator('button:has-text("Mark as Inactive")')).toBeVisible();
    await expect(page.locator('button:has-text("Export to Excel")')).toBeVisible();

    // Select second product
    const secondCheckbox = page.locator('tbody tr').nth(1).locator('input[type="checkbox"]');
    await secondCheckbox.check();

    // Verify count updates
    await expect(page.locator('text=/2 selected/')).toBeVisible();

    // Uncheck first product
    await firstCheckbox.uncheck();

    // Verify count updates
    await expect(page.locator('text=/1 selected/')).toBeVisible();
  });
});
