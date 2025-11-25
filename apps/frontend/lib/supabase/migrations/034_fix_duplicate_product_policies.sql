-- Migration 034: Fix Duplicate Product & Related Module Policies
-- This migration fixes the issue where RLS policies could be created multiple times
-- if migrations were run more than once. Uses DROP POLICY IF EXISTS pattern.
-- Covers all product-related tables from Migrations 020-033
-- Date: 2025-11-25

-- ============================================================================
-- PRODUCTS MODULE (Migration 024)
-- ============================================================================

-- TABLE: products
DROP POLICY IF EXISTS "products_org_isolation" ON products;
CREATE POLICY "products_org_isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: product_version_history
DROP POLICY IF EXISTS "product_version_history_org_isolation" ON product_version_history;
CREATE POLICY "product_version_history_org_isolation" ON product_version_history
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: product_allergens
DROP POLICY IF EXISTS "product_allergens_org_isolation" ON product_allergens;
CREATE POLICY "product_allergens_org_isolation" ON product_allergens
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: product_type_config
DROP POLICY IF EXISTS "product_type_config_org_isolation" ON product_type_config;
CREATE POLICY "product_type_config_org_isolation" ON product_type_config
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: technical_settings
DROP POLICY IF EXISTS "technical_settings_org_isolation" ON technical_settings;
CREATE POLICY "technical_settings_org_isolation" ON technical_settings
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- BOM MODULE (Migrations 023, 025)
-- ============================================================================

-- TABLE: boms
DROP POLICY IF EXISTS "boms_org_isolation" ON boms;
CREATE POLICY "boms_org_isolation" ON boms
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: bom_items (inherits org_id from parent boms table via bom_id FK)
DROP POLICY IF EXISTS "bom_items_org_isolation" ON bom_items;
CREATE POLICY "bom_items_org_isolation" ON bom_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boms
      WHERE boms.id = bom_items.bom_id
      AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- SUPPLIERS MODULE (Migrations 025, 026)
-- ============================================================================

-- TABLE: suppliers
DROP POLICY IF EXISTS "suppliers_isolation" ON suppliers;
CREATE POLICY "suppliers_isolation" ON suppliers
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: supplier_products
DROP POLICY IF EXISTS "supplier_products_isolation" ON supplier_products;
CREATE POLICY "supplier_products_isolation" ON supplier_products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- PURCHASE ORDERS MODULE (Migrations 027, 028, 029)
-- ============================================================================

-- TABLE: purchase_orders
DROP POLICY IF EXISTS "po_isolation" ON purchase_orders;
CREATE POLICY "po_isolation" ON purchase_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: po_lines
DROP POLICY IF EXISTS "po_lines_isolation" ON po_lines;
CREATE POLICY "po_lines_isolation" ON po_lines
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: po_approvals
DROP POLICY IF EXISTS "po_approvals_isolation" ON po_approvals;
CREATE POLICY "po_approvals_isolation" ON po_approvals
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: planning_settings
DROP POLICY IF EXISTS "planning_settings_isolation" ON planning_settings;
CREATE POLICY "planning_settings_isolation" ON planning_settings
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================================
-- ROUTING MODULE (Migrations 020, 021, 022)
-- ============================================================================

-- TABLE: routings (4 granular policies)
DROP POLICY IF EXISTS "routings_select_policy" ON routings;
CREATE POLICY "routings_select_policy" ON routings
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "routings_insert_policy" ON routings;
CREATE POLICY "routings_insert_policy" ON routings
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "routings_update_policy" ON routings;
CREATE POLICY "routings_update_policy" ON routings
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "routings_delete_policy" ON routings;
CREATE POLICY "routings_delete_policy" ON routings
  FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- TABLE: routing_operations (inherits org_id from parent routings via FK, 4 granular policies)
DROP POLICY IF EXISTS "routing_operations_select_policy" ON routing_operations;
CREATE POLICY "routing_operations_select_policy" ON routing_operations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "routing_operations_insert_policy" ON routing_operations;
CREATE POLICY "routing_operations_insert_policy" ON routing_operations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "routing_operations_update_policy" ON routing_operations;
CREATE POLICY "routing_operations_update_policy" ON routing_operations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "routing_operations_delete_policy" ON routing_operations;
CREATE POLICY "routing_operations_delete_policy" ON routing_operations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- TABLE: product_routings (inherits org_id from parent routings via FK, 4 granular policies)
DROP POLICY IF EXISTS "product_routings_select_policy" ON product_routings;
CREATE POLICY "product_routings_select_policy" ON product_routings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "product_routings_insert_policy" ON product_routings;
CREATE POLICY "product_routings_insert_policy" ON product_routings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "product_routings_update_policy" ON product_routings;
CREATE POLICY "product_routings_update_policy" ON product_routings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "product_routings_delete_policy" ON product_routings;
CREATE POLICY "product_routings_delete_policy" ON product_routings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- TRANSFER ORDERS & TRACEABILITY MODULES (Migrations 030-032)
-- ============================================================================

