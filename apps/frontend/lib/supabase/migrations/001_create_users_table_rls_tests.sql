-- RLS Policy Test Script for users table
-- Story: 1.2 User Management - CRUD
-- Date: 2025-11-20
--
-- This script contains test queries to verify Row Level Security policies
-- on the public.users table. These tests should be run manually against
-- the Supabase database to ensure multi-tenancy isolation is working correctly.
--
-- IMPORTANT: Do not run this script as a migration!
-- This is for manual testing only.

-- ============================================================================
-- TEST SETUP
-- ============================================================================

-- Assumptions:
-- 1. Organizations table exists with at least 2 orgs: org_a and org_b
-- 2. Auth users exist with JWT claims containing org_id
-- 3. Test users belong to different organizations

-- ============================================================================
-- TEST 1: SELECT Policy - Org Isolation
-- ============================================================================

-- Test: User from org_a should only see users from org_a
-- Expected: Only users with org_id = org_a visible
-- Policy: users_select_policy

SET ROLE authenticated;
SET request.jwt.claims ->> 'org_id' TO 'org_a_uuid_here';

SELECT id, email, org_id, role, status
FROM public.users;
-- Expected: Returns only users where org_id = 'org_a_uuid_here'
-- Verify: No users from other organizations appear in results

-- ============================================================================
-- TEST 2: INSERT Policy - Admin Only
-- ============================================================================

-- Test: Admin from org_a can insert user into org_a
-- Expected: INSERT succeeds
-- Policy: users_insert_policy

SET ROLE authenticated;
SET request.jwt.claims ->> 'org_id' TO 'org_a_uuid_here';
SET request.jwt.claims ->> 'sub' TO 'admin_user_id_here';

INSERT INTO public.users (
  id, org_id, email, first_name, last_name, role, status, created_by
) VALUES (
  'new_user_uuid',
  'org_a_uuid_here',
  'test@example.com',
  'Test',
  'User',
  'operator',
  'invited',
  'admin_user_id_here'
);
-- Expected: INSERT succeeds (1 row inserted)

-- Test: Admin cannot insert user into different organization
-- Expected: INSERT fails or RLS blocks it

INSERT INTO public.users (
  id, org_id, email, first_name, last_name, role, status, created_by
) VALUES (
  'new_user_uuid_2',
  'org_b_uuid_here',  -- Different org!
  'test2@example.com',
  'Test2',
  'User2',
  'operator',
  'invited',
  'admin_user_id_here'
);
-- Expected: INSERT fails (RLS policy violation)
-- Error: new row violates row-level security policy

-- ============================================================================
-- TEST 3: UPDATE Policy - Admin Only
-- ============================================================================

-- Test: Admin from org_a can update users in org_a
-- Expected: UPDATE succeeds
-- Policy: users_update_policy

SET ROLE authenticated;
SET request.jwt.claims ->> 'org_id' TO 'org_a_uuid_here';
SET request.jwt.claims ->> 'sub' TO 'admin_user_id_here';

UPDATE public.users
SET first_name = 'Updated'
WHERE id = 'target_user_id_in_org_a';
-- Expected: UPDATE succeeds (1 row updated)

-- Test: Admin cannot update users from different organization
-- Expected: UPDATE affects 0 rows (RLS blocks visibility)

UPDATE public.users
SET first_name = 'Hacked'
WHERE id = 'target_user_id_in_org_b';
-- Expected: UPDATE affects 0 rows (user not visible due to RLS)

-- Test: Non-admin cannot update users
-- Expected: UPDATE fails or affects 0 rows

SET request.jwt.claims ->> 'sub' TO 'operator_user_id_here';

UPDATE public.users
SET first_name = 'Unauthorized'
WHERE id = 'target_user_id_in_org_a';
-- Expected: UPDATE affects 0 rows (USING clause fails - user is not admin)

-- ============================================================================
-- TEST 4: DELETE Policy - Admin Only
-- ============================================================================

-- Test: Admin from org_a can delete users in org_a
-- Expected: DELETE succeeds
-- Policy: users_delete_policy

SET ROLE authenticated;
SET request.jwt.claims ->> 'org_id' TO 'org_a_uuid_here';
SET request.jwt.claims ->> 'sub' TO 'admin_user_id_here';

DELETE FROM public.users
WHERE id = 'deletable_user_id_in_org_a';
-- Expected: DELETE succeeds (1 row deleted)

-- Test: Admin cannot delete users from different organization
-- Expected: DELETE affects 0 rows (RLS blocks visibility)

DELETE FROM public.users
WHERE id = 'user_id_in_org_b';
-- Expected: DELETE affects 0 rows (user not visible due to RLS)

-- ============================================================================
-- TEST 5: Last Admin Protection (Application Layer)
-- ============================================================================

-- Note: Last admin validation is handled in application code (API layer),
-- not in database RLS policies. The following scenario should be tested
-- via API endpoints:
--
-- 1. Ensure only 1 active admin exists in organization
-- 2. Attempt to deactivate that admin via PUT /api/settings/users/:id
-- 3. Expected: API returns 400 error "Cannot deactivate last active admin"
-- 4. Attempt to change that admin's role via PUT /api/settings/users/:id
-- 5. Expected: API returns 400 error "Cannot change role of last active admin"

-- Query to check admin count per organization:
SELECT org_id, COUNT(*) as admin_count
FROM public.users
WHERE role = 'admin' AND status = 'active'
GROUP BY org_id;

-- ============================================================================
-- TEST 6: Multi-Tenancy Isolation Verification
-- ============================================================================

-- Test: Count users visible to org_a user
SET ROLE authenticated;
SET request.jwt.claims ->> 'org_id' TO 'org_a_uuid_here';

SELECT COUNT(*) FROM public.users;
-- Expected: Count of users in org_a only

-- Test: Count users visible to org_b user
SET request.jwt.claims ->> 'org_id' TO 'org_b_uuid_here';

SELECT COUNT(*) FROM public.users;
-- Expected: Count of users in org_b only (different from org_a)

-- Test: Verify no cross-org visibility
SET request.jwt.claims ->> 'org_id' TO 'org_a_uuid_here';

SELECT COUNT(*) FROM public.users WHERE org_id = 'org_b_uuid_here';
-- Expected: 0 (RLS blocks visibility of other organization's users)

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Remove test data created during RLS testing
-- DELETE FROM public.users WHERE email LIKE '%test@example.com%';

-- Reset role
RESET ROLE;

-- ============================================================================
-- RLS POLICY VERIFICATION CHECKLIST
-- ============================================================================

-- ✓ SELECT: Users can only see users from their own organization
-- ✓ INSERT: Only admins can insert users, only into their own organization
-- ✓ UPDATE: Only admins can update users in their organization
-- ✓ DELETE: Only admins can delete users in their organization
-- ✓ Multi-tenancy: Complete isolation between organizations
-- ✓ Last Admin: Protected via application layer (API endpoints)

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. JWT Claims: In Supabase, JWT claims are accessible via auth.jwt()
--    The org_id claim must be set during authentication
--
-- 2. Testing Approach:
--    - Use Supabase SQL Editor for manual testing
--    - Or create automated tests using pg_tap or similar
--    - Or test via API endpoints with different user credentials
--
-- 3. RLS Limitations:
--    - RLS policies do not prevent service_role access
--    - Application logic should enforce business rules (last admin check)
--    - Performance: RLS adds WHERE clauses to all queries
