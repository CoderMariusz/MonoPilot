# Code Review Report: Story 02.7 - Routings CRUD + Header Management

**Story ID**: 02.7
**Epic**: 02-technical
**Review Date**: 2025-12-28
**Reviewer**: CODE-REVIEWER Agent
**Test Status**: 90/90 PASSING (100%)

---

## Executive Summary

**Decision**: REQUEST_CHANGES

**Test Results**: All 90 tests passing (100% coverage), but **CRITICAL ISSUES FOUND** in implementation.

**Ratings**:
- Security Rating: **6/10** (CRITICAL: Code field not immutable on update)
- ADR-009 Compliance: **10/10** (Perfect compliance)
- Code Quality Rating: **7/10** (Good structure, but missing critical constraints)

**Critical Issues**: 2
**Major Issues**: 4
**Minor Issues**: 3

---

## Issues Found

### CRITICAL ISSUES (Must Fix Before Approval)

#### CRITICAL-01: Code Field Mutable on Update (Security Risk)

**File**: `apps/frontend/app/api/v1/technical/routings/[id]/route.ts` (Line 176-186)
**Severity**: CRITICAL
**Category**: Security + Data Integrity

**Problem**:
The UPDATE endpoint allows modification of the `code` field, violating the immutability requirement from Story 02.7 context. Code must be immutable after creation to maintain referential integrity and prevent breaking BOM assignments.

**Current Code**:
```typescript
// Line 176-186 in PUT handler
const updateFields: Record<string, unknown> = {}
if (updateData.name !== undefined) updateFields.name = updateData.name
if (updateData.description !== undefined) updateFields.description = updateData.description
// ❌ NO PROTECTION - code CAN be changed if passed in updateData
```

**Expected Behavior**:
- Code should NOT be included in `updateRoutingSchemaV1` (already correct in schema, line 99-100)
- BUT: API should EXPLICITLY reject code changes if client sends it
- Database trigger should also prevent code mutation

**Impact**:
- BOMs referencing routing by code could break
- Audit trail compromised
- Violates FR-2.54 (code as unique identifier)

**How to Fix**:
```typescript
// In PUT handler, BEFORE building updateFields:
if ('code' in body) {
  return NextResponse.json(
    { error: 'Code cannot be changed after creation' },
    { status: 400 }
  )
}

// OR: Add database constraint
ALTER TABLE routings ADD CONSTRAINT prevent_code_update
CHECK (code = (SELECT code FROM routings WHERE id = routings.id));
```

**Test Coverage**: ❌ MISSING - No test verifies code immutability on update

**References**:
- Story 02.7 Context (line 109): "Code must be unique per organization (UNIQUE(org_id, code))"
- TEC-008 Wireframe (line 99): "Code cannot be changed after creation"
- AC-11 to AC-13: Edit tests don't verify code immutability

---

#### CRITICAL-02: Version Trigger Does NOT Increment on Code Change

**File**: `supabase/migrations/046_create_routings_table.sql` (Lines 110-129)
**Severity**: CRITICAL
**Category**: Version Control Logic

**Problem**:
The `increment_routing_version()` trigger does NOT check for `code` changes, yet code IS allowed in the schema. This creates inconsistency:
1. Trigger checks: name, description, is_active, is_reusable, setup_cost, working_cost_per_unit, overhead_percent
2. BUT: Code is NOT checked (line 114-121)

**Current Code**:
```sql
-- Lines 114-121
IF OLD.name IS DISTINCT FROM NEW.name
   OR OLD.description IS DISTINCT FROM NEW.description
   OR OLD.is_active IS DISTINCT FROM NEW.is_active
   OR OLD.is_reusable IS DISTINCT FROM NEW.is_reusable
   OR OLD.setup_cost IS DISTINCT FROM NEW.setup_cost
   OR OLD.working_cost_per_unit IS DISTINCT FROM NEW.working_cost_per_unit
   OR OLD.overhead_percent IS DISTINCT FROM NEW.overhead_percent
THEN
  NEW.version = OLD.version + 1;
END IF;
```

**Missing**:
```sql
-- ❌ Code change NOT checked
OR OLD.code IS DISTINCT FROM NEW.code
```

**Expected Behavior** (2 options):

