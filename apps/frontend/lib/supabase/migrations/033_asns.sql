-- Migration 033: ASNs Table
-- Purpose: Advanced Shipping Notices from suppliers
-- Date: 2025-01-11
-- Dependencies: 002_suppliers, 016_po_header

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

-- Indexes
CREATE INDEX idx_asns_number ON asns(asn_number);
CREATE INDEX idx_asns_supplier ON asns(supplier_id);
CREATE INDEX idx_asns_po ON asns(po_id);
CREATE INDEX idx_asns_expected_arrival ON asns(expected_arrival);

-- Comments
COMMENT ON TABLE asns IS 'Advanced Shipping Notices from suppliers - pre-arrival notifications';
COMMENT ON COLUMN asns.attachments IS 'JSONB array of document attachments';

