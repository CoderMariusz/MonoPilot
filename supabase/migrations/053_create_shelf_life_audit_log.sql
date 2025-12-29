-- ============================================================================
-- Migration: Create shelf_life_audit_log table
-- Story: 02.11 - Shelf Life Calculation + Expiry Management
-- Purpose: Audit trail for all shelf life changes (AC-11.09)
-- ============================================================================

-- Create shelf_life_audit_log table
CREATE TABLE IF NOT EXISTS shelf_life_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID NOT NULL REFERENCES auth.users(id),

  -- Constraint for action type enum
  CONSTRAINT action_type_check CHECK (action_type IN ('calculate', 'override', 'update_config', 'recalculate', 'clear_override'))
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_shelf_life_audit_product
  ON shelf_life_audit_log(product_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_shelf_life_audit_org
  ON shelf_life_audit_log(org_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_shelf_life_audit_action
  ON shelf_life_audit_log(action_type);

CREATE INDEX IF NOT EXISTS idx_shelf_life_audit_changed_by
  ON shelf_life_audit_log(changed_by);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE shelf_life_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies (ADR-013 Pattern)
-- Audit log is read-only for users, insert via service role
-- ============================================================================

-- SELECT policy - Users can read audit entries for their org only
CREATE POLICY "shelf_life_audit_select_own" ON shelf_life_audit_log
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy - Users can create audit entries for their org only
CREATE POLICY "shelf_life_audit_insert_own" ON shelf_life_audit_log
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- No UPDATE or DELETE policies - audit logs are immutable

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT ON shelf_life_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shelf_life_audit_log TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE shelf_life_audit_log IS 'Immutable audit trail for all shelf life configuration changes';
COMMENT ON COLUMN shelf_life_audit_log.action_type IS 'Type of change: calculate, override, update_config, recalculate, clear_override';
COMMENT ON COLUMN shelf_life_audit_log.old_value IS 'Previous shelf life configuration as JSON';
COMMENT ON COLUMN shelf_life_audit_log.new_value IS 'New shelf life configuration as JSON';
COMMENT ON COLUMN shelf_life_audit_log.change_reason IS 'User-provided reason for the change (required for overrides)';
COMMENT ON COLUMN shelf_life_audit_log.changed_by IS 'User who made the change';
