-- =============================================================================
-- Migration 114: Create Stock Moves Table + RLS Policies
-- Story: 05.16 - Stock Moves CRUD
-- Purpose: Audit trail for all LP movements (transfers, adjustments, receipts, etc.)
-- =============================================================================

-- =============================================================================
-- Stock Moves Table - Movement Audit Trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS stock_moves (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  move_number TEXT NOT NULL,

  -- LP Reference
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,

  -- Move Details
  move_type TEXT NOT NULL CHECK (move_type IN (
    'transfer', 'issue', 'receipt', 'adjustment',
    'return', 'quarantine', 'putaway'
  )),
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  quantity DECIMAL(15,4) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  move_date TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Context
  reason TEXT,
  reason_code TEXT CHECK (reason_code IS NULL OR reason_code IN (
    'damage', 'theft', 'counting_error', 'quality_issue', 'expired', 'other'
  )),

  -- References
  wo_id UUID REFERENCES work_orders(id),
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IS NULL OR reference_type IN (
    'grn', 'to', 'wo', 'adjustment', 'manual'
  )),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  notes TEXT,

  -- Constraints
  CONSTRAINT stock_moves_unique_number UNIQUE(org_id, move_number),
  CONSTRAINT stock_moves_valid_locations CHECK (
    (move_type = 'receipt' AND from_location_id IS NULL AND to_location_id IS NOT NULL) OR
    (move_type = 'issue' AND from_location_id IS NOT NULL AND to_location_id IS NULL) OR
    (move_type = 'adjustment' AND from_location_id IS NULL AND to_location_id IS NULL) OR
    (move_type IN ('transfer', 'return', 'quarantine', 'putaway')
     AND from_location_id IS NOT NULL AND to_location_id IS NOT NULL)
  )
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_stock_moves_lp ON stock_moves(lp_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_date ON stock_moves(move_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_moves_type ON stock_moves(org_id, move_type);
CREATE INDEX IF NOT EXISTS idx_stock_moves_status ON stock_moves(org_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_moves_org ON stock_moves(org_id);

-- Location indexes (partial for non-null values)
CREATE INDEX IF NOT EXISTS idx_stock_moves_from_location ON stock_moves(from_location_id)
  WHERE from_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_moves_to_location ON stock_moves(to_location_id)
  WHERE to_location_id IS NOT NULL;

-- Reference index (partial for non-null values)
CREATE INDEX IF NOT EXISTS idx_stock_moves_reference ON stock_moves(reference_id, reference_type)
  WHERE reference_id IS NOT NULL;

-- Composite index for movement history queries
CREATE INDEX IF NOT EXISTS idx_stock_moves_lp_date ON stock_moves(lp_id, move_date DESC);

-- =============================================================================
-- Stock Move Number Sequence
-- =============================================================================

CREATE TABLE IF NOT EXISTS stock_move_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  year INT NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_move_seq_year_unique UNIQUE(org_id, year)
);

-- =============================================================================
-- Function to Generate Next Stock Move Number
-- Format: SM-YYYY-NNNNN (e.g., SM-2025-00001)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_stock_move_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INT;
  v_next_val BIGINT;
  v_move_number TEXT;
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM NOW());

  -- Upsert sequence and get next value
  INSERT INTO stock_move_sequences (org_id, year, current_value)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET
    current_value = stock_move_sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_next_val;

  -- Format move number
  v_move_number := 'SM-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

  RETURN v_move_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;

-- Select: Org isolation
CREATE POLICY "stock_moves_select_org" ON stock_moves
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Insert: Org isolation
CREATE POLICY "stock_moves_insert_org" ON stock_moves
FOR INSERT TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Update: Org isolation (for cancellation)
CREATE POLICY "stock_moves_update_org" ON stock_moves
FOR UPDATE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Delete: Org isolation (generally not used, but available)
CREATE POLICY "stock_moves_delete_org" ON stock_moves
FOR DELETE TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS for sequence table
ALTER TABLE stock_move_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_move_seq_org" ON stock_move_sequences
FOR ALL TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Execute Stock Move RPC Function (Atomic LP location updates)
-- =============================================================================

CREATE OR REPLACE FUNCTION execute_stock_move(
  p_org_id UUID,
  p_lp_id UUID,
  p_move_type TEXT,
  p_to_location_id UUID DEFAULT NULL,
  p_quantity DECIMAL DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_reason_code TEXT DEFAULT NULL,
  p_wo_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_lp RECORD;
  v_move_number TEXT;
  v_move_id UUID;
  v_move_qty DECIMAL;
BEGIN
  -- 1. Get LP details with lock
  SELECT id, org_id, quantity, location_id, status, qa_status
  INTO v_lp
  FROM license_plates
  WHERE id = p_lp_id AND org_id = p_org_id
  FOR UPDATE;

  IF v_lp IS NULL THEN
    RAISE EXCEPTION 'LP not found';
  END IF;

  -- 2. Validate LP status (skip for receipt - LP just created)
  IF p_move_type != 'receipt' AND v_lp.status NOT IN ('available', 'reserved') THEN
    RAISE EXCEPTION 'LP not available for movement (status: %)', v_lp.status;
  END IF;

  -- 3. Determine quantity
  v_move_qty := COALESCE(p_quantity, v_lp.quantity);

  IF v_move_qty > v_lp.quantity THEN
    RAISE EXCEPTION 'Move quantity exceeds available quantity';
  END IF;

  -- 4. Validate destination location for transfer types
  IF p_move_type IN ('transfer', 'putaway', 'quarantine', 'return') THEN
    IF p_to_location_id IS NULL THEN
      RAISE EXCEPTION 'Destination location required for this move type';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM locations
      WHERE id = p_to_location_id
        AND org_id = p_org_id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Destination location not available';
    END IF;
  END IF;

  -- 5. Generate move number
  v_move_number := generate_stock_move_number(p_org_id);

  -- 6. Create stock_move record
  INSERT INTO stock_moves (
    org_id, move_number, lp_id, move_type,
    from_location_id, to_location_id, quantity,
    status, move_date, reason, reason_code,
    wo_id, reference_id, reference_type, created_by
  )
  VALUES (
    p_org_id,
    v_move_number,
    p_lp_id,
    p_move_type,
    CASE WHEN p_move_type IN ('receipt', 'adjustment') THEN NULL ELSE v_lp.location_id END,
    p_to_location_id,
    v_move_qty,
    'completed',
    NOW(),
    p_reason,
    p_reason_code,
    p_wo_id,
    p_reference_id,
    p_reference_type,
    COALESCE(p_created_by, auth.uid())
  )
  RETURNING id INTO v_move_id;

  -- 7. Update LP location if transfer/putaway/quarantine/return
  IF p_move_type IN ('transfer', 'putaway', 'quarantine', 'return') THEN
    UPDATE license_plates
    SET location_id = p_to_location_id,
        updated_at = NOW()
    WHERE id = p_lp_id;
  END IF;

  -- 8. Update LP status and QA status if quarantine
  IF p_move_type = 'quarantine' THEN
    UPDATE license_plates
    SET qa_status = 'quarantine',
        status = 'blocked',
        updated_at = NOW()
    WHERE id = p_lp_id;
  END IF;

  -- 9. Update LP quantity if adjustment
  IF p_move_type = 'adjustment' THEN
    -- v_move_qty is the delta (can be negative)
    UPDATE license_plates
    SET quantity = quantity + v_move_qty,
        updated_at = NOW()
    WHERE id = p_lp_id;
  END IF;

  RETURN v_move_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_stock_move TO authenticated;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE stock_moves IS 'Audit trail for all LP movements in the warehouse';
COMMENT ON COLUMN stock_moves.move_type IS 'Type of movement: transfer, issue, receipt, adjustment, return, quarantine, putaway';
COMMENT ON COLUMN stock_moves.status IS 'Move status: completed or cancelled';
COMMENT ON COLUMN stock_moves.reason_code IS 'Reason code for adjustments: damage, theft, counting_error, quality_issue, expired, other';
COMMENT ON COLUMN stock_moves.reference_type IS 'Reference type: grn, to, wo, adjustment, manual';
COMMENT ON FUNCTION generate_stock_move_number IS 'Generates next stock move number in format SM-YYYY-NNNNN';
COMMENT ON FUNCTION execute_stock_move IS 'Atomically executes a stock move with LP location updates';