**Option A** (Recommended): Make code immutable
```sql
-- Add before version check
IF OLD.code IS DISTINCT FROM NEW.code THEN
  RAISE EXCEPTION 'Code cannot be changed after creation';
END IF;
```

**Option B**: Include code in version trigger
```sql
-- Add to IF condition
OR OLD.code IS DISTINCT FROM NEW.code
```

**Recommendation**: Use Option A to enforce immutability at database level.

**Impact**:
- Version doesn't increment when code changes
- Inconsistent versioning semantics
- Violates FR-2.46 (version auto-increment on edit)

**Test Coverage**: ❌ MISSING - No test verifies version increment on code change

---

### MAJOR ISSUES (Should Fix)

#### MAJOR-01: Missing BOM Usage Check Endpoint

**Files Missing**:
- `apps/frontend/app/api/v1/technical/routings/[id]/boms/route.ts` ❌ NOT FOUND

**Severity**: MAJOR
**Category**: Missing Implementation

**Problem**:
Story 02.7 deliverables include endpoint for checking BOM usage before delete (AC-22 to AC-24), but the endpoint does NOT exist.

**Expected Endpoint**:
```typescript
// GET /api/v1/technical/routings/:id/boms
// Response: { boms: BOM[], count: number }
```

**Current Implementation**:
- DELETE endpoint (line 301-304 in [id]/route.ts) checks BOM count
- BUT: Frontend needs SEPARATE endpoint to show usage warning BEFORE delete
- Wireframe TEC-007 (lines 500-526) shows usage check happens BEFORE delete dialog opens

**Impact**:
- Frontend cannot show BOM list in delete confirmation dialog
- AC-22 to AC-24 only partially implemented
- Wireframe TEC-007 delete flow cannot be implemented

