# Batch 5A-2: LP Operations - Technical Specification

**Batch:** 5A-2 (LP Operations)
**Stories:** 5.5-5.7
**Status:** Solutioning

---

## Overview

This batch covers inventory operations on License Plates:
- **LP Split**: Divide an LP into smaller quantities with genealogy tracking
- **LP Merge**: Consolidate multiple LPs of same product/batch
- **LP Genealogy**: Track parent-child relationships for FDA traceability

**Key Concept:** All operations maintain genealogy tree for **complete forward/backward traceability**.

---

## Database Schema

### EXISTING `lp_genealogy` Table (STUB from Epic 2)

**Current schema in database:**
```sql
-- Already exists with these columns:
lp_genealogy (
  id UUID PRIMARY KEY,
  parent_lp_id UUID REFERENCES license_plates(id),
  child_lp_id UUID REFERENCES license_plates(id),
  relationship_type VARCHAR CHECK IN ('split', 'combine', 'transform'),
  work_order_id UUID REFERENCES work_orders(id),
  transfer_order_id UUID REFERENCES transfer_orders(id),
  quantity_from_parent DECIMAL CHECK > 0,
  uom VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ
)
```

### Migration: Add `org_id` and indexes

```sql
-- Add org_id for RLS (if not exists)
ALTER TABLE lp_genealogy
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Backfill org_id from parent LP
UPDATE lp_genealogy g
SET org_id = lp.org_id
FROM license_plates lp
WHERE g.parent_lp_id = lp.id AND g.org_id IS NULL;

-- Make org_id NOT NULL after backfill
ALTER TABLE lp_genealogy ALTER COLUMN org_id SET NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_org ON lp_genealogy(org_id);
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_created ON lp_genealogy(created_at);

-- RLS (if not exists)
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON lp_genealogy;
CREATE POLICY "Enable all for authenticated users"
  ON lp_genealogy FOR ALL TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Constraints (existing):**
- `parent_lp_id != child_lp_id`: No self-links
- Both LPs must belong to same `org_id`
- No circular dependencies (enforced via transaction logic)

**Relationship Types (existing - use these!):**
| Type | Meaning | Use Case |
|------|---------|----------|
| **split** | Original LP → New split LPs | Divide 100 kg into 2x50 kg |
| **combine** | Multiple source LPs → Combined LP | Consolidate 2x50 kg into 100 kg (alias: merge) |
| **transform** | Input LP → Output LP (WO) | Flour LP → Bread LP (production consumption)

---

## API Endpoints

### POST /api/warehouse/license-plates/:id/split

**Purpose:** Split an LP into smaller quantity with new LP number

**Request:**
```json
{
  "split_qty": 50,
  "override_format": "optional custom format",
  "location_id": "new location UUID (optional, defaults to parent LP location)"
}
```

**Response (200):**
```json
{
  "parent_lp_id": "UUID",
  "parent_lp_number": "LP-WH01-20250120-0001",
  "parent_remaining_qty": 50,
  "child_lp_id": "UUID",
  "child_lp_number": "LP-WH01-20250120-0002",
  "child_qty": 50,
  "genealogy_id": "UUID",
  "relationship_type": "split"
}
```

**Validation:**
- `split_qty` must be > 0
- `split_qty` must be < parent_lp.qty
- Parent LP must exist and belong to org_id
- Parent LP status must be 'available' or 'reserved'

---

### POST /api/warehouse/license-plates/merge

**Purpose:** Merge multiple LPs into single consolidated LP

**Request:**
```json
{
  "source_lp_ids": ["UUID1", "UUID2", "UUID3"],
  "target_lp_id": "UUID",
  "operation_note": "Consolidated stock from receiving"
}
```

**Response (200):**
```json
{
  "target_lp_id": "UUID",
  "target_lp_number": "LP-WH01-20250120-0001",
  "total_qty_merged": 150,
  "genealogy_records": [
    { "source_lp": "UUID1", "relationship_type": "combine", "genealogy_id": "UUID" },
    { "source_lp": "UUID2", "relationship_type": "combine", "genealogy_id": "UUID" },
    { "source_lp": "UUID3", "relationship_type": "combine", "genealogy_id": "UUID" }
  ]
}
```

**Validation:**
- All source LPs must exist
- All source LPs must have same `product_id`
- All source LPs must have same `batch_number`
- All source LPs must belong to org_id
- Target LP must exist and belong to org_id
- All source LPs status → 'merged' (immutable)

---

### POST /api/warehouse/license-plates/genealogy/trace

**Purpose:** Forward/backward trace for LP

**Request:**
```json
{
  "lp_id": "UUID",
  "direction": "forward|backward",
  "max_depth": 10
}
```

**Response (200) - Forward Trace:**
```json
{
  "lp_id": "UUID",
  "lp_number": "LP-WH01-20250120-0001",
  "descendants": [
    {
      "lp_id": "UUID",
      "lp_number": "LP-WH01-20250120-0002",
      "relationship_type": "split",
      "quantity_from_parent": 50,
      "depth": 1,
      "created_at": "2025-01-20T10:00:00Z"
    },
    {
      "lp_id": "UUID",
      "lp_number": "LP-WH01-20250120-0003",
      "relationship_type": "transform",
      "work_order_id": "UUID",
      "depth": 2,
      "created_at": "2025-01-20T11:00:00Z"
    }
  ],
  "total_descendants": 2
}
```

**Response (200) - Backward Trace:**
```json
{
  "lp_id": "UUID",
  "lp_number": "LP-WH01-20250120-0001",
  "ancestors": [
    {
      "lp_id": "UUID",
      "lp_number": "LP-WH01-20250120-0000",
      "relationship_type": "combine",
      "quantity_from_parent": 100,
      "depth": 1,
      "created_at": "2025-01-20T08:00:00Z"
    }
  ],
  "total_ancestors": 1
}
```

---

## Frontend Routes & Components

### /warehouse/license-plates/:id (LP Detail Page - Enhanced)

**New Features:**
- **Genealogy Tab**: Shows parent/child relationships
- **Split Button**: Opens split modal
- **Trace Forward/Backward**: Graphical tree view of genealogy

**Components:**
- `SplitLPModal`: Modal for split operation
- `MergeLPsModal`: Modal for merge operation (multi-select)
- `GenealogyTree`: Visual tree of parent-child relationships
- `TraceForwardButton`: Button to trigger forward trace
- `TraceBackwardButton`: Button to trigger backward trace

---

## SQL Queries for Key Operations

### Forward Trace (Descendants)

```sql
WITH RECURSIVE descendants AS (
  SELECT
    child_lp_id,
    operation_type,
    wo_id,
    1 AS depth,
    ARRAY[parent_lp_id, child_lp_id] AS path
  FROM lp_genealogy
  WHERE parent_lp_id = $1 AND org_id = $2

  UNION ALL

  SELECT
    g.child_lp_id,
    g.operation_type,
    g.wo_id,
    d.depth + 1,
    d.path || g.child_lp_id
  FROM lp_genealogy g
  JOIN descendants d ON g.parent_lp_id = d.child_lp_id
  WHERE d.depth < $3 AND g.org_id = $2
)
SELECT
  child_lp_id,
  lp.lp_number,
  operation_type,
  wo_id,
  depth,
  path
