-- Migration 026: Add BOM Date Overlap Validation
-- Epic 2 - Batch 2B: BOM System
-- Story: 2.8 - BOM Date Overlap Validation
-- Date: 2025-01-23

-- ============================================================================
-- FUNCTION: Check BOM Date Overlap
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any existing BOM for same product has overlapping dates
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)  -- Exclude self on UPDATE
      AND (
        -- Case 1: NEW overlaps existing start
        (NEW.effective_from BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'::date))
        OR
        -- Case 2: NEW overlaps existing end
        (COALESCE(NEW.effective_to, '9999-12-31'::date) BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'::date))
        OR
        -- Case 3: NEW encompasses existing
        (NEW.effective_from <= effective_from AND COALESCE(NEW.effective_to, '9999-12-31'::date) >= COALESCE(effective_to, '9999-12-31'::date))
      )
  ) THEN
    RAISE EXCEPTION 'BOM_DATE_OVERLAP: Date range overlaps with existing BOM for this product'
      USING HINT = 'Check existing BOM versions for this product and adjust dates accordingly';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Validate BOM Date Overlap
-- ============================================================================

CREATE TRIGGER trigger_check_bom_date_overlap
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_date_overlap();

COMMENT ON FUNCTION check_bom_date_overlap IS 'Validates that BOM date ranges do not overlap for the same product (Story 2.8)';
