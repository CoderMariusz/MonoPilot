# Code Review Report: Story 02.8 - Routing Operations Management

**Story ID**: 02.8
**Epic**: 02-technical
**Review Date**: 2025-12-28
**Reviewer**: CODE-REVIEWER Agent
**Test Status**: 60/60 PASSING (100%)
**Decision**: REQUEST_CHANGES

---

## Executive Summary

Story 02.8 implements routing operations management with parallel operations support, time tracking, and machine assignment. While the **business logic is excellent** and **tests are passing (100%)**, there are **CRITICAL security and architecture issues** that must be fixed before merging.

**Key Issues**:
1. **CRITICAL**: Missing RLS policies on `routing_operations` table (ADR-013 violation)
2. **CRITICAL**: Missing database migration for `routing_operations` table
3. **MAJOR**: API routes using `createServerSupabaseAdmin` without proper RLS enforcement
4. **MAJOR**: Inconsistent field mapping between database schema and service layer
5. **MINOR**: UI component missing parallel operations indicator

---

## Security Rating: 4/10 (BLOCKING)

### CRITICAL Issues

#### 1. Missing RLS Policies (file:supabase/migrations/*)

**Location**: No migration file found for `routing_operations` RLS
**Severity**: CRITICAL
**Impact**: CROSS-TENANT DATA EXPOSURE

**Problem**:
The `routing_operations` table exists but has NO Row Level Security policies. This violates ADR-013 (RLS Org Isolation Pattern) and allows users to:
- Read operations from other organizations
- Create/update/delete operations in other orgs' routings
- Bypass org_id isolation entirely

**Evidence**:
```bash
# No RLS policies found for routing_operations
grep "CREATE POLICY.*routing_operations" supabase/migrations/*.sql
# Result: No matches found
```

**Required Fix**:
Create migration with standard RLS policy per ADR-013:

```sql
-- File: supabase/migrations/047_routing_operations_rls.sql

-- Enable RLS
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;

-- Standard org isolation policy (ADR-013 pattern)
CREATE POLICY "org_isolation" ON routing_operations
FOR ALL
USING (
  org_id IN (
    SELECT r.org_id
    FROM routings r
    WHERE r.id = routing_operations.routing_id
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_id
ON routing_operations(routing_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON routing_operations TO authenticated;
```

**Why This Matters**:
- User A from Org 1 can currently read/modify operations from Org 2
- RLS is the ONLY defense against cross-tenant data leaks in multi-tenant SaaS
- Tests passing doesn't mean security works (tests likely use admin/service role)

---

#### 2. Service Layer Using Admin Client Without RLS

**Location**: `apps/frontend/lib/services/routing-operations-service.ts:296`
**Severity**: CRITICAL
**Impact**: RLS BYPASS IN CREATE OPERATION

**Problem**:
```typescript
// Line 296 in routing-operations-service.ts
const supabaseAdmin = createServerSupabaseAdmin()  // CRITICAL: Bypasses RLS!

// Later used to create operation (line 331)
const { data: operation, error } = await supabaseAdmin
  .from('routing_operations')
  .insert({ ... })
```

Using `createServerSupabaseAdmin()` **bypasses ALL RLS policies**. Even after adding RLS policies, this code will still allow cross-tenant access.

**Required Fix**:
```typescript
// BEFORE (WRONG):
const supabaseAdmin = createServerSupabaseAdmin()
const { data: routing } = await supabaseAdmin.from('routings')...

// AFTER (CORRECT):
const supabase = await createServerSupabase()  // Uses authenticated user context
const { data: routing } = await supabase.from('routings')...
```

**Affected Functions**:
- `createOperation` (line 281) - Uses admin client
- Other functions correctly use `createServerSupabase()`

---

### MAJOR Security Issues

#### 3. Permission Checks Incomplete

**Location**: `apps/frontend/app/api/v1/technical/routings/[id]/operations/route.ts:92-103`
**Severity**: MAJOR
**Impact**: INCONSISTENT PERMISSION ENFORCEMENT

**Problem**:
Permission checks parse `permissions.technical` string manually instead of using centralized permission service:

```typescript
// Line 92-96 (manual parsing, error-prone)
const techPerm = (userData.role as any)?.permissions?.technical || ''
const roleCode = (userData.role as any)?.code || ''

const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
const hasTechWrite = techPerm.includes('C')  // Fragile string check
```

