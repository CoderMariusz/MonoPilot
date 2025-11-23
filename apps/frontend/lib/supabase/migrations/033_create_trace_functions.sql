-- Migration 033: Create Trace RPC Functions
-- Epic 2 Batch 2D - Recursive CTE functions for forward/backward tracing

-- Forward Trace Function
CREATE OR REPLACE FUNCTION trace_forward(
  p_lp_id UUID,
  p_max_depth INT DEFAULT 20
)
RETURNS TABLE (
  lp_id UUID,
  lp_number VARCHAR,
  product_code VARCHAR,
  product_name VARCHAR,
  quantity NUMERIC,
  uom VARCHAR,
  status VARCHAR,
  relationship_type VARCHAR,
  depth INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE forward_trace AS (
    -- Base: starting LP
    SELECT
      lg.child_lp_id AS lp_id,
      lg.relationship_type,
      1 AS depth
    FROM lp_genealogy lg
    WHERE lg.parent_lp_id = p_lp_id

    UNION ALL

    -- Recursive: children of children
    SELECT
      lg.child_lp_id,
      lg.relationship_type,
      ft.depth + 1
    FROM lp_genealogy lg
    INNER JOIN forward_trace ft ON lg.parent_lp_id = ft.lp_id
    WHERE ft.depth < p_max_depth
  )
  SELECT
    lp.id,
    lp.lp_number,
    p.code,
    p.name,
    lp.quantity,
    lp.uom,
    lp.status,
    ft.relationship_type,
    ft.depth
  FROM forward_trace ft
  INNER JOIN license_plates lp ON lp.id = ft.lp_id
  INNER JOIN products p ON p.id = lp.product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backward Trace Function
CREATE OR REPLACE FUNCTION trace_backward(
  p_lp_id UUID,
  p_max_depth INT DEFAULT 20
)
RETURNS TABLE (
  lp_id UUID,
  lp_number VARCHAR,
  product_code VARCHAR,
  product_name VARCHAR,
  quantity NUMERIC,
  uom VARCHAR,
  relationship_type VARCHAR,
  depth INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE backward_trace AS (
    -- Base: starting LP parents
    SELECT
      lg.parent_lp_id AS lp_id,
      lg.relationship_type,
      1 AS depth
    FROM lp_genealogy lg
    WHERE lg.child_lp_id = p_lp_id

    UNION ALL

    -- Recursive: parents of parents
    SELECT
      lg.parent_lp_id,
      lg.relationship_type,
      bt.depth + 1
    FROM lp_genealogy lg
    INNER JOIN backward_trace bt ON lg.child_lp_id = bt.lp_id
    WHERE bt.depth < p_max_depth
  )
  SELECT
    lp.id,
    lp.lp_number,
    p.code,
    p.name,
    lp.quantity,
    lp.uom,
    bt.relationship_type,
    bt.depth
  FROM backward_trace bt
  INNER JOIN license_plates lp ON lp.id = bt.lp_id
  INNER JOIN products p ON p.id = lp.product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trace_forward IS 'Recursive forward trace to find all LP descendants';
COMMENT ON FUNCTION trace_backward IS 'Recursive backward trace to find all LP ancestors';
