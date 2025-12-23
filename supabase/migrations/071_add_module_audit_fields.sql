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
