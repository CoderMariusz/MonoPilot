-- Migration 034: Fix Duplicate Product Policies
-- This migration fixes the issue where product policies could be created multiple times
-- if migrations were run more than once. Uses DROP POLICY IF EXISTS pattern.
-- Date: 2025-11-25

-- ============================================================================
-- TABLE: products - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "products_org_isolation" ON products;

CREATE POLICY "products_org_isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- TABLE: product_version_history - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "product_version_history_org_isolation" ON product_version_history;

CREATE POLICY "product_version_history_org_isolation" ON product_version_history
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- TABLE: product_allergens - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "product_allergens_org_isolation" ON product_allergens;

CREATE POLICY "product_allergens_org_isolation" ON product_allergens
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- TABLE: product_type_config - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "product_type_config_org_isolation" ON product_type_config;

CREATE POLICY "product_type_config_org_isolation" ON product_type_config
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- TABLE: technical_settings - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "technical_settings_org_isolation" ON technical_settings;

CREATE POLICY "technical_settings_org_isolation" ON technical_settings
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- TABLE: supplier_products - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "supplier_products_isolation" ON supplier_products;

CREATE POLICY "supplier_products_isolation" ON supplier_products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- TABLE: bom_items - RLS Policies (with duplicate prevention)
-- Note: bom_items inherits org_id from parent boms table via bom_id FK
-- ============================================================================

DROP POLICY IF EXISTS "bom_items_isolation" ON bom_items;

CREATE POLICY "bom_items_isolation" ON bom_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boms
      WHERE boms.id = bom_items.bom_id
      AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- TABLE: purchase_orders - RLS Policies (with duplicate prevention)
-- ============================================================================

DROP POLICY IF EXISTS "purchase_orders_isolation" ON purchase_orders;

CREATE POLICY "purchase_orders_isolation" ON purchase_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Note: These policies may not exist if the tables haven't been created yet,
-- but DROP POLICY IF EXISTS will safely handle this scenario
