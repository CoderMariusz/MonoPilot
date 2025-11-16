-- ============================================================================
-- Master Migration (Generated from Architecture.md)
-- ============================================================================
-- Date: 2025-11-15T21:54:04.927Z
-- Story: 0.12 - Architecture.md Auto-Generation Setup
-- Tables: 45
-- Generator: Automated Script (generate-master-migration.mjs)
-- Source: docs/architecture.md (Database Schema Reference section)
--
-- Purpose: Complete database schema for MonoPilot MES
--          Generated from single source of truth (Architecture.md)
--
-- Topological Levels: 7 (0-6)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM Types
-- ============================================================================

CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
CREATE TYPE product_group AS ENUM ('COMPOSITE', 'SIMPLE');
CREATE TYPE product_type AS ENUM ('RM', 'DG', 'PR', 'FG', 'WIP');


-- ============================================================================
-- LEVEL 0: Foundation tables (no dependencies)
-- ============================================================================

-- Table: users

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

---

-- Table: suppliers

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

---

-- Table: warehouses

CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: allergens

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

---

-- Table: settings_tax_codes

CREATE TABLE settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: routing_operation_names

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

---


-- ============================================================================
-- LEVEL 1: Settings & infrastructure (depend on Level 0)
-- ============================================================================

-- Table: locations

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

---

-- Table: machines

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

---

-- Table: production_lines

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

---

-- Table: settings_warehouse

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

---

-- Table: warehouse_settings

CREATE TABLE warehouse_settings (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) UNIQUE,
  default_to_receive_location_id INTEGER REFERENCES locations(id),
  default_po_receive_location_id INTEGER REFERENCES locations(id),
  default_transit_location_id INTEGER REFERENCES locations(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

---


-- ============================================================================
-- LEVEL 2: Master data (products, routings)
-- ============================================================================

-- Table: products

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

---

-- Table: routings

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

---

-- Table: audit_log

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---


-- ============================================================================
-- LEVEL 3: BOM structure & product details
-- ============================================================================

-- Table: product_allergens

CREATE TABLE product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  allergen_id INTEGER NOT NULL REFERENCES allergens(id),
  contains BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);

---

-- Table: boms

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

---

-- Table: bom_history

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

---

-- Table: routing_operations

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

---

-- Table: bom_items

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

---

-- Table: material_costs

CREATE TABLE IF NOT EXISTS material_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost information
  cost DECIMAL(15, 4) NOT NULL CHECK (cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  uom VARCHAR(10) NOT NULL,

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Source tracking
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'supplier', 'average', 'import')),
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT material_costs_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

---

-- Table: product_prices

