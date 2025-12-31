-- Migration: Work order functions
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: Database functions for WO number generation and BOM selection

-- ============================================================================
-- FUNCTION: generate_wo_number
-- Purpose: Generate next WO number with daily reset (WO-YYYYMMDD-NNNN)
-- Security: Uses SECURITY DEFINER to bypass RLS for sequence update
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_wo_number(
  p_org_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_str TEXT;
  v_next_seq INTEGER;
BEGIN
  -- Format date as YYYYMMDD
  v_date_str := TO_CHAR(p_date, 'YYYYMMDD');

  -- Insert or update sequence for this org/date (handles race conditions)
  INSERT INTO wo_daily_sequence (org_id, sequence_date, last_sequence, updated_at)
  VALUES (p_org_id, p_date, 1, NOW())
  ON CONFLICT (org_id, sequence_date)
  DO UPDATE SET
    last_sequence = wo_daily_sequence.last_sequence + 1,
    updated_at = NOW()
  RETURNING last_sequence INTO v_next_seq;

  -- Return formatted WO number
  RETURN 'WO-' || v_date_str || '-' || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION generate_wo_number IS 'Generate next WO number for org with daily reset sequence (Story 03.10)';

-- ============================================================================
-- FUNCTION: get_active_bom_for_date
-- Purpose: Get auto-selected BOM for product on scheduled date
-- Logic: Most recent effective_from <= scheduled_date, respects effective_to
-- ============================================================================

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
  effective_from DATE,
  effective_to DATE,
  routing_id UUID,
  item_count BIGINT
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
    b.effective_from,
    b.effective_to,
    b.routing_id,
    (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id = b.id) AS item_count
  FROM boms b
  WHERE b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
    AND b.effective_from <= p_scheduled_date
    AND (b.effective_to IS NULL OR b.effective_to >= p_scheduled_date)
  ORDER BY b.effective_from DESC, b.created_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_active_bom_for_date IS 'Auto-select BOM based on scheduled date effective range (Story 03.10)';

-- ============================================================================
-- FUNCTION: get_all_active_boms_for_product
-- Purpose: Get all active BOMs for product (manual BOM selection)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_active_boms_for_product(
  p_product_id UUID,
  p_org_id UUID
)
RETURNS TABLE (
  bom_id UUID,
  bom_code TEXT,
  bom_version INTEGER,
  output_qty DECIMAL,
  effective_from DATE,
  effective_to DATE,
  routing_id UUID,
  item_count BIGINT,
  is_current BOOLEAN
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
    b.effective_from,
    b.effective_to,
    b.routing_id,
    (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id = b.id) AS item_count,
    (b.effective_from <= CURRENT_DATE
      AND (b.effective_to IS NULL OR b.effective_to >= CURRENT_DATE)) AS is_current
  FROM boms b
  WHERE b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
  ORDER BY b.effective_from DESC, b.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_all_active_boms_for_product IS 'Get all active BOMs for product for manual selection (Story 03.10)';

-- ============================================================================
-- FUNCTION: preview_next_wo_number
-- Purpose: Preview what the next WO number would be (without incrementing)
-- ============================================================================

CREATE OR REPLACE FUNCTION preview_next_wo_number(
  p_org_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_date_str TEXT;
  v_current_seq INTEGER;
BEGIN
  v_date_str := TO_CHAR(p_date, 'YYYYMMDD');

  -- Get current sequence (if exists)
  SELECT last_sequence INTO v_current_seq
  FROM wo_daily_sequence
  WHERE org_id = p_org_id
    AND sequence_date = p_date;

  -- Return preview of next number
  IF v_current_seq IS NULL THEN
    v_current_seq := 0;
  END IF;

  RETURN 'WO-' || v_date_str || '-' || LPAD((v_current_seq + 1)::TEXT, 4, '0');
END;
$$;

COMMENT ON FUNCTION preview_next_wo_number IS 'Preview next WO number without incrementing sequence (Story 03.10)';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_wo_number TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_bom_for_date TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_boms_for_product TO authenticated;
GRANT EXECUTE ON FUNCTION preview_next_wo_number TO authenticated;
