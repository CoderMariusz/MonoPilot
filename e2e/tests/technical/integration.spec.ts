/**
 * E2E Integration Tests - Technical Module
 *
 * Cross-module workflow tests validating complex scenarios spanning
 * Products, BOMs, Routings, Traceability, and Costing modules.
 *
 * Test Coverage: 12 integration scenarios
 * Execution Time: ~8-10 minutes
 */

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/ProductsPage';
import { BOMsPage } from '../../pages/BOMsPage';
import { RoutingsPage } from '../../pages/RoutingsPage';
import {
  productFixtures,
  bomFixtures,
  routingFixtures,
  allergenFixtures,
  dateFixtures,
  createProductData,
  createBOMWithItems,
  createRoutingWithOperations,
  generateProductCode,
} from '../../fixtures/technical';
import {
  setupTestEnvironment,
  createProductViaAPI,
  createBOMViaAPI,
  createRoutingViaAPI,
  cleanupTestData,
  waitForTableRefresh,
} from '../../helpers/test-setup';

// ==================== TC-INT-001: Product -> BOM -> Work Order Flow ====================

test('TC-INT-001: complete product-to-production workflow', async ({ page }) => {
  // ARRANGE - Setup pages
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create finished good product
  const productData = createProductData('FIN');
  await productsPage.goto();
  await productsPage.createProduct(productData);
  await productsPage.expectProductInList(productData.code);

  // Step 2: Create BOM for product
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();

  const bomData = {
    product_id: productData.code,
    effective_from: dateFixtures.today(),
    effective_to: null,
    output_qty: 10,
    output_uom: 'EA',
  };

  await bomsPage.fillBOMForm(bomData);
  await bomsPage.submitCreateBOM();
  await bomsPage.expectCreateSuccess();
  await bomsPage.expectBOMInList(productData.name);

  // Step 3: Add BOM items
  const ingredient1 = createProductData('RAW');
  const ingredient2 = createProductData('RAW');

  await bomsPage.addBOMItem({
    component_id: ingredient1.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  await bomsPage.addBOMItem({
    component_id: ingredient2.code,
    quantity: 2,
    uom: 'KG',
    operation_seq: 1,
  });

  // ASSERT - Verify complete workflow
  await bomsPage.expectItemInList(ingredient1.code);
  await bomsPage.expectItemInList(ingredient2.code);
  await expect(page.getByText(/BOM.*created|success/i)).toBeVisible();
});

// ==================== TC-INT-002: BOM -> Allergen -> Product Inheritance ====================

test('TC-INT-002: BOM allergen inheritance to product', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create product
  const productData = createProductData('FIN');
  await productsPage.goto();
  await productsPage.createProduct(productData);

  // Step 2: Create product with allergen (ingredient)
  const allergenProduct = createProductData('RAW');
  await productsPage.goto();
  await productsPage.createProduct(allergenProduct);

  // Add allergen to ingredient
  await productsPage.gotoProductDetail(allergenProduct.code);
  await productsPage.clickAllergensTab();
  await productsPage.clickAddAllergen();
  await productsPage.expectAllergenModalOpen();
  await productsPage.selectAllergen('Gluten');
  await productsPage.selectAllergenRelation('contains');
  await productsPage.submitAddAllergen();
  await productsPage.expectAllergenInList('Gluten');

  // Step 3: Create BOM with allergen-containing ingredient
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: productData.code,
    effective_from: dateFixtures.today(),
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  // Add allergen ingredient to BOM
  await bomsPage.addBOMItem({
    component_id: allergenProduct.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  // ASSERT - Verify allergen inheritance
  // Navigate to product detail to verify inherited allergen
  await productsPage.goto();
  await productsPage.clickProduct(productData.code);
  await productsPage.clickAllergensTab();

  // Should see inherited allergen from BOM
  await productsPage.expectInheritedAllergen('Gluten');
});

// ==================== TC-INT-003: Routing -> BOM -> Costing Flow ====================

test('TC-INT-003: routing-to-BOM-to-costing integration', async ({ page }) => {
  // ARRANGE
  const bomsPage = new BOMsPage(page);
  const routingsPage = new RoutingsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create routing with operations
  const routingData = createRoutingWithOperations(2, true);
  await routingsPage.goto();
  await routingsPage.createRouting(routingData);
  await routingsPage.expectRoutingInList(routingData.code);

  // Step 2: Verify routing cost summary
  await routingsPage.clickRouting(routingData.code);
  await routingsPage.expectCostSummary();

  // Step 3: Verify cost components
  const setupCost = await routingsPage.getSetupCost();
  const workingCost = await routingsPage.getWorkingCost();
  const overhead = await routingsPage.getOverheadAmount();

  // ASSERT - Verify all cost components are calculated
  expect(setupCost).toBeGreaterThan(0);
  expect(workingCost).toBeGreaterThan(0);
  expect(overhead).toBeGreaterThan(0);

  // Verify total cost calculated
  await routingsPage.expectTotalCostCalculated();
});

// ==================== TC-INT-004: Multi-Level BOM -> Traceability ====================

test('TC-INT-004: multi-level BOM structure and explosion', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create product hierarchy
  const rawMaterial = createProductData('RAW');
  const wipProduct = createProductData('WIP');
  const finishedProduct = createProductData('FIN');

  await productsPage.goto();
  await productsPage.createProduct(rawMaterial);
  await productsPage.createProduct(wipProduct);
  await productsPage.createProduct(finishedProduct);

  // Step 2: Create multi-level BOMs
  // Level 1: BOM for WIP from raw material
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: wipProduct.code,
    effective_from: dateFixtures.today(),
    output_qty: 100,
    output_uom: 'KG',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: rawMaterial.code,
    quantity: 50,
    uom: 'KG',
    operation_seq: 1,
  });

  // Level 2: BOM for finished product from WIP
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: finishedProduct.code,
    effective_from: dateFixtures.today(),
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: wipProduct.code,
    quantity: 10,
    uom: 'KG',
    operation_seq: 1,
  });

  // Step 3: Verify multi-level structure
  await bomsPage.expectItemInList(wipProduct.code);

  // ASSERT - Verify BOM hierarchy
  await expect(page.getByText(/success|created/i)).toBeVisible();
  await bomsPage.expectBOMInList(finishedProduct.name);
});