FROM descendants d
JOIN license_plates lp ON d.child_lp_id = lp.id
ORDER BY depth, child_lp_id;
```

### Backward Trace (Ancestors)

```sql
WITH RECURSIVE ancestors AS (
  SELECT
    parent_lp_id,
    operation_type,
    wo_id,
    1 AS depth,
    ARRAY[parent_lp_id, child_lp_id] AS path
  FROM lp_genealogy
  WHERE child_lp_id = $1 AND org_id = $2

  UNION ALL

  SELECT
    g.parent_lp_id,
    g.operation_type,
    g.wo_id,
    a.depth + 1,
    g.parent_lp_id || a.path
  FROM lp_genealogy g
  JOIN ancestors a ON g.child_lp_id = a.parent_lp_id
  WHERE a.depth < $3 AND g.org_id = $2
)
SELECT
  parent_lp_id,
  lp.lp_number,
  operation_type,
  wo_id,
  depth,
  path
FROM ancestors a
JOIN license_plates lp ON a.parent_lp_id = lp.id
ORDER BY depth, parent_lp_id;
```

### Circular Dependency Detection

```sql
-- Check if adding parent_lp_id → child_lp_id would create cycle
WITH RECURSIVE ancestors_of_parent AS (
  SELECT parent_lp_id, 1 AS depth
  FROM lp_genealogy WHERE child_lp_id = $1 AND org_id = $2

  UNION ALL

  SELECT g.parent_lp_id, a.depth + 1
  FROM lp_genealogy g
  JOIN ancestors_of_parent a ON g.child_lp_id = a.parent_lp_id
  WHERE a.depth < 10 AND g.org_id = $2
)
SELECT COUNT(*) FROM ancestors_of_parent
WHERE parent_lp_id = $3;  -- If > 0, circular dependency detected
```

---

## Validations & Constraints

### LP Split Validation

1. **Quantity Check**:
   - `split_qty > 0`
   - `split_qty < parent_lp.qty`
   - `parent_lp.qty - split_qty >= 0` (remaining qty valid)

2. **Status Check**:
   - Parent LP status must be 'available' or 'reserved'
   - Cannot split expired LPs

3. **Inheritance**:
   - Child LP inherits: `product_id`, `batch_number`, `supplier_batch_number`, `manufacture_date`, `expiry_date`, `uom`
   - Child LP gets new: `lp_number`, `location_id` (optional override)

### LP Merge Validation

1. **Compatibility Check**:
   - All source LPs must have same `product_id`
   - All source LPs must have same `batch_number`
   - If expiry dates exist, must be same expiry date

2. **Status Update**:
   - All source LPs status → 'merged' (immutable, cannot revert)
   - Target LP status remains 'available'

3. **Qty Update**:
   - Target LP qty += SUM(source_lp_qty)

### LP Genealogy Validation

1. **FK Validation**:
   - `parent_lp_id` must exist in license_plates
   - `child_lp_id` must exist in license_plates
   - `wo_id` must exist in work_orders (if provided)
   - All must belong to same `org_id`

2. **Duplicate Prevention**:
   - `UNIQUE(parent_lp_id, child_lp_id)` prevents duplicate links
   - If duplicate attempt: Silently succeed (idempotent)

3. **Circular Dependency Prevention**:
   - Use recursive CTE to verify child is not ancestor of parent
   - If circular: Rollback with error

---

## RLS Policies (All Tables)

```sql
-- license_plates (already exists in 5A-1)
-- lp_genealogy (new)

ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON lp_genealogy FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable insert for authenticated users"
  ON lp_genealogy FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable update for authenticated users"
  ON lp_genealogy FOR UPDATE
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable delete for authenticated users"
  ON lp_genealogy FOR DELETE
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Dependencies

**Requires:**
- Story 5.1 (License Plate Creation) - LP table exists

**Blocks:**
- Story 5.28 (Forward/Backward Traceability)
- Story 5.29 (Genealogy Recording)
- Story 4.7 (WO Consumption) - uses genealogy for consume/produce

---

## Implementation Notes

- **Gap 2 Alert**: Story 5.7 has complex atomicity requirements for circular dependency checking. Requires careful transaction handling.
- **Performance**: Recursive CTEs can be slow with deep genealogy. Consider denormalization if depth > 10 common.
- **Audit**: All genealogy records immutable (insert-only, no updates/deletes).
- **Idempotency**: Duplicate genealogy insert attempts should succeed (already exists).
