-- Migration 036: Phase 1 Planning Seed Data
-- Purpose: Insert test data for Planning Module development and testing
-- Date: 2025-01-21

-- =============================================
-- 1. SEED SUPPLIERS
-- =============================================

INSERT INTO suppliers (
  name, legal_name, vat_number, country, currency, payment_terms, 
  incoterms, lead_time_days, email, phone, address, is_active
) VALUES 
(
  'Meat Supplier A', 'Meat Supplier A Ltd', 'VAT123456789', 'Poland', 
  'PLN', 'Net 30', 'FOB', 7, 'contact@meatsuppliera.pl', '+48 123 456 789',
  '{"street": "Meat Street 1", "city": "Warsaw", "postal_code": "00-001", "country": "Poland"}',
  true
),
(
  'Dry Goods Supplier B', 'Dry Goods B Sp. z o.o.', 'VAT987654321', 'Poland',
  'PLN', 'Net 15', 'CIF', 3, 'orders@drygoodsb.pl', '+48 987 654 321',
  '{"street": "Dry Street 5", "city": "Krakow", "postal_code": "30-001", "country": "Poland"}',
  true
),
(
  'Packaging Supplier C', 'Packaging C Ltd', 'VAT555666777', 'Germany',
  'EUR', 'Net 45', 'EXW', 14, 'info@packagingc.de', '+49 30 12345678',
  '{"street": "Packaging Strasse 10", "city": "Berlin", "postal_code": "10115", "country": "Germany"}',
  true
);

-- =============================================
-- 2. SEED WAREHOUSES
-- =============================================

INSERT INTO warehouses (code, name, is_active) VALUES 
('WH1', 'Main Warehouse', true),
('WH2', 'Cold Storage', true),
('WH3', 'Packaging Storage', true);

-- =============================================
-- 3. SEED LOCATIONS
-- =============================================

INSERT INTO locations (warehouse_id, code, name, type, is_active) VALUES 
-- Main Warehouse locations
(1, 'A-01-01', 'Aisle A, Rack 1, Level 1', 'RACK', true),
(1, 'A-01-02', 'Aisle A, Rack 1, Level 2', 'RACK', true),
(1, 'A-02-01', 'Aisle A, Rack 2, Level 1', 'RACK', true),
(1, 'B-01-01', 'Aisle B, Rack 1, Level 1', 'RACK', true),
(1, 'RECEIVING', 'Receiving Dock', 'DOCK', true),
(1, 'SHIPPING', 'Shipping Dock', 'DOCK', true),

-- Cold Storage locations
(2, 'C-01-01', 'Cold Aisle C, Rack 1, Level 1', 'RACK', true),
(2, 'C-01-02', 'Cold Aisle C, Rack 1, Level 2', 'RACK', true),
(2, 'C-02-01', 'Cold Aisle C, Rack 2, Level 1', 'RACK', true),

-- Packaging Storage locations
(3, 'P-01-01', 'Packaging Aisle P, Rack 1, Level 1', 'RACK', true),
(3, 'P-01-02', 'Packaging Aisle P, Rack 1, Level 2', 'RACK', true);

-- =============================================
-- 4. SEED PRODUCTS (if not already exist)
-- =============================================

-- Check if products exist, if not create some
INSERT INTO products (
  part_number, description, type, uom, is_active, 
  preferred_supplier_id, lead_time_days, moq, std_price
) 
SELECT * FROM (VALUES 
  ('MEAT-001', 'Fresh Beef - Premium Cut', 'RM', 'KG', true, 1, 7, 50.0, 25.50),
  ('MEAT-002', 'Fresh Pork - Shoulder', 'RM', 'KG', true, 1, 7, 30.0, 18.75),
  ('DG-001', 'Salt - Fine Grain', 'DG', 'KG', true, 2, 3, 100.0, 2.50),
  ('DG-002', 'Black Pepper - Ground', 'DG', 'KG', true, 2, 3, 25.0, 45.00),
  ('DG-003', 'Garlic Powder', 'DG', 'KG', true, 2, 3, 20.0, 35.00),
  ('PKG-001', 'Vacuum Bags - 500ml', 'DG', 'PCS', true, 3, 14, 1000.0, 0.15),
  ('PKG-002', 'Labels - Meat Products', 'DG', 'PCS', true, 3, 14, 5000.0, 0.05),
  ('PKG-003', 'Boxes - Standard 30x20x10', 'DG', 'PCS', true, 3, 14, 100.0, 2.00)
) AS t(part_number, description, type, uom, is_active, preferred_supplier_id, lead_time_days, moq, std_price)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE part_number = t.part_number);

-- =============================================
-- 5. SEED SAMPLE POs
-- =============================================

