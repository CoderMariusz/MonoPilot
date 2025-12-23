-- Migration: 044_add_routing_fields.sql
-- Description: Add code, is_reusable to routings; cleanup_time, instructions to routing_operations
-- Date: 2025-12-14
-- Author: Architect Agent
-- Related: ADR-009-routing-level-costs, UX TEC-008, UX TEC-010, FR-2.54, FR-2.55, FR-2.43, FR-2.45

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Add fields discovered during UX wireframe design:
--
-- routings table:
--   1. code VARCHAR(50) - Unique routing identifier (e.g., RTG-BREAD-01)
--   2. is_reusable BOOLEAN - Can routing be shared across multiple products?
--
-- routing_operations table:
--   3. cleanup_time INTEGER - Cleanup time in minutes after operation
--   4. instructions TEXT - Step-by-step operator instructions
--
-- These fields complete the routing schema for Phase 2C-1 (Routing) and
-- enable accurate cost calculations per ADR-009.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: ROUTINGS TABLE - code and is_reusable fields
-- =============================================================================

-- Add is_reusable field (simple, can be added directly with default)
ALTER TABLE routings
ADD COLUMN IF NOT EXISTS is_reusable BOOLEAN DEFAULT true;

COMMENT ON COLUMN routings.is_reusable IS 'If true, routing can be shared across multiple products/BOMs. If false, product-specific (1:1).';

-- Add code field (initially nullable for migration)
ALTER TABLE routings
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Populate code from name for existing rows
-- Convert name to uppercase, replace non-alphanumeric with hyphens, trim
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

COMMENT ON COLUMN routings.code IS 'Unique routing identifier (e.g., RTG-BREAD-01). Uppercase alphanumeric + hyphens only.';

-- Add index for code lookup
CREATE INDEX IF NOT EXISTS idx_routings_org_code ON routings(org_id, code);

-- =============================================================================
-- PART 2: ROUTING_OPERATIONS TABLE - cleanup_time and instructions fields
-- =============================================================================

-- Add cleanup_time field
ALTER TABLE routing_operations
ADD COLUMN IF NOT EXISTS cleanup_time INTEGER DEFAULT 0;

-- Add constraint for cleanup_time (must be non-negative)
ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_cleanup_positive CHECK (cleanup_time >= 0);

COMMENT ON COLUMN routing_operations.cleanup_time IS 'Cleanup time in minutes after operation (sanitation, tool removal). Default: 0';

-- Add instructions field
ALTER TABLE routing_operations
ADD COLUMN IF NOT EXISTS instructions TEXT;

COMMENT ON COLUMN routing_operations.instructions IS 'Step-by-step operator instructions for this operation. Max 2000 characters recommended.';

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check routings new columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routings'
-- AND column_name IN ('code', 'is_reusable');
--
-- Check routing_operations new columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routing_operations'
-- AND column_name IN ('cleanup_time', 'instructions');
--
-- Check unique constraint:
-- SELECT constraint_name, table_name
-- FROM information_schema.table_constraints
-- WHERE constraint_name = 'routings_org_code_unique';
--
-- Verify code generation:
-- SELECT id, name, code FROM routings LIMIT 10;

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
--
-- -- Remove routing_operations constraints and columns
-- ALTER TABLE routing_operations DROP CONSTRAINT IF EXISTS routing_operations_cleanup_positive;
-- ALTER TABLE routing_operations DROP COLUMN IF EXISTS cleanup_time;
-- ALTER TABLE routing_operations DROP COLUMN IF EXISTS instructions;
--
-- -- Remove routings constraints and columns
-- DROP INDEX IF EXISTS idx_routings_org_code;
-- ALTER TABLE routings DROP CONSTRAINT IF EXISTS routings_org_code_unique;
-- ALTER TABLE routings DROP COLUMN IF EXISTS code;
-- ALTER TABLE routings DROP COLUMN IF EXISTS is_reusable;
--
-- COMMIT;
