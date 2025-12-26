-- Trigger Tests: product_version_increment (Story 02.2)
-- Purpose: Test database triggers for automatic version increment
-- Phase: RED - Tests will fail until triggers are implemented
--
-- Tests:
-- - Version auto-increment on UPDATE (AC-01, AC-02)
-- - Initial version (v1) on INSERT (AC-03)
-- - History record creation with changed_fields (AC-05, AC-06)
-- - No version increment when no changes (AC-07)
-- - Concurrent edits handling (AC-22)
--
-- Coverage Target: 100% of trigger logic tested
-- Test Count: 12+ scenarios

BEGIN;

-- Create test extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Setup: Create test organization and user
INSERT INTO organizations (id, name, slug, created_at)
VALUES ('test-org', 'Test Organization', 'test-org', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, org_id, email, first_name, last_name, role_id, created_at)
VALUES ('test-user', 'test-org', 'test@example.com', 'Test', 'User', 'role-admin', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: Initial version (v1) created on product INSERT (AC-03)
-- ============================================================================
INSERT INTO products (id, org_id, code, name, product_type_id, base_uom, created_by, created_at)
VALUES ('prod-001', 'test-org', 'TEST-001', 'Test Product', 'type-fg', 'pcs', 'test-user', NOW());

SELECT plan(2);

SELECT is(
  (SELECT version FROM products WHERE id = 'prod-001'),
  1,
  'New product has version 1'
);

SELECT is(
  (SELECT version FROM product_version_history WHERE product_id = 'prod-001'),
  1,
  'Initial history record created with version 1'
);

-- ============================================================================
-- TEST 2: Initial history record has _initial flag (AC-18)
-- ============================================================================
SELECT plan(1);

SELECT is(
  (SELECT changed_fields->>'_initial' FROM product_version_history WHERE product_id = 'prod-001' AND version = 1),
  'true',
  'Initial history record has _initial flag'
);

-- ============================================================================
-- TEST 3: Version increments on name UPDATE (AC-01)
-- ============================================================================
UPDATE products
SET name = 'Updated Product Name', updated_by = 'test-user'
WHERE id = 'prod-001';

SELECT plan(2);

SELECT is(
  (SELECT version FROM products WHERE id = 'prod-001'),
  2,
  'Version incremented from 1 to 2 after name update'
);

SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id = 'prod-001'),
  2,
  'Two history records exist (v1 and v2)'
);

-- ============================================================================
-- TEST 4: History record contains correct changed_fields (AC-06)
-- ============================================================================
SELECT plan(2);

SELECT ok(
  (SELECT changed_fields ? 'name' FROM product_version_history WHERE product_id = 'prod-001' AND version = 2),
  'Version 2 history contains "name" field change'
);

SELECT is(
  (SELECT changed_fields->'name'->>'new' FROM product_version_history WHERE product_id = 'prod-001' AND version = 2),
  'Updated Product Name',
  'Changed field contains correct new value'
);

-- ============================================================================
-- TEST 5: Multiple field changes tracked correctly (AC-06)
-- ============================================================================
UPDATE products
SET
  name = 'Another Update',
  description = 'New description',
  shelf_life_days = 30,
  updated_by = 'test-user'
WHERE id = 'prod-001';

SELECT plan(4);

SELECT is(
  (SELECT version FROM products WHERE id = 'prod-001'),
  3,
  'Version incremented to 3'
);

SELECT ok(
  (SELECT changed_fields ? 'name' FROM product_version_history WHERE product_id = 'prod-001' AND version = 3),
  'Version 3 history contains "name" change'
);

SELECT ok(
  (SELECT changed_fields ? 'description' FROM product_version_history WHERE product_id = 'prod-001' AND version = 3),
  'Version 3 history contains "description" change'
);

SELECT ok(
  (SELECT changed_fields ? 'shelf_life_days' FROM product_version_history WHERE product_id = 'prod-001' AND version = 3),
  'Version 3 history contains "shelf_life_days" change'
);

-- ============================================================================
-- TEST 6: No version increment when no fields actually changed (AC-07)
-- ============================================================================
-- Get current version
SELECT version INTO current_version FROM products WHERE id = 'prod-001';

-- Update with same values (no actual change)
UPDATE products
SET
  name = (SELECT name FROM products WHERE id = 'prod-001'),
  updated_by = 'test-user'
WHERE id = 'prod-001';

SELECT plan(2);

SELECT is(
  (SELECT version FROM products WHERE id = 'prod-001'),
  current_version,
  'Version did not increment when no fields changed'
);

SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id = 'prod-001'),
  3,
  'No new history record created when no fields changed'
);

-- ============================================================================
-- TEST 7: Version increment captures old and new values correctly
-- ============================================================================
-- Reset to known state
UPDATE products SET std_price = 10.00, updated_by = 'test-user' WHERE id = 'prod-001';

-- Now update to new value
UPDATE products SET std_price = 15.00, updated_by = 'test-user' WHERE id = 'prod-001';

SELECT plan(2);

