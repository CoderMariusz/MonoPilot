-- Migration: 112 - Create Over-Receipt Approvals Table
-- Story: 05.15 - Over-Receipt Handling (Advanced)
-- Phase: P3 (GREEN - Backend Implementation)
-- Description: Creates over_receipt_approvals table with approval workflow for over-tolerance receipts

-- =============================================================================
-- 1. CREATE OVER_RECEIPT_APPROVALS TABLE
-- =============================================================================
CREATE TABLE over_receipt_approvals (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- PO Reference
  po_id UUID NOT NULL REFERENCES purchase_orders(id),
  po_line_id UUID NOT NULL REFERENCES purchase_order_lines(id),
  product_id UUID NOT NULL REFERENCES products(id),

  -- Quantities
  ordered_qty DECIMAL(15,4) NOT NULL,
  already_received_qty DECIMAL(15,4) NOT NULL DEFAULT 0,
  requesting_qty DECIMAL(15,4) NOT NULL,
  total_after_receipt DECIMAL(15,4) NOT NULL,  -- already_received + requesting

  -- Over-Receipt Calculation
  over_receipt_pct NUMERIC(5,2) NOT NULL,
  tolerance_pct NUMERIC(5,2) NOT NULL,           -- Tolerance at time of request

  -- Request Details
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Audit
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT over_receipt_qty_positive CHECK (requesting_qty > 0),
  CONSTRAINT total_exceeds_ordered CHECK (total_after_receipt > ordered_qty),
  CONSTRAINT over_receipt_pct_positive CHECK (over_receipt_pct > 0),
  CONSTRAINT tolerance_pct_valid CHECK (tolerance_pct >= 0 AND tolerance_pct <= 100)
);

-- =============================================================================
-- 2. ADD OVER_RECEIPT_APPROVAL_ID TO GRN_ITEMS
-- =============================================================================
ALTER TABLE grn_items
ADD COLUMN IF NOT EXISTS over_receipt_approval_id UUID REFERENCES over_receipt_approvals(id);

-- =============================================================================
-- 3. CREATE INDEXES
-- =============================================================================
CREATE INDEX idx_over_receipt_org_status ON over_receipt_approvals(org_id, status);
CREATE INDEX idx_over_receipt_po_line ON over_receipt_approvals(po_line_id);
CREATE INDEX idx_over_receipt_requested_at ON over_receipt_approvals(requested_at DESC);
CREATE INDEX idx_over_receipt_requested_by ON over_receipt_approvals(requested_by);
CREATE INDEX idx_over_receipt_po_id ON over_receipt_approvals(po_id);
CREATE INDEX idx_over_receipt_product_id ON over_receipt_approvals(product_id);

-- Index for finding pending approvals by PO line (used in GRN validation)
CREATE UNIQUE INDEX idx_over_receipt_pending_unique
  ON over_receipt_approvals(po_line_id)
  WHERE status = 'pending';

-- =============================================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_over_receipt_approvals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_over_receipt_approvals_updated_at
BEFORE UPDATE ON over_receipt_approvals
FOR EACH ROW
EXECUTE FUNCTION update_over_receipt_approvals_timestamp();

-- =============================================================================
-- 5. ENABLE RLS
-- =============================================================================
ALTER TABLE over_receipt_approvals ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CREATE RLS POLICIES
-- =============================================================================

-- Policy: SELECT - Org isolation
CREATE POLICY "over_receipt_select_org" ON over_receipt_approvals
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Policy: INSERT - Org isolation + requester must be current user
CREATE POLICY "over_receipt_insert_org" ON over_receipt_approvals
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND requested_by = auth.uid()
);

-- Policy: UPDATE - Org isolation + manager only for approve/reject
CREATE POLICY "over_receipt_update_org" ON over_receipt_approvals
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (
  -- Only managers can update (approve/reject)
  (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
  IN ('SUPER_ADMIN', 'ADMIN', 'WH_MANAGER')
);

-- Policy: DELETE - Not allowed (approvals are immutable for audit)
-- No DELETE policy - prevents accidental deletion

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================
GRANT SELECT, INSERT, UPDATE ON over_receipt_approvals TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE over_receipt_approvals IS 'Stores approval requests for over-receipt situations that exceed warehouse tolerance settings';
COMMENT ON COLUMN over_receipt_approvals.status IS 'Approval status: pending (awaiting review), approved (manager approved), rejected (manager rejected)';
COMMENT ON COLUMN over_receipt_approvals.tolerance_pct IS 'Snapshot of warehouse tolerance_pct at time of request for audit purposes';
COMMENT ON COLUMN over_receipt_approvals.over_receipt_pct IS 'Calculated percentage over the ordered quantity';

-- =============================================================================
-- ROLLBACK (for testing)
-- =============================================================================
-- DROP TRIGGER IF EXISTS tr_over_receipt_approvals_updated_at ON over_receipt_approvals;
-- DROP FUNCTION IF EXISTS update_over_receipt_approvals_timestamp();
-- ALTER TABLE grn_items DROP COLUMN IF EXISTS over_receipt_approval_id;
-- DROP TABLE IF EXISTS over_receipt_approvals CASCADE;
