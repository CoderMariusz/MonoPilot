-- Migration 090: Products & BOMs Schema Alignment
-- Story: 0-19-products-boms-database-api-alignment
-- Adds missing columns to products, boms, and bom_items tables

-- =============================================
-- PRODUCTS TABLE EXPANSION
-- =============================================

ALTER TABLE products
  -- Taxonomy fields
  ADD COLUMN IF NOT EXISTS type VARCHAR(10)
    CHECK (type IN ('RM', 'DG', 'PR', 'FG', 'WIP')),
  ADD COLUMN IF NOT EXISTS subtype VARCHAR(100),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),

  -- Planning & commercial
  ADD COLUMN IF NOT EXISTS moq DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS tax_code_id BIGINT REFERENCES tax_codes(id),
  ADD COLUMN IF NOT EXISTS std_price DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS expiry_policy VARCHAR(50)
    CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  ADD COLUMN IF NOT EXISTS rate DECIMAL(12,4),

  -- Production
  ADD COLUMN IF NOT EXISTS production_lines TEXT[],
  ADD COLUMN IF NOT EXISTS default_routing_id BIGINT REFERENCES routings(id),
  ADD COLUMN IF NOT EXISTS requires_routing BOOLEAN DEFAULT false,

  -- Packaging
  ADD COLUMN IF NOT EXISTS boxes_per_pallet INTEGER,
  ADD COLUMN IF NOT EXISTS packs_per_box INTEGER,

  -- Versioning
  ADD COLUMN IF NOT EXISTS product_version VARCHAR(20) DEFAULT '1.0',

  -- Audit
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_default_routing ON products(default_routing_id);

-- Backfill type from product_type enum
UPDATE products
SET type = CASE
  WHEN product_type::text ILIKE '%raw%' THEN 'RM'
  WHEN product_type::text ILIKE '%finish%' THEN 'FG'
  WHEN product_type::text ILIKE '%wip%' THEN 'WIP'
  ELSE 'FG'
END
WHERE type IS NULL;

-- Note: DB uses 'sku' not 'part_number'
-- Types must use 'sku' field name

-- =============================================
-- BOMS TABLE EXPANSION
-- =============================================

ALTER TABLE boms
  -- Additional fields for full feature support
  ADD COLUMN IF NOT EXISTS requires_routing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_routing_id BIGINT REFERENCES routings(id),
  ADD COLUMN IF NOT EXISTS line_id BIGINT[],
  ADD COLUMN IF NOT EXISTS boxes_per_pallet INTEGER,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boms_default_routing ON boms(default_routing_id);

-- Note: DB uses 'version INTEGER' not 'version VARCHAR'
-- Types must use number, not string for version

-- =============================================
-- BOM_ITEMS TABLE EXPANSION
-- =============================================

ALTER TABLE bom_items
  -- Flags
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT false,

  -- Planning
  ADD COLUMN IF NOT EXISTS priority INTEGER,
  ADD COLUMN IF NOT EXISTS production_lines TEXT[],
  ADD COLUMN IF NOT EXISTS production_line_restrictions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tax_code_id BIGINT REFERENCES tax_codes(id),
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER,
  ADD COLUMN IF NOT EXISTS moq DECIMAL(12,4),

  -- Costing
  ADD COLUMN IF NOT EXISTS unit_cost_std DECIMAL(12,4);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bom_items_is_phantom ON bom_items(is_phantom);
CREATE INDEX IF NOT EXISTS idx_bom_items_priority ON bom_items(priority);

-- Note: DB uses 'scrap_percent' not 'scrap_std_pct'
-- Types must use 'scrap_percent'
