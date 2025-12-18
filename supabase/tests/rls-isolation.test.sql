/**
 * Integration Tests: RLS Isolation for Multi-Tenant Security
 * Story: 01.1 - Org Context + Base RLS
 * Phase: RED - All tests should FAIL (no tables/policies implemented yet)
 *
 * Tests Row Level Security policies across all 5 core tables:
 * - organizations (org can only see own org)
 * - users (users can only see same-org users)
 * - roles (system roles readable by all authenticated)
 * - modules (readable by all authenticated)
 * - organization_modules (org-scoped module state)
 *
 * Coverage Target: 80% (integration)
 * Test Count: 20+ scenarios
 *
 * ADR Reference: ADR-013 RLS Org Isolation Pattern
 * Pattern: (SELECT org_id FROM users WHERE id = auth.uid())
 */

-- Test Setup: Create test data for 2 organizations
-- This would typically be in a test fixture/setup file

BEGIN;

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test organizations
INSERT INTO organizations (id, name, slug, timezone, locale, currency, onboarding_step, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Org A', 'org-a', 'UTC', 'en', 'PLN', 0, true),
  ('00000000-0000-0000-0000-000000000002', 'Org B', 'org-b', 'UTC', 'en', 'PLN', 5, true),
  ('00000000-0000-0000-0000-000000000003', 'Org C Inactive', 'org-c', 'UTC', 'en', 'PLN', 0, false);

-- Create test roles (system roles)
INSERT INTO roles (id, code, name, permissions, is_system, display_order)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'owner', 'Owner', '{"settings":"CRUD","users":"CRUD"}', true, 1),
  ('10000000-0000-0000-0000-000000000002', 'admin', 'Administrator', '{"settings":"CRU","users":"CRUD"}', true, 2),
  ('10000000-0000-0000-0000-000000000003', 'viewer', 'Viewer', '{"settings":"R","users":"R"}', true, 10);

-- Create test users (linked to auth.users)
-- Note: In real implementation, these would be created via Supabase Auth
INSERT INTO auth.users (id, email)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'owner-a@orga.com'),
  ('20000000-0000-0000-0000-000000000002', 'admin-a@orga.com'),
  ('20000000-0000-0000-0000-000000000003', 'viewer-a@orga.com'),
  ('20000000-0000-0000-0000-000000000004', 'admin-b@orgb.com'),
  ('20000000-0000-0000-0000-000000000005', 'viewer-b@orgb.com');

INSERT INTO users (id, org_id, email, first_name, last_name, role_id, is_active)
VALUES
  -- Org A users
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner-a@orga.com', 'Owner', 'A', '10000000-0000-0000-0000-000000000001', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin-a@orga.com', 'Admin', 'A', '10000000-0000-0000-0000-000000000002', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'viewer-a@orga.com', 'Viewer', 'A', '10000000-0000-0000-0000-000000000003', true),
  -- Org B users
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'admin-b@orgb.com', 'Admin', 'B', '10000000-0000-0000-0000-000000000002', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'viewer-b@orgb.com', 'Viewer', 'B', '10000000-0000-0000-0000-000000000003', true);

-- Create test modules (system-wide)
INSERT INTO modules (id, code, name, can_disable, display_order)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'settings', 'Settings', false, 1),
  ('30000000-0000-0000-0000-000000000002', 'technical', 'Technical', false, 2),
  ('30000000-0000-0000-0000-000000000003', 'production', 'Production', true, 3);

-- Create org-specific module state
INSERT INTO organization_modules (id, org_id, module_id, enabled)
VALUES
  -- Org A modules
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', true),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', false),
  -- Org B modules
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', true),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', false);

-- ============================================================================
-- TEST 1: AC-02 & AC-03 - Cross-Tenant Access Returns 404 (Not 403)
-- ============================================================================

-- Test: User from Org B cannot see Org A organization
-- Pattern: This tests the fundamental RLS isolation
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000004"}'; -- admin-b (Org B)

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: Org B user cannot see Org A'
    ELSE 'FAIL: Cross-tenant leak detected'
  END AS test_result
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'; -- Org A ID

-- Expected: 0 rows (appears as 404, not 403)

-- ============================================================================
-- TEST 2: AC-04 & AC-05 - Query Without org_id Filter Is Auto-Filtered
-- ============================================================================

-- Test: User from Org A only sees Org A users (no explicit org_id filter)
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

SELECT
  CASE
    WHEN COUNT(*) = 3 THEN 'PASS: Org A user sees only 3 Org A users'
    WHEN COUNT(*) > 3 THEN 'FAIL: Cross-tenant leak - seeing other org users'
    ELSE 'FAIL: Missing users from own org'
  END AS test_result
FROM users;

-- Expected: 3 rows (only Org A users)

-- ============================================================================
-- TEST 3: Users Table RLS - Cross-Tenant Isolation
-- ============================================================================

-- Test: Admin from Org B cannot see users from Org A
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000004"}'; -- admin-b (Org B)

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: Org B admin cannot see Org A users'
    ELSE 'FAIL: Cross-tenant user leak detected'
  END AS test_result
