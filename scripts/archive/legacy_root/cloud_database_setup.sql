-- Migration: Create organizations table (Story 01.1)
-- Description: Core tenant table with onboarding state
-- Date: 2025-12-16

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'PLN',
  logo_url TEXT,

  -- Onboarding state (Story 01.3)
  onboarding_step INTEGER DEFAULT 0,
  onboarding_started_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE organizations IS 'Core tenant table - each organization is isolated';
COMMENT ON COLUMN organizations.slug IS 'Unique URL-safe identifier';
COMMENT ON COLUMN organizations.onboarding_step IS 'Current step in onboarding wizard (0-6)';
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
-- Migration: Seed system roles (Story 01.6)
-- Description: Insert 10 system roles with JSONB permissions (ADR-012)
-- Date: 2025-12-18

-- Idempotent insert: ON CONFLICT DO NOTHING ensures safe re-runs
INSERT INTO roles (code, name, description, permissions, is_system, display_order)
VALUES
  -- Owner: Full system access, billing control
  ('owner', 'Owner', 'Full system access, billing control',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::jsonb,
   true, 1),

  -- Administrator: Full access except billing, cannot delete org settings
  ('admin', 'Administrator', 'Full access except billing, cannot delete org settings',
   '{"settings":"CRU","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::jsonb,
   true, 2),

  -- Production Manager: Full Production, Planning, Quality access
  ('production_manager', 'Production Manager', 'Full Production, Planning, Quality access',
   '{"settings":"R","users":"R","technical":"RU","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"RU","shipping":"R","npd":"R","finance":"R","oee":"CRUD","integrations":"R"}'::jsonb,
   true, 3),

  -- Quality Manager: Full Quality, read Production
  ('quality_manager', 'Quality Manager', 'Full Quality, read Production',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"RU","quality":"CRUD","warehouse":"R","shipping":"R","npd":"RU","finance":"-","oee":"R","integrations":"-"}'::jsonb,
   true, 4),

  -- Warehouse Manager: Full Warehouse and Shipping access
  ('warehouse_manager', 'Warehouse Manager', 'Full Warehouse and Shipping access',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"CRUD","shipping":"CRUD","npd":"-","finance":"-","oee":"-","integrations":"-"}'::jsonb,
   true, 5),

  -- Production Operator: Execute work orders, create quality checks
  ('production_operator', 'Production Operator', 'Execute work orders, create quality checks',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"RU","quality":"CR","warehouse":"R","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}'::jsonb,
   true, 6),

  -- Quality Inspector: Perform QC inspections, view production and warehouse
  ('quality_inspector', 'Quality Inspector', 'Perform QC inspections, view production and warehouse',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","quality":"CRU","warehouse":"R","shipping":"R","npd":"-","finance":"-","oee":"-","integrations":"-"}'::jsonb,
   true, 7),

  -- Warehouse Operator: Execute inventory and shipping tasks
  ('warehouse_operator', 'Warehouse Operator', 'Execute inventory and shipping tasks',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"-","quality":"R","warehouse":"CRU","shipping":"RU","npd":"-","finance":"-","oee":"-","integrations":"-"}'::jsonb,
   true, 8),

  -- Planner: Manage schedules and work orders
  ('planner', 'Planner', 'Manage schedules and work orders',
   '{"settings":"R","users":"R","technical":"R","planning":"CRUD","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"-"}'::jsonb,
   true, 9),

  -- Viewer: Read-only access to all modules
  ('viewer', 'Viewer', 'Read-only access to all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}'::jsonb,
   true, 10)

ON CONFLICT (code) DO NOTHING;

-- Comments
COMMENT ON TABLE roles IS 'System roles seeded with 10 default roles for multi-tenant orgs';
-- Migration: Create modules and organization_modules tables (Story 01.1)
-- Description: Module definitions and org-specific state (ADR-011)
-- Date: 2025-12-16

-- MODULES (seeded, immutable)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  dependencies TEXT[],
  can_disable BOOLEAN DEFAULT true,
  display_order INT
);

-- Indexes for modules
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON modules(display_order);

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- ORGANIZATION_MODULES (org-specific state)
-- Replaces deprecated module_settings table (ADR-011)
CREATE TABLE IF NOT EXISTS organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  module_id UUID NOT NULL REFERENCES modules(id),
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),

  CONSTRAINT org_modules_unique UNIQUE(org_id, module_id)
);

-- Indexes for organization_modules
CREATE INDEX IF NOT EXISTS idx_organization_modules_org ON organization_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_module ON organization_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_organization_modules_enabled ON organization_modules(org_id, enabled);

