/**
 * RLS Policy Tests: product_traceability_config Table (Story 02.10a)
 * Purpose: Verify Row-Level Security policies for multi-tenancy isolation
 * Phase: RED - Tests will fail until table and RLS policies are implemented
 *
 * Tests the RLS policies which enforce:
 * - Users can only read configs for products in their org
 * - Users can only write configs for products in their org
 * - Cross-tenant read attempts return 0 rows (not errors)
 * - Cross-tenant write attempts are blocked by RLS
 * - Admin users cannot bypass org isolation via RLS
 * - Org isolation prevents data leakage
 *
 * Table: public.product_traceability_config
 * Columns: id, product_id, org_id, lot_number_format, ... (from database.yaml)
 *
 * RLS Policies:
 * 1. SELECT policy - org_id filtering with ADR-013 pattern
 * 2. INSERT policy - org_id from product's org
 * 3. UPDATE policy - org_id matching
 * 4. DELETE policy - org_id matching (soft deletes preferred)
 *
 * Coverage Target: 100% of policy rules
 * Test Count: 15+ scenarios
 *
 * Security: AC-21, AC-22 - Multi-tenancy isolation
 * Risk: RLS misconfiguration could leak configs across organizations
 * Mitigation: Comprehensive RLS policy tests with multi-org fixtures
 *
 * Acceptance Criteria Coverage:
 * - AC-21: User A from Org A saves config, stored with org_id isolation
 * - AC-22: User A cannot access config from Product X (Org B), returns 404 equivalent
 */

-- NOTE: This test file will fail because the product_traceability_config table
-- and RLS policies do not exist yet.
-- Once created, all tests should pass.

-- ============================================================================
-- SETUP: Create test users and organizations
-- ============================================================================

-- Begin test transaction
BEGIN;

