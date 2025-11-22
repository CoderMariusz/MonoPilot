-- Migration 005: Add setup_completed column to organizations table
-- Story: 1.13 Main Dashboard - AC-012.6 (Welcome Banner)
-- Date: 2025-11-22
-- Purpose: Track whether organization has completed initial setup wizard

-- ============================================================================
-- ADD SETUP_COMPLETED COLUMN
-- ============================================================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false NOT NULL;

-- ============================================================================
-- UPDATE EXISTING ORGANIZATIONS
-- ============================================================================

-- Set existing organizations to setup_completed = true (they're already set up)
-- New organizations created after this migration will default to false
UPDATE public.organizations
SET setup_completed = true
WHERE setup_completed IS NULL OR setup_completed = false;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.setup_completed IS 'Indicates whether the organization has completed the initial setup wizard. Default false for new orgs, true for existing orgs.';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify column was added
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'organizations' AND column_name = 'setup_completed';

-- Check existing organizations (should all be true)
-- SELECT id, company_name, setup_completed FROM public.organizations;
