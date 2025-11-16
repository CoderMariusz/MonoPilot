-- =============================================
-- MONOPILOT MES - MASTER MIGRATION (AI-GENERATED)
-- =============================================
-- Purpose: Consolidated database schema generated from Architecture.md and DATABASE_SCHEMA.md
-- Epic: Epic 0 - P0 Modules Data Integrity Audit & Fix
-- Story: 0.8 - Konsolidacja Migracji (64 → 1 Master)
-- Generated: 2025-11-15
-- Author: AI Agent (Claude Sonnet 4.5)
-- Source: Architecture.md, DATABASE_SCHEMA.md, migration 000_enums.sql
--
-- IMPORTANT: This is the AI-generated version for comparison purposes.
-- A manual merge version will be created separately and diff-analyzed.
--
-- Rollback Strategy:
-- This migration creates a complete schema from scratch.
-- To rollback: DROP all tables in reverse dependency order, then DROP all ENUMs.
-- =============================================

-- =============================================
-- SECTION 1: ENUM TYPES
-- =============================================
-- ENUMs must be created before tables that reference them

-- Product classification enums
CREATE TYPE product_group AS ENUM ('MEAT', 'DRYGOODS', 'COMPOSITE');
CREATE TYPE product_type AS ENUM ('RM_MEAT', 'PR', 'FG', 'DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE');

-- BOM lifecycle status
CREATE TYPE bom_status AS ENUM ('draft', 'active', 'archived');

-- Comments
COMMENT ON TYPE product_group IS 'High-level product grouping: MEAT, DRYGOODS, or COMPOSITE (mixed)';
COMMENT ON TYPE product_type IS 'Detailed product type classification for app taxonomy';
COMMENT ON TYPE bom_status IS 'BOM lifecycle status: draft (editable), active (in use), archived (historical)';

-- =============================================
-- SECTION 2: BASE TABLES (No Foreign Keys)
-- =============================================
-- Tables without foreign key dependencies, created first

-- SETTINGS MODULE

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Operator', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC', 'Admin')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

COMMENT ON TABLE users IS 'User accounts with role-based access control';

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  vat_number VARCHAR(50),
  tax_number VARCHAR(50),
  country VARCHAR(3),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(100),
  incoterms VARCHAR(50),
  email VARCHAR(200),
  phone VARCHAR(50),
  address JSONB,
  default_tax_code_id INTEGER,
  lead_time_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(name);

COMMENT ON TABLE suppliers IS 'Supplier master data for procurement';

CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);

COMMENT ON TABLE warehouses IS 'Warehouse master data';

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  zone VARCHAR(50),
  type VARCHAR(50),
  capacity_uom VARCHAR(20),
  capacity_qty DECIMAL(15,3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_deleted ON locations(deleted_at);

COMMENT ON TABLE locations IS 'Storage locations within warehouses';
COMMENT ON COLUMN locations.zone IS 'Epic 0 Pattern B fix: Zone field for location grouping';

CREATE TABLE IF NOT EXISTS settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(200),
  rate DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings_warehouse (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL,
  default_po_location_id INTEGER,
  default_to_location_id INTEGER,
  warehouse_transit_location_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allergens (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  production_line_id INTEGER,
  capacity_per_hour DECIMAL(15,3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_lines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID,
  changes JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- =============================================
-- SECTION 3: TECHNICAL MODULE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  product_group product_group NOT NULL,
  product_type product_type NOT NULL,
  uom VARCHAR(20) NOT NULL,
  shelf_life_days INTEGER,
  storage_temp_min DECIMAL(5,2),
  storage_temp_max DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(org_id, code)
);

CREATE INDEX idx_products_org ON products(org_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);

COMMENT ON TABLE products IS 'Product master data with multi-tenant org_id isolation';

CREATE TABLE IF NOT EXISTS boms (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status bom_status DEFAULT 'draft',
  effective_from DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(org_id, product_id, version)
);

CREATE INDEX idx_boms_org ON boms(org_id);
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_status ON boms(status);
CREATE INDEX idx_boms_active ON boms(is_active);

COMMENT ON TABLE boms IS 'Bill of Materials with multi-version support and date-based activation';

CREATE TABLE IF NOT EXISTS bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_product ON bom_items(product_id);

COMMENT ON TABLE bom_items IS 'BOM line items with 1:1 consumption support';
COMMENT ON COLUMN bom_items.consume_whole_lp IS 'Pattern: 1:1 Consume Whole LP - if true, entire license plate must be consumed (no partial splits)';

CREATE TABLE IF NOT EXISTS bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  change_type VARCHAR(50),
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changes JSONB
);

CREATE INDEX idx_bom_history_bom ON bom_history(bom_id);

COMMENT ON TABLE bom_history IS 'BOM change audit trail';

CREATE TABLE IF NOT EXISTS routings (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routings_org ON routings(org_id);
CREATE INDEX idx_routings_product ON routings(product_id);

CREATE TABLE IF NOT EXISTS routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,
  sequence INTEGER NOT NULL,
  machine_id INTEGER,
  setup_time_minutes DECIMAL(10,2),
  run_time_per_unit DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_ops_routing ON routing_operations(routing_id);

CREATE TABLE IF NOT EXISTS routing_operation_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  allergen_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);

CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

-- =============================================
-- SECTION 4: PLANNING MODULE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS po_header (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  number VARCHAR(50) NOT NULL,
  supplier_id INTEGER NOT NULL,
  warehouse_id INTEGER,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'in_transit', 'received', 'closed', 'cancelled')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  order_date DATE NOT NULL,
  requested_delivery_date DATE,
  promised_delivery_date DATE,
  payment_due_date DATE,
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address JSONB,
  asn_ref VARCHAR(100),
  net_total DECIMAL(15,2),
  vat_total DECIMAL(15,2),
  gross_total DECIMAL(15,2),
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, number)
);