-- Create sample PO headers
INSERT INTO po_header (
  number, supplier_id, status, currency, exchange_rate, order_date,
  requested_delivery_date, promised_delivery_date, snapshot_supplier_name,
  snapshot_supplier_vat, snapshot_supplier_address, net_total, vat_total, gross_total,
  created_by, approved_by
) VALUES 
(
  'PO-2025-001', 1, 'draft', 'PLN', 1.0, '2025-01-21',
  '2025-01-28', '2025-01-30', 'Meat Supplier A',
  'VAT123456789', '{"street": "Meat Street 1", "city": "Warsaw", "postal_code": "00-001", "country": "Poland"}',
  0, 0, 0, (SELECT id FROM users LIMIT 1), NULL
),
(
  'PO-2025-002', 2, 'approved', 'PLN', 1.0, '2025-01-20',
  '2025-01-25', '2025-01-27', 'Dry Goods Supplier B',
  'VAT987654321', '{"street": "Dry Street 5", "city": "Krakow", "postal_code": "30-001", "country": "Poland"}',
  0, 0, 0, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)
),
(
  'PO-2025-003', 3, 'closed', 'EUR', 4.5, '2025-01-15',
  '2025-01-22', '2025-01-25', 'Packaging Supplier C',
  'VAT555666777', '{"street": "Packaging Strasse 10", "city": "Berlin", "postal_code": "10115", "country": "Germany"}',
  0, 0, 0, (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)
);

-- Create sample PO lines
INSERT INTO po_line (
  po_id, line_no, item_id, uom, qty_ordered, qty_received, unit_price, vat_rate,
  requested_delivery_date, promised_delivery_date, default_location_id
) VALUES 
-- PO-2025-001 lines (draft)
(1, 1, (SELECT id FROM products WHERE part_number = 'MEAT-001'), 'KG', 100.0, 0, 25.50, 23.0, '2025-01-28', '2025-01-30', (SELECT id FROM locations WHERE code = 'A-01-01')),
(1, 2, (SELECT id FROM products WHERE part_number = 'MEAT-002'), 'KG', 50.0, 0, 18.75, 23.0, '2025-01-28', '2025-01-30', (SELECT id FROM locations WHERE code = 'A-01-02')),

-- PO-2025-002 lines (approved)
(2, 1, (SELECT id FROM products WHERE part_number = 'DG-001'), 'KG', 200.0, 0, 2.50, 23.0, '2025-01-25', '2025-01-27', (SELECT id FROM locations WHERE code = 'A-02-01')),
(2, 2, (SELECT id FROM products WHERE part_number = 'DG-002'), 'KG', 10.0, 0, 45.00, 23.0, '2025-01-25', '2025-01-27', (SELECT id FROM locations WHERE code = 'A-02-01')),
(2, 3, (SELECT id FROM products WHERE part_number = 'DG-003'), 'KG', 15.0, 0, 35.00, 23.0, '2025-01-25', '2025-01-27', (SELECT id FROM locations WHERE code = 'A-02-01')),

-- PO-2025-003 lines (closed)
(3, 1, (SELECT id FROM products WHERE part_number = 'PKG-001'), 'PCS', 5000.0, 5000.0, 0.15, 23.0, '2025-01-22', '2025-01-25', (SELECT id FROM locations WHERE code = 'P-01-01')),
(3, 2, (SELECT id FROM products WHERE part_number = 'PKG-002'), 'PCS', 10000.0, 10000.0, 0.05, 23.0, '2025-01-22', '2025-01-25', (SELECT id FROM locations WHERE code = 'P-01-02'));

-- =============================================
-- 6. SEED SAMPLE TOs
-- =============================================

-- Create sample TO headers
INSERT INTO to_header (
  number, status, from_wh_id, to_wh_id, requested_date,
  created_by, approved_by
) VALUES 
(
  'TO-2025-001', 'draft', 1, 2, '2025-01-25',
  (SELECT id FROM users LIMIT 1), NULL
),
(
  'TO-2025-002', 'approved', 2, 1, '2025-01-24',
  (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)
),
(
  'TO-2025-003', 'closed', 3, 1, '2025-01-20',
  (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1)
);

-- Create sample TO lines
INSERT INTO to_line (
  to_id, line_no, item_id, uom, qty_planned, qty_moved, from_location_id, to_location_id,
  scan_required, approved_line
) VALUES 
-- TO-2025-001 lines (draft)
(1, 1, (SELECT id FROM products WHERE part_number = 'MEAT-001'), 'KG', 50.0, 0, 
 (SELECT id FROM locations WHERE code = 'A-01-01'), (SELECT id FROM locations WHERE code = 'C-01-01'), true, false),
(1, 2, (SELECT id FROM products WHERE part_number = 'MEAT-002'), 'KG', 25.0, 0,
 (SELECT id FROM locations WHERE code = 'A-01-02'), (SELECT id FROM locations WHERE code = 'C-01-02'), true, false),

