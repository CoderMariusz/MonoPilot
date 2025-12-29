-- Migration: 047_create_routing_operations.sql
-- Description: Create routing_operations table for routing operations management (Story 02.8)
-- Date: 2025-12-28
-- Author: Backend Dev Agent
-- Related: Story 02.8, FR-2.48 (Parallel Operations), TEC-008, ADR-009

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Create the routing_operations table to store production step definitions:
-- - Sequence numbers (duplicates allowed for parallel operations per FR-2.48)
-- - Time tracking (setup, duration, cleanup)
-- - Labor cost per hour
-- - Optional machine assignment
-- - Operator instructions

BEGIN;

-- =============================================================================
-- PREREQUISITE CHECK: Ensure routings table exists
-- =============================================================================
-- Note: This migration assumes routings table exists. If it doesn't, this will fail
-- with a foreign key error which is the correct behavior.

-- =============================================================================
-- CREATE TABLE: routing_operations
-- =============================================================================

CREATE TABLE IF NOT EXISTS routing_operations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to routings table
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,

  -- Sequence number (duplicates allowed for parallel operations - FR-2.48)
  sequence INTEGER NOT NULL,

  -- Operation details
  operation_name TEXT NOT NULL,

  -- Optional machine assignment (nullable FK)
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,

  -- Optional production line assignment
  line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,

  -- Time tracking (in minutes)
  expected_duration_minutes INTEGER NOT NULL,
  setup_time_minutes INTEGER DEFAULT 0,
  cleanup_time_minutes INTEGER DEFAULT 0,

  -- Cost
  labor_cost DECIMAL(15,4) DEFAULT 0,

  -- Expected yield percentage (for future use)
  expected_yield_percent DECIMAL(5,2) DEFAULT 100.00,

  -- Operator instructions (max 2000 chars recommended)
  instructions TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- NO unique constraint on (routing_id, sequence) - allows parallel operations
-- This is intentional per FR-2.48: duplicate sequences = parallel operations

-- Ensure positive sequence numbers
ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_sequence_positive
CHECK (sequence >= 1);

-- Ensure non-negative times
ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_duration_positive
CHECK (expected_duration_minutes >= 1);

ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_setup_positive
CHECK (setup_time_minutes >= 0);

ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_cleanup_positive
CHECK (cleanup_time_minutes >= 0);

-- Ensure non-negative labor cost
ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_labor_cost_positive
CHECK (labor_cost >= 0);

-- Ensure yield percentage is valid
ALTER TABLE routing_operations
ADD CONSTRAINT routing_operations_yield_range
CHECK (expected_yield_percent >= 0 AND expected_yield_percent <= 100);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: operations by routing
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_id
ON routing_operations(routing_id);

-- Sequence ordering within routing
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_seq
ON routing_operations(routing_id, sequence);

-- Machine lookup (for "machines used in which operations" queries)
CREATE INDEX IF NOT EXISTS idx_routing_operations_machine_id
ON routing_operations(machine_id) WHERE machine_id IS NOT NULL;

-- Production line lookup
CREATE INDEX IF NOT EXISTS idx_routing_operations_line_id
ON routing_operations(line_id) WHERE line_id IS NOT NULL;

-- =============================================================================
-- TRIGGER: updated_at auto-update
-- =============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_routing_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_routing_operations_updated_at ON routing_operations;
CREATE TRIGGER trigger_routing_operations_updated_at
BEFORE UPDATE ON routing_operations
FOR EACH ROW
EXECUTE FUNCTION update_routing_operations_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE routing_operations IS 'Production step definitions for routings. Sequence duplicates indicate parallel operations (FR-2.48).';

COMMENT ON COLUMN routing_operations.id IS 'Primary key UUID';
COMMENT ON COLUMN routing_operations.routing_id IS 'Foreign key to parent routing';
COMMENT ON COLUMN routing_operations.sequence IS 'Execution order (1, 2, 3...). Duplicate sequences = parallel operations.';
COMMENT ON COLUMN routing_operations.operation_name IS 'Name of the operation (e.g., Mixing, Proofing, Baking)';
COMMENT ON COLUMN routing_operations.machine_id IS 'Optional machine assignment (nullable)';
COMMENT ON COLUMN routing_operations.line_id IS 'Optional production line assignment (nullable)';
COMMENT ON COLUMN routing_operations.expected_duration_minutes IS 'Expected operation duration in minutes (required, >= 1)';
COMMENT ON COLUMN routing_operations.setup_time_minutes IS 'Setup/preparation time in minutes before operation. Default: 0';
COMMENT ON COLUMN routing_operations.cleanup_time_minutes IS 'Cleanup/sanitation time in minutes after operation. Default: 0';
COMMENT ON COLUMN routing_operations.labor_cost IS 'Labor cost per hour for this operation. Default: 0';
COMMENT ON COLUMN routing_operations.expected_yield_percent IS 'Expected yield percentage (0-100). Default: 100';
COMMENT ON COLUMN routing_operations.instructions IS 'Step-by-step operator instructions. Max 2000 characters recommended.';
COMMENT ON COLUMN routing_operations.created_at IS 'Creation timestamp';
COMMENT ON COLUMN routing_operations.updated_at IS 'Last update timestamp (auto-updated via trigger)';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant access to authenticated users (RLS will control row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON routing_operations TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'routing_operations';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routing_operations'
-- ORDER BY ordinal_position;
--
-- Check constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'routing_operations';
--
-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'routing_operations';
--
-- Test parallel operations (duplicate sequence):
-- INSERT INTO routing_operations (routing_id, sequence, operation_name, expected_duration_minutes)
-- VALUES
--   ('some-routing-uuid', 2, 'Mixing', 15),
--   ('some-routing-uuid', 2, 'Heating', 10);
-- (Should succeed - no unique constraint on sequence)

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_routing_operations_updated_at ON routing_operations;
-- DROP FUNCTION IF EXISTS update_routing_operations_updated_at();
-- DROP TABLE IF EXISTS routing_operations;
-- COMMIT;
