-- Migration 001: Users Table
-- Purpose: User management and authentication
-- Date: 2025-01-11
-- Dependencies: auth.users (Supabase Auth)

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Operator', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC', 'Admin')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Comments
COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: Operator, Planner, Technical, Purchasing, Warehouse, QC, Admin';
COMMENT ON COLUMN users.status IS 'User account status: Active or Inactive';

