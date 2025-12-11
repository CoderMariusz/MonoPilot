# Batch 2C - Detailed Code Review Report
**Date:** 2025-11-25
**Reviewer:** BMAD Code Review Workflow
**Stories Covered:** 2.15, 2.16, 2.17 (Routing Module)

---

## Executive Summary

| Metric | Status |
|--------|--------|
| **Overall Quality** | ⚠️ GOOD with concerns |
| **Architecture** | ✅ Solid |
| **Security** | ✅ Well implemented |
| **Test Coverage** | ❌ **0% - CRITICAL GAP** |
| **Documentation** | ✅ Good |

---

## 1. Story 2.15: Routing CRUD

### Files Reviewed:
- `apps/frontend/lib/services/routing-service.ts` (968 lines)
- `apps/frontend/lib/validation/routing-schemas.ts` (222 lines)
- `apps/frontend/app/api/technical/routings/route.ts` (192 lines)
- `apps/frontend/app/api/technical/routings/[id]/route.ts` (235 lines)
- `apps/frontend/app/(authenticated)/technical/routings/page.tsx` (288 lines)
- `apps/frontend/lib/supabase/migrations/020_create_routings_table.sql` (138 lines)

### Acceptance Criteria Coverage:

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC-015.1 | Create routing (code, name, status, is_reusable) | ✅ | Implemented |
| AC-015.2 | List routings with status, products count, operations | ✅ | Implemented |
| AC-015.3 | Search/filter by code/name/status | ✅ | Debounced search (300ms) |
| AC-015.4 | Code uniqueness validation per org | ✅ | DB constraint + API check |
| AC-015.5 | Edit routing (code immutable) | ✅ | updateRoutingSchema omits code |
| AC-015.6 | Admin/Technical role restriction | ✅ | API checks role |
| AC-015.7 | Delete with cascade | ✅ | CASCADE in migrations |

### Strengths:
1. **Code Validation** - Strong regex pattern `^[A-Z0-9-]+$` with transform to uppercase
2. **RLS Policies** - Comprehensive org isolation with role-based INSERT/UPDATE/DELETE
3. **Service Layer** - Clean separation with typed error codes
4. **Indexes** - Performance indexes on org_id, code, status, is_reusable

### Issues Found:

#### Issue 2.15.1: Missing Input Sanitization for Description
**Severity:** Low
**Location:** `routing-schemas.ts:34-37`
```typescript
description: z
  .string()
  .max(1000, 'Description must be at most 1000 characters')
  .optional(),
```
**Problem:** No XSS sanitization for description field
**Recommendation:** Add `.transform(sanitizeHtml)` or escape on render

#### Issue 2.15.2: Error Logging Exposes Details
**Severity:** Low
**Location:** `app/api/technical/routings/route.ts:87`
```typescript
console.error('Error in GET /api/technical/routings:', error)
```
**Problem:** Full error logged, could leak sensitive info in production
**Recommendation:** Use structured logging with sanitization

---

## 2. Story 2.16: Routing Operations

### Files Reviewed:
- `apps/frontend/lib/services/routing-service.ts` (operations methods)
- `apps/frontend/lib/validation/routing-schemas.ts` (operation schemas)
- `apps/frontend/lib/supabase/migrations/021_create_routing_operations_table.sql`
- `apps/frontend/components/technical/routings/operations-table.tsx`

### Acceptance Criteria Coverage:

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC-016.1 | Add operation with sequence, name, duration, yield | ✅ | Implemented |
| AC-016.2 | List operations sorted by sequence | ✅ | ORDER BY sequence |
| AC-016.3 | Drag-drop reorder with sequence update | ✅ | reorderOperationsSchema |
| AC-016.4 | Edit operation | ✅ | updateOperationSchema |
| AC-016.5 | Delete operation | ✅ | CASCADE from routing |
| AC-016.6 | Machine/Line assignment (optional) | ✅ | FK with SET NULL |

### Strengths:
1. **Sequence Uniqueness** - DB constraint `UNIQUE (routing_id, sequence)`
2. **Yield Validation** - 0.01% to 100% range
3. **Nullable Costs** - `labor_cost` properly nullable
4. **Cascade Delete** - Operations deleted with routing

### Issues Found:

