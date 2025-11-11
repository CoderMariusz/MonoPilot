-- Migration 028: LP Genealogy Table
-- Purpose: Parent-child relationships for license plates
-- Date: 2025-01-11
-- Dependencies: 021_work_orders, 025_license_plates

CREATE TABLE lp_genealogy (
  id SERIAL PRIMARY KEY,
  child_lp_id INTEGER NOT NULL REFERENCES license_plates(id),
  parent_lp_id INTEGER REFERENCES license_plates(id),
  quantity_consumed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  wo_id INTEGER REFERENCES work_orders(id),
  operation_sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(wo_id);

-- Comments
COMMENT ON TABLE lp_genealogy IS 'Parent-child relationships for license plates - full genealogy tracking';

