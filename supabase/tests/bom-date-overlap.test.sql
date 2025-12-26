/**
 * BOM Date Overlap Prevention - Database Trigger Tests (Story 02.4)
 * Purpose: Test PostgreSQL trigger for date overlap prevention
 * Phase: GREEN - Tests should pass with trigger implementation
 *
 * Tests the check_bom_date_overlap trigger which:
 * - Prevents overlapping date ranges for same product
 * - Prevents multiple BOMs with NULL effective_to per product
 * - Allows adjacent dates without overlap
 * - Works correctly with date ranges (inclusive)
 *
 * Coverage: 100% of trigger logic
 * Test Count: 12 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-18 to AC-20: Date overlap prevention
 */

BEGIN;

-- Setup: Create test organizations using valid UUIDs
-- Note: Using deterministic UUIDs for consistent testing
INSERT INTO organizations (id, name, slug)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Test Org', 'test-org'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Test Org 2', 'test-org-2')
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test roles (needed for user creation)
INSERT INTO roles (id, code, name, is_system)
VALUES
  ('b0000000-0000-0000-0000-000000000001'::uuid, 'ADMIN', 'Administrator', true)
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test users in auth.users first (required FK)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'test@example.com', '', NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'test2@example.com', '', NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test users
INSERT INTO users (id, email, org_id, first_name, last_name, role_id)
VALUES
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'test@example.com', 'a0000000-0000-0000-0000-000000000001'::uuid, 'Test', 'User', 'b0000000-0000-0000-0000-000000000001'::uuid),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'test2@example.com', 'a0000000-0000-0000-0000-000000000002'::uuid, 'Test2', 'User', 'b0000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test product types
INSERT INTO product_types (id, org_id, code, name)
VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'FG', 'Finished Good'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'FG', 'Finished Good')
ON CONFLICT (id) DO NOTHING;

-- Setup: Create test products
INSERT INTO products (id, org_id, code, name, product_type_id, base_uom)
VALUES
  ('e0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'FG-001', 'Honey Bread', 'd0000000-0000-0000-0000-000000000001'::uuid, 'pcs'),
  ('e0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'FG-002', 'Wheat Bread', 'd0000000-0000-0000-0000-000000000001'::uuid, 'pcs'),
  ('e0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'FG-003', 'Rye Bread', 'd0000000-0000-0000-0000-000000000002'::uuid, 'pcs')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST SCENARIOS
-- ============================================

-- TEST 1: Date overlap detection - overlapping ranges (SHOULD FAIL)
-- BOM v1: 2024-01-01 to 2024-06-30
-- BOM v2: 2024-04-01 to 2024-12-31 (OVERLAPS) - SHOULD RAISE EXCEPTION
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000001'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 2,
    '2024-04-01', '2024-12-31',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- If we reach here, test FAILED (no exception raised)
  RAISE EXCEPTION 'TEST-01 FAILED: Date overlap not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-01 PASSED: Date overlap prevented';
  ELSE
    RAISE EXCEPTION 'TEST-01 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 2: Adjacent dates allowed (NO OVERLAP) - SHOULD SUCCEED
-- BOM v1: 2024-01-01 to 2024-06-30
-- BOM v2: 2024-07-01 to 2024-12-31 (ADJACENT, NOT OVERLAPPING)
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000002'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should succeed (no overlap)
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 2,
    '2024-07-01', '2024-12-31',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE NOTICE 'TEST-02 PASSED: Adjacent dates allowed';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'TEST-02 FAILED: Adjacent dates rejected - %', SQLERRM;
END $$;

-- TEST 3: Multiple NULL effective_to (SHOULD FAIL)
-- BOM v1: 2024-01-01 to NULL (ongoing)
-- BOM v2: 2024-02-01 to NULL (DUPLICATE ONGOING) - SHOULD RAISE EXCEPTION
DO $$
DECLARE
  v_bom_id UUID;
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000001'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', NULL,
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  ) RETURNING id INTO v_bom_id;

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 2,
    '2024-02-01', NULL,
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-03 FAILED: Multiple NULL effective_to not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Only one BOM can have no end date%' THEN
    RAISE NOTICE 'TEST-03 PASSED: Multiple NULL effective_to prevented';
  ELSE
    RAISE EXCEPTION 'TEST-03 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 4: Partial overlap at start (SHOULD FAIL)
-- BOM v1: 2024-03-01 to 2024-06-30
-- BOM v2: 2024-01-01 to 2024-05-01 (OVERLAPS AT MIDDLE) - SHOULD RAISE EXCEPTION
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000002'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 1,
    '2024-03-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 2,
    '2024-01-01', '2024-05-01',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-04 FAILED: Partial overlap at start not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-04 PASSED: Partial overlap at start prevented';
  ELSE
    RAISE EXCEPTION 'TEST-04 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 5: Partial overlap at end (SHOULD FAIL)
-- BOM v1: 2024-01-01 to 2024-06-30
-- BOM v2: 2024-05-01 to 2024-12-31 (OVERLAPS AT END) - SHOULD RAISE EXCEPTION
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000001'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 2,
    '2024-05-01', '2024-12-31',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-05 FAILED: Partial overlap at end not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-05 PASSED: Partial overlap at end prevented';
  ELSE
    RAISE EXCEPTION 'TEST-05 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 6: Exact date match (SHOULD FAIL)
-- BOM v1: 2024-01-01 to 2024-06-30
-- BOM v2: 2024-01-01 to 2024-06-30 (EXACT MATCH) - SHOULD RAISE EXCEPTION
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000002'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 2,
    '2024-01-01', '2024-06-30',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-06 FAILED: Exact date match not detected as overlap';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-06 PASSED: Exact date match prevented';
  ELSE
    RAISE EXCEPTION 'TEST-06 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 7: Nested date range (SHOULD FAIL)
-- BOM v1: 2024-01-01 to 2024-12-31
-- BOM v2: 2024-03-01 to 2024-09-01 (NESTED INSIDE) - SHOULD RAISE EXCEPTION
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000001'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', '2024-12-31',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 2,
    '2024-03-01', '2024-09-01',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-07 FAILED: Nested date range not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-07 PASSED: Nested date range prevented';
  ELSE
    RAISE EXCEPTION 'TEST-07 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 8: NULL effective_to with existing range (SHOULD FAIL)
-- BOM v1: 2024-01-01 to 2024-06-30
-- BOM v2: 2024-02-01 to NULL (OVERLAPS WITH ONGOING) - SHOULD RAISE EXCEPTION
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000002'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should fail
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 2,
    '2024-02-01', NULL,
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-08 FAILED: NULL effective_to overlap not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-08 PASSED: NULL effective_to overlap prevented';
  ELSE
    RAISE EXCEPTION 'TEST-08 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 9: Cross-organization isolation (should succeed)
-- BOM in Org A: 2024-01-01 to 2024-06-30
-- BOM in Org B: 2024-01-01 to 2024-06-30 (SAME DATES BUT DIFFERENT ORG - OK)
DO $$
BEGIN
  DELETE FROM boms WHERE org_id = 'a0000000-0000-0000-0000-000000000001'::uuid AND product_id IN ('e0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid);
  DELETE FROM boms WHERE org_id = 'a0000000-0000-0000-0000-000000000002'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- This insert should succeed (different org)
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000002'::uuid, 'e0000000-0000-0000-0000-000000000003'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid
  );

  RAISE NOTICE 'TEST-09 PASSED: Cross-organization isolation works';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'TEST-09 FAILED: Cross-org BOM rejected - %', SQLERRM;
END $$;

-- TEST 10: Update with overlap (SHOULD FAIL)
-- BOM v1 exists: 2024-01-01 to 2024-06-30
-- BOM v2 exists: 2024-07-01 to 2024-12-31
-- Update v1 to extend to 2024-07-15 (OVERLAPS WITH v2) - SHOULD RAISE EXCEPTION
DO $$
DECLARE
  v_bom1_id UUID;
  v_bom2_id UUID;
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000001'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', '2024-06-30',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  ) RETURNING id INTO v_bom1_id;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 2,
    '2024-07-01', '2024-12-31',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  ) RETURNING id INTO v_bom2_id;

  -- Try to update v1 to extend into v2 range
  UPDATE boms
  SET effective_to = '2024-07-15'
  WHERE id = v_bom1_id;

  RAISE EXCEPTION 'TEST-10 FAILED: Update overlap not detected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-10 PASSED: Update overlap prevented';
  ELSE
    RAISE EXCEPTION 'TEST-10 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- TEST 11: Single-day BOM (SHOULD SUCCEED)
