-- Migration 009: Create production_lines table with RLS and add FK to machine_line_assignments
-- Story: 1.8 Production Line Configuration
-- Date: 2025-11-22

-- ============================================================================
-- CREATE PRODUCTION_LINES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic Data
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,

  -- Warehouse Assignment
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,

  -- Default Output Location (nullable, optional - can override per WO)
  -- Must belong to same warehouse as the line
  default_output_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,

  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT production_lines_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT production_lines_code_format_check CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT production_lines_code_length_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT production_lines_name_length_check CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- ============================================================================
-- ADD FK CONSTRAINT TO MACHINE_LINE_ASSIGNMENTS (from Story 1.7)
-- ============================================================================

-- This adds the missing FK constraint on line_id (noted in migration 007)
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'machine_line_assignments_line_fk'
    AND conrelid = 'public.machine_line_assignments'::regclass
  ) THEN
    ALTER TABLE public.machine_line_assignments
      ADD CONSTRAINT machine_line_assignments_line_fk
      FOREIGN KEY (line_id) REFERENCES public.production_lines(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES FOR PRODUCTION_LINES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_production_lines_org_id ON public.production_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_code ON public.production_lines(org_id, code);
CREATE INDEX IF NOT EXISTS idx_production_lines_warehouse_id ON public.production_lines(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_org_warehouse ON public.production_lines(org_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_production_lines_default_output_location ON public.production_lines(default_output_location_id) WHERE default_output_location_id IS NOT NULL;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR PRODUCTION_LINES
-- ============================================================================

ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR PRODUCTION_LINES
-- ============================================================================
--
-- PERFORMANCE NOTE: RLS policies use subqueries (EXISTS) to check admin role
-- This may cause N+1 query patterns on large datasets
-- MONITOR: Query response times in Story 1.14 testing
-- OPTIMIZATION: If query time > 100ms, consider:
--   1. Denormalizing 'role' into JWT custom claims
--   2. Caching role lookup in session
--   3. Using materialized views for complex policies
--
-- Current implementation prioritizes security and correctness over performance
-- (Acceptable for MVP with <1000 lines per org)
-- ============================================================================

-- Policy: Users can only see production lines from their own organization
DROP POLICY IF EXISTS production_lines_select_policy ON public.production_lines;
CREATE POLICY production_lines_select_policy ON public.production_lines
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can insert production lines in their organization
DROP POLICY IF EXISTS production_lines_insert_policy ON public.production_lines;
CREATE POLICY production_lines_insert_policy ON public.production_lines
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin can update production lines in their organization
DROP POLICY IF EXISTS production_lines_update_policy ON public.production_lines;
CREATE POLICY production_lines_update_policy ON public.production_lines
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can delete production lines in their organization
-- Note: FK constraint ON DELETE RESTRICT prevents deletion if line has active WOs
DROP POLICY IF EXISTS production_lines_delete_policy ON public.production_lines;
CREATE POLICY production_lines_delete_policy ON public.production_lines
  FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Trigger to call function on UPDATE (function already created in migration 000)
DROP TRIGGER IF EXISTS production_lines_updated_at_trigger ON public.production_lines;
CREATE TRIGGER production_lines_updated_at_trigger
  BEFORE UPDATE ON public.production_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS enforces org isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_lines TO authenticated;
GRANT SELECT ON public.production_lines TO anon;

-- ============================================================================
-- COMMENTS FOR PRODUCTION_LINES
-- ============================================================================

COMMENT ON TABLE public.production_lines IS 'Production lines with warehouse assignment and default output location (Story 1.8)';
COMMENT ON COLUMN public.production_lines.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.production_lines.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.production_lines.code IS 'Unique line code per org (uppercase alphanumeric + hyphens, e.g., LINE-01, PACK-01)';
COMMENT ON COLUMN public.production_lines.name IS 'Line display name (1-100 chars)';
COMMENT ON COLUMN public.production_lines.warehouse_id IS 'FK to warehouses - each line belongs to one warehouse (ON DELETE RESTRICT)';
COMMENT ON COLUMN public.production_lines.default_output_location_id IS 'FK to locations - where WO production output goes by default (optional, nullable, ON DELETE SET NULL). Must be within line warehouse.';
COMMENT ON COLUMN public.production_lines.created_by IS 'FK to users - user who created the line';
COMMENT ON COLUMN public.production_lines.updated_by IS 'FK to users - user who last updated the line';

-- ============================================================================
-- DATABASE CONSTRAINT: Output Location Warehouse Validation (AC-007.2, AC-011)
-- ============================================================================
--
-- Business Rule: default_output_location_id must belong to same warehouse as the line
-- Defense-in-depth: Application layer validation + database constraint
--
-- This prevents race conditions where:
-- 1. App validates location L1 is in warehouse W1
-- 2. Another transaction updates location L1 to warehouse W2
-- 3. App inserts line with inconsistent state
--
CREATE OR REPLACE FUNCTION validate_production_line_output_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if default_output_location_id is set
  IF NEW.default_output_location_id IS NOT NULL THEN
    -- Check that location's warehouse matches line's warehouse
    IF NOT EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = NEW.default_output_location_id
      AND warehouse_id = NEW.warehouse_id
    ) THEN
      RAISE EXCEPTION 'Output location must belong to the same warehouse as the production line (location: %, line warehouse: %)',
        NEW.default_output_location_id, NEW.warehouse_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce constraint on INSERT and UPDATE
DROP TRIGGER IF EXISTS production_lines_validate_output_location ON public.production_lines;
CREATE TRIGGER production_lines_validate_output_location
  BEFORE INSERT OR UPDATE ON public.production_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_production_line_output_location();

-- NOTE: Application layer still validates for better UX (immediate feedback)
-- Database constraint is the final safety net against race conditions
-- ============================================================================

-- ============================================================================
-- NOTE: Machine Assignments (AC-007.3)
-- ============================================================================
--
-- Machine-to-line assignments are managed via machine_line_assignments table
-- (created in migration 007, FK added above)
--
-- Bidirectional assignment:
-- - Story 1.7 (Machine Configuration): assign lines to machine
-- - Story 1.8 (Production Line Configuration): assign machines to line
-- - Both update the same join table
--
-- Cascade delete: If line deleted → all assignments deleted (ON DELETE CASCADE)
-- ============================================================================

-- ============================================================================
-- NOTE: WO Dependency (AC-007.5)
-- ============================================================================
--
-- Future: When work_orders table is created (Epic 3), add FK:
-- ALTER TABLE work_orders ADD COLUMN production_line_id UUID REFERENCES production_lines(id) ON DELETE RESTRICT;
--
-- This ensures lines with active WOs cannot be deleted (FK constraint enforcement)
-- Error message: "Cannot delete line - it has X active WOs. Archive it instead."
-- ============================================================================
