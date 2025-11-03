-- Migration 042: Junction Tables
-- Purpose: Recreate junction tables (supplier_products, product_allergens)
-- Date: 2025-01-21

-- =============================================
-- 1. SUPPLIER PRODUCTS TABLE
-- =============================================

CREATE TABLE supplier_products (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  supplier_sku VARCHAR(100),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  price_excl_tax NUMERIC(12,4),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_active ON supplier_products(is_active);
CREATE INDEX idx_supplier_products_tax_code ON supplier_products(tax_code_id);

-- =============================================
-- 2. PRODUCT ALLERGENS TABLE
-- =============================================

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

