/**
 * E2E Tests: By-Products Flow
 * Epic: EPIC-001 BOM Complexity v2 - Phase 1
 * Created: 2025-01-11
 * 
 * Test Scenarios:
 * 1. Create BOM with by-products
 * 2. Create WO from BOM with by-products (snapshot)
 * 3. Record by-product output (create LP)
 * 4. Verify LP creation and traceability
 */

import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('By-Products Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should create BOM with by-products', async ({ page }) => {
    // Navigate to Products page
    await page.goto('/production/products');
    await expect(page.locator('h1')).toContainText('Products');

    // Create new product (main output)
    await page.click('button:has-text("Create Product")');
    
    // Fill product details
    await page.fill('input[name="product_code"]', 'TEST-RIBEYE-001');
    await page.fill('input[name="description"]', 'Test Ribeye Steak');
    await page.selectOption('select[name="product_type"]', 'FG');
    await page.fill('input[name="uom"]', 'kg');
    await page.check('input[name="is_active"]');
    
    // Save product
    await page.click('button:has-text("Save Product")');
    await expect(page.locator('text=Product created successfully')).toBeVisible();

    // Navigate to BOM section
    await page.click('text=Create BOM');
    await expect(page.locator('h2')).toContainText('Create Bill of Materials');

    // Add input material (ribeye primal)
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[0].material_id"]', { label: /BXS-001/ });
    await page.fill('input[name="materials[0].quantity"]', '1.5');
    await page.selectOption('select[name="materials[0].uom"]', 'kg');

    // Add by-product #1: Bones
    await page.click('button:has-text("Add By-Product")');
    await page.selectOption('select[name="by_products[0].material_id"]', { label: /BONES/ });
    await page.fill('input[name="by_products[0].yield_percentage"]', '15.00');
    await page.selectOption('select[name="by_products[0].uom"]', 'kg');

    // Add by-product #2: Fat Trim
    await page.click('button:has-text("Add By-Product")');
    await page.selectOption('select[name="by_products[1].material_id"]', { label: /TRIM/ });
    await page.fill('input[name="by_products[1].yield_percentage"]', '10.00');
    await page.selectOption('select[name="by_products[1].uom"]', 'kg');

    // Verify total yield warning
    await expect(page.locator('text=Total By-Product Yield: 25.00%')).toBeVisible();

    // Save BOM
    await page.click('button:has-text("Save BOM")');
    await expect(page.locator('text=BOM created successfully')).toBeVisible();
  });

  test('should create WO and snapshot by-products from BOM', async ({ page }) => {
    // Navigate to Work Orders
    await page.goto('/production/work-orders');
    await expect(page.locator('h1')).toContainText('Work Orders');

    // Create new WO
    await page.click('button:has-text("Create Work Order")');
    
    // Fill WO details
    await page.selectOption('select[name="product_id"]', { label: /TEST-RIBEYE-001/ });
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="uom"]', 'kg');
    await page.fill('input[name="scheduled_start"]', '2025-01-15');
    await page.fill('input[name="scheduled_end"]', '2025-01-15');
    
    // Save WO
    await page.click('button:has-text("Create Work Order")');
    await expect(page.locator('text=Work Order created successfully')).toBeVisible();

    // Open WO details
    await page.click('text=WO-'); // Click on WO number
    
    // Navigate to By-Products tab
    await page.click('text=By-Products');
    
    // Verify by-products are snapshotted from BOM
    await expect(page.locator('text=BONES')).toBeVisible();
    await expect(page.locator('text=TRIM')).toBeVisible();
    
    // Verify expected quantities
    await expect(page.locator('text=15.00 kg')).toBeVisible(); // Bones: 100kg * 15% = 15kg
    await expect(page.locator('text=10.00 kg')).toBeVisible(); // Trim: 100kg * 10% = 10kg
    
    // Verify status is "Pending"
    await expect(page.locator('text=Pending').nth(0)).toBeVisible();
  });

  test('should record by-product output and create LP', async ({ page }) => {
    // Navigate to Work Orders
    await page.goto('/production/work-orders');
    
    // Open existing WO (from previous test)
    await page.click('text=TEST-RIBEYE-001');
    await page.click('text=By-Products');

    // Start WO (change status to in_progress)
    await page.click('button:has-text("Start Production")');
    await expect(page.locator('text=Status: In Progress')).toBeVisible();

    // Record output for first by-product (Bones)
    await page.click('button:has-text("Record Output")').first();
    
    // Modal should open
    await expect(page.locator('h2:has-text("Record By-Product Output")')).toBeVisible();
    
    // Verify expected quantity is displayed
    await expect(page.locator('text=Expected Quantity')).toBeVisible();
    await expect(page.locator('text=15.00 kg')).toBeVisible();
    
    // Enter actual quantity (slightly less than expected)
    await page.fill('input[type="number"]', '14.5');
    
    // Verify variance calculation
    await expect(page.locator('text=-3.3%')).toBeVisible(); // (14.5-15)/15 = -3.3%
    
    // Select storage location
    await page.selectOption('select[name="location_id"]', { index: 1 }); // Select first location
    
    // Add notes
    await page.fill('textarea[name="notes"]', 'Quality bones, sent to stock room');
    
    // Submit
    await page.click('button:has-text("Record Output & Create LP")');
    
    // Verify success
    await expect(page.locator('text=By-product recorded successfully')).toBeVisible();
    
    // Verify LP was created
    await expect(page.locator('text=LP-')).toBeVisible();
    
    // Verify status changed to "Recorded"
    await expect(page.locator('text=Recorded').first()).toBeVisible();
    
    // Verify actual quantity is displayed
    await expect(page.locator('text=14.50 kg')).toBeVisible();
  });

  test('should verify LP creation and traceability', async ({ page }) => {
    // Navigate to License Plates
    await page.goto('/warehouse/license-plates');
    
    // Search for by-product LP
    await page.fill('input[placeholder="Search..."]', 'BONES');
    
    // Verify LP exists
    await expect(page.locator('text=LP-').first()).toBeVisible();
    
    // Open LP details
    await page.click('text=LP-').first();
    
    // Verify LP details
    await expect(page.locator('h1')).toContainText('License Plate Details');
    await expect(page.locator('text=BONES')).toBeVisible();
    await expect(page.locator('text=14.50 kg')).toBeVisible();
    await expect(page.locator('text=Status: Available')).toBeVisible();
    await expect(page.locator('text=QA Status: Pending')).toBeVisible();
    
    // Verify traceability
    await page.click('text=Traceability');
    await expect(page.locator('text=Source: Work Order')).toBeVisible();
    await expect(page.locator('text=WO-')).toBeVisible();
    await expect(page.locator('text=By-Product: BONES')).toBeVisible();
  });

  test('should handle by-product over-yield scenario', async ({ page }) => {
    // Navigate to Work Orders
    await page.goto('/production/work-orders');
    await page.click('text=TEST-RIBEYE-001');
    await page.click('text=By-Products');

    // Record output for second by-product (Trim) with over-yield
    await page.click('button:has-text("Record Output")').nth(1);
    
    // Enter actual quantity (more than expected)
    await page.fill('input[type="number"]', '12.5'); // Expected: 10.0, Actual: 12.5
    
    // Verify over-yield indicator
    await expect(page.locator('text=+25.0%')).toBeVisible(); // (12.5-10)/10 = +25%
    await expect(page.locator('[class*="amber"]')).toBeVisible(); // Amber warning color
    
    // Select location and submit
    await page.selectOption('select[name="location_id"]', { index: 1 });
    await page.click('button:has-text("Record Output & Create LP")');
    
    // Verify success
    await expect(page.locator('text=By-product recorded successfully')).toBeVisible();
    
    // Verify variance badge is displayed
    await expect(page.locator('text=+25.0%')).toBeVisible();
  });

  test('should display all by-products recorded summary', async ({ page }) => {
    // Navigate to Work Orders
    await page.goto('/production/work-orders');
    await page.click('text=TEST-RIBEYE-001');
    await page.click('text=By-Products');

    // Verify summary
    await expect(page.locator('text=2 of 2 by-products recorded')).toBeVisible();
    await expect(page.locator('text=All by-products recorded')).toBeVisible();
    await expect(page.locator('[data-testid="checkmark-icon"]')).toBeVisible();
  });

  test('should prevent recording by-product before WO starts', async ({ page }) => {
    // Create new WO in "planned" status
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    
    await page.selectOption('select[name="product_id"]', { label: /TEST-RIBEYE-001/ });
    await page.fill('input[name="quantity"]', '50');
    await page.fill('input[name="scheduled_start"]', '2025-01-20');
    await page.fill('input[name="scheduled_end"]', '2025-01-20');
    await page.click('button:has-text("Create Work Order")');
    
    // Open WO details
    await page.click('text=WO-');
    await page.click('text=By-Products');

    // Verify "Record Output" buttons are disabled
    const recordButtons = page.locator('button:has-text("Record Output")');
    await expect(recordButtons.first()).toBeDisabled();
    
    // Verify message
    await expect(page.locator('text=WO not started')).toBeVisible();
  });

  test('should validate yield percentage in BOM', async ({ page }) => {
    // Navigate to Products
    await page.goto('/production/products');
    await page.click('button:has-text("Create Product")');
    
    // Fill product details
    await page.fill('input[name="product_code"]', 'TEST-VALIDATION-001');
    await page.fill('input[name="description"]', 'Test Validation Product');
    await page.selectOption('select[name="product_type"]', 'FG');
    await page.click('button:has-text("Save Product")');
    
    // Create BOM with invalid yield percentage
    await page.click('text=Create BOM');
    await page.click('button:has-text("Add By-Product")');
    
    // Try to enter yield percentage > 100
    await page.fill('input[name="by_products[0].yield_percentage"]', '150');
    await page.selectOption('select[name="by_products[0].material_id"]', { index: 1 });
    
    // Verify validation error
    await expect(page.locator('text=Yield percentage must be between 0.01 and 100.00')).toBeVisible();
    
    // Try to save (should fail)
    await page.click('button:has-text("Save BOM")');
    await expect(page.locator('text=Please fix validation errors')).toBeVisible();
  });
});

