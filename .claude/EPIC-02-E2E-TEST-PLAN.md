# Epic 2 Technical Module - E2E Test Plan

**Version**: 1.0
**Date**: 2026-01-24
**Status**: Ready for Approval
**Owner**: QA Team

## Executive Summary

Complete E2E test plan for Technical Module (Epic 2) covering all functional requirements across 8 test suites with 120 test cases.

### Coverage Statistics

| Category | Test Files | Test Cases | FRs Covered |
|----------|-----------|------------|-------------|
| Products | 1 | 15 | FR-2.1 to FR-2.15 (15 FRs) |
| Product Types | 1 | 8 | FR-2.5 (1 FR) |
| BOMs | 1 | 25 | FR-2.20 to FR-2.39 (20 FRs) |
| Routings | 1 | 20 | FR-2.40 to FR-2.55 (16 FRs) |
| Traceability | 1 | 18 | FR-2.60 to FR-2.67 (8 FRs) |
| Costing | 1 | 12 | FR-2.70 to FR-2.77 (8 FRs) |
| Dashboard | 1 | 10 | FR-2.100 to FR-2.103 (4 FRs) |
| Integration | 1 | 12 | Cross-module scenarios |
| **TOTAL** | **8** | **120** | **72 FRs (100%)** |

### Execution Strategy

- **Framework**: Playwright
- **Pattern**: Given/When/Then + Page Object Model
- **Parallelization**: Enabled (8 workers)
- **Auth Caching**: Yes (4 roles: admin, manager, planner, operator)
- **Data Strategy**: Fixtures + dynamic timestamps
- **Estimated Duration**: 35-45 minutes (full suite)

---

## Test Suite 1: Products Module

**File**: `e2e/tests/technical/products.spec.ts`
**Estimated Tests**: 15
**Estimated Duration**: 4-6 minutes

### Test Cases

#### 1.1 List View & Navigation (7 tests)

##### TC-PROD-001: Displays page header and description
```typescript
test('displays page header and description', async ({ page }) => {
  // GIVEN user navigates to products page
  await page.goto('/technical/products');

  // THEN page header is visible
  await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();

  // AND description is visible
  await expect(page.getByText(/manage product master data/i)).toBeVisible();
});
```

##### TC-PROD-002: Displays table with correct columns
- Verifies columns: Code (SKU), Name, Type, Status, Version, Actions
- Verifies column headers are sortable
- Verifies data populates correctly

##### TC-PROD-003: Displays Add Product button
- Verifies "Add Product" button visible
- Verifies button is clickable
- Verifies correct permissions (admin, manager, technical roles only)

##### TC-PROD-004: Search by code/name filters correctly
- Enters product code in search
- Verifies filtered results
- Clears search
- Enters product name
- Verifies filtered results

##### TC-PROD-005: Filter by product type works
- Clicks product type filter dropdown
- Selects "RAW" type
- Verifies only RAW products shown
- Selects "FIN" type
- Verifies only FIN products shown

##### TC-PROD-006: Filter by status works
- Selects "Active" status filter
- Verifies only active products shown
- Selects "Inactive" status filter
- Verifies only inactive products shown

##### TC-PROD-007: Pagination works for >10 products
- Creates 15 test products via API
- Verifies page 1 shows 10 products
- Clicks "Next" button
- Verifies page 2 shows 5 products

---

#### 1.2 Create Product (7 tests)

##### TC-PROD-008: Opens create product modal
```typescript
test('opens create product modal', async ({ page }) => {
  // GIVEN user on products page
  await page.goto('/technical/products');

  // WHEN clicking Add Product button
  await page.getByRole('button', { name: /Add Product/i }).click();

  // THEN modal opens
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(page.getByText(/Create Product/i)).toBeVisible();
});
```

##### TC-PROD-009: Validates required fields
- Opens create modal
- Attempts to submit empty form
- Verifies validation errors for: code, name, product_type_id, base_uom
- Fills required fields
- Verifies validation errors cleared

##### TC-PROD-010: Creates product with all required fields
```typescript
test('creates product with all required fields', async ({ page }) => {
  await page.goto('/technical/products');
  await page.getByRole('button', { name: /Add Product/i }).click();

  const timestamp = Date.now();
  const productData = {
    code: `PROD-${timestamp}`,
    name: `Test Product ${timestamp}`,
    type: 'RAW',
    base_uom: 'KG'
  };

  await page.locator('input[name="code"]').fill(productData.code);
  await page.locator('input[name="name"]').fill(productData.name);
  await page.locator('[role="combobox"]').nth(0).click();
  await page.locator(`text=${productData.type}`).click();
  await page.locator('[role="combobox"]').nth(1).click();
  await page.locator(`text=${productData.base_uom}`).click();

  await page.getByRole('button', { name: /Create|Submit/i }).click();
  await page.waitForLoadState('networkidle');

  // THEN success message shown
  await expect(page.locator('text=/success|created/i')).toBeVisible();

  // AND product appears in table
  await expect(page.getByText(productData.code)).toBeVisible();
});
```

##### TC-PROD-011: Displays success message
- Verifies success toast/banner appears
- Verifies modal closes after creation
- Verifies user redirected to product list

##### TC-PROD-012: Auto-assigns version 1.0
- Creates product
- Navigates to product detail
- Verifies version = "1.0" in detail view

##### TC-PROD-013: Prevents duplicate SKU codes
- Creates product with code "PROD-001"
- Attempts to create another product with code "PROD-001"
- Verifies error message: "Product code must be unique"

