-- Migration 030: Create LP Genealogy Table
-- Epic 2 Batch 2D - Traceability (Story 2.18, 2.19)
-- Records parent-child relationships between License Plates for forward/backward tracing

CREATE TABLE IF NOT EXISTS public.lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  child_lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Relationship Type
  relationship_type VARCHAR(20) NOT NULL,
  -- Values: split (1→many), combine (many→1), transform (WO production)

  -- Context
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE SET NULL,

  -- Quantities (for audit trail)
  quantity_from_parent DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT lp_genealogy_type_check CHECK (
    relationship_type IN ('split', 'combine', 'transform')
  ),
  CONSTRAINT lp_genealogy_no_self_reference CHECK (
    parent_lp_id != child_lp_id
  ),
  CONSTRAINT lp_genealogy_quantity_positive CHECK (
    quantity_from_parent > 0
  )
);

-- Indexes for Performance
-- These indexes are critical for recursive CTE queries
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_lp_genealogy_to ON lp_genealogy(transfer_order_id) WHERE transfer_order_id IS NOT NULL;

-- Composite index for genealogy traversal
CREATE INDEX idx_lp_genealogy_composite ON lp_genealogy(parent_lp_id, child_lp_id, relationship_type);

-- RLS Policies
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view genealogy via license_plates join
CREATE POLICY "Users can view genealogy in their org"
  ON lp_genealogy FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = lp_genealogy.parent_lp_id
        AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- INSERT: Technical/Admin/QC Manager can create genealogy records
CREATE POLICY "Technical/Admin/QC can create genealogy"
  ON lp_genealogy FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = lp_genealogy.parent_lp_id
        AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse', 'production')
  );

-- UPDATE/DELETE: Not allowed (immutable audit trail)
-- Genealogy records are permanent once created for traceability integrity

-- Comments
COMMENT ON TABLE lp_genealogy IS 'License Plate genealogy graph for forward and backward traceability. Immutable audit trail.';
COMMENT ON COLUMN lp_genealogy.relationship_type IS 'Type: split (1→many), combine (many→1), transform (WO production)';
COMMENT ON COLUMN lp_genealogy.quantity_from_parent IS 'Quantity transferred from parent to child LP';
COMMENT ON INDEX idx_lp_genealogy_parent IS 'Critical for forward trace queries (parent → children)';
COMMENT ON INDEX idx_lp_genealogy_child IS 'Critical for backward trace queries (child → parents)';
