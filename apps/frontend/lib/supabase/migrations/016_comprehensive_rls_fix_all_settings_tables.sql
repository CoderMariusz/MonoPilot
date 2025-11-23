-- Migration 016: Comprehensive RLS Fix for ALL Settings Tables
-- Fixes RLS policies to allow service_role bypass for all Epic 1 tables
-- Date: 2025-11-23
-- Author: Charlie (Senior Dev) + Claude Code
--
-- Tables covered:
--   1. warehouses
--   2. locations
--   3. machines
--   4. production_lines
--   5. allergens
--   6. tax_codes
--   7. user_invitations
--   8. user_sessions
--   9. machine_line_assignments

-- ============================================================================
-- 1. WAREHOUSES TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS warehouses_select_policy ON public.warehouses;
DROP POLICY IF EXISTS warehouses_insert_policy ON public.warehouses;
DROP POLICY IF EXISTS warehouses_update_policy ON public.warehouses;
DROP POLICY IF EXISTS warehouses_delete_policy ON public.warehouses;

-- Create policies with service_role bypass
CREATE POLICY warehouses_select_policy ON public.warehouses
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY warehouses_insert_policy ON public.warehouses
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY warehouses_update_policy ON public.warehouses
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY warehouses_delete_policy ON public.warehouses
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 2. LOCATIONS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS locations_select_policy ON public.locations;
DROP POLICY IF EXISTS locations_insert_policy ON public.locations;
DROP POLICY IF EXISTS locations_update_policy ON public.locations;
DROP POLICY IF EXISTS locations_delete_policy ON public.locations;

CREATE POLICY locations_select_policy ON public.locations
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY locations_insert_policy ON public.locations
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY locations_update_policy ON public.locations
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY locations_delete_policy ON public.locations
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 3. MACHINES TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS machines_select_policy ON public.machines;
DROP POLICY IF EXISTS machines_insert_policy ON public.machines;
DROP POLICY IF EXISTS machines_update_policy ON public.machines;
DROP POLICY IF EXISTS machines_delete_policy ON public.machines;

CREATE POLICY machines_select_policy ON public.machines
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY machines_insert_policy ON public.machines
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY machines_update_policy ON public.machines
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY machines_delete_policy ON public.machines
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 4. PRODUCTION_LINES TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS production_lines_select_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_insert_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_update_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_delete_policy ON public.production_lines;

CREATE POLICY production_lines_select_policy ON public.production_lines
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY production_lines_insert_policy ON public.production_lines
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY production_lines_update_policy ON public.production_lines
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY production_lines_delete_policy ON public.production_lines
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 5. ALLERGENS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS allergens_select_policy ON public.allergens;
DROP POLICY IF EXISTS allergens_insert_policy ON public.allergens;
DROP POLICY IF EXISTS allergens_update_policy ON public.allergens;
DROP POLICY IF EXISTS allergens_delete_policy ON public.allergens;

CREATE POLICY allergens_select_policy ON public.allergens
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY allergens_insert_policy ON public.allergens
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY allergens_update_policy ON public.allergens
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY allergens_delete_policy ON public.allergens
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 6. TAX_CODES TABLE RLS POLICIES (Re-apply for consistency)
-- ============================================================================

DROP POLICY IF EXISTS tax_codes_select_policy ON public.tax_codes;
DROP POLICY IF EXISTS tax_codes_insert_policy ON public.tax_codes;
DROP POLICY IF EXISTS tax_codes_update_policy ON public.tax_codes;
DROP POLICY IF EXISTS tax_codes_delete_policy ON public.tax_codes;

CREATE POLICY tax_codes_select_policy ON public.tax_codes
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY tax_codes_insert_policy ON public.tax_codes
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY tax_codes_update_policy ON public.tax_codes
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY tax_codes_delete_policy ON public.tax_codes
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 7. USER_INVITATIONS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS user_invitations_select_policy ON public.user_invitations;
DROP POLICY IF EXISTS user_invitations_insert_policy ON public.user_invitations;
DROP POLICY IF EXISTS user_invitations_update_policy ON public.user_invitations;
DROP POLICY IF EXISTS user_invitations_delete_policy ON public.user_invitations;

