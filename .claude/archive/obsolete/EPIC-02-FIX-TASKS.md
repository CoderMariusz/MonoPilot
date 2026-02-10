# EPIC 02 - Technical Module: Fix Task List

**Status**: READY FOR ASSIGNMENT
**Total Tasks**: 7 major + 42 specific locator fixes
**Estimated Total Time**: 12-16 hours
**Blocking**: Yes - All E2E tests blocked

---

## PRIORITY 1: CRITICAL PATH (P0) - 12+ hours

### TASK-001: Fix BOMsPage Heading Selector (P0, 2h, frontend-dev)

**Affects**: TC-BOM-001, TC-BOM-003, TC-BOM-004, TC-BOM-024, TC-BOM-025, TC-BOM-032 (6 tests)

**Files**:
- `e2e/pages/BOMsPage.ts` - Line 92 (expectPageHeader method)
- `apps/frontend/app/(authenticated)/technical/boms/page.tsx` - Check actual heading

**Root Cause**:
- Page object expects: `getByRole('heading', { name: /boms?|recipe/i })`
- Actual page has different heading structure or text

**Steps**:
1. Open BOMsPage.tsx page in browser → inspect heading element
2. Get actual heading text and structure
3. Update BOMsPage.ts expectPageHeader() with correct selector
4. Test with local runner to verify

**Expected Selector Options** (test each):
```typescript
// Option 1: Check actual heading role
await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

// Option 2: Use data-testid
await expect(page.locator('[data-testid="page-heading"]')).toBeVisible();

// Option 3: Use heading text as-is in page
await expect(page.getByRole('heading', { name: /Bills of Materials|BOMs/i })).toBeVisible();

// Option 4: Use CSS class selector
await expect(page.locator('h1.page-title')).toBeVisible();
```

**Verification**: Run `TC-BOM-001` - should pass when correct selector found

---

### TASK-002: Fix BOMsPage Create Form Selector (P0, 2h, frontend-dev)

**Affects**: TC-BOM-006 through TC-BOM-020 (12 tests)

**Files**:
- `e2e/pages/BOMsPage.ts` - Line 187 (expectBOMFormOpen method)
- `apps/frontend/app/(authenticated)/technical/boms/[bomId]/page.tsx` - Check form structure

**Root Cause**:
- Page object expects: `locator('form')`
- Actual form might be in dialog/drawer/modal with different selector

**Steps**:
1. Click "Create BOM" button in deployed app → inspect modal/drawer
2. Check if form is in `<Dialog>`, `<Drawer>`, `<Sheet>`, or direct `<form>`
3. Get data-testid or role attribute
4. Update BOMsPage.ts expectBOMFormOpen() method

**Expected Selector Options** (test each):
```typescript
// Option 1: Dialog wrapper
await expect(page.locator('[role="dialog"]')).toBeVisible();

// Option 2: Specific form ID
await expect(page.locator('form[id="bom-form"], form[name="bomForm"]')).toBeVisible();

// Option 3: Data-testid
await expect(page.locator('[data-testid="bom-create-form"]')).toBeVisible();

// Option 4: Drawer variant
await expect(page.locator('[role="complementary"], .drawer')).toBeVisible();
```

**Verification**: Run `TC-BOM-006` - should pass when correct selector found

---

### TASK-003: Fix DataTablePage Filter Button Selector (P0, 1h, frontend-dev)

**Affects**: TC-BOM-003, TC-BOM-004, TC-PROD-005, TC-PROD-006, TC-TYPE-002, TC-RTG-003, TC-RTG-004 (7 tests)

**Files**:
- `e2e/pages/DataTablePage.ts` - Line 56 (openFilters method)

**Root Cause**:
- Page object expects: `'button:has-text("Filter")'`
- Actual button might have different text/icon or use aria-label

**Steps**:
1. Navigate to any data table page (e.g., /technical/boms)
2. Inspect Filter button DOM
3. Check button text, aria-label, data-testid, or icon
4. Update DataTablePage.ts openFilters() method

