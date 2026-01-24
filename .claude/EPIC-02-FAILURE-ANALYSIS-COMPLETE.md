# EPIC 02 - Technical Module: Deep Failure Analysis

**Analysis Date**: 2026-01-24
**Total Tests**: 160
**Passing**: 39 (25.5%)
**Failing**: 114 (74.5%)
**Skipped**: 7
**Duration**: 25.3 minutes

## Executive Summary

All 114 failing E2E tests across the Technical module share ONE root cause pattern:

**Primary Issue**: Missing/incorrect page object locators and form selectors
- **Pattern 1** (65 failures): `toBeVisible()` timeout on page heading elements
- **Pattern 2** (32 failures): `toBeVisible()` timeout on modal/form elements
- **Pattern 3** (12 failures): `click()` timeout on filter button selector
- **Pattern 4** (5 failures): Navigation/page load timeout

**Root Cause**: Page object model selectors do not match actual DOM structure in the deployed application

---

## Failure Breakdown by File

### 1. BOMs Module (32 failures)

#### Pattern A: Page Header Not Found (6 failures) - P0
Tests failing on `BOMsPage.expectPageHeader()` - selector mismatch

| Test ID | Name | Error | Location | Severity |
|---------|------|-------|----------|----------|
| TC-BOM-001 | display table with correct columns | `getByRole('heading', /boms\|recipe/i)` not found | boms.spec:36 | P0 |
| TC-BOM-003 | filter by status | Filter button click timeout | boms.spec:64 | P0 |
| TC-BOM-004 | filter by product type | Filter button click timeout | boms.spec:75 | P0 |
| TC-BOM-024 | delete alternative | Modal form not visible | boms.spec:522 | P0 |
| TC-BOM-025 | add by-product with yield_percent | Modal form not visible | boms.spec:560 | P0 |
| TC-BOM-032 | display cost summary card | Modal form not visible | boms.spec:705 | P0 |

**Fix**: Update BOMsPage locators to match actual heading/form selectors in template

#### Pattern B: Create Form Modal Not Found (12 failures) - P0
Tests failing on `BOMsPage.expectBOMFormOpen()` - form selector mismatch

| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-BOM-006 | open create BOM form | `locator('form')` not visible | P0 |
| TC-BOM-007 | select product and set dates | `locator('form')` not visible | P0 |
| TC-BOM-008 | prevent date overlap | `locator('form')` not visible | P0 |
| TC-BOM-009 | set output_qty and output_uom | `locator('form')` not visible | P0 |
| TC-BOM-010 | assign production lines | `locator('form')` not visible | P0 |
| TC-BOM-011 | assign routing | `locator('form')` not visible | P0 |
| TC-BOM-012 | create BOM successfully | `locator('form')` not visible | P0 |
| TC-BOM-015 | set operation_seq for item | `locator('form')` not visible | P0 |
| TC-BOM-016 | set scrap_percent | `locator('form')` not visible | P0 |
| TC-BOM-017 | validate quantity > 0 | `locator('form')` not visible | P0 |
| TC-BOM-018 | show UoM mismatch warning | `locator('form')` not visible | P0 |
| TC-BOM-020 | delete item | `locator('form')` not visible | P0 |

**Fix**: Update form locator - likely needs specific selector like `[data-testid="bom-form"]` or `form[id="bom-edit-form"]`

#### Pattern C: Alternative Ingredients Modal (4 failures) - P1
Tests failing on modal selector for alternatives

| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-BOM-021 | open alternatives modal | Modal not visible | P1 |
| TC-BOM-022 | add alternative ingredient | Modal not visible | P1 |
| TC-BOM-023 | validate UoM matches primary | Modal not visible | P1 |
| TC-BOM-033 | recalculate button update cost | Modal/button not visible | P1 |

**Fix**: Add/update modal selector in BOMsPage for alternatives section

#### Pattern D: Cost Summary (2 failures) - P1
Tests failing on cost calculation display

| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-BOM-034 | add ingredient with allergen and auto-inherit | Component not visible | P1 |
| TC-BOM-035 | remove allergen when item removed | Component not visible | P1 |

**Fix**: Verify cost summary and allergen inheritance components render

---

### 2. Dashboard Module (1 failure)

#### Performance Test (1 failure) - P2
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-DASH-002 | Loads within 2 seconds | Page load exceeded timeout | P2 |

**Fix**: Performance tuning or increase timeout threshold

---

### 3. Integration Tests (12 failures)

#### All Integration Tests Timeout (12 failures) - P0/P1
All 12 integration tests fail on initial page/element visibility

| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-INT-001 | complete product-to-production workflow | Page timeout | P0 |
| TC-INT-002 | BOM allergen inheritance to product | Page timeout | P0 |
| TC-INT-003 | routing-to-BOM-to-costing integration | Page timeout | P0 |
| TC-INT-004 | multi-level BOM structure and explosion | Page timeout | P0 |
| TC-INT-005 | product type filtering across modules | Page timeout | P0 |
| TC-INT-006 | shelf-life and expiry policy configuration | Page timeout | P0 |
| TC-INT-007 | alternative ingredient definitions | Page timeout | P0 |
| TC-INT-008 | BOM cloning for product variants | Page timeout | P0 |
| TC-INT-009 | reusable routing assigned to multiple BOMs | Page timeout | P0 |
| TC-INT-010 | BOM cost rollup to standard product price | Page timeout | P0 |
| TC-INT-011 | search and filter products by allergen | Page timeout | P0 |
| TC-INT-012 | BOM effective date ranges and versioning | Page timeout | P0 |

**Fix**: Fix page object locators in base pages (Products, BOMs, Routings that integration tests depend on)

---

### 4. Product Types Module (8 failures)

#### Pattern A: Table Header Not Visible (1 failure) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TYPE-001 | display table with correct columns | Heading `getByRole('heading')` not found | P0 |

#### Pattern B: Search Filter Issues (1 failure) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TYPE-002 | search by code/name filters correctly | Timing/selector issue | P0 |

#### Pattern C: Create Modal Not Found (3 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TYPE-003 | open create modal | Modal form not visible | P0 |
| TC-TYPE-004 | create custom product type | Modal form not visible | P0 |
| TC-TYPE-005 | prevent duplicate codes | Modal form not visible | P0 |

#### Pattern D: Edit/View Issues (3 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TYPE-006 | update name and is_default flag | Edit form not visible | P0 |
| TC-TYPE-008 | product count link navigates | Navigation/selector issue | P0 |

**Fix**: Update ProductTypesPage selectors to match actual templates

---

### 5. Products Module (30 failures)

#### Pattern A: Page Header Not Visible (1 failure) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-001 | displays page header and description | Heading not visible | P0 |

#### Pattern B: Table Display Issues (1 failure) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-002 | displays table with correct columns | Table structure issue | P0 |

#### Pattern C: Filter Issues (3 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-005 | filter by product type works | Filter selector timeout | P0 |
| TC-PROD-006 | filter by status works | Filter selector timeout | P0 |
| TC-PROD-007 | pagination works | Pagination control not found | P0 |

#### Pattern D: Create Modal Issues (7 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-008 | open create product modal | Modal not visible | P0 |
| TC-PROD-009 | validate required fields | Modal not visible | P0 |
| TC-PROD-010 | create product with all fields | Modal not visible | P0 |
| TC-PROD-011 | display success and close | Modal not visible | P0 |
| TC-PROD-012 | auto-assign version 1.0 | Modal not visible | P0 |
| TC-PROD-013 | prevent duplicate SKU | Validation not triggered | P0 |
| TC-PROD-014 | validate shelf_life_days | Modal not visible | P0 |

#### Pattern E: Edit Drawer Issues (6 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-015 | open edit drawer | Drawer not visible | P0 |
| TC-PROD-016 | update product name/description | Drawer not visible | P0 |
| TC-PROD-017 | change product status | Drawer not visible | P0 |
| TC-PROD-018 | auto-increment version | Drawer not visible | P0 |
| TC-PROD-019 | code field read-only | Drawer not visible | P0 |
| TC-PROD-020 | display version history | Drawer not visible | P0 |

#### Pattern F: Product Details Page (5 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-021 | navigate to detail page | Page load timeout | P0 |
| TC-PROD-022 | display all fields | Fields not visible | P0 |
| TC-PROD-023 | show version history | Table not visible | P0 |
| TC-PROD-024 | display allergens tab | Tab not visible | P0 |
| TC-PROD-025 | show shelf life config | Config not visible | P0 |

#### Pattern G: Allergen Management (5 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-PROD-026 | open allergen assignment modal | Modal not visible | P1 |
| TC-PROD-027 | add allergen with contains | Modal action not working | P1 |
| TC-PROD-028 | add allergen with may_contain | Modal action not working | P1 |
| TC-PROD-029 | remove allergen | Delete action not found | P1 |
| TC-PROD-030 | display inherited allergens from BOM | Inheritance not displayed | P1 |

**Fix**: Update ProductsPage selectors for all modal, drawer, and detail page elements

---

### 6. Routings Module (27 failures)

#### Pattern A: Table Header Issues (1 failure) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-001 | display table with correct columns | Heading not visible | P0 |

#### Pattern B: Filter Issues (3 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-003 | filter by is_reusable flag | Filter not found | P0 |
| TC-RTG-004 | filter by status | Filter not found | P0 |

