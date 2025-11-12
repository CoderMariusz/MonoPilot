/**
 * E2E Tests: BOM Versioning Flow
 * Epic: EPIC-001 BOM Complexity v2 - Phase 2
 * Created: 2025-01-11
 * 
 * Test Scenarios:
 * 1. Create multiple BOM versions with different date ranges
 * 2. Validate date overlap prevention
 * 3. View BOM version timeline
 * 4. Create WO with current BOM version
 * 5. Create WO with future BOM version
 * 6. Verify correct BOM selection by date
 */

import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('BOM Versioning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should create BOM v1.0 (current version)', async ({ page }) => {
    // Navigate to Products
    await page.goto('/production/products');
    await expect(page.locator('h1')).toContainText('Products');

    // Create new product for version testing
    await page.click('button:has-text("Create Product")');
    await page.fill('input[name="product_code"]', 'TEST-VERSIONED-001');
    await page.fill('input[name="description"]', 'Test Product for Versioning');
    await page.selectOption('select[name="product_type"]', 'FG');
    await page.fill('input[name="uom"]', 'kg');
    await page.check('input[name="is_active"]');
    await page.click('button:has-text("Save Product")');

    // Create BOM v1.0
    await page.click('text=Create BOM');
    
    // Set version number
    await page.fill('input[name="version"]', '1.0');
    
    // Set effective dates (today → no expiry)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="effective_from"]', today);
    // Leave effective_to empty (no expiry)
    
    // Add material
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[0].material_id"]', { index: 1 });
    await page.fill('input[name="materials[0].quantity"]', '10');
    await page.selectOption('select[name="materials[0].uom"]', 'kg');
    
    // Save BOM
    await page.click('button:has-text("Save BOM")');
    await expect(page.locator('text=BOM created successfully')).toBeVisible();
    
    // Verify BOM is shown as "Current"
    await expect(page.locator('text=Current').first()).toBeVisible();
  });

  test('should create BOM v2.0 (future version)', async ({ page }) => {
    // Open existing product
    await page.goto('/production/products');
    await page.click('text=TEST-VERSIONED-001');
    
    // Navigate to BOM section
    await page.click('text=Bill of Materials');
    
    // Open version timeline
    await page.click('text=Version Timeline');
    await expect(page.locator('h3:has-text("BOM Version Timeline")')).toBeVisible();
    
    // Create new version
    await page.click('button:has-text("Create New Version")');
    
    // Modal should open
    await expect(page.locator('h2:has-text("Create New BOM Version")')).toBeVisible();
    
    // Set version number
    await page.fill('input[placeholder*="1.1"]', '2.0');
    
    // Set effective dates (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="effective_from"]', futureDateStr);
    
    // Submit
    await page.click('button:has-text("Create New Version")');
    
    // Verify success
    await expect(page.locator('text=BOM version created successfully')).toBeVisible();
    
    // Verify new version appears in timeline
    await expect(page.locator('text=Version 2.0')).toBeVisible();
    await expect(page.locator('text=Future').first()).toBeVisible();
  });

  test('should prevent overlapping date ranges', async ({ page }) => {
    // Open product with existing BOMs
    await page.goto('/production/products');
    await page.click('text=TEST-VERSIONED-001');
    await page.click('text=Bill of Materials');
    await page.click('text=Version Timeline');
    
    // Try to create overlapping version
    await page.click('button:has-text("Create New Version")');
    
    // Set version
    await page.fill('input[placeholder*="1.1"]', '1.5');
    
    // Set date that overlaps with v1.0 (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="effective_from"]', today);
    
    // Should show validation error
    await expect(page.locator('text=Date range conflict')).toBeVisible();
    await expect(page.locator('text=overlaps with existing')).toBeVisible();
    
    // Submit button should be disabled
    const submitButton = page.locator('button:has-text("Create New Version")');
    await expect(submitButton).toBeDisabled();
  });

  test('should display BOM version timeline', async ({ page }) => {
    // Open product
    await page.goto('/production/products');
    await page.click('text=TEST-VERSIONED-001');
    await page.click('text=Bill of Materials');
    await page.click('text=Version Timeline');
    
    // Verify timeline is displayed
    await expect(page.locator('h3:has-text("BOM Version Timeline")')).toBeVisible();
    
    // Verify versions are listed
    await expect(page.locator('text=Version 1.0')).toBeVisible();
    await expect(page.locator('text=Version 2.0')).toBeVisible();
    
    // Verify status badges
    await expect(page.locator('text=Current').first()).toBeVisible();  // v1.0
    await expect(page.locator('text=Future').first()).toBeVisible();   // v2.0
    
    // Verify date ranges are displayed
    await expect(page.locator('text=No expiry').first()).toBeVisible();
  });

  test('should select correct BOM version when creating WO today', async ({ page }) => {
    // Create Work Order for today
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    
    // Select product with multiple BOM versions
    await page.selectOption('select[name="product_id"]', { label: /TEST-VERSIONED-001/ });
    
    // Fill WO details with today's date
    await page.fill('input[name="quantity"]', '100');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="scheduled_start"]', today);
    await page.fill('input[name="scheduled_end"]', today);
    
    // System should auto-select BOM v1.0 (current)
    await expect(page.locator('text=BOM Version: 1.0')).toBeVisible();
    
    // Create WO
    await page.click('button:has-text("Create Work Order")');
    await expect(page.locator('text=Work Order created successfully')).toBeVisible();
    
    // Open WO details
    await page.click('text=WO-');
    
    // Verify BOM version is v1.0
    await expect(page.locator('text=BOM v1.0')).toBeVisible();
  });

  test('should select correct BOM version when creating WO 40 days from now', async ({ page }) => {
    // Create Work Order for 40 days from now (should use v2.0)
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    
    // Select product
    await page.selectOption('select[name="product_id"]', { label: /TEST-VERSIONED-001/ });
    
    // Fill WO details with future date (40 days from now)
    await page.fill('input[name="quantity"]', '100');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 40);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="scheduled_start"]', futureDateStr);
    await page.fill('input[name="scheduled_end"]', futureDateStr);
    
    // System should auto-select BOM v2.0 (future)
    await expect(page.locator('text=BOM Version: 2.0')).toBeVisible();
    
    // Create WO
    await page.click('button:has-text("Create Work Order")');
    await expect(page.locator('text=Work Order created successfully')).toBeVisible();
    
    // Open WO details
    await page.click('text=WO-');
    
    // Verify BOM version is v2.0
    await expect(page.locator('text=BOM v2.0')).toBeVisible();
  });

  test('should create seasonal BOM version (with expiry)', async ({ page }) => {
    // Open product
    await page.goto('/production/products');
    await page.click('text=TEST-VERSIONED-001');
    await page.click('text=Bill of Materials');
    await page.click('text=Version Timeline');
    
    // Create seasonal version
    await page.click('button:has-text("Create New Version")');
    
    // Set version
    await page.fill('input[placeholder*="1.1"]', '1.5-XMAS');
    
    // Set date range (Dec 1 - Jan 15)
    await page.fill('input[name="effective_from"]', '2025-12-01');
    
    // Enable expiry
    await page.check('input[id="hasExpiry"]');
    await page.fill('input[name="effective_to"]', '2026-01-15');
    
    // Verify validation passes
    await expect(page.locator('text=Date range is valid')).toBeVisible();
    
    // Submit
    await page.click('button:has-text("Create New Version")');
    await expect(page.locator('text=BOM version created successfully')).toBeVisible();
    
    // Verify in timeline
    await expect(page.locator('text=Version 1.5-XMAS')).toBeVisible();
    await expect(page.locator('text=Dec 1')).toBeVisible();
    await expect(page.locator('text=Jan 15')).toBeVisible();
  });

  test('should clone BOM with all materials and by-products', async ({ page }) => {
    // Create BOM v1.0 with materials and by-products
    await page.goto('/production/products');
    await page.click('button:has-text("Create Product")');
    await page.fill('input[name="product_code"]', 'TEST-CLONE-001');
    await page.fill('input[name="description"]', 'Test Clone Product');
    await page.selectOption('select[name="product_type"]', 'FG');
    await page.click('button:has-text("Save Product")');
    
    // Create BOM with materials + by-products
    await page.click('text=Create BOM');
    await page.fill('input[name="version"]', '1.0');
    
    // Add material
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[0].material_id"]', { index: 1 });
    await page.fill('input[name="materials[0].quantity"]', '10');
    
    // Add by-product
    await page.click('button:has-text("Add By-Product")');
    await page.selectOption('select[name="by_products[0].material_id"]', { index: 1 });
    await page.fill('input[name="by_products[0].yield_percentage"]', '15');
    
    await page.click('button:has-text("Save BOM")');
    
    // Create v2.0 (clone)
    await page.click('text=Version Timeline');
    await page.click('button:has-text("Create New Version")');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('input[name="effective_from"]', futureDate.toISOString().split('T')[0]);
    await page.click('button:has-text("Create New Version")');
    
    // Open cloned BOM
    await page.click('text=Version 2.0');
    
    // Verify materials are cloned
    await expect(page.locator('text=10 kg')).toBeVisible();
    
    // Verify by-products are cloned
    await expect(page.locator('text=15%')).toBeVisible();
  });

  test('should show error when no BOM covers WO date', async ({ page }) => {
    // Try to create WO for date with no BOM coverage
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    
    await page.selectOption('select[name="product_id"]', { label: /TEST-VERSIONED-001/ });
    await page.fill('input[name="quantity"]', '100');
    
    // Date far in the future (beyond all BOM versions)
    const veryFutureDate = new Date();
    veryFutureDate.setFullYear(veryFutureDate.getFullYear() + 5);
    await page.fill('input[name="scheduled_start"]', veryFutureDate.toISOString().split('T')[0]);
    
    // Should show error
    await expect(page.locator('text=No active BOM found')).toBeVisible();
    
    // Create button should be disabled
    const createButton = page.locator('button:has-text("Create Work Order")');
    await expect(createButton).toBeDisabled();
  });

  test('should edit BOM without affecting version (draft status)', async ({ page }) => {
    // Open product
    await page.goto('/production/products');
    await page.click('text=TEST-VERSIONED-001');
    await page.click('text=Bill of Materials');
    
    // Edit current BOM (should clone-on-edit if active)
    await page.click('button:has-text("Edit BOM")');
    
    // Change material quantity
    await page.fill('input[name="materials[0].quantity"]', '12');
    
    // Save
    await page.click('button:has-text("Save Changes")');
    
    // Should create draft version (clone-on-edit)
    await expect(page.locator('text=Draft version created')).toBeVisible();
    
    // Original v1.0 should remain unchanged
    await page.click('text=Version Timeline');
    await expect(page.locator('text=Version 1.0')).toBeVisible();
    await expect(page.locator('text=Current').first()).toBeVisible();
  });
});

