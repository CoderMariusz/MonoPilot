-- Migration: 047_select_bom_by_date.sql
-- Description: RPC function to select correct BOM version for a Work Order
-- Epic: EPIC-001 BOM Complexity v2 - Phase 2 (Multi-Version BOM)
-- Created: 2025-01-11

-- ============================================================================
-- FUNCTION: select_bom_for_wo
-- Purpose: Select the correct BOM version based on scheduled date
-- ============================================================================

CREATE OR REPLACE FUNCTION select_bom_for_wo(
  p_product_id INTEGER,
  p_scheduled_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  bom_id INTEGER,
  bom_version VARCHAR,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  is_current BOOLEAN,
  is_future BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bom_id,
    b.version AS bom_version,
    b.effective_from,
    b.effective_to,
    -- is_current: BOM is active right now
    (b.effective_from <= NOW() AND (b.effective_to IS NULL OR b.effective_to > NOW())) AS is_current,
    -- is_future: BOM will be active in the future
    (b.effective_from > NOW()) AS is_future
  FROM boms b
  WHERE b.product_id = p_product_id
    AND b.status = 'active'
    AND b.effective_from <= p_scheduled_date
    AND (b.effective_to IS NULL OR b.effective_to > p_scheduled_date)
  ORDER BY b.effective_from DESC
  LIMIT 1;
  
  -- If no BOM found, raise exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active BOM found for product % on date %', p_product_id, p_scheduled_date
      USING HINT = 'Please ensure product has at least one active BOM covering the scheduled date.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_all_bom_versions
-- Purpose: Get all BOM versions for a product (for UI display)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_bom_versions(
  p_product_id INTEGER
)
RETURNS TABLE (
  bom_id INTEGER,
  bom_version VARCHAR,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  status VARCHAR,
  is_current BOOLEAN,
  is_future BOOLEAN,
  is_expired BOOLEAN,
  items_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bom_id,
    b.version AS bom_version,
    b.effective_from,
    b.effective_to,
    b.status,
    -- is_current: BOM is active right now
    (b.effective_from <= NOW() AND (b.effective_to IS NULL OR b.effective_to > NOW()) AND b.status = 'active') AS is_current,
    -- is_future: BOM will be active in the future
    (b.effective_from > NOW() AND b.status = 'active') AS is_future,
    -- is_expired: BOM has expired
    (b.effective_to IS NOT NULL AND b.effective_to <= NOW()) AS is_expired,
    -- Count BOM items (materials + by-products)
    (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id = b.id)::INTEGER AS items_count
  FROM boms b
  WHERE b.product_id = p_product_id
  ORDER BY b.effective_from DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: validate_bom_date_range
-- Purpose: Helper function to validate date range before creating/updating BOM
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_bom_date_range(
  p_product_id INTEGER,
  p_bom_id INTEGER DEFAULT NULL,
  p_effective_from TIMESTAMPTZ DEFAULT NOW(),
  p_effective_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  conflicting_bom_id INTEGER
) AS $$
DECLARE
  v_overlap_count INTEGER;
  v_conflicting_bom_id INTEGER;
BEGIN
  -- Check for overlapping date ranges
  SELECT COUNT(*), MIN(id) INTO v_overlap_count, v_conflicting_bom_id
  FROM boms
  WHERE product_id = p_product_id
    AND id != COALESCE(p_bom_id, -1)
    AND status = 'active'
    AND (
      tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)') 
      && 
      tstzrange(p_effective_from, COALESCE(p_effective_to, 'infinity'::timestamptz), '[)')
    );

  IF v_overlap_count > 0 THEN
    RETURN QUERY SELECT 
      FALSE AS is_valid, 
      'BOM date range overlaps with existing active BOM (ID: ' || v_conflicting_bom_id || ')' AS error_message,
      v_conflicting_bom_id AS conflicting_bom_id;
  ELSE
    RETURN QUERY SELECT 
      TRUE AS is_valid, 
      NULL::TEXT AS error_message,
      NULL::INTEGER AS conflicting_bom_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON FUNCTION select_bom_for_wo IS 'Selects the correct BOM version for a Work Order based on scheduled date. Returns the BOM that is active on the given date.';

COMMENT ON FUNCTION get_all_bom_versions IS 'Returns all BOM versions for a product with status flags (current, future, expired). Used for UI display in BOM version timeline.';

COMMENT ON FUNCTION validate_bom_date_range IS 'Validates that a BOM date range does not overlap with existing active BOMs for the same product. Returns validation result with error details.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
Example 1: Find BOM for WO scheduled today
SELECT * FROM select_bom_for_wo(100, NOW());

Example 2: Find BOM for WO scheduled in March 2025
SELECT * FROM select_bom_for_wo(100, '2025-03-15 10:00:00+00');

Example 3: Get all BOM versions for product (for UI display)
SELECT * FROM get_all_bom_versions(100);

Example 4: Validate date range before creating new BOM
SELECT * FROM validate_bom_date_range(
  100,                      -- product_id
  NULL,                     -- bom_id (NULL for new BOM)
  '2025-03-01 00:00:00+00', -- effective_from
  '2025-04-01 00:00:00+00'  -- effective_to
);

-- Expected result:
-- is_valid | error_message | conflicting_bom_id
-- ---------+---------------+-------------------
-- false    | BOM date...   | 123
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

