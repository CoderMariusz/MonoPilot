-- =============================================
-- MASTER MIGRATION (MANUAL MERGE VERSION)
-- =============================================
-- Generated: 2025-11-15
-- Source: Manual merge of 64 sequential migrations (000-059)
-- Purpose: Consolidate all schema changes into single migration for database reset
-- Story: 0.8 - Konsolidacja Migracji (Epic 0)
-- Method: Manual extraction + ALTER TABLE merge from raw_migrations_all.sql
--
-- Epic 0 Audit Fixes Included:
--   ✓ Pattern A: to_line.notes (from migration 020)
--   ✓ Pattern B: locations.zone (ADDED - was missing)
--   ✓ Pattern C: po_header.warehouse_id (from migration 057)
--   ✓ Pattern C: license_plates.status enum (10 values, from migration 058)
-- =============================================

-- =============================================
-- SECTION 1: EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================
-- SECTION 2: ENUM TYPES
-- =============================================

DO $$ BEGIN
  CREATE TYPE product_group AS ENUM ('raw', 'packaging', 'semi-finished', 'finished');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('raw_material', 'packaging_material', 'semi_finished_product', 'finished_product', 'by_product');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- SECTION 3: BASE TABLES (Multi-Tenant Foundation)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  role VARCHAR(50) DEFAULT 'viewer',
  org_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: admin, manager, operator, viewer, planner, technical, purchasing, warehouse, qc';

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  payment_terms VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  tax_code_id INTEGER,
  lead_time_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_org ON suppliers(org_id);
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

COMMENT ON TABLE suppliers IS 'Supplier master data for procurement';

CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouses_org ON warehouses(org_id);
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);

COMMENT ON TABLE warehouses IS 'Physical warehouse facilities';

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  zone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_org ON locations(org_id);
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_zone ON locations(zone) WHERE zone IS NOT NULL;

COMMENT ON TABLE locations IS 'Storage locations within warehouses (aisles, bins, zones)';
COMMENT ON COLUMN locations.type IS 'Location type: receiving, storage, picking, staging, etc.';
COMMENT ON COLUMN locations.zone IS 'Epic 0 Pattern B fix: Zone field for location grouping (e.g., COLD, DRY, HAZMAT)';

