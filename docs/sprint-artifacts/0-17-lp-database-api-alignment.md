# Story 0.17: LP Database & API Alignment

**Priority:** P0 (CRITICAL - Data layer mismatch)
**Effort:** 13 SP (26 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes
**Status:** ready-for-dev

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/0-17-lp-database-api-alignment.context.xml`

---

## Problem Statement

Massive mismatch between database schema, API routes, and TypeScript types for License Plates. The types and API use fields that don't exist in the actual database, and use wrong data types for existing fields.

### Current DB vs Expected Schema

**license_plates - Current DB:**
```sql
id, org_id, lp_number, product_id, quantity, uom, status, location_id, warehouse_id,
batch_number, supplier_batch_number, manufacture_date, expiry_date,
po_id, po_number, grn_id, wo_id, parent_lp_id, consumed_by_wo_id,
created_by, created_at, updated_at
```

**license_plates - Missing columns (from types/architecture):**
- `qa_status` - QA inspection status (pending, passed, failed, on_hold)
- `stage_suffix` - Two-letter stage code (PR, FG, etc.)
- `lp_type` - License plate type (PR, FG, PALLET)
- `origin_type` - How LP was created (GRN, PRODUCTION, SPLIT)
- `origin_ref` - JSONB reference to origin
- `parent_lp_number` - Denormalized parent LP number for display
- `consumed_at` - When LP was consumed
- `is_consumed` - Computed flag for consumption status
- `pallet_code` - Reference to parent pallet

**TypeScript Type Issues (LicensePlate interface):**

| Field | Type Issue | DB Field |
|-------|------------|----------|
| `id` | `string` should be `number` | BIGINT |
| `lp_code` | DOESN'T EXIST | - |
| `item_id` | Wrong name | `product_id` |
| `batch` | Wrong name | `batch_number` |
| Missing | - | `org_id` |
| Missing | - | `warehouse_id` |
| Missing | - | `uom` (required!) |
| Missing | - | `supplier_batch_number` |
| Missing | - | `manufacture_date` |
| Missing | - | `po_id`, `po_number` |
| Missing | - | `grn_id`, `wo_id` |
| Missing | - | `consumed_by_wo_id` |

---

## User Story

**As a** developer maintaining MonoPilot,
**I want** LP database schema, API routes, and types to be aligned,
**So that** License Plate operations work correctly for traceability and genealogy.

---

## Acceptance Criteria

### AC1: Database Migration
**Given** the current license_plates table
**When** migration is applied
**Then** all missing columns from architecture.md are added
**And** existing data is preserved
**And** QA workflow fields are available

### AC2: TypeScript Type Alignment
**Given** `LicensePlate` interface in `lib/types.ts`
**When** comparing to DB schema
**Then** all fields exist and match exactly
**And** data types are correct (number for IDs, not string)
**And** no phantom fields exist

### AC3: API Route Alignment
**Given** scanner LP routes and LicensePlatesAPI
**When** performing CRUD operations
**Then** all column names match actual DB
**And** QA status operations work correctly

### AC4: Scanner Functionality
**Given** updated LP schema
**When** using scanner for LP operations (split, move, QA)
**Then** all operations succeed
**And** genealogy tracking works

### AC5: Backward Compatibility
**Given** existing LP data in database
**When** migration runs
**Then** existing records remain valid
**And** new columns have sensible defaults

---

## Technical Implementation

### Phase 1: Database Migration

Create migration `088_lp_schema_alignment.sql`:

```sql
-- Phase 1: Add missing columns to license_plates
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS qa_status VARCHAR(20) DEFAULT 'pending'
    CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold')),
  ADD COLUMN IF NOT EXISTS stage_suffix VARCHAR(10)
    CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  ADD COLUMN IF NOT EXISTS lp_type VARCHAR(20)
    CHECK (lp_type IN ('PR', 'FG', 'PALLET', 'RM', 'WIP')),
  ADD COLUMN IF NOT EXISTS origin_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS origin_ref JSONB,
  ADD COLUMN IF NOT EXISTS parent_lp_number TEXT,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pallet_id BIGINT REFERENCES pallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Create index for QA status queries
CREATE INDEX IF NOT EXISTS idx_license_plates_qa_status ON license_plates(qa_status);
CREATE INDEX IF NOT EXISTS idx_license_plates_lp_type ON license_plates(lp_type);
CREATE INDEX IF NOT EXISTS idx_license_plates_pallet_id ON license_plates(pallet_id);

-- Phase 2: Backfill origin_type based on existing references
UPDATE license_plates
SET origin_type = CASE
  WHEN grn_id IS NOT NULL THEN 'GRN'
  WHEN wo_id IS NOT NULL THEN 'PRODUCTION'
  WHEN parent_lp_id IS NOT NULL THEN 'SPLIT'
  ELSE 'MANUAL'
END
WHERE origin_type IS NULL;

-- Phase 3: Backfill lp_type based on product type
UPDATE license_plates lp
SET lp_type = CASE
  WHEN p.product_type = 'finished_good' THEN 'FG'
  WHEN p.product_type = 'raw_material' THEN 'RM'
  WHEN p.product_type = 'wip' THEN 'WIP'
  ELSE 'PR'
END
FROM products p
WHERE lp.product_id = p.id
  AND lp.lp_type IS NULL;

-- Phase 4: Backfill parent_lp_number for existing parent references
UPDATE license_plates child
SET parent_lp_number = parent.lp_number
FROM license_plates parent
WHERE child.parent_lp_id = parent.id
  AND child.parent_lp_number IS NULL;

-- Phase 5: Set consumed_at for consumed LPs
UPDATE license_plates
SET consumed_at = updated_at
WHERE consumed_by_wo_id IS NOT NULL
  AND consumed_at IS NULL;
```

### Phase 2: Type Updates

**File: `apps/frontend/lib/types.ts`**

Update LicensePlate interface:
```typescript
export interface LicensePlate {
  id: number;  // ✅ Fix: was string
  org_id?: number;
  lp_number: string;  // ✅ Fix: was optional
  product_id: number;  // ✅ Fix: was item_id and string
  quantity: number;
  uom: string;  // ✅ Add: was missing
  status: LicensePlateStatus;
  location_id?: number | null;
  warehouse_id: number;  // ✅ Add: was missing

  // Batch & Dates
  batch_number?: string | null;  // ✅ Fix: was batch
  supplier_batch_number?: string | null;  // ✅ Add: was missing
  manufacture_date?: string | null;  // ✅ Add: was missing
  expiry_date?: string | null;

  // QA
  qa_status?: QAStatus;
  stage_suffix?: string | null;
  lp_type?: 'PR' | 'FG' | 'PALLET' | 'RM' | 'WIP';

  // Traceability
  po_id?: number | null;  // ✅ Add: was missing
  po_number?: string | null;  // ✅ Add: was missing
  grn_id?: number | null;
  wo_id?: number | null;  // ✅ Add: was missing
  parent_lp_id?: number | null;
  parent_lp_number?: string | null;
  consumed_by_wo_id?: number | null;  // ✅ Add: was missing
  consumed_at?: string | null;

  // Origin
  origin_type?: 'GRN' | 'PRODUCTION' | 'SPLIT' | 'MANUAL';
  origin_ref?: Record<string, any>;

  // Pallet
  pallet_id?: number | null;

  // Audit
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;

  // Relationships (computed)
  product?: Product;
  location?: Location;
  warehouse?: Warehouse;
}
```

### Phase 3: API Updates

**Files to update:**
- `apps/frontend/app/api/scanner/lp/[id]/route.ts` - Already uses correct names
- `apps/frontend/lib/api/licensePlates.ts` - Update field mappings

**Key changes in LicensePlatesAPI:**
- Use `product_id` not `item_id`
- Use `batch_number` not `batch`
- Use numeric IDs not strings
- Include all required fields in create/update

---

## Files to Modify

1. **`apps/frontend/lib/supabase/migrations/088_lp_schema_alignment.sql`** - New migration
2. **`apps/frontend/lib/types.ts`** - Fix LicensePlate interface
3. **`apps/frontend/lib/api/licensePlates.ts`** - Fix field mappings
4. **`apps/frontend/app/api/scanner/lp/[id]/route.ts`** - Verify field names
5. **Any components** using LP data - Update field references

---

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Existing LP data preserved after migration
- [ ] qa_status field available for QA workflow
- [ ] lp_type properly backfilled
- [ ] parent_lp_number denormalized correctly
- [ ] origin_type populated for existing LPs
- [ ] LicensePlatesAPI.getAll() returns correct data
- [ ] LicensePlatesAPI.getById() returns correct data
- [ ] Scanner LP split operation works
- [ ] Scanner LP move operation works
- [ ] Scanner QA status change works
- [ ] LP genealogy queries work
- [ ] TypeScript type-check passes
- [ ] No console errors in browser

---

## Definition of Done

- [ ] Migration created and applied
- [ ] TypeScript types match DB schema exactly
- [ ] All API routes use correct column names
- [ ] Scanner operations work correctly
- [ ] QA workflow functional
- [ ] Genealogy tracking works
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Manual test: Create LP → Split → Move → Change QA

---

## Architecture Reference

See: `docs/architecture.md` → **license_plates** (lines 7520-7548)

---

## Dependencies

- None (standalone fix)

## Blocked By

- None

## Blocks

- Scanner module MVP
- Production consumption
- Genealogy/traceability reports
- QA workflow implementation

---

## Risk Assessment

**High Risk Items:**
1. Existing LP queries may break if expecting old field names
2. QA workflow depends on new qa_status column
3. Type changes (string → number for IDs) may cause frontend errors

**Mitigation:**
1. Run migration first, then update types/API
2. Test scanner flows thoroughly after changes
3. Run full type-check to catch ID type mismatches

---

## Decision: Column Naming Strategy

**Chosen Approach:** Keep DB column names, remove phantom fields from types
- `lp_number` stays (remove `lp_code`)
- `product_id` stays (remove `item_id`)
- `batch_number` stays (not `batch`)
- Use numeric types for all IDs (not strings)

**New Columns Added:**
- `qa_status` - Critical for QA workflow
- `lp_type` - Important for categorization
- `origin_type`, `origin_ref` - For traceability
- `parent_lp_number` - Denormalized for display
- `consumed_at` - Audit trail for consumption

