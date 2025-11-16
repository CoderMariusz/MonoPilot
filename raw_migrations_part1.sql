-- Migration 000: Create ENUMs
-- Purpose: Define custom ENUM types used across the database
-- Date: 2025-01-11
-- Dependencies: None

-- =============================================
-- ENUM TYPES
-- =============================================

-- Product classification enums
CREATE TYPE product_group AS ENUM ('MEAT', 'DRYGOODS', 'COMPOSITE');
CREATE TYPE product_type AS ENUM ('RM_MEAT', 'PR', 'FG', 'DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE');

-- BOM lifecycle status
CREATE TYPE bom_status AS ENUM ('draft', 'active', 'archived');

-- Comments
COMMENT ON TYPE product_group IS 'High-level product grouping: MEAT, DRYGOODS, or COMPOSITE (mixed)';
COMMENT ON TYPE product_type IS 'Detailed product type classification for app taxonomy';
COMMENT ON TYPE bom_status IS 'BOM lifecycle status: draft (editable), active (in use), archived (historical)';

-- Migration 001: Users Table
-- Purpose: User management and authentication
-- Date: 2025-01-11
-- Dependencies: auth.users (Supabase Auth)

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

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Comments
COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: Operator, Planner, Technical, Purchasing, Warehouse, QC, Admin';
COMMENT ON COLUMN users.status IS 'User account status: Active or Inactive';

