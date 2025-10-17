-- Phase 25: Enhanced Trace Functions Migration
-- This migration enhances trace functions to include lp_compositions and pallets

-- Drop existing trace functions
DROP FUNCTION IF EXISTS vw_trace_forward(TEXT);
DROP FUNCTION IF EXISTS vw_trace_backward(TEXT);

-- Create enhanced forward trace function with compositions and pallets
CREATE OR REPLACE FUNCTION vw_trace_forward(input_lp_number TEXT)
RETURNS TABLE (
    node_id TEXT,
    node_type TEXT,
    node_number TEXT,
    product_description TEXT,
    quantity NUMERIC,
    uom TEXT,
    qa_status TEXT,
    stage_suffix TEXT,
    location TEXT,
    parent_node TEXT,
    depth INTEGER,
    path TEXT[],
    composition_qty NUMERIC,
    pallet_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE forward_trace AS (
        -- Base case: Start with input LP
        SELECT 
            lp.id::TEXT as node_id,
            'LP'::TEXT as node_type,
            lp.lp_number as node_number,
            p.description as product_description,
            lp.quantity,
            p.uom,
            lp.qa_status,
            lp.stage_suffix,
            l.name as location,
            lp.parent_lp_number as parent_node,
            0 as depth,
            ARRAY[lp.lp_number] as path,
            NULL::NUMERIC as composition_qty,
            NULL::TEXT as pallet_code
        FROM license_plates lp
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE lp.lp_number = input_lp_number
        
        UNION ALL
        
        -- Recursive case: Find compositions (what this LP was used to create)
        SELECT 
            output_lp.id::TEXT as node_id,
            'LP'::TEXT as node_type,
            output_lp.lp_number as node_number,
            p.description as product_description,
            output_lp.quantity,
            p.uom,
            output_lp.qa_status,
            output_lp.stage_suffix,
            l.name as location,
            ft.node_number as parent_node,
            ft.depth + 1 as depth,
            ft.path || output_lp.lp_number as path,
            lc.qty as composition_qty,
            NULL::TEXT as pallet_code
        FROM forward_trace ft
        JOIN lp_compositions lc ON lc.input_lp_id = ft.node_id::INTEGER
        JOIN license_plates output_lp ON lc.output_lp_id = output_lp.id
        JOIN products p ON output_lp.product_id = p.id
        JOIN locations l ON output_lp.location_id = l.id
        WHERE ft.depth < 10  -- Prevent infinite recursion
          AND NOT (output_lp.lp_number = ANY(ft.path))  -- Prevent cycles
        
        UNION ALL
        
        -- Find pallets containing this LP
        SELECT 
            pal.id::TEXT as node_id,
            'PALLET'::TEXT as node_type,
            pal.code as node_number,
            'Pallet' as product_description,
            COUNT(pi.id)::NUMERIC as quantity,
            'units' as uom,
            'N/A' as qa_status,
            NULL as stage_suffix,
            'Warehouse' as location,
            ft.node_number as parent_node,
            ft.depth + 1 as depth,
            ft.path || pal.code as path,
            NULL::NUMERIC as composition_qty,
            pal.code as pallet_code
        FROM forward_trace ft
        JOIN pallet_items pi ON pi.box_lp_id = ft.node_id::INTEGER
        JOIN pallets pal ON pi.pallet_id = pal.id
        WHERE ft.depth < 10
          AND NOT (pal.code = ANY(ft.path))
        GROUP BY pal.id, pal.code, ft.node_number, ft.depth, ft.path
    )
    SELECT * FROM forward_trace
    ORDER BY depth, node_id;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced backward trace function with compositions and pallets
CREATE OR REPLACE FUNCTION vw_trace_backward(input_lp_number TEXT)
RETURNS TABLE (
    node_id TEXT,
    node_type TEXT,
    node_number TEXT,
    product_description TEXT,
    quantity NUMERIC,
    uom TEXT,
    qa_status TEXT,
    stage_suffix TEXT,
    location TEXT,
    parent_node TEXT,
    depth INTEGER,
    path TEXT[],
    composition_qty NUMERIC,
    pallet_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE backward_trace AS (
        -- Base case: Start with input LP
        SELECT 
            lp.id::TEXT as node_id,
            'LP'::TEXT as node_type,
            lp.lp_number as node_number,
            p.description as product_description,
            lp.quantity,
            p.uom,
            lp.qa_status,
            lp.stage_suffix,
            l.name as location,
            lp.parent_lp_number as parent_node,
            0 as depth,
            ARRAY[lp.lp_number] as path,
            NULL::NUMERIC as composition_qty,
            NULL::TEXT as pallet_code
        FROM license_plates lp
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE lp.lp_number = input_lp_number
        
        UNION ALL
        
        -- Recursive case: Find parent LPs (what inputs created this LP)
        SELECT 
            input_lp.id::TEXT as node_id,
            'LP'::TEXT as node_type,
            input_lp.lp_number as node_number,
            p.description as product_description,
            input_lp.quantity,
            p.uom,
            input_lp.qa_status,
            input_lp.stage_suffix,
            l.name as location,
            bt.node_number as parent_node,
            bt.depth + 1 as depth,
            bt.path || input_lp.lp_number as path,
            lc.qty as composition_qty,
            NULL::TEXT as pallet_code
        FROM backward_trace bt
        JOIN lp_compositions lc ON lc.output_lp_id = bt.node_id::INTEGER
        JOIN license_plates input_lp ON lc.input_lp_id = input_lp.id
        JOIN products p ON input_lp.product_id = p.id
        JOIN locations l ON input_lp.location_id = l.id
        WHERE bt.depth < 10  -- Prevent infinite recursion
          AND NOT (input_lp.lp_number = ANY(bt.path))  -- Prevent cycles
        
        UNION ALL
        
        -- Find LPs in same pallet
        SELECT 
            box_lp.id::TEXT as node_id,
            'LP'::TEXT as node_type,
            box_lp.lp_number as node_number,
            p.description as product_description,
            box_lp.quantity,
            p.uom,
            box_lp.qa_status,
            box_lp.stage_suffix,
            l.name as location,
            bt.node_number as parent_node,
            bt.depth + 1 as depth,
            bt.path || box_lp.lp_number as path,
            NULL::NUMERIC as composition_qty,
            pal.code as pallet_code
        FROM backward_trace bt
        JOIN pallet_items pi1 ON pi1.box_lp_id = bt.node_id::INTEGER
        JOIN pallets pal ON pi1.pallet_id = pal.id
        JOIN pallet_items pi2 ON pi2.pallet_id = pal.id
        JOIN license_plates box_lp ON pi2.box_lp_id = box_lp.id
        JOIN products p ON box_lp.product_id = p.id
        JOIN locations l ON box_lp.location_id = l.id
        WHERE bt.depth < 10
          AND box_lp.id != bt.node_id::INTEGER  -- Don't include self
          AND NOT (box_lp.lp_number = ANY(bt.path))
    )
    SELECT * FROM backward_trace
    ORDER BY depth, node_id;
END;
$$ LANGUAGE plpgsql;

-- Create LP composition view for quick lookups
CREATE OR REPLACE VIEW vw_lp_composition AS
SELECT 
    lc.id as composition_id,
    lc.output_lp_id,
    output_lp.lp_number as output_lp_number,
    output_p.description as output_product,
    lc.input_lp_id,
    input_lp.lp_number as input_lp_number,
    input_p.description as input_product,
    lc.qty as composition_qty,
    lc.uom,
    lc.op_seq,
    lc.created_at,
    u.name as created_by_name
FROM lp_compositions lc
JOIN license_plates output_lp ON lc.output_lp_id = output_lp.id
JOIN products output_p ON output_lp.product_id = output_p.id
JOIN license_plates input_lp ON lc.input_lp_id = input_lp.id
JOIN products input_p ON input_lp.product_id = input_p.id
LEFT JOIN users u ON lc.created_by = u.id
ORDER BY lc.created_at DESC;

-- Update vw_consume to use wo_materials instead of bom_items
DROP VIEW IF EXISTS vw_consume;

CREATE VIEW vw_consume AS
SELECT 
    wo.wo_number,
    wo.actual_start AT TIME ZONE 'Europe/London' as production_date_london,
    wo.actual_start AT TIME ZONE 'UTC' as production_date_utc,
    p.description as product,
    mat.description as material,
    mat.part_number as material_part_number,
    wm.quantity as bom_standard_kg,
    COALESCE(SUM(sm.quantity), 0) as actual_consumed_kg,
    COALESCE(SUM(sm.quantity), 0) - wm.quantity as variance_kg,
    ROUND(
        ((COALESCE(SUM(sm.quantity), 0) - wm.quantity) / NULLIF(wm.quantity, 0)) * 100, 
        2
    ) as variance_percent,
    wo.line_number as production_line,
    wo.status as work_order_status,
    wm.one_to_one,
    wm.is_optional
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
JOIN wo_materials wm ON wo.id = wm.wo_id
JOIN products mat ON wm.material_id = mat.id
LEFT JOIN stock_moves sm ON wo.id = sm.wo_id 
    AND sm.move_type = 'WO_ISSUE' 
    AND sm.status = 'completed'
    AND sm.lp_id IN (
        SELECT lp.id FROM license_plates lp 
        WHERE lp.product_id = mat.id
    )
WHERE wo.actual_start IS NOT NULL
GROUP BY 
    wo.wo_number,
    wo.actual_start,
    p.description,
    mat.description,
    mat.part_number,
    wm.quantity,
    wo.line_number,
    wo.status,
    wm.one_to_one,
    wm.is_optional;

-- Add comments for enhanced functions
COMMENT ON FUNCTION vw_trace_forward(TEXT) IS 'Enhanced forward traceability including compositions and pallets';
COMMENT ON FUNCTION vw_trace_backward(TEXT) IS 'Enhanced backward traceability including compositions and pallets';
COMMENT ON VIEW vw_lp_composition IS 'Quick lookup view for LP compositions with product details';
COMMENT ON VIEW vw_consume IS 'Material consumption variance analysis using wo_materials BOM snapshot';