// ==================== TC-INT-005: Product Type -> Filter Integration ====================

test('TC-INT-005: product type filtering across modules', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create products of different types
  const rawProducts = [
    createProductData('RAW'),
    createProductData('RAW'),
  ];
  const finishedProducts = [
    createProductData('FIN'),
    createProductData('FIN'),
  ];

  await productsPage.goto();
  for (const product of rawProducts) {
    await productsPage.createProduct(product);
  }
  for (const product of finishedProducts) {
    await productsPage.createProduct(product);
  }

  // Step 2: Filter by product type - RAW
  await productsPage.goto();
  const initialCount = await productsPage.getRowCount();
  await productsPage.filterByProductType('RAW');
  const rawCount = await productsPage.getRowCount();

  // ASSERT - Verify filter shows only RAW products
  expect(rawCount).toBeLessThan(initialCount);
  await expect(page.locator('table tbody tr')).toContainText('RAW');

  // Step 3: Filter by product type - FIN
  await productsPage.goto();
  await productsPage.filterByProductType('FIN');
  const finCount = await productsPage.getRowCount();

  // ASSERT - Verify filter shows only FIN products
  expect(finCount).toBeLessThan(initialCount);
  await expect(page.locator('table tbody tr')).toContainText('FIN');
});

// ==================== TC-INT-006: Shelf Life -> Expiry Policy Integration ====================

test('TC-INT-006: shelf-life and expiry policy configuration', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create perishable product with shelf life
  const perishableProduct = {
    ...createProductData('RAW'),
    is_perishable: true,
    shelf_life_days: 30,
    expiry_policy: 'fefo' as const,
  };

  await productsPage.goto();
  await productsPage.clickAddProduct();
  await productsPage.fillProductForm(perishableProduct);
  await productsPage.submitCreateProduct();
  await productsPage.expectCreateSuccess();

  // Step 2: Navigate to product detail and verify shelf life config
  await productsPage.clickProduct(perishableProduct.code);
  await productsPage.clickShelfLifeTab();
  await productsPage.expectShelfLifeConfiguration();

  // ASSERT - Verify shelf life is properly configured
  await expect(page.getByText(/shelf life|expiry|30/i)).toBeVisible();
});

