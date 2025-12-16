-- Migration: RLS Policies for Story 01.1
-- Description: Baseline RLS policies following ADR-013 pattern
-- Date: 2025-12-16
-- Pattern: Users Table Lookup (SELECT org_id FROM users WHERE id = auth.uid())

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Users can only see their own organization
CREATE POLICY "org_select_own" ON organizations
FOR SELECT
TO authenticated
USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admin roles can update organization (owner, admin)
CREATE POLICY "org_admin_update" ON organizations
FOR UPDATE
TO authenticated
USING (
  id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- ============================================================================
-- ROLES TABLE
-- ============================================================================

-- All authenticated users can read system roles
CREATE POLICY "roles_select_system" ON roles
FOR SELECT
TO authenticated
USING (is_system = true);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Users can only see other users in their org
CREATE POLICY "users_org_isolation" ON users
FOR SELECT
TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admin roles can insert users (owner, admin)
CREATE POLICY "users_admin_insert" ON users
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can update users (owner, admin)
CREATE POLICY "users_admin_update" ON users
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can delete users (owner, admin)
CREATE POLICY "users_admin_delete" ON users
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- ============================================================================
-- MODULES TABLE
-- ============================================================================

-- All authenticated users can read modules (no org_id - public read)
CREATE POLICY "modules_select_all" ON modules
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- ORGANIZATION_MODULES TABLE
-- ============================================================================

-- Users can only see module state for their org
CREATE POLICY "org_modules_isolation" ON organization_modules
FOR SELECT
TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admin roles can insert org modules (owner, admin)
CREATE POLICY "org_modules_admin_insert" ON organization_modules
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can update org modules (owner, admin)
CREATE POLICY "org_modules_admin_update" ON organization_modules
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can delete org modules (owner, admin)
CREATE POLICY "org_modules_admin_delete" ON organization_modules
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "org_select_own" ON organizations IS 'ADR-013: Users can only see their own org';
COMMENT ON POLICY "users_org_isolation" ON users IS 'ADR-013: Org isolation using users table lookup';
COMMENT ON POLICY "roles_select_system" ON roles IS 'All users can read system roles (no org_id)';
COMMENT ON POLICY "modules_select_all" ON modules IS 'Modules are public read (no org_id)';
COMMENT ON POLICY "org_modules_isolation" ON organization_modules IS 'ADR-013: Org-specific module state';