-- Migration 002: Suppliers Table
-- Purpose: Supplier master data for procurement
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE suppliers (
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

-- Indexes
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- Comments
COMMENT ON TABLE suppliers IS 'Supplier master data for procurement and purchasing';
COMMENT ON COLUMN suppliers.address IS 'Supplier address stored as JSONB for flexibility';
COMMENT ON COLUMN suppliers.default_tax_code_id IS 'Default tax code for this supplier (FK set in later migration)';

-- Migration 003: Warehouses Table
-- Purpose: Warehouse master data
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_warehouses_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_code ON warehouses(code);

-- Comments
COMMENT ON TABLE warehouses IS 'Warehouse master data for inventory management';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse identifier code';

-- Migration 004: Locations Table
-- Purpose: Storage locations within warehouses
-- Date: 2025-01-11
-- Dependencies: 003_warehouses

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER REFERENCES warehouses(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_active ON locations(is_active);

-- Comments
COMMENT ON TABLE locations IS 'Storage locations within warehouses (e.g., aisles, bins, zones)';
COMMENT ON COLUMN locations.type IS 'Location type: receiving, storage, picking, staging, etc.';

-- Migration 005: Settings Tax Codes Table
-- Purpose: Tax codes and VAT rates
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tax_codes_code ON settings_tax_codes(code);
CREATE INDEX idx_tax_codes_active ON settings_tax_codes(is_active);

-- Comments
COMMENT ON TABLE settings_tax_codes IS 'Tax codes and VAT rates for products and transactions';
COMMENT ON COLUMN settings_tax_codes.rate IS 'Tax rate as decimal (e.g., 0.2300 for 23%)';

-- Migration 005a: Warehouse Settings Table
-- Purpose: Warehouse-specific settings including default locations for PO and TO receiving
-- Date: 2025-01-11
-- Dependencies: 003_warehouses, 004_locations

CREATE TABLE settings_warehouse (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER UNIQUE NOT NULL REFERENCES warehouses(id),
  default_receiving_location_id INTEGER REFERENCES locations(id),
  default_shipping_location_id INTEGER REFERENCES locations(id),
  allow_negative_stock BOOLEAN DEFAULT false,
  auto_assign_location BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_settings_warehouse_warehouse ON settings_warehouse(warehouse_id);
CREATE INDEX idx_settings_warehouse_receiving_loc ON settings_warehouse(default_receiving_location_id);

-- Comments
COMMENT ON TABLE settings_warehouse IS 'Warehouse-specific settings including default locations for receiving and shipping';
COMMENT ON COLUMN settings_warehouse.default_receiving_location_id IS 'Default location where goods are received (for PO and TO receiving). When operator scans LP during TO receiving, it goes here first';
COMMENT ON COLUMN settings_warehouse.default_shipping_location_id IS 'Default location for staging goods before shipping';
COMMENT ON COLUMN settings_warehouse.allow_negative_stock IS 'Allow negative stock levels in this warehouse';
COMMENT ON COLUMN settings_warehouse.auto_assign_location IS 'Automatically assign products to default location when received';

-- Migration 006: Allergens Table
-- Purpose: Allergen master data for food safety compliance
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE allergens (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_allergens_code ON allergens(code);
CREATE INDEX idx_allergens_active ON allergens(is_active);

-- Comments
COMMENT ON TABLE allergens IS 'Allergen master data for food safety and labeling compliance';
COMMENT ON COLUMN allergens.icon IS 'Icon identifier for UI display';

-- Migration 007: Machines Table
-- Purpose: Production machines and equipment
-- Date: 2025-01-11
-- Dependencies: 004_locations

CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50),
  location_id INTEGER REFERENCES locations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_machines_code ON machines(code);
CREATE INDEX idx_machines_location ON machines(location_id);
CREATE INDEX idx_machines_active ON machines(is_active);

-- Comments
COMMENT ON TABLE machines IS 'Production machines and equipment master data';
COMMENT ON COLUMN machines.type IS 'Machine type: grinder, mixer, packer, etc.';

-- Migration 008: Production Lines Table
-- Purpose: Production lines for manufacturing operations
-- Date: 2025-01-11
-- Dependencies: 001_users, 003_warehouses

CREATE TABLE production_lines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_production_lines_code ON production_lines(code);
CREATE INDEX idx_production_lines_status ON production_lines(status);
CREATE INDEX idx_production_lines_warehouse ON production_lines(warehouse_id);

-- Comments
COMMENT ON TABLE production_lines IS 'Production lines for manufacturing operations';
COMMENT ON COLUMN production_lines.code IS 'Unique line code (e.g., LINE-4, LINE-5)';
COMMENT ON COLUMN production_lines.status IS 'Line operational status';
COMMENT ON COLUMN production_lines.warehouse_id IS 'Optional warehouse association';

-- Migration 009: Products Table
-- Purpose: Product master data (materials, semi-finished, finished goods)
-- Date: 2025-01-11
-- Dependencies: 000_enums, 001_users, 002_suppliers, 005_settings_tax_codes

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('RM', 'DG', 'PR', 'FG', 'WIP')),
  subtype VARCHAR(100),
  uom VARCHAR(20) NOT NULL,
  expiry_policy VARCHAR(50) CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  shelf_life_days INTEGER,
  production_lines TEXT[],
  is_active BOOLEAN DEFAULT true,
  
  -- App taxonomy (using ENUMs)
  product_group product_group NOT NULL DEFAULT 'COMPOSITE',
  product_type product_type NOT NULL DEFAULT 'FG',
  
  -- Planning & commercial
  supplier_id INTEGER REFERENCES suppliers(id),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  std_price NUMERIC(12,4),
  
  -- Routing
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,
  
  -- Metadata
  notes TEXT,
  allergen_ids INTEGER[],
  
  -- Packaging
  boxes_per_pallet INTEGER,
  packs_per_box INTEGER,
  
  -- Versioning
  product_version VARCHAR(20) DEFAULT '1.0',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_products_part_number ON products(part_number);
CREATE INDEX idx_products_product_group ON products(product_group);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_tax_code ON products(tax_code_id);

-- Comments
COMMENT ON TABLE products IS 'Product master data including raw materials, dry goods, semi-finished, and finished goods';
COMMENT ON COLUMN products.type IS 'Product type: RM (raw material), DG (dry goods), PR (process), FG (finished good), WIP (work in progress)';
COMMENT ON COLUMN products.product_group IS 'High-level grouping: MEAT, DRYGOODS, COMPOSITE';
COMMENT ON COLUMN products.product_type IS 'Detailed app taxonomy classification';
COMMENT ON COLUMN products.boxes_per_pallet IS 'Number of boxes that fit on one pallet';
COMMENT ON COLUMN products.packs_per_box IS 'Number of packs (units) that fit in one box';
COMMENT ON COLUMN products.product_version IS 'Product version in X.Y format. Minor bump for metadata changes, major bump manual';

-- Migration 010: BOMs Table
-- Purpose: Bill of Materials - product composition definitions
-- Date: 2025-01-11
-- Dependencies: 000_enums, 009_products

CREATE TABLE boms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  version VARCHAR(50) NOT NULL,
  
  -- BOM Lifecycle
  status bom_status NOT NULL DEFAULT 'draft',
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- BOM Configuration
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,
  notes TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  
  -- Packaging
  boxes_per_pallet INTEGER,
  
  -- Line restrictions
  line_id INTEGER[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Single active BOM per product
  CONSTRAINT boms_single_active UNIQUE (product_id) WHERE status = 'active'
);

-- Indexes
CREATE INDEX idx_boms_product_status ON boms(product_id, status);
CREATE INDEX idx_boms_status ON boms(status);
CREATE INDEX idx_boms_routing ON boms(default_routing_id);

-- Comments
COMMENT ON TABLE boms IS 'Bill of Materials - defines product composition and manufacturing recipe';
COMMENT ON COLUMN boms.status IS 'BOM lifecycle: draft (editable), active (in use), archived (historical)';
COMMENT ON COLUMN boms.boxes_per_pallet IS 'Full pallet capacity in boxes (for FG products)';
COMMENT ON COLUMN boms.line_id IS 'Array of production line IDs. NULL = available on all lines';
COMMENT ON CONSTRAINT boms_single_active ON boms IS 'Ensures only one active BOM per product at a time';

-- Migration 011: BOM Items Table
-- Purpose: Individual materials/components in a BOM
-- Date: 2025-01-11
-- Dependencies: 005_settings_tax_codes, 009_products, 010_boms

CREATE TABLE bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id),
  material_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  quantity NUMERIC(12,4) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  sequence INTEGER NOT NULL,
  priority INTEGER,
  
  -- Costing
  unit_cost_std NUMERIC(12,4),
  scrap_std_pct NUMERIC(5,2) DEFAULT 0,
  
  -- Flags
  is_optional BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  consume_whole_lp BOOLEAN DEFAULT false,
  
  -- Planning
  production_lines TEXT[],
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days > 0),
  moq NUMERIC(12,4) CHECK (moq IS NULL OR moq > 0),
  
  -- Packaging
  packages_per_box NUMERIC(10,4) NOT NULL DEFAULT 1 CHECK (packages_per_box > 0),
  
  -- Line-specific materials
  line_id INTEGER[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(material_id);
CREATE INDEX idx_bom_items_sequence ON bom_items(bom_id, sequence);

-- Comments
COMMENT ON TABLE bom_items IS 'Individual materials/components in a BOM with quantities and specifications';
COMMENT ON COLUMN bom_items.packages_per_box IS 'Multiplier: how many packages fit in one box';
COMMENT ON COLUMN bom_items.line_id IS 'Array of line IDs for this material. NULL = available on all lines from parent BOM. Enables line-specific materials (e.g., Box 12 for Line 4, Box 34 for Line 5)';
COMMENT ON COLUMN bom_items.consume_whole_lp IS 'If true, material must be consumed as whole license plate (1:1 rule)';

-- Migration 012: BOM History Table
-- Purpose: Audit trail for BOM changes
-- Date: 2025-01-11
-- Dependencies: 001_users, 010_boms

CREATE TABLE bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id),
  version VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_from VARCHAR(20),
  status_to VARCHAR(20),
  changes JSONB NOT NULL,
  description TEXT
);

