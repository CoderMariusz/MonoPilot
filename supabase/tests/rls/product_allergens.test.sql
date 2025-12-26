/**
 * RLS Policy Tests: product_allergens Table
 * Story: 02.3 - Product Allergens Declaration
 * Phase: RED - Tests will fail until RLS policies are implemented
 *
 * Tests Row-Level Security policies for product_allergens table:
 * - Organization isolation (users can only access own org's allergens)
 * - Cross-tenant access blocked
 * - Source field tracking (auto vs manual)
 * - Unique constraint (product_id, allergen_id, relation_type)
 * - Reason field validation for may_contain
 *
 * Coverage Target: 100% (all RLS policies must be tested)
 * Test Count: 15 tests
 *
 * Acceptance Criteria Coverage:
 * - RLS-001: Organization isolation
 * - AC-23: Cross-tenant access returns 404 (not 403)
 * - Database constraints validation
 */

BEGIN;

-- Setup test environment
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(15);

-- ============================================================================
-- Test 1: User can only read own organization product allergens
-- ============================================================================
SELECT results_eq(
  $$
    SELECT COUNT(*)::integer
    FROM product_allergens
    WHERE org_id = 'org-a'
  $$,
  $$
    VALUES (3)
  $$,
  'User A can read product allergens from Org A'
);

-- ============================================================================
-- Test 2: User cannot read other organization product allergens
-- ============================================================================
SELECT results_eq(
  $$
    SELECT COUNT(*)::integer
    FROM product_allergens
    WHERE org_id = 'org-b'
  $$,
  $$
    VALUES (0)
  $$,
  'User A cannot read product allergens from Org B (RLS blocks)'
);

-- ============================================================================
-- Test 3: User can create product allergen in own org
-- ============================================================================
SELECT results_eq(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source,
      created_by
    )
    VALUES (
      'org-a',
      'prod-a-001',
      'allergen-a01',
      'contains',
      'manual',
      'user-a-001'
    )
    RETURNING org_id
  $$,
  $$
    VALUES ('org-a')
  $$,
  'User A can create product allergen in Org A'
);

-- ============================================================================
-- Test 4: User cannot create product allergen in other org
-- ============================================================================
SELECT throws_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source
    )
    VALUES (
      'org-b',
      'prod-b-001',
      'allergen-a01',
      'contains',
      'manual'
    )
  $$,
  'RLS policy violation',
  'User A cannot create product allergen in Org B (RLS blocks)'
);

-- ============================================================================
-- Test 5: User can update own organization product allergen
-- ============================================================================
SELECT results_eq(
  $$
    UPDATE product_allergens
    SET reason = 'Updated reason for cross-contamination'
    WHERE id = 'pa-a-001'
    RETURNING id
  $$,
  $$
    VALUES ('pa-a-001')
  $$,
  'User A can update product allergen in Org A'
);

-- ============================================================================
-- Test 6: User cannot update other organization product allergen
-- ============================================================================
SELECT results_eq(
  $$
    UPDATE product_allergens
    SET reason = 'Hacked reason'
    WHERE id = 'pa-b-001'
    RETURNING id
  $$,
  $$
    VALUES (NULL::uuid)
  $$,
  'User A cannot update product allergen in Org B (RLS blocks, 0 rows affected)'
);

-- ============================================================================
-- Test 7: User can delete own organization product allergen
-- ============================================================================
SELECT results_eq(
  $$
    DELETE FROM product_allergens
    WHERE id = 'pa-a-002'
    RETURNING id
  $$,
  $$
    VALUES ('pa-a-002')
  $$,
  'User A can delete product allergen in Org A'
);

-- ============================================================================
-- Test 8: User cannot delete other organization product allergen
-- ============================================================================
SELECT results_eq(
  $$
    DELETE FROM product_allergens
    WHERE id = 'pa-b-002'
    RETURNING id
  $$,
  $$
    VALUES (NULL::uuid)
  $$,
  'User A cannot delete product allergen in Org B (RLS blocks, 0 rows affected)'
);

-- ============================================================================
-- Test 9: Unique constraint prevents duplicate (product_id, allergen_id, relation_type)
-- ============================================================================
SELECT throws_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source
    )
    VALUES (
      'org-a',
      'prod-a-001',
      'allergen-a01',
      'contains',
      'manual'
    ),
    (
      'org-a',
      'prod-a-001',
      'allergen-a01',
      'contains',
      'manual'
    )
  $$,
  '23505', -- Unique violation error code
  'Duplicate product_id + allergen_id + relation_type prevented by unique constraint'
);

