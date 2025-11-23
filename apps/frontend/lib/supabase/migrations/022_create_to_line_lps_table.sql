-- Migration: 022_create_to_line_lps_table.sql
-- Description: Create to_line_lps table for optional LP selection
-- Story: 3.9 - LP Selection for TO
-- Date: 2025-01-23

-- Create to_line_lps table (optional feature)
CREATE TABLE IF NOT EXISTS to_line_lps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_line_id UUID NOT NULL REFERENCES to_lines(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,
  reserved_qty NUMERIC(10, 2) NOT NULL CHECK (reserved_qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: Same LP cannot be reserved twice for same TO line
CREATE UNIQUE INDEX IF NOT EXISTS idx_to_line_lps_unique ON to_line_lps(to_line_id, lp_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_to_line_lps_to_line ON to_line_lps(to_line_id);
CREATE INDEX IF NOT EXISTS idx_to_line_lps_lp ON to_line_lps(lp_id);

-- Comments
COMMENT ON TABLE to_line_lps IS 'Optional pre-selected License Plates for Transfer Order lines';
COMMENT ON COLUMN to_line_lps.reserved_qty IS 'Quantity reserved from this LP (can be partial)';

-- RLS Policy (inherit org_id from to_lines → transfer_orders)
ALTER TABLE to_line_lps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS to_line_lps_org_isolation ON to_line_lps;
CREATE POLICY to_line_lps_org_isolation ON to_line_lps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM to_lines
      JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
      WHERE to_lines.id = to_line_lps.to_line_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Add LP selection setting to planning_settings
ALTER TABLE planning_settings
  ADD COLUMN IF NOT EXISTS to_require_lp_selection BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN planning_settings.to_require_lp_selection IS 'If true, users must select LPs before shipping TOs';
