-- Migration 040: Add allow_over_consumption to production_settings
-- Epic 4 Batch 4B-1: Consumption (Story 4.11: Over-Consumption Control)
-- Adds setting to control over-consumption warning behavior

-- Add allow_over_consumption column to production_settings
ALTER TABLE production_settings
  ADD COLUMN IF NOT EXISTS allow_over_consumption BOOLEAN NOT NULL DEFAULT false;

-- Comment explaining the setting
COMMENT ON COLUMN production_settings.allow_over_consumption IS
  'Story 4.11: Controls over-consumption warning behavior. When false (default), shows warning requiring confirmation. When true, still shows warning but more permissive. Does NOT block over-consumption, just controls messaging.';

-- Update existing rows to have default value (in case column already exists but is NULL)
UPDATE production_settings
SET allow_over_consumption = false
WHERE allow_over_consumption IS NULL;
