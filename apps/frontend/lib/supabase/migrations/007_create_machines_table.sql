-- Migration 007: Create machines and machine_line_assignments tables with RLS
-- Story: 1.7 Machine Configuration
-- Date: 2025-11-22

-- ============================================================================
-- CREATE MACHINES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic Data
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  capacity_per_hour DECIMAL(10,2),

  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT machines_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT machines_code_format_check CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT machines_code_length_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT machines_name_length_check CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT machines_status_check CHECK (status IN ('active', 'down', 'maintenance')),
  CONSTRAINT machines_capacity_check CHECK (capacity_per_hour IS NULL OR capacity_per_hour > 0)
);

-- ============================================================================
-- CREATE MACHINE_LINE_ASSIGNMENTS TABLE (Many-to-Many Join Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.machine_line_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  line_id UUID NOT NULL,  -- FK to production_lines will be added in migration for Story 1.8
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT machine_line_assignments_unique UNIQUE (machine_id, line_id)
);

-- ============================================================================
-- CREATE INDEXES FOR MACHINES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_machines_org_id ON public.machines(org_id);
CREATE INDEX IF NOT EXISTS idx_machines_code ON public.machines(org_id, code);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_org_status ON public.machines(org_id, status);

-- ============================================================================
-- CREATE INDEXES FOR MACHINE_LINE_ASSIGNMENTS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_machine_line_machine_id ON public.machine_line_assignments(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_line_line_id ON public.machine_line_assignments(line_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR MACHINES
-- ============================================================================

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR MACHINES
-- ============================================================================

-- Policy: Users can only see machines from their own organization
CREATE POLICY machines_select_policy ON public.machines
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can insert machines in their organization
CREATE POLICY machines_insert_policy ON public.machines
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

-- Policy: Admin can update machines in their organization
CREATE POLICY machines_update_policy ON public.machines
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

-- Policy: Admin can delete machines in their organization
CREATE POLICY machines_delete_policy ON public.machines
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
-- RLS POLICIES FOR MACHINE_LINE_ASSIGNMENTS
-- ============================================================================
-- Note: RLS inherited from machines table via machine_id FK
-- Users can only see/modify assignments for machines in their org

ALTER TABLE public.machine_line_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see assignments for machines in their org
CREATE POLICY machine_line_assignments_select_policy ON public.machine_line_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.machines
      WHERE machines.id = machine_line_assignments.machine_id
      AND machines.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin can insert assignments for their org's machines
CREATE POLICY machine_line_assignments_insert_policy ON public.machine_line_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.machines
      WHERE machines.id = machine_line_assignments.machine_id
      AND machines.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin can delete assignments for their org's machines
CREATE POLICY machine_line_assignments_delete_policy ON public.machine_line_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.machines
      WHERE machines.id = machine_line_assignments.machine_id
      AND machines.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
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
CREATE TRIGGER machines_updated_at_trigger
  BEFORE UPDATE ON public.machines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS enforces org isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT SELECT ON public.machines TO anon;

GRANT SELECT, INSERT, DELETE ON public.machine_line_assignments TO authenticated;
GRANT SELECT ON public.machine_line_assignments TO anon;

-- ============================================================================
-- COMMENTS FOR MACHINES
-- ============================================================================

COMMENT ON TABLE public.machines IS 'Production machines with status lifecycle and capacity tracking (Story 1.7)';
COMMENT ON COLUMN public.machines.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.machines.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.machines.code IS 'Unique machine code per org (uppercase alphanumeric + hyphens, e.g., MIX-01, PACK-02)';
COMMENT ON COLUMN public.machines.name IS 'Machine display name (1-100 chars)';
COMMENT ON COLUMN public.machines.status IS 'Machine status: active (available for WO), down (unplanned downtime), maintenance (planned downtime)';
COMMENT ON COLUMN public.machines.capacity_per_hour IS 'Optional production capacity (decimal, e.g., 1000.5 units/hour)';
COMMENT ON COLUMN public.machines.created_by IS 'FK to users - user who created the machine';
COMMENT ON COLUMN public.machines.updated_by IS 'FK to users - user who last updated the machine';

-- ============================================================================
-- COMMENTS FOR MACHINE_LINE_ASSIGNMENTS
-- ============================================================================

COMMENT ON TABLE public.machine_line_assignments IS 'Many-to-many relationship between machines and production lines (Story 1.7)';
COMMENT ON COLUMN public.machine_line_assignments.machine_id IS 'FK to machines (ON DELETE CASCADE)';
COMMENT ON COLUMN public.machine_line_assignments.line_id IS 'FK to production_lines (will be added in Story 1.8 migration)';
COMMENT ON COLUMN public.machine_line_assignments.created_at IS 'Timestamp when assignment was created';

-- ============================================================================
-- NOTE: Production Lines Dependency
-- ============================================================================
--
-- The line_id column will get its FK constraint added when the production_lines
-- table is created in Story 1.8. Stories 1.7 and 1.8 can be developed in parallel,
-- and this join table can be used by either story.
--
-- When production_lines table is created, add this constraint:
-- ALTER TABLE public.machine_line_assignments
--   ADD CONSTRAINT machine_line_assignments_line_fk
--   FOREIGN KEY (line_id) REFERENCES public.production_lines(id) ON DELETE CASCADE;
-- ============================================================================
