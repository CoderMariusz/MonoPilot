/**
 * E2E Test Templates for Technical Module
 *
 * Reusable test templates with Given/When/Then pattern.
 * Copy and fill in the [PLACEHOLDERS] for specific test cases.
 *
 * Usage:
 *   1. Copy the template
 *   2. Replace [PLACEHOLDERS] with actual values
 *   3. Fill in test logic
 *   4. Run test: pnpm test:e2e technical/module.spec.ts
 */

import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { BOMsPage } from '../pages/BOMsPage';
import { RoutingsPage } from '../pages/RoutingsPage';
import * as technicalFixtures from '../fixtures/technical';

// ==================== TEMPLATE 1: CRUD Operations ====================

/**
 * TEMPLATE: Generic CRUD Test
 *
 * Use this template for any Create/Read/Update/Delete operations
 */
export const crudTemplate = {
  /**
   * Create Operation Test Template
   */
  create: `
test('[TC-XXX-NNN] Create [entity] with [specific conditions]', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  const [ENTITY_DATA] = {
    // Fill in test data
    code: '[UNIQUE_CODE]',
    name: '[TEST_NAME]',
    // ... other fields
  };

  // ACT - Execute the action
  await productsPage.clickAddProduct();
  await productsPage.expectCreateModalOpen();
  await productsPage.fillProductForm([ENTITY_DATA]);
  await productsPage.submitCreateProduct();

  // ASSERT - Verify results
  await productsPage.expectCreateSuccess();
  await productsPage.expectProductInList([ENTITY_DATA].code);

  // Verify in detail view
  await productsPage.clickProduct([ENTITY_DATA].code);
  await productsPage.expectProductDetailHeader([ENTITY_DATA].name);
});
  `,

  /**
   * Read Operation Test Template
   */
  read: `
test('[TC-XXX-NNN] Display [entity] details correctly', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Navigate to entity
  await productsPage.clickProduct('[ENTITY_CODE]');

  // ASSERT - Verify all fields displayed
  await productsPage.expectProductDetailHeader('[ENTITY_NAME]');
  await expect(page.getByText('[EXPECTED_FIELD_VALUE]')).toBeVisible();
  await expect(page.getByText('[ANOTHER_FIELD_VALUE]')).toBeVisible();
});
  `,

  /**
   * Update Operation Test Template
   */
  update: `
test('[TC-XXX-NNN] Update [entity] [field] successfully', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  const originalValue = '[ORIGINAL_VALUE]';
  const updatedValue = '[UPDATED_VALUE]';

  // ACT - Execute update
  await productsPage.clickEditFirstProduct();
  await productsPage.expectEditDrawerOpen();
  await productsPage.updateProductName(updatedValue);
  await productsPage.submitEditProduct();

  // ASSERT - Verify update
  await productsPage.expectSuccessToast(/updated|changed/i);
  await productsPage.expectProductInList('[PRODUCT_CODE]');

  // Verify updated value
  await productsPage.clickProduct('[PRODUCT_CODE]');
  await expect(page.getByText(updatedValue)).toBeVisible();
  await expect(page.getByText(originalValue)).not.toBeVisible();
});
  `,

  /**
   * Delete Operation Test Template
   */
  delete: `
test('[TC-XXX-NNN] Delete [entity] successfully', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Delete entity
  await productsPage.clickEditFirstProduct();
  await productsPage.clickButton(/delete|remove/i);
  await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

  // ASSERT - Verify deletion
  await productsPage.expectSuccessToast(/deleted|removed/i);
  await productsPage.expectNoRowWithText('[ENTITY_CODE]');
});
  `,
};

// ==================== TEMPLATE 2: Search & Filter ====================

/**
 * TEMPLATE: Search Functionality Test
 */
export const searchTemplate = `
test('[TC-XXX-NNN] Search filters results by [field]', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();
  const initialRowCount = await productsPage.getRowCount();

  // ACT - Perform search
  await productsPage.searchByCode('[SEARCH_TERM]');

  // ASSERT - Verify filtered results
  const filteredRowCount = await productsPage.getRowCount();
  expect(filteredRowCount).toBeLessThan(initialRowCount);

  // Verify correct item appears
  await productsPage.expectProductInList('[EXPECTED_RESULT]');

  // Verify other items hidden
  await productsPage.expectNoRowWithText('[UNEXPECTED_RESULT]');

  // CLEANUP - Clear search
  await productsPage.clearSearch();
  const clearedRowCount = await productsPage.getRowCount();
  expect(clearedRowCount).toBe(initialRowCount);
});
`;

/**
 * TEMPLATE: Filter Functionality Test
 */
export const filterTemplate = `
test('[TC-XXX-NNN] Filter shows only [entity type]', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();
  const totalRows = await productsPage.getRowCount();

  // ACT - Apply filter
  await productsPage.filterByProductType('RAW');

  // ASSERT - Verify filtered results
  const filteredRows = await productsPage.getRowCount();
  expect(filteredRows).toBeLessThan(totalRows);

  // Verify all results match filter criteria
  await expect(page.locator('table tbody tr')).toContainText('RAW');
});
`;

