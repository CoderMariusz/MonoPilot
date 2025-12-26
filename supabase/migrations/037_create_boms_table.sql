-- Migration: Create boms table
-- Story: 02.4 - Bills of Materials Management
-- Purpose: BOM table with versioning, date validity, and date overlap prevention
-- RLS: Per-organization isolation using ADR-013 pattern

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
COMMENT ON COLUMN boms.version IS 'Version number, unique per org_id + product_id';
COMMENT ON COLUMN boms.bom_type IS 'BOM type: standard (default), engineering, costing';
COMMENT ON COLUMN boms.effective_from IS 'Start date when BOM becomes valid (inclusive)';
COMMENT ON COLUMN boms.effective_to IS 'End date when BOM expires (inclusive), NULL = ongoing';
COMMENT ON COLUMN boms.status IS 'draft (editable), active (in use), phased_out (transitioning), inactive (disabled)';
COMMENT ON COLUMN boms.output_qty IS 'Quantity produced per batch, must be > 0';
COMMENT ON COLUMN boms.output_uom IS 'Unit of measure for output';
COMMENT ON COLUMN boms.units_per_box IS 'Packaging: units per box';
COMMENT ON COLUMN boms.boxes_per_pallet IS 'Packaging: boxes per pallet';
