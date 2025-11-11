-- Migration 024: Production Outputs Table
-- Purpose: Track production output quantities
-- Date: 2025-01-11
-- Dependencies: 009_products, 021_work_orders

CREATE TABLE production_outputs (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_production_outputs_wo ON production_outputs(wo_id);
CREATE INDEX idx_production_outputs_product ON production_outputs(product_id);
CREATE INDEX idx_production_outputs_lp ON production_outputs(lp_id);

-- Comments
COMMENT ON TABLE production_outputs IS 'Track production output quantities and link to license plates';

