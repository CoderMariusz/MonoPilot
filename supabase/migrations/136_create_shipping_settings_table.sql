-- =============================================================================
-- Migration 136: Create Shipping Settings Table + RLS Policies
-- Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
-- Purpose: Org-level allocation and shipping configuration
-- =============================================================================

-- =============================================================================
-- Shipping Settings Table - Org-level allocation config
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipping_settings (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Allocation Settings
  auto_allocate_on_confirm BOOLEAN DEFAULT true,
  allocation_threshold_pct DECIMAL(5,2) DEFAULT 80.00 CHECK (allocation_threshold_pct > 0 AND allocation_threshold_pct <= 100),
  default_picking_strategy TEXT DEFAULT 'FIFO' CHECK (default_picking_strategy IN ('FIFO', 'FEFO')),

  -- FEFO Settings
  fefo_warning_days_threshold INTEGER DEFAULT 7 CHECK (fefo_warning_days_threshold > 0 AND fefo_warning_days_threshold <= 365),

  -- Freshness & Auto-Refresh
  auto_refresh_allocation_data BOOLEAN DEFAULT false,
  allocation_data_refresh_interval_seconds INTEGER DEFAULT 30 CHECK (allocation_data_refresh_interval_seconds >= 30),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_shipping_settings_org ON shipping_settings(org_id);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_shipping_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shipping_settings_updated_at
BEFORE UPDATE ON shipping_settings
FOR EACH ROW EXECUTE FUNCTION update_shipping_settings_updated_at();

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "shipping_settings_select_org" ON shipping_settings
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation (admin only)
CREATE POLICY "shipping_settings_insert_org" ON shipping_settings
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager')
);

-- Update: Org isolation (admin only)
CREATE POLICY "shipping_settings_update_org" ON shipping_settings
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager')
);

-- =============================================================================
-- Add backorder_flag to sales_order_lines if not exists
-- =============================================================================

ALTER TABLE sales_order_lines ADD COLUMN IF NOT EXISTS backorder_flag BOOLEAN DEFAULT false;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON shipping_settings TO authenticated;
