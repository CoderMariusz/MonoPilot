-- Migration 097: Create GRNs Table (Story 05.9)
-- Purpose: Goods Receipt Note header table for receiving workflow
-- Phase: GREEN

-- Create GRNs table
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

    -- Constraints
    CONSTRAINT grns_unique_grn_number UNIQUE(org_id, grn_number),
    CONSTRAINT grns_source_type_check CHECK (source_type IN ('po', 'to', 'asn', 'return')),
    CONSTRAINT grns_status_check CHECK (status IN ('draft', 'completed', 'cancelled'))
);

-- Indexes for GRNs
CREATE INDEX idx_grns_org_id ON grns(org_id);
CREATE INDEX idx_grns_asn_id ON grns(asn_id) WHERE asn_id IS NOT NULL;
CREATE INDEX idx_grns_po_id ON grns(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX idx_grns_warehouse_id ON grns(warehouse_id);
CREATE INDEX idx_grns_status ON grns(status);
CREATE INDEX idx_grns_receipt_date ON grns(receipt_date);

-- Enable RLS
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access GRNs from their organization
CREATE POLICY grns_org_isolation ON grns
    FOR ALL
    USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Comment
COMMENT ON TABLE grns IS 'Goods Receipt Notes - header table for receiving workflow (Story 05.9)';
