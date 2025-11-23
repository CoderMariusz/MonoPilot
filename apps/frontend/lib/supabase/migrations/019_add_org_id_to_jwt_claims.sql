-- Migration 019: Add org_id to JWT Claims (app_metadata)
-- Fixes RLS policy violations by ensuring auth.jwt() contains org_id
-- Date: 2025-11-23
--
-- Problem: RLS policies check (auth.jwt() ->> 'org_id')::uuid
--          But org_id was never added to JWT app_metadata!
--
-- Solution: Create trigger to sync public.users.org_id -> auth.users.raw_app_meta_data
--           This makes org_id available in JWT claims via auth.jwt()
--
-- Background:
--   Supabase JWT structure:
--   - auth.jwt() returns app_metadata + user_metadata + system claims
--   - app_metadata is stored in auth.users.raw_app_meta_data (JSONB)
--   - We need to set app_metadata.org_id when user is created/updated

-- ============================================================================
-- FUNCTION: Sync org_id to JWT app_metadata
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_org_id_to_jwt()
RETURNS TRIGGER AS $$
DECLARE
  user_org_id UUID;
BEGIN
  -- Get org_id from public.users table
  SELECT org_id INTO user_org_id
  FROM public.users
  WHERE id = NEW.id;

  -- If user found and has org_id, update auth.users app_metadata
  IF user_org_id IS NOT NULL THEN
    -- Update raw_app_meta_data in auth.users
    -- This makes org_id available in auth.jwt() as app_metadata.org_id
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', user_org_id)
    WHERE id = NEW.id;

    RAISE LOG 'Synced org_id % to JWT claims for user %', user_org_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Sync org_id when public.users is inserted/updated
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_sync_org_id_to_jwt ON public.users;

CREATE TRIGGER trigger_sync_org_id_to_jwt
  AFTER INSERT OR UPDATE OF org_id ON public.users
  FOR EACH ROW
  WHEN (NEW.org_id IS NOT NULL)
  EXECUTE FUNCTION sync_user_org_id_to_jwt();

-- ============================================================================
-- BACKFILL: Update existing users
-- ============================================================================

-- For all existing users, sync their org_id to JWT app_metadata
DO $$
DECLARE
  user_record RECORD;
  updated_count INT := 0;
BEGIN
  FOR user_record IN
    SELECT u.id, u.org_id, u.email
    FROM public.users u
    WHERE u.org_id IS NOT NULL
  LOOP
    -- Update auth.users.raw_app_meta_data to include org_id
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('org_id', user_record.org_id)
    WHERE id = user_record.id;

    updated_count := updated_count + 1;

    RAISE LOG 'Backfilled org_id for user % (%)', user_record.email, user_record.id;
  END LOOP;

  RAISE NOTICE 'Backfilled org_id to JWT claims for % users', updated_count;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration, verify with:
-- SELECT id, email, raw_app_meta_data->>'org_id' AS jwt_org_id
-- FROM auth.users
-- WHERE raw_app_meta_data->>'org_id' IS NOT NULL;
--
-- Expected: All active users should have org_id in their app_metadata

-- Also verify JWT claim in SQL:
-- SELECT
--   u.email,
--   u.org_id AS public_org_id,
--   au.raw_app_meta_data->>'org_id' AS jwt_org_id,
--   (u.org_id::text = au.raw_app_meta_data->>'org_id') AS org_id_match
-- FROM public.users u
-- JOIN auth.users au ON u.id = au.id;

COMMENT ON FUNCTION sync_user_org_id_to_jwt() IS 'Migration 019: Syncs public.users.org_id to auth.users.raw_app_meta_data for JWT claims';

-- ============================================================================
-- NOTES
-- ============================================================================

-- After this migration:
-- 1. auth.jwt() will contain org_id claim
-- 2. RLS policies using (auth.jwt() ->> 'org_id')::uuid will work
-- 3. New users automatically get org_id in JWT via trigger
-- 4. Existing users have been backfilled

-- To test in SQL:
-- SELECT current_setting('request.jwt.claims', true)::json->>'org_id' AS org_id_from_jwt;
-- (Note: This only works in context of an authenticated request)