**Expected Selector Options** (test each):
```typescript
// Option 1: By exact text
await this.page.click('button:has-text("Filter")');

// Option 2: By aria-label
await this.page.click('button[aria-label*="ilter"]');

// Option 3: By data-testid
await this.page.click('[data-testid="open-filters-button"]');

// Option 4: By icon class (if using icon)
await this.page.click('button:has(svg[data-icon="filter"])');

// Option 5: ShadCN Button pattern
await this.page.click('button[aria-haspopup="dialog"]:has-text("Filter")');
```

**Verification**: Run TC-BOM-003 - should pass when correct selector found

---

### TASK-004: Fix ProductsPage Header and List Selectors (P0, 2h, frontend-dev)

**Affects**: TC-PROD-001, TC-PROD-002, TC-PROD-005, TC-PROD-006, TC-PROD-007 (5 tests)

**Files**:
- `e2e/pages/ProductsPage.ts` - Check expectPageHeader(), expectTableVisible()
- `apps/frontend/app/(authenticated)/technical/products/page.tsx` - Check structure

**Root Cause**:
- Multiple selector issues in ProductsPage for heading and table

**Steps**:
1. Open Products page in deployed app
2. Inspect page heading structure
3. Inspect data table structure (columns, headers, filters, pagination)
4. Update ProductsPage.ts with all correct selectors
5. Focus on: expectPageHeader, expectTableVisible, getTableRows, openCreateProductModal

**Affected Methods**:
- expectPageHeader() → Fix heading selector (similar to Task-001)
- expectTableVisible() → Verify table render selector
- openFilters() → Should use DataTablePage fix from Task-003

**Verification**: Run TC-PROD-001 through TC-PROD-007 - should all pass

---

### TASK-005: Fix ProductsPage Modal Selectors (P0, 3h, frontend-dev)

**Affects**: TC-PROD-008 through TC-PROD-020, TC-PROD-026 through TC-PROD-030 (19 tests)

**Files**:
- `e2e/pages/ProductsPage.ts` - All modal/drawer methods
- `apps/frontend/app/(authenticated)/technical/products/page.tsx` - Modal structure
- `apps/frontend/app/(authenticated)/technical/products/[productId]/page.tsx` - Detail page

**Root Cause**:
- Create/edit modals and product detail page have selector mismatches
- Allergen management modal missing or has wrong selector

**Methods to Fix**:
```
openCreateProductModal() → Check dialog/drawer for create form
expectCreateModalOpen() → Verify modal visibility
fillProductForm() → Get correct form input selectors
submitForm() → Get correct submit button
openEditDrawer() → Check drawer for edit form
openAllergenModal() → Check allergen modal
```

**Steps**:
1. For Create Modal: Click "Add Product" → inspect modal
2. For Edit Drawer: Click edit icon on product row → inspect drawer
3. For Detail Page: Click product name → inspect detail page structure
4. For Allergen Modal: Click allergen button → inspect modal
5. Update all selectors in ProductsPage.ts

**Expected Fixes**:
```typescript
// Create Modal
clickAddProductButton() {
  // Update selector - check actual button text
  await this.page.click('button:has-text("Add Product")'); // or correct selector
}

// Edit Drawer
clickEditProductButton(productId: string) {
  // May need to use row selector first
  await this.page.click(`button[aria-label="Edit product ${productId}"]`);
}

// Detail Page Navigation
clickProductName(name: string) {
  // Check if clicking row or link
  await this.page.click(`a:text("${name}")`);
}
```

**Verification**: Run TC-PROD-008 through TC-PROD-030 - should pass after fixes

---

### TASK-006: Fix RoutingsPage Selectors (P0, 3h, frontend-dev)

**Affects**: TC-RTG-001 through TC-RTG-027 (27 tests)

**Files**:
- `e2e/pages/RoutingsPage.ts` - ALL methods need verification
- `apps/frontend/app/(authenticated)/technical/routings/page.tsx` - List page
- `apps/frontend/app/(authenticated)/technical/routings/[routingId]/page.tsx` - Detail page

**Root Cause**:
- Multiple selector issues across list, create, detail, and operations management

