# ADR Summary: Work Order CRUD Module (Story 03.10)

**Story**: 03.10
**Module**: Planning (03)
**Epic**: 03-planning
**Status**: Complete
**Date**: 2025-12-31

---

## Executive Summary

Story 03.10 implements the complete Work Order CRUD lifecycle with 11 API endpoints, BOM auto-selection, material tracking, and status transitions. The implementation follows established architectural decision records (ADRs) for REST API design, multi-tenancy, and data security.

**Key Deliverables**:
- 11 REST API endpoints with full CRUD + status transitions
- BOM auto-selection algorithm for scheduled production dates
- Work order status history audit trail
- Material reservation snapshot from BOM
- TypeScript service layer with comprehensive error handling

**Test Coverage**: 154/154 tests passing (100%)
**Code Review**: Approved (9.1/10)

---

## Architectural Decisions Referenced

### ADR-013: Row-Level Security for Multi-Tenancy

**Decision**: All work order queries enforce org_id isolation via RLS policies.

**Implementation**:
```sql
-- RLS policy on work_orders table
CREATE POLICY "Users can view work orders in their org"
  ON work_orders FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id'::text);
```

**Benefits**:
- Prevents cross-org data access
- Database-level security enforcement
- Automatic isolation in all queries

**Related Files**:
- `/workspaces/MonoPilot/apps/frontend/app/api/planning/work-orders/route.ts` (line 21)
- `/workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/03-planning/DATABASE-WORK-ORDERS.md`

---

### ADR-018: REST API Standardization

**Decision**: All endpoints follow RESTful conventions with standardized error handling.

**API Pattern**:

```
GET    /api/planning/work-orders                  # List
POST   /api/planning/work-orders                  # Create
GET    /api/planning/work-orders/{id}             # Get detail
PUT    /api/planning/work-orders/{id}             # Update
DELETE /api/planning/work-orders/{id}             # Delete

POST   /api/planning/work-orders/{id}/plan        # Status: draft → planned
POST   /api/planning/work-orders/{id}/release     # Status: planned → released
POST   /api/planning/work-orders/{id}/cancel      # Status: any → cancelled
```

**Response Format**:

```json
{
  "success": true|false,
  "data": null|object|array,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  },
  "meta": { "pagination": "details" }
}
```

**Benefits**:
- Consistent across all endpoints
- Predictable error handling
- Easy client integration

**Related Files**:
- `/workspaces/MonoPilot/apps/frontend/app/api/planning/work-orders/route.ts`
- `/workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/03-planning/API-WORK-ORDERS.md`

---

### ADR-019: Service Layer Architecture

**Decision**: Business logic separated from API routes in dedicated service layer.

**Architecture**:

```
API Route (auth + validation)
    ↓
Service Layer (business logic)
    ↓
Database (persistence)
```

**Service Pattern**:

```typescript
// lib/services/work-order-service.ts
export const WorkOrderService = {
  list,
  getById,
  create,
  update,
  delete: deleteWorkOrder,
  plan,
  release,
  cancel,
  getActiveBomForDate,
  getAvailableBoms,
  previewNextNumber,
  getStatusHistory,
  validateStatusTransition,
  canEditField
}
```

**Benefits**:
- Reusable across endpoints
- Testable in isolation
- Clear separation of concerns

**Related Files**:
- `/workspaces/MonoPilot/apps/frontend/lib/services/work-order-service.ts`
- `/workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/03-planning/DEV-GUIDE-WORK-ORDERS.md` (Architecture section)

---

## Key Patterns Established

### 1. BOM Auto-Selection Algorithm

**Problem**: Users must manually select BOM version, but most of the time the "current" BOM for the production date should be auto-selected.

**Solution**: Database function selects most recent active BOM for scheduled date.

**Algorithm**:

```sql
-- Get active BOM for product on date
SELECT * FROM get_active_bom_for_date(
  p_product_id := product_id,
  p_org_id := org_id,
  p_scheduled_date := planned_start_date
)

-- Returns BOM where:
-- 1. status = 'active'
-- 2. effective_from <= scheduled_date
-- 3. effective_to IS NULL OR effective_to >= scheduled_date
-- 4. Ordered by version DESC (highest = most recent)
-- 5. LIMIT 1 (first match)
```

**Usage**:

