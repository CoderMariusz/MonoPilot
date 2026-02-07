-- Migration: Fix tax_codes RLS policies to accept lowercase role codes
-- Bug Fix: P0 - DELETE functionality blocked by case-sensitive role check
-- Date: 2026-02-07
-- Description: Admin users have 'admin' role (lowercase), but RLS policies check for 'ADMIN' (uppercase)

-- =============================================================================
-- DROP AND RECREATE RLS POLICIES WITH CASE-INSENSITIVE ROLE CHECK
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS tax_codes_insert ON tax_codes;
DROP POLICY IF EXISTS tax_codes_update ON tax_codes;
DROP POLICY IF EXISTS tax_codes_delete ON tax_codes;

-- INSERT POLICY: Only admins can create tax codes (accept both cases)
CREATE POLICY tax_codes_insert
ON tax_codes
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('super_admin', 'admin', 'owner')
    )
);

-- UPDATE POLICY: Only admins can update tax codes (accept both cases)
CREATE POLICY tax_codes_update
ON tax_codes
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('super_admin', 'admin', 'owner')
    )
);

-- DELETE POLICY: Only admins can delete tax codes (accept both cases)
CREATE POLICY tax_codes_delete
ON tax_codes
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT LOWER(r.code) FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('super_admin', 'admin', 'owner')
    )
);

-- =============================================================================
-- ADD UPDATED COMMENTS
-- =============================================================================

COMMENT ON POLICY tax_codes_insert ON tax_codes IS 'Only admins/owners can create tax codes (case-insensitive role check)';
COMMENT ON POLICY tax_codes_update ON tax_codes IS 'Only admins/owners can update tax codes (case-insensitive role check)';
COMMENT ON POLICY tax_codes_delete ON tax_codes IS 'Only admins/owners can delete tax codes (case-insensitive role check)';

-- =============================================================================
-- Migration complete: 999_fix_tax_codes_rls_role_case.sql
-- =============================================================================
-- Bug Fix: RLS policies now accept lowercase role codes ('admin', 'owner')
-- Impact: DELETE functionality unblocked for admin users
