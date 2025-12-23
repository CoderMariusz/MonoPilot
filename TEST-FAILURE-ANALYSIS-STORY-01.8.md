# Test Failure Analysis - Story 01.8 Warehouses CRUD

**Date**: 2025-12-18
**Status**: 25/36 tests passing (11 failures)
**Target**: 100% pass rate

---

## Executive Summary

| Category | Count | Type | Action Required |
|----------|-------|------|-----------------|
| Test Expectation Mismatches | 5 | TEST ISSUE | Fix test assertions |
| Component Implementation Bugs | 4 | IMPLEMENTATION BUG | Fix component code |
| Performance/Timeout Issues | 1 | TEST OPTIMIZATION | Optimize test |
| Hook Mocking Issues | 1 | TEST MOCK | Fix mock setup |
| **TOTAL** | **11** | - | - |

---

## Detailed Failure Analysis

### Category 1: Test Expectation Mismatches (FIX TESTS)

These are cases where the test expects a different error message than what the Zod schema actually produces.

#### ❌ 1.1: "should show error when code is empty"
```
Expected: /warehouse code must be at least 2 characters/i
Actual:   "Warehouse code must be at least 2 characters" (capital W)
```
**Root Cause**: Test regex is case-insensitive but exact match required
**Fix**: Update test expectation to match schema message
**Location**: Line 527, WarehouseModal.test.tsx

#### ❌ 1.2: "should show error when name is empty"
```
Expected: /warehouse name is required/i
Actual:   "Warehouse name must be at least 2 characters" (from schema min validation)
```
**Root Cause**: Schema uses `.min(2, ...)` not `.required()`
**Fix**: Update test to expect "Warehouse name must be at least 2 characters"
**Location**: Line 546, WarehouseModal.test.tsx

#### ❌ 1.3: "should show error when code format is invalid"
```
Expected: /code must contain only uppercase/i
Actual:   "Code must be 2-20 uppercase alphanumeric characters with hyphens only"
```
**Root Cause**: Test expects partial message
**Fix**: Update test to match full schema regex error message
**Location**: Line 568, WarehouseModal.test.tsx

#### ❌ 1.4: "should show error when email format is invalid"
```
Expected: /invalid email format/i
Actual:   "Invalid email format" (exact match)
```
**Root Cause**: Test uses regex unnecessarily
**Fix**: Use exact match or update regex
**Location**: Line 590, WarehouseModal.test.tsx

#### ❌ 1.5: "should show error when address exceeds 500 characters"
```
Expected: /address must be 500 characters or less/i
Actual:   "Address must be 500 characters or less"
```
**Root Cause**: Test uses regex unnecessarily
**Fix**: Use exact match or update regex
**Location**: Line 613, WarehouseModal.test.tsx

---

### Category 2: Component Implementation Bugs (FIX IMPLEMENTATION)

These are actual bugs in the WarehouseModal component that need fixing.

#### ❌ 2.1: "should call onClose when Cancel clicked"
```
Expected: mockOnClose to be called 1 time
Actual:   Called 0 times
```
**Root Cause**: Radix UI Dialog's `onOpenChange` is not triggered by Cancel button click
**Fix**: Cancel button should explicitly call `onClose()` via `onClick`
**Current Code** (Line 436-440):
```tsx
<Button
  type="button"
  variant="outline"
  onClick={onClose}  // ✅ Already correct!
  disabled={submitting}
>
  Cancel
</Button>
```
**Investigation Needed**: Check if Dialog is intercepting the onClick or if there's another issue

#### ❌ 2.2: "should display Save Changes button"
```
Expected: Button with text "Save Changes" to exist
Actual:   Button not found by getAllByRole + text match
```
**Root Cause**: Test uses `getAllByRole('button')` then `.find()` with regex match
**Current Button Text Logic** (Line 443):
```tsx
{submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Warehouse'}
```
**Fix**: The logic is correct. Issue is with test selector - it should use `getByRole('button', { name: /save changes/i })`
**Classification**: TEST ISSUE, not implementation bug

#### ❌ 2.3: "should display type dropdown with 5 warehouse types"
```
Expected: Options to include 'WIP'
Actual:   Options include 'WIP (Work in Progress)'
```
**Root Cause**: Test expects short label, but WAREHOUSE_TYPE_LABELS has full text
**Current Labels** (lib/types/warehouse.ts:19):
```tsx
WIP: 'WIP (Work in Progress)',
```
**Fix Options**:
1. Change label to just "WIP" (BREAKING CHANGE for UX)
2. Update test to expect "WIP (Work in Progress)" (RECOMMENDED)
**Decision**: Update test - full label is better UX

