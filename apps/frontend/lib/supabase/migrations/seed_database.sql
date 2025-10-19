-- =====================================================
-- COMPREHENSIVE SEED DATA FOR MONOPILOT
-- =====================================================
-- This script populates the database with realistic test data
-- for all production flows, warehouse operations, and planning features

-- SECTION 1: MASTER DATA
-- =====================================================

-- Suppliers (5 suppliers)
INSERT INTO suppliers (id, name, legal_name, vat_number, country, currency, payment_terms, is_active) VALUES
(1, 'ABC Meats Ltd', 'ABC Meats Limited', 'GB123456789', 'GBR', 'GBP', 'Net 30', true),
(2, 'Fresh Produce Co', 'Fresh Produce Company Inc', 'US987654321', 'USA', 'USD', 'Net 15', true),
(3, 'Spice World Ltd', 'Spice World Limited', 'GB987654321', 'GBR', 'GBP', 'Net 45', true),
(4, 'Packaging Solutions', 'Packaging Solutions LLC', 'US123456789', 'USA', 'USD', 'Net 30', true),
(5, 'Cold Storage UK', 'Cold Storage United Kingdom', 'GB456789123', 'GBR', 'GBP', 'Net 60', true);

-- Warehouses (3 warehouses)
INSERT INTO warehouses (id, code, name, is_active) VALUES
(1, 'WH-MAIN', 'Main Warehouse', true),
(2, 'WH-COLD', 'Cold Storage Warehouse', true),
(3, 'WH-PROD', 'Production Floor', true);

-- Locations (15 locations across warehouses)
INSERT INTO locations (id, warehouse_id, code, name, type, is_active) VALUES
-- Main Warehouse
(1, 1, 'A-01-01', 'Aisle A, Bay 01, Level 01', 'bulk', true),
(2, 1, 'A-01-02', 'Aisle A, Bay 01, Level 02', 'bulk', true),
(3, 1, 'A-02-01', 'Aisle A, Bay 02, Level 01', 'bulk', true),
(4, 1, 'B-01-01', 'Aisle B, Bay 01, Level 01', 'bulk', true),
(5, 1, 'B-02-01', 'Aisle B, Bay 02, Level 01', 'bulk', true),

-- Cold Storage Warehouse
(6, 2, 'C-01-01', 'Cold Storage Aisle 1, Bay 1', 'cold', true),
(7, 2, 'C-01-02', 'Cold Storage Aisle 1, Bay 2', 'cold', true),
(8, 2, 'C-02-01', 'Cold Storage Aisle 2, Bay 1', 'cold', true),
(9, 2, 'C-02-02', 'Cold Storage Aisle 2, Bay 2', 'cold', true),
(10, 2, 'C-03-01', 'Cold Storage Aisle 3, Bay 1', 'cold', true),

-- Production Floor
(11, 3, 'P-01', 'Production Line 1', 'production', true),
(12, 3, 'P-02', 'Production Line 2', 'production', true),
(13, 3, 'P-03', 'Production Line 3', 'production', true),
(14, 3, 'P-04', 'Production Line 4', 'production', true),
(15, 3, 'P-05', 'Production Line 5', 'production', true);

-- Tax Codes (3 codes)
INSERT INTO tax_codes (id, code, name, rate, is_active) VALUES
(1, 'STD', 'Standard Rate', 0.20, true),
(2, 'RED', 'Reduced Rate', 0.05, true),
(3, 'ZERO', 'Zero Rate', 0.00, true);

-- Allergens (14 common allergens)
INSERT INTO allergens (id, name, code, description) VALUES
(1, 'Cereals containing gluten', 'GLUTEN', 'Wheat, rye, barley, oats, spelt, kamut or their hybridised strains'),
(2, 'Crustaceans', 'CRUSTACEAN', 'Crab, lobster, prawns, shrimp, crayfish, langoustines'),
(3, 'Eggs', 'EGG', 'Hen eggs and egg products'),
(4, 'Fish', 'FISH', 'All species of fish'),
(5, 'Peanuts', 'PEANUT', 'Groundnuts and peanut products'),
(6, 'Soybeans', 'SOYA', 'Soya beans and soya products'),
(7, 'Milk', 'MILK', 'Cows milk and milk products'),
(8, 'Nuts', 'NUTS', 'Almonds, hazelnuts, walnuts, cashews, pecans, brazils, pistachios, macadamia nuts'),
(9, 'Celery', 'CELERY', 'Celery and celeriac'),
(10, 'Mustard', 'MUSTARD', 'Mustard seeds and mustard products'),
(11, 'Sesame seeds', 'SESAME', 'Sesame seeds and sesame products'),
(12, 'Sulphur dioxide/sulphites', 'SULPHITES', 'Sulphur dioxide and sulphites at concentrations of more than 10mg/kg'),
(13, 'Lupin', 'LUPIN', 'Lupin seeds and lupin products'),
(14, 'Molluscs', 'MOLLUSCS', 'Mussels, oysters, scallops, cockles, clams, squid, octopus, cuttlefish');

