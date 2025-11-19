-- ============================================================================
-- COMPLETE DATABASE RESET - MonoPilot MES
-- ============================================================================
-- This migration completely resets and rebuilds the database with proper
-- multi-tenant architecture, auth triggers, and RLS policies.
--
-- CRITICAL: This drops ALL existing tables and recreates them properly.
-- ============================================================================

-- ============================================================================
-- PHASE 1: CLEANUP - Drop all existing objects
-- ============================================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS lp_genealogy CASCADE;
DROP TABLE IF EXISTS lp_compositions CASCADE;
DROP TABLE IF EXISTS lp_reservations CASCADE;
DROP TABLE IF EXISTS license_plates CASCADE;
DROP TABLE IF EXISTS pallet_items CASCADE;
DROP TABLE IF EXISTS pallets CASCADE;
DROP TABLE IF EXISTS grn_items CASCADE;
DROP TABLE IF EXISTS grns CASCADE;
DROP TABLE IF EXISTS asn_items CASCADE;
DROP TABLE IF EXISTS asns CASCADE;
DROP TABLE IF EXISTS stock_moves CASCADE;
DROP TABLE IF EXISTS production_outputs CASCADE;
DROP TABLE IF EXISTS wo_by_products CASCADE;
DROP TABLE IF EXISTS wo_operations CASCADE;
DROP TABLE IF EXISTS wo_materials CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS to_line CASCADE;
DROP TABLE IF EXISTS to_header CASCADE;
DROP TABLE IF EXISTS po_line CASCADE;
DROP TABLE IF EXISTS po_header CASCADE;
DROP TABLE IF EXISTS bom_history CASCADE;
DROP TABLE IF EXISTS bom_items CASCADE;
DROP TABLE IF EXISTS boms CASCADE;
DROP TABLE IF EXISTS routing_operations CASCADE;
DROP TABLE IF EXISTS routings CASCADE;
DROP TABLE IF EXISTS product_allergens CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS allergens CASCADE;
DROP TABLE IF EXISTS tax_codes CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS production_lines CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS wo_templates CASCADE;
DROP TABLE IF EXISTS material_costs CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop NPD tables if exist
DROP TABLE IF EXISTS npd_events CASCADE;
DROP TABLE IF EXISTS npd_documents CASCADE;
DROP TABLE IF EXISTS npd_risks CASCADE;
DROP TABLE IF EXISTS npd_costing CASCADE;
DROP TABLE IF EXISTS npd_formulation_items CASCADE;
DROP TABLE IF EXISTS npd_formulations CASCADE;
DROP TABLE IF EXISTS npd_projects CASCADE;

-- Drop enums
DROP TYPE IF EXISTS bom_status CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;
DROP TYPE IF EXISTS wo_status CASCADE;
DROP TYPE IF EXISTS po_status CASCADE;
DROP TYPE IF EXISTS to_status CASCADE;
DROP TYPE IF EXISTS asn_status CASCADE;
DROP TYPE IF EXISTS grn_status CASCADE;
DROP TYPE IF EXISTS lp_status CASCADE;
DROP TYPE IF EXISTS move_type CASCADE;
DROP TYPE IF EXISTS location_type CASCADE;

-- ============================================================================
-- PHASE 2: ENUMS
-- ============================================================================

