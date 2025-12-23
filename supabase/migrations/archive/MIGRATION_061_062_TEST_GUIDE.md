# Migration 061-062 Test Guide
**Story:** 01.9 - Warehouse Locations Management
**Migrations:** 061_create_locations_table.sql, 062_locations_rls_policies.sql

## Overview
These migrations create the hierarchical locations table with:
- 4-level hierarchy: zone > aisle > rack > bin
- Auto-computed full_path and depth via triggers
- Hierarchical validation triggers
- RLS policies per ADR-013

## Test Scenarios

### 1. Table Creation Test
```sql
-- Verify table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'locations';

-- Verify enums
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'location_level';

SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'location_type';
```

### 2. Trigger Test: compute_location_full_path()
```sql
-- Assume:
--   org_id: '11111111-1111-1111-1111-111111111111'
--   warehouse_id: '22222222-2222-2222-2222-222222222222' (code='WH-001')

-- Insert root zone (parent_id = NULL)
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'ZONE-A',
    'Zone A',
    'zone',
    'bulk'
);

-- Expected Result:
--   full_path: 'WH-001/ZONE-A'
--   depth: 1

-- Verify
SELECT code, level, full_path, depth
FROM locations
WHERE code = 'ZONE-A';
```

### 3. Trigger Test: Hierarchical Path Computation
```sql
-- Insert aisle under zone
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM locations WHERE code = 'ZONE-A'),
    'A01',
    'Aisle 01',
    'aisle',
    'pallet'
);

-- Expected Result:
--   full_path: 'WH-001/ZONE-A/A01'
--   depth: 2

-- Insert rack under aisle
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM locations WHERE code = 'A01'),
    'R01',
    'Rack 01',
    'rack',
    'shelf'
);

-- Expected Result:
--   full_path: 'WH-001/ZONE-A/A01/R01'
--   depth: 3

-- Insert bin under rack
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM locations WHERE code = 'R01'),
    'B001',
    'Bin 001',
    'bin',
    'shelf'
);

-- Expected Result:
--   full_path: 'WH-001/ZONE-A/A01/R01/B001'
--   depth: 4

-- Verify full hierarchy
SELECT code, level, full_path, depth
FROM locations
ORDER BY depth, code;
```

### 4. Trigger Test: validate_location_hierarchy()

#### Test 4a: Root must be zone (PASS)
```sql
-- Already tested above (ZONE-A)
```

#### Test 4b: Root cannot be aisle (FAIL)
```sql
-- This should FAIL with error: "Root locations must be zones"
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'BAD-AISLE',
    'Bad Aisle',
    'aisle',  -- Invalid: root must be zone
    'pallet'
);
-- Expected: ERROR - Root locations must be zones
```

#### Test 4c: Zone children must be aisles (FAIL)
```sql
-- This should FAIL with error: "Locations under zones must be aisles"
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM locations WHERE code = 'ZONE-A'),
    'BAD-RACK',
    'Bad Rack',
    'rack',  -- Invalid: zone children must be aisles
    'shelf'
);
-- Expected: ERROR - Locations under zones must be aisles
```

#### Test 4d: Bins cannot have children (FAIL)
```sql
-- This should FAIL with error: "Bins cannot have child locations"
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM locations WHERE code = 'B001'),
    'BAD-CHILD',
    'Bad Child',
    'bin',  -- Invalid: bins cannot have children
    'shelf'
);
-- Expected: ERROR - Bins cannot have child locations
```

### 5. RLS Policy Test

#### Test 5a: SELECT - Org isolation
```sql
-- Set user context (Org 1)
SET request.jwt.claims.sub = '33333333-3333-3333-3333-333333333333';

-- Should return only locations for user's org
SELECT code, full_path
FROM locations;

-- Expected: Only locations where org_id matches user's org
```

