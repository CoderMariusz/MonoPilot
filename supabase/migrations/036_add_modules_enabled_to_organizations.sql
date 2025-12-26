-- Migration 013 (Moved to 036): Add modules_enabled column to organizations table
-- Story: 1.11 Module Activation
-- Date: 2025-11-22

-- ============================================================================
-- ADD MODULES_ENABLED COLUMN TO ORGANIZATIONS
-- ============================================================================

-- AC-010.1, AC-010.2: Module activation/deactivation
-- Default enabled modules: technical, planning, production, warehouse
-- Optional modules: quality, shipping, npd, finance

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS modules_enabled TEXT[] NOT NULL DEFAULT ARRAY['technical', 'planning', 'production', 'warehouse'];

-- Add check constraint: at least one module must be enabled
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_modules_enabled_not_empty_check;
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_modules_enabled_not_empty_check
  CHECK (array_length(modules_enabled, 1) > 0);

-- ============================================================================
-- CREATE INDEX FOR MODULES_ENABLED
-- ============================================================================

-- Performance index for module queries (GIN index for array contains operations)
CREATE INDEX IF NOT EXISTS idx_organizations_modules_enabled
  ON public.organizations USING GIN (modules_enabled);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.modules_enabled IS 'Array of enabled module codes (technical, planning, production, warehouse, quality, shipping, npd, finance). Default: [technical, planning, production, warehouse]. At least one module required. (Story 1.11, AC-010.1, AC-010.2)';

-- ============================================================================
-- UPDATE EXISTING ORGANIZATIONS (if any)
-- ============================================================================

-- Set default modules for any existing organizations that don't have modules_enabled
-- This is safe because we added the column with DEFAULT, but just in case:
UPDATE public.organizations
SET modules_enabled = ARRAY['technical', 'planning', 'production', 'warehouse']
WHERE modules_enabled IS NULL OR array_length(modules_enabled, 1) IS NULL;

-- ============================================================================
-- HELPER FUNCTION: Check if module is enabled for organization
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_module_enabled(
  p_org_id UUID,
  p_module_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled_modules TEXT[];
BEGIN
  -- Get modules_enabled array for organization
  SELECT modules_enabled INTO v_enabled_modules
  FROM public.organizations
  WHERE id = p_org_id;

  -- Check if module code is in array
  RETURN p_module_code = ANY(v_enabled_modules);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.is_module_enabled IS 'Check if a specific module is enabled for an organization (Story 1.11, AC-010.4)';