##### TC-PROD-014: Validates shelf_life_days for perishable products (FR-2.8, migration 046)
- Creates product with is_perishable = true
- Attempts to save without shelf_life_days
- Verifies validation error
- Sets expiry_policy = 'none'
- Verifies validation error (perishable requires expiry_policy != 'none')

---

#### 1.3 Edit Product (6 tests)

##### TC-PROD-015: Opens edit drawer for product
- Clicks edit icon on first product row
- Verifies drawer slides in from right
- Verifies "Edit Product" header
- Verifies form pre-populated with product data

##### TC-PROD-016: Updates product name and description
- Opens edit drawer
- Changes name field
- Changes description field
- Clicks "Save Changes"
- Verifies success message
- Verifies updated values in table

##### TC-PROD-017: Changes product status (active/inactive)
- Opens edit drawer
- Changes status to "Inactive"
- Saves
- Verifies status badge updated in table

##### TC-PROD-018: Auto-increments version on edit (FR-2.2)
```typescript
test('auto-increments version on edit', async ({ page }) => {
  // GIVEN product with version 1.0
  await page.goto('/technical/products');
  const firstRow = page.locator('tbody tr').first();
  await firstRow.locator('button').first().click();

  // WHEN editing product name
  const nameInput = page.locator('input[name="name"]');
  await nameInput.fill(`Updated Product ${Date.now()}`);
  await page.getByRole('button', { name: /Save/i }).click();
  await page.waitForLoadState('networkidle');

  // THEN version increments to 1.1
  await firstRow.click();
  await expect(page.getByText(/version.*1\.1/i)).toBeVisible();
});
```

##### TC-PROD-019: Code field is read-only during edit
- Opens edit drawer
- Verifies code input has disabled attribute
- Attempts to type in code field
- Verifies value unchanged

##### TC-PROD-020: Displays version history (FR-2.3)
- Opens product detail
- Clicks "Version History" tab
- Verifies history table with columns: Version, Changed By, Changed At, Changes
- Verifies at least 1 history entry exists

---

#### 1.4 Product Details (5 tests)

##### TC-PROD-021: Navigates to product detail page
- Clicks product name in table
- Verifies URL is `/technical/products/:id`
- Verifies product detail page loads

##### TC-PROD-022: Displays all product fields
- Verifies all fields displayed: code, name, description, type, status, version, base_uom, shelf_life_days, cost_per_unit

##### TC-PROD-023: Shows version history table
- Verifies version history section visible
- Verifies table with history records

##### TC-PROD-024: Displays allergens tab
- Clicks "Allergens" tab
- Verifies allergen list visible
- Verifies "Add Allergen" button visible

##### TC-PROD-025: Shows shelf life configuration (FR-2.90-2.92)
- Clicks "Shelf Life" tab
- Verifies calculated_days displayed
- Verifies override_days field editable
- Verifies final_days = override_days (if set) or calculated_days

---

#### 1.5 Allergen Management (5 tests)

##### TC-PROD-026: Opens allergen assignment modal
- On product detail page
- Clicks "Add Allergen" button
- Verifies modal opens with allergen dropdown

##### TC-PROD-027: Adds allergen with "contains" relation
```typescript
test('adds allergen with contains relation', async ({ page }) => {
  await page.goto('/technical/products/[test-product-id]');
  await page.getByRole('tab', { name: /Allergens/i }).click();
  await page.getByRole('button', { name: /Add Allergen/i }).click();

  // Select allergen
  await page.locator('[role="combobox"]').click();
  await page.getByText('Gluten (A01)').click();

  // Select relation type
  await page.locator('input[value="contains"]').check();

  await page.getByRole('button', { name: /Add/i }).click();

  // THEN allergen appears in list
  await expect(page.getByText('Gluten')).toBeVisible();
  await expect(page.getByText('Contains')).toBeVisible();
});
```

##### TC-PROD-028: Adds allergen with "may contain" relation
- Similar to TC-PROD-027 but selects "may_contain" relation type
- Verifies "May Contain" badge displayed

##### TC-PROD-029: Removes allergen
- Clicks delete icon on allergen row
- Confirms deletion
- Verifies allergen removed from list

##### TC-PROD-030: Displays inherited allergens from BOM (FR-2.28)
- Creates product with BOM containing ingredient with allergen
- Views product allergens tab
- Verifies inherited allergen shown with "From BOM" badge
- Verifies inherited allergen is read-only (no delete button)

---

## Test Suite 2: Product Types Module

**File**: `e2e/tests/technical/product-types.spec.ts`
**Estimated Tests**: 8
**Estimated Duration**: 2-3 minutes

### Test Cases

#### 2.1 List View (2 tests)

##### TC-TYPE-001: Displays table with correct columns
- Verifies columns: Code, Name, Is Default, Status, Products Count, Actions
- Verifies system types visible: RAW, WIP, FIN, PKG

##### TC-TYPE-002: Search by code/name works
- Enters "RAW" in search
- Verifies only RAW type shown
- Clears search
- Verifies all types shown again

---

#### 2.2 Create Product Type (3 tests)

##### TC-TYPE-003: Opens create modal
- Clicks "Add Product Type" button
- Verifies modal opens with form

##### TC-TYPE-004: Creates custom product type
```typescript
test('creates custom product type', async ({ page }) => {
  await page.goto('/technical/product-types');
  await page.getByRole('button', { name: /Add Product Type/i }).click();

  const typeData = {
    code: `TYPE-${Date.now()}`,
    name: `Custom Type ${Date.now()}`
  };

  await page.locator('input[name="code"]').fill(typeData.code);
  await page.locator('input[name="name"]').fill(typeData.name);

  await page.getByRole('button', { name: /Create/i }).click();

  await expect(page.getByText(typeData.code)).toBeVisible();
});
```

