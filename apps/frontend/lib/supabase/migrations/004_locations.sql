-- Migration 004: Locations Table
-- Purpose: Storage locations within warehouses
-- Date: 2025-01-11
-- Dependencies: 003_warehouses

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER REFERENCES warehouses(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_active ON locations(is_active);

-- Comments
COMMENT ON TABLE locations IS 'Storage locations within warehouses (e.g., aisles, bins, zones)';
COMMENT ON COLUMN locations.type IS 'Location type: receiving, storage, picking, staging, etc.';

