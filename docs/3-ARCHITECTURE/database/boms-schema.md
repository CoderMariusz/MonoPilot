# BOM Database Schema

**Story**: 02.4 - BOMs CRUD + Date Validity
**Migrations**: 037_create_boms_table.sql, 038_create_boms_date_overlap_trigger.sql
**Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Production Ready

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [boms Table](#boms-table)
3. [Constraints & Validations](#constraints--validations)
4. [Indexes](#indexes)
5. [Row-Level Security (RLS)](#row-level-security-rls)
6. [Triggers](#triggers)
7. [RPC Functions](#rpc-functions)
8. [Sample Queries](#sample-queries)

---

## Schema Overview

The BOM module uses two tables:

1. **boms**: Core BOM header with versioning and date validity
2. **bom_items**: Individual line items (managed by other story)

This document focuses on the **boms** table.

---

## boms Table

### Definition

```sql
CREATE TABLE boms (
  -- Core fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1,
  bom_type TEXT DEFAULT 'standard',
  routing_id UUID,

  -- Date validity
  effective_from DATE NOT NULL,
  effective_to DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'phased_out', 'inactive')),

  -- Output
  output_qty DECIMAL(15,6) NOT NULL CHECK (output_qty > 0),
  output_uom TEXT NOT NULL,

  -- Packaging
  units_per_box INTEGER,
  boxes_per_pallet INTEGER,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT uq_boms_org_product_version UNIQUE(org_id, product_id, version)
);
```

### Column Definitions

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `org_id` | UUID | No | - | Organization (foreign key) |
| `product_id` | UUID | No | - | Product (foreign key) |
| `version` | INTEGER | No | 1 | Version number (unique per org_id + product_id) |
| `bom_type` | TEXT | Yes | 'standard' | Type: standard, engineering, costing |
| `routing_id` | UUID | Yes | - | Reference to routing (nullable for future) |
| `effective_from` | DATE | No | - | Start date (inclusive) |
| `effective_to` | DATE | Yes | - | End date (inclusive), NULL = ongoing |
| `status` | TEXT | No | 'draft' | Status: draft, active, phased_out, inactive |
| `output_qty` | DECIMAL(15,6) | No | - | Output quantity per batch |
| `output_uom` | TEXT | No | - | Unit of measure (e.g., 'kg', 'L') |
| `units_per_box` | INTEGER | Yes | - | Packaging: units per box |
| `boxes_per_pallet` | INTEGER | Yes | - | Packaging: boxes per pallet |
| `notes` | TEXT | Yes | - | Optional notes (max 2000 chars) |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |
| `created_by` | UUID | Yes | - | User who created BOM |
| `updated_by` | UUID | Yes | - | User who updated BOM |

---

## Constraints & Validations

### Primary Key

```sql
PRIMARY KEY (id)
```

Ensures each BOM has a unique identifier.

### Foreign Keys

**org_id**:
```sql
REFERENCES organizations(id) ON DELETE CASCADE
```
- Enforces multi-tenant isolation
- If organization deleted, all BOMs cascade deleted

**product_id**:
```sql
REFERENCES products(id) ON DELETE RESTRICT
```
- Prevents deleting a product with BOMs
- Developer must delete BOMs first or use CASCADE (not recommended)

**created_by, updated_by**:
```sql
REFERENCES users(id)
```
- Audit trail references
- Nullable (backward compatibility)

**routing_id**:
```sql
REFERENCES routings(id) ON DELETE SET NULL
```
- Optional routing reference
- Will be implemented in future story

### Unique Constraint

```sql
CONSTRAINT uq_boms_org_product_version
UNIQUE(org_id, product_id, version)
```

Ensures version numbers are unique per organization and product:
- Org A, Product P1: versions 1, 2, 3 allowed
- Org B, Product P1: versions 1, 2 allowed (independent numbering)

### Check Constraints

**Status**:
```sql
CHECK (status IN ('draft', 'active', 'phased_out', 'inactive'))
```

Restricts status to allowed values.

**Output Quantity**:
```sql
CHECK (output_qty > 0)
```

Ensures output quantity is positive (no zero or negative batches).

**Date Range Logic** (enforced by trigger, not constraint):
- `effective_from` must be before `effective_to` (if effective_to is set)
- No overlapping date ranges per product
- Only one BOM can have NULL `effective_to` per product

---

## Indexes

### Index: idx_boms_org_product

```sql
CREATE INDEX idx_boms_org_product ON boms(org_id, product_id);
```

**Purpose**: Multi-tenant isolation, product lookups

**Used By**:
- `listBOMs()` with product_id filter
- `getNextVersion()` finding max version
- Any query filtering by org_id + product_id

**Performance**: Fast lookups for single product's BOMs

### Index: idx_boms_product

```sql
CREATE INDEX idx_boms_product ON boms(product_id);
```

**Purpose**: Product-centric queries

**Used By**:
- `getBOMTimeline()` all versions for product
- Forward/backward traceability queries
- Work order BOM references

### Index: idx_boms_effective

```sql
CREATE INDEX idx_boms_effective ON boms(product_id, effective_from, effective_to);
```

**Purpose**: Date range queries

**Used By**:
- `listBOMs()` with effective_date filter
- Date overlap checking
- "Current BOM" queries (effective_from <= today AND effective_to >= today)

### Index: idx_boms_status

```sql
CREATE INDEX idx_boms_status ON boms(org_id, status);
```

**Purpose**: Status-based queries

**Used By**:
- `listBOMs()` filtering by status
- Active/draft/phased_out counts

### Index: idx_boms_routing_id

```sql
CREATE INDEX idx_boms_routing_id ON boms(routing_id)
WHERE routing_id IS NOT NULL;
```

**Purpose**: Partial index for non-null routing references

**Used By**: Routing-BOM relationship queries

---

## Row-Level Security (RLS)

All RLS policies enforce **ADR-013** multi-tenant isolation pattern.

### Policy: boms_org_isolation_select

```sql
CREATE POLICY boms_org_isolation_select
  ON boms
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Effect**: Users can only SELECT BOMs in their organization

**Logic**:
1. Get current authenticated user ID: `auth.uid()`
2. Look up user's org_id from users table
3. Only allow SELECT if BOM's org_id matches user's org_id

### Policy: boms_org_isolation_insert

```sql
CREATE POLICY boms_org_isolation_insert
  ON boms
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Effect**: Users can only INSERT BOMs into their organization

**Logic**: Same as SELECT but enforces on INSERT

### Policy: boms_org_isolation_update

```sql
CREATE POLICY boms_org_isolation_update
  ON boms
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Effect**: Users can only UPDATE BOMs in their organization

### Policy: boms_org_isolation_delete

```sql
CREATE POLICY boms_org_isolation_delete
  ON boms
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Effect**: Users can only DELETE BOMs in their organization

### Security Implications

- **Cross-Tenant Reads**: Impossible - RLS blocks access
- **Cross-Tenant Writes**: Impossible - RLS blocks INSERT/UPDATE
- **Role-Based Access**: RBAC enforced at API layer (not RLS)
- **Defense in Depth**: Service layer adds explicit org_id filter

---

## Triggers

### Trigger: trigger_check_bom_date_overlap

**Function**: `check_bom_date_overlap()`

**Timing**: BEFORE INSERT OR UPDATE

**Purpose**: Prevent overlapping date ranges and multiple ongoing BOMs

**Logic**:

```sql
CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND daterange(effective_from, effective_to, '[]') &&
          daterange(NEW.effective_from, NEW.effective_to, '[]')
  ) THEN
    RAISE EXCEPTION 'Date range overlaps with existing BOM for this product';
  END IF;

  -- Check for multiple BOMs with NULL effective_to (ongoing)
  IF NEW.effective_to IS NULL AND EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'Only one BOM can have no end date per product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Date Overlap Detection**:

```
daterange(from1, to1, '[]') && daterange(from2, to2, '[]')
```

- `'[]'` = inclusive on both ends
- NULL `to` = infinity (unbounded)
- `&&` = overlap operator

**Examples**:

```
[2025-01-01, 2025-06-30] && [2025-05-01, 2025-08-31] = TRUE (overlap)
[2025-01-01, 2025-06-30] && [2025-07-01, 2025-12-31] = FALSE (no overlap)
[2025-01-01, NULL] && [2025-05-01, 2025-08-31] = TRUE (ongoing overlaps)
[2025-01-01, NULL] && [2025-01-01, NULL] = TRUE (ERROR: multiple ongoing)
```

**Multiple Ongoing Check**:

Only one BOM per product can have `effective_to = NULL`:
- Product A: BOM v1 [2025-01-01, NULL] ✓ OK
- Product A: BOM v2 [2025-01-01, NULL] ✗ ERROR

**Exclusion Logic**:

```sql
id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
```

- During INSERT: NEW.id is NULL, so '00000...' doesn't match any real BOM
- During UPDATE: NEW.id is set, so current BOM is excluded from check
- Allows updating a BOM without it conflicting with itself

### Trigger: trigger_update_boms_updated_at

**Function**: `update_boms_updated_at()`

**Timing**: BEFORE UPDATE

**Purpose**: Auto-update `updated_at` timestamp

**Logic**:

```sql
CREATE OR REPLACE FUNCTION update_boms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Effect**: Every UPDATE automatically sets `updated_at` to current timestamp

---

## RPC Functions

### RPC: check_bom_date_overlap

**Purpose**: Client-side date overlap validation (complements database trigger)

**Called By**: Service layer for early validation feedback

**Parameters**:
```sql
p_product_id UUID
p_effective_from DATE
p_effective_to DATE (nullable)
p_exclude_id UUID (nullable)
p_org_id UUID
```

**Returns**: List of conflicting BOMs (empty if no overlap)

**Signature** (created in migration 040):
```sql
CREATE OR REPLACE FUNCTION check_bom_date_overlap(
  p_product_id UUID,
  p_effective_from DATE,
  p_effective_to DATE,
  p_exclude_id UUID,
  p_org_id UUID
)
RETURNS TABLE (
  id UUID,
  version INTEGER,
  effective_from DATE,
  effective_to DATE
) AS $$
BEGIN
  RETURN QUERY
    SELECT boms.id, boms.version, boms.effective_from, boms.effective_to
    FROM boms
    WHERE org_id = p_org_id
      AND product_id = p_product_id
      AND COALESCE(boms.id::text, '') != COALESCE(p_exclude_id::text, '')
      AND daterange(boms.effective_from, boms.effective_to, '[]') &&
          daterange(p_effective_from, p_effective_to, '[]');
END;
$$ LANGUAGE plpgsql;
```

### RPC: get_bom_timeline

**Purpose**: Fetch all BOM versions for timeline visualization

**Called By**: API timeline endpoint

**Parameters**:
```sql
p_product_id UUID
p_org_id UUID
```

**Returns**: List of BOM versions with metadata

**Features**:
- Sorted by version ascending
- Includes is_currently_active flag (calculated server-side)
- Includes has_overlap flag (calculated server-side)
- Only returns BOMs in user's organization

---

## Sample Queries

### Query 1: List Active BOMs for Product

```sql
SELECT
  id,
  version,
  effective_from,
  effective_to,
  output_qty,
  output_uom,
  status
FROM boms
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND product_id = '650e8400-e29b-41d4-a716-446655440001'
  AND status = 'active'
  AND effective_from <= CURRENT_DATE
  AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
ORDER BY effective_from DESC;
```

### Query 2: Find Current BOM for Product

```sql
SELECT id, version, effective_from, effective_to
FROM boms
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND product_id = '650e8400-e29b-41d4-a716-446655440001'
  AND effective_from <= CURRENT_DATE
  AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
LIMIT 1;
```

### Query 3: Check for Overlapping BOMs

```sql
SELECT id, version, effective_from, effective_to
FROM boms
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND product_id = '650e8400-e29b-41d4-a716-446655440001'
  AND daterange(effective_from, effective_to, '[]') &&
      daterange('2025-01-01'::DATE, '2025-06-30'::DATE, '[]');
```

### Query 4: Count BOMs by Status

```sql
SELECT
  status,
  COUNT(*) as count
FROM boms
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
GROUP BY status;
```

### Query 5: Get Next Version for Product

```sql
SELECT COALESCE(MAX(version), 0) + 1 as next_version
FROM boms
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND product_id = '650e8400-e29b-41d4-a716-446655440001';
```

### Query 6: Find Gaps in BOM Coverage

```sql
WITH sorted_boms AS (
  SELECT
    id,
    version,
    effective_from,
    effective_to,
    LEAD(effective_from) OVER (ORDER BY effective_from) as next_from
  FROM boms
  WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
    AND product_id = '650e8400-e29b-41d4-a716-446655440001'
)
SELECT
  version,
  effective_to,
  next_from,
  (next_from - effective_to) as gap_days
FROM sorted_boms
WHERE effective_to IS NOT NULL
  AND next_from IS NOT NULL
  AND (next_from - effective_to) > 1
ORDER BY version;
```

---

## Performance Tuning

### Index Selection

When adding WHERE clauses, ensure queries use indexes:

**Good** (uses idx_boms_org_product):
```sql
SELECT * FROM boms WHERE org_id = '...' AND product_id = '...';
```

**Better** (uses idx_boms_effective):
```sql
SELECT * FROM boms
WHERE product_id = '...'
  AND effective_from <= '2025-12-26'
  AND (effective_to IS NULL OR effective_to >= '2025-12-26');
```

### Query Plans

Check execution plans:

```sql
EXPLAIN ANALYZE
SELECT * FROM boms
WHERE org_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'active';
-- Should use idx_boms_status
```

### Pagination Best Practices

For listing with LIMIT/OFFSET:

```sql
SELECT * FROM boms
WHERE org_id = '...'
ORDER BY effective_from DESC
LIMIT 50
OFFSET 0;
```

- Uses OFFSET 0 for first page (efficient)
- Use keyset pagination for large datasets: `WHERE effective_from < ?`

---

## Maintenance

### Vacuuming

PostgreSQL automatically vacuums boms table. Manual vacuum if needed:

```sql
VACUUM ANALYZE boms;
```

### Checking Constraint Violations

```sql
-- Find BOMs with invalid dates (shouldn't exist with trigger)
SELECT id, version, effective_from, effective_to
FROM boms
WHERE effective_to IS NOT NULL
  AND effective_to < effective_from;

-- Find multiple ongoing BOMs (shouldn't exist with trigger)
SELECT org_id, product_id, COUNT(*) as ongoing_count
FROM boms
WHERE effective_to IS NULL
GROUP BY org_id, product_id
HAVING COUNT(*) > 1;
```

---

## Migration History

| Migration | Date | Changes |
|-----------|------|---------|
| 037 | 2025-12-24 | Create boms table with indexes and RLS |
| 038 | 2025-12-24 | Add date overlap trigger and timestamp auto-update |
| 040 | 2025-12-24 | Create check_bom_date_overlap() and get_bom_timeline() RPC functions |

---

## Related Documentation

- API Documentation: `docs/3-ARCHITECTURE/api/technical/boms.md`
- Service Documentation: `docs/3-ARCHITECTURE/services/bom-service.md`
- Component Documentation: `docs/3-ARCHITECTURE/components/bom-version-timeline.md`
- ADR-013 (RLS Pattern): `docs/3-ARCHITECTURE/decisions/ADR-013-rls-org-isolation-pattern.md`
- User Guide: `docs/4-USER-GUIDES/technical/bom-management.md`
