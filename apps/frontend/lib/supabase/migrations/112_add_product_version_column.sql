-- Migration: Add product_version column to products table
-- Purpose: Track version of product definition (separate from BOM version)

ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_version VARCHAR(20) DEFAULT '1.0';

-- Add comment
COMMENT ON COLUMN products.product_version IS 'Version of product definition (e.g., 1.0, 1.1, 2.0). Separate from BOM version.';

-- Create index for potential filtering
CREATE INDEX IF NOT EXISTS idx_products_product_version ON products(product_version);
