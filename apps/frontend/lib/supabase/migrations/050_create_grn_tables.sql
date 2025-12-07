-- Migration 050: Create GRN Tables for Epic 5
-- Batch 05A-3: Receiving (Story 5.11: GRN + LP Creation)
-- Date: 2025-12-07

-- ============================================
-- 1. Create goods_receipt_notes (GRN) table
-- ============================================

CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- GRN Details
  grn_number VARCHAR(50) NOT NULL,
  asn_id UUID REFERENCES asn(id) ON DELETE SET NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  receiving_location_id UUID REFERENCES locations(id),

  -- Status: draft, in_progress, completed, cancelled
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,

  -- Receiving Info
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMPTZ,
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Unique GRN number per org
  UNIQUE(org_id, grn_number),

  -- Status constraint
  CONSTRAINT grn_status_check CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled'))
);

-- ============================================
-- 2. Create grn_items table
-- ============================================

CREATE TABLE IF NOT EXISTS grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grn_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,

  -- Item Details
  asn_item_id UUID REFERENCES asn_items(id),
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  expected_qty DECIMAL(15,6) NOT NULL CHECK (expected_qty > 0),
  received_qty DECIMAL(15,6) DEFAULT 0 NOT NULL CHECK (received_qty >= 0),
  uom VARCHAR(20) NOT NULL,

  -- Created License Plate
  lp_id UUID REFERENCES license_plates(id),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. Create indexes
-- ============================================

-- GRN indexes
CREATE INDEX idx_grn_org_id ON goods_receipt_notes(org_id);
CREATE INDEX idx_grn_asn_id ON goods_receipt_notes(asn_id) WHERE asn_id IS NOT NULL;
CREATE INDEX idx_grn_po_id ON goods_receipt_notes(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX idx_grn_warehouse_id ON goods_receipt_notes(warehouse_id);
CREATE INDEX idx_grn_status ON goods_receipt_notes(status);
CREATE INDEX idx_grn_received_at ON goods_receipt_notes(received_at) WHERE received_at IS NOT NULL;

-- GRN Items indexes
CREATE INDEX idx_grn_items_org_id ON grn_items(org_id);
CREATE INDEX idx_grn_items_grn_id ON grn_items(grn_id);
CREATE INDEX idx_grn_items_asn_item_id ON grn_items(asn_item_id) WHERE asn_item_id IS NOT NULL;
CREATE INDEX idx_grn_items_product_id ON grn_items(product_id);
CREATE INDEX idx_grn_items_lp_id ON grn_items(lp_id) WHERE lp_id IS NOT NULL;

-- ============================================
-- 4. Create updated_at trigger for GRN
-- ============================================

CREATE TRIGGER update_grn_updated_at
  BEFORE UPDATE ON goods_receipt_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Enable RLS
-- ============================================

ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies for goods_receipt_notes
-- ============================================

CREATE POLICY grn_select ON goods_receipt_notes
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY grn_insert ON goods_receipt_notes
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY grn_update ON goods_receipt_notes
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  ) WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY grn_delete ON goods_receipt_notes
  FOR DELETE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 7. RLS Policies for grn_items
-- ============================================

CREATE POLICY grn_items_select ON grn_items
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY grn_items_insert ON grn_items
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY grn_items_update ON grn_items
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  ) WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

CREATE POLICY grn_items_delete ON grn_items
  FOR DELETE USING (
    (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 8. Grants
-- ============================================

GRANT ALL ON goods_receipt_notes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON goods_receipt_notes TO authenticated;

GRANT ALL ON grn_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON grn_items TO authenticated;

-- ============================================
-- 9. Comments
-- ============================================

COMMENT ON TABLE goods_receipt_notes IS 'Goods Receipt Notes - Physical receiving of materials from ASN/PO';
COMMENT ON TABLE grn_items IS 'GRN line items with LP creation on receiving';
COMMENT ON COLUMN goods_receipt_notes.status IS 'Status: draft, in_progress, completed, cancelled';
COMMENT ON COLUMN grn_items.lp_id IS 'Created License Plate during receiving';
COMMENT ON COLUMN grn_items.received_qty IS 'Actual received quantity';

-- ============================================
-- 10. Verification
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goods_receipt_notes')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grn_items')
  THEN
    RAISE NOTICE '✓ SUCCESS: GRN tables migration complete';
  ELSE
    RAISE EXCEPTION 'FAILED: Missing GRN tables';
  END IF;
END $$;
