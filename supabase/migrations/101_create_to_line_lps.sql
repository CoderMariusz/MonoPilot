-- =============================================================================
-- Migration 101: Create to_line_lps Junction Table
-- Story: 03.9b - TO License Plate Pre-selection
-- Purpose: License Plate assignments to Transfer Order lines for pre-selection
-- =============================================================================

-- =============================================================================
-- TO Line LP Assignments Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS to_line_lps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_line_id          UUID NOT NULL REFERENCES transfer_order_lines(id) ON DELETE CASCADE,
  lp_id               UUID NOT NULL REFERENCES license_plates(id),
  quantity            DECIMAL(15,4) NOT NULL CHECK (quantity > 0),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID REFERENCES users(id),

  -- Same LP cannot be assigned twice to same line
  CONSTRAINT to_line_lps_to_line_lp_unique UNIQUE(to_line_id, lp_id)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_to_line_lps_to_line_id ON to_line_lps(to_line_id);
CREATE INDEX IF NOT EXISTS idx_to_line_lps_lp_id ON to_line_lps(lp_id);

-- =============================================================================
-- Enable Row Level Security
-- =============================================================================

ALTER TABLE to_line_lps ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies - Org isolation via TO line -> TO -> org_id chain
-- =============================================================================

-- SELECT: All authenticated users in org can read
CREATE POLICY to_line_lps_select ON to_line_lps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transfer_order_lines tol
      JOIN transfer_orders t ON tol.to_id = t.id
      WHERE tol.id = to_line_lps.to_line_id
        AND t.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: Only owner, admin, warehouse_manager can create
CREATE POLICY to_line_lps_insert ON to_line_lps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfer_order_lines tol
      JOIN transfer_orders t ON tol.to_id = t.id
      WHERE tol.id = to_line_lps.to_line_id
        AND t.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- UPDATE: Only owner, admin, warehouse_manager can update
CREATE POLICY to_line_lps_update ON to_line_lps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transfer_order_lines tol
      JOIN transfer_orders t ON tol.to_id = t.id
      WHERE tol.id = to_line_lps.to_line_id
        AND t.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- DELETE: Only owner, admin, warehouse_manager can delete
CREATE POLICY to_line_lps_delete ON to_line_lps
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transfer_order_lines tol
      JOIN transfer_orders t ON tol.to_id = t.id
      WHERE tol.id = to_line_lps.to_line_id
        AND t.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- =============================================================================
-- Grants
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON to_line_lps TO authenticated;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE to_line_lps IS 'License Plate assignments to Transfer Order lines for pre-selection (Story 03.9b)';
COMMENT ON COLUMN to_line_lps.to_line_id IS 'FK to transfer_order_lines (ON DELETE CASCADE)';
COMMENT ON COLUMN to_line_lps.lp_id IS 'FK to license_plates';
COMMENT ON COLUMN to_line_lps.quantity IS 'Quantity to transfer from this LP (must be > 0, <= LP available_qty)';
