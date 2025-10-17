-- Phase 20: WO BOM Snapshots Migration
-- This migration creates WO BOM snapshots system for consistent material planning

-- Create wo_bom_snapshots table
CREATE TABLE wo_bom_snapshots (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    bom_id INTEGER NOT NULL REFERENCES bom(id),
    bom_version TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    one_to_one_flags JSONB DEFAULT '{}',
    standard_yields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX idx_wo_bom_snapshots_wo_id ON wo_bom_snapshots(wo_id);
CREATE INDEX idx_wo_bom_snapshots_bom_id ON wo_bom_snapshots(bom_id);
CREATE INDEX idx_wo_bom_snapshots_snapshot_data ON wo_bom_snapshots USING GIN(snapshot_data);
CREATE INDEX idx_wo_bom_snapshots_one_to_one_flags ON wo_bom_snapshots USING GIN(one_to_one_flags);

-- Add unique constraint to prevent duplicate snapshots per WO
ALTER TABLE wo_bom_snapshots 
ADD CONSTRAINT unique_wo_bom_snapshot UNIQUE (wo_id);

-- Add comments for documentation
COMMENT ON TABLE wo_bom_snapshots IS 'Frozen BOM snapshots at WO creation time for consistent material planning';
COMMENT ON COLUMN wo_bom_snapshots.snapshot_data IS 'Full BOM structure as JSONB at time of WO creation';
COMMENT ON COLUMN wo_bom_snapshots.one_to_one_flags IS 'Component-level 1:1 requirements as JSONB';
COMMENT ON COLUMN wo_bom_snapshots.standard_yields IS 'Per routing step expected yields as JSONB';

-- Create function to snapshot BOM when WO is released
CREATE OR REPLACE FUNCTION snapshot_wo_bom()
RETURNS TRIGGER AS $$
DECLARE
    bom_record RECORD;
    bom_items_record RECORD;
    snapshot_items JSONB := '[]'::jsonb;
    one_to_one_flags JSONB := '{}'::jsonb;
    standard_yields JSONB := '{}'::jsonb;
BEGIN
    -- Only trigger when status changes to 'released'
    IF OLD.status != 'released' AND NEW.status = 'released' THEN
        
        -- Get the BOM for this product
        SELECT b.* INTO bom_record
        FROM bom b
        WHERE b.product_id = NEW.product_id 
        AND b.is_active = true
        ORDER BY b.created_at DESC
        LIMIT 1;
        
        -- If no BOM found, raise error
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No active BOM found for product_id %', NEW.product_id;
        END IF;
        
        -- Get BOM items
        FOR bom_items_record IN
            SELECT 
                bi.*,
                p.part_number,
                p.description,
                p.uom,
                p.product_type
            FROM bom_items bi
            JOIN products p ON p.id = bi.material_id
            WHERE bi.bom_id = bom_record.id
            ORDER BY bi.sequence
        LOOP
            -- Add item to snapshot
            snapshot_items := snapshot_items || jsonb_build_object(
                'id', bom_items_record.id,
                'material_id', bom_items_record.material_id,
                'quantity', bom_items_record.quantity,
                'uom', bom_items_record.uom,
                'sequence', bom_items_record.sequence,
                'priority', bom_items_record.priority,
                'production_lines', bom_items_record.production_lines,
                'scrap_std_pct', bom_items_record.scrap_std_pct,
                'is_optional', bom_items_record.is_optional,
                'is_phantom', bom_items_record.is_phantom,
                'unit_cost_std', bom_items_record.unit_cost_std,
                'part_number', bom_items_record.part_number,
                'description', bom_items_record.description,
                'product_type', bom_items_record.product_type
            );
            
            -- Set one_to_one flag (default to false for now, can be configured later)
            one_to_one_flags := one_to_one_flags || jsonb_build_object(
                bom_items_record.material_id::text, false
            );
        END LOOP;
        
        -- Insert snapshot
        INSERT INTO wo_bom_snapshots (
            wo_id,
            bom_id,
            bom_version,
            snapshot_data,
            one_to_one_flags,
            standard_yields,
            created_by
        ) VALUES (
            NEW.id,
            bom_record.id,
            bom_record.version,
            jsonb_build_object(
                'bom_id', bom_record.id,
                'version', bom_record.version,
                'product_id', bom_record.product_id,
                'created_at', bom_record.created_at,
                'items', snapshot_items
            ),
            one_to_one_flags,
            standard_yields,
            NEW.created_by
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on work_orders table
CREATE TRIGGER trigger_snapshot_wo_bom
    AFTER UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION snapshot_wo_bom();

-- Add RLS policies
ALTER TABLE wo_bom_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read wo_bom_snapshots" ON wo_bom_snapshots
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert wo_bom_snapshots" ON wo_bom_snapshots
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add check constraints for JSONB structure
ALTER TABLE wo_bom_snapshots 
ADD CONSTRAINT check_snapshot_data_structure 
CHECK (
    jsonb_typeof(snapshot_data) = 'object' AND
    snapshot_data ? 'items' AND
    jsonb_typeof(snapshot_data->'items') = 'array'
);

ALTER TABLE wo_bom_snapshots 
ADD CONSTRAINT check_one_to_one_flags_structure 
CHECK (
    jsonb_typeof(one_to_one_flags) = 'object'
);

ALTER TABLE wo_bom_snapshots 
ADD CONSTRAINT check_standard_yields_structure 
CHECK (
    jsonb_typeof(standard_yields) = 'object'
);
