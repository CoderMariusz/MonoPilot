-- Migration 008: Production Lines Table
-- Purpose: Production lines for manufacturing operations
-- Date: 2025-01-11
-- Dependencies: 001_users, 003_warehouses

CREATE TABLE production_lines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_production_lines_code ON production_lines(code);
CREATE INDEX idx_production_lines_status ON production_lines(status);
CREATE INDEX idx_production_lines_warehouse ON production_lines(warehouse_id);

-- Comments
COMMENT ON TABLE production_lines IS 'Production lines for manufacturing operations';
COMMENT ON COLUMN production_lines.code IS 'Unique line code (e.g., LINE-4, LINE-5)';
COMMENT ON COLUMN production_lines.status IS 'Line operational status';
COMMENT ON COLUMN production_lines.warehouse_id IS 'Optional warehouse association';