-- Indexes
CREATE INDEX idx_bom_history_bom ON bom_history(bom_id);
CREATE INDEX idx_bom_history_changed_at ON bom_history(changed_at);
CREATE INDEX idx_bom_history_changed_by ON bom_history(changed_by);

-- Comments
COMMENT ON TABLE bom_history IS 'Audit trail for BOM changes and status transitions';
COMMENT ON COLUMN bom_history.changes IS 'JSONB containing detailed changes (added/removed/modified items)';

-- Migration 013: Routings Table
-- Purpose: Production routings - sequence of operations
-- Date: 2025-01-11
-- Dependencies: 001_users, 009_products

CREATE TABLE routings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_routings_product ON routings(product_id);
CREATE INDEX idx_routings_active ON routings(is_active);

-- Comments
COMMENT ON TABLE routings IS 'Production routings defining sequence of manufacturing operations';

-- Migration 014: Routing Operations Table
-- Purpose: Individual operations within a routing
-- Date: 2025-01-11
-- Dependencies: 007_machines, 013_routings

CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER REFERENCES routings(id),
  operation_name VARCHAR(200) NOT NULL,
  sequence_number INTEGER NOT NULL,
  machine_id INTEGER REFERENCES machines(id),
  estimated_duration_minutes INTEGER,
  setup_time_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  requirements TEXT[] DEFAULT '{}',
  code VARCHAR(50),
  description TEXT,
  expected_yield_pct NUMERIC(5,2) DEFAULT 100.0 CHECK (expected_yield_pct >= 0 AND expected_yield_pct <= 100)
);

