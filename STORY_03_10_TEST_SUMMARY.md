# Story 03.10 - Work Order CRUD + BOM Auto-Select: Test Summary

## Phase: RED (TDD - Failing Tests)

**Status**: ✅ COMPLETE - All test files created with failing tests

**Purpose**: Write comprehensive failing tests for Story 03.10 - Work Order CRUD + BOM Auto-Select. These tests establish the RED phase of Test-Driven Development, defining all acceptance criteria before implementation.

---

## Test Files Created

### 1. Unit Tests: Service Layer
**File**: `apps/frontend/lib/services/__tests__/work-order-service.test.ts`
- **Lines**: 863
- **Framework**: Vitest
- **Coverage**: 80% target
- **Test Count**: 30+ scenarios

**Test Categories**:
- `generateNextNumber()` - WO number generation with daily reset
- `create()` - WO creation with BOM auto-selection
- `getActiveBomForDate()` - BOM selection logic
- `update()` - Update with status-dependent restrictions
- `delete()` - Draft-only deletion
- `plan()` - Draft to planned transition
- `release()` - Planned to released transition
- `cancel()` - Any status cancellation
- `validateStatusTransition()` - Status rules validation
- `getStatusHistory()` - History tracking
- `list()` - Listing with filters
- Multi-tenancy and security

**Acceptance Criteria Covered**:
- AC-08 to AC-14: Create WO Header
- AC-15 to AC-19: BOM Auto-Selection
- AC-20 to AC-22: BOM Validation
- AC-23 to AC-27: WO Status Lifecycle
- AC-28 to AC-30: Edit WO
- AC-31 to AC-33: Delete WO
- AC-34, AC-36-38: Security & Multi-tenancy

---

### 2. Unit Tests: Validation Schemas
**File**: `apps/frontend/lib/validation/__tests__/work-order.test.ts`
- **Lines**: 571
- **Framework**: Vitest
- **Coverage**: 90% target
- **Test Count**: 25+ scenarios

**Test Categories**:
- `createWOSchema` validation (20+ tests)
  - Required fields (product_id, quantity, date)
  - Field type validation (UUID, number, date)
  - Field constraints (quantity > 0, date not past)
  - Optional fields (bom_id, uom, times, notes)
  - Enum validations (status, priority, source)
  - Refinements (end_date >= start_date)
- `updateWOSchema` - Partial updates
- `bomForDateSchema` - BOM selection parameters
- `statusTransitionSchema` - Status change inputs
- Enum definitions

**Acceptance Criteria Covered**:
- AC-11: Required field validation
- AC-12: Quantity validation
- AC-13: Scheduled date validation
- AC-14: UoM defaults
- AC-20 to AC-22: BOM validation

---

### 3. Integration Tests: API Endpoints
**File**: `apps/frontend/__tests__/integration/api/planning/work-orders.test.ts`
- **Lines**: 1,127
- **Framework**: Vitest (with fetch mocks)
- **Coverage**: 70% target
- **Test Count**: 30+ scenarios
- **Endpoints Tested**: 11 API routes

**Test Categories**:
- `GET /api/planning/work-orders` - List with pagination & filters (8 tests)
- `POST /api/planning/work-orders` - Create with BOM auto-select (9 tests)
- `GET /api/planning/work-orders/:id` - Get single (3 tests)
- `PUT /api/planning/work-orders/:id` - Update with restrictions (5 tests)
- `DELETE /api/planning/work-orders/:id` - Delete validation (3 tests)
- `POST /api/planning/work-orders/:id/plan` - Status transition (3 tests)
- `POST /api/planning/work-orders/:id/release` - Status transition (2 tests)
- `POST /api/planning/work-orders/:id/cancel` - Cancellation (3 tests)
- `GET /api/planning/work-orders/:id/history` - Status history (1 test)
- `GET /api/planning/work-orders/bom-for-date` - BOM selection (2 tests)
- `GET /api/planning/work-orders/available-boms` - Manual BOM selection (1 test)
- Multi-tenancy & Security (3 tests)

