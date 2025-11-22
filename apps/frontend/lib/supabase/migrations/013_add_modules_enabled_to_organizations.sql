-- Migration 013: Add modules_enabled column to organizations table
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
-- MODULE CONFIGURATION CONSTANTS (for reference)
-- ============================================================================
--
-- Module codes and their properties:
--
-- | Code       | Name       | Description                    | Default | Epic |
-- |------------|------------|--------------------------------|---------|------|
-- | technical  | Technical  | Products, BOMs, Routings       | ON      | 2    |
-- | planning   | Planning   | POs, TOs, WOs                  | ON      | 3    |
-- | production | Production | WO Execution                   | ON      | 4    |
-- | warehouse  | Warehouse  | LPs, Moves, Pallets            | ON      | 5    |
-- | quality    | Quality    | QA Workflows                   | OFF     | 6    |
-- | shipping   | Shipping   | SOs, Pick Lists                | OFF     | 7    |
-- | npd        | NPD        | Formulation                    | OFF     | 8    |
-- | finance    | Finance    | Costing, Margin Analysis       | OFF     | -    |
--
-- Usage in application:
-- - Frontend: filter navigation links by modules_enabled
-- - Backend: API middleware checks modules_enabled for module-specific routes
-- - Users: Admin can enable/disable modules via /settings/modules
-- ============================================================================

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

-- ============================================================================
-- NOTE: API Middleware (AC-010.4)
-- ============================================================================
--
-- Application middleware should check modules_enabled before allowing access
-- to module-specific API routes:
--
-- Route pattern → Module code:
-- - /api/technical/*   → 'technical'
-- - /api/planning/*    → 'planning'
-- - /api/production/*  → 'production'
-- - /api/warehouse/*   → 'warehouse'
-- - /api/quality/*     → 'quality'
-- - /api/shipping/*    → 'shipping'
-- - /api/npd/*         → 'npd'
-- - /api/finance/*     → 'finance'
--
-- If module not in modules_enabled → return 403 Forbidden
-- Error: "Module '[module]' is not enabled for your organization"
--
-- Exception: /api/settings/* routes are always accessible (for enabling/disabling modules)
-- ============================================================================

-- ============================================================================
-- NOTE: Frontend Navigation Filtering (AC-010.3)
-- ============================================================================
--
-- Frontend should:
-- 1. Fetch organizations.modules_enabled for current org
-- 2. Filter navigation links:
--    - Only show links for enabled modules
--    - Hide dashboard widgets for disabled modules
-- 3. Subscribe to module changes (Realtime) and rebuild navigation
--
-- Example:
--   const navLinks = ALL_NAV_LINKS.filter(link =>
--     enabledModules.includes(link.module)
--   )
-- ============================================================================