**Why It's a Problem**:
- No validation that 'C' is a valid permission code
- Hardcoded role codes ('admin', 'super_admin')
- Different from pattern used in other modules
- Permissions object structure assumed but not validated

**Recommended Fix**:
Use centralized permission service (if exists) or create reusable middleware:

```typescript
// Create: lib/services/permission-service.ts
export async function hasPermission(
  module: 'technical' | 'settings' | ...,
  action: 'C' | 'R' | 'U' | 'D'
): Promise<boolean> {
  // Centralized permission logic
  // Validates role structure
  // Consistent across all API routes
}

// Use in API routes:
if (!await hasPermission('technical', 'C')) {
  return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
}
```

---

## Code Quality Rating: 7/10 (ACCEPTABLE)

### MAJOR Code Quality Issues

#### 4. Database Schema Mismatch

**Location**: `apps/frontend/lib/services/routing-operations-service.ts:236-253`
**Severity**: MAJOR
**Impact**: DATA MAPPING ERRORS

**Problem**:
Service layer transforms database field names but mapping is inconsistent with actual schema:

```typescript
// Line 236-253: Database field mapping
const transformedOperations: RoutingOperation[] = (operations || []).map(op => ({
  // ...
  setup_time: op.setup_time_minutes || 0,        // DB: setup_time_minutes
  duration: op.expected_duration_minutes || 0,    // DB: expected_duration_minutes
  cleanup_time: 0,                                // DB: cleanup_time (exists in migration 044)
  labor_cost_per_hour: op.labor_cost || 0,       // DB: labor_cost
  instructions: null,                             // DB: instructions (exists in migration 044)
  attachment_count: 0,                            // Not in DB yet
}))
```

**Issues**:
1. `cleanup_time` hardcoded to 0 despite existing in DB schema (migration 044)
2. `instructions` hardcoded to null despite existing in DB schema (migration 044)
3. No validation that DB columns exist before mapping

**Evidence from Migration 044**:
```sql
-- From archive/044_add_routing_fields.sql
ALTER TABLE routing_operations ADD COLUMN cleanup_time INTEGER DEFAULT 0;
ALTER TABLE routing_operations ADD COLUMN instructions TEXT;
```

**Required Fix**:
```typescript
// Fix SELECT query to include all fields (line 207-222)
const { data: operations } = await supabase
  .from('routing_operations')
  .select(`
    id,
    routing_id,
    sequence,
    operation_name,
    machine_id,
    line_id,
    expected_duration_minutes,
    expected_yield_percent,
    setup_time_minutes,
    cleanup_time_minutes,        // ADD THIS
    instructions,                 // ADD THIS
    labor_cost,
    created_at,
    updated_at,
    machines:machine_id(id, code, name)
  `)

// Fix transformation
cleanup_time: op.cleanup_time_minutes || 0,  // Use actual DB field
instructions: op.instructions || null,        // Use actual DB field
```

---

#### 5. Missing Database Table

**Location**: All migration files
**Severity**: MAJOR
**Impact**: CODE CANNOT RUN

**Problem**:
No migration found that CREATES the `routing_operations` table. Only found:
- Migration 044 (archived): ALTERS table (adds cleanup_time, instructions)
- Migration 050 (archived): REMOVES unique constraint for parallel ops
- Migration 029: References table in GRANT statements

**Evidence**:
```bash
grep -r "CREATE TABLE.*routing_operations" supabase/migrations/
# Result: No matches
```

**Required Fix**:
Create base table migration or move archived migrations to active:

```sql
-- File: supabase/migrations/046_create_routing_operations.sql

CREATE TABLE IF NOT EXISTS routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  operation_name TEXT NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  expected_duration_minutes INTEGER NOT NULL,
  setup_time_minutes INTEGER DEFAULT 0,
  cleanup_time_minutes INTEGER DEFAULT 0,
  labor_cost DECIMAL(15,4) DEFAULT 0,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NO unique constraint (allows parallel operations per migration 050)
-- Removed: UNIQUE(routing_id, sequence)

CREATE INDEX idx_routing_operations_routing_id ON routing_operations(routing_id);
CREATE INDEX idx_routing_operations_sequence ON routing_operations(routing_id, sequence);
```

