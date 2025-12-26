-- Migration: Warehouses RLS Policies
-- Story: 01.8 - Warehouses CRUD
-- Purpose: Row Level Security policies for warehouses table
-- Pattern: ADR-013 - Users Table Lookup pattern

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: All authenticated users can read org warehouses
CREATE POLICY warehouses_select
ON warehouses
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT Policy: Only owners, admins and warehouse managers can create warehouses
CREATE POLICY warehouses_insert
ON warehouses
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'warehouse_manager')
    )
);

-- UPDATE Policy: Only owners, admins and warehouse managers can update warehouses
CREATE POLICY warehouses_update
ON warehouses
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'warehouse_manager')
    )
);

-- DELETE Policy: Only owners and admins can delete warehouses
-- Note: Soft delete (is_active=false) is preferred over hard delete
CREATE POLICY warehouses_delete
ON warehouses
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

-- Comments
COMMENT ON POLICY warehouses_select ON warehouses IS 'All authenticated users can read warehouses within their org';
COMMENT ON POLICY warehouses_insert ON warehouses IS 'Only admins and warehouse managers can create warehouses';
COMMENT ON POLICY warehouses_update ON warehouses IS 'Only admins and warehouse managers can update warehouses';
COMMENT ON POLICY warehouses_delete ON warehouses IS 'Only super admins and admins can delete warehouses (soft delete preferred)';
