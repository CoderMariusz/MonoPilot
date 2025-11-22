-- Migration 003: Create warehouses table with RLS
-- Story: 1.5 Warehouse Configuration (prerequisite for 1.6 Locations)
-- Story: 1.5 Warehouse Configuration
-- Date: 2025-11-21

-- ============================================================================
-- CREATE WAREHOUSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic Data
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  address TEXT,

  -- Default locations (nullable initially, updated after locations created)
  -- Note: Foreign key constraints for default locations will be added in migration 004
  -- after the locations table is created to avoid circular dependency issues
  default_receiving_location_id UUID,
  default_shipping_location_id UUID,
  transit_location_id UUID,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT warehouses_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT warehouses_code_format_check CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT warehouses_code_length_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT warehouses_name_length_check CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_warehouses_org_id ON public.warehouses(org_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON public.warehouses(org_id, code);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON public.warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_org_active ON public.warehouses(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_default_receiving ON public.warehouses(default_receiving_location_id) WHERE default_receiving_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_default_shipping ON public.warehouses(default_shipping_location_id) WHERE default_shipping_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_transit ON public.warehouses(transit_location_id) WHERE transit_location_id IS NOT NULL;

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
-- Trigger to call function on UPDATE (function already created in migration 000)
CREATE TRIGGER warehouses_updated_at_trigger
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
-- Grant permissions to authenticated users (RLS enforces org isolation)
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
COMMENT ON TABLE public.warehouses IS 'Warehouse configuration with default locations (Story 1.5)';
COMMENT ON COLUMN public.warehouses.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.warehouses.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.warehouses.code IS 'Unique warehouse code per org (uppercase alphanumeric + hyphens, e.g., WH-01)';
COMMENT ON COLUMN public.warehouses.name IS 'Warehouse display name (1-100 chars)';
COMMENT ON COLUMN public.warehouses.address IS 'Physical address (optional)';
COMMENT ON COLUMN public.warehouses.default_receiving_location_id IS 'FK to locations - default location for PO receiving (nullable initially, set after locations created)';
COMMENT ON COLUMN public.warehouses.default_shipping_location_id IS 'FK to locations - default location for SO shipping (nullable initially)';
COMMENT ON COLUMN public.warehouses.transit_location_id IS 'FK to locations - temporary storage during moves (nullable initially)';
COMMENT ON COLUMN public.warehouses.is_active IS 'Active status (default true, soft disable via is_active = false)';
COMMENT ON COLUMN public.warehouses.created_by IS 'FK to users - user who created the warehouse';
COMMENT ON COLUMN public.warehouses.updated_by IS 'FK to users - user who last updated the warehouse';

-- ============================================================================
-- NOTE: Circular Dependency Resolution
-- ============================================================================
--
-- The default_*_location_id columns reference the locations table (Story 1.6),
-- but locations also reference warehouses via warehouse_id FK.
--
-- Resolution flow (3-step setup):
-- 1. Create warehouse with default_*_location_id = NULL
-- 2. Create locations with warehouse_id FK
-- 3. Update warehouse to set default_*_location_id
--
-- Foreign key constraints for default locations will be added in migration 004
-- after the locations table is created to avoid circular dependency issues.
-- ============================================================================
