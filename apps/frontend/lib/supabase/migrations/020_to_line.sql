-- Migration 020: Transfer Order Line Table
-- Purpose: Individual line items in transfer orders
-- Date: 2025-01-11
-- Dependencies: 009_products, 019_to_header
-- Note: TO is warehouse-to-warehouse transfer, NOT location-to-location

CREATE TABLE to_line (
  id SERIAL PRIMARY KEY,
  to_id INTEGER REFERENCES to_header(id),
  line_no INTEGER NOT NULL,
  item_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  qty_planned NUMERIC(12,4) NOT NULL,
  qty_shipped NUMERIC(12,4) DEFAULT 0,
  qty_received NUMERIC(12,4) DEFAULT 0,
  lp_id INTEGER,
  batch VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_to_line_to ON to_line(to_id);
CREATE INDEX idx_to_line_item ON to_line(item_id);
CREATE INDEX idx_to_line_lp ON to_line(lp_id);

-- Comments
COMMENT ON TABLE to_line IS 'Individual line items in transfer orders - warehouse to warehouse transfer (NO specific locations)';
COMMENT ON COLUMN to_line.qty_shipped IS 'Quantity shipped from source warehouse';
COMMENT ON COLUMN to_line.qty_received IS 'Quantity received at destination warehouse';
COMMENT ON COLUMN to_line.lp_id IS 'License Plate scanned for this transfer';
COMMENT ON COLUMN to_line.batch IS 'Batch/lot number of transferred material';
COMMENT ON COLUMN to_line.notes IS 'Additional notes for this line item';

