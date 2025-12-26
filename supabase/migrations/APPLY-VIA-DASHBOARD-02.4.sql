-- ============================================================================
-- Story 02.4 - BOMs Table + Date Overlap Trigger
-- Apply via Supabase Dashboard SQL Editor if CLI is unavailable
-- Date: 2025-12-26
-- ============================================================================

-- ============================================================================
-- MIGRATION 037: Create BOMs Table
-- ============================================================================

-- Create boms table
CREATE TABLE IF NOT EXISTS boms (
  -- Core fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1,
  bom_type TEXT DEFAULT 'standard',
  routing_id UUID, -- Will reference routings(id) when routings table exists

  -- Date validity
  effective_from DATE NOT NULL,
  effective_to DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'phased_out', 'inactive')),

  -- Output
  output_qty DECIMAL(15,6) NOT NULL CHECK (output_qty > 0),
  output_uom TEXT NOT NULL,

  -- Packaging (optional)
  units_per_box INTEGER,
  boxes_per_pallet INTEGER,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT uq_boms_org_product_version UNIQUE(org_id, product_id, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boms_org_product ON boms(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_boms_product ON boms(product_id);
CREATE INDEX IF NOT EXISTS idx_boms_effective ON boms(product_id, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_boms_status ON boms(org_id, status);
CREATE INDEX IF NOT EXISTS idx_boms_routing_id ON boms(routing_id) WHERE routing_id IS NOT NULL;

-- Enable RLS
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Users can only see BOMs in their organization
CREATE POLICY boms_org_isolation_select
  ON boms
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: INSERT - Users can only create BOMs in their organization
CREATE POLICY boms_org_isolation_insert
  ON boms
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: UPDATE - Users can only update BOMs in their organization
CREATE POLICY boms_org_isolation_update
  ON boms
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: DELETE - Users can only delete BOMs in their organization
CREATE POLICY boms_org_isolation_delete
  ON boms
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Comments
COMMENT ON TABLE boms IS 'Bills of Materials with versioning and date validity (Story 02.4)';

-- ============================================================================
-- MIGRATION 038: Date Overlap Prevention Trigger
-- ============================================================================

-- Function: check_bom_date_overlap
CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND daterange(effective_from, effective_to, '[]') &&
          daterange(NEW.effective_from, NEW.effective_to, '[]')
  ) THEN
    RAISE EXCEPTION 'Date range overlaps with existing BOM for this product';
  END IF;

  -- Check for multiple BOMs with NULL effective_to (ongoing)
  IF NEW.effective_to IS NULL AND EXISTS (
    SELECT 1 FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'Only one BOM can have no end date per product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_check_bom_date_overlap ON boms;
CREATE TRIGGER trigger_check_bom_date_overlap
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_date_overlap();

-- Function: update_boms_updated_at
CREATE OR REPLACE FUNCTION update_boms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS trigger_update_boms_updated_at ON boms;
CREATE TRIGGER trigger_update_boms_updated_at
  BEFORE UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION update_boms_updated_at();

-- Comments
COMMENT ON FUNCTION check_bom_date_overlap() IS 'Prevents overlapping date ranges and multiple NULL effective_to for same product (AC-18 to AC-20)';
COMMENT ON FUNCTION update_boms_updated_at() IS 'Auto-updates updated_at timestamp on row update';

-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT
  'boms table exists' AS check,
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'boms') AS result
UNION ALL
SELECT
  'check_bom_date_overlap trigger exists',
  EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_check_bom_date_overlap')
UNION ALL
SELECT
  'update_boms_updated_at trigger exists',
  EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_update_boms_updated_at')
UNION ALL
SELECT
  'RLS enabled',
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'boms')
UNION ALL
SELECT
  'SELECT policy exists',
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boms' AND policyname = 'boms_org_isolation_select');