CREATE TABLE IF NOT EXISTS product_prices (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Price information
  price DECIMAL(15, 4) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Price type
  price_type VARCHAR(20) NOT NULL DEFAULT 'wholesale' CHECK (
    price_type IN ('wholesale', 'retail', 'export', 'internal', 'custom')
  ),
  customer_id BIGINT, -- Optional: for customer-specific pricing

  -- Additional info
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_prices_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

---


-- ============================================================================
-- LEVEL 4: Orders & planning (WO, PO, TO)
-- ============================================================================

-- Table: work_orders

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

---

-- Table: bom_costs

CREATE TABLE IF NOT EXISTS bom_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost breakdown
  total_cost DECIMAL(15, 4) NOT NULL CHECK (total_cost >= 0),
  material_costs DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (material_costs >= 0),
  labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (overhead_cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Detailed breakdown (JSONB for flexibility)
  material_costs_json JSONB,

  -- Calculation metadata
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  calculated_by BIGINT REFERENCES users(id),
  calculation_method VARCHAR(50) DEFAULT 'standard',
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---

-- Table: po_header

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

---

-- Table: to_header

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

---

-- Table: asns

CREATE TABLE asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
  expected_arrival TIMESTAMPTZ NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: grns

CREATE TABLE grns (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
  received_date TIMESTAMPTZ NOT NULL,
  received_by INTEGER,
  supplier_id INTEGER REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

---


-- ============================================================================
-- LEVEL 5: Order details & execution
-- ============================================================================

-- Table: wo_materials

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

---

-- Table: wo_operations

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

---

-- Table: wo_by_products

CREATE TABLE IF NOT EXISTS wo_by_products (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_quantity NUMERIC(12,4) NOT NULL,
  actual_quantity NUMERIC(12,4) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER REFERENCES license_plates(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_by_products_expected_qty_positive CHECK (expected_quantity > 0),
  CONSTRAINT wo_by_products_actual_qty_non_negative CHECK (actual_quantity >= 0)
);

---

-- Table: wo_reservations

CREATE TABLE IF NOT EXISTS wo_reservations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES products(id), -- Material from BOM
  lp_id INTEGER NOT NULL REFERENCES license_plates(id), -- Actual LP reserved
  quantity_reserved NUMERIC(12,4) NOT NULL CHECK (quantity_reserved > 0),
  quantity_consumed NUMERIC(12,4) DEFAULT 0 CHECK (quantity_consumed >= 0 AND quantity_consumed <= quantity_reserved),
  uom VARCHAR(20) NOT NULL,
  operation_sequence INTEGER, -- Which BOM operation
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES auth.users(id),
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  notes TEXT
);

---

-- Table: wo_costs

CREATE TABLE IF NOT EXISTS wo_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Planned costs (from BOM at WO creation)
  planned_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (planned_cost >= 0),
  planned_material_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,

  -- Actual costs (from actual consumption)
  actual_cost DECIMAL(15, 4) DEFAULT 0 CHECK (actual_cost >= 0),
  actual_material_cost DECIMAL(15, 4) DEFAULT 0,
  actual_labor_cost DECIMAL(15, 4) DEFAULT 0,
  actual_overhead_cost DECIMAL(15, 4) DEFAULT 0,

  -- Variance
  cost_variance DECIMAL(15, 4) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
  variance_percent DECIMAL(8, 4) GENERATED ALWAYS AS (
    CASE
      WHEN planned_cost > 0 THEN ((actual_cost - planned_cost) / planned_cost * 100)
      ELSE 0
    END
  ) STORED,

  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Calculation metadata
  planned_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actual_calculated_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---

-- Table: production_outputs

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

---

-- Table: po_line

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

---

-- Table: po_correction

CREATE TABLE po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  po_line_id INTEGER REFERENCES po_line(id),
  reason TEXT NOT NULL,
  delta_amount NUMERIC(12,2) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: to_line

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

---

-- Table: asn_items

CREATE TABLE asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id),
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: grn_items

CREATE TABLE grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id),
  product_id INTEGER REFERENCES products(id),
  quantity_ordered NUMERIC(12,4) NOT NULL,
  quantity_received NUMERIC(12,4) NOT NULL,
  quantity_accepted NUMERIC(12,4),
  location_id INTEGER REFERENCES locations(id),
  unit_price NUMERIC(12,4),
  batch VARCHAR(100),
  batch_number VARCHAR(100),
  mfg_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: pallets

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

---

-- Table: pallet_items

CREATE TABLE pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER NOT NULL REFERENCES pallets(id),
  box_count NUMERIC(12,4) NOT NULL,
  material_snapshot JSONB,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---


-- ============================================================================
-- LEVEL 6: Inventory & traceability (LP genealogy)
-- ============================================================================

-- Table: license_plates

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

---

-- Table: lp_reservations

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

---

-- Table: lp_compositions

CREATE TABLE lp_compositions (
  id SERIAL PRIMARY KEY,
  output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  qty NUMERIC(12,4) NOT NULL,
  uom VARCHAR(50) NOT NULL,
  op_seq INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---

-- Table: lp_genealogy

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

---

-- Table: stock_moves

CREATE TABLE stock_moves (
  id SERIAL PRIMARY KEY,
  move_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  move_type VARCHAR(50) NOT NULL,
  move_source VARCHAR(50) DEFAULT 'portal',
  move_status VARCHAR(20) DEFAULT 'completed',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

---


-- ============================================================================
-- END OF MASTER MIGRATION
-- ============================================================================

-- Summary:
--   Tables created: 45/45
--   Topological levels: 7
--   ENUM types: 3
--   Extensions: 2
--   Estimated indexes: 0