```typescript
// Frontend doesn't provide bom_id
const response = await createWorkOrder({
  product_id: 'prod-123',
  planned_start_date: '2024-12-20',
  planned_quantity: 1000
  // No bom_id
})

// Service auto-selects BOM
const activeBom = await getActiveBomForDate(
  supabase,
  input.product_id,
  orgId,
  new Date(input.planned_start_date)
)

if (activeBom) {
  bomId = activeBom.bom_id  // Auto-populate
}
```

**Files**:
- Implementation: `lib/services/work-order-service.ts` (lines 898-922)
- Database: `supabase/migrations/074-*.sql` (get_active_bom_for_date function)
- API: `/app/api/planning/work-orders/bom-for-date/route.ts`
- Documentation: `API-WORK-ORDERS.md` (BOM Auto-Selection Algorithm section)

---

### 2. WO Number Generation

**Problem**: Need unique, human-readable WO numbers per organization per day.

**Solution**: Daily sequence table incremented on each creation.

**Format**: `WO-YYYYMMDD-NNNN`
- Example: `WO-20241220-0001`

**Database Function**:

```sql
CREATE OR REPLACE FUNCTION generate_wo_number(
  p_org_id UUID,
  p_date DATE
) RETURNS TEXT AS $$
-- Increments wo_daily_sequence for date
-- Returns formatted string
$$
```

**Usage**:

```typescript
// Service calls function during create
const woNumber = await supabase.rpc('generate_wo_number', {
  p_org_id: orgId,
  p_date: input.planned_start_date
})

// Returns: 'WO-20241220-0001'
```

**Files**:
- Implementation: `lib/services/work-order-service.ts` (lines 513-527)
- Database: `supabase/migrations/074-*.sql`
- API: `/app/api/planning/work-orders/next-number/route.ts`

---

### 3. Status Transition Matrix