**Acceptance Criteria Covered**:
- AC-01 to AC-07: WO List Page
- AC-08 to AC-14: Create WO Header
- AC-15 to AC-19: BOM Auto-Selection
- AC-20 to AC-22: BOM Validation
- AC-23 to AC-27: WO Status Lifecycle
- AC-28 to AC-30: Edit WO
- AC-31 to AC-33: Delete WO
- AC-34 to AC-35: Permission Enforcement
- AC-36 to AC-38: Multi-tenancy

---

### 4. Integration Tests: RLS Security
**File**: `supabase/tests/work-orders-rls.test.sql`
- **Lines**: 296
- **Framework**: PostgreSQL / Supabase
- **Coverage**: 100% of RLS policies
- **Test Count**: 15+ scenarios

**Test Categories**:
- `work_orders.wo_select` - SELECT policy (org isolation)
- `work_orders.wo_insert` - INSERT policy (role validation)
- `work_orders.wo_update` - UPDATE policy (org + role validation)
- `work_orders.wo_delete` - DELETE policy (status + role checks)
- `wo_status_history` policies - History isolation
- `wo_daily_sequence` policies - Sequence isolation
- Cross-tenant access scenarios
- Role permission enforcement

**RLS Policies Tested**:
1. SELECT - org_id isolation
2. INSERT - org + role validation
3. UPDATE - org + role validation
4. DELETE - org + status + materials + role validation
5. Status history SELECT/INSERT - WO org validation
6. Daily sequence ALL - org isolation

**Acceptance Criteria Covered**:
- AC-34: Planner full access, role restrictions
- AC-35: Operator view-only
- AC-36: Org isolation on list
- AC-37: Cross-tenant access returns 404
- AC-38: BOM selection respects org

---

### 5. E2E Tests: User Flows
**File**: `apps/frontend/__tests__/e2e/planning/work-orders.spec.ts`
- **Lines**: 574
- **Framework**: Playwright
- **Coverage**: Critical user paths
- **Test Count**: 12+ scenarios
- **Browser**: Chromium (configurable)

**Test Scenarios**:
1. AC-01: View WO list page (performance < 300ms)
2. AC-02, AC-07: Search by WO number + pagination
3. AC-03 to AC-06: Filter by status, product, line, date
4. AC-08, AC-09: Create WO with BOM auto-selection
5. AC-09, AC-18: BOM override modal with manual selection
6. AC-11 to AC-13: Validation errors (product, qty, date)
7. AC-14: UoM auto-filled from product
8. AC-28: Edit WO fields
9. AC-29: WO number immutable in UI
10. AC-23: Plan WO (draft → planned)
11. AC-24: Release WO (planned → released)
12. AC-25: Released WO field restrictions
13. AC-26: Cancel WO with confirmation
14. AC-27: Status history timeline display
15. AC-31: Delete draft WO
16. AC-32: Delete button hidden for non-draft
17. AC-35: Operator view-only access

**User Flows Covered**:
- Create WO flow (basic + manual BOM override)
- Edit WO flow
- Status transition flows (Plan, Release, Cancel)
- Delete WO flow
- Search and filter flows
- Permission-based UI visibility

---

## Test Statistics

| Metric | Value |
|--------|-------|
| **Total Test Files** | 5 |
| **Total Test Lines** | 3,431 |
| **Unit Test Suites** | 2 |
| **Integration Test Suites** | 2 |
| **E2E Test Suites** | 1 |
| **Total Test Cases** | 110+ |
| **Acceptance Criteria Covered** | 38/38 (100%) |
| **Unit Coverage Target** | 80% |
| **Integration Coverage Target** | 70% |
| **RLS Coverage Target** | 100% |

---

## Acceptance Criteria Coverage Matrix

### WO List Page (AC-01 to AC-07)
- ✅ AC-01: View work orders list with KPI cards - E2E
- ✅ AC-02: Search WOs by number or product - E2E, Integration
- ✅ AC-03: Filter by status - E2E, Integration
- ✅ AC-04: Filter by product - E2E, Integration
- ✅ AC-05: Filter by production line - E2E, Integration
- ✅ AC-06: Filter by date range - E2E, Integration
- ✅ AC-07: Pagination - E2E, Integration