// ==================== TEMPLATE 3: Validation ====================

/**
 * TEMPLATE: Required Field Validation Test
 */
export const requiredFieldTemplate = `
test('[TC-XXX-NNN] Validates required [field] on create', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Attempt to submit without required field
  await productsPage.clickAddProduct();
  await productsPage.expectCreateModalOpen();

  // Leave [field] empty
  await productsPage.fillProductForm({
    code: '[CODE]',
    name: '[NAME]',
    type: '[TYPE]',
    base_uom: '[UOM]',
    // [REQUIRED_FIELD] left empty
  });

  await productsPage.submitCreateProduct();

  // ASSERT - Verify validation error
  await productsPage.expectValidationError('[REQUIRED_FIELD]', /required|cannot be empty/i);

  // Modal still open
  await productsPage.expectCreateModalOpen();
});
`;

/**
 * TEMPLATE: Duplicate Validation Test
 */
export const duplicateValidationTemplate = `
test('[TC-XXX-NNN] Prevents duplicate [field]', async ({ page }) => {
  // ARRANGE - Setup with existing entity
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Attempt to create duplicate
  const duplicateCode = '[EXISTING_CODE]';
  await productsPage.clickAddProduct();
  await productsPage.fillProductForm({
    code: duplicateCode,
    name: '[NEW_NAME]',
    type: '[TYPE]',
    base_uom: '[UOM]',
  });

  await productsPage.submitCreateProduct();

  // ASSERT - Verify duplicate error
  await productsPage.expectDuplicateCodeError();
  await expect(page.getByText(/must be unique|already exists/i)).toBeVisible();
});
`;

/**
 * TEMPLATE: Format Validation Test
 */
export const formatValidationTemplate = `
test('[TC-XXX-NNN] Validates [field] format', async ({ page }) => {
  // ARRANGE - Setup
  const routingsPage = new RoutingsPage(page);
  await routingsPage.goto();

  // ACT - Try to create with invalid format
  await routingsPage.clickCreateRouting();
  await routingsPage.fillRoutingForm({
    code: 'invalid-code-123',  // Should be uppercase
    name: '[ROUTING_NAME]',
    is_reusable: true,
    setup_cost: 50,
    working_cost_per_unit: 0.5,
    overhead_percent: 15,
  });

  await routingsPage.submitCreateRouting();

  // ASSERT - Verify format error
  await routingsPage.expectCodeFormatError();
});
`;

// ==================== TEMPLATE 4: Business Logic ====================

/**
 * TEMPLATE: Complex Workflow Test
 */
export const workflowTemplate = `
test('[TC-XXX-NNN] Complete [workflow] workflow', async ({ page }) => {
  // ARRANGE - Create prerequisites
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  const routingsPage = new RoutingsPage(page);

  const productData = technicalFixtures.createProductData('FIN');
  const bomData = technicalFixtures.bomFixtures.simpleBOM(productData.code);

  // STEP 1: Create product
  await productsPage.goto();
  await productsPage.createProduct(productData);

  // STEP 2: Create BOM
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  // ... fill and submit BOM

  // STEP 3: Add items
  await bomsPage.addBOMItem({
    component_id: '[COMPONENT_1]',
    quantity: 10,
    uom: 'KG',
    operation_seq: 1,
  });

  // ASSERT - Verify complete workflow
  await bomsPage.expectBOMCreatedWithItems(productData.name, 1);
});
`;

/**
 * TEMPLATE: Versioning Test
 */
export const versioningTemplate = `
test('[TC-XXX-NNN] Auto-increments version on edit', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // Get initial version
  await productsPage.clickProduct('[PRODUCT_CODE]');
  const initialVersion = await productsPage.getProductVersion();

  // ACT - Update product
  await productsPage.clickEditFirstProduct();
  await productsPage.updateProductName('[UPDATED_NAME]');
  await productsPage.submitEditProduct();

  // ASSERT - Verify version incremented
  const newVersion = await productsPage.getProductVersion();
  expect(parseFloat(newVersion)).toBeGreaterThan(parseFloat(initialVersion));
});
`;

// ==================== TEMPLATE 5: List Operations ====================

/**
 * TEMPLATE: Pagination Test
 */
export const paginationTemplate = `
test('[TC-XXX-NNN] Pagination works for [entity]', async ({ page }) => {
  // ARRANGE - Create multiple items to trigger pagination
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Navigate pages
  const page1RowCount = await productsPage.getRowCount();

  const hasNextPage = await productsPage.hasNextPage();
  if (hasNextPage) {
    await productsPage.nextPage();

    // ASSERT - Verify page changed
    const page2RowCount = await productsPage.getRowCount();
    await expect(page.getByText(/page 2|next page disabled/i)).toBeVisible();
  }
});
`;