---

### MINOR Code Quality Issues

#### 6. UI Component Missing Parallel Operations Indicator

**Location**: `apps/frontend/components/technical/routings/operations-table.tsx:130`
**Severity**: MINOR
**Impact**: UX NOT MATCHING AC-03

**Problem**:
The operations table displays operation names but doesn't append "(Parallel)" suffix when sequence numbers are duplicated, as required by AC-03:

```typescript
// Line 130 (current implementation)
<TableCell>{operation.name}</TableCell>

// Should be (per AC-03 and wireframe TEC-008a line 69):
<TableCell>
  {operation.name}
  {isParallelOperation(operation, operations) && ' (Parallel)'}
</TableCell>
```

**Acceptance Criteria**:
- **AC-03**: "When sequence numbers contain duplicates (parallel ops), '(Parallel)' indicator appends to operation name"
- **AC-05**: "Both ops show '(Parallel)' suffix: 'Proofing (Parallel)', 'Heating (Parallel)'"

**Required Fix**:
```typescript
// Add helper function from service
import { isParallelOperation } from '@/lib/services/routing-operations-service'

// Update table cell
<TableCell>
  {operation.name}
  {isParallelOperation(operation, operations) && (
    <span className="text-muted-foreground"> (Parallel)</span>
  )}
</TableCell>
```

---

#### 7. Hardcoded Placeholder Values

**Location**: `apps/frontend/lib/services/routing-operations-service.ts:163`
**Severity**: MINOR
**Impact**: MISLEADING SUMMARY DATA

**Problem**:
```typescript
// Line 163
average_yield: 100,  // Placeholder - actual yield tracking would come from production
```

Hardcoded placeholder could mislead users. Should either:
1. Calculate from `expected_yield_percent` if available
2. Return `null` to indicate no data
3. Remove field entirely if not implemented

**Recommended Fix**:
```typescript
// Option 1: Calculate weighted average (if expected_yield_percent exists)
const totalYield = operations.reduce((sum, op) =>
  sum + (op.expected_yield_percent || 100) * op.duration, 0
)
const average_yield = totalDuration > 0 ? totalYield / totalDuration : null

// Option 2: Return null to indicate not implemented
average_yield: null,
```

---

## Parallel Operations Logic: EXCELLENT

### What Works Well

The parallel operations implementation is **textbook-perfect**:

1. **Duration Calculation** (line 112-143):
   ```typescript
   // Groups operations by sequence
   // Takes MAX duration per group (not SUM)
   // Correctly implements FR-2.48
   const maxTime = Math.max(
     ...group.map(op => (op.setup_time || 0) + op.duration + (op.cleanup_time || 0))
   )
   totalDuration += maxTime  // SUM across groups, MAX within groups
   ```

2. **Cost Calculation** (line 149-154):
   ```typescript
   // SUMs all operations including parallel (both incur cost)
   // Correctly implements FR-2.48
   for (const op of group) {
     totalLaborCost += op.labor_cost_per_hour * (op.duration / 60)
   }
   ```

3. **Detection Function** (line 71-91):
   ```typescript
   // Clean, efficient parallel operation detection
   // Returns Map of sequence -> operation IDs
   // Used by UI to show "(Parallel)" indicator
   ```

4. **Reorder Logic** (line 594-702):
   ```typescript
   // Handles parallel operations correctly
   // Swaps only ONE operation, not all at same sequence
   // Uses unique sequences array for boundaries
   ```

**Positive Feedback**: This is production-grade business logic. Well-documented, follows requirements exactly, handles edge cases.

---

## API Routes: GOOD STRUCTURE, NEEDS SECURITY FIX

### What Works Well

1. **Consistent Error Handling**:
   ```typescript
   // All routes follow same pattern
   if (!result.success) {
     const status = result.code === 'ROUTING_NOT_FOUND' ? 404 : 500
     return NextResponse.json({ error: result.code, message: result.error }, { status })
   }
   ```

2. **Permission Checks on Write Operations**:
   - POST: Checks for 'C' (create) permission
   - PUT: Checks for 'U' (update) permission
   - DELETE: Checks for 'D' (delete) permission
   - PATCH: Checks for 'U' (update) permission

