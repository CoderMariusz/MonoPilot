-- Phase 14: Production Outputs Table Migration
-- This migration creates the production_outputs table as source of truth for work order outputs

-- Create production_outputs table
CREATE TABLE production_outputs (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    lp_id INTEGER NULL REFERENCES license_plates(id),
    boxes INTEGER NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_production_outputs_wo_id ON production_outputs(wo_id);
CREATE INDEX idx_production_outputs_lp_id ON production_outputs(lp_id);
CREATE INDEX idx_production_outputs_product_id ON production_outputs(product_id);
CREATE INDEX idx_production_outputs_created_at ON production_outputs(created_at);

-- Add comments for documentation
COMMENT ON TABLE production_outputs IS 'Source of truth for work order production outputs';
COMMENT ON COLUMN production_outputs.wo_id IS 'Work order reference';
COMMENT ON COLUMN production_outputs.product_id IS 'Product reference';
COMMENT ON COLUMN production_outputs.quantity IS 'Output quantity';
COMMENT ON COLUMN production_outputs.uom IS 'Unit of measure';
COMMENT ON COLUMN production_outputs.lp_id IS 'License plate reference for output';
COMMENT ON COLUMN production_outputs.boxes IS 'Box count for Finished Goods outputs';

-- Add check constraints
ALTER TABLE production_outputs 
ADD CONSTRAINT check_quantity_positive 
CHECK (quantity > 0);

ALTER TABLE production_outputs 
ADD CONSTRAINT check_boxes_positive 
CHECK (boxes IS NULL OR boxes > 0);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_production_outputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_production_outputs_updated_at
    BEFORE UPDATE ON production_outputs
    FOR EACH ROW
    EXECUTE FUNCTION update_production_outputs_updated_at();
