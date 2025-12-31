-- Migration: Work order RLS policies
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: RLS policies for multi-tenant security (ADR-013)

-- ============================================================================
-- HELPER: Get user's role code
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.code
  FROM roles r
  JOIN users u ON u.role_id = r.id
  WHERE u.id = auth.uid();
$$;

-- ============================================================================
-- WORK_ORDERS POLICIES
-- ============================================================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS wo_select ON work_orders;
DROP POLICY IF EXISTS wo_insert ON work_orders;
DROP POLICY IF EXISTS wo_update ON work_orders;
DROP POLICY IF EXISTS wo_delete ON work_orders;

-- SELECT: Users can only see WOs in their organization
CREATE POLICY wo_select ON work_orders
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- INSERT: Only owner, admin, planner, production_manager can create WOs
CREATE POLICY wo_insert ON work_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND get_user_role_code() IN ('owner', 'admin', 'planner', 'production_manager')
  );

-- UPDATE: Only owner, admin, planner, production_manager can update WOs
CREATE POLICY wo_update ON work_orders
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND get_user_role_code() IN ('owner', 'admin', 'planner', 'production_manager')
  );

-- DELETE: Only owner, admin, planner can delete (and only draft status)
-- Note: Materials check will be enforced when wo_materials table exists (Story 03.12)
-- For now, only status and role checks are applied at RLS level
-- Additional materials check is enforced in the service layer
CREATE POLICY wo_delete ON work_orders
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND status = 'draft'
    AND get_user_role_code() IN ('owner', 'admin', 'planner')
  );

-- ============================================================================
-- WO_STATUS_HISTORY POLICIES
-- ============================================================================

DROP POLICY IF EXISTS wo_history_select ON wo_status_history;
DROP POLICY IF EXISTS wo_history_insert ON wo_status_history;

-- SELECT: Can only see history for WOs in user's org
CREATE POLICY wo_history_select ON wo_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = wo_status_history.wo_id
        AND wo.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: Can only insert history for WOs in user's org
CREATE POLICY wo_history_insert ON wo_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = wo_status_history.wo_id
        AND wo.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- WO_DAILY_SEQUENCE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS wo_seq_all ON wo_daily_sequence;

-- ALL: Users can only access their org's sequences
CREATE POLICY wo_seq_all ON wo_daily_sequence
  FOR ALL
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY wo_select ON work_orders IS 'RLS: Users can only view WOs in their organization';
COMMENT ON POLICY wo_insert ON work_orders IS 'RLS: Only planner+ roles can create WOs in their org';
COMMENT ON POLICY wo_update ON work_orders IS 'RLS: Only planner+ roles can update WOs in their org';
COMMENT ON POLICY wo_delete ON work_orders IS 'RLS: Only planner+ roles can delete draft WOs without materials';
COMMENT ON POLICY wo_history_select ON wo_status_history IS 'RLS: Can view history for own org WOs';
COMMENT ON POLICY wo_history_insert ON wo_status_history IS 'RLS: Can insert history for own org WOs';
COMMENT ON POLICY wo_seq_all ON wo_daily_sequence IS 'RLS: Org isolation for WO number sequences';
