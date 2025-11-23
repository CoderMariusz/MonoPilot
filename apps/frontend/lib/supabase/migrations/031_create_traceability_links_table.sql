-- Migration 031: Create Traceability Links Table
-- Epic 2 Batch 2D - Traceability (Story 2.18, 2.19)
-- Records consumption and production relationships between LPs and Work Orders/Transfer Orders

CREATE TABLE IF NOT EXISTS public.traceability_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- LP Reference
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Link Type
  link_type VARCHAR(20) NOT NULL,
  -- Values: consumption (LP consumed in WO), production (LP produced by WO)

  -- Context (must have exactly one: WO or TO)
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE CASCADE,

  -- Transaction Details
  quantity DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Location (at time of transaction)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT traceability_links_type_check CHECK (
    link_type IN ('consumption', 'production')
  ),
  CONSTRAINT traceability_links_quantity_positive CHECK (
    quantity > 0
  ),
  CONSTRAINT traceability_links_wo_or_to CHECK (
    (work_order_id IS NOT NULL AND transfer_order_id IS NULL) OR
    (work_order_id IS NULL AND transfer_order_id IS NOT NULL)
  )
);

-- Indexes for Performance
CREATE INDEX idx_traceability_links_lp ON traceability_links(lp_id);
CREATE INDEX idx_traceability_links_wo ON traceability_links(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_traceability_links_to ON traceability_links(transfer_order_id) WHERE transfer_order_id IS NOT NULL;
CREATE INDEX idx_traceability_links_date ON traceability_links(transaction_date);
CREATE INDEX idx_traceability_links_type ON traceability_links(link_type);

-- Composite index for common queries
CREATE INDEX idx_traceability_links_lp_type ON traceability_links(lp_id, link_type);

-- RLS Policies
ALTER TABLE traceability_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view traceability links via license_plates join
CREATE POLICY "Users can view traceability links in their org"
  ON traceability_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = traceability_links.lp_id
        AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- INSERT: Warehouse/Production/Technical/Admin can create links
CREATE POLICY "Authorized users can create traceability links"
  ON traceability_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM license_plates lp
      WHERE lp.id = traceability_links.lp_id
        AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
    AND (auth.jwt() ->> 'role') IN ('warehouse', 'production', 'technical', 'admin', 'qc_manager')
  );

-- UPDATE/DELETE: Not allowed (immutable audit trail)
-- Traceability links are permanent once created for compliance

-- Comments
COMMENT ON TABLE traceability_links IS 'Traceability links between LPs and WO/TO for consumption and production tracking. Immutable audit trail.';
COMMENT ON COLUMN traceability_links.link_type IS 'Type: consumption (LP used in WO), production (LP created by WO)';
COMMENT ON CONSTRAINT traceability_links_wo_or_to ON traceability_links IS 'Each link must reference exactly one: work_order_id OR transfer_order_id';