**Methods to Fix**:
1. **List Page Selectors**:
   - expectPageHeader() → Heading selector
   - expectTableVisible() → Table structure
   - openFilters() → Filter button (use Task-003 fix)
   - filterByReusable() → Filter checkbox
   - filterByStatus() → Filter dropdown

2. **Create Form Selectors**:
   - openCreateRoutingForm() → Modal/drawer
   - fillRoutingForm() → Form inputs
   - submitForm() → Submit button

3. **Detail Page Selectors**:
   - navigateToRoutingDetail() → Detail page navigation
   - addOperationForm() → Operation modal
   - deleteOperation() → Delete button for operations
   - reorderOperations() → Drag-drop or reorder UI

4. **Operations Management Selectors**:
   - openOperationModal() → Modal for adding operations
   - fillOperationFields() → Time, cost, sequence fields
   - saveOperation() → Save button

**Steps**:
1. Open Routings list page → inspect all elements
2. Click Create Routing → inspect modal/form
3. Open routing detail → inspect detail page
4. Add operation → inspect operation modal
5. Update all selectors in RoutingsPage.ts

**Verification**: Run TC-RTG-001 through TC-RTG-027 - should pass after fixes

---

### TASK-007: Create TraceabilityPage Object (P0, 3h, frontend-dev)

**Affects**: TC-TRC-001 through TC-TRC-017 (17 tests)

**Files**:
- `e2e/pages/TraceabilityPage.ts` - MISSING - CREATE NEW FILE
- `apps/frontend/app/(authenticated)/technical/traceability/page.tsx` - Traceability page

**Root Cause**:
- TraceabilityPage object doesn't exist - all tests fail immediately

**Requirements**:
Create new file with methods for:

```typescript
export class TraceabilityPage {
  constructor(private page: Page) {}

  // Search/Input Methods
  async enterLotNumber(lotNumber: string) { }
  async selectSearchType(type: 'forward' | 'backward' | 'genealogy' | 'recall') { }
  async clickSearch() { }

  // Results Display
  async expectResultsVisible() { }
  async getResultsCount(): Promise<number> { }
  async getResultsRows() { }

  // Action Buttons
  async clickForwardTraceability() { }
  async clickBackwardTraceability() { }
  async clickGenealogyTree() { }
  async clickRecallSimulation() { }

  // Result Details
  async getConsumptionDetails() { }
  async getDownstreamProducts() { }
  async getUpstreamRawMaterials() { }
  async getAffectedQuantity(): Promise<number> { }

  // Tree View (Genealogy)
  async expandTreeNode(nodeId: string) { }
  async collapseTreeNode(nodeId: string) { }
  async expectTreeVisible() { }

  // Export
  async exportToCSV() { }
  async expectExportButton() { }
}
```

**Steps**:
1. Inspect `/technical/traceability` page structure
2. Identify all interactive elements (search inputs, result areas, tree views, buttons)
3. Create page object with proper selectors
4. Test with TC-TRC-001

**Expected Elements**:
- Search input for lot number
- Dropdown for search type selection
- Search button
- Results table/tree area
- Action buttons (Forward, Backward, Genealogy, Recall)
- Tree view for genealogy
- Export button for CSV

**Verification**: Run TC-TRC-001 through TC-TRC-017 - should all pass

---

## PRIORITY 2: HIGH PRIORITY (P1) - 2-3 hours

### TASK-008: Fix ProductTypesPage Selectors (P1, 1.5h, frontend-dev)

**Affects**: TC-TYPE-001 through TC-TYPE-008 (8 tests)

**Files**:
- `e2e/pages/ProductTypesPage.ts`
- `apps/frontend/app/(authenticated)/technical/product-types/page.tsx`

**Methods to Fix**:
- expectPageHeader() → Heading selector
- expectTableVisible() → Table structure
- openCreateModal() → Create modal
- fillProductTypeForm() → Form inputs
- openEditModal() → Edit modal
- verifyProductCountLink() → Link selector

**Verification**: Run TC-TYPE-001 through TC-TYPE-008 - should pass

---

### TASK-009: Fix Dashboard Performance (P2, 1h, frontend-dev)

**Affects**: TC-DASH-002 (1 test)

