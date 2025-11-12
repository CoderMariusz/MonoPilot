/**
 * E2E Tests: Conditional Materials Flow
 * Epic: EPIC-001 BOM Complexity v2 - Phase 3
 * Created: 2025-01-12
 * 
 * Test Scenarios:
 * 1. Create BOM with conditional items
 * 2. Preview materials based on order flags
 * 3. Create WO with organic flag → verify materials
 * 4. Create WO with gluten-free flag → verify different materials
 * 5. Create WO with no flags → verify standard materials only
 */

import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('Conditional Materials Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should create BOM with conditional materials', async ({ page }) => {
    // Navigate to Products
    await page.goto('/production/products');
    
    // Create product for testing
    await page.click('button:has-text("Create Product")');
    await page.fill('input[name="product_code"]', 'TEST-COND-001');
    await page.fill('input[name="description"]', 'Test Conditional Materials');
    await page.selectOption('select[name="product_type"]', 'FG');
    await page.fill('input[name="uom"]', 'kg');
    await page.click('button:has-text("Save Product")');
    
    // Create BOM
    await page.click('text=Create BOM');
    await page.fill('input[name="version"]', '1.0');
    
    // Add unconditional material (base ingredient)
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[0].material_id"]', { index: 1 });
    await page.fill('input[name="materials[0].quantity"]', '100');
    await page.selectOption('select[name="materials[0].uom"]', 'kg');
    
    // Add conditional material (organic salt - for organic orders only)
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[1].material_id"]', { index: 2 });
    await page.fill('input[name="materials[1].quantity"]', '5');
    await page.selectOption('select[name="materials[1].uom"]', 'kg');
    
    // Open conditional editor for second material
    await page.click('[data-testid="edit-condition-1"]');
    
    // Set condition: order_flags contains "organic"
    await page.uncheck('input[type="checkbox"]:has-text("Always Required")');
    await page.selectOption('select[name="logic_type"]', 'OR');
    await page.selectOption('select[name="rules[0].field"]', 'order_flags');
    await page.selectOption('select[name="rules[0].operator"]', 'contains');
    await page.fill('input[name="rules[0].value"]', 'organic');
    await page.click('button:has-text("Save Condition")');
    
    // Add standard salt (non-organic)
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[2].material_id"]', { index: 3 });
    await page.fill('input[name="materials[2].quantity"]', '5');
    
    // Set condition: order_flags NOT contains "organic"
    await page.click('[data-testid="edit-condition-2"]');
    await page.uncheck('input[type="checkbox"]:has-text("Always Required")');
    await page.selectOption('select[name="rules[0].operator"]', 'not_contains');
    await page.fill('input[name="rules[0].value"]', 'organic');
    await page.click('button:has-text("Save Condition")');
    
    // Save BOM
    await page.click('button:has-text("Save BOM")');
    await expect(page.locator('text=BOM created successfully')).toBeVisible();
  });

  test('should preview materials for organic order', async ({ page }) => {
    // Open product with conditional BOM
    await page.goto('/production/products');
    await page.click('text=TEST-COND-001');
    await page.click('text=Bill of Materials');
    
    // Open conditional materials panel
    await page.click('button:has-text("Preview Materials")');
    
    // Initially no flags - should show base + standard salt
    await expect(page.locator('text=Included Materials').locator('..').locator('text=(2)')).toBeVisible();
    
    // Add "organic" flag
    await page.click('button:has-text("Edit")'); // Edit flags
    await page.fill('input[placeholder*="organic"]', 'organic');
    await page.click('button:has-text("Add")');
    
    // Should now show base + organic salt (standard salt excluded)
    await expect(page.locator('text=Included Materials').locator('..').locator('text=(2)')).toBeVisible();
    await expect(page.locator('text=Excluded Materials').locator('..').locator('text=(1)')).toBeVisible();
    
    // Verify organic salt is included
    await expect(page.locator('text=Organic Salt')).toBeVisible();
    await expect(page.locator('text=Standard Salt')).not.toBeVisible();
  });

  test('should create WO with organic flag and verify materials', async ({ page }) => {
    // Create Work Order
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    
    // Select conditional product
    await page.selectOption('select[name="product_id"]', { label: /TEST-COND-001/ });
    await page.fill('input[name="quantity"]', '1000');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="scheduled_start"]', today);
    await page.fill('input[name="scheduled_end"]', today);
    
    // Add organic flag
    await page.fill('input[name="order_flags"]', 'organic');
    await page.click('button:has-text("Add Flag")');
    
    // Verify badge appears
    await expect(page.locator('span:has-text("organic")')).toBeVisible();
    
    // Preview should show filtered materials
    await expect(page.locator('text=2 materials will be used')).toBeVisible();
    
    // Create WO
    await page.click('button:has-text("Create Work Order")');
    await expect(page.locator('text=Work Order created successfully')).toBeVisible();
    
    // Open WO details
    await page.click('text=WO-');
    
    // Verify materials tab shows only organic salt (not standard)
    await page.click('text=Materials');
    await expect(page.locator('text=Base Ingredient')).toBeVisible();
    await expect(page.locator('text=Organic Salt')).toBeVisible();
    await expect(page.locator('text=Standard Salt')).not.toBeVisible();
    
    // Verify order flags are displayed
    await expect(page.locator('span.badge:has-text("organic")')).toBeVisible();
  });

  test('should create WO with gluten-free flag', async ({ page }) => {
    // Create another conditional BOM (gluten-free flour)
    await page.goto('/production/products');
    await page.click('text=TEST-COND-001');
    await page.click('text=Edit BOM');
    
    // Add gluten-free flour (conditional)
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[3].material_id"]', { label: /Gluten-Free Flour/ });
    await page.fill('input[name="materials[3].quantity"]', '50');
    
    // Set condition: gluten_free flag
    await page.click('[data-testid="edit-condition-3"]');
    await page.uncheck('input[type="checkbox"]:has-text("Always Required")');
    await page.fill('input[name="rules[0].value"]', 'gluten_free');
    await page.click('button:has-text("Save Condition")');
    
    await page.click('button:has-text("Save Changes")');
    
    // Create WO with gluten_free flag
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    await page.selectOption('select[name="product_id"]', { label: /TEST-COND-001/ });
    await page.fill('input[name="quantity"]', '500');
    
    await page.fill('input[name="order_flags"]', 'gluten_free');
    await page.click('button:has-text("Add Flag")');
    
    await page.click('button:has-text("Create Work Order")');
    
    // Verify gluten-free flour is included
    await page.click('text=WO-');
    await page.click('text=Materials');
    await expect(page.locator('text=Gluten-Free Flour')).toBeVisible();
    await expect(page.locator('text=50 kg')).toBeVisible();
  });

  test('should create WO with no flags (standard materials only)', async ({ page }) => {
    // Create WO without any flags
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    
    await page.selectOption('select[name="product_id"]', { label: /TEST-COND-001/ });
    await page.fill('input[name="quantity"]', '1000');
    
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="scheduled_start"]', today);
    
    // Don't add any flags
    
    // Create WO
    await page.click('button:has-text("Create Work Order")');
    await expect(page.locator('text=Work Order created successfully')).toBeVisible();
    
    // Verify only unconditional + non-organic materials
    await page.click('text=WO-');
    await page.click('text=Materials');
    
    await expect(page.locator('text=Base Ingredient')).toBeVisible();
    await expect(page.locator('text=Standard Salt')).toBeVisible(); // Non-organic
    await expect(page.locator('text=Organic Salt')).not.toBeVisible(); // Excluded
  });

  test('should handle multiple flags with AND logic', async ({ page }) => {
    // Create BOM with AND condition (organic AND gluten-free)
    await page.goto('/production/products');
    await page.click('button:has-text("Create Product")');
    await page.fill('input[name="product_code"]', 'TEST-MULTI-FLAG');
    await page.fill('input[name="description"]', 'Multi-Flag Product');
    await page.selectOption('select[name="product_type"]', 'FG');
    await page.click('button:has-text("Save Product")');
    
    await page.click('text=Create BOM');
    await page.fill('input[name="version"]', '1.0');
    
    // Add base material
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[0].material_id"]', { index: 1 });
    await page.fill('input[name="materials[0].quantity"]', '100');
    
    // Add premium ingredient (requires organic AND gluten-free)
    await page.click('button:has-text("Add Material")');
    await page.selectOption('select[name="materials[1].material_id"]', { index: 2 });
    await page.fill('input[name="materials[1].quantity"]', '10');
    
    // Set AND condition
    await page.click('[data-testid="edit-condition-1"]');
    await page.uncheck('input[type="checkbox"]:has-text("Always Required")');
    await page.selectOption('select[name="logic_type"]', 'AND');
    
    // First rule: organic
    await page.fill('input[name="rules[0].value"]', 'organic');
    
    // Add second rule: gluten_free
    await page.click('button:has-text("Add Rule")');
    await page.selectOption('select[name="rules[1].field"]', 'order_flags');
    await page.selectOption('select[name="rules[1].operator"]', 'contains');
    await page.fill('input[name="rules[1].value"]', 'gluten_free');
    
    await page.click('button:has-text("Save Condition")');
    await page.click('button:has-text("Save BOM")');
    
    // Create WO with only "organic" (should NOT include premium ingredient)
    await page.goto('/production/work-orders');
    await page.click('button:has-text("Create Work Order")');
    await page.selectOption('select[name="product_id"]', { label: /TEST-MULTI-FLAG/ });
    await page.fill('input[name="quantity"]', '100');
    
    await page.fill('input[name="order_flags"]', 'organic');
    await page.click('button:has-text("Add Flag")');
    
    // Preview should show premium ingredient excluded (AND not met)
    await expect(page.locator('text=Excluded Materials').locator('..').locator('text=(1)')).toBeVisible();
    
    // Add gluten_free flag
    await page.fill('input[name="order_flags"]', 'gluten_free');
    await page.click('button:has-text("Add Flag")');
    
    // Now premium ingredient should be included (AND condition met)
    await expect(page.locator('text=2 materials will be used')).toBeVisible();
    
    await page.click('button:has-text("Create Work Order")');
    
    // Verify premium ingredient is included
    await page.click('text=WO-');
    await page.click('text=Materials');
    await expect(page.locator('text=Premium Ingredient')).toBeVisible();
  });

  test('should show condition details in BOM editor', async ({ page }) => {
    // Open BOM with conditional items
    await page.goto('/production/products');
    await page.click('text=TEST-COND-001');
    await page.click('text=Bill of Materials');
    await page.click('text=Edit');
    
    // Verify conditional badges are shown
    await expect(page.locator('span:has-text("Conditional")')).toHaveCount(2); // Organic + Standard salt
    
    // Click to view condition
    await page.click('[data-testid="view-condition-1"]');
    
    // Verify condition details modal
    await expect(page.locator('text=Condition Preview')).toBeVisible();
    await expect(page.locator('code:has-text("order_flags")')).toBeVisible();
    await expect(page.locator('code:has-text("contains")')).toBeVisible();
    await expect(page.locator('code:has-text("organic")')).toBeVisible();
  });
});

