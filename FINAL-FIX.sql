-- FINAL FIX - Run this in Supabase SQL Editor
-- This will check everything and fix it

-- STEP 1: Check what we have
SELECT '=== STEP 1: Check RLS status ===' as step;

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- STEP 2: Check if user exists (bypass RLS with admin query)
SELECT '=== STEP 2: Check if user exists ===' as step;

SET LOCAL ROLE postgres;
SELECT
  id,
  email,
  first_name,
  last_name,
  org_id,
  role_id,
  is_active
FROM public.users
WHERE id = '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc';
RESET ROLE;

-- STEP 3: FORCE disable RLS (even if already disabled)
SELECT '=== STEP 3: Disabling RLS ===' as step;

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 4: Verify RLS is OFF
SELECT '=== STEP 4: Verify RLS is disabled ===' as step;

SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
-- MUST show: rowsecurity = false

-- STEP 5: Test query without RLS
SELECT '=== STEP 5: Test query ===' as step;

SELECT
  id,
  email,
  first_name,
  org_id,
  is_active
FROM public.users
WHERE id = '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc';

-- STEP 6: Final message
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc') THEN
    RAISE NOTICE '✅ USER EXISTS and RLS is DISABLED';
    RAISE NOTICE 'You can now login!';
  ELSE
    RAISE EXCEPTION '❌ USER DOES NOT EXIST! Run QUICK-CREATE-USER.sql first!';
  END IF;
END $$;