-- TABLE: transfer_orders
DROP POLICY IF EXISTS "transfer_orders_org_isolation" ON transfer_orders;
CREATE POLICY "transfer_orders_org_isolation" ON transfer_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- TABLE: to_lines (inherits org_id from parent transfer_orders via FK)
DROP POLICY IF EXISTS "to_lines_org_isolation" ON to_lines;
CREATE POLICY "to_lines_org_isolation" ON to_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE transfer_orders.id = to_lines.transfer_order_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- TABLE: to_line_lps (inherits org_id from to_lines -> transfer_orders via FK)
DROP POLICY IF EXISTS "to_line_lps_org_isolation" ON to_line_lps;
CREATE POLICY "to_line_lps_org_isolation" ON to_line_lps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM to_lines
      JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
      WHERE to_lines.id = to_line_lps.to_line_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- TABLE: license_plates (4 granular policies)
DROP POLICY IF EXISTS "license_plates_select_policy" ON license_plates;
CREATE POLICY "license_plates_select_policy" ON license_plates
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "license_plates_insert_policy" ON license_plates;
CREATE POLICY "license_plates_insert_policy" ON license_plates
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse')
  );

DROP POLICY IF EXISTS "license_plates_update_policy" ON license_plates;
CREATE POLICY "license_plates_update_policy" ON license_plates
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse')
  );

DROP POLICY IF EXISTS "license_plates_delete_policy" ON license_plates;
CREATE POLICY "license_plates_delete_policy" ON license_plates
  FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- TABLE: lp_genealogy (inherits org_id from license_plates via FK, 2 policies)
DROP POLICY IF EXISTS "lp_genealogy_select_policy" ON lp_genealogy;
CREATE POLICY "lp_genealogy_select_policy" ON lp_genealogy
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = lp_genealogy.parent_lp_id
      AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "lp_genealogy_insert_policy" ON lp_genealogy;
CREATE POLICY "lp_genealogy_insert_policy" ON lp_genealogy
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = lp_genealogy.parent_lp_id
      AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse', 'production')
  );

-- TABLE: traceability_links (inherits org_id from license_plates via FK, 2 policies)
DROP POLICY IF EXISTS "traceability_links_select_policy" ON traceability_links;
CREATE POLICY "traceability_links_select_policy" ON traceability_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = traceability_links.lp_id
      AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "traceability_links_insert_policy" ON traceability_links;
CREATE POLICY "traceability_links_insert_policy" ON traceability_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = traceability_links.lp_id
      AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND (auth.jwt() ->> 'role') IN ('warehouse', 'production', 'technical', 'admin', 'qc_manager')
  );

-- TABLE: recall_simulations (2 policies)
DROP POLICY IF EXISTS "recall_simulations_select_policy" ON recall_simulations;
CREATE POLICY "recall_simulations_select_policy" ON recall_simulations
  FOR SELECT
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('qc_manager', 'technical', 'admin')
  );

DROP POLICY IF EXISTS "recall_simulations_insert_policy" ON recall_simulations;
CREATE POLICY "recall_simulations_insert_policy" ON recall_simulations
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('qc_manager', 'technical', 'admin')
  );

-- TABLE: work_orders (4 granular policies)
DROP POLICY IF EXISTS "work_orders_select_policy" ON work_orders;
CREATE POLICY "work_orders_select_policy" ON work_orders
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "work_orders_insert_policy" ON work_orders;
CREATE POLICY "work_orders_insert_policy" ON work_orders
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('production', 'technical', 'admin')
  );

DROP POLICY IF EXISTS "work_orders_update_policy" ON work_orders;
CREATE POLICY "work_orders_update_policy" ON work_orders
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('production', 'technical', 'admin')
  );

DROP POLICY IF EXISTS "work_orders_delete_policy" ON work_orders;
CREATE POLICY "work_orders_delete_policy" ON work_orders
  FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration fixes duplicate policy errors by using DROP POLICY IF EXISTS
-- before CREATE POLICY for all 24 tables with RLS policies across modules:
-- - Products (5 tables)
-- - BOMs (2 tables)
-- - Suppliers (2 tables)
-- - Purchase Orders (4 tables)
-- - Routings (3 tables)
-- - Transfer Orders & Traceability (6 tables)
-- ============================================================================