-- TO-2025-002 lines (approved)
(2, 1, (SELECT id FROM products WHERE part_number = 'DG-001'), 'KG', 100.0, 0,
 (SELECT id FROM locations WHERE code = 'A-02-01'), (SELECT id FROM locations WHERE code = 'A-01-01'), false, true),
(2, 2, (SELECT id FROM products WHERE part_number = 'DG-002'), 'KG', 5.0, 0,
 (SELECT id FROM locations WHERE code = 'A-02-01'), (SELECT id FROM locations WHERE code = 'A-01-01'), false, true),

-- TO-2025-003 lines (closed)
(3, 1, (SELECT id FROM products WHERE part_number = 'PKG-001'), 'PCS', 1000.0, 1000.0,
 (SELECT id FROM locations WHERE code = 'P-01-01'), (SELECT id FROM locations WHERE code = 'A-01-01'), true, true),
(3, 2, (SELECT id FROM products WHERE part_number = 'PKG-002'), 'PCS', 2000.0, 2000.0,
 (SELECT id FROM locations WHERE code = 'P-01-02'), (SELECT id FROM locations WHERE code = 'A-01-01'), true, true);

-- =============================================
-- 7. SEED SAMPLE AUDIT LOGS
-- =============================================

INSERT INTO audit_log (
  entity, entity_id, action, before, after, actor_id
) VALUES 
(
  'po_header', 2, 'approve', 
  '{"status": "draft"}', 
  '{"status": "approved", "approved_by": "' || (SELECT id FROM users LIMIT 1) || '"}',
  (SELECT id FROM users LIMIT 1)
),
(
  'po_header', 3, 'close',
  '{"status": "approved"}',
  '{"status": "closed", "close_reason": "All items received"}',
  (SELECT id FROM users LIMIT 1)
),
(
  'to_header', 2, 'approve',
  '{"status": "draft"}',
  '{"status": "approved", "approved_by": "' || (SELECT id FROM users LIMIT 1) || '"}',
  (SELECT id FROM users LIMIT 1)
),
(
  'to_header', 3, 'close',
  '{"status": "approved"}',
  '{"status": "closed", "close_reason": "Transfer completed"}',
  (SELECT id FROM users LIMIT 1)
);

-- =============================================
-- 8. UPDATE TOTALS FOR EXISTING POs
-- =============================================

-- Update PO totals from lines
UPDATE po_header 
SET 
  net_total = COALESCE((
    SELECT SUM(pl.qty_ordered * pl.unit_price) 
    FROM po_line pl 
    WHERE pl.po_id = po_header.id
  ), 0),
  vat_total = COALESCE((
    SELECT SUM(pl.qty_ordered * pl.unit_price * pl.vat_rate / 100) 
    FROM po_line pl 
    WHERE pl.po_id = po_header.id
  ), 0),
  gross_total = COALESCE((
    SELECT SUM(pl.qty_ordered * pl.unit_price * (1 + pl.vat_rate / 100)) 
    FROM po_line pl 
    WHERE pl.po_id = po_header.id
  ), 0)
WHERE net_total IS NULL;

-- =============================================
-- 9. VALIDATION QUERIES
-- =============================================

-- Verify seed data
DO $$
DECLARE
  supplier_count INTEGER;
  warehouse_count INTEGER;
  location_count INTEGER;
  product_count INTEGER;
  po_count INTEGER;
  po_line_count INTEGER;
  to_count INTEGER;
  to_line_count INTEGER;
  audit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO supplier_count FROM suppliers WHERE is_active = true;
  SELECT COUNT(*) INTO warehouse_count FROM warehouses WHERE is_active = true;
  SELECT COUNT(*) INTO location_count FROM locations WHERE is_active = true;
  SELECT COUNT(*) INTO product_count FROM products WHERE is_active = true;
  SELECT COUNT(*) INTO po_count FROM po_header;
  SELECT COUNT(*) INTO po_line_count FROM po_line;
  SELECT COUNT(*) INTO to_count FROM to_header;
  SELECT COUNT(*) INTO to_line_count FROM to_line;
  SELECT COUNT(*) INTO audit_count FROM audit_log;
  
  RAISE NOTICE 'Phase 1 Planning seed data completed:';
  RAISE NOTICE 'Suppliers: %', supplier_count;
  RAISE NOTICE 'Warehouses: %', warehouse_count;
  RAISE NOTICE 'Locations: %', location_count;
  RAISE NOTICE 'Products: %', product_count;
  RAISE NOTICE 'PO Headers: %', po_count;
  RAISE NOTICE 'PO Lines: %', po_line_count;
  RAISE NOTICE 'TO Headers: %', to_count;
  RAISE NOTICE 'TO Lines: %', to_line_count;
  RAISE NOTICE 'Audit Logs: %', audit_count;
END $$;