**How to Fix**:
Create `apps/frontend/app/api/v1/technical/routings/[id]/boms/route.ts`:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ... auth checks
  const { id } = await params

  const { data: boms } = await supabase
    .from('boms')
    .select(`
      id,
      code,
      product:products(name),
      status
    `)
    .eq('routing_id', id)
    .eq('org_id', orgId)

  return NextResponse.json({
    boms: boms || [],
    count: boms?.length || 0
  })
}
```

**Test Coverage**: ✅ Service layer has `checkRoutingInUse()` (line 499), but NO API endpoint test

**References**:
- TEC-007 Wireframe (lines 697-713): "Check usage first" before delete
- Story 02.7 deliverables (line 88-90): "7 endpoints" (but only 4 exist)
- AC-23: "warning dialog shows usage count, lists affected BOMs"

---

#### MAJOR-02: Missing Clone Endpoint

**Files Missing**:
- `apps/frontend/app/api/v1/technical/routings/[id]/clone/route.ts` ❌ NOT FOUND

**Severity**: MAJOR
**Category**: Incomplete Implementation

**Problem**:
Clone functionality is implemented INSIDE the POST endpoint (line 260-262 in route.ts) using `cloneFrom` parameter, but Story 02.7 deliverables list a SEPARATE clone endpoint.

**Current Implementation**:
```typescript
// POST /api/v1/technical/routings
// Body: { ...routingData, cloneFrom: "source-uuid" }
if (cloneFrom) {
  return handleClone(supabaseAdmin, userData.org_id, cloneFrom, routingData)
}
```

**Expected Implementation** (per Story 02.7 deliverables, line 89):
```typescript
// POST /api/v1/technical/routings/:id/clone
// Body: { code: "new-code", name: "new-name" }
```

**Why This Matters**:
1. Wireframe TEC-007 (line 432) shows clone as separate action: "POST /api/technical/routings with cloneFrom={sourceId}"
2. Deliverables (line 89): "7 endpoints" implies 5 routing + 2 special (clone + BOM usage)
3. REST semantics: POST /:id/clone is clearer than POST with cloneFrom param

**Impact**: MEDIUM
- Current implementation works, but violates REST conventions
- Story deliverables not met (7 endpoints expected, only 4 exist)
- Frontend must use awkward POST with cloneFrom param

**Recommendation**: Either:
1. Create separate clone endpoint (preferred)
2. OR: Update story deliverables to clarify "5 endpoints total" (POST handles clone)

**Test Coverage**: ✅ Clone logic tested via POST endpoint (AC-19 to AC-21)

---

#### MAJOR-03: Code Validation Missing in Schema Update

**File**: `apps/frontend/lib/validation/routing-schemas.ts` (Lines 98-140)
**Severity**: MAJOR
**Category**: Validation Gap

**Problem**:
`updateRoutingSchemaV1` correctly OMITS code field (line 99-100 comment), but this creates ambiguity:
- Is code omitted because it's immutable?
- Or because it's optional on update?

**Current Code**:
```typescript
// Lines 99-100
// Code cannot be changed after creation
// code: not allowed in update
```

**Issue**:
Comment says "not allowed", but schema doesn't ENFORCE this. If client sends `code`, Zod will:
- NOT validate it (field not in schema)
- NOT strip it (no `.strip()` or `.strict()`)
- Pass it to API, where it MAY be used (CRITICAL-01)

**Expected Behavior**:
```typescript
export const updateRoutingSchemaV1 = z.object({
  // ... other fields
})
.strict() // ✅ Reject unknown keys
.refine(
  (data) => !('code' in data),
  { message: 'Code cannot be changed after creation' }
)
```

**OR** (simpler):
```typescript
.transform((data) => {
  const { code, ...rest } = data as any
  if (code !== undefined) {
    throw new Error('Code cannot be changed after creation')
  }
  return rest
})
```

**Impact**:
- Client could send code in PATCH/PUT
- Zod validation passes
- API might accept it (depends on CRITICAL-01 fix)

**How to Fix**:
Add explicit code rejection to `updateRoutingSchemaV1` schema.

**Test Coverage**: ❌ MISSING - No test verifies code rejection on update

---

#### MAJOR-04: Currency Validation Not Enforced on Database

**File**: `supabase/migrations/046_create_routings_table.sql` (Line 53)
**Severity**: MAJOR
**Category**: Data Integrity

**Problem**:
Currency field has NO database constraint to enforce valid values (PLN, EUR, USD, GBP).

**Current Code**:
```sql
-- Line 53
currency TEXT NOT NULL DEFAULT 'PLN',
```

**Issue**:
- Zod schema enforces enum ['PLN', 'EUR', 'USD', 'GBP'] (line 80-83 in routing-schemas.ts)
- BUT: Database allows ANY text value
- If validation bypassed (admin API, SQL injection, manual DB edit), invalid currency accepted

**Expected Behavior**:
```sql
currency TEXT NOT NULL DEFAULT 'PLN'
  CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'))
