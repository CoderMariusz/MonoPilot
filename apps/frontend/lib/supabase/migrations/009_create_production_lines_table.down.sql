-- Migration 009 ROLLBACK: Drop production_lines table and revert changes
-- Story: 1.8 Production Line Configuration
-- Date: 2025-11-22

-- ============================================================================
-- ROLLBACK ORDER (reverse of up migration):
-- 1. Drop trigger
-- 2. Drop RLS policies
-- 3. Drop table (CASCADE will drop indexes, constraints)
-- 4. Remove FK from machine_line_assignments
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS production_lines_validate_output_location ON public.production_lines;
DROP TRIGGER IF EXISTS production_lines_updated_at_trigger ON public.production_lines;

-- Drop validation function
DROP FUNCTION IF EXISTS validate_production_line_output_location();

-- Drop RLS policies
DROP POLICY IF EXISTS production_lines_delete_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_update_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_insert_policy ON public.production_lines;
DROP POLICY IF EXISTS production_lines_select_policy ON public.production_lines;

-- Drop table (CASCADE will remove indexes and dependent constraints)
DROP TABLE IF EXISTS public.production_lines CASCADE;

-- Remove FK constraint from machine_line_assignments (added in up migration)
ALTER TABLE public.machine_line_assignments
  DROP CONSTRAINT IF EXISTS machine_line_assignments_line_fk;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- NOTE: This rollback will FAIL if:
-- 1. production_lines table has data (consider data backup first)
-- 2. Other tables reference production_lines (future epics)
--
-- To force rollback with data loss, add CASCADE to DROP TABLE
-- ============================================================================