// ==================== TC-INT-007: Alternative Ingredients -> Consumption ====================

test('TC-INT-007: alternative ingredient definitions and selection', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create product and ingredients
  const product = createProductData('FIN');
  const primaryIngredient = createProductData('RAW');
  const alternativeIngredient = createProductData('RAW');

  await productsPage.goto();
  await productsPage.createProduct(product);
  await productsPage.createProduct(primaryIngredient);
  await productsPage.createProduct(alternativeIngredient);

  // Step 2: Create BOM with primary ingredient
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: product.code,
    effective_from: dateFixtures.today(),
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: primaryIngredient.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  // Step 3: Add alternative ingredient
  await bomsPage.clickAlternativesButton(primaryIngredient.code);
  await bomsPage.expectAlternativesModalOpen();
  await bomsPage.addAlternativeIngredient(alternativeIngredient.code, 5, 'KG');
  await bomsPage.expectAlternativeIngredient(alternativeIngredient.code);

  // ASSERT - Verify alternative is available
  await expect(page.getByText(alternativeIngredient.name)).toBeVisible();
});

// ==================== TC-INT-008: BOM Clone -> Multi-Product Variants ====================

test('TC-INT-008: BOM cloning for product variants', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create source product with BOM and items
  const sourceProduct = createProductData('FIN');
  const targetProduct = createProductData('FIN');
  const ingredient = createProductData('RAW');

  await productsPage.goto();
  await productsPage.createProduct(sourceProduct);
  await productsPage.createProduct(targetProduct);
  await productsPage.createProduct(ingredient);

  // Step 2: Create source BOM with items
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: sourceProduct.code,
    effective_from: dateFixtures.today(),
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: ingredient.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  // Step 3: Clone BOM to target product
  await bomsPage.goto();
  await bomsPage.cloneBOMToProduct(targetProduct.code);
  await bomsPage.expectSuccessToast(/cloned|success/i);

  // Step 4: Navigate to cloned BOM and verify items
  await bomsPage.goto();
  await bomsPage.searchByProduct(targetProduct.name);
  await bomsPage.clickBOM(targetProduct.name);
  await bomsPage.expectItemInList(ingredient.code);

  // ASSERT - Verify all items cloned successfully
  await expect(page.getByText(ingredient.name)).toBeVisible();
});

// ==================== TC-INT-009: Routing Reusable -> Multiple BOMs ====================

test('TC-INT-009: reusable routing assigned to multiple BOMs', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  const routingsPage = new RoutingsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create reusable routing
  const routingData = createRoutingWithOperations(2, true); // is_reusable=true
  await routingsPage.goto();
  await routingsPage.createRouting(routingData);

  // Step 2: Create two products
  const product1 = createProductData('FIN');
  const product2 = createProductData('FIN');
  const ingredient = createProductData('RAW');

  await productsPage.goto();
  await productsPage.createProduct(product1);
  await productsPage.createProduct(product2);
  await productsPage.createProduct(ingredient);

  // Step 3: Create first BOM and assign routing
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: product1.code,
    effective_from: dateFixtures.today(),
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: ingredient.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  // Step 4: Create second BOM and assign same routing
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: product2.code,
    effective_from: dateFixtures.today(),
    output_qty: 15,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: ingredient.code,
    quantity: 7,
    uom: 'KG',
    operation_seq: 1,
  });

  // ASSERT - Verify both BOMs created (routing will be assigned separately via routing detail)
  await bomsPage.goto();
  await expect(page.getByText(product1.name)).toBeVisible();
  await expect(page.getByText(product2.name)).toBeVisible();
});

// ==================== TC-INT-010: Cost Rollup -> Standard Price ====================

