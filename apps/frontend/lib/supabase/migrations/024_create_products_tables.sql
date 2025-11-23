-- Migration 024: Create Products Tables
-- Epic 2 - Batch 2A: Products + Settings
-- Stories: 2.1, 2.2, 2.3, 2.4, 2.5, 2.22
-- Date: 2025-01-23

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Product type enum
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: products
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business fields
  code TEXT NOT NULL,                    -- Immutable after creation
  name TEXT NOT NULL,
  type product_type NOT NULL,
  description TEXT,
  category TEXT,
  uom TEXT NOT NULL,                     -- Unit of measure
  version NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active',

  -- Optional fields (visibility controlled by settings)
  shelf_life_days INTEGER,
  min_stock_qty NUMERIC(10,2),
  max_stock_qty NUMERIC(10,2),
  reorder_point NUMERIC(10,2),
  cost_per_unit NUMERIC(10,2),

  -- Multi-tenancy
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE (org_id, code),
  CHECK (version >= 1.0),
  CHECK (shelf_life_days IS NULL OR shelf_life_days > 0),
  CHECK (status IN ('active', 'inactive', 'obsolete'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_org_code ON products(org_id, code);
CREATE INDEX IF NOT EXISTS idx_products_org_type ON products(org_id, type);
CREATE INDEX IF NOT EXISTS idx_products_org_status ON products(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(org_id, category) WHERE category IS NOT NULL;

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_org_isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT ON products TO anon;

-- Comments
COMMENT ON TABLE products IS 'Products master data with versioning (Story 2.1)';
COMMENT ON COLUMN products.code IS 'Immutable product code (unique per org)';
COMMENT ON COLUMN products.version IS 'Version number in X.Y format (auto-incremented on changes)';

-- ============================================================================
-- TABLE: product_version_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version NUMERIC(4,1) NOT NULL,
  changed_fields JSONB NOT NULL,         -- { field: { old: X, new: Y } }
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID NOT NULL REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_version_history_product ON product_version_history(product_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_version_history_org ON product_version_history(org_id, changed_at DESC);

-- RLS
ALTER TABLE product_version_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_version_history_org_isolation" ON product_version_history
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Grant permissions
GRANT ALL ON product_version_history TO service_role;
GRANT SELECT, INSERT ON product_version_history TO authenticated;
GRANT SELECT ON product_version_history TO anon;

COMMENT ON TABLE product_version_history IS 'Product version history tracking (Story 2.2, 2.3)';

-- ============================================================================
-- TABLE: product_allergens
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_allergens (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('contains', 'may_contain')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  PRIMARY KEY (product_id, allergen_id, relation_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX IF NOT EXISTS idx_product_allergens_allergen ON product_allergens(allergen_id);

-- RLS
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_allergens_org_isolation" ON product_allergens
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Grant permissions
GRANT ALL ON product_allergens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_allergens TO authenticated;
GRANT SELECT ON product_allergens TO anon;

COMMENT ON TABLE product_allergens IS 'Product allergen relationships (Story 2.4)';

-- ============================================================================
-- TABLE: product_type_config
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_type_config_org ON product_type_config(org_id) WHERE is_active = true;

-- RLS
ALTER TABLE product_type_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_type_config_org_isolation" ON product_type_config
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_product_type_config_timestamp
  BEFORE UPDATE ON product_type_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON product_type_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_type_config TO authenticated;
GRANT SELECT ON product_type_config TO anon;

COMMENT ON TABLE product_type_config IS 'Product type configuration (Story 2.5)';

-- ============================================================================
-- TABLE: technical_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS technical_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  product_field_config JSONB NOT NULL DEFAULT '{
    "shelf_life_days": {"visible": true, "mandatory": false},
    "min_stock_qty": {"visible": true, "mandatory": false},
    "max_stock_qty": {"visible": true, "mandatory": false},
    "reorder_point": {"visible": true, "mandatory": false},
    "cost_per_unit": {"visible": true, "mandatory": false},
    "category": {"visible": true, "mandatory": false}
  }'::jsonb,
  max_bom_versions INTEGER,
  use_conditional_flags BOOLEAN DEFAULT false,
  conditional_flags JSONB DEFAULT '["organic", "gluten_free", "vegan", "kosher", "halal", "dairy_free", "nut_free", "soy_free"]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- RLS
ALTER TABLE technical_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technical_settings_org_isolation" ON technical_settings
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_technical_settings_timestamp
  BEFORE UPDATE ON technical_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON technical_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON technical_settings TO authenticated;
GRANT SELECT ON technical_settings TO anon;

COMMENT ON TABLE technical_settings IS 'Technical module settings (Story 2.22)';

-- ============================================================================
-- FUNCTIONS: Version Increment
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_product_version(current_version NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  major_ver INTEGER;
  minor_ver INTEGER;
BEGIN
  major_ver := floor(current_version);
  minor_ver := round((current_version - major_ver) * 10);

  IF minor_ver >= 9 THEN
    RETURN (major_ver + 1.0);
  ELSE
    RETURN (major_ver + (minor_ver + 1) * 0.1);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION increment_product_version IS 'Increments product version (X.Y format): 1.0 → 1.1 → ... → 1.9 → 2.0';

-- ============================================================================
-- TRIGGER: Track Product Version
-- ============================================================================

CREATE OR REPLACE FUNCTION track_product_version()
RETURNS TRIGGER AS $$
DECLARE
  changed JSONB := '{}';
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Skip if soft delete
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Track changed fields
  FOREACH field IN ARRAY ARRAY[
    'code', 'name', 'type', 'description', 'category', 'uom',
    'shelf_life_days', 'min_stock_qty', 'max_stock_qty',
    'reorder_point', 'cost_per_unit', 'status'
  ]
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field, field)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      changed := changed || jsonb_build_object(
        field,
        jsonb_build_object('old', old_val, 'new', new_val)
      );
    END IF;
  END LOOP;

  -- If any fields changed, increment version and log
  IF changed <> '{}' THEN
    NEW.version := increment_product_version(OLD.version);

    INSERT INTO product_version_history (
      product_id, version, changed_fields, changed_by, org_id
    ) VALUES (
      NEW.id, NEW.version, changed, NEW.updated_by, NEW.org_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_product_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION track_product_version();

COMMENT ON FUNCTION track_product_version IS 'Automatically tracks product changes and increments version (Story 2.2)';
