# Code Review Report: Stories 02.1 (Products) + 02.7 (Routings)

**Review Date:** 2025-12-24
**Reviewer:** CODE-REVIEWER Agent (Opus 4.5)
**Stories:** 02.1 (Products CRUD + Types) and 02.7 (Routings CRUD)
**Decision:** REQUEST_CHANGES

---

## Executive Summary

| Metric | Score | Status |
|--------|-------|--------|
| Overall Quality | 6.5/10 | NEEDS WORK |
| Security | 7/10 | ACCEPTABLE |
| Test Coverage | 5/10 | NEEDS IMPROVEMENT |
| Code Quality | 7/10 | ACCEPTABLE |
| Accessibility | 7/10 | ACCEPTABLE |
| Performance | 6/10 | NEEDS WORK |

**Recommendation:** REQUEST_CHANGES

While both stories have functional implementations with good Zod validation schemas and basic RLS policies, there are significant issues that must be addressed:
- 337 tests FAILING in the overall test suite
- API integration tests for Products and Routings have mock configuration issues (27 failures)
- Schema mismatch between routing-service.ts and database (is_active vs status field)
- Missing role-based access checks in some API routes
- Several TODO items that should be resolved before production

---

## 1. Critical Issues (MUST FIX)

### CRITICAL-001: Test Suite is Broken - 337 Tests Failing
**Severity:** CRITICAL
**File:** Various test files across the codebase
**Impact:** Cannot verify code correctness, blocks CI/CD

The test suite is in a broken state with 337 failing tests out of 2564 total. Many failures are due to:
1. Mock configuration issues in API tests (`createServerSupabase` not properly mocked)
2. Test expectations not matching actual implementation

**Evidence:**
```
Test Files: 44 failed | 61 passed | 1 skipped (106)
Tests: 337 failed | 2198 passed | 29 skipped (2564)
```

**Required Fix:** Fix all test mocks and ensure CI passes before merge.

---

### CRITICAL-002: Product/Routing API Tests Have Mock Issues
**Severity:** CRITICAL
**File:** `apps/frontend/__tests__/api/technical/products.test.ts:121`
**File:** `apps/frontend/__tests__/api/technical/routings.test.ts`
**Impact:** Cannot verify API route correctness

The API tests fail with:
```
Error: [vitest] No "createServerSupabase" export is defined on the "@/lib/supabase/server" mock
```

This means:
- Product API tests: All failing
- Routing API tests: 5 failing out of 27

**Required Fix:** Update test mocks to properly export `createServerSupabase`:
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn().mockResolvedValue(mockSupabaseClient),
}))
```

---

### CRITICAL-003: Schema Mismatch - Routing Service vs Database
**Severity:** CRITICAL
**File:** `apps/frontend/lib/services/routing-service.ts:24`
**File:** `apps/frontend/lib/supabase/migrations/020_create_routings_table.sql:19`

The service uses `is_active: boolean` but the database uses `status: VARCHAR(20)` with values 'active'/'inactive'.

**Service code (line 24):**
```typescript
export interface Routing {
  // ...
  is_active: boolean  // WRONG - doesn't match DB
}
```

**Database schema (line 19):**
```sql
status VARCHAR(20) NOT NULL DEFAULT 'active',
CONSTRAINT routings_status_check CHECK (status IN ('active', 'inactive'))
```

**Impact:** Queries will fail or return incorrect data when filtering by `is_active`.

**Required Fix:** Either:
1. Update database to use `is_active BOOLEAN` column, OR
2. Update service to use `status: 'active' | 'inactive'` and transform in queries

---

## 2. Major Issues (SHOULD FIX)

### MAJOR-001: Missing Reference Check Before Product Deletion
**Severity:** MAJOR
**File:** `apps/frontend/app/api/technical/products/[id]/route.ts:252-254`

The DELETE endpoint has a TODO comment indicating missing validation:
```typescript
// TODO: Check if product is referenced in active BOMs or WOs
// For now, we'll allow deletion
```

**Impact:** Products referenced by BOMs or Work Orders can be deleted, causing data integrity issues.

**Required Fix:** Add reference check before allowing deletion:
```typescript
const { count } = await supabase
  .from('bom_items')
  .select('id', { count: 'exact', head: true })
  .eq('product_id', id)

