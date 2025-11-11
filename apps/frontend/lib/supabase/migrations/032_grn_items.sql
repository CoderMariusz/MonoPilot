-- Migration 032: GRN Items Table
-- Purpose: Individual line items in goods receipt notes
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products, 031_grns

CREATE TABLE grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id),
  product_id INTEGER REFERENCES products(id),
  quantity_ordered NUMERIC(12,4) NOT NULL,
  quantity_received NUMERIC(12,4) NOT NULL,
  quantity_accepted NUMERIC(12,4),
  location_id INTEGER REFERENCES locations(id),
  unit_price NUMERIC(12,4),
  batch VARCHAR(100),
  batch_number VARCHAR(100),
  mfg_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product ON grn_items(product_id);
CREATE INDEX idx_grn_items_location ON grn_items(location_id);

-- Comments
COMMENT ON TABLE grn_items IS 'Individual line items in GRNs with quantities and batch information';

