-- =============================================================================
-- COMPREHENSIVE SETTINGS RLS FIX
-- Run this in Supabase Dashboard -> SQL Editor
-- 
-- Fixes role codes from UPPERCASE (SUPER_ADMIN) to lowercase (owner, admin, etc.)
-- to match actual database values and prevent "Insufficient permissions" 403 errors.
-- =============================================================================

-- 1. FIX PRODUCTION LINES
DROP POLICY IF EXISTS production_lines_admin_write ON production_lines;
CREATE POLICY production_lines_admin_write
ON production_lines
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
);

-- 2. FIX PRODUCTION LINE MACHINES (JUNCTION TABLE)
DROP POLICY IF EXISTS plm_admin_write ON production_line_machines;
CREATE POLICY plm_admin_write
ON production_line_machines
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
);

-- 3. CREATE AND FIX PRODUCTION LINE PRODUCTS (MISSING JUNCTION TABLE)
CREATE TABLE IF NOT EXISTS production_line_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT plp_line_product_unique UNIQUE(line_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_plp_line ON production_line_products(line_id);
CREATE INDEX IF NOT EXISTS idx_plp_product ON production_line_products(product_id);

ALTER TABLE production_line_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plp_org_isolation ON production_line_products;
CREATE POLICY plp_org_isolation 
ON production_line_products FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS plp_admin_write ON production_line_products;
CREATE POLICY plp_admin_write
ON production_line_products
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
);

-- 4. FIX TAX CODES
DROP POLICY IF EXISTS tax_codes_insert ON tax_codes;
DROP POLICY IF EXISTS tax_codes_update ON tax_codes;
DROP POLICY IF EXISTS tax_codes_delete ON tax_codes;

CREATE POLICY tax_codes_insert
ON tax_codes
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

CREATE POLICY tax_codes_update
ON tax_codes
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

CREATE POLICY tax_codes_delete
ON tax_codes
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

-- 5. VERIFY POLICIES
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual::text, 
    with_check::text
FROM pg_policies
WHERE tablename IN ('production_lines', 'production_line_machines', 'production_line_products', 'tax_codes')
ORDER BY tablename, cmd;