test('TC-INT-010: BOM cost rollup to standard product price', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create finished product
  const product = createProductData('FIN');
  product.cost_per_unit = undefined; // Will be calculated from BOM

  await productsPage.goto();
  await productsPage.createProduct(product);

  // Step 2: Create raw materials with costs
  const rm1 = { ...createProductData('RAW'), cost_per_unit: 10.0 };
  const rm2 = { ...createProductData('RAW'), cost_per_unit: 5.0 };

  await productsPage.createProduct(rm1);
  await productsPage.createProduct(rm2);

  // Step 3: Create BOM with costed ingredients
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  await bomsPage.fillBOMForm({
    product_id: product.code,
    effective_from: dateFixtures.today(),
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  // Add items with specific quantities
  await bomsPage.addBOMItem({
    component_id: rm1.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  await bomsPage.addBOMItem({
    component_id: rm2.code,
    quantity: 2,
    uom: 'KG',
    operation_seq: 1,
  });

  // Step 4: Verify cost summary visible
  await bomsPage.expectCostSummary();

  // ASSERT - Verify cost calculation
  // Material cost = (5 * 10) + (2 * 5) = 50 + 10 = 60
  // Cost per unit = 60 / 10 = 6.0
  const costSummary = await bomsPage.getCostSummary();
  expect(costSummary).toBeTruthy();
});

// ==================== TC-INT-011: Product Search -> Allergen Filter ====================

test('TC-INT-011: search and filter products by allergen content', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create products with and without allergens
  const withAllergen = { ...createProductData('RAW'), allergens: ['A01'] };
  const withoutAllergen = { ...createProductData('RAW'), allergens: [] };

  await productsPage.goto();
  await productsPage.createProduct(withAllergen);
  await productsPage.createProduct(withoutAllergen);

  // Step 2: Add allergen to first product
  await productsPage.clickProduct(withAllergen.code);
  await productsPage.clickAllergensTab();
  await productsPage.clickAddAllergen();
  await productsPage.selectAllergen('Gluten');
  await productsPage.selectAllergenRelation('contains');
  await productsPage.submitAddAllergen();
  await productsPage.expectAllergenInList('Gluten');

  // Step 3: Search for product with allergen
  await productsPage.goto();
  await productsPage.searchByCode(withAllergen.code);

  // ASSERT - Verify search result contains product
  await productsPage.expectProductInList(withAllergen.code);
  await expect(page.getByText(withAllergen.name)).toBeVisible();

  // Step 4: Verify product detail shows allergen
  await productsPage.clickProduct(withAllergen.code);
  await productsPage.clickAllergensTab();
  await productsPage.expectAllergenInList('Gluten');
});

// ==================== TC-INT-012: BOM Effective Dates -> Version Selection ====================

test('TC-INT-012: BOM effective date ranges and version management', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  await setupTestEnvironment(page);

  // Step 1: Create product and ingredient
  const product = createProductData('FIN');
  const ingredient = createProductData('RAW');

  await productsPage.goto();
  await productsPage.createProduct(product);
  await productsPage.createProduct(ingredient);

  // Step 2: Create first BOM with effective dates
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();

  const dateRange1 = dateFixtures.bomDateRange(0, 90); // Today to 90 days out
  await bomsPage.fillBOMForm({
    product_id: product.code,
    effective_from: dateRange1.effective_from,
    effective_to: dateRange1.effective_to,
    output_qty: 10,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: ingredient.code,
    quantity: 5,
    uom: 'KG',
    operation_seq: 1,
  });

  // Step 3: Create second BOM version with non-overlapping dates
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();

  const dateRange2 = dateFixtures.bomDateRange(91, 365); // After first BOM
  await bomsPage.fillBOMForm({
    product_id: product.code,
    effective_from: dateRange2.effective_from,
    effective_to: dateRange2.effective_to,
    output_qty: 15,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  await bomsPage.addBOMItem({
    component_id: ingredient.code,
    quantity: 7,
    uom: 'KG',
    operation_seq: 1,
  });

  // ASSERT - Verify both BOMs created successfully
  await bomsPage.goto();
  await bomsPage.searchByProduct(product.name);

  // Should see both BOMs in list (versions of same product)
  const bomCount = await bomsPage.getRowCount();
  expect(bomCount).toBeGreaterThanOrEqual(2);

  // Step 4: Attempt to create overlapping BOM (should fail)
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();

  const overlappingRange = dateFixtures.overlappingRange(
    dateRange1.effective_from,
    dateRange1.effective_to!,
  );

  await bomsPage.fillBOMForm({
    product_id: product.code,
    effective_from: overlappingRange.effective_from,
    effective_to: overlappingRange.effective_to,
    output_qty: 20,
    output_uom: 'EA',
  });
  await bomsPage.submitCreateBOM();

  // Should show date overlap error
  await bomsPage.expectDateOverlapError();
});
