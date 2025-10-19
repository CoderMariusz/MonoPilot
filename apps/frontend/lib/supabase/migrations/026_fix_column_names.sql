-- Migration 026: Fix Column Names
-- This migration fixes the column name mismatch between 'group' and 'product_group'

-- Check if 'group' column exists and rename it to 'product_group'
DO $$
BEGIN
    -- Check if 'group' column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'group'
    ) THEN
        -- Rename 'group' to 'product_group'
        ALTER TABLE products RENAME COLUMN "group" TO product_group;
        RAISE NOTICE 'Renamed column "group" to "product_group"';
    ELSE
        RAISE NOTICE 'Column "group" does not exist, checking for "product_group"';
    END IF;
    
    -- Check if 'product_group' column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'product_group'
    ) THEN
        RAISE NOTICE 'Column "product_group" exists';
    ELSE
        RAISE NOTICE 'Column "product_group" does not exist';
    END IF;
END $$;

-- Ensure product_group column has the correct type
DO $$
BEGIN
    -- Check if product_group column exists and has correct type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'product_group'
        AND data_type = 'USER-DEFINED'
    ) THEN
        RAISE NOTICE 'product_group column exists with correct type';
    ELSE
        -- Add product_group column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'product_group'
        ) THEN
            ALTER TABLE products ADD COLUMN product_group product_group NOT NULL DEFAULT 'COMPOSITE';
            RAISE NOTICE 'Added product_group column';
        END IF;
    END IF;
END $$;

-- Create index on product_group if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_product_group ON products(product_group);

-- Update any products that might have wrong categories
UPDATE products 
SET product_group = 'MEAT', product_type = 'RM_MEAT' 
WHERE part_number LIKE 'RM-BEEF-%' OR part_number LIKE 'RM-PORK-%' OR part_number LIKE 'RM-LAMB-%' OR part_number LIKE 'RM-CHICKEN-%';

UPDATE products 
SET product_group = 'DRYGOODS', product_type = 'DG_ING' 
WHERE part_number LIKE 'DG-SALT-%' OR part_number LIKE 'DG-PEPPER-%' OR part_number LIKE 'DG-SPICE-%' OR part_number LIKE 'DG-ONION-%' OR part_number LIKE 'DG-GARLIC-%' OR part_number LIKE 'DG-PAPRIKA-%';

UPDATE products 
SET product_group = 'DRYGOODS', product_type = 'DG_LABEL' 
WHERE part_number LIKE 'DG-LABEL-%';

UPDATE products 
SET product_group = 'DRYGOODS', product_type = 'DG_WEB' 
WHERE part_number LIKE 'DG-WEB-%' OR part_number LIKE 'DG-CASING-%';

UPDATE products 
SET product_group = 'DRYGOODS', product_type = 'DG_BOX' 
WHERE part_number LIKE 'DG-BOX-%';

UPDATE products 
SET product_group = 'DRYGOODS', product_type = 'DG_SAUCE' 
WHERE part_number LIKE 'DG-SAUCE-%';

UPDATE products 
SET product_group = 'COMPOSITE', product_type = 'PR' 
WHERE part_number LIKE 'PR-%';

UPDATE products 
SET product_group = 'COMPOSITE', product_type = 'FG' 
WHERE part_number LIKE 'FG-%';
