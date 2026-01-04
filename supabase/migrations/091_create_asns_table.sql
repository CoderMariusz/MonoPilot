-- Migration 091: Create ASNs Table (Story 05.8)
-- Purpose: Advanced Shipping Notice header table with PO linkage, carrier, tracking, status
-- Phase: GREEN

-- Create ASN header table
CREATE TABLE IF NOT EXISTS asns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asn_number TEXT NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    expected_date DATE NOT NULL,
    actual_date DATE,
    carrier TEXT,
    tracking_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT asns_unique_org_number UNIQUE(org_id, asn_number),
    CONSTRAINT asns_status_check CHECK (status IN ('pending', 'partial', 'received', 'cancelled'))
);

-- Indexes for ASNs
CREATE INDEX idx_asns_org_status ON asns(org_id, status);
CREATE INDEX idx_asns_org_expected_date ON asns(org_id, expected_date);
CREATE INDEX idx_asns_po_id ON asns(po_id);
CREATE INDEX idx_asns_supplier_id ON asns(supplier_id);
CREATE INDEX idx_asns_org_number ON asns(org_id, asn_number);

-- Enable RLS
ALTER TABLE asns ENABLE ROW LEVEL SECURITY;

-- Comment
COMMENT ON TABLE asns IS 'Advanced Shipping Notice headers with PO linkage (Story 05.8)';
