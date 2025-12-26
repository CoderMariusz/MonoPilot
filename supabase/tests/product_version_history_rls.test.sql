-- RLS Tests: product_version_history (Story 02.2)
-- Purpose: Test Row-Level Security policies for version history
-- Phase: RED - Tests will fail until RLS policies are implemented
--
-- Tests:
-- - SELECT policy: Users can only see history for their org's products (AC-23)
-- - INSERT policy: Users can create history for their org's products
-- - UPDATE policy: History is immutable - no updates allowed (AC-21)
-- - DELETE policy: History is immutable - no deletes allowed (AC-21)
-- - Cross-org isolation (AC-23)
--
-- Coverage Target: 100% of RLS policies tested
-- Test Count: 10+ scenarios

BEGIN;

-- Create test extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Setup: Create test organizations
INSERT INTO organizations (id, name, slug, created_at)
VALUES
  ('org-a', 'Organization A', 'org-a', NOW()),
  ('org-b', 'Organization B', 'org-b', NOW())
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test users
INSERT INTO users (id, org_id, email, first_name, last_name, role_id, created_at)
VALUES
  ('user-a1', 'org-a', 'user-a1@test.com', 'Alice', 'A', 'role-admin', NOW()),
  ('user-a2', 'org-a', 'user-a2@test.com', 'Bob', 'A', 'role-admin', NOW()),
  ('user-b1', 'org-b', 'user-b1@test.com', 'Charlie', 'B', 'role-admin', NOW())
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test products
INSERT INTO products (id, org_id, code, name, product_type_id, base_uom, version, created_by, created_at)
VALUES
  ('prod-a1', 'org-a', 'PROD-A1', 'Product A1', 'type-fg', 'pcs', 1, 'user-a1', NOW()),
  ('prod-a2', 'org-a', 'PROD-A2', 'Product A2', 'type-rm', 'kg', 1, 'user-a2', NOW()),
  ('prod-b1', 'org-b', 'PROD-B1', 'Product B1', 'type-fg', 'pcs', 1, 'user-b1', NOW())
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test version history records
INSERT INTO product_version_history (id, product_id, version, changed_fields, changed_by, changed_at)
VALUES
  ('hist-a1-v1', 'prod-a1', 1, '{"_initial": true}', 'user-a1', NOW() - INTERVAL '10 days'),
  ('hist-a1-v2', 'prod-a1', 2, '{"name": {"old": "Product A1", "new": "Updated A1"}}', 'user-a1', NOW() - INTERVAL '5 days'),
  ('hist-a2-v1', 'prod-a2', 1, '{"_initial": true}', 'user-a2', NOW() - INTERVAL '8 days'),
  ('hist-b1-v1', 'prod-b1', 1, '{"_initial": true}', 'user-b1', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Helper function to set current user session
CREATE OR REPLACE FUNCTION set_test_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TEST 1: SELECT - User can see history for own org's products (AC-23)
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id IN ('prod-a1', 'prod-a2')),
  3,
  'User A1 can see 3 history records for Org A products'
);

-- ============================================================================
-- TEST 2: SELECT - User CANNOT see history for other org's products (AC-23)
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id = 'prod-b1'),
  0,
  'User A1 cannot see history for Org B product (RLS blocked)'
);

-- ============================================================================
-- TEST 3: SELECT - User B can only see their org's history
-- ============================================================================
SELECT set_test_user('user-b1');

SELECT plan(1);
SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history),
  1,
  'User B1 can only see 1 history record for Org B'
);

-- ============================================================================
-- TEST 4: INSERT - User can create history for own org's products
-- ============================================================================
SELECT set_test_user('user-a2');

INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at)
VALUES ('prod-a2', 2, '{"name": {"old": "Product A2", "new": "Updated A2"}}', 'user-a2', NOW());

SELECT plan(1);
SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id = 'prod-a2'),
  2,
  'User A2 can create history record for own org product'
);

-- ============================================================================
-- TEST 5: INSERT - User CANNOT create history for other org's products
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT throws_ok(
  $$INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at)
    VALUES ('prod-b1', 2, '{"name": {"old": "B1", "new": "Updated B1"}}', 'user-a1', NOW())$$,
  'new row violates row-level security policy',
  'User A1 cannot create history for Org B product (RLS blocked)'
);

