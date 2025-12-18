-- Migration: 043_add_routing_costs.sql
-- Description: Add routing-level cost fields per ADR-009
-- Date: 2025-12-14
-- Author: Architect Agent
-- Related: ADR-009-routing-level-costs, FR-2.51, FR-2.52, FR-2.53

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Add cost fields directly to the routings table to capture:
-- 1. Fixed setup cost per routing run (tooling, changeover, calibration)
-- 2. Variable working cost per output unit
-- 3. Factory overhead percentage
-- 4. Currency for cost fields
--
-- This enables complete production cost calculation:
-- Total = Material + Operation Labor + Operation Setup + Routing Setup + Routing Working + Overhead
-- =============================================================================

-- Add cost columns to routings table
ALTER TABLE routings
ADD COLUMN IF NOT EXISTS setup_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS working_cost_per_unit DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overhead_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN';

-- Add column comments for documentation
COMMENT ON COLUMN routings.setup_cost IS 'Fixed cost per routing run (tooling, changeover, calibration). Default: 0';
COMMENT ON COLUMN routings.working_cost_per_unit IS 'Variable cost per output unit (utilities, consumables). Default: 0';
COMMENT ON COLUMN routings.overhead_percent IS 'Factory overhead % applied to total routing cost subtotal. Default: 0';
COMMENT ON COLUMN routings.currency IS 'Currency code for cost fields. Default: PLN';

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Ensure setup_cost is non-negative
ALTER TABLE routings
ADD CONSTRAINT chk_routings_setup_cost_positive
CHECK (setup_cost >= 0);

-- Ensure working_cost_per_unit is non-negative
ALTER TABLE routings
ADD CONSTRAINT chk_routings_working_cost_positive
CHECK (working_cost_per_unit >= 0);

-- Ensure overhead_percent is between 0 and 100
ALTER TABLE routings
ADD CONSTRAINT chk_routings_overhead_percent_range
CHECK (overhead_percent >= 0 AND overhead_percent <= 100);

-- =============================================================================
-- INDEXES (if needed for queries)
-- =============================================================================
-- No additional indexes needed as cost fields are rarely queried directly
-- They are fetched as part of routing record

-- =============================================================================
-- DATA MIGRATION
-- =============================================================================
-- No data migration needed - DEFAULT 0 handles existing rows
-- All existing routings will have zero costs (backwards compatible)

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
-- ALTER TABLE routings DROP CONSTRAINT IF EXISTS chk_routings_setup_cost_positive;
-- ALTER TABLE routings DROP CONSTRAINT IF EXISTS chk_routings_working_cost_positive;
-- ALTER TABLE routings DROP CONSTRAINT IF EXISTS chk_routings_overhead_percent_range;
-- ALTER TABLE routings DROP COLUMN IF EXISTS setup_cost;
-- ALTER TABLE routings DROP COLUMN IF EXISTS working_cost_per_unit;
-- ALTER TABLE routings DROP COLUMN IF EXISTS overhead_percent;
-- ALTER TABLE routings DROP COLUMN IF EXISTS currency;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After migration, verify with:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'routings'
-- AND column_name IN ('setup_cost', 'working_cost_per_unit', 'overhead_percent', 'currency');
