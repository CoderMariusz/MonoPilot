-- Migration: Extend products table for Story 02.16
-- Features: Add category_id, barcode_url for advanced product features

-- Add category_id to products table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id UUID REFERENCES product_categories(id);
  END IF;
END $$;

-- Add barcode_url to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'barcode_url'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode_url TEXT;
  END IF;
END $$;

-- Add barcode_format to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'barcode_format'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode_format TEXT CHECK (barcode_format IN ('code128', 'ean13'));
  END IF;
END $$;

-- Create index on category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Update RLS policy to include category_id checks if needed
-- The existing RLS policies on products already handle org_id isolation

-- Create view for products with category and tag info
CREATE OR REPLACE VIEW product_details AS
SELECT 
  p.*,
  pc.name as category_name,
  pc.level as category_level,
  jsonb_agg(
    DISTINCT jsonb_build_object(
      'id', pt.id,
      'name', pt.name,
      'color', pt.color
    )
  ) FILTER (WHERE pt.id IS NOT NULL) as tags
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_tag_assignments pta ON p.id = pta.product_id
LEFT JOIN product_tags pt ON pta.tag_id = pt.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, pc.name, pc.level;

-- Grant select on view
GRANT SELECT ON product_details TO authenticated;
GRANT SELECT ON product_details TO service_role;