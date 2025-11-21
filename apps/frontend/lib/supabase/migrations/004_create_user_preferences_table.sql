-- Migration 004: Create user_preferences table for dashboard personalization
-- Story: 1.13 Main Dashboard - AC-012.5 (Optional)
-- Date: 2025-11-21

-- ============================================================================
-- CREATE USER_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  dashboard_config JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints for dashboard_config structure
  CONSTRAINT user_preferences_dashboard_config_valid CHECK (
    jsonb_typeof(dashboard_config) = 'object'
  )
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for user lookup (primary key already indexed)
-- GIN index for JSONB queries on dashboard_config
CREATE INDEX IF NOT EXISTS idx_user_preferences_dashboard_config
  ON public.user_preferences USING GIN (dashboard_config);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Policy: Service role bypass RLS (for admin operations)
CREATE POLICY "Service role bypass RLS"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Reuse existing update_updated_at_column function
CREATE TRIGGER user_preferences_updated_at_trigger
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_preferences IS 'User-specific dashboard preferences and personalization settings';
COMMENT ON COLUMN public.user_preferences.user_id IS 'Primary key, FK to users table';
COMMENT ON COLUMN public.user_preferences.dashboard_config IS 'Dashboard configuration as JSONB: { module_order: string[], pinned_modules: string[], show_activity_feed: boolean }';
COMMENT ON COLUMN public.user_preferences.updated_at IS 'Timestamp when preferences were last updated';

-- ============================================================================
-- HELPER FUNCTIONS FOR DASHBOARD CONFIG
-- ============================================================================

-- Function to get default dashboard config
CREATE OR REPLACE FUNCTION public.get_default_dashboard_config()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'module_order', ARRAY['settings', 'technical', 'planning', 'production', 'warehouse', 'quality', 'shipping', 'npd']::text[],
    'pinned_modules', ARRAY[]::text[],
    'show_activity_feed', true
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_default_dashboard_config() IS 'Returns default dashboard configuration for new users';

-- Function to merge user config with defaults (fills in missing keys)
CREATE OR REPLACE FUNCTION public.merge_dashboard_config(user_config JSONB)
RETURNS JSONB AS $$
DECLARE
  default_config JSONB;
BEGIN
  default_config := public.get_default_dashboard_config();

  -- Merge user config with defaults (user config takes precedence)
  RETURN default_config || COALESCE(user_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.merge_dashboard_config(JSONB) IS 'Merges user dashboard config with defaults, filling in missing keys';

-- ============================================================================
-- SEED DATA (Create default preferences for existing users)
-- ============================================================================

-- Create default preferences for all existing users who don't have preferences yet
INSERT INTO public.user_preferences (user_id, dashboard_config)
SELECT
  u.id,
  public.get_default_dashboard_config()
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VALIDATION EXAMPLES (for testing)
-- ============================================================================

-- Example valid dashboard_config:
-- {
--   "module_order": ["settings", "technical", "planning", "production", "warehouse", "quality", "shipping", "npd"],
--   "pinned_modules": ["planning", "production"],
--   "show_activity_feed": true
-- }

-- Example queries:
-- Get user preferences with defaults filled in:
-- SELECT public.merge_dashboard_config(dashboard_config) FROM public.user_preferences WHERE user_id = auth.uid();

-- Update specific preference keys:
-- UPDATE public.user_preferences
-- SET dashboard_config = dashboard_config || '{"show_activity_feed": false}'::jsonb
-- WHERE user_id = auth.uid();

-- Set pinned modules:
-- UPDATE public.user_preferences
-- SET dashboard_config = jsonb_set(dashboard_config, '{pinned_modules}', '["planning", "production"]'::jsonb)
-- WHERE user_id = auth.uid();
