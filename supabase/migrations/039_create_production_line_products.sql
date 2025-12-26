-- Migration: Create production_line_products table and RLS policies
-- Story: 01.11 - Production Lines CRUD
-- Purpose: Enable product compatibility feature for production lines
-- Date: 2025-12-26

-- 1. Create Table
CREATE TABLE IF NOT EXISTS production_line_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT plp_line_product_unique UNIQUE(line_id, product_id)
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_plp_line ON production_line_products(line_id);
CREATE INDEX IF NOT EXISTS idx_plp_product ON production_line_products(product_id);

-- 3. Enable RLS
ALTER TABLE production_line_products ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (using correct lowercase role codes)
-- SELECT: All authenticated users can view product compatibility in their org
CREATE POLICY plp_org_isolation
ON production_line_products
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- ALL: owner, admin, or production_manager can manage product compatibility
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

-- 5. Add Comments
COMMENT ON TABLE production_line_products IS 'Product compatibility for production lines (empty = unrestricted)';
COMMENT ON CONSTRAINT plp_line_product_unique ON production_line_products IS 'Product can only be assigned once per line';
COMMENT ON POLICY plp_org_isolation ON production_line_products IS 'All users can view product compatibility in their org';
COMMENT ON POLICY plp_admin_write ON production_line_products IS 'Owners, admins, and production managers can manage product compatibility';