### Create WO Header (AC-08 to AC-14)
- ✅ AC-08: Open create WO form - Unit, E2E
- ✅ AC-09: Product selection triggers BOM lookup - Unit, E2E, Integration
- ✅ AC-10: WO number auto-generated with daily reset - Unit, Integration
- ✅ AC-11: Required field validation - Unit, Validation, E2E
- ✅ AC-12: Quantity validation - Unit, Validation, E2E
- ✅ AC-13: Scheduled date validation - Unit, Validation, E2E
- ✅ AC-14: UoM defaults from product - Unit, E2E, Integration

### BOM Auto-Selection (AC-15 to AC-19)
- ✅ AC-15: Auto-select BOM based on scheduled date - Unit, Integration, E2E
- ✅ AC-16: Auto-select with effective_to date - Unit, Integration
- ✅ AC-17: No active BOM found - warning - Unit, Integration, E2E
- ✅ AC-18: Manual BOM override - Unit, E2E
- ✅ AC-19: Date change triggers BOM re-selection - Unit, E2E

### BOM Validation (AC-20 to AC-22)
- ✅ AC-20: Product must have active BOM - Unit, Integration, Validation
- ✅ AC-21: BOM must be for selected product - Unit, Validation
- ✅ AC-22: Optional BOM mode - Unit, Integration, Validation

### WO Status Lifecycle (AC-23 to AC-27)
- ✅ AC-23: Plan WO (draft → planned) - Unit, Integration, E2E
- ✅ AC-24: Release WO (planned → released) - Unit, Integration, E2E
- ✅ AC-25: Released WO restrictions - Unit, E2E
- ✅ AC-26: Cancel WO - Unit, E2E, Integration
- ✅ AC-27: Status history tracking - Unit, Integration, E2E

### Edit WO (AC-28 to AC-30)
- ✅ AC-28: Edit header fields in draft - Unit, E2E
- ✅ AC-29: WO number immutable - Unit, E2E
- ✅ AC-30: Product change resets BOM - Unit, E2E

### Delete WO (AC-31 to AC-33)
- ✅ AC-31: Delete draft WO - Unit, Integration, E2E
- ✅ AC-32: Cannot delete non-draft WO - Unit, E2E
- ✅ AC-33: Cannot delete WO with materials - Unit, Integration

### Permission Enforcement (AC-34 to AC-35)
- ✅ AC-34: Planner full access - Unit, Integration, RLS, E2E
- ✅ AC-35: Operator view only - Unit, RLS, E2E

### Multi-tenancy (AC-36 to AC-38)
- ✅ AC-36: Org isolation on list - Unit, Integration, RLS
- ✅ AC-37: Cross-tenant access returns 404 - Unit, Integration, RLS
- ✅ AC-38: BOM selection respects org - Unit, Integration, RLS

---

## Test Execution Guide

### Run All Tests
```bash
npm test -- --testPathPattern="work-order"
```

### Run Unit Tests Only
```bash
npm test -- --testPathPattern="work-order-service|work-order\.test"
```

### Run Integration API Tests
```bash
npm test -- --testPathPattern="integration/api/planning/work-orders"
```

### Run RLS Security Tests
```bash
# Requires Supabase connection
psql postgresql://user:pass@host/db -f supabase/tests/work-orders-rls.test.sql
```

### Run E2E Tests
```bash
npx playwright test work-orders.spec.ts
```

### Expected Test Results

In RED phase (before implementation):
- **All tests MUST fail** ❌
- No tests should pass
- Failures should be for missing services, functions, and endpoints

Example failure reasons:
- `Cannot find module 'work-order-service'`
- `Cannot find function 'generateNextNumber'`
- `404 Not Found - /api/planning/work-orders`
- `RLS policy does not exist for work_orders`
- `Timeout waiting for element [role="dialog"]`

---

## Test Design Principles

### 1. Comprehensive Coverage
- Every acceptance criterion tested in at least 1 test
- Critical paths tested in multiple layers (unit → integration → E2E)
- Edge cases included (past dates, zero qty, missing fields)

### 2. Isolated Test Fixtures
- Mock data for each test layer
- Org/user isolation tested
- Cross-tenant scenarios verified

