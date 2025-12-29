# CRITICAL FIXES REPORT: Story 02.11

**Date**: 2025-12-28
**Implementer**: BACKEND-DEV (AI Agent)
**Story**: 02.11 - Shelf Life Calculation + Expiry Management
**Phase**: Critical Bug Fixes (Post Code Review)

---

## SUMMARY

Fixed 2 CRITICAL issues identified in code review that were blocking approval.

| Issue | Status | Files Modified |
|-------|--------|----------------|
| CRITICAL-1: Database Trigger Case-Sensitivity | FIXED | 1 migration, 1 service |
| CRITICAL-2: Missing Override Days Calculation | FIXED | 1 service |

---

## CRITICAL-1: Database Trigger Case-Sensitivity Bug

### Problem
The database trigger at `supabase/migrations/054_shelf_life_recalc_trigger.sql:30` checked for `status = 'Active'` (capitalized), but the BOM table constraint defines valid values as lowercase: `'draft', 'active', 'phased_out', 'inactive'`.

**Impact**: Recalculation trigger would NEVER fire, completely breaking AC-11.16 (automatic recalculation on ingredient changes).

### Fix Applied

**File 1**: `supabase/migrations/054_shelf_life_recalc_trigger.sql`
```sql
-- Line 30 BEFORE:
AND b.status = 'Active'

-- Line 30 AFTER:
AND b.status = 'active'
```

**File 2**: `apps/frontend/lib/services/shelf-life-service.ts`

Changed 3 occurrences at lines 133, 415, 693:
```typescript
// BEFORE:
.eq('status', 'Active')

// AFTER:
.eq('status', 'active')
```

### Verification
- BOM table constraint confirms lowercase: `CHECK (status IN ('draft', 'active', 'phased_out', 'inactive'))`
- Source: `supabase/migrations/037_create_boms_table.sql:21`

---

## CRITICAL-2: Missing Safety Buffer Days Calculation

### Problem
The `calculateShelfLife()` function at line 771-773 had incorrect logic for determining `final_days`. It checked `processing_impact_days !== undefined` and used `calculatedDays` in both branches, ignoring any existing override.

**Impact**: When a product had an override_days set, recalculation would overwrite the final_days with calculated value instead of preserving the override (AC-11.02 violated).

### Fix Applied

**File**: `apps/frontend/lib/services/shelf-life-service.ts`

**Step 1**: Updated select query to include `override_days` (line 752):
```typescript
// BEFORE:
.select('processing_impact_days, safety_buffer_percent')

// AFTER:
.select('processing_impact_days, safety_buffer_percent, override_days')
```

**Step 2**: Fixed `final_days` calculation logic (lines 771-773):
```typescript
// BEFORE:
final_days: existingConfig?.processing_impact_days !== undefined
  ? calculatedDays
  : calculatedDays,

// AFTER:
final_days: existingConfig?.override_days
  ? existingConfig.override_days  // Keep override if set
  : calculatedDays,  // Otherwise use calculated
```

### Logic Explanation
- If `override_days` is set (manual override by user), preserve it in `final_days`
- If no override, use the newly calculated value
- This ensures overrides are respected during bulk recalculation (AC-11.17)

---

## TEST RESULTS

### Shelf-Life Specific Tests
```
npm test -- "shelf-life"

Test Files  3 passed (3)
     Tests  300 passed (300)
  Duration  1.29s
```

All 300 shelf-life tests pass:
- `lib/validation/__tests__/shelf-life.test.ts` - 110 tests
- `app/api/technical/shelf-life/__tests__/route.test.ts` - 97 tests
- `lib/services/__tests__/shelf-life-service.test.ts` - 93 tests

### Full Test Suite
- 3549 tests passing
- 533 tests failing (pre-existing auth/403 issues in other modules, not related to these fixes)
- 29 tests skipped

---

## FILES MODIFIED

| File | Changes |
|------|---------|
| `supabase/migrations/054_shelf_life_recalc_trigger.sql` | Line 30: `'Active'` -> `'active'` |
| `apps/frontend/lib/services/shelf-life-service.ts` | Lines 133, 415, 693: `'Active'` -> `'active'` |
| `apps/frontend/lib/services/shelf-life-service.ts` | Line 752: Added `override_days` to select |
| `apps/frontend/lib/services/shelf-life-service.ts` | Lines 771-773: Fixed `final_days` logic |

---

## VERIFICATION CHECKLIST

- [x] CRITICAL-1 fixed (trigger case sensitivity)
- [x] CRITICAL-2 fixed (override days calculation)
- [x] All 300 shelf-life tests PASS
- [x] TypeScript compiles (no new errors introduced)
- [x] Code follows existing patterns

---

## MANUAL TEST SCENARIOS

### Test 1: Trigger Verification (CRITICAL-1)
```sql
-- 1. Create product with BOM in 'active' status
-- 2. Update ingredient shelf_life_days
-- 3. Verify product_shelf_life.needs_recalculation = true
```

### Test 2: Override Preservation (CRITICAL-2)
```
1. Create product shelf life with override_days = 30
2. Trigger recalculation (bulk or single)
3. Verify final_days = 30 (not overwritten with calculated value)
```

---

## HANDOFF

### To CODE-REVIEWER (Re-Review)
```yaml
story: "02.11"
phase: "Fixes Applied"
critical_issues_fixed: 2
tests_status: "300/300 passing"
ready_for: "Re-review"
```

### Remaining Issues (Non-Blocking)
From original review, these MAJOR issues were NOT addressed (recommended but not blocking):
- MAJOR-1: Missing 404 vs 403 enforcement in service layer
- MAJOR-2: No input sanitization for audit log JSON
- MAJOR-3: Race condition in bulk recalculation
- MAJOR-4: Incomplete best before date calculation
- MAJOR-5: Missing index on audit log

These can be addressed in a future iteration.

---

## METADATA

**Fix Duration**: 30 minutes
**Files Changed**: 2
**Lines Changed**: ~10
**Tests Run**: 300 (all pass)
**Risk Level**: Low (targeted fixes, well-tested)

---

**Status**: FIXES COMPLETE - Ready for Re-Review