CREATE TYPE bom_status AS ENUM ('Draft', 'Active', 'Phased Out', 'Inactive');
CREATE TYPE product_type AS ENUM ('Raw Material', 'Semi-Finished', 'Finished Good', 'Packaging', 'By-Product');
CREATE TYPE wo_status AS ENUM ('Draft', 'Released', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE po_status AS ENUM ('Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled');
CREATE TYPE to_status AS ENUM ('Draft', 'Released', 'In Transit', 'Completed', 'Cancelled');
CREATE TYPE asn_status AS ENUM ('Draft', 'Sent', 'Received', 'Cancelled');
CREATE TYPE grn_status AS ENUM ('Draft', 'Completed', 'Cancelled');
CREATE TYPE lp_status AS ENUM ('Available', 'Reserved', 'In Transit', 'Consumed', 'Quarantine', 'Blocked');
CREATE TYPE move_type AS ENUM ('Receipt', 'Issue', 'Transfer', 'Adjustment', 'Production', 'Consumption');
CREATE TYPE location_type AS ENUM ('Storage', 'Production', 'Shipping', 'Receiving', 'Quarantine', 'Transit');

-- ============================================================================
-- PHASE 3: CORE TABLES - Organizations & Users
-- ============================================================================

-- Organizations (MUST be first - everything references it)
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (name, slug) VALUES ('Default Organization', 'default');

-- Users with org_id (links to auth.users AND organizations)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator',
  status TEXT NOT NULL DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_role_check CHECK (role IN (
    'Admin', 'Manager', 'Operator', 'Viewer',
    'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC'
  )),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- PHASE 4: AUTH TRIGGER - Creates user profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id INTEGER;
BEGIN
  -- Get default organization
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default' LIMIT 1;

  -- Create user profile in public.users
  INSERT INTO public.users (id, org_id, email, name, role)
  VALUES (
    NEW.id,
    default_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Operator')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- PHASE 5: SETTINGS TABLES
-- ============================================================================

-- Warehouses
CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  default_receipt_location_id BIGINT,
  transit_location_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT warehouses_unique_code_per_org UNIQUE (org_id, code)
);

CREATE INDEX idx_warehouses_org_id ON warehouses(org_id);

-- Locations
CREATE TABLE locations (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location_type location_type NOT NULL DEFAULT 'Storage',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT locations_unique_code_per_warehouse UNIQUE (warehouse_id, code)
);

CREATE INDEX idx_locations_org_id ON locations(org_id);
CREATE INDEX idx_locations_warehouse_id ON locations(warehouse_id);

-- Add FK for warehouse default locations (after locations table exists)
ALTER TABLE warehouses
  ADD CONSTRAINT fk_warehouses_default_receipt_location
  FOREIGN KEY (default_receipt_location_id) REFERENCES locations(id);

ALTER TABLE warehouses
  ADD CONSTRAINT fk_warehouses_transit_location
  FOREIGN KEY (transit_location_id) REFERENCES locations(id);

-- Production Lines
CREATE TABLE production_lines (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT production_lines_unique_code_per_org UNIQUE (org_id, code)
);

CREATE INDEX idx_production_lines_org_id ON production_lines(org_id);

-- Machines
CREATE TABLE machines (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  production_line_id BIGINT REFERENCES production_lines(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  machine_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT machines_unique_code_per_org UNIQUE (org_id, code)
);

CREATE INDEX idx_machines_org_id ON machines(org_id);
CREATE INDEX idx_machines_production_line_id ON machines(production_line_id);

-- Suppliers
CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  currency TEXT DEFAULT 'PLN',
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT suppliers_unique_code_per_org UNIQUE (org_id, code)
);

CREATE INDEX idx_suppliers_org_id ON suppliers(org_id);

-- Tax Codes
CREATE TABLE tax_codes (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tax_codes_unique_code_per_org UNIQUE (org_id, code)
);

CREATE INDEX idx_tax_codes_org_id ON tax_codes(org_id);

-- Allergens
CREATE TABLE allergens (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT allergens_unique_code_per_org UNIQUE (org_id, code)
);

CREATE INDEX idx_allergens_org_id ON allergens(org_id);

-- ============================================================================
-- PHASE 6: PRODUCTS & BOMs
-- ============================================================================

-- Products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_type product_type NOT NULL DEFAULT 'Raw Material',
  uom TEXT NOT NULL DEFAULT 'kg',
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  lead_time_days INTEGER DEFAULT 0,
  shelf_life_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT products_unique_sku_per_org UNIQUE (org_id, sku)
);

