-- Phase 19: WO Materials BOM Snapshot Migration
-- This migration creates the wo_materials table for work order BOM snapshots

-- Create wo_materials table for BOM snapshots
CREATE TABLE wo_materials (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES products(id),
    quantity NUMERIC(10,4) NOT NULL,
    uom TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    one_to_one BOOLEAN NOT NULL DEFAULT false,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    substitution_group TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_wo_materials_wo_id ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_material_id ON wo_materials(material_id);
CREATE INDEX idx_wo_materials_one_to_one ON wo_materials(one_to_one);
CREATE INDEX idx_wo_materials_sequence ON wo_materials(wo_id, sequence);

-- Add unique constraint to prevent duplicate materials in same WO
CREATE UNIQUE INDEX idx_wo_materials_wo_material_unique 
ON wo_materials(wo_id, material_id, sequence);

-- Add comments for documentation
COMMENT ON TABLE wo_materials IS 'BOM snapshot for work orders - captures BOM state at WO creation time';
COMMENT ON COLUMN wo_materials.wo_id IS 'Work order reference';
COMMENT ON COLUMN wo_materials.material_id IS 'Material product reference';
COMMENT ON COLUMN wo_materials.quantity IS 'Required quantity per unit of finished product';
COMMENT ON COLUMN wo_materials.uom IS 'Unit of measure';
COMMENT ON COLUMN wo_materials.sequence IS 'Material sequence in BOM';
COMMENT ON COLUMN wo_materials.one_to_one IS 'Hard 1:1 rule - exactly one input LP to one output LP';
COMMENT ON COLUMN wo_materials.is_optional IS 'Optional material flag';
COMMENT ON COLUMN wo_materials.substitution_group IS 'Substitution group for material alternatives';

-- Add check constraints
ALTER TABLE wo_materials 
ADD CONSTRAINT check_quantity_positive 
CHECK (quantity > 0);

ALTER TABLE wo_materials 
ADD CONSTRAINT check_sequence_positive 
CHECK (sequence > 0);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_wo_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wo_materials_updated_at
    BEFORE UPDATE ON wo_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_wo_materials_updated_at();

-- Add one_to_one column to bom_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bom_items' AND column_name = 'one_to_one'
    ) THEN
        ALTER TABLE bom_items 
        ADD COLUMN one_to_one BOOLEAN NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN bom_items.one_to_one IS 'Hard 1:1 rule for BOM components';
    END IF;
END $$;
