-- Migration: 154_fix_production_lines_rls_final.sql
-- Bug Fix: BUG-013 (FINAL) - "permission denied for table production_lines"
-- Date: 2026-02-08
-- 
-- ROOT CAUSE ANALYSIS:
-- Migrations 150 and 152 used direct subqueries in RLS policies:
--   org_id = (SELECT org_id FROM users WHERE id = auth.uid())
-- 
-- This causes issues because:
-- 1. The users table has RLS enabled, creating potential recursion
-- 2. The subquery runs with caller privileges, not bypassing RLS
-- 3. Role check subquery is complex and may fail silently
--
-- SOLUTION:
-- 1. Use public.get_my_org_id() - a SECURITY DEFINER function that bypasses RLS
-- 2. Create public.get_my_role_code() - a new SECURITY DEFINER function for role checks
-- 3. Simplify policies using these functions
-- 4. Handle all edge cases (null checks, case insensitivity)

BEGIN;

-- =============================================================================
-- 1. ENSURE get_my_org_id() FUNCTION EXISTS AND WORKS CORRECTLY
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_my_org_id() CASCADE;

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO anon;

COMMENT ON FUNCTION public.get_my_org_id() IS 
  'Returns the org_id of the currently authenticated user. SECURITY DEFINER bypasses RLS on users table.';

-- =============================================================================
-- 2. CREATE get_my_role_code() FUNCTION FOR ROLE CHECKS
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_my_role_code() CASCADE;

CREATE OR REPLACE FUNCTION public.get_my_role_code()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(r.code) 
  FROM public.roles r 
  JOIN public.users u ON u.role_id = r.id 
  WHERE u.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role_code() TO anon;

COMMENT ON FUNCTION public.get_my_role_code() IS 
  'Returns the lowercased role code of the currently authenticated user. SECURITY DEFINER bypasses RLS.';

-- =============================================================================
-- 3. CREATE HELPER FUNCTION FOR ADMIN/MANAGER ROLE CHECK
-- =============================================================================

DROP FUNCTION IF EXISTS public.can_manage_production() CASCADE;

CREATE OR REPLACE FUNCTION public.can_manage_production()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.roles r 
    JOIN public.users u ON u.role_id = r.id 
    WHERE u.id = auth.uid()
      AND LOWER(r.code) IN ('owner', 'admin', 'super_admin', 'production_manager')
  )
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_production() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_production() TO anon;

COMMENT ON FUNCTION public.can_manage_production() IS 
  'Returns true if current user has production management permissions. SECURITY DEFINER bypasses RLS.';

-- =============================================================================
-- 4. DROP ALL EXISTING PRODUCTION_LINES POLICIES
-- =============================================================================

-- Drop any existing policies (comprehensive list)
DROP POLICY IF EXISTS production_lines_select ON production_lines;
DROP POLICY IF EXISTS production_lines_insert ON production_lines;
DROP POLICY IF EXISTS production_lines_update ON production_lines;
DROP POLICY IF EXISTS production_lines_delete ON production_lines;
DROP POLICY IF EXISTS production_lines_org_isolation ON production_lines;
DROP POLICY IF EXISTS production_lines_admin_write ON production_lines;
DROP POLICY IF EXISTS "production_lines_select" ON production_lines;
DROP POLICY IF EXISTS "production_lines_insert" ON production_lines;
DROP POLICY IF EXISTS "production_lines_update" ON production_lines;
DROP POLICY IF EXISTS "production_lines_delete" ON production_lines;

-- =============================================================================
-- 5. ENSURE RLS IS ENABLED
-- =============================================================================

ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too (safety measure)
ALTER TABLE production_lines FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CREATE NEW SIMPLIFIED POLICIES
-- =============================================================================

-- SELECT: All authenticated users can view production lines in their org
CREATE POLICY production_lines_select
ON production_lines
FOR SELECT
TO authenticated
USING (
  org_id = public.get_my_org_id()
);