CREATE INDEX idx_products_org_id ON products(org_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_product_type ON products(product_type);

-- Product Allergens (many-to-many)
CREATE TABLE product_allergens (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id BIGINT NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  is_contains BOOLEAN DEFAULT true,
  is_may_contain BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_allergens_unique UNIQUE (product_id, allergen_id)
);

CREATE INDEX idx_product_allergens_product_id ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen_id ON product_allergens(allergen_id);

-- BOMs (Bills of Materials) with versioning
CREATE TABLE boms (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  status bom_status NOT NULL DEFAULT 'Draft',
  effective_from DATE,
  effective_to DATE,
  yield_qty DECIMAL(15,4) NOT NULL DEFAULT 1,
  yield_uom TEXT NOT NULL DEFAULT 'kg',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT boms_unique_version_per_product UNIQUE (product_id, version)
);

CREATE INDEX idx_boms_org_id ON boms(org_id);
CREATE INDEX idx_boms_product_id ON boms(product_id);
CREATE INDEX idx_boms_status ON boms(status);

-- BOM Items
CREATE TABLE bom_items (
  id BIGSERIAL PRIMARY KEY,
  bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  sequence INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bom_items_bom_id ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material_id ON bom_items(material_id);

-- BOM History (audit trail)
CREATE TABLE bom_history (
  id BIGSERIAL PRIMARY KEY,
  bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  change_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bom_history_bom_id ON bom_history(bom_id);

-- Routings
CREATE TABLE routings (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routings_org_id ON routings(org_id);
CREATE INDEX idx_routings_product_id ON routings(product_id);

-- Routing Operations
CREATE TABLE routing_operations (
  id BIGSERIAL PRIMARY KEY,
  routing_id BIGINT NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  operation_name TEXT NOT NULL,
  work_center TEXT,
  machine_id BIGINT REFERENCES machines(id) ON DELETE SET NULL,
  setup_time_mins INTEGER DEFAULT 0,
  run_time_mins INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routing_operations_routing_id ON routing_operations(routing_id);

-- ============================================================================
-- PHASE 7: PLANNING - PO, TO, WO
-- ============================================================================

-- Purchase Order Header
CREATE TABLE po_header (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status po_status NOT NULL DEFAULT 'Draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  currency TEXT DEFAULT 'PLN',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT po_header_unique_number_per_org UNIQUE (org_id, po_number)
);

CREATE INDEX idx_po_header_org_id ON po_header(org_id);
CREATE INDEX idx_po_header_supplier_id ON po_header(supplier_id);
CREATE INDEX idx_po_header_status ON po_header(status);

-- Purchase Order Lines
CREATE TABLE po_line (
  id BIGSERIAL PRIMARY KEY,
  po_id BIGINT NOT NULL REFERENCES po_header(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,4) NOT NULL,
  received_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  unit_price DECIMAL(15,4),
  tax_code_id BIGINT REFERENCES tax_codes(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT po_line_unique_number UNIQUE (po_id, line_number)
);

CREATE INDEX idx_po_line_po_id ON po_line(po_id);
CREATE INDEX idx_po_line_product_id ON po_line(product_id);

-- Transfer Order Header
CREATE TABLE to_header (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  to_number TEXT NOT NULL,
  from_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status to_status NOT NULL DEFAULT 'Draft',
  scheduled_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT to_header_unique_number_per_org UNIQUE (org_id, to_number)
);

CREATE INDEX idx_to_header_org_id ON to_header(org_id);
CREATE INDEX idx_to_header_status ON to_header(status);

-- Transfer Order Lines
CREATE TABLE to_line (
  id BIGSERIAL PRIMARY KEY,
  to_id BIGINT NOT NULL REFERENCES to_header(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,4) NOT NULL,
  transferred_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT to_line_unique_number UNIQUE (to_id, line_number)
);

CREATE INDEX idx_to_line_to_id ON to_line(to_id);
CREATE INDEX idx_to_line_product_id ON to_line(product_id);

-- Work Orders
CREATE TABLE work_orders (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_number TEXT NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  bom_id BIGINT REFERENCES boms(id) ON DELETE SET NULL,
  routing_id BIGINT REFERENCES routings(id) ON DELETE SET NULL,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  production_line_id BIGINT REFERENCES production_lines(id) ON DELETE SET NULL,
  status wo_status NOT NULL DEFAULT 'Draft',
  planned_qty DECIMAL(15,4) NOT NULL,
  completed_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  scheduled_date DATE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 5,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT work_orders_unique_number_per_org UNIQUE (org_id, wo_number)
);

CREATE INDEX idx_work_orders_org_id ON work_orders(org_id);
CREATE INDEX idx_work_orders_product_id ON work_orders(product_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_scheduled_date ON work_orders(scheduled_date);

-- WO Materials (BOM snapshot)
CREATE TABLE wo_materials (
  id BIGSERIAL PRIMARY KEY,
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  planned_qty DECIMAL(15,4) NOT NULL,
  consumed_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_materials_wo_id ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_material_id ON wo_materials(material_id);

-- WO Operations
CREATE TABLE wo_operations (
  id BIGSERIAL PRIMARY KEY,
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  operation_name TEXT NOT NULL,
  machine_id BIGINT REFERENCES machines(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Pending',
  planned_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_operations_wo_id ON wo_operations(wo_id);

-- WO By-Products
CREATE TABLE wo_by_products (
  id BIGSERIAL PRIMARY KEY,
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  planned_qty DECIMAL(15,4) NOT NULL,
  actual_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_by_products_wo_id ON wo_by_products(wo_id);

-- ============================================================================
-- PHASE 8: WAREHOUSE - ASN, GRN, License Plates
-- ============================================================================

-- ASN (Advanced Shipping Notice)
CREATE TABLE asns (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asn_number TEXT NOT NULL,
  po_id BIGINT REFERENCES po_header(id) ON DELETE SET NULL,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status asn_status NOT NULL DEFAULT 'Draft',
  expected_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT asns_unique_number_per_org UNIQUE (org_id, asn_number)
);

CREATE INDEX idx_asns_org_id ON asns(org_id);
CREATE INDEX idx_asns_po_id ON asns(po_id);
CREATE INDEX idx_asns_status ON asns(status);

-- ASN Items
CREATE TABLE asn_items (
  id BIGSERIAL PRIMARY KEY,
  asn_id BIGINT NOT NULL REFERENCES asns(id) ON DELETE CASCADE,
  po_line_id BIGINT REFERENCES po_line(id) ON DELETE SET NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  expected_qty DECIMAL(15,4) NOT NULL,
  received_qty DECIMAL(15,4) DEFAULT 0,
  uom TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asn_items_asn_id ON asn_items(asn_id);

-- GRN (Goods Receipt Note)
CREATE TABLE grns (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grn_number TEXT NOT NULL,
  asn_id BIGINT REFERENCES asns(id) ON DELETE SET NULL,
  po_id BIGINT REFERENCES po_header(id) ON DELETE SET NULL,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status grn_status NOT NULL DEFAULT 'Draft',
  received_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT grns_unique_number_per_org UNIQUE (org_id, grn_number)
);

CREATE INDEX idx_grns_org_id ON grns(org_id);
CREATE INDEX idx_grns_asn_id ON grns(asn_id);
CREATE INDEX idx_grns_po_id ON grns(po_id);

-- GRN Items
CREATE TABLE grn_items (
  id BIGSERIAL PRIMARY KEY,
  grn_id BIGINT NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
  asn_item_id BIGINT REFERENCES asn_items(id) ON DELETE SET NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grn_items_grn_id ON grn_items(grn_id);

-- License Plates (atomic inventory unit)
CREATE TABLE license_plates (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lp_number TEXT NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  status lp_status NOT NULL DEFAULT 'Available',
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  batch_number TEXT,
  supplier_batch_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  po_id BIGINT REFERENCES po_header(id) ON DELETE SET NULL,
  po_number TEXT,
  grn_id BIGINT REFERENCES grns(id) ON DELETE SET NULL,
  wo_id BIGINT REFERENCES work_orders(id) ON DELETE SET NULL,
  parent_lp_id BIGINT REFERENCES license_plates(id) ON DELETE SET NULL,
  consumed_by_wo_id BIGINT REFERENCES work_orders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT license_plates_unique_number_per_org UNIQUE (org_id, lp_number)
);

CREATE INDEX idx_license_plates_org_id ON license_plates(org_id);
CREATE INDEX idx_license_plates_product_id ON license_plates(product_id);
CREATE INDEX idx_license_plates_status ON license_plates(status);
CREATE INDEX idx_license_plates_location_id ON license_plates(location_id);
CREATE INDEX idx_license_plates_warehouse_id ON license_plates(warehouse_id);
CREATE INDEX idx_license_plates_batch_number ON license_plates(batch_number);
CREATE INDEX idx_license_plates_expiry_date ON license_plates(expiry_date);

-- LP Reservations
CREATE TABLE lp_reservations (
  id BIGSERIAL PRIMARY KEY,
  lp_id BIGINT NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  wo_id BIGINT REFERENCES work_orders(id) ON DELETE CASCADE,
  to_id BIGINT REFERENCES to_header(id) ON DELETE CASCADE,
  reserved_qty DECIMAL(15,4) NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reserved_by UUID REFERENCES users(id),

  CONSTRAINT lp_reservations_single_reference CHECK (
    (wo_id IS NOT NULL AND to_id IS NULL) OR
    (wo_id IS NULL AND to_id IS NOT NULL)
  )
);

CREATE INDEX idx_lp_reservations_lp_id ON lp_reservations(lp_id);
CREATE INDEX idx_lp_reservations_wo_id ON lp_reservations(wo_id);

-- LP Compositions (for mixed pallets)
CREATE TABLE lp_compositions (
  id BIGSERIAL PRIMARY KEY,
  parent_lp_id BIGINT NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  child_lp_id BIGINT NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT lp_compositions_unique UNIQUE (parent_lp_id, child_lp_id)
);

-- LP Genealogy (traceability)
CREATE TABLE lp_genealogy (
  id BIGSERIAL PRIMARY KEY,
  parent_lp_id BIGINT NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  child_lp_id BIGINT NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  wo_id BIGINT REFERENCES work_orders(id) ON DELETE SET NULL,
  relationship_type TEXT NOT NULL DEFAULT 'produced_from',
  quantity_used DECIMAL(15,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(wo_id);

-- Pallets
CREATE TABLE pallets (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pallet_number TEXT NOT NULL,
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'Open',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pallets_unique_number_per_org UNIQUE (org_id, pallet_number)
);

CREATE INDEX idx_pallets_org_id ON pallets(org_id);

-- Pallet Items
CREATE TABLE pallet_items (
  id BIGSERIAL PRIMARY KEY,
  pallet_id BIGINT NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  lp_id BIGINT NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pallet_items_pallet_id ON pallet_items(pallet_id);
CREATE INDEX idx_pallet_items_lp_id ON pallet_items(lp_id);

-- Stock Moves
CREATE TABLE stock_moves (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lp_id BIGINT REFERENCES license_plates(id) ON DELETE SET NULL,
  move_type move_type NOT NULL,
  from_location_id BIGINT REFERENCES locations(id),
  to_location_id BIGINT REFERENCES locations(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  reference_type TEXT,
  reference_id BIGINT,
  notes TEXT,
  moved_by UUID REFERENCES users(id),
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_moves_org_id ON stock_moves(org_id);
CREATE INDEX idx_stock_moves_lp_id ON stock_moves(lp_id);
CREATE INDEX idx_stock_moves_moved_at ON stock_moves(moved_at);

-- Production Outputs
CREATE TABLE production_outputs (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  lp_id BIGINT REFERENCES license_plates(id) ON DELETE SET NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  is_by_product BOOLEAN DEFAULT false,
  produced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  produced_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_production_outputs_org_id ON production_outputs(org_id);
CREATE INDEX idx_production_outputs_wo_id ON production_outputs(wo_id);

-- Audit Log
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id BIGINT,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- PHASE 9: RLS POLICIES
-- ============================================================================

-- Helper function to get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS INTEGER AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_by_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  id = get_user_org_id() OR
  auth.jwt()->>'role' = 'service_role'
);

-- Users policies
CREATE POLICY "users_select" ON users FOR SELECT USING (
  org_id = get_user_org_id() OR
  id = auth.uid() OR
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "users_update" ON users FOR UPDATE USING (
  id = auth.uid() OR
  auth.jwt()->>'role' = 'service_role'
);

-- Generic org_id isolation policy for all business tables
-- Using DO block to create policies programmatically

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'warehouses', 'locations', 'production_lines', 'machines',
    'suppliers', 'tax_codes', 'allergens', 'products', 'boms',
    'routings', 'po_header', 'to_header', 'work_orders', 'asns',
    'grns', 'license_plates', 'pallets', 'stock_moves',
    'production_outputs', 'audit_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Select policy
    EXECUTE format('
      CREATE POLICY "%s_org_select" ON %I FOR SELECT USING (
        org_id = get_user_org_id() OR
        auth.jwt()->>''role'' = ''service_role''
      )', tbl, tbl);

    -- Insert policy
    EXECUTE format('
      CREATE POLICY "%s_org_insert" ON %I FOR INSERT WITH CHECK (
        org_id = get_user_org_id() OR
        auth.jwt()->>''role'' = ''service_role''
      )', tbl, tbl);

    -- Update policy
    EXECUTE format('
      CREATE POLICY "%s_org_update" ON %I FOR UPDATE USING (
        org_id = get_user_org_id() OR
        auth.jwt()->>''role'' = ''service_role''
      )', tbl, tbl);

    -- Delete policy
    EXECUTE format('
      CREATE POLICY "%s_org_delete" ON %I FOR DELETE USING (
        org_id = get_user_org_id() OR
        auth.jwt()->>''role'' = ''service_role''
      )', tbl, tbl);
  END LOOP;
END $$;

-- Child tables (inherit from parent)
-- BOM Items - through boms
CREATE POLICY "bom_items_select" ON bom_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id AND boms.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "bom_items_insert" ON bom_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id AND boms.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "bom_items_update" ON bom_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id AND boms.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "bom_items_delete" ON bom_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id AND boms.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- Similar policies for other child tables...
-- (PO lines, TO lines, WO materials, etc. - inherit from parent)

-- PO Lines
CREATE POLICY "po_line_select" ON po_line FOR SELECT USING (
  EXISTS (SELECT 1 FROM po_header WHERE po_header.id = po_line.po_id AND po_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "po_line_insert" ON po_line FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM po_header WHERE po_header.id = po_line.po_id AND po_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "po_line_update" ON po_line FOR UPDATE USING (
  EXISTS (SELECT 1 FROM po_header WHERE po_header.id = po_line.po_id AND po_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "po_line_delete" ON po_line FOR DELETE USING (
  EXISTS (SELECT 1 FROM po_header WHERE po_header.id = po_line.po_id AND po_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- TO Lines
CREATE POLICY "to_line_select" ON to_line FOR SELECT USING (
  EXISTS (SELECT 1 FROM to_header WHERE to_header.id = to_line.to_id AND to_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "to_line_insert" ON to_line FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM to_header WHERE to_header.id = to_line.to_id AND to_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "to_line_update" ON to_line FOR UPDATE USING (
  EXISTS (SELECT 1 FROM to_header WHERE to_header.id = to_line.to_id AND to_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "to_line_delete" ON to_line FOR DELETE USING (
  EXISTS (SELECT 1 FROM to_header WHERE to_header.id = to_line.to_id AND to_header.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- WO Materials
CREATE POLICY "wo_materials_select" ON wo_materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_materials.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_materials_insert" ON wo_materials FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_materials.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_materials_update" ON wo_materials FOR UPDATE USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_materials.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_materials_delete" ON wo_materials FOR DELETE USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_materials.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- WO Operations
CREATE POLICY "wo_operations_select" ON wo_operations FOR SELECT USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_operations.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_operations_insert" ON wo_operations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_operations.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_operations_update" ON wo_operations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_operations.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_operations_delete" ON wo_operations FOR DELETE USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_operations.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- WO By-Products
CREATE POLICY "wo_by_products_select" ON wo_by_products FOR SELECT USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_by_products.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_by_products_insert" ON wo_by_products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_by_products.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_by_products_update" ON wo_by_products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_by_products.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "wo_by_products_delete" ON wo_by_products FOR DELETE USING (
  EXISTS (SELECT 1 FROM work_orders WHERE work_orders.id = wo_by_products.wo_id AND work_orders.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- ASN Items
CREATE POLICY "asn_items_select" ON asn_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM asns WHERE asns.id = asn_items.asn_id AND asns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "asn_items_insert" ON asn_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM asns WHERE asns.id = asn_items.asn_id AND asns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "asn_items_update" ON asn_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM asns WHERE asns.id = asn_items.asn_id AND asns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "asn_items_delete" ON asn_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM asns WHERE asns.id = asn_items.asn_id AND asns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- GRN Items
CREATE POLICY "grn_items_select" ON grn_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM grns WHERE grns.id = grn_items.grn_id AND grns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "grn_items_insert" ON grn_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM grns WHERE grns.id = grn_items.grn_id AND grns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "grn_items_update" ON grn_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM grns WHERE grns.id = grn_items.grn_id AND grns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "grn_items_delete" ON grn_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM grns WHERE grns.id = grn_items.grn_id AND grns.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- LP Reservations
CREATE POLICY "lp_reservations_select" ON lp_reservations FOR SELECT USING (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_reservations.lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "lp_reservations_insert" ON lp_reservations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_reservations.lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "lp_reservations_update" ON lp_reservations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_reservations.lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "lp_reservations_delete" ON lp_reservations FOR DELETE USING (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_reservations.lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- LP Compositions
CREATE POLICY "lp_compositions_select" ON lp_compositions FOR SELECT USING (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_compositions.parent_lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "lp_compositions_insert" ON lp_compositions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_compositions.parent_lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "lp_compositions_delete" ON lp_compositions FOR DELETE USING (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_compositions.parent_lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- LP Genealogy
CREATE POLICY "lp_genealogy_select" ON lp_genealogy FOR SELECT USING (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_genealogy.parent_lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "lp_genealogy_insert" ON lp_genealogy FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM license_plates WHERE license_plates.id = lp_genealogy.parent_lp_id AND license_plates.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- Pallet Items
CREATE POLICY "pallet_items_select" ON pallet_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM pallets WHERE pallets.id = pallet_items.pallet_id AND pallets.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "pallet_items_insert" ON pallet_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pallets WHERE pallets.id = pallet_items.pallet_id AND pallets.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "pallet_items_delete" ON pallet_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM pallets WHERE pallets.id = pallet_items.pallet_id AND pallets.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- Product Allergens
CREATE POLICY "product_allergens_select" ON product_allergens FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_allergens.product_id AND products.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "product_allergens_insert" ON product_allergens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_allergens.product_id AND products.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "product_allergens_update" ON product_allergens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_allergens.product_id AND products.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "product_allergens_delete" ON product_allergens FOR DELETE USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_allergens.product_id AND products.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- Routing Operations
CREATE POLICY "routing_operations_select" ON routing_operations FOR SELECT USING (
  EXISTS (SELECT 1 FROM routings WHERE routings.id = routing_operations.routing_id AND routings.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "routing_operations_insert" ON routing_operations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM routings WHERE routings.id = routing_operations.routing_id AND routings.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "routing_operations_update" ON routing_operations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM routings WHERE routings.id = routing_operations.routing_id AND routings.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "routing_operations_delete" ON routing_operations FOR DELETE USING (
  EXISTS (SELECT 1 FROM routings WHERE routings.id = routing_operations.routing_id AND routings.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- BOM History
CREATE POLICY "bom_history_select" ON bom_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM boms WHERE boms.id = bom_history.bom_id AND boms.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);
CREATE POLICY "bom_history_insert" ON bom_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM boms WHERE boms.id = bom_history.bom_id AND boms.org_id = get_user_org_id())
  OR auth.jwt()->>'role' = 'service_role'
);

-- ============================================================================
-- PHASE 10: GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all tables to authenticated users (RLS will filter)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- PHASE 11: UTILITY FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'organizations', 'users', 'warehouses', 'locations', 'production_lines',
    'machines', 'suppliers', 'tax_codes', 'allergens', 'products', 'boms',
    'bom_items', 'routings', 'routing_operations', 'po_header', 'po_line',
    'to_header', 'to_line', 'work_orders', 'wo_materials', 'wo_operations',
    'wo_by_products', 'asns', 'asn_items', 'grns', 'grn_items',
    'license_plates', 'pallets'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    ', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify organization exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'default') THEN
    RAISE EXCEPTION 'Default organization not created!';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Default organization created with id: %', (SELECT id FROM organizations WHERE slug = 'default');
END $$;