### 3. Clear Test Naming
- Format: `Test Category > Specific Scenario`
- Each test verifies ONE behavior
- Comments explain acceptance criteria mapping

### 4. Security-First Testing
- RLS policies explicitly tested
- Cross-tenant access returns 404 (not 403)
- Role-based permissions enforced
- Org isolation verified at each layer

### 5. User-Centric E2E Tests
- Real browser workflows
- UI state verification
- Toast notifications checked
- Loading states handled

---

## Critical Test Cases

### Highest Risk Areas (Must Test Thoroughly)
1. **BOM Auto-Selection** (AC-15 to AC-19)
   - Multiple BOMs with overlapping dates
   - Effective date boundary conditions
   - Null BOM handling
   - Org isolation

2. **WO Number Generation** (AC-10)
   - Daily reset at midnight
   - Concurrent request handling
   - Org isolation
   - Format validation

3. **Status Transitions** (AC-23 to AC-27)
   - Valid transition matrix
   - Field lock enforcement
   - History recording
   - Trigger execution

4. **RLS Security** (AC-36 to AC-38)
   - Cross-org access blocked
   - Role validation on INSERT/UPDATE/DELETE
   - Joined table access control
   - 404 vs 403 responses

5. **Delete Restrictions** (AC-31 to AC-33)
   - Draft-only deletion
   - Material/operation check
   - Role enforcement
   - Status validation

---

## Next Steps (Green Phase)

When implementation begins:

1. **Database** - Create migrations for:
   - `work_orders` table with all columns
   - `wo_status_history` audit table
   - `wo_daily_sequence` daily counter
   - Indexes and constraints
   - Triggers for status history
   - RLS policies

2. **Functions** - Create Postgres functions:
   - `generate_wo_number(org_id, date)` - WO number with daily reset
   - `get_active_bom_for_date(product_id, org_id, date)` - Auto-select BOM
   - `get_all_active_boms_for_product(product_id, org_id)` - Manual BOM list

3. **Service Layer** - Implement `WorkOrderService`:
   - All CRUD methods with BOM auto-selection
   - Status transition validation
   - History tracking
   - List with filtering and pagination

4. **Validation** - Create Zod schemas:
   - `createWOSchema`, `updateWOSchema`
   - `bomForDateSchema`, `statusTransitionSchema`
   - Enum validations and refinements

5. **API Routes** - Implement 11 endpoints:
   - List, Create, Get, Update, Delete
   - Plan, Release, Cancel
   - History, BOM selection

6. **Frontend** - Build UI components:
   - WO list page with DataTable
   - Create/edit forms with BOM preview
   - Status transition dialogs
   - History timeline

---

## Test Execution Checklist

Before marking story COMPLETE:

- [ ] All 110+ tests created and passing in RED state (all failing)
- [ ] Unit test coverage >= 80%
- [ ] Integration test coverage >= 70%
- [ ] RLS test coverage = 100%
- [ ] All 38 acceptance criteria mapped to tests
- [ ] Edge cases included (empty states, errors, validation)
- [ ] Security tests verify org isolation and permissions
- [ ] E2E tests cover critical user flows
- [ ] Test file structure follows project conventions
- [ ] Comments explain acceptance criteria links
- [ ] No implementation code in test files (RED phase)

---

## File Locations

| File | Path | Lines | Type |
|------|------|-------|------|
| Service Unit Tests | `apps/frontend/lib/services/__tests__/work-order-service.test.ts` | 863 | Vitest |
| Validation Unit Tests | `apps/frontend/lib/validation/__tests__/work-order.test.ts` | 571 | Vitest |
| API Integration Tests | `apps/frontend/__tests__/integration/api/planning/work-orders.test.ts` | 1,127 | Vitest |
| RLS Security Tests | `supabase/tests/work-orders-rls.test.sql` | 296 | PostgreSQL |
| E2E Tests | `apps/frontend/__tests__/e2e/planning/work-orders.spec.ts` | 574 | Playwright |

---

## Status: COMPLETE ✅

All 5 test files created with 3,431 lines of test code covering 38 acceptance criteria. Tests are in RED state (all failing because implementation doesn't exist).

Ready for handoff to DEV agent for GREEN phase implementation.
