-- Migration 040: BOM + Planning Schema with New Fields
-- Purpose: Recreate products, BOMs, bom_items with boxes_per_pallet and packages_per_box
-- Also includes routings and Phase 1 planning tables
-- Date: 2025-01-21

-- =============================================
-- 1. PRODUCTS TABLE
-- =============================================

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
  
  -- App taxonomy (using ENUMs created in 039)
  product_group product_group NOT NULL DEFAULT 'COMPOSITE',
  product_type product_type NOT NULL DEFAULT 'FG',
  
  -- Planning & commercial
  preferred_supplier_id INTEGER REFERENCES suppliers(id),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  std_price NUMERIC(12,4),
  
  -- Routing
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,
  
  -- Metadata
  notes TEXT,
  allergen_ids INTEGER[], -- Legacy field, use product_allergens junction
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraint: FG must be COMPOSITE
  CONSTRAINT check_fg_is_composite CHECK (product_type != 'FG' OR product_group = 'COMPOSITE')
);

CREATE INDEX idx_products_part_number ON products(part_number);
CREATE INDEX idx_products_product_group ON products(product_group);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_preferred_supplier ON products(preferred_supplier_id);
CREATE INDEX idx_products_tax_code ON products(tax_code_id);

-- =============================================
-- 2. BOMS TABLE (with boxes_per_pallet)
-- =============================================

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
  
  -- NEW FIELD: Boxes per pallet capacity
  boxes_per_pallet INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Single active BOM per product
  CONSTRAINT boms_single_active UNIQUE (product_id) WHERE status = 'active'
);

CREATE INDEX idx_boms_product_status ON boms(product_id, status);
CREATE INDEX idx_boms_status ON boms(status);
CREATE INDEX idx_boms_routing ON boms(default_routing_id);
COMMENT ON COLUMN boms.boxes_per_pallet IS 'Full pallet capacity in boxes (for FG products)';

-- =============================================
-- 3. BOM ITEMS TABLE (with packages_per_box)
-- =============================================

CREATE TABLE bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  sequence INTEGER NOT NULL,
  priority INTEGER,
  
  -- Cost & pricing
  unit_cost_std NUMERIC(12,4),
  
  -- Scrap & flags
  scrap_std_pct NUMERIC(5,2) DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  consume_whole_lp BOOLEAN DEFAULT false,
  
  -- Production lines (alternative to production_line_restrictions)
  production_lines TEXT[],
  
  -- PO Prefill fields
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq NUMERIC(12,4),
  
  -- NEW FIELD: Packages per box multiplier
  packages_per_box NUMERIC(12,4) NOT NULL DEFAULT 1,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days > 0),
  CONSTRAINT check_moq_positive CHECK (moq IS NULL OR moq > 0),
  CONSTRAINT check_packages_per_box_positive CHECK (packages_per_box > 0)
);

CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material ON bom_items(material_id);
CREATE INDEX idx_bom_items_tax_code ON bom_items(tax_code_id);
COMMENT ON COLUMN bom_items.packages_per_box IS 'Multiplier: how many packages fit in one box';

-- =============================================
-- 4. ROUTINGS TABLE
-- =============================================

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

CREATE INDEX idx_routings_product ON routings(product_id);
CREATE INDEX idx_routings_active ON routings(is_active);

-- =============================================
-- 5. ROUTING OPERATIONS TABLE
-- =============================================

CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER REFERENCES routings(id),
  operation_name VARCHAR(255) NOT NULL,
  sequence_number INTEGER NOT NULL,
  machine_id INTEGER REFERENCES machines(id),
  estimated_duration_minutes INTEGER,
  setup_time_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_ops_routing ON routing_operations(routing_id);
CREATE INDEX idx_routing_ops_machine ON routing_operations(machine_id);
CREATE INDEX idx_routing_ops_sequence ON routing_operations(routing_id, sequence_number);

-- =============================================
-- 6. PHASE 1 PLANNING: PO HEADER
-- =============================================

CREATE TABLE po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate NUMERIC(10,4),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address TEXT,
  asn_ref VARCHAR(50),
  net_total NUMERIC(12,4),
  vat_total NUMERIC(12,4),
  gross_total NUMERIC(12,4),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_header_number ON po_header(number);
CREATE INDEX idx_po_header_status ON po_header(status);
CREATE INDEX idx_po_header_supplier ON po_header(supplier_id);
CREATE INDEX idx_po_header_dates ON po_header(promised_delivery_date);

-- =============================================
-- 7. PHASE 1 PLANNING: PO LINE
-- =============================================

CREATE TABLE po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_ordered NUMERIC(12,4) NOT NULL,
  qty_received NUMERIC(12,4) DEFAULT 0,
  unit_price NUMERIC(12,4) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 0,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  default_location_id INTEGER REFERENCES locations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT po_line_unique_line UNIQUE (po_id, line_no)
);

CREATE INDEX idx_po_line_po_id ON po_line(po_id);
CREATE INDEX idx_po_line_item_id ON po_line(item_id);
CREATE INDEX idx_po_line_location ON po_line(default_location_id);

-- =============================================
-- 8. PHASE 1 PLANNING: PO CORRECTION
-- =============================================

CREATE TABLE po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id) ON DELETE CASCADE,
  po_line_id INTEGER REFERENCES po_line(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  delta_amount NUMERIC(12,4) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_correction_po_id ON po_correction(po_id);
CREATE INDEX idx_po_correction_po_line_id ON po_correction(po_line_id);

-- =============================================
-- 9. PHASE 1 PLANNING: TO HEADER
-- =============================================

CREATE TABLE to_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  from_wh_id INTEGER REFERENCES warehouses(id),
  to_wh_id INTEGER REFERENCES warehouses(id),
  requested_date TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_to_header_number ON to_header(number);
CREATE INDEX idx_to_header_status ON to_header(status);
CREATE INDEX idx_to_header_warehouses ON to_header(from_wh_id, to_wh_id);

-- =============================================
-- 10. PHASE 1 PLANNING: TO LINE
-- =============================================

CREATE TABLE to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned NUMERIC(12,4) NOT NULL,
  qty_moved NUMERIC(12,4) DEFAULT 0,
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  scan_required BOOLEAN DEFAULT false,
  approved_line BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT to_line_unique_line UNIQUE (to_id, line_no)
);

CREATE INDEX idx_to_line_to_id ON to_line(to_id);
CREATE INDEX idx_to_line_item_id ON to_line(item_id);
CREATE INDEX idx_to_line_locations ON to_line(from_location_id, to_location_id);

-- =============================================
-- 11. AUDIT LOG
-- =============================================

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