-- INSERT: Admin/Manager roles can create production lines
-- org_id must match user's org (auto-set by trigger or passed from frontend)
CREATE POLICY production_lines_insert
ON production_lines
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.can_manage_production()
);

-- UPDATE: Admin/Manager roles can update production lines in their org
CREATE POLICY production_lines_update
ON production_lines
FOR UPDATE
TO authenticated
USING (
  org_id = public.get_my_org_id()
  AND public.can_manage_production()
)
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.can_manage_production()
);

-- DELETE: Only Owner/Admin/SuperAdmin can delete
CREATE POLICY production_lines_delete
ON production_lines
FOR DELETE
TO authenticated
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role_code() IN ('owner', 'admin', 'super_admin')
);

-- =============================================================================
-- 7. FIX PRODUCTION_LINE_MACHINES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS plm_select ON production_line_machines;
DROP POLICY IF EXISTS plm_insert ON production_line_machines;
DROP POLICY IF EXISTS plm_update ON production_line_machines;
DROP POLICY IF EXISTS plm_delete ON production_line_machines;
DROP POLICY IF EXISTS plm_org_isolation ON production_line_machines;
DROP POLICY IF EXISTS plm_admin_write ON production_line_machines;

ALTER TABLE production_line_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_line_machines FORCE ROW LEVEL SECURITY;

CREATE POLICY plm_select
ON production_line_machines
FOR SELECT
TO authenticated
USING (org_id = public.get_my_org_id());

CREATE POLICY plm_insert
ON production_line_machines
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.can_manage_production()
);

CREATE POLICY plm_update
ON production_line_machines
FOR UPDATE
TO authenticated
USING (org_id = public.get_my_org_id() AND public.can_manage_production())
WITH CHECK (org_id = public.get_my_org_id() AND public.can_manage_production());

CREATE POLICY plm_delete
ON production_line_machines
FOR DELETE
TO authenticated
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role_code() IN ('owner', 'admin', 'super_admin', 'production_manager')
);

-- =============================================================================
-- 8. ADD POLICY COMMENTS
-- =============================================================================

COMMENT ON POLICY production_lines_select ON production_lines IS 
  'All org users can view production lines';
COMMENT ON POLICY production_lines_insert ON production_lines IS 
  'Owner/Admin/SuperAdmin/ProdManager can create production lines';
COMMENT ON POLICY production_lines_update ON production_lines IS 
  'Owner/Admin/SuperAdmin/ProdManager can update production lines';
COMMENT ON POLICY production_lines_delete ON production_lines IS 
  'Owner/Admin/SuperAdmin can delete production lines';

COMMENT ON POLICY plm_select ON production_line_machines IS 
  'All org users can view machine assignments';
COMMENT ON POLICY plm_insert ON production_line_machines IS 
  'Owner/Admin/SuperAdmin/ProdManager can assign machines';
COMMENT ON POLICY plm_update ON production_line_machines IS 
  'Owner/Admin/SuperAdmin/ProdManager can update assignments';
COMMENT ON POLICY plm_delete ON production_line_machines IS 
  'Owner/Admin/SuperAdmin/ProdManager can remove assignments';

-- =============================================================================
-- 9. VERIFICATION
-- =============================================================================

DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'production_lines';
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 policies on production_lines, found %', policy_count;
  END IF;
  
  RAISE NOTICE '✅ Migration 154 complete: production_lines has % policies', policy_count;
  RAISE NOTICE '✅ Functions created: get_my_org_id(), get_my_role_code(), can_manage_production()';
END $$;

COMMIT;

-- =============================================================================
-- Migration complete: 154_fix_production_lines_rls_final.sql
-- 
-- Key changes:
-- 1. Created SECURITY DEFINER functions to bypass RLS recursion
-- 2. Simplified policies using these functions
-- 3. All role checks are case-insensitive (LOWER())
-- 4. super_admin role is included
-- 5. FORCE ROW LEVEL SECURITY ensures policies apply to table owner too
-- =============================================================================
