-- RLS Tests for routing_operations table
-- Story: 02.8 - Routing Operations Management
-- Date: 2025-12-28
-- Purpose: Verify multi-tenant isolation and role-based access control

-- =============================================================================
-- SETUP: Test environment
-- =============================================================================

-- This test uses pgTAP framework
-- Run with: pg_prove -d your_database tests/routing_operations_rls.test.sql

BEGIN;
SELECT plan(12);

-- =============================================================================
-- SETUP: Create test organizations and users
-- =============================================================================

-- Note: In real test, these would be inserted or mocked
-- This is a template for RLS testing

-- Test 1: RLS is enabled on routing_operations table
SELECT ok(
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'routing_operations'),
  'RLS is enabled on routing_operations table'
);

-- Test 2: SELECT policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'routing_operations'
    AND policyname = 'routing_operations_select'
  ),
  'SELECT policy exists'
);

-- Test 3: INSERT policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'routing_operations'
    AND policyname = 'routing_operations_insert'
  ),
  'INSERT policy exists'
);

-- Test 4: UPDATE policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'routing_operations'
    AND policyname = 'routing_operations_update'
  ),
  'UPDATE policy exists'
);

-- Test 5: DELETE policy exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'routing_operations'
    AND policyname = 'routing_operations_delete'
  ),
  'DELETE policy exists'
);

-- =============================================================================
-- CONSTRAINT TESTS
-- =============================================================================

-- Test 6: Positive sequence constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'routing_operations'
    AND constraint_name = 'routing_operations_sequence_positive'
  ),
  'Positive sequence constraint exists'
);

-- Test 7: Positive duration constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'routing_operations'
    AND constraint_name = 'routing_operations_duration_positive'
  ),
  'Positive duration constraint exists'
);

-- Test 8: Positive setup time constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'routing_operations'
    AND constraint_name = 'routing_operations_setup_positive'
  ),
  'Positive setup time constraint exists'
);

-- Test 9: Positive cleanup time constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'routing_operations'
    AND constraint_name = 'routing_operations_cleanup_positive'
  ),
  'Positive cleanup time constraint exists'
);

-- Test 10: Positive labor cost constraint exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'routing_operations'
    AND constraint_name = 'routing_operations_labor_cost_positive'
  ),
  'Positive labor cost constraint exists'
);

-- =============================================================================
-- INDEX TESTS
-- =============================================================================

-- Test 11: Routing ID index exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'routing_operations'
    AND indexname = 'idx_routing_operations_routing_id'
  ),
  'Routing ID index exists'
);

-- Test 12: Routing + sequence composite index exists
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'routing_operations'
    AND indexname = 'idx_routing_operations_routing_seq'
  ),
  'Routing + sequence composite index exists'
);

-- =============================================================================
-- PARALLEL OPERATIONS TEST (no unique constraint)
-- =============================================================================

-- Note: This test verifies that duplicate sequences are ALLOWED (FR-2.48)
-- In a full test, you would:
-- 1. Insert two operations with same routing_id and sequence
-- 2. Verify both are inserted successfully (no unique violation)

-- Example (run manually with test data):
-- INSERT INTO routing_operations (routing_id, sequence, operation_name, expected_duration_minutes)
-- VALUES
--   ('test-routing-uuid', 2, 'Mixing', 15),
--   ('test-routing-uuid', 2, 'Heating', 10);
-- -- Should succeed (no unique constraint on sequence)

-- =============================================================================
-- CROSS-TENANT ISOLATION TEST TEMPLATE
-- =============================================================================

-- To test cross-tenant isolation:
--
-- 1. Create two test organizations: org-a, org-b
-- 2. Create users in each org
-- 3. Create routings in each org
-- 4. Create operations in each routing
-- 5. Set role to authenticated and set JWT to user from org-a
-- 6. Verify SELECT only returns org-a operations
-- 7. Verify INSERT to org-b routing fails
-- 8. Verify UPDATE on org-b operation fails
-- 9. Verify DELETE on org-b operation fails

-- Example test (requires test data):
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "user-a-id"}';
-- SELECT * FROM routing_operations;
-- -- Should only return operations for routings in org-a

-- =============================================================================
-- CLEANUP
-- =============================================================================

SELECT * FROM finish();
ROLLBACK;

-- =============================================================================
-- MANUAL CROSS-TENANT TESTS (run these with actual test data)
-- =============================================================================
--
-- -- Setup test data
-- INSERT INTO organizations (id, name, slug) VALUES
--   ('org-a-uuid', 'Organization A', 'org-a'),
--   ('org-b-uuid', 'Organization B', 'org-b');
--
-- INSERT INTO roles (id, code, name, permissions) VALUES
--   ('role-admin', 'admin', 'Admin', '{"technical":"CRUD"}'::jsonb);
--
-- INSERT INTO users (id, org_id, role_id, email) VALUES
--   ('user-a-uuid', 'org-a-uuid', 'role-admin', 'user-a@example.com'),
--   ('user-b-uuid', 'org-b-uuid', 'role-admin', 'user-b@example.com');
--
-- INSERT INTO routings (id, org_id, code, name, version) VALUES
--   ('routing-a-uuid', 'org-a-uuid', 'RTG-A-001', 'Routing A', 1),
--   ('routing-b-uuid', 'org-b-uuid', 'RTG-B-001', 'Routing B', 1);
--
-- INSERT INTO routing_operations (id, routing_id, sequence, operation_name, expected_duration_minutes) VALUES
--   ('op-a-uuid', 'routing-a-uuid', 1, 'Operation A', 30),
--   ('op-b-uuid', 'routing-b-uuid', 1, 'Operation B', 30);
--
-- -- Test 1: User A can only see Org A operations
-- SET ROLE authenticated;
-- -- (In real test, set auth.uid() to user-a-uuid)
-- SELECT * FROM routing_operations;
-- -- Expected: Only op-a-uuid returned
--
-- -- Test 2: User A cannot insert into Org B routing
-- INSERT INTO routing_operations (routing_id, sequence, operation_name, expected_duration_minutes)
-- VALUES ('routing-b-uuid', 2, 'Hack Operation', 10);
-- -- Expected: RLS policy violation error
--
-- -- Test 3: User A cannot update Org B operation
-- UPDATE routing_operations SET operation_name = 'Hacked' WHERE id = 'op-b-uuid';
-- -- Expected: 0 rows updated (RLS blocks)
--
-- -- Test 4: User A cannot delete Org B operation
-- DELETE FROM routing_operations WHERE id = 'op-b-uuid';
-- -- Expected: 0 rows deleted (RLS blocks)
