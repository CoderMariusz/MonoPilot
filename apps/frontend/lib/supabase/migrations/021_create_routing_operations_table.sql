-- Migration 021: Create routing_operations table with RLS
-- Story: 2.16 Routing Operations
-- Date: 2025-11-23

-- ============================================================================
-- CREATE ROUTING_OPERATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES public.routings(id) ON DELETE CASCADE,

  -- Operation Details
  sequence INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,

  -- Resource Assignment (optional)
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  line_id UUID REFERENCES public.production_lines(id) ON DELETE SET NULL,

  -- Time and Yield
  expected_duration_minutes INTEGER NOT NULL,
  expected_yield_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  setup_time_minutes INTEGER DEFAULT 0,

  -- Costing (optional)
  labor_cost DECIMAL(10,2),

  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT routing_operations_sequence_check CHECK (sequence > 0),
  CONSTRAINT routing_operations_yield_check CHECK (expected_yield_percent > 0 AND expected_yield_percent <= 100),
  CONSTRAINT routing_operations_duration_check CHECK (expected_duration_minutes > 0),
  CONSTRAINT routing_operations_setup_time_check CHECK (setup_time_minutes >= 0),
  CONSTRAINT routing_operations_labor_cost_check CHECK (labor_cost IS NULL OR labor_cost >= 0),
  CONSTRAINT routing_operations_name_length_check CHECK (char_length(operation_name) >= 1 AND char_length(operation_name) <= 100),
  CONSTRAINT routing_operations_unique_sequence UNIQUE (routing_id, sequence)
);

-- ============================================================================
-- CREATE INDEXES FOR ROUTING_OPERATIONS
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_id ON public.routing_operations(routing_id);
CREATE INDEX IF NOT EXISTS idx_routing_operations_sequence ON public.routing_operations(routing_id, sequence);
CREATE INDEX IF NOT EXISTS idx_routing_operations_machine_id ON public.routing_operations(machine_id) WHERE machine_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_routing_operations_line_id ON public.routing_operations(line_id) WHERE line_id IS NOT NULL;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR ROUTING_OPERATIONS
-- ============================================================================

ALTER TABLE public.routing_operations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR ROUTING_OPERATIONS
-- ============================================================================

-- Policy: Users can only see operations from routings in their organization
DROP POLICY IF EXISTS routing_operations_select_policy ON public.routing_operations;
CREATE POLICY routing_operations_select_policy ON public.routing_operations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin and Technical users can insert operations
DROP POLICY IF EXISTS routing_operations_insert_policy ON public.routing_operations;
CREATE POLICY routing_operations_insert_policy ON public.routing_operations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin and Technical users can update operations
DROP POLICY IF EXISTS routing_operations_update_policy ON public.routing_operations;
CREATE POLICY routing_operations_update_policy ON public.routing_operations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin users can delete operations
DROP POLICY IF EXISTS routing_operations_delete_policy ON public.routing_operations;
CREATE POLICY routing_operations_delete_policy ON public.routing_operations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = routing_operations.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
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
DROP TRIGGER IF EXISTS routing_operations_updated_at_trigger ON public.routing_operations;
CREATE TRIGGER routing_operations_updated_at_trigger
  BEFORE UPDATE ON public.routing_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS enforces org isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routing_operations TO authenticated;
GRANT SELECT ON public.routing_operations TO anon;

-- ============================================================================
-- COMMENTS FOR ROUTING_OPERATIONS
-- ============================================================================

COMMENT ON TABLE public.routing_operations IS 'Operations within a routing, defining step-by-step production process (Story 2.16)';
COMMENT ON COLUMN public.routing_operations.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.routing_operations.routing_id IS 'FK to routings table (CASCADE on delete)';
COMMENT ON COLUMN public.routing_operations.sequence IS 'Execution order (1, 2, 3...), unique within routing';
COMMENT ON COLUMN public.routing_operations.operation_name IS 'Operation name/description (1-100 chars)';
COMMENT ON COLUMN public.routing_operations.machine_id IS 'Optional FK to machines (SET NULL on delete)';
COMMENT ON COLUMN public.routing_operations.line_id IS 'Optional FK to production_lines (SET NULL on delete)';
COMMENT ON COLUMN public.routing_operations.expected_duration_minutes IS 'Expected operation duration in minutes (positive integer)';
COMMENT ON COLUMN public.routing_operations.expected_yield_percent IS 'Expected yield percentage (0.01-100.00, default 100.00)';
COMMENT ON COLUMN public.routing_operations.setup_time_minutes IS 'Setup time in minutes (non-negative, default 0)';
COMMENT ON COLUMN public.routing_operations.labor_cost IS 'Optional labor cost for this operation (decimal, 2 decimal places)';
