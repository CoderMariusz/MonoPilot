-- Migration 017: Purchase Order Line Table
-- Purpose: Individual line items in purchase orders
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products, 016_po_header

CREATE TABLE po_line (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES po_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_ordered NUMERIC(12,4) NOT NULL,
  qty_received NUMERIC(12,4) DEFAULT 0,
  unit_price NUMERIC(12,4) NOT NULL,
  vat_rate NUMERIC(5,4) DEFAULT 0,
  requested_delivery_date TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  default_location_id INTEGER REFERENCES locations(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_line_po ON po_line(po_id);
CREATE INDEX idx_po_line_item ON po_line(item_id);
CREATE INDEX idx_po_line_location ON po_line(default_location_id);

-- Comments
COMMENT ON TABLE po_line IS 'Individual line items in purchase orders with quantities and pricing';
COMMENT ON COLUMN po_line.qty_ordered IS 'Quantity ordered from supplier';
COMMENT ON COLUMN po_line.qty_received IS 'Quantity received to date (updated via GRN)';

