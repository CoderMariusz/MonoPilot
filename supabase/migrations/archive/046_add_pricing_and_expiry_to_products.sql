BEGIN;

-- Add std_price (standard selling price)
ALTER TABLE products
ADD COLUMN std_price NUMERIC(15,4) DEFAULT NULL;

-- Add expiry_policy
ALTER TABLE products
ADD COLUMN expiry_policy TEXT DEFAULT 'none'
  CHECK (expiry_policy IN ('fixed', 'rolling', 'none'));

-- Add comments
COMMENT ON COLUMN products.std_price IS 'Standard selling price (different from cost_per_unit which is production cost)';
COMMENT ON COLUMN products.expiry_policy IS 'Expiry calculation: fixed (from production), rolling (from receipt), none (no expiry)';

-- Add constraint: perishable products should have policy
ALTER TABLE products
ADD CONSTRAINT chk_perishable_has_shelf_life
CHECK (
  (is_perishable = false) OR
  (is_perishable = true AND shelf_life_days IS NOT NULL AND expiry_policy != 'none')
);

COMMIT;

-- Rollback
-- ALTER TABLE products DROP COLUMN std_price;
-- ALTER TABLE products DROP COLUMN expiry_policy;
-- ALTER TABLE products DROP CONSTRAINT chk_perishable_has_shelf_life;
