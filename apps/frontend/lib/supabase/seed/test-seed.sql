-- Test Seed Data for BOM Lifecycle E2E Tests
-- This file contains comprehensive test data for all BOM functionality

-- Clear existing data (in reverse dependency order)
DELETE FROM bom_items;
DELETE FROM boms;
DELETE FROM product_allergens;
DELETE FROM products;
DELETE FROM allergens;
DELETE FROM settings_tax_codes;
DELETE FROM suppliers;
DELETE FROM work_orders;
DELETE FROM wo_materials;

-- Insert allergens
INSERT INTO allergens (id, code, name, description, icon, is_active) VALUES
(1, 'GLUTEN', 'Gluten', 'Contains gluten', '🌾', true),
(2, 'DAIRY', 'Dairy', 'Contains dairy products', '🥛', true),
(3, 'SOY', 'Soy', 'Contains soy', '🫘', true),
(4, 'NUTS', 'Nuts', 'Contains nuts', '🥜', true),
(5, 'EGGS', 'Eggs', 'Contains eggs', '🥚', true);

-- Insert tax codes
INSERT INTO settings_tax_codes (id, code, name, rate, is_active) VALUES
(1, 'VAT_20', 'VAT 20%', 20.00, true),
(2, 'VAT_0', 'Zero Rate', 0.00, true),
(3, 'VAT_5', 'Reduced Rate 5%', 5.00, true);

-- Insert suppliers
INSERT INTO suppliers (id, name, legal_name, vat_number, country, currency, payment_terms, email, phone, is_active, lead_time_days) VALUES
(1, 'Meat Supplier Ltd', 'Meat Supplier Limited', 'GB123456789', 'UK', 'GBP', 'Net 30', 'orders@meatsupplier.com', '+44 20 1234 5678', true, 3),
(2, 'Dry Goods Co', 'Dry Goods Company', 'GB987654321', 'UK', 'GBP', 'Net 15', 'sales@drygoods.com', '+44 20 8765 4321', true, 7),
(3, 'Packaging Solutions', 'Packaging Solutions Ltd', 'GB456789123', 'UK', 'GBP', 'Net 30', 'info@packaging.com', '+44 20 4567 8912', true, 5);

-- Insert products
INSERT INTO products (id, part_number, description, type, uom, product_group, product_type, is_active, supplier_id, lead_time_days, moq, tax_code_id, std_price, shelf_life_days, expiry_policy) VALUES
-- Raw Materials (Meat)
(1, 'RM-001', 'Beef trim', 'RM', 'kg', 'MEAT', 'RM_MEAT', true, 1, 2, 10, 1, 4.20, 3, 'DAYS_STATIC'),
(2, 'RM-002', 'Pork shoulder', 'RM', 'kg', 'MEAT', 'RM_MEAT', true, 1, 2, 15, 1, 3.80, 3, 'DAYS_STATIC'),

-- Dry Goods
(3, 'DG-WEB-123', 'Web 123', 'DG', 'ea', 'DRYGOODS', 'DG_WEB', true, 2, 7, 100, 2, 0.12, 365, 'DAYS_STATIC'),
(4, 'DG-LABEL-001', 'Product Label', 'DG', 'ea', 'DRYGOODS', 'DG_LABEL', true, 2, 5, 500, 2, 0.05, 365, 'DAYS_STATIC'),
(5, 'DG-BOX-200', 'Box 200g', 'DG', 'ea', 'DRYGOODS', 'DG_BOX', true, 3, 10, 50, 2, 0.25, 365, 'DAYS_STATIC'),

-- Process (Composite)
(6, 'PR-ROAST-BASE', 'Roast base', 'PR', 'kg', 'COMPOSITE', 'PR', true, 1, 3, 5, 1, 9.50, 2, 'DAYS_STATIC'),

-- Finished Goods (Composite)
(7, 'FG-ROAST-200', 'Roast Beef 200g', 'FG', 'ea', 'COMPOSITE', 'FG', true, 1, 1, 1, 1, 3.20, 2, 'DAYS_STATIC'),
(8, 'FG-ROAST-300', 'Roast Beef 300g', 'FG', 'ea', 'COMPOSITE', 'FG', true, 1, 1, 1, 1, 4.50, 2, 'DAYS_STATIC');

-- Insert product allergens
INSERT INTO product_allergens (product_id, allergen_id, contains) VALUES
-- Beef products contain no allergens
-- Web contains gluten
(3, 1, true),
-- Labels contain no allergens
-- Boxes contain no allergens
-- Roast base contains no allergens
-- Roast beef products contain no allergens
(7, 1, false),
(8, 1, false);

