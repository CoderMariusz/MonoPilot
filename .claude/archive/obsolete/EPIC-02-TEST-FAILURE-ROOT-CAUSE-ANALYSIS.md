# Epic 02 Test Failure Root Cause Analysis

**Date**: 2026-01-24
**Test Run**: epic-02-COMPLETE-final.log
**Total Tests**: 164
**Passed**: 93 (56.7%)
**Failed**: 62 (37.8%)
**Skipped**: 9 (5.5%)

---

## 1. Executive Summary

After analyzing all 62 failing tests, the root cause is **NOT missing features or Phase 2 functionality**. The vast majority of failures (95%+) are caused by:

1. **UI Implementation Mismatch** - Page Object selectors don't match actual UI component structure
2. **Form Validation Blocking Submit** - "Create Product" / "Save BOM" buttons are disabled because form validation fails
3. **Product Creation Failures** - Products created in tests don't appear in the table (cascade failure)
4. **Missing UI Components** - Some expected UI elements (cost summary, version history tabs) are not implemented in the actual pages

**Key Finding**: ALL failing tests reference features marked as **"Done"** in the PRD. This is NOT a Phase 2 features issue - it's a **test-to-implementation mismatch** issue.

---

## 2. Error Pattern Analysis

### Top 10 Error Patterns (by frequency)

| # | Error Pattern | Count | Root Cause |
|---|--------------|-------|------------|
| 1 | `button disabled - element is not enabled` | 18 | Form validation fails, submit button stays disabled |
| 2 | `waiting for locator('table tbody tr').filter({ hasText: '...' })` | 15 | Product not created/found in table |
| 3 | `element(s) not found` - operation/component name | 10 | Operation add form doesn't save correctly |
| 4 | `getByRole('tab', { name: /allergen/i })` timeout | 5 | Allergens tab doesn't exist or has different name |
| 5 | `input[name="..."]` not found | 5 | Form field names don't match Page Object expectations |
| 6 | `[role="dialog"]` issues (overlay intercepts clicks) | 4 | Modal overlay animation timing issue |
| 7 | `waitForLoadState('networkidle')` timeout | 3 | Page keeps making network requests |
| 8 | `this.dataTable.nextPage is not a function` | 1 | Page Object method not implemented |
| 9 | `strict mode violation: resolved to 2 elements` | 1 | Multiple matching buttons (Add Item) |
| 10 | Performance: load time > 3000ms | 1 | Dashboard loads in 6434ms (expected < 3000ms) |

---

## 3. MVP vs Phase 2 Breakdown

### PRD Status Check for ALL Failing Tests

| Test ID | Feature | FR ID | PRD Status | Should Pass? |
|---------|---------|-------|------------|--------------|
| TC-BOM-007 | BOM Create - select product, set dates | FR-2.20 | **Done** | YES |
| TC-BOM-008 | BOM date overlap prevention | FR-2.22 | **Done** | YES |
| TC-BOM-009 | BOM output_qty/output_uom | FR-2.21 | **Done** | YES |
| TC-BOM-010 | BOM production lines (M:M) | FR-2.33 | **Done** | YES |
| TC-BOM-011 | BOM routing assignment | FR-2.42 | **Done** | YES |
| TC-BOM-012 | BOM create successfully | FR-2.20 | **Done** | YES |
| TC-BOM-014 | Add ingredient item | FR-2.21 | **Done** | YES |
| TC-BOM-015 | Operation sequence for item | FR-2.31 | **Done** | YES |
| TC-BOM-016 | Scrap percent | FR-2.21 | **Done** | YES |
| TC-BOM-017 | Quantity > 0 validation | FR-2.39 | **Done** | YES |
| TC-BOM-020 | Delete item | FR-2.21 | **Done** | YES |
| TC-BOM-021-024 | Alternative ingredients | FR-2.30 | **Done** | YES |
| TC-BOM-025 | By-products with yield | FR-2.27 | **Done** | YES |
| TC-BOM-032-033 | BOM Cost Summary | FR-2.36 | **Done** | YES |
| TC-BOM-034-035 | Allergen inheritance | FR-2.28 | **Done** | YES |
| TC-PROD-007 | Pagination | FR-2.7 | **Done** | YES |
| TC-PROD-010 | Create product | FR-2.1 | **Done** | YES |
| TC-PROD-012 | Version on creation | FR-2.2 | **Done** | YES |
| TC-PROD-013 | Duplicate SKU prevention | FR-2.1 | **Done** | YES |
| TC-PROD-018 | Version increment on edit | FR-2.2 | **Done** | YES |
| TC-PROD-020 | Version history | FR-2.3 | **Done** | YES |
| TC-PROD-021-025 | Product details page | FR-2.1-2.8 | **Done** | YES |
| TC-PROD-026-030 | Allergen management | FR-2.4 | **Done** | YES |
| TC-RTG-012-017 | Routing operations | FR-2.41-2.45 | **Done** | YES |
| TC-RTG-020-025 | Routing features | FR-2.40-2.48 | **Done** | YES |
| TC-INT-001-012 | Integration tests | Various | **Done** | YES |
| TC-TYPE-006 | Product type edit | FR-2.5 | **Done** | YES |
| TC-DASH-002 | Dashboard load time | FR-2.100 | **Done** | YES |

