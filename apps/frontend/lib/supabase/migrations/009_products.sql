-- Migration 009: Products Table
-- Purpose: Product master data (materials, semi-finished, finished goods)
-- Date: 2025-01-11
-- Dependencies: 000_enums, 001_users, 002_suppliers, 005_settings_tax_codes

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('RM', 'DG', 'PR', 'FG', 'WIP')),
  subtype VARCHAR(100),
  uom VARCHAR(20) NOT NULL,
  expiry_policy VARCHAR(50) CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  shelf_life_days INTEGER,
  production_lines TEXT[],
  is_active BOOLEAN DEFAULT true,
  
  -- App taxonomy (using ENUMs)
  product_group product_group NOT NULL DEFAULT 'COMPOSITE',
  product_type product_type NOT NULL DEFAULT 'FG',
  
  -- Planning & commercial
  supplier_id INTEGER REFERENCES suppliers(id),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  std_price NUMERIC(12,4),
  
  -- Routing
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,
  
  -- Metadata
  notes TEXT,
  allergen_ids INTEGER[],
  
  -- Packaging
  boxes_per_pallet INTEGER,
  packs_per_box INTEGER,
  
  -- Versioning
  product_version VARCHAR(20) DEFAULT '1.0',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_products_part_number ON products(part_number);
CREATE INDEX idx_products_product_group ON products(product_group);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_tax_code ON products(tax_code_id);

-- Comments
COMMENT ON TABLE products IS 'Product master data including raw materials, dry goods, semi-finished, and finished goods';
COMMENT ON COLUMN products.type IS 'Product type: RM (raw material), DG (dry goods), PR (process), FG (finished good), WIP (work in progress)';
COMMENT ON COLUMN products.product_group IS 'High-level grouping: MEAT, DRYGOODS, COMPOSITE';
COMMENT ON COLUMN products.product_type IS 'Detailed app taxonomy classification';
COMMENT ON COLUMN products.boxes_per_pallet IS 'Number of boxes that fit on one pallet';
COMMENT ON COLUMN products.packs_per_box IS 'Number of packs (units) that fit in one box';
COMMENT ON COLUMN products.product_version IS 'Product version in X.Y format. Minor bump for metadata changes, major bump manual';

