-- Planning Settings Table
-- Story: 03.17 - Planning Settings (Module Configuration)
--
-- Creates planning_settings table with:
-- - PO settings (7 fields)
-- - TO settings (5 fields)
-- - WO settings (9 fields)
-- - Phase 2 placeholders (status configs, MRP settings)
--
-- Singleton per org (UNIQUE constraint on org_id)
-- RLS enabled with org_id isolation (ADR-013)

-- Create the planning_settings table
CREATE TABLE IF NOT EXISTS planning_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- PO Settings (7 fields)
  po_require_approval BOOLEAN DEFAULT false,
  po_approval_threshold DECIMAL(15,4),
  po_approval_roles TEXT[] DEFAULT ARRAY['admin', 'manager'],
  po_auto_number_prefix TEXT DEFAULT 'PO-',
  po_auto_number_format TEXT DEFAULT 'YYYY-NNNNN',
  po_default_payment_terms TEXT DEFAULT 'Net 30',
  po_default_currency TEXT DEFAULT 'PLN',

  -- TO Settings (5 fields)
  to_allow_partial_shipments BOOLEAN DEFAULT true,
  to_require_lp_selection BOOLEAN DEFAULT false,
  to_auto_number_prefix TEXT DEFAULT 'TO-',
  to_auto_number_format TEXT DEFAULT 'YYYY-NNNNN',
  to_default_transit_days INTEGER DEFAULT 1,

  -- WO Settings (9 fields)
  wo_material_check BOOLEAN DEFAULT true,
  wo_copy_routing BOOLEAN DEFAULT true,
  wo_auto_select_bom BOOLEAN DEFAULT true,
  wo_require_bom BOOLEAN DEFAULT true,
  wo_allow_overproduction BOOLEAN DEFAULT false,
  wo_overproduction_limit DECIMAL(5,2) DEFAULT 10,
  wo_auto_number_prefix TEXT DEFAULT 'WO-',
  wo_auto_number_format TEXT DEFAULT 'YYYY-NNNNN',
  wo_default_scheduling_buffer_hours INTEGER DEFAULT 2,

  -- Status Configuration (Phase 2 - NOT exposed in MVP UI)
  po_statuses JSONB NOT NULL DEFAULT '["draft","submitted","pending_approval","approved","confirmed","receiving","closed","cancelled"]'::jsonb,
  to_statuses JSONB NOT NULL DEFAULT '["draft","planned","partially_shipped","shipped","partially_received","received","closed"]'::jsonb,
  wo_statuses JSONB NOT NULL DEFAULT '["draft","planned","released","in_progress","on_hold","completed","closed","cancelled"]'::jsonb,

  -- MRP Settings (Phase 2 - NOT exposed in MVP UI)
  mrp_enabled BOOLEAN DEFAULT false,
  safety_stock_days INTEGER DEFAULT 7,
  forecast_horizon_days INTEGER DEFAULT 30,

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_po_approval_threshold CHECK (po_approval_threshold IS NULL OR po_approval_threshold >= 0),
  CONSTRAINT chk_to_transit_days CHECK (to_default_transit_days >= 0 AND to_default_transit_days <= 365),
  CONSTRAINT chk_wo_overproduction_limit CHECK (wo_overproduction_limit >= 0 AND wo_overproduction_limit <= 100),
  CONSTRAINT chk_wo_scheduling_buffer CHECK (wo_default_scheduling_buffer_hours >= 0 AND wo_default_scheduling_buffer_hours <= 168)
);

-- Create index on org_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_planning_settings_org ON planning_settings(org_id);

-- Enable Row Level Security
ALTER TABLE planning_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - users can only view their org's settings
-- Uses ADR-013 pattern: (SELECT org_id FROM users WHERE id = auth.uid())
CREATE POLICY "planning_settings_select_own_org"
  ON planning_settings FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: UPDATE - users can only update their org's settings
-- Uses ADR-013 pattern for both USING and WITH CHECK
CREATE POLICY "planning_settings_update_own_org"
  ON planning_settings FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: INSERT - users can only insert settings for their own org
-- Uses ADR-013 pattern to enforce org_id isolation
CREATE POLICY "planning_settings_insert_own_org"
  ON planning_settings FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_planning_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_planning_settings_updated_at ON planning_settings;
CREATE TRIGGER trg_planning_settings_updated_at
  BEFORE UPDATE ON planning_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_settings_updated_at();

-- Add comment to table
COMMENT ON TABLE planning_settings IS 'Module configuration for Planning (PO/TO/WO settings) - singleton per org';
