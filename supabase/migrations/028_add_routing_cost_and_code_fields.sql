-- Migration: 028_add_routing_cost_and_code_fields.sql
-- Description: Add cost configuration and code fields to routings (combines 043 + 044)
-- Date: 2025-12-23
-- Author: BACKEND-DEV Agent
-- Story: 02.7 - Routings CRUD
-- Related: ADR-009 (routing-level costs), migrations 043, 044
-- Depends on: 027_create_routings_table.sql

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Add missing fields from archive migrations 043 and 044:
--
-- From 043 (ADR-009 - Routing Level Costs):
--   - setup_cost: Fixed cost per routing run
--   - working_cost_per_unit: Variable cost per output unit
--   - overhead_percent: Factory overhead percentage (0-100%)
--   - currency: Currency code for cost fields
--
-- From 044 (Code and Reusability):
--   - code: Unique routing identifier (e.g., RTG-BREAD-01)
--   - is_reusable: Can routing be shared across multiple BOMs?
--   - cleanup_time: Cleanup time in minutes (routing_operations)
--   - instructions: Step-by-step operator instructions (routing_operations)
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: ROUTINGS TABLE - Cost Fields (ADR-009)
-- =============================================================================

-- Add cost columns to routings table
ALTER TABLE routings
ADD COLUMN IF NOT EXISTS setup_cost DECIMAL(10,2) DEFAULT 0 CHECK (setup_cost >= 0),
ADD COLUMN IF NOT EXISTS working_cost_per_unit DECIMAL(10,4) DEFAULT 0 CHECK (working_cost_per_unit >= 0),
ADD COLUMN IF NOT EXISTS overhead_percent DECIMAL(5,2) DEFAULT 0 CHECK (overhead_percent >= 0 AND overhead_percent <= 100),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN' CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'));

-- Add column comments
COMMENT ON COLUMN routings.setup_cost IS 'Fixed cost per routing run (tooling, changeover, calibration). Default: 0';
COMMENT ON COLUMN routings.working_cost_per_unit IS 'Variable cost per output unit (utilities, consumables). Default: 0';
COMMENT ON COLUMN routings.overhead_percent IS 'Factory overhead % applied to total routing cost subtotal (0-100%). Default: 0';
COMMENT ON COLUMN routings.currency IS 'Currency code for cost fields (PLN, EUR, USD, GBP). Default: PLN';

-- =============================================================================
-- PART 2: ROUTINGS TABLE - Code and Reusability Fields
-- =============================================================================

-- Add is_reusable field
ALTER TABLE routings
ADD COLUMN IF NOT EXISTS is_reusable BOOLEAN DEFAULT true;

COMMENT ON COLUMN routings.is_reusable IS 'If true, routing can be shared across multiple products/BOMs. If false, product-specific (1:1). Default: true';

-- Add code field (initially nullable for migration)
ALTER TABLE routings
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Populate code from name for existing rows (only if NULL)
UPDATE routings
SET code = UPPER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LEFT(name, 40),           -- Truncate to 40 chars to leave room for suffix
        '[^A-Za-z0-9]+',          -- Match non-alphanumeric
        '-',                       -- Replace with hyphen
        'g'
      ),
      '^-+|-+$',                  -- Trim leading/trailing hyphens
      '',
      'g'
    ),
    '-{2,}',                      -- Replace multiple hyphens with single
    '-',
    'g'
  )
)
WHERE code IS NULL;

-- Handle duplicates by appending sequence number
WITH duplicates AS (
  SELECT id, code, ROW_NUMBER() OVER (PARTITION BY org_id, code ORDER BY created_at) as rn
  FROM routings
  WHERE code IS NOT NULL
)
UPDATE routings r
SET code = r.code || '-' || d.rn::text
FROM duplicates d
WHERE r.id = d.id AND d.rn > 1;

-- Now make code NOT NULL
ALTER TABLE routings
ALTER COLUMN code SET NOT NULL;

-- Add unique constraint on (org_id, code)
ALTER TABLE routings
ADD CONSTRAINT routings_org_code_unique UNIQUE (org_id, code);

COMMENT ON COLUMN routings.code IS 'Unique routing identifier (e.g., RTG-BREAD-01). Uppercase alphanumeric + hyphens only. Max 50 characters.';

-- Add index for code lookup
CREATE INDEX IF NOT EXISTS idx_routings_org_code ON routings(org_id, code);

-- =============================================================================
-- PART 3: ROUTING_OPERATIONS TABLE - Cleanup Time and Instructions
-- =============================================================================

-- Add cleanup_time field
ALTER TABLE routing_operations
ADD COLUMN IF NOT EXISTS cleanup_time INTEGER DEFAULT 0 CHECK (cleanup_time >= 0);

COMMENT ON COLUMN routing_operations.cleanup_time IS 'Cleanup time in minutes after operation (sanitation, tool removal). Default: 0';

-- Add instructions field
ALTER TABLE routing_operations
ADD COLUMN IF NOT EXISTS instructions TEXT CHECK (instructions IS NULL OR length(instructions) <= 2000);

COMMENT ON COLUMN routing_operations.instructions IS 'Step-by-step operator instructions for this operation. Max 2000 characters recommended.';

-- =============================================================================
-- PART 4: UPDATE VERSION TRIGGER TO CHECK NEW FIELDS
-- =============================================================================

-- Update the trigger function to check all fields added in this migration
CREATE OR REPLACE FUNCTION increment_routing_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Check all data fields (including newly added ones from migration 028)
  IF (OLD.name IS DISTINCT FROM NEW.name OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.is_active IS DISTINCT FROM NEW.is_active OR
      OLD.setup_cost IS DISTINCT FROM NEW.setup_cost OR
      OLD.working_cost_per_unit IS DISTINCT FROM NEW.working_cost_per_unit OR
      OLD.overhead_percent IS DISTINCT FROM NEW.overhead_percent OR
      OLD.currency IS DISTINCT FROM NEW.currency OR
      OLD.is_reusable IS DISTINCT FROM NEW.is_reusable OR
      OLD.code IS DISTINCT FROM NEW.code) THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger itself already exists from migration 027, just updating the function

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check routings new columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routings'
-- AND column_name IN ('code', 'is_reusable', 'setup_cost', 'working_cost_per_unit', 'overhead_percent', 'currency')
-- ORDER BY column_name;
--
-- Check routing_operations new columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routing_operations'
-- AND column_name IN ('cleanup_time', 'instructions')
-- ORDER BY column_name;
--
-- Check unique constraint:
-- SELECT constraint_name, table_name
-- FROM information_schema.table_constraints
-- WHERE constraint_name = 'routings_org_code_unique';
--
-- Verify code generation:
-- SELECT id, name, code FROM routings LIMIT 10;
