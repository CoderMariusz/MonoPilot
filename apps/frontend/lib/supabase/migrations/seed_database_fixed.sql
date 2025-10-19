-- =====================================================
-- FIXED SEED DATA FOR MONOPILOT - PROPER CATEGORIES
-- =====================================================
-- This script populates the database with correct category distribution

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

-- Allergens (8 common allergens)
INSERT INTO allergens (id, code, name, description) VALUES
(1, 'GLUTEN', 'Gluten', 'Contains gluten from wheat, barley, rye'),
(2, 'DAIRY', 'Dairy', 'Contains milk and milk products'),
(3, 'EGGS', 'Eggs', 'Contains eggs and egg products'),
(4, 'NUTS', 'Nuts', 'Contains tree nuts'),
(5, 'PEANUTS', 'Peanuts', 'Contains peanuts'),
(6, 'SOY', 'Soy', 'Contains soy and soy products'),
(7, 'FISH', 'Fish', 'Contains fish and fish products'),
(8, 'SHELLFISH', 'Shellfish', 'Contains shellfish and crustaceans');

-- Machines (5 production machines)
INSERT INTO machines (id, code, name, type, is_active) VALUES
(1, 'GRIND-001', 'Meat Grinder 1', 'grinder', true),
(2, 'MIX-001', 'Meat Mixer 1', 'mixer', true),
(3, 'STUFF-001', 'Sausage Stuffer 1', 'stuffer', true),
(4, 'COOK-001', 'Cooking Oven 1', 'oven', true),
(5, 'PACK-001', 'Packaging Line 1', 'packaging', true);

-- SECTION 2: PRODUCTS WITH CORRECT CATEGORIES
-- =====================================================

-- MEAT CATEGORY - Raw Materials (Meat only)
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
(1, 'RM-BEEF-001', 'Premium Beef Trim', 'RM', 'MEAT', 'RM_MEAT', 'Beef', 'kg', 'use_by', 5, true),
(2, 'RM-BEEF-002', 'Beef Chuck', 'RM', 'MEAT', 'RM_MEAT', 'Beef', 'kg', 'use_by', 5, true),
(3, 'RM-BEEF-003', 'Beef Fat', 'RM', 'MEAT', 'RM_MEAT', 'Beef', 'kg', 'use_by', 3, true),
(4, 'RM-PORK-001', 'Pork Shoulder', 'RM', 'MEAT', 'RM_MEAT', 'Pork', 'kg', 'use_by', 4, true),
(5, 'RM-PORK-002', 'Pork Belly', 'RM', 'MEAT', 'RM_MEAT', 'Pork', 'kg', 'use_by', 4, true),
(6, 'RM-LAMB-001', 'Lamb Shoulder', 'RM', 'MEAT', 'RM_MEAT', 'Lamb', 'kg', 'use_by', 3, true),
(7, 'RM-CHICKEN-001', 'Chicken Thighs', 'RM', 'MEAT', 'RM_MEAT', 'Chicken', 'kg', 'use_by', 2, true);

-- DRYGOODS CATEGORY - Ingredients, Labels, Webs, Boxes, Sauces
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
-- Ingredients
(8, 'DG-SALT-001', 'Table Salt', 'RM', 'DRYGOODS', 'DG_ING', 'Salt', 'kg', 'best_before', 365, true),
(9, 'DG-PEPPER-001', 'Black Pepper Ground', 'RM', 'DRYGOODS', 'DG_ING', 'Pepper', 'kg', 'best_before', 730, true),
(10, 'DG-SPICE-001', 'Mixed Spices', 'RM', 'DRYGOODS', 'DG_ING', 'Spices', 'kg', 'best_before', 365, true),
(11, 'DG-ONION-001', 'Dried Onion Powder', 'RM', 'DRYGOODS', 'DG_ING', 'Onion', 'kg', 'best_before', 730, true),
(12, 'DG-GARLIC-001', 'Garlic Powder', 'RM', 'DRYGOODS', 'DG_ING', 'Garlic', 'kg', 'best_before', 365, true),
(13, 'DG-PAPRIKA-001', 'Paprika Powder', 'RM', 'DRYGOODS', 'DG_ING', 'Spices', 'kg', 'best_before', 365, true),

-- Labels
(14, 'DG-LABEL-001', 'Product Label Small', 'RM', 'DRYGOODS', 'DG_LABEL', 'Label', 'pcs', 'indefinite', 0, true),
(15, 'DG-LABEL-002', 'Product Label Large', 'RM', 'DRYGOODS', 'DG_LABEL', 'Label', 'pcs', 'indefinite', 0, true),
(16, 'DG-LABEL-003', 'Allergen Warning Label', 'RM', 'DRYGOODS', 'DG_LABEL', 'Label', 'pcs', 'indefinite', 0, true),

