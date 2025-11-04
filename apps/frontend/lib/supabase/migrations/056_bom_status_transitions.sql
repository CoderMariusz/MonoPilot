-- Migration 056: BOM Status Transition Validation
-- Enforces business rules for BOM status changes
-- Prevents invalid transitions (active→draft, archived→draft, archived→active)

-- ==========================================
-- 1. BOM Status Transition Validation Function
-- ==========================================
CREATE OR REPLACE FUNCTION validate_bom_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- active → draft: FORBIDDEN (must clone)
  IF OLD.status = 'active' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot change active BOM to draft. Use Clone action instead.'
      USING HINT = 'Use the Clone button to create a draft copy of this BOM',
            ERRCODE = 'P0001';
  END IF;
  
  -- archived → draft: FORBIDDEN
  IF OLD.status = 'archived' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot reactivate archived BOM to draft. Clone instead.'
      USING HINT = 'Use the Clone button to create a new draft from archived BOM',
            ERRCODE = 'P0001';
  END IF;
  
  -- archived → active: FORBIDDEN
  IF OLD.status = 'archived' AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot reactivate archived BOM. Clone instead.'
      USING HINT = 'Use the Clone button to create a new draft, then activate it',
            ERRCODE = 'P0001';
  END IF;
  
  -- Valid transitions:
  -- draft → active: OK
  -- draft → archived: OK
  -- active → archived: OK
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_bom_status_transition() IS 'Validates BOM status transitions according to business rules';

-- ==========================================
-- 2. Create trigger for status validation
-- ==========================================
DROP TRIGGER IF EXISTS bom_status_transition_check ON boms;

CREATE TRIGGER bom_status_transition_check
  BEFORE UPDATE ON boms
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_bom_status_transition();

COMMENT ON TRIGGER bom_status_transition_check ON boms IS 'Enforces valid BOM status transitions';

-- ==========================================
-- 3. Ensure single active BOM per product (enhanced)
-- ==========================================
CREATE OR REPLACE FUNCTION enforce_single_active_bom()
RETURNS TRIGGER AS $$
BEGIN
  -- When setting a BOM to active, archive all other active BOMs for the same product
  IF NEW.status = 'active' THEN
    UPDATE boms
    SET status = 'archived',
        updated_at = NOW()
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_active_bom_check ON boms;

CREATE TRIGGER single_active_bom_check
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION enforce_single_active_bom();

COMMENT ON FUNCTION enforce_single_active_bom() IS 'Ensures only one active BOM per product by auto-archiving others';
COMMENT ON TRIGGER single_active_bom_check ON boms IS 'Maintains single active BOM constraint per product';

