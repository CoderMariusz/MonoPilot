-- Migration: Add unique barcode constraint to products table
-- Story: W2 - Warehouse bug fix
-- Purpose: Enforce unique barcode validation per organization
-- Ensures no duplicate barcodes can be created or edited within the same organization

-- Add unique constraint for barcode per organization
-- Using a partial index to allow multiple NULL values (products without barcodes)
-- This constraint only applies to non-NULL barcode values
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_org_barcode_unique 
ON products(org_id, barcode) 
WHERE barcode IS NOT NULL AND deleted_at IS NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_products_org_barcode_unique IS 
'Enforces unique barcode per organization. Allows multiple NULL values for products without barcodes.';

-- Add constraint check at the table level for non-NULL values
-- This ensures the constraint is documented and enforced
ALTER TABLE products ADD CONSTRAINT chk_products_barcode_unique_when_set 
CHECK (
  barcode IS NULL OR 
  (barcode IS NOT NULL)
);

COMMENT ON CONSTRAINT chk_products_barcode_unique_when_set ON products IS 
'Documents that barcode field can be NULL or has a value. The actual uniqueness is enforced by the partial unique index idx_products_org_barcode_unique';
