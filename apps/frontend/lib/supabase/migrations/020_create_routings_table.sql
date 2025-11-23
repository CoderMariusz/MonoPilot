-- Migration 020: Create routings table with RLS
-- Story: 2.15 Routing CRUD
-- Date: 2025-11-23

-- ============================================================================
-- CREATE ROUTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic Data
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Status and Reusability
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_reusable BOOLEAN NOT NULL DEFAULT true,

  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT routings_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT routings_code_format_check CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT routings_code_length_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT routings_name_length_check CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT routings_status_check CHECK (status IN ('active', 'inactive'))
);

-- ============================================================================
-- CREATE INDEXES FOR ROUTINGS
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_routings_org_id ON public.routings(org_id);
CREATE INDEX IF NOT EXISTS idx_routings_code ON public.routings(org_id, code);
CREATE INDEX IF NOT EXISTS idx_routings_status ON public.routings(status);
CREATE INDEX IF NOT EXISTS idx_routings_is_reusable ON public.routings(is_reusable);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR ROUTINGS
-- ============================================================================

ALTER TABLE public.routings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR ROUTINGS
-- ============================================================================

-- Policy: Users can only see routings from their own organization
DROP POLICY IF EXISTS routings_select_policy ON public.routings;
CREATE POLICY routings_select_policy ON public.routings
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin and Technical users can insert routings in their organization
DROP POLICY IF EXISTS routings_insert_policy ON public.routings;
CREATE POLICY routings_insert_policy ON public.routings
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin and Technical users can update routings in their organization
DROP POLICY IF EXISTS routings_update_policy ON public.routings;
CREATE POLICY routings_update_policy ON public.routings
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin users can delete routings in their organization
DROP POLICY IF EXISTS routings_delete_policy ON public.routings;
CREATE POLICY routings_delete_policy ON public.routings
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
DROP TRIGGER IF EXISTS routings_updated_at_trigger ON public.routings;
CREATE TRIGGER routings_updated_at_trigger
  BEFORE UPDATE ON public.routings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS enforces org isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routings TO authenticated;
GRANT SELECT ON public.routings TO anon;

-- ============================================================================
-- COMMENTS FOR ROUTINGS
-- ============================================================================

COMMENT ON TABLE public.routings IS 'Routings define step-by-step production processes (Story 2.15)';
COMMENT ON COLUMN public.routings.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.routings.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.routings.code IS 'Unique routing code per org (uppercase alphanumeric + hyphens, e.g., RTG-BREAD-01)';
COMMENT ON COLUMN public.routings.name IS 'Routing display name (1-100 chars)';
COMMENT ON COLUMN public.routings.description IS 'Optional routing description';
COMMENT ON COLUMN public.routings.status IS 'Routing status: active, inactive';
COMMENT ON COLUMN public.routings.is_reusable IS 'If true, routing can be assigned to multiple products. If false, only one product.';
COMMENT ON COLUMN public.routings.created_by IS 'FK to users - user who created the routing';
COMMENT ON COLUMN public.routings.updated_by IS 'FK to users - user who last updated the routing';