CREATE POLICY user_invitations_select_policy ON public.user_invitations
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY user_invitations_insert_policy ON public.user_invitations
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

CREATE POLICY user_invitations_update_policy ON public.user_invitations
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY user_invitations_delete_policy ON public.user_invitations
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    (
      org_id = (auth.jwt() ->> 'org_id')::uuid
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND org_id = (auth.jwt() ->> 'org_id')::uuid
      )
    )
  );

-- ============================================================================
-- 8. USER_SESSIONS TABLE RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS user_sessions_select_policy ON public.user_sessions;
DROP POLICY IF EXISTS user_sessions_insert_policy ON public.user_sessions;
DROP POLICY IF EXISTS user_sessions_update_policy ON public.user_sessions;
DROP POLICY IF EXISTS user_sessions_delete_policy ON public.user_sessions;

CREATE POLICY user_sessions_select_policy ON public.user_sessions
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

CREATE POLICY user_sessions_insert_policy ON public.user_sessions
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    user_id = auth.uid()
  );

CREATE POLICY user_sessions_update_policy ON public.user_sessions
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    user_id = auth.uid()
  );

CREATE POLICY user_sessions_delete_policy ON public.user_sessions
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- 9. MACHINE_LINE_ASSIGNMENTS TABLE RLS POLICIES (if exists)
-- ============================================================================

-- Note: machine_line_assignments is a join table, policies allow read for users,
-- write for admins, all operations for service_role

DROP POLICY IF EXISTS machine_line_assignments_select_policy ON public.machine_line_assignments;
DROP POLICY IF EXISTS machine_line_assignments_insert_policy ON public.machine_line_assignments;
DROP POLICY IF EXISTS machine_line_assignments_update_policy ON public.machine_line_assignments;
DROP POLICY IF EXISTS machine_line_assignments_delete_policy ON public.machine_line_assignments;

-- Allow SELECT for users who can see the related machine or production line
CREATE POLICY machine_line_assignments_select_policy ON public.machine_line_assignments
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.machines m
      WHERE m.id = machine_line_assignments.machine_id
      AND m.org_id = (auth.jwt() ->> 'org_id')::uuid
    ) OR
    EXISTS (
      SELECT 1 FROM public.production_lines pl
      WHERE pl.id = machine_line_assignments.line_id
      AND pl.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Allow INSERT/UPDATE/DELETE for admins only
CREATE POLICY machine_line_assignments_insert_policy ON public.machine_line_assignments
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

CREATE POLICY machine_line_assignments_update_policy ON public.machine_line_assignments
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

CREATE POLICY machine_line_assignments_delete_policy ON public.machine_line_assignments
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

COMMENT ON POLICY warehouses_select_policy ON public.warehouses IS 'Migration 016: Service role + org users can view warehouses';
COMMENT ON POLICY warehouses_insert_policy ON public.warehouses IS 'Migration 016: Service role + admins can create warehouses';
COMMENT ON POLICY warehouses_update_policy ON public.warehouses IS 'Migration 016: Service role + admins can update warehouses';
COMMENT ON POLICY warehouses_delete_policy ON public.warehouses IS 'Migration 016: Service role + admins can delete warehouses';

COMMENT ON POLICY locations_select_policy ON public.locations IS 'Migration 016: Service role + org users can view locations';
COMMENT ON POLICY machines_select_policy ON public.machines IS 'Migration 016: Service role + org users can view machines';
COMMENT ON POLICY production_lines_select_policy ON public.production_lines IS 'Migration 016: Service role + org users can view production lines';
COMMENT ON POLICY allergens_select_policy ON public.allergens IS 'Migration 016: Service role + org users can view allergens';
COMMENT ON POLICY tax_codes_select_policy ON public.tax_codes IS 'Migration 016: Service role + org users can view tax codes';
COMMENT ON POLICY user_invitations_select_policy ON public.user_invitations IS 'Migration 016: Service role + org users can view invitations';
COMMENT ON POLICY user_sessions_select_policy ON public.user_sessions IS 'Migration 016: Service role + user/admins can view sessions';
COMMENT ON POLICY machine_line_assignments_select_policy ON public.machine_line_assignments IS 'Migration 016: Service role + org users can view assignments';
