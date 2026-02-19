# Technical Module E2E Test Infrastructure

**Version**: 1.0
**Created**: 2026-01-24
**Status**: Ready for Test Implementation

## Overview

Complete reusable test infrastructure for the Technical Module covering:
- **Fixtures**: Test data generators (products, BOMs, routings, allergens)
- **Page Objects**: All technical pages (Products, BOMs, Routings, Dashboard)
- **Helpers**: Common assertions and test setup utilities
- **Templates**: Copy-paste test templates with Given/When/Then pattern

## Quick Start

### 1. Create a Simple Test

```typescript
import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import * as technicalFixtures from '../fixtures/technical';

test('create product successfully', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  const productData = technicalFixtures.createProductData('RAW');

  // ACT
  await productsPage.goto();
  await productsPage.createProduct(productData);

  // ASSERT
  await productsPage.expectProductInList(productData.code);
});
```

### 2. Use Fixtures for Test Data

```typescript
// Simple product
const product = technicalFixtures.productFixtures.rawMaterial();

// Product with allergens
const productWithAllergens = technicalFixtures.productFixtures.withAllergens();

// Multi-level BOM
const bom = technicalFixtures.bomFixtures.multiLevelBOM('[product-id]');

// Bread routing
const routing = technicalFixtures.routingFixtures.breadRouting();

// Generate unique codes
const code = technicalFixtures.generateProductCode('PROD');
```

### 3. Use Page Objects

```typescript
import { ProductsPage, BOMsPage, RoutingsPage } from '../pages/TechnicalPages';

test('complete product-to-production workflow', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);
  const routingsPage = new RoutingsPage(page);

  // Navigate and interact
  await productsPage.goto();
  await productsPage.searchByCode('PROD-001');
  await productsPage.clickProduct('PROD-001');

  // Navigate to BOM
  await bomsPage.goto();
  await bomsPage.clickBOM('PROD-001');

  // Add items
  await bomsPage.addBOMItem({
    component_id: '[component-id]',
    quantity: 10,
    uom: 'KG',
    operation_seq: 1,
  });
});
```

## File Structure

```
e2e/
├── fixtures/
│   └── technical.ts                 # Test data generators
├── pages/
│   ├── BasePage.ts                  # Base page object
│   ├── FormPage.ts                  # Form interactions
│   ├── DataTablePage.ts             # Table interactions
│   ├── ProductsPage.ts              # Products module
│   ├── BOMsPage.ts                  # BOMs module
│   ├── RoutingsPage.ts              # Routings module
│   └── TechnicalPages.ts            # Convenience exports
├── helpers/
│   ├── technical-assertions.ts      # Custom assertions
│   └── test-setup.ts                # Setup helpers
├── templates/
│   └── test-templates.ts            # Copy-paste templates
└── TECHNICAL-INFRASTRUCTURE.md      # This file
```

## Fixtures Reference

### Product Fixtures

```typescript
// Pre-built fixtures
technicalFixtures.productFixtures.rawMaterial()
technicalFixtures.productFixtures.wipProduct()
technicalFixtures.productFixtures.finishedGood()
technicalFixtures.productFixtures.packaging()
technicalFixtures.productFixtures.nonPerishable()
technicalFixtures.productFixtures.withAllergens()

// Preset examples
technicalFixtures.productFixtures.flour()
technicalFixtures.productFixtures.sugar()
technicalFixtures.productFixtures.yeast()
technicalFixtures.productFixtures.whiteBread()

// Generators
technicalFixtures.createProductData('RAW') // Random data
technicalFixtures.generateProductCode('PROD') // Unique code
```

### BOM Fixtures

```typescript
technicalFixtures.bomFixtures.simpleBOM('[product-id]')
technicalFixtures.bomFixtures.multiLevelBOM('[product-id]')
technicalFixtures.bomFixtures.withByProducts('[product-id]')
technicalFixtures.bomFixtures.withAlternatives('[product-id]')
technicalFixtures.bomFixtures.withRouting('[product-id]', '[routing-id]')
technicalFixtures.bomFixtures.breadRecipe('[product-id]')

// Generators
technicalFixtures.createBOMWithItems('[product-id]', 3) // 3 items
technicalFixtures.createBOMItemData('[component-id]', 1) // Operation seq 1
```

### Routing Fixtures

```typescript
technicalFixtures.routingFixtures.standardRouting()
technicalFixtures.routingFixtures.nonReusableRouting()
technicalFixtures.routingFixtures.simpleRouting()
technicalFixtures.routingFixtures.complexRouting()
technicalFixtures.routingFixtures.breadRouting()

// Generators
technicalFixtures.createRoutingWithOperations(2, true) // 2 ops, reusable
technicalFixtures.createOperationData(1, 'Mixing')
```