**CONCLUSION**: 100% of failing tests correspond to features marked **"Done"** in PRD.

---

## 4. Root Cause Categories

### Category A: Form Validation Blocking Submit (18 tests - 29%)

**Pattern**: `button disabled - element is not enabled`

**What's happening**:
- Test fills form fields
- Some validation fails silently
- Submit button remains disabled
- Test times out waiting to click disabled button

**Affected tests**:
- TC-BOM-007, TC-BOM-008, TC-BOM-012 (BOM creation)
- TC-PROD-010, TC-PROD-013 (Product creation)
- TC-INT-001 through TC-INT-012 (All integration tests)

**Root cause investigation needed**:
1. Form fields not matching expected names
2. Required field missing in test data
3. Validation rules stricter than test expects
4. Form component rendering issue

### Category B: Product/Row Not Found in Table (15 tests - 24%)

**Pattern**: `waiting for locator('table tbody tr').filter({ hasText: '...' })`

**What's happening**:
- Test creates a product/entity
- Test tries to find it in the table
- Entity doesn't appear (creation failed silently?)
- Or table hasn't refreshed

**Affected tests**:
- TC-PROD-021 through TC-PROD-030 (Product details & allergens)
- TC-INT-006 (Shelf life configuration)
- All tests dependent on prior product creation

**Root cause**: This is a **cascade failure** - one failed creation causes multiple test failures.

### Category C: UI Element Not Found (10 tests - 16%)

**Pattern**: `getByText('Mixing') - element not found`

**What's happening**:
- Test adds an operation/component
- Tries to verify it appears in list
- Element not visible (save failed? rendering issue?)

**Affected tests**:
- TC-RTG-012 through TC-RTG-016 (Routing operations)
- TC-RTG-025 (Parallel operations)
- TC-BOM-014 through TC-BOM-016 (BOM items)

### Category D: Missing UI Components (5 tests - 8%)

**Pattern**: Expected UI elements don't exist

**Specific issues**:
1. `[data-testid="cost-summary"]` - No cost summary component on BOM detail
2. `[data-testid="total-cost"]` - No total cost display
3. `getByRole('tab', { name: /allergen/i })` - No allergens tab
4. `input[name="routing_id"]` - Routing field has different structure
5. `input[name="output_qty"]` - Output quantity field name different

### Category E: Page Object Method Issues (3 tests - 5%)

**Specific issues**:
1. `this.dataTable.nextPage is not a function` - Method not implemented in DataTablePage
2. Modal overlay intercepts clicks - Animation timing issue
3. Multiple elements matched by selector

### Category F: Timing/Performance (3 tests - 5%)

**Specific issues**:
1. Dashboard loads in 6.4s (expected < 3s)
2. `waitForLoadState('networkidle')` timeout 30s
3. Network requests keep firing

---

## 5. Detailed Error Analysis by Module

### 5.1 Products Module (16 failures)

| Test | Error | Real Issue |
|------|-------|------------|
| TC-PROD-007 | `nextPage is not a function` | Page Object bug - method missing |
| TC-PROD-010 | Row not found in table | Product creation fails silently |
| TC-PROD-012 | Header not visible | Navigation to detail page fails |
| TC-PROD-013 | Submit button disabled | Form validation blocking |
| TC-PROD-018 | Row not found | Selector uses literal string instead of first row |
| TC-PROD-020 | `input[name="code"]` timeout | Edit modal not open or field name different |
| TC-PROD-021-025 | Row not found | All use `locator('tbody tr').first()` as text literal |
| TC-PROD-026-030 | Row not found | Product creation dependency failed |

**Critical Finding**: Tests PROD-018 through PROD-025 have a **test bug**:
```javascript
// BUG: Using locator result as string instead of executing it
await productsPage.clickProduct("locator('tbody tr').first()");
// SHOULD BE:
await productsPage.clickFirstProduct();
```

### 5.2 BOMs Module (20 failures)