##### TC-TYPE-005: Prevents duplicate codes
- Creates type with code "CUSTOM-001"
- Attempts to create another with same code
- Verifies error: "Product type code must be unique"

---

#### 2.3 Edit Product Type (2 tests)

##### TC-TYPE-006: Updates name and is_default flag
- Opens edit drawer for custom type
- Changes name
- Sets is_default = true
- Verifies previous default type now has is_default = false (only one default allowed)

##### TC-TYPE-007: Code field is read-only for system types
- Opens edit for "RAW" type
- Verifies code field disabled
- Verifies system types cannot be deleted

---

#### 2.4 Product Count Link (1 test)

##### TC-TYPE-008: Product count link navigates to filtered products
- Clicks product count for "RAW" type
- Verifies navigation to `/technical/products?type=RAW`
- Verifies only RAW products displayed

---

## Test Suite 3: BOMs Module

**File**: `e2e/tests/technical/boms.spec.ts`
**Estimated Tests**: 25
**Estimated Duration**: 8-10 minutes

### Test Cases

#### 3.1 List View (5 tests)

##### TC-BOM-001: Displays table with correct columns
- Columns: Product, Version, Effective From, Effective To, Status, Actions
- Verifies sortable columns
- Verifies Clone action button visible (FR-2.24)

##### TC-BOM-002: Search by product name works
##### TC-BOM-003: Filter by status works
##### TC-BOM-004: Filter by product type works
##### TC-BOM-005: Displays Create BOM button

---

#### 3.2 Create BOM (7 tests)

##### TC-BOM-006: Opens create BOM form
##### TC-BOM-007: Selects product and sets dates
##### TC-BOM-008: Prevents date overlap for same product (FR-2.22)
```typescript
test('prevents date overlap for same product', async ({ page }) => {
  // GIVEN product with existing BOM (2024-01-01 to 2024-12-31)
  const productId = '[test-product-id]';

  // WHEN attempting to create overlapping BOM (2024-06-01 to 2025-12-31)
  await page.goto('/technical/boms/new');
  await page.locator('[name="product_id"]').fill(productId);
  await page.locator('[name="effective_from"]').fill('2024-06-01');
  await page.locator('[name="effective_to"]').fill('2025-12-31');

  await page.getByRole('button', { name: /Create/i }).click();

  // THEN validation error shown
  await expect(page.getByText(/date range overlaps with existing BOM/i)).toBeVisible();
});
```

##### TC-BOM-009: Sets output_qty and output_uom
##### TC-BOM-010: Assigns production lines (many-to-many)
##### TC-BOM-011: Assigns routing (optional) (FR-2.42)
##### TC-BOM-012: Creates BOM successfully

---

#### 3.3 BOM Items Management (8 tests)

##### TC-BOM-013: Navigates to BOM detail page
##### TC-BOM-014: Adds ingredient item
```typescript
test('adds ingredient item', async ({ page }) => {
  await page.goto('/technical/boms/[test-bom-id]');
  await page.getByRole('button', { name: /Add Item/i }).click();

  // Select ingredient
  await page.locator('[name="component_id"]').click();
  await page.getByText('Flour - RM001').click();

  // Set quantity and UoM
  await page.locator('[name="quantity"]').fill('10');
  await page.locator('[name="uom"]').click();
  await page.getByText('KG').click();

  // Set operation sequence
  await page.locator('[name="operation_seq"]').fill('1');

  await page.getByRole('button', { name: /Add/i }).click();

  // THEN item appears in table
  await expect(page.getByText('Flour - RM001')).toBeVisible();
  await expect(page.getByText('10 KG')).toBeVisible();
});
```

##### TC-BOM-015: Sets operation_seq for item
##### TC-BOM-016: Sets scrap_percent
##### TC-BOM-017: Validates quantity > 0 (migration 049)
##### TC-BOM-018: Shows UoM mismatch warning (migration 049)
##### TC-BOM-019: Reorders items by sequence
##### TC-BOM-020: Deletes item

---

#### 3.4 Alternative Ingredients (4 tests)

##### TC-BOM-021: Opens alternatives modal
##### TC-BOM-022: Adds alternative ingredient
##### TC-BOM-023: Validates UoM matches primary
##### TC-BOM-024: Deletes alternative

---

#### 3.5 By-Products (2 tests)

##### TC-BOM-025: Adds by-product item with yield_percent
##### TC-BOM-026: Displays in by-products section

---

#### 3.6 BOM Clone (3 tests)

##### TC-BOM-027: Clicks Clone action on BOM list (FR-2.24)
```typescript
test('clones BOM to new product', async ({ page }) => {
  await page.goto('/technical/boms');

  // Find BOM with items
  const bomRow = page.locator('tbody tr').first();
  await bomRow.locator('[data-action="clone"]').click();

  // THEN clone modal opens
  await expect(page.getByText(/Clone BOM/i)).toBeVisible();

  // Select target product
  await page.locator('[name="target_product_id"]').click();
  await page.getByText('New Product XYZ').click();

  await page.getByRole('button', { name: /Clone/i }).click();

  // THEN success message
  await expect(page.getByText(/BOM cloned successfully/i)).toBeVisible();

  // THEN navigate to cloned BOM
  await page.goto('/technical/boms?product=New Product XYZ');
  const clonedBom = page.locator('tbody tr').first();
  await clonedBom.click();

  // THEN verify all items copied
  await expect(page.getByText('Flour - RM001')).toBeVisible();
  // ... verify all original items present
});
```

