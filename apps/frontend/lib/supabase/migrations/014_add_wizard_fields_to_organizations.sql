-- Migration 014: Add wizard fields to organizations table
-- Story: 1.12 Settings Wizard (UX Design)
-- Date: 2025-11-22

-- ============================================================================
-- ADD WIZARD TRACKING COLUMNS TO ORGANIZATIONS
-- ============================================================================

-- AC-012.3: Wizard completion status and progress tracking

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS wizard_progress JSONB DEFAULT NULL;

-- ============================================================================
-- CREATE INDEX FOR WIZARD_COMPLETED
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_wizard_completed
  ON public.organizations(wizard_completed);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.organizations.wizard_completed IS 'Whether the setup wizard has been completed (Story 1.12, AC-012.3). Default: false. Set to true after wizard completion.';
COMMENT ON COLUMN public.organizations.wizard_progress IS 'JSON object storing current wizard step and form data for resume functionality (Story 1.12, AC-012.3). Structure: { step: number, data: object }';

-- ============================================================================
-- WIZARD PROGRESS STRUCTURE (for reference)
-- ============================================================================
--
-- wizard_progress JSONB structure:
--
-- {
--   "step": 3,                          // Current step (1-6)
--   "data": {
--     "organization": {                 // Step 1 data
--       "company_name": "Acme Corp",
--       "address": "123 Main St",
--       ...
--     },
--     "regional": {                     // Step 2 data
--       "timezone": "Europe/Warsaw",
--       "currency": "PLN",
--       ...
--     },
--     "warehouse": {                    // Step 3 data
--       "code": "WH01",
--       "name": "Main Warehouse",
--       "id": "uuid"                    // Stored after creation
--     },
--     "locations": {                    // Step 4 data
--       "receiving": { "id": "uuid", "code": "REC", ... },
--       "shipping": { "id": "uuid", "code": "SHIP", ... },
--       ...
--     },
--     "modules": ["technical", "planning", ...],  // Step 5 data
--     "users": [                        // Step 6 data
--       { "email": "user@example.com", "first_name": "John", ... }
--     ]
--   }
-- }
--
-- ============================================================================
