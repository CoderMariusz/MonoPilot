-- Migration: 150_fix_production_lines_rls_permissions.sql
-- Bug Fix: BUG-009 - "permission denied for table production_lines"
-- Date: 2026-02-07
-- Root Cause: RLS policies missing super_admin role and case-sensitive role check
-- Solution: Add super_admin + use LOWER() for case-insensitive role matching

BEGIN;

-- =============================================================================
-- 1. DROP EXISTING PRODUCTION_LINES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS production_lines_select ON production_lines;
DROP POLICY IF EXISTS production_lines_insert ON production_lines;
DROP POLICY IF EXISTS production_lines_update ON production_lines;
DROP POLICY IF EXISTS production_lines_delete ON production_lines;

-- =============================================================================
-- 2. RECREATE POLICIES WITH SUPER_ADMIN + CASE-INSENSITIVE CHECK
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
-- 3. DROP EXISTING PRODUCTION_LINE_MACHINES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS plm_select ON production_line_machines;
DROP POLICY IF EXISTS plm_insert ON production_line_machines;
DROP POLICY IF EXISTS plm_update ON production_line_machines;
DROP POLICY IF EXISTS plm_delete ON production_line_machines;

-- =============================================================================
-- 4. RECREATE PRODUCTION_LINE_MACHINES POLICIES
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
-- 5. UPDATE COMMENTS
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
-- Migration complete: 150_fix_production_lines_rls_permissions.sql
-- Bug Fix: BUG-009 resolved - added super_admin + case-insensitive role check
-- =============================================================================