-- Enable RLS
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE modules IS 'Module definitions - seeded and immutable (ADR-011)';
COMMENT ON TABLE organization_modules IS 'Org-specific module state - replaces deprecated module_settings';
COMMENT ON COLUMN modules.dependencies IS 'Array of module codes required before enabling';
COMMENT ON COLUMN modules.can_disable IS 'Settings and Technical cannot be disabled';
-- Migration: RLS Policies for Story 01.1
-- Description: Baseline RLS policies following ADR-013 pattern
-- Date: 2025-12-16
-- Pattern: Users Table Lookup (SELECT org_id FROM users WHERE id = auth.uid())

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Users can only see their own organization
CREATE POLICY "org_select_own" ON organizations
FOR SELECT
TO authenticated
USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admin roles can update organization (owner, admin)
CREATE POLICY "org_admin_update" ON organizations
FOR UPDATE
TO authenticated
USING (
  id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- ============================================================================
-- ROLES TABLE
-- ============================================================================

-- All authenticated users can read system roles
CREATE POLICY "roles_select_system" ON roles
FOR SELECT
TO authenticated
USING (is_system = true);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Users can only see other users in their org
CREATE POLICY "users_org_isolation" ON users
FOR SELECT
TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admin roles can insert users (owner, admin)
CREATE POLICY "users_admin_insert" ON users
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can update users (owner, admin)
CREATE POLICY "users_admin_update" ON users
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can delete users (owner, admin)
CREATE POLICY "users_admin_delete" ON users
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- ============================================================================
-- MODULES TABLE
-- ============================================================================

-- All authenticated users can read modules (no org_id - public read)
CREATE POLICY "modules_select_all" ON modules
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- ORGANIZATION_MODULES TABLE
-- ============================================================================

-- Users can only see module state for their org
CREATE POLICY "org_modules_isolation" ON organization_modules
FOR SELECT
TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Only admin roles can insert org modules (owner, admin)
CREATE POLICY "org_modules_admin_insert" ON organization_modules
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can update org modules (owner, admin)
CREATE POLICY "org_modules_admin_update" ON organization_modules
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Only admin roles can delete org modules (owner, admin)
CREATE POLICY "org_modules_admin_delete" ON organization_modules
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "org_select_own" ON organizations IS 'ADR-013: Users can only see their own org';
COMMENT ON POLICY "users_org_isolation" ON users IS 'ADR-013: Org isolation using users table lookup';
COMMENT ON POLICY "roles_select_system" ON roles IS 'All users can read system roles (no org_id)';
COMMENT ON POLICY "modules_select_all" ON modules IS 'Modules are public read (no org_id)';
COMMENT ON POLICY "org_modules_isolation" ON organization_modules IS 'ADR-013: Org-specific module state';
-- Migration: Seed system data (Story 01.1)
-- Description: Seed 10 system roles and 11 modules
-- Date: 2025-12-16
-- Idempotent: Uses ON CONFLICT DO NOTHING

-- ============================================================================
-- SEED ROLES (10 system roles per ADR-012)
-- ============================================================================

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

-- ============================================================================
-- SEED MODULES (11 modules per ADR-011)
-- ============================================================================

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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT roles_code_key ON roles IS 'Ensures idempotent seeding via ON CONFLICT';
COMMENT ON CONSTRAINT modules_code_key ON modules IS 'Ensures idempotent seeding via ON CONFLICT';
-- Migration: Create warehouses table
-- Story: 01.8 - Warehouses CRUD
-- Purpose: Create warehouses table with type enum, address, contact, and default flag
--
-- Features:
-- - Warehouse types (GENERAL, RAW_MATERIALS, WIP, FINISHED_GOODS, QUARANTINE)
-- - Multi-tenant with org_id
-- - Default warehouse flag (only one per org via trigger)
-- - Address and contact information
-- - Soft delete (is_active flag)
-- - Audit fields (created_at, updated_at, created_by, updated_by, disabled_at, disabled_by)
-- - Location count (denormalized for performance)

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    location_count INTEGER DEFAULT 0,
    disabled_at TIMESTAMPTZ,
    disabled_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT warehouses_org_code_unique UNIQUE(org_id, code),
    CONSTRAINT warehouses_type_check CHECK (type IN ('GENERAL', 'RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE')),
    CONSTRAINT warehouses_code_format CHECK (code ~ '^[A-Z0-9-]{2,20}$'),
    CONSTRAINT warehouses_address_length CHECK (address IS NULL OR char_length(address) <= 500),
    CONSTRAINT warehouses_phone_length CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 20)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouses_org_id ON warehouses(org_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_code ON warehouses(org_id, code);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_type ON warehouses(org_id, type);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_active ON warehouses(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_default ON warehouses(org_id, is_default);

-- Comments
COMMENT ON TABLE warehouses IS 'Physical storage locations with type classification (Story 01.8)';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse identifier (2-20 chars, uppercase alphanumeric + hyphens)';
COMMENT ON COLUMN warehouses.type IS 'Warehouse classification: GENERAL, RAW_MATERIALS, WIP, FINISHED_GOODS, QUARANTINE';
COMMENT ON COLUMN warehouses.address IS 'Physical address (max 500 chars)';
COMMENT ON COLUMN warehouses.contact_email IS 'Warehouse manager/contact email';
COMMENT ON COLUMN warehouses.contact_phone IS 'Warehouse contact phone (max 20 chars)';
COMMENT ON COLUMN warehouses.is_default IS 'Default warehouse for new inventory operations (only one per org)';
COMMENT ON COLUMN warehouses.location_count IS 'Denormalized count of locations in warehouse (updated by trigger in Story 01.9)';
COMMENT ON COLUMN warehouses.disabled_at IS 'Timestamp when warehouse was disabled';
COMMENT ON COLUMN warehouses.disabled_by IS 'User who disabled the warehouse';

-- Trigger: Ensure single default warehouse per org (atomic operation)
-- AC-05: Set default warehouse (unsets previous default atomically)
CREATE OR REPLACE FUNCTION ensure_single_default_warehouse()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset previous default warehouse for this org
        UPDATE warehouses
        SET is_default = false, updated_at = NOW()
        WHERE org_id = NEW.org_id
          AND id != NEW.id
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_warehouse_trigger
BEFORE INSERT OR UPDATE OF is_default ON warehouses
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_warehouse();

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warehouses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouses_updated_at_trigger
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_warehouses_updated_at();
-- Migration: Warehouses RLS Policies
-- Story: 01.8 - Warehouses CRUD
-- Purpose: Row Level Security policies for warehouses table
-- Pattern: ADR-013 - Users Table Lookup pattern

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: All authenticated users can read org warehouses
CREATE POLICY warehouses_select
ON warehouses
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT Policy: Only admins and warehouse managers can create warehouses
CREATE POLICY warehouses_insert
ON warehouses
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER')
    )
);

-- UPDATE Policy: Only admins and warehouse managers can update warehouses
CREATE POLICY warehouses_update
ON warehouses
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER')
    )
);

-- DELETE Policy: Only super admins and admins can delete warehouses
-- Note: Soft delete (is_active=false) is preferred over hard delete
CREATE POLICY warehouses_delete
ON warehouses
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- Comments
COMMENT ON POLICY warehouses_select ON warehouses IS 'All authenticated users can read warehouses within their org';
COMMENT ON POLICY warehouses_insert ON warehouses IS 'Only admins and warehouse managers can create warehouses';
COMMENT ON POLICY warehouses_update ON warehouses IS 'Only admins and warehouse managers can update warehouses';
COMMENT ON POLICY warehouses_delete ON warehouses IS 'Only super admins and admins can delete warehouses (soft delete preferred)';
-- Migration: Create locations table with hierarchical structure
-- Story: 01.9 - Warehouse Locations Management
-- Purpose: Hierarchical storage locations within warehouses (zone > aisle > rack > bin)
--
-- Features:
-- - 4-level hierarchy: zone (1) > aisle (2) > rack (3) > bin (4)
-- - Self-referencing parent_id for tree structure
-- - Auto-computed full_path (e.g., 'WH-001/ZONE-A/A01/R01/B001')
-- - Auto-computed depth (1-4)
-- - Capacity tracking (max/current pallets and weight)
-- - Location type classification (bulk, pallet, shelf, floor, staging)
-- - Hierarchical validation triggers
-- - Multi-tenant with org_id
-- - Audit fields

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Location level enum (hierarchical levels)
CREATE TYPE location_level AS ENUM ('zone', 'aisle', 'rack', 'bin');

-- Location type enum (storage type classification)
CREATE TYPE location_type AS ENUM ('bulk', 'pallet', 'shelf', 'floor', 'staging');

