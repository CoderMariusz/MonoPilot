-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table (if not exists)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(10) NOT NULL, -- RM, PR, FG
  category VARCHAR(100),
  subtype VARCHAR(100),
  uom VARCHAR(20) NOT NULL,
  expiry_policy VARCHAR(50),
  shelf_life_days INTEGER,
  production_lines TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOMs table
CREATE TABLE IF NOT EXISTS boms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boms_product_status ON boms(product_id, status);

-- BOM Items table
CREATE TABLE IF NOT EXISTS bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  uom VARCHAR(20) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  sequence INTEGER,
  priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id);

-- Work Orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  bom_id INTEGER REFERENCES boms(id),
  quantity DECIMAL(12, 4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(20) NOT NULL, -- draft, planned, released, in_progress, completed, cancelled
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  machine_id INTEGER,
  line_number VARCHAR(50),
  source_demand_type VARCHAR(50),
  source_demand_id INTEGER,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_status_scheduled ON work_orders(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_wo_product_status ON work_orders(product_id, status);

-- WO Materials (BOM snapshot)
CREATE TABLE IF NOT EXISTS wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  qty_per_unit DECIMAL(12, 4) NOT NULL,
  total_qty_needed DECIMAL(12, 4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_materials_wo ON wo_materials(wo_id);

-- Suppliers table (if not exists)
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tax_number VARCHAR(50),
  default_tax_code_id INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  incoterms VARCHAR(50),
  lead_time_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  warehouse_id INTEGER,
  status VARCHAR(20) NOT NULL, -- draft, submitted, confirmed, received, closed, cancelled
  request_delivery_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10, 4),
  buyer_id INTEGER,
  notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_status_date ON purchase_orders(status, expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_po_supplier_status ON purchase_orders(supplier_id, status);

-- Purchase Order Items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  unit_price_excl_tax DECIMAL(12, 4) NOT NULL,
  tax_code_id INTEGER,
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(12, 4),
  discount_percent DECIMAL(5, 2),
  description_cache TEXT,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);

-- GRNs table
CREATE TABLE IF NOT EXISTS grns (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  status VARCHAR(20) NOT NULL, -- draft, posted, cancelled
  received_date TIMESTAMPTZ NOT NULL,
  received_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grns_po ON grns(po_id);

-- GRN Items table
CREATE TABLE IF NOT EXISTS grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity_ordered DECIMAL(12, 4) NOT NULL,
  quantity_received DECIMAL(12, 4) NOT NULL,
  location_id INTEGER,
  batch VARCHAR(100),
  mfg_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON grn_items(grn_id);

-- Transfer Orders table
CREATE TABLE IF NOT EXISTS transfer_orders (
  id SERIAL PRIMARY KEY,
  to_number VARCHAR(50) UNIQUE NOT NULL,
  from_location_id INTEGER,
  to_location_id INTEGER,
  status VARCHAR(20) NOT NULL, -- draft, submitted, in_transit, received, cancelled
  planned_ship_date TIMESTAMPTZ,
  actual_ship_date TIMESTAMPTZ,
  planned_receive_date TIMESTAMPTZ,
  actual_receive_date TIMESTAMPTZ,
  created_by INTEGER,
  received_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_to_status_date ON transfer_orders(status, planned_ship_date);
CREATE INDEX IF NOT EXISTS idx_to_locations ON transfer_orders(from_location_id, to_location_id);

-- Transfer Order Items table
CREATE TABLE IF NOT EXISTS transfer_order_items (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES transfer_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity_planned DECIMAL(12, 4) NOT NULL,
  quantity_actual DECIMAL(12, 4),
  lp_id INTEGER,
  batch VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_to_items_to ON transfer_order_items(to_id);

-- Audit Events table
CREATE TABLE IF NOT EXISTS audit_events (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id INTEGER,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);

-- ASNs table (Advanced Shipping Notice)
CREATE TABLE IF NOT EXISTS asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  po_id INTEGER REFERENCES purchase_orders(id),
  status VARCHAR(20) NOT NULL, -- draft, submitted, validated, posted, cancelled
  expected_arrival TIMESTAMPTZ NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asns_supplier_status ON asns(supplier_id, status);

-- ASN Items table
CREATE TABLE IF NOT EXISTS asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asn_items_asn ON asn_items(asn_id);