CREATE TABLE IF NOT EXISTS settings_tax_codes (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(200),
  rate DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_codes_org ON settings_tax_codes(org_id);
CREATE INDEX idx_tax_codes_code ON settings_tax_codes(code);

COMMENT ON TABLE settings_tax_codes IS 'Tax codes and rates for pricing';

CREATE TABLE IF NOT EXISTS settings_warehouse (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  default_currency VARCHAR(3) DEFAULT 'USD',
  default_tax_code_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settings_warehouse_wh ON settings_warehouse(warehouse_id);

COMMENT ON TABLE settings_warehouse IS 'Warehouse-specific settings and defaults';

CREATE TABLE IF NOT EXISTS allergens (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allergens_org ON allergens(org_id);
CREATE INDEX idx_allergens_code ON allergens(code);

COMMENT ON TABLE allergens IS 'Allergen master data for food safety compliance';

CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(100),
  production_line_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_machines_org ON machines(org_id);
CREATE INDEX idx_machines_code ON machines(code);
CREATE INDEX idx_machines_line ON machines(production_line_id);
CREATE INDEX idx_machines_active ON machines(is_active);

COMMENT ON TABLE machines IS 'Production machines and equipment';

CREATE TABLE IF NOT EXISTS production_lines (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_lines_org ON production_lines(org_id);
CREATE INDEX idx_production_lines_code ON production_lines(code);
CREATE INDEX idx_production_lines_warehouse ON production_lines(warehouse_id);
CREATE INDEX idx_production_lines_active ON production_lines(is_active);

COMMENT ON TABLE production_lines IS 'Production lines within warehouses';

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org ON audit_log(org_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all data changes';

-- =============================================
-- SECTION 4: TECHNICAL MODULE (Products, BOMs, Routings)
-- =============================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  product_group product_group NOT NULL,
  product_type product_type NOT NULL,
  uom VARCHAR(20) NOT NULL,
  shelf_life_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  default_routing_id INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_org ON products(org_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_group ON products(product_group);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_routing ON products(default_routing_id);

COMMENT ON TABLE products IS 'Product master data - raw materials, packaging, semi-finished, finished goods';
COMMENT ON COLUMN products.shelf_life_days IS 'Product shelf life in days (for expiry date calculation)';

CREATE TABLE IF NOT EXISTS boms (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  version INTEGER NOT NULL DEFAULT 1,
  status bom_status DEFAULT 'draft',
  yield_percentage DECIMAL(5,2) DEFAULT 100.00,
  batch_size DECIMAL(15,3),
  batch_size_uom VARCHAR(20),
  notes TEXT,
  default_routing_id INTEGER,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, version)
);

CREATE INDEX idx_boms_org ON boms(org_id);
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_status ON boms(status);
CREATE INDEX idx_boms_routing ON boms(default_routing_id);
CREATE INDEX idx_boms_product_date_range ON boms(product_id, effective_from, effective_to) WHERE status = 'active';
CREATE INDEX idx_boms_current ON boms(product_id, effective_from) WHERE status = 'active';
CREATE INDEX idx_boms_daterange ON boms USING GIST (product_id, tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)')) WHERE status = 'active';

COMMENT ON TABLE boms IS 'Bill of Materials with multi-version support (date-based)';
COMMENT ON COLUMN boms.version IS 'BOM version number (incremental for same product)';
COMMENT ON COLUMN boms.effective_from IS 'Date when this BOM version becomes active. Multiple versions can exist for same product with different date ranges.';
COMMENT ON COLUMN boms.effective_to IS 'Date when this BOM version expires (NULL = no expiry, indefinitely active). Used for planned recipe changes.';

CREATE TABLE IF NOT EXISTS bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  material_product_id INTEGER NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  scrap_percentage DECIMAL(5,2) DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  notes TEXT,
  consume_whole_lp BOOLEAN DEFAULT false,
  condition JSONB,
  condition_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bom_id, line_no)
);

CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(material_product_id);
CREATE INDEX idx_bom_items_condition ON bom_items USING GIN (condition) WHERE condition IS NOT NULL;

COMMENT ON TABLE bom_items IS 'Individual materials in a BOM recipe';
COMMENT ON COLUMN bom_items.consume_whole_lp IS '1:1 consumption flag - entire LP must be consumed, no partial splits (critical for allergen control)';
COMMENT ON COLUMN bom_items.condition IS 'Conditional inclusion rule (JSONB) for order-specific material selection';
COMMENT ON COLUMN bom_items.condition_type IS 'Condition evaluation type: and, or, not';

CREATE TABLE IF NOT EXISTS bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id),
  version INTEGER NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_description TEXT,
  bom_data JSONB
);

CREATE INDEX idx_bom_history_bom ON bom_history(bom_id);
CREATE INDEX idx_bom_history_changed_at ON bom_history(changed_at);

COMMENT ON TABLE bom_history IS 'Audit trail for BOM changes';

CREATE TABLE IF NOT EXISTS bom_by_products (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  yield_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_by_products_bom ON bom_by_products(bom_id);
CREATE INDEX idx_bom_by_products_product ON bom_by_products(product_id);

COMMENT ON TABLE bom_by_products IS 'Expected by-products from BOM execution';

CREATE TABLE IF NOT EXISTS routings (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routings_org ON routings(org_id);
CREATE INDEX idx_routings_code ON routings(code);
CREATE INDEX idx_routings_active ON routings(is_active);

COMMENT ON TABLE routings IS 'Production routing templates';

CREATE TABLE IF NOT EXISTS routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  operation_no INTEGER NOT NULL,
  operation_name_id INTEGER,
  description TEXT,
  machine_id INTEGER REFERENCES machines(id),
  duration_minutes INTEGER,
  labor_hours DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routing_id, operation_no)
);

CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);
CREATE INDEX idx_routing_operations_machine ON routing_operations(machine_id);
CREATE INDEX idx_routing_operations_name ON routing_operations(operation_name_id);

COMMENT ON TABLE routing_operations IS 'Individual steps in a production routing';

