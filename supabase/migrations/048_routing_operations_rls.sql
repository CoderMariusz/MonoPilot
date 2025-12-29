-- Migration: 048_routing_operations_rls.sql
-- Description: RLS policies for routing_operations table (Story 02.8 security fix)
-- Date: 2025-12-28
-- Author: Backend Dev Agent
-- Related: ADR-013 (RLS Org Isolation Pattern), Story 02.8 code review SEC-001

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Enable Row Level Security on routing_operations table following ADR-013 pattern.
-- This ensures multi-tenant isolation - users can only access operations
-- for routings that belong to their organization.
--
-- The org_id is derived through the parent routing's org_id (not stored directly).
-- This is a standard pattern for child tables in multi-tenant systems.

BEGIN;

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (prevents bypassing RLS even for service role)
ALTER TABLE routing_operations FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- SELECT POLICY: All authenticated users can read operations for their org's routings
-- =============================================================================

CREATE POLICY routing_operations_select
ON routing_operations
FOR SELECT
TO authenticated
USING (
  -- User can select operations for routings that belong to their org
  routing_id IN (
    SELECT r.id
    FROM routings r
    WHERE r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

-- =============================================================================
-- INSERT POLICY: Users with technical write permission can create operations
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
    -- Role codes that have C in technical permissions: owner, admin, production_manager
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager')
  )
);

-- =============================================================================
-- UPDATE POLICY: Users with technical update permission can modify operations
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
    -- Role codes that have U in technical permissions: owner, admin, production_manager, quality_manager
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager', 'quality_manager')
  )
);

-- =============================================================================
-- DELETE POLICY: Only admins can delete operations
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
    -- Only owner and admin can delete
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin')
  )
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY routing_operations_select ON routing_operations IS
  'All authenticated users can read operations for routings within their organization';

COMMENT ON POLICY routing_operations_insert ON routing_operations IS
  'Only owner, admin, and production_manager can create operations in their org routings';

COMMENT ON POLICY routing_operations_update ON routing_operations IS
  'Only owner, admin, production_manager, and quality_manager can update operations';

COMMENT ON POLICY routing_operations_delete ON routing_operations IS
  'Only owner and admin can delete operations (soft delete preferred)';

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'routing_operations';
--
-- Check policies exist:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'routing_operations';
--
-- Test cross-tenant isolation:
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "user-from-org-a"}';
-- SELECT * FROM routing_operations; -- Should only return org-a operations

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
-- DROP POLICY IF EXISTS routing_operations_select ON routing_operations;
-- DROP POLICY IF EXISTS routing_operations_insert ON routing_operations;
-- DROP POLICY IF EXISTS routing_operations_update ON routing_operations;
-- DROP POLICY IF EXISTS routing_operations_delete ON routing_operations;
-- ALTER TABLE routing_operations DISABLE ROW LEVEL SECURITY;
-- COMMIT;