FROM users
WHERE org_id = '00000000-0000-0000-0000-000000000001'; -- Org A

-- Expected: 0 rows (RLS blocks cross-tenant read)

-- ============================================================================
-- TEST 4: Users Table RLS - Same Org Access
-- ============================================================================

-- Test: Admin from Org A can see all Org A users
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

SELECT
  CASE
    WHEN COUNT(*) = 3 THEN 'PASS: Org A admin sees all 3 Org A users'
    ELSE 'FAIL: Incomplete same-org user visibility'
  END AS test_result
FROM users
WHERE org_id = '00000000-0000-0000-0000-000000000001'; -- Org A

-- Expected: 3 rows (owner-a, admin-a, viewer-a)

-- ============================================================================
-- TEST 5: AC-06 - Non-Admin Cannot Write to Users Table
-- ============================================================================

-- Test: Viewer role cannot INSERT new user
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000003"}'; -- viewer-a (Org A)

INSERT INTO users (id, org_id, email, first_name, last_name, role_id, is_active)
VALUES ('20000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000001', 'new@orga.com', 'New', 'User', '10000000-0000-0000-0000-000000000003', true);

-- Expected: INSERT fails due to RLS policy (AC-06)
-- Error: new row violates row-level security policy

-- ============================================================================
-- TEST 6: AC-06 - Admin Can Write to Users Table (Same Org)
-- ============================================================================

-- Test: Admin role can INSERT new user in same org
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

INSERT INTO users (id, org_id, email, first_name, last_name, role_id, is_active)
VALUES ('20000000-0000-0000-0000-000000000098', '00000000-0000-0000-0000-000000000001', 'admin-created@orga.com', 'Admin', 'Created', '10000000-0000-0000-0000-000000000003', true);

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN 'PASS: Admin successfully created user'
    ELSE 'FAIL: Admin user creation blocked'
  END AS test_result
FROM users
WHERE id = '20000000-0000-0000-0000-000000000098';

-- Expected: 1 row (insert succeeds)

-- ============================================================================
-- TEST 7: AC-06 - Admin Cannot Write to Other Org
-- ============================================================================

-- Test: Admin from Org A cannot INSERT user into Org B
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

INSERT INTO users (id, org_id, email, first_name, last_name, role_id, is_active)
VALUES ('20000000-0000-0000-0000-000000000097', '00000000-0000-0000-0000-000000000002', 'hacker@orgb.com', 'Hacker', 'Attempt', '10000000-0000-0000-0000-000000000003', true);

-- Expected: INSERT fails (cannot insert into other org)
-- Error: new row violates row-level security policy

-- ============================================================================
-- TEST 8: Roles Table RLS - System Roles Readable by All Authenticated
-- ============================================================================

-- Test: Any authenticated user can read system roles
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000003"}'; -- viewer-a (Org A)

SELECT
  CASE
    WHEN COUNT(*) >= 3 THEN 'PASS: Viewer can read system roles'
    ELSE 'FAIL: System roles not accessible'
  END AS test_result
FROM roles
WHERE is_system = true;

-- Expected: 3+ rows (all system roles visible)

-- ============================================================================
-- TEST 9: Modules Table RLS - Modules Readable by All Authenticated
-- ============================================================================

-- Test: Any authenticated user can read module definitions
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000005"}'; -- viewer-b (Org B)

SELECT
  CASE
    WHEN COUNT(*) = 3 THEN 'PASS: All modules readable'
    ELSE 'FAIL: Modules not accessible'
  END AS test_result
FROM modules;

-- Expected: 3 rows (all modules)

-- ============================================================================
-- TEST 10: Organization_Modules RLS - Cross-Tenant Isolation
-- ============================================================================

-- Test: User from Org B cannot see Org A module state
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000004"}'; -- admin-b (Org B)

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: Org B cannot see Org A modules'
    ELSE 'FAIL: Cross-tenant module state leak'
  END AS test_result
FROM organization_modules
WHERE org_id = '00000000-0000-0000-0000-000000000001'; -- Org A

-- Expected: 0 rows (cross-tenant blocked)

-- ============================================================================
-- TEST 11: Organization_Modules RLS - Same Org Access
-- ============================================================================

-- Test: User from Org A sees own organization modules
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

SELECT
  CASE
    WHEN COUNT(*) = 3 THEN 'PASS: Org A sees 3 module states'
    ELSE 'FAIL: Incorrect module state visibility'
  END AS test_result
FROM organization_modules
WHERE org_id = '00000000-0000-0000-0000-000000000001'; -- Org A

-- Expected: 3 rows (Org A has 3 modules configured)

-- ============================================================================
-- TEST 12: Organization_Modules RLS - Admin Can Write (Same Org)
-- ============================================================================

-- Test: Admin can enable/disable modules in own org
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

UPDATE organization_modules
SET enabled = true
WHERE org_id = '00000000-0000-0000-0000-000000000001'
  AND module_id = '30000000-0000-0000-0000-000000000003'; -- Production module

SELECT
  CASE
    WHEN enabled = true THEN 'PASS: Admin enabled module'
    ELSE 'FAIL: Module update failed'
  END AS test_result