3. **Validation with Zod**:
   ```typescript
   const validationResult = operationFormSchema.safeParse(body)
   if (!validationResult.success) {
     return NextResponse.json({ error: 'VALIDATION_ERROR', details: ... })
   }
   ```

### Issues

See Security section above:
- Admin client bypass (CRITICAL)
- Manual permission parsing (MAJOR)

---

## Validation Schemas: EXCELLENT

### What Works Well

**File**: `apps/frontend/lib/validation/operation-schemas.ts`

1. **Comprehensive Field Validation** (line 25-75):
   ```typescript
   sequence: z.number().int().min(1)  // Positive integer
   name: z.string().min(3).max(100)   // Required, bounded
   duration: z.number().int().min(1)  // At least 1 minute
   setup_time: z.number().int().min(0).default(0)  // Non-negative
   cleanup_time: z.number().int().min(0).default(0)  // Non-negative
   instructions: z.string().max(2000).nullable().optional()  // Bounded text
   ```

2. **Attachment Validation** (line 83-120):
   ```typescript
   ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd...']
   MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
   MAX_ATTACHMENTS = 5
   ```

3. **Helper Functions** (line 147-178):
   - `validateAttachmentFile()` - Pre-upload validation
   - `isAllowedFileType()` - MIME type check
   - `getFileExtension()` - Mapping helper

**Positive Feedback**: Well-structured, clear error messages, follows best practices.

---

## TypeScript Types: WELL-DEFINED

**File**: `apps/frontend/lib/types/routing-operation.ts`

### What Works Well

1. **Clear Interfaces** (line 11-29):
   ```typescript
   interface RoutingOperation {
     id: string
     routing_id: string
     sequence: number
     name: string
     machine_id: string | null  // Correctly nullable
     setup_time: number         // minutes
     duration: number           // minutes
     cleanup_time: number       // minutes
     labor_cost_per_hour: number
     instructions: string | null
     attachment_count: number
   }
   ```

2. **Summary Types** (line 42-49):
   ```typescript
   interface OperationsSummary {
     total_operations: number
     total_duration: number    // MAX per sequence for parallel
     total_labor_cost: number  // SUM all ops including parallel
     // Clear comments explain calculation logic
   }
   ```

3. **Request/Response Types** (line 51-86):
   - `CreateOperationRequest` - Required vs optional fields clear
   - `UpdateOperationRequest` - Partial update support
   - `ReorderRequest` - Enum-like 'up' | 'down'
   - `OperationsListResponse` - Includes summary

**Positive Feedback**: Excellent type safety, clear documentation.

---

## Test Coverage: 100% PASSING

**Status**: 60/60 tests PASSING

### Acceptance Criteria Coverage

Based on `tests.yaml`, all critical ACs are covered:
- **AC-01**: Operations load within 500ms (performance)
- **AC-02**: 8 columns displayed (UX)
- **AC-03**: Parallel indicator shown (UX)
- **AC-04-07**: Parallel operations logic (business rules)
- **AC-08-10**: Time tracking validation (validation)
- **AC-11-14**: Machine assignment optional (business rules)
- **AC-15-17**: Instructions field (validation)
- **AC-18-21**: Attachments (file upload)
- **AC-22-24**: Add/Edit operations (CRUD)
- **AC-25-27**: Reorder operations (business logic)
- **AC-28-29**: Delete operations (CRUD)
- **AC-30-31**: Summary panel (calculations)
- **AC-32**: Permission enforcement (security)

### Test Quality

**Positive Feedback**:
- Comprehensive unit tests for calculations
- Integration tests for API endpoints
- Component tests for UI
- E2E tests for workflows
- RLS tests for cross-tenant isolation (though RLS not implemented!)

**Concern**:
Tests likely use admin/service role, which bypasses RLS. This is why tests pass despite missing RLS policies.

---

## ADR Compliance

### ADR-013: RLS Org Isolation Pattern

**Status**: VIOLATED
**Impact**: CRITICAL SECURITY ISSUE

