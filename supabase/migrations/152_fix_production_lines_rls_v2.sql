-- Migration: 152_fix_production_lines_rls_v2.sql
-- Bug Fix: BUG-013 - "permission denied for table production_lines" (RECURRENCE)
-- Date: 2026-02-08
-- Root Cause: Migration 150 may not have been applied, or policies were overwritten
-- Solution: Reapply RLS policies with super_admin + LOWER() for case-insensitive matching
-- Related API fixes: Added super_admin to API route permission checks

BEGIN;

-- =============================================================================
-- 1. DROP ALL EXISTING PRODUCTION_LINES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS production_lines_select ON production_lines;
DROP POLICY IF EXISTS production_lines_insert ON production_lines;
DROP POLICY IF EXISTS production_lines_update ON production_lines;
DROP POLICY IF EXISTS production_lines_delete ON production_lines;
DROP POLICY IF EXISTS production_lines_org_isolation ON production_lines;
DROP POLICY IF EXISTS production_lines_admin_write ON production_lines;

-- =============================================================================
-- 2. ENSURE RLS IS ENABLED
-- =============================================================================

ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CREATE POLICIES WITH SUPER_ADMIN + CASE-INSENSITIVE CHECK
-- =============================================================================

-- SELECT: All authenticated users can view lines in their org
CREATE POLICY production_lines_select
ON production_lines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: owner, admin, super_admin, or production_manager can create lines
CREATE POLICY production_lines_insert
ON production_lines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'super_admin', 'production_manager')
    )
);

-- UPDATE: owner, admin, super_admin, or production_manager can update lines
CREATE POLICY production_lines_update
ON production_lines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'super_admin', 'production_manager')
    )
);

-- DELETE: owner, admin, and super_admin can delete lines
CREATE POLICY production_lines_delete
ON production_lines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'super_admin')
    )
);

-- =============================================================================
-- 4. DROP ALL EXISTING PRODUCTION_LINE_MACHINES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS plm_select ON production_line_machines;
DROP POLICY IF EXISTS plm_insert ON production_line_machines;
DROP POLICY IF EXISTS plm_update ON production_line_machines;
DROP POLICY IF EXISTS plm_delete ON production_line_machines;
DROP POLICY IF EXISTS plm_org_isolation ON production_line_machines;
DROP POLICY IF EXISTS plm_admin_write ON production_line_machines;

-- =============================================================================
-- 5. ENSURE RLS IS ENABLED FOR PRODUCTION_LINE_MACHINES
-- =============================================================================

ALTER TABLE production_line_machines ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. RECREATE PRODUCTION_LINE_MACHINES POLICIES
-- =============================================================================

-- SELECT: All authenticated users can view machine assignments in their org
CREATE POLICY plm_select
ON production_line_machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: owner, admin, super_admin, or production_manager can assign machines
CREATE POLICY plm_insert
ON production_line_machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'super_admin', 'production_manager')
    )
);

-- UPDATE: owner, admin, super_admin, or production_manager can update assignments
CREATE POLICY plm_update
ON production_line_machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'super_admin', 'production_manager')
    )
);

-- DELETE: owner, admin, super_admin, or production_manager can remove assignments
CREATE POLICY plm_delete
ON production_line_machines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'super_admin', 'production_manager')
    )
);

-- =============================================================================
-- 7. UPDATE COMMENTS
-- =============================================================================

COMMENT ON POLICY production_lines_select ON production_lines IS 
    'All org users can view production lines';
COMMENT ON POLICY production_lines_insert ON production_lines IS 
    'Owner/Admin/SuperAdmin/ProdManager can create production lines (case-insensitive)';
COMMENT ON POLICY production_lines_update ON production_lines IS 
    'Owner/Admin/SuperAdmin/ProdManager can update production lines (case-insensitive)';
COMMENT ON POLICY production_lines_delete ON production_lines IS 
    'Owner/Admin/SuperAdmin can delete production lines (case-insensitive)';

COMMENT ON POLICY plm_select ON production_line_machines IS 
    'All org users can view machine assignments';
COMMENT ON POLICY plm_insert ON production_line_machines IS 
    'Owner/Admin/SuperAdmin/ProdManager can assign machines (case-insensitive)';
COMMENT ON POLICY plm_update ON production_line_machines IS 
    'Owner/Admin/SuperAdmin/ProdManager can update assignments (case-insensitive)';
COMMENT ON POLICY plm_delete ON production_line_machines IS 
    'Owner/Admin/SuperAdmin/ProdManager can remove assignments (case-insensitive)';

COMMIT;

-- =============================================================================
-- Migration complete: 152_fix_production_lines_rls_v2.sql
-- Bug Fix: BUG-013 resolved - RLS policies reapplied with:
--   1. super_admin role included
--   2. LOWER() for case-insensitive role matching
--   3. API routes updated to include super_admin in permission checks
-- =============================================================================
