-- Migration 038: Add Foreign Key Constraints
-- Purpose: Add foreign keys that couldn't be added earlier due to circular dependencies
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- Products -> Routings (circular with routings -> products)
ALTER TABLE products ADD CONSTRAINT fk_products_default_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

-- BOMs -> Routings
ALTER TABLE boms ADD CONSTRAINT fk_boms_default_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

-- TO Line -> License Plates (license_plates created after to_line)
ALTER TABLE to_line ADD CONSTRAINT fk_to_line_lp 
  FOREIGN KEY (lp_id) REFERENCES license_plates(id);

-- Comments
COMMENT ON CONSTRAINT fk_products_default_routing ON products IS 'Default routing for this product';
COMMENT ON CONSTRAINT fk_boms_default_routing ON boms IS 'Default routing for this BOM';
COMMENT ON CONSTRAINT fk_to_line_lp ON to_line IS 'License plate used in transfer';