---

### Category 3: Performance/Timeout Issues (FIX TEST)

#### ❌ 3.1: "should show red counter when address near limit"
```
Error: Test timed out in 5000ms
```
**Root Cause**: `userEvent.type()` with 460 characters is too slow
**Current Code** (Line 630):
```tsx
await userEvent.type(addressInput, nearLimitAddress) // 460 chars typed one-by-one!
```
**Fix**: Use `fireEvent.change()` instead of `userEvent.type()` for bulk text
**Location**: Line 630, WarehouseModal.test.tsx
**Recommended**:
```tsx
fireEvent.change(addressInput, { target: { value: nearLimitAddress } })
```

---

### Category 4: Hook Mocking Issues (FIX TEST)

#### ❌ 4.1: "should submit valid form data in create mode"
```
Expected: mockOnSuccess to be called
Actual:   mockOnSuccess not called
```
**Root Cause**: vi.mock() inside test doesn't override the module-level mock
**Current Mock** (Lines 65-77):
```tsx
vi.mock('@/lib/hooks/use-create-warehouse', () => ({
  useCreateWarehouse: () => ({
    mutateAsync: vi.fn(),  // Returns undefined, not a resolved promise
    isPending: false,
  }),
}))
```
**Fix**: Mock needs to return a resolved promise AND be set up before component renders
**Issue**: Test tries to re-mock at line 679, but vi.mock() is hoisted - doesn't work
**Solution**: Use `vi.mocked()` or `mockImplementation()` instead

---

### Category 5: Clear Validation Errors (FIX TEST)

#### ❌ 4.2: "should clear validation errors when user starts typing"
```
Expected: Error message to disappear after typing
Actual:   Error message not found initially (because validation message doesn't match)
```
**Root Cause**: Same as 1.2 - test expects "warehouse name is required" but schema shows different message
**Fix**: Update test to expect correct validation message first
**Location**: Lines 650-659, WarehouseModal.test.tsx

---

## Fix Priority & Assignments

### Priority 1: Test Expectation Fixes (QUICK WINS)
- [ ] Fix 1.1: Code empty validation message
- [ ] Fix 1.2: Name empty validation message
- [ ] Fix 1.3: Code format validation message
- [ ] Fix 1.4: Email validation message
- [ ] Fix 1.5: Address length validation message
- [ ] Fix 2.3: WIP label expectation
- [ ] Fix 4.2: Clear validation test
**Estimated Time**: 15 minutes
**Risk**: Low

### Priority 2: Test Optimization (MEDIUM)
- [ ] Fix 3.1: Address counter timeout (use fireEvent instead of userEvent.type)
**Estimated Time**: 5 minutes
**Risk**: Low

### Priority 3: Test Mock Fix (MEDIUM)
- [ ] Fix 4.1: Form submission mock (restructure hook mock)
**Estimated Time**: 20 minutes
**Risk**: Medium

### Priority 4: Component Investigation (NEEDS INVESTIGATION)
- [ ] Fix 2.1: Cancel button onClick not firing (check Dialog interaction)
- [ ] Fix 2.2: Save Changes button selector (update test selector)
**Estimated Time**: 15 minutes
**Risk**: Low

---

## Implementation Plan

### Step 1: Fix All Test Expectations (8 fixes)
Update test assertions to match actual schema validation messages.

### Step 2: Fix Test Performance
Replace `userEvent.type()` with `fireEvent.change()` for long text input.

### Step 3: Fix Hook Mock
Restructure the create/update hook mocks to properly return resolved promises.

### Step 4: Investigate Radix UI Dialog
Debug why Cancel button onClick isn't firing - may be Radix Dialog issue.

### Step 5: Verify All Tests Pass
Run full test suite and confirm 36/36 passing.

---

## Expected Outcome

- **Before**: 25/36 passing (69%)
- **After**: 36/36 passing (100%)
- **Implementation Bugs Found**: 1 (Cancel button)
- **Test Issues Fixed**: 10

---

## Files to Modify

1. `apps/frontend/components/settings/warehouses/__tests__/WarehouseModal.test.tsx` (10 test fixes)
2. `apps/frontend/components/settings/warehouses/WarehouseModal.tsx` (1 potential fix for Cancel button)

---

## Next Steps

1. Apply fixes in order of priority
2. Run tests after each batch of fixes
3. Document any framework limitations discovered
4. Report final status: READY FOR CODE REVIEW or NEEDS MORE WORK
