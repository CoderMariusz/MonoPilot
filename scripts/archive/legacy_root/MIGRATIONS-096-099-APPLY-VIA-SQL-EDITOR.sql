-- ============================================================================
-- Story 05.9 - Backend Migrations (096-099)
-- APPLY VIA SUPABASE SQL EDITOR
-- Reason: db push failed due to migration history mismatch
-- ============================================================================

-- Migration 096: Add ASN Items Variance Columns
-- Purpose: Add variance tracking columns to asn_items table for receive workflow
-- ============================================================================
ALTER TABLE asn_items
  ADD COLUMN IF NOT EXISTS variance_reason TEXT,
  ADD COLUMN IF NOT EXISTS variance_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_received_at TIMESTAMPTZ;

ALTER TABLE asn_items
  DROP CONSTRAINT IF EXISTS asn_items_variance_reason_check;

ALTER TABLE asn_items
  ADD CONSTRAINT asn_items_variance_reason_check
  CHECK (variance_reason IS NULL OR variance_reason IN ('damaged', 'short-shipped', 'over-shipped', 'other'));

CREATE INDEX IF NOT EXISTS idx_asn_items_variance
  ON asn_items(asn_id)
  WHERE received_qty != expected_qty;

COMMENT ON COLUMN asn_items.variance_reason IS 'Reason for qty variance: damaged, short-shipped, over-shipped, other';
COMMENT ON COLUMN asn_items.variance_notes IS 'Additional notes explaining variance';
COMMENT ON COLUMN asn_items.last_received_at IS 'Timestamp of last receive operation against this item';

-- Migration 097: Create GRNs Table
-- Purpose: Goods Receipt Note header table for receiving workflow
-- ============================================================================
CREATE TABLE IF NOT EXISTS grns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grn_number TEXT NOT NULL,
    source_type TEXT NOT NULL,
    asn_id UUID REFERENCES asns(id) ON DELETE SET NULL,
    po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    status TEXT NOT NULL DEFAULT 'draft',
    receipt_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT grns_unique_grn_number UNIQUE(org_id, grn_number),
    CONSTRAINT grns_source_type_check CHECK (source_type IN ('po', 'to', 'asn', 'return')),
    CONSTRAINT grns_status_check CHECK (status IN ('draft', 'completed', 'cancelled'))
);

CREATE INDEX idx_grns_org_id ON grns(org_id);
CREATE INDEX idx_grns_asn_id ON grns(asn_id) WHERE asn_id IS NOT NULL;
CREATE INDEX idx_grns_po_id ON grns(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX idx_grns_warehouse_id ON grns(warehouse_id);
CREATE INDEX idx_grns_status ON grns(status);
CREATE INDEX idx_grns_receipt_date ON grns(receipt_date);

ALTER TABLE grns ENABLE ROW LEVEL SECURITY;

CREATE POLICY grns_org_isolation ON grns
    FOR ALL
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

COMMENT ON TABLE grns IS 'Goods Receipt Notes - header table for receiving workflow (Story 05.9)';

-- Migration 098: Create GRN Items Table
-- Purpose: GRN line items table
-- ============================================================================
CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    asn_item_id UUID REFERENCES asn_items(id) ON DELETE SET NULL,
    po_line_id UUID REFERENCES purchase_order_lines(id) ON DELETE SET NULL,
    received_qty DECIMAL(15,4) NOT NULL,
    batch_number TEXT,
    supplier_batch_number TEXT,
    lot_number TEXT,
    expiry_date DATE,
    manufacture_date DATE,
    lp_id UUID REFERENCES license_plates(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT grn_items_received_qty_check CHECK (received_qty > 0)
);

CREATE INDEX idx_grn_items_grn_id ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product_id ON grn_items(product_id);
CREATE INDEX idx_grn_items_asn_item_id ON grn_items(asn_item_id) WHERE asn_item_id IS NOT NULL;
CREATE INDEX idx_grn_items_po_line_id ON grn_items(po_line_id) WHERE po_line_id IS NOT NULL;
CREATE INDEX idx_grn_items_batch_number ON grn_items(batch_number) WHERE batch_number IS NOT NULL;

ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY grn_items_org_isolation ON grn_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM grns
            WHERE grns.id = grn_items.grn_id
            AND grns.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

COMMENT ON TABLE grn_items IS 'GRN line items - products received per GRN (Story 05.9)';

-- Migration 099: Fix warehouse settings trigger for organizations
-- Bug Fix: organizations table doesn't have created_by field
-- ============================================================================
CREATE OR REPLACE FUNCTION init_warehouse_settings_for_org()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO warehouse_settings (org_id)
  VALUES (NEW.id)
  ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION init_warehouse_settings_for_org() IS 'Auto-creates warehouse_settings record when organization is created (fixed: removed non-existent created_by reference)';

-- ============================================================================
-- END OF MIGRATIONS 096-099
-- ============================================================================
