-- Phase 7: Supplier Products Junction Migration
-- This migration creates supplier_products table for per-supplier product pricing

-- Supplier-specific product details
CREATE TABLE supplier_products (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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

-- Add foreign key constraint for tax_code_id in supplier_products
ALTER TABLE supplier_products 
  ADD CONSTRAINT fk_supplier_products_tax_code 
  FOREIGN KEY (tax_code_id) REFERENCES settings_tax_codes(id);

-- Sample supplier products data (linking existing suppliers with products)
-- This will be populated based on existing data in the system
INSERT INTO supplier_products (supplier_id, product_id, supplier_sku, lead_time_days, moq, price_excl_tax, tax_code_id, currency, is_active)
SELECT 
  s.id as supplier_id,
  p.id as product_id,
  CONCAT('SUP-', s.id, '-', p.id) as supplier_sku,
  CASE 
    WHEN p.group = 'MEAT' THEN 7
    WHEN p.group = 'DRYGOODS' THEN 14
    ELSE 10
  END as lead_time_days,
  CASE 
    WHEN p.group = 'MEAT' THEN 50.0
    WHEN p.group = 'DRYGOODS' THEN 100.0
    ELSE 25.0
  END as moq,
  COALESCE(p.std_price, 0) * (1 + RANDOM() * 0.2) as price_excl_tax, -- Add some variation
  (SELECT id FROM settings_tax_codes WHERE code = 'STD' LIMIT 1) as tax_code_id,
  'USD' as currency,
  true as is_active
FROM suppliers s
CROSS JOIN products p
WHERE s.is_active = true 
  AND p.is_active = true
  AND p.group IN ('MEAT', 'DRYGOODS') -- Only for raw materials
LIMIT 20; -- Limit to avoid too many records