#### Issue 2.16.1: Sequence Gap After Delete
**Severity:** Medium
**Location:** Service layer
**Problem:** Deleting operation 2 leaves gap (1, 3, 4) instead of resequencing
**Recommendation:** Add `resequenceOperations(routingId)` after delete

#### Issue 2.16.2: Race Condition on Reorder
**Severity:** Low
**Location:** `routing-service.ts` reorderOperations
**Problem:** Concurrent reorder requests could cause sequence conflicts
**Recommendation:** Use transaction with FOR UPDATE lock

---

## 3. Story 2.17: Product-Routing Assignment

### Files Reviewed:
- `apps/frontend/lib/services/routing-service.ts` (assignment methods)
- `apps/frontend/lib/validation/routing-schemas.ts` (assignment schemas)
- `apps/frontend/lib/supabase/migrations/022_create_product_routings_table.sql`
- `apps/frontend/components/technical/routings/assigned-products-table.tsx`

### Acceptance Criteria Coverage:

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC-017.1 | Assign multiple products to routing | ✅ | assignProductsSchema |
| AC-017.2 | Non-reusable routing: max 1 product | ✅ | App-layer validation |
| AC-017.3 | Mark one routing as default per product | ✅ | DB trigger enforces |
| AC-017.4 | View assigned products on routing detail | ✅ | AssignedProductsTable |
| AC-017.5 | Product edit shows assigned routings | ⚠️ | Partial - needs verification |

### Strengths:
1. **Default Routing Trigger** - `validate_default_routing()` prevents race conditions
2. **M2M Clean Design** - Clean junction table with unique constraint
3. **Cascade Delete** - Assignments cascade from routing deletion

### Issues Found:

#### Issue 2.17.1: Missing FK to Products Table
**Severity:** High
**Location:** `022_create_product_routings_table.sql:17`
```sql
product_id UUID NOT NULL, -- Will reference products(id) once table is created
```
**Problem:** FK constraint not added (migration order issue)
**Recommendation:** Create migration to add FK constraint:
```sql
ALTER TABLE public.product_routings
  ADD CONSTRAINT product_routings_product_fk
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
```

#### Issue 2.17.2: RLS Policy Only Checks Routing Org
**Severity:** Medium
**Location:** `022_create_product_routings_table.sql:66-74`
**Problem:** RLS only validates via routing's org_id, not product's org_id
**Impact:** Theoretically could assign product from different org
**Recommendation:** Add double-check in app layer until products table org check added

---

## 4. Database Migration Quality

### Migration 020: routings table
- ✅ Proper constraints (code format, length, status enum)
- ✅ Indexes for common queries
- ✅ RLS enabled with role-based policies
- ✅ Updated_at trigger
- ✅ Comprehensive comments

### Migration 021: routing_operations table
- ✅ Proper FK with CASCADE
- ✅ Sequence uniqueness constraint
- ✅ Yield/duration validation checks
- ✅ RLS via parent routing join
- ✅ Partial indexes for nullables

### Migration 022: product_routings table
- ⚠️ Missing FK to products (documented as future migration)
- ✅ Unique constraint on (product_id, routing_id)
- ✅ Default routing enforcement trigger
- ✅ RLS policies defined

---

## 5. Frontend Components Quality

### RoutingsPage (`page.tsx`)
- ✅ Debounced search (300ms)
- ✅ Multi-column sorting
- ✅ Status filtering
- ✅ Products/operations count display
- ⚠️ No pagination implemented (will be issue with many routings)

### RoutingDetailPage (`[id]/page.tsx`)
- ✅ Edit drawer integration
- ✅ Operations table component
- ✅ Assigned products table
- ✅ Delete confirmation with warning

---

## 6. Test Coverage Analysis

### Batch 2C: Routing Module - **0% TEST COVERAGE** ❌

| File | Tests | Status |
|------|-------|--------|
| `__tests__/api/technical/routings.test.ts` | 0 | ❌ Missing |
| `__tests__/lib/validation/routing-schemas.test.ts` | 0 | ❌ Missing |
| `__tests__/components/routings/*.test.tsx` | 0 | ❌ Missing |

### Required Tests for Batch 2C:

