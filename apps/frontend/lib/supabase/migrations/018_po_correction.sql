-- Migration 018: PO Correction Table
-- Purpose: Track corrections and adjustments to purchase orders
-- Date: 2025-01-11
-- Dependencies: 001_users, 016_po_header, 017_po_line

CREATE TABLE po_correction (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  po_line_id INTEGER REFERENCES po_line(id),
  reason TEXT NOT NULL,
  delta_amount NUMERIC(12,2) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_correction_po ON po_correction(po_id);
CREATE INDEX idx_po_correction_line ON po_correction(po_line_id);
CREATE INDEX idx_po_correction_created_at ON po_correction(created_at);

-- Comments
COMMENT ON TABLE po_correction IS 'Audit trail for purchase order corrections and price adjustments';
COMMENT ON COLUMN po_correction.delta_amount IS 'Amount adjustment (positive or negative)';

