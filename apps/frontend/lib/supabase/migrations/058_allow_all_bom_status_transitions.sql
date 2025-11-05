-- Migration 058: Allow All BOM Status Transitions
-- Removes restrictions on BOM status transitions
-- Allows bidirectional transitions: draft <--> active <--> archived

-- ==========================================
-- 1. Updated BOM Status Transition Validation Function
-- ==========================================
-- Removes all restrictions - allows any status transition
CREATE OR REPLACE FUNCTION validate_bom_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- All transitions are now allowed:
  -- draft → active: OK
  -- draft → archived: OK
  -- active → draft: OK (previously forbidden)
  -- active → archived: OK
  -- archived → draft: OK (previously forbidden)
  -- archived → active: OK (previously forbidden)
  
  -- No restrictions - just return NEW
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_bom_status_transition() IS 'Allows all BOM status transitions (draft <--> active <--> archived)';

-- ==========================================
-- 2. Trigger remains the same (already exists)
-- ==========================================
-- The trigger bom_status_transition_check already exists from migration 056
-- No need to recreate it, just the function is updated

-- ==========================================
-- 3. Keep single active BOM enforcement
-- ==========================================
-- The enforce_single_active_bom() function and trigger remain unchanged
-- This ensures only one active BOM per product, but doesn't block status changes

