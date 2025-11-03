-- Migration 043: RLS Policies
-- Purpose: Enable RLS and create basic security policies for all tables
-- Date: 2025-01-21

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

-- Core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- BOM tables
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;

-- Planning tables (Phase 1)
ALTER TABLE po_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_correction ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Production tables
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_items ENABLE ROW LEVEL SECURITY;

-- Warehouse tables
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;

-- Junction tables
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. BASIC POLICIES (read for authenticated, write for authenticated)
-- =============================================

-- Note: More granular role-based policies can be added later
-- For now, we use simple authenticated user policies

-- Generic policy helper function (if needed)
-- For most tables, we allow authenticated users full access

-- Products
CREATE POLICY "authenticated_users_products_all" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- BOMs
CREATE POLICY "authenticated_users_boms_all" ON boms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- BOM Items
CREATE POLICY "authenticated_users_bom_items_all" ON bom_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Work Orders
CREATE POLICY "authenticated_users_work_orders_all" ON work_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- WO Materials
CREATE POLICY "authenticated_users_wo_materials_all" ON wo_materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Production Outputs
CREATE POLICY "authenticated_users_production_outputs_all" ON production_outputs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- License Plates
CREATE POLICY "authenticated_users_license_plates_all" ON license_plates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LP Reservations
CREATE POLICY "authenticated_users_lp_reservations_all" ON lp_reservations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LP Compositions
CREATE POLICY "authenticated_users_lp_compositions_all" ON lp_compositions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pallets
CREATE POLICY "authenticated_users_pallets_all" ON pallets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pallet Items
CREATE POLICY "authenticated_users_pallet_items_all" ON pallet_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PO Header
CREATE POLICY "authenticated_users_po_header_all" ON po_header
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PO Line
CREATE POLICY "authenticated_users_po_line_all" ON po_line
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PO Correction
CREATE POLICY "authenticated_users_po_correction_all" ON po_correction
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TO Header
CREATE POLICY "authenticated_users_to_header_all" ON to_header
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TO Line
CREATE POLICY "authenticated_users_to_line_all" ON to_line
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers
CREATE POLICY "authenticated_users_suppliers_all" ON suppliers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Warehouses
CREATE POLICY "authenticated_users_warehouses_all" ON warehouses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Locations
CREATE POLICY "authenticated_users_locations_all" ON locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRNs
CREATE POLICY "authenticated_users_grns_all" ON grns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRN Items
CREATE POLICY "authenticated_users_grn_items_all" ON grn_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ASNs
CREATE POLICY "authenticated_users_asns_all" ON asns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ASN Items
CREATE POLICY "authenticated_users_asn_items_all" ON asn_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock Moves
CREATE POLICY "authenticated_users_stock_moves_all" ON stock_moves
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Supplier Products
CREATE POLICY "authenticated_users_supplier_products_all" ON supplier_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product Allergens
CREATE POLICY "authenticated_users_product_allergens_all" ON product_allergens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Log
CREATE POLICY "authenticated_users_audit_log_all" ON audit_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Routings
CREATE POLICY "authenticated_users_routings_all" ON routings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Routing Operations
CREATE POLICY "authenticated_users_routing_operations_all" ON routing_operations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- WO Operations
CREATE POLICY "authenticated_users_wo_operations_all" ON wo_operations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

