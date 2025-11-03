-- Migration 048: Migrate preferred_supplier_id to supplier_id and remove supplier_products table
-- Purpose: Simplify product-supplier relationship by moving from junction table to direct foreign key
-- Date: 2025-01-22

-- Step 1: Add supplier_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_id INTEGER;
  END IF;
END $$;

-- Step 2: Copy data from preferred_supplier_id to supplier_id
UPDATE products
SET supplier_id = preferred_supplier_id
WHERE preferred_supplier_id IS NOT NULL;

-- Step 3: Drop foreign key constraint on preferred_supplier_id
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_preferred_supplier_id_fkey;

-- Step 4: Drop index on preferred_supplier_id
DROP INDEX IF EXISTS idx_products_preferred_supplier;

-- Step 5: Drop preferred_supplier_id column
ALTER TABLE products DROP COLUMN IF EXISTS preferred_supplier_id;

-- Step 6: Add foreign key constraint for supplier_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_supplier_id_fkey' AND table_name = 'products'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_supplier_id_fkey 
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
  END IF;
END $$;

-- Step 7: Create index on supplier_id
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Step 8: Drop supplier_products table and all its constraints
DROP TABLE IF EXISTS supplier_products CASCADE;