-- =============================================================================
-- TABLE: locations
-- =============================================================================

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES locations(id) ON DELETE RESTRICT,

    -- Basic fields
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Hierarchy fields
    level location_level NOT NULL,
    full_path VARCHAR(500),  -- Auto-computed: WH-001/ZONE-A/A01/R01/B001
    depth INT NOT NULL DEFAULT 1,

    -- Classification
    location_type location_type NOT NULL DEFAULT 'shelf',

    -- Capacity fields
    max_pallets INT,
    max_weight_kg DECIMAL(12,2),
    current_pallets INT DEFAULT 0,
    current_weight_kg DECIMAL(12,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT locations_org_warehouse_code_unique UNIQUE(org_id, warehouse_id, code),
    CONSTRAINT locations_depth_check CHECK(depth BETWEEN 1 AND 4),
    CONSTRAINT locations_max_pallets_check CHECK(max_pallets IS NULL OR max_pallets > 0),
    CONSTRAINT locations_max_weight_check CHECK(max_weight_kg IS NULL OR max_weight_kg > 0),
    CONSTRAINT locations_current_pallets_check CHECK(current_pallets >= 0),
    CONSTRAINT locations_current_weight_check CHECK(current_weight_kg >= 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse_id ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_level ON locations(level);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_full_path ON locations(full_path);
CREATE INDEX IF NOT EXISTS idx_locations_org_warehouse ON locations(org_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_warehouse_active ON locations(org_id, warehouse_id, is_active);

-- =============================================================================
-- TRIGGER FUNCTION: Compute full_path and depth
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_location_full_path()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_path VARCHAR(500);
    v_parent_depth INT;
    v_warehouse_code VARCHAR(20);
BEGIN
    -- If this is a root location (no parent)
    IF NEW.parent_id IS NULL THEN
        -- Get warehouse code
        SELECT code INTO v_warehouse_code
        FROM warehouses
        WHERE id = NEW.warehouse_id;

        -- Set full_path = warehouse_code/location_code
        NEW.full_path := v_warehouse_code || '/' || NEW.code;
        NEW.depth := 1;
    ELSE
        -- Get parent's full_path and depth
        SELECT full_path, depth INTO v_parent_path, v_parent_depth
        FROM locations
        WHERE id = NEW.parent_id;

        -- Set full_path = parent_path/location_code
        NEW.full_path := v_parent_path || '/' || NEW.code;
        NEW.depth := v_parent_depth + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_location_path
BEFORE INSERT OR UPDATE OF parent_id, code ON locations
FOR EACH ROW
EXECUTE FUNCTION compute_location_full_path();

-- =============================================================================
-- TRIGGER FUNCTION: Validate location hierarchy
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_location_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_level location_level;
BEGIN
    -- Root locations (no parent) must be zones
    IF NEW.parent_id IS NULL THEN
        IF NEW.level != 'zone' THEN
            RAISE EXCEPTION 'Root locations must be zones (level=zone)';
        END IF;
        RETURN NEW;
    END IF;

    -- Get parent's level
    SELECT level INTO v_parent_level
    FROM locations
    WHERE id = NEW.parent_id;

    -- Validate parent-child level relationships
    IF v_parent_level = 'zone' THEN
        IF NEW.level != 'aisle' THEN
            RAISE EXCEPTION 'Locations under zones must be aisles (level=aisle)';
        END IF;
    ELSIF v_parent_level = 'aisle' THEN
        IF NEW.level != 'rack' THEN
            RAISE EXCEPTION 'Locations under aisles must be racks (level=rack)';
        END IF;
    ELSIF v_parent_level = 'rack' THEN
        IF NEW.level != 'bin' THEN
            RAISE EXCEPTION 'Locations under racks must be bins (level=bin)';
        END IF;
    ELSIF v_parent_level = 'bin' THEN
        RAISE EXCEPTION 'Bins cannot have child locations';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_location_hierarchy
BEFORE INSERT OR UPDATE OF parent_id, level ON locations
FOR EACH ROW
EXECUTE FUNCTION validate_location_hierarchy();

-- =============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at_trigger
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE locations IS 'Hierarchical storage locations within warehouses (Story 01.9)';
COMMENT ON COLUMN locations.code IS 'Unique location code within warehouse (e.g., ZONE-A, A01, R01, B001)';
COMMENT ON COLUMN locations.level IS 'Hierarchical level: zone (1) > aisle (2) > rack (3) > bin (4)';
COMMENT ON COLUMN locations.full_path IS 'Auto-computed full path (e.g., WH-001/ZONE-A/A01/R01/B001)';
COMMENT ON COLUMN locations.depth IS 'Auto-computed depth (1-4)';
COMMENT ON COLUMN locations.location_type IS 'Storage type: bulk, pallet, shelf, floor, staging';
COMMENT ON COLUMN locations.max_pallets IS 'Maximum number of pallets (null = no limit)';
COMMENT ON COLUMN locations.max_weight_kg IS 'Maximum weight in kg (null = no limit)';
COMMENT ON COLUMN locations.current_pallets IS 'Current number of pallets (updated by inventory operations)';
COMMENT ON COLUMN locations.current_weight_kg IS 'Current weight in kg (updated by inventory operations)';

COMMENT ON CONSTRAINT locations_org_warehouse_code_unique ON locations IS 'Location codes must be unique within warehouse';
COMMENT ON CONSTRAINT locations_depth_check ON locations IS 'Depth must be between 1 and 4';
-- Migration: Locations RLS Policies
-- Story: 01.9 - Warehouse Locations Management
-- Purpose: Row Level Security policies for locations table
-- Pattern: ADR-013 - Users Table Lookup pattern

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SELECT POLICY: All authenticated users can read org locations
-- =============================================================================

CREATE POLICY locations_select
ON locations
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- =============================================================================
-- INSERT POLICY: Users can create locations in their org warehouses
-- =============================================================================

CREATE POLICY locations_insert
ON locations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Location must belong to user's org
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    -- Warehouse must exist and belong to user's org
    AND warehouse_id IN (
        SELECT id FROM warehouses
        WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    -- If parent_id is provided, parent must belong to user's org
    AND (
        parent_id IS NULL
        OR parent_id IN (
            SELECT id FROM locations
            WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        )
    )
);

-- =============================================================================
-- UPDATE POLICY: Users can update locations in their org
-- =============================================================================

CREATE POLICY locations_update
ON locations
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- =============================================================================
-- DELETE POLICY: Users can delete locations in their org
-- =============================================================================

CREATE POLICY locations_delete
ON locations
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY locations_select ON locations IS 'All authenticated users can read locations within their org';
COMMENT ON POLICY locations_insert ON locations IS 'Users can create locations in their org warehouses with parent validation';
COMMENT ON POLICY locations_update ON locations IS 'Users can update locations within their org';
COMMENT ON POLICY locations_delete ON locations IS 'Users can delete locations within their org (subject to FK constraints)';
-- Migration: Create RPC function for transactional demo data creation (Story 01.3)
-- Description: Ensures atomic demo data creation during onboarding skip
-- Date: 2025-12-19
-- Issue: CRITICAL-3 from code review - prevents partial data on errors

/**
 * RPC Function: create_onboarding_demo_data
 *
 * Creates demo data atomically when user skips onboarding wizard.
 * All operations occur in a single transaction - if any step fails,
 * all changes are rolled back (no orphaned records).
 *
 * Demo Data Created:
 * - Warehouse: code='DEMO-WH', name='Main Warehouse', type='general', is_default=true
 * - Location: code='DEFAULT', name='Default Location', type='zone'
 * - Product: code='SAMPLE-001', name='Sample Product', uom='EA'
 * - Module toggles: technical=true, all others=false
 *
 * @param p_org_id UUID - Organization ID (validated by RLS)
 * @returns JSON - Object with created IDs: { warehouse_id, location_id, product_id }
 * @throws Exception - Rolls back all changes on any error
 *
 * Security: RLS policies enforce org_id isolation on all tables
 */
CREATE OR REPLACE FUNCTION create_onboarding_demo_data(p_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_warehouse_id UUID;
  v_location_id UUID;
  v_product_id UUID;
BEGIN
  -- Validate org_id
  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  -- All operations in single transaction (automatic rollback on error)

  -- 1. Create demo warehouse
  INSERT INTO warehouses (org_id, code, name, type, is_default, is_active)
  VALUES (p_org_id, 'DEMO-WH', 'Main Warehouse', 'general', true, true)
  RETURNING id INTO v_warehouse_id;

  -- 2. Create default location under demo warehouse
  INSERT INTO locations (org_id, warehouse_id, code, name, type, is_active)
  VALUES (p_org_id, v_warehouse_id, 'DEFAULT', 'Default Location', 'zone', true)
  RETURNING id INTO v_location_id;

  -- 3. Create sample product
  INSERT INTO products (org_id, code, name, uom, status, is_active)
  VALUES (p_org_id, 'SAMPLE-001', 'Sample Product', 'EA', 'active', true)
  RETURNING id INTO v_product_id;

  -- 4. Set module toggles (non-critical, ignore conflicts)
  -- Use ON CONFLICT DO NOTHING in case toggles already exist
  INSERT INTO module_toggles (org_id, module_code, is_enabled)
  VALUES
    (p_org_id, 'technical', true),
    (p_org_id, 'planning', false),
    (p_org_id, 'production', false),
    (p_org_id, 'warehouse', false),
    (p_org_id, 'quality', false),
    (p_org_id, 'shipping', false)
  ON CONFLICT (org_id, module_code) DO NOTHING;

  -- Return created IDs
  RETURN json_build_object(
    'warehouse_id', v_warehouse_id,
    'location_id', v_location_id,
    'product_id', v_product_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details (appears in Supabase logs)
    RAISE WARNING 'Failed to create demo data for org %: % %', p_org_id, SQLERRM, SQLSTATE;
    -- Re-raise to trigger rollback
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
-- RLS policies will enforce org_id isolation
GRANT EXECUTE ON FUNCTION create_onboarding_demo_data(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_onboarding_demo_data IS
  'Atomically creates demo data (warehouse, location, product) for onboarding skip. Story 01.3';
-- Migration: Add audit fields to organization_modules
-- Description: Add disabled_at and disabled_by for full audit trail (Story 01.7)
-- Date: 2025-12-20

ALTER TABLE organization_modules
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES users(id);

-- Comments
COMMENT ON COLUMN organization_modules.disabled_at IS 'Timestamp when module was disabled';
COMMENT ON COLUMN organization_modules.disabled_by IS 'User who disabled the module';
COMMENT ON COLUMN organization_modules.enabled_at IS 'Timestamp when module was enabled';
COMMENT ON COLUMN organization_modules.enabled_by IS 'User who enabled the module';
-- Migration: Create machines table with machine_type and machine_status enums
-- Story: 01.10 - Machines CRUD
-- Purpose: Create machines table for production machine master data
--
-- Features:
-- - 9 machine types (MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER)
-- - 4 machine statuses (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)
-- - Multi-tenant with org_id
-- - Capacity tracking (units_per_hour, setup_time_minutes, max_batch_size)
-- - Location assignment (optional FK to locations table)
-- - Soft delete (is_deleted flag)
-- - Audit fields (created_at, updated_at, created_by, updated_by, deleted_at)

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Machine type enum (production machine types)
CREATE TYPE machine_type AS ENUM (
    'MIXER',
    'OVEN',
    'FILLER',
    'PACKAGING',
    'CONVEYOR',
    'BLENDER',
    'CUTTER',
    'LABELER',
    'OTHER'
);

-- Machine status enum (operational status)
CREATE TYPE machine_status AS ENUM (
    'ACTIVE',
    'MAINTENANCE',
    'OFFLINE',
    'DECOMMISSIONED'
);

-- =============================================================================
-- TABLE: machines
-- =============================================================================

CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Classification
    type machine_type NOT NULL DEFAULT 'OTHER',
    status machine_status NOT NULL DEFAULT 'ACTIVE',

    -- Capacity fields (all optional)
    units_per_hour INTEGER,
    setup_time_minutes INTEGER,
    max_batch_size INTEGER,

    -- Location assignment (optional)
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT machines_org_code_unique UNIQUE(org_id, code),
    CONSTRAINT machines_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
    CONSTRAINT machines_code_length CHECK (char_length(code) <= 50),
    CONSTRAINT machines_units_per_hour_check CHECK (units_per_hour IS NULL OR units_per_hour > 0),
    CONSTRAINT machines_setup_time_check CHECK (setup_time_minutes IS NULL OR setup_time_minutes >= 0),
    CONSTRAINT machines_max_batch_size_check CHECK (max_batch_size IS NULL OR max_batch_size > 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_machines_org_id ON machines(org_id);
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines(location_id);
CREATE INDEX IF NOT EXISTS idx_machines_org_code ON machines(org_id, code);
CREATE INDEX IF NOT EXISTS idx_machines_org_not_deleted ON machines(org_id, is_deleted);

-- =============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_machines_updated_at_trigger
BEFORE UPDATE ON machines
FOR EACH ROW
EXECUTE FUNCTION update_machines_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE machines IS 'Production machine master data with type, status, capacity, and location (Story 01.10)';
COMMENT ON COLUMN machines.code IS 'Unique machine identifier (uppercase alphanumeric + hyphens, max 50 chars)';
COMMENT ON COLUMN machines.type IS 'Machine type: MIXER, OVEN, FILLER, PACKAGING, CONVEYOR, BLENDER, CUTTER, LABELER, OTHER';
COMMENT ON COLUMN machines.status IS 'Operational status: ACTIVE (default), MAINTENANCE, OFFLINE, DECOMMISSIONED';
COMMENT ON COLUMN machines.units_per_hour IS 'Production rate (units per hour, optional)';
COMMENT ON COLUMN machines.setup_time_minutes IS 'Setup/changeover time in minutes (optional)';
COMMENT ON COLUMN machines.max_batch_size IS 'Maximum batch size (optional)';
COMMENT ON COLUMN machines.location_id IS 'Physical location assignment (optional FK to locations table)';
COMMENT ON COLUMN machines.is_deleted IS 'Soft delete flag (true = deleted)';
COMMENT ON COLUMN machines.deleted_at IS 'Timestamp when machine was deleted';

COMMENT ON CONSTRAINT machines_org_code_unique ON machines IS 'Machine codes must be unique within organization';
COMMENT ON CONSTRAINT machines_code_format ON machines IS 'Machine code must be uppercase alphanumeric with hyphens';
-- Migration: Machines RLS Policies
-- Story: 01.10 - Machines CRUD
-- Purpose: Row Level Security policies for machines table
-- Pattern: ADR-013 - Users Table Lookup pattern
--
-- Permission Requirements:
-- - SELECT: All authenticated users (org filtered)
-- - INSERT: SUPER_ADMIN, ADMIN, PROD_MANAGER
-- - UPDATE: SUPER_ADMIN, ADMIN, PROD_MANAGER
-- - DELETE: SUPER_ADMIN, ADMIN only

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SELECT POLICY: All authenticated users can read non-deleted org machines
-- =============================================================================

CREATE POLICY machines_select
ON machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

-- =============================================================================
-- INSERT POLICY: Only admins and production managers can create machines
-- =============================================================================

CREATE POLICY machines_insert
ON machines
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);

-- =============================================================================
-- UPDATE POLICY: Only admins and production managers can update machines
-- =============================================================================

CREATE POLICY machines_update
ON machines
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
    )
);

-- =============================================================================
-- DELETE POLICY: Only super admins and admins can delete machines
-- =============================================================================

CREATE POLICY machines_delete
ON machines
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY machines_select ON machines IS 'All authenticated users can read non-deleted machines within their org';
COMMENT ON POLICY machines_insert ON machines IS 'Only admins and production managers can create machines';
COMMENT ON POLICY machines_update ON machines IS 'Only admins and production managers can update machines';
COMMENT ON POLICY machines_delete ON machines IS 'Only super admins and admins can delete machines (soft delete preferred)';
-- Migration: Create production_lines and related junction tables
-- Story: 01.11 - Production Lines CRUD
-- Purpose: Create production lines with machine assignments and product compatibility
--
-- Features:
-- - Production line master data (code, name, warehouse, default_output_location, status)
-- - Machine assignment with sequence order (junction table: production_line_machines)
-- - Product compatibility (junction table: production_line_products)
-- - Multi-tenant with org_id
-- - Status: active, maintenance, inactive, setup
-- - Code immutability when work orders exist
-- - Capacity calculation (bottleneck = MIN(machine.capacity_per_hour))
-- - Audit fields (created_at, updated_at, created_by, updated_by)

-- =============================================================================
-- TABLE: production_lines
-- =============================================================================

CREATE TABLE IF NOT EXISTS production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Warehouse and location
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    default_output_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT production_lines_org_code_unique UNIQUE(org_id, code),
    CONSTRAINT production_lines_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
    CONSTRAINT production_lines_status_check CHECK (status IN ('active', 'maintenance', 'inactive', 'setup'))
);

-- =============================================================================
-- TABLE: production_line_machines (Junction Table)
-- =============================================================================

CREATE TABLE IF NOT EXISTS production_line_machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT plm_line_machine_unique UNIQUE(line_id, machine_id),
    CONSTRAINT plm_line_sequence_unique UNIQUE(line_id, sequence_order),
    CONSTRAINT plm_sequence_positive CHECK (sequence_order > 0)
);

-- =============================================================================
-- TABLE: production_line_products (Junction Table)
-- =============================================================================
-- COMMENTED OUT: Requires products table (will be added in Technical module migration)

-- CREATE TABLE IF NOT EXISTS production_line_products (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
--     line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
--     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

--     -- Constraints
--     CONSTRAINT plp_line_product_unique UNIQUE(line_id, product_id)
-- );

-- =============================================================================
-- INDEXES
-- =============================================================================

-- production_lines indexes
CREATE INDEX IF NOT EXISTS idx_production_lines_org ON production_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_warehouse ON production_lines(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_status ON production_lines(status);
CREATE INDEX IF NOT EXISTS idx_production_lines_code ON production_lines(code);

-- production_line_machines indexes
CREATE INDEX IF NOT EXISTS idx_plm_line ON production_line_machines(line_id);
CREATE INDEX IF NOT EXISTS idx_plm_machine ON production_line_machines(machine_id);
CREATE INDEX IF NOT EXISTS idx_plm_sequence ON production_line_machines(line_id, sequence_order);

-- production_line_products indexes (COMMENTED OUT: table doesn't exist yet)
-- CREATE INDEX IF NOT EXISTS idx_plp_line ON production_line_products(line_id);
-- CREATE INDEX IF NOT EXISTS idx_plp_product ON production_line_products(product_id);

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_production_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_production_lines_updated_at_trigger
BEFORE UPDATE ON production_lines
FOR EACH ROW
EXECUTE FUNCTION update_production_lines_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE production_lines IS 'Production line master data with warehouse and status (Story 01.11)';
COMMENT ON COLUMN production_lines.code IS 'Unique line identifier (uppercase alphanumeric + hyphens, org-scoped)';
COMMENT ON COLUMN production_lines.status IS 'Operational status: active (default), maintenance, inactive, setup';
COMMENT ON COLUMN production_lines.warehouse_id IS 'Parent warehouse (required)';
COMMENT ON COLUMN production_lines.default_output_location_id IS 'Default output location for production (optional)';

COMMENT ON TABLE production_line_machines IS 'Machine assignments to production lines with sequence order (Story 01.11)';
COMMENT ON COLUMN production_line_machines.sequence_order IS 'Processing order (1, 2, 3... no gaps, no duplicates)';

-- COMMENT ON TABLE production_line_products IS 'Product compatibility for production lines (empty = unrestricted) (Story 01.11)';

COMMENT ON CONSTRAINT production_lines_org_code_unique ON production_lines IS 'Line codes must be unique within organization';
COMMENT ON CONSTRAINT production_lines_code_format ON production_lines IS 'Line code must be uppercase alphanumeric with hyphens';
COMMENT ON CONSTRAINT production_lines_status_check ON production_lines IS 'Status must be: active, maintenance, inactive, or setup';
COMMENT ON CONSTRAINT plm_line_machine_unique ON production_line_machines IS 'Machine can only be assigned once per line';
COMMENT ON CONSTRAINT plm_line_sequence_unique ON production_line_machines IS 'Sequence order must be unique within line';
COMMENT ON CONSTRAINT plm_sequence_positive ON production_line_machines IS 'Sequence order must start from 1';
-- COMMENT ON CONSTRAINT plp_line_product_unique ON production_line_products IS 'Product can only be assigned once per line';
-- Migration: RLS Policies for Production Lines
-- Story: 01.11 - Production Lines CRUD
-- Purpose: Row-level security for production lines and junction tables
-- Pattern: ADR-013 (Users Table Lookup)
--
-- Policy Structure:
-- - production_lines: SELECT (all users), ALL (PROD_MANAGER+)
-- - production_line_machines: SELECT (all users), ALL (PROD_MANAGER+)
-- - production_line_products: SELECT (all users), ALL (PROD_MANAGER+)

-- =============================================================================
-- Enable RLS
-- =============================================================================

ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_line_machines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE production_line_products ENABLE ROW LEVEL SECURITY; -- COMMENTED: table doesn't exist yet

-- =============================================================================
-- RLS POLICIES: production_lines
-- =============================================================================

-- SELECT: All authenticated users can view lines in their org
CREATE POLICY production_lines_org_isolation
ON production_lines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- ALL: PROD_MANAGER+ can manage lines
CREATE POLICY production_lines_admin_write
ON production_lines
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
);

-- =============================================================================
-- RLS POLICIES: production_line_machines
-- =============================================================================

-- SELECT: All authenticated users can view machine assignments in their org
CREATE POLICY plm_org_isolation
ON production_line_machines
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- ALL: PROD_MANAGER+ can manage machine assignments
CREATE POLICY plm_admin_write
ON production_line_machines
FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
)
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
);

-- =============================================================================
-- RLS POLICIES: production_line_products
-- =============================================================================
-- COMMENTED OUT: table doesn't exist yet (requires products table)

-- -- SELECT: All authenticated users can view product compatibility in their org
-- CREATE POLICY plp_org_isolation
-- ON production_line_products
-- FOR SELECT
-- TO authenticated
-- USING (
--     org_id = (SELECT org_id FROM users WHERE id = auth.uid())
-- );

-- -- ALL: PROD_MANAGER+ can manage product compatibility
-- CREATE POLICY plp_admin_write
-- ON production_line_products
-- FOR ALL
-- TO authenticated
-- USING (
--     org_id = (SELECT org_id FROM users WHERE id = auth.uid())
--     AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
--         IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
-- )
-- WITH CHECK (
--     org_id = (SELECT org_id FROM users WHERE id = auth.uid())
--     AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
--         IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
-- );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY production_lines_org_isolation ON production_lines IS 'All users can view lines in their org';
COMMENT ON POLICY production_lines_admin_write ON production_lines IS 'PROD_MANAGER+ can manage lines';
COMMENT ON POLICY plm_org_isolation ON production_line_machines IS 'All users can view machine assignments in their org';
COMMENT ON POLICY plm_admin_write ON production_line_machines IS 'PROD_MANAGER+ can manage machine assignments';
-- COMMENT ON POLICY plp_org_isolation ON production_line_products IS 'All users can view product compatibility in their org';
-- COMMENT ON POLICY plp_admin_write ON production_line_products IS 'PROD_MANAGER+ can manage product compatibility';
-- Migration: Create allergens table with 14 EU mandatory allergens
-- Story: 01.12 - Allergens Management
-- Description: Global reference data (NOT org-scoped) for EU Regulation (EU) No 1169/2011
-- Date: 2025-12-22

-- =====================================================
-- 1. Create allergens table
-- =====================================================
CREATE TABLE IF NOT EXISTS allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_pl VARCHAR(100) NOT NULL,
  name_de VARCHAR(100),
  name_fr VARCHAR(100),
  icon_url TEXT,
  icon_svg TEXT,
  is_eu_mandatory BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT allergens_code_unique UNIQUE(code),
  CONSTRAINT allergens_code_format CHECK (code ~ '^A[0-9]{2}$')
);

