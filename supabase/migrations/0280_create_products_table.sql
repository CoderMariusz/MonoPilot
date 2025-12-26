-- Migration: Create products table
-- Story: 02.1 - Products CRUD + Types
-- Purpose: Main product table with full traceability, ADR-010 procurement fields, FR-2.13/2.15 costing
-- RLS: Per-organization isolation using ADR-013 pattern

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  -- Core fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  product_type_id UUID NOT NULL REFERENCES product_types(id),
  base_uom VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  version INTEGER DEFAULT 1,

  -- Identification
  barcode VARCHAR(100),
  gtin VARCHAR(14),
  category_id UUID,
  supplier_id UUID,

  -- Procurement (ADR-010)
  lead_time_days INTEGER DEFAULT 7,
  moq DECIMAL(10,2),

  -- Costing (FR-2.13, FR-2.15)
  std_price DECIMAL(15,4),
  cost_per_unit DECIMAL(15,4),

  -- Stock Control
  min_stock DECIMAL(15,4),
  max_stock DECIMAL(15,4),

  -- Shelf Life (FR-2.14)
  expiry_policy VARCHAR(20) DEFAULT 'none',
  shelf_life_days INTEGER,
  storage_conditions VARCHAR(500),
  is_perishable BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT uq_products_org_code UNIQUE(org_id, code),
  CONSTRAINT chk_products_status CHECK (status IN ('active', 'inactive', 'discontinued')),
  CONSTRAINT chk_products_expiry_policy CHECK (expiry_policy IN ('fixed', 'rolling', 'none')),
  CONSTRAINT chk_products_lead_time CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  CONSTRAINT chk_products_moq CHECK (moq IS NULL OR moq > 0),
  CONSTRAINT chk_products_min_stock CHECK (min_stock IS NULL OR min_stock >= 0),
  CONSTRAINT chk_products_max_stock CHECK (max_stock IS NULL OR max_stock >= 0),
  CONSTRAINT chk_products_std_price CHECK (std_price IS NULL OR std_price >= 0),
  CONSTRAINT chk_products_cost_per_unit CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0),
  CONSTRAINT chk_products_version CHECK (version >= 1)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_org_code ON products(org_id, code);
CREATE INDEX IF NOT EXISTS idx_products_org_type ON products(org_id, product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_org_status ON products(org_id, status);
CREATE INDEX IF NOT EXISTS idx_products_org_name ON products(org_id, name);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Read access (exclude soft-deleted)
CREATE POLICY products_org_isolation
  ON products
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- RLS Policy: Insert
CREATE POLICY products_write
  ON products
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- RLS Policy: Update
CREATE POLICY products_update
  ON products
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- RLS Policy: Delete (soft delete only)
CREATE POLICY products_delete
  ON products
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      SELECT r.code
      FROM roles r
      JOIN users u ON u.role_id = r.id
      WHERE u.id = auth.uid()
    ) IN ('SUPER_ADMIN', 'ADMIN')
  );

-- Trigger: Auto-update updated_at
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL) -- Don't update timestamp on soft delete
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-increment version on update
CREATE OR REPLACE FUNCTION increment_product_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version if actual data changed (not just updated_at)
  IF (
    NEW.name IS DISTINCT FROM OLD.name OR
    NEW.description IS DISTINCT FROM OLD.description OR
    NEW.base_uom IS DISTINCT FROM OLD.base_uom OR
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.barcode IS DISTINCT FROM OLD.barcode OR
    NEW.gtin IS DISTINCT FROM OLD.gtin OR
    NEW.lead_time_days IS DISTINCT FROM OLD.lead_time_days OR
    NEW.moq IS DISTINCT FROM OLD.moq OR
    NEW.std_price IS DISTINCT FROM OLD.std_price OR
    NEW.cost_per_unit IS DISTINCT FROM OLD.cost_per_unit OR
    NEW.min_stock IS DISTINCT FROM OLD.min_stock OR
    NEW.max_stock IS DISTINCT FROM OLD.max_stock OR
    NEW.expiry_policy IS DISTINCT FROM OLD.expiry_policy OR
    NEW.shelf_life_days IS DISTINCT FROM OLD.shelf_life_days OR
    NEW.storage_conditions IS DISTINCT FROM OLD.storage_conditions
  ) THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_increment_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL) -- Don't increment on soft delete
  EXECUTE FUNCTION increment_product_version();

-- Trigger: Warn if RM/PKG has no cost_per_unit (FR-2.15)
CREATE OR REPLACE FUNCTION warn_missing_cost_per_unit()
RETURNS TRIGGER AS $$
DECLARE
  v_product_type_code VARCHAR(10);
BEGIN
  -- Get product type code
  SELECT code INTO v_product_type_code
  FROM product_types
  WHERE id = NEW.product_type_id;

  -- Warn if RM or PKG without cost_per_unit
  IF v_product_type_code IN ('RM', 'PKG') AND NEW.cost_per_unit IS NULL THEN
    RAISE WARNING 'Product % (type: %) has no cost_per_unit defined. BOM cost calculations will be incomplete.',
      NEW.code,
      v_product_type_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_warn_missing_cost_per_unit
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION warn_missing_cost_per_unit();

-- Comment
COMMENT ON TABLE products IS 'Main product table with full traceability, procurement fields (ADR-010), and costing (FR-2.13/2.15)';
COMMENT ON COLUMN products.code IS 'SKU - immutable after creation';
COMMENT ON COLUMN products.product_type_id IS 'Product type - immutable after creation';
COMMENT ON COLUMN products.version IS 'Auto-incremented on data update, used for version history tracking';
COMMENT ON COLUMN products.lead_time_days IS 'Product-level lead time (ADR-010), defaults to 7 days';
COMMENT ON COLUMN products.moq IS 'Minimum order quantity (ADR-010), must be > 0 if set';
COMMENT ON COLUMN products.std_price IS 'Standard price for costing baseline (FR-2.13), max 4 decimals';
COMMENT ON COLUMN products.cost_per_unit IS 'Unit cost (FR-2.15), warning shown if missing for RM/PKG types';
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp, NULL = active record';