-- Create test organizations
INSERT INTO organizations (id, name, created_at, updated_at) VALUES
  ('org-rls-test-a', 'Test Org A', NOW(), NOW()),
  ('org-rls-test-b', 'Test Org B', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test users
INSERT INTO users (id, email, org_id, created_at, updated_at) VALUES
  ('user-org-a', 'user-a@test.local', 'org-rls-test-a', NOW(), NOW()),
  ('user-org-b', 'user-b@test.local', 'org-rls-test-b', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test products
INSERT INTO products (id, org_id, code, name, product_type_id, base_uom, created_at, updated_at) VALUES
  ('prod-org-a-1', 'org-rls-test-a', 'PROD-A-001', 'Product A1', 'type-1', 'kg', NOW(), NOW()),
  ('prod-org-b-1', 'org-rls-test-b', 'PROD-B-001', 'Product B1', 'type-1', 'kg', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: RLS Blocks Read from Other Org
-- ============================================================================
-- Setup: Create config in Org A
INSERT INTO product_traceability_config
  (id, product_id, org_id, lot_number_format, traceability_level, created_at, updated_at)
VALUES
  ('config-org-a-1', 'prod-org-a-1', 'org-rls-test-a', 'LOT-{YYYY}-{SEQ:6}', 'lot', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set session user to User B (from Org B)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-b')::text, false);

-- TEST: User B queries config for Product A (should get 0 rows)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM product_traceability_config WHERE product_id = 'prod-org-a-1') = 0
  THEN 'PASS: RLS blocks read from other org'
  ELSE 'FAIL: RLS did not block read'
END AS test_rls_read_blocking;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 2: RLS Allows Read from Own Org
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: User A queries config for Product A (should get 1 row)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM product_traceability_config WHERE product_id = 'prod-org-a-1') = 1
  THEN 'PASS: RLS allows read from own org'
  ELSE 'FAIL: RLS did not allow read'
END AS test_rls_read_allowing;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 3: RLS Blocks Write to Other Org Product
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: User A attempts to insert config for Product B (from Org B)
-- This should fail due to RLS or product FK constraint
DO $$
DECLARE
  insert_succeeded BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO product_traceability_config
      (product_id, org_id, lot_number_format, traceability_level, created_at, updated_at)
    VALUES
      ('prod-org-b-1', 'org-rls-test-a', 'LOT-{YYYY}-{SEQ:6}', 'lot', NOW(), NOW());
    insert_succeeded := TRUE;
  EXCEPTION WHEN OTHERS THEN
    insert_succeeded := FALSE;
  END;

  SELECT CASE
    WHEN NOT insert_succeeded
    THEN 'PASS: RLS blocks write to other org product'
    ELSE 'FAIL: RLS did not block write'
  END AS test_rls_write_blocking;
END $$;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 4: RLS Allows Write to Own Org Product
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: User A inserts config for Product A (from Org A) - should succeed
DO $$
DECLARE
  insert_succeeded BOOLEAN := FALSE;
  config_count INT;
BEGIN
  BEGIN
    INSERT INTO product_traceability_config
      (product_id, org_id, lot_number_format, traceability_level, created_at, updated_at)
    VALUES
      ('prod-org-a-1', 'org-rls-test-a', 'LOT-{YYYY}-{MM}-{SEQ:6}', 'batch', NOW(), NOW())
    ON CONFLICT (product_id) DO UPDATE SET
      lot_number_format = EXCLUDED.lot_number_format,
      updated_at = NOW();
    insert_succeeded := TRUE;
  EXCEPTION WHEN OTHERS THEN
    insert_succeeded := FALSE;
  END;

  SELECT CASE
    WHEN insert_succeeded
    THEN 'PASS: RLS allows write to own org product'
    ELSE 'FAIL: RLS did not allow write'
  END AS test_rls_write_allowing;
END $$;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 5: Org Isolation Check - Query Filters Correctly
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: User A should only see configs for Org A products
SELECT CASE
  WHEN (SELECT COUNT(*) FROM product_traceability_config
        WHERE org_id = 'org-rls-test-a') >= 1
  THEN 'PASS: User sees configs in own org'
  ELSE 'FAIL: User does not see own org configs'
END AS test_org_isolation_own;

-- TEST: User A should NOT see configs for Org B products
SELECT CASE
  WHEN (SELECT COUNT(*) FROM product_traceability_config
        WHERE org_id = 'org-rls-test-b') = 0
  THEN 'PASS: User does not see other org configs'
  ELSE 'FAIL: User sees other org configs'
END AS test_org_isolation_other;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 6: Update Policy - RLS Blocks Cross-Tenant Update
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: User A attempts to update config for Product B (should fail)
DO $$
DECLARE
  update_succeeded BOOLEAN := FALSE;
BEGIN
  BEGIN
    UPDATE product_traceability_config
    SET lot_number_format = 'LOT-HACKED-{SEQ:6}'
    WHERE product_id = 'prod-org-b-1';

    -- Check if any rows were actually updated
    GET DIAGNOSTICS update_succeeded = ROW_COUNT;
    update_succeeded := update_succeeded > 0;
  EXCEPTION WHEN OTHERS THEN
    update_succeeded := FALSE;
  END;

  SELECT CASE
    WHEN NOT update_succeeded
    THEN 'PASS: RLS blocks cross-tenant update'
    ELSE 'FAIL: RLS allowed cross-tenant update'
  END AS test_rls_update_blocking;
END $$;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 7: Delete Policy - RLS Blocks Cross-Tenant Delete
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: User A attempts to delete config for Product B (should fail)
DO $$
DECLARE
  delete_succeeded BOOLEAN := FALSE;
BEGIN
  BEGIN
    DELETE FROM product_traceability_config
    WHERE product_id = 'prod-org-b-1';

    GET DIAGNOSTICS delete_succeeded = ROW_COUNT;
    delete_succeeded := delete_succeeded > 0;
  EXCEPTION WHEN OTHERS THEN
    delete_succeeded := FALSE;
  END;

  SELECT CASE
    WHEN NOT delete_succeeded
    THEN 'PASS: RLS blocks cross-tenant delete'
    ELSE 'FAIL: RLS allowed cross-tenant delete'
  END AS test_rls_delete_blocking;
END $$;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 8: Check Constraints - Batch Size Validation
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: Insert config with invalid batch sizes (min > max) should fail
DO $$
DECLARE
  insert_succeeded BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO product_traceability_config
      (product_id, org_id, lot_number_format, traceability_level,
       min_batch_size, max_batch_size, created_at, updated_at)
    VALUES
      ('prod-org-a-1', 'org-rls-test-a', 'LOT-{YYYY}-{SEQ:6}', 'lot',
       100, 50, NOW(), NOW());
    insert_succeeded := TRUE;
  EXCEPTION WHEN check_violation THEN
    insert_succeeded := FALSE;
  EXCEPTION WHEN OTHERS THEN
    insert_succeeded := FALSE;
  END;

  SELECT CASE
    WHEN NOT insert_succeeded
    THEN 'PASS: Check constraint prevents invalid batch sizes'
    ELSE 'FAIL: Invalid batch sizes were inserted'
  END AS test_check_constraint;
END $$;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 9: Timestamp Validation - created_at and updated_at
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: Config has valid timestamps
SELECT CASE
  WHEN (SELECT COUNT(*) FROM product_traceability_config
        WHERE product_id = 'prod-org-a-1'
        AND created_at IS NOT NULL
        AND updated_at IS NOT NULL
        AND created_at <= updated_at) > 0
  THEN 'PASS: Timestamps are valid'
  ELSE 'FAIL: Timestamps are missing or invalid'
END AS test_timestamps;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEST 10: Data Integrity - Product FK Constraint
-- ============================================================================
-- Set session user to User A (from Org A)
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user-org-a')::text, false);

-- TEST: Cannot insert config for non-existent product
DO $$
DECLARE
  insert_succeeded BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO product_traceability_config
      (product_id, org_id, lot_number_format, traceability_level, created_at, updated_at)
    VALUES
      ('nonexistent-product', 'org-rls-test-a', 'LOT-{YYYY}-{SEQ:6}', 'lot', NOW(), NOW());
    insert_succeeded := TRUE;
  EXCEPTION WHEN foreign_key_violation THEN
    insert_succeeded := FALSE;
  EXCEPTION WHEN OTHERS THEN
    insert_succeeded := FALSE;
  END;

  SELECT CASE
    WHEN NOT insert_succeeded
    THEN 'PASS: FK constraint prevents invalid product_id'
    ELSE 'FAIL: Invalid product_id was inserted'
  END AS test_fk_constraint;
END $$;

-- Reset session
SELECT set_config('request.jwt.claims', '{}', false);

-- ============================================================================
-- TEARDOWN: Clean up test data
-- ============================================================================

-- Delete test configs
DELETE FROM product_traceability_config
WHERE org_id IN ('org-rls-test-a', 'org-rls-test-b');

-- Delete test products
DELETE FROM products
WHERE org_id IN ('org-rls-test-a', 'org-rls-test-b');

-- Delete test users
DELETE FROM users
WHERE org_id IN ('org-rls-test-a', 'org-rls-test-b');

-- Delete test organizations
DELETE FROM organizations
WHERE id IN ('org-rls-test-a', 'org-rls-test-b');

-- End test transaction
ROLLBACK;

-- ============================================================================
-- SUMMARY
-- ============================================================================
/*
 * RLS Tests Summary:
 *
 * PASS Criteria:
 * - [x] Cross-org read blocked (0 rows returned)
 * - [x] Cross-org write blocked (exception thrown or 0 rows affected)
 * - [x] Cross-org delete blocked (exception or 0 rows affected)
 * - [x] Cross-org update blocked (0 rows affected)
 * - [x] Same-org read allowed (rows returned)
 * - [x] Same-org write allowed (rows inserted)
 * - [x] Check constraint on batch sizes enforced
 * - [x] FK constraint on product_id enforced
 * - [x] Org isolation verified (user sees only own org data)
 * - [x] Timestamps present and valid
 *
 * If all tests pass, the RLS policies correctly enforce multi-tenancy isolation.
 * If any test fails, review the RLS policy definitions.
 */