-- Add table comment
COMMENT ON TABLE allergens IS 'EU mandatory allergens (global reference data, NOT org-scoped)';
COMMENT ON COLUMN allergens.code IS 'Allergen code: A01-A14 for EU mandatory allergens';
COMMENT ON COLUMN allergens.is_eu_mandatory IS 'True for EU Regulation (EU) No 1169/2011 allergens';
COMMENT ON COLUMN allergens.is_custom IS 'True for organization-specific allergens (future phase)';
COMMENT ON COLUMN allergens.is_active IS 'False to hide allergen from UI';

-- =====================================================
-- 2. Create indexes
-- =====================================================

-- Index on code for quick lookup
CREATE INDEX idx_allergens_code ON allergens(code);

-- Index on display_order for sorting
CREATE INDEX idx_allergens_display_order ON allergens(display_order);

-- GIN index for full-text search across all language fields
CREATE INDEX idx_allergens_search ON allergens USING GIN (
  to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
  )
);

-- =====================================================
-- 3. Enable Row-Level Security (RLS)
-- =====================================================
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active allergens
CREATE POLICY allergens_select_authenticated
  ON allergens
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- NOTE: No INSERT/UPDATE/DELETE policies = read-only in MVP
-- Custom allergens and management deferred to Phase 3

-- =====================================================
-- 4. Seed 14 EU mandatory allergens
-- =====================================================

