-- Migration: 050_enable_parallel_operations.sql
-- Description: Remove UNIQUE constraint on (routing_id, sequence) to allow parallel operations
-- Date: 2025-12-14
-- Author: Backend Dev Agent
-- Related: FR-2.48 (Parallel Operations - Simple Version), TEC-010 wireframe

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Enable parallel operations feature by allowing duplicate sequence numbers
-- within the same routing. This is the Simple/MVP version of FR-2.48.
--
-- Business Context:
--   - Operations with same sequence number = run in parallel
--   - Example: Sequence 2 (Mixing) + Sequence 2 (Heating) = both happen at once
--   - Phase 2 Complex will add: dependency graphs, resource conflict detection
--
-- Database Change:
--   - DROP UNIQUE constraint on routing_operations(routing_id, sequence)
--   - Update column comment to reflect parallel operations support
--
-- UX Impact:
--   - TEC-010: Operation modal shows info message when duplicate sequence used
--   - TEC-010: Operations table shows "(Parallel)" indicator
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: DROP UNIQUE CONSTRAINT
-- =============================================================================

-- Drop the unique constraint that prevents duplicate sequence numbers
ALTER TABLE public.routing_operations
DROP CONSTRAINT IF EXISTS routing_operations_unique_sequence;

-- =============================================================================
-- PART 2: UPDATE COLUMN COMMENT
-- =============================================================================

-- Update comment to document parallel operations feature
COMMENT ON COLUMN public.routing_operations.sequence IS
  'Operation sequence number (1, 2, 3...). Duplicate sequences indicate parallel operations (FR-2.48). Example: Seq 2 (Mixing) + Seq 2 (Heating) = run in parallel.';

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check constraint was dropped:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'routing_operations'
-- AND constraint_name = 'routing_operations_unique_sequence';
-- (Should return 0 rows)
--
-- Test duplicate sequence insertion:
-- INSERT INTO routing_operations (routing_id, sequence, operation_name, expected_duration_minutes)
-- VALUES
--   ('test-routing-id', 2, 'Mixing', 15),
--   ('test-routing-id', 2, 'Heating', 10);
-- (Should succeed)
--
-- Check updated comment:
-- SELECT col_description('public.routing_operations'::regclass, 2);

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
--
-- -- Restore unique constraint (will fail if parallel operations exist)
-- ALTER TABLE public.routing_operations
-- ADD CONSTRAINT routing_operations_unique_sequence
-- UNIQUE (routing_id, sequence);
--
-- -- Restore original comment
-- COMMENT ON COLUMN public.routing_operations.sequence IS
--   'Execution order (1, 2, 3...), unique within routing';
--
-- COMMIT;
