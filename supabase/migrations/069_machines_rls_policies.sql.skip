-- Migration: Machines RLS Policies
-- Story: 01.10 - Machines CRUD
-- Purpose: Row Level Security policies for machines table
-- Pattern: ADR-013 - Users Table Lookup pattern

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SELECT POLICY: All authenticated users can read org machines (exclude deleted)
-- =============================================================================

CREATE POLICY machines_select
ON machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

-- =============================================================================
-- INSERT POLICY: Production managers and admins can create machines
-- =============================================================================

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

-- =============================================================================
-- UPDATE POLICY: Production managers and admins can update machines
-- =============================================================================

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

-- =============================================================================
-- DELETE POLICY: Only super admins and admins can delete machines
-- =============================================================================

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
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY machines_select ON machines IS 'All authenticated users can read machines within their org (excluding soft-deleted)';
COMMENT ON POLICY machines_insert ON machines IS 'Only admins and production managers can create machines';
COMMENT ON POLICY machines_update ON machines IS 'Only admins and production managers can update machines';
COMMENT ON POLICY machines_delete ON machines IS 'Only super admins and admins can delete machines (soft delete preferred)';
