-- Migration 051: Add RPC functions for Transfer Order ship/receive actions
-- Purpose: Implement markShipped and markReceived with status transitions and audit
-- Date: 2025-11-08

-- =============================================
-- 1. RPC FUNCTIONS FOR SHIP/RECEIVE ACTIONS
-- =============================================

-- Function: Mark Transfer Order as Shipped
-- Transition: submitted → in_transit
CREATE OR REPLACE FUNCTION mark_transfer_shipped(
  p_to_id INTEGER,
  p_actual_ship_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS to_header
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_to to_header;
BEGIN
  -- Lock and validate
  SELECT * INTO v_to FROM to_header WHERE id = p_to_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order not found';
  END IF;

  IF v_to.status != 'submitted' THEN
    RAISE EXCEPTION 'Can only mark as shipped from submitted status (current: %)', v_to.status;
  END IF;

  -- Update status and actual_ship_date
  UPDATE to_header
  SET 
    status = 'in_transit',
    actual_ship_date = p_actual_ship_date,
    updated_at = NOW()
  WHERE id = p_to_id
  RETURNING * INTO v_to;

  -- Audit log
  INSERT INTO audit_log (entity, entity_id, action, before, after, actor_id, created_at)
  VALUES (
    'to_header',
    p_to_id,
    'mark_shipped',
    jsonb_build_object('status', 'submitted'),
    jsonb_build_object('status', 'in_transit', 'actual_ship_date', p_actual_ship_date),
    p_user_id,
    NOW()
  );

  RETURN v_to;
END $$;

-- Function: Mark Transfer Order as Received
-- Transition: in_transit → received
CREATE OR REPLACE FUNCTION mark_transfer_received(
  p_to_id INTEGER,
  p_actual_receive_date TIMESTAMPTZ,
  p_line_updates JSONB, -- [{line_id, qty_moved, lp_id?, batch?}]
  p_user_id UUID
)
RETURNS to_header
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_to to_header;
  v_line JSONB;
  v_qty_planned DECIMAL(12,4);
  v_qty_moved DECIMAL(12,4);
BEGIN
  -- Lock and validate
  SELECT * INTO v_to FROM to_header WHERE id = p_to_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order not found';
  END IF;

  IF v_to.status != 'in_transit' THEN
    RAISE EXCEPTION 'Can only mark as received from in_transit status (current: %)', v_to.status;
  END IF;

  -- Update line items with qty_moved, lp_id, batch
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_line_updates)
  LOOP
    -- Validate qty_moved <= qty_planned
    SELECT qty_planned INTO v_qty_planned 
    FROM to_line 
    WHERE id = (v_line->>'line_id')::INTEGER AND to_id = p_to_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Line item % not found', (v_line->>'line_id')::INTEGER;
    END IF;
    
    v_qty_moved := COALESCE((v_line->>'qty_moved')::DECIMAL(12,4), 0);
    
    IF v_qty_moved > v_qty_planned THEN
      RAISE EXCEPTION 'Quantity moved (%) cannot exceed planned quantity (%) for line %', 
        v_qty_moved, v_qty_planned, (v_line->>'line_id')::INTEGER;
    END IF;
    
    -- Update line
    UPDATE to_line
    SET
      qty_moved = v_qty_moved,
      lp_id = CASE WHEN v_line ? 'lp_id' THEN (v_line->>'lp_id')::INTEGER ELSE lp_id END,
      batch = CASE WHEN v_line ? 'batch' THEN (v_line->>'batch')::VARCHAR ELSE batch END,
      updated_at = NOW()
    WHERE id = (v_line->>'line_id')::INTEGER AND to_id = p_to_id;
  END LOOP;

  -- Update header status and actual_receive_date
  UPDATE to_header
  SET 
    status = 'received',
    actual_receive_date = p_actual_receive_date,
    updated_at = NOW()
  WHERE id = p_to_id
  RETURNING * INTO v_to;

  -- Audit log
  INSERT INTO audit_log (entity, entity_id, action, before, after, actor_id, created_at)
  VALUES (
    'to_header',
    p_to_id,
    'mark_received',
    jsonb_build_object('status', 'in_transit'),
    jsonb_build_object('status', 'received', 'actual_receive_date', p_actual_receive_date, 'line_updates', p_line_updates),
    p_user_id,
    NOW()
  );

  RETURN v_to;
END $$;

-- =============================================
-- 2. UPDATE RLS POLICIES FOR WAREHOUSE/PLANNER SHIP/RECEIVE
-- =============================================

-- Allow Warehouse and Planner roles to update TO header for ship/receive
-- This extends the existing RLS policies from migration 035
CREATE POLICY "warehouse_planner_to_ship_receive" ON to_header
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Warehouse', 'Planner', 'Admin')
    )
    AND status IN ('submitted', 'in_transit') -- Can only update when submitted or in_transit
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Warehouse', 'Planner', 'Admin')
    )
    AND status IN ('in_transit', 'received') -- Can only transition to these statuses
  );

-- Allow Warehouse and Planner roles to update TO lines for qty_moved/lp/batch
CREATE POLICY "warehouse_planner_to_line_receive" ON to_line
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Warehouse', 'Planner', 'Admin')
    )
    AND EXISTS (
      SELECT 1 FROM to_header 
      WHERE to_header.id = to_line.to_id 
      AND to_header.status IN ('in_transit', 'received')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Warehouse', 'Planner', 'Admin')
    )
  );

-- =============================================
-- 3. GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION mark_transfer_shipped(INTEGER, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_transfer_received(INTEGER, TIMESTAMPTZ, JSONB, UUID) TO authenticated;

-- =============================================
-- 4. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION mark_transfer_shipped IS 'Mark TO as shipped (submitted → in_transit) with actual_ship_date. Requires Warehouse, Planner, or Admin role.';
COMMENT ON FUNCTION mark_transfer_received IS 'Mark TO as received (in_transit → received) with actual_receive_date and line qty_moved. Requires Warehouse, Planner, or Admin role. Validates qty_moved <= qty_planned.';

COMMENT ON POLICY "warehouse_planner_to_ship_receive" ON to_header IS 'Allow Warehouse/Planner to update TO status during ship/receive operations';
COMMENT ON POLICY "warehouse_planner_to_line_receive" ON to_line IS 'Allow Warehouse/Planner to update line qty_moved, lp_id, and batch during receive';

-- =============================================
-- 5. MIGRATION DOWN (for rollback)
-- =============================================

-- To rollback this migration, run:
-- DROP POLICY IF EXISTS "warehouse_planner_to_ship_receive" ON to_header;
-- DROP POLICY IF EXISTS "warehouse_planner_to_line_receive" ON to_line;
-- DROP FUNCTION IF EXISTS mark_transfer_shipped(INTEGER, TIMESTAMPTZ, UUID);
-- DROP FUNCTION IF EXISTS mark_transfer_received(INTEGER, TIMESTAMPTZ, JSONB, UUID);

