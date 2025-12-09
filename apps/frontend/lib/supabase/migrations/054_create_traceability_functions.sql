-- Migration 054: Enhanced Traceability Functions
-- Story 5.28: Forward/Backward Traceability
-- Creates optimized recursive CTE functions for LP genealogy tracing

-- ============================================
-- 1. Drop existing functions (to recreate with new signature)
-- ============================================
DROP FUNCTION IF EXISTS get_lp_descendants(UUID, INT);
DROP FUNCTION IF EXISTS get_lp_ancestors(UUID, INT);

-- ============================================
-- 2. Create get_lp_descendants - Forward trace (all child/grandchild LPs)
-- ============================================
CREATE OR REPLACE FUNCTION get_lp_descendants(
  p_lp_id UUID,
  p_max_depth INT DEFAULT 10
)
RETURNS TABLE (
  lp_id UUID,
  lp_number VARCHAR,
  product_id UUID,
  product_code VARCHAR,
  product_name VARCHAR,
  current_qty NUMERIC,
  uom VARCHAR,
  status VARCHAR,
  batch_number VARCHAR,
  expiry_date DATE,
  operation_type VARCHAR,
  wo_id UUID,
  wo_number VARCHAR,
  grn_id UUID,
  grn_number VARCHAR,
  quantity_used NUMERIC,
  relationship_created_at TIMESTAMPTZ,
  depth INT,
  path UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Base case: direct children
    SELECT
      lg.child_lp_id AS lp_id,
      lg.relationship_type AS operation_type,
      lg.work_order_id AS wo_id,
      lg.quantity_from_parent AS quantity_used,
      lg.created_at AS relationship_created_at,
      1 AS depth,
      ARRAY[lg.parent_lp_id, lg.child_lp_id] AS path
    FROM lp_genealogy lg
    WHERE lg.parent_lp_id = p_lp_id
      AND lg.child_lp_id IS NOT NULL

    UNION ALL

    -- Recursive: children of children
    SELECT
      lg.child_lp_id,
      lg.relationship_type,
      lg.work_order_id,
      lg.quantity_from_parent,
      lg.created_at,
      d.depth + 1,
      d.path || lg.child_lp_id
    FROM lp_genealogy lg
    INNER JOIN descendants d ON lg.parent_lp_id = d.lp_id
    WHERE d.depth < p_max_depth
      AND lg.child_lp_id IS NOT NULL
      AND NOT lg.child_lp_id = ANY(d.path) -- Prevent cycles
  )
  SELECT
    lp.id,
    lp.lp_number,
    lp.product_id,
    p.code AS product_code,
    p.name AS product_name,
    lp.current_qty,
    lp.uom,
    lp.status,
    lp.batch_number,
    lp.expiry_date,
    d.operation_type,
    d.wo_id,
    wo.wo_number,
    grn.id AS grn_id,
    grn.grn_number,
    d.quantity_used,
    d.relationship_created_at,
    d.depth,
    d.path
  FROM descendants d
  INNER JOIN license_plates lp ON lp.id = d.lp_id
  INNER JOIN products p ON p.id = lp.product_id
  LEFT JOIN work_orders wo ON wo.id = d.wo_id
  LEFT JOIN grn_items gi ON gi.lp_id = lp.id
  LEFT JOIN goods_receipt_notes grn ON grn.id = gi.grn_id
  ORDER BY d.depth, d.relationship_created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Create get_lp_ancestors - Backward trace (all parent/grandparent LPs)
