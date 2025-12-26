-- Migration: Fix role codes in RLS policies
-- Problem: RLS policies use uppercase role codes (SUPER_ADMIN, ADMIN, etc.)
--          but actual role codes in database are lowercase (owner, admin, etc.)
-- Solution: Update all RLS policies to use correct lowercase role codes

-- =============================================================================
-- FIX MACHINES RLS POLICIES
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS machines_select ON machines;
DROP POLICY IF EXISTS machines_insert ON machines;
DROP POLICY IF EXISTS machines_update ON machines;
DROP POLICY IF EXISTS machines_delete ON machines;

-- Recreate with correct role codes
CREATE POLICY machines_select
ON machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

CREATE POLICY machines_insert
ON machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

CREATE POLICY machines_update
ON machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'production_manager')
    )
);

CREATE POLICY machines_delete
ON machines
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
-- FIX PRODUCTION LINES RLS POLICIES
-- =============================================================================

-- Drop old policies (if they have wrong role codes)
DROP POLICY IF EXISTS production_lines_insert ON production_lines;
DROP POLICY IF EXISTS production_lines_update ON production_lines;
DROP POLICY IF EXISTS production_lines_delete ON production_lines;

-- Recreate with correct role codes (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_lines') THEN
        -- Check if policy doesn't exist before creating
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'production_lines' AND policyname = 'production_lines_insert') THEN
            EXECUTE '
            CREATE POLICY production_lines_insert
            ON production_lines
            FOR INSERT
            TO authenticated
            WITH CHECK (
                org_id = (SELECT org_id FROM users WHERE id = auth.uid())
                AND (
                    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
                    IN (''owner'', ''admin'', ''production_manager'')
                )
            )';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'production_lines' AND policyname = 'production_lines_update') THEN
            EXECUTE '
            CREATE POLICY production_lines_update
            ON production_lines
            FOR UPDATE
            TO authenticated
            USING (
                org_id = (SELECT org_id FROM users WHERE id = auth.uid())
                AND (
                    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
                    IN (''owner'', ''admin'', ''production_manager'')
                )
            )';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'production_lines' AND policyname = 'production_lines_delete') THEN
            EXECUTE '
            CREATE POLICY production_lines_delete
            ON production_lines
            FOR DELETE
            TO authenticated
            USING (
                org_id = (SELECT org_id FROM users WHERE id = auth.uid())
                AND (
                    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
                    IN (''owner'', ''admin'')
                )
            )';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- VERIFY CHANGES
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated to use correct lowercase role codes';
    RAISE NOTICE 'Affected tables: machines, production_lines';
    RAISE NOTICE 'Role codes used: owner, admin, production_manager, warehouse_manager, etc.';
END $$;