if (count && count > 0) {
  return NextResponse.json(
    { error: 'Cannot delete product: it is referenced by BOMs' },
    { status: 400 }
  )
}
```

---

### MAJOR-002: RLS Policy Uses JWT org_id - Potential Security Issue
**Severity:** MAJOR
**File:** `apps/frontend/lib/supabase/migrations/020_create_routings_table.sql:58-60`

RLS policies use `(auth.jwt() ->> 'org_id')::uuid` which requires the JWT to contain org_id claim:

```sql
CREATE POLICY routings_select_policy ON public.routings
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Concern:** If JWT doesn't contain org_id, this returns NULL and no rows are visible. This is inconsistent with other tables that use `users.org_id` lookup.

**Impact:** Different RLS approaches across tables may cause confusion and potential security gaps.

**Recommended Fix:** Standardize RLS pattern across all tables:
```sql
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
```

---

### MAJOR-003: Routing Delete Allows Technical Role, Migration Only Allows Admin
**Severity:** MAJOR
**File:** `apps/frontend/app/api/technical/routings/[id]/route.ts:200-206`
**File:** `apps/frontend/lib/supabase/migrations/020_create_routings_table.sql:97-103`

API route allows 'admin' and 'technical' roles to delete:
```typescript
if (!['admin', 'technical'].includes(currentUser.role)) {
  return NextResponse.json(
    { error: 'Forbidden: Admin or Technical role required' },
```

But database RLS policy only allows 'admin':
```sql
CREATE POLICY routings_delete_policy ON public.routings
  FOR DELETE
  USING (... role = 'admin' ...)
```

**Impact:** Technical users will get permission denied from database despite API allowing it.

**Required Fix:** Align API authorization with RLS policy (recommend: only admin can delete).

---

### MAJOR-004: Product Type Code is Hardcoded in TypeScript
**Severity:** MAJOR
**File:** `apps/frontend/lib/types/product.ts:9`

The ProductType interface has hardcoded code values:
```typescript
export interface ProductType {
  code: 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP'
  // ...
}
```

But the database allows any VARCHAR(10) code per organization. Organizations can add custom product types.

**Impact:** TypeScript will error on custom product types, limiting flexibility.

**Required Fix:** Change to `code: string` and validate at runtime.

---

### MAJOR-005: Routing Operations API Missing Role Check
**Severity:** MAJOR
**File:** `apps/frontend/app/api/technical/routings/[id]/operations/route.ts:33-76`

The POST endpoint for creating operations does not verify user role:
```typescript
export async function POST(request: NextRequest, ...) {
  // ... authentication check only
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) { ... }

  // NO ROLE CHECK - any authenticated user can create operations!
  const body = await request.json()
  // ...
}
```

**Impact:** Any authenticated user can add operations to routings, bypassing role restrictions.

**Required Fix:** Add role check for 'admin' or 'technical' roles.

---

### MAJOR-006: Missing Input Validation in Operations API
**Severity:** MAJOR
**File:** `apps/frontend/app/api/technical/routings/[id]/operations/route.ts:45-60`

No Zod validation on input, only basic check for sequence:
```typescript
const body = await request.json()

if (!body.sequence) {
  return NextResponse.json({ error: 'sequence is required' }, { status: 400 })
}

// No validation for: name length, duration range, labor_cost range
const { data: operation, error } = await supabase
  .from('routing_operations')
  .insert({
    // All values taken directly from body without validation
  })
```

**Impact:** Invalid data can be inserted (e.g., negative duration, empty name).

**Required Fix:** Use `createOperationSchema.parse(body)` before insert.

---

## 3. Minor Issues (NICE TO HAVE)

### MINOR-001: Product Type Lookup Uses Hardcoded Mock Data
**File:** `apps/frontend/components/technical/products/ProductsDataTable.tsx:366-376`

```typescript
function getProductTypeCode(typeId: string): 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP' {
  // Mock mapping - in production this would be a lookup from product_types table
  const typeMap: Record<string, 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP'> = {
    'type-rm': 'RM',
    // ...
  }
  return typeMap[typeId] || 'RM'
}
```

**Recommendation:** Fetch product types and pass them as props, or use a React context.

---

### MINOR-002: Console.log in Production Code
**File:** `apps/frontend/app/api/technical/products/route.ts:86`
**File:** `apps/frontend/app/api/technical/products/route.ts:133`

