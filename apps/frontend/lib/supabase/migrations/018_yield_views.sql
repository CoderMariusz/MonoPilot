-- Phase 18: Yield Views Migration
-- This migration creates analytical views for yield reporting with Europe/London timezone support

-- Create PR Yield Daily View
CREATE VIEW vw_yield_pr_daily AS
SELECT 
    DATE(wo.actual_start AT TIME ZONE 'Europe/London') as production_date,
    DATE(wo.actual_start AT TIME ZONE 'UTC') as production_date_utc,
    wo.line_number as production_line,
    p.description as product,
    p.part_number,
    COUNT(DISTINCT wo.id) as work_order_count,
    SUM(wo_ops.actual_input_weight) as total_input_kg,
    SUM(wo_ops.actual_output_weight) as total_output_kg,
    ROUND(
        (SUM(wo_ops.actual_output_weight) / NULLIF(SUM(wo_ops.actual_input_weight), 0)) * 100, 
        2
    ) as pr_yield_percent,
    ROUND(
        SUM(wo_ops.actual_input_weight) / NULLIF(SUM(wo_ops.actual_output_weight), 0), 
        4
    ) as pr_consumption_per_kg,
    ROUND(
        (SUM(wo.actual_output_qty) / NULLIF(SUM(wo.quantity), 0)) * 100, 
        2
    ) as plan_accuracy_percent
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
LEFT JOIN wo_operations wo_ops ON wo.id = wo_ops.wo_id
WHERE wo.kpi_scope = 'PR'
  AND wo.actual_start IS NOT NULL
  AND wo_ops.actual_input_weight IS NOT NULL
  AND wo_ops.actual_output_weight IS NOT NULL
GROUP BY 
    DATE(wo.actual_start AT TIME ZONE 'Europe/London'),
    DATE(wo.actual_start AT TIME ZONE 'UTC'),
    wo.line_number,
    p.description,
    p.part_number;

-- Create PR Yield Weekly View
CREATE VIEW vw_yield_pr_weekly AS
SELECT 
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'Europe/London') as week_start,
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'UTC') as week_start_utc,
    wo.line_number as production_line,
    p.description as product,
    p.part_number,
    COUNT(DISTINCT wo.id) as work_order_count,
    SUM(wo_ops.actual_input_weight) as total_input_kg,
    SUM(wo_ops.actual_output_weight) as total_output_kg,
    ROUND(
        (SUM(wo_ops.actual_output_weight) / NULLIF(SUM(wo_ops.actual_input_weight), 0)) * 100, 
        2
    ) as pr_yield_percent,
    ROUND(
        SUM(wo_ops.actual_input_weight) / NULLIF(SUM(wo_ops.actual_output_weight), 0), 
        4
    ) as pr_consumption_per_kg,
    ROUND(
        (SUM(wo.actual_output_qty) / NULLIF(SUM(wo.quantity), 0)) * 100, 
        2
    ) as plan_accuracy_percent
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
LEFT JOIN wo_operations wo_ops ON wo.id = wo_ops.wo_id
WHERE wo.kpi_scope = 'PR'
  AND wo.actual_start IS NOT NULL
  AND wo_ops.actual_input_weight IS NOT NULL
  AND wo_ops.actual_output_weight IS NOT NULL
GROUP BY 
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'Europe/London'),
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'UTC'),
    wo.line_number,
    p.description,
    p.part_number;

-- Create PR Yield Monthly View
CREATE VIEW vw_yield_pr_monthly AS
SELECT 
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'Europe/London') as month_start,
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'UTC') as month_start_utc,
    wo.line_number as production_line,
    p.description as product,
    p.part_number,
    COUNT(DISTINCT wo.id) as work_order_count,
    SUM(wo_ops.actual_input_weight) as total_input_kg,
    SUM(wo_ops.actual_output_weight) as total_output_kg,
    ROUND(
        (SUM(wo_ops.actual_output_weight) / NULLIF(SUM(wo_ops.actual_input_weight), 0)) * 100, 
        2
    ) as pr_yield_percent,
    ROUND(
        SUM(wo_ops.actual_input_weight) / NULLIF(SUM(wo_ops.actual_output_weight), 0), 
        4
    ) as pr_consumption_per_kg,
    ROUND(
        (SUM(wo.actual_output_qty) / NULLIF(SUM(wo.quantity), 0)) * 100, 
        2
    ) as plan_accuracy_percent
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
LEFT JOIN wo_operations wo_ops ON wo.id = wo_ops.wo_id
WHERE wo.kpi_scope = 'PR'
  AND wo.actual_start IS NOT NULL
  AND wo_ops.actual_input_weight IS NOT NULL
  AND wo_ops.actual_output_weight IS NOT NULL