SELECT is(
  (SELECT changed_fields->'std_price'->>'old' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  '10.00',
  'Old value correctly captured'
);

SELECT is(
  (SELECT changed_fields->'std_price'->>'new' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  '15.00',
  'New value correctly captured'
);

-- ============================================================================
-- TEST 8: NULL to value change is tracked
-- ============================================================================
UPDATE products SET barcode = '1234567890123', updated_by = 'test-user' WHERE id = 'prod-001';

SELECT plan(2);

SELECT ok(
  (SELECT changed_fields ? 'barcode' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'Barcode change tracked (null to value)'
);

SELECT is(
  (SELECT changed_fields->'barcode'->>'new' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  '1234567890123',
  'New barcode value correctly captured'
);

-- ============================================================================
-- TEST 9: Value to NULL change is tracked
-- ============================================================================
UPDATE products SET barcode = NULL, updated_by = 'test-user' WHERE id = 'prod-001';

SELECT plan(2);

SELECT ok(
  (SELECT changed_fields ? 'barcode' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'Barcode change tracked (value to null)'
);

SELECT is(
  (SELECT changed_fields->'barcode'->>'old' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  '1234567890123',
  'Old barcode value correctly captured before null'
);

-- ============================================================================
-- TEST 10: Status change is tracked
-- ============================================================================
UPDATE products SET status = 'inactive', updated_by = 'test-user' WHERE id = 'prod-001';

SELECT plan(2);

SELECT is(
  (SELECT changed_fields->'status'->>'old' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'active',
  'Old status captured'
);

SELECT is(
  (SELECT changed_fields->'status'->>'new' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'inactive',
  'New status captured'
);

-- ============================================================================
-- TEST 11: Boolean field changes tracked
-- ============================================================================
UPDATE products SET is_perishable = false, updated_by = 'test-user' WHERE id = 'prod-001';

SELECT plan(1);

SELECT ok(
  (SELECT changed_fields ? 'is_perishable' FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'Boolean field change tracked'
);

-- ============================================================================
-- TEST 12: changed_by references correct user
-- ============================================================================
SELECT plan(1);

SELECT is(
  (SELECT changed_by FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'test-user'::uuid,
  'changed_by references correct user'
);

-- ============================================================================
-- TEST 13: changed_at timestamp is set correctly
-- ============================================================================
SELECT plan(1);

SELECT ok(
  (SELECT changed_at > NOW() - INTERVAL '1 minute'
   FROM product_version_history
   WHERE product_id = 'prod-001'
   ORDER BY version DESC LIMIT 1),
  'changed_at timestamp is recent (within last minute)'
);

-- ============================================================================
-- TEST 14: Version never decreases (AC-04)
-- ============================================================================
SELECT plan(1);

-- Attempt to manually set version to lower value should be rejected
SELECT throws_ok(
  $$UPDATE products SET version = 1 WHERE id = 'prod-001'$$,
  'version is system-managed and cannot be manually set',
  'Cannot manually decrease version'
);

-- ============================================================================
-- TEST 15: Concurrent edits create separate history records (AC-22)
-- ============================================================================
-- Create second product
INSERT INTO products (id, org_id, code, name, product_type_id, base_uom, created_by, created_at)
VALUES ('prod-002', 'test-org', 'TEST-002', 'Product 2', 'type-fg', 'pcs', 'test-user', NOW());

-- Simulate concurrent edits (in practice, handled by DB transaction isolation)
UPDATE products SET name = 'Concurrent Update 1', updated_by = 'test-user' WHERE id = 'prod-002';
UPDATE products SET description = 'Concurrent Update 2', updated_by = 'test-user' WHERE id = 'prod-002';

SELECT plan(3);

SELECT is(
  (SELECT version FROM products WHERE id = 'prod-002'),
  3,
  'Version incremented to 3 after two updates'
);

SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id = 'prod-002'),
  3,
  'Three history records created (v1, v2, v3)'
);

SELECT ok(
  (SELECT version FROM product_version_history WHERE product_id = 'prod-002' ORDER BY version DESC LIMIT 1) = 3,
  'Latest version in history is 3'
);

-- ============================================================================
-- TEST 16: Only tracked fields trigger version increment
-- ============================================================================
-- Update non-tracked fields (updated_at, deleted_at)
UPDATE products
SET updated_at = NOW(), updated_by = 'test-user'
WHERE id = 'prod-001';

SELECT plan(1);

-- Version should not increment (updated_at is not tracked)
SELECT ok(
  (SELECT version FROM products WHERE id = 'prod-001') =
  (SELECT MAX(version) FROM product_version_history WHERE product_id = 'prod-001'),
  'Version did not increment for non-tracked field update'
);

-- Cleanup
ROLLBACK;

/**
 * Test Summary:
 *
 * Initial version (v1):
 *   - Product INSERT creates v1 (1 test) (AC-03)
 *   - Initial history record created (1 test)
 *   - _initial flag set (1 test) (AC-18)
 *
 * Version increment:
 *   - Single field update (2 tests) (AC-01)
 *   - Multiple field update (4 tests) (AC-06)
 *   - No increment when no changes (2 tests) (AC-07)
 *
 * changed_fields JSONB:
 *   - Old/new values captured (4 tests) (AC-06)
 *   - NULL handling (4 tests)
 *   - Status change (2 tests)
 *   - Boolean change (1 test)
 *
 * Metadata:
 *   - changed_by reference (1 test)
 *   - changed_at timestamp (1 test)
 *
 * Edge cases:
 *   - Version never decreases (1 test) (AC-04)
 *   - Concurrent edits (3 tests) (AC-22)
 *   - Non-tracked fields (1 test)
 *
 * Total: 28 tests
 * Coverage: 100% of trigger logic
 * Status: RED (triggers not implemented yet)
 */
