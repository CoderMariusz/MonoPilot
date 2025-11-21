-- Migration 004: Create locations table with RLS, indexes, and constraints
-- Story: 1.6 Location Management
-- Date: 2025-11-21

-- ============================================================================
-- CREATE LOCATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,

  -- Location type (6 types)
  type VARCHAR(20) NOT NULL,

  -- Optional fields with enable toggles
  zone VARCHAR(100),
  zone_enabled BOOLEAN NOT NULL DEFAULT false,
  capacity DECIMAL(10,2), -- Supports fractional units
  capacity_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Auto-generated barcode (format: LOC-{warehouse_code}-{sequence})
  barcode VARCHAR(100) NOT NULL,

  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT locations_org_warehouse_code_unique UNIQUE (org_id, warehouse_id, code),
  CONSTRAINT locations_barcode_unique UNIQUE (barcode),

  -- Type validation (6 location types)
  CONSTRAINT locations_type_check CHECK (type IN (
    'receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine'
  )),

  -- Zone validation: if zone_enabled = true, zone must not be null
  CONSTRAINT locations_zone_check CHECK (
    (zone_enabled = false) OR (zone_enabled = true AND zone IS NOT NULL)
  ),

  -- Capacity validation: if capacity_enabled = true, capacity must be > 0
  CONSTRAINT locations_capacity_check CHECK (
    (capacity_enabled = false) OR (capacity_enabled = true AND capacity > 0)
  )
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- CRITICAL INDEX: Prevents 30s query on 500+ locations (Tech Spec Gap 4)
-- This is the MOST IMPORTANT index for performance
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON public.locations(warehouse_id);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON public.locations(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(org_id, type);
CREATE INDEX IF NOT EXISTS idx_locations_barcode ON public.locations(barcode);
CREATE INDEX IF NOT EXISTS idx_locations_code ON public.locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_org_active ON public.locations(org_id, is_active);

-- Composite index for warehouse + type filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_locations_warehouse_type ON public.locations(warehouse_id, type);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Policy: Users can only see locations from their own organization
CREATE POLICY locations_select_policy ON public.locations
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can insert locations in their organization
CREATE POLICY locations_insert_policy ON public.locations
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

-- Policy: Admin can update locations in their organization
CREATE POLICY locations_update_policy ON public.locations
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

-- Policy: Admin can delete locations in their organization
-- Note: ON DELETE RESTRICT on warehouses.default_*_location_id will prevent deletion if used as default
CREATE POLICY locations_delete_policy ON public.locations
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
CREATE TRIGGER locations_updated_at_trigger
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT SELECT ON public.locations TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.locations IS 'Location hierarchy within warehouses with auto-generated barcodes and QR code support';
COMMENT ON COLUMN public.locations.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.locations.warehouse_id IS 'Warehouse FK - locations belong to warehouses';
COMMENT ON COLUMN public.locations.code IS 'Location code unique within warehouse (e.g., LOC-A01, RECV-01)';
COMMENT ON COLUMN public.locations.type IS '6 location types: receiving, production, storage, shipping, transit, quarantine';
COMMENT ON COLUMN public.locations.zone IS 'Optional zone/area within location (enabled by zone_enabled toggle)';
COMMENT ON COLUMN public.locations.zone_enabled IS 'Toggle to enable zone tracking - if true, zone is required';
COMMENT ON COLUMN public.locations.capacity IS 'Optional storage capacity (enabled by capacity_enabled toggle)';
COMMENT ON COLUMN public.locations.capacity_enabled IS 'Toggle to enable capacity tracking - if true, capacity must be > 0';
COMMENT ON COLUMN public.locations.barcode IS 'Auto-generated barcode: LOC-{warehouse_code}-{sequence}, globally unique';
COMMENT ON COLUMN public.locations.is_active IS 'Soft delete flag - inactive locations hidden from UI';
