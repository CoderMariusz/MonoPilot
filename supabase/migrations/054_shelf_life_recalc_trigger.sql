-- ============================================================================
-- Migration: Create shelf life recalculation trigger
-- Story: 02.11 - Shelf Life Calculation + Expiry Management
-- Purpose: Trigger to flag products for recalculation when ingredient
--          shelf_life_days changes (AC-11.16)
-- ============================================================================

-- ============================================================================
-- Function: Flag products for shelf life recalculation
-- When an ingredient's shelf_life_days changes, flag all products using
-- that ingredient in their active BOM for recalculation
-- ============================================================================

CREATE OR REPLACE FUNCTION flag_products_for_shelf_life_recalc()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if shelf_life_days actually changed
  IF OLD.shelf_life_days IS DISTINCT FROM NEW.shelf_life_days THEN
    -- Flag all products using this ingredient in their active BOM
    -- Only flag products with auto_min_ingredients calculation method
    UPDATE product_shelf_life psl
    SET
      needs_recalculation = true,
      updated_at = NOW()
    WHERE psl.product_id IN (
      SELECT DISTINCT b.product_id
      FROM boms b
      JOIN bom_items bi ON bi.bom_id = b.id
      WHERE bi.component_id = NEW.id
        AND b.status = 'active'
        AND b.org_id = NEW.org_id
    )
    AND psl.org_id = NEW.org_id
    AND psl.calculation_method = 'auto_min_ingredients';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Fire on product shelf_life_days update
-- ============================================================================

DROP TRIGGER IF EXISTS trg_flag_shelf_life_recalc ON products;

CREATE TRIGGER trg_flag_shelf_life_recalc
  AFTER UPDATE OF shelf_life_days ON products
  FOR EACH ROW
  EXECUTE FUNCTION flag_products_for_shelf_life_recalc();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION flag_products_for_shelf_life_recalc() IS
  'Flags products for shelf life recalculation when an ingredient shelf_life_days changes. Only affects products using auto_min_ingredients calculation method.';
