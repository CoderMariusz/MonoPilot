-- Migration 034: Phase 1 Planning Schema
-- Purpose: Rebuild PO/TO tables with Phase 1 specification
-- Date: 2025-01-21

-- =============================================
-- 1. CREATE NEW PHASE 1 TABLES
-- =============================================

-- PO Header (replacing purchase_orders)
CREATE TABLE IF NOT EXISTS po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(10,4),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address TEXT,
  asn_ref VARCHAR(50),
  net_total DECIMAL(12,4),
  vat_total DECIMAL(12,4),
  gross_total DECIMAL(12,4),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PO Line (replacing purchase_order_items)
CREATE TABLE IF NOT EXISTS po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_ordered DECIMAL(12,4) NOT NULL,
  qty_received DECIMAL(12,4) DEFAULT 0,
  unit_price DECIMAL(12,4) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  default_location_id INTEGER REFERENCES locations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: line_no per po_id
  CONSTRAINT po_line_unique_line UNIQUE (po_id, line_no)
);

-- PO Correction (new table)
CREATE TABLE IF NOT EXISTS po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id) ON DELETE CASCADE,
  po_line_id INTEGER REFERENCES po_line(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  delta_amount DECIMAL(12,4) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TO Header (replacing transfer_orders)
CREATE TABLE IF NOT EXISTS to_header (
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

-- TO Line (replacing transfer_order_items)
CREATE TABLE IF NOT EXISTS to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned DECIMAL(12,4) NOT NULL,
  qty_moved DECIMAL(12,4) DEFAULT 0,
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  scan_required BOOLEAN DEFAULT false,
  approved_line BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: line_no per to_id
  CONSTRAINT to_line_unique_line UNIQUE (to_id, line_no)
);

-- Enhanced Audit Log (enhancing audit_events)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================

-- PO Header indexes
CREATE INDEX IF NOT EXISTS idx_po_header_number ON po_header(number);
CREATE INDEX IF NOT EXISTS idx_po_header_status ON po_header(status);
CREATE INDEX IF NOT EXISTS idx_po_header_supplier ON po_header(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_header_dates ON po_header(promised_delivery_date);
CREATE INDEX IF NOT EXISTS idx_po_header_created_by ON po_header(created_by);

-- PO Line indexes
CREATE INDEX IF NOT EXISTS idx_po_line_po_id ON po_line(po_id);
CREATE INDEX IF NOT EXISTS idx_po_line_item_id ON po_line(item_id);
CREATE INDEX IF NOT EXISTS idx_po_line_location ON po_line(default_location_id);

-- PO Correction indexes
CREATE INDEX IF NOT EXISTS idx_po_correction_po_id ON po_correction(po_id);
CREATE INDEX IF NOT EXISTS idx_po_correction_po_line_id ON po_correction(po_line_id);

-- TO Header indexes
CREATE INDEX IF NOT EXISTS idx_to_header_number ON to_header(number);
CREATE INDEX IF NOT EXISTS idx_to_header_status ON to_header(status);
CREATE INDEX IF NOT EXISTS idx_to_header_from_wh ON to_header(from_wh_id);
CREATE INDEX IF NOT EXISTS idx_to_header_to_wh ON to_header(to_wh_id);
CREATE INDEX IF NOT EXISTS idx_to_header_requested_date ON to_header(requested_date);

-- TO Line indexes
CREATE INDEX IF NOT EXISTS idx_to_line_to_id ON to_line(to_id);
CREATE INDEX IF NOT EXISTS idx_to_line_item_id ON to_line(item_id);
CREATE INDEX IF NOT EXISTS idx_to_line_from_location ON to_line(from_location_id);
CREATE INDEX IF NOT EXISTS idx_to_line_to_location ON to_line(to_location_id);

-- Audit Log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- =============================================
-- 3. DATA MIGRATION FROM EXISTING TABLES
-- =============================================

-- Migrate purchase_orders to po_header
INSERT INTO po_header (
  id, number, supplier_id, status, currency, exchange_rate, order_date,
  requested_delivery_date, promised_delivery_date, net_total, vat_total, gross_total,
  created_by, approved_by, created_at, updated_at
)
SELECT 
  id,
  po_number,
  supplier_id,
  CASE 
    WHEN status = 'draft' THEN 'draft'
    WHEN status = 'submitted' THEN 'approved'
    WHEN status = 'confirmed' THEN 'approved'
    WHEN status = 'received' THEN 'approved'
    WHEN status = 'closed' THEN 'closed'
    WHEN status = 'cancelled' THEN 'closed'
    ELSE 'draft'
  END as status,
  COALESCE(currency, 'USD'),
  exchange_rate,
  COALESCE(order_date, created_at),
  request_delivery_date,
  expected_delivery_date,
  NULL as net_total, -- Will be calculated from lines
  NULL as vat_total,
  NULL as gross_total,
  CASE WHEN created_by IS NOT NULL THEN created_by::text::uuid ELSE NULL END,
  CASE WHEN approved_by IS NOT NULL THEN approved_by::text::uuid ELSE NULL END,
  created_at,
  updated_at
FROM purchase_orders
WHERE id NOT IN (SELECT id FROM po_header);

-- Migrate purchase_order_items to po_line
INSERT INTO po_line (
  po_id, line_no, item_id, uom, qty_ordered, qty_received, unit_price, vat_rate,
  created_at, updated_at
)
SELECT 
  po_id,
  ROW_NUMBER() OVER (PARTITION BY po_id ORDER BY id) as line_no,
  product_id,
  uom,
  quantity_ordered,
  COALESCE(quantity_received, 0),
  unit_price,
  COALESCE(tax_rate, 0),
  created_at,
  updated_at
FROM purchase_order_items
WHERE po_id IN (SELECT id FROM po_header);

-- Migrate transfer_orders to to_header
INSERT INTO to_header (
  id, number, status, from_wh_id, to_wh_id, requested_date,
  created_by, approved_by, created_at, updated_at
)
SELECT 
  id,
  to_number,
  CASE 
    WHEN status = 'draft' THEN 'draft'
    WHEN status = 'submitted' THEN 'approved'
    WHEN status = 'in_transit' THEN 'approved'
    WHEN status = 'received' THEN 'approved'
    WHEN status = 'cancelled' THEN 'closed'
    ELSE 'draft'
  END as status,
  from_warehouse_id,
  to_warehouse_id,
  planned_ship_date,
  CASE WHEN created_by IS NOT NULL THEN created_by::text::uuid ELSE NULL END,
  CASE WHEN received_by IS NOT NULL THEN received_by::text::uuid ELSE NULL END,
  created_at,
  updated_at
FROM transfer_orders
WHERE id NOT IN (SELECT id FROM to_header);

-- Migrate transfer_order_items to to_line
INSERT INTO to_line (
  to_id, line_no, item_id, uom, qty_planned, qty_moved, created_at, updated_at
)
SELECT 
  to_id,
  ROW_NUMBER() OVER (PARTITION BY to_id ORDER BY id) as line_no,
  product_id,
  uom,
  quantity,
  COALESCE(quantity_actual, 0),
  created_at,
  updated_at
FROM transfer_order_items
WHERE to_id IN (SELECT id FROM to_header);

-- Migrate audit_events to audit_log
INSERT INTO audit_log (
  entity, entity_id, action, before, after, actor_id, created_at
)
SELECT 
  entity_type,
  entity_id::integer,
  event_type,
  old_value,
  new_value,
  CASE WHEN user_id IS NOT NULL THEN user_id::text::uuid ELSE NULL END,
  timestamp
FROM audit_events
WHERE entity_id ~ '^[0-9]+$' -- Only numeric entity_ids
  AND NOT EXISTS (SELECT 1 FROM audit_log WHERE audit_log.entity = audit_events.entity_type AND audit_log.entity_id = audit_events.entity_id::integer);

-- =============================================
-- 4. UPDATE SEQUENCES
-- =============================================

-- Update sequences to continue from migrated data
SELECT setval('po_header_id_seq', COALESCE((SELECT MAX(id) FROM po_header), 1));
SELECT setval('po_line_id_seq', COALESCE((SELECT MAX(id) FROM po_line), 1));
SELECT setval('po_correction_id_seq', COALESCE((SELECT MAX(id) FROM po_correction), 1));
SELECT setval('to_header_id_seq', COALESCE((SELECT MAX(id) FROM to_header), 1));
SELECT setval('to_line_id_seq', COALESCE((SELECT MAX(id) FROM to_line), 1));
SELECT setval('audit_log_id_seq', COALESCE((SELECT MAX(id) FROM audit_log), 1));

-- =============================================
-- 5. CALCULATE TOTALS FOR EXISTING POs
-- =============================================

-- Update po_header totals from po_line data
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
-- 6. CREATE HELPER FUNCTIONS
-- =============================================

-- Function to generate next PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_number TEXT;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT 'PO-' || year_part || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(number FROM 'PO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1, 3, '0')
  INTO next_number
  FROM po_header
  WHERE number LIKE 'PO-' || year_part || '-%';
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next TO number
CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TEXT AS $$
DECLARE
  next_number TEXT;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT 'TO-' || year_part || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(number FROM 'TO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1, 3, '0')
  INTO next_number
  FROM to_header
  WHERE number LIKE 'TO-' || year_part || '-%';
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update PO totals when lines change
CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE po_header 
  SET 
    net_total = COALESCE((
      SELECT SUM(pl.qty_ordered * pl.unit_price) 
      FROM po_line pl 
      WHERE pl.po_id = COALESCE(NEW.po_id, OLD.po_id)
    ), 0),
    vat_total = COALESCE((
      SELECT SUM(pl.qty_ordered * pl.unit_price * pl.vat_rate / 100) 
      FROM po_line pl 
      WHERE pl.po_id = COALESCE(NEW.po_id, OLD.po_id)
    ), 0),
    gross_total = COALESCE((
      SELECT SUM(pl.qty_ordered * pl.unit_price * (1 + pl.vat_rate / 100)) 
      FROM po_line pl 
      WHERE pl.po_id = COALESCE(NEW.po_id, OLD.po_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.po_id, OLD.po_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update PO totals
CREATE TRIGGER trigger_update_po_totals
  AFTER INSERT OR UPDATE OR DELETE ON po_line
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE po_header IS 'Purchase order header with supplier snapshot and status tracking';
COMMENT ON TABLE po_line IS 'Purchase order line items with delivery tracking';
COMMENT ON TABLE po_correction IS 'Purchase order corrections for financial adjustments';
COMMENT ON TABLE to_header IS 'Transfer order header for warehouse transfers';
COMMENT ON TABLE to_line IS 'Transfer order line items with scan requirements';
COMMENT ON TABLE audit_log IS 'Audit trail for all entity changes';

COMMENT ON COLUMN po_header.number IS 'Unique PO number (auto-generated)';
COMMENT ON COLUMN po_header.status IS 'PO status: draft, approved, closed';
COMMENT ON COLUMN po_header.snapshot_supplier_name IS 'Supplier name at time of approval';
COMMENT ON COLUMN po_line.line_no IS 'Line number within PO (unique per PO)';
COMMENT ON COLUMN po_line.uom IS 'Unit of measure (readonly, from products)';
COMMENT ON COLUMN to_line.scan_required IS 'Whether this line requires scanning in Phase 2';
COMMENT ON COLUMN to_line.approved_line IS 'Whether this line is approved for transfer';

-- =============================================
-- 8. VALIDATION QUERIES
-- =============================================

-- Verify migration success
DO $$
DECLARE
  po_count INTEGER;
  po_line_count INTEGER;
  to_count INTEGER;
  to_line_count INTEGER;
  audit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO po_count FROM po_header;
  SELECT COUNT(*) INTO po_line_count FROM po_line;
  SELECT COUNT(*) INTO to_count FROM to_header;
  SELECT COUNT(*) INTO to_line_count FROM to_line;
  SELECT COUNT(*) INTO audit_count FROM audit_log;
  
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE 'PO Headers: %', po_count;
  RAISE NOTICE 'PO Lines: %', po_line_count;
  RAISE NOTICE 'TO Headers: %', to_count;
  RAISE NOTICE 'TO Lines: %', to_line_count;
  RAISE NOTICE 'Audit Logs: %', audit_count;
END $$;