-- Use ON CONFLICT for idempotent seeding (safe for re-runs)
INSERT INTO allergens (code, name_en, name_pl, name_de, name_fr, icon_url, display_order, is_eu_mandatory, is_custom, is_active)
VALUES
  ('A01', 'Gluten', 'Gluten', 'Gluten', 'Gluten', '/icons/allergens/gluten.svg', 1, true, false, true),
  ('A02', 'Crustaceans', 'Skorupiaki', 'Krebstiere', 'Crustaces', '/icons/allergens/crustaceans.svg', 2, true, false, true),
  ('A03', 'Eggs', 'Jaja', 'Eier', 'Oeufs', '/icons/allergens/eggs.svg', 3, true, false, true),
  ('A04', 'Fish', 'Ryby', 'Fisch', 'Poisson', '/icons/allergens/fish.svg', 4, true, false, true),
  ('A05', 'Peanuts', 'Orzeszki ziemne', 'Erdnusse', 'Arachides', '/icons/allergens/peanuts.svg', 5, true, false, true),
  ('A06', 'Soybeans', 'Soja', 'Soja', 'Soja', '/icons/allergens/soybeans.svg', 6, true, false, true),
  ('A07', 'Milk', 'Mleko', 'Milch', 'Lait', '/icons/allergens/milk.svg', 7, true, false, true),
  ('A08', 'Nuts', 'Orzechy', 'Schalenfruchte', 'Fruits a coque', '/icons/allergens/nuts.svg', 8, true, false, true),
  ('A09', 'Celery', 'Seler', 'Sellerie', 'Celeri', '/icons/allergens/celery.svg', 9, true, false, true),
  ('A10', 'Mustard', 'Gorczyca', 'Senf', 'Moutarde', '/icons/allergens/mustard.svg', 10, true, false, true),
  ('A11', 'Sesame', 'Sezam', 'Sesam', 'Sesame', '/icons/allergens/sesame.svg', 11, true, false, true),
  ('A12', 'Sulphites', 'Siarczyny', 'Sulfite', 'Sulfites', '/icons/allergens/sulphites.svg', 12, true, false, true),
  ('A13', 'Lupin', 'Lubin', 'Lupinen', 'Lupin', '/icons/allergens/lupin.svg', 13, true, false, true),
  ('A14', 'Molluscs', 'Mieczaki', 'Weichtiere', 'Mollusques', '/icons/allergens/molluscs.svg', 14, true, false, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Migration complete
-- =====================================================
-- Table created: allergens (global reference data)
-- Indexes created: code, display_order, full-text search
-- RLS enabled: authenticated read-only access
-- Seed data: 14 EU mandatory allergens inserted
-- Migration: Create tax_codes table with rate, jurisdiction, validity
-- Story: 01.13 - Tax Codes CRUD
-- Description: Multi-tenant tax codes (VAT, GST, etc.) with effective dates and default selection
-- Date: 2025-12-23

-- =============================================================================
-- 1. CREATE TAX_CODES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tax code details
  code VARCHAR(20) NOT NULL CHECK (code ~ '^[A-Z0-9-]{2,20}$'),
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  country_code CHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),

  -- Validity period
  valid_from DATE NOT NULL,
  valid_to DATE CHECK (valid_to IS NULL OR valid_to > valid_from),

  -- Default flag (one per org)
  is_default BOOLEAN DEFAULT false,

  -- Soft delete fields
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- =============================================================================
-- 2. CREATE INDEXES
-- =============================================================================

