-- Migration 015: Routing Operation Names Table
-- Purpose: Dictionary of standard operation names
-- Date: 2025-01-11
-- Dependencies: 001_users

CREATE TABLE routing_operation_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  alias VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_routing_operation_names_name ON routing_operation_names(name);
CREATE INDEX idx_routing_operation_names_active ON routing_operation_names(is_active);

-- Comments
COMMENT ON TABLE routing_operation_names IS 'Dictionary of standard operation names for routing definitions';
COMMENT ON COLUMN routing_operation_names.name IS 'Standard operation name';
COMMENT ON COLUMN routing_operation_names.alias IS 'Alternative name or short code';

