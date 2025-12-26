-- Migration: Fix product_version_history RLS recursion (ADR-013 compliance)
-- Story: 02.2 Product Versioning + History - CRITICAL FIX
-- Issue: CRIT-2 from code review - RLS recursion pattern violation
-- Description: Add org_id column, update triggers, fix RLS policies to match ADR-013

-- =============================================================================
-- ADD org_id COLUMN
-- =============================================================================

-- Add org_id column (nullable first to allow backfilling)
ALTER TABLE product_version_history
  ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Backfill org_id from products table for existing records
UPDATE product_version_history pvh
SET org_id = p.org_id
FROM products p
WHERE pvh.product_id = p.id
  AND pvh.org_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE product_version_history
  ALTER COLUMN org_id SET NOT NULL;

-- Create index for org_id lookups (performance)
CREATE INDEX IF NOT EXISTS idx_product_version_history_org_id
  ON product_version_history(org_id);

-- =============================================================================
-- UPDATE EXISTING RLS POLICIES (ADR-013 pattern)
-- =============================================================================

-- Drop old recursive RLS policies
DROP POLICY IF EXISTS product_version_history_select ON product_version_history;
DROP POLICY IF EXISTS product_version_history_insert ON product_version_history;
DROP POLICY IF EXISTS product_version_history_no_update ON product_version_history;
DROP POLICY IF EXISTS product_version_history_no_delete ON product_version_history;

-- SELECT policy: Direct org_id lookup (ADR-013 compliant)
CREATE POLICY product_version_history_select ON product_version_history
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy: Direct org_id lookup (ADR-013 compliant)
CREATE POLICY product_version_history_insert ON product_version_history
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- UPDATE policy: History records are immutable - no updates allowed
CREATE POLICY product_version_history_no_update ON product_version_history
  FOR UPDATE
  USING (false);

-- DELETE policy: History records are immutable - no deletes allowed
CREATE POLICY product_version_history_no_delete ON product_version_history
  FOR DELETE
  USING (false);

-- =============================================================================
-- UPDATE TRIGGER FUNCTIONS TO POPULATE org_id
-- =============================================================================