-- Indexes
CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);
CREATE INDEX idx_routing_operations_machine ON routing_operations(machine_id);
CREATE INDEX idx_routing_operations_sequence ON routing_operations(routing_id, sequence_number);

-- Comments
COMMENT ON TABLE routing_operations IS 'Individual operations within a routing with timing and resource requirements';
COMMENT ON COLUMN routing_operations.machine_id IS 'Optional machine assignment for this operation';
COMMENT ON COLUMN routing_operations.expected_yield_pct IS 'Expected yield percentage for this operation (0-100). Used for reporting and variance analysis.';

-- Migration 015: Routing Operation Names Table
-- Purpose: Dictionary of standard operation names
-- Date: 2025-01-11
-- Dependencies: 001_users

CREATE TABLE routing_operation_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  alias VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_routing_operation_names_name ON routing_operation_names(name);
CREATE INDEX idx_routing_operation_names_active ON routing_operation_names(is_active);

-- Comments
COMMENT ON TABLE routing_operation_names IS 'Dictionary of standard operation names for routing definitions';
COMMENT ON COLUMN routing_operation_names.name IS 'Standard operation name';
COMMENT ON COLUMN routing_operation_names.alias IS 'Alternative name or short code';

-- Migration 016: Purchase Order Header Table
-- Purpose: Purchase order master records
-- Date: 2025-01-11
-- Dependencies: 001_users, 002_suppliers

CREATE TABLE po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate NUMERIC(12,6),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  payment_due_date TIMESTAMPTZ,
  
  -- Supplier snapshot (for historical accuracy)
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address TEXT,
  
  -- ASN reference
  asn_ref VARCHAR(50),
  
  -- Totals
  net_total NUMERIC(12,2),
  vat_total NUMERIC(12,2),
  gross_total NUMERIC(12,2),
  
  -- Audit
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_header_number ON po_header(number);
CREATE INDEX idx_po_header_supplier ON po_header(supplier_id);
CREATE INDEX idx_po_header_status ON po_header(status);
CREATE INDEX idx_po_header_order_date ON po_header(order_date);

-- Comments
COMMENT ON TABLE po_header IS 'Purchase order master records';
COMMENT ON COLUMN po_header.payment_due_date IS 'Payment deadline (e.g., Net 30 from invoice date)';
COMMENT ON COLUMN po_header.snapshot_supplier_name IS 'Supplier name snapshot at time of PO creation';

-- Migration 017: Purchase Order Line Table
-- Purpose: Individual line items in purchase orders
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products, 016_po_header

CREATE TABLE po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_ordered NUMERIC(12,4) NOT NULL,
  qty_received NUMERIC(12,4) DEFAULT 0,
  unit_price NUMERIC(12,4) NOT NULL,
  vat_rate NUMERIC(5,4) DEFAULT 0,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  default_location_id INTEGER REFERENCES locations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_line_po ON po_line(po_id);
CREATE INDEX idx_po_line_item ON po_line(item_id);
CREATE INDEX idx_po_line_location ON po_line(default_location_id);

-- Comments
COMMENT ON TABLE po_line IS 'Individual line items in purchase orders with quantities and pricing';
COMMENT ON COLUMN po_line.qty_ordered IS 'Quantity ordered from supplier';
COMMENT ON COLUMN po_line.qty_received IS 'Quantity received to date (updated via GRN)';

-- Migration 018: PO Correction Table
-- Purpose: Track corrections and adjustments to purchase orders
-- Date: 2025-01-11
-- Dependencies: 001_users, 016_po_header, 017_po_line

