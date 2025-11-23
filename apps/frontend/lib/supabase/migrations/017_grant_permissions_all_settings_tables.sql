-- Migration 017: GRANT Permissions for ALL Settings Tables
-- Fixes missing GRANT permissions for service_role and authenticated roles
-- Date: 2025-11-23
--
-- Issue: RLS policies check for service_role, but PostgreSQL GRANT permissions
-- are checked BEFORE RLS policies. Without GRANT, service_role cannot access tables.
--
-- Supabase Standard:
--   - service_role: Full access (bypasses RLS via policies)
--   - authenticated: Full access (restricted by RLS policies)
--   - anon: SELECT only (restricted by RLS policies)

-- ============================================================================
-- GRANT PERMISSIONS - Epic 1 Settings Tables
-- ============================================================================

-- 1. WAREHOUSES
GRANT ALL ON public.warehouses TO service_role;
GRANT ALL ON public.warehouses TO authenticated;
GRANT SELECT ON public.warehouses TO anon;

-- 2. LOCATIONS
GRANT ALL ON public.locations TO service_role;
GRANT ALL ON public.locations TO authenticated;
GRANT SELECT ON public.locations TO anon;

-- 3. MACHINES
GRANT ALL ON public.machines TO service_role;
GRANT ALL ON public.machines TO authenticated;
GRANT SELECT ON public.machines TO anon;

-- 4. PRODUCTION_LINES
GRANT ALL ON public.production_lines TO service_role;
GRANT ALL ON public.production_lines TO authenticated;
GRANT SELECT ON public.production_lines TO anon;

-- 5. ALLERGENS
GRANT ALL ON public.allergens TO service_role;
GRANT ALL ON public.allergens TO authenticated;
GRANT SELECT ON public.allergens TO anon;

-- 6. TAX_CODES
GRANT ALL ON public.tax_codes TO service_role;
GRANT ALL ON public.tax_codes TO authenticated;
GRANT SELECT ON public.tax_codes TO anon;

-- 7. USER_INVITATIONS
GRANT ALL ON public.user_invitations TO service_role;
GRANT ALL ON public.user_invitations TO authenticated;
GRANT SELECT ON public.user_invitations TO anon;

-- 8. USER_SESSIONS
GRANT ALL ON public.user_sessions TO service_role;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT SELECT ON public.user_sessions TO anon;

-- 9. MACHINE_LINE_ASSIGNMENTS
GRANT ALL ON public.machine_line_assignments TO service_role;
GRANT ALL ON public.machine_line_assignments TO authenticated;
GRANT SELECT ON public.machine_line_assignments TO anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration, verify with:
-- SELECT grantee, privilege_type FROM information_schema.table_privileges
-- WHERE table_name = 'warehouses' ORDER BY grantee, privilege_type;
--
-- Expected output should include:
--   - anon: SELECT
--   - authenticated: DELETE, INSERT, SELECT, UPDATE
--   - service_role: DELETE, INSERT, SELECT, UPDATE

COMMENT ON TABLE public.warehouses IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.locations IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.machines IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.production_lines IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.allergens IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.tax_codes IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.user_invitations IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.user_sessions IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
COMMENT ON TABLE public.machine_line_assignments IS 'Migration 017: GRANTs added for service_role, authenticated, anon';
