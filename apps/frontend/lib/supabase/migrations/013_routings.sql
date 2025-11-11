-- Migration 013: Routings Table
-- Purpose: Production routings - sequence of operations
-- Date: 2025-01-11
-- Dependencies: 001_users, 009_products

CREATE TABLE routings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_routings_product ON routings(product_id);
CREATE INDEX idx_routings_active ON routings(is_active);

-- Comments
COMMENT ON TABLE routings IS 'Production routings defining sequence of manufacturing operations';