-- Fix CRIT-1: Replace dynamic SQL with static field comparisons
-- Fix CRIT-2: Populate org_id column from NEW.org_id
CREATE OR REPLACE FUNCTION fn_product_version_increment()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields JSONB := '{}';
BEGIN
  -- Build changed_fields JSONB using static field comparisons (no dynamic SQL)
  -- Check each of 17 trackable fields explicitly for security

  IF OLD.name IS DISTINCT FROM NEW.name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'name', jsonb_build_object('old', to_jsonb(OLD.name), 'new', to_jsonb(NEW.name))
    );
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'description', jsonb_build_object('old', to_jsonb(OLD.description), 'new', to_jsonb(NEW.description))
    );
  END IF;

  IF OLD.base_uom IS DISTINCT FROM NEW.base_uom THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'base_uom', jsonb_build_object('old', to_jsonb(OLD.base_uom), 'new', to_jsonb(NEW.base_uom))
    );
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'status', jsonb_build_object('old', to_jsonb(OLD.status), 'new', to_jsonb(NEW.status))
    );
  END IF;

  IF OLD.barcode IS DISTINCT FROM NEW.barcode THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'barcode', jsonb_build_object('old', to_jsonb(OLD.barcode), 'new', to_jsonb(NEW.barcode))
    );
  END IF;

  IF OLD.gtin IS DISTINCT FROM NEW.gtin THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'gtin', jsonb_build_object('old', to_jsonb(OLD.gtin), 'new', to_jsonb(NEW.gtin))
    );
  END IF;

  IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'category_id', jsonb_build_object('old', to_jsonb(OLD.category_id), 'new', to_jsonb(NEW.category_id))
    );
  END IF;

  IF OLD.supplier_id IS DISTINCT FROM NEW.supplier_id THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'supplier_id', jsonb_build_object('old', to_jsonb(OLD.supplier_id), 'new', to_jsonb(NEW.supplier_id))
    );
  END IF;

  IF OLD.lead_time_days IS DISTINCT FROM NEW.lead_time_days THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'lead_time_days', jsonb_build_object('old', to_jsonb(OLD.lead_time_days), 'new', to_jsonb(NEW.lead_time_days))
    );
  END IF;

  IF OLD.moq IS DISTINCT FROM NEW.moq THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'moq', jsonb_build_object('old', to_jsonb(OLD.moq), 'new', to_jsonb(NEW.moq))
    );
  END IF;

  IF OLD.expiry_policy IS DISTINCT FROM NEW.expiry_policy THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'expiry_policy', jsonb_build_object('old', to_jsonb(OLD.expiry_policy), 'new', to_jsonb(NEW.expiry_policy))
    );
  END IF;

  IF OLD.shelf_life_days IS DISTINCT FROM NEW.shelf_life_days THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'shelf_life_days', jsonb_build_object('old', to_jsonb(OLD.shelf_life_days), 'new', to_jsonb(NEW.shelf_life_days))
    );
  END IF;

  IF OLD.std_price IS DISTINCT FROM NEW.std_price THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'std_price', jsonb_build_object('old', to_jsonb(OLD.std_price), 'new', to_jsonb(NEW.std_price))
    );
  END IF;

  IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'cost_per_unit', jsonb_build_object('old', to_jsonb(OLD.cost_per_unit), 'new', to_jsonb(NEW.cost_per_unit))
    );
  END IF;

  IF OLD.min_stock IS DISTINCT FROM NEW.min_stock THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'min_stock', jsonb_build_object('old', to_jsonb(OLD.min_stock), 'new', to_jsonb(NEW.min_stock))
    );
  END IF;

  IF OLD.max_stock IS DISTINCT FROM NEW.max_stock THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'max_stock', jsonb_build_object('old', to_jsonb(OLD.max_stock), 'new', to_jsonb(NEW.max_stock))
    );
  END IF;

  IF OLD.storage_conditions IS DISTINCT FROM NEW.storage_conditions THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'storage_conditions', jsonb_build_object('old', to_jsonb(OLD.storage_conditions), 'new', to_jsonb(NEW.storage_conditions))
    );
  END IF;

  IF OLD.is_perishable IS DISTINCT FROM NEW.is_perishable THEN
    v_changed_fields := v_changed_fields || jsonb_build_object(
      'is_perishable', jsonb_build_object('old', to_jsonb(OLD.is_perishable), 'new', to_jsonb(NEW.is_perishable))
    );
  END IF;

  -- If no fields actually changed, skip version increment
  IF v_changed_fields = '{}' THEN
    RETURN NEW;
  END IF;

  -- Increment version
  NEW.version := OLD.version + 1;
  NEW.updated_at := NOW();

  -- Insert history record with org_id (ADR-013 compliant)
  INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at, org_id)
  VALUES (NEW.id, NEW.version, v_changed_fields, NEW.updated_by, NOW(), NEW.org_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update initial version trigger to populate org_id
CREATE OR REPLACE FUNCTION fn_product_initial_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial version history record with org_id
  INSERT INTO product_version_history (product_id, version, changed_fields, changed_by, changed_at, org_id)
  VALUES (
    NEW.id,
    1,
    jsonb_build_object('_initial', true),
    NEW.created_by,
    NEW.created_at,
    NEW.org_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ADD MISSING COMPOSITE INDEX (MAJ-4)
-- =============================================================================

-- Composite index for date range queries with product_id
-- Supports query pattern: .eq('product_id', id).gte('changed_at', from).lte('changed_at', to)
CREATE INDEX IF NOT EXISTS idx_product_version_history_product_date
  ON product_version_history(product_id, changed_at DESC);

-- =============================================================================
-- TABLE COMMENTS
-- =============================================================================

COMMENT ON COLUMN product_version_history.org_id IS 'Organization ID for direct RLS isolation (ADR-013 pattern)';