/**
 * TEMPLATE: Sorting Test
 */
export const sortingTemplate = `
test('[TC-XXX-NNN] Sorts by [column]', async ({ page }) => {
  // ARRANGE - Setup
  const dataTablePage = new DataTablePage(page);
  await page.goto('[PAGE_URL]');

  // ACT - Click column header to sort
  await dataTablePage.sortByColumn('[COLUMN_NAME]');

  // ASSERT - Verify sorting
  const firstCellValue = await dataTablePage.getCellValue(0, 0);
  const secondCellValue = await dataTablePage.getCellValue(1, 0);

  // Values should be in order (customize comparison based on data type)
  expect(firstCellValue <= secondCellValue).toBe(true);
});
`;

// ==================== TEMPLATE 6: Integration Tests ====================

/**
 * TEMPLATE: Multi-Step Integration Test
 */
export const integrationTemplate = `
test('[TC-XXX-NNN] [Feature] integrates across modules', async ({ page }) => {
  // ARRANGE - Setup all pages
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  const routingsPage = new RoutingsPage(page);

  // STEP 1: Create product
  const product = technicalFixtures.createProductData('FIN');
  await productsPage.goto();
  await productsPage.createProduct(product);

  // STEP 2: Navigate to BOM creation
  await bomsPage.goto();
  // ... create BOM linked to product

  // STEP 3: Navigate to Routing creation
  await routingsPage.goto();
  // ... create routing

  // STEP 4: Link routing to BOM
  // ... navigate back to BOM and assign routing

  // ASSERT - Verify integration points
  // ... verify cross-module consistency
});
`;

// ==================== TEMPLATE 7: Error Handling ====================

/**
 * TEMPLATE: Error Handling Test
 */
export const errorHandlingTemplate = `
test('[TC-XXX-NNN] Shows error when [condition]', async ({ page }) => {
  // ARRANGE - Setup
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Perform action that causes error
  await productsPage.clickAddProduct();
  await productsPage.fillProductForm({
    code: '[CODE]',
    name: '[NAME]',
    type: '[TYPE]',
    base_uom: '[INVALID_UOM]', // Invalid value
  });

  await productsPage.submitCreateProduct();

  // ASSERT - Verify error message
  await productsPage.expectErrorToast(/invalid|error|failed/i);

  // Form should still be visible for correction
  await productsPage.expectCreateModalOpen();
});
`;

// ==================== TEMPLATE 8: Permission Tests ====================

/**
 * TEMPLATE: Permission/Role Test
 */
export const permissionTemplate = `
test('[TC-XXX-NNN] [Role] cannot perform [action]', async ({ page, context }) => {
  // ARRANGE - Login as restricted user
  // (Requires auth setup to support different roles)
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  // ACT - Verify restricted UI elements
  // ASSERT - Verify button disabled or hidden
  await productsPage.expectAddProductButtonDisabled();

  // Verify cannot submit form if accessed
  // ... attempt to bypass UI restrictions
});
`;

// ==================== TEMPLATE 9: Performance Tests ====================

/**
 * TEMPLATE: Performance/Load Test
 */
export const performanceTemplate = `
test('[TC-XXX-NNN] [Page] loads within [time] seconds', async ({ page }) => {
  // ARRANGE - Measure performance
  const startTime = Date.now();

  // ACT - Navigate to page
  const productsPage = new ProductsPage(page);
  await productsPage.goto();
  await productsPage.waitForPageLoad();

  // ASSERT - Verify load time
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000); // 2 seconds

  // Verify all elements loaded
  await productsPage.expectPageHeader();
  await productsPage.expectAddProductButton();
});
`;

// ==================== TEMPLATE 10: Data-Driven Tests ====================

/**
 * TEMPLATE: Data-Driven Test (Parameterized)
 */
export const dataDriverTemplate = `
const testCases = [
  { code: 'RM-001', name: 'Raw Material 1', type: 'RAW', base_uom: 'KG' },
  { code: 'WIP-001', name: 'WIP Material 1', type: 'WIP', base_uom: 'KG' },
  { code: 'FIN-001', name: 'Finished Good 1', type: 'FIN', base_uom: 'EA' },
  { code: 'PKG-001', name: 'Packaging 1', type: 'PKG', base_uom: 'EA' },
];

for (const testCase of testCases) {
  test(\`[TC-XXX-NNN] Create \${testCase.type} product\`, async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();

    await productsPage.createProduct(testCase);

    await productsPage.expectProductInList(testCase.code);
  });
}
`;

// ==================== EXPORT ALL TEMPLATES ====================

export default {
  crudTemplate,
  searchTemplate,
  filterTemplate,
  requiredFieldTemplate,
  duplicateValidationTemplate,
  formatValidationTemplate,
  workflowTemplate,
  versioningTemplate,
  paginationTemplate,
  sortingTemplate,
  integrationTemplate,
  errorHandlingTemplate,
  permissionTemplate,
  performanceTemplate,
  dataDriverTemplate,
};
