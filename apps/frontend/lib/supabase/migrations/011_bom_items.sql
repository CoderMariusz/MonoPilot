-- Migration 011: BOM Items Table
-- Purpose: Individual materials/components in a BOM
-- Date: 2025-01-11
-- Dependencies: 005_settings_tax_codes, 009_products, 010_boms

CREATE TABLE bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id),
  material_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  quantity NUMERIC(12,4) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  sequence INTEGER NOT NULL,
  priority INTEGER,
  
  -- Costing
  unit_cost_std NUMERIC(12,4),
  scrap_std_pct NUMERIC(5,2) DEFAULT 0,
  
  -- Flags
  is_optional BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  consume_whole_lp BOOLEAN DEFAULT false,
  
  -- Planning
  production_lines TEXT[],
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days > 0),
  moq NUMERIC(12,4) CHECK (moq IS NULL OR moq > 0),
  
  -- Packaging
  packages_per_box NUMERIC(10,4) NOT NULL DEFAULT 1 CHECK (packages_per_box > 0),
  
  -- Line-specific materials
  line_id INTEGER[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(material_id);
CREATE INDEX idx_bom_items_sequence ON bom_items(bom_id, sequence);

-- Comments
COMMENT ON TABLE bom_items IS 'Individual materials/components in a BOM with quantities and specifications';
COMMENT ON COLUMN bom_items.packages_per_box IS 'Multiplier: how many packages fit in one box';
COMMENT ON COLUMN bom_items.line_id IS 'Array of line IDs for this material. NULL = available on all lines from parent BOM. Enables line-specific materials (e.g., Box 12 for Line 4, Box 34 for Line 5)';
COMMENT ON COLUMN bom_items.consume_whole_lp IS 'If true, material must be consumed as whole license plate (1:1 rule)';

