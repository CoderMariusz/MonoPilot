# Locations Hierarchy Database Documentation

**Story:** 01.9 - Warehouse Locations Management
**Version:** 1.0
**Last Updated:** 2025-12-21

## Overview

This document describes the database schema, triggers, and RLS policies for the hierarchical location management system. Locations are organized in a 4-level tree structure (zone > aisle > rack > bin) with auto-computed paths and strict hierarchy validation.

**Migration Files:**
- `061_create_locations_table.sql` - Table structure, enums, triggers
- `062_locations_rls_policies.sql` - Row Level Security policies

**Applied:** 2025-12-20

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Enums](#enums)
3. [Table Structure](#table-structure)
4. [Indexes](#indexes)
5. [Database Triggers](#database-triggers)
6. [RLS Policies](#rls-policies)
7. [Constraints](#constraints)
8. [Performance Considerations](#performance-considerations)

---

## Schema Overview

```sql
-- Hierarchical location structure
locations (id, org_id, warehouse_id, parent_id)
  ├─ Self-referencing parent_id for tree structure
  ├─ Auto-computed full_path (e.g., 'WH-001/ZONE-A/A01/R01/B001')
  ├─ Auto-computed depth (1-4)
  ├─ Level enum (zone, aisle, rack, bin)
  ├─ Type enum (bulk, pallet, shelf, floor, staging)
  └─ Capacity tracking (max/current pallets and weight)
```

**Relationships:**
- `org_id` → `organizations(id)` (multi-tenancy)
- `warehouse_id` → `warehouses(id)` (location belongs to warehouse)
- `parent_id` → `locations(id)` (self-referencing hierarchy)

---

## Enums

### 1. location_level

**Purpose:** Defines hierarchical level in 4-tier structure.

```sql
CREATE TYPE location_level AS ENUM ('zone', 'aisle', 'rack', 'bin');
```

| Value | Description | Depth | Parent Level | Can Have Children |
|-------|-------------|-------|--------------|-------------------|
| `zone` | Top-level storage zone | 1 | None (root) | Yes (aisles) |
| `aisle` | Aisle within zone | 2 | `zone` | Yes (racks) |
| `rack` | Rack within aisle | 3 | `aisle` | Yes (bins) |
| `bin` | Bin within rack (leaf) | 4 | `rack` | No |

**Usage Example:**
```sql
SELECT * FROM locations WHERE level = 'zone';  -- Get all zones
```

---

### 2. location_type

**Purpose:** Classifies storage type for operational use.

```sql
CREATE TYPE location_type AS ENUM (
  'bulk',
  'pallet',
  'shelf',
  'floor',
  'staging'
);
```

| Value | Description | Typical Use |
|-------|-------------|-------------|
| `bulk` | Bulk storage area | Large-capacity floor storage for bulk items |
| `pallet` | Pallet racking | Standard pallet rack systems |
| `shelf` | Shelf storage | Smaller items on shelving units |
| `floor` | Floor marking | Floor-level storage areas (painted zones) |
| `staging` | Staging area | Temporary in/out processing areas |

**Usage Example:**
```sql
SELECT * FROM locations WHERE location_type = 'pallet';  -- Get pallet locations
```

---

## Table Structure

### locations Table

```sql
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES locations(id) ON DELETE RESTRICT,

    -- Basic fields
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Hierarchy fields
    level location_level NOT NULL,
    full_path VARCHAR(500),  -- Auto-computed: WH-001/ZONE-A/A01/R01/B001
    depth INT NOT NULL DEFAULT 1,

    -- Classification
    location_type location_type NOT NULL DEFAULT 'shelf',

    -- Capacity fields
    max_pallets INT,
    max_weight_kg DECIMAL(12,2),
    current_pallets INT DEFAULT 0,
    current_weight_kg DECIMAL(12,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT locations_org_warehouse_code_unique UNIQUE(org_id, warehouse_id, code),
    CONSTRAINT locations_depth_check CHECK(depth BETWEEN 1 AND 4),
    CONSTRAINT locations_max_pallets_check CHECK(max_pallets IS NULL OR max_pallets > 0),
    CONSTRAINT locations_max_weight_check CHECK(max_weight_kg IS NULL OR max_weight_kg > 0),
    CONSTRAINT locations_current_pallets_check CHECK(current_pallets >= 0),
    CONSTRAINT locations_current_weight_check CHECK(current_weight_kg >= 0)
);
```

### Column Descriptions

#### Primary & Foreign Keys

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key (auto-generated) |
| `org_id` | UUID | No | Organization ID (multi-tenancy) |
| `warehouse_id` | UUID | No | Parent warehouse |
| `parent_id` | UUID | Yes | Parent location (null for root zones) |

**ON DELETE Behaviors:**
- `org_id`: CASCADE (delete locations when org deleted)
- `warehouse_id`: CASCADE (delete locations when warehouse deleted)
- `parent_id`: RESTRICT (prevent deleting parent with children)

#### Identity Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `code` | VARCHAR(50) | No | Unique code within warehouse (e.g., "ZONE-A", "A01") |
| `name` | VARCHAR(255) | No | Display name (e.g., "Raw Materials Zone") |
| `description` | TEXT | Yes | Optional long description |

**Validation:**
- Code must be uppercase alphanumeric + hyphens (`^[A-Z0-9-]+$`)
- Code unique per warehouse (constraint: `locations_org_warehouse_code_unique`)

#### Hierarchy Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `level` | location_level | No | Hierarchical level (zone/aisle/rack/bin) |
| `full_path` | VARCHAR(500) | Yes | Auto-computed full path (e.g., "WH-001/ZONE-A/A01/R01/B001") |
| `depth` | INT | No | Auto-computed depth (1-4) |

**Auto-Computed:**
- `full_path` and `depth` are computed by `compute_location_full_path()` trigger
- Trigger fires BEFORE INSERT OR UPDATE

#### Classification Field

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `location_type` | location_type | No | `shelf` | Storage type (bulk/pallet/shelf/floor/staging) |

#### Capacity Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `max_pallets` | INT | Yes | - | Maximum number of pallets (null = unlimited) |
| `max_weight_kg` | DECIMAL(12,2) | Yes | - | Maximum weight in kg (null = unlimited) |
| `current_pallets` | INT | No | 0 | Current number of pallets (denormalized for performance) |
| `current_weight_kg` | DECIMAL(12,2) | No | 0.00 | Current weight in kg (denormalized) |

**Notes:**
- `current_*` fields updated by inventory operations (warehouse module)
- Capacity checks enforced at application level
- Constraints ensure positive values

#### Status & Audit Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `is_active` | BOOLEAN | No | true | Active status (false = disabled) |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |
| `created_by` | UUID | Yes | - | User who created (references users) |
| `updated_by` | UUID | Yes | - | User who last updated |

---

## Indexes

```sql
-- Primary indexes
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse_id ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_locations_level ON locations(level);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);

-- Search index
CREATE INDEX IF NOT EXISTS idx_locations_full_path ON locations(full_path);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_locations_org_warehouse ON locations(org_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_warehouse_active ON locations(org_id, warehouse_id, is_active);
```

### Index Usage

| Index | Purpose | Example Query |
|-------|---------|---------------|
| `idx_locations_org_id` | Multi-tenancy filtering | `WHERE org_id = $1` |
| `idx_locations_warehouse_id` | Warehouse filtering | `WHERE warehouse_id = $1` |
| `idx_locations_parent_id` | Tree traversal | `WHERE parent_id = $1` |
| `idx_locations_level` | Level filtering | `WHERE level = 'zone'` |
| `idx_locations_type` | Type filtering | `WHERE location_type = 'pallet'` |
| `idx_locations_full_path` | Hierarchical search | `WHERE full_path LIKE 'WH-001/ZONE-A/%'` |
| `idx_locations_org_warehouse` | Composite filter | `WHERE org_id = $1 AND warehouse_id = $2` |
| `idx_locations_org_warehouse_active` | Active locations | `WHERE org_id = $1 AND warehouse_id = $2 AND is_active = true` |

### Performance Impact

**Query Performance:**
- Tree queries (parent/child): O(log n) with indexes
- Path-based searches: O(n) with LIKE, but fast with index
- Org isolation: O(1) with composite index

**Write Performance:**
- Triggers add ~2-5ms overhead per insert/update
- Path recalculation is recursive (affects children)

---

## Database Triggers

### 1. compute_location_full_path()

**Purpose:** Auto-computes `full_path` and `depth` based on parent hierarchy.

**Timing:** BEFORE INSERT OR UPDATE OF (parent_id, code)

**Implementation:**

```sql
CREATE OR REPLACE FUNCTION compute_location_full_path()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_path VARCHAR(500);
    v_parent_depth INT;
    v_warehouse_code VARCHAR(20);
BEGIN
    -- If this is a root location (no parent)
    IF NEW.parent_id IS NULL THEN
        -- Get warehouse code
        SELECT code INTO v_warehouse_code
        FROM warehouses
        WHERE id = NEW.warehouse_id;

        -- Set full_path = warehouse_code/location_code
        NEW.full_path := v_warehouse_code || '/' || NEW.code;
        NEW.depth := 1;
    ELSE
        -- Get parent's full_path and depth
        SELECT full_path, depth INTO v_parent_path, v_parent_depth
        FROM locations
        WHERE id = NEW.parent_id;

        -- Set full_path = parent_path/location_code
        NEW.full_path := v_parent_path || '/' || NEW.code;
        NEW.depth := v_parent_depth + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_location_path
BEFORE INSERT OR UPDATE OF parent_id, code ON locations
FOR EACH ROW
EXECUTE FUNCTION compute_location_full_path();
```

**Behavior:**

| Scenario | Input | Output |
|----------|-------|--------|
| Root zone | `parent_id=null, code='ZONE-A', warehouse='WH-001'` | `full_path='WH-001/ZONE-A', depth=1` |
| Aisle | `parent_id=zone_id, code='A01', parent_path='WH-001/ZONE-A'` | `full_path='WH-001/ZONE-A/A01', depth=2` |
| Rack | `parent_id=aisle_id, code='R01', parent_path='WH-001/ZONE-A/A01'` | `full_path='WH-001/ZONE-A/A01/R01', depth=3` |
| Bin | `parent_id=rack_id, code='B001', parent_path='WH-001/ZONE-A/A01/R01'` | `full_path='WH-001/ZONE-A/A01/R01/B001', depth=4` |

**Edge Cases:**
- Warehouse not found: Returns NULL (should fail FK constraint)
- Parent not found: Returns NULL (should fail FK constraint)
- Code change: Recalculates path for current location (children paths NOT auto-updated)

**Performance:** O(1) query (single parent lookup)

---

### 2. validate_location_hierarchy()

**Purpose:** Enforces strict hierarchy rules (zone > aisle > rack > bin).

**Timing:** BEFORE INSERT OR UPDATE OF (parent_id, level)

**Implementation:**

```sql
CREATE OR REPLACE FUNCTION validate_location_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_level location_level;
BEGIN
    -- Root locations (no parent) must be zones
    IF NEW.parent_id IS NULL THEN
        IF NEW.level != 'zone' THEN
            RAISE EXCEPTION 'Root locations must be zones (level=zone)';
        END IF;
        RETURN NEW;
    END IF;

    -- Get parent's level
    SELECT level INTO v_parent_level
    FROM locations
    WHERE id = NEW.parent_id;

    -- Validate parent-child level relationships
    IF v_parent_level = 'zone' THEN
        IF NEW.level != 'aisle' THEN
            RAISE EXCEPTION 'Locations under zones must be aisles (level=aisle)';
        END IF;
    ELSIF v_parent_level = 'aisle' THEN
        IF NEW.level != 'rack' THEN
            RAISE EXCEPTION 'Locations under aisles must be racks (level=rack)';
        END IF;
    ELSIF v_parent_level = 'rack' THEN
        IF NEW.level != 'bin' THEN
            RAISE EXCEPTION 'Locations under racks must be bins (level=bin)';
        END IF;
    ELSIF v_parent_level = 'bin' THEN
        RAISE EXCEPTION 'Bins cannot have child locations';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_location_hierarchy
BEFORE INSERT OR UPDATE OF parent_id, level ON locations
FOR EACH ROW
EXECUTE FUNCTION validate_location_hierarchy();
```

**Validation Rules:**

| Parent Level | Allowed Child Level | Error Message |
|--------------|---------------------|---------------|
| `null` (root) | `zone` only | "Root locations must be zones" |
| `zone` | `aisle` only | "Locations under zones must be aisles" |
| `aisle` | `rack` only | "Locations under aisles must be racks" |
| `rack` | `bin` only | "Locations under racks must be bins" |
| `bin` | **None** | "Bins cannot have child locations" |

**Test Cases:**

```sql
-- PASS: Create zone without parent
INSERT INTO locations (warehouse_id, code, name, level)
VALUES ('wh_001', 'ZONE-A', 'Zone A', 'zone');

-- FAIL: Create aisle without parent
INSERT INTO locations (warehouse_id, code, name, level)
VALUES ('wh_001', 'A01', 'Aisle 01', 'aisle');
-- ERROR: Root locations must be zones

-- PASS: Create aisle under zone
INSERT INTO locations (warehouse_id, parent_id, code, name, level)
VALUES ('wh_001', 'zone_id', 'A01', 'Aisle 01', 'aisle');

-- FAIL: Create bin under zone (skip aisle/rack)
INSERT INTO locations (warehouse_id, parent_id, code, name, level)
VALUES ('wh_001', 'zone_id', 'B001', 'Bin 001', 'bin');
-- ERROR: Locations under zones must be aisles

-- FAIL: Create location under bin
INSERT INTO locations (warehouse_id, parent_id, code, name, level)
VALUES ('wh_001', 'bin_id', 'CHILD', 'Child', 'anything');
-- ERROR: Bins cannot have child locations
```

---

### 3. update_locations_updated_at()

**Purpose:** Auto-updates `updated_at` timestamp on every update.

**Timing:** BEFORE UPDATE

**Implementation:**

```sql
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at_trigger
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();
```

**Behavior:**
- Automatically sets `updated_at = NOW()` on every UPDATE
- Overrides any value provided in UPDATE statement

---

## RLS Policies

**Pattern:** ADR-013 - Users Table Lookup pattern for multi-tenancy

**Enabled:**
```sql
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
```

### 1. locations_select (SELECT Policy)

**Purpose:** Users can read locations within their organization.

```sql
CREATE POLICY locations_select
ON locations
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);
```

**Behavior:**
- Authenticated users can SELECT only locations in their org
- Cross-tenant reads return zero rows (isolation)

**Test:**
```sql
-- User A (org_id = 'org_123') sees only org_123 locations
SELECT * FROM locations;  -- Returns only org_123 locations

-- Cross-tenant query returns empty
SELECT * FROM locations WHERE id = 'location_in_org_456';  -- Returns 0 rows
```

---

### 2. locations_insert (INSERT Policy)

**Purpose:** Users can create locations in their organization's warehouses with parent validation.

```sql
CREATE POLICY locations_insert
ON locations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Location must belong to user's org
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    -- Warehouse must exist and belong to user's org
    AND warehouse_id IN (
        SELECT id FROM warehouses
        WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    -- If parent_id is provided, parent must belong to user's org
    AND (
        parent_id IS NULL
        OR parent_id IN (
            SELECT id FROM locations
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    )
);
```

**Validations:**
1. `org_id` matches user's org
2. `warehouse_id` exists in user's org (prevents cross-tenant warehouse assignment)
3. `parent_id` exists in user's org OR is null (prevents cross-tenant parent assignment)

**Test:**
```sql
-- PASS: Insert location in own org warehouse
INSERT INTO locations (org_id, warehouse_id, code, name, level)
VALUES ('org_123', 'wh_in_org_123', 'ZONE-A', 'Zone A', 'zone');

-- FAIL: Insert location in other org's warehouse
INSERT INTO locations (org_id, warehouse_id, code, name, level)
VALUES ('org_123', 'wh_in_org_456', 'ZONE-A', 'Zone A', 'zone');
-- ERROR: RLS policy violation (warehouse not in org)

-- FAIL: Assign parent from other org
INSERT INTO locations (org_id, warehouse_id, parent_id, code, name, level)
VALUES ('org_123', 'wh_123', 'parent_in_org_456', 'A01', 'Aisle 01', 'aisle');
-- ERROR: RLS policy violation (parent not in org)
```

---

### 3. locations_update (UPDATE Policy)

**Purpose:** Users can update locations within their organization.

```sql
CREATE POLICY locations_update
ON locations
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);
```

**Behavior:**
- Users can UPDATE only locations in their org
- Cross-tenant updates affect zero rows

**Test:**
```sql
-- PASS: Update own org location
UPDATE locations
SET name = 'Updated Name'
WHERE id = 'location_in_org_123';

-- FAIL: Update other org's location
UPDATE locations
SET name = 'Hacked Name'
WHERE id = 'location_in_org_456';
-- Affects 0 rows (filtered by RLS)
```

---

### 4. locations_delete (DELETE Policy)

**Purpose:** Users can delete locations within their organization (subject to FK constraints).

```sql
CREATE POLICY locations_delete
ON locations
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);
```

**Behavior:**
- Users can DELETE only locations in their org
- FK constraint ON DELETE RESTRICT prevents deleting parent with children
- Cross-tenant deletes affect zero rows

**Test:**
```sql
-- PASS: Delete own org location (no children)
DELETE FROM locations WHERE id = 'bin_in_org_123';

-- FAIL: Delete parent with children
DELETE FROM locations WHERE id = 'zone_with_aisles';
-- ERROR: FK constraint violation (ON DELETE RESTRICT)

-- FAIL: Delete other org's location
DELETE FROM locations WHERE id = 'location_in_org_456';
-- Affects 0 rows (filtered by RLS)
```

---

## Constraints

### 1. locations_org_warehouse_code_unique

**Purpose:** Ensure location codes are unique within a warehouse.

```sql
CONSTRAINT locations_org_warehouse_code_unique UNIQUE(org_id, warehouse_id, code)
```

**Behavior:**
- Code can be duplicated across warehouses (WH-001/ZONE-A and WH-002/ZONE-A are OK)
- Code cannot be duplicated within same warehouse

**Test:**
```sql
-- PASS: Same code in different warehouses
INSERT INTO locations (org_id, warehouse_id, code, name, level)
VALUES ('org_123', 'wh_001', 'ZONE-A', 'Zone A', 'zone');

INSERT INTO locations (org_id, warehouse_id, code, name, level)
VALUES ('org_123', 'wh_002', 'ZONE-A', 'Zone A', 'zone');  -- OK

-- FAIL: Same code in same warehouse
INSERT INTO locations (org_id, warehouse_id, code, name, level)
VALUES ('org_123', 'wh_001', 'ZONE-A', 'Duplicate', 'zone');
-- ERROR: duplicate key value violates unique constraint
```

---

### 2. locations_depth_check

**Purpose:** Ensure depth is between 1 and 4 (4-level hierarchy limit).

```sql
CONSTRAINT locations_depth_check CHECK(depth BETWEEN 1 AND 4)
```

**Behavior:**
- Depth auto-set by trigger (should never fail)
- Prevents manual overrides outside range

---

### 3. Capacity Constraints

**Purpose:** Ensure capacity values are positive when set.

```sql
CONSTRAINT locations_max_pallets_check CHECK(max_pallets IS NULL OR max_pallets > 0)
CONSTRAINT locations_max_weight_check CHECK(max_weight_kg IS NULL OR max_weight_kg > 0)
CONSTRAINT locations_current_pallets_check CHECK(current_pallets >= 0)
CONSTRAINT locations_current_weight_check CHECK(current_weight_kg >= 0)
```

**Behavior:**
- `max_*` can be NULL (unlimited) or positive
- `current_*` must be >= 0 (cannot be negative)

---

## Performance Considerations

### Query Optimization

**Recommended Queries:**

```sql
-- Fast: Uses org + warehouse composite index
SELECT * FROM locations
WHERE org_id = $1 AND warehouse_id = $2;

-- Fast: Uses parent_id index
SELECT * FROM locations
WHERE parent_id = $1;

-- Fast: Uses full_path index
SELECT * FROM locations
WHERE full_path LIKE 'WH-001/ZONE-A/%';

-- Slow: Full table scan (avoid)
SELECT * FROM locations
WHERE name ILIKE '%zone%';
```

### Tree Queries

**Get all descendants (efficient):**
```sql
SELECT * FROM locations
WHERE full_path LIKE CONCAT(
    (SELECT full_path FROM locations WHERE id = $1), '/%'
)
ORDER BY depth ASC;
```

**Get ancestors (requires recursive CTE):**
```sql
WITH RECURSIVE ancestors AS (
  SELECT * FROM locations WHERE id = $1
  UNION
  SELECT l.* FROM locations l
  INNER JOIN ancestors a ON l.id = a.parent_id
)
SELECT * FROM ancestors ORDER BY depth ASC;
```

### Write Performance

**Trigger Overhead:**
- `compute_location_full_path()`: ~2-3ms (single SELECT)
- `validate_location_hierarchy()`: ~1-2ms (single SELECT)
- `update_locations_updated_at()`: <1ms (no query)

**Total INSERT overhead:** ~5ms

### Scaling Recommendations

| Locations Count | Strategy |
|-----------------|----------|
| < 1,000 | Default indexes sufficient |
| 1,000 - 10,000 | Add pagination to list API |
| 10,000 - 100,000 | Implement lazy loading for tree view |
| > 100,000 | Consider partitioning by warehouse_id |

---

## Migration Rollback

**To rollback (if needed):**

```sql
-- Drop triggers first
DROP TRIGGER IF EXISTS trg_compute_location_path ON locations;
DROP TRIGGER IF EXISTS trg_validate_location_hierarchy ON locations;
DROP TRIGGER IF EXISTS update_locations_updated_at_trigger ON locations;

-- Drop functions
DROP FUNCTION IF EXISTS compute_location_full_path();
DROP FUNCTION IF EXISTS validate_location_hierarchy();
DROP FUNCTION IF EXISTS update_locations_updated_at();

-- Drop table (WARNING: Deletes all data)
DROP TABLE IF EXISTS locations CASCADE;

-- Drop enums
DROP TYPE IF EXISTS location_level CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;
```

**Note:** Rollback will fail if other tables reference `locations` (future warehouse module).

---

## Testing Queries

### Test Hierarchy Creation

```sql
-- Create full 4-level hierarchy
DO $$
DECLARE
  v_zone_id UUID;
  v_aisle_id UUID;
  v_rack_id UUID;
  v_bin_id UUID;
BEGIN
  -- Create zone
  INSERT INTO locations (org_id, warehouse_id, code, name, level, location_type)
  VALUES ('org_test', 'wh_test', 'TEST-ZONE', 'Test Zone', 'zone', 'bulk')
  RETURNING id INTO v_zone_id;

  -- Create aisle
  INSERT INTO locations (org_id, warehouse_id, parent_id, code, name, level, location_type)
  VALUES ('org_test', 'wh_test', v_zone_id, 'TEST-A01', 'Test Aisle', 'aisle', 'pallet')
  RETURNING id INTO v_aisle_id;

  -- Create rack
  INSERT INTO locations (org_id, warehouse_id, parent_id, code, name, level, location_type)
  VALUES ('org_test', 'wh_test', v_aisle_id, 'TEST-R01', 'Test Rack', 'rack', 'shelf')
  RETURNING id INTO v_rack_id;

  -- Create bin
  INSERT INTO locations (org_id, warehouse_id, parent_id, code, name, level, location_type)
  VALUES ('org_test', 'wh_test', v_rack_id, 'TEST-B001', 'Test Bin', 'bin', 'shelf')
  RETURNING id INTO v_bin_id;

  -- Verify full_path
  RAISE NOTICE 'Bin full_path: %', (SELECT full_path FROM locations WHERE id = v_bin_id);
END $$;
```

### Test Hierarchy Validation

```sql
-- Should succeed: aisle under zone
INSERT INTO locations (org_id, warehouse_id, parent_id, code, name, level)
VALUES ('org_test', 'wh_test', (SELECT id FROM locations WHERE level='zone' LIMIT 1), 'VALID-A01', 'Valid Aisle', 'aisle');

-- Should fail: bin under zone
INSERT INTO locations (org_id, warehouse_id, parent_id, code, name, level)
VALUES ('org_test', 'wh_test', (SELECT id FROM locations WHERE level='zone' LIMIT 1), 'INVALID-B001', 'Invalid Bin', 'bin');
-- Expected error: Locations under zones must be aisles
```

---

## Related Documentation

- **API Reference:** `docs/3-ARCHITECTURE/api/settings/locations.md`
- **Component Docs:** `docs/3-ARCHITECTURE/frontend/components/locations.md`
- **Developer Guide:** `docs/3-ARCHITECTURE/guides/location-hierarchy.md`
- **Story Specification:** `docs/2-MANAGEMENT/epics/current/01-settings/01.9.locations-crud.md`

---

**Document Version:** 1.0
**Story:** 01.9
**Status:** Migration Applied, Production Ready
**Last Updated:** 2025-12-21
