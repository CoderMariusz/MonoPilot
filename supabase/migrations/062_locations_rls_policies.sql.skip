-- Migration: Locations RLS Policies
-- Story: 01.9 - Warehouse Locations Management
-- Purpose: Row Level Security policies for locations table
-- Pattern: ADR-013 - Users Table Lookup pattern

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SELECT POLICY: All authenticated users can read org locations
-- =============================================================================

CREATE POLICY locations_select
ON locations
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- =============================================================================
-- INSERT POLICY: Users can create locations in their org warehouses
-- =============================================================================

CREATE POLICY locations_insert
ON locations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Location must belong to user's org
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    -- Warehouse must exist and belong to user's org
    AND warehouse_id IN (
        SELECT id FROM warehouses
        WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    -- If parent_id is provided, parent must belong to user's org
    AND (
        parent_id IS NULL
        OR parent_id IN (
            SELECT id FROM locations
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    )
);

-- =============================================================================
-- UPDATE POLICY: Users can update locations in their org
-- =============================================================================

CREATE POLICY locations_update
ON locations
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- =============================================================================
-- DELETE POLICY: Users can delete locations in their org
-- =============================================================================

CREATE POLICY locations_delete
ON locations
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY locations_select ON locations IS 'All authenticated users can read locations within their org';
COMMENT ON POLICY locations_insert ON locations IS 'Users can create locations in their org warehouses with parent validation';
COMMENT ON POLICY locations_update ON locations IS 'Users can update locations within their org';
COMMENT ON POLICY locations_delete ON locations IS 'Users can delete locations within their org (subject to FK constraints)';
