-- Phase 6: Tax Codes & Allergens Migration
-- This migration adds tax codes table, enhances allergens, and creates product_allergens junction

-- Tax codes table
CREATE TABLE settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance allergens (already exists, add missing fields)
ALTER TABLE allergens 
  ADD COLUMN icon VARCHAR(50),
  ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Product allergens junction (many-to-many)
CREATE TABLE product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id INTEGER NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  contains BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);

CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

-- Add foreign key constraint for tax_code_id in products
ALTER TABLE products 
  ADD CONSTRAINT fk_products_tax_code 
  FOREIGN KEY (tax_code_id) REFERENCES settings_tax_codes(id);

-- Sample tax codes
INSERT INTO settings_tax_codes (code, name, rate, is_active) VALUES
  ('STD', 'Standard Rate', 0.20, true),
  ('RED', 'Reduced Rate', 0.05, true),
  ('ZERO', 'Zero Rate', 0.00, true),
  ('EXEMPT', 'Exempt', 0.00, true);

-- Sample allergens with icons (if not already populated)
INSERT INTO allergens (code, name, description, icon, is_active) VALUES
  ('GLUTEN', 'Gluten', 'Contains gluten', '🌾', true),
  ('DAIRY', 'Dairy', 'Contains dairy products', '🥛', true),
  ('NUTS', 'Nuts', 'Contains nuts', '🥜', true),
  ('EGGS', 'Eggs', 'Contains eggs', '🥚', true),
  ('SOY', 'Soy', 'Contains soy', '🫘', true),
  ('SHELLFISH', 'Shellfish', 'Contains shellfish', '🦐', true),
  ('FISH', 'Fish', 'Contains fish', '🐟', true),
  ('SESAME', 'Sesame', 'Contains sesame', '🌰', true)
ON CONFLICT (code) DO NOTHING;
