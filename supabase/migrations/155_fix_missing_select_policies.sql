-- Migration: Restore missing SELECT policies for users and organizations tables
-- Problem: SELECT policies were dropped (cause unknown), leaving only UPDATE policies.
--          This prevented authenticated users from reading their own profile,
--          causing infinite redirect loop on login.
-- Solution: Re-create SELECT policies using the existing get_my_org_id() SECURITY DEFINER function.
-- Date: 2026-02-08

-- Fix users table: allow reading own record or same org
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_org_isolation" ON users;

CREATE POLICY "users_select" ON users
FOR SELECT TO authenticated
USING (id = auth.uid() OR org_id = public.get_my_org_id());

-- Fix organizations table: allow reading own org
DROP POLICY IF EXISTS "org_select_own" ON organizations;

CREATE POLICY "org_select_own" ON organizations
FOR SELECT TO authenticated
USING (id = public.get_my_org_id());

-- Verify
DO $$
DECLARE
  v_users_count INT;
  v_orgs_count INT;
BEGIN
  SELECT COUNT(*) INTO v_users_count
  FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select';

  SELECT COUNT(*) INTO v_orgs_count
  FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'org_select_own';

  IF v_users_count > 0 AND v_orgs_count > 0 THEN
    RAISE NOTICE 'SELECT policies restored for users and organizations tables';
  ELSE
    RAISE EXCEPTION 'Failed to create SELECT policies!';
  END IF;
END $$;
