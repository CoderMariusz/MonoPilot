# Story 3.10: Work Order CRUD

**Epic:** 3 - Planning Operations
**Batch:** 3C - Work Orders (Part 1)
**Status:** ready-for-dev
**Priority:** P0 (Critical - blocks 6 dependent stories)
**Story Points:** 5
**Created:** 2025-11-26
**Effort Estimate:** 1.5 days

---

## Goal

Complete the Work Order CRUD implementation with full schema, auto-generation logic, BOM auto-selection, and immutable BOM snapshot creation.

## User Story

**As a** Planner
**I want** to create and manage work orders with automatic BOM selection
**So that** I can schedule production and ensure accurate material requirements

---

## Problem Statement

Currently, work_orders table is a STUB with minimal schema. This story completes it:
1. **Missing fields**: bom_id, actual_dates, status tracking
2. **No auto-selection**: BOM must be manually matched to scheduled_date
3. **No snapshots**: WO doesn't capture material requirements at creation time
4. **Blocking 6 dependent stories**: (3.11-3.16) waiting for full WO implementation

---

## Acceptance Criteria

### AC-3.10.1: WO Schema Completion
**Given** I review work_orders table
**When** checking the schema
**Then** the table should have all required fields:

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| id | UUID | PK | Unique identifier |
| org_id | UUID | FK, NOT NULL | Multi-tenancy |
| wo_number | VARCHAR(20) | UNIQUE per org, NOT NULL | WO-YYYYMMDD-NNNN format |
| product_id | UUID | FK to products, NOT NULL | What to produce |
| bom_id | UUID | FK to boms | Which BOM version |
| quantity | DECIMAL | > 0, NOT NULL | Output quantity |
| scheduled_date | DATE | NOT NULL, triggers BOM selection | When to produce |
| actual_start_date | DATE | NULL | When actually started |
| actual_finish_date | DATE | NULL | When actually finished |
| status | VARCHAR(50) | DEFAULT 'draft' | draft, released, in-progress, completed, cancelled |
| source_type | VARCHAR(50) | NULL | sales_order, mrp, manual, etc. |
| source_id | UUID | FK (dynamic) | Reference to source document |
| line_id | UUID | FK to production_lines, NULL | Optional assigned line |
| machine_id | UUID | FK to machines, NULL | Optional assigned machine |
| priority | VARCHAR(20) | DEFAULT 'medium' | low, medium, high, critical |
| notes | TEXT | NULL | Work notes |
| created_by | UUID | FK to users | Audit |
| updated_by | UUID | FK to users | Audit |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp |

---

### AC-3.10.2: WO Number Auto-Generation
**Given** I create a new work order
**When** saving the WO
**Then** system auto-generates wo_number in format: `WO-YYYYMMDD-NNNN`

**Examples:**
- 2025-11-26 → WO-20251126-0001
- 2025-11-26 → WO-20251126-0002 (daily sequence resets)

**Success Criteria:**
- ✅ Format: WO-YYYYMMDD-NNNN (NNNN is zero-padded 4-digit day sequence)
- ✅ Unique per organization (not globally)
- ✅ Sequence resets daily
- ✅ Cannot be manually edited after creation (immutable)
- ✅ Uniqueness enforced at DB level: `UNIQUE(org_id, wo_number)`

---

### AC-3.10.3: BOM Auto-Selection
**Given** I create WO for Product X on scheduled_date 2025-12-01
**When** the WO is saved
**Then** system automatically selects the active BOM:

```sql
SELECT * FROM boms
WHERE product_id = X
  AND status = 'active'
  AND effective_from <= '2025-12-01'
  AND (effective_to IS NULL OR effective_to >= '2025-12-01')
ORDER BY effective_from DESC
LIMIT 1
```