-- Webs/Casings
(17, 'DG-WEB-001', 'Natural Hog Casings', 'RM', 'DRYGOODS', 'DG_WEB', 'Casing', 'm', 'use_by', 30, true),
(18, 'DG-WEB-002', 'Collagen Casings', 'RM', 'DRYGOODS', 'DG_WEB', 'Casing', 'm', 'use_by', 90, true),
(19, 'DG-WEB-003', 'Synthetic Casings', 'RM', 'DRYGOODS', 'DG_WEB', 'Casing', 'm', 'indefinite', 0, true),

-- Boxes
(20, 'DG-BOX-001', 'Small Product Box', 'RM', 'DRYGOODS', 'DG_BOX', 'Box', 'pcs', 'indefinite', 0, true),
(21, 'DG-BOX-002', 'Large Product Box', 'RM', 'DRYGOODS', 'DG_BOX', 'Box', 'pcs', 'indefinite', 0, true),
(22, 'DG-BOX-003', 'Shipping Box', 'RM', 'DRYGOODS', 'DG_BOX', 'Box', 'pcs', 'indefinite', 0, true),

-- Sauces
(23, 'DG-SAUCE-001', 'BBQ Sauce', 'RM', 'DRYGOODS', 'DG_SAUCE', 'Sauce', 'kg', 'use_by', 180, true),
(24, 'DG-SAUCE-002', 'Hot Sauce', 'RM', 'DRYGOODS', 'DG_SAUCE', 'Sauce', 'kg', 'use_by', 365, true),
(25, 'DG-SAUCE-003', 'Mustard', 'RM', 'DRYGOODS', 'DG_SAUCE', 'Sauce', 'kg', 'use_by', 180, true);

-- PROCESS CATEGORY - Process/Intermediate Products
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
(26, 'PR-GRIND-001', 'Ground Beef Mix', 'PR', 'COMPOSITE', 'PR', 'Ground', 'kg', 'use_by', 2, true),
(27, 'PR-MIX-001', 'Seasoned Meat Mix', 'PR', 'COMPOSITE', 'PR', 'Mixed', 'kg', 'use_by', 1, true),
(28, 'PR-FILL-001', 'Sausage Filling', 'PR', 'COMPOSITE', 'PR', 'Filling', 'kg', 'use_by', 1, true),
(29, 'PR-COOK-001', 'Cooked Sausage', 'PR', 'COMPOSITE', 'PR', 'Cooked', 'kg', 'use_by', 3, true),
(30, 'PR-CHILL-001', 'Chilled Product', 'PR', 'COMPOSITE', 'PR', 'Chilled', 'kg', 'use_by', 7, true),
(31, 'PR-SMOKE-001', 'Smoked Meat', 'PR', 'COMPOSITE', 'PR', 'Smoked', 'kg', 'use_by', 14, true),
(32, 'PR-MARINATE-001', 'Marinated Meat', 'PR', 'COMPOSITE', 'PR', 'Marinated', 'kg', 'use_by', 3, true);

-- FINISHED_GOODS CATEGORY - Final Products (FG only)
INSERT INTO products (id, part_number, description, type, product_group, product_type, subtype, uom, expiry_policy, shelf_life_days, is_active) VALUES
(33, 'FG-SAUS-001', 'Premium Beef Sausage', 'FG', 'COMPOSITE', 'FG', 'Beef', 'kg', 'use_by', 5, true),
(34, 'FG-SAUS-002', 'Classic Pork Sausage', 'FG', 'COMPOSITE', 'FG', 'Pork', 'kg', 'use_by', 5, true),
(35, 'FG-SAUS-003', 'Mixed Meat Sausage', 'FG', 'COMPOSITE', 'FG', 'Mixed', 'kg', 'use_by', 5, true),
(36, 'FG-BURG-001', 'Beef Burger Patty', 'FG', 'COMPOSITE', 'FG', 'Beef', 'piece', 'use_by', 3, true),
(37, 'FG-BURG-002', 'Mixed Burger Patty', 'FG', 'COMPOSITE', 'FG', 'Mixed', 'piece', 'use_by', 3, true),
(38, 'FG-MEAT-001', 'Seasoned Ground Beef', 'FG', 'COMPOSITE', 'FG', 'Ground', 'kg', 'use_by', 2, true),
(39, 'FG-MEAT-002', 'Premium Steak', 'FG', 'COMPOSITE', 'FG', 'Steak', 'kg', 'use_by', 5, true),
(40, 'FG-MEAT-003', 'Marinated Chicken', 'FG', 'COMPOSITE', 'FG', 'Chicken', 'kg', 'use_by', 3, true),
(41, 'FG-SALAMI-001', 'Italian Salami', 'FG', 'COMPOSITE', 'FG', 'Salami', 'kg', 'use_by', 30, true),
(42, 'FG-HAM-001', 'Smoked Ham', 'FG', 'COMPOSITE', 'FG', 'Ham', 'kg', 'use_by', 7, true);