### Allergen Fixtures

```typescript
// All 14 EU allergens
technicalFixtures.allergenFixtures.euAllergens

// Common subset
technicalFixtures.allergenFixtures.common()
```

### Date Fixtures

```typescript
technicalFixtures.dateFixtures.today()
technicalFixtures.dateFixtures.tomorrow()
technicalFixtures.dateFixtures.yesterday()
technicalFixtures.dateFixtures.daysFromNow(30)
technicalFixtures.dateFixtures.bomDateRange(0, 365) // Today + 1 year
technicalFixtures.dateFixtures.overlappingRange('2024-01-01', '2024-12-31')
```

## Page Object Reference

### ProductsPage

```typescript
const productsPage = new ProductsPage(page);

// Navigation
await productsPage.goto()
await productsPage.gotoProductDetail('[product-id]')

// Page layout
await productsPage.expectPageHeader()
await productsPage.expectAddProductButton()

// Search & filter
await productsPage.searchByCode('[code]')
await productsPage.searchByName('[name]')
await productsPage.filterByProductType('RAW')
await productsPage.filterByStatus('Active')

// Create
await productsPage.clickAddProduct()
await productsPage.fillProductForm(productData)
await productsPage.submitCreateProduct()
await productsPage.createProduct(productData) // Complete flow

// Update
await productsPage.clickEditFirstProduct()
await productsPage.updateProductName('[new-name]')
await productsPage.submitEditProduct()

// View
await productsPage.clickProduct('[code]')
await productsPage.expectProductDetailHeader('[name]')
await productsPage.getProductVersion()

// Allergens
await productsPage.clickAllergensTab()
await productsPage.clickAddAllergen()
await productsPage.selectAllergen('Gluten')
await productsPage.selectAllergenRelation('contains')
await productsPage.submitAddAllergen()
```

### BOMsPage

```typescript
const bomsPage = new BOMsPage(page);

// Navigation
await bomsPage.goto()
await bomsPage.gotoBOMDetail('[bom-id]')

// Create
await bomsPage.clickCreateBOM()
await bomsPage.fillBOMForm(bomData)
await bomsPage.submitCreateBOM()

// Items
await bomsPage.clickAddItem()
await bomsPage.fillItemForm(itemData)
await bomsPage.submitAddItem()
await bomsPage.addBOMItem(itemData) // Complete flow
await bomsPage.deleteBOMItem('[component-name]')

// Alternatives
await bomsPage.clickAlternativesButton('[component-name]')
await bomsPage.addAlternativeIngredient('[name]', 10, 'KG')

// By-products
await bomsPage.clickAddByProduct()
await bomsPage.addByProduct('[product-name]', 5, 'KG')

// Clone
await bomsPage.clickCloneBOM(0)
await bomsPage.selectCloneTargetProduct('[target-product]')
await bomsPage.cloneBOMToProduct('[target-product]') // Complete flow

// Cost
await bomsPage.expectCostSummary()
await bomsPage.getCostSummary()
await bomsPage.clickRecalculateCost()
```

### RoutingsPage

```typescript
const routingsPage = new RoutingsPage(page);

// Navigation
await routingsPage.goto()
await routingsPage.gotoRoutingDetail('[routing-id]')

// Create
await routingsPage.clickCreateRouting()
await routingsPage.fillRoutingForm(routingData)
await routingsPage.submitCreateRouting()
await routingsPage.createRouting(routingData) // Complete flow

// Operations
await routingsPage.clickAddOperation()
await routingsPage.fillOperationForm(operationData)
await routingsPage.submitAddOperation()
await routingsPage.addOperation(operationData) // Complete flow
await routingsPage.deleteOperation('[operation-name]')

// Clone
await routingsPage.clickCloneRouting()
await routingsPage.cloneRouting()

// Versioning
await routingsPage.getRoutingVersion()
await routingsPage.updateRoutingName('[new-name]')

// Cost
await routingsPage.expectCostSummary()
await routingsPage.getSetupCost()
await routingsPage.getWorkingCost()
```

## Assertions Reference

### Custom Assertions

```typescript
import * as assertions from '../helpers/technical-assertions';

// Creation
await assertions.expectProductCreated(page, productData)
await assertions.expectBOMCreatedWithItems(page, productName, 3)
await assertions.expectRoutingCreatedWithOperations(page, routingCode, 2)

// Validation
await assertions.expectCostReasonable(page, 100, 500) // $100-$500
await assertions.expectVersionIncremented(currentVersion, newVersionText)
await assertions.expectAllergenDeclared(page, 'Gluten', 'contains')

// Business logic
await assertions.expectBOMItemQuantities(page, [
  { name: 'Flour', quantity: 10, uom: 'KG' }
])
await assertions.expectCostBreakdown(page, 50, 25, 15) // materials, labor, overhead
await assertions.expectNoBOMDateOverlap('2024-01-01', '2024-12-31', '2024-06-01', '2025-12-31')

// Complex scenarios
await assertions.expectTraceabilityData(page, 'LP-001', ['LP-RAW-001'], ['LP-002'])
await assertions.expectRecallSimulation(page, ['Bread'], ['Customer ABC'], 250)
```

