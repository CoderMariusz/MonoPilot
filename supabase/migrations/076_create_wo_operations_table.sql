-- Migration: 076_create_wo_operations_table.sql
-- Description: WO Operations table with RLS, indexes, functions, triggers
-- Story: 03.12 - WO Operations (Routing Copy)
-- Date: 2025-12-31
-- Author: BACKEND-DEV

BEGIN;

-- =============================================================================
-- TABLE: wo_operations
-- =============================================================================

CREATE TABLE IF NOT EXISTS wo_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Operation identity
  sequence INTEGER NOT NULL,
  operation_name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Resource assignment (copied from routing_operations)
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,

  -- Expected performance (from routing)
  expected_duration_minutes INTEGER,
  expected_yield_percent DECIMAL(5,2),

  -- Actual performance (filled during production in Epic 04)
  actual_duration_minutes INTEGER,
  actual_yield_percent DECIMAL(5,2),

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_by UUID,
  completed_by UUID,

  CONSTRAINT wo_operations_started_by_fkey FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT wo_operations_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Skipped operations
  skip_reason TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT wo_ops_unique_sequence UNIQUE(wo_id, sequence),
  CONSTRAINT wo_ops_expected_duration_positive CHECK (expected_duration_minutes IS NULL OR expected_duration_minutes > 0),
  CONSTRAINT wo_ops_actual_duration_positive CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0),
  CONSTRAINT wo_ops_expected_yield_range CHECK (expected_yield_percent IS NULL OR (expected_yield_percent >= 0 AND expected_yield_percent <= 100)),
  CONSTRAINT wo_ops_actual_yield_range CHECK (actual_yield_percent IS NULL OR (actual_yield_percent >= 0 AND actual_yield_percent <= 100))
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_wo_ops_wo_id ON wo_operations(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_ops_org_id ON wo_operations(organization_id);
CREATE INDEX IF NOT EXISTS idx_wo_ops_status ON wo_operations(status);
CREATE INDEX IF NOT EXISTS idx_wo_ops_machine ON wo_operations(machine_id) WHERE machine_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wo_ops_line ON wo_operations(line_id) WHERE line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wo_ops_sequence ON wo_operations(wo_id, sequence);

-- =============================================================================
-- FUNCTION: copy_routing_to_wo
-- =============================================================================

CREATE OR REPLACE FUNCTION copy_routing_to_wo(
  p_wo_id UUID,
  p_org_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_routing_id UUID;
  v_wo_copy_routing BOOLEAN;
  v_operation_count INTEGER := 0;
BEGIN
  -- Get WO routing_id
  SELECT routing_id INTO v_routing_id
  FROM work_orders
  WHERE id = p_wo_id AND org_id = p_org_id;

  -- Check if WO exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  -- Check setting (default to TRUE if not set)
  SELECT COALESCE(wo_copy_routing, TRUE) INTO v_wo_copy_routing
  FROM planning_settings
  WHERE org_id = p_org_id;

  -- Default to TRUE if no settings row exists
  IF v_wo_copy_routing IS NULL THEN
    v_wo_copy_routing := TRUE;
  END IF;

  -- Exit if setting disabled or no routing
  IF v_wo_copy_routing = FALSE OR v_routing_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Check if operations already exist (idempotency)
  SELECT COUNT(*) INTO v_operation_count
  FROM wo_operations
  WHERE wo_id = p_wo_id;

  IF v_operation_count > 0 THEN
    -- Operations already copied, return existing count
    RETURN v_operation_count;
  END IF;

  -- Copy routing operations to wo_operations
  INSERT INTO wo_operations (
    wo_id,
    organization_id,
    sequence,
    operation_name,
    description,
    instructions,
    machine_id,
    line_id,
    expected_duration_minutes,
    expected_yield_percent,
    status
  )
  SELECT
    p_wo_id,
    p_org_id,
    ro.sequence,
    ro.operation_name,
    NULL, -- description not in routing_operations
    ro.instructions,
    ro.machine_id,
    ro.line_id,
    COALESCE(ro.expected_duration_minutes, 0) + COALESCE(ro.setup_time_minutes, 0) + COALESCE(ro.cleanup_time_minutes, 0),
    ro.expected_yield_percent,  -- Copy expected_yield_percent from routing_operations
    'pending'
  FROM routing_operations ro
  WHERE ro.routing_id = v_routing_id
  ORDER BY ro.sequence;

  GET DIAGNOSTICS v_operation_count = ROW_COUNT;

  RETURN v_operation_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: update_wo_ops_timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_wo_ops_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_wo_ops_update_timestamp ON wo_operations;
CREATE TRIGGER tr_wo_ops_update_timestamp
BEFORE UPDATE ON wo_operations
FOR EACH ROW
EXECUTE FUNCTION update_wo_ops_timestamp();

-- =============================================================================
-- TRIGGER: calculate_wo_ops_duration
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_wo_ops_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
    NEW.actual_duration_minutes := CEIL(EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_wo_ops_calculate_duration ON wo_operations;
CREATE TRIGGER tr_wo_ops_calculate_duration
BEFORE UPDATE OF status, completed_at ON wo_operations
FOR EACH ROW
EXECUTE FUNCTION calculate_wo_ops_duration();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE wo_operations ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view operations from their organization
CREATE POLICY "wo_ops_select" ON wo_operations
FOR SELECT TO authenticated
USING (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: Only admin/planner/prod_manager can insert
CREATE POLICY "wo_ops_insert" ON wo_operations
FOR INSERT TO authenticated
WITH CHECK (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN', 'PLANNER', 'PROD_MANAGER')
  )
);

-- UPDATE: Operators can also update (for status changes during production)
CREATE POLICY "wo_ops_update" ON wo_operations
FOR UPDATE TO authenticated
USING (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN', 'PLANNER', 'PROD_MANAGER', 'OPERATOR')
  )
);

-- DELETE: Only admins can delete
CREATE POLICY "wo_ops_delete" ON wo_operations
FOR DELETE TO authenticated
USING (
  organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON wo_operations TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE wo_operations IS 'WO Operations - immutable snapshot of routing operations copied on WO release (Story 03.12)';
COMMENT ON COLUMN wo_operations.sequence IS 'Operation sequence number from routing';
COMMENT ON COLUMN wo_operations.operation_name IS 'Name of the operation';
COMMENT ON COLUMN wo_operations.expected_duration_minutes IS 'duration + setup_time + cleanup_time from routing';
COMMENT ON COLUMN wo_operations.status IS 'pending, in_progress, completed, skipped';
COMMENT ON FUNCTION copy_routing_to_wo IS 'Copy routing operations to WO as snapshot. Idempotent - returns existing count if already copied.';

COMMIT;
