-- Migration 035: Stock Moves Table
-- Purpose: Track all inventory movements
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products

CREATE TABLE stock_moves (
  id SERIAL PRIMARY KEY,
  move_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  move_type VARCHAR(50) NOT NULL,
  move_source VARCHAR(50) DEFAULT 'portal',
  move_status VARCHAR(20) DEFAULT 'completed',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stock_moves_number ON stock_moves(move_number);
CREATE INDEX idx_stock_moves_product ON stock_moves(product_id);
CREATE INDEX idx_stock_moves_from_location ON stock_moves(from_location_id);
CREATE INDEX idx_stock_moves_to_location ON stock_moves(to_location_id);
CREATE INDEX idx_stock_moves_created_at ON stock_moves(created_at);

-- Comments
COMMENT ON TABLE stock_moves IS 'Track all inventory movements between locations';
COMMENT ON COLUMN stock_moves.move_source IS 'Source of move: portal, scanner, system, etc.';

