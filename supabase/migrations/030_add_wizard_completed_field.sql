-- Migration: Add wizard_completed field to organizations
-- Fixes missing column error in WizardService

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN organizations.wizard_completed IS 'Explicit flag for wizard completion, redundant with onboarding_completed_at but used by frontend service';
