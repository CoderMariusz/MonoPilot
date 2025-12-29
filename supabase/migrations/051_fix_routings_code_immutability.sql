-- Migration: 049_fix_routings_code_immutability.sql
-- Description: Fix routings table - enforce code immutability and add currency constraint
-- Date: 2025-12-28
-- Author: Backend Dev Agent
-- Related: Story 02.7 Code Review (CRITICAL-02, MAJOR-04)

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Fix two issues identified in code review:
-- 1. CRITICAL-02: Version trigger does not prevent code changes
-- 2. MAJOR-04: Currency field has no CHECK constraint

BEGIN;

-- =============================================================================
-- FIX CRITICAL-02: Update version trigger to prevent code changes
-- =============================================================================

-- Drop and recreate the function with code immutability check
CREATE OR REPLACE FUNCTION increment_routing_version()
RETURNS TRIGGER AS $$
BEGIN
  -- CRITICAL: Prevent code changes - code is immutable after creation (FR-2.54)
  IF OLD.code IS DISTINCT FROM NEW.code THEN
    RAISE EXCEPTION 'Code cannot be changed after creation (immutable field)';
  END IF;

  -- Increment version if any editable field changes
  IF OLD.name IS DISTINCT FROM NEW.name
     OR OLD.description IS DISTINCT FROM NEW.description
     OR OLD.is_active IS DISTINCT FROM NEW.is_active
     OR OLD.is_reusable IS DISTINCT FROM NEW.is_reusable
     OR OLD.setup_cost IS DISTINCT FROM NEW.setup_cost
     OR OLD.working_cost_per_unit IS DISTINCT FROM NEW.working_cost_per_unit
     OR OLD.overhead_percent IS DISTINCT FROM NEW.overhead_percent
     OR OLD.currency IS DISTINCT FROM NEW.currency
  THEN
    NEW.version = OLD.version + 1;
  END IF;

  -- Always update timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FIX MAJOR-04: Add currency CHECK constraint
-- =============================================================================

-- Add CHECK constraint for valid currency values (ADR-009)
-- Drop if exists to make migration idempotent
ALTER TABLE routings
DROP CONSTRAINT IF EXISTS chk_routings_currency_valid;

ALTER TABLE routings
ADD CONSTRAINT chk_routings_currency_valid
CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION increment_routing_version() IS
'Trigger function to auto-increment routing version on edit and enforce code immutability (Story 02.7, FR-2.54)';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Test code immutability:
-- UPDATE routings SET code = 'NEW-CODE' WHERE id = 'some-uuid';
-- Expected: ERROR: Code cannot be changed after creation (immutable field)
--
-- Test currency constraint:
-- UPDATE routings SET currency = 'INVALID' WHERE id = 'some-uuid';
-- Expected: ERROR: new row for relation "routings" violates check constraint "chk_routings_currency_valid"
--
-- Test valid currency change:
-- UPDATE routings SET currency = 'EUR' WHERE id = 'some-uuid';
-- Expected: SUCCESS, version incremented
--
-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
-- -- Restore original function (without code immutability check)
-- CREATE OR REPLACE FUNCTION increment_routing_version()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF OLD.name IS DISTINCT FROM NEW.name
--      OR OLD.description IS DISTINCT FROM NEW.description
--      OR OLD.is_active IS DISTINCT FROM NEW.is_active
--      OR OLD.is_reusable IS DISTINCT FROM NEW.is_reusable
--      OR OLD.setup_cost IS DISTINCT FROM NEW.setup_cost
--      OR OLD.working_cost_per_unit IS DISTINCT FROM NEW.working_cost_per_unit
--      OR OLD.overhead_percent IS DISTINCT FROM NEW.overhead_percent
--   THEN
--     NEW.version = OLD.version + 1;
--   END IF;
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- -- Remove currency constraint
-- ALTER TABLE routings DROP CONSTRAINT IF EXISTS chk_routings_currency_valid;
-- COMMIT;