**Files**:
- `e2e/tests/technical/dashboard.spec.ts` - Line 50

**Root Cause**:
- Dashboard takes >2 seconds to load

**Steps**:
1. Profile dashboard page load time
2. Identify slow operations (API calls, renders, computations)
3. Optimize or increase timeout threshold
4. Re-test

**Options**:
- Increase timeout from 2s to 3s (quick fix)
- Lazy-load dashboard components
- Cache dashboard data
- Optimize dashboard queries

**Verification**: Run TC-DASH-002 - should pass

---

## INTEGRATION TEST FIXES

### TASK-010: Fix Integration Tests (P0, depends on Tasks 1-7)

**Affects**: TC-INT-001 through TC-INT-012 (12 tests)

**Root Cause**:
- All integration tests depend on Products, BOMs, and Routings page selectors being correct
- Once Tasks 1-7 are complete, integration tests should pass

**Steps**:
1. Complete Tasks 1-7 first
2. Run integration tests
3. If still failing, debug individual steps

**Verification**: Run TC-INT-001 through TC-INT-012 - should pass after parent tasks complete

---

## SELECTOR VERIFICATION CHECKLIST

For each task, verify selectors work with this process:

```bash
# 1. Start test in debug mode
pnpm exec playwright test --debug

# 2. In browser dev tools, test each selector
page.locator('[data-testid="page-heading"]').first().isVisible()
// true = selector works

# 3. If false, try alternatives
page.getByRole('heading', { level: 1 })
page.locator('h1')
page.locator('.page-title')

# 4. Update page object once verified
# 5. Run full test suite for that module
```

---

## File Locations for Reference

### Page Object Files (to update)
```
e2e/pages/
├── BOMsPage.ts ......................... 92, 187
├── DataTablePage.ts ..................... 56
├── ProductsPage.ts ...................... Multiple
├── RoutingsPage.ts ...................... Multiple
├── ProductTypesPage.ts .................. Multiple
├── TraceabilityPage.ts .................. (CREATE NEW)
└── DashboardPage.ts ..................... (may need timeout fix)
```

### Frontend Components (to inspect)
```
apps/frontend/app/(authenticated)/technical/
├── boms/page.tsx ........................ Check heading, form
├── products/page.tsx .................... Check heading, modal, table
├── products/[productId]/page.tsx ........ Check detail page
├── product-types/page.tsx ............... Check heading, modal
├── routings/page.tsx .................... Check heading, modal, table
├── routings/[routingId]/page.tsx ........ Check detail page
├── traceability/page.tsx ................ Check all UI elements
└── dashboard/page.tsx ................... Check performance
```

---

## Task Assignment Recommendations

### Agent: FRONTEND-DEV (estimated 12-16 hours)
- All 7 main fix tasks
- Update page objects
- Verify selectors
- Run local test validation

### Agent: TEST-WRITER (estimated 2-3 hours post-fixes)
- Review selector updates
- Create unit tests for page object methods
- Document new TraceabilityPage object

### Agent: QA-AGENT (estimated 1 hour post-fixes)
- Run full E2E test suite
- Verify all 160 tests pass
- Generate test report

---

## Success Criteria

All tasks complete when:
- [ ] All 114 failing tests pass
- [ ] 160/160 tests passing
- [ ] No timeout errors
- [ ] No "element not found" errors
- [ ] Full E2E test suite runs in <30 minutes

---

## Rollback Plan

If fixes cause regression:
1. Keep git history of changes
2. Can revert individual page object changes
3. Test each selector change in isolation
4. Use `git diff` to verify changes

---

## Testing Command

```bash
# Run all technical module tests
pnpm test:e2e e2e/tests/technical

# Run specific test file
pnpm test:e2e e2e/tests/technical/boms.spec.ts

# Run specific test
pnpm test:e2e e2e/tests/technical/boms.spec.ts -g "TC-BOM-001"

# Debug mode
pnpm test:e2e --debug
```

---

## Notes

- All failures are selector/DOM-related, NOT logic errors
- Fixes are localized to page objects, not core code
- Can parallelize fixes across modules
- Should fix 100% of failures once selectors corrected