-- ============================================
CREATE OR REPLACE FUNCTION get_lp_ancestors(
  p_lp_id UUID,
  p_max_depth INT DEFAULT 10
)
RETURNS TABLE (
  lp_id UUID,
  lp_number VARCHAR,
  product_id UUID,
  product_code VARCHAR,
  product_name VARCHAR,
  current_qty NUMERIC,
  uom VARCHAR,
  status VARCHAR,
  batch_number VARCHAR,
  expiry_date DATE,
  operation_type VARCHAR,
  wo_id UUID,
  wo_number VARCHAR,
  grn_id UUID,
  grn_number VARCHAR,
  quantity_used NUMERIC,
  relationship_created_at TIMESTAMPTZ,
  depth INT,
  path UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    -- Base case: direct parents
    SELECT
      lg.parent_lp_id AS lp_id,
      lg.relationship_type AS operation_type,
      lg.work_order_id AS wo_id,
      lg.quantity_from_parent AS quantity_used,
      lg.created_at AS relationship_created_at,
      1 AS depth,
      ARRAY[lg.child_lp_id, lg.parent_lp_id] AS path
    FROM lp_genealogy lg
    WHERE lg.child_lp_id = p_lp_id

    UNION ALL

    -- Recursive: parents of parents
    SELECT
      lg.parent_lp_id,
      lg.relationship_type,
      lg.work_order_id,
      lg.quantity_from_parent,
      lg.created_at,
      a.depth + 1,
      a.path || lg.parent_lp_id
    FROM lp_genealogy lg
    INNER JOIN ancestors a ON lg.child_lp_id = a.lp_id
    WHERE a.depth < p_max_depth
      AND NOT lg.parent_lp_id = ANY(a.path) -- Prevent cycles
  )
  SELECT
    lp.id,
    lp.lp_number,
    lp.product_id,
    p.code AS product_code,
    p.name AS product_name,
    lp.current_qty,
    lp.uom,
    lp.status,
    lp.batch_number,
    lp.expiry_date,
    a.operation_type,
    a.wo_id,
    wo.wo_number,
    grn.id AS grn_id,
    grn.grn_number,
    a.quantity_used,
    a.relationship_created_at,
    a.depth,
    a.path
  FROM ancestors a
  INNER JOIN license_plates lp ON lp.id = a.lp_id
  INNER JOIN products p ON p.id = lp.product_id
  LEFT JOIN work_orders wo ON wo.id = a.wo_id
  LEFT JOIN grn_items gi ON gi.lp_id = lp.id
  LEFT JOIN goods_receipt_notes grn ON grn.id = gi.grn_id
  ORDER BY a.depth, a.relationship_created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Create validate_no_cycle function
-- ============================================
CREATE OR REPLACE FUNCTION validate_no_cycle(
  p_parent_id UUID,
  p_child_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_cycle BOOLEAN := FALSE;
BEGIN
  -- Check if child_id already exists in ancestors of parent_id
  SELECT EXISTS (
    SELECT 1
    FROM get_lp_ancestors(p_parent_id, 10) a
    WHERE a.lp_id = p_child_id
  ) INTO has_cycle;

  -- Also check if parent_id exists in descendants of child_id
  IF NOT has_cycle THEN
    SELECT EXISTS (
      SELECT 1
      FROM get_lp_descendants(p_child_id, 10) d
      WHERE d.lp_id = p_parent_id
    ) INTO has_cycle;
  END IF;

  RETURN NOT has_cycle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Add additional indexes for performance
-- ============================================
-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_created_at
  ON lp_genealogy(created_at DESC);

-- Partial index for active relationships
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_active_relations
  ON lp_genealogy(parent_lp_id, child_lp_id)
  WHERE child_lp_id IS NOT NULL;

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON FUNCTION get_lp_descendants IS 'Story 5.28: Forward trace - finds all child/grandchild LPs with operation types, WO/GRN links, and timestamps. Max depth 10.';
COMMENT ON FUNCTION get_lp_ancestors IS 'Story 5.28: Backward trace - finds all parent/grandparent LPs with operation types, WO/GRN links, and timestamps. Max depth 10.';
COMMENT ON FUNCTION validate_no_cycle IS 'Story 5.28: Validates that adding a genealogy relationship would not create a cycle.';

-- ============================================
-- 7. Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_lp_descendants TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_ancestors TO authenticated;
GRANT EXECUTE ON FUNCTION validate_no_cycle TO authenticated;