Multiple `console.error` calls that should use proper logging:
```typescript
console.error('Error fetching products:', error)
console.error('Unexpected error in GET /api/technical/products:', error)
```

**Recommendation:** Use a structured logger (e.g., `pino` or Next.js built-in logger).

---

### MINOR-003: Hardcoded Currency in Routing Tests
**File:** `apps/frontend/lib/services/__tests__/routing-service.test.ts:65`

```typescript
currency: 'PLN',
```

**Recommendation:** Make currency configurable per organization.

---

### MINOR-004: Missing Loading State Skeleton in Routings Page
**File:** `apps/frontend/app/(authenticated)/technical/routings/page.tsx:189-191`

Simple text-based loading:
```typescript
{loading ? (
  <div className="text-center py-8">Loading routings...</div>
) : ...}
```

**Recommendation:** Use `Skeleton` component for better UX consistency with ProductsDataTable.

---

### MINOR-005: Button Touch Target Size Non-Compliant
**File:** `apps/frontend/components/technical/routings/routings-data-table.tsx:166-167`

Button size is 48x48px (12x12 in Tailwind units):
```tsx
className="h-12 w-12 p-0"
```

While this meets minimum (44x44px), the icons inside are only 16x16px (h-4 w-4).

**Recommendation:** Ensure visual touch target is clear, consider hover states.

---

## 4. Security Assessment

**Score: 7/10 - ACCEPTABLE**

### Strengths:
- RLS enabled on all tables
- Zod validation for input sanitization
- Soft delete pattern for products preserves audit trail
- org_id filtering in all queries

### Concerns:
1. **Inconsistent RLS approach** (JWT org_id vs users table lookup)
2. **Role check missing** in operations API
3. **Technical role can delete** in API but not in DB policy
4. **No rate limiting** on create/update endpoints

### Recommendations:
- Standardize RLS pattern across all tables
- Add rate limiting middleware
- Add audit logging for destructive operations

---

## 5. Test Coverage Assessment

**Score: 5/10 - NEEDS IMPROVEMENT**

### Current State:
| Story | Unit Tests | API Tests | Component Tests | Status |
|-------|------------|-----------|-----------------|--------|
| 02.1 Products | 28 pass | 0 pass (mock issues) | 0 pass | FAILING |
| 02.7 Routings | 36 pass | 22 pass (5 fail) | 13 pass | PARTIAL |

### Passing Tests:
- Product service unit tests: 28/28
- Product validation unit tests: 46/46
- Routing service unit tests: 36/36
- Routing validation unit tests: 35/35
- Routing component tests: 13/13 (CreateRoutingModal)

### Failing Tests:
- All product API integration tests (mock issues)
- 5 routing API integration tests (role/code validation mismatch)

### Missing Coverage:
- Product component tests (ProductsDataTable, ProductFilters, etc.)
- E2E tests for full user flows
- Edge case testing for concurrent operations
- Performance/load testing

---

## 6. Performance Assessment

**Score: 6/10 - NEEDS WORK**

### Issues Identified:

#### PERF-001: N+1 Query in Products List
**File:** `apps/frontend/app/api/technical/products/route.ts:94-113`

```typescript
// First query: get products
const { data, error, count } = await query

// Second query: get BOM counts for ALL products
const { data: bomCounts } = await supabase
  .from('boms')
  .select('product_id')
  .in('product_id', productIds)
```

**Impact:** Two database round trips for every list request.

**Recommendation:** Use a database view or add `bom_count` as a computed column.

#### PERF-002: No Caching Strategy
No caching headers set on API responses. Product types rarely change and could be cached.

**Recommendation:** Add `Cache-Control` headers for appropriate resources.

#### PERF-003: Client-Side Filtering in Routings Page
**File:** `apps/frontend/app/(authenticated)/technical/routings/page.tsx:126-133`

Search is performed client-side after fetching all routings:
```typescript
const filteredRoutings = routings.filter((routing) => {
  if (!searchTerm) return true
  // ...client-side filter
})
```

**Impact:** For large datasets, this will be slow and wasteful.

**Recommendation:** Move search to server-side query.

---

## 7. Accessibility Assessment

**Score: 7/10 - ACCEPTABLE**

