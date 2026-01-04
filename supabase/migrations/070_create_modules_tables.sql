/**
 * Migration: Module Toggles System
 * Story: 01.7 - Module Toggles
 * ADR-011: Module Toggle Storage
 * ADR-013: RLS Org Isolation Pattern
 */

-- Create modules table (system data, seeded)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dependencies TEXT[] DEFAULT '{}',  -- array of module codes
  can_disable BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);

-- Create organization_modules table (org-specific state)
CREATE TABLE IF NOT EXISTS organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  disabled_at TIMESTAMPTZ,
  disabled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, module_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_modules_org_id ON organization_modules(org_id);
CREATE INDEX IF NOT EXISTS idx_org_modules_module_id ON organization_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_org_modules_enabled ON organization_modules(enabled) WHERE enabled = true;

-- RLS Policies (ADR-013 - users lookup pattern)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

-- modules: Read-only for all authenticated users (system data)
CREATE POLICY "modules_select" ON modules
FOR SELECT TO authenticated
USING (true);

-- organization_modules: Org-scoped access
CREATE POLICY "org_modules_select" ON organization_modules
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_modules_insert" ON organization_modules
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_modules_update" ON organization_modules
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Seed 7 modules
INSERT INTO modules (code, name, description, dependencies, can_disable, display_order) VALUES
  ('settings', 'Settings', 'Organization and user settings', '{}', false, 0),
  ('technical', 'Technical', 'Products, BOMs, routings', '{}', true, 1),
  ('planning', 'Planning', 'Work orders, scheduling', '{"technical"}', true, 2),
  ('production', 'Production', 'Production execution', '{"technical","planning"}', true, 3),
  ('quality', 'Quality', 'Quality control and inspections', '{"production"}', true, 4),
  ('warehouse', 'Warehouse', 'Inventory management', '{"technical"}', true, 5),
  ('shipping', 'Shipping', 'Shipment tracking', '{"warehouse"}', true, 6)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  dependencies = EXCLUDED.dependencies,
  can_disable = EXCLUDED.can_disable,
  display_order = EXCLUDED.display_order;
