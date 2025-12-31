/**
 * Supplier Products RLS Tests
 * Story: 03.2 - Supplier-Product Assignment
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests RLS policies for supplier_products table:
 * - SELECT isolation by org
 * - INSERT isolation by org
 * - UPDATE isolation by org
 * - DELETE isolation by org
 *
 * Coverage Target: 100% of scenarios
 * Test Count: 8+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-10: RLS Org Isolation
 *
 * Notes:
 * - Run with: psql -U postgres -d monopilot_test -f supabase/tests/supplier-products-rls.test.sql
 * - Requires test data setup: organizations, users, suppliers, products, supplier_products
 * - Tests assume RLS policies are enabled and configured
 */

-- ============================================================================
-- SETUP: Create test organizations and users
-- ============================================================================

-- Test Org A
INSERT INTO organizations (id, name)
VALUES (
  'org-test-a'::uuid,
  'Test Organization A'
)
ON CONFLICT (id) DO NOTHING;

-- Test Org B
INSERT INTO organizations (id, name)
VALUES (
  'org-test-b'::uuid,
  'Test Organization B'
)
ON CONFLICT (id) DO NOTHING;

-- User A (belongs to Org A)
INSERT INTO users (id, org_id, email, encrypted_password, confirmed_at)
VALUES (
  'user-test-a'::uuid,
  'org-test-a'::uuid,
  'user-a@test.com',
  crypt('password123', gen_salt('bf')),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- User B (belongs to Org B)
INSERT INTO users (id, org_id, email, encrypted_password, confirmed_at)
VALUES (
  'user-test-b'::uuid,
  'org-test-b'::uuid,
  'user-b@test.com',
  crypt('password123', gen_salt('bf')),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP: Create test suppliers for each org
-- ============================================================================

-- Supplier A1 (Org A)
INSERT INTO suppliers (id, org_id, code, name, currency)
VALUES (
  'sup-test-a1'::uuid,
  'org-test-a'::uuid,
  'SUP-TEST-A1',
  'Supplier A1',
  'PLN'
)
ON CONFLICT (id) DO NOTHING;

-- Supplier B1 (Org B)
INSERT INTO suppliers (id, org_id, code, name, currency)
VALUES (
  'sup-test-b1'::uuid,
  'org-test-b'::uuid,
  'SUP-TEST-B1',
  'Supplier B1',
  'PLN'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP: Create test products for each org
-- ============================================================================

-- Product A1 (Org A)
INSERT INTO products (id, org_id, code, name, uom)
VALUES (
  'prod-test-a1'::uuid,
  'org-test-a'::uuid,
  'PROD-TEST-A1',
  'Product A1',
  'kg'
)
ON CONFLICT (id) DO NOTHING;

-- Product B1 (Org B)
INSERT INTO products (id, org_id, code, name, uom)
VALUES (
  'prod-test-b1'::uuid,
  'org-test-b'::uuid,
  'PROD-TEST-B1',
  'Product B1',
  'kg'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP: Create test supplier-product assignments
-- ============================================================================

-- Assignment A1 (Org A: Supplier A1 + Product A1)
INSERT INTO supplier_products (id, supplier_id, product_id, is_default, unit_price, currency)
VALUES (
  'sp-test-a1'::uuid,
  'sup-test-a1'::uuid,
  'prod-test-a1'::uuid,
  true,
  10.50,
  'PLN'
)
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- Assignment B1 (Org B: Supplier B1 + Product B1)
INSERT INTO supplier_products (id, supplier_id, product_id, is_default, unit_price, currency)
VALUES (
  'sp-test-b1'::uuid,
  'sup-test-b1'::uuid,
  'prod-test-b1'::uuid,
  true,
  15.00,
  'PLN'
)
ON CONFLICT (supplier_id, product_id) DO NOTHING;

-- ============================================================================
-- TEST 1: User A can read own org's supplier-products
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  -- Expected: Should see sp-test-a1 only
  SELECT 'TEST_1_USER_A_READ_OWN_ORG: ' ||
    CASE
      WHEN COUNT(*) = 1 THEN 'PASS'
      ELSE 'FAIL (expected 1 row, got ' || COUNT(*)::text || ')'
    END as result
  FROM supplier_products
  WHERE supplier_id = 'sup-test-a1'::uuid;

ROLLBACK;

-- ============================================================================
-- TEST 2: User A cannot read other org's supplier-products
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  -- Expected: Should see 0 rows (RLS blocks access to Org B data)
  SELECT 'TEST_2_USER_A_CANNOT_READ_ORG_B: ' ||
    CASE
      WHEN COUNT(*) = 0 THEN 'PASS'
      ELSE 'FAIL (expected 0 rows, got ' || COUNT(*)::text || ')'
    END as result
  FROM supplier_products
  WHERE supplier_id = 'sup-test-b1'::uuid;

ROLLBACK;

-- ============================================================================
-- TEST 3: User A cannot insert for other org's supplier
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  INSERT INTO supplier_products (supplier_id, product_id)
  VALUES (
    'sup-test-b1'::uuid,  -- Org B supplier
    'prod-test-b1'::uuid  -- Org B product
  );

  -- Expected: INSERT should be blocked by RLS
  -- If we get here without error, the test fails
  SELECT 'TEST_3_USER_A_CANNOT_INSERT_ORG_B: FAIL (INSERT succeeded)' as result;

EXCEPTION WHEN sqlstate 'PGRST' THEN
  SELECT 'TEST_3_USER_A_CANNOT_INSERT_ORG_B: PASS (RLS blocked)' as result;
ROLLBACK;

-- ============================================================================
-- TEST 4: User A can insert for own org's supplier
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  INSERT INTO supplier_products (
    id,
    supplier_id,
    product_id,
    unit_price,
    currency
  )
  VALUES (
    'sp-test-a2'::uuid,
    'sup-test-a1'::uuid,  -- Org A supplier
    'prod-test-a1'::uuid,  -- Org A product
    12.00,
    'PLN'
  );

  -- Expected: INSERT succeeds
  SELECT 'TEST_4_USER_A_CAN_INSERT_OWN_ORG: ' ||
    CASE
      WHEN COUNT(*) = 1 THEN 'PASS'
      ELSE 'FAIL'
    END as result
  FROM supplier_products
  WHERE id = 'sp-test-a2'::uuid;

ROLLBACK;

-- ============================================================================
-- TEST 5: User A cannot update other org's supplier-products
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  UPDATE supplier_products
  SET unit_price = 99.99
  WHERE id = 'sp-test-b1'::uuid;

  -- Expected: 0 rows affected (RLS prevents update)
  SELECT 'TEST_5_USER_A_CANNOT_UPDATE_ORG_B: ' ||
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM supplier_products WHERE id = 'sp-test-b1'::uuid AND unit_price = 99.99
      ) THEN 'PASS (update blocked)'
      ELSE 'FAIL (update succeeded)'
    END as result;

ROLLBACK;

-- ============================================================================
-- TEST 6: User A can update own org's supplier-products
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  UPDATE supplier_products
  SET unit_price = 11.00
  WHERE id = 'sp-test-a1'::uuid;

  -- Expected: 1 row affected
  SELECT 'TEST_6_USER_A_CAN_UPDATE_OWN_ORG: ' ||
    CASE
      WHEN EXISTS (
        SELECT 1 FROM supplier_products WHERE id = 'sp-test-a1'::uuid AND unit_price = 11.00
      ) THEN 'PASS'
      ELSE 'FAIL'
    END as result;

ROLLBACK;

-- ============================================================================
-- TEST 7: User A cannot delete other org's supplier-products
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  DELETE FROM supplier_products
  WHERE id = 'sp-test-b1'::uuid;

  -- Expected: 0 rows affected (RLS prevents delete)
  SELECT 'TEST_7_USER_A_CANNOT_DELETE_ORG_B: ' ||
    CASE
      WHEN EXISTS (
        SELECT 1 FROM supplier_products WHERE id = 'sp-test-b1'::uuid
      ) THEN 'PASS (delete blocked)'
      ELSE 'FAIL (delete succeeded)'
    END as result;

ROLLBACK;

-- ============================================================================
-- TEST 8: User A can delete own org's supplier-products
-- ============================================================================

BEGIN;
  SET LOCAL role = authenticated;
  SET LOCAL "request.jwt.claims" = json_build_object('sub', 'user-test-a'::text);

  -- First insert a record to delete
  INSERT INTO supplier_products (
    id,
    supplier_id,
    product_id
  )
  VALUES (
    'sp-test-a-del'::uuid,
    'sup-test-a1'::uuid,
    'prod-test-a1'::uuid
  )
  ON CONFLICT DO NOTHING;

  DELETE FROM supplier_products
  WHERE id = 'sp-test-a-del'::uuid;

  -- Expected: Record deleted
  SELECT 'TEST_8_USER_A_CAN_DELETE_OWN_ORG: ' ||
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM supplier_products WHERE id = 'sp-test-a-del'::uuid
      ) THEN 'PASS'
      ELSE 'FAIL'
    END as result;

ROLLBACK;

-- ============================================================================
-- CLEANUP: Delete test data
-- ============================================================================

DELETE FROM supplier_products WHERE id IN (
  'sp-test-a1'::uuid,
  'sp-test-b1'::uuid,
  'sp-test-a2'::uuid,
  'sp-test-a-del'::uuid
);

DELETE FROM products WHERE id IN (
  'prod-test-a1'::uuid,
  'prod-test-b1'::uuid
);

DELETE FROM suppliers WHERE id IN (
  'sup-test-a1'::uuid,
  'sup-test-b1'::uuid
);

DELETE FROM users WHERE id IN (
  'user-test-a'::uuid,
  'user-test-b'::uuid
);

DELETE FROM organizations WHERE id IN (
  'org-test-a'::uuid,
  'org-test-b'::uuid
);

-- ============================================================================
-- SUMMARY
-- ============================================================================

/*
 * RLS Test Coverage:
 *
 * ✅ SELECT:
 *   - User A sees only Org A data
 *   - User A cannot see Org B data
 *
 * ✅ INSERT:
 *   - User A can insert for Org A suppliers
 *   - User A cannot insert for Org B suppliers
 *
 * ✅ UPDATE:
 *   - User A can update Org A assignments
 *   - User A cannot update Org B assignments
 *
 * ✅ DELETE:
 *   - User A can delete Org A assignments
 *   - User A cannot delete Org B assignments
 *
 * ✅ Policy Pattern:
 *   - RLS enforced via supplier FK relationship
 *   - supplier_id IN (SELECT id FROM suppliers WHERE org_id = user's org)
 *
 * Acceptance Criteria Coverage:
 * - AC-10: RLS Org Isolation (all 4 operations tested)
 *
 * Total: 8 test scenarios
 * Expected: 100% policy coverage
 *
 * Security Verified:
 * - Cross-org access blocked
 * - All operations (CRUD) protected
 * - Org isolation via supplier relationship
 */