| Test | Error | Real Issue |
|------|-------|------------|
| TC-BOM-007 | Modal overlay intercepts clicks | Animation timing |
| TC-BOM-008 | Submit disabled | Form not valid |
| TC-BOM-009-012 | Various | Form fields not matching |
| TC-BOM-014-020 | Element not found | BOM item form structure different |
| TC-BOM-021-024 | Button not found | "Alternatives" button selector wrong |
| TC-BOM-025 | Button not found | "Add By-Product" button doesn't exist |
| TC-BOM-032-033 | `[data-testid="cost-summary"]` | Cost summary UI not implemented |
| TC-BOM-034-035 | Item delete fails | Delete button selector wrong |

### 5.3 Routings Module (12 failures)

| Test | Error | Real Issue |
|------|-------|------------|
| TC-RTG-012-016 | Operation not in list | Operation save fails or different UI |
| TC-RTG-017 | Drag timeout | Drag-drop not supported or different implementation |
| TC-RTG-020-021 | Table not visible | Navigation issue after create |
| TC-RTG-022-023 | Network idle timeout | Page keeps making requests |
| TC-RTG-024 | `$\d+` not found | Cost display format different |
| TC-RTG-025 | Operation not visible | Same as 012-016 |

### 5.4 Integration Tests (12 failures)

All 12 integration tests fail due to **cascade failures** from:
1. Product creation fails (submit button disabled)
2. BOM creation fails (submit button disabled)
3. All downstream tests fail

---

## 6. Recommendations

### Priority 1: Fix Form Submission (18 tests unblocked)

**Action**: Debug why "Create Product" and "Save BOM" buttons remain disabled.

1. Open DevTools during test run
2. Check form validation errors in console
3. Verify all required fields are filled correctly
4. Check if field names in test match actual form

**Files to check**:
- `apps/frontend/components/products/ProductModal.tsx`
- `apps/frontend/components/bom/BOMModal.tsx`
- `e2e/pages/ProductsPage.ts`
- `e2e/pages/BOMsPage.ts`

### Priority 2: Fix Test Bugs (8 tests unblocked)

**Action**: Fix literal string being passed instead of locator.

```typescript
// WRONG (current):
await productsPage.clickProduct("locator('tbody tr').first()");

// CORRECT (should be):
const firstRow = await page.locator('tbody tr').first().textContent();
const productCode = firstRow?.split('\t')[0] || '';
await productsPage.clickProduct(productCode);
```

### Priority 3: Add Missing Page Object Methods (2 tests unblocked)

**Action**: Implement `DataTablePage.nextPage()` method.

### Priority 4: Verify UI Component Implementation (5 tests)

**Check if these exist in actual UI**:
1. Cost Summary card on BOM detail page
2. Allergens tab on Product detail page
3. Version history section
4. By-product section with "Add By-Product" button

If missing in UI -> **Either implement UI OR skip tests as "Not Yet Implemented"**

### Priority 5: Fix Selector Mismatches (10 tests)

**Common patterns to fix**:
- `[name="output_qty"]` -> Check actual form field name
- `button:has-text("Alternatives")` -> Check actual button text
- `[role="dialog"]` animation timing -> Add wait or use force: true

---

## 7. Tests to Skip (Phase 2 / Future)

Based on PRD analysis, **ZERO tests** should be skipped. All 62 failing tests correspond to features marked as "Done" in the PRD.

However, if certain UI components are intentionally not yet built, these tests COULD be skipped:
- TC-BOM-032, TC-BOM-033 (Cost summary) - IF cost summary card not built
- TC-PROD-020 (Version history) - IF version history tab not built

---

## 8. Quick Wins (Effort vs Impact)

| Fix | Effort | Tests Fixed | Recommendation |
|-----|--------|-------------|----------------|
| Fix test literal string bug | 1 hour | 8 | DO FIRST |
| Add nextPage() method | 30 min | 1 | DO |
| Debug form validation | 2-4 hours | 18 | HIGH PRIORITY |
| Fix operation save flow | 2 hours | 10 | MEDIUM |
| Add cost summary UI | 4 hours | 2 | LOW (if feature planned) |
| Skip unbuilt features | 30 min | 5 | LAST RESORT |

---

## 9. Conclusion

**Should we continue fixing tests?** YES

**Why tests fail**: NOT because features are Phase 2, but because:
1. **Test bugs** (literal strings instead of locators)
2. **Form validation issues** (submit buttons disabled)
3. **Selector mismatches** (Page Objects out of sync with UI)
4. **Cascade failures** (one failure causes 10 more)

**Estimated effort to fix all 62 tests**: 8-12 hours

**Recommended approach**:
1. Fix test bugs (1 hour) -> 8 tests pass
2. Debug form validation (4 hours) -> 18+ tests pass
3. Fix remaining selectors (4 hours) -> Rest pass

This is **NOT** a missing features problem. This is a **test maintenance debt** problem.