-- Insert BOMs
INSERT INTO boms (id, product_id, version, status, requires_routing, notes, effective_from) VALUES
-- Active BOM for FG-ROAST-200
(1, 7, '1.0', 'active', true, 'Main production BOM for 200g roast beef', NOW()),
-- Draft BOM for FG-ROAST-200 (newer version)
(2, 7, '1.1', 'draft', true, 'Updated BOM with improved efficiency', NOW()),
-- Active BOM for FG-ROAST-300
(3, 8, '1.0', 'active', true, 'Main production BOM for 300g roast beef', NOW());

-- Insert BOM items
INSERT INTO bom_items (bom_id, material_id, quantity, uom, sequence, scrap_std_pct, is_optional, is_phantom, consume_whole_lp, unit_cost_std, tax_code_id, lead_time_days, moq) VALUES
-- BOM 1 (FG-ROAST-200 v1.0) - Active
(1, 1, 0.25, 'kg', 1, 2.0, false, false, true, 4.20, 1, 2, 10),  -- Beef trim
(1, 3, 1, 'ea', 2, 0.0, false, false, false, 0.12, 2, 7, 100), -- Web
(1, 4, 1, 'ea', 3, 0.0, false, false, false, 0.05, 2, 5, 500), -- Label
(1, 5, 1, 'ea', 4, 0.0, false, false, false, 0.25, 2, 10, 50), -- Box

-- BOM 2 (FG-ROAST-200 v1.1) - Draft
(2, 1, 0.23, 'kg', 1, 1.5, false, false, true, 4.20, 1, 2, 10),  -- Beef trim (improved)
(2, 3, 1, 'ea', 2, 0.0, false, false, false, 0.12, 2, 7, 100), -- Web
(2, 4, 1, 'ea', 3, 0.0, false, false, false, 0.05, 2, 5, 500), -- Label
(2, 5, 1, 'ea', 4, 0.0, false, false, false, 0.25, 2, 10, 50), -- Box

-- BOM 3 (FG-ROAST-300 v1.0) - Active
(3, 1, 0.35, 'kg', 1, 2.0, false, false, true, 4.20, 1, 2, 10),  -- Beef trim
(3, 3, 1, 'ea', 2, 0.0, false, false, false, 0.12, 2, 7, 100), -- Web
(3, 4, 1, 'ea', 3, 0.0, false, false, false, 0.05, 2, 5, 500), -- Label
(3, 5, 1, 'ea', 4, 0.0, false, false, false, 0.25, 2, 10, 50); -- Box

-- Insert test work orders
INSERT INTO work_orders (id, wo_number, product_id, bom_id, quantity, uom, status, priority, created_at) VALUES
(1, 'WO-TEST-001', 7, 1, 100, 'ea', 'planned', 3, NOW()),
(2, 'WO-TEST-002', 8, 3, 50, 'ea', 'planned', 2, NOW()),
(3, 'WO-TEST-003', 7, 1, 200, 'ea', 'released', 1, NOW());

-- Insert WO materials (snapshot from BOM)
INSERT INTO wo_materials (wo_id, material_id, qty_per_unit, total_qty_needed, uom, production_line_restrictions, consume_whole_lp) VALUES
-- WO-TEST-001 materials (from BOM 1)
(1, 1, 0.25, 25, 'kg', '{}', true),   -- Beef trim
(1, 3, 1, 100, 'ea', '{}', false),    -- Web
(1, 4, 1, 100, 'ea', '{}', false),    -- Label
(1, 5, 1, 100, 'ea', '{}', false),    -- Box

-- WO-TEST-002 materials (from BOM 3)
(2, 1, 0.35, 17.5, 'kg', '{}', true), -- Beef trim
(2, 3, 1, 50, 'ea', '{}', false),     -- Web
(2, 4, 1, 50, 'ea', '{}', false),     -- Label
(2, 5, 1, 50, 'ea', '{}', false);     -- Box

-- Update sequences for products
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('boms_id_seq', (SELECT MAX(id) FROM boms));
SELECT setval('work_orders_id_seq', (SELECT MAX(id) FROM work_orders));
SELECT setval('allergens_id_seq', (SELECT MAX(id) FROM allergens));
SELECT setval('settings_tax_codes_id_seq', (SELECT MAX(id) FROM settings_tax_codes));
SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));

-- Verify data
SELECT 'Seed data inserted successfully' as status;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as bom_count FROM boms;
SELECT COUNT(*) as bom_item_count FROM bom_items;
SELECT COUNT(*) as wo_count FROM work_orders;
SELECT COUNT(*) as wo_material_count FROM wo_materials;
