/**
 * Database Trigger Tests: Location Hierarchy & Path Computation
 * Story: 01.9 - Locations CRUD (Hierarchical)
 * Phase: RED - All tests should FAIL (triggers not implemented yet)
 *
 * Tests database-level validation and computed columns:
 * - compute_location_full_path() trigger
 * - validate_location_hierarchy() trigger
 * - Level hierarchy enforcement (zone > aisle > rack > bin)
 * - Depth calculation
 * - Full path generation
 *
 * Coverage Target: 100% (database triggers are critical)
 * Test Count: 20+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: Zone creation with full_path computation
 * - AC-02: Aisle under zone with path inheritance
 * - AC-03: Hierarchy validation (bins under racks only)
 * - AC-09: Unique code per warehouse
 */

BEGIN;

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test organization
INSERT INTO organizations (id, name, slug, timezone, locale, currency, onboarding_step, is_active)
VALUES ('org-test-001', 'Test Org', 'test-org', 'UTC', 'en', 'PLN', 5, true);

-- Create test warehouse
INSERT INTO warehouses (id, org_id, code, name, type, is_active)
VALUES
  ('wh-test-001', 'org-test-001', 'WH-001', 'Main Warehouse', 'GENERAL', true),
  ('wh-test-002', 'org-test-001', 'WH-002', 'Secondary Warehouse', 'RAW_MATERIALS', true);

-- ============================================================================
-- TEST 1: AC-01 - Zone Creation with Full Path Computation
-- ============================================================================

-- Test: Root location (zone) computes full_path = warehouse_code/code
INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-zone-a', 'org-test-001', 'wh-test-001', NULL,
  'ZONE-A', 'Raw Materials Zone', 'zone', 'bulk'
);

SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A' AND depth = 1 THEN 'PASS: Zone full_path computed correctly'
    ELSE 'FAIL: Zone full_path = ' || COALESCE(full_path, 'NULL') || ', depth = ' || depth
  END AS test_result
FROM locations
WHERE id = 'loc-zone-a';

-- Expected: full_path = 'WH-001/ZONE-A', depth = 1

-- ============================================================================
-- TEST 2: AC-02 - Aisle Under Zone with Path Inheritance
-- ============================================================================

-- Test: Child location inherits parent path
INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-aisle-a01', 'org-test-001', 'wh-test-001', 'loc-zone-a',
  'A01', 'Aisle 01', 'aisle', 'pallet'
);

SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A/A01' AND depth = 2 THEN 'PASS: Aisle full_path inherited from zone'
    ELSE 'FAIL: Aisle full_path = ' || COALESCE(full_path, 'NULL') || ', depth = ' || depth
  END AS test_result
FROM locations
WHERE id = 'loc-aisle-a01';

-- Expected: full_path = 'WH-001/ZONE-A/A01', depth = 2

-- ============================================================================
-- TEST 3: Rack Under Aisle with Path Computation
-- ============================================================================

INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-rack-r01', 'org-test-001', 'wh-test-001', 'loc-aisle-a01',
  'R01', 'Rack 01', 'rack', 'shelf'
);

SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A/A01/R01' AND depth = 3 THEN 'PASS: Rack full_path computed correctly'
    ELSE 'FAIL: Rack full_path = ' || COALESCE(full_path, 'NULL') || ', depth = ' || depth
  END AS test_result
FROM locations
WHERE id = 'loc-rack-r01';

-- Expected: full_path = 'WH-001/ZONE-A/A01/R01', depth = 3

-- ============================================================================
-- TEST 4: Bin Under Rack (4-Level Hierarchy Complete)
-- ============================================================================

INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-bin-b001', 'org-test-001', 'wh-test-001', 'loc-rack-r01',
  'B001', 'Bin 001', 'bin', 'shelf'
);

SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A/A01/R01/B001' AND depth = 4 THEN 'PASS: Bin full_path computed correctly (4 levels)'
    ELSE 'FAIL: Bin full_path = ' || COALESCE(full_path, 'NULL') || ', depth = ' || depth
  END AS test_result
FROM locations
WHERE id = 'loc-bin-b001';

-- Expected: full_path = 'WH-001/ZONE-A/A01/R01/B001', depth = 4

-- ============================================================================
-- TEST 5: AC-03 - Hierarchy Validation: Bins Must Be Under Racks
-- ============================================================================

-- Test: Attempt to create bin directly under aisle (should fail)
DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-invalid-bin', 'org-test-001', 'wh-test-001', 'loc-aisle-a01',
    'B999', 'Invalid Bin', 'bin', 'shelf'
  );

  RAISE EXCEPTION 'FAIL: Bin under aisle was allowed (should be rejected)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Locations under aisles must be racks%' THEN
      RAISE NOTICE 'PASS: Bin under aisle correctly rejected';
    ELSE
      RAISE EXCEPTION 'FAIL: Wrong error message: %', SQLERRM;
    END IF;
END $$;

-- Expected: Exception raised with message 'Locations under aisles must be racks'

-- ============================================================================
-- TEST 6: Hierarchy Validation: Zones Cannot Have Bins
-- ============================================================================

DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-invalid-bin2', 'org-test-001', 'wh-test-001', 'loc-zone-a',
    'B998', 'Invalid Bin Under Zone', 'bin', 'shelf'
  );

  RAISE EXCEPTION 'FAIL: Bin under zone was allowed (should be rejected)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Locations under zones must be aisles%' THEN
      RAISE NOTICE 'PASS: Bin under zone correctly rejected';
    ELSE
      RAISE EXCEPTION 'FAIL: Wrong error message: %', SQLERRM;
    END IF;
END $$;

-- ============================================================================
-- TEST 7: Hierarchy Validation: Zones Cannot Have Racks
-- ============================================================================

DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-invalid-rack', 'org-test-001', 'wh-test-001', 'loc-zone-a',
    'R999', 'Invalid Rack Under Zone', 'rack', 'shelf'
  );

  RAISE EXCEPTION 'FAIL: Rack under zone was allowed (should be rejected)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Locations under zones must be aisles%' THEN
      RAISE NOTICE 'PASS: Rack under zone correctly rejected';
    ELSE
      RAISE EXCEPTION 'FAIL: Wrong error message: %', SQLERRM;
    END IF;
END $$;

-- ============================================================================
-- TEST 8: Hierarchy Validation: Bins Cannot Have Children
-- ============================================================================

DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-invalid-child', 'org-test-001', 'wh-test-001', 'loc-bin-b001',
    'CHILD', 'Invalid Child of Bin', 'bin', 'shelf'
  );

  RAISE EXCEPTION 'FAIL: Child of bin was allowed (should be rejected)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Bins cannot have child locations%' THEN
      RAISE NOTICE 'PASS: Child of bin correctly rejected';
    ELSE
      RAISE EXCEPTION 'FAIL: Wrong error message: %', SQLERRM;
    END IF;
END $$;

-- ============================================================================
-- TEST 9: Hierarchy Validation: Root Must Be Zone
-- ============================================================================

DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-invalid-root', 'org-test-001', 'wh-test-001', NULL,
    'ROOT-AISLE', 'Invalid Root Aisle', 'aisle', 'pallet'
  );

  RAISE EXCEPTION 'FAIL: Root aisle was allowed (should be rejected)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Root locations must be zones%' THEN
      RAISE NOTICE 'PASS: Root aisle correctly rejected';
    ELSE
      RAISE EXCEPTION 'FAIL: Wrong error message: %', SQLERRM;
    END IF;
END $$;

-- ============================================================================
-- TEST 10: Hierarchy Validation: Aisles Must Be Under Zones
-- ============================================================================

DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-invalid-aisle', 'org-test-001', 'wh-test-001', 'loc-rack-r01',
    'A99', 'Invalid Aisle Under Rack', 'aisle', 'pallet'
  );

  RAISE EXCEPTION 'FAIL: Aisle under rack was allowed (should be rejected)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Locations under racks must be bins%' THEN
      RAISE NOTICE 'PASS: Aisle under rack correctly rejected';
    ELSE
      RAISE EXCEPTION 'FAIL: Wrong error message: %', SQLERRM;
    END IF;
END $$;

-- ============================================================================
-- TEST 11: AC-09 - Unique Code Per Warehouse
-- ============================================================================

-- Test: Duplicate code in same warehouse should fail
DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type
  )
  VALUES (
    'loc-duplicate-zone', 'org-test-001', 'wh-test-001', NULL,
    'ZONE-A', 'Duplicate Zone A', 'zone', 'bulk'
  );

  RAISE EXCEPTION 'FAIL: Duplicate code in same warehouse was allowed';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'PASS: Duplicate code correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 12: Same Code in Different Warehouses Allowed
-- ============================================================================

-- Test: Same code in different warehouse should succeed
INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-zone-a-wh2', 'org-test-001', 'wh-test-002', NULL,
  'ZONE-A', 'Zone A in WH-002', 'zone', 'bulk'
);

SELECT
  CASE
    WHEN COUNT(*) = 2 THEN 'PASS: Same code allowed in different warehouses'
    ELSE 'FAIL: Same code not allowed across warehouses'
  END AS test_result
FROM locations
WHERE code = 'ZONE-A';

-- Expected: 2 rows (one in each warehouse)

-- ============================================================================
-- TEST 13: Full Path Updates When Parent Changes
-- ============================================================================

-- Create second zone and aisle
INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-zone-b', 'org-test-001', 'wh-test-001', NULL,
  'ZONE-B', 'Zone B', 'zone', 'bulk'
);

INSERT INTO locations (
  id, org_id, warehouse_id, parent_id,
  code, name, level, location_type
)
VALUES (
  'loc-aisle-b01', 'org-test-001', 'wh-test-001', 'loc-zone-b',
  'B01', 'Aisle B01', 'aisle', 'pallet'
);

-- Update aisle to move to different zone
-- NOTE: This should update full_path automatically
UPDATE locations
SET parent_id = 'loc-zone-a'
WHERE id = 'loc-aisle-b01';

SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A/B01' THEN 'PASS: Full path updated after parent change'
    ELSE 'FAIL: Full path not updated: ' || COALESCE(full_path, 'NULL')
  END AS test_result
FROM locations
WHERE id = 'loc-aisle-b01';

-- Expected: full_path = 'WH-001/ZONE-A/B01' (moved from ZONE-B)

-- ============================================================================
-- TEST 14: Full Path Updates When Code Changes
-- ============================================================================

UPDATE locations
SET code = 'ZONE-A-RENAMED'
WHERE id = 'loc-zone-a';

SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A-RENAMED' THEN 'PASS: Zone full_path updated after code change'
    ELSE 'FAIL: Zone full_path = ' || COALESCE(full_path, 'NULL')
  END AS test_result
FROM locations
WHERE id = 'loc-zone-a';

-- Expected: full_path = 'WH-001/ZONE-A-RENAMED'

-- ============================================================================
-- TEST 15: Child Paths Cascade When Parent Code Changes
-- ============================================================================

-- Check that child aisle's path also updated
SELECT
  CASE
    WHEN full_path = 'WH-001/ZONE-A-RENAMED/A01' THEN 'PASS: Child path cascaded after parent rename'
    ELSE 'FAIL: Child path = ' || COALESCE(full_path, 'NULL')
  END AS test_result
FROM locations
WHERE id = 'loc-aisle-a01';

-- Expected: full_path = 'WH-001/ZONE-A-RENAMED/A01'

-- ============================================================================
-- TEST 16: Depth Validation (Max 4 Levels)
-- ============================================================================

SELECT
  CASE
    WHEN depth BETWEEN 1 AND 4 THEN 'PASS: All locations within depth limits'
    ELSE 'FAIL: Location with invalid depth found'
  END AS test_result
FROM locations
WHERE depth NOT BETWEEN 1 AND 4;

-- Expected: 0 rows (all depths valid)

-- ============================================================================
-- TEST 17: Capacity Constraints (Positive Values)
-- ============================================================================

-- Test: Negative max_pallets should fail
DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type,
    max_pallets
  )
  VALUES (
    'loc-invalid-capacity', 'org-test-001', 'wh-test-001', NULL,
    'ZONE-C', 'Zone C', 'zone', 'bulk',
    -10
  );

  RAISE EXCEPTION 'FAIL: Negative max_pallets was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: Negative max_pallets correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 18: Current Pallets Cannot Be Negative
-- ============================================================================

DO $$
BEGIN
  INSERT INTO locations (
    id, org_id, warehouse_id, parent_id,
    code, name, level, location_type,
    current_pallets
  )
  VALUES (
    'loc-invalid-current', 'org-test-001', 'wh-test-001', NULL,
    'ZONE-D', 'Zone D', 'zone', 'bulk',
    -5
  );

  RAISE EXCEPTION 'FAIL: Negative current_pallets was allowed';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS: Negative current_pallets correctly rejected';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 19: Warehouse Code in Full Path
-- ============================================================================

-- Verify all full paths start with warehouse code
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: All full_paths start with warehouse code'
    ELSE 'FAIL: ' || COUNT(*) || ' locations with invalid full_path prefix'
  END AS test_result
FROM locations l
INNER JOIN warehouses w ON l.warehouse_id = w.id
WHERE l.full_path NOT LIKE (w.code || '/%');

-- Expected: 0 rows (all paths correctly prefixed)

-- ============================================================================
-- TEST 20: ON DELETE RESTRICT for Parent Locations
-- ============================================================================

-- Test: Deleting zone with children should fail
DO $$
BEGIN
  DELETE FROM locations WHERE id = 'loc-zone-a';

  RAISE EXCEPTION 'FAIL: Deleted zone with children (should be restricted)';
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: Delete restricted when children exist';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Wrong error type: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST CLEANUP
-- ============================================================================

ROLLBACK;

/**
 * Test Summary for Story 01.9 - Database Trigger Tests
 * ======================================================
 *
 * Test Coverage:
 * - Full path computation: 6 tests
 * - Hierarchy validation (zone>aisle>rack>bin): 6 tests
 * - Unique constraints: 2 tests
 * - Path cascading updates: 3 tests
 * - Capacity constraints: 2 tests
 * - Foreign key constraints: 1 test
 * - Total: 20 test scenarios
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - locations table not created yet
 * - compute_location_full_path() trigger not implemented
 * - validate_location_hierarchy() trigger not implemented
 * - Constraints not defined
 *
 * Next Steps for GREEN Phase:
 * 1. Create migration 061_create_locations_table.sql
 * 2. Implement compute_location_full_path() trigger function
 * 3. Implement validate_location_hierarchy() trigger function
 * 4. Add unique constraint on (org_id, warehouse_id, code)
 * 5. Add check constraints for capacity fields
 * 6. Add ON DELETE RESTRICT for parent_id FK
 * 7. Run tests - should transition from RED to GREEN
 *
 * Coverage Target: 100% (database triggers)
 * Critical: All hierarchy validations must be enforced at DB level
 */
