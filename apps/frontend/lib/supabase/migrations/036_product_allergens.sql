-- Migration 036: Product Allergens Table
-- Purpose: Junction table for product-allergen relationships
-- Date: 2025-01-11
-- Dependencies: 006_allergens, 009_products

CREATE TABLE product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  allergen_id INTEGER NOT NULL REFERENCES allergens(id),
  contains BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);

-- Indexes
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

-- Comments
COMMENT ON TABLE product_allergens IS 'Junction table linking products to allergens for food safety compliance';
COMMENT ON COLUMN product_allergens.contains IS 'True if product contains this allergen';