-- Unique constraint: one code+country per org (excluding deleted) - must be index with WHERE clause
CREATE UNIQUE INDEX unique_tax_code_per_country ON tax_codes(org_id, code, country_code) WHERE is_deleted = false;

-- Index on org_id for org-scoped queries (RLS)
CREATE INDEX idx_tax_codes_org_id ON tax_codes(org_id);

-- Index on org_id + country_code for filtering by country
CREATE INDEX idx_tax_codes_org_country ON tax_codes(org_id, country_code);

-- Index on active tax codes (excludes soft-deleted)
CREATE INDEX idx_tax_codes_org_active ON tax_codes(org_id, is_deleted) WHERE is_deleted = false;

-- Index on validity date range for status filtering (active/expired/scheduled)
CREATE INDEX idx_tax_codes_valid_dates ON tax_codes(org_id, valid_from, valid_to);

-- =============================================================================
-- 3. CREATE TRIGGERS
-- =============================================================================

-- Trigger function: Auto-uppercase code and country_code
CREATE OR REPLACE FUNCTION auto_uppercase_tax_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code = UPPER(NEW.code);
  NEW.country_code = UPPER(NEW.country_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tax_codes_auto_uppercase
  BEFORE INSERT OR UPDATE ON tax_codes
  FOR EACH ROW
  EXECUTE FUNCTION auto_uppercase_tax_code();

-- Trigger function: Ensure single default per org
CREATE OR REPLACE FUNCTION ensure_single_default_tax_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true AND NEW.is_deleted = false THEN
    UPDATE tax_codes
    SET is_default = false, updated_at = NOW()
    WHERE org_id = NEW.org_id
      AND id != NEW.id
      AND is_default = true
      AND is_deleted = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tax_codes_single_default
  BEFORE INSERT OR UPDATE OF is_default ON tax_codes
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_tax_code();

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES (ADR-013 - Users Table Lookup Pattern)
-- =============================================================================

-- SELECT POLICY: All authenticated users can read non-deleted org tax codes
CREATE POLICY tax_codes_select
ON tax_codes
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

-- INSERT POLICY: Only admins can create tax codes
CREATE POLICY tax_codes_insert
ON tax_codes
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- UPDATE POLICY: Only admins can update tax codes
CREATE POLICY tax_codes_update
ON tax_codes
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- DELETE POLICY: Only admins can delete tax codes
CREATE POLICY tax_codes_delete
ON tax_codes
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- =============================================================================
-- 6. ADD COMMENTS
-- =============================================================================

COMMENT ON TABLE tax_codes IS 'Tax codes (VAT, GST, etc.) with rates, jurisdictions, and effective dates. Multi-tenant, org-scoped.';
COMMENT ON COLUMN tax_codes.code IS 'Tax code identifier (e.g., VAT23, GST5). Uppercase alphanumeric with hyphens.';
COMMENT ON COLUMN tax_codes.name IS 'Human-readable tax code name (e.g., "VAT 23%", "GST 5%")';
COMMENT ON COLUMN tax_codes.rate IS 'Tax rate percentage (0-100). 0 allowed for exempt/zero-rated.';
COMMENT ON COLUMN tax_codes.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., PL, DE, US)';
COMMENT ON COLUMN tax_codes.valid_from IS 'Tax code valid from this date (inclusive)';
COMMENT ON COLUMN tax_codes.valid_to IS 'Tax code valid until this date (inclusive). NULL = no expiry.';
COMMENT ON COLUMN tax_codes.is_default IS 'Default tax code for the org. Only one default per org enforced by trigger.';
COMMENT ON COLUMN tax_codes.is_deleted IS 'Soft delete flag. Deleted tax codes hidden from queries.';

