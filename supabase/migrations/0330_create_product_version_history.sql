-- Migration: Create product_version_history table
-- Story: 02.2 Product Versioning + History
-- PRD: FR-2.2, FR-2.3
-- Description: Audit log for product changes with automatic version tracking

-- =============================================================================
-- CREATE TABLE: product_version_history
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '{}',
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_product_version_history UNIQUE (product_id, version),
  CONSTRAINT chk_version_positive CHECK (version >= 1)
);

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

-- Fast lookup by product with descending version order (most recent first)
CREATE INDEX IF NOT EXISTS idx_product_version_history_product_id
  ON product_version_history(product_id, version DESC);

-- Support date range filters
CREATE INDEX IF NOT EXISTS idx_product_version_history_changed_at
  ON product_version_history(product_id, changed_at DESC);

-- Find all changes by a specific user
CREATE INDEX IF NOT EXISTS idx_product_version_history_changed_by
  ON product_version_history(changed_by);

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE product_version_history ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (ADR-013 pattern: product lookup for org isolation)
-- =============================================================================

-- SELECT policy: Users can read version history for products in their org
CREATE POLICY product_version_history_select ON product_version_history
  FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT policy: Users can create history records for products in their org
CREATE POLICY product_version_history_insert ON product_version_history
  FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- UPDATE policy: History records are immutable - no updates allowed
CREATE POLICY product_version_history_no_update ON product_version_history
  FOR UPDATE
  USING (false);

-- DELETE policy: History records are immutable - no deletes allowed
CREATE POLICY product_version_history_no_delete ON product_version_history
  FOR DELETE
  USING (false);

-- =============================================================================
-- DATABASE TRIGGERS
-- =============================================================================

-- Trigger function: Auto-increment product version on field changes
-- Detects changed fields, increments version, creates history record
CREATE OR REPLACE FUNCTION fn_product_version_increment()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields JSONB := '{}';
  v_field_name TEXT;
  v_old_value JSONB;
  v_new_value JSONB;
BEGIN
  -- Compare relevant fields and build changed_fields JSONB
  FOREACH v_field_name IN ARRAY ARRAY[
    'name', 'description', 'base_uom', 'status', 'barcode', 'gtin',
    'category_id', 'supplier_id', 'lead_time_days', 'moq', 'expiry_policy',
    'shelf_life_days', 'std_price', 'cost_per_unit', 'min_stock',
    'max_stock', 'storage_conditions', 'is_perishable'
  ]
  LOOP
    EXECUTE format('SELECT to_jsonb($1.%I), to_jsonb($2.%I)', v_field_name, v_field_name)
    INTO v_old_value, v_new_value
    USING OLD, NEW;

    IF v_old_value IS DISTINCT FROM v_new_value THEN
      v_changed_fields := v_changed_fields || jsonb_build_object(
        v_field_name,
        jsonb_build_object('old', v_old_value, 'new', v_new_value)
      );
    END IF;
  END LOOP;

  -- If no fields actually changed, skip version increment
  IF v_changed_fields = '{}' THEN
    RETURN NEW;
  END IF;

  -- Increment version
  NEW.version := OLD.version + 1;
  NEW.updated_at := NOW();

  -- Insert history record
  INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at)
  VALUES (NEW.id, NEW.version, v_changed_fields, NEW.updated_by, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to products table (BEFORE UPDATE)
DROP TRIGGER IF EXISTS trg_product_version_increment ON products;
CREATE TRIGGER trg_product_version_increment
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION fn_product_version_increment();

-- Trigger function: Create initial version history record on product creation
CREATE OR REPLACE FUNCTION fn_product_initial_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial version history record with _initial flag
  INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at)
  VALUES (
    NEW.id,
    1,
    jsonb_build_object('_initial', true),
    NEW.created_by,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to products table (AFTER INSERT)
DROP TRIGGER IF EXISTS trg_product_initial_version ON products;
CREATE TRIGGER trg_product_initial_version
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION fn_product_initial_version();

-- =============================================================================
-- TABLE COMMENT
-- =============================================================================

COMMENT ON TABLE product_version_history IS 'Audit log of product changes with version tracking (Story 02.2, FR-2.2, FR-2.3)';
COMMENT ON COLUMN product_version_history.changed_fields IS 'JSONB object: { field_name: { old: value, new: value } }';
COMMENT ON COLUMN product_version_history.version IS 'Version number, auto-incremented on product update';