CREATE TABLE IF NOT EXISTS routing_operation_names (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_operation_names_org ON routing_operation_names(org_id);
CREATE INDEX idx_routing_operation_names_code ON routing_operation_names(code);

COMMENT ON TABLE routing_operation_names IS 'Master list of operation names';

CREATE TABLE IF NOT EXISTS product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id INTEGER NOT NULL REFERENCES allergens(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);

CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

COMMENT ON TABLE product_allergens IS 'Product-allergen relationships for food safety';

-- =============================================
-- SECTION 5: PLANNING MODULE (PO, TO, WO)
-- =============================================


CREATE TABLE IF NOT EXISTS po_header (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  currency VARCHAR(3) DEFAULT 'USD',
  tax_code_id INTEGER,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_header_org ON po_header(org_id);
CREATE INDEX idx_po_header_number ON po_header(po_number);
CREATE INDEX idx_po_header_supplier ON po_header(supplier_id);
CREATE INDEX idx_po_header_status ON po_header(status);
CREATE INDEX idx_po_header_warehouse_id ON po_header(warehouse_id);

COMMENT ON TABLE po_header IS 'Purchase Order headers';
COMMENT ON COLUMN po_header.warehouse_id IS 'EPIC 0 PATTERN C FIX: Destination warehouse for this Purchase Order (required for GRN routing). Determines where materials will be received.';

CREATE TABLE IF NOT EXISTS po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  line_no INTEGER NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity DECIMAL(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,4),
  line_total DECIMAL(15,4),
  qty_received DECIMAL(12,4) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(po_id, line_no)
);

CREATE INDEX idx_po_line_po ON po_line(po_id);
CREATE INDEX idx_po_line_product ON po_line(product_id);

COMMENT ON TABLE po_line IS 'Purchase Order line items';

CREATE TABLE IF NOT EXISTS po_correction (
  id SERIAL PRIMARY KEY,
  po_line_id INTEGER REFERENCES po_line(id),
  quantity_delta DECIMAL(12,4) NOT NULL,
  reason TEXT,
  corrected_by UUID,
  corrected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_correction_line ON po_correction(po_line_id);

COMMENT ON TABLE po_correction IS 'Purchase Order quantity corrections/adjustments';

CREATE TABLE IF NOT EXISTS to_header (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  to_number VARCHAR(50) UNIQUE NOT NULL,
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  to_warehouse_id INTEGER REFERENCES warehouses(id),
  transfer_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_to_header_org ON to_header(org_id);
CREATE INDEX idx_to_header_number ON to_header(to_number);
CREATE INDEX idx_to_header_from_wh ON to_header(from_warehouse_id);
CREATE INDEX idx_to_header_to_wh ON to_header(to_warehouse_id);
CREATE INDEX idx_to_header_status ON to_header(status);

COMMENT ON TABLE to_header IS 'Transfer Order headers - warehouse to warehouse transfers';

CREATE TABLE IF NOT EXISTS to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned DECIMAL(12,4) NOT NULL,
  qty_shipped DECIMAL(12,4) DEFAULT 0,
  qty_received DECIMAL(12,4) DEFAULT 0,
  lp_id INTEGER,
  batch VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(to_id, line_no)
);

CREATE INDEX idx_to_line_to ON to_line(to_id);
CREATE INDEX idx_to_line_item ON to_line(item_id);
CREATE INDEX idx_to_line_lp ON to_line(lp_id);

COMMENT ON TABLE to_line IS 'Transfer Order line items - Epic 0 Pattern A fix included';
COMMENT ON COLUMN to_line.notes IS 'EPIC 0 PATTERN A FIX: Additional notes for this line item (from migration 020)';

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  bom_id INTEGER REFERENCES boms(id),
  routing_id INTEGER REFERENCES routings(id),
  quantity DECIMAL(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'planned',
  priority INTEGER DEFAULT 5,
  scheduled_date DATE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  production_line_id INTEGER REFERENCES production_lines(id),
  batch_number VARCHAR(100),
  notes TEXT,
  order_flags TEXT[] DEFAULT '{}',
  customer_id INTEGER,
  order_type VARCHAR(50),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_orders_org ON work_orders(org_id);
CREATE INDEX idx_work_orders_number ON work_orders(wo_number);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_work_orders_bom ON work_orders(bom_id);
CREATE INDEX idx_work_orders_routing ON work_orders(routing_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_line ON work_orders(production_line_id);
CREATE INDEX idx_work_orders_order_flags ON work_orders USING GIN (order_flags) WHERE order_flags IS NOT NULL AND array_length(order_flags, 1) > 0;
CREATE INDEX idx_work_orders_customer_id ON work_orders (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_work_orders_order_type ON work_orders (order_type) WHERE order_type IS NOT NULL;

COMMENT ON TABLE work_orders IS 'Work Orders for production execution';
COMMENT ON COLUMN work_orders.order_flags IS 'Array of order-specific flags used for conditional BOM material selection';
COMMENT ON COLUMN work_orders.customer_id IS 'Optional customer ID for customer-specific material conditions';
COMMENT ON COLUMN work_orders.order_type IS 'Optional order type for type-based material conditions';

CREATE TABLE IF NOT EXISTS wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  material_product_id INTEGER NOT NULL REFERENCES products(id),
  required_quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  issued_quantity DECIMAL(15,3) DEFAULT 0,
  scrap_percentage DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wo_id, line_no)
);

CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_material ON wo_materials(material_product_id);

COMMENT ON TABLE wo_materials IS 'WO materials snapshot from BOM (immutable recipe capture)';

CREATE TABLE IF NOT EXISTS wo_operations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  operation_no INTEGER NOT NULL,
  operation_name VARCHAR(200),
  machine_id INTEGER REFERENCES machines(id),
  status VARCHAR(20) DEFAULT 'pending',
  duration_minutes INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  operator_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wo_id, operation_no)
);

CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
CREATE INDEX idx_wo_operations_machine ON wo_operations(machine_id);
CREATE INDEX idx_wo_operations_status ON wo_operations(status);

COMMENT ON TABLE wo_operations IS 'WO operations snapshot from routing';

CREATE TABLE IF NOT EXISTS wo_by_products (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_yield_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  actual_quantity DECIMAL(15,3),
  uom VARCHAR(20),
  lp_id INTEGER,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_by_products_wo ON wo_by_products(wo_id);
CREATE INDEX idx_wo_by_products_product ON wo_by_products(product_id);
CREATE INDEX idx_wo_by_products_lp ON wo_by_products(lp_id);

COMMENT ON TABLE wo_by_products IS 'WO by-products tracking';

CREATE TABLE IF NOT EXISTS wo_reservations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  material_product_id INTEGER NOT NULL REFERENCES products(id),
  reserved_quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID,
  notes TEXT
);

CREATE INDEX idx_wo_reservations_wo ON wo_reservations(wo_id);
CREATE INDEX idx_wo_reservations_material ON wo_reservations(material_product_id);

COMMENT ON TABLE wo_reservations IS 'WO material reservations';

-- =============================================
-- SECTION 6: PRODUCTION MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS production_outputs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  license_plate_id INTEGER,
  batch_number VARCHAR(100),
  manufacture_date DATE,
  expiry_date DATE,
  produced_by UUID,
  produced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_outputs_org ON production_outputs(org_id);
CREATE INDEX idx_production_outputs_wo ON production_outputs(work_order_id);
CREATE INDEX idx_production_outputs_product ON production_outputs(product_id);
CREATE INDEX idx_production_outputs_lp ON production_outputs(license_plate_id);

COMMENT ON TABLE production_outputs IS 'Production output registration - LP created directly';

-- =============================================
-- SECTION 7: WAREHOUSE MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS license_plates (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  lp_number VARCHAR(50) NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'in_production', 'consumed', 'in_transit', 'quarantine', 'qa_passed', 'qa_rejected', 'shipped', 'damaged')),
  qa_status VARCHAR(20),
  location_id INTEGER,
  parent_lp_id INTEGER,
  batch_number VARCHAR(100),
  lot_number VARCHAR(100),
  serial_number VARCHAR(100),
  supplier_batch_number VARCHAR(100),
  manufacture_date DATE,
  expiry_date DATE,
  received_date DATE,
  po_number VARCHAR(50),
  consumed_by_wo_id INTEGER,
  consumed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, lp_number)
);

