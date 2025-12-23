-- Migration: Create roles table (Story 01.1)
-- Description: System roles with JSONB permissions (ADR-012)
-- Date: 2025-12-16

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE roles IS 'System roles with JSONB permissions per ADR-012';
COMMENT ON COLUMN roles.code IS 'Role code (owner, admin, viewer, etc.)';
COMMENT ON COLUMN roles.permissions IS 'JSONB: { "module": "CRUD" }';
COMMENT ON COLUMN roles.is_system IS 'System roles are seeded and immutable';