-- SECTION 2: EQUIPMENT
-- =====================================================

-- Machines (5 production lines)
INSERT INTO machines (id, name, code, type, location_id, is_active) VALUES
(1, 'Meat Grinder Line 1', 'GRIND-01', 'grinder', 11, true),
(2, 'Mixing Line 1', 'MIX-01', 'mixer', 12, true),
(3, 'Sausage Production Line', 'SAUSAGE-01', 'sausage', 13, true),
(4, 'Packaging Line 1', 'PACK-01', 'packaging', 14, true),
(5, 'Labeling Line 1', 'LABEL-01', 'labeling', 15, true);

-- SECTION 3: PRODUCTS
-- =====================================================

-- Raw Materials (10 items)
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
(1, 'RM-BEEF-001', 'Premium Beef Trim', 'RM', 'MEAT', 'RM_MEAT', 'Beef', 'kg', 'use_by', 5, true),
(2, 'RM-PORK-001', 'Pork Shoulder', 'RM', 'MEAT', 'RM_MEAT', 'Pork', 'kg', 'use_by', 4, true),
(3, 'RM-SALT-001', 'Table Salt', 'RM', 'DRYGOODS', 'DG_ING', 'Salt', 'kg', 'best_before', 365, true),
(4, 'RM-PEPPER-001', 'Black Pepper Ground', 'RM', 'DRYGOODS', 'DG_ING', 'Pepper', 'kg', 'best_before', 730, true),
(5, 'RM-SPICE-001', 'Mixed Spices', 'RM', 'DRYGOODS', 'DG_ING', 'Spices', 'kg', 'best_before', 365, true),
(6, 'RM-FAT-001', 'Beef Fat', 'RM', 'MEAT', 'RM_MEAT', 'Fat', 'kg', 'use_by', 3, true),
(7, 'RM-CASING-001', 'Natural Hog Casings', 'RM', 'DRYGOODS', 'DG_ING', 'Casing', 'm', 'use_by', 30, true),
(8, 'RM-ONION-001', 'Dried Onion Powder', 'RM', 'DRYGOODS', 'DG_ING', 'Onion', 'kg', 'best_before', 730, true),
(9, 'RM-GARLIC-001', 'Garlic Powder', 'RM', 'DRYGOODS', 'DG_ING', 'Garlic', 'kg', 'best_before', 365, true),
(10, 'RM-PAPER-001', 'Butcher Paper', 'RM', 'DRYGOODS', 'DG_ING', 'Paper', 'roll', 'indefinite', 0, true);

-- Intermediate Products (5 items)
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
(11, 'PR-GRIND-001', 'Ground Beef Mix', 'PR', 'COMPOSITE', 'PR', 'Ground', 'kg', 'use_by', 2, true),
(12, 'PR-MIX-001', 'Seasoned Meat Mix', 'PR', 'COMPOSITE', 'PR', 'Mixed', 'kg', 'use_by', 1, true),
(13, 'PR-FILL-001', 'Sausage Filling', 'PR', 'COMPOSITE', 'PR', 'Filling', 'kg', 'use_by', 1, true),
(14, 'PR-COOK-001', 'Cooked Sausage', 'PR', 'COMPOSITE', 'PR', 'Cooked', 'kg', 'use_by', 3, true),
(15, 'PR-CHILL-001', 'Chilled Product', 'PR', 'COMPOSITE', 'PR', 'Chilled', 'kg', 'use_by', 7, true);

-- Finished Goods (8 items)
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
(16, 'FG-SAUS-001', 'Premium Beef Sausage', 'FG', 'COMPOSITE', 'FG', 'Beef', 'kg', 'use_by', 5, true),
(17, 'FG-SAUS-002', 'Classic Pork Sausage', 'FG', 'COMPOSITE', 'FG', 'Pork', 'kg', 'use_by', 5, true),
(18, 'FG-SAUS-003', 'Mixed Meat Sausage', 'FG', 'COMPOSITE', 'FG', 'Mixed', 'kg', 'use_by', 5, true),
(19, 'FG-BURG-001', 'Beef Burger Patty', 'FG', 'COMPOSITE', 'FG', 'Beef', 'piece', 'use_by', 3, true),
(20, 'FG-BURG-002', 'Mixed Burger Patty', 'FG', 'COMPOSITE', 'FG', 'Mixed', 'piece', 'use_by', 3, true),
(21, 'FG-MEAT-001', 'Seasoned Ground Beef', 'FG', 'COMPOSITE', 'FG', 'Ground', 'kg', 'use_by', 2, true),
(22, 'FG-MEAT-002', 'Premium Steak', 'FG', 'COMPOSITE', 'FG', 'Steak', 'kg', 'use_by', 5, true),
(23, 'FG-MEAT-003', 'Marinated Chicken', 'FG', 'COMPOSITE', 'FG', 'Chicken', 'kg', 'use_by', 3, true);

