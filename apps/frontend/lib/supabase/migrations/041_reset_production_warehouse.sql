-- Migration 041: Production & Warehouse Schema with New Fields
-- Purpose: Recreate production tables with lp_type, pallet changes (target_boxes, actual_boxes, box_count)
-- Date: 2025-01-21

-- =============================================
-- 1. WORK ORDERS TABLE
-- =============================================

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
  line_number VARCHAR(50),
  source_demand_type VARCHAR(50),
  source_demand_id INTEGER,
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_status_scheduled ON work_orders(status, scheduled_start);
CREATE INDEX idx_wo_product_status ON work_orders(product_id, status);
CREATE INDEX idx_wo_bom_id ON work_orders(bom_id);

-- =============================================
-- 2. WO MATERIALS TABLE (BOM Snapshot)
-- =============================================

CREATE TABLE wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  qty_per_unit NUMERIC(12,4) NOT NULL,
  total_qty_needed NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  production_line_restrictions TEXT[] DEFAULT '{}',
  consume_whole_lp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_material ON wo_materials(material_id);
COMMENT ON COLUMN wo_materials.consume_whole_lp IS 'Hard 1:1 rule for WO material consumption';

-- =============================================
-- 3. WO OPERATIONS TABLE
-- =============================================

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

CREATE INDEX idx_wo_operations_wo_id ON wo_operations(wo_id);
CREATE INDEX idx_wo_operations_status ON wo_operations(status);

-- =============================================
-- 4. PRODUCTION OUTPUTS TABLE
-- =============================================

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

CREATE INDEX idx_production_outputs_wo ON production_outputs(wo_id);
CREATE INDEX idx_production_outputs_product ON production_outputs(product_id);

-- =============================================
-- 5. LICENSE PLATES TABLE (with lp_type)
-- =============================================

CREATE TABLE license_plates (
  id SERIAL PRIMARY KEY,
  lp_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  location_id INTEGER REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'available',
  qa_status VARCHAR(20) DEFAULT 'pending',
  stage_suffix VARCHAR(10) CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  batch_number VARCHAR(100),
  
  -- NEW FIELD: LP Type for filtering (PR, FG, PALLET)
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

CREATE INDEX idx_license_plates_product ON license_plates(product_id);
CREATE INDEX idx_license_plates_location ON license_plates(location_id);
CREATE INDEX idx_license_plates_status ON license_plates(status);
CREATE INDEX idx_license_plates_qa_status ON license_plates(qa_status);
CREATE INDEX idx_license_plates_parent_lp ON license_plates(parent_lp_id);
CREATE INDEX idx_license_plates_consumed_by_wo ON license_plates(consumed_by_wo_id);
CREATE INDEX idx_license_plates_lp_type ON license_plates(lp_type);
COMMENT ON COLUMN license_plates.lp_type IS 'LP type: PR (Process), FG (Finished Good/Box), PALLET';

-- =============================================
-- 6. LP RESERVATIONS TABLE
-- =============================================

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

CREATE INDEX idx_lp_reservations_lp ON lp_reservations(lp_id);
CREATE INDEX idx_lp_reservations_wo ON lp_reservations(wo_id);
CREATE INDEX idx_lp_reservations_status ON lp_reservations(status);

-- =============================================
-- 7. LP COMPOSITIONS TABLE
-- =============================================

CREATE TABLE lp_compositions (
  id SERIAL PRIMARY KEY,
  output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  qty NUMERIC(12,4) NOT NULL,
  uom VARCHAR(50) NOT NULL,
  op_seq INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lp_compositions_output ON lp_compositions(output_lp_id);
CREATE INDEX idx_lp_compositions_input ON lp_compositions(input_lp_id);
CREATE INDEX idx_lp_compositions_op_seq ON lp_compositions(op_seq);

-- =============================================
-- 8. LP GENEALOGY TABLE
-- =============================================

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

CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(wo_id);

-- =============================================
-- 9. PALLETS TABLE (with target_boxes and actual_boxes)
-- =============================================

CREATE TABLE pallets (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  line VARCHAR(50),
  code VARCHAR(50) UNIQUE NOT NULL,
  
  -- NEW FIELDS: Target and actual box counts
  target_boxes INTEGER,
  actual_boxes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50)
);

CREATE INDEX idx_pallets_wo_id ON pallets(wo_id);
CREATE INDEX idx_pallets_code ON pallets(code);
CREATE INDEX idx_pallets_line ON pallets(line);
COMMENT ON COLUMN pallets.target_boxes IS 'Target boxes per pallet (from BOM boxes_per_pallet)';
COMMENT ON COLUMN pallets.actual_boxes IS 'Actual boxes on pallet (confirmed by operator)';

-- =============================================
-- 10. PALLET ITEMS TABLE (with box_count aggregation)
-- =============================================

CREATE TABLE pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  
  -- CHANGED: Aggregation instead of individual box_lp_id
  box_count NUMERIC(12,4) NOT NULL,
  material_snapshot JSONB,
  
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);
CREATE INDEX idx_pallet_items_sequence ON pallet_items(pallet_id, sequence);
COMMENT ON COLUMN pallet_items.box_count IS 'Aggregated count of boxes on pallet';
COMMENT ON COLUMN pallet_items.material_snapshot IS 'BOM snapshot data for traceability';

-- =============================================
-- 11. GRNS TABLE
-- =============================================

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

CREATE INDEX idx_grns_po_id ON grns(po_id);
CREATE INDEX idx_grns_status ON grns(status);
CREATE INDEX idx_grns_supplier ON grns(supplier_id);

-- =============================================
-- 12. GRN ITEMS TABLE
-- =============================================

CREATE TABLE grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id) ON DELETE CASCADE,
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

CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product ON grn_items(product_id);

-- =============================================
-- 13. ASNS TABLE
-- =============================================

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

CREATE INDEX idx_asns_supplier ON asns(supplier_id);
CREATE INDEX idx_asns_po ON asns(po_id);
CREATE INDEX idx_asns_status ON asns(status);

-- =============================================
-- 14. ASN ITEMS TABLE
-- =============================================

CREATE TABLE asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asn_items_asn ON asn_items(asn_id);
CREATE INDEX idx_asn_items_product ON asn_items(product_id);

-- =============================================
-- 15. STOCK MOVES TABLE
-- =============================================

CREATE TABLE stock_moves (
  id SERIAL PRIMARY KEY,
  move_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  move_type VARCHAR(20) NOT NULL,
  move_source VARCHAR(20) DEFAULT 'portal',
  move_status VARCHAR(20) DEFAULT 'completed',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_moves_product ON stock_moves(product_id);
CREATE INDEX idx_stock_moves_locations ON stock_moves(from_location_id, to_location_id);
CREATE INDEX idx_stock_moves_reference ON stock_moves(reference_type, reference_id);

