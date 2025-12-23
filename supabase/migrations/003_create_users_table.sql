-- Migration: Create users table (Story 01.1)
-- Description: Users table with org_id and role_id
-- Date: 2025-12-16

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT users_org_email_unique UNIQUE(org_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_org_email ON users(org_id, email);
CREATE INDEX IF NOT EXISTS idx_users_org_active ON users(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE users IS 'User accounts with org_id and role_id';
COMMENT ON COLUMN users.id IS 'References auth.users(id) from Supabase Auth';
COMMENT ON COLUMN users.org_id IS 'Organization isolation - single source of truth';
COMMENT ON COLUMN users.role_id IS 'FK to roles table (ADR-012)';
