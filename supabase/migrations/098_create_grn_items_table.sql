-- Migration 098: Create GRN Items Table (Story 05.9)
-- Purpose: GRN line items table
-- Phase: GREEN

-- Create GRN items table
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

    -- Constraints
    CONSTRAINT grn_items_received_qty_check CHECK (received_qty > 0)
);

-- Indexes for GRN items
CREATE INDEX idx_grn_items_grn_id ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product_id ON grn_items(product_id);
CREATE INDEX idx_grn_items_asn_item_id ON grn_items(asn_item_id) WHERE asn_item_id IS NOT NULL;
CREATE INDEX idx_grn_items_po_line_id ON grn_items(po_line_id) WHERE po_line_id IS NOT NULL;
CREATE INDEX idx_grn_items_batch_number ON grn_items(batch_number) WHERE batch_number IS NOT NULL;

-- Enable RLS
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access GRN items from their organization (via grns join)
CREATE POLICY grn_items_org_isolation ON grn_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM grns
            WHERE grns.id = grn_items.grn_id
            AND grns.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    );

-- Comment
COMMENT ON TABLE grn_items IS 'GRN line items - products received per GRN (Story 05.9)';
