-- Phase 23: WO BOM Snapshot Trigger Migration
-- This migration creates triggers and functions for automatic BOM snapshotting

-- Create function to snapshot BOM to work order materials
CREATE OR REPLACE FUNCTION snapshot_bom_to_wo(wo_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    bom_id_var INTEGER;
    material_record RECORD;
    snapshot_count INTEGER := 0;
BEGIN
    -- Get the BOM ID for the work order's product
    SELECT b.id INTO bom_id_var
    FROM work_orders wo
    JOIN products p ON wo.product_id = p.id
    JOIN bom b ON p.id = b.product_id
    WHERE wo.id = wo_id_param
      AND b.is_active = true;
    
    -- Check if BOM exists
    IF bom_id_var IS NULL THEN
        RAISE EXCEPTION 'No active BOM found for work order %', wo_id_param;
    END IF;
    
    -- Clear existing materials for this WO (in case of re-snapshot)
    DELETE FROM wo_materials WHERE wo_id = wo_id_param;
    
    -- Snapshot BOM items to wo_materials
    FOR material_record IN
        SELECT 
            bi.material_id,
            bi.quantity,
            bi.uom,
            bi.sequence,
            COALESCE(bi.one_to_one, false) as one_to_one,
            COALESCE(bi.is_optional, false) as is_optional,
            bi.substitution_group
        FROM bom_items bi
        WHERE bi.bom_id = bom_id_var
        ORDER BY bi.sequence
    LOOP
        INSERT INTO wo_materials (
            wo_id,
            material_id,
            quantity,
            uom,
            sequence,
            one_to_one,
            is_optional,
            substitution_group,
            created_by
        ) VALUES (
            wo_id_param,
            material_record.material_id,
            material_record.quantity,
            material_record.uom,
            material_record.sequence,
            material_record.one_to_one,
            material_record.is_optional,
            material_record.substitution_group,
            (SELECT created_by FROM work_orders WHERE id = wo_id_param)
        );
        
        snapshot_count := snapshot_count + 1;
    END LOOP;
    
    -- Log the snapshot
    INSERT INTO work_orders_audit (
        wo_id,
        action,
        details,
        created_by,
        created_at
    ) VALUES (
        wo_id_param,
        'BOM_SNAPSHOT',
        jsonb_build_object(
            'bom_id', bom_id_var,
            'materials_count', snapshot_count
        ),
        (SELECT created_by FROM work_orders WHERE id = wo_id_param),
        NOW()
    );
    
    RETURN snapshot_count;
END;
$$ LANGUAGE plpgsql;

-- Create audit table for work order changes (if it doesn't exist)
CREATE TABLE IF NOT EXISTS work_orders_audit (
    id SERIAL PRIMARY KEY,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for audit table
CREATE INDEX IF NOT EXISTS idx_work_orders_audit_wo_id ON work_orders_audit(wo_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_audit_action ON work_orders_audit(action);
CREATE INDEX IF NOT EXISTS idx_work_orders_audit_created_at ON work_orders_audit(created_at);

-- Create trigger function for automatic BOM snapshot on WO creation
CREATE OR REPLACE FUNCTION trigger_snapshot_bom_on_wo_creation()
RETURNS TRIGGER AS $$
DECLARE
    snapshot_count INTEGER;
BEGIN
    -- Only snapshot for new work orders (not updates)
    IF TG_OP = 'INSERT' THEN
        -- Call the snapshot function
        SELECT snapshot_bom_to_wo(NEW.id) INTO snapshot_count;
        
        -- Log the automatic snapshot
        INSERT INTO work_orders_audit (
            wo_id,
            action,
            details,
            created_by,
            created_at
        ) VALUES (
            NEW.id,
            'AUTO_BOM_SNAPSHOT',
            jsonb_build_object(
                'materials_count', snapshot_count,
                'trigger', 'wo_creation'
            ),
            NEW.created_by,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic BOM snapshot
CREATE TRIGGER trigger_auto_snapshot_bom
    AFTER INSERT ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_snapshot_bom_on_wo_creation();

-- Create function to update BOM snapshot (manual)
CREATE OR REPLACE FUNCTION update_wo_bom_snapshot(
    wo_id_param INTEGER,
    user_id_param UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    result JSONB;
BEGIN
    -- Get old count
    SELECT COUNT(*) INTO old_count
    FROM wo_materials
    WHERE wo_id = wo_id_param;
    
    -- Update the snapshot
    SELECT snapshot_bom_to_wo(wo_id_param) INTO new_count;
    
    -- Build result
    result := jsonb_build_object(
        'wo_id', wo_id_param,
        'old_materials_count', old_count,
        'new_materials_count', new_count,
        'updated_by', user_id_param,
        'updated_at', NOW()
    );
    
    -- Log the manual update
    INSERT INTO work_orders_audit (
        wo_id,
        action,
        details,
        created_by,
        created_at
    ) VALUES (
        wo_id_param,
        'MANUAL_BOM_UPDATE',
        result,
        user_id_param,
        NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get WO materials with product details
CREATE OR REPLACE FUNCTION get_wo_materials_with_details(wo_id_param INTEGER)
RETURNS TABLE (
    material_id INTEGER,
    material_part_number TEXT,
    material_description TEXT,
    quantity NUMERIC,
    uom TEXT,
    sequence INTEGER,
    one_to_one BOOLEAN,
    is_optional BOOLEAN,
    substitution_group TEXT,
    available_qty NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wm.material_id,
        p.part_number as material_part_number,
        p.description as material_description,
        wm.quantity,
        wm.uom,
        wm.sequence,
        wm.one_to_one,
        wm.is_optional,
        wm.substitution_group,
        COALESCE(SUM(lp.quantity), 0) as available_qty
    FROM wo_materials wm
    JOIN products p ON wm.material_id = p.id
    LEFT JOIN license_plates lp ON p.id = lp.product_id
    WHERE wm.wo_id = wo_id_param
    GROUP BY 
        wm.material_id,
        p.part_number,
        p.description,
        wm.quantity,
        wm.uom,
        wm.sequence,
        wm.one_to_one,
        wm.is_optional,
        wm.substitution_group
    ORDER BY wm.sequence;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION snapshot_bom_to_wo(INTEGER) IS 'Snapshot BOM to work order materials table';
COMMENT ON FUNCTION trigger_snapshot_bom_on_wo_creation() IS 'Trigger function for automatic BOM snapshot on WO creation';
COMMENT ON FUNCTION update_wo_bom_snapshot(INTEGER, UUID) IS 'Manually update BOM snapshot for work order';
COMMENT ON FUNCTION get_wo_materials_with_details(INTEGER) IS 'Get work order materials with product details and availability';
COMMENT ON TABLE work_orders_audit IS 'Audit trail for work order changes and BOM snapshots';