COMMENT ON POLICY tax_codes_select ON tax_codes IS 'All authenticated users can read non-deleted tax codes within their org';
COMMENT ON POLICY tax_codes_insert ON tax_codes IS 'Only admins can create tax codes';
COMMENT ON POLICY tax_codes_update ON tax_codes IS 'Only admins can update tax codes';
COMMENT ON POLICY tax_codes_delete ON tax_codes IS 'Only admins can delete tax codes (soft delete preferred)';

-- =============================================================================
-- Migration complete: 077_create_tax_codes_table.sql
-- =============================================================================
-- Table created: tax_codes (multi-tenant, org-scoped)
-- Indexes created: org_id, org_country, org_active, valid_dates
-- Triggers created: auto_uppercase, single_default
-- RLS enabled: authenticated users (org-filtered), admin-only write
-- Ready for seed data in 078_seed_polish_tax_codes.sql
-- Migration: Seed Polish tax codes for all existing organizations
-- Story: 01.13 - Tax Codes CRUD
-- Description: Insert 5 common Polish VAT rates (23%, 8%, 5%, 0%, Exempt)
-- Date: 2025-12-23

-- =============================================================================
-- SEED POLISH TAX CODES
-- =============================================================================

-- NOTE: This migration is idempotent - safe to run multiple times
-- Uses ON CONFLICT DO NOTHING to avoid duplicate inserts

-- =============================================================================
-- 1. Seed VAT23 (Default) - 23% Standard Rate
-- =============================================================================

INSERT INTO tax_codes (
  org_id,
  code,
  name,
  rate,
  country_code,
  valid_from,
  valid_to,
  is_default,
  created_by,
  updated_by
)
SELECT
  o.id AS org_id,
  'VAT23' AS code,
  'VAT 23%' AS name,
  23.00 AS rate,
  'PL' AS country_code,
  '2011-01-01'::DATE AS valid_from,
  NULL AS valid_to,
  true AS is_default,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS created_by,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS updated_by
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM tax_codes tc
  WHERE tc.org_id = o.id
    AND tc.code = 'VAT23'
    AND tc.country_code = 'PL'
    AND tc.is_deleted = false
)
ON CONFLICT (org_id, code, country_code) WHERE is_deleted = false DO NOTHING;

-- =============================================================================
-- 2. Seed Additional Polish VAT Rates
-- =============================================================================

-- Insert VAT8, VAT5, VAT0, ZW for all orgs that don't have them yet
INSERT INTO tax_codes (
  org_id,
  code,
  name,
  rate,
  country_code,
  valid_from,
  valid_to,
  is_default,
  created_by,
  updated_by
)
SELECT
  o.id AS org_id,
  tc.code,
  tc.name,
  tc.rate,
  'PL' AS country_code,
  '2011-01-01'::DATE AS valid_from,
  NULL AS valid_to,
  false AS is_default,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS created_by,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS updated_by
FROM organizations o
CROSS JOIN (
  VALUES
    ('VAT8', 'VAT 8%', 8.00),
    ('VAT5', 'VAT 5%', 5.00),
    ('VAT0', 'VAT 0%', 0.00),
    ('ZW', 'Zwolniony (Exempt)', 0.00)
) AS tc(code, name, rate)
WHERE NOT EXISTS (
  SELECT 1 FROM tax_codes existing
  WHERE existing.org_id = o.id
    AND existing.code = tc.code
    AND existing.country_code = 'PL'
    AND existing.is_deleted = false
)
ON CONFLICT (org_id, code, country_code) WHERE is_deleted = false DO NOTHING;

-- =============================================================================
-- Migration complete: 078_seed_polish_tax_codes.sql
-- =============================================================================
-- Seeded 5 Polish VAT codes for all organizations:
-- - VAT23 (23%, default)
-- - VAT8 (8%)
-- - VAT5 (5%)
-- - VAT0 (0%)
-- - ZW (0%, Exempt)
--
-- Valid from: 2011-01-01 (Polish VAT Act effective date)
-- Valid to: NULL (no expiry)
-- Created by: First SUPER_ADMIN user in each org
-- Idempotent: Safe to re-run, uses ON CONFLICT DO NOTHING
-- Migration: Create RPC function to check tax code references
-- Story: 01.13 - Tax Codes CRUD
-- Description: Returns count of references to a tax code from suppliers, invoices, etc.
-- Date: 2025-12-23

-- =============================================================================
-- CREATE RPC FUNCTION: get_tax_code_reference_count
-- =============================================================================

/**
 * RPC Function: get_tax_code_reference_count
 *
 * Returns the count of references to a tax code from other tables.
 * Used to prevent deletion of tax codes that are in use.
 *
 * Tables checked (as they are implemented):
 * - suppliers (future: Story 03.x)
 * - purchase_orders (future: Story 03.x)
 * - invoices (future: Story 09.x)
 * - invoice_lines (future: Story 09.x)
 *
 * @param tax_code_id UUID - Tax code ID to check
 * @returns INTEGER - Total count of references across all tables
 *
 * Security: Respects RLS policies on referenced tables
 */
