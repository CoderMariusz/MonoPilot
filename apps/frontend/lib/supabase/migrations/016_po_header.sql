-- Migration 016: Purchase Order Header Table
-- Purpose: Purchase order master records
-- Date: 2025-01-11
-- Dependencies: 001_users, 002_suppliers

CREATE TABLE po_header (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'approved', 'closed')),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate NUMERIC(12,6),
  order_date TIMESTAMPTZ NOT NULL,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  payment_due_date TIMESTAMPTZ,
  
  -- Supplier snapshot (for historical accuracy)
  snapshot_supplier_name VARCHAR(200),
  snapshot_supplier_vat VARCHAR(50),
  snapshot_supplier_address TEXT,
  
  -- ASN reference
  asn_ref VARCHAR(50),
  
  -- Totals
  net_total NUMERIC(12,2),
  vat_total NUMERIC(12,2),
  gross_total NUMERIC(12,2),
  
  -- Audit
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_header_number ON po_header(number);
CREATE INDEX idx_po_header_supplier ON po_header(supplier_id);
CREATE INDEX idx_po_header_status ON po_header(status);
CREATE INDEX idx_po_header_order_date ON po_header(order_date);

-- Comments
COMMENT ON TABLE po_header IS 'Purchase order master records';
COMMENT ON COLUMN po_header.payment_due_date IS 'Payment deadline (e.g., Net 30 from invoice date)';
COMMENT ON COLUMN po_header.snapshot_supplier_name IS 'Supplier name snapshot at time of PO creation';

