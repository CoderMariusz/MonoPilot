-- Migration 026: Create supplier_products table for Story 3.17
-- Epic 3 Batch 3A: Purchase Orders & Suppliers
-- Many-to-many relationship between suppliers and products
-- Date: 2025-01-23

-- Create supplier_products table
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  supplier_product_code VARCHAR(100), -- Supplier's internal SKU
  unit_price NUMERIC(15,2), -- Override product default price
  lead_time_days INTEGER, -- Override supplier default lead time
  moq NUMERIC(15,3), -- Override supplier default MOQ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one assignment per supplier-product combination
  CONSTRAINT idx_supplier_products_unique UNIQUE (org_id, supplier_id, product_id),

  -- Check constraints
  CONSTRAINT unit_price_positive CHECK (unit_price IS NULL OR unit_price >= 0),
  CONSTRAINT lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  CONSTRAINT moq_positive CHECK (moq IS NULL OR moq > 0)
);

-- Partial unique index: only one default supplier per product
CREATE UNIQUE INDEX idx_supplier_products_default
  ON supplier_products(org_id, product_id)
  WHERE is_default = true;

-- Indexes
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_default_flag ON supplier_products(is_default);

-- RLS Policy
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_products_isolation ON supplier_products
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Comments
COMMENT ON TABLE supplier_products IS 'Supplier-product assignments with default supplier per product - Story 3.17';
COMMENT ON COLUMN supplier_products.is_default IS 'If true, this is the default supplier for this product (only one per product)';
COMMENT ON COLUMN supplier_products.supplier_product_code IS 'Supplier internal SKU/code for this product';
COMMENT ON COLUMN supplier_products.unit_price IS 'Override product default unit price';
COMMENT ON COLUMN supplier_products.lead_time_days IS 'Override supplier default lead time';
COMMENT ON COLUMN supplier_products.moq IS 'Override supplier default MOQ';
COMMENT ON INDEX idx_supplier_products_default IS 'Enforces only one default supplier per product within org';
