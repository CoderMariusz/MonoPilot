-- CHECK AND FIX RLS - Run this in Supabase SQL Editor

-- 1. Check current policies on users table
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- 2. Check if user profile exists
SELECT
  id,
  org_id,
  email,
  first_name,
  last_name,
  role_id,
  is_active
FROM users
WHERE id = '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc';

-- 3. TEMPORARY FIX: Disable RLS on users table (for testing only!)
-- WARNING: This allows all authenticated users to read all users
-- We'll fix it properly later
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Verify RLS is disabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Should show: rowsecurity = false

-- Message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS temporarily disabled on users table';
  RAISE NOTICE '⚠️  Remember to enable it later with proper policies!';
END $$;
