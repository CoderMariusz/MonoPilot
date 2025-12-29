-- Migration: Fix role codes in RLS policies for remaining tables
-- Problem: RLS policies use uppercase role codes (SUPER_ADMIN, ADMIN)
--          but actual role codes in database are lowercase (owner, admin)
-- Tables fixed: tax_codes, products, product_types, product_allergens (check), user_sessions
-- Date: 2025-12-26

-- =============================================================================
-- 1. FIX TAX_CODES RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS tax_codes_insert ON tax_codes;
DROP POLICY IF EXISTS tax_codes_update ON tax_codes;
DROP POLICY IF EXISTS tax_codes_delete ON tax_codes;

-- Recreate with correct lowercase role codes
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

-- =============================================================================
-- 2. FIX PRODUCTS RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS products_delete ON products;

-- Recreate with correct role codes (Products delete is soft-delete which is an UPDATE)
CREATE POLICY products_delete
ON products
FOR UPDATE
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

-- Note: products_write and products_update don't have role checks in original migration, 
-- which is intentional as production managers etc can also CRUD products.

-- =============================================================================
-- 3. FIX PRODUCT_TYPES RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS product_types_admin_write ON product_types;

CREATE POLICY product_types_admin_write
ON product_types
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
    )
);

-- =============================================================================
-- 4. FIX USER_SESSIONS RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS sessions_admin_read_all ON user_sessions;

CREATE POLICY sessions_admin_read_all
ON user_sessions
FOR SELECT
TO authenticated
USING (
    (
        SELECT r.code
        FROM roles r
        JOIN users u ON u.role_id = r.id
        WHERE u.id = auth.uid()
    ) IN ('owner', 'admin')
);

-- =============================================================================
-- VERIFY NOTICE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated for tax_codes, products, product_types, and user_sessions';
END $$;
