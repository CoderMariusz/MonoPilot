-- Debug: Which users table is which?

-- 1. Check BOTH users tables with schema
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users'
ORDER BY schemaname;

-- 2. Check RLS on public.users specifically
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- 3. Check policies on public.users
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 4. DISABLE RLS on public.users ONLY (the one we care about!)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 5. Verify public.users has RLS disabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
-- Should show: rowsecurity = false

-- 6. Test query - can we read the user now?
SELECT
  id,
  email,
  first_name,
  last_name,
  org_id,
  is_active
FROM public.users
WHERE id = '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc';
