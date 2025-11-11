-- Migration 042: Seed Data
-- Purpose: Initial seed data for testing and development
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. SEED TAX CODES
-- =============================================

INSERT INTO settings_tax_codes (code, name, rate, is_active) VALUES 
('VAT_23', 'VAT 23%', 0.23, true),
('VAT_8', 'VAT 8%', 0.08, true),
('VAT_0', 'VAT 0%', 0.00, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. SEED ALLERGENS
-- =============================================

INSERT INTO allergens (code, name, description, is_active) VALUES 
('GLUTEN', 'Gluten', 'Contains gluten from wheat, rye, barley', true),
('SOYA', 'Soya', 'Contains soya products', true),
('DAIRY', 'Dairy', 'Contains milk and dairy products', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. SEED WAREHOUSES
-- =============================================

INSERT INTO warehouses (code, name, is_active) VALUES 
('WH-001', 'Main Warehouse', true),
('WH-002', 'Forza', true),
('PROD-001', 'Production Area', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 4. SEED LOCATIONS
-- =============================================

INSERT INTO locations (warehouse_id, code, name, type, is_active) 
SELECT w.id, 'DG-001', 'Dry Goods Zone 1', 'STORAGE', true
FROM warehouses w WHERE w.code = 'WH-001'
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations (warehouse_id, code, name, type, is_active) 
SELECT w.id, 'DG-002', 'Dry Goods Zone 2', 'STORAGE', true
FROM warehouses w WHERE w.code = 'WH-002'
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations (warehouse_id, code, name, type, is_active) 
SELECT w.id, 'PROD-001', 'Production Floor', 'PRODUCTION', true
FROM warehouses w WHERE w.code = 'PROD-001'
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 5. SEED SUPPLIERS
-- =============================================

INSERT INTO suppliers (
  name, legal_name, vat_number, country, currency, 
  payment_terms, lead_time_days, is_active
) VALUES 
('BXS Supplier', 'BXS Supplier Ltd', 'VAT123456', 'PL', 'PLN', 'Net 30', 7, true),
('Packaging Co', 'Packaging Co Sp. z o.o.', 'VAT789012', 'PL', 'PLN', 'Net 15', 3, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. SEED MACHINES
-- =============================================

INSERT INTO machines (name, code, type, is_active) VALUES 
('Mixer 1', 'MIX-001', 'MIXER', true),
('Packer 1', 'PACK-001', 'PACKER', true),
('Grinder 1', 'GRIND-001', 'GRINDER', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 7. SEED PRODUCTION LINES
-- =============================================

INSERT INTO production_lines (code, name, status, is_active) VALUES 
('LINE-4', 'Production Line 4', 'active', true),
('LINE-5', 'Production Line 5', 'active', true),
('LINE-6', 'Production Line 6', 'inactive', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 8. SEED ROUTING OPERATION NAMES
-- =============================================

INSERT INTO routing_operation_names (name, alias, description, is_active) VALUES 
('Mixing', 'MIX', 'Mix ingredients together', true),
('Grinding', 'GRIND', 'Grind meat or materials', true),
('Forming', 'FORM', 'Form product shape', true),
('Cooking', 'COOK', 'Cooking process', true),
('Cooling', 'COOL', 'Cooling process', true),
('Packing', 'PACK', 'Pack finished products', true),
('Quality Check', 'QC', 'Quality control inspection', true),
('Labeling', 'LABEL', 'Apply labels to products', true)
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE settings_tax_codes IS 'Seed data loaded: 3 tax codes';
COMMENT ON TABLE allergens IS 'Seed data loaded: 3 allergens';
COMMENT ON TABLE warehouses IS 'Seed data loaded: 3 warehouses';
COMMENT ON TABLE suppliers IS 'Seed data loaded: 2 suppliers';
COMMENT ON TABLE machines IS 'Seed data loaded: 3 machines';
COMMENT ON TABLE production_lines IS 'Seed data loaded: 3 production lines';
COMMENT ON TABLE routing_operation_names IS 'Seed data loaded: 8 standard operations';

