-- Migration 055: Product Version & UoM Constraints
-- Adds product_version field to products table
-- Enforces UoM enum constraints across bom_items, license_plates, wo_materials
-- Removes tax_code from boms table
-- Adds snapshot and trace indexes

-- ==========================================
-- 1. Add product_version to products
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'product_version'
  ) THEN
    ALTER TABLE products 
      ADD COLUMN product_version VARCHAR(10) DEFAULT '1.0';
  END IF;
END $$;

COMMENT ON COLUMN products.product_version IS 'Product version in X.Y format. Minor bump for metadata changes, major bump manual';

-- ==========================================
-- 2. UoM Constraints - Enforce enum
-- ==========================================

-- BOM Items UoM constraint
ALTER TABLE bom_items 
  DROP CONSTRAINT IF EXISTS bom_items_uom_check;

ALTER TABLE bom_items 
  ADD CONSTRAINT bom_items_uom_check 
    CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER'));

-- License Plates UoM constraint
ALTER TABLE license_plates 
  DROP CONSTRAINT IF EXISTS license_plates_uom_check;

ALTER TABLE license_plates 
  ADD CONSTRAINT license_plates_uom_check 
    CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER'));

-- WO Materials UoM constraint
ALTER TABLE wo_materials
  DROP CONSTRAINT IF EXISTS wo_materials_uom_check;

ALTER TABLE wo_materials
  ADD CONSTRAINT wo_materials_uom_check 
    CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER'));

COMMENT ON CONSTRAINT bom_items_uom_check ON bom_items IS 'UoM must be one of: KG, EACH, METER, LITER';
COMMENT ON CONSTRAINT license_plates_uom_check ON license_plates IS 'UoM must be one of: KG, EACH, METER, LITER';
COMMENT ON CONSTRAINT wo_materials_uom_check ON wo_materials IS 'UoM must be one of: KG, EACH, METER, LITER';

-- ==========================================
-- 3. Remove tax_code from BOMs (moved to supplier/PO level)
-- ==========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'boms' AND column_name = 'tax_code'
  ) THEN
    ALTER TABLE boms DROP COLUMN tax_code;
  END IF;
END $$;

-- ==========================================
-- 4. Snapshot and Trace Indexes
-- ==========================================

-- WO materials composite indexes for snapshot queries
CREATE INDEX IF NOT EXISTS idx_wo_materials_wo_material ON wo_materials(wo_id, material_id);
CREATE INDEX IF NOT EXISTS idx_wo_materials_snapshot ON wo_materials(wo_id, created_at);

-- BOM version lookup
CREATE INDEX IF NOT EXISTS idx_boms_product_version ON boms(product_id, version);

-- BOM items line filtering (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_bom_items_line ON bom_items USING GIN(line_id);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_bom_items_material ON bom_items(material_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_sequence ON bom_items(bom_id, sequence);

COMMENT ON INDEX idx_wo_materials_wo_material IS 'Composite index for WO material lookups';
COMMENT ON INDEX idx_wo_materials_snapshot IS 'Index for snapshot timestamp queries';
COMMENT ON INDEX idx_boms_product_version IS 'Index for BOM version lookups';
COMMENT ON INDEX idx_bom_items_line IS 'GIN index for line_id array queries';

-- ==========================================
-- 5. Update existing data with default UoM where needed
-- ==========================================

-- Set default UoM for any existing records with invalid values
UPDATE bom_items 
SET uom = 'KG' 
WHERE uom NOT IN ('KG', 'EACH', 'METER', 'LITER') OR uom IS NULL;

UPDATE license_plates 
SET uom = 'KG' 
WHERE uom NOT IN ('KG', 'EACH', 'METER', 'LITER') OR uom IS NULL;

UPDATE wo_materials 
SET uom = 'KG' 
WHERE uom NOT IN ('KG', 'EACH', 'METER', 'LITER') OR uom IS NULL;

-- ==========================================
-- 6. Update products with default version
-- ==========================================
UPDATE products 
SET product_version = '1.0' 
WHERE product_version IS NULL OR product_version = '';