```

**Impact**:
- Data integrity risk
- Invalid currency values could enter database
- Violates ADR-009 (currency field specification)

**How to Fix**:
Add CHECK constraint in migration:
```sql
ALTER TABLE routings
ADD CONSTRAINT chk_routings_currency_valid
CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'));
```

**Test Coverage**: ❌ MISSING - No test verifies invalid currency rejection at DB level

---

### MINOR ISSUES (Optional Fix)

#### MINOR-01: Inconsistent Error Handling in Clone Logic

**File**: `apps/frontend/app/api/v1/technical/routings/route.ts` (Lines 404-408)
**Severity**: MINOR
**Category**: Code Quality

**Problem**:
Clone operation fetches source operations (line 398-403) but doesn't handle NULL/empty gracefully. If `sourceOps` is NULL (not empty array), logic assumes 0 operations, but doesn't log or warn.

**Current Code**:
```typescript
// Line 410-411
let operationsCount = 0
if (sourceOps && sourceOps.length > 0) {
  // clone ops
}
// ✅ Returns 0 if no ops, but doesn't distinguish NULL vs empty array
```

**Recommendation**:
Add logging when source has no operations:
```typescript
if (!sourceOps || sourceOps.length === 0) {
  console.warn(`Clone source routing ${sourceId} has no operations`)
  operationsCount = 0
} else {
  // clone ops
  operationsCount = clonedOps.length
}
```

**Impact**: LOW - Functional behavior correct, but debugging harder

---

#### MINOR-02: Version Display Format Not Specified

**File**: Validation schemas, API responses
**Severity**: MINOR
**Category**: UX Consistency

**Problem**:
AC-26 specifies version should display as "Version: v2" (with "v" prefix), but API returns raw integer. Frontend must format it.

**Current Response**:
```json
{
  "version": 2  // ✅ Integer
}
```

**Wireframe Expectation** (TEC-008, line 115):
```
Version: v2  // ❌ Formatted string with "v" prefix
```

**Recommendation**:
- Keep API returning integer (correct)
- Add JSDoc to API response type specifying frontend formatting:
  ```typescript
  version: number  // Display as "v{version}" in UI
  ```
- Verify frontend components format correctly

**Impact**: LOW - UX inconsistency, not functional issue

**Test Coverage**: ❌ MISSING - No E2E test verifies "v" prefix display

---

#### MINOR-03: Missing Rollback Comment in Migration

**File**: `supabase/migrations/046_create_routings_table.sql` (Lines 228-234)
**Severity**: MINOR
**Category**: Documentation

**Problem**:
Rollback script provided (good practice), but it's incomplete:
- Doesn't drop constraints before table
- Doesn't handle dependent BOMs (routing_id FK)

**Current Rollback**:
```sql
-- Lines 228-234
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_routing_version_increment ON routings;
-- DROP FUNCTION IF EXISTS increment_routing_version();
-- DROP TABLE IF EXISTS routings;
-- COMMIT;
```

**Complete Rollback** (recommended):
```sql
-- BEGIN;
-- -- 1. Set BOMs routing_id to NULL (if boms table exists)
-- UPDATE boms SET routing_id = NULL WHERE routing_id IS NOT NULL;
-- -- 2. Drop trigger and function
-- DROP TRIGGER IF EXISTS trigger_routing_version_increment ON routings;
-- DROP FUNCTION IF EXISTS increment_routing_version();
-- -- 3. Drop constraints (CASCADE will handle this, but explicit is better)
-- ALTER TABLE routings DROP CONSTRAINT IF EXISTS uq_routings_org_code;
-- -- 4. Drop table
-- DROP TABLE IF EXISTS routings CASCADE;
-- COMMIT;
```

**Impact**: LOW - Rollback rarely used, but good practice

---

## Security Review

### RLS Policies: ✅ EXCELLENT

**File**: `supabase/migrations/046_create_routings_table.sql` (Lines 138-166)

**Assessment**: **9/10**

**Strengths**:
1. ✅ All 4 operations (SELECT, INSERT, UPDATE, DELETE) have RLS policies
2. ✅ Uses ADR-013 pattern: `(SELECT org_id FROM users WHERE id = auth.uid())`
3. ✅ Consistent org_id isolation across all policies
4. ✅ No cross-tenant access possible

**One Issue** (already covered in CRITICAL-01):
- Code mutability allows org-level data corruption (not cross-org, but still security issue)

**Test Coverage**: ✅ Service tests mock org isolation

**Recommendation**: Add explicit RLS test in `supabase/tests/`:
```sql
-- Test: User A cannot read Org B routings
-- Test: User A cannot update Org B routings
-- Test: User A cannot delete Org B routings
```

---

### Permission Checks: ✅ GOOD

**Files**:
- `route.ts` POST (lines 189-202)
- `[id]/route.ts` PUT (lines 119-131)
- `[id]/route.ts` DELETE (lines 271-283)

**Assessment**: **8/10**

**Strengths**:
1. ✅ POST requires Technical write (C)
2. ✅ PUT requires Technical write (U)
3. ✅ DELETE requires Technical delete (D)
4. ✅ Admin override works correctly

**Issue**:
- GET endpoints don't check if user has READ permission (assume all authenticated users can read)
- For routings, this is likely acceptable, but should be documented

**Recommendation**:
Add comment to GET handlers:
```typescript
// READ permission assumed for all authenticated users
// (routings are org-wide resources, not user-specific)
```

---

## ADR-009 Compliance Review

**Decision**: ADR-009 Routing-Level Costs
**Status**: ACCEPTED - IMPLEMENTATION COMPLETE

### Database Schema: ✅ PERFECT (10/10)

**File**: `supabase/migrations/046_create_routings_table.sql` (Lines 49-53)

**Checklist**:
- ✅ setup_cost DECIMAL(10,2) DEFAULT 0 (line 50)
- ✅ working_cost_per_unit DECIMAL(10,4) DEFAULT 0 (line 51)
- ✅ overhead_percent DECIMAL(5,2) DEFAULT 0 (line 52)
- ✅ currency TEXT DEFAULT 'PLN' (line 53)
- ✅ All constraints present (lines 69-82)
- ✅ Check: setup_cost >= 0
- ✅ Check: working_cost_per_unit >= 0
- ✅ Check: overhead_percent 0-100

**ONLY ISSUE**: Currency CHECK constraint missing (see MAJOR-04)

---

### Validation Schemas: ✅ PERFECT (10/10)

**File**: `apps/frontend/lib/validation/routing-schemas.ts` (Lines 60-83)

**Checklist**:
- ✅ setup_cost: min(0), default(0) (lines 61-65)
- ✅ working_cost_per_unit: min(0), default(0) (lines 67-71)
- ✅ overhead_percent: min(0), max(100), default(0) (lines 73-78)
- ✅ currency: enum(['PLN', 'EUR', 'USD', 'GBP']), default('PLN') (lines 80-83)

**Error Messages**: ✅ User-friendly (lines 243-248 in route.ts)

---

### API Implementation: ✅ EXCELLENT (9/10)

**Files**:
- `route.ts` POST (lines 279-294)
- `[id]/route.ts` PUT (lines 183-186)

**Checklist**:
- ✅ POST endpoint saves all cost fields (lines 289-292)
- ✅ PUT endpoint allows cost field updates (lines 183-186)
- ✅ Defaults applied correctly (?? operator)
- ✅ Clone copies cost fields (lines 384-387)

**Minor Issue**: Currency not validated at API level (relies on Zod), but acceptable.

---

## Code Quality Review

### TypeScript Strict Mode: ✅ GOOD (8/10)

**Strengths**:
- ✅ All route files use strict TypeScript
- ✅ Types imported from validation schemas
- ✅ No `any` types used (except controlled cases)
- ✅ Proper async/await usage

**Issues**:
- Service layer (routing-service.ts) uses old types (lines 16-26) that don't include ADR-009 fields
- Should update service types to match validation schemas

---

### Error Handling: ✅ GOOD (7/10)

**Strengths**:
- ✅ Try-catch blocks in all endpoints
- ✅ Specific error codes (409 for duplicate, 404 for not found)
- ✅ User-friendly error messages (lines 213-248 in route.ts)

**Issues**:
- Some error paths log to console but don't return actionable errors
- Clone rollback (lines 406, 432) deletes routing but doesn't inform user

**Recommendation**:
```typescript
// Line 406 - Better error message
await supabaseAdmin.from('routings').delete().eq('id', newRouting.id)
return NextResponse.json({
  error: 'Failed to clone operations. New routing was rolled back.',
  code: 'CLONE_ROLLBACK'
}, { status: 500 })
```

---

### Code Duplication: ✅ GOOD (8/10)

**Strengths**:
- ✅ Clone logic extracted to `handleClone()` (line 328)
- ✅ Auth checks consistent across endpoints
- ✅ Validation centralized in schemas

**Minor Issue**:
- Permission check logic duplicated in POST/PUT/DELETE (lines 189-202, 119-131, 271-283)
- Could extract to helper function:
  ```typescript
  async function checkTechPermission(user, action: 'C'|'U'|'D')
  ```

---

## Wireframe Compliance Review

### TEC-007 (Routings List): 🟡 PARTIAL (70%)

**Implemented**:
- ✅ GET /api/v1/technical/routings (list with filters)
- ✅ Search by code/name (line 101)
- ✅ Filter by status (line 96-98)
- ✅ Operations count included (line 140)
- ✅ BOMs count included (line 141)

**Missing**:
- ❌ Separate clone endpoint (POST /:id/clone) - uses cloneFrom param instead
- ❌ BOM usage check endpoint (GET /:id/boms) - MAJOR-01

**Discrepancy**: Wireframe shows 7 endpoints, implementation has 4-5

---

### TEC-008 (Routing Modal): ✅ GOOD (85%)

**Implemented**:
- ✅ Code field (unique, uppercase, 2-50 chars)
- ✅ Name field (required)
- ✅ Description (optional)
- ✅ is_active status
- ✅ is_reusable flag
- ✅ Cost configuration section (ADR-009)
- ✅ Version display in edit mode (returned in response)

**Missing**:
- ❌ Code immutability enforcement on update (CRITICAL-01)
- ⚠️ Usage warning on deactivate (implemented in DELETE, not in PUT)

---

## Test Coverage Analysis

### Overall Coverage: ✅ EXCELLENT (90/90 tests passing = 100%)

**Breakdown**:
- ✅ Unit tests: 36 passing (routing-service.test.ts)
- ✅ Integration tests: 44 passing (operations.route.test.ts)
- ✅ Component tests: 10 passing (CloneModal, DeleteDialog, DataTable)

### Missing Test Scenarios:

1. ❌ Code immutability on UPDATE (CRITICAL-01)
   ```typescript
   it('should reject code change on update', async () => {
     // Attempt PUT with code field
     // Expect 400 error
   })
   ```

2. ❌ Version increment on code change (CRITICAL-02)
   ```typescript
   it('should increment version when code changes', async () => {
     // Update code field
     // Verify version incremented
   })
   ```

3. ❌ BOM usage endpoint (MAJOR-01)
   ```typescript
   it('GET /:id/boms returns BOM list', async () => {
     // Call GET /routings/:id/boms
     // Verify BOM list returned
   })
   ```

4. ❌ Invalid currency rejection at DB level (MAJOR-04)
   ```sql
   -- RLS test
   INSERT INTO routings (org_id, code, name, currency)
   VALUES ('org-123', 'TEST-01', 'Test', 'INVALID');
   -- Expect constraint violation
   ```

5. ❌ Version display format (MINOR-02)
   ```typescript
   it('should display version with v prefix', async () => {
     // Render routing detail
     // Verify "Version: v2" format
   })
   ```

---

## Acceptance Criteria Verification

### ✅ PASSED (27/30 = 90%)

**Fully Implemented**:
- AC-01 to AC-04: List page ✅
- AC-05 to AC-10: Create with validation ✅
- AC-11 to AC-13: Edit with version increment ✅ (but see CRITICAL-01)
- AC-14: Detail page ✅
- AC-15 to AC-18: Cost configuration ✅
- AC-19 to AC-21: Clone routing ✅
- AC-25 to AC-26: Version control ✅
- AC-27 to AC-28: Reusability flag ✅
- AC-29 to AC-30: Permissions ✅

**Partially Implemented**:
- AC-22 to AC-24: Delete with BOM usage ⚠️
  - DELETE endpoint counts affected BOMs ✅
  - Returns affected count in response ✅
  - BUT: Missing separate GET /:id/boms endpoint for pre-delete check ❌ (MAJOR-01)

**NOT VERIFIED**:
- AC-07: Duplicate code error message ❓ (test exists but not e2e verified)
- AC-13: Usage warning on deactivate ❌ (no test for this)
- AC-24: BOM unassignment toast ❓ (no e2e test)

---

## Performance Considerations

### Database Indexes: ✅ EXCELLENT

**File**: `supabase/migrations/046_create_routings_table.sql` (Lines 92-103)

**Implemented**:
- ✅ idx_routings_org_code (org_id, code) - fast code lookup
- ✅ idx_routings_org_active (org_id, is_active) - fast status filtering
- ✅ idx_routings_org_name (org_id, name) - fast name search

**Recommendation**: Add composite index for list query:
```sql
CREATE INDEX idx_routings_list_query
ON routings(org_id, is_active, name);
```

---

### Query Optimization: ✅ GOOD

**Strengths**:
- ✅ Operations count fetched in bulk (line 124-130 in route.ts)
- ✅ BOMs count fetched in bulk (line 132-136)
- ✅ Proper use of `.single()` vs bulk queries

**Minor Issue**:
- GET list makes 3 separate queries (routings, operations_count, boms_count)
- Could use Supabase aggregation:
  ```typescript
  .select(`
    *,
    operations:routing_operations(count),
    boms:boms(count)
  `)
  ```

**Impact**: LOW - Current approach works, just 2 extra queries

---

## Summary of Required Changes

### Must Fix (CRITICAL)

1. **CRITICAL-01**: Enforce code immutability on UPDATE
   - Add validation in PUT endpoint
   - Reject code changes with 400 error
   - Add test: `should reject code change on update`

2. **CRITICAL-02**: Fix version trigger to handle code changes
   - Add constraint to prevent code mutation in trigger
   - OR: Include code in version increment check
   - Add test: version increment on code change

### Should Fix (MAJOR)

3. **MAJOR-01**: Create GET /:id/boms endpoint
   - Implement `apps/frontend/app/api/v1/technical/routings/[id]/boms/route.ts`
   - Return BOM list with product names and status
   - Add test: `GET /:id/boms returns BOM list`

4. **MAJOR-02**: Clarify clone endpoint implementation
   - Either: Create POST /:id/clone endpoint
   - OR: Update story deliverables to reflect "5 endpoints" with cloneFrom param

5. **MAJOR-03**: Add code rejection to update schema
   - Add `.strict()` or explicit code check to `updateRoutingSchemaV1`
   - Throw error if code present in update payload

6. **MAJOR-04**: Add currency CHECK constraint
   - Add migration: `ALTER TABLE routings ADD CONSTRAINT chk_routings_currency_valid`
   - Add test: invalid currency rejection at DB level

### Optional (MINOR)

7. **MINOR-01**: Add logging to clone operation
8. **MINOR-02**: Add version display format JSDoc
9. **MINOR-03**: Complete rollback script in migration

---

## Positive Findings

### What Was Done Well ✅

1. **ADR-009 Compliance**: Perfect implementation of routing-level costs
2. **RLS Policies**: Excellent org isolation using ADR-013 pattern
3. **Test Coverage**: 90/90 tests passing (100%) - exceptional
4. **Version Trigger**: Auto-increment logic works correctly
5. **Clone Logic**: Well-implemented with rollback on failure
6. **Error Messages**: User-friendly, specific error codes
7. **Code Structure**: Clean separation of concerns (API, service, validation)
8. **Database Design**: Proper constraints, indexes, and comments

---

## Final Recommendation

**Decision**: REQUEST_CHANGES

**Rationale**:
While Story 02.7 has excellent test coverage (100%) and implements ADR-009 perfectly, there are **2 CRITICAL issues** that violate core requirements:

1. Code field is mutable on update (violates FR-2.54, TEC-008)
2. Version trigger doesn't prevent code changes (violates FR-2.46)

Additionally, **4 MAJOR issues** affect completeness:
- Missing BOM usage check endpoint (AC-22 to AC-24 only partial)
- Missing clone endpoint (deliverables specify 7 endpoints, only 4-5 exist)
- Code validation gap in update schema
- Currency constraint missing in database

**Blockers for Approval**:
- Fix CRITICAL-01 (code immutability)
- Fix CRITICAL-02 (version trigger)
- Fix MAJOR-01 (BOM usage endpoint)

**Once Fixed**: Story will be **APPROVED** for merge.

---

## Files Reviewed

### Database (1 file)
- ✅ `supabase/migrations/046_create_routings_table.sql` (235 lines)

### API Routes (2 files)
- ✅ `apps/frontend/app/api/v1/technical/routings/route.ts` (444 lines)
- ✅ `apps/frontend/app/api/v1/technical/routings/[id]/route.ts` (333 lines)
- ❌ `apps/frontend/app/api/v1/technical/routings/[id]/clone/route.ts` (MISSING)
- ❌ `apps/frontend/app/api/v1/technical/routings/[id]/boms/route.ts` (MISSING)

### Services (1 file)
- ✅ `apps/frontend/lib/services/routing-service.ts` (717 lines)

### Validation (1 file)
- ✅ `apps/frontend/lib/validation/routing-schemas.ts` (338 lines)

### Components (4 files)
- ✅ `components/technical/routings/create-routing-modal.tsx`
- ✅ `components/technical/routings/clone-routing-modal.tsx`
- ✅ `components/technical/routings/delete-routing-dialog.tsx`
- ✅ `components/technical/routings/routings-data-table.tsx`

**Total Files Reviewed**: 9 files (~2,067 lines of code)

---

**Review Complete**: 2025-12-28
**Next Action**: DEV to address CRITICAL and MAJOR issues, then re-submit for review
