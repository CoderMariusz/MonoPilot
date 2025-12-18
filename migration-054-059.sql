
-- ============================================================================
-- MIGRATION 054-059: Apply to Cloud Supabase
-- Generated: 2025-12-16T21:32:17.824Z
-- ============================================================================

-- PHASE 1: Create new tables
-- ============================================================================

-- Create roles table
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

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  dependencies TEXT[],
  can_disable BOOLEAN DEFAULT true,
  display_order INT
);

CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON modules(display_order);
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Create organization_modules table
CREATE TABLE IF NOT EXISTS organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  module_id UUID NOT NULL REFERENCES modules(id),
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID,
  CONSTRAINT org_modules_unique UNIQUE(org_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_modules_org ON organization_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_module ON organization_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_enabled ON organization_modules(org_id, enabled);
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

-- PHASE 2: Seed system data
-- ============================================================================

-- Seed 10 system roles
INSERT INTO roles (code, name, description, permissions, is_system, display_order) VALUES
  ('owner', 'Owner', 'Organization owner with full access',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","warehouse":"CRUD","quality":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::JSONB,
   true, 1),
  ('admin', 'Administrator', 'Administrator with full module access',
   '{"settings":"CRU","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","warehouse":"CRUD","quality":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::JSONB,
   true, 2),
  ('production_manager', 'Production Manager', 'Manages production and planning',
   '{"settings":"R","users":"R","technical":"RU","planning":"CRUD","production":"CRUD","warehouse":"RU","quality":"CRUD","shipping":"R","npd":"R","finance":"R","oee":"CRUD","integrations":"R"}'::JSONB,
   true, 3),
  ('quality_manager', 'Quality Manager', 'Manages quality control',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"RU","warehouse":"R","quality":"CRUD","shipping":"R","npd":"RU","finance":"-","oee":"R","integrations":"-"}'::JSONB,
   true, 4),
  ('warehouse_manager', 'Warehouse Manager', 'Manages warehouse and shipping',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","warehouse":"CRUD","quality":"R","shipping":"CRUD","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 5),
  ('production_operator', 'Production Operator', 'Executes production operations',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"RU","warehouse":"R","quality":"CR","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}'::JSONB,
   true, 6),
  ('warehouse_operator', 'Warehouse Operator', 'Handles warehouse operations',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"-","warehouse":"CRU","quality":"R","shipping":"RU","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 7),
  ('quality_inspector', 'Quality Inspector', 'Performs quality inspections',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","warehouse":"R","quality":"CRU","shipping":"R","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 8),
  ('planner', 'Planner', 'Plans production and materials',
   '{"settings":"R","users":"R","technical":"R","planning":"CRUD","production":"R","warehouse":"R","quality":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"-"}'::JSONB,
   true, 9),
  ('viewer', 'Viewer', 'Read-only access to all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","warehouse":"R","quality":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}'::JSONB,
   true, 10)
ON CONFLICT (code) DO NOTHING;

-- Seed 11 modules
INSERT INTO modules (code, name, dependencies, can_disable, display_order) VALUES
  ('settings', 'Settings', '{}', false, 1),
  ('technical', 'Technical', '{}', false, 2),
  ('planning', 'Planning', '{technical}', true, 3),
  ('production', 'Production', '{planning}', true, 4),
  ('warehouse', 'Warehouse', '{technical}', true, 5),
  ('quality', 'Quality', '{production}', true, 6),
  ('shipping', 'Shipping', '{warehouse}', true, 7),
  ('npd', 'New Product Development', '{technical}', true, 8),
  ('finance', 'Finance', '{planning,shipping}', true, 9),
  ('oee', 'OEE', '{production}', true, 10),
  ('integrations', 'Integrations', '{}', true, 11)
ON CONFLICT (code) DO NOTHING;

-- PHASE 3: Alter existing tables
-- ============================================================================

-- Add new columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate organizations data
UPDATE organizations
SET
  name = COALESCE(company_name, 'Unnamed Organization'),
  slug = LOWER(REGEXP_REPLACE(COALESCE(company_name, 'org-' || SUBSTRING(id::TEXT, 1, 8)), '[^a-zA-Z0-9]+', '-', 'g')),
  currency = COALESCE(default_currency, 'PLN'),
  locale = COALESCE(default_language, 'en'),
  onboarding_step = COALESCE(CASE WHEN wizard_progress IS NOT NULL THEN (wizard_progress::text)::integer ELSE NULL END, 0),
  onboarding_completed_at = CASE WHEN wizard_completed THEN created_at ELSE NULL END,
  is_active = true
WHERE name IS NULL;

-- Add constraints
ALTER TABLE organizations ALTER COLUMN name SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;

-- Drop and recreate unique constraint on slug
DO $$
BEGIN
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_slug_key;
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_slug_unique;
  ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE(slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Add new columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate users role to role_id
UPDATE users u
SET
  role_id = (SELECT r.id FROM roles r WHERE r.code = LOWER(u.role) LIMIT 1),
  is_active = CASE WHEN u.status = 'active' THEN true ELSE false END
WHERE role_id IS NULL;

-- Set default to 'viewer' role for any NULL role_id
UPDATE users
SET role_id = (SELECT id FROM roles WHERE code = 'viewer' LIMIT 1)
WHERE role_id IS NULL;

-- Add FK constraint
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
  ALTER TABLE users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

-- Update organization_modules FK
DO $$
BEGIN
  ALTER TABLE organization_modules DROP CONSTRAINT IF EXISTS organization_modules_enabled_by_fkey;
  ALTER TABLE organization_modules ADD CONSTRAINT organization_modules_enabled_by_fkey
    FOREIGN KEY (enabled_by) REFERENCES users(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
