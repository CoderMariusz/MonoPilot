-- Migration 042: Add by-product fields to wo_materials
-- Story 4.14: By-Product Registration
-- Adds fields needed to track by-products in WO materials snapshot

-- Add by-product related columns to wo_materials
ALTER TABLE wo_materials
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS yield_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS by_product_registered_qty DECIMAL(15,6) DEFAULT 0;

COMMENT ON COLUMN wo_materials.is_by_product IS 'If true, this is an output by-product (from bom_items)';
COMMENT ON COLUMN wo_materials.yield_percent IS 'By-product yield as % of main output (required if is_by_product)';
COMMENT ON COLUMN wo_materials.by_product_registered_qty IS 'Total qty registered for this by-product';

-- Add index for finding by-products quickly
CREATE INDEX IF NOT EXISTS idx_wo_materials_by_product
  ON wo_materials(work_order_id) WHERE is_by_product = true;

-- Add by_product_type to production_outputs for clarity
ALTER TABLE production_outputs
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS by_product_material_id UUID REFERENCES wo_materials(id),
  ADD COLUMN IF NOT EXISTS main_output_id UUID REFERENCES production_outputs(id);

COMMENT ON COLUMN production_outputs.is_by_product IS 'If true, this is a by-product output';
COMMENT ON COLUMN production_outputs.by_product_material_id IS 'Reference to wo_materials for by-product';
COMMENT ON COLUMN production_outputs.main_output_id IS 'Reference to main output that triggered by-product registration';

-- Create index for by-product outputs
CREATE INDEX IF NOT EXISTS idx_production_outputs_by_product
  ON production_outputs(wo_id) WHERE is_by_product = true;
