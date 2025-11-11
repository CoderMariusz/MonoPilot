-- Migration 021: Work Orders Table
-- Purpose: Manufacturing work orders
-- Date: 2025-01-11
-- Dependencies: 007_machines, 008_production_lines, 009_products, 010_boms

CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  bom_id INTEGER REFERENCES boms(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(20) NOT NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  machine_id INTEGER REFERENCES machines(id),
  line_id INTEGER NOT NULL REFERENCES production_lines(id),
  source_demand_type VARCHAR(50),
  source_demand_id INTEGER,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_number ON work_orders(wo_number);
CREATE INDEX idx_wo_status_scheduled ON work_orders(status, scheduled_start);
CREATE INDEX idx_wo_product_status ON work_orders(product_id, status);
CREATE INDEX idx_wo_bom ON work_orders(bom_id);
CREATE INDEX idx_wo_line ON work_orders(line_id);

-- Comments
COMMENT ON TABLE work_orders IS 'Manufacturing work orders for production execution';
COMMENT ON COLUMN work_orders.line_id IS 'Production line where this WO will be executed';

