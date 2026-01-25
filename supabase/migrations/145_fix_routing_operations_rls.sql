-- Migration: 145_fix_routing_operations_rls.sql
-- Description: Fix routing_operations RLS policies to include super_admin role
-- Date: 2026-01-25
-- Purpose: Allow super_admin role to manage routing operations

BEGIN;

-- =============================================================================
-- DROP EXISTING POLICIES
-- =============================================================================

DROP POLICY IF EXISTS routing_operations_insert ON routing_operations;
DROP POLICY IF EXISTS routing_operations_update ON routing_operations;
DROP POLICY IF EXISTS routing_operations_delete ON routing_operations;

-- =============================================================================
-- RECREATE INSERT POLICY: Include super_admin
-- =============================================================================

CREATE POLICY routing_operations_insert
ON routing_operations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Routing must belong to user's org
  routing_id IN (
    SELECT r.id
    FROM routings r
    WHERE r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND (
    -- User must have Create permission on technical module
    -- Role codes that have C in technical permissions: owner, admin, super_admin, production_manager
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'super_admin', 'production_manager')
  )
);

-- =============================================================================
-- RECREATE UPDATE POLICY: Include super_admin
-- =============================================================================

CREATE POLICY routing_operations_update
ON routing_operations
FOR UPDATE
TO authenticated
USING (
  -- Routing must belong to user's org
  routing_id IN (
    SELECT r.id
    FROM routings r
    WHERE r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND (
    -- User must have Update permission on technical module
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'super_admin', 'production_manager', 'quality_manager')
  )
);

-- =============================================================================
-- RECREATE DELETE POLICY: Include super_admin
-- =============================================================================

CREATE POLICY routing_operations_delete
ON routing_operations
FOR DELETE
TO authenticated
USING (
  -- Routing must belong to user's org
  routing_id IN (
    SELECT r.id
    FROM routings r
    WHERE r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND (
    -- Only owner, admin, and super_admin can delete
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'super_admin')
  )
);

-- =============================================================================
-- UPDATE COMMENTS
-- =============================================================================

COMMENT ON POLICY routing_operations_insert ON routing_operations IS
  'Only owner, admin, super_admin, and production_manager can create operations in their org routings';

COMMENT ON POLICY routing_operations_update ON routing_operations IS
  'Only owner, admin, super_admin, production_manager, and quality_manager can update operations';

COMMENT ON POLICY routing_operations_delete ON routing_operations IS
  'Only owner, admin, and super_admin can delete operations';

COMMIT;
