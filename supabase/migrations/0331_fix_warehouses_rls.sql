-- Migration: Fix Warehouses RLS Policies
-- Story: 01.8 - Warehouses CRUD
-- Purpose: Fix RLS policies to match actual role codes (lowercase) and include owner
-- Date: 2025-12-24

-- Drop existing policies if they exist (to ensure clean slate)
DROP POLICY IF EXISTS warehouses_insert ON warehouses;
DROP POLICY IF EXISTS warehouses_update ON warehouses;
DROP POLICY IF EXISTS warehouses_delete ON warehouses;

-- Recreate INSERT Policy with correct role codes
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

-- Recreate UPDATE Policy with correct role codes
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

-- Recreate DELETE Policy with correct role codes
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
COMMENT ON POLICY warehouses_insert ON warehouses IS 'Only owners, admins and warehouse managers can create warehouses';
COMMENT ON POLICY warehouses_update ON warehouses IS 'Only owners, admins and warehouse managers can update warehouses';
COMMENT ON POLICY warehouses_delete ON warehouses IS 'Only owners and admins can delete warehouses';
