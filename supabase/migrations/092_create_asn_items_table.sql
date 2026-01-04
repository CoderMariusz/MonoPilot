-- Migration 092: Create ASN Items Table (Story 05.8)
-- Purpose: ASN line items with expected/received quantities, batch, expiry
-- Phase: GREEN

-- Create ASN items table
CREATE TABLE IF NOT EXISTS asn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asn_id UUID NOT NULL REFERENCES asns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    po_line_id UUID REFERENCES purchase_order_lines(id),
    expected_qty DECIMAL(15,4) NOT NULL,
    received_qty DECIMAL(15,4) DEFAULT 0,
    uom TEXT NOT NULL,
    supplier_lp_number TEXT,
    supplier_batch_number TEXT,
    gtin TEXT,
    expiry_date DATE,
    notes TEXT,

    -- Constraints
    CONSTRAINT asn_items_unique_asn_product UNIQUE(asn_id, product_id),
    CONSTRAINT asn_items_expected_qty_check CHECK (expected_qty > 0),
    CONSTRAINT asn_items_received_qty_check CHECK (received_qty >= 0)
);

-- Indexes for ASN items
CREATE INDEX idx_asn_items_asn_id ON asn_items(asn_id);
CREATE INDEX idx_asn_items_product_id ON asn_items(product_id);
CREATE INDEX idx_asn_items_po_line_id ON asn_items(po_line_id);

-- Enable RLS
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;

-- Comment
COMMENT ON TABLE asn_items IS 'ASN line items with expected/received quantities (Story 05.8)';