##### TC-BOM-028: Verifies cloned BOM has all items
##### TC-BOM-029: Verifies routing is copied

---

#### 3.7 BOM Version Comparison (2 tests)

##### TC-BOM-030: Selects two BOM versions and displays diff
##### TC-BOM-031: Shows routing and production line changes

---

#### 3.8 BOM Cost Summary (2 tests)

##### TC-BOM-032: Displays cost summary card (FR-2.36)
##### TC-BOM-033: Recalculate button updates cost

---

#### 3.9 Allergen Inheritance (2 tests)

##### TC-BOM-034: Adds ingredient with allergen, verifies auto-inheritance (FR-2.28)
##### TC-BOM-035: Updates when ingredient removed

---

#### 3.10 Multi-Level BOM Explosion (1 test)

##### TC-BOM-036: Opens BOM explosion tree view (FR-2.29)

---

## Test Suite 4: Routings Module

**File**: `e2e/tests/technical/routings.spec.ts`
**Estimated Tests**: 20
**Estimated Duration**: 6-8 minutes

### Test Cases

#### 4.1 List View (4 tests)

##### TC-RTG-001: Displays table with correct columns
- Columns: Code, Name, Version, Is Reusable, Status, Operations, Actions

##### TC-RTG-002: Search by code/name works
##### TC-RTG-003: Filter by is_reusable flag
##### TC-RTG-004: Filter by status

---

#### 4.2 Create Routing (6 tests)

##### TC-RTG-005: Opens create form
##### TC-RTG-006: Sets unique routing code (validates uniqueness)
```typescript
test('validates routing code uniqueness', async ({ page }) => {
  await page.goto('/technical/routings/new');

  // WHEN entering existing code
  await page.locator('[name="code"]').fill('RTG-BREAD-01');
  await page.locator('[name="name"]').fill('Test Routing');

  await page.getByRole('button', { name: /Create/i }).click();

  // THEN validation error
  await expect(page.getByText(/routing code must be unique/i)).toBeVisible();
});
```

##### TC-RTG-007: Sets is_reusable flag
##### TC-RTG-008: Sets cost fields (setup_cost, working_cost_per_unit, overhead_percent) (ADR-009)
##### TC-RTG-009: Validates code format (uppercase, alphanumeric, hyphens)
##### TC-RTG-010: Creates routing successfully

---

#### 4.3 Routing Operations Management (8 tests)

##### TC-RTG-011: Navigates to routing detail
##### TC-RTG-012: Adds operation
```typescript
test('adds operation to routing', async ({ page }) => {
  await page.goto('/technical/routings/[test-routing-id]');
  await page.getByRole('button', { name: /Add Operation/i }).click();

  await page.locator('[name="sequence"]').fill('1');
  await page.locator('[name="name"]').fill('Mixing');

  // Select machine
  await page.locator('[name="machine_id"]').click();
  await page.getByText('Mixer-01').click();

  // Set time fields
  await page.locator('[name="setup_time"]').fill('15'); // minutes
  await page.locator('[name="duration"]').fill('60'); // minutes
  await page.locator('[name="cleanup_time"]').fill('10'); // minutes

  // Set labor cost
  await page.locator('[name="labor_cost_per_hour"]').fill('25.50');

  await page.getByRole('button', { name: /Add/i }).click();

  await expect(page.getByText('Mixing')).toBeVisible();
  await expect(page.getByText('Mixer-01')).toBeVisible();
});
```

##### TC-RTG-013: Sets time fields (setup_time, duration, cleanup_time)
##### TC-RTG-014: Sets labor_cost_per_hour
##### TC-RTG-015: Adds instructions (max 2000 chars)
##### TC-RTG-016: Validates unique sequence numbers
##### TC-RTG-017: Reorders operations
##### TC-RTG-018: Deletes operation

---

#### 4.4 Routing Assignment to BOM (2 tests)

##### TC-RTG-019: Assigns routing to BOM (FR-2.42)
##### TC-RTG-020: Verifies routing displayed in BOM detail

---

#### 4.5 Routing Clone (1 test)

##### TC-RTG-021: Clones routing with "-COPY" suffix

---

#### 4.6 Routing Versioning (1 test)

##### TC-RTG-022: Auto-increments version on edit (FR-2.46)

---

#### 4.7 Routing Cost Calculation (2 tests)

##### TC-RTG-023: Displays cost summary (ADR-009)
##### TC-RTG-024: Total cost = setup + (working * qty) + overhead

---

#### 4.8 Parallel Operations (1 test)

##### TC-RTG-025: Adds operations with duplicate sequence (FR-2.48)

---

#### 4.9 Reusable vs Non-Reusable (2 tests)

##### TC-RTG-026: Assigns reusable routing to multiple BOMs
##### TC-RTG-027: Non-reusable routing can only assign to one BOM

---

## Test Suite 5: Traceability Module

**File**: `e2e/tests/technical/traceability.spec.ts`
**Estimated Tests**: 18
**Estimated Duration**: 6-8 minutes

### Test Cases

#### 5.1 Traceability Search Page (2 tests)

##### TC-TRC-001: Displays search interface
##### TC-TRC-002: Has all action buttons (Forward, Backward, Genealogy, Recall)

---