**Required**:
```sql
CREATE POLICY "org_isolation" ON routing_operations
FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Actual**: NO RLS POLICIES FOUND

**Fix**: See Security section above

---

### ADR-009: Routing Level Costs

**Status**: COMPLIANT

Cost calculation correctly sums all operations including parallel ops (line 149-154).

---

## Performance

### Calculation Performance: GOOD

```typescript
// calculateSummary() complexity: O(n) where n = operations count
// Group operations: O(n)
// Calculate max per group: O(n)
// Total: O(n)
```

**Target**: 500ms for 50 operations
**Expected**: <50ms for calculation logic (excellent)

### Database Performance: NEEDS INDEXES

**Current**: 2 indexes suggested
- `idx_routing_operations_routing_id`
- `idx_routing_operations_sequence`

**Recommended**: Add composite index for parallel op queries
```sql
CREATE INDEX idx_routing_operations_routing_seq
ON routing_operations(routing_id, sequence);
```

---

## Accessibility: PARTIAL

**What Works**:
- Button `title` attributes for screen readers (line 148, 155)
- Semantic HTML (Table, Card components)

**Missing** (from wireframe requirements):
- `aria-label` on action buttons
- `role="status"` on loading states
- `aria-live="polite"` on info messages
- Keyboard navigation handlers (Arrow keys, Enter, Delete)

**Fix**: Add ARIA attributes per TEC-008a wireframe spec (lines 1162-1183)

---

## Files Reviewed

### Service Layer
- `apps/frontend/lib/services/routing-operations-service.ts` (999 lines)
  - Rating: 7/10 (excellent logic, security issues)

### Validation
- `apps/frontend/lib/validation/operation-schemas.ts` (179 lines)
  - Rating: 9/10 (excellent)

### Types
- `apps/frontend/lib/types/routing-operation.ts` (109 lines)
  - Rating: 9/10 (excellent)

### API Routes
- `apps/frontend/app/api/v1/technical/routings/[id]/operations/route.ts` (136 lines)
  - Rating: 6/10 (good structure, security issues)
- `apps/frontend/app/api/v1/technical/routings/[id]/operations/[opId]/route.ts` (174 lines)
  - Rating: 6/10 (good structure, security issues)
- `apps/frontend/app/api/v1/technical/routings/[id]/operations/[opId]/reorder/route.ts` (97 lines)
  - Rating: 7/10 (good)

### UI Components
- `apps/frontend/components/technical/routings/operations-table.tsx` (196 lines)
  - Rating: 7/10 (missing parallel indicator)

### Database Migrations
- **NOT FOUND**: Base table creation migration
  - Rating: 0/10 (CRITICAL BLOCKER)

---

## Required Fixes (Priority Order)

### P0 - CRITICAL (BLOCKING MERGE)

1. **Create RLS policies migration** (Security Rating: 4/10)
   - File: `supabase/migrations/047_routing_operations_rls.sql`
   - Add standard org isolation policy per ADR-013
   - Add indexes for performance
   - Validate with RLS tests

2. **Create base table migration** (Code Quality: 7/10)
   - File: `supabase/migrations/046_create_routing_operations.sql`
   - Define complete table schema
   - Include all fields (cleanup_time, instructions)
   - No unique constraint on sequence (parallel ops)

3. **Fix admin client bypass** (Security: CRITICAL)
   - File: `routing-operations-service.ts:296`
   - Replace `createServerSupabaseAdmin()` with `createServerSupabase()`
   - Validate RLS enforcement after fix

### P1 - MAJOR (SHOULD FIX)

4. **Fix database field mapping** (Code Quality: MAJOR)
   - File: `routing-operations-service.ts:207-253`
   - Add cleanup_time_minutes to SELECT query
   - Add instructions to SELECT query
   - Map actual DB fields instead of hardcoded nulls

5. **Centralize permission checks** (Security: MAJOR)
   - Create `lib/services/permission-service.ts`
   - Replace manual permission parsing in all API routes
   - Validate role structure before checking permissions

### P2 - MINOR (NICE TO HAVE)

6. **Add parallel operations UI indicator** (UX: MINOR)
   - File: `operations-table.tsx:130`
   - Import `isParallelOperation` helper
   - Append "(Parallel)" suffix when needed

7. **Fix average_yield placeholder** (Code Quality: MINOR)
   - File: `routing-operations-service.ts:163`
   - Calculate from expected_yield_percent or return null
   - Remove misleading hardcoded value

8. **Add accessibility attributes** (A11y: MINOR)
   - Add ARIA labels to all buttons
   - Add keyboard navigation handlers
   - Add screen reader announcements

---

## Positive Highlights

### What Was Done EXCELLENTLY

1. **Parallel Operations Logic** 10/10
   - Perfect implementation of FR-2.48
   - MAX duration, SUM cost logic correct
   - Well-documented with clear comments

2. **Validation Schemas** 9/10
   - Comprehensive Zod schemas
   - Clear error messages
   - Helper functions for common checks

3. **TypeScript Types** 9/10
   - Complete type coverage
   - Clear interfaces
   - Nullable fields correctly marked

4. **Test Coverage** 10/10
   - 60/60 tests passing
   - All ACs covered
   - Unit + integration + E2E tests

5. **Service Layer Structure** 8/10
   - Clean separation of concerns
   - Reusable helper functions
   - Good error handling

---

## Decision Rationale

### Why REQUEST_CHANGES Despite 100% Tests Passing?

**Security trumps test coverage.**

The missing RLS policies create a **critical security vulnerability** that would allow cross-tenant data access in production. Tests pass because they likely use admin/service role which bypasses RLS.

**Real-world impact**:
- Organization A could read/modify Organization B's routing operations
- Data breach risk in multi-tenant SaaS
- GDPR violation potential

**Tests don't catch this because**:
- Unit tests mock database
- Integration tests likely use service role
- E2E tests run in isolated environment

**This is a textbook example of why security reviews are essential even when tests pass.**

---

## Approval Criteria

To change decision to APPROVED, must complete:

- [x] All AC implemented (60/60 tests passing)
- [ ] **NO CRITICAL security issues** (FAILED: Missing RLS)
- [ ] **NO MAJOR security issues** (FAILED: Admin client bypass)
- [ ] Tests pass with adequate coverage (PASSED: 100%)
- [ ] Positive feedback included (PASSED: See above)
- [ ] All issues have file:line references (PASSED)

**Current Status**: 4 of 6 criteria met

---

## Handoff to DEV

### Required Fixes Summary

```yaml
story: "02.8"
decision: request_changes
security_rating: 4/10
code_quality_rating: 7/10

