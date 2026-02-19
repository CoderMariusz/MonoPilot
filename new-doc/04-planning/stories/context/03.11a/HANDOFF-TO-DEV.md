# Story 03.11a - Handoff to DEV Agent
## RED Phase Complete - Ready for GREEN Phase

**Status**: RED phase complete, all tests FAILING (expected)
**Date**: 2025-12-31
**Current Phase**: Awaiting GREEN phase (implementation)
**Handoff From**: TEST-WRITER
**Handoff To**: DEV agent (for implementation)

---

## Summary

TEST-WRITER has completed the RED phase of test-driven development for Story 03.11a (WO Materials - BOM Snapshot). All test specifications from `tests.yaml` have been implemented as failing tests.

### Test Files Created: 5
- Unit tests: 1 file (14 test cases)
- Integration tests: 2 files (16 test cases)
- RLS tests: 1 file (6 test cases)
- E2E tests: 1 file (8 test cases)

**Total Test Cases**: 44
**Current Status**: ALL FAILING ❌ (as expected in RED phase)

---

## What Was Created

### 1. Unit Tests
**File**: `apps/frontend/lib/services/__tests__/wo-snapshot-service.test.ts`

Tests two critical functions:
- **scaleQuantity()** - 8 test cases
  - Tests scaling formula: (wo_qty / bom_output_qty) * item_qty * (1 + scrap_percent/100)
  - Covers edge cases: scrap percentages, fractional quantities, large scales
  - Verifies 6 decimal precision rounding

- **canModifySnapshot()** - 6 test cases
  - Tests status-based modification rules
  - Verifies draft/planned allow modification (true)
  - Verifies released/in_progress/completed/cancelled block modification (false)

### 2. Integration Tests - GET Materials
**File**: `apps/frontend/app/api/planning/work-orders/[id]/materials/__tests__/route.test.ts`

Tests retrieving BOM snapshot:
- 6 test cases covering:
  - Valid WO returns materials with product details
  - Empty array for WO without materials
  - 404 for non-existent WO
  - 404 for cross-org access (RLS enforcement)
  - Materials ordered by sequence
  - By-products included with badge data

### 3. Integration Tests - POST Snapshot
**File**: `apps/frontend/app/api/planning/work-orders/[id]/snapshot/__tests__/route.test.ts`

Tests creating/refreshing BOM snapshot:
- 10 test cases covering:
  - Create snapshot for draft/planned WOs
  - 409 Conflict for released/in_progress WOs (immutability)
  - 400 if WO has no BOM selected
  - Replace existing materials on refresh
  - Quantity scaling formula verification
  - By-products with required_qty = 0
  - BOM version tracking for audit
  - 404 for cross-org WO (RLS enforcement)

### 4. RLS Policy Tests
**File**: `supabase/tests/wo-materials-rls.test.sql`

Tests row-level security:
- 6 test cases using PL/pgSQL:
  - User can read own org materials
  - User cannot read other org materials
  - Planner can insert materials
  - Viewer cannot insert materials
  - Cannot delete materials for released WO
  - Can delete materials for draft WO

### 5. E2E Tests
**File**: `apps/frontend/__tests__/e2e/planning/wo-materials.spec.ts`

Tests user workflows:
- 8 test cases using Playwright:
  - Materials table displays with proper columns
  - Materials show sequence, name, qty, UoM
  - By-products show badge and yield %
  - Refresh button visible for draft WOs
  - Refresh button hidden for released WOs
  - Refresh snapshot shows confirmation
  - Refresh updates table and shows success toast
  - Loading skeleton and empty states

---

## Acceptance Criteria Coverage

All 13 acceptance criteria are covered:

| AC | Name | Test File | Status |
|----|------|-----------|--------|
| AC-1 | BOM Snapshot Created on WO Creation | Integration POST #1 | FAIL ❌ |
| AC-2 | Quantity Scaling Formula | Unit scaleQuantity #1 | FAIL ❌ |
| AC-2b | Scrap Percentage Applied | Unit scaleQuantity #2 | FAIL ❌ |
| AC-3 | BOM Version Tracking | Integration POST #9 | FAIL ❌ |
| AC-4 | Snapshot Immutability After Release | Integration POST #3-4 | FAIL ❌ |
| AC-4b | Snapshot Refresh for Draft/Planned | Unit canModifySnapshot | FAIL ❌ |
| AC-5 | Materials List Display (500ms) | E2E #1, #8 | FAIL ❌ |
| AC-6 | By-Products Included | Integration POST #8 | FAIL ❌ |
| AC-7 | Material Name Denormalization | Integration GET #1 | FAIL ❌ |
| AC-8 | RLS Org Isolation (404 not 403) | All endpoints + RLS #1-2 | FAIL ❌ |
| AC-9 | Refresh Button Visibility | E2E #4 | FAIL ❌ |
| AC-9b | Refresh Button Disabled After Release | E2E #5 | FAIL ❌ |
| AC-10 | Performance - 100 Item BOM (2s) | Integration POST #6 | FAIL ❌ |

