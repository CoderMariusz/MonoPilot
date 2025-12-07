-- Migration 049: Create ASN Tables for Epic 5
-- Batch 05A-3: Receiving (Stories 5.8-5.9)
-- Date: 2025-12-07

-- ============================================
-- 1. Create asn table
-- ============================================

CREATE TABLE IF NOT EXISTS asn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- ASN Details
  asn_number VARCHAR(50) NOT NULL,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),

  -- Shipping Info
  expected_arrival_date DATE,
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),

  -- Status: draft, submitted, receiving, received, cancelled
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,

  notes TEXT,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Unique ASN number per org
  UNIQUE(org_id, asn_number),

  -- Status constraint
  CONSTRAINT asn_status_check CHECK (status IN ('draft', 'submitted', 'receiving', 'received', 'cancelled'))
);

-- ============================================
-- 2. Create asn_items table
-- ============================================

CREATE TABLE IF NOT EXISTS asn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asn_id UUID NOT NULL REFERENCES asn(id) ON DELETE CASCADE,

  -- Line Details
  sequence INTEGER NOT NULL DEFAULT 1,
  po_line_id UUID REFERENCES po_lines(id),
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  expected_qty DECIMAL(15,6) NOT NULL CHECK (expected_qty > 0),
  received_qty DECIMAL(15,6) DEFAULT 0 NOT NULL CHECK (received_qty >= 0),
  uom VARCHAR(20) NOT NULL,

  -- Batch Info
  supplier_batch_number VARCHAR(100),
  manufacture_date DATE,
  expiry_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. Create indexes
-- ============================================

-- ASN indexes
CREATE INDEX idx_asn_org_id ON asn(org_id);
CREATE INDEX idx_asn_po_id ON asn(po_id);
CREATE INDEX idx_asn_status ON asn(status);
CREATE INDEX idx_asn_warehouse_id ON asn(warehouse_id);
CREATE INDEX idx_asn_supplier_id ON asn(supplier_id);
CREATE INDEX idx_asn_expected_arrival ON asn(expected_arrival_date) WHERE expected_arrival_date IS NOT NULL;

-- ASN Items indexes
CREATE INDEX idx_asn_items_org_id ON asn_items(org_id);
CREATE INDEX idx_asn_items_asn_id ON asn_items(asn_id);
CREATE INDEX idx_asn_items_po_line_id ON asn_items(po_line_id) WHERE po_line_id IS NOT NULL;
CREATE INDEX idx_asn_items_product_id ON asn_items(product_id);

-- ============================================
-- 4. Create updated_at trigger for asn
-- ============================================

CREATE TRIGGER update_asn_updated_at
  BEFORE UPDATE ON asn
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Enable RLS
-- ============================================

ALTER TABLE asn ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies for asn
-- ============================================

CREATE POLICY asn_select ON asn
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY asn_insert ON asn
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY asn_update ON asn
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  ) WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY asn_delete ON asn
  FOR DELETE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 7. RLS Policies for asn_items
-- ============================================

CREATE POLICY asn_items_select ON asn_items
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY asn_items_insert ON asn_items
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY asn_items_update ON asn_items
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  ) WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY asn_items_delete ON asn_items
  FOR DELETE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 8. Grants
-- ============================================

GRANT ALL ON asn TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON asn TO authenticated;

GRANT ALL ON asn_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON asn_items TO authenticated;

-- ============================================
-- 9. Comments
-- ============================================

COMMENT ON TABLE asn IS 'Advance Shipping Notices from suppliers';
COMMENT ON TABLE asn_items IS 'Line items in ASN with expected quantities and batch info';
COMMENT ON COLUMN asn.status IS 'Status: draft, submitted, receiving, received, cancelled';
COMMENT ON COLUMN asn_items.received_qty IS 'Actual received quantity (updated during receiving)';
COMMENT ON COLUMN asn_items.supplier_batch_number IS 'External batch/lot number from supplier';

-- ============================================
-- 10. Verification
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asn')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asn_items')
  THEN
    RAISE NOTICE '✓ SUCCESS: ASN tables migration complete';
  ELSE
    RAISE EXCEPTION 'FAILED: Missing ASN tables';
  END IF;
END $$;
