-- Migration: Fix BOM selection functions
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: Add missing output_uom and routing_name fields to BOM selection functions

-- ============================================================================
-- FUNCTION: get_active_bom_for_date (FIX)
-- Purpose: Get auto-selected BOM for product on scheduled date with output_uom and routing_name
-- ============================================================================

DROP FUNCTION IF EXISTS get_active_bom_for_date(UUID, UUID, DATE);

CREATE OR REPLACE FUNCTION get_active_bom_for_date(
  p_product_id UUID,
  p_org_id UUID,
  p_scheduled_date DATE
)
RETURNS TABLE (
  bom_id UUID,
  bom_code TEXT,
  bom_version INTEGER,
  output_qty DECIMAL,
  output_uom TEXT,
  effective_from DATE,
  effective_to DATE,
  routing_id UUID,
  routing_name TEXT,
  item_count BIGINT,
  is_recommended BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS bom_id,
    b.code AS bom_code,
    b.version AS bom_version,
    b.output_qty,
    b.output_uom,
    b.effective_from,
    b.effective_to,
    b.routing_id,
    r.name AS routing_name,
    (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id = b.id) AS item_count,
    TRUE AS is_recommended
  FROM boms b
  LEFT JOIN routings r ON r.id = b.routing_id
  WHERE b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
    AND b.effective_from <= p_scheduled_date
    AND (b.effective_to IS NULL OR b.effective_to >= p_scheduled_date)
  ORDER BY b.effective_from DESC, b.created_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_active_bom_for_date IS 'Auto-select BOM based on scheduled date effective range with output_uom and routing_name (Story 03.10)';

-- ============================================================================
-- FUNCTION: get_all_active_boms_for_product (FIX)
-- Purpose: Get all active BOMs for product (manual BOM selection) with output_uom and routing_name
-- ============================================================================

DROP FUNCTION IF EXISTS get_all_active_boms_for_product(UUID, UUID);

CREATE OR REPLACE FUNCTION get_all_active_boms_for_product(
  p_product_id UUID,
  p_org_id UUID
)
RETURNS TABLE (
  bom_id UUID,
  bom_code TEXT,
  bom_version INTEGER,
  output_qty DECIMAL,
  output_uom TEXT,
  effective_from DATE,
  effective_to DATE,
  routing_id UUID,
  routing_name TEXT,
  item_count BIGINT,
  is_current BOOLEAN,
  is_recommended BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_recommended_bom_id UUID;
BEGIN
  -- First, find the recommended BOM (the one that would be auto-selected for today)
  SELECT b.id INTO v_recommended_bom_id
  FROM boms b
  WHERE b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
    AND b.effective_from <= CURRENT_DATE
    AND (b.effective_to IS NULL OR b.effective_to >= CURRENT_DATE)
  ORDER BY b.effective_from DESC, b.created_at DESC
  LIMIT 1;

  -- Return all active BOMs with the recommended flag
  RETURN QUERY
  SELECT
    b.id AS bom_id,
    b.code AS bom_code,
    b.version AS bom_version,
    b.output_qty,
    b.output_uom,
    b.effective_from,
    b.effective_to,
    b.routing_id,
    r.name AS routing_name,
    (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id = b.id) AS item_count,
    (b.effective_from <= CURRENT_DATE
      AND (b.effective_to IS NULL OR b.effective_to >= CURRENT_DATE)) AS is_current,
    (b.id = v_recommended_bom_id) AS is_recommended
  FROM boms b
  LEFT JOIN routings r ON r.id = b.routing_id
  WHERE b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
  ORDER BY b.effective_from DESC, b.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_all_active_boms_for_product IS 'Get all active BOMs for product for manual selection with output_uom, routing_name, and is_recommended flag (Story 03.10)';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_bom_for_date TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_boms_for_product TO authenticated;