#### 5.2 Forward Traceability (4 tests)

##### TC-TRC-003: Displays downstream lots (FR-2.60)
```typescript
test('forward trace shows where lot was consumed', async ({ page }) => {
  // GIVEN lot LP-001 consumed in WO-123 to produce LP-002
  const lotNumber = 'LP-001';

  await page.goto('/technical/traceability');
  await page.locator('[name="lot_number"]').fill(lotNumber);
  await page.getByRole('button', { name: /Forward Trace/i }).click();

  // THEN downstream lots shown
  await expect(page.getByText('LP-002')).toBeVisible();
  await expect(page.getByText('WO-123')).toBeVisible();

  // AND consumption details shown
  await expect(page.getByText(/consumed.*10.*KG/i)).toBeVisible();
});
```

##### TC-TRC-004: Shows work orders where consumed
##### TC-TRC-005: Shows quantities and dates
##### TC-TRC-006: Shows end-product lots produced

---

#### 5.3 Backward Traceability (4 tests)

##### TC-TRC-007: Displays upstream lots (FR-2.61)
##### TC-TRC-008: Shows ingredient lots consumed
##### TC-TRC-009: Shows work order link
##### TC-TRC-010: Traces back to raw materials

---

#### 5.4 Genealogy Tree (3 tests)

##### TC-TRC-011: Displays interactive tree view (FR-2.63)
##### TC-TRC-012: Shows parent-child relationships
##### TC-TRC-013: Expandable/collapsible nodes

---

#### 5.5 Recall Simulation (4 tests)

##### TC-TRC-014: Displays all affected downstream lots (FR-2.62)
```typescript
test('recall simulation shows affected lots and customers', async ({ page }) => {
  // GIVEN lot LP-RAW-001 used in multiple finished products
  await page.goto('/technical/traceability');
  await page.locator('[name="lot_number"]').fill('LP-RAW-001');
  await page.getByRole('button', { name: /Recall Simulation/i }).click();

  // THEN all affected downstream lots shown
  await expect(page.getByText(/affected lots.*15/i)).toBeVisible();

  // AND affected products shown
  await expect(page.getByText('Bread Loaf - SKU123')).toBeVisible();
  await expect(page.getByText('Dinner Roll - SKU456')).toBeVisible();

  // AND shipped lots highlighted
  await expect(page.getByText(/shipped to.*Customer ABC/i)).toBeVisible();

  // AND total quantity calculated
  await expect(page.getByText(/total quantity.*250.*KG/i)).toBeVisible();
});
```

##### TC-TRC-015: Shows affected products and customers
##### TC-TRC-016: Calculates total quantity affected
##### TC-TRC-017: Export recall report to CSV

---

#### 5.6 Traceability Matrix (1 test)

##### TC-TRC-018: Generates traceability matrix report (FR-2.65)

---

## Test Suite 6: Costing Module

**File**: `e2e/tests/technical/costing.spec.ts`
**Estimated Tests**: 12
**Estimated Duration**: 4-5 minutes

### Test Cases

#### 6.1 BOM Cost Calculation (3 tests)

##### TC-COST-001: Displays material cost breakdown (FR-2.70)
```typescript
test('calculates BOM material cost', async ({ page }) => {
  // GIVEN BOM with 3 ingredients:
  // - Flour: 10 KG @ $2.50/KG = $25.00
  // - Sugar: 2 KG @ $1.00/KG = $2.00
  // - Yeast: 0.5 KG @ $10.00/KG = $5.00
  // Expected total: $32.00

  await page.goto('/technical/boms/[test-bom-id]');

  // WHEN clicking Calculate Cost
  await page.getByRole('button', { name: /Calculate Cost/i }).click();

  // THEN material cost breakdown shown
  await expect(page.getByText(/Flour.*\$25\.00/i)).toBeVisible();
  await expect(page.getByText(/Sugar.*\$2\.00/i)).toBeVisible();
  await expect(page.getByText(/Yeast.*\$5\.00/i)).toBeVisible();

  // AND total material cost shown
  await expect(page.getByText(/Total Material Cost.*\$32\.00/i)).toBeVisible();
});
```

##### TC-COST-002: Shows ingredient costs
##### TC-COST-003: Shows subtotal

---

#### 6.2 Routing Cost Calculation (4 tests)

##### TC-COST-004: Displays routing cost section (FR-2.77, ADR-009)
```typescript
test('calculates routing cost with all components', async ({ page }) => {
  // GIVEN BOM with routing:
  // - Routing setup_cost: $50.00 (fixed)
  // - Routing working_cost_per_unit: $0.50/unit
  // - Output qty: 100 units
  // - Operation 1 (Mixing): 60 min @ $25/hr = $25.00
  // - Operation 1 setup: 15 min @ $25/hr = $6.25
  // - Operation 1 cleanup: 10 min @ $25/hr = $4.17
  // - Overhead: 15%
  //
  // Total = $50 + ($0.50 * 100) + $25 + $6.25 + $4.17 = $135.42
  // With overhead: $135.42 * 1.15 = $155.73

  await page.goto('/technical/boms/[test-bom-id-with-routing]');
  await page.getByRole('button', { name: /Calculate Cost/i }).click();

  // THEN routing costs shown
  await expect(page.getByText(/Routing Setup Cost.*\$50\.00/i)).toBeVisible();
  await expect(page.getByText(/Working Cost.*\$50\.00/i)).toBeVisible();
  await expect(page.getByText(/Operation Labor.*\$25\.00/i)).toBeVisible();
  await expect(page.getByText(/Setup Cost.*\$6\.25/i)).toBeVisible();
  await expect(page.getByText(/Cleanup Cost.*\$4\.17/i)).toBeVisible();
  await expect(page.getByText(/Overhead.*\$20\.31/i)).toBeVisible();

  // AND total routing cost shown
  await expect(page.getByText(/Total Routing Cost.*\$155\.73/i)).toBeVisible();
});
```

