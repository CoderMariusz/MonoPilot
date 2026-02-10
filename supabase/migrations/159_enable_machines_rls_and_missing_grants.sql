-- Migration: Enable RLS for machines table and add missing GRANT statements
-- Story: 01.10 - Machines CRUD
-- Purpose: Ensure all tables have RLS enabled and proper GRANT permissions visible through PostgREST
-- Date: 2026-02-10

-- =============================================================================
-- ENABLE RLS ON MACHINES TABLE
-- =============================================================================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MACHINES RLS POLICIES
-- =============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "machines_select" ON machines;
DROP POLICY IF EXISTS "machines_insert" ON machines;
DROP POLICY IF EXISTS "machines_update" ON machines;
DROP POLICY IF EXISTS "machines_delete" ON machines;

-- SELECT POLICY: All authenticated users can read org machines (exclude deleted)
CREATE POLICY machines_select
ON machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

-- INSERT POLICY: Production managers and admins can create machines
CREATE POLICY machines_insert
ON machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);

-- UPDATE POLICY: Production managers and admins can update machines
CREATE POLICY machines_update
ON machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);

-- DELETE POLICY: Only super admins and admins can delete machines
CREATE POLICY machines_delete
ON machines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- =============================================================================
-- COMMENTS FOR MACHINES
-- =============================================================================

COMMENT ON POLICY machines_select ON machines IS 'All authenticated users can read machines within their org (excluding soft-deleted)';
COMMENT ON POLICY machines_insert ON machines IS 'Only admins and production managers can create machines';
COMMENT ON POLICY machines_update ON machines IS 'Only admins and production managers can update machines';
COMMENT ON POLICY machines_delete ON machines IS 'Only super admins and admins can delete machines (soft delete preferred)';

-- =============================================================================
-- PRODUCTION_LINE_MACHINES RLS POLICIES (Missing from migration 017)
-- =============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "production_line_machines_select" ON production_line_machines;
DROP POLICY IF EXISTS "production_line_machines_insert" ON production_line_machines;
DROP POLICY IF EXISTS "production_line_machines_update" ON production_line_machines;
DROP POLICY IF EXISTS "production_line_machines_delete" ON production_line_machines;

-- SELECT POLICY: Users can read production line machines in their org
CREATE POLICY production_line_machines_select
ON production_line_machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT POLICY: Admins and production managers can create production line machine assignments
CREATE POLICY production_line_machines_insert
ON production_line_machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);

-- UPDATE POLICY: Admins and production managers can update machine assignments
CREATE POLICY production_line_machines_update
ON production_line_machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);

-- DELETE POLICY: Admins can remove machine assignments
CREATE POLICY production_line_machines_delete
ON production_line_machines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- =============================================================================
-- COMMENTS FOR PRODUCTION_LINE_MACHINES
-- =============================================================================

COMMENT ON POLICY production_line_machines_select ON production_line_machines IS 'Users can read production line machine assignments in their org';
COMMENT ON POLICY production_line_machines_insert ON production_line_machines IS 'Only admins and production managers can assign machines to production lines';
COMMENT ON POLICY production_line_machines_update ON production_line_machines IS 'Only admins and production managers can update machine assignments';
COMMENT ON POLICY production_line_machines_delete ON production_line_machines IS 'Only admins can remove machine assignments';

-- =============================================================================
-- GRANT PERMISSIONS FOR MACHINES Table
-- =============================================================================

-- Allow authenticated users to interact with machines table through PostgREST API
GRANT SELECT, INSERT, UPDATE, DELETE ON machines TO authenticated;

-- =============================================================================
-- VERIFY RLS IS ENABLED ON ALL TABLES (5 key ones)
-- =============================================================================

-- These tables should all have RLS enabled:
-- - warehouses (migration 009)
-- - locations (migration 011)
-- - production_lines (migration 042/156)
-- - production_line_machines (migration 017)
-- - machines (THIS migration 159)

-- Verify with: SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;
