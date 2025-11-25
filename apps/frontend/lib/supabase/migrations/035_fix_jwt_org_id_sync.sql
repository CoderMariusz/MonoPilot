-- Migration 035: Diagnose and Fix JWT org_id Claims for Products RLS
-- This migration ensures all users have org_id properly synced to JWT claims
-- Required for RLS policies to work: (auth.jwt() ->> 'org_id')::uuid
-- Date: 2025-11-25

-- ============================================================================
-- DIAGNOSE: Check current state of JWT org_id claims
-- ============================================================================

-- Log current state
DO $$
DECLARE
  total_users INT;
  users_with_org_id INT;
  users_with_jwt_org_id INT;
  missing_jwt_sync INT;
BEGIN
  -- Count statistics
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO users_with_org_id FROM public.users WHERE org_id IS NOT NULL;
  SELECT COUNT(*) INTO users_with_jwt_org_id FROM auth.users WHERE raw_app_meta_data->>'org_id' IS NOT NULL;
  SELECT COUNT(*) INTO missing_jwt_sync
  FROM public.users u
  WHERE u.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = u.id
    AND au.raw_app_meta_data->>'org_id' IS NOT NULL
  );

  RAISE NOTICE 'JWT org_id Sync Diagnostic Report:';
  RAISE NOTICE '- Total users in public.users: %', total_users;
  RAISE NOTICE '- Users with org_id set: %', users_with_org_id;
  RAISE NOTICE '- Users with org_id in JWT claims: %', users_with_jwt_org_id;
  RAISE NOTICE '- Users missing JWT org_id sync: %', missing_jwt_sync;
END $$;

-- ============================================================================
-- FIX: Force resync all users' org_id to JWT app_metadata
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  synced_count INT := 0;
BEGIN
  -- For all users with org_id, ensure it's in JWT claims
  FOR user_record IN
    SELECT u.id, u.org_id, u.email
    FROM public.users u
    WHERE u.org_id IS NOT NULL
    ORDER BY u.created_at
  LOOP
    -- Force update raw_app_meta_data with org_id
    UPDATE auth.users
    SET raw_app_meta_data =
      CASE
        WHEN raw_app_meta_data IS NULL THEN jsonb_build_object('org_id', user_record.org_id)
        WHEN raw_app_meta_data->>'org_id' IS NULL OR raw_app_meta_data->>'org_id' != user_record.org_id::text
          THEN raw_app_meta_data || jsonb_build_object('org_id', user_record.org_id)
        ELSE raw_app_meta_data
      END
    WHERE id = user_record.id;

    synced_count := synced_count + 1;
    RAISE LOG 'Synced org_id % for user % (%)', user_record.org_id, user_record.email, user_record.id;
  END LOOP;

  RAISE NOTICE 'Successfully synced org_id to JWT claims for % users', synced_count;
END $$;

-- ============================================================================
-- VERIFICATION: Confirm JWT org_id sync is complete
-- ============================================================================

DO $$
DECLARE
  verification_count INT;
  mismatched_count INT;
BEGIN
  -- Verify all users have matching org_id in public.users and JWT claims
  SELECT COUNT(*) INTO verification_count
  FROM public.users u
  WHERE u.org_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = u.id
    AND au.raw_app_meta_data->>'org_id'::uuid = u.org_id
  );

  SELECT COUNT(*) INTO mismatched_count
  FROM public.users u
  WHERE u.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = u.id
    AND au.raw_app_meta_data->>'org_id'::uuid = u.org_id
  );

  RAISE NOTICE 'JWT org_id Verification Complete:';
  RAISE NOTICE '- Users with matching org_id in public.users and JWT: %', verification_count;
  RAISE NOTICE '- Users with mismatched or missing org_id in JWT: %', mismatched_count;

  IF mismatched_count > 0 THEN
    RAISE WARNING 'Some users still have mismatched org_id in JWT claims!';
  ELSE
    RAISE NOTICE 'All users have correct org_id in JWT claims! ✓';
  END IF;
END $$;

-- ============================================================================
-- ENSURE TRIGGER IS ACTIVE
-- ============================================================================

-- Verify trigger exists and is enabled
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_sync_org_id_to_jwt'
    AND trigger_schema = 'public'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE 'Trigger trigger_sync_org_id_to_jwt is active ✓';
  ELSE
    RAISE WARNING 'Trigger trigger_sync_org_id_to_jwt not found! Creating it now...';

    -- Recreate trigger if missing
    CREATE TRIGGER trigger_sync_org_id_to_jwt
      AFTER INSERT OR UPDATE OF org_id ON public.users
      FOR EACH ROW
      WHEN (NEW.org_id IS NOT NULL)
      EXECUTE FUNCTION sync_user_org_id_to_jwt();

    RAISE NOTICE 'Trigger recreated successfully ✓';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration:
-- 1. Diagnoses the current state of JWT org_id claims
-- 2. Forces a complete resync of all users' org_id to auth.users.raw_app_meta_data
-- 3. Verifies the sync was successful
-- 4. Ensures the sync trigger exists and is active
--
-- After this migration:
-- - auth.jwt() will contain org_id for all active users
-- - RLS policies checking (auth.jwt() ->> 'org_id')::uuid will work
-- - Products can be created and queried without RLS violations
-- - JWT claims will auto-sync for new users via trigger
-- ============================================================================
