-- Migration 029: Pallets Table
-- Purpose: Pallet management for finished goods
-- Date: 2025-01-11
-- Dependencies: 021_work_orders

CREATE TABLE pallets (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  line VARCHAR(50),
  code VARCHAR(50) UNIQUE NOT NULL,
  target_boxes INTEGER,
  actual_boxes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_pallets_wo ON pallets(wo_id);
CREATE INDEX idx_pallets_code ON pallets(code);

-- Comments
COMMENT ON TABLE pallets IS 'Pallet management for finished goods packaging';
COMMENT ON COLUMN pallets.target_boxes IS 'Target boxes per pallet (from BOM boxes_per_pallet)';
COMMENT ON COLUMN pallets.actual_boxes IS 'Actual boxes on pallet (confirmed by operator)';