CREATE INDEX idx_license_plates_org ON license_plates(org_id);
CREATE INDEX idx_license_plates_number ON license_plates(lp_number);
CREATE INDEX idx_license_plates_product ON license_plates(product_id);
CREATE INDEX idx_license_plates_status ON license_plates(status);
CREATE INDEX idx_license_plates_location ON license_plates(location_id);
CREATE INDEX idx_license_plates_parent ON license_plates(parent_lp_id);
CREATE INDEX idx_license_plates_batch ON license_plates(batch_number);
CREATE INDEX idx_license_plates_expiry ON license_plates(expiry_date);

COMMENT ON TABLE license_plates IS 'License Plate = atomic inventory unit - Epic 0 Pattern C fix included';
COMMENT ON COLUMN license_plates.status IS 'EPIC 0 PATTERN C FIX: Status enum with 10 values (was 7 in DB, 5 in TS - severe mismatch resolved)';

CREATE TABLE IF NOT EXISTS lp_reservations (
  id SERIAL PRIMARY KEY,
  license_plate_id INTEGER NOT NULL,
  work_order_id INTEGER NOT NULL,
  reserved_quantity DECIMAL(15,3) NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID
);

CREATE INDEX idx_lp_reservations_lp ON lp_reservations(license_plate_id);
CREATE INDEX idx_lp_reservations_wo ON lp_reservations(work_order_id);