CREATE OR REPLACE FUNCTION get_tax_code_reference_count(tax_code_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ref_count INTEGER := 0;
  v_temp_count INTEGER;
BEGIN
  -- Validate input
  IF tax_code_id IS NULL THEN
    RAISE EXCEPTION 'Tax code ID cannot be null';
  END IF;

  -- ==========================================================================
  -- Check suppliers table (when implemented - Story 03.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when suppliers table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM suppliers
  --   WHERE tax_code_id = tax_code_id
  --     AND is_deleted = false;
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Check purchase_orders table (when implemented - Story 03.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when purchase_orders table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM purchase_orders
  --   WHERE tax_code_id = tax_code_id
  --     AND status != 'cancelled';
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Check invoices table (when implemented - Story 09.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when invoices table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM invoices
  --   WHERE tax_code_id = tax_code_id
  --     AND status != 'cancelled';
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Check invoice_lines table (when implemented - Story 09.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when invoice_lines table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM invoice_lines
  --   WHERE tax_code_id = tax_code_id;
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Return total reference count
  -- ==========================================================================
  RETURN v_ref_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Failed to get reference count for tax code %: % %', tax_code_id, SQLERRM, SQLSTATE;
    -- Re-raise to propagate error
    RAISE;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permission to authenticated users
-- RLS policies on referenced tables will enforce org_id isolation
GRANT EXECUTE ON FUNCTION get_tax_code_reference_count(UUID) TO authenticated;

-- =============================================================================
-- ADD COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_tax_code_reference_count IS
  'Returns count of references to a tax code from suppliers, invoices, etc. Used to prevent deletion of in-use tax codes. Story 01.13';

-- =============================================================================
-- Migration complete: 079_create_tax_code_reference_count_rpc.sql
-- =============================================================================
-- RPC function created: get_tax_code_reference_count(UUID)
-- Returns: INTEGER (count of references)
-- Placeholder implementation: Returns 0 until supplier/invoice tables exist
-- Ready for expansion in Story 03.x (Suppliers) and Story 09.x (Finance)
-- Migration: Add wizard_progress and badges to organizations
-- Story: 01.14 - Wizard Steps Complete
-- Purpose: Track wizard completion progress and achievement badges

-- Add wizard_progress JSONB column for step tracking
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS wizard_progress JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN organizations.wizard_progress IS 'Wizard completion tracking - structure: {step_1: {completed_at, ...}, step_2: {...}, ...}';

-- Add badges JSONB column for achievements
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN organizations.badges IS 'Achievement badges earned - structure: [{code: "speed_champion", name: "...", earned_at: "..."}]';

-- Create index for wizard_progress queries
CREATE INDEX IF NOT EXISTS idx_organizations_wizard_progress
ON organizations USING GIN (wizard_progress);

-- Create index for badges queries
CREATE INDEX IF NOT EXISTS idx_organizations_badges
ON organizations USING GIN (badges);
-- Migration 081: Create user_sessions table
-- Story: 01.15 - Session & Password Management
-- Description: Track user sessions for multi-device support
-- Date: 2025-12-23

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Session identification
  session_token VARCHAR(255) UNIQUE NOT NULL,

  -- Device information
  device_type VARCHAR(50),
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,

  -- Revocation tracking
  revoked_by UUID REFERENCES users(id),
  revocation_reason VARCHAR(100)
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_org_id ON user_sessions(org_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own sessions
CREATE POLICY "sessions_own_read" ON user_sessions
FOR SELECT USING (
  user_id = auth.uid()
  OR (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
);

-- RLS Policy: Users can delete (revoke) their own sessions
CREATE POLICY "sessions_own_delete" ON user_sessions
FOR UPDATE USING (
  user_id = auth.uid()
  OR (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
);

-- RLS Policy: Users can insert their own sessions
CREATE POLICY "sessions_insert" ON user_sessions
FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
);

-- Comments
COMMENT ON TABLE user_sessions IS 'User sessions for multi-device support and session management';
COMMENT ON COLUMN user_sessions.session_token IS 'Cryptographically secure session token (64-char hex)';
COMMENT ON COLUMN user_sessions.revocation_reason IS 'Reason for session termination: user_logout, admin_terminate, password_change, timeout';
-- Migration 082: Create password_history table
-- Story: 01.15 - Session & Password Management
-- Description: Track password history to prevent reuse of last 5 passwords
-- Security: Service role only (RLS blocks ALL user access)
-- Date: 2025-12-23

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, password_hash)
);

-- Index for lookup
CREATE INDEX idx_password_history_user_id ON password_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Block ALL user access (service role only)
CREATE POLICY "password_history_none" ON password_history
FOR ALL USING (false);

-- Trigger function to maintain last 5 passwords
CREATE OR REPLACE FUNCTION maintain_password_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest passwords if we have more than 5
  DELETE FROM password_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 5
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after each insert
CREATE TRIGGER password_history_cleanup
AFTER INSERT ON password_history
FOR EACH ROW
EXECUTE FUNCTION maintain_password_history();

-- Comments
COMMENT ON TABLE password_history IS 'Password history for preventing reuse (last 5 passwords). Service role only.';
COMMENT ON COLUMN password_history.password_hash IS 'Bcrypt hashed password (cost factor 12)';
-- Migration 083: Add session and password management fields
-- Story: 01.15 - Session & Password Management
-- Description: Extend organizations and users tables
-- Date: 2025-12-23

-- Add fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS session_timeout_hours INTEGER DEFAULT 24 CHECK (session_timeout_hours >= 1 AND session_timeout_hours <= 720),
ADD COLUMN IF NOT EXISTS password_expiry_days INTEGER DEFAULT NULL CHECK (password_expiry_days IS NULL OR password_expiry_days >= 30),
ADD COLUMN IF NOT EXISTS enforce_password_history BOOLEAN DEFAULT true;

-- Add fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN organizations.session_timeout_hours IS 'Session timeout in hours (default 24, range 1-720)';
COMMENT ON COLUMN organizations.password_expiry_days IS 'Password expiry in days (NULL = no expiry, minimum 30)';
COMMENT ON COLUMN organizations.enforce_password_history IS 'Enforce password history (cannot reuse last 5 passwords)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (cost factor 12)';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
COMMENT ON COLUMN users.password_expires_at IS 'Calculated password expiry date';
COMMENT ON COLUMN users.force_password_change IS 'User must change password on next login (set by admin)';
-- Migration 026: Create user_invitations table
-- Story: 01.16 - User Invitations (Email)
-- Description: Invitation tracking with JWT tokens, 7-day expiry, RLS enforcement
-- Date: 2025-12-23

CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- Role code string (e.g., 'admin', 'production_operator')
  token TEXT UNIQUE NOT NULL, -- JWT token (variable length)
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- Required by invitation-service.ts
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Email validation
  CONSTRAINT user_invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

  -- Status constraint
  CONSTRAINT user_invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Create partial unique index for one pending invitation per email per org
CREATE UNIQUE INDEX user_invitations_unique_pending_idx 
  ON public.user_invitations(org_id, email) 
  WHERE status = 'pending';

-- Indexes for performance
CREATE INDEX idx_user_invitations_org_id ON public.user_invitations(org_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);
CREATE INDEX idx_user_invitations_sent_at ON public.user_invitations(sent_at);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view invitations in their org
CREATE POLICY "invitations_org_select" ON public.user_invitations
FOR SELECT USING (
  org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid())
);

-- RLS Policy: Admins/owners can insert invitations
CREATE POLICY "invitations_admin_insert" ON public.user_invitations
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT u.org_id FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- RLS Policy: Admins/owners can update invitations (resend, revoke)
CREATE POLICY "invitations_admin_update" ON public.user_invitations
FOR UPDATE USING (
  org_id IN (
    SELECT u.org_id FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- RLS Policy: Admins/owners can delete invitations
CREATE POLICY "invitations_admin_delete" ON public.user_invitations
FOR DELETE USING (
  org_id IN (
    SELECT u.org_id FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();

-- Comments
COMMENT ON TABLE public.user_invitations IS 'User invitation records with JWT tokens for email-based user onboarding';
COMMENT ON COLUMN public.user_invitations.token IS 'JWT token containing email, role, org_id (7-day expiry)';
COMMENT ON COLUMN public.user_invitations.role IS 'Role code string to assign to user upon acceptance';
COMMENT ON COLUMN public.user_invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';
COMMENT ON COLUMN public.user_invitations.expires_at IS 'Invitation expiry timestamp (7 days from creation)';
COMMENT ON COLUMN public.user_invitations.sent_at IS 'Timestamp when invitation was sent (used for sorting and resend tracking)';
