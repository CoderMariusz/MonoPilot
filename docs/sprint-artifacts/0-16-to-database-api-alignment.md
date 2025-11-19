# Story 0.16: TO Database & API Alignment

**Priority:** P0 (CRITICAL - Data layer mismatch)
**Effort:** 8 SP (16 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes
**Status:** ready-for-dev

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/0-16-to-database-api-alignment.context.xml`

---

## Problem Statement

Massive mismatch between database schema, API routes, and TypeScript types for Transfer Orders. The API routes and types use column names that don't exist in the actual database, causing query failures and silent data loss.

### Current DB vs Expected Schema

**to_header - Current DB:**
```sql
id, org_id, to_number, from_warehouse_id, to_warehouse_id, status,
scheduled_date, notes, created_by, updated_by, created_at, updated_at
```

**to_header - Missing columns (from architecture.md/types):**
- `requested_date` - When transfer is requested (DB has only `scheduled_date`)
- `planned_ship_date` - When shipment is planned
- `actual_ship_date` - When shipment actually occurred
- `planned_receive_date` - When receipt is planned
- `actual_receive_date` - When receipt actually occurred
- `approved_by` - Who approved the TO
- `transfer_date` - Generic transfer date (from types)

**to_header - Column name mismatches:**
- DB: `to_number` → API/Types: `number`
- DB: `from_warehouse_id` → API/Types: `from_wh_id`
- DB: `to_warehouse_id` → API/Types: `to_wh_id`

**to_line - Current DB:**
```sql
id, to_id, line_number, product_id, quantity, transferred_qty,
uom, notes, created_at, updated_at
```

**to_line - Missing columns:**
- `qty_shipped` - Quantity shipped (intermediate state)
- `lp_id` - License plate reference for tracking
- `batch` - Batch number
- `from_location_id` - Source location (used in API)
- `to_location_id` - Destination location (used in API)
- `scan_required` - Whether LP scan is required (used in API)

**to_line - Column name mismatches:**
- DB: `line_number` → API/Types: `line_no`
- DB: `product_id` → API/Types: `item_id`
- DB: `quantity` → API/Types: `qty_planned`
- DB: `transferred_qty` → Types: `qty_received`

---

## User Story

**As a** developer maintaining MonoPilot,
**I want** TO database schema, API routes, and types to be aligned,
**So that** Transfer Order CRUD operations work correctly without query failures.

---

## Acceptance Criteria

### AC1: Database Migration
**Given** the current simplified to_header and to_line tables
**When** migration is applied
**Then** all missing columns from architecture.md are added
**And** existing data is preserved
**And** column names are documented clearly

### AC2: API Route Alignment
**Given** updated database schema
**When** reviewing `/api/planning/to/route.ts` and related routes
**Then** all column names match actual DB columns
**And** foreign key references use correct names
**And** INSERT/UPDATE/SELECT operations succeed

### AC3: TypeScript Types Match
**Given** `TOHeader` and `TOLine` interfaces in `lib/types.ts`
**When** comparing to DB schema
**Then** all fields exist in both directions
**And** field names match exactly
**And** data types are compatible

### AC4: Supabase Query Fixes
**Given** the foreign key references in to_header
**When** using Supabase select with relationships
**Then** FK names match actual constraint names
**And** No "relation not found" errors occur

### AC5: Backward Compatibility
**Given** existing TO data in database
**When** migration runs
**Then** existing records remain valid
**And** new columns have sensible defaults

---

## Technical Implementation

### Phase 1: Database Migration

Create migration `087_to_schema_alignment.sql`:

```sql
-- Phase 1: Add missing columns to to_header
ALTER TABLE to_header
  ADD COLUMN IF NOT EXISTS requested_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS planned_ship_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_ship_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS planned_receive_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_receive_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Copy scheduled_date to requested_date for existing records
UPDATE to_header
SET requested_date = scheduled_date
WHERE requested_date IS NULL AND scheduled_date IS NOT NULL;

-- Phase 2: Add missing columns to to_line
ALTER TABLE to_line
  ADD COLUMN IF NOT EXISTS qty_shipped DECIMAL(15,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lp_id BIGINT REFERENCES license_plates(id),
  ADD COLUMN IF NOT EXISTS batch VARCHAR(100),
  ADD COLUMN IF NOT EXISTS from_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS to_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS scan_required BOOLEAN DEFAULT false;

-- Note: Keep existing column names (to_number, from_warehouse_id, to_warehouse_id,
-- line_number, product_id, quantity, transferred_qty)
-- Update API and types to match actual DB names
```

### Phase 2: API Route Updates

**File: `apps/frontend/app/api/planning/to/route.ts`**

Fix GET query foreign key references:
```typescript
let query = supabase
  .from('to_header')
  .select(`
    *,
    from_warehouse:warehouses!to_header_from_warehouse_id_fkey(*),
    to_warehouse:warehouses!to_header_to_warehouse_id_fkey(*),
    to_lines:to_line(*, product:products(*), from_location:locations(*), to_location:locations(*), license_plate:license_plates(*))
  `)
```

Fix filter column names:
```typescript
if (from_wh_id) {
  query = query.eq('from_warehouse_id', from_wh_id);  // ✅ Correct name
}

if (to_wh_id) {
  query = query.eq('to_warehouse_id', to_wh_id);  // ✅ Correct name
}

if (search) {
  query = query.or(`to_number.ilike.%${search}%`);  // ✅ Correct name
}
```

Fix POST insert:
```typescript
const { data: toHeader, error: toError } = await supabase
  .from('to_header')
  .insert({
    to_number: toNumber,  // ✅ Correct name
    status: 'Draft',
    from_warehouse_id,    // ✅ Correct name
    to_warehouse_id,      // ✅ Correct name
    scheduled_date,
    requested_date,
    created_by: (await supabase.auth.getUser()).data.user?.id
  })
```

Fix line insert:
```typescript
const toLines = lines.map((line: any, index: number) => ({
  to_id: toHeader.id,
  line_number: index + 1,     // ✅ Correct name
  product_id: line.product_id, // ✅ Correct name
  uom: line.uom,
  quantity: line.quantity,     // ✅ Correct name
  from_location_id: line.from_location_id,
  to_location_id: line.to_location_id,
  scan_required: line.scan_required || false
}));
```

### Phase 3: Type Updates

**File: `apps/frontend/lib/types.ts`**

Update TOHeader to match DB:
```typescript
export interface TOHeader {
  id: number;
  org_id?: number;
  to_number: string;       // ✅ Match DB
  status: TOStatus;
  from_warehouse_id: number;  // ✅ Match DB
  to_warehouse_id: number;    // ✅ Match DB
  scheduled_date?: string | null;
  transfer_date?: string | null;
  requested_date?: string | null;
  planned_ship_date?: string | null;
  actual_ship_date?: string | null;
  planned_receive_date?: string | null;
  actual_receive_date?: string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  to_lines?: TOLine[];
}

export interface TOLine {
  id: number;
  to_id: number;
  line_number: number;     // ✅ Match DB
  product_id: number;      // ✅ Match DB
  uom: string;
  quantity: number;        // ✅ Match DB
  qty_shipped: number;
  transferred_qty: number; // ✅ Match DB (was qty_received)
  lp_id?: number | null;
  batch?: string | null;
  from_location_id?: number | null;
  to_location_id?: number | null;
  scan_required?: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships
  product?: Product;
  from_location?: Location;
  to_location?: Location;
  license_plate?: LicensePlate;
}
```

---

## Files to Modify

1. **`apps/frontend/lib/supabase/migrations/087_to_schema_alignment.sql`** - New migration
2. **`apps/frontend/app/api/planning/to/route.ts`** - Fix column names and FK references
3. **`apps/frontend/app/api/planning/to/[id]/route.ts`** - Fix column names
4. **`apps/frontend/app/api/planning/to/[id]/lines/route.ts`** - Fix column names
5. **`apps/frontend/app/api/planning/to/[id]/approve/route.ts`** - Fix column names
6. **`apps/frontend/app/api/planning/to/[id]/reopen/route.ts`** - Fix column names
7. **`apps/frontend/app/api/planning/to/line/[lineId]/route.ts`** - Fix column names
8. **`apps/frontend/lib/types.ts`** - Update TOHeader, TOLine interfaces
9. **`apps/frontend/lib/api/transferOrders.ts`** - Update field mappings
10. **Any components** using TO data - Update field references

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing TO data preserved after migration
- [ ] Foreign key constraints valid
- [ ] POST /api/planning/to creates TO successfully
- [ ] GET /api/planning/to returns all fields with correct relationships
- [ ] GET /api/planning/to?from_wh_id=X filters correctly
- [ ] GET /api/planning/to?search=X searches by to_number
- [ ] TransferOrdersAPI.getAll() returns correct data
- [ ] TransferOrdersAPI.getById() returns correct data
- [ ] TO list page displays correctly
- [ ] TO detail/edit page loads correctly
- [ ] TypeScript type-check passes
- [ ] No console errors in browser

---

## Definition of Done

- [ ] Migration created and applied
- [ ] All API routes use correct column names
- [ ] TypeScript types match DB schema exactly
- [ ] Supabase foreign key references correct
- [ ] Client API maps fields correctly
- [ ] No data loss for existing records
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Manual test: Create TO → Edit TO → View TO list

---

## Architecture Reference

See: `docs/architecture.md` → **to_header** (lines 6743-6762) and **to_line** (lines 6765-6779)

---

## Dependencies

- None (standalone fix)

## Blocked By

- None

## Blocks

- Warehouse transit operations
- Stock moves between warehouses
- TO receiving workflow

---

## Risk Assessment

**High Risk Items:**
1. Foreign key reference names in Supabase select queries
2. Existing TO records with populated scheduled_date

**Mitigation:**
1. Verify FK constraint names in Supabase dashboard before updating queries
2. Copy scheduled_date to requested_date during migration
3. Test on staging first

---

## Decision: Column Naming Strategy

**Chosen Approach:** Keep DB column names, update API/types to match
- `to_number` stays (not `number`)
- `from_warehouse_id` stays (not `from_wh_id`)
- `to_warehouse_id` stays (not `to_wh_id`)
- `line_number` stays (not `line_no`)
- `product_id` stays (not `item_id`)
- `quantity` stays (not `qty_planned`)
- `transferred_qty` stays (not `qty_received`)

**Rationale:** Same as PO - DB is source of truth, less risky than column renames.