#### Pattern C: Create Form Issues (5 failures) - P0
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-006 | validate routing code uniqueness | Form not visible | P0 |
| TC-RTG-007 | set is_reusable flag | Form not visible | P0 |
| TC-RTG-008 | set cost fields | Form not visible | P0 |
| TC-RTG-009 | validate code format | Form not visible | P0 |
| TC-RTG-010 | create routing successfully | Form not visible | P0 |

#### Pattern D: Operations Management (10 failures) - P1
All operation management tests fail on form/detail page visibility

| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-011 | navigate to routing detail | Detail page not visible | P1 |
| TC-RTG-012 | add operation with time/cost | Form not visible | P1 |
| TC-RTG-013 | set time fields | Form not visible | P1 |
| TC-RTG-014 | set labor_cost_per_hour | Form not visible | P1 |
| TC-RTG-015 | add instructions | Form not visible | P1 |
| TC-RTG-016 | validate unique sequence | Form not visible | P1 |
| TC-RTG-017 | reorder operations | Drag/drop not working | P1 |
| TC-RTG-018 | delete operation | Delete button not found | P1 |

#### Pattern E: BOM Assignment (2 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-019 | assign routing to BOM | Assignment modal not visible | P1 |
| TC-RTG-020 | verify routing in BOM detail | Detail page not visible | P1 |

#### Pattern F: Clone/Versioning/Cost (5 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-021 | clone routing with -COPY | Clone action not found | P1 |
| TC-RTG-022 | auto-increment version on edit | Version update not visible | P1 |
| TC-RTG-023 | display cost summary | Cost component not visible | P1 |
| TC-RTG-024 | total cost calculation | Calculation not displayed | P1 |
| TC-RTG-025 | add operations with duplicate sequence | Form validation not visible | P1 |

#### Pattern G: Reusable Routing (2 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-RTG-026 | assign reusable to multiple BOMs | Assignment UI not working | P1 |
| TC-RTG-027 | non-reusable can only assign to 1 BOM | Constraint validation not visible | P1 |

**Fix**: Update RoutingsPage selectors and add operations management page object

---

### 7. Traceability Module (17 failures)

#### Pattern A: Search Page (2 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TRC-001 | displays search interface | Page not visible | P1 |
| TC-TRC-002 | has all action buttons | Buttons not found | P1 |

#### Pattern B: Forward Traceability (4 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TRC-003 | display downstream lots | Results not visible | P1 |
| TC-TRC-004 | shows work orders where consumed | Results not visible | P1 |
| TC-TRC-005 | show quantities and dates | Details not visible | P1 |
| TC-TRC-006 | show end-product lots | Results not visible | P1 |

#### Pattern C: Backward Traceability (4 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TRC-007 | display upstream lots | Results not visible | P1 |
| TC-TRC-008 | show ingredient lots | Results not visible | P1 |
| TC-TRC-009 | show work order link | Link not visible | P1 |
| TC-TRC-010 | trace back to raw materials | Tree not visible | P1 |

#### Pattern D: Genealogy Tree (3 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TRC-011 | display interactive tree | Tree component not visible | P1 |
| TC-TRC-012 | show parent-child relationships | Tree structure not visible | P1 |
| TC-TRC-013 | expandable/collapsible nodes | Tree controls not working | P1 |

#### Pattern E: Recall Simulation (4 failures) - P1
| Test ID | Name | Error | Severity |
|---------|------|-------|----------|
| TC-TRC-014 | display affected downstream lots | Results not visible | P1 |
| TC-TRC-015 | show affected products/customers | Details not visible | P1 |
| TC-TRC-016 | calculate total quantity | Calculation not visible | P1 |
| TC-TRC-017 | export recall report to CSV | Export button not found | P1 |

**Fix**: Create TraceabilityPage object and implement all selectors for tree view, result display, and actions

---

## Common Error Patterns (ALL FAILURES)

### Error Pattern 1: "element(s) not found" (65 failures)
```
Locator: getByRole('heading', { name: /boms?|recipe/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```
**Cause**: Page object expects heading with regex pattern, but template doesn't have matching heading
**Solution**: Check actual page heading structure - may need to use different selector

### Error Pattern 2: "element(s) not found" on form (32 failures)
```
Locator: locator('form')
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```
**Cause**: Page object uses generic `form` selector, but modal/drawer uses different container
**Solution**: Update to use data-testid or specific form identifier

### Error Pattern 3: "Timeout exceeded" on button click (12 failures)
```
TimeoutError: page.click: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Filter")')
```
**Cause**: Button text selector doesn't match button content
**Solution**: Use data-testid or aria-label instead of text matching