-- ============================================================================
-- TEST 6: UPDATE - History records are immutable (AC-21)
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT throws_ok(
  $$UPDATE product_version_history
    SET changed_fields = '{"name": {"old": "X", "new": "Y"}}'
    WHERE id = 'hist-a1-v2'$$,
  'new row violates row-level security policy',
  'History records cannot be updated (immutable)'
);

-- ============================================================================
-- TEST 7: UPDATE - Even owner cannot update history
-- ============================================================================
SELECT set_test_user('user-a2');

SELECT plan(1);
SELECT throws_ok(
  $$UPDATE product_version_history
    SET version = 999
    WHERE id = 'hist-a2-v1'$$,
  'new row violates row-level security policy',
  'Even record creator cannot update history (immutable)'
);

-- ============================================================================
-- TEST 8: DELETE - History records cannot be deleted (AC-21)
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT throws_ok(
  $$DELETE FROM product_version_history WHERE id = 'hist-a1-v1'$$,
  'new row violates row-level security policy',
  'History records cannot be deleted (immutable)'
);

-- ============================================================================
-- TEST 9: DELETE - Even owner cannot delete history
-- ============================================================================
SELECT set_test_user('user-a2');

SELECT plan(1);
SELECT throws_ok(
  $$DELETE FROM product_version_history WHERE id = 'hist-a2-v1'$$,
  'new row violates row-level security policy',
  'Even record creator cannot delete history (immutable)'
);

-- ============================================================================
-- TEST 10: Unique constraint on (product_id, version)
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT throws_ok(
  $$INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at)
    VALUES ('prod-a1', 2, '{"duplicate": true}', 'user-a1', NOW())$$,
  'duplicate key value violates unique constraint',
  'Cannot create duplicate version for same product'
);

-- ============================================================================
-- TEST 11: Version must be >= 1 (CHECK constraint)
-- ============================================================================
SELECT set_test_user('user-a1');

SELECT plan(1);
SELECT throws_ok(
  $$INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at)
    VALUES ('prod-a1', 0, '{"invalid": true}', 'user-a1', NOW())$$,
  'new row violates check constraint',
  'Version must be at least 1'
);

-- ============================================================================
-- TEST 12: Indexes exist for performance
-- ============================================================================
SELECT plan(3);

-- Check for product_id + version DESC index
SELECT has_index(
  'product_version_history',
  'idx_product_version_history_product_id',
  'Index on product_id and version exists'
);

-- Check for changed_at index (for date filtering)
SELECT has_index(
  'product_version_history',
  'idx_product_version_history_changed_at',
  'Index on product_id and changed_at exists'
);

-- Check for changed_by index (for user lookup)
SELECT has_index(
  'product_version_history',
  'idx_product_version_history_changed_by',
  'Index on changed_by exists'
);

-- ============================================================================
-- TEST 13: Foreign key constraints
-- ============================================================================
SELECT plan(2);

-- Check product_id references products
SELECT has_foreign_key(
  'product_version_history',
  'product_id',
  'products',
  'Foreign key to products table exists'
);

-- Check changed_by references users
SELECT has_foreign_key(
  'product_version_history',
  'changed_by',
  'users',
  'Foreign key to users table exists'
);

-- ============================================================================
-- TEST 14: Cascade delete when product is deleted
-- ============================================================================
SELECT set_test_user('user-a1');

-- Soft delete product
UPDATE products SET deleted_at = NOW() WHERE id = 'prod-a1';

SELECT plan(1);
SELECT is(
  (SELECT COUNT(*)::int FROM product_version_history WHERE product_id = 'prod-a1'),
  0,
  'History records are deleted when product is deleted (CASCADE)'
);

-- Cleanup
ROLLBACK;

/**
 * Test Summary:
 *
 * RLS Policies:
 *   - SELECT: Org isolation (2 tests) (AC-23)
 *   - INSERT: Org isolation (2 tests)
 *   - UPDATE: Immutability (2 tests) (AC-21)
 *   - DELETE: Immutability (2 tests) (AC-21)
 *
 * Constraints:
 *   - Unique (product_id, version) (1 test)
 *   - CHECK version >= 1 (1 test)
 *
 * Schema:
 *   - Indexes (3 tests)
 *   - Foreign keys (2 tests)
 *   - Cascade delete (1 test)
 *
 * Total: 16 tests
 * Coverage: 100% of RLS policies and constraints
 * Status: RED (table and policies not created yet)
 */