-- Product Allergens (link products to allergens)
INSERT INTO product_allergens (product_id, allergen_id) VALUES
-- Beef products contain no allergens
-- Pork products contain no allergens  
-- Mixed products contain gluten (from potential breadcrumbs)
(12, 1), -- Seasoned Meat Mix
(18, 1), -- Mixed Meat Sausage
(20, 1), -- Mixed Burger Patty
-- Spices might contain traces of various allergens
(5, 8),  -- Mixed Spices - Nuts
(8, 8),  -- Onion Powder - Nuts
(9, 8);  -- Garlic Powder - Nuts

-- SECTION 4: BOMs & ROUTINGS
-- =====================================================

-- BOMs (8 BOMs - one per finished good)
INSERT INTO boms (id, product_id, version, status, effective_from) VALUES
(1, 16, '1.0', 'active', NOW()), -- Premium Beef Sausage
(2, 17, '1.0', 'active', NOW()), -- Classic Pork Sausage
(3, 18, '1.0', 'active', NOW()), -- Mixed Meat Sausage
(4, 19, '1.0', 'active', NOW()), -- Beef Burger Patty
(5, 20, '1.0', 'active', NOW()), -- Mixed Burger Patty
(6, 21, '1.0', 'active', NOW()), -- Seasoned Ground Beef
(7, 22, '1.0', 'active', NOW()), -- Premium Steak
(8, 23, '1.0', 'active', NOW()); -- Marinated Chicken

-- BOM Items (3-6 components per BOM)
INSERT INTO bom_items (id, bom_id, material_id, uom, quantity, production_line_restrictions, sequence) VALUES
-- Premium Beef Sausage BOM
(1, 1, 1, 'kg', 0.8, '{GRIND-01,MIX-01}', 1),
(2, 1, 6, 'kg', 0.2, '{GRIND-01,MIX-01}', 2),
(3, 1, 3, 'kg', 0.02, '{MIX-01}', 3),
(4, 1, 5, 'kg', 0.01, '{MIX-01}', 4),
(5, 1, 7, 'm', 1.0, '{SAUSAGE-01}', 5),

-- Classic Pork Sausage BOM
(6, 2, 2, 'kg', 0.85, '{GRIND-01,MIX-01}', 1),
(7, 2, 3, 'kg', 0.02, '{MIX-01}', 2),
(8, 2, 4, 'kg', 0.01, '{MIX-01}', 3),
(9, 2, 8, 'kg', 0.005, '{MIX-01}', 4),
(10, 2, 7, 'm', 1.0, '{SAUSAGE-01}', 5),

-- Mixed Meat Sausage BOM
(11, 3, 1, 'kg', 0.4, '{GRIND-01,MIX-01}', 1),
(12, 3, 2, 'kg', 0.4, '{GRIND-01,MIX-01}', 2),
(13, 3, 6, 'kg', 0.15, '{GRIND-01,MIX-01}', 3),
(14, 3, 3, 'kg', 0.02, '{MIX-01}', 4),
(15, 3, 5, 'kg', 0.015, '{MIX-01}', 5),
(16, 3, 7, 'm', 1.0, '{SAUSAGE-01}', 6),

-- Beef Burger Patty BOM
(17, 4, 1, 'kg', 0.9, '{GRIND-01,MIX-01}', 1),
(18, 4, 3, 'kg', 0.015, '{MIX-01}', 2),
(19, 4, 5, 'kg', 0.01, '{MIX-01}', 3),
(20, 4, 8, 'kg', 0.005, '{MIX-01}', 4),

-- Mixed Burger Patty BOM
(21, 5, 1, 'kg', 0.6, '{GRIND-01,MIX-01}', 1),
(22, 5, 2, 'kg', 0.3, '{GRIND-01,MIX-01}', 2),
(23, 5, 3, 'kg', 0.015, '{MIX-01}', 3),
(24, 5, 4, 'kg', 0.01, '{MIX-01}', 4),
(25, 5, 8, 'kg', 0.005, '{MIX-01}', 5),

-- Seasoned Ground Beef BOM
(26, 6, 1, 'kg', 0.95, '{GRIND-01,MIX-01}', 1),
(27, 6, 3, 'kg', 0.02, '{MIX-01}', 2),
(28, 6, 5, 'kg', 0.015, '{MIX-01}', 3),
(29, 6, 8, 'kg', 0.01, '{MIX-01}', 4),
(30, 6, 9, 'kg', 0.005, '{MIX-01}', 5),

-- Premium Steak BOM (minimal processing)
(31, 7, 1, 'kg', 1.0, '{PACK-01}', 1),

-- Marinated Chicken BOM (simplified)
(32, 8, 1, 'kg', 0.9, '{MIX-01}', 1), -- Using beef as proxy
(33, 8, 3, 'kg', 0.02, '{MIX-01}', 2),
(34, 8, 5, 'kg', 0.05, '{MIX-01}', 3);

