-- =============================================================================
-- Migration 125: Create Stock Adjustments Table + Approval Workflow
-- Story: WH-INV-001 - Stock Adjustment History & Approval Workflow
-- Purpose: Track inventory adjustments with approval workflow for significant changes
-- =============================================================================

-- =============================================================================
-- Stock Adjustments Table - Adjustment Audit Trail with Approval
-- =============================================================================

CREATE TABLE IF NOT EXISTS stock_adjustments (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Adjustment details
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,
  original_qty DECIMAL(15,4) NOT NULL,
  new_qty DECIMAL(15,4) NOT NULL,
  variance DECIMAL(15,4) NOT NULL,
  variance_pct DECIMAL(8,4) NOT NULL,

  -- Reason
  reason_code TEXT NOT NULL CHECK (reason_code IN (
    'damage', 'theft', 'counting_error', 'quality_issue', 'expired', 'other'
  )),
  reason_notes TEXT,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected'
  )),

  -- Audit
  adjusted_by UUID NOT NULL REFERENCES users(id),
  adjustment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Stock move reference (created on approval)
  stock_move_id UUID REFERENCES stock_moves(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_adjustments_org_status ON stock_adjustments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_adjustments_lp ON stock_adjustments(lp_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_date ON stock_adjustments(adjustment_date DESC);
CREATE INDEX IF NOT EXISTS idx_adjustments_adjusted_by ON stock_adjustments(adjusted_by);
CREATE INDEX IF NOT EXISTS idx_adjustments_reason ON stock_adjustments(org_id, reason_code);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "adjustments_select_org" ON stock_adjustments
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "adjustments_insert_org" ON stock_adjustments
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Update: Org isolation (for approval/rejection)
CREATE POLICY "adjustments_update_org" ON stock_adjustments
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation (generally not used, but available)
CREATE POLICY "adjustments_delete_org" ON stock_adjustments
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE stock_adjustments IS 'Stock adjustment history with approval workflow for inventory corrections';
COMMENT ON COLUMN stock_adjustments.variance IS 'Calculated as: new_qty - original_qty (positive = increase, negative = decrease)';
COMMENT ON COLUMN stock_adjustments.variance_pct IS 'Calculated as: (variance / original_qty) * 100';
COMMENT ON COLUMN stock_adjustments.status IS 'Approval status: pending (awaiting approval), approved (applied), rejected (denied)';
COMMENT ON COLUMN stock_adjustments.reason_code IS 'Reason for adjustment: damage, theft, counting_error, quality_issue, expired, other';
COMMENT ON COLUMN stock_adjustments.stock_move_id IS 'Reference to stock_move created when adjustment is approved';
