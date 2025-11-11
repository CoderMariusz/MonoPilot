-- Migration 040: Row Level Security Policies
-- Purpose: Enable RLS and create security policies
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_correction ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_line ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Note: routing_operation_names deliberately left WITHOUT RLS as it's a reference table

-- =============================================
-- 2. CREATE POLICIES (Full access for authenticated users)
-- =============================================

-- These are basic policies allowing authenticated users full access
-- More granular role-based policies can be added later as needed

CREATE POLICY "authenticated_users_all" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON settings_tax_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON allergens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON production_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON boms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON bom_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON bom_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON routings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON routing_operations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON po_header FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON po_line FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON po_correction FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON to_header FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON to_line FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON wo_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON wo_operations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON production_outputs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON license_plates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON lp_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON lp_compositions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON lp_genealogy FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON pallets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON pallet_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON grns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON grn_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON asns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON asn_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON stock_moves FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON product_allergens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comments
COMMENT ON POLICY "authenticated_users_all" ON users IS 'Allow authenticated users full access to users table';
COMMENT ON POLICY "authenticated_users_all" ON products IS 'Allow authenticated users full access to products table';

