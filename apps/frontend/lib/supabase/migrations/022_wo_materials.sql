-- Migration 022: WO Materials Table
-- Purpose: BOM snapshot for work orders
-- Date: 2025-01-11
-- Dependencies: 009_products, 021_work_orders

CREATE TABLE wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  qty_per_unit NUMERIC(12,4) NOT NULL,
  total_qty_needed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  production_line_restrictions TEXT[] DEFAULT '{}',
  consume_whole_lp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_material ON wo_materials(material_id);

-- Comments
COMMENT ON TABLE wo_materials IS 'BOM snapshot for work orders - materials required for production';
COMMENT ON COLUMN wo_materials.consume_whole_lp IS 'Hard 1:1 rule for WO material consumption';

