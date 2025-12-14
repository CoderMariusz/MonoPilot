BEGIN;

-- Create UoM compatibility function
CREATE OR REPLACE FUNCTION validate_bom_item_uom()
RETURNS TRIGGER AS $$
DECLARE
  component_base_uom TEXT;
  bom_item_uom TEXT;
BEGIN
  -- Get component's base UoM
  SELECT base_uom INTO component_base_uom
  FROM products
  WHERE id = NEW.product_id;

  -- Get BOM item UoM
  bom_item_uom := NEW.uom;

  -- If UoMs don't match, raise warning
  IF component_base_uom != bom_item_uom THEN
    RAISE WARNING 'BOM item UoM (%) does not match component base UoM (%). Unit conversion required.',
      bom_item_uom, component_base_uom;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_validate_bom_item_uom
  BEFORE INSERT OR UPDATE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_bom_item_uom();

-- Add check for quantity > 0 (should already exist but verify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'bom_items_quantity_check'
  ) THEN
    ALTER TABLE bom_items
    ADD CONSTRAINT bom_items_quantity_check CHECK (quantity > 0);
  END IF;
END $$;

COMMENT ON FUNCTION validate_bom_item_uom() IS
  'Validates BOM item UoM matches component base UoM, warns on mismatch';

COMMIT;

-- Rollback
-- DROP TRIGGER trg_validate_bom_item_uom ON bom_items;
-- DROP FUNCTION validate_bom_item_uom();