-- BOM v1: 2024-01-01 to 2024-01-01 (single day)
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000002'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 1,
    '2024-01-01', '2024-01-01',
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE NOTICE 'TEST-11 PASSED: Single-day BOM allowed';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'TEST-11 FAILED: Single-day BOM rejected - %', SQLERRM;
END $$;

-- TEST 12: BOM with no end date followed by dated BOM (SHOULD FAIL)
-- BOM v1: 2024-01-01 to NULL (ongoing)
-- BOM v2: 2024-02-01 to 2024-12-31 (OVERLAPS with ongoing - SHOULD FAIL)
DO $$
BEGIN
  DELETE FROM boms WHERE product_id = 'e0000000-0000-0000-0000-000000000001'::uuid;

  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 1,
    '2024-01-01', NULL,
    'active', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  -- Adding a dated BOM after ongoing should fail (overlaps)
  INSERT INTO boms (
    org_id, product_id, version, effective_from, effective_to,
    status, output_qty, output_uom, created_by, updated_by
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 2,
    '2024-02-01', '2024-12-31',
    'draft', 100, 'kg', 'c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid
  );

  RAISE EXCEPTION 'TEST-12 FAILED: Dated BOM after ongoing should fail';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Date range overlaps%' THEN
    RAISE NOTICE 'TEST-12 PASSED: Dated BOM after ongoing correctly rejected (overlaps)';
  ELSE
    RAISE EXCEPTION 'TEST-12 FAILED: Wrong error - %', SQLERRM;
  END IF;
END $$;

-- Cleanup
DELETE FROM boms WHERE org_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM products WHERE org_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM product_types WHERE org_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM users WHERE org_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM auth.users WHERE id IN ('c0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM roles WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM organizations WHERE id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);

COMMIT;

-- Expected test output:
-- TEST-01 PASSED: Date overlap prevented
-- TEST-02 PASSED: Adjacent dates allowed
-- TEST-03 PASSED: Multiple NULL effective_to prevented
-- TEST-04 PASSED: Partial overlap at start prevented
-- TEST-05 PASSED: Partial overlap at end prevented
-- TEST-06 PASSED: Exact date match prevented
-- TEST-07 PASSED: Nested date range prevented
-- TEST-08 PASSED: NULL effective_to overlap prevented
-- TEST-09 PASSED: Cross-organization isolation works
-- TEST-10 PASSED: Update overlap prevented
-- TEST-11 PASSED: Single-day BOM allowed
-- TEST-12 PASSED: Dated BOM after ongoing correctly rejected (overlaps)
