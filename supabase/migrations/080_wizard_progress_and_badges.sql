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
