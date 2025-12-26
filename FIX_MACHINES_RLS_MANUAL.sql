-- =============================================================================
-- MANUAL FIX: Run this SQL in Supabase Dashboard -> SQL Editor
-- Problem: RLS policies use uppercase role codes (SUPER_ADMIN, ADMIN, etc.)
--          but actual role codes in database are lowercase (owner, admin, etc.)
-- =============================================================================

-- Step 1: Check current roles in your database
SELECT id, code, name FROM roles ORDER BY display_order;

-- Step 2: Drop and recreate machines RLS policies with correct role codes

-- Drop old policies
DROP POLICY IF EXISTS machines_select ON machines;
DROP POLICY IF EXISTS machines_insert ON machines;
DROP POLICY IF EXISTS machines_update ON machines;
DROP POLICY IF EXISTS machines_delete ON machines;

-- Recreate SELECT policy (all authenticated users can read)
CREATE POLICY machines_select
ON machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

-- Recreate INSERT policy with CORRECT lowercase role codes
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

-- Recreate UPDATE policy with CORRECT lowercase role codes
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

-- Recreate DELETE policy with CORRECT lowercase role codes
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

-- Step 3: Verify policies were created
SELECT policyname, cmd, qual::text, with_check::text 
FROM pg_policies 
WHERE tablename = 'machines';

-- Step 4: Test - Check your user's role
SELECT 
    u.id,
    u.email,
    u.org_id,
    r.code as role_code, 
    r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.id = auth.uid();