CREATE TABLE po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  po_line_id INTEGER REFERENCES po_line(id),
  reason TEXT NOT NULL,
  delta_amount NUMERIC(12,2) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_correction_po ON po_correction(po_id);
CREATE INDEX idx_po_correction_line ON po_correction(po_line_id);
CREATE INDEX idx_po_correction_created_at ON po_correction(created_at);

-- Comments
COMMENT ON TABLE po_correction IS 'Audit trail for purchase order corrections and price adjustments';
COMMENT ON COLUMN po_correction.delta_amount IS 'Amount adjustment (positive or negative)';

-- Migration 019: Transfer Order Header Table
-- Purpose: Transfer orders between warehouses (warehouse-to-warehouse, NOT location-to-location)
-- Date: 2025-01-11
-- Dependencies: 001_users, 003_warehouses

CREATE TABLE to_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled')),
  from_wh_id INTEGER REFERENCES warehouses(id),
  to_wh_id INTEGER REFERENCES warehouses(id),
  requested_date TIMESTAMPTZ,
  planned_ship_date TIMESTAMPTZ,
  actual_ship_date TIMESTAMPTZ,
  planned_receive_date TIMESTAMPTZ,
  actual_receive_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_to_header_number ON to_header(number);
CREATE INDEX idx_to_header_status ON to_header(status);
CREATE INDEX idx_to_header_from_wh ON to_header(from_wh_id);
CREATE INDEX idx_to_header_to_wh ON to_header(to_wh_id);

-- Comments
COMMENT ON TABLE to_header IS 'Transfer orders for moving inventory between warehouses (warehouse-to-warehouse transport, NOT location-to-location)';
COMMENT ON COLUMN to_header.from_wh_id IS 'Source warehouse - products shipped FROM here';
COMMENT ON COLUMN to_header.to_wh_id IS 'Destination warehouse - products shipped TO here';
COMMENT ON COLUMN to_header.status IS 'draft: created, submitted: approved for shipping, in_transit: shipped (products in transit/virtual location), received: arrived at destination, closed: completed, cancelled: cancelled';
COMMENT ON COLUMN to_header.planned_ship_date IS 'Planned date for shipping goods from source warehouse';
COMMENT ON COLUMN to_header.actual_ship_date IS 'Actual date when goods were shipped - products move to TRANSIT status';
COMMENT ON COLUMN to_header.planned_receive_date IS 'Planned date for receiving goods at destination warehouse';
COMMENT ON COLUMN to_header.actual_receive_date IS 'Actual date when goods were received - products move to default receiving location in destination warehouse';

-- Migration 020: Transfer Order Line Table
-- Purpose: Individual line items in transfer orders
-- Date: 2025-01-11
-- Dependencies: 009_products, 019_to_header
-- Note: TO is warehouse-to-warehouse transfer, NOT location-to-location

CREATE TABLE to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned NUMERIC(12,4) NOT NULL,
  qty_shipped NUMERIC(12,4) DEFAULT 0,
  qty_received NUMERIC(12,4) DEFAULT 0,
  lp_id INTEGER,
  batch VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_to_line_to ON to_line(to_id);
CREATE INDEX idx_to_line_item ON to_line(item_id);
CREATE INDEX idx_to_line_lp ON to_line(lp_id);

-- Comments
COMMENT ON TABLE to_line IS 'Individual line items in transfer orders - warehouse to warehouse transfer (NO specific locations)';
COMMENT ON COLUMN to_line.qty_shipped IS 'Quantity shipped from source warehouse';
COMMENT ON COLUMN to_line.qty_received IS 'Quantity received at destination warehouse';
COMMENT ON COLUMN to_line.lp_id IS 'License Plate scanned for this transfer';
COMMENT ON COLUMN to_line.batch IS 'Batch/lot number of transferred material';
COMMENT ON COLUMN to_line.notes IS 'Additional notes for this line item';

-- Migration 021: Work Orders Table
-- Purpose: Manufacturing work orders
-- Date: 2025-01-11
-- Dependencies: 007_machines, 008_production_lines, 009_products, 010_boms

CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  bom_id INTEGER REFERENCES boms(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(20) NOT NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  machine_id INTEGER REFERENCES machines(id),
  line_id INTEGER NOT NULL REFERENCES production_lines(id),
  source_demand_type VARCHAR(50),
  source_demand_id INTEGER,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_number ON work_orders(wo_number);
CREATE INDEX idx_wo_status_scheduled ON work_orders(status, scheduled_start);
CREATE INDEX idx_wo_product_status ON work_orders(product_id, status);
CREATE INDEX idx_wo_bom ON work_orders(bom_id);
CREATE INDEX idx_wo_line ON work_orders(line_id);

-- Comments
COMMENT ON TABLE work_orders IS 'Manufacturing work orders for production execution';
COMMENT ON COLUMN work_orders.line_id IS 'Production line where this WO will be executed';

-- Migration 022: WO Materials Table
-- Purpose: BOM snapshot for work orders
-- Date: 2025-01-11
-- Dependencies: 009_products, 021_work_orders

CREATE TABLE wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  qty_per_unit NUMERIC(12,4) NOT NULL,
  total_qty_needed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  production_line_restrictions TEXT[] DEFAULT '{}',
  consume_whole_lp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_material ON wo_materials(material_id);

-- Comments
COMMENT ON TABLE wo_materials IS 'BOM snapshot for work orders - materials required for production';
COMMENT ON COLUMN wo_materials.consume_whole_lp IS 'Hard 1:1 rule for WO material consumption';

-- Migration 023: WO Operations Table
-- Purpose: Operation tracking for work orders
-- Date: 2025-01-11
-- Dependencies: 001_users, 014_routing_operations, 021_work_orders

CREATE TABLE wo_operations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  routing_operation_id INTEGER REFERENCES routing_operations(id),
  seq_no INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  operator_id UUID REFERENCES users(id),
  device_id INTEGER,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
CREATE INDEX idx_wo_operations_status ON wo_operations(status);
CREATE INDEX idx_wo_operations_operator ON wo_operations(operator_id);

-- Comments
COMMENT ON TABLE wo_operations IS 'Operation tracking for work orders - progress through manufacturing steps';

-- Migration 024: Production Outputs Table
-- Purpose: Track production output quantities
-- Date: 2025-01-11
-- Dependencies: 009_products, 021_work_orders

CREATE TABLE production_outputs (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_production_outputs_wo ON production_outputs(wo_id);
CREATE INDEX idx_production_outputs_product ON production_outputs(product_id);
CREATE INDEX idx_production_outputs_lp ON production_outputs(lp_id);

-- Comments
COMMENT ON TABLE production_outputs IS 'Track production output quantities and link to license plates';

-- Migration 025: License Plates Table
-- Purpose: Warehouse inventory units with traceability
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products, 021_work_orders

CREATE TABLE license_plates (
  id SERIAL PRIMARY KEY,
  lp_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'EACH', 'METER', 'LITER')),
  location_id INTEGER REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged')),
  qa_status VARCHAR(20) DEFAULT 'pending' CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold')),
  stage_suffix VARCHAR(10) CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  batch_number VARCHAR(100),
  lp_type VARCHAR(20) CHECK (lp_type IN ('PR', 'FG', 'PALLET')),
  
  -- Traceability
  consumed_by_wo_id INTEGER REFERENCES work_orders(id),
  consumed_at TIMESTAMPTZ,
  parent_lp_id INTEGER REFERENCES license_plates(id),
  parent_lp_number VARCHAR(50),
  origin_type VARCHAR(50),
  origin_ref JSONB,
  
  -- Metadata
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_license_plates_number ON license_plates(lp_number);
CREATE INDEX idx_license_plates_product ON license_plates(product_id);
CREATE INDEX idx_license_plates_location ON license_plates(location_id);
CREATE INDEX idx_license_plates_status ON license_plates(status);
CREATE INDEX idx_license_plates_qa_status ON license_plates(qa_status);
CREATE INDEX idx_license_plates_parent_lp ON license_plates(parent_lp_id);
CREATE INDEX idx_license_plates_consumed_by_wo ON license_plates(consumed_by_wo_id);
CREATE INDEX idx_license_plates_lp_type ON license_plates(lp_type);

-- Comments
COMMENT ON TABLE license_plates IS 'Warehouse inventory units with full traceability and genealogy';
COMMENT ON COLUMN license_plates.status IS 'LP status: available (in stock), reserved (allocated to WO), consumed (used in production), in_transit (being transferred between warehouses), quarantine (QA hold), damaged';
COMMENT ON COLUMN license_plates.qa_status IS 'QA status: pending (awaiting inspection), passed (approved), failed (rejected), on_hold (inspection paused)';
COMMENT ON COLUMN license_plates.location_id IS 'Physical location in warehouse. NULL when status=in_transit (virtual transit location)';
COMMENT ON COLUMN license_plates.lp_type IS 'LP type: PR (Process), FG (Finished Good/Box), PALLET';
COMMENT ON COLUMN license_plates.stage_suffix IS 'Two-letter stage identifier for process LPs';

-- Migration 026: LP Reservations Table
-- Purpose: Reserve license plates for work orders
-- Date: 2025-01-11
-- Dependencies: 021_work_orders, 025_license_plates

CREATE TABLE lp_reservations (
  id SERIAL PRIMARY KEY,
  lp_id INTEGER NOT NULL REFERENCES license_plates(id),
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  qty NUMERIC(12,4) NOT NULL CHECK (qty > 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_lp_reservations_lp ON lp_reservations(lp_id);
CREATE INDEX idx_lp_reservations_wo ON lp_reservations(wo_id);
CREATE INDEX idx_lp_reservations_status ON lp_reservations(status);

-- Comments
COMMENT ON TABLE lp_reservations IS 'Reserve license plates for specific work orders';

-- Migration 027: LP Compositions Table
-- Purpose: Track input-output relationships between license plates
-- Date: 2025-01-11
-- Dependencies: 025_license_plates

CREATE TABLE lp_compositions (
  id SERIAL PRIMARY KEY,
  output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  qty NUMERIC(12,4) NOT NULL,
  uom VARCHAR(50) NOT NULL,
  op_seq INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lp_compositions_output ON lp_compositions(output_lp_id);
CREATE INDEX idx_lp_compositions_input ON lp_compositions(input_lp_id);
CREATE INDEX idx_lp_compositions_op_seq ON lp_compositions(op_seq);

-- Comments
COMMENT ON TABLE lp_compositions IS 'Track input-output relationships between license plates for full traceability';

-- Migration 028: LP Genealogy Table
-- Purpose: Parent-child relationships for license plates
-- Date: 2025-01-11
-- Dependencies: 021_work_orders, 025_license_plates

CREATE TABLE lp_genealogy (
  id SERIAL PRIMARY KEY,
  child_lp_id INTEGER NOT NULL REFERENCES license_plates(id),
  parent_lp_id INTEGER REFERENCES license_plates(id),
  quantity_consumed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  wo_id INTEGER REFERENCES work_orders(id),
  operation_sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(wo_id);

-- Comments
COMMENT ON TABLE lp_genealogy IS 'Parent-child relationships for license plates - full genealogy tracking';

-- Migration 029: Pallets Table
-- Purpose: Pallet management for finished goods
-- Date: 2025-01-11
-- Dependencies: 021_work_orders

CREATE TABLE pallets (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  line VARCHAR(50),
  code VARCHAR(50) UNIQUE NOT NULL,
  target_boxes INTEGER,
  actual_boxes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_pallets_wo ON pallets(wo_id);
CREATE INDEX idx_pallets_code ON pallets(code);

-- Comments
COMMENT ON TABLE pallets IS 'Pallet management for finished goods packaging';
COMMENT ON COLUMN pallets.target_boxes IS 'Target boxes per pallet (from BOM boxes_per_pallet)';
COMMENT ON COLUMN pallets.actual_boxes IS 'Actual boxes on pallet (confirmed by operator)';

-- Migration 030: Pallet Items Table
-- Purpose: Items/boxes on pallets with traceability
-- Date: 2025-01-11
-- Dependencies: 029_pallets

CREATE TABLE pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER NOT NULL REFERENCES pallets(id),
  box_count NUMERIC(12,4) NOT NULL,
  material_snapshot JSONB,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);

-- Comments
COMMENT ON TABLE pallet_items IS 'Items/boxes on pallets with material traceability snapshots';
COMMENT ON COLUMN pallet_items.box_count IS 'Aggregated count of boxes on pallet';
COMMENT ON COLUMN pallet_items.material_snapshot IS 'BOM snapshot data for traceability';