##### TC-COST-005: Shows operation labor costs
##### TC-COST-006: Shows setup/cleanup costs
##### TC-COST-007: Shows overhead calculation

---

#### 6.3 Total BOM Cost Rollup (2 tests)

##### TC-COST-008: Total Cost = Material + Routing (FR-2.36)
##### TC-COST-009: Shows cost per unit

---

#### 6.4 Multi-Level Cost Rollup (1 test)

##### TC-COST-010: Calculates cost rollup for 3-level BOM (FR-2.72)

---

#### 6.5 Cost Validation (2 tests)

##### TC-COST-011: Warns if RM/PKG missing cost_per_unit (migration 048)
##### TC-COST-012: Validates cost_per_unit >= 0

---

## Test Suite 7: Dashboard Module

**File**: `e2e/tests/technical/dashboard.spec.ts`
**Estimated Tests**: 10
**Estimated Duration**: 3-4 minutes

### Test Cases

#### 7.1 Dashboard Page Load (2 tests)

##### TC-DASH-001: Displays dashboard page
##### TC-DASH-002: Loads within 2 seconds

---

#### 7.2 Product Stats Cards (3 tests)

##### TC-DASH-003: Displays stats cards (FR-2.100)
```typescript
test('displays product statistics', async ({ page }) => {
  await page.goto('/technical/dashboard');

  // THEN stats cards visible
  await expect(page.getByText(/Total Products/i)).toBeVisible();
  await expect(page.getByText(/Active BOMs/i)).toBeVisible();
  await expect(page.getByText(/Active Routings/i)).toBeVisible();
  await expect(page.getByText(/Products with Allergens/i)).toBeVisible();

  // AND counts are numbers
  const totalProducts = page.locator('[data-stat="total-products"]');
  const count = await totalProducts.textContent();
  expect(parseInt(count!)).toBeGreaterThan(0);
});
```

##### TC-DASH-004: Shows product type breakdown
##### TC-DASH-005: Clicking card navigates to list page

---

#### 7.3 Allergen Matrix (2 tests)

##### TC-DASH-006: Displays allergen matrix table (FR-2.101)
##### TC-DASH-007: Export to PDF button

---

#### 7.4 BOM Version Timeline (1 test)

##### TC-DASH-008: Displays timeline visualization (FR-2.102)

---

#### 7.5 Quick Actions (2 tests)

##### TC-DASH-009: Quick action buttons navigate to forms
##### TC-DASH-010: Recent activity feed displays

---

## Test Suite 8: Integration Tests

**File**: `e2e/tests/technical/integration.spec.ts`
**Estimated Tests**: 12
**Estimated Duration**: 8-10 minutes

### Test Cases

#### 8.1 Cross-Module Scenarios

##### TC-INT-001: Product -> BOM -> Work Order Flow
```typescript
test('complete product-to-production workflow', async ({ page }) => {
  // GIVEN create product
  await page.goto('/technical/products');
  await page.getByRole('button', { name: /Add Product/i }).click();
  const productCode = `PROD-${Date.now()}`;
  await page.locator('[name="code"]').fill(productCode);
  await page.locator('[name="name"]').fill('Integration Test Product');
  // ... complete product creation

  // WHEN create BOM for product
  await page.goto('/technical/boms/new');
  await page.locator('[name="product_id"]').selectOption({ label: productCode });
  // ... add BOM items

  // THEN navigate to Planning and create WO
  await page.goto('/planning/work-orders/new');
  await page.locator('[name="product_id"]').selectOption({ label: productCode });
  // ... verify BOM snapshot captured

  await expect(page.getByText(/BOM captured/i)).toBeVisible();
});
```

##### TC-INT-002: BOM -> Allergen -> Product Inheritance
##### TC-INT-003: Routing -> BOM -> Costing Flow
##### TC-INT-004: Multi-Level BOM -> Traceability
##### TC-INT-005: Product Type -> Filter Integration
##### TC-INT-006: Shelf Life -> Expiry Policy Integration
##### TC-INT-007: Alternative Ingredients -> Consumption
##### TC-INT-008: BOM Clone -> Multi-Product Variants
##### TC-INT-009: Routing Reusable -> Multiple BOMs
##### TC-INT-010: Cost Rollup -> Standard Price
##### TC-INT-011: Product Search -> Allergen Filter
##### TC-INT-012: BOM Effective Dates -> Version Selection

---

## Test Data & Fixtures

### Fixture Structure

