-- =============================================================================
-- Migration 0334: Create Shipments Tables for Packing Scanner
-- Story: 07.12 - Packing Scanner Mobile UI
-- Purpose: Create shipments, shipment_lines, shipment_boxes, shipment_box_contents
-- =============================================================================

-- =============================================================================
-- Shipments Table - Main shipment header
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipments (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL,

  -- Relationships
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  customer_id UUID REFERENCES customers(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready_to_pack', 'packing', 'packed', 'shipped', 'delivered', 'cancelled')),

  -- Dates
  promised_ship_date DATE,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Carrier info
  carrier_name TEXT,
  tracking_number TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_shipments_org_number UNIQUE(org_id, shipment_number)
);

-- Indexes for shipments
CREATE INDEX IF NOT EXISTS idx_shipments_org_status ON shipments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_sales_order ON shipments(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_org_created ON shipments(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_ship_date ON shipments(org_id, promised_ship_date);
CREATE INDEX IF NOT EXISTS idx_shipments_warehouse ON shipments(warehouse_id) WHERE warehouse_id IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();

-- =============================================================================
-- Shipment Lines Table - Lines for tracking packed quantities
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipment_lines (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,

  -- Line reference
  sales_order_line_id UUID REFERENCES sales_order_lines(id),
  product_id UUID REFERENCES products(id),

  -- Quantities
  quantity_ordered DECIMAL(15,4) NOT NULL DEFAULT 0,
  quantity_packed DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (quantity_packed >= 0),
  quantity_shipped DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (quantity_shipped >= 0),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'partial', 'packed', 'shipped')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for shipment_lines
CREATE INDEX IF NOT EXISTS idx_shipment_lines_shipment ON shipment_lines(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_org ON shipment_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_so_line ON shipment_lines(sales_order_line_id);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_status ON shipment_lines(status);

-- =============================================================================
-- Shipment Boxes Table - Boxes for packing
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipment_boxes (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,

  -- Box info
  box_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed')),

  -- Dimensions and weight
  weight DECIMAL(10,3),
  length DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT uq_shipment_boxes_number UNIQUE(shipment_id, box_number)
);

-- Indexes for shipment_boxes
CREATE INDEX IF NOT EXISTS idx_shipment_boxes_shipment ON shipment_boxes(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_boxes_org ON shipment_boxes(org_id);
CREATE INDEX IF NOT EXISTS idx_shipment_boxes_status ON shipment_boxes(org_id, status);

-- =============================================================================
-- Shipment Box Contents Table - Contents of each box
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipment_box_contents (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_box_id UUID NOT NULL REFERENCES shipment_boxes(id) ON DELETE CASCADE,

  -- Item reference
  sales_order_line_id UUID REFERENCES sales_order_lines(id),
  product_id UUID REFERENCES products(id),
  license_plate_id UUID REFERENCES license_plates(id),

  -- Quantity and lot
  quantity DECIMAL(15,4) NOT NULL CHECK (quantity > 0),
  lot_number TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  packed_by UUID REFERENCES users(id)
);

-- Indexes for shipment_box_contents
CREATE INDEX IF NOT EXISTS idx_box_contents_box ON shipment_box_contents(shipment_box_id);
CREATE INDEX IF NOT EXISTS idx_box_contents_org ON shipment_box_contents(org_id);
CREATE INDEX IF NOT EXISTS idx_box_contents_lp ON shipment_box_contents(license_plate_id);
CREATE INDEX IF NOT EXISTS idx_box_contents_so_line ON shipment_box_contents(sales_order_line_id);

-- =============================================================================
-- Shipment Number Sequence per Organization per Year
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipment_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_shipment_seq_org_year UNIQUE(org_id, year)
);

-- Function to generate next shipment number: SHP-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_shipment_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_val BIGINT;
  v_shp_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());

  INSERT INTO shipment_number_sequences (org_id, year, current_value)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET
    current_value = shipment_number_sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_next_val;

  v_shp_number := 'SHP-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

  RETURN v_shp_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS Policies - Shipments
-- =============================================================================

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipments_select_org" ON shipments
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipments_insert_org" ON shipments
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipments_update_org" ON shipments
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipments_delete_org" ON shipments
  FOR DELETE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- RLS Policies - Shipment Lines
-- =============================================================================

ALTER TABLE shipment_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipment_lines_select_org" ON shipment_lines
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipment_lines_insert_org" ON shipment_lines
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipment_lines_update_org" ON shipment_lines
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipment_lines_delete_org" ON shipment_lines
  FOR DELETE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- RLS Policies - Shipment Boxes
-- =============================================================================

ALTER TABLE shipment_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipment_boxes_select_org" ON shipment_boxes
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipment_boxes_insert_org" ON shipment_boxes
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipment_boxes_update_org" ON shipment_boxes
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "shipment_boxes_delete_org" ON shipment_boxes
  FOR DELETE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- RLS Policies - Shipment Box Contents
-- =============================================================================

ALTER TABLE shipment_box_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "box_contents_select_org" ON shipment_box_contents
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "box_contents_insert_org" ON shipment_box_contents
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "box_contents_update_org" ON shipment_box_contents
  FOR UPDATE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "box_contents_delete_org" ON shipment_box_contents
  FOR DELETE TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- RLS Policies - Shipment Number Sequences
-- =============================================================================

ALTER TABLE shipment_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipment_seq_org" ON shipment_number_sequences
  FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Auto-set org_id triggers
-- =============================================================================

-- Trigger to auto-set org_id on shipment_lines from shipment
CREATE OR REPLACE FUNCTION set_shipment_line_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id FROM shipments WHERE id = NEW.shipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_shipment_lines_set_org_id
  BEFORE INSERT ON shipment_lines
  FOR EACH ROW EXECUTE FUNCTION set_shipment_line_org_id();

-- Trigger to auto-set org_id on shipment_boxes from shipment
CREATE OR REPLACE FUNCTION set_shipment_box_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id FROM shipments WHERE id = NEW.shipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_shipment_boxes_set_org_id
  BEFORE INSERT ON shipment_boxes
  FOR EACH ROW EXECUTE FUNCTION set_shipment_box_org_id();

-- Trigger to auto-set org_id on box_contents from box
CREATE OR REPLACE FUNCTION set_box_content_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    SELECT org_id INTO NEW.org_id FROM shipment_boxes WHERE id = NEW.shipment_box_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_box_contents_set_org_id
  BEFORE INSERT ON shipment_box_contents
  FOR EACH ROW EXECUTE FUNCTION set_box_content_org_id();

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shipment_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shipment_boxes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shipment_box_contents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shipment_number_sequences TO authenticated;
