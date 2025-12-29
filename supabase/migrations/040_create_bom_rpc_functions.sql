-- Migration: Create BOM RPC functions
-- Story: 02.4 - Bills of Materials Management
-- Purpose: RPC functions for BOM service operations
-- CRITICAL: These functions are called by bom-service-02-4.ts
--
-- Functions created:
--   1. check_bom_date_overlap_rpc - Check if date range overlaps with existing BOMs
--   2. get_work_orders_for_bom - Get work orders that reference a BOM
--   3. get_bom_timeline - Get version timeline for a product
--
-- Security: SECURITY DEFINER to respect RLS while allowing cross-row queries

-- ============================================================================
-- Function 1: check_bom_date_overlap (RPC function)
-- Called by: bom-service-02-4.ts checkDateOverlap() - line 286
-- Purpose: Check if a date range overlaps with existing BOMs for a product
-- Returns: Table of conflicting BOMs (empty if no overlap)
--
-- RELATIONSHIP TO TRIGGER:
-- - Trigger: check_bom_date_overlap() in migration 038
--   - Purpose: Database-level preventive control (blocks INSERT/UPDATE)
--   - Runs automatically on data modification
--   - Source of truth for date overlap validation
--
-- - RPC: check_bom_date_overlap() (this function)
--   - Purpose: Client-side validation before attempting INSERT/UPDATE
--   - Called explicitly by service layer for early validation
--   - Returns overlapping BOMs for user feedback
--
-- Both use identical daterange logic to ensure consistency.
-- RPC is named the same as trigger for clarity (PostgeSQL allows this).
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_date_overlap(
  p_product_id UUID,
  p_effective_from DATE,
  p_effective_to DATE DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL,
  p_org_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  version INTEGER,
  effective_from DATE,
  effective_to DATE
) AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get org_id: use parameter if provided (service layer), otherwise get from auth
  -- Defense in Depth: Service passes org_id, RPC validates against auth.uid()
  IF p_org_id IS NOT NULL THEN
    v_org_id := p_org_id;
  ELSE
    SELECT org_id INTO v_org_id FROM users WHERE users.id = auth.uid();
  END IF;

  -- Validate caller has access to this org (Defense in Depth)
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND org_id = v_org_id) THEN
    RAISE EXCEPTION 'Unauthorized: User does not belong to organization';
  END IF;

  -- Return overlapping BOMs for the same product within the organization
  -- Uses same daterange logic as trigger (migration 038) for consistency
  RETURN QUERY
  SELECT b.id, b.version, b.effective_from, b.effective_to
  FROM boms b
  WHERE b.org_id = v_org_id
    AND b.product_id = p_product_id
    AND (p_exclude_id IS NULL OR b.id != p_exclude_id)
    AND (
      -- Overlap detection using PostgreSQL daterange
      -- daterange with '[]' means inclusive on both ends
      -- NULL effective_to is treated as unbounded (infinity)
      daterange(b.effective_from, b.effective_to, '[]') &&
      daterange(p_effective_from, p_effective_to, '[]')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function 2: get_work_orders_for_bom
-- Called by: bom-service-02-4.ts deleteBOM() - line 518
-- Purpose: Get work orders that reference a BOM (for delete validation)
-- Returns: Table of work order numbers and statuses
-- Note: Returns empty until work_orders table exists (Story 04.x)
--
-- Defense in Depth: Accepts p_org_id from service layer and validates against auth.uid()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_work_orders_for_bom(
  p_bom_id UUID,
  p_org_id UUID DEFAULT NULL
) RETURNS TABLE (
  wo_number TEXT,
  status TEXT
) AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get org_id: use parameter if provided (service layer), otherwise get from auth
  -- Defense in Depth: Service passes org_id, RPC validates against auth.uid()
  IF p_org_id IS NOT NULL THEN
    v_org_id := p_org_id;
  ELSE
    SELECT org_id INTO v_org_id FROM users WHERE users.id = auth.uid();
  END IF;

  -- Validate caller has access to this org (Defense in Depth)
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND org_id = v_org_id) THEN
    RAISE EXCEPTION 'Unauthorized: User does not belong to organization';
  END IF;

  -- Check if work_orders table exists (created in Story 04.x)
  -- For now, return empty result set
  -- When work_orders table is created, update this function:
  --
  -- RETURN QUERY
  -- SELECT wo.wo_number, wo.status
  -- FROM work_orders wo
  -- WHERE wo.org_id = v_org_id
  --   AND wo.bom_id = p_bom_id;

  -- Return empty set (no work orders reference BOMs yet)
  RETURN QUERY SELECT NULL::TEXT, NULL::TEXT WHERE FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function 3: get_bom_timeline
