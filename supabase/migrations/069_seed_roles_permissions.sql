/**
 * Migration: Seed Roles with Permission Matrix
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 * Phase: GREEN - Database setup for RBAC
 *
 * Creates and seeds 10 system roles with full permission matrix across 12 modules.
 * Permission format: "CRUD", "CRU", "RU", "R", "CR", "-" (no access)
 */

-- Create roles table if not exists (defensive)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,  -- module permission matrix
  is_system BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);

-- Add comment
COMMENT ON TABLE roles IS 'System-defined roles with module permission matrix (CRUD format)';
COMMENT ON COLUMN roles.permissions IS 'JSONB object: {module: "CRUD"} where C=Create, R=Read, U=Update, D=Delete, "-"=no access';

-- Seed 10 system roles with permission matrix
-- Permission matrix from Story 01.6 (lines 51-62)
INSERT INTO roles (code, name, description, permissions, display_order) VALUES
  -- Role 1: Owner - Full CRUD on all modules
  ('owner', 'Owner', 'Full system access, can assign any role including owner',
   '{
     "settings":"CRUD",
     "users":"CRUD",
     "technical":"CRUD",
     "planning":"CRUD",
     "production":"CRUD",
     "quality":"CRUD",
     "warehouse":"CRUD",
     "shipping":"CRUD",
     "npd":"CRUD",
     "finance":"CRUD",
     "oee":"CRUD",
     "integrations":"CRUD"
   }'::jsonb, 1),

  -- Role 2: Admin - Full CRUD except settings (CRU only, no Delete)
  ('admin', 'Administrator', 'Organization-wide access, cannot assign owner role or delete settings',
   '{
     "settings":"CRU",
     "users":"CRUD",
     "technical":"CRUD",
     "planning":"CRUD",
     "production":"CRUD",
     "quality":"CRUD",
     "warehouse":"CRUD",
     "shipping":"CRUD",
     "npd":"CRUD",
     "finance":"CRUD",
     "oee":"CRUD",
     "integrations":"CRUD"
   }'::jsonb, 2),

  -- Role 3: Production Manager - CRUD on production/planning/quality/oee, RU on technical/warehouse, R on others
  ('production_manager', 'Production Manager', 'Full Production, Planning, Quality, OEE access',
   '{
     "settings":"R",
     "users":"R",
     "technical":"RU",
     "planning":"CRUD",
     "production":"CRUD",
     "quality":"CRUD",
     "warehouse":"RU",
     "shipping":"R",
     "npd":"R",
     "finance":"R",
     "oee":"CRUD",
     "integrations":"R"
   }'::jsonb, 3),

  -- Role 4: Quality Manager - CRUD on quality, RU on production/npd, R on others except finance/integrations
  ('quality_manager', 'Quality Manager', 'Full Quality access, read Production/NPD',
   '{
     "settings":"R",
     "users":"R",
     "technical":"R",
     "planning":"R",
     "production":"RU",
     "quality":"CRUD",
     "warehouse":"R",
     "shipping":"R",
     "npd":"RU",
     "finance":"-",
     "oee":"R",
     "integrations":"-"
   }'::jsonb, 4),

  -- Role 5: Warehouse Manager - CRUD on warehouse/shipping, R on others except npd/finance/oee/integrations
  ('warehouse_manager', 'Warehouse Manager', 'Full Warehouse and Shipping access',
   '{
     "settings":"R",
     "users":"R",
     "technical":"R",
     "planning":"R",
     "production":"R",
     "quality":"R",
     "warehouse":"CRUD",
     "shipping":"CRUD",
     "npd":"-",
     "finance":"-",
     "oee":"-",
     "integrations":"-"
   }'::jsonb, 5),

  -- Role 6: Production Operator - RU on production, CR on quality, R on technical/planning/warehouse/oee, no access to others
  ('production_operator', 'Production Operator', 'RU Production, CR Quality (create inspections)',
   '{
     "settings":"-",
     "users":"-",
     "technical":"R",
     "planning":"R",
     "production":"RU",
     "quality":"CR",
     "warehouse":"R",
     "shipping":"-",
     "npd":"-",
     "finance":"-",
     "oee":"R",
     "integrations":"-"
   }'::jsonb, 6),

  -- Role 7: Quality Inspector - CRU on quality, R on technical/production/warehouse/shipping, no access to others
  ('quality_inspector', 'Quality Inspector', 'CRU Quality only (no delete)',
   '{
     "settings":"-",
     "users":"-",
     "technical":"R",
     "planning":"-",
     "production":"R",
     "quality":"CRU",
     "warehouse":"R",
     "shipping":"R",
     "npd":"-",
     "finance":"-",
     "oee":"-",
     "integrations":"-"
   }'::jsonb, 7),

  -- Role 8: Warehouse Operator - CRU on warehouse, RU on shipping, R on technical/quality, no access to others
  ('warehouse_operator', 'Warehouse Operator', 'CRU Warehouse, RU Shipping (no delete)',
   '{
     "settings":"-",
     "users":"-",
     "technical":"R",
     "planning":"-",
     "production":"-",
     "quality":"R",
     "warehouse":"CRU",
     "shipping":"RU",
     "npd":"-",
     "finance":"-",
     "oee":"-",
     "integrations":"-"
   }'::jsonb, 8),

  -- Role 9: Planner - CRUD on planning, R on all others except integrations
  ('planner', 'Planner', 'Full Planning, read Production',
   '{
     "settings":"R",
     "users":"R",
     "technical":"R",
     "planning":"CRUD",
     "production":"R",
     "quality":"R",
     "warehouse":"R",
     "shipping":"R",
     "npd":"R",
     "finance":"R",
     "oee":"R",
     "integrations":"-"
   }'::jsonb, 9),

  -- Role 10: Viewer - R (read-only) on all modules
  ('viewer', 'Viewer', 'Read-only access to all modules',
   '{
     "settings":"R",
     "users":"R",
     "technical":"R",
     "planning":"R",
     "production":"R",
     "quality":"R",
     "warehouse":"R",
     "shipping":"R",
     "npd":"R",
     "finance":"R",
     "oee":"R",
     "integrations":"R"
   }'::jsonb, 10)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Create updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_roles_updated_at
      BEFORE UPDATE ON roles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
