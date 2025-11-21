-- Migration 003: Create warehouses table with RLS
-- Story: 1.5 Warehouse Configuration (prerequisite for 1.6 Locations)
-- Date: 2025-11-21

-- ============================================================================
-- CREATE WAREHOUSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  address TEXT,

  -- Default locations (nullable initially, updated after locations created)
  default_receiving_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
  default_shipping_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
  transit_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,

  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT warehouses_org_code_unique UNIQUE (org_id, code)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_warehouses_org_id ON public.warehouses(org_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON public.warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON public.warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_active ON public.warehouses(org_id, is_active);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Policy: Users can only see warehouses from their own organization
CREATE POLICY warehouses_select_policy ON public.warehouses
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can insert warehouses in their organization
CREATE POLICY warehouses_insert_policy ON public.warehouses
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

-- Policy: Admin can update warehouses in their organization
CREATE POLICY warehouses_update_policy ON public.warehouses
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

-- Policy: Admin can delete warehouses in their organization
CREATE POLICY warehouses_delete_policy ON public.warehouses
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

-- Trigger to call function on UPDATE (reuse existing function)
CREATE TRIGGER warehouses_updated_at_trigger
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT SELECT ON public.warehouses TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.warehouses IS 'Warehouse configuration with default location assignments and multi-tenancy';
COMMENT ON COLUMN public.warehouses.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.warehouses.code IS 'Unique warehouse code per organization (e.g., WH-01, MAIN)';
COMMENT ON COLUMN public.warehouses.default_receiving_location_id IS 'Default location for PO receiving (nullable initially, set after locations created)';
COMMENT ON COLUMN public.warehouses.default_shipping_location_id IS 'Default location for shipping operations (nullable initially)';
COMMENT ON COLUMN public.warehouses.transit_location_id IS 'Default location for transit/staging operations (nullable initially)';
COMMENT ON COLUMN public.warehouses.is_active IS 'Soft delete flag - inactive warehouses hidden from UI';