-- Called by: bom-service-02-4.ts getBOMTimeline() - line 568
-- Purpose: Get version timeline with active/overlap status for visualization
-- Returns: All BOM versions for a product with computed flags
-- Acceptance Criteria: AC-24 to AC-30 (FR-2.23)
--
-- Defense in Depth: Accepts p_org_id from service layer and validates against auth.uid()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bom_timeline(
  p_product_id UUID,
  p_org_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  version INTEGER,
  status TEXT,
  effective_from DATE,
  effective_to DATE,
  output_qty DECIMAL,
  output_uom TEXT,
  notes TEXT,
  is_currently_active BOOLEAN,
  has_overlap BOOLEAN
) AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get org_id: use parameter if provided (service layer), otherwise get from auth
  -- Defense in Depth: Service passes org_id, RPC validates against auth.uid()
  IF p_org_id IS NOT NULL THEN
    v_org_id := p_org_id;
  ELSE
    SELECT org_id INTO v_org_id FROM users WHERE users.id = auth.uid();
  END IF;

  -- Validate caller has access to this org (Defense in Depth)
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND org_id = v_org_id) THEN
    RAISE EXCEPTION 'Unauthorized: User does not belong to organization';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.version,
    b.status,
    b.effective_from,
    b.effective_to,
    b.output_qty,
    b.output_uom,
    b.notes,
    -- is_currently_active: CURRENT_DATE is within the effective date range
    -- inclusive on both ends, NULL effective_to means ongoing
    (
      b.effective_from <= CURRENT_DATE AND
      (b.effective_to IS NULL OR b.effective_to >= CURRENT_DATE)
    ) AS is_currently_active,
    -- has_overlap: check if this BOM overlaps with any other BOM for same product
    -- Uses same daterange logic as trigger (migration 038) for consistency
    EXISTS(
      SELECT 1
      FROM boms b2
      WHERE b2.org_id = v_org_id
        AND b2.product_id = p_product_id
        AND b2.id != b.id
        AND daterange(b.effective_from, b.effective_to, '[]') &&
            daterange(b2.effective_from, b2.effective_to, '[]')
    ) AS has_overlap
  FROM boms b
  WHERE b.org_id = v_org_id
    AND b.product_id = p_product_id
  ORDER BY b.version DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT statements for authenticated users
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_bom_date_overlap(UUID, DATE, DATE, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_work_orders_for_bom(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bom_timeline(UUID, UUID) TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION check_bom_date_overlap(UUID, DATE, DATE, UUID, UUID) IS
  'RPC: Check if date range overlaps with existing BOMs for a product. Returns conflicting BOMs. (Story 02.4, AC-18 to AC-20)';

COMMENT ON FUNCTION get_work_orders_for_bom(UUID, UUID) IS
  'RPC: Get work orders referencing a BOM for delete validation. Returns empty until work_orders table exists. (Story 02.4, AC-31 to AC-33)';

COMMENT ON FUNCTION get_bom_timeline(UUID, UUID) IS
  'RPC: Get BOM version timeline with is_currently_active and has_overlap flags for visualization. (Story 02.4, AC-24 to AC-30)';