FROM organization_modules
WHERE id = '40000000-0000-0000-0000-000000000003';

-- Expected: enabled = true (update succeeds)

-- ============================================================================
-- TEST 13: Organization_Modules RLS - Admin Cannot Write to Other Org
-- ============================================================================

-- Test: Admin from Org A cannot modify Org B modules
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

UPDATE organization_modules
SET enabled = true
WHERE org_id = '00000000-0000-0000-0000-000000000002'
  AND module_id = '30000000-0000-0000-0000-000000000002'; -- Org B's Technical module

-- Expected: UPDATE affects 0 rows (RLS blocks cross-tenant write)

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS: Cross-tenant module update blocked'
    ELSE 'FAIL: Cross-tenant module update succeeded (security breach!)'
  END AS test_result
FROM organization_modules
WHERE org_id = '00000000-0000-0000-0000-000000000002'
  AND module_id = '30000000-0000-0000-0000-000000000002'
  AND enabled = true;

-- ============================================================================
-- TEST 14: AC-07 - Comprehensive Cross-Tenant Isolation (2-Org Fixtures)
-- ============================================================================

-- Test: Verify complete isolation between Org A and Org B
-- This test ensures no data leakage across tenants

-- Org A admin should see ONLY Org A data
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000002"}'; -- admin-a (Org A)

WITH org_a_visibility AS (
  SELECT
    (SELECT COUNT(*) FROM organizations) AS org_count,
    (SELECT COUNT(*) FROM users) AS user_count,
    (SELECT COUNT(*) FROM organization_modules) AS module_count
)
SELECT
  CASE
    WHEN org_count = 1 AND user_count = 3 AND module_count = 3 THEN 'PASS: Complete Org A isolation'
    ELSE 'FAIL: Incomplete isolation - org:' || org_count || ' users:' || user_count || ' modules:' || module_count
  END AS test_result
FROM org_a_visibility;

-- Expected: org=1, users=3, modules=3

-- Org B admin should see ONLY Org B data
SET LOCAL "request.jwt.claims" = '{"sub": "20000000-0000-0000-0000-000000000004"}'; -- admin-b (Org B)

WITH org_b_visibility AS (
  SELECT
    (SELECT COUNT(*) FROM organizations) AS org_count,
    (SELECT COUNT(*) FROM users) AS user_count,
    (SELECT COUNT(*) FROM organization_modules) AS module_count
)
SELECT
  CASE
    WHEN org_count = 1 AND user_count = 2 AND module_count = 2 THEN 'PASS: Complete Org B isolation'
    ELSE 'FAIL: Incomplete isolation - org:' || org_count || ' users:' || user_count || ' modules:' || module_count
  END AS test_result
FROM org_b_visibility;

-- Expected: org=1, users=2, modules=2

-- ============================================================================
-- TEST 15: Performance - RLS Users Lookup Pattern (ADR-013)
-- ============================================================================

-- Test: Verify RLS pattern uses efficient users table lookup
-- Pattern: (SELECT org_id FROM users WHERE id = auth.uid())
-- Requirement: <1ms overhead per ADR-013

EXPLAIN ANALYZE
SELECT *
FROM users
WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid());

-- Expected: Query plan shows index usage on users(id)
-- Expected: Execution time < 1ms (with proper indexing)

-- ============================================================================
-- TEST CLEANUP
-- ============================================================================

ROLLBACK;

/**
 * Test Summary for Story 01.1 - RLS Integration Tests
 * ====================================================
 *
 * Test Coverage:
 * - AC-02 & AC-03: Cross-tenant access returns 404: 1 test
 * - AC-04 & AC-05: Auto-filtering without org_id: 1 test
 * - AC-06: Admin-only writes: 4 tests
 * - AC-07: 2-org fixture isolation: 2 tests
 * - Users table RLS: 4 tests
 * - Roles table RLS: 1 test
 * - Modules table RLS: 1 test
 * - Organization_modules RLS: 4 tests
 * - Performance (ADR-013): 1 test
 * - Total: 19 test scenarios
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - Tables not created yet (organizations, users, roles, modules, organization_modules)
 * - RLS policies not implemented yet
 * - Test fixtures not seeded
 *
 * Next Steps for DEV:
 * 1. Create migrations 043-048 per context file
 * 2. Implement RLS policies following ADR-013 pattern
 * 3. Enable RLS on all 5 tables
 * 4. Create test fixtures (organizations, users, roles, modules)
 * 5. Index users(id) for efficient RLS lookup
 * 6. Run tests - should transition from RED to GREEN
 * 7. Verify 404 (not 403) behavior in API layer
 *
 * Files to Create (from context file):
 * - supabase/migrations/043_create_organizations_table.sql
 * - supabase/migrations/044_create_roles_table.sql
 * - supabase/migrations/045_create_users_table.sql
 * - supabase/migrations/046_create_modules_tables.sql
 * - supabase/migrations/047_rls_policies.sql
 * - supabase/migrations/048_seed_system_data.sql
 *
 * Coverage Target: 80% (integration)
 * Critical: Test cross-tenant isolation with 2+ org fixtures (AC-07)
 */