#### Test 5b: INSERT - Warehouse ownership check
```sql
-- Try to insert location for warehouse in different org (should FAIL)
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '99999999-9999-9999-9999-999999999999',  -- Different org
    '88888888-8888-8888-8888-888888888888',  -- Warehouse in different org
    NULL,
    'ZONE-X',
    'Zone X',
    'zone',
    'bulk'
);
-- Expected: RLS policy violation
```

#### Test 5c: INSERT - Parent ownership check
```sql
-- Try to insert location with parent in different org (should FAIL)
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',  -- User's org
    '22222222-2222-2222-2222-222222222222',  -- User's warehouse
    '99999999-9999-9999-9999-999999999999',  -- Parent in different org
    'A02',
    'Aisle 02',
    'aisle',
    'pallet'
);
-- Expected: RLS policy violation
```

### 6. Constraint Tests

#### Test 6a: Unique code per warehouse
```sql
-- Try to insert duplicate code (should FAIL)
INSERT INTO locations (
    org_id, warehouse_id, parent_id,
    code, name, level, location_type
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'ZONE-A',  -- Duplicate
    'Zone A Duplicate',
    'zone',
    'bulk'
);
-- Expected: UNIQUE constraint violation
```

#### Test 6b: Depth check (1-4)
```sql
-- Depth is auto-computed, so manual override should be prevented
-- This is implicitly tested by hierarchical validation
```

#### Test 6c: Capacity checks
```sql
-- Try negative current_pallets (should FAIL)
UPDATE locations
SET current_pallets = -5
WHERE code = 'B001';
-- Expected: CHECK constraint violation

-- Try max_pallets = 0 (should FAIL)
UPDATE locations
SET max_pallets = 0
WHERE code = 'B001';
-- Expected: CHECK constraint violation
```

### 7. CASCADE/RESTRICT Tests

#### Test 7a: Warehouse CASCADE delete
```sql
-- Delete warehouse should CASCADE to locations
DELETE FROM warehouses
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Verify locations deleted
SELECT COUNT(*) FROM locations
WHERE warehouse_id = '22222222-2222-2222-2222-222222222222';
-- Expected: 0 rows
```

#### Test 7b: Parent RESTRICT delete
```sql
-- Try to delete parent with children (should FAIL)
DELETE FROM locations
WHERE code = 'ZONE-A';
-- Expected: FK constraint violation (ON DELETE RESTRICT)

-- Delete must happen bottom-up (bins -> racks -> aisles -> zones)
DELETE FROM locations WHERE code = 'B001';
DELETE FROM locations WHERE code = 'R01';
DELETE FROM locations WHERE code = 'A01';
DELETE FROM locations WHERE code = 'ZONE-A';
-- Expected: All succeed in order
```

## Summary Checklist

- [ ] Table `locations` created with all columns
- [ ] Enum `location_level` created (zone, aisle, rack, bin)
- [ ] Enum `location_type` created (bulk, pallet, shelf, floor, staging)
- [ ] Trigger `compute_location_full_path()` auto-computes full_path and depth
- [ ] Trigger `validate_location_hierarchy()` enforces level rules
- [ ] Trigger `update_locations_updated_at()` auto-updates timestamp
- [ ] RLS policies enforce org isolation (SELECT, INSERT, UPDATE, DELETE)
- [ ] INSERT policy validates warehouse and parent ownership
- [ ] Unique constraint on (org_id, warehouse_id, code)
- [ ] Depth constraint (1-4)
- [ ] Capacity constraints (positive values)
- [ ] Warehouse CASCADE delete works
- [ ] Parent RESTRICT delete works
- [ ] All 8 indexes created

## Notes
- Triggers execute BEFORE INSERT/UPDATE, so full_path/depth are computed before row is inserted
- Hierarchical validation ensures data integrity at database level
- RLS policies provide org isolation at row level
- ON DELETE RESTRICT on parent_id prevents orphaned subtrees
- ON DELETE CASCADE on warehouse_id cleans up locations when warehouse is deleted