COMMENT ON TABLE lp_reservations IS 'Hard LP reservations - completely locked to WO (not soft allocation)';

CREATE TABLE IF NOT EXISTS lp_compositions (
  id SERIAL PRIMARY KEY,
  parent_lp_id INTEGER NOT NULL,
  child_lp_id INTEGER NOT NULL,
  quantity DECIMAL(15,3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lp_compositions_parent ON lp_compositions(parent_lp_id);
CREATE INDEX idx_lp_compositions_child ON lp_compositions(child_lp_id);

COMMENT ON TABLE lp_compositions IS 'LP composition hierarchy for composite products';

CREATE TABLE IF NOT EXISTS lp_genealogy (
  id SERIAL PRIMARY KEY,
  child_lp_id INTEGER NOT NULL,
  parent_lp_id INTEGER NOT NULL,
  work_order_id INTEGER,
  relationship_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(work_order_id);

COMMENT ON TABLE lp_genealogy IS 'LP genealogy for traceability - recursive queries with PostgreSQL CTE';

CREATE TABLE IF NOT EXISTS asns (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  asn_number VARCHAR(50) NOT NULL,
  po_header_id INTEGER,
  supplier_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  expected_arrival_date DATE,
  actual_arrival_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, asn_number)
);

CREATE INDEX idx_asns_org ON asns(org_id);
CREATE INDEX idx_asns_number ON asns(asn_number);
CREATE INDEX idx_asns_po ON asns(po_header_id);
CREATE INDEX idx_asns_supplier ON asns(supplier_id);

COMMENT ON TABLE asns IS 'Advanced Shipping Notices';

CREATE TABLE IF NOT EXISTS asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  batch_number VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asn_id, line_number)
);

CREATE INDEX idx_asn_items_asn ON asn_items(asn_id);
CREATE INDEX idx_asn_items_product ON asn_items(product_id);

CREATE TABLE IF NOT EXISTS grns (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  grn_number VARCHAR(50) NOT NULL,
  po_header_id INTEGER,
  asn_id INTEGER,
  warehouse_id INTEGER NOT NULL,
  received_date DATE NOT NULL,
  received_by UUID,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, grn_number)
);

CREATE INDEX idx_grns_org ON grns(org_id);
CREATE INDEX idx_grns_number ON grns(grn_number);
CREATE INDEX idx_grns_po ON grns(po_header_id);
CREATE INDEX idx_grns_asn ON grns(asn_id);

COMMENT ON TABLE grns IS 'Goods Receipt Notes';

CREATE TABLE IF NOT EXISTS grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  license_plate_id INTEGER,
  batch_number VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grn_id, line_number)
);

CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product ON grn_items(product_id);
CREATE INDEX idx_grn_items_lp ON grn_items(license_plate_id);

CREATE TABLE IF NOT EXISTS pallets (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  pallet_number VARCHAR(50) NOT NULL,
  location_id INTEGER,
  status VARCHAR(20) DEFAULT 'open',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, pallet_number)
);

CREATE INDEX idx_pallets_org ON pallets(org_id);
CREATE INDEX idx_pallets_number ON pallets(pallet_number);
CREATE INDEX idx_pallets_location ON pallets(location_id);

COMMENT ON TABLE pallets IS 'Pallets for grouping license plates';

CREATE TABLE IF NOT EXISTS pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER NOT NULL,
  license_plate_id INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID
);

CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);
CREATE INDEX idx_pallet_items_lp ON pallet_items(license_plate_id);