GROUP BY 
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'Europe/London'),
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'UTC'),
    wo.line_number,
    p.description,
    p.part_number;

-- Create FG Yield Daily View
CREATE VIEW vw_yield_fg_daily AS
SELECT 
    DATE(wo.actual_start AT TIME ZONE 'Europe/London') as production_date,
    DATE(wo.actual_start AT TIME ZONE 'UTC') as production_date_utc,
    wo.line_number as production_line,
    p.description as product,
    p.part_number,
    COUNT(DISTINCT wo.id) as work_order_count,
    SUM(wo.planned_boxes) as total_planned_boxes,
    SUM(wo.actual_boxes) as total_actual_boxes,
    AVG(wo.box_weight_kg) as avg_box_weight_kg,
    SUM(wo.actual_boxes * wo.box_weight_kg) as total_fg_weight_kg,
    SUM(wo.actual_output_qty) as total_meat_input_kg,
    ROUND(
        (SUM(wo.actual_boxes * wo.box_weight_kg) / NULLIF(SUM(wo.actual_output_qty), 0)) * 100, 
        2
    ) as fg_yield_percent,
    ROUND(
        (SUM(wo.actual_boxes) / NULLIF(SUM(wo.planned_boxes), 0)) * 100, 
        2
    ) as plan_accuracy_percent,
    ROUND(
        SUM(wo.actual_output_qty) - SUM(wo.actual_boxes * wo.box_weight_kg), 
        2
    ) as waste_kg
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
WHERE wo.kpi_scope = 'FG'
  AND wo.actual_start IS NOT NULL
  AND wo.actual_boxes IS NOT NULL
  AND wo.box_weight_kg IS NOT NULL
GROUP BY 
    DATE(wo.actual_start AT TIME ZONE 'Europe/London'),
    DATE(wo.actual_start AT TIME ZONE 'UTC'),
    wo.line_number,
    p.description,
    p.part_number;

-- Create FG Yield Weekly View
CREATE VIEW vw_yield_fg_weekly AS
SELECT 
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'Europe/London') as week_start,
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'UTC') as week_start_utc,
    wo.line_number as production_line,
    p.description as product,
    p.part_number,
    COUNT(DISTINCT wo.id) as work_order_count,
    SUM(wo.planned_boxes) as total_planned_boxes,
    SUM(wo.actual_boxes) as total_actual_boxes,
    AVG(wo.box_weight_kg) as avg_box_weight_kg,
    SUM(wo.actual_boxes * wo.box_weight_kg) as total_fg_weight_kg,
    SUM(wo.actual_output_qty) as total_meat_input_kg,
    ROUND(
        (SUM(wo.actual_boxes * wo.box_weight_kg) / NULLIF(SUM(wo.actual_output_qty), 0)) * 100, 
        2
    ) as fg_yield_percent,
    ROUND(
        (SUM(wo.actual_boxes) / NULLIF(SUM(wo.planned_boxes), 0)) * 100, 
        2
    ) as plan_accuracy_percent,
    ROUND(
        SUM(wo.actual_output_qty) - SUM(wo.actual_boxes * wo.box_weight_kg), 
        2
    ) as waste_kg
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
WHERE wo.kpi_scope = 'FG'
  AND wo.actual_start IS NOT NULL
  AND wo.actual_boxes IS NOT NULL
  AND wo.box_weight_kg IS NOT NULL
GROUP BY 
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'Europe/London'),
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'UTC'),
    wo.line_number,
    p.description,
    p.part_number;

