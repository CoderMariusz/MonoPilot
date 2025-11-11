-- Migration 034: ASN Items Table
-- Purpose: Individual line items in ASNs
-- Date: 2025-01-11
-- Dependencies: 009_products, 033_asns

CREATE TABLE asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id),
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_asn_items_asn ON asn_items(asn_id);
CREATE INDEX idx_asn_items_product ON asn_items(product_id);

-- Comments
COMMENT ON TABLE asn_items IS 'Individual line items in ASNs with packaging details';
COMMENT ON COLUMN asn_items.pack IS 'JSONB containing pack/box details';
COMMENT ON COLUMN asn_items.pallet IS 'JSONB containing pallet configuration details';

