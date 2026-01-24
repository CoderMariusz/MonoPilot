-- CRITICAL FIX: Remove ALL users policies and create simple one
-- This SQL MUST be run in Supabase Dashboard SQL Editor

-- 1. Drop ALL existing users policies
DROP POLICY IF EXISTS "users_org_isolation" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_admin_insert" ON users;
DROP POLICY IF EXISTS "users_admin_update" ON users;
DROP POLICY IF EXISTS "users_admin_delete" ON users;

-- 2. Create SIMPLE policy - no subqueries, no recursion
-- Allow users to read ONLY their own record
CREATE POLICY "users_read_own_record" ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 3. Verify it works
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Should show only 1 policy: users_read_own_record