-- Routings (8 routings with 3-5 operations each)
INSERT INTO routings (id, name, product_id, is_active, notes) VALUES
(1, 'Premium Beef Sausage Production', 16, true, 'Standard routing for premium beef sausage'),
(2, 'Classic Pork Sausage Production', 17, true, 'Standard routing for classic pork sausage'),
(3, 'Mixed Meat Sausage Production', 18, true, 'Standard routing for mixed meat sausage'),
(4, 'Beef Burger Patty Production', 19, true, 'Standard routing for beef burger patty'),
(5, 'Mixed Burger Patty Production', 20, true, 'Standard routing for mixed burger patty'),
(6, 'Seasoned Ground Beef Production', 21, true, 'Standard routing for seasoned ground beef'),
(7, 'Premium Steak Production', 22, true, 'Standard routing for premium steak'),
(8, 'Marinated Chicken Production', 23, true, 'Standard routing for marinated chicken');

-- Routing Operations (3-5 operations per routing)
INSERT INTO routing_operations (id, routing_id, sequence, operation_name, description, machine_id, estimated_duration_minutes) VALUES
-- Premium Beef Sausage Operations
(1, 1, 1, 'Grind Meat', 'Grind beef and fat through coarse plate', 1, 30),
(2, 1, 2, 'Mix Ingredients', 'Mix ground meat with seasonings', 2, 20),
(3, 1, 3, 'Fill Casings', 'Fill natural casings with meat mixture', 3, 45),
(4, 1, 4, 'Package', 'Package sausages in butcher paper', 4, 15),

-- Classic Pork Sausage Operations
(5, 2, 1, 'Grind Pork', 'Grind pork through medium plate', 1, 25),
(6, 2, 2, 'Season Mix', 'Mix ground pork with seasonings', 2, 15),
(7, 2, 3, 'Fill Casings', 'Fill natural casings with pork mixture', 3, 40),
(8, 2, 4, 'Package', 'Package sausages in butcher paper', 4, 15),

-- Mixed Meat Sausage Operations
(9, 3, 1, 'Grind Meats', 'Grind beef, pork, and fat', 1, 35),
(10, 3, 2, 'Mix All', 'Mix all ground meats with seasonings', 2, 25),
(11, 3, 3, 'Fill Casings', 'Fill natural casings with mixed meat', 3, 50),
(12, 3, 4, 'Package', 'Package sausages in butcher paper', 4, 15),

-- Beef Burger Patty Operations
(13, 4, 1, 'Grind Beef', 'Grind beef through fine plate', 1, 20),
(14, 4, 2, 'Season & Mix', 'Mix ground beef with seasonings', 2, 10),
(15, 4, 3, 'Form Patties', 'Form into burger patties', 4, 30),

-- Mixed Burger Patty Operations
(16, 5, 1, 'Grind Meats', 'Grind beef and pork together', 1, 25),
(17, 5, 2, 'Season Mix', 'Mix ground meats with seasonings', 2, 15),
(18, 5, 3, 'Form Patties', 'Form into burger patties', 4, 35),

-- Seasoned Ground Beef Operations
(19, 6, 1, 'Grind Beef', 'Grind beef through medium plate', 1, 20),
(20, 6, 2, 'Add Seasonings', 'Mix ground beef with seasonings', 2, 15),
(21, 6, 3, 'Package', 'Package seasoned ground beef', 4, 20),

-- Premium Steak Operations
(22, 7, 1, 'Trim & Cut', 'Trim and cut steaks to specification', 4, 45),
(23, 7, 2, 'Package', 'Vacuum pack steaks', 4, 25),

-- Marinated Chicken Operations
(24, 8, 1, 'Prepare Meat', 'Prepare chicken for marination', 1, 30),
(25, 8, 2, 'Marinate', 'Apply marinade and mix', 2, 60),
(26, 8, 3, 'Package', 'Package marinated chicken', 4, 20);

-- SECTION 5: SUPPLIER PRODUCTS
-- =====================================================

-- Link raw materials to suppliers with prices, MOQ, lead times
INSERT INTO supplier_products (id, supplier_id, product_id, supplier_sku, lead_time_days, moq, price_excl_tax, tax_code_id, currency, is_active) VALUES
-- ABC Meats Ltd supplies meat products
(1, 1, 1, 'ABC-BEEF-001', 7, 50.0, 12.50, 1, 'GBP', true),
(2, 1, 2, 'ABC-PORK-001', 7, 40.0, 8.75, 1, 'GBP', true),
(3, 1, 6, 'ABC-FAT-001', 5, 20.0, 3.25, 1, 'GBP', true),

-- Fresh Produce Co supplies seasonings
(4, 2, 3, 'FPC-SALT-001', 14, 100.0, 2.25, 2, 'USD', true),
(5, 2, 4, 'FPC-PEPPER-001', 14, 50.0, 15.75, 2, 'USD', true),
(6, 2, 5, 'FPC-SPICE-001', 21, 25.0, 8.50, 2, 'USD', true),

-- Spice World Ltd supplies more seasonings
(7, 3, 8, 'SW-ONION-001', 10, 25.0, 6.25, 2, 'GBP', true),
(8, 3, 9, 'SW-GARLIC-001', 10, 25.0, 12.75, 2, 'GBP', true),