## Test Setup Helpers

```typescript
import * as testSetup from '../helpers/test-setup';

// One-time setup
await testSetup.setupTestEnvironment(page)

// Create test data via API (faster)
const productId = await testSetup.createProductViaAPI(page, productData)
const bomId = await testSetup.createBOMViaAPI(page, bomData)
const routingId = await testSetup.createRoutingViaAPI(page, routingData)

// Complete ecosystem
const ecosystem = await testSetup.createProductEcosystem(page)
// ecosystem.productId, ecosystem.bomId, ecosystem.routingId

// Cleanup
await testSetup.cleanupTestData(page, {
  productId,
  bomId,
  routingId
})

// Bulk creation
const productIds = await testSetup.createMultipleProducts(page, 5)
const products = await testSetup.createProductsByType(page, ['RAW', 'FIN'])

// Debugging
await testSetup.debugScreenshot(page, 'test-name', 'step-1')
const content = await testSetup.capturePageContent(page)
```

## Test Templates

### Using Templates

1. Open `e2e/templates/test-templates.ts`
2. Copy appropriate template
3. Replace `[PLACEHOLDERS]` with actual values
4. Implement test logic
5. Run test

### Available Templates

- **CRUD Operations**: Create, Read, Update, Delete patterns
- **Search & Filter**: Search and filter functionality testing
- **Validation**: Required fields, duplicates, format validation
- **Business Logic**: Complex workflows, versioning
- **List Operations**: Pagination, sorting
- **Integration Tests**: Multi-module scenarios
- **Error Handling**: Error message verification
- **Permission Tests**: Role-based access control
- **Performance Tests**: Load time verification
- **Data-Driven Tests**: Parameterized test cases

### Example: Using Create Template

```typescript
// Before
// TEMPLATE: Generic CRUD Test - Create Operation

// After
test('TC-PROD-010: Create product with all required fields', async ({ page }) => {
  // ARRANGE
  const productsPage = new ProductsPage(page);
  await productsPage.goto();

  const productData = {
    code: 'PROD-TEST-001',
    name: 'Test Product',
    type: 'RAW',
    base_uom: 'KG',
  };

  // ACT
  await productsPage.clickAddProduct();
  await productsPage.expectCreateModalOpen();
  await productsPage.fillProductForm(productData);
  await productsPage.submitCreateProduct();

  // ASSERT
  await productsPage.expectCreateSuccess();
  await productsPage.expectProductInList(productData.code);

  await productsPage.clickProduct(productData.code);
  await productsPage.expectProductDetailHeader(productData.name);
});
```

## Test Patterns

### Pattern 1: Simple CRUD

```typescript
test('pattern 1: simple create', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  const data = technicalFixtures.createProductData('RAW');

  await productsPage.goto();
  await productsPage.createProduct(data);
  await productsPage.expectProductInList(data.code);
});
```

### Pattern 2: With Cleanup

```typescript
test('pattern 2: with cleanup', async ({ page }) => {
  const data = technicalFixtures.createProductData('RAW');
  const ecosystem = await testSetup.createProductEcosystem(page);

  try {
    // Test logic
  } finally {
    // Always cleanup
    await testSetup.cleanupTestData(page, ecosystem);
  }
});
```

### Pattern 3: Multi-Step Workflow

```typescript
test('pattern 3: multi-step workflow', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  const bomsPage = new BOMsPage(page);

  // Step 1: Create product
  const product = technicalFixtures.createProductData('FIN');
  await productsPage.goto();
  await productsPage.createProduct(product);

  // Step 2: Create BOM
  await bomsPage.goto();
  await bomsPage.clickCreateBOM();
  // ... fill and submit

  // Step 3: Verify integration
  await productsPage.goto();
  await productsPage.clickProduct(product.code);
  // ... verify BOM linked
});
```

### Pattern 4: Data-Driven

```typescript
const testCases = [
  { type: 'RAW', uom: 'KG' },
  { type: 'FIN', uom: 'EA' },
];

for (const testCase of testCases) {
  test(`pattern 4: create ${testCase.type}`, async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const data = technicalFixtures.createProductData(testCase.type as any);

    await productsPage.goto();
    await productsPage.createProduct(data);
    await productsPage.expectProductInList(data.code);
  });
}
```

## Running Tests

### Run All Technical Tests

```bash
pnpm test:e2e technical
```