-- Create FG Yield Monthly View
CREATE VIEW vw_yield_fg_monthly AS
SELECT 
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'Europe/London') as month_start,
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'UTC') as month_start_utc,
    wo.line_number as production_line,
    p.description as product,
    p.part_number,
    COUNT(DISTINCT wo.id) as work_order_count,
    SUM(wo.planned_boxes) as total_planned_boxes,
    SUM(wo.actual_boxes) as total_actual_boxes,
    AVG(wo.box_weight_kg) as avg_box_weight_kg,
    SUM(wo.actual_boxes * wo.box_weight_kg) as total_fg_weight_kg,
    SUM(wo.actual_output_qty) as total_meat_input_kg,
    ROUND(
        (SUM(wo.actual_boxes * wo.box_weight_kg) / NULLIF(SUM(wo.actual_output_qty), 0)) * 100, 
        2
    ) as fg_yield_percent,
    ROUND(
        (SUM(wo.actual_boxes) / NULLIF(SUM(wo.planned_boxes), 0)) * 100, 
        2
    ) as plan_accuracy_percent,
    ROUND(
        SUM(wo.actual_output_qty) - SUM(wo.actual_boxes * wo.box_weight_kg), 
        2
    ) as waste_kg
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
WHERE wo.kpi_scope = 'FG'
  AND wo.actual_start IS NOT NULL
  AND wo.actual_boxes IS NOT NULL
  AND wo.box_weight_kg IS NOT NULL
GROUP BY 
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'Europe/London'),
    DATE_TRUNC('month', wo.actual_start AT TIME ZONE 'UTC'),
    wo.line_number,
    p.description,
    p.part_number;

-- Create Consumption View
CREATE VIEW vw_consume AS
SELECT 
    wo.wo_number,
    wo.actual_start AT TIME ZONE 'Europe/London' as production_date_london,
    wo.actual_start AT TIME ZONE 'UTC' as production_date_utc,
    p.description as product,
    mat.description as material,
    mat.part_number as material_part_number,
    bi.quantity as bom_standard_kg,
    COALESCE(SUM(sm.quantity), 0) as actual_consumed_kg,
    COALESCE(SUM(sm.quantity), 0) - bi.quantity as variance_kg,
    ROUND(
        ((COALESCE(SUM(sm.quantity), 0) - bi.quantity) / NULLIF(bi.quantity, 0)) * 100, 
        2
    ) as variance_percent,
    wo.line_number as production_line,
    wo.status as work_order_status
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
JOIN boms b ON p.id = b.product_id AND b.status = 'active'
JOIN bom_items bi ON b.id = bi.bom_id
JOIN products mat ON bi.material_id = mat.id
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
    bi.quantity,
    wo.line_number,
    wo.status;

-- Create Forward Trace Function
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
    path TEXT[]
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
            ARRAY[lp.lp_number] as path
        FROM license_plates lp
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE lp.lp_number = input_lp_number
        
        UNION ALL
        
        -- Recursive case: Find WO outputs
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
            ft.depth + 1 as depth,
            ft.path || lp.lp_number as path
        FROM forward_trace ft
        JOIN stock_moves sm ON sm.lp_id = ft.node_id::INTEGER
        JOIN license_plates lp ON lp.id = sm.lp_id
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE sm.move_type = 'WO_OUTPUT'
          AND ft.depth < 10  -- Prevent infinite recursion
    )
    SELECT * FROM forward_trace;
END;
$$ LANGUAGE plpgsql;

-- Create Backward Trace Function
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
    path TEXT[]
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
            ARRAY[lp.lp_number] as path
        FROM license_plates lp
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE lp.lp_number = input_lp_number
        
        UNION ALL
        
        -- Recursive case: Find parent LPs
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
            bt.depth + 1 as depth,
            bt.path || lp.lp_number as path
        FROM backward_trace bt
        JOIN license_plates lp ON lp.id = bt.parent_node::INTEGER
        JOIN products p ON lp.product_id = p.id
        JOIN locations l ON lp.location_id = l.id
        WHERE bt.depth < 10  -- Prevent infinite recursion
    )
    SELECT * FROM backward_trace;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON VIEW vw_yield_pr_daily IS 'Daily PR yield analytics with Europe/London timezone';
COMMENT ON VIEW vw_yield_pr_weekly IS 'Weekly PR yield analytics with Europe/London timezone';
COMMENT ON VIEW vw_yield_pr_monthly IS 'Monthly PR yield analytics with Europe/London timezone';
COMMENT ON VIEW vw_yield_fg_daily IS 'Daily FG yield analytics with Europe/London timezone';
COMMENT ON VIEW vw_yield_fg_weekly IS 'Weekly FG yield analytics with Europe/London timezone';
COMMENT ON VIEW vw_yield_fg_monthly IS 'Monthly FG yield analytics with Europe/London timezone';
COMMENT ON VIEW vw_consume IS 'Material consumption variance analysis';
COMMENT ON FUNCTION vw_trace_forward(TEXT) IS 'Forward traceability from LP to final outputs';
COMMENT ON FUNCTION vw_trace_backward(TEXT) IS 'Backward traceability from LP to original materials';