**Success Criteria:**
- ✅ BOM matched by `product_id`, `effective_from`, `effective_to`
- ✅ Only 'active' BOMs considered
- ✅ Uses most recent BOM if multiple versions exist
- ✅ Falls back to error if no matching BOM found (can't create WO without BOM)
- ✅ BOM can be manually overridden in edit modal (AC-3.10.8)
- ✅ If scheduled_date changed, BOM re-selected automatically

---

### AC-3.10.4: BOM Snapshot Creation (Immutable)
**Given** WO created with product X, quantity 100, BOM with 3 items
**When** WO is saved
**Then** all BOM items copied to wo_materials with quantities scaled to WO qty

**Scaling formula:** `wo_material.qty = bom_item.qty × (wo.qty / bom.output_qty)`

**Example:**
```
BOM: Output 100 units
  - Item1 (flour): 50 kg
  - Item2 (sugar): 20 kg
  - Item3 (water): 30 kg

WO: Quantity 50 units
  - wo_material1: 25 kg (50 × 50/100)
  - wo_material2: 10 kg (50 × 20/100)
  - wo_material3: 15 kg (50 × 30/100)
```

**Success Criteria:**
- ✅ All bom_items copied to wo_materials at WO creation
- ✅ Quantities scaled based on WO qty / BOM output_qty
- ✅ Other fields copied: product_id, uom, scrap_percent, consume_whole_lp, is_by_product, yield_percent
- ✅ Snapshot immutable after WO status = 'released' (checked in Story 3.23)
- ✅ wo_materials created with status = 'planned'

---

### AC-3.10.5: CRUD Service Methods
**Given** I use WorkOrderService
**When** calling service methods
**Then** all CRUD operations should work:

```typescript
class WorkOrderService {
  // Create
  async createWorkOrder(data: CreateWorkOrderInput, orgId: UUID): Promise<WorkOrder>

  // Read
  async getWorkOrders(filters: FilterInput, orgId: UUID): Promise<WorkOrder[]>
  async getWorkOrderById(id: UUID, orgId: UUID): Promise<WorkOrder>

  // Update
  async updateWorkOrder(id: UUID, data: UpdateWorkOrderInput, orgId: UUID): Promise<WorkOrder>

  // Delete
  async deleteWorkOrder(id: UUID, orgId: UUID): Promise<void>
}
```

**Success Criteria:**
- ✅ All methods check org_id isolation
- ✅ All methods validate input via Zod schema
- ✅ createWorkOrder triggers BOM auto-selection + snapshot
- ✅ Proper error handling: NOT_FOUND, ORG_ISOLATION, INVALID_STATUS, etc.
- ✅ Service layer separated from API routes

---

### AC-3.10.6: API Routes
**Given** I make HTTP requests
**When** calling WO endpoints
**Then** all CRUD operations available:

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/planning/work-orders` | List WOs with filters | 200 |
| POST | `/api/planning/work-orders` | Create WO | 201 |
| GET | `/api/planning/work-orders/:id` | Get single WO | 200 |
| PUT | `/api/planning/work-orders/:id` | Update WO | 200 |
| DELETE | `/api/planning/work-orders/:id` | Delete WO | 204 |

**Request/Response Examples:**

```typescript
// POST /api/planning/work-orders
Request: {
  product_id: "uuid",
  quantity: 100,
  scheduled_date: "2025-12-01",
  line_id?: "uuid",
  machine_id?: "uuid",
  priority?: "high",
  notes?: "string"
}

Response (201): {
  id: "uuid",
  org_id: "uuid",
  wo_number: "WO-20251126-0001",
  product_id: "uuid",
  bom_id: "uuid",
  quantity: 100,
  scheduled_date: "2025-12-01",
  status: "draft",
  materials: [ { id, product_id, qty, uom } ],
  created_at: "timestamp"
}
```

**Success Criteria:**
- ✅ Auth check on all endpoints (session validation)
- ✅ Org isolation (can only see own org's WOs)
- ✅ Role-based authorization (Planner, Production, Admin)
- ✅ Proper HTTP status codes
- ✅ Consistent response format
- ✅ Error messages include details

---

### AC-3.10.7: WO List Page
**Given** I navigate to `/planning/work-orders`
**When** page loads
**Then** I see table with columns and filters:

**Table Columns:**
- WO Number (clickable → detail page)
- Product (name)
- Quantity
- Status (draft, released, in-progress, completed, cancelled)
- Scheduled Date
- Priority
- Line (if assigned)
- Actions (View, Edit, Delete)

**Filters:**
- Search: WO Number, Product name
- Status: multi-select dropdown
- Priority: multi-select dropdown
- Scheduled Date: date range picker
- Line: multi-select dropdown

**Success Criteria:**
- ✅ Table populated from `/api/planning/work-orders`
- ✅ Pagination: default 20 per page
- ✅ Sorting: clickable column headers
- ✅ Filters apply dynamically (no page reload)
- ✅ Empty state: "No work orders found"
- ✅ Add button opens AC-3.10.8 modal
- ✅ Edit/Delete buttons work on selected row

---

### AC-3.10.8: WO Create/Edit Modal
**Given** I click "Add WO" or "Edit"
**When** modal opens
**Then** I see form with all fields:

**Form Fields:**
- product_id (required) - searchable dropdown showing [Code - Name]
- quantity (required) - number input, > 0
- scheduled_date (required) - date picker, triggers BOM re-selection
- line_id (optional) - searchable dropdown
- machine_id (optional) - searchable dropdown
- priority (optional) - select [low, medium, high, critical]
- bom_id (optional) - read-only display of auto-selected BOM, can be overridden
- notes (optional) - textarea

**Success Criteria:**
- ✅ Create mode: empty form
- ✅ Edit mode: pre-populated with current values
- ✅ Product dropdown shows [Code - Name] format
- ✅ Selecting product shows default quantity? (optional enhancement)
- ✅ BOM display: "[BOM-001] Flour Recipe v2" with "Change" button (optional override)
- ✅ Date change triggers BOM re-selection
- ✅ Cancel button closes modal without saving
- ✅ Submit button calls POST/PUT endpoint
- ✅ Success toast: "Work Order created/updated"
- ✅ Error handling: display form errors inline

---

### AC-3.10.9: Role-Based Authorization
**Given** I am a Planner, Production, or Admin user
**When** accessing work order endpoints
**Then** I have appropriate permissions:

| Role | Permissions |
|------|-------------|
| Planner | CREATE, READ, UPDATE (own), DELETE (draft only) |
| Production | READ, UPDATE status, READ materials |
| Admin | All permissions |
| Other roles | No access (403 Forbidden) |

**Success Criteria:**
- ✅ Role check on all endpoints
- ✅ Proper 403 error for unauthorized users
- ✅ Error message: "Insufficient permissions for this action"

---

### AC-3.10.10: Integration with Epic 2 (BOM)
**Given** BOMs exist from Epic 2
**When** creating/updating WO
**Then** WO correctly references and snapshots BOM data

**Success Criteria:**
- ✅ BOM lookup works: finds active BOMs by product_id + date
- ✅ BOM snapshot includes all bom_items correctly
- ✅ Handles BOM with by-products, scrap percentages, yield
- ✅ Handles multiple UoMs correctly (kg, pieces, liters)

---

## Tasks / Subtasks

### Phase 1: Database Schema & Service Layer

- [ ] Task 1: Complete work_orders table schema (AC: 3.10.1)
  - [ ] Subtask 1.1: Add missing columns to existing work_orders table
  - [ ] Subtask 1.2: Create indexes on org_id, status, scheduled_date, wo_number
  - [ ] Subtask 1.3: Create CHECK constraints for data validation
  - [ ] Subtask 1.4: Enable RLS on work_orders table
  - [ ] Subtask 1.5: Create trigger for updated_at auto-update

- [ ] Task 2: Implement WO number auto-generation (AC: 3.10.2)
  - [ ] Subtask 2.1: Create wo_number sequence counter (stored as function or trigger)
  - [ ] Subtask 2.2: Implement sequence reset at midnight
  - [ ] Subtask 2.3: Test format: WO-YYYYMMDD-NNNN
  - [ ] Subtask 2.4: Test uniqueness per org

- [ ] Task 3: Implement BOM auto-selection logic (AC: 3.10.3)
  - [ ] Subtask 3.1: Create `selectActiveBOM(product_id, date)` utility function
  - [ ] Subtask 3.2: Query active BOMs by product + effective date range
  - [ ] Subtask 3.3: Test fallback error handling (no matching BOM)
  - [ ] Subtask 3.4: Test with multiple BOM versions

- [ ] Task 4: Implement BOM snapshot creation (AC: 3.10.4)
  - [ ] Subtask 4.1: Create wo_materials table (if not exists)
  - [ ] Subtask 4.2: Implement snapshot function: copy bom_items → wo_materials
  - [ ] Subtask 4.3: Implement quantity scaling: wo_qty / bom.output_qty
  - [ ] Subtask 4.4: Handle by-products, scrap%, yield_percent correctly
  - [ ] Subtask 4.5: Set initial status = 'planned'
  - [ ] Subtask 4.6: Test snapshot immutability (after release, can't change)

- [ ] Task 5: Create WorkOrderService class (AC: 3.10.5)
  - [ ] Subtask 5.1: Implement createWorkOrder() with BOM selection + snapshot
  - [ ] Subtask 5.2: Implement getWorkOrders() with filtering
  - [ ] Subtask 5.3: Implement getWorkOrderById()
  - [ ] Subtask 5.4: Implement updateWorkOrder() with date-based BOM re-selection
  - [ ] Subtask 5.5: Implement deleteWorkOrder() (draft only)
  - [ ] Subtask 5.6: Add org_id isolation to all methods
  - [ ] Subtask 5.7: Add Zod validation schemas

### Phase 2: API Routes

- [ ] Task 6: Create API routes (AC: 3.10.6)
  - [ ] Subtask 6.1: Create `/api/planning/work-orders/route.ts` (GET, POST)
  - [ ] Subtask 6.2: Create `/api/planning/work-orders/[id]/route.ts` (GET, PUT, DELETE)
  - [ ] Subtask 6.3: Implement request validation with Zod
  - [ ] Subtask 6.4: Implement response formatting
  - [ ] Subtask 6.5: Implement error handling middleware
  - [ ] Subtask 6.6: Test all endpoints with supertest

### Phase 3: Frontend UI

- [ ] Task 7: Create WO List Page (AC: 3.10.7)
  - [ ] Subtask 7.1: Create `/planning/work-orders/page.tsx`
  - [ ] Subtask 7.2: Implement data table with columns
  - [ ] Subtask 7.3: Implement search filter
  - [ ] Subtask 7.4: Implement status/priority/line filters
  - [ ] Subtask 7.5: Implement date range filter
  - [ ] Subtask 7.6: Implement sorting on column headers
  - [ ] Subtask 7.7: Implement pagination
  - [ ] Subtask 7.8: Add "Add WO" button

- [ ] Task 8: Create WO Detail Page (AC: 3.10.7 cont.)
  - [ ] Subtask 8.1: Create `/planning/work-orders/[id]/page.tsx`
  - [ ] Subtask 8.2: Display WO details in read-only view
  - [ ] Subtask 8.3: Show wo_materials table (snapshot)
  - [ ] Subtask 8.4: Add Edit button (opens modal)
  - [ ] Subtask 8.5: Add Delete button with confirmation

- [ ] Task 9: Create WO Create/Edit Modal (AC: 3.10.8)
  - [ ] Subtask 9.1: Create `WorkOrderModal.tsx` component
  - [ ] Subtask 9.2: Implement product_id searchable dropdown
  - [ ] Subtask 9.3: Implement quantity number input
  - [ ] Subtask 9.4: Implement scheduled_date date picker
  - [ ] Subtask 9.5: Implement line_id and machine_id dropdowns
  - [ ] Subtask 9.6: Implement priority select
  - [ ] Subtask 9.7: Implement BOM display + optional override
  - [ ] Subtask 9.8: Implement form validation + error display
  - [ ] Subtask 9.9: Implement submit + success/error toasts
  - [ ] Subtask 9.10: Test create and edit modes

### Phase 4: Testing

- [ ] Task 10: Unit tests - Service layer (AC: 3.10.5, 3.10.3, 3.10.4)
  - [ ] Subtask 10.1: Test createWorkOrder() with BOM selection
  - [ ] Subtask 10.2: Test BOM snapshot creation + quantity scaling
  - [ ] Subtask 10.3: Test WO number generation (format, uniqueness)
  - [ ] Subtask 10.4: Test getWorkOrders() filtering
  - [ ] Subtask 10.5: Test updateWorkOrder() with date-based BOM re-selection
  - [ ] Subtask 10.6: Test org_id isolation
  - [ ] Subtask 10.7: Test error handling (NOT_FOUND, INVALID_STATUS, etc.)
  - [ ] Subtask 10.8: Target: 95% coverage

- [ ] Task 11: Integration tests - API endpoints (AC: 3.10.6)
  - [ ] Subtask 11.1: Test POST /api/planning/work-orders (201, 400, 403)
  - [ ] Subtask 11.2: Test GET /api/planning/work-orders with filters
  - [ ] Subtask 11.3: Test GET /api/planning/work-orders/:id (200, 404)
  - [ ] Subtask 11.4: Test PUT /api/planning/work-orders/:id (200, 404, 400)
  - [ ] Subtask 11.5: Test DELETE /api/planning/work-orders/:id (204, 404)
  - [ ] Subtask 11.6: Test org_id isolation (403 if wrong org)
  - [ ] Subtask 11.7: Test role-based authorization (AC-3.10.9)
  - [ ] Subtask 11.8: Target: 70% coverage

- [ ] Task 12: E2E tests - Full user workflow (AC: All)
  - [ ] Subtask 12.1: Navigate to /planning/work-orders
  - [ ] Subtask 12.2: Click "Add WO" → modal opens
  - [ ] Subtask 12.3: Fill form (product, qty, date)
  - [ ] Subtask 12.4: Submit → WO created, appears in table
  - [ ] Subtask 12.5: Click WO → detail page shows materials
  - [ ] Subtask 12.6: Click Edit → modal pre-populated
  - [ ] Subtask 12.7: Change date → BOM re-selected
  - [ ] Subtask 12.8: Save → updates in table
  - [ ] Subtask 12.9: Delete → WO removed from table
  - [ ] Subtask 12.10: Test filters (status, priority, date range)
  - [ ] Subtask 12.11: Target: 100% critical path coverage

---

## Dev Notes

### Architecture Patterns

- **Template A - CRUD Pattern**: Used for Purchase Orders (Story 3.1-3.2), Transfer Orders (Story 3.6-3.8)
  - Reuse: Service layer abstraction, API route patterns, validation schemas
  - Location: `/lib/services/work-order-service.ts`, `/app/api/planning/work-orders/`

- **BOM Integration**: Epic 2 established BOM schema with versioning by effective dates
  - Use: `selectActiveBOM()` utility (similar to Story 3.4)
  - Location: `/lib/utils/select-active-bom.ts` (may already exist)

- **Auto-generation Pattern**: TO number (Story 3.6) uses WO-like pattern
  - Reference: `/lib/services/transfer-order-service.ts:108-125` (TO number generation)
  - Adapt: WO-YYYYMMDD-NNNN instead of TO-YYYY-NNN

- **RLS Policies**: All tables use org_id isolation
  - Pattern: `WHERE org_id = auth.jwt() ->> 'org_id'`
  - Location: Review Story 3.6 migration (020_create_transfer_orders_table.sql)

### Learnings from Previous Stories (Story 3.9)

From Story 3.9 (LP Selection) completion notes:
- **New components created**:
  - Transfer Order list/detail pages follow consistent patterns
  - Modal components for selection workflows are well-established
  - Use existing `SuppliersTable.tsx` + `WorkOrdersTable.tsx` patterns

- **Testing patterns**:
  - Playwright E2E fixtures established in `tests/e2e/fixtures/test-setup.ts`
  - Use `createTestOrganization()`, `createTestUser()`, `createTestWarehouses()` from fixtures
  - Environment file: `.env.test` with TEST_ORG_ID

- **API response patterns**:
  - Consistent error codes: NOT_FOUND (404), INVALID_STATUS (400), ORG_ISOLATION (403)
  - Response format: `{ data: {...}, message: "..." }` or error object

- **Schema patterns**:
  - Auto-update triggers on `updated_at` established
  - RLS policies follow org_id pattern
  - Indexes on frequently filtered columns (org_id, status, date ranges)

### Constraints & Decisions

- **Status field**: Controlled enum (draft, released, in-progress, completed, cancelled)
  - Future: Story 3.15 will make this configurable
  - For now: Hard-coded in schema

- **BOM snapshot immutability**:
  - Feature-gate: Will be enforced in Story 3.23 (test story)
  - For now: No enforcement, just create snapshot

- **Material requirements capture**:
  - WO captures "planned" materials at creation time
  - Actual consumption tracked separately in Epic 4
  - wo_materials.status can be: planned, allocated, partially_consumed, consumed

### Testing Strategy

- **Unit Tests** (target 95%):
  - BOM auto-selection logic with multiple versions
  - WO number generation uniqueness per org
  - Quantity scaling for snapshots
  - Service layer CRUD operations

- **Integration Tests** (target 70%):
  - API endpoint request/response contracts
  - Org isolation enforcement
  - Role-based authorization
  - Database constraints validation

- **E2E Tests** (target 100% critical paths):
  - Create WO → view in list → edit → delete
  - BOM snapshot verification
  - Filter/sort functionality
  - Error scenarios (invalid product, duplicate WO)

---

## Dev Agent Record

### Context Reference

Context file: [03-10-work-order-crud.context.xml](03-10-work-order-crud.context.xml)

### Agent Model Used

Claude Haiku 4.5 (2025-11-26)

### Debug Log References

*Will be populated during implementation*

### Completion Notes List

*Will be populated after tasks are completed*

### File List

*Will be populated as files are created/modified*

---

## Status

- **Created:** 2025-11-26
- **Current Status:** ready-for-dev
- **Target Status:** done (after all ACs met + tests pass)

---

## Change Log

- 2025-11-26: Story created by Claude Code (dev-story workflow)
  - All acceptance criteria detailed from context file
  - Tasks/subtasks mapped to ACs
  - Integration points with Epic 2 and Stories 3.9, 3.11-3.16 documented
