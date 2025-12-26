-- Migration: Fix table GRANT permissions and RLS recursion
-- Problem 1: Tables missing GRANT permissions for authenticated role
-- Problem 2: RLS policies on users table caused infinite recursion
-- Solution: Use SECURITY DEFINER function to get org_id without triggering RLS
-- Date: 2025-12-24

-- ============================================================================
-- STEP 1: Create security definer function to prevent RLS recursion
-- ============================================================================

-- This function returns current user's org_id without triggering RLS
-- SECURITY DEFINER runs with creator's privileges, bypassing RLS
DROP FUNCTION IF EXISTS public.get_my_org_id();

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO anon;

-- ============================================================================
-- STEP 2: Fix users table RLS policies
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_org_isolation" ON users;
DROP POLICY IF EXISTS "users_read_own_record" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_admin_insert" ON users;
DROP POLICY IF EXISTS "users_admin_update" ON users;
DROP POLICY IF EXISTS "users_admin_delete" ON users;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT: Own record OR same org (uses security definer function)
CREATE POLICY "users_select" ON users
FOR SELECT TO authenticated
USING (id = auth.uid() OR org_id = public.get_my_org_id());

-- UPDATE: Only own record
CREATE POLICY "users_update_self" ON users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT: Only same org
CREATE POLICY "users_insert" ON users
FOR INSERT TO authenticated
WITH CHECK (org_id = public.get_my_org_id());

-- DELETE: Only same org
CREATE POLICY "users_delete" ON users
FOR DELETE TO authenticated
USING (org_id = public.get_my_org_id());

-- ============================================================================
-- STEP 3: Fix organizations table RLS policy
-- ============================================================================

DROP POLICY IF EXISTS "org_select_own" ON organizations;

CREATE POLICY "org_select_own" ON organizations
FOR SELECT TO authenticated
USING (id = public.get_my_org_id());

-- ============================================================================
-- STEP 4: GRANT permissions on all tables
-- ============================================================================

-- ============================================================================
-- GRANT SELECT/INSERT/UPDATE/DELETE to authenticated role for all tables
-- Using DO blocks to check if tables exist first
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  grant_tables TEXT[] := ARRAY[
    'organizations',
    'roles',
    'users',
    'modules',
    'organization_modules',
    'permissions',
    'role_permissions',
    'user_invitations',
    'warehouse_access',
    'user_sessions',
    'password_history',
    'wizard_progress',
    'badges',
    'tax_codes',
    'product_types',
    'products',
    'routings',
    'routing_operations',
    'bom_items',
    'bom_headers',
    'units_of_measure',
    'warehouses'
  ];
BEGIN
  FOREACH tbl IN ARRAY grant_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', tbl);
      RAISE NOTICE 'Granted permissions on %', tbl;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- GRANT to service_role (should have full access)
-- ============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- GRANT usage on sequences (needed for INSERT)
-- ============================================================================
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Set default privileges for future tables
-- ============================================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  users_grant_count INT;
BEGIN
  SELECT COUNT(*) INTO users_grant_count
  FROM information_schema.role_table_grants
  WHERE table_name = 'users'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';

  IF users_grant_count > 0 THEN
    RAISE NOTICE '✅ GRANT permissions fixed! authenticated role can now access tables.';
  ELSE
    RAISE WARNING '⚠️ GRANT for users table may not have been applied correctly.';
  END IF;
END $$;