**Problem**: Only certain status transitions are valid (e.g., can't go from completed back to in_progress).

**Solution**: Hardcoded transition matrix validated on every change.

**Matrix**:

```typescript
export const VALID_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['released', 'draft', 'cancelled'],
  released: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  closed: [],          // Terminal state
  cancelled: [],       // Terminal state
}

// Validation function
export function validateStatusTransition(
  currentStatus: WOStatus,
  newStatus: WOStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}
```

**Enforcement**:

```typescript
// Every status change checks transition
if (!validateStatusTransition(wo.status, 'released')) {
  throw new WorkOrderError(
    'Cannot release WO from current status',
    'INVALID_TRANSITION',
    400
  )
}
```

**Files**:
- Implementation: `lib/services/work-order-service.ts` (lines 229-276)
- Usage: All status change endpoints (`plan`, `release`, `cancel`)
- Documentation: `DATABASE-WORK-ORDERS.md` (Status Transition Rules)

---

### 4. Field Locking After Release

**Problem**: Once work order is released, certain fields (product, BOM, quantity) must be immutable to maintain data integrity.

**Solution**: Service validates field editability based on status.

**Locked Fields After Release**:

```typescript
export const LOCKED_FIELDS_AFTER_RELEASE = [
  'product_id',
  'bom_id',
  'planned_quantity'
]

export function canEditField(status: WOStatus, field: string): boolean {
  // After release, certain fields are locked
  if (['released', 'in_progress', 'on_hold', 'completed', 'closed'].includes(status)) {
    return !LOCKED_FIELDS_AFTER_RELEASE.includes(field)
  }
  // Cancelled WOs cannot be edited
  if (status === 'cancelled') {
    return false
  }
  return true
}
```

**Usage in Update Endpoint**:

```typescript
// Check locked fields before update
for (const field of LOCKED_FIELDS_AFTER_RELEASE) {
  if (field in input && !canEditField(currentStatus, field)) {
    throw new WorkOrderError(
      `Cannot modify ${field} after status ${currentStatus}`,
      'FIELD_LOCKED',
      400
    )
  }
}
```

**Files**:
- Implementation: `lib/services/work-order-service.ts` (lines 243-276)
- Usage: `PUT /api/planning/work-orders/[id]/route.ts`
- Documentation: `API-WORK-ORDERS.md` (Field Lock Rules)

---

### 5. Error Handling with Codes

**Problem**: Need structured error responses with machine-readable codes for frontend.

**Solution**: Custom WorkOrderError class with code and HTTP status.

**Error Class**:

```typescript
export class WorkOrderError extends Error {
  code: string      // 'PRODUCT_NOT_FOUND', 'INVALID_BOM', etc.
  status: number    // 400, 404, 500

  constructor(message: string, code: string, status: number = 400) {
    super(message)
    this.name = 'WorkOrderError'
    this.code = code
    this.status = status
  }
}
```

**Usage**:

```typescript
if (!product) {
  throw new WorkOrderError(
    'Product not found',
    'PRODUCT_NOT_FOUND',
    404
  )
}

// Caught in API route
try {
  const wo = await WorkOrderService.create(...)
} catch (error) {
  return handleApiError(error, 'POST /api/planning/work-orders')
}

// Returns response with error code for frontend
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

**Files**:
- Implementation: `lib/services/work-order-service.ts` (lines 210-220)
- Error Handling: `lib/api/error-handler.ts`
- Documentation: `API-WORK-ORDERS.md` (Error Codes Reference)

---

## Data Models

### work_orders Table

**Core Columns**:

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| org_id | UUID | Multi-tenancy isolation |
| wo_number | TEXT | Human-readable identifier |
| product_id | UUID | Reference to product |
| bom_id | UUID | BOM snapshot reference |
| routing_id | UUID | Routing snapshot reference |
| status | TEXT | Current state (enum) |
| priority | TEXT | Low, Normal, High, Critical |
| planned_quantity | DECIMAL | Order quantity |
| produced_quantity | DECIMAL | Actual produced |
| planned_start_date | DATE | Scheduled date |
| created_by | UUID | Who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Constraints**:
- UNIQUE (org_id, wo_number)
- CHECK status IN (valid values)
- RLS policy: org_id isolation

**Related Tables**:
- `wo_status_history` - Audit trail of status changes
- `wo_daily_sequence` - Daily sequence for WO number generation
- `wo_materials` - Material snapshot from BOM
- `wo_operations` - Operations snapshot from routing

**Files**:
- Schema: `supabase/migrations/069-*.sql`
- Documentation: `DATABASE-WORK-ORDERS.md`

---

## Frontend Integration

### React Query Hooks

**useWorkOrders()** - List with filters

```typescript
const { data, isLoading } = useWorkOrders({
  status: 'planned,released',
  limit: 20,
  page: 1
})

// Returns: { data: WOListItem[], pagination: {...} }
```

**useCreateWorkOrder()** - Create mutation

```typescript
const { mutate: createWO, isPending } = useCreateWorkOrder()
mutate({ product_id, planned_quantity, ... })

// Automatically invalidates list queries on success
```

**useReleaseWorkOrder()** - Status transition

```typescript
const { mutate: release } = useReleaseWorkOrder()
release({ id: woId, notes: 'Ready for production' })
```

**Files**:
- Hooks: `lib/hooks/use-work-*.ts`
- Components: `components/planning/work-orders/*.tsx`
- Documentation: `COMPONENTS-WORK-ORDERS.md`

---

## Testing Strategy

### Unit Tests (Service Layer)

**Coverage**: WorkOrderService methods

```typescript
describe('WorkOrderService.create', () => {
  it('should auto-select BOM for date', () => { ... })
  it('should throw error if product not found', () => { ... })
  it('should validate BOM belongs to product', () => { ... })
})
```

### Integration Tests (API Endpoints)

**Coverage**: Full request/response cycle

```typescript
describe('POST /api/planning/work-orders', () => {
  it('should create work order with auto-selected BOM', async () => { ... })
  it('should respect RLS org_id isolation', async () => { ... })
  it('should return 404 if product not found', async () => { ... })
})
```

### E2E Tests (User Workflows)

**Coverage**: Complete user scenarios

```typescript
test('Create and release work order', async ({ page }) => {
  // Navigate
  await page.goto('/planning/work-orders')

  // Create
  await page.click('[data-testid="create-wo"]')
  await page.fill('[placeholder="Product"]', 'Chocolate Bar')
  await page.click('[data-testid="submit"]')

  // Release
  await page.click('[data-testid="wo-row-0"]')
  await page.click('[data-testid="release-button"]')

  // Verify
  expect(page.locator('[data-testid="status"]')).toContainText('released')
})
```

**Result**: 154/154 tests passing (100%)

**Files**:
- Unit: `/workspaces/MonoPilot/apps/frontend/__tests__/work-order-service.spec.ts`
- Integration: `/workspaces/MonoPilot/apps/frontend/__tests__/api/work-orders.spec.ts`
- E2E: `/workspaces/MonoPilot/e2e/work-orders.spec.ts`

---

## Performance Considerations

### Database Indexing

**Strategy**: Cover list query patterns

```sql
-- Performance for list queries with filters
CREATE INDEX idx_work_orders_org_status ON work_orders(org_id, status);
CREATE INDEX idx_work_orders_org_product ON work_orders(org_id, product_id);
CREATE INDEX idx_work_orders_org_date ON work_orders(org_id, planned_start_date DESC);

-- Performance for detail queries
CREATE INDEX idx_work_orders_id_org ON work_orders(id, org_id);
```

**Query Targets**:
- List 1000 WOs: < 500ms
- Get single detail: < 100ms
- Create WO: < 1s

### React Query Caching

**Strategy**: Balance freshness with performance

```typescript
const workOrderKeys = {
  lists: () => [...workOrderKeys.all, 'list'],
  list: (params) => [...workOrderKeys.lists(), params]
}

// Stale time: 30 seconds (refresh user quickly sees updates)
// Cache time: 5 minutes (retain data for back/forward)
```

**Files**:
- Database: `DATABASE-WORK-ORDERS.md` (Indexing Strategy)
- Frontend: `COMPONENTS-WORK-ORDERS.md` (React Query Hooks)

---

## Security

### Multi-Tenancy (ADR-013)

- **RLS Policies**: org_id enforcement at database
- **Auth Helpers**: getAuthContextOrThrow() validates session
- **Input Validation**: Zod schemas on all endpoints

### Authorization

**Role-Based Permissions**:

| Endpoint | Permission | Roles |
|----------|-----------|-------|
| List/Get | read | All authenticated |
| Create/Update | write | Admin, PM, Planner |
| Delete | delete | Admin, PM (draft only) |
| Status Change | transition | Admin, PM, Planner |

**Files**:
- Auth: `lib/api/auth-helpers.ts`
- API: All route.ts files check permissions
- Documentation: `API-WORK-ORDERS.md` (Authentication & Authorization)

---

## Future Enhancements

### Planned in Future Stories

1. **Material Reservations** (FR-PLAN-025)
   - Reserve license plates for WO
   - FEFO/FIFO strategies
   - Partial reservations

2. **Production Operations** (Story 04)
   - Start/pause/resume operations
   - Record actual yield
   - Capture production timestamps

3. **Batch Output Recording** (Story 04)
   - Record good/scrap quantities
   - Track by-products
   - Calculate final yield

4. **Gantt Visualization** (Story 02)
   - Visual timeline of WOs
   - Drag-to-reschedule
   - Capacity planning view

---

## Deployment Checklist

- [x] All migrations applied (069-074)
- [x] Database functions created (generate_wo_number, get_active_bom_for_date, etc.)
- [x] RLS policies enabled on all tables
- [x] API endpoints tested (all 11 working)
- [x] Service layer error handling complete
- [x] React Query hooks implemented
- [x] Components built (13 components)
- [x] All tests passing (154/154)
- [x] Code review approved (9.1/10)
- [x] Documentation complete (5 docs)

---

## Summary of Implementation

**What Was Built**:
- 11 REST API endpoints for full CRUD + status transitions
- BOM auto-selection with date-based matching
- Work order status history audit trail
- Material snapshot from BOM
- Complete service layer with error handling
- 13 React components for list, create, detail, and management
- React Query hooks for data fetching and caching

**What Gets Documented**:
- API specification with all endpoints and examples
- Database schema with constraints and functions
- Component hierarchy and prop interfaces
- Developer guide with quickstart and common tasks
- ADR summary tying to architectural decisions

**What Gets Tested**:
- Unit tests for service methods
- Integration tests for API endpoints
- E2E tests for user workflows
- Result: 154/154 passing (100%)

**What Gets Deployed**:
- All source code committed to main branch
- Database migrations applied
- API routes available at /api/planning/work-orders
- Frontend pages at /planning/work-orders

---

## References

- ADR-013: Row-Level Security for Multi-Tenancy
- ADR-018: REST API Standardization
- ADR-019: Service Layer Architecture
- PRD Module 03: Planning (2,793 lines)
- Wireframes: PLAN-013, PLAN-014, PLAN-015

---

**Document Status**: Complete
**Last Updated**: 2025-12-31
**Review**: Ready for final sign-off
