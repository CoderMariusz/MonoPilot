-- =============================================================================
-- Migration 103: Create LP Transactions Table
-- Story: 05.6 - LP Detail + History
-- Purpose: Audit trail for LP status changes (block/unblock, status, qa, etc.)
-- =============================================================================

-- =============================================================================
-- LP Transactions Table - Audit Trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS lp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Transaction Details
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('status_change', 'qa_change', 'block', 'unblock', 'quantity_change', 'location_change')),
  old_value TEXT,
  new_value TEXT,
  reason TEXT,

  -- Reference to source document
  reference_type TEXT
    CHECK (reference_type IS NULL OR reference_type IN ('wo', 'grn', 'stock_move', 'manual')),
  reference_id UUID,

  -- Audit
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_lp_transactions_lp_id ON lp_transactions(lp_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_org_id ON lp_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_type ON lp_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_lp_transactions_performed_at ON lp_transactions(performed_at DESC);

-- Reference lookups
CREATE INDEX IF NOT EXISTS idx_lp_transactions_reference ON lp_transactions(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE lp_transactions ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "lp_transactions_select_org" ON lp_transactions
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "lp_transactions_insert_org" ON lp_transactions
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- No update policy - transactions are immutable audit records
-- No delete policy - transactions should never be deleted