CREATE INDEX idx_po_header_org ON po_header(org_id);
CREATE INDEX idx_po_header_supplier ON po_header(supplier_id);
CREATE INDEX idx_po_header_warehouse ON po_header(warehouse_id);
CREATE INDEX idx_po_header_status ON po_header(status);
CREATE INDEX idx_po_header_order_date ON po_header(order_date);

COMMENT ON TABLE po_header IS 'Purchase Order headers - Epic 0 Pattern C fix included';
COMMENT ON COLUMN po_header.warehouse_id IS 'EPIC 0 PATTERN C FIX: Destination warehouse for GRN routing (CRITICAL - was missing, caused SQL errors)';

CREATE TABLE IF NOT EXISTS po_line (
  id SERIAL PRIMARY KEY,
  po_header_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  description VARCHAR(200),
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,4) NOT NULL,
  tax_code_id INTEGER,
  tax_rate DECIMAL(5,2),
  net_amount DECIMAL(15,2),
  vat_amount DECIMAL(15,2),
  gross_amount DECIMAL(15,2),
  received_quantity DECIMAL(15,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(po_header_id, line_number)
);

CREATE INDEX idx_po_line_po_header ON po_line(po_header_id);
CREATE INDEX idx_po_line_product ON po_line(product_id);

CREATE TABLE IF NOT EXISTS po_correction (
  id SERIAL PRIMARY KEY,
  po_header_id INTEGER NOT NULL,
  po_line_id INTEGER NOT NULL,
  correction_type VARCHAR(50),
  original_value DECIMAL(15,3),
  corrected_value DECIMAL(15,3),
  reason TEXT,
  corrected_by UUID,
  corrected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_correction_po ON po_correction(po_header_id);

CREATE TABLE IF NOT EXISTS to_header (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  number VARCHAR(50) NOT NULL,
  from_warehouse_id INTEGER NOT NULL,
  to_warehouse_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled')),
  requested_date DATE,
  shipped_date DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, number)
);

CREATE INDEX idx_to_header_org ON to_header(org_id);
CREATE INDEX idx_to_header_from_wh ON to_header(from_warehouse_id);
CREATE INDEX idx_to_header_to_wh ON to_header(to_warehouse_id);
CREATE INDEX idx_to_header_status ON to_header(status);

COMMENT ON TABLE to_header IS 'Transfer Order headers - warehouse-to-warehouse transfers (no location in header per Architecture decision)';

CREATE TABLE IF NOT EXISTS to_line (
  id SERIAL PRIMARY KEY,
  to_header_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  notes TEXT,
  shipped_quantity DECIMAL(15,3) DEFAULT 0,
  received_quantity DECIMAL(15,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(to_header_id, line_number)
);

CREATE INDEX idx_to_line_to_header ON to_line(to_header_id);
CREATE INDEX idx_to_line_product ON to_line(product_id);

COMMENT ON TABLE to_line IS 'Transfer Order line items';
COMMENT ON COLUMN to_line.notes IS 'EPIC 0 PATTERN A FIX: Notes field for line-level documentation (was in migration 020 but never executed)';

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  number VARCHAR(50) NOT NULL,
  product_id INTEGER NOT NULL,
  bom_id INTEGER,
  routing_id INTEGER,
  planned_quantity DECIMAL(15,3) NOT NULL,
  actual_quantity DECIMAL(15,3) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'released', 'in_progress', 'completed', 'closed', 'cancelled')),
  scheduled_start DATE,
  scheduled_end DATE,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  production_line_id INTEGER,
  priority INTEGER DEFAULT 5,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, number)
);

CREATE INDEX idx_work_orders_org ON work_orders(org_id);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_scheduled ON work_orders(scheduled_start);

COMMENT ON TABLE work_orders IS 'Work Orders for production execution with BOM snapshot pattern';

CREATE TABLE IF NOT EXISTS wo_materials (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  consumed_quantity DECIMAL(15,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_materials_wo ON wo_materials(work_order_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);

COMMENT ON TABLE wo_materials IS 'WO materials snapshot from BOM at WO creation - Pattern: Hybrid BOM Snapshot (copy rows for immutability + queryability)';

CREATE TABLE IF NOT EXISTS wo_operations (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,
  sequence INTEGER NOT NULL,
  machine_id INTEGER,
  setup_time_minutes DECIMAL(10,2),
  run_time_per_unit DECIMAL(10,4),
  status VARCHAR(20) DEFAULT 'pending',
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_operations_wo ON wo_operations(work_order_id);

CREATE TABLE IF NOT EXISTS wo_by_products (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  work_order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  expected_quantity DECIMAL(15,3),
  actual_quantity DECIMAL(15,3),
  uom VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_by_products_org ON wo_by_products(org_id);
CREATE INDEX idx_wo_by_products_wo ON wo_by_products(work_order_id);

CREATE TABLE IF NOT EXISTS wo_reservations (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER NOT NULL,
  license_plate_id INTEGER NOT NULL,
  reserved_quantity DECIMAL(15,3) NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID
);

CREATE INDEX idx_wo_reservations_wo ON wo_reservations(work_order_id);
CREATE INDEX idx_wo_reservations_lp ON wo_reservations(license_plate_id)
;

-- =============================================
-- SECTION 5: PRODUCTION MODULE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS production_outputs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  work_order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
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
CREATE INDEX idx_production_outputs_lp ON production_outputs(license_plate_id);

COMMENT ON TABLE production_outputs IS 'Production output registration - LP created directly (LP = PALLET pattern)';

-- =============================================
-- SECTION 6: WAREHOUSE MODULE TABLES
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
