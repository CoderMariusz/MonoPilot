import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('BOM - BOM Components', () => {
  let helpers: TestHelpers;
  let testProductNumber: string;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    // Generate unique product number for each test
    testProductNumber = `FG-COMPONENTS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  test.afterEach(async () => {
    // Cleanup: delete test product
    await helpers.cleanupTestProduct(testProductNumber);
  });

  test('should add BOM component', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'EA', // Each - correct UoM for finished goods
      std_price: '50.00', // Fixed: use std_price instead of price
      rate: '100', // Required for FINISHED_GOODS
      shelfLifeDays: '30', // Add shelf life
      leadTimeDays: '7', // Add lead time
      moq: '10.0', // Add MOQ
      notes: 'Test product for BOM components' // Add notes
    });

    // Select production lines (required for FINISHED_GOODS)
    await helpers.selectProductionLines(['ALL']);

    // Modal automatically goes to step 2 after category selection

    // Add BOM component (required for FINISHED_GOODS)
    await helpers.addBomComponent();
    
    // Fill BOM component details
    await helpers.fillBomComponent(0, {
      materialId: 1, // Select first available material (RM-BEEF-001)
      quantity: '10',
      unitCost: '5.50' // Add unit cost
    });

    // Save product
    await helpers.saveProduct();

    // Debug form errors if validation fails
    await helpers.debugFormErrors();

    // Verify success
    await helpers.verifyToast('Product created successfully');
  });

  test('should remove BOM component', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Remove BOM component
    await page.click('button[aria-label="Remove Component"]');

    // Verify component is removed
    await expect(page.locator('select[name="bom_components[0].material_id"]')).toBeHidden();
  });

  test('should edit component quantity', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Edit quantity
    await page.fill('input[name="bom_components[0].quantity"]', '15');

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
  });

  test('should toggle component flags (optional, phantom, one-to-one)', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Test is_optional checkbox
    const isOptionalCheckbox = page.locator('input[name="bom_components[0].is_optional"]');
    await isOptionalCheckbox.check();
    await expect(isOptionalCheckbox).toBeChecked();
    await isOptionalCheckbox.uncheck();
    await expect(isOptionalCheckbox).not.toBeChecked();

    // Test is_phantom checkbox
    const isPhantomCheckbox = page.locator('input[name="bom_components[0].is_phantom"]');
    await isPhantomCheckbox.check();
    await expect(isPhantomCheckbox).toBeChecked();
    await isPhantomCheckbox.uncheck();
    await expect(isPhantomCheckbox).not.toBeChecked();

    // Test one_to_one checkbox
    const oneToOneCheckbox = page.locator('input[name="bom_components[0].one_to_one"]');
    await oneToOneCheckbox.check();
    await expect(oneToOneCheckbox).toBeChecked();
    await oneToOneCheckbox.uncheck();
    await expect(oneToOneCheckbox).not.toBeChecked();
  });

  test('should add multiple BOM components', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with Multiple BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add first BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Add second BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[1].material_id"]', { index: 2 });
    await page.fill('input[name="bom_components[1].quantity"]', '5');
    await page.fill('input[name="bom_components[1].uom"]', 'kg');

    // Add third BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[2].material_id"]', { index: 3 });
    await page.fill('input[name="bom_components[2].quantity"]', '2');
    await page.fill('input[name="bom_components[2].uom"]', 'kg');

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
  });

  test('should remove specific BOM component from multiple components', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with Multiple BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add first BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Add second BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[1].material_id"]', { index: 2 });
    await page.fill('input[name="bom_components[1].quantity"]', '5');
    await page.fill('input[name="bom_components[1].uom"]', 'kg');

    // Add third BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[2].material_id"]', { index: 3 });
    await page.fill('input[name="bom_components[2].quantity"]', '2');
    await page.fill('input[name="bom_components[2].uom"]', 'kg');

    // Remove second BOM component
    await page.click('button[aria-label="Remove Component"]:nth-child(2)');

    // Verify second component is removed
    await expect(page.locator('select[name="bom_components[1].material_id"]')).toBeHidden();
    
    // Verify first and third components are still there
    await expect(page.locator('select[name="bom_components[0].material_id"]')).toBeVisible();
    await expect(page.locator('select[name="bom_components[2].material_id"]')).toBeVisible();
  });

  test('should validate BOM component required fields', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component without filling required fields
    await page.click('button:has-text("Add Component")');
    await page.click('button:has-text("Save")');

    // Verify validation errors
    await helpers.verifyToast('Material is required');
    await helpers.verifyToast('Quantity is required');
    await helpers.verifyToast('UOM is required');
  });

  test('should validate BOM component quantity is positive', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component with invalid quantity
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '-5');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('Quantity must be a positive number');
  });

  test('should validate BOM component UOM format', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component with invalid UOM
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'invalid uom!');
    await page.click('button:has-text("Save")');

    // Verify validation error
    await helpers.verifyToast('UOM must contain only alphanumeric characters');
  });

  test('should calculate BOM total quantities', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add first BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Add second BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[1].material_id"]', { index: 2 });
    await page.fill('input[name="bom_components[1].quantity"]', '5');
    await page.fill('input[name="bom_components[1].uom"]', 'kg');

    // Verify BOM total is calculated
    await expect(page.locator('[data-testid="bom-total"]')).toContainText('15');
  });

  test('should handle BOM component with all flags enabled', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component with all flags enabled
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await page.check('input[name="bom_components[0].is_optional"]');
    await page.check('input[name="bom_components[0].is_phantom"]');
    await page.check('input[name="bom_components[0].one_to_one"]');

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
  });

  test('should handle BOM component with no flags enabled', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component with no flags enabled
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Verify all flags are unchecked by default
    await expect(page.locator('input[name="bom_components[0].is_optional"]')).not.toBeChecked();
    await expect(page.locator('input[name="bom_components[0].is_phantom"]')).not.toBeChecked();
    await expect(page.locator('input[name="bom_components[0].one_to_one"]')).not.toBeChecked();

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
  });

  test('should handle BOM component with mixed flags', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component with mixed flags
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');
    await page.check('input[name="bom_components[0].is_optional"]');
    // Leave is_phantom unchecked
    await page.check('input[name="bom_components[0].one_to_one"]');

    // Verify mixed flags state
    await expect(page.locator('input[name="bom_components[0].is_optional"]')).toBeChecked();
    await expect(page.locator('input[name="bom_components[0].is_phantom"]')).not.toBeChecked();
    await expect(page.locator('input[name="bom_components[0].one_to_one"]')).toBeChecked();

    // Save product
    await helpers.saveProduct();

    // Verify success
    await helpers.verifyToast('Product created successfully');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/products/**', route => route.abort());

    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Save product
    await page.click('button:has-text("Save")');

    // Verify error handling
    await helpers.verifyToast('Network error');
  });

  test('should display loading state during save', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Click save and check for loading state
    await page.click('button:has-text("Save")');

    // Verify loading state appears
    await expect(page.locator('button:has-text("Save")')).toContainText('Saving...');
  });

  test('should close modal on cancel', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });

  test('should close modal on escape key', async ({ page }) => {
    await helpers.navigateToBOM();
    await helpers.openAddItemModal();
    await helpers.selectCategory('FINISHED_GOODS');

    // Fill basic product info
    await helpers.fillProductForm({
      partNumber: testProductNumber,
      description: 'FG Product with BOM Components',
      uom: 'box',
      std_price: '50.00',
    });

    // Modal automatically goes to step 2 after category selection

    // Add BOM component
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="bom_components[0].material_id"]', { index: 1 });
    await page.fill('input[name="bom_components[0].quantity"]', '10');
    await page.fill('input[name="bom_components[0].uom"]', 'kg');

    // Press escape key
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('.modal')).toBeHidden();
  });
});
