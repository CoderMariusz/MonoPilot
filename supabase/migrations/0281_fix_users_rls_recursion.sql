-- Migration: Fix infinite recursion in users RLS policy
-- Problem: Policy does SELECT on users table, which triggers the same policy -> infinite loop
-- Solution: Allow users to read their own record first (without subquery), then check org for others

-- Drop old recursive policy
DROP POLICY IF EXISTS "users_org_isolation" ON users;

-- Create new non-recursive policy
-- Users can read their own record OR other users in the same org
CREATE POLICY "users_select_policy" ON users
FOR SELECT
TO authenticated
USING (
  -- Allow reading own record (no subquery - breaks recursion!)
  id = auth.uid()
  OR
  -- Allow reading other users in same org (subquery only executes for OTHER users)
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.org_id = users.org_id
  )
);

-- Verify policy was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
    AND policyname = 'users_select_policy'
  ) THEN
    RAISE NOTICE '✅ Fixed users RLS policy - no more recursion!';
  ELSE
    RAISE EXCEPTION 'Failed to create new policy!';
  END IF;
END $$;
