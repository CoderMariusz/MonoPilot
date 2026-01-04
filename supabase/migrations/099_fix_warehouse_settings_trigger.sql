-- Migration 096: Fix warehouse settings trigger for organizations
-- Bug Fix: organizations table doesn't have created_by field
-- Story: 05.8 (Critical QA Bug Fix)
-- Date: 2026-01-03

-- Recreate the function without referencing non-existent created_by field
CREATE OR REPLACE FUNCTION init_warehouse_settings_for_org()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO warehouse_settings (org_id)
  VALUES (NEW.id)
  ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION init_warehouse_settings_for_org() IS 'Auto-creates warehouse_settings record when organization is created (fixed: removed non-existent created_by reference)';