-- ============================================================================
-- Test 10: Same allergen allowed with different relation_type
-- ============================================================================
SELECT lives_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source
    )
    VALUES (
      'org-a',
      'prod-a-003',
      'allergen-a01',
      'contains',
      'manual'
    ),
    (
      'org-a',
      'prod-a-003',
      'allergen-a01',
      'may_contain',
      'manual'
    )
  $$,
  'Same allergen can be declared with both contains and may_contain'
);

-- ============================================================================
-- Test 11: Source field only accepts auto or manual
-- ============================================================================
SELECT throws_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source
    )
    VALUES (
      'org-a',
      'prod-a-004',
      'allergen-a01',
      'contains',
      'invalid_source'
    )
  $$,
  '23514', -- Check constraint violation
  'Source field only accepts auto or manual'
);

-- ============================================================================
-- Test 12: Relation type only accepts contains or may_contain
-- ============================================================================
SELECT throws_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source
    )
    VALUES (
      'org-a',
      'prod-a-005',
      'allergen-a01',
      'invalid_relation',
      'manual'
    )
  $$,
  '23514', -- Check constraint violation
  'Relation type only accepts contains or may_contain'
);

-- ============================================================================
-- Test 13: Source product IDs array column exists and accepts UUIDs
-- ============================================================================
SELECT has_column(
  'product_allergens',
  'source_product_ids',
  'product_allergens has source_product_ids array column'
);

SELECT lives_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source,
      source_product_ids
    )
    VALUES (
      'org-a',
      'prod-a-006',
      'allergen-a01',
      'contains',
      'auto',
      ARRAY['550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid]
    )
  $$,
  'source_product_ids accepts array of UUIDs'
);

-- ============================================================================
-- Test 14: Reason field exists and accepts text
-- ============================================================================
SELECT has_column(
  'product_allergens',
  'reason',
  'product_allergens has reason column'
);

SELECT lives_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source,
      reason
    )
    VALUES (
      'org-a',
      'prod-a-007',
      'allergen-a05',
      'may_contain',
      'manual',
      'Shared production line with peanut products'
    )
  $$,
  'Reason field accepts text for may_contain allergens'
);

-- ============================================================================
-- Test 15: Allergen table reference (from 01.12) - foreign key constraint
-- ============================================================================
SELECT throws_ok(
  $$
    INSERT INTO product_allergens (
      org_id,
      product_id,
      allergen_id,
      relation_type,
      source
    )
    VALUES (
      'org-a',
      'prod-a-008',
      'non-existent-allergen',
      'contains',
      'manual'
    )
  $$,
  '23503', -- Foreign key violation
  'allergen_id must reference existing allergen from allergens table (01.12)'
);

-- Finish tests
SELECT * FROM finish();
ROLLBACK;

/**
 * Test Coverage Summary:
 *
 * ✅ Organization Isolation (Tests 1-8):
 *   - User can only read own org allergens
 *   - User cannot read other org allergens (RLS blocks, returns 0 rows)
 *   - User can only create in own org
 *   - User cannot create in other org (RLS throws error)
 *   - User can only update own org allergens
 *   - User cannot update other org allergens (0 rows affected)
 *   - User can only delete own org allergens
 *   - User cannot delete other org allergens (0 rows affected)
 *
 * ✅ Unique Constraints (Tests 9-10):
 *   - Duplicate (product_id, allergen_id, relation_type) prevented
 *   - Same allergen allowed with different relation_type
 *
 * ✅ Check Constraints (Tests 11-12):
 *   - Source field only accepts 'auto' or 'manual'
 *   - Relation type only accepts 'contains' or 'may_contain'
 *
 * ✅ Column Validation (Tests 13-14):
 *   - source_product_ids array column exists and accepts UUIDs
 *   - Reason field exists and accepts text
 *
 * ✅ Foreign Key Constraints (Test 15):
 *   - allergen_id must reference allergens table (from 01.12)
 *
 * Total: 15 tests covering all RLS and database constraints
 * Status: RED (RLS policies and migration not implemented yet)
 *
 * RISK Mitigation:
 * - RISK-04: Cross-tenant data leakage prevented by RLS tests with multi-org fixtures
 * - RISK-03: Missing EU 14 allergens checked by foreign key test
 */