-- Packaging Solutions supplies packaging materials
(9, 4, 7, 'PS-CASING-001', 5, 100.0, 0.85, 2, 'USD', true),
(10, 4, 10, 'PS-PAPER-001', 3, 10.0, 2.50, 2, 'USD', true);

-- SECTION 6: PLANNING DATA
-- =====================================================

-- Purchase Orders (5 POs in various states)
INSERT INTO purchase_orders (id, po_number, supplier_id, status, order_date, request_delivery_date, expected_delivery_date, buyer_name, notes) VALUES
(1, 'PO-2024-001', 1, 'confirmed', '2024-01-15', '2024-01-22', '2024-01-22', 'John Buyer', 'Weekly meat order'),
(2, 'PO-2024-002', 2, 'submitted', '2024-01-16', '2024-01-30', '2024-01-30', 'Jane Buyer', 'Monthly seasoning order'),
(3, 'PO-2024-003', 3, 'confirmed', '2024-01-17', '2024-01-27', '2024-01-27', 'John Buyer', 'Spice replenishment'),
(4, 'PO-2024-004', 4, 'received', '2024-01-10', '2024-01-15', '2024-01-15', 'Jane Buyer', 'Packaging materials'),
(5, 'PO-2024-005', 1, 'cancelled', '2024-01-18', '2024-01-25', '2024-01-25', 'John Buyer', 'Order cancelled due to quality issues');

-- PO Items (3-5 items per PO)
INSERT INTO purchase_order_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_price, confirmed) VALUES
-- PO-2024-001 items
(1, 1, 1, 200.0, 200.0, 12.50, true),
(2, 1, 2, 150.0, 150.0, 8.75, true),
(3, 1, 6, 50.0, 50.0, 3.25, true),

-- PO-2024-002 items
(4, 2, 3, 500.0, 0.0, 2.25, false),
(5, 2, 4, 100.0, 0.0, 15.75, false),
(6, 2, 5, 50.0, 0.0, 8.50, false),

-- PO-2024-003 items
(7, 3, 8, 100.0, 100.0, 6.25, true),
(8, 3, 9, 75.0, 75.0, 12.75, true),

-- PO-2024-004 items
(9, 4, 7, 1000.0, 1000.0, 0.85, true),
(10, 4, 10, 20.0, 20.0, 2.50, true),

-- PO-2024-005 items (cancelled)
(11, 5, 1, 100.0, 0.0, 12.50, false),
(12, 5, 2, 75.0, 0.0, 8.75, false);

-- Transfer Orders (3 TOs between warehouses)
INSERT INTO transfer_orders (id, to_number, from_warehouse_id, to_warehouse_id, status, notes) VALUES
(1, 'TO-2024-001', 1, 2, 'completed', 'Transfer meat products to cold storage'),
(2, 'TO-2024-002', 2, 3, 'in_transit', 'Transfer ingredients to production floor'),
(3, 'TO-2024-003', 3, 1, 'submitted', 'Return excess materials to main warehouse');

-- TO Items (2-4 items per TO)
INSERT INTO transfer_order_items (id, to_id, product_id, quantity) VALUES
-- TO-2024-001 items
(1, 1, 1, 100.0),
(2, 1, 2, 75.0),
(3, 1, 6, 25.0),

-- TO-2024-002 items
(4, 2, 3, 50.0),
(5, 2, 5, 25.0),
(6, 2, 8, 10.0),
(7, 2, 9, 5.0),

-- TO-2024-003 items
(8, 3, 7, 500.0),
(9, 3, 10, 5.0);

-- SECTION 7: PRODUCTION DATA
-- =====================================================

-- Work Orders (10 WOs in various states)
INSERT INTO work_orders (id, wo_number, product_id, quantity, status, due_date, scheduled_start, scheduled_end, machine_id, kpi_scope, priority, routing_id) VALUES
-- Planned WOs
(1, 'WO-2024-001', 16, 50.0, 'planned', '2024-02-01', '2024-01-30 08:00:00', '2024-01-30 16:00:00', 1, 'PR', 3, 1),
(2, 'WO-2024-002', 17, 75.0, 'planned', '2024-02-02', '2024-01-31 08:00:00', '2024-01-31 16:00:00', 1, 'PR', 2, 2),

-- Released WOs
(3, 'WO-2024-003', 18, 100.0, 'released', '2024-02-03', '2024-02-01 08:00:00', '2024-02-01 18:00:00', 1, 'PR', 1, 3),
(4, 'WO-2024-004', 19, 200.0, 'released', '2024-02-04', '2024-02-02 08:00:00', '2024-02-02 12:00:00', 1, 'FG', 2, 4),
(5, 'WO-2024-005', 20, 150.0, 'released', '2024-02-05', '2024-02-03 08:00:00', '2024-02-03 14:00:00', 1, 'FG', 3, 5),

