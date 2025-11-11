-- Migration 031: GRNs Table
-- Purpose: Goods Receipt Notes - receiving documentation
-- Date: 2025-01-11
-- Dependencies: 002_suppliers, 016_po_header

CREATE TABLE grns (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
  received_date TIMESTAMPTZ NOT NULL,
  received_by INTEGER,
  supplier_id INTEGER REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grns_number ON grns(grn_number);
CREATE INDEX idx_grns_po ON grns(po_id);
CREATE INDEX idx_grns_supplier ON grns(supplier_id);
CREATE INDEX idx_grns_received_date ON grns(received_date);

-- Comments
COMMENT ON TABLE grns IS 'Goods Receipt Notes - documentation for receiving materials from suppliers';

