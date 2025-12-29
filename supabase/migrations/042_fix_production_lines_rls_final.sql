-- Migration: Standardize Production Lines RLS (Story 01.11)
-- Purpose: Correct role codes and cleanup inconsistent policy names
-- Pattern: ADR-013 (Users Table Lookup pattern)

-- =============================================================================
-- 1. CLEANUP OLD POLICIES
-- =============================================================================

-- production_lines cleanup
DROP POLICY IF EXISTS production_lines_org_isolation ON production_lines;
DROP POLICY IF EXISTS production_lines_admin_write ON production_lines;
DROP POLICY IF EXISTS production_lines_insert ON production_lines;
DROP POLICY IF EXISTS production_lines_update ON production_lines;
DROP POLICY IF EXISTS production_lines_delete ON production_lines;

-- production_line_machines cleanup
DROP POLICY IF EXISTS plm_org_isolation ON production_line_machines;
DROP POLICY IF EXISTS plm_admin_write ON production_line_machines;
DROP POLICY IF EXISTS plm_insert ON production_line_machines;
DROP POLICY IF EXISTS plm_update ON production_line_machines;
DROP POLICY IF EXISTS plm_delete ON production_line_machines;

-- =============================================================================
-- 2. CREATE NEW POLICIES: production_lines
-- =============================================================================

-- SELECT: All authenticated users can view lines in their org
CREATE POLICY production_lines_select
ON production_lines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: owner, admin, or production_manager can create lines
CREATE POLICY production_lines_insert
ON production_lines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

-- UPDATE: owner, admin, or production_manager can update lines
CREATE POLICY production_lines_update
ON production_lines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

-- DELETE: owner and admin only can delete lines
CREATE POLICY production_lines_delete
ON production_lines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

-- =============================================================================
-- 3. CREATE NEW POLICIES: production_line_machines
-- =============================================================================

-- SELECT: All authenticated users can view machine assignments in their org
CREATE POLICY plm_select
ON production_line_machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: owner, admin, or production_manager can assign machines
CREATE POLICY plm_insert
ON production_line_machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

-- UPDATE: owner, admin, or production_manager can update assignments
CREATE POLICY plm_update
ON production_line_machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

-- DELETE: owner, admin, or production_manager can remove assignments
CREATE POLICY plm_delete
ON production_line_machines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

-- =============================================================================
-- 4. ADD COMMENTS
-- =============================================================================

COMMENT ON POLICY production_lines_select ON production_lines IS 'All Org users can view production lines';
COMMENT ON POLICY production_lines_insert ON production_lines IS 'PROD_MANAGER+ can create production lines';
COMMENT ON POLICY production_lines_update ON production_lines IS 'PROD_MANAGER+ can update production lines';
COMMENT ON POLICY production_lines_delete ON production_lines IS 'ADMIN+ can delete production lines';

COMMENT ON POLICY plm_select ON production_line_machines IS 'All Org users can view machine assignments';
COMMENT ON POLICY plm_insert ON production_line_machines IS 'PROD_MANAGER+ can assign machines to lines';
COMMENT ON POLICY plm_update ON production_line_machines IS 'PROD_MANAGER+ can update machine sequence';
COMMENT ON POLICY plm_delete ON production_line_machines IS 'PROD_MANAGER+ can remove machines from lines';