-- In Progress WOs
(6, 'WO-2024-006', 21, 80.0, 'in_progress', '2024-02-06', '2024-02-04 08:00:00', '2024-02-04 16:00:00', 1, 'PR', 1, 6),
(7, 'WO-2024-007', 22, 30.0, 'in_progress', '2024-02-07', '2024-02-05 08:00:00', '2024-02-05 12:00:00', 1, 'FG', 4, 7),
(8, 'WO-2024-008', 23, 60.0, 'in_progress', '2024-02-08', '2024-02-06 08:00:00', '2024-02-06 16:00:00', 1, 'PR', 2, 8),

-- Completed WOs
(9, 'WO-2024-009', 16, 40.0, 'completed', '2024-01-25', '2024-01-25 08:00:00', '2024-01-25 16:00:00', 1, 'PR', 1, 1),
(10, 'WO-2024-010', 17, 35.0, 'completed', '2024-01-26', '2024-01-26 08:00:00', '2024-01-26 16:00:00', 1, 'PR', 2, 2);

-- Update completed WOs with actual data
UPDATE work_orders SET 
    actual_start = '2024-01-25 08:15:00',
    actual_end = '2024-01-25 15:45:00',
    actual_output_qty = 38.5,
    actual_boxes = 15,
    closed_at = '2024-01-25 15:45:00'
WHERE id = 9;

UPDATE work_orders SET 
    actual_start = '2024-01-26 08:30:00',
    actual_end = '2024-01-26 15:30:00',
    actual_output_qty = 33.2,
    actual_boxes = 12,
    closed_at = '2024-01-26 15:30:00'
WHERE id = 10;

-- WO Operations (matching routing operations)
INSERT INTO wo_operations (id, wo_id, sequence, operation_name, description, machine_id, planned_input_weight, planned_output_weight, actual_input_weight, actual_output_weight, yield_percent, started_at, finished_at) VALUES
-- WO-2024-009 operations (completed)
(1, 9, 1, 'Grind Meat', 'Grind beef and fat through coarse plate', 1, 40.0, 39.5, 40.0, 39.5, 98.75, '2024-01-25 08:15:00', '2024-01-25 09:45:00'),
(2, 9, 2, 'Mix Ingredients', 'Mix ground meat with seasonings', 2, 39.5, 39.0, 39.5, 39.0, 98.73, '2024-01-25 10:00:00', '2024-01-25 10:20:00'),
(3, 9, 3, 'Fill Casings', 'Fill natural casings with meat mixture', 3, 39.0, 38.5, 39.0, 38.5, 98.72, '2024-01-25 10:30:00', '2024-01-25 15:30:00'),
(4, 9, 4, 'Package', 'Package sausages in butcher paper', 4, 38.5, 38.5, 38.5, 38.5, 100.0, '2024-01-25 15:30:00', '2024-01-25 15:45:00'),

-- WO-2024-010 operations (completed)
(5, 10, 1, 'Grind Pork', 'Grind pork through medium plate', 1, 35.0, 34.5, 35.0, 34.5, 98.57, '2024-01-26 08:30:00', '2024-01-26 09:55:00'),
(6, 10, 2, 'Season Mix', 'Mix ground pork with seasonings', 2, 34.5, 34.0, 34.5, 34.0, 98.55, '2024-01-26 10:10:00', '2024-01-26 10:25:00'),
(7, 10, 3, 'Fill Casings', 'Fill natural casings with pork mixture', 3, 34.0, 33.5, 34.0, 33.5, 98.53, '2024-01-26 10:40:00', '2024-01-26 15:20:00'),
(8, 10, 4, 'Package', 'Package sausages in butcher paper', 4, 33.5, 33.2, 33.5, 33.2, 99.10, '2024-01-26 15:20:00', '2024-01-26 15:30:00');

-- Production Outputs (for completed WOs)
INSERT INTO production_outputs (id, wo_id, product_id, quantity, uom, location_id, created_at) VALUES
(1, 9, 16, 38.5, 'kg', 2, '2024-01-25 15:45:00'),
(2, 10, 17, 33.2, 'kg', 2, '2024-01-26 15:30:00');

-- SECTION 8: WAREHOUSE DATA
-- =====================================================

-- GRNs (3 GRNs linked to POs)
INSERT INTO grns (id, grn_number, po_id, supplier_id, received_date, received_by, status, notes) VALUES
(1, 'GRN-2024-001', 1, 1, '2024-01-22', 'Warehouse User', 'received', 'Weekly meat delivery received'),
(2, 'GRN-2024-002', 3, 3, '2024-01-27', 'Warehouse User', 'received', 'Spice delivery received'),
(3, 'GRN-2024-003', 4, 4, '2024-01-15', 'Warehouse User', 'received', 'Packaging materials received');