CREATE TABLE IF NOT EXISTS stock_moves (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  license_plate_id INTEGER NOT NULL,
  from_location_id INTEGER,
  to_location_id INTEGER NOT NULL,
  quantity DECIMAL(15,3),
  move_type VARCHAR(50),
  move_date TIMESTAMPTZ DEFAULT NOW(),
  moved_by UUID,
  notes TEXT
);

CREATE INDEX idx_stock_moves_org ON stock_moves(org_id);
CREATE INDEX idx_stock_moves_lp ON stock_moves(license_plate_id);
CREATE INDEX idx_stock_moves_from ON stock_moves(from_location_id);
CREATE INDEX idx_stock_moves_to ON stock_moves(to_location_id);

COMMENT ON TABLE stock_moves IS 'Stock movements between locations';

CREATE TABLE IF NOT EXISTS warehouse_settings (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL UNIQUE,
  default_po_location_id INTEGER,
  default_to_location_id INTEGER,
  warehouse_transit_location_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouse_settings_wh ON warehouse_settings(warehouse_id);

-- =============================================
-- SECTION 7: COSTING MODULE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS material_costs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  cost DECIMAL(15,4) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_costs_product ON material_costs(product_id);

CREATE TABLE IF NOT EXISTS bom_costs (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL,
  total_material_cost DECIMAL(15,4),
  total_labor_cost DECIMAL(15,4),
  total_overhead_cost DECIMAL(15,4),
  currency VARCHAR(3) DEFAULT 'USD',
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_costs_bom ON bom_costs(bom_id);

CREATE TABLE IF NOT EXISTS product_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_prices_product ON product_prices(product_id);

CREATE TABLE IF NOT EXISTS wo_costs (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER NOT NULL,
  actual_material_cost DECIMAL(15,4),
  actual_labor_cost DECIMAL(15,4),
  actual_overhead_cost DECIMAL(15,4),
  currency VARCHAR(3) DEFAULT 'USD',
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_costs_wo ON wo_costs(work_order_id);

-- =============================================
-- END OF MASTER MIGRATION (AI-GENERATED VERSION)
-- =============================================
-- Total Tables: 45
-- Epic 0 Fixes Included:
--   ✓ po_header.warehouse_id (Pattern C)
--   ✓ to_line.notes (Pattern A)
--   ✓ locations.zone (Pattern B)
--   ✓ license_plates.status (10 values, Pattern C)
-- =============================================

-- =============================================
-- SECTION 8: FOREIGN KEY CONSTRAINTS (Circular References)
-- =============================================

ALTER TABLE products ADD CONSTRAINT fk_products_default_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

ALTER TABLE boms ADD CONSTRAINT fk_boms_default_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

ALTER TABLE to_line ADD CONSTRAINT fk_to_line_lp 
  FOREIGN KEY (lp_id) REFERENCES license_plates(id);

-- =============================================
-- SECTION 9: KEY RPC FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_overlap_count
  FROM boms
  WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, -1)
    AND status = 'active'
    AND (
      tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)') 
      && 
      tstzrange(NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamptz), '[)')
    );

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'BOM date range overlaps with existing active BOM for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION select_bom_for_wo(
  p_product_id INTEGER,
  p_scheduled_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  bom_id INTEGER,
  bom_version INTEGER,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bom_id,
    b.version AS bom_version,
    b.effective_from,
    b.effective_to
  FROM boms b
  WHERE b.product_id = p_product_id
    AND b.status = 'active'
    AND b.effective_from <= p_scheduled_date
    AND (b.effective_to IS NULL OR b.effective_to > p_scheduled_date)
  ORDER BY b.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- SECTION 10: TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS check_bom_date_overlap_trigger ON boms;
CREATE TRIGGER check_bom_date_overlap_trigger
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_bom_date_overlap();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SECTION 11: ROW LEVEL SECURITY (RLS)
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
ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_by_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_costs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- END OF MASTER MIGRATION (MANUAL MERGE VERSION)
-- =============================================
-- Total Tables: 45+
-- Epic 0 Fixes Included:
--   ✓ Pattern A: to_line.notes (from migration 020)
--   ✓ Pattern B: locations.zone (ADDED - was missing)
--   ✓ Pattern C: po_header.warehouse_id (from migration 057)
--   ✓ Pattern C: license_plates.status enum (10 values, from migration 058)
-- =============================================