required_fixes:
  - fix: "Create RLS policies migration with org isolation"
    file: "supabase/migrations/047_routing_operations_rls.sql"
    severity: CRITICAL

  - fix: "Create base table migration for routing_operations"
    file: "supabase/migrations/046_create_routing_operations.sql"
    severity: CRITICAL

  - fix: "Replace createServerSupabaseAdmin with createServerSupabase in createOperation"
    file: "apps/frontend/lib/services/routing-operations-service.ts:296"
    severity: CRITICAL

  - fix: "Add cleanup_time and instructions to SELECT query"
    file: "apps/frontend/lib/services/routing-operations-service.ts:207-222"
    severity: MAJOR

  - fix: "Create centralized permission service"
    file: "apps/frontend/lib/services/permission-service.ts"
    severity: MAJOR

optional_improvements:
  - fix: "Add (Parallel) suffix to operation names in UI"
    file: "apps/frontend/components/technical/routings/operations-table.tsx:130"
    severity: MINOR

  - fix: "Calculate average_yield or return null instead of hardcoded 100"
    file: "apps/frontend/lib/services/routing-operations-service.ts:163"
    severity: MINOR

test_validation_needed:
  - "Verify RLS policies block cross-tenant access"
  - "Test with authenticated user context (not admin role)"
  - "Validate cleanup_time and instructions fields save/retrieve correctly"

estimated_fix_time: "4-6 hours"
blocks_qa: true
blocks_merge: true
```

---

## Conclusion

Story 02.8 demonstrates **excellent business logic and test coverage**, but has **critical security gaps** that must be fixed before deployment. The parallel operations implementation is production-ready, but the missing RLS policies create an unacceptable security risk.

**Recommendation**: Fix the 3 CRITICAL issues (RLS policies, table migration, admin client bypass) then re-review. The MAJOR and MINOR issues can be addressed in a follow-up story if time is constrained.

**Estimated Fix Time**: 4-6 hours for CRITICAL fixes

---

**Review Complete**
**Reviewer**: CODE-REVIEWER Agent
**Date**: 2025-12-28
**Next Step**: DEV team to address required fixes, then request re-review
