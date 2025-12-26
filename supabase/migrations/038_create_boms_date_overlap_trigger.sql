-- Migration: Create BOM date overlap prevention trigger
-- Story: 02.4 - Bills of Materials Management
-- Purpose: Prevents overlapping date ranges for same product within organization
-- Acceptance Criteria: AC-18 to AC-20

-- ============================================================================
-- Function: check_bom_date_overlap (TRIGGER function)
-- Purpose: Database-level preventive control for date overlap validation
-- Validates date ranges don't overlap and prevents multiple NULL effective_to
--
-- RELATIONSHIP TO RPC:
-- - Trigger: check_bom_date_overlap() (this function)
--   - Purpose: Database-level preventive control (SOURCE OF TRUTH)
--   - Runs automatically on INSERT/UPDATE operations
--   - Blocks invalid data modifications at the database level
--   - ALWAYS enforces date overlap rules regardless of client code
--
-- - RPC: check_bom_date_overlap() in migration 040
--   - Purpose: Client-side validation for early feedback
--   - Called explicitly by service layer (bom-service-02-4.ts)
--   - Returns list of conflicting BOMs for user-friendly error messages
--   - Uses IDENTICAL daterange logic for consistency
--
-- Both functions are named the same for clarity. PostgreSQL allows this because:
-- - Trigger functions have signature: RETURNS TRIGGER with no parameters
-- - RPC functions have signature: RETURNS TABLE with multiple parameters
--
-- The trigger is the source of truth. Even if service validation is bypassed,
-- the trigger will still prevent invalid data from being saved.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges
  -- Uses inclusive range: daterange(from, to, '[]') means [from, to]
  -- NULL effective_to is treated as infinity (unbounded upper)
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND daterange(effective_from, effective_to, '[]') &&
          daterange(NEW.effective_from, NEW.effective_to, '[]')
  ) THEN
    RAISE EXCEPTION 'Date range overlaps with existing BOM for this product';
  END IF;

  -- Check for multiple BOMs with NULL effective_to (ongoing)
  -- Only one BOM can have no end date per product within organization
  IF NEW.effective_to IS NULL AND EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'Only one BOM can have no end date per product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_check_bom_date_overlap
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_date_overlap();

-- ============================================================================
-- Function: update_boms_updated_at
-- Auto-updates updated_at timestamp on update
-- ============================================================================

CREATE OR REPLACE FUNCTION update_boms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for UPDATE
CREATE TRIGGER trigger_update_boms_updated_at
  BEFORE UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION update_boms_updated_at();

-- Comments
COMMENT ON FUNCTION check_bom_date_overlap() IS 'Prevents overlapping date ranges and multiple NULL effective_to for same product (AC-18 to AC-20)';
COMMENT ON FUNCTION update_boms_updated_at() IS 'Auto-updates updated_at timestamp on row update';
COMMENT ON TRIGGER trigger_check_bom_date_overlap ON boms IS 'Date overlap prevention trigger - runs before INSERT/UPDATE';
COMMENT ON TRIGGER trigger_update_boms_updated_at ON boms IS 'Auto-update timestamp trigger - runs before UPDATE';
