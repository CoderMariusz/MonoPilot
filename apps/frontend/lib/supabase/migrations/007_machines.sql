-- Migration 007: Machines Table
-- Purpose: Production machines and equipment
-- Date: 2025-01-11
-- Dependencies: 004_locations

CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50),
  location_id INTEGER REFERENCES locations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_machines_code ON machines(code);
CREATE INDEX idx_machines_location ON machines(location_id);
CREATE INDEX idx_machines_active ON machines(is_active);

-- Comments
COMMENT ON TABLE machines IS 'Production machines and equipment master data';
COMMENT ON COLUMN machines.type IS 'Machine type: grinder, mixer, packer, etc.';

