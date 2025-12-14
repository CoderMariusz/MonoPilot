BEGIN;

-- Add constraint: Raw Materials (RM) should have cost_per_unit
-- We use a partial constraint with a function to allow flexibility

-- First, create a function to validate
CREATE OR REPLACE FUNCTION validate_material_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for Raw Materials and Packaging (types that are purchased)
  IF NEW.type IN ('RM', 'PKG') AND NEW.cost_per_unit IS NULL THEN
    RAISE WARNING 'Material % (%) has no cost_per_unit set. BOM cost calculations will be inaccurate.',
      NEW.code, NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_validate_material_cost
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_material_cost();

-- Add check constraint for cost validity (if set, must be >= 0)
ALTER TABLE products
ADD CONSTRAINT chk_cost_per_unit_positive
CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0);

COMMENT ON CONSTRAINT chk_cost_per_unit_positive ON products IS
  'Ensures cost_per_unit, when set, is non-negative';

COMMIT;

-- Rollback
-- DROP TRIGGER trg_validate_material_cost ON products;
-- DROP FUNCTION validate_material_cost();
-- ALTER TABLE products DROP CONSTRAINT chk_cost_per_unit_positive;