**Coverage**: 100% (13/13 acceptance criteria)

---

## Test Quality

✓ **AAA Pattern**: All tests follow Arrange-Act-Assert pattern
✓ **Clear Names**: Descriptive test names matching acceptance criteria
✓ **AC References**: Each test references relevant acceptance criteria
✓ **Edge Cases**: Scrap percentages, large scale factors, fractional quantities
✓ **Error Handling**: 404, 400, 409 responses tested
✓ **Security**: Cross-org access returns 404 not 403
✓ **Performance**: Target metrics documented (500ms for GET, 2s for POST)
✓ **Precision**: 6 decimal place rounding tested
✓ **Mock Data**: Realistic UUIDs and test data

---

## How Tests Currently Fail

**Expected failure modes when running tests**:

### Unit Tests
```
scaleQuantity is not defined (no implementation)
canModifySnapshot is not defined (no implementation)
```

### Integration Tests
```
createRouteHandlerClient is mocked but route handler not found (no endpoint)
Mock Supabase client call fails (no actual queries)
```

### RLS Tests
```
wo_materials table does not exist
RLS policies not created
```

### E2E Tests
```
Navigation URLs not found (no page implementation)
Elements like [data-testid="wo-materials-table"] not found
```

---

## What DEV Agent Should Implement

### Phase 1: Database (ADR-002 BOM Snapshot Pattern)

1. **Create Migration**: `supabase/migrations/XXX_create_wo_materials_table.sql`
   - Create wo_materials table with 20 columns (see database.yaml)
   - Add 3 indexes (wo_id, product_id, organization_id)
   - Add 4 constraints (chk_required_qty, chk_consumed_qty, chk_reserved_qty, chk_scrap_percent)
   - Enable RLS with 4 policies (SELECT, INSERT, UPDATE, DELETE)

2. **Run Migration**: Verify all tests can connect to table

### Phase 2: Service Layer

1. **Create** `apps/frontend/lib/services/wo-snapshot-service.ts`
   - Implement `scaleQuantity(itemQty, woQty, bomOutputQty, scrapPercent)` with 6 decimal rounding
   - Implement `canModifySnapshot(woStatus)` - allow only draft/planned
   - Implement `createBOMSnapshot(woId, bomId, woPlannedQty)` - copy and scale
   - Implement `refreshSnapshot(woId)` - delete old, create new
   - Implement `getWOMaterials(woId)` - query with product joins

### Phase 3: API Endpoints

1. **Create** `apps/frontend/app/api/planning/work-orders/[id]/materials/route.ts`
   - GET handler returning WOMaterialsListResponse
   - Query wo_materials with product joins
   - Order by sequence
   - Return 404 for missing WO or org mismatch

2. **Create** `apps/frontend/app/api/planning/work-orders/[id]/snapshot/route.ts`
   - POST handler returning CreateSnapshotResponse
   - Check canModifySnapshot() → return 409 if false
   - Check bom_id exists → return 400 if null
   - Delete existing materials
   - Create new materials using createBOMSnapshot()
   - Return success with materials_count

### Phase 4: Integration with WO Creation (03.10)

1. **Hook** POST /work-orders endpoint to auto-create snapshot
   - After WO created with bom_id, call createBOMSnapshot()
   - Store materials in wo_materials table

### Phase 5: Components (Phase 1B)

1. **Create UI Components** (not required for RED phase tests to pass)
   - WOMaterialsTable with ShadCN DataTable
   - WOMaterialRow with badges
   - RefreshSnapshotButton with confirmation dialog

---

## Run Tests Commands

### After DEV implements each piece:

```bash
# Run unit tests
npm test -- --testPathPattern="wo-snapshot-service"
# Expected: 14 PASSED ✓

# Run GET materials integration tests
npm test -- --testPathPattern="materials.*route"
# Expected: 6 PASSED ✓

# Run POST snapshot integration tests
npm test -- --testPathPattern="snapshot.*route"
# Expected: 10 PASSED ✓

# Run all planning tests
npm test -- --testPathPattern="planning.*route"

# Run E2E tests
npx playwright test wo-materials.spec.ts

# Run RLS tests
supabase test db --file supabase/tests/wo-materials-rls.test.sql
```

---

## Key Implementation Notes

