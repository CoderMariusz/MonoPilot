-- Migration 003: Warehouses Table
-- Purpose: Warehouse master data
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_warehouses_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_code ON warehouses(code);

-- Comments
COMMENT ON TABLE warehouses IS 'Warehouse master data for inventory management';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse identifier code';