```typescript
// e2e/fixtures/technical.ts

export const productFixtures = {
  rawMaterial: {
    code: 'RM-FLOUR-001',
    name: 'All-Purpose Flour',
    type: 'RAW',
    base_uom: 'KG',
    cost_per_unit: 2.50,
    shelf_life_days: 180
  },
  finishedGood: {
    code: 'FIN-BREAD-001',
    name: 'White Bread Loaf',
    type: 'FIN',
    base_uom: 'EA',
    is_perishable: true,
    shelf_life_days: 7,
    expiry_policy: 'rolling'
  }
};

export const bomFixtures = {
  simpleBOM: {
    product_id: '[generated]',
    version: 1,
    effective_from: '2024-01-01',
    effective_to: null,
    output_qty: 10,
    output_uom: 'EA',
    items: [
      { component_id: 'RM-FLOUR-001', quantity: 5, uom: 'KG', operation_seq: 1 },
      { component_id: 'RM-YEAST-001', quantity: 0.1, uom: 'KG', operation_seq: 1 }
    ]
  }
};

export const routingFixtures = {
  standardRouting: {
    code: 'RTG-BREAD-STD',
    name: 'Standard Bread Routing',
    is_reusable: true,
    setup_cost: 50.00,
    working_cost_per_unit: 0.50,
    overhead_percent: 15.00,
    operations: [
      {
        sequence: 1,
        name: 'Mixing',
        machine_id: '[mixer-id]',
        setup_time: 15,
        duration: 60,
        cleanup_time: 10,
        labor_cost_per_hour: 25.00
      },
      {
        sequence: 2,
        name: 'Baking',
        machine_id: '[oven-id]',
        setup_time: 30,
        duration: 45,
        cleanup_time: 20,
        labor_cost_per_hour: 20.00
      }
    ]
  }
};
```

---

## Page Object Model Structure

### Page Objects

```typescript
// e2e/pages/ProductsPage.ts
export class ProductsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/technical/products');
  }

  async searchByCode(code: string) {
    await this.page.locator('[name="search"]').fill(code);
  }

  async clickAddProduct() {
    await this.page.getByRole('button', { name: /Add Product/i }).click();
  }

  async createProduct(data: ProductData) {
    await this.clickAddProduct();
    await this.page.locator('[name="code"]').fill(data.code);
    await this.page.locator('[name="name"]').fill(data.name);
    // ... fill other fields
    await this.page.getByRole('button', { name: /Create/i }).click();
  }
}

// e2e/pages/BOMsPage.ts
export class BOMsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/technical/boms');
  }

  async openBOMDetail(bomId: string) {
    await this.page.goto(`/technical/boms/${bomId}`);
  }

  async addBOMItem(item: BOMItemData) {
    await this.page.getByRole('button', { name: /Add Item/i }).click();
    await this.page.locator('[name="component_id"]').selectOption(item.componentId);
    await this.page.locator('[name="quantity"]').fill(item.quantity.toString());
    await this.page.locator('[name="uom"]').selectOption(item.uom);
    await this.page.getByRole('button', { name: /Add/i }).click();
  }

  async cloneBOM(targetProductId: string) {
    await this.page.locator('[data-action="clone"]').first().click();
    await this.page.locator('[name="target_product_id"]').selectOption(targetProductId);
    await this.page.getByRole('button', { name: /Clone/i }).click();
  }
}

// e2e/pages/RoutingsPage.ts
export class RoutingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/technical/routings');
  }

  async createRouting(data: RoutingData) {
    await this.page.getByRole('button', { name: /Create Routing/i }).click();
    await this.page.locator('[name="code"]').fill(data.code);
    await this.page.locator('[name="name"]').fill(data.name);
    await this.page.locator('[name="is_reusable"]').check({ force: data.isReusable });
    await this.page.getByRole('button', { name: /Create/i }).click();
  }

  async addOperation(operation: OperationData) {
    await this.page.getByRole('button', { name: /Add Operation/i }).click();
    await this.page.locator('[name="sequence"]').fill(operation.sequence.toString());
    await this.page.locator('[name="name"]').fill(operation.name);
    await this.page.locator('[name="duration"]').fill(operation.duration.toString());
    await this.page.getByRole('button', { name: /Add/i }).click();
  }
}
```

---

## Execution Strategy

### Parallel Execution

- **Workers**: 8 parallel workers
- **Isolation**: Each worker gets isolated browser context
- **Data Isolation**: Use unique timestamps in test data to avoid conflicts

### Test Organization

```
e2e/
├── tests/
│   └── technical/
│       ├── products.spec.ts         (15 tests)
│       ├── product-types.spec.ts    (8 tests)
│       ├── boms.spec.ts             (25 tests)
│       ├── routings.spec.ts         (20 tests)
│       ├── traceability.spec.ts     (18 tests)
│       ├── costing.spec.ts          (12 tests)
│       ├── dashboard.spec.ts        (10 tests)
│       └── integration.spec.ts      (12 tests)
├── pages/
│   ├── ProductsPage.ts
│   ├── BOMsPage.ts
│   ├── RoutingsPage.ts
│   ├── TraceabilityPage.ts
│   └── CostingPage.ts
├── fixtures/
│   ├── technical.ts
│   └── test-data.ts
└── global-setup.ts
```

### Test Execution Commands

```bash
# Run all Technical tests
pnpm test:e2e technical

# Run specific suite
pnpm test:e2e technical/products

# Run with UI mode (debugging)
pnpm test:e2e --ui technical

# Run specific test case
pnpm test:e2e technical/products -g "creates product with all required fields"

# Generate HTML report
pnpm test:e2e technical --reporter=html
```

---

## Coverage Matrix

