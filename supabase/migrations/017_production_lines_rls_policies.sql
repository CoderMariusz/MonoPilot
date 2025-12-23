-- Migration: RLS Policies for Production Lines
-- Story: 01.11 - Production Lines CRUD
-- Purpose: Row-level security for production lines and junction tables
-- Pattern: ADR-013 (Users Table Lookup)
--
-- Policy Structure:
-- - production_lines: SELECT (all users), ALL (PROD_MANAGER+)
-- - production_line_machines: SELECT (all users), ALL (PROD_MANAGER+)
-- - production_line_products: SELECT (all users), ALL (PROD_MANAGER+)

-- =============================================================================
-- Enable RLS
-- =============================================================================

ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_line_machines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE production_line_products ENABLE ROW LEVEL SECURITY; -- COMMENTED: table doesn't exist yet

-- =============================================================================
-- RLS POLICIES: production_lines
-- =============================================================================

-- SELECT: All authenticated users can view lines in their org
CREATE POLICY production_lines_org_isolation
ON production_lines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- ALL: PROD_MANAGER+ can manage lines
CREATE POLICY production_lines_admin_write
ON production_lines
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
);

-- =============================================================================
-- RLS POLICIES: production_line_machines
-- =============================================================================

-- SELECT: All authenticated users can view machine assignments in their org
CREATE POLICY plm_org_isolation
ON production_line_machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- ALL: PROD_MANAGER+ can manage machine assignments
CREATE POLICY plm_admin_write
ON production_line_machines
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
);

-- =============================================================================
-- RLS POLICIES: production_line_products
-- =============================================================================
-- COMMENTED OUT: table doesn't exist yet (requires products table)

-- -- SELECT: All authenticated users can view product compatibility in their org
-- CREATE POLICY plp_org_isolation
-- ON production_line_products
-- FOR SELECT
-- TO authenticated
-- USING (
--     org_id = (SELECT org_id FROM users WHERE id = auth.uid())
-- );

-- -- ALL: PROD_MANAGER+ can manage product compatibility
-- CREATE POLICY plp_admin_write
-- ON production_line_products
-- FOR ALL
-- TO authenticated
-- USING (
--     org_id = (SELECT org_id FROM users WHERE id = auth.uid())
--     AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
--         IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
-- )
-- WITH CHECK (
--     org_id = (SELECT org_id FROM users WHERE id = auth.uid())
--     AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
--         IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
-- );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY production_lines_org_isolation ON production_lines IS 'All users can view lines in their org';
COMMENT ON POLICY production_lines_admin_write ON production_lines IS 'PROD_MANAGER+ can manage lines';
COMMENT ON POLICY plm_org_isolation ON production_line_machines IS 'All users can view machine assignments in their org';
COMMENT ON POLICY plm_admin_write ON production_line_machines IS 'PROD_MANAGER+ can manage machine assignments';
-- COMMENT ON POLICY plp_org_isolation ON production_line_products IS 'All users can view product compatibility in their org';
-- COMMENT ON POLICY plp_admin_write ON production_line_products IS 'PROD_MANAGER+ can manage product compatibility';
