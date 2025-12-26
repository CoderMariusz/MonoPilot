-- Migration: Add user language preference validation and index
-- Story: TD-208 - Language Selector for Allergen Names
-- Purpose: Enhance existing users.language column with validation and performance index
-- Date: 2025-12-24

-- =====================================================
-- ANALYSIS
-- =====================================================
-- The users table already has a 'language' column (migration 003)
-- However, it lacks:
-- 1. CHECK constraint for valid language codes
-- 2. Performance index for language-based queries
-- 3. Explicit documentation of supported languages
--
-- Supported languages (EU-14 allergen names):
-- 'en' - English (default)
-- 'pl' - Polish
-- 'de' - German
-- 'fr' - French

-- =====================================================
-- 1. Add CHECK constraint for valid language codes
-- =====================================================

-- Add constraint to ensure only valid language codes are stored
-- Using DO block for idempotent operation (safe for re-runs)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_users_language'
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT chk_users_language
    CHECK (language IS NULL OR language IN ('en', 'pl', 'de', 'fr'));
  END IF;
END $$;

-- =====================================================
-- 2. Update existing NULL values to default 'en'
-- =====================================================

-- Set default for any NULL language values
UPDATE users
SET language = 'en'
WHERE language IS NULL;

-- =====================================================
-- 3. Create index for language-based queries
-- =====================================================

-- Index for efficient filtering/grouping by language
CREATE INDEX IF NOT EXISTS idx_users_language
ON users(language);

-- =====================================================
-- 4. Add column comment for documentation
-- =====================================================

COMMENT ON COLUMN users.language IS 'User language preference for UI and data display. Valid values: en (English), pl (Polish), de (German), fr (French). Default: en. Fallback order: user preference -> org locale -> en.';

-- =====================================================
-- 5. RPC function for getting user language with fallback
-- =====================================================

-- Function to get user's effective language with fallback chain
CREATE OR REPLACE FUNCTION get_user_language(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_language TEXT;
  v_org_locale TEXT;
BEGIN
  -- Get user's language preference
  SELECT u.language, o.locale
  INTO v_user_language, v_org_locale
  FROM users u
  JOIN organizations o ON o.id = u.org_id
  WHERE u.id = p_user_id;

  -- Return with fallback chain: user -> org -> 'en'
  RETURN COALESCE(v_user_language, v_org_locale, 'en');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_language(UUID) TO authenticated;

-- Function comment
COMMENT ON FUNCTION get_user_language(UUID) IS 'Returns user effective language with fallback chain: user.language -> organization.locale -> en (default)';

-- =====================================================
-- 6. RPC function for updating user language preference
-- =====================================================

-- Function to update user's language preference (with validation)
CREATE OR REPLACE FUNCTION set_user_language(p_language TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user's ID
  v_user_id := auth.uid();

  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate language code
  IF p_language NOT IN ('en', 'pl', 'de', 'fr') THEN
    RAISE EXCEPTION 'Invalid language code: %. Valid codes: en, pl, de, fr', p_language;
  END IF;

  -- Update user's language preference
  UPDATE users
  SET language = p_language, updated_at = NOW()
  WHERE id = v_user_id;

  -- Verify update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_user_language(TEXT) TO authenticated;

-- Function comment
COMMENT ON FUNCTION set_user_language(TEXT) IS 'Updates current user language preference. Valid codes: en, pl, de, fr. Raises exception for invalid codes or unauthenticated users.';

-- =====================================================
-- Migration complete
-- =====================================================
-- Added: CHECK constraint on users.language
-- Added: Index on users.language
-- Added: get_user_language(UUID) function with fallback
-- Added: set_user_language(TEXT) function with validation
-- Updated: Column comment with documentation