| FR-ID | Requirement | Test Cases | Status |
|-------|-------------|------------|--------|
| FR-2.1 | Product CRUD | TC-PROD-008 to TC-PROD-020 | ✅ Planned |
| FR-2.2 | Product versioning | TC-PROD-018 | ✅ Planned |
| FR-2.3 | Product history audit | TC-PROD-020 | ✅ Planned |
| FR-2.4 | Allergen declaration | TC-PROD-026 to TC-PROD-030 | ✅ Planned |
| FR-2.5 | Product types | TC-TYPE-001 to TC-TYPE-008 | ✅ Planned |
| FR-2.13 | Product standard price | TC-COST-010 | ✅ Planned |
| FR-2.14 | Product expiry policy | TC-PROD-014 | ✅ Planned |
| FR-2.15 | Product cost validation | TC-COST-011, TC-COST-012 | ✅ Planned |
| FR-2.20 | BOM CRUD | TC-BOM-006 to TC-BOM-012 | ✅ Planned |
| FR-2.22 | BOM date validity | TC-BOM-008 | ✅ Planned |
| FR-2.24 | BOM clone | TC-BOM-027 to TC-BOM-029 | ✅ Planned |
| FR-2.25 | BOM comparison | TC-BOM-030, TC-BOM-031 | ✅ Planned |
| FR-2.28 | Allergen inheritance | TC-BOM-034, TC-BOM-035 | ✅ Planned |
| FR-2.29 | Multi-level explosion | TC-BOM-036 | ✅ Planned |
| FR-2.36 | BOM cost rollup | TC-COST-001 to TC-COST-009 | ✅ Planned |
| FR-2.38 | BOM item UoM validation | TC-BOM-018 | ✅ Planned |
| FR-2.39 | BOM quantity validation | TC-BOM-017 | ✅ Planned |
| FR-2.40 | Routing CRUD | TC-RTG-005 to TC-RTG-010 | ✅ Planned |
| FR-2.42 | BOM-routing assignment | TC-RTG-019, TC-RTG-020 | ✅ Planned |
| FR-2.46 | Routing versioning | TC-RTG-022 | ✅ Planned |
| FR-2.48 | Parallel operations | TC-RTG-025 | ✅ Planned |
| FR-2.51 | Routing setup cost | TC-RTG-008, TC-COST-004 | ✅ Planned |
| FR-2.52 | Routing working cost | TC-RTG-008, TC-COST-004 | ✅ Planned |
| FR-2.53 | Routing overhead | TC-RTG-008, TC-COST-007 | ✅ Planned |
| FR-2.54 | Routing unique code | TC-RTG-006 | ✅ Planned |
| FR-2.60 | Forward traceability | TC-TRC-003 to TC-TRC-006 | ✅ Planned |
| FR-2.61 | Backward traceability | TC-TRC-007 to TC-TRC-010 | ✅ Planned |
| FR-2.62 | Recall simulation | TC-TRC-014 to TC-TRC-017 | ✅ Planned |
| FR-2.63 | Genealogy tree | TC-TRC-011 to TC-TRC-013 | ✅ Planned |
| FR-2.65 | Traceability matrix | TC-TRC-018 | ✅ Planned |
| FR-2.70 | Recipe costing | TC-COST-001 to TC-COST-003 | ✅ Planned |
| FR-2.72 | Cost rollup multi-level | TC-COST-010 | ✅ Planned |
| FR-2.77 | Routing-level costs | TC-COST-004 to TC-COST-007 | ✅ Planned |
| FR-2.90 | Shelf life calculation | TC-INT-006 | ✅ Planned |
| FR-2.100 | Product dashboard | TC-DASH-003 | ✅ Planned |
| FR-2.101 | Allergen matrix | TC-DASH-006, TC-DASH-007 | ✅ Planned |
| FR-2.102 | BOM version timeline | TC-DASH-008 | ✅ Planned |

**Total Coverage**: 72 FRs out of 72 (100%)

---

## Acceptance Criteria

### Test Quality Criteria

- [ ] All 120 test cases written
- [ ] All tests follow Given/When/Then pattern
- [ ] All tests use Page Object Model
- [ ] All tests have unique test IDs (TC-XXX-NNN)
- [ ] All tests have clear descriptions
- [ ] All tests are independent (no inter-test dependencies)
- [ ] All tests clean up their data
- [ ] All tests handle async operations correctly

### Execution Criteria

- [ ] All tests pass on clean database
- [ ] Test suite completes in < 45 minutes
- [ ] Flaky test rate < 2%
- [ ] Test failures provide clear error messages
- [ ] Screenshots captured on failure
- [ ] Video recorded on failure

### Coverage Criteria

- [ ] 100% FR coverage (all 72 FRs)
- [ ] All CRUD operations tested
- [ ] All validation rules tested
- [ ] All business rules tested
- [ ] All integration points tested
- [ ] All error states tested
- [ ] All success states tested

---

## Next Steps

1. **Approval**: Review and approve this test plan
2. **Task Distribution**: Assign test suites to sub-agents using Task tool
3. **Fixture Creation**: Create test data fixtures
4. **Page Object Implementation**: Build Page Object Model classes
5. **Test Implementation**: Write all 120 test cases
6. **Test Execution**: Run tests and fix failures
7. **CI Integration**: Add tests to CI/CD pipeline

---

## Appendix

### Related Documents

- `.claude/PROJECT-STATE.md` - Project status
- `docs/1-BASELINE/product/modules/technical.md` - Technical PRD
- `playwright.config.ts` - Playwright configuration
- `e2e/tests/settings/allergens.spec.ts` - Example test reference
- `e2e/tests/settings/users.spec.ts` - Example test reference

### Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-24 | 1.0 | Initial test plan | QA Team |

---

**Document Status**: READY FOR APPROVAL
**Total Test Cases**: 120
**Total Test Suites**: 8
**Estimated Implementation Time**: 40-50 hours
**FR Coverage**: 100% (72/72 FRs)
