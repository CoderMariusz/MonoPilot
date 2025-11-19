# Story 0.18: WO Database & API Alignment

**Priority:** P0 (CRITICAL - Data layer mismatch)
**Effort:** 13 SP (26 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes
**Status:** ready-for-dev

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/0-18-wo-database-api-alignment.context.xml`

---

## Problem Statement

Significant mismatch between database schema, API routes, and TypeScript types for Work Orders. The types use wrong data types (strings for IDs), wrong field names, and reference columns that don't exist in the database.

### Current DB vs Expected Schema

**work_orders - Current DB:**
```sql
id, org_id, wo_number, product_id, bom_id, routing_id, warehouse_id,
production_line_id, status, planned_qty, completed_qty, uom,
scheduled_date, start_date, end_date, priority, notes,
created_by, updated_by, created_at, updated_at
```

**TypeScript Type Issues (WorkOrder interface):**

| Field | Issue | DB Field |
|-------|-------|----------|
| `id: string` | Wrong type | `id BIGINT` (number) |
| `product_id: string` | Wrong type | `product_id BIGINT` (number) |
| `bom_id: string \| number` | Wrong type | `bom_id BIGINT` (number) |
| `machine_id: string` | Wrong type & doesn't exist | - |
| `quantity` | Wrong name | `planned_qty` |
| `due_date` | DOESN'T EXIST | `scheduled_date` |
| `scheduled_start` | DOESN'T EXIST | `start_date` |
| `scheduled_end` | DOESN'T EXIST | `end_date` |
| `line_number` | DOESN'T EXIST | - |
| `source_demand_type` | NOT IN DB | - |
| `source_demand_id` | NOT IN DB | - |
| `order_flags` | NOT IN DB | - |
| `customer_id` | NOT IN DB | - |
| `order_type` | NOT IN DB | - |
| Missing | - | `org_id` |
| Missing | - | `routing_id` |
| Missing | - | `warehouse_id` |
| Missing | - | `production_line_id` |
| Missing | - | `completed_qty` |
| Missing | - | `uom` |
| Missing | - | `notes` |
| Missing | - | `updated_by` |

**Architecture.md Issues:**
- Uses `quantity` instead of `planned_qty`
- Uses `scheduled_start/scheduled_end` instead of `start_date/end_date`
- Uses `line_id` instead of `production_line_id`
- Missing columns: `org_id`, `routing_id`, `warehouse_id`, `completed_qty`, `scheduled_date`

---

## User Story

**As a** developer maintaining MonoPilot,
**I want** WO database schema, API routes, and types to be aligned,
**So that** Work Order operations work correctly for production planning and execution.

---

## Acceptance Criteria

### AC1: Database Migration
**Given** the current work_orders table
**When** migration is applied
**Then** additional columns for future features are added
**And** existing data is preserved

### AC2: TypeScript Type Alignment
**Given** `WorkOrder` interface in `lib/types.ts`
**When** comparing to DB schema
**Then** all fields exist and match exactly
**And** data types are correct (number for IDs, not string)
**And** phantom fields are removed

### AC3: API Route Alignment
**Given** WO API routes
**When** performing CRUD operations
**Then** all column names match actual DB
**And** no undefined field errors occur

### AC4: Production Module Functionality
**Given** updated WO schema
**When** using production module for WO execution
**Then** all operations succeed
**And** BOM snapshot works correctly
**And** Material consumption tracks properly

### AC5: Backward Compatibility
**Given** existing WO data in database
**When** migration runs
**Then** existing records remain valid
**And** new columns have sensible defaults

---

## Technical Implementation

### Phase 1: Database Migration

Create migration `089_wo_schema_alignment.sql`:

```sql
-- Phase 1: Add future-proofing columns to work_orders
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS source_demand_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS source_demand_id BIGINT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS machine_id BIGINT REFERENCES machines(id);

-- Note: Keep existing column names:
-- - planned_qty (not quantity)
-- - scheduled_date (not due_date)
-- - start_date (not scheduled_start)
-- - end_date (not scheduled_end)
-- - production_line_id (not line_id)

-- Create index for demand tracking
CREATE INDEX IF NOT EXISTS idx_work_orders_source_demand
  ON work_orders(source_demand_type, source_demand_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_machine_id
  ON work_orders(machine_id);
```

### Phase 2: Type Updates

**File: `apps/frontend/lib/types.ts`**

Update WorkOrder interface:
```typescript
export interface WorkOrder {
  id: number;  // ✅ Fix: was string
  org_id?: number;  // ✅ Add: was missing
  wo_number: string;
  product_id: number;  // ✅ Fix: was string
  bom_id?: number | null;  // ✅ Fix: was string | number
  routing_id?: number | null;  // ✅ Add: was missing
  warehouse_id: number;  // ✅ Add: was missing
  production_line_id?: number | null;  // ✅ Add: was missing (not line_id)
  status: WorkOrderStatus;

  // Quantities
  planned_qty: number;  // ✅ Fix: was quantity
  completed_qty: number;  // ✅ Add: was missing
  uom: string;  // ✅ Add: was missing

  // Dates
  scheduled_date?: string | null;  // ✅ Fix: was due_date
  start_date?: string | null;  // ✅ Fix: was scheduled_start
  end_date?: string | null;  // ✅ Fix: was scheduled_end

  // Planning
  priority: number;
  machine_id?: number | null;  // ✅ Fix: was string

  // Demand tracking (optional)
  source_demand_type?: string | null;
  source_demand_id?: number | null;

  // Notes
  notes?: string | null;  // ✅ Add: was missing

  // Audit
  created_by?: string | null;
  updated_by?: string | null;  // ✅ Add: was missing
  approved_by?: string | null;
  created_at: string;
  updated_at: string;

  // Relationships (computed)
  product?: Product;
  bom?: Bom;
  machine?: Machine;
  production_line?: ProductionLine;
  wo_materials?: WOMaterial[];
  wo_operations?: WOOperation[];
  wo_by_products?: WOByProduct[];
}
```

Also update or add related interfaces:
```typescript
export interface WOMaterial {
  id: number;
  wo_id: number;
  material_id: number;
  planned_qty: number;
  consumed_qty: number;
  uom: string;
  scrap_percent: number;
  consume_whole_lp: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
  // Relationships
  material?: Product;
}

export interface WOOperation {
  id: number;
  wo_id: number;
  sequence: number;
  operation_name: string;
  machine_id?: number | null;
  status: string;
  planned_start?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships
  machine?: Machine;
}
```

### Phase 3: API Updates

**Files to update:**
- `apps/frontend/app/api/production/work-orders/route.ts`
- `apps/frontend/app/api/production/work-orders/[id]/route.ts`
- `apps/frontend/lib/api/workOrders.ts`

**Key changes:**
- Use `planned_qty` not `quantity`
- Use `scheduled_date` not `due_date`
- Use `start_date` not `scheduled_start`
- Use `end_date` not `scheduled_end`
- Use `production_line_id` not `line_id`
- Use numeric types for all IDs

---

## Files to Modify

1. **`apps/frontend/lib/supabase/migrations/089_wo_schema_alignment.sql`** - New migration
2. **`apps/frontend/lib/types.ts`** - Fix WorkOrder, add WOMaterial, WOOperation interfaces
3. **`apps/frontend/app/api/production/work-orders/route.ts`** - Fix field names
4. **`apps/frontend/app/api/production/work-orders/[id]/route.ts`** - Fix field names
5. **`apps/frontend/lib/api/workOrders.ts`** - Fix field mappings
6. **Any components** using WO data - Update field references

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing WO data preserved after migration
- [ ] WorkOrdersAPI.getAll() returns correct data
- [ ] WorkOrdersAPI.getById() returns correct data
- [ ] WO creation works with correct field names
- [ ] BOM snapshot captures materials correctly
- [ ] WO operations track correctly
- [ ] Production execution flows work
- [ ] TypeScript type-check passes
- [ ] No console errors in browser

---

## Definition of Done

- [ ] Migration created and applied
- [ ] TypeScript types match DB schema exactly
- [ ] All API routes use correct column names
- [ ] Production module operations work correctly
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Manual test: Create WO → Release → Execute → Close

---

## Architecture Reference

See: `docs/architecture.md` → **work_orders** (lines 6811-6835)

---

## Dependencies

- None (standalone fix)

## Blocked By

- None

## Blocks

- Production module functionality
- Scanner WO operations
- Material consumption
- Yield tracking

---

## Risk Assessment

**High Risk Items:**
1. Type changes (string → number) may cause frontend errors
2. Field renames may break existing queries
3. Production execution depends on correct WO structure

**Mitigation:**
1. Run full type-check after changes
2. Test production flows thoroughly
3. Verify BOM snapshot functionality

---

## Decision: Column Naming Strategy

**Chosen Approach:** Keep DB column names, remove phantom fields from types
- `planned_qty` stays (not `quantity`)
- `scheduled_date` stays (not `due_date`)
- `start_date/end_date` stays (not `scheduled_start/scheduled_end`)
- `production_line_id` stays (not `line_id`)
- Use numeric types for all IDs (not strings)

**Fields to Remove from Types:**
- `line_number` - doesn't exist
- `order_flags` - doesn't exist
- `customer_id` - doesn't exist
- `order_type` - doesn't exist

**Fields to Add to DB:**
- `source_demand_type/source_demand_id` - for demand tracking
- `machine_id` - for machine assignment at WO level
- `approved_by` - for approval workflow

