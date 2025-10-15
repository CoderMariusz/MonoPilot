-- Phase 5: Product Taxonomy & Enums Migration
-- This migration adds new enums and migrates existing category field to group + type

-- Create new enums
CREATE TYPE product_group AS ENUM ('MEAT', 'DRYGOODS', 'COMPOSITE');
CREATE TYPE product_type AS ENUM ('RM_MEAT', 'PR', 'FG', 'DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE');

-- Add new columns to products
ALTER TABLE products 
  ADD COLUMN group product_group NOT NULL DEFAULT 'COMPOSITE',
  ADD COLUMN product_type product_type NOT NULL DEFAULT 'FG',
  ADD COLUMN preferred_supplier_id INTEGER REFERENCES suppliers(id),
  ADD COLUMN lead_time_days INTEGER,
  ADD COLUMN moq NUMERIC(12,4),
  ADD COLUMN tax_code_id INTEGER;

-- Migrate existing data from category → group/product_type
-- MEAT → group='MEAT', type='RM_MEAT'
UPDATE products 
SET group = 'MEAT', product_type = 'RM_MEAT' 
WHERE category = 'MEAT';

-- DRYGOODS → group='DRYGOODS', type (infer from subtype or default 'DG_ING')
UPDATE products 
SET group = 'DRYGOODS', product_type = 'DG_ING' 
WHERE category = 'DRYGOODS';

-- FINISHED_GOODS → group='COMPOSITE', type='FG'
UPDATE products 
SET group = 'COMPOSITE', product_type = 'FG' 
WHERE category = 'FINISHED_GOODS';

-- PROCESS → group='COMPOSITE', type='PR'
UPDATE products 
SET group = 'COMPOSITE', product_type = 'PR' 
WHERE category = 'PROCESS';

-- Add constraint: FG must be COMPOSITE
ALTER TABLE products 
  ADD CONSTRAINT check_fg_is_composite 
  CHECK (product_type != 'FG' OR group = 'COMPOSITE');

-- Add indexes for performance
CREATE INDEX idx_products_group ON products(group);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_preferred_supplier ON products(preferred_supplier_id);

-- Drop old category column after migration
ALTER TABLE products DROP COLUMN category;
