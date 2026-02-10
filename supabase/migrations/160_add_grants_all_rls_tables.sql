-- Migration: Add GRANT permissions to all RLS-enabled tables for PostgREST visibility
-- Purpose: Ensure authenticated and service_role can access tables through RLS
-- Date: 2026-02-10
-- Pattern: Follow ADR-013 for secure multi-tenant access

-- ============================================================================
-- GRANT PERMISSIONS FOR ALL TABLES TO AUTHENTICATED ROLE
-- ============================================================================

-- These tables have RLS enabled but were missing GRANT statements
-- GRANT is necessary for PostgREST API and direct access through Supabase

-- Core Settings & System Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON password_history TO authenticated;

-- Configuration Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON allergens TO authenticated;

-- Warehouse & Location Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON machines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON production_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON production_line_machines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON production_line_products TO authenticated;

-- Technical Module Tables (Products & BOM)
GRANT SELECT, INSERT, UPDATE, DELETE ON product_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_allergens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_version_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_shelf_life TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_costs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_nutrition TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ingredient_nutrition TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_traceability_config TO authenticated;

-- BOM Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON boms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bom_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bom_alternatives TO authenticated;

-- Routing Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON routings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON routing_operations TO authenticated;

-- Planning Module Tables (Suppliers & Purchase Orders)
GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_lines TO authenticated;

-- Transfer Orders
GRANT SELECT, INSERT, UPDATE, DELETE ON transfer_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transfer_order_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON to_line_lps TO authenticated;

-- Work Orders
GRANT SELECT, INSERT, UPDATE, DELETE ON work_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wo_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wo_operations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wo_material_consumptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wo_daily_sequence TO authenticated;

-- Warehouse Inventory Tables (License Plates & Movements)
GRANT SELECT, INSERT, UPDATE, DELETE ON license_plates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lp_reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lp_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lp_number_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_moves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_move_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_adjustments TO authenticated;

-- Shipping & Receiving Tables (ASN & GRN)
GRANT SELECT, INSERT, UPDATE, DELETE ON asns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON asn_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grn_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grn_number_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON over_receipt_approvals TO authenticated;

-- Quality & Analysis Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON cost_variances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shelf_life_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON yield_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON operation_attachments TO authenticated;

-- Settings & Configuration Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON planning_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouse_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouse_settings_audit TO authenticated;

-- PO Workflow Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON po_statuses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON po_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON po_status_transitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON po_approval_history TO authenticated;

-- Traceability Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON traceability_links TO authenticated;

-- ============================================================================
-- GRANT PERMISSIONS FOR SERVICE_ROLE (Full Admin Access)
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- GRANT USAGE ON SEQUENCES FOR AUTHENTICATED (Needed for INSERT operations)
-- ============================================================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SET DEFAULT PRIVILEGES FOR FUTURE TABLES
-- ============================================================================

-- Any new tables created going forward will automatically be granted to authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO authenticated;

-- Service role gets full access by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  grant_check INT;
BEGIN
  SELECT COUNT(*)
  INTO grant_check
  FROM information_schema.role_table_grants
  WHERE grantee = 'authenticated'
    AND privilege_type = 'SELECT'
    AND table_schema = 'public';

  RAISE NOTICE '✅ GRANT verification: authenticated role has SELECT on % tables',
               grant_check;
END $$;

-- Verify by running:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Expected: All tables should have rowsecurity = true (RLS enabled)
-- and authenticated should have SELECT, INSERT, UPDATE, DELETE grants
