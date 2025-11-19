# Story 0.15: PO Database & API Alignment

**Priority:** P0 (CRITICAL - Data layer mismatch)
**Effort:** 8 SP (16 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes

---

## Problem Statement

Massive mismatch between database schema, API routes, and TypeScript types for Purchase Orders. The API routes and types expect columns that don't exist in the actual database, causing silent failures and data loss.

### Current DB vs Expected Schema

**po_header - Current DB:**
```sql
id, org_id, po_number, supplier_id, warehouse_id, status,
order_date, expected_date, currency, notes,
created_by, updated_by, created_at, updated_at
```

**po_header - Missing columns (from architecture.md):**
- `exchange_rate` - Currency conversion rate
- `requested_delivery_date` - When buyer wants delivery
- `promised_delivery_date` - When supplier promises delivery
- `payment_due_date` - Payment terms
- `snapshot_supplier_name` - Historical supplier name
- `snapshot_supplier_vat` - Historical VAT number
- `snapshot_supplier_address` - Historical address
- `asn_ref` - ASN reference number
- `net_total` - Calculated net amount
- `vat_total` - Calculated VAT amount
- `gross_total` - Calculated gross amount
- `approved_by` - Who approved the PO

**po_header - Column name mismatches:**
- DB: `po_number` → Architecture: `number`

**po_line - Current DB:**
```sql
id, po_id, line_number, product_id, quantity, received_qty,
uom, unit_price, tax_code_id, notes, created_at, updated_at
```

**po_line - Missing columns:**
- `requested_delivery_date` - Line-level delivery request
- `promised_delivery_date` - Line-level delivery promise
- `default_location_id` - Where to receive items

**po_line - Column name mismatches:**
- DB: `line_number` → Architecture: `line_no`
- DB: `product_id` → Architecture: `item_id`
- DB: `quantity` → Architecture: `qty_ordered`
- DB: `received_qty` → Architecture: `qty_received`
- DB: `tax_code_id` → Architecture: `vat_rate` (different concept!)
- DB: `notes` → Architecture: `note`

---

## User Story

**As a** developer maintaining MonoPilot,
**I want** PO database schema, API routes, and types to be aligned,
**So that** Purchase Order CRUD operations work correctly without silent data loss.

---

## Acceptance Criteria

### AC1: Database Migration
**Given** the current simplified po_header and po_line tables
**When** migration is applied
**Then** all missing columns from architecture.md are added
**And** existing data is preserved
**And** column names match architecture specification

### AC2: API Route Alignment
**Given** updated database schema
**When** reviewing `/api/planning/po/route.ts`
**Then** all column names match actual DB columns
**And** INSERT/UPDATE operations use correct field names
**And** SELECT queries return all available fields

### AC3: TypeScript Types Match
**Given** `POHeader` and `POLine` interfaces in `lib/types.ts`
**When** comparing to DB schema
**Then** all fields exist in both directions
**And** field names match exactly
**And** data types are compatible

### AC4: Frontend Client API
**Given** `PurchaseOrdersAPI` class in `lib/api/purchaseOrders.ts`
**When** calling getAll(), getById(), create(), update()
**Then** operations succeed without errors
**And** all fields are properly mapped
**And** no data is silently lost

### AC5: Backward Compatibility
**Given** existing PO data in database
**When** migration runs
**Then** existing records remain valid
**And** new columns have sensible defaults (NULL or calculated)

---

## Technical Implementation

### Phase 1: Database Migration

Create migration `086_po_schema_alignment.sql`:

```sql
-- Phase 1: Add missing columns to po_header
ALTER TABLE po_header
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,6) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS requested_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promised_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snapshot_supplier_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS snapshot_supplier_vat VARCHAR(50),
  ADD COLUMN IF NOT EXISTS snapshot_supplier_address TEXT,
  ADD COLUMN IF NOT EXISTS asn_ref VARCHAR(50),
  ADD COLUMN IF NOT EXISTS net_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Rename po_number to number for consistency with architecture
-- Note: Keep po_number as alias via view or update all code to use po_number
-- Decision: Keep po_number in DB, update architecture to match (simpler)

-- Phase 2: Add missing columns to po_line
ALTER TABLE po_line
  ADD COLUMN IF NOT EXISTS requested_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promised_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS default_location_id BIGINT REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,4) DEFAULT 0;

-- Note: Keep existing column names (line_number, product_id, quantity, received_qty, notes)
-- Update API and types to match actual DB names

-- Phase 3: Backfill supplier snapshots for existing POs
UPDATE po_header ph
SET
  snapshot_supplier_name = s.name,
  snapshot_supplier_vat = s.vat_number,
  snapshot_supplier_address = s.address
FROM suppliers s
WHERE ph.supplier_id = s.id
  AND ph.snapshot_supplier_name IS NULL;

-- Phase 4: Calculate totals for existing POs
UPDATE po_header ph
SET
  net_total = COALESCE((
    SELECT SUM(pl.quantity * pl.unit_price)
    FROM po_line pl
    WHERE pl.po_id = ph.id
  ), 0),
  vat_total = COALESCE((
    SELECT SUM(pl.quantity * pl.unit_price * COALESCE(pl.vat_rate, 0))
    FROM po_line pl
    WHERE pl.po_id = ph.id
  ), 0)
WHERE ph.net_total IS NULL OR ph.net_total = 0;

UPDATE po_header
SET gross_total = net_total + vat_total
WHERE gross_total IS NULL OR gross_total = 0;
```

### Phase 2: API Route Updates

**File: `apps/frontend/app/api/planning/po/route.ts`**

Update GET to return all fields:
```typescript
let query = supabase
  .from('po_header')
  .select(`
    *,
    supplier:suppliers(*),
    po_lines:po_line(*, item:products(*), default_location:locations(*))
  `)
```

Update POST to use correct column names:
```typescript
const { data: poHeader, error: poError } = await supabase
  .from('po_header')
  .insert({
    po_number: poNumber,  // ✅ Correct name
    supplier_id,
    status: 'draft',
    currency,
    exchange_rate: exchange_rate || 1.0,
    order_date,
    requested_delivery_date,
    promised_delivery_date,
    payment_due_date,
    snapshot_supplier_name: supplier?.name,
    snapshot_supplier_vat: supplier?.vat_number,
    snapshot_supplier_address: supplier?.address,
    asn_ref,
    created_by: (await supabase.auth.getUser()).data.user?.id
  })
```

Update line insert:
```typescript
const poLines = lines.map((line: any, index: number) => ({
  po_id: poHeader.id,
  line_number: index + 1,  // ✅ Correct name
  product_id: line.product_id,  // ✅ Correct name
  uom: line.uom,
  quantity: line.quantity,  // ✅ Correct name
  unit_price: line.unit_price,
  vat_rate: line.vat_rate || 0,
  tax_code_id: line.tax_code_id,
  requested_delivery_date: line.requested_delivery_date,
  promised_delivery_date: line.promised_delivery_date,
  default_location_id: line.default_location_id,
  notes: line.notes  // ✅ Correct name
}));
```

### Phase 3: Type Updates

**File: `apps/frontend/lib/types.ts`**

Update POHeader to match DB:
```typescript
export interface POHeader {
  id: number;
  org_id?: number;
  po_number: string;  // ✅ Match DB
  supplier_id: number;
  warehouse_id?: number;
  status: POStatus;
  currency: string;
  exchange_rate?: number;
  order_date: string;
  expected_date?: string;
  requested_delivery_date?: string;
  promised_delivery_date?: string;
  payment_due_date?: string;
  snapshot_supplier_name?: string;
  snapshot_supplier_vat?: string;
  snapshot_supplier_address?: string;
  asn_ref?: string;
  net_total?: number;
  vat_total?: number;
  gross_total?: number;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  supplier?: Supplier;
  po_lines?: POLine[];
}

export interface POLine {
  id: number;
  po_id: number;
  line_number: number;  // ✅ Match DB
  product_id: number;   // ✅ Match DB
  uom: string;
  quantity: number;     // ✅ Match DB
  received_qty: number; // ✅ Match DB
  unit_price: number;
  vat_rate?: number;
  tax_code_id?: number;
  requested_delivery_date?: string;
  promised_delivery_date?: string;
  default_location_id?: number;
  notes?: string;       // ✅ Match DB
  created_at?: string;
  updated_at?: string;
  // Relationships
  item?: Product;
  default_location?: Location;
}
```

### Phase 4: Client API Updates

**File: `apps/frontend/lib/api/purchaseOrders.ts`**

Update field mappings in getAll() and getById() to use:
- `po.po_number` instead of `po.number`
- `line.line_number` instead of `line.line_no`
- `line.product_id` instead of `line.item_id`
- `line.quantity` instead of `line.qty_ordered`
- `line.received_qty` instead of `line.qty_received`
- `line.notes` instead of `line.note`

---

## Files to Modify

1. **`apps/frontend/lib/supabase/migrations/086_po_schema_alignment.sql`** - New migration
2. **`apps/frontend/app/api/planning/po/route.ts`** - Fix column names
3. **`apps/frontend/app/api/planning/po/[id]/route.ts`** - Fix column names (if exists)
4. **`apps/frontend/lib/types.ts`** - Update POHeader, POLine interfaces
5. **`apps/frontend/lib/api/purchaseOrders.ts`** - Update field mappings
6. **Any components** using PO data - Update field references

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing PO data preserved after migration
- [ ] Supplier snapshots backfilled for existing POs
- [ ] Totals calculated for existing POs
- [ ] POST /api/planning/po creates PO successfully
- [ ] GET /api/planning/po returns all fields
- [ ] PurchaseOrdersAPI.getAll() returns correct data
- [ ] PurchaseOrdersAPI.getById() returns correct data
- [ ] PO list page displays correctly
- [ ] PO detail/edit page loads correctly
- [ ] TypeScript type-check passes
- [ ] No console errors in browser

---

## Definition of Done

- [ ] Migration created and applied
- [ ] All API routes use correct column names
- [ ] TypeScript types match DB schema exactly
- [ ] Client API maps fields correctly
- [ ] No data loss for existing records
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Manual test: Create PO → Edit PO → View PO list

---

## Architecture Reference

See: `docs/architecture.md` → **po_header** (lines 6649-6682) and **po_line** (lines 6685-6704)

---

## Dependencies

- None (standalone fix)

## Blocked By

- None

## Blocks

- All PO-related features
- Quick PO Entry workflow
- ASN receiving (references PO)
- GRN creation (references PO)

---

## Risk Assessment

**High Risk Items:**
1. Column renaming could break existing queries
2. Backfill queries might timeout on large datasets

**Mitigation:**
1. Keep existing DB column names (line_number, product_id, etc.) - update architecture to match
2. Run backfill in batches if needed
3. Test on staging first

---

## Decision: Column Naming Strategy

**Option A (Chosen):** Keep DB column names, update API/types to match
- `po_number` stays (not `number`)
- `line_number` stays (not `line_no`)
- `product_id` stays (not `item_id`)
- `quantity` stays (not `qty_ordered`)
- `received_qty` stays (not `qty_received`)
- `notes` stays (not `note`)

**Rationale:** Less risky than renaming columns. Architecture.md is documentation, not source of truth - DB is.

