-- Migration 022: Create product_routings table with RLS
-- Story: 2.17 Routing-Product Assignment
-- Date: 2025-11-23
--
-- PREREQUISITE: This migration requires the products table to exist
-- (Should be created in Migration 014 from Batch 2A - Products module)

-- ============================================================================
-- CREATE PRODUCT_ROUTINGS TABLE (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  product_id UUID NOT NULL, -- Will reference products(id) once table is created
  routing_id UUID NOT NULL REFERENCES public.routings(id) ON DELETE CASCADE,

  -- Default Routing Flag
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.users(id),

  -- Constraints
  CONSTRAINT product_routings_unique UNIQUE (product_id, routing_id)
);

-- ============================================================================
-- ADD FOREIGN KEY TO PRODUCTS TABLE (Once products table is created)
-- ============================================================================
--
-- NOTE: This FK constraint will be added in a future migration once products table exists
-- For now, product_id is just a UUID field
--
-- Future migration should run:
-- ALTER TABLE public.product_routings
--   ADD CONSTRAINT product_routings_product_fk
--   FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
--
-- ============================================================================

-- ============================================================================
-- CREATE INDEXES FOR PRODUCT_ROUTINGS
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_routings_product_id ON public.product_routings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_routings_routing_id ON public.product_routings(routing_id);
CREATE INDEX IF NOT EXISTS idx_product_routings_default ON public.product_routings(product_id, is_default) WHERE is_default = true;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR PRODUCT_ROUTINGS
-- ============================================================================

ALTER TABLE public.product_routings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR PRODUCT_ROUTINGS
-- ============================================================================

-- Policy: Users can only see product-routing assignments from their organization
-- Access controlled via routing's org_id (products table org_id check will be added later)
DROP POLICY IF EXISTS product_routings_select_policy ON public.product_routings;
CREATE POLICY product_routings_select_policy ON public.product_routings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin and Technical users can create product-routing assignments
DROP POLICY IF EXISTS product_routings_insert_policy ON public.product_routings;
CREATE POLICY product_routings_insert_policy ON public.product_routings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin and Technical users can update product-routing assignments
DROP POLICY IF EXISTS product_routings_update_policy ON public.product_routings;
CREATE POLICY product_routings_update_policy ON public.product_routings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = product_routings.routing_id
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'technical')
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin users can delete product-routing assignments
DROP POLICY IF EXISTS product_routings_delete_policy ON public.product_routings;
CREATE POLICY product_routings_delete_policy ON public.product_routings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.routings
      WHERE id = product_routings.routing_id
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
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS enforces org isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_routings TO authenticated;
GRANT SELECT ON public.product_routings TO anon;

-- ============================================================================
-- COMMENTS FOR PRODUCT_ROUTINGS
-- ============================================================================

COMMENT ON TABLE public.product_routings IS 'Many-to-many relationship between products and routings (Story 2.17)';
COMMENT ON COLUMN public.product_routings.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.product_routings.product_id IS 'FK to products table (will be added when products table is created)';
COMMENT ON COLUMN public.product_routings.routing_id IS 'FK to routings table (CASCADE on delete)';
COMMENT ON COLUMN public.product_routings.is_default IS 'If true, this is the default routing for this product (only one per product)';
COMMENT ON COLUMN public.product_routings.created_at IS 'Timestamp when assignment was created';
COMMENT ON COLUMN public.product_routings.created_by IS 'FK to users - user who created the assignment';

-- ============================================================================
-- BUSINESS RULE: Default Routing Enforcement (AC-017.3)
-- ============================================================================
--
-- Business Rule: Only one routing can be marked as default per product
-- Defense-in-depth: Application layer validation + database function
--
-- This prevents race conditions where two routings are marked as default for the same product
--
CREATE OR REPLACE FUNCTION validate_default_routing()
RETURNS TRIGGER AS $$
BEGIN
  -- If marking this as default, un-default all other routings for this product
  IF NEW.is_default = true THEN
    UPDATE public.product_routings
    SET is_default = false
    WHERE product_id = NEW.product_id
      AND routing_id != NEW.routing_id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default routing
DROP TRIGGER IF EXISTS product_routings_validate_default ON public.product_routings;
CREATE TRIGGER product_routings_validate_default
  BEFORE INSERT OR UPDATE ON public.product_routings
  FOR EACH ROW
  EXECUTE FUNCTION validate_default_routing();

-- NOTE: Application layer should also validate for better UX (immediate feedback)
-- Database trigger is the final safety net against race conditions
-- ============================================================================

-- ============================================================================
-- BUSINESS RULE: Non-Reusable Routing Constraint (AC-017.2)
-- ============================================================================
--
-- Business Rule: Non-reusable routings can only be assigned to one product
-- This is enforced by application logic, not database constraint
-- (Too complex for a CHECK constraint due to JOIN requirement)
--
-- Application should validate:
-- - Before assigning routing to product, check if routing.is_reusable = false
-- - If false, verify no other product_routings exist for this routing_id
-- - Return error: "This routing is not reusable and is already assigned to another product"
--
-- ============================================================================
