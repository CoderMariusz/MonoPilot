# Machines Database Documentation

**Story**: 01.10 - Machines CRUD
**Module**: Settings
**Migrations**: 072, 073
**Version**: 1.0.0
**Last Updated**: 2025-12-22

---

## Table of Contents

1. [Overview](#overview)
2. [Table Schema](#table-schema)
3. [Enums](#enums)
4. [Indexes](#indexes)
5. [Constraints](#constraints)
6. [Triggers](#triggers)
7. [RLS Policies](#rls-policies)
8. [Migration Details](#migration-details)
9. [Query Examples](#query-examples)
10. [Performance Considerations](#performance-considerations)

---

## Overview

The `machines` table stores production machine master data with type classification, operational status tracking, capacity metrics, and optional location assignment. Designed for multi-tenant SaaS with org-level isolation via RLS.

**Key Features**:
- 9 machine types with distinct classifications
- 4 operational statuses for availability tracking
- Capacity tracking (units/hour, setup time, batch size)
- Optional location assignment (FK to locations table)
- Soft delete with audit trail preservation
- Auto-updated timestamp trigger
- Row-level security for org isolation

**Migration Files**:
- `072_create_machines_table.sql` - Table, enums, indexes, triggers
- `073_machines_rls_policies.sql` - Row-level security policies

---

## Table Schema

### machines

**Description**: Production machine master data with type, status, capacity, and location

```sql
CREATE TABLE machines (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Multi-tenancy
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Identification
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Classification
    type machine_type NOT NULL DEFAULT 'OTHER',
    status machine_status NOT NULL DEFAULT 'ACTIVE',

    -- Capacity Fields (all optional)
    units_per_hour INTEGER,
    setup_time_minutes INTEGER,
    max_batch_size INTEGER,

    -- Location Assignment (optional)
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    -- Soft Delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

### Column Details

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `org_id` | UUID | No | - | Organization ID (multi-tenant isolation) |
| `code` | VARCHAR(50) | No | - | Unique machine identifier (uppercase alphanumeric + hyphens) |
| `name` | VARCHAR(100) | No | - | Human-readable machine name |
| `description` | TEXT | Yes | NULL | Additional details (max 500 chars enforced by app) |
| `type` | machine_type | No | 'OTHER' | Machine type classification (9 types) |
| `status` | machine_status | No | 'ACTIVE' | Operational status (4 statuses) |
| `units_per_hour` | INTEGER | Yes | NULL | Production rate (units per hour, > 0) |
| `setup_time_minutes` | INTEGER | Yes | NULL | Setup/changeover time in minutes (>= 0) |
| `max_batch_size` | INTEGER | Yes | NULL | Maximum batch size (> 0) |
| `location_id` | UUID | Yes | NULL | Physical location assignment (FK to locations) |
| `is_deleted` | BOOLEAN | No | false | Soft delete flag |
| `deleted_at` | TIMESTAMPTZ | Yes | NULL | Timestamp when deleted |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |
| `created_by` | UUID | Yes | NULL | User who created (FK to users) |
| `updated_by` | UUID | Yes | NULL | User who last updated (FK to users) |

---

## Enums

### machine_type

9 production machine types with distinct classifications:

```sql
CREATE TYPE machine_type AS ENUM (
    'MIXER',       -- Mixing equipment
    'OVEN',        -- Baking/heating equipment
    'FILLER',      -- Filling/packaging machines
    'PACKAGING',   -- Packaging equipment
    'CONVEYOR',    -- Conveyor systems
    'BLENDER',     -- Blending equipment
    'CUTTER',      -- Cutting/slicing machines
    'LABELER',     -- Labeling equipment
    'OTHER'        -- Other equipment types
);
```

**Usage**:
```sql
SELECT * FROM machines WHERE type = 'MIXER';
```

**Badge Colors** (defined in frontend):
- MIXER: Blue
- OVEN: Orange
- FILLER: Purple
- PACKAGING: Green
- CONVEYOR: Gray
- BLENDER: Cyan
- CUTTER: Red
- LABELER: Yellow
- OTHER: Slate

---

### machine_status

4 operational statuses for tracking machine availability:

```sql
CREATE TYPE machine_status AS ENUM (
    'ACTIVE',          -- Operational and available
    'MAINTENANCE',     -- Under maintenance
    'OFFLINE',         -- Temporarily offline
    'DECOMMISSIONED'   -- Permanently decommissioned
);
```

**Usage**:
```sql
-- Get all active machines
SELECT * FROM machines WHERE status = 'ACTIVE' AND is_deleted = false;

-- Count machines by status
SELECT status, COUNT(*) FROM machines GROUP BY status;
```

**Status Workflow** (recommended):
- `ACTIVE` → `MAINTENANCE` (scheduled maintenance)
- `MAINTENANCE` → `ACTIVE` (maintenance complete)
- `ACTIVE` → `OFFLINE` (unexpected downtime)
- `OFFLINE` → `ACTIVE` (repaired)
- Any → `DECOMMISSIONED` (permanent removal)

---

## Indexes

### Performance Indexes

```sql
-- Org isolation (most common filter)
CREATE INDEX idx_machines_org_id ON machines(org_id);

-- Type filter
CREATE INDEX idx_machines_type ON machines(type);

-- Status filter
CREATE INDEX idx_machines_status ON machines(status);

-- Location joins
CREATE INDEX idx_machines_location ON machines(location_id);

-- Code uniqueness and search
CREATE INDEX idx_machines_org_code ON machines(org_id, code);

-- Soft delete filtering (list queries)
CREATE INDEX idx_machines_org_not_deleted ON machines(org_id, is_deleted);
```

### Index Usage

**Queries that benefit from indexes**:

```sql
-- Uses idx_machines_org_not_deleted
SELECT * FROM machines WHERE org_id = 'org-uuid' AND is_deleted = false;

-- Uses idx_machines_org_code (unique lookup)
SELECT * FROM machines WHERE org_id = 'org-uuid' AND code = 'MIX-001';

-- Uses idx_machines_org_id + idx_machines_type
SELECT * FROM machines WHERE org_id = 'org-uuid' AND type = 'MIXER';

-- Uses idx_machines_location
SELECT * FROM machines WHERE location_id = 'loc-uuid';
```

### Index Performance

| Query Pattern | Index Used | Est. Rows Scanned | Performance |
|---------------|------------|-------------------|-------------|
| List by org | `idx_machines_org_not_deleted` | ~50-100 | Excellent |
| Search by code | `idx_machines_org_code` | 1 | Excellent |
| Filter by type | `idx_machines_type` + org filter | ~10-20 | Good |
| Filter by status | `idx_machines_status` + org filter | ~30-50 | Good |
| Join with location | `idx_machines_location` | Varies | Good |

---

## Constraints

### Primary Key

```sql
CONSTRAINT machines_pkey PRIMARY KEY (id)
```

### Foreign Keys

```sql
-- Organization (cascade delete)
CONSTRAINT machines_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES organizations(id) ON DELETE CASCADE

-- Location (set null on delete)
CONSTRAINT machines_location_id_fkey FOREIGN KEY (location_id)
    REFERENCES locations(id) ON DELETE SET NULL

-- Audit users
CONSTRAINT machines_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES users(id)

CONSTRAINT machines_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES users(id)
```

**FK Behavior**:
- Organization deleted → All machines deleted
- Location deleted → Machine location set to NULL
- User deleted → created_by/updated_by remain (orphaned, but preserved for audit)

---

### Unique Constraints

```sql
-- Code must be unique within organization
CONSTRAINT machines_org_code_unique UNIQUE (org_id, code)
```

**Enforcement**:
- Same code can exist in different organizations
- Duplicate code in same org throws error (23505)
- Case-insensitive (code auto-uppercased by application)

**Test**:
```sql
-- OK: Different orgs
INSERT INTO machines (org_id, code, name, type) VALUES ('org1', 'MIX-001', 'Mixer', 'MIXER');
INSERT INTO machines (org_id, code, name, type) VALUES ('org2', 'MIX-001', 'Mixer', 'MIXER');

-- ERROR: Same org, duplicate code
INSERT INTO machines (org_id, code, name, type) VALUES ('org1', 'MIX-001', 'Mixer 2', 'MIXER');
-- ERROR:  duplicate key value violates unique constraint "machines_org_code_unique"
```

---

### Check Constraints

#### Code Format

```sql
CONSTRAINT machines_code_format CHECK (code ~ '^[A-Z0-9-]+$')
```

Ensures code contains only uppercase alphanumeric characters and hyphens.

**Valid**:
- `MIX-001`
- `OVEN-A12`
- `PKG-LINE1`
- `CONVEYOR-02`

**Invalid**:
- `mix-001` (lowercase)
- `MIX_001` (underscore)
- `MIX 001` (space)
- `MIX.001` (period)

---

#### Code Length

```sql
CONSTRAINT machines_code_length CHECK (char_length(code) <= 50)
```

Redundant with `VARCHAR(50)`, but explicit for documentation.

---

#### Capacity Constraints

```sql
-- Units per hour must be positive
CONSTRAINT machines_units_per_hour_check
    CHECK (units_per_hour IS NULL OR units_per_hour > 0)

-- Setup time must be non-negative
CONSTRAINT machines_setup_time_check
    CHECK (setup_time_minutes IS NULL OR setup_time_minutes >= 0)

-- Max batch size must be positive
CONSTRAINT machines_max_batch_size_check
    CHECK (max_batch_size IS NULL OR max_batch_size > 0)
```

**Examples**:
```sql
-- OK
INSERT INTO machines (..., units_per_hour = 500, setup_time_minutes = 30);
INSERT INTO machines (..., units_per_hour = NULL);  -- Optional field
INSERT INTO machines (..., setup_time_minutes = 0);  -- Zero setup time allowed

-- ERROR
INSERT INTO machines (..., units_per_hour = 0);      -- Must be > 0
INSERT INTO machines (..., units_per_hour = -100);   -- Must be positive
INSERT INTO machines (..., setup_time_minutes = -5); -- Must be >= 0
```

---

## Triggers

### update_machines_updated_at()

**Purpose**: Automatically update `updated_at` timestamp on every UPDATE

**Trigger**:
```sql
CREATE TRIGGER update_machines_updated_at_trigger
BEFORE UPDATE ON machines
FOR EACH ROW
EXECUTE FUNCTION update_machines_updated_at();
```

**Function**:
```sql
CREATE OR REPLACE FUNCTION update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Behavior**:
```sql
-- Before update
SELECT updated_at FROM machines WHERE id = 'machine-uuid';
-- 2025-12-22 10:00:00

-- Update machine
UPDATE machines SET name = 'New Name' WHERE id = 'machine-uuid';

-- After update (automatic)
SELECT updated_at FROM machines WHERE id = 'machine-uuid';
-- 2025-12-22 15:30:45  (automatically updated)
```

**Test**:
```sql
-- Create machine
INSERT INTO machines (org_id, code, name, type, created_by, updated_by)
VALUES ('org-uuid', 'TEST-001', 'Test Machine', 'OTHER', 'user-uuid', 'user-uuid')
RETURNING id, created_at, updated_at;

-- Wait a moment, then update
SELECT pg_sleep(2);

UPDATE machines
SET name = 'Updated Name'
WHERE code = 'TEST-001';

-- Verify updated_at changed
SELECT created_at, updated_at
FROM machines
WHERE code = 'TEST-001';
-- created_at and updated_at should be different
```

---

## RLS Policies

Row-Level Security ensures org-level isolation and role-based access control.

### Enable RLS

```sql
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
```

---

### SELECT Policy

**Policy**: `machines_select`

**Description**: All authenticated users can read non-deleted machines within their organization

```sql
CREATE POLICY machines_select
ON machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);
```

**Behavior**:
- Users can only see machines in their organization
- Soft-deleted machines excluded
- Cross-tenant access returns empty result (not 403)

**Test**:
```sql
-- As User A (org1)
SELECT * FROM machines;
-- Returns only org1 machines

-- As User B (org2)
SELECT * FROM machines;
-- Returns only org2 machines (User A's machines invisible)
```

---

### INSERT Policy

**Policy**: `machines_insert`

**Description**: Only admins and production managers can create machines

```sql
CREATE POLICY machines_insert
ON machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);
```

**Allowed Roles**:
- `SUPER_ADMIN`
- `ADMIN`
- `PROD_MANAGER`

**Denied Roles**:
- `WAREHOUSE_MANAGER`
- `VIEWER`
- Any other role

**Behavior**:
```sql
-- As ADMIN user
INSERT INTO machines (org_id, code, name, type) VALUES (...);
-- Success

-- As VIEWER user
INSERT INTO machines (org_id, code, name, type) VALUES (...);
-- ERROR: new row violates row-level security policy for table "machines"
```

---

### UPDATE Policy

**Policy**: `machines_update`

**Description**: Only admins and production managers can update machines

```sql
CREATE POLICY machines_update
ON machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);
```

**Same roles as INSERT policy**

**Test**:
```sql
-- As PROD_MANAGER user
UPDATE machines SET name = 'New Name' WHERE id = 'machine-uuid';
-- Success

-- As WAREHOUSE_MANAGER user
UPDATE machines SET name = 'New Name' WHERE id = 'machine-uuid';
-- ERROR: (no rows updated due to RLS)
```

---

### DELETE Policy

**Policy**: `machines_delete`

**Description**: Only super admins and admins can delete machines (NOT production managers)

```sql
CREATE POLICY machines_delete
ON machines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);
```

**Allowed Roles**:
- `SUPER_ADMIN`
- `ADMIN`

**Denied Roles**:
- `PROD_MANAGER` (can create/update but NOT delete)
- `WAREHOUSE_MANAGER`
- `VIEWER`

**Note**: Application uses soft delete (`UPDATE is_deleted = true`), not hard delete. This policy applies to hard deletes only.

---

## Migration Details

### Migration 072: Create Machines Table

**File**: `supabase/migrations/072_create_machines_table.sql`

**Actions**:
1. Create `machine_type` enum (9 types)
2. Create `machine_status` enum (4 statuses)
3. Create `machines` table
4. Create indexes (6 total)
5. Create `update_machines_updated_at()` trigger function
6. Attach trigger to machines table
7. Add table/column comments

**Rollback**:
```sql
-- Drop in reverse order
DROP TRIGGER IF EXISTS update_machines_updated_at_trigger ON machines;
DROP FUNCTION IF EXISTS update_machines_updated_at();
DROP TABLE IF EXISTS machines CASCADE;
DROP TYPE IF EXISTS machine_status;
DROP TYPE IF EXISTS machine_type;
```

---

### Migration 073: Machines RLS Policies

**File**: `supabase/migrations/073_machines_rls_policies.sql`

**Actions**:
1. Enable RLS on machines table
2. Create SELECT policy (all authenticated users, org-scoped)
3. Create INSERT policy (ADMIN, PROD_MANAGER only)
4. Create UPDATE policy (ADMIN, PROD_MANAGER only)
5. CREATE DELETE policy (ADMIN only, not PROD_MANAGER)
6. Add policy comments

**Rollback**:
```sql
DROP POLICY IF EXISTS machines_delete ON machines;
DROP POLICY IF EXISTS machines_update ON machines;
DROP POLICY IF EXISTS machines_insert ON machines;
DROP POLICY IF EXISTS machines_select ON machines;
ALTER TABLE machines DISABLE ROW LEVEL SECURITY;
```

---

## Query Examples

### Basic CRUD

```sql
-- Create machine
INSERT INTO machines (org_id, code, name, description, type, status, units_per_hour, created_by, updated_by)
VALUES (
    'org-uuid',
    'MIX-001',
    'Industrial Mixer A1',
    'High-capacity mixer for dry ingredients',
    'MIXER',
    'ACTIVE',
    500,
    'user-uuid',
    'user-uuid'
)
RETURNING *;

-- Read machine with location
SELECT
    m.*,
    l.code AS location_code,
    l.name AS location_name,
    l.full_path AS location_path
FROM machines m
LEFT JOIN locations l ON m.location_id = l.id
WHERE m.id = 'machine-uuid'
  AND m.is_deleted = false;

-- Update machine
UPDATE machines
SET name = 'Updated Mixer Name',
    units_per_hour = 600,
    updated_by = 'user-uuid'
WHERE id = 'machine-uuid'
  AND org_id = 'org-uuid'
RETURNING *;

-- Soft delete
UPDATE machines
SET is_deleted = true,
    deleted_at = NOW(),
    updated_by = 'user-uuid'
WHERE id = 'machine-uuid';
```

---

### List with Filters

```sql
-- List all active mixers
SELECT *
FROM machines
WHERE org_id = 'org-uuid'
  AND type = 'MIXER'
  AND status = 'ACTIVE'
  AND is_deleted = false
ORDER BY code ASC;

-- Search by code or name
SELECT *
FROM machines
WHERE org_id = 'org-uuid'
  AND (code ILIKE '%mixer%' OR name ILIKE '%mixer%')
  AND is_deleted = false
ORDER BY code ASC;

-- Paginated list (page 2, 25 per page)
SELECT *
FROM machines
WHERE org_id = 'org-uuid'
  AND is_deleted = false
ORDER BY code ASC
LIMIT 25 OFFSET 25;
```

---

### Aggregations

```sql
-- Count machines by type
SELECT type, COUNT(*) AS count
FROM machines
WHERE org_id = 'org-uuid'
  AND is_deleted = false
GROUP BY type
ORDER BY count DESC;

-- Count machines by status
SELECT status, COUNT(*) AS count
FROM machines
WHERE org_id = 'org-uuid'
  AND is_deleted = false
GROUP BY status;

-- Average capacity by type
SELECT
    type,
    AVG(units_per_hour) AS avg_units_per_hour,
    AVG(setup_time_minutes) AS avg_setup_time,
    COUNT(*) AS machine_count
FROM machines
WHERE org_id = 'org-uuid'
  AND is_deleted = false
  AND units_per_hour IS NOT NULL
GROUP BY type
ORDER BY avg_units_per_hour DESC;
```

---

### Complex Queries

```sql
-- Machines without location assignment
SELECT code, name, type
FROM machines
WHERE org_id = 'org-uuid'
  AND location_id IS NULL
  AND is_deleted = false
ORDER BY code;

-- Machines by warehouse (join through locations)
SELECT
    m.code,
    m.name,
    l.full_path AS location,
    w.code AS warehouse_code,
    w.name AS warehouse_name
FROM machines m
LEFT JOIN locations l ON m.location_id = l.id
LEFT JOIN warehouses w ON l.warehouse_id = w.id
WHERE m.org_id = 'org-uuid'
  AND m.is_deleted = false
ORDER BY w.code, l.full_path;

-- Recently updated machines
SELECT code, name, updated_at, updated_by
FROM machines
WHERE org_id = 'org-uuid'
  AND is_deleted = false
  AND updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

---

## Performance Considerations

### Query Optimization

**Use indexes effectively**:
```sql
-- Good: Uses idx_machines_org_not_deleted
SELECT * FROM machines WHERE org_id = ? AND is_deleted = false;

-- Bad: Full table scan
SELECT * FROM machines WHERE LOWER(code) = 'mix-001';
-- Better: Use uppercase code
SELECT * FROM machines WHERE code = 'MIX-001';
```

**Avoid N+1 queries**:
```sql
-- Bad: N+1 query (1 query + N queries for locations)
-- In application code: foreach machine, fetch location

-- Good: Single query with join
SELECT m.*, l.code, l.name, l.full_path
FROM machines m
LEFT JOIN locations l ON m.location_id = l.id
WHERE m.org_id = ?;
```

---

### Index Maintenance

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'machines'
ORDER BY idx_scan DESC;

-- Rebuild indexes if needed (rarely necessary)
REINDEX TABLE machines;
```

---

### Statistics

```sql
-- Update statistics for query planner
ANALYZE machines;

-- View table statistics
SELECT * FROM pg_stats WHERE tablename = 'machines';
```

---

### Expected Scale

| Metric | Small Org | Medium Org | Large Org |
|--------|-----------|------------|-----------|
| Machines | 10-50 | 50-200 | 200-1000 |
| Rows per page | 25 | 25 | 50-100 |
| Avg query time | <50ms | <100ms | <300ms |
| Index size | <1 MB | 1-5 MB | 5-20 MB |

---

## Related Documentation

- [Machines API Documentation](../../api/settings/machines.md)
- [Machine Component Documentation](../../frontend/components/machines.md)
- [Machine Developer Guide](../../guides/machine-management.md)
- [Story 01.10 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.10.machines-crud.md)

---

**Document Version**: 1.0.0
**Story**: 01.10
**Status**: Complete
**Last Updated**: 2025-12-22