1. **API Tests (`routings.test.ts`)**:
   - GET /api/technical/routings - List with filters
   - POST /api/technical/routings - Create with validation
   - GET /api/technical/routings/[id] - Get single
   - PUT /api/technical/routings/[id] - Update
   - DELETE /api/technical/routings/[id] - Delete
   - Operations CRUD
   - Product assignment CRUD
   - Role-based access control
   - RLS org isolation

2. **Validation Tests (`routing-schemas.test.ts`)**:
   - createRoutingSchema validation
   - updateRoutingSchema validation
   - createOperationSchema validation
   - updateOperationSchema validation
   - reorderOperationsSchema validation
   - assignProductsSchema validation

3. **Component Tests**:
   - OperationsTable drag-drop
   - CreateRoutingModal validation
   - EditRoutingDrawer

---

## 7. Batch 2A & 2B Test Coverage Status

### Batch 2A: Products Module - ✅ **~55+ TESTS**

| File | Tests | Coverage |
|------|-------|----------|
| `__tests__/api/technical/products.test.ts` | 18 | API endpoints |
| `__tests__/api/technical/product-types.test.ts` | ~10 | Product types |
| `__tests__/lib/validation/product-schemas.test.ts` | 37 | Zod schemas |

**Coverage Areas:**
- ✅ Product CRUD operations
- ✅ Search and filtering
- ✅ Pagination and sorting
- ✅ Duplicate code validation
- ✅ min/max stock validation
- ✅ Product type create/update
- ✅ Allergen assignment schemas
- ✅ RLS org isolation
- ✅ Role-based access

### Batch 2B: BOM Module - ✅ **~64+ TESTS**

| File | Tests | Coverage |
|------|-------|----------|
| `__tests__/api/technical/boms.test.ts` | 14 | API endpoints |
| `__tests__/lib/validation/bom-schemas.test.ts` | 50 | Zod schemas |

**Coverage Areas:**
- ✅ BOM CRUD operations
- ✅ Auto-versioning
- ✅ Date overlap validation (AC-2.8)
- ✅ BOM Item CRUD
- ✅ Scrap percent validation
- ✅ By-product with yield_percent
- ✅ Conditional flags (AND/OR logic)
- ✅ Clone BOM validation
- ✅ Reorder items validation
- ✅ Role-based access (admin/technical)

---

## 8. Security Assessment

### Strengths:
1. ✅ RLS enabled on all tables
2. ✅ Role-based API access (admin/technical)
3. ✅ Org isolation via JWT claims
4. ✅ Cascade deletes protect referential integrity
5. ✅ Input validation with Zod

### Concerns:
1. ⚠️ No rate limiting on API routes
2. ⚠️ Console.error may leak info in production
3. ⚠️ Missing FK between product_routings and products

---

## 9. Action Items

### Critical (Must Fix Before Production):
1. ❌ **Write tests for Batch 2C** - 0% coverage is unacceptable
2. ❌ **Add FK constraint** from product_routings to products table

### High Priority:
3. ⚠️ Add pagination to routings list page
4. ⚠️ Add cross-org validation for product assignments
5. ⚠️ Implement sequence reordering after operation delete

### Medium Priority:
6. Add rate limiting to API routes
7. Implement structured logging
8. Add XSS sanitization for description fields

### Low Priority:
9. Add transaction locking for concurrent reorder operations
10. Improve error messages for better UX

---

## 10. Recommendations

### Immediate Action Required:
```bash
# Create test files for Batch 2C
touch apps/frontend/__tests__/api/technical/routings.test.ts
touch apps/frontend/__tests__/lib/validation/routing-schemas.test.ts
```

### Migration to Add FK:
```sql
-- Migration 023: Add FK constraint for product_routings
ALTER TABLE public.product_routings
  ADD CONSTRAINT product_routings_product_fk
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
```

---

## Conclusion

Batch 2C (Routing Module) has solid architecture and implementation quality. However, the **complete lack of test coverage** is a critical blocker for production readiness. Batches 2A and 2B have excellent test coverage (~120+ tests combined) which should serve as a template for 2C tests.

**Overall Assessment: CONDITIONAL APPROVAL**
- Code quality: ✅ Approved
- Test coverage: ❌ BLOCKED - Must add tests before merge

---

*Report generated by BMAD Senior Developer Code Review Workflow*