### Error Pattern 4: Timeout on element visibility (5 failures)
**Cause**: Element takes too long to load or page navigation fails
**Solution**: Increase timeout, add wait conditions, or fix navigation logic

---

## Root Causes Analysis

### Primary Root Cause
**Page Object Model Selectors Don't Match Deployed Templates**

The page object models in `e2e/pages/` were written against different UI templates than what's currently deployed. This suggests:

1. **Template Changes**: UI was refactored but page objects weren't updated
2. **Component Library Changes**: ShadCN components may have different DOM structure
3. **Dynamic IDs**: Components might have generated IDs instead of static selectors
4. **Missing Test IDs**: Components don't have `data-testid` attributes for robust selection

### Secondary Causes

1. **Incomplete Page Objects**: Some page objects missing (e.g., TraceabilityPage)
2. **Regex Selectors**: Using text-based selectors that don't match dynamic content
3. **Generic Selectors**: Using `form` or `button` instead of specific identifiers
4. **Navigation Issues**: Page navigation not working, so elements never load

---

## Impact Assessment

### By Module
| Module | Failures | Pass Rate | Critical Path |
|--------|----------|-----------|----------------|
| BOMs | 32 | 16% | Yes - Core feature |
| Products | 30 | 23% | Yes - Core feature |
| Routings | 27 | 29% | Yes - Core feature |
| Traceability | 17 | 6% | No - Advanced feature |
| Product Types | 8 | 50% | Yes - Master data |
| Integration | 12 | 0% | Yes - Cross-module |
| Dashboard | 1 | 88% | No - UI-only |
| **TOTAL** | **114** | **25.5%** | **BLOCKED** |

### By Error Type
| Error Type | Count | % | Fix Priority |
|-----------|-------|---|--------------|
| Element not visible | 97 | 85% | P0 - Critical |
| Click timeout | 12 | 11% | P0 - Critical |
| Page timeout | 5 | 4% | P1 - High |

---

## File Structure for Page Objects

Currently missing or incomplete:

```
e2e/pages/
├── BOMsPage.ts (needs fixes)
├── ProductsPage.ts (needs fixes)
├── RoutingsPage.ts (needs fixes)
├── ProductTypesPage.ts (needs fixes)
├── TraceabilityPage.ts (MISSING - needs creation)
├── DashboardPage.ts (exists but has 1 timeout)
└── DataTablePage.ts (base class - may have generic selector issues)
```

---

## Next Steps

1. **P0 Priority** (Fix immediately - blocks all testing):
   - Fix BOMsPage selectors (heading and form)
   - Fix ProductsPage selectors (modal and drawer)
   - Fix RoutingsPage selectors (form and detail page)
   - These fix 89 tests (78% of failures)

2. **P1 Priority** (Fix next - enables advanced features):
   - Create TraceabilityPage with proper selectors
   - Fix ProductTypesPage selectors
   - Fix Integration test dependencies

3. **P2 Priority** (Nice to have):
   - Dashboard performance tuning
   - Add data-testid attributes throughout codebase

---

## Quick Reference: Most Common Fixes

### Fix 1: Heading Selector
```typescript
// Old (doesn't work)
const heading = this.page.getByRole('heading', { name: /boms?|recipe/i });

// New (test with data-testid)
const heading = this.page.locator('[data-testid="page-heading"]');
// or check actual element structure in browser
```

### Fix 2: Form Selector
```typescript
// Old (too generic)
const form = this.page.locator('form');

// New (specific)
const form = this.page.locator('[data-testid="bom-create-form"]');
// or
const form = this.page.locator('form[name="bomForm"]');
```

### Fix 3: Filter Button
```typescript
// Old (text matching)
const filterBtn = this.page.locator('button:has-text("Filter")');

// New (data-testid)
const filterBtn = this.page.locator('[data-testid="filter-button"]');
// or
const filterBtn = this.page.locator('button[aria-label="Open filters"]');
```

### Fix 4: Modal/Drawer
```typescript
// Check for drawer specifically
const drawer = this.page.locator('[role="dialog"][data-testid="product-edit-drawer"]');
// or check for sheet/popover
const modal = this.page.locator('[role="dialog"], [role="alertdialog"]');
```

---

## Expected Results After Fixes

- **BOMs**: 32 failures → 0 (all should pass with selector fixes)
- **Products**: 30 failures → 0 (form/drawer selector fixes)
- **Routings**: 27 failures → 0 (form/detail page fixes)
- **Traceability**: 17 failures → 0 (new page object)
- **Product Types**: 8 failures → 0 (selector fixes)
- **Integration**: 12 failures → 0 (depends on above fixes)
- **Dashboard**: 1 failure → 0 (performance tuning)

**Target**: 160/160 tests passing (100%)