### Strengths:
- ARIA labels on buttons
- Keyboard navigation (tabIndex, onKeyDown handlers)
- Role="alert" for error states
- Aria-live regions for dynamic content

### Issues:

#### A11Y-001: Missing aria-sort on Sortable Headers
**File:** `apps/frontend/app/(authenticated)/technical/routings/page.tsx:197-204`

Routings table headers are not sortable and lack aria-sort attributes (unlike ProductsDataTable which has them).

#### A11Y-002: Color-Only Status Indication
**File:** `apps/frontend/components/technical/routings/routings-data-table.tsx:139-148`

Status badges rely primarily on color:
```tsx
className={
  routing.is_active
    ? 'bg-green-100 text-green-800 hover:bg-green-200'
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
}
```

While text is also included ("Active"/"Inactive"), ensure color contrast meets WCAG AA (4.5:1).

#### A11Y-003: Confirm Dialog Uses Browser Alert
**File:** `apps/frontend/app/(authenticated)/technical/routings/page.tsx:89`

```typescript
if (!confirm(`Delete routing "${routing.name}"?...`)) {
```

Browser `confirm()` is not accessible. Use a proper Dialog component.

---

## 8. Architecture Assessment

### Strengths:
- Clean separation: types, validation, services, API routes, components
- Consistent file naming conventions
- Service layer accepts Supabase client (testable pattern)
- Zod schemas are comprehensive

### Issues:

#### ARCH-001: Duplicate Type Definitions
**File:** `apps/frontend/lib/services/routing-service.ts:16-69`
**File:** `apps/frontend/lib/validation/routing-schemas.ts:33-54`

Types are defined in both service and validation files, creating duplication.

**Recommendation:** Define types in a single `lib/types/routing.ts` file.

#### ARCH-002: Service Creates Own Supabase Client
**File:** `apps/frontend/lib/services/routing-service.ts:93-106`

```typescript
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  // ...
}
```

This breaks the pattern where service methods receive Supabase client as parameter (like ProductService).

**Impact:** Makes testing harder and creates hidden dependencies.

#### ARCH-003: Inconsistent API Response Formats
- Products API: Returns `{ data: [...], pagination: {...} }`
- Routings API: Returns `{ routings: [...], total: N }`

**Recommendation:** Standardize on one format across all APIs.

---

## 9. Documentation Assessment

### Strengths:
- File header comments with story references
- SQL migrations have comments on each column
- Function-level JSDoc comments

### Issues:
- No README in `/components/technical/products/`
- No API documentation (OpenAPI/Swagger)
- Missing inline comments in complex validation logic

---

## 10. Required Fixes Before Approval

### Priority 1 (MUST before merge):
1. [ ] Fix test suite - all 337 failing tests must pass
2. [ ] Fix mock configuration in API tests
3. [ ] Resolve schema mismatch (is_active vs status)

### Priority 2 (SHOULD before production):
1. [ ] Add reference check before product deletion
2. [ ] Align API role checks with RLS policies
3. [ ] Add role check and validation to operations API
4. [ ] Standardize RLS pattern across tables

### Priority 3 (RECOMMENDED):
1. [ ] Replace browser confirm() with accessible Dialog
2. [ ] Move search to server-side in routings page
3. [ ] Standardize API response formats

---

## Decision: REQUEST_CHANGES

**Reason:**
1. 337 failing tests - cannot verify correctness
2. Schema mismatch between service and database
3. Missing role checks in operations API
4. Authorization mismatch between API and RLS policies

**Next Steps:**
1. DEV to fix all critical issues
2. Re-run test suite to verify all pass
3. Re-submit for code review
4. After approval, proceed to QA-AGENT

---

## Handoff

### If fixes completed -> Re-review:
```yaml
story: "02.1 + 02.7"
decision: request_changes
required_fixes:
  - "Fix test suite (337 failures)"
  - "Fix API test mocks - __tests__/api/technical/*.test.ts"
  - "Resolve is_active vs status mismatch - routing-service.ts:24"
  - "Add role check to operations API - [id]/operations/route.ts:33"
  - "Add input validation to operations API - [id]/operations/route.ts:45"
  - "Align DELETE authorization with RLS - [id]/route.ts:200"
blocking_issues: 3
major_issues: 6
minor_issues: 5
```

---

*Review conducted with honesty and thoroughness as requested. All issues reported with specific file:line references.*