-- GRN Items
INSERT INTO grn_items (id, grn_id, product_id, quantity_received, quantity_accepted, unit_price, expiry_date, batch_number, location_id) VALUES
-- GRN-2024-001 items
(1, 1, 1, 200.0, 200.0, 12.50, '2024-01-27', 'BEEF-001-2024', 6),
(2, 1, 2, 150.0, 150.0, 8.75, '2024-01-26', 'PORK-001-2024', 6),
(3, 1, 6, 50.0, 50.0, 3.25, '2024-01-25', 'FAT-001-2024', 6),

-- GRN-2024-002 items
(4, 2, 8, 100.0, 100.0, 6.25, '2025-01-27', 'ONION-001-2024', 1),
(5, 2, 9, 75.0, 75.0, 12.75, '2025-01-27', 'GARLIC-001-2024', 1),

-- GRN-2024-003 items
(6, 3, 7, 1000.0, 1000.0, 0.85, '2024-02-14', 'CASING-001-2024', 1),
(7, 3, 10, 20.0, 20.0, 2.50, NULL, 'PAPER-001-2024', 1);

-- License Plates (20 LPs with various stages)
INSERT INTO license_plates (id, lp_number, product_id, quantity, uom, location_id, status, qa_status, stage_suffix, created_at, created_by, batch_number) VALUES
-- Raw Material LPs (from GRNs)
(1, 'LP-2024-001', 1, 50.0, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 10:00:00', 'system', 'BEEF-001-2024'),
(2, 'LP-2024-002', 1, 50.0, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 10:15:00', 'system', 'BEEF-001-2024'),
(3, 'LP-2024-003', 1, 50.0, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 10:30:00', 'system', 'BEEF-001-2024'),
(4, 'LP-2024-004', 1, 50.0, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 10:45:00', 'system', 'BEEF-001-2024'),
(5, 'LP-2024-005', 2, 37.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 11:00:00', 'system', 'PORK-001-2024'),
(6, 'LP-2024-006', 2, 37.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 11:15:00', 'system', 'PORK-001-2024'),
(7, 'LP-2024-007', 2, 37.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 11:30:00', 'system', 'PORK-001-2024'),
(8, 'LP-2024-008', 2, 37.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 11:45:00', 'system', 'PORK-001-2024'),
(9, 'LP-2024-009', 6, 12.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 12:00:00', 'system', 'FAT-001-2024'),
(10, 'LP-2024-010', 6, 12.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 12:15:00', 'system', 'FAT-001-2024'),
(11, 'LP-2024-011', 6, 12.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 12:30:00', 'system', 'FAT-001-2024'),
(12, 'LP-2024-012', 6, 12.5, 'kg', 6, 'available', 'passed', 'RM', '2024-01-22 12:45:00', 'system', 'FAT-001-2024'),

-- Processed/Finished Good LPs (from production)
(13, 'LP-2024-013', 16, 19.25, 'kg', 2, 'available', 'passed', 'FG', '2024-01-25 15:45:00', 'system', 'WO-2024-009'),
(14, 'LP-2024-014', 16, 19.25, 'kg', 2, 'available', 'passed', 'FG', '2024-01-25 15:45:00', 'system', 'WO-2024-009'),
(15, 'LP-2024-015', 17, 16.6, 'kg', 2, 'available', 'passed', 'FG', '2024-01-26 15:30:00', 'system', 'WO-2024-010'),
(16, 'LP-2024-016', 17, 16.6, 'kg', 2, 'available', 'passed', 'FG', '2024-01-26 15:30:00', 'system', 'WO-2024-010'),

-- Various status LPs for testing
(17, 'LP-2024-017', 8, 25.0, 'kg', 1, 'quarantine', 'quarantine', 'RM', '2024-01-27 09:00:00', 'system', 'ONION-001-2024'),
(18, 'LP-2024-018', 9, 18.75, 'kg', 1, 'available', 'passed', 'RM', '2024-01-27 09:15:00', 'system', 'GARLIC-001-2024'),
(19, 'LP-2024-019', 7, 250.0, 'm', 1, 'available', 'passed', 'RM', '2024-01-15 14:00:00', 'system', 'CASING-001-2024'),
(20, 'LP-2024-020', 10, 5.0, 'roll', 1, 'available', 'passed', 'RM', '2024-01-15 14:15:00', 'system', 'PAPER-001-2024');

-- Stock Moves (15 moves: receipts, transfers, consumption)
INSERT INTO stock_moves (id, move_number, product_id, from_location_id, to_location_id, quantity, uom, move_type, move_source, move_status, reference_type, reference_id, created_at, created_by) VALUES
-- GRN receipts (GRN_IN)
(1, 'SM-2024-001', 1, NULL, 6, 200.0, 'kg', 'GRN_IN', 'portal', 'completed', 'grn', 1, '2024-01-22 10:00:00', 'warehouse_user'),
(2, 'SM-2024-002', 2, NULL, 6, 150.0, 'kg', 'GRN_IN', 'portal', 'completed', 'grn', 1, '2024-01-22 10:00:00', 'warehouse_user'),
(3, 'SM-2024-003', 6, NULL, 6, 50.0, 'kg', 'GRN_IN', 'portal', 'completed', 'grn', 1, '2024-01-22 10:00:00', 'warehouse_user'),
(4, 'SM-2024-004', 8, NULL, 1, 100.0, 'kg', 'GRN_IN', 'portal', 'completed', 'grn', 2, '2024-01-27 09:00:00', 'warehouse_user'),
(5, 'SM-2024-005', 9, NULL, 1, 75.0, 'kg', 'GRN_IN', 'portal', 'completed', 'grn', 2, '2024-01-27 09:00:00', 'warehouse_user'),

-- Transfers (TRANSFER)
(6, 'SM-2024-006', 1, 6, 11, 100.0, 'kg', 'TRANSFER', 'portal', 'completed', 'transfer_order', 1, '2024-01-23 08:00:00', 'warehouse_user'),
(7, 'SM-2024-007', 2, 6, 11, 75.0, 'kg', 'TRANSFER', 'portal', 'completed', 'transfer_order', 1, '2024-01-23 08:00:00', 'warehouse_user'),
(8, 'SM-2024-008', 6, 6, 11, 25.0, 'kg', 'TRANSFER', 'portal', 'completed', 'transfer_order', 1, '2024-01-23 08:00:00', 'warehouse_user'),

-- Work Order Issues (WO_ISSUE)
(9, 'SM-2024-009', 1, 11, NULL, 40.0, 'kg', 'WO_ISSUE', 'portal', 'completed', 'work_order', 9, '2024-01-25 08:00:00', 'production_user'),
(10, 'SM-2024-010', 6, 11, NULL, 10.0, 'kg', 'WO_ISSUE', 'portal', 'completed', 'work_order', 9, '2024-01-25 08:00:00', 'production_user'),
(11, 'SM-2024-011', 2, 11, NULL, 35.0, 'kg', 'WO_ISSUE', 'portal', 'completed', 'work_order', 10, '2024-01-26 08:00:00', 'production_user'),

-- Work Order Outputs (WO_OUTPUT)
(12, 'SM-2024-012', 16, NULL, 2, 38.5, 'kg', 'WO_OUTPUT', 'portal', 'completed', 'work_order', 9, '2024-01-25 15:45:00', 'production_user'),
(13, 'SM-2024-013', 17, NULL, 2, 33.2, 'kg', 'WO_OUTPUT', 'portal', 'completed', 'work_order', 10, '2024-01-26 15:30:00', 'production_user'),

-- Adjustments (ADJUST)
(14, 'SM-2024-014', 1, 11, NULL, 2.5, 'kg', 'ADJUST', 'portal', 'completed', 'adjustment', NULL, '2024-01-27 10:00:00', 'warehouse_user'),
(15, 'SM-2024-015', 2, 11, NULL, 1.8, 'kg', 'ADJUST', 'portal', 'completed', 'adjustment', NULL, '2024-01-27 10:15:00', 'warehouse_user');

-- SECTION 9: TRACEABILITY CHAIN
-- =====================================================

-- LP Genealogy (link LPs to their sources)
INSERT INTO lp_genealogy (id, child_lp_id, parent_lp_id, quantity_consumed, uom, wo_id, operation_sequence) VALUES
-- WO-2024-009 consumed LP-2024-001 and LP-2024-009
(1, 13, 1, 40.0, 'kg', 9, 1),
(2, 14, 1, 10.0, 'kg', 9, 1),
(3, 13, 9, 10.0, 'kg', 9, 1),
(4, 14, 9, 2.5, 'kg', 9, 1),

-- WO-2024-010 consumed LP-2024-005
(5, 15, 5, 35.0, 'kg', 10, 1),
(6, 16, 5, 35.0, 'kg', 10, 1);

-- Update LP consumption tracking
UPDATE license_plates SET consumed_by_wo_id = 9, consumed_at = '2024-01-25 08:00:00' WHERE id IN (1, 9);
UPDATE license_plates SET consumed_by_wo_id = 10, consumed_at = '2024-01-26 08:00:00' WHERE id = 5;

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================
-- This seed data provides:
-- - 5 suppliers with realistic product catalogs
-- - 3 warehouses with 15 locations
-- - 23 products (10 RM, 5 PR, 8 FG) with allergen mapping
-- - 8 complete BOMs with routings and operations
-- - 5 purchase orders in various states
-- - 3 transfer orders between warehouses
-- - 10 work orders across all statuses
-- - 3 GRNs with license plates
-- - 20 license plates with genealogy tracking
-- - 15 stock moves showing material flow
-- - Complete traceability chain for testing

-- Test scenarios enabled:
-- 1. Complete production flow: PO-2024-001 → GRN-2024-001 → LP-2024-001 → WO-2024-009 → LP-2024-013
-- 2. Multi-stage production: LP-2024-005 → WO-2024-010 → LP-2024-015
-- 3. Warehouse operations: TO-2024-001 transfers materials between warehouses
-- 4. QA processes: LP-2024-017 in quarantine for testing
-- 5. Yield calculations: WO operations with actual weights and yields
-- 6. Traceability: Forward and backward trace through LP genealogy