### Run Specific Suite

```bash
pnpm test:e2e technical/products.spec.ts
pnpm test:e2e technical/boms.spec.ts
pnpm test:e2e technical/routings.spec.ts
```

### Run Specific Test

```bash
pnpm test:e2e technical -g "creates product with all required fields"
```

### Run with UI

```bash
pnpm test:e2e --ui technical
```

### Run with Debug

```bash
pnpm test:e2e --debug technical
```

### Generate HTML Report

```bash
pnpm test:e2e technical --reporter=html
```

## Best Practices

### 1. Use Fixtures for Test Data

✅ Good

```typescript
const product = technicalFixtures.createProductData('RAW');
```

❌ Avoid

```typescript
const product = {
  code: 'PROD-TEST-001',
  name: 'Test Product',
  type: 'RAW',
  base_uom: 'KG',
};
```

### 2. Use Page Objects

✅ Good

```typescript
await productsPage.createProduct(data);
```

❌ Avoid

```typescript
await page.getByRole('button', { name: /add product/i }).click();
await page.fill('input[name="code"]', data.code);
// ... 10 more lines
```

### 3. Use Complete Methods

✅ Good

```typescript
await bomsPage.addBOMItem(itemData);
```

❌ Avoid

```typescript
await bomsPage.clickAddItem();
// ... manual form filling steps
await bomsPage.submitAddItem();
```

### 4. Clean Up Properly

✅ Good

```typescript
test('test', async ({ page }) => {
  const ecosystem = await testSetup.createProductEcosystem(page);
  try {
    // Test
  } finally {
    await testSetup.cleanupTestData(page, ecosystem);
  }
});
```

❌ Avoid

```typescript
test('test', async ({ page }) => {
  // Create data but don't clean up
  // ... test logic
});
```

### 5. Use Unique Identifiers

✅ Good

```typescript
const code = technicalFixtures.generateProductCode('PROD');
const data = { ...productData, code };
```

❌ Avoid

```typescript
const data = { ...productData, code: 'PROD-001' }; // Collision risk
```

### 6. Meaningful Test Names

✅ Good

```typescript
test('TC-PROD-010: Create product with all required fields', async ({ page }) => {
```

❌ Avoid

```typescript
test('create product', async ({ page }) => {
```

### 7. Independent Tests

✅ Good

```typescript
// Each test creates its own data
test('test 1', async ({ page }) => {
  const data = technicalFixtures.createProductData('RAW');
  // ...
});

test('test 2', async ({ page }) => {
  const data = technicalFixtures.createProductData('FIN');
  // ...
});
```

❌ Avoid

```typescript
// Test 1 creates data that test 2 depends on
test('test 1: create product', ...)
test('test 2: verify product exists', ...) // Fails if test 1 skipped
```

## Troubleshooting

### Issue: Tests Fail with "Element Not Found"

**Solution**: Use `waitForPageLoad()` after navigation

```typescript
await productsPage.goto();
await productsPage.waitForPageLoad(); // Added
await productsPage.expectPageHeader();
```

### Issue: Duplicate Code Errors

**Solution**: Use unique code generators

```typescript
const code = technicalFixtures.generateProductCode('PROD');
```

### Issue: Modal/Drawer Doesn't Close

**Solution**: Verify wait for action completion

```typescript
await productsPage.submitCreateProduct();
await productsPage.waitForPageLoad(); // Added
await productsPage.expectSuccessToast();
```

### Issue: Flaky Date Comparison

**Solution**: Use date fixtures for consistent ranges

```typescript
// Instead of hardcoding dates
const dateRange = technicalFixtures.dateFixtures.bomDateRange(0, 365);
```

## Contributing

When adding new tests or infrastructure:

1. **Follow naming conventions**: `TC-XXX-NNN` for test IDs
2. **Add to fixtures**: Put reusable data in fixtures
3. **Add page objects**: Don't hardcode selectors in tests
4. **Document**: Add JSDoc comments to new functions
5. **Test cleanup**: Always cleanup created data
6. **Independent tests**: No test should depend on another

## Related Documents

- `.claude/EPIC-02-E2E-TEST-PLAN.md` - Complete test plan with 120 test cases
- `playwright.config.ts` - Playwright configuration
- `e2e/tests/settings/` - Example test implementations
- `.claude/PATTERNS.md` - Code patterns and conventions

## Support

For issues or questions about the test infrastructure:

1. Check this document first
2. Review template examples in `e2e/templates/test-templates.ts`
3. Review example tests in `e2e/tests/settings/`
4. Check Playwright docs: https://playwright.dev/docs/intro

---

**Last Updated**: 2026-01-24
**Maintained By**: QA Team
**Test Framework**: Playwright
**Test Pattern**: Given/When/Then (AAA)
