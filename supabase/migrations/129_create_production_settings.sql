-- Migration: Create production_settings table
-- Story: 04.5 - Production Settings
-- Purpose: Store production module settings per organization

-- Create production_settings table
CREATE TABLE IF NOT EXISTS production_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- WO Execution (Phase 0)
  allow_pause_wo BOOLEAN DEFAULT false,
  auto_complete_wo BOOLEAN DEFAULT false,
  require_operation_sequence BOOLEAN DEFAULT true,

  -- Material Consumption (Phase 1)
  allow_over_consumption BOOLEAN DEFAULT false,
  allow_partial_lp_consumption BOOLEAN DEFAULT true,

  -- Output (Phase 1)
  require_qa_on_output BOOLEAN DEFAULT true,
  auto_create_by_product_lp BOOLEAN DEFAULT true,

  -- Reservations (Phase 1)
  enable_material_reservations BOOLEAN DEFAULT true,

  -- Dashboard (Phase 0)
  dashboard_refresh_seconds INTEGER DEFAULT 30,
  show_material_alerts BOOLEAN DEFAULT true,
  show_delay_alerts BOOLEAN DEFAULT true,
  show_quality_alerts BOOLEAN DEFAULT true,

  -- OEE (Phase 2)
  enable_oee_tracking BOOLEAN DEFAULT false,
  target_oee_percent DECIMAL(5,2) DEFAULT 85,
  enable_downtime_tracking BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_production_settings_org UNIQUE(org_id),
  CONSTRAINT chk_dashboard_refresh CHECK (dashboard_refresh_seconds >= 5 AND dashboard_refresh_seconds <= 300),
  CONSTRAINT chk_target_oee CHECK (target_oee_percent >= 0 AND target_oee_percent <= 100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_production_settings_org ON production_settings(org_id);

-- Enable RLS
ALTER TABLE production_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read access for org members
CREATE POLICY production_settings_select ON production_settings
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- RLS Policy: Insert (for auto-creation of defaults)
CREATE POLICY production_settings_insert ON production_settings
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- RLS Policy: Update (Admin only)
CREATE POLICY production_settings_update ON production_settings
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT r.code
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = auth.uid()
    ) IN ('SUPER_ADMIN', 'ADMIN')
  );

-- Trigger: Auto-update updated_at
CREATE TRIGGER trg_production_settings_updated_at
  BEFORE UPDATE ON production_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE production_settings IS 'Production module settings per organization (Story 04.5)';
