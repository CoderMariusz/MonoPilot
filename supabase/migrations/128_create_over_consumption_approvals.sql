-- Migration 128: Create over_consumption_approvals table
-- Story 04.6e: Over-Consumption Control
-- Tracks approval requests when material consumption exceeds BOM requirements

-- ============================================
-- 1. Create over_consumption_approvals table
-- ============================================
CREATE TABLE IF NOT EXISTS public.over_consumption_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  wo_material_id UUID NOT NULL REFERENCES wo_materials(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Quantity tracking
  requested_qty DECIMAL(15,4) NOT NULL,
  current_consumed_qty DECIMAL(15,4) NOT NULL,
  required_qty DECIMAL(15,4) NOT NULL,
  total_after_qty DECIMAL(15,4) NOT NULL,
  over_consumption_qty DECIMAL(15,4) NOT NULL,
  variance_percent DECIMAL(8,2) NOT NULL,

  -- Request info
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status and decision
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  approval_reason TEXT,
  rejection_reason TEXT,

  -- Linked consumption (after approval)
  consumption_id UUID REFERENCES wo_material_consumptions(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Create Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_over_consumption_approvals_org_status
  ON over_consumption_approvals(org_id, status);

CREATE INDEX IF NOT EXISTS idx_over_consumption_approvals_wo
  ON over_consumption_approvals(wo_id, status);

CREATE INDEX IF NOT EXISTS idx_over_consumption_approvals_pending
  ON over_consumption_approvals(org_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_over_consumption_approvals_material
  ON over_consumption_approvals(wo_material_id);

CREATE INDEX IF NOT EXISTS idx_over_consumption_approvals_requested_by
  ON over_consumption_approvals(requested_by);

-- ============================================
-- 3. Enable RLS
-- ============================================
ALTER TABLE over_consumption_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies
-- ============================================
-- SELECT: All users in org can view approvals
CREATE POLICY "over_consumption_approvals_select"
  ON over_consumption_approvals FOR SELECT
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- INSERT: Any production user can request approval
CREATE POLICY "over_consumption_approvals_insert"
  ON over_consumption_approvals FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND requested_by = auth.uid()
  );

-- UPDATE: Only Manager/Admin can approve/reject
CREATE POLICY "over_consumption_approvals_update"
  ON over_consumption_approvals FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- ============================================
-- 5. Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_over_consumption_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_over_consumption_approvals_updated_at ON over_consumption_approvals;
CREATE TRIGGER trigger_over_consumption_approvals_updated_at
  BEFORE UPDATE ON over_consumption_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_over_consumption_approvals_updated_at();

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON TABLE over_consumption_approvals IS 'Over-consumption approval requests (Story 04.6e)';
COMMENT ON COLUMN over_consumption_approvals.requested_qty IS 'Quantity operator is trying to consume';
COMMENT ON COLUMN over_consumption_approvals.current_consumed_qty IS 'Already consumed quantity at time of request';
COMMENT ON COLUMN over_consumption_approvals.required_qty IS 'BOM required quantity';
COMMENT ON COLUMN over_consumption_approvals.total_after_qty IS 'Total consumed after this request if approved';
COMMENT ON COLUMN over_consumption_approvals.over_consumption_qty IS 'Amount exceeding BOM requirement';
COMMENT ON COLUMN over_consumption_approvals.variance_percent IS 'Variance percentage ((total - required) / required * 100)';
COMMENT ON COLUMN over_consumption_approvals.status IS 'pending, approved, rejected, or cancelled';
COMMENT ON COLUMN over_consumption_approvals.consumption_id IS 'Link to consumption record created after approval';