### Scaling Formula (Unit Tests)
```typescript
// Formula: (wo_qty / bom_output_qty) * item_qty * (1 + scrap_percent / 100)
const scaleFactor = woQty / bomOutputQty;
const scrapMultiplier = 1 + (scrapPercent / 100);
const result = itemQty * scaleFactor * scrapMultiplier;
// Round to 6 decimal places to avoid floating point errors
return Math.round(result * 1000000) / 1000000;
```

### By-Products Handling
```typescript
// By-products have:
// - is_by_product = true
// - required_qty = 0 (not scaled)
// - yield_percent preserved from bom_item
```

### RLS Pattern (ADR-013)
```sql
-- All queries must filter by organization_id
-- Using users table lookup:
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

### Error Handling
- **404**: WO not found or org mismatch (RLS)
- **400**: No BOM selected
- **409**: WO is released/in_progress (immutable)

---

## Risk Mitigation

| Risk | Mitigated By | Test |
|------|-------------|------|
| Scaling precision loss | 6 decimal rounding | Unit #4 |
| RLS bypass | Policy tests verify isolation | RLS #1-2 |
| Cross-org visibility | RLS returns 404 not 403 | All endpoints |
| Snapshot modification after release | 409 response enforced | Integration #3-4 |
| By-products incorrect | required_qty=0 verified | Integration #8 |

---

## Files Involved

### Test Files (Created by TEST-WRITER)
- `apps/frontend/lib/services/__tests__/wo-snapshot-service.test.ts`
- `apps/frontend/app/api/planning/work-orders/[id]/materials/__tests__/route.test.ts`
- `apps/frontend/app/api/planning/work-orders/[id]/snapshot/__tests__/route.test.ts`
- `apps/frontend/__tests__/e2e/planning/wo-materials.spec.ts`
- `supabase/tests/wo-materials-rls.test.sql`

### Files to Create (by DEV)
- `supabase/migrations/027_create_wo_materials_table.sql`
- `apps/frontend/lib/services/wo-snapshot-service.ts`
- `apps/frontend/lib/services/wo-materials-service.ts` (client-side service)
- `apps/frontend/app/api/planning/work-orders/[id]/materials/route.ts`
- `apps/frontend/app/api/planning/work-orders/[id]/snapshot/route.ts`

### Files to Update (by DEV)
- `apps/frontend/app/api/planning/work-orders/route.ts` - hook snapshot creation
- `apps/frontend/lib/types/wo-materials.ts` - create types

---

## Context References

All context files available in:
`docs/2-MANAGEMENT/epics/current/03-planning/context/03.11a/`

- `_index.yaml` - Story metadata and dependencies
- `database.yaml` - Table schema and RLS policies
- `api.yaml` - Endpoint specifications and patterns
- `frontend.yaml` - Component and type definitions
- `tests.yaml` - Test specifications (all covered)

---

## Phase Transition Checklist

### RED Phase (TEST-WRITER) ✓ COMPLETE
- [x] Read all context files
- [x] Create unit test file with 14 tests
- [x] Create integration test files with 16 tests
- [x] Create RLS test file with 6 tests
- [x] Create E2E test file with 8 tests
- [x] Verify all tests are FAILING (no implementation)
- [x] Document all tests in TEST-EXECUTION-SUMMARY.md
- [x] Create handoff document

### GREEN Phase (DEV) - YOUR TURN
- [ ] Create database migration
- [ ] Implement wo-snapshot-service.ts
- [ ] Implement API endpoints
- [ ] Make all tests PASS
- [ ] Run full test suite
- [ ] Verify 100% test coverage
- [ ] Ready for REFACTOR phase

---

## Success Criteria for GREEN Phase

All 44 tests should PASS:
```
✓ 14 unit tests (scaleQuantity, canModifySnapshot)
✓ 6 integration tests (GET /materials)
✓ 10 integration tests (POST /snapshot)
✓ 6 RLS policy tests
✓ 8 E2E tests
```

Coverage targets:
```
- scaleQuantity: 90%+
- canModifySnapshot: 100%
- materials endpoint: 80%+
- snapshot endpoint: 80%+
```

---

## Questions for DEV?

Refer to:
1. **Scaling Formula**: ADR-002, tests.yaml AC-2/AC-2b
2. **RLS Pattern**: ADR-013, database.yaml policies section
3. **BOM Snapshot Pattern**: _index.yaml technical_notes
4. **API Contracts**: api.yaml response schemas

---

**Ready for DEV Implementation**
All tests documented and failing as expected.
No implementation code written - pure test-driven approach.

Handoff Date: 2025-12-31
Next Agent: DEV (GREEN phase)
