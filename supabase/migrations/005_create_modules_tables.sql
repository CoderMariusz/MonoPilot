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