-- Product Allergens (link products to allergens)
INSERT INTO product_allergens (product_id, allergen_id) VALUES
-- Mixed products contain gluten (from potential breadcrumbs)
(27, 1), -- Seasoned Meat Mix
(35, 1), -- Mixed Meat Sausage
(37, 1), -- Mixed Burger Patty
-- Spices might contain traces of various allergens
(10, 8),  -- Mixed Spices - Nuts
(11, 8),  -- Onion Powder - Nuts
(12, 8),  -- Garlic Powder - Nuts
(13, 8),  -- Paprika Powder - Nuts
-- Sauces might contain allergens
(23, 1),  -- BBQ Sauce - Gluten
(24, 1),  -- Hot Sauce - Gluten
(25, 1);  -- Mustard - Gluten

-- SECTION 3: BOM DATA
-- =====================================================

-- Create BOMs for finished goods
INSERT INTO bom (id, product_id, version, status, is_active, requires_routing, notes) VALUES
(1, 33, '1.0', 'active', true, true, 'Premium Beef Sausage BOM'),
(2, 34, '1.0', 'active', true, true, 'Classic Pork Sausage BOM'),
(3, 35, '1.0', 'active', true, true, 'Mixed Meat Sausage BOM'),
(4, 36, '1.0', 'active', true, true, 'Beef Burger Patty BOM'),
(5, 37, '1.0', 'active', true, true, 'Mixed Burger Patty BOM');

-- BOM Items for Premium Beef Sausage
INSERT INTO bom_items (bom_id, material_id, quantity, uom, sequence, priority, production_lines, scrap_std_pct, is_optional, is_phantom, one_to_one, unit_cost_std) VALUES
(1, 1, 0.8, 'kg', 1, 1, ARRAY['P-01', 'P-02'], 0.05, false, false, false, 12.50),
(1, 3, 0.2, 'kg', 2, 1, ARRAY['P-01', 'P-02'], 0.02, false, false, false, 8.00),
(1, 8, 0.02, 'kg', 3, 2, ARRAY['P-01', 'P-02'], 0.01, false, false, false, 2.00),
(1, 9, 0.01, 'kg', 4, 2, ARRAY['P-01', 'P-02'], 0.01, false, false, false, 15.00),
(1, 10, 0.005, 'kg', 5, 2, ARRAY['P-01', 'P-02'], 0.01, false, false, false, 25.00),
(1, 17, 0.5, 'm', 6, 3, ARRAY['P-03'], 0.1, false, false, false, 0.50);

-- BOM Items for Classic Pork Sausage
INSERT INTO bom_items (bom_id, material_id, quantity, uom, sequence, priority, production_lines, scrap_std_pct, is_optional, is_phantom, one_to_one, unit_cost_std) VALUES
(2, 4, 0.7, 'kg', 1, 1, ARRAY['P-01', 'P-02'], 0.05, false, false, false, 10.50),
(2, 3, 0.3, 'kg', 2, 1, ARRAY['P-01', 'P-02'], 0.02, false, false, false, 8.00),
(2, 8, 0.02, 'kg', 3, 2, ARRAY['P-01', 'P-02'], 0.01, false, false, false, 2.00),
(2, 9, 0.01, 'kg', 4, 2, ARRAY['P-01', 'P-02'], 0.01, false, false, false, 15.00),
(2, 10, 0.005, 'kg', 5, 2, ARRAY['P-01', 'P-02'], 0.01, false, false, false, 25.00),
(2, 17, 0.5, 'm', 6, 3, ARRAY['P-03'], 0.1, false, false, false, 0.50);

-- SECTION 4: ROUTING DATA
-- =====================================================

-- Create routings for products
INSERT INTO routings (id, name, product_id, is_active, notes) VALUES
(1, 'Beef Sausage Production', 33, true, 'Standard routing for beef sausage production'),
(2, 'Pork Sausage Production', 34, true, 'Standard routing for pork sausage production'),
(3, 'Burger Patty Production', 36, true, 'Standard routing for burger patty production');

-- Routing operations
INSERT INTO routing_operations (id, routing_id, seq_no, name, code, description, requirements) VALUES
(1, 1, 1, 'Preparation', 'PREP', 'Prepare materials and setup', ARRAY['Clean', 'Sanitize']),
(2, 1, 2, 'Grinding', 'GRIND', 'Grind meat to desired consistency', ARRAY['Grind', 'Mix']),
(3, 1, 3, 'Seasoning', 'SEASON', 'Add spices and seasonings', ARRAY['Mix', 'Season']),
(4, 1, 4, 'Stuffing', 'STUFF', 'Stuff into casings', ARRAY['Stuff', 'Link']),
(5, 1, 5, 'Cooking', 'COOK', 'Cook to proper temperature', ARRAY['Cook', 'Smoke']),
(6, 1, 6, 'Cooling', 'COOL', 'Cool to storage temperature', ARRAY['Cool', 'Chill']),
(7, 1, 7, 'Packaging', 'PACK', 'Package for distribution', ARRAY['Pack', 'Label']);

-- SECTION 5: SUMMARY
-- =====================================================
-- MEAT: 7 products (RM_MEAT)
-- DRYGOODS: 18 products (DG_ING, DG_LABEL, DG_WEB, DG_BOX, DG_SAUCE)
-- PROCESS: 7 products (PR)
-- FINISHED_GOODS: 10 products (FG)
-- TOTAL: 42 products with proper categorization
