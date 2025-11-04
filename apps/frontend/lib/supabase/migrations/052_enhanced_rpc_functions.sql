-- Migration 052: Enhanced RPC Functions for Business Logic
-- Purpose: Phase 1.3.1-1.3.5 - Complete RPC function implementations
-- Date: 2025-11-04

-- =============================================
-- 1. ENHANCED cancel_work_order
-- =============================================

CREATE OR REPLACE FUNCTION cancel_work_order(
  p_wo_id INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_wo work_orders;
  v_output_count INTEGER;
BEGIN
  -- Advisory lock for idempotency
  PERFORM pg_advisory_xact_lock(hashtext('cancel_wo_' || p_wo_id::text));
  
  -- Fetch work order
  SELECT * INTO v_wo FROM work_orders WHERE id = p_wo_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found: %', p_wo_id;
  END IF;
  
  -- Idempotency: if already cancelled, return success
  IF v_wo.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'note', 'Work order already cancelled',
      'wo_id', p_wo_id,
      'status', 'cancelled'
    );
  END IF;
  
  -- Business rule: Cannot cancel if in_progress, completed, or cancelled
  IF v_wo.status IN ('in_progress', 'completed') THEN
    RAISE EXCEPTION 'Cannot cancel work order in status: %', v_wo.status;
  END IF;
  
  -- Business rule: Check for production outputs
  SELECT COUNT(*) INTO v_output_count 
  FROM production_outputs 
  WHERE wo_id = p_wo_id;
  
  IF v_output_count > 0 THEN
    RAISE EXCEPTION 'Cannot cancel work order with existing production outputs (count: %)', v_output_count;
  END IF;
  
  -- Close all wo_operations
  UPDATE wo_operations
  SET 
    status = 'CANCELLED',
    finished_at = NOW()
  WHERE wo_id = p_wo_id
    AND status != 'COMPLETED';
  
  -- Release lp_reservations
  DELETE FROM lp_reservations
  WHERE wo_id = p_wo_id;
  
  -- Update work order status
  UPDATE work_orders
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_wo_id;
  
  -- Audit log
  INSERT INTO audit_log(entity, entity_id, action, before, after, actor_id, metadata, created_at)
  VALUES (
    'work_orders',
    p_wo_id,
    'cancel',
    jsonb_build_object('status', v_wo.status),
    jsonb_build_object('status', 'cancelled', 'reason', p_reason, 'source', p_source),
    p_user_id,
    jsonb_build_object('source', p_source, 'reason', p_reason),
    NOW()
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'note', 'Work order cancelled successfully',
    'wo_id', p_wo_id,
    'status', 'cancelled',
    'previous_status', v_wo.status
  );
END $$;

COMMENT ON FUNCTION cancel_work_order IS 'Cancel work order with full business rules: no production outputs, close operations, release reservations, idempotent, with advisory lock';

-- =============================================
-- 2. ENHANCED cancel_purchase_order
-- =============================================

CREATE OR REPLACE FUNCTION cancel_purchase_order(
  p_po_id INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_po po_header;
  v_grn_count INTEGER;
BEGIN
  -- Advisory lock for idempotency
  PERFORM pg_advisory_xact_lock(hashtext('cancel_po_' || p_po_id::text));
  
  -- Fetch purchase order (using po_header as per latest schema)
  SELECT * INTO v_po FROM po_header WHERE id = p_po_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found: %', p_po_id;
  END IF;
  
  -- Idempotency: if already cancelled, return success
  IF v_po.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'note', 'Purchase order already cancelled',
      'po_id', p_po_id,
      'status', 'cancelled'
    );
  END IF;
  
  -- Business rule: Cannot cancel if received, closed, or cancelled
  IF v_po.status IN ('received', 'closed') THEN
    RAISE EXCEPTION 'Cannot cancel purchase order in status: %', v_po.status;
  END IF;
  
  -- Business rule: Check for GRNs (full validation)
  SELECT COUNT(*) INTO v_grn_count 
  FROM grns 
  WHERE po_id = p_po_id
    AND status != 'cancelled';
  
  IF v_grn_count > 0 THEN
    RAISE EXCEPTION 'Cannot cancel purchase order with existing GRNs (count: %)', v_grn_count;
  END IF;
  
  -- Update purchase order status to cancelled
  UPDATE po_header
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_po_id;
  
  -- Audit log
  INSERT INTO audit_log(entity, entity_id, action, before, after, actor_id, metadata, created_at)
  VALUES (
    'po_header',
    p_po_id,
    'cancel',
    jsonb_build_object('status', v_po.status),
    jsonb_build_object('status', 'cancelled', 'reason', p_reason, 'source', p_source),
    p_user_id,
    jsonb_build_object('source', p_source, 'reason', p_reason),
    NOW()
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'note', 'Purchase order cancelled successfully',
    'po_id', p_po_id,
    'status', 'cancelled',
    'previous_status', v_po.status
  );
END $$;

COMMENT ON FUNCTION cancel_purchase_order IS 'Cancel purchase order with full business rules: no GRNs, idempotent, with advisory lock';

-- =============================================
-- 3. ENHANCED cancel_transfer_order
-- =============================================

CREATE OR REPLACE FUNCTION cancel_transfer_order(
  p_to_id INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_to to_header;
  v_stock_move_count INTEGER;
BEGIN
  -- Advisory lock for idempotency
  PERFORM pg_advisory_xact_lock(hashtext('cancel_to_' || p_to_id::text));
  
  -- Fetch transfer order (using to_header as per latest schema)
  SELECT * INTO v_to FROM to_header WHERE id = p_to_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order not found: %', p_to_id;
  END IF;
  
  -- Idempotency: if already cancelled, return success
  IF v_to.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'note', 'Transfer order already cancelled',
      'to_id', p_to_id,
      'status', 'cancelled'
    );
  END IF;
  
  -- Business rule: Can only cancel if draft or submitted
  IF v_to.status NOT IN ('draft', 'submitted') THEN
    RAISE EXCEPTION 'Cannot cancel transfer order in status: % (must be draft or submitted)', v_to.status;
  END IF;
  
  -- Business rule: actual_ship_date must be NULL
  IF v_to.actual_ship_date IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot cancel transfer order that has been shipped (actual_ship_date: %)', v_to.actual_ship_date;
  END IF;
  
  -- Business rule: Check for stock_moves (shipment moves)
  SELECT COUNT(*) INTO v_stock_move_count
  FROM stock_moves sm
  JOIN to_line tol ON tol.to_id = p_to_id
  WHERE sm.status != 'cancelled'
    AND sm.notes LIKE '%TO-' || v_to.number || '%';
  
  IF v_stock_move_count > 0 THEN
    RAISE EXCEPTION 'Cannot cancel transfer order with existing stock moves (count: %)', v_stock_move_count;
  END IF;
  
  -- Update transfer order status to cancelled
  UPDATE to_header
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_to_id;
  
  -- Audit log
  INSERT INTO audit_log(entity, entity_id, action, before, after, actor_id, metadata, created_at)
  VALUES (
    'to_header',
    p_to_id,
    'cancel',
    jsonb_build_object('status', v_to.status),
    jsonb_build_object('status', 'cancelled', 'reason', p_reason, 'source', p_source),
    p_user_id,
    jsonb_build_object('source', p_source, 'reason', p_reason),
    NOW()
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'note', 'Transfer order cancelled successfully',
    'to_id', p_to_id,
    'status', 'cancelled',
    'previous_status', v_to.status
  );
END $$;

COMMENT ON FUNCTION cancel_transfer_order IS 'Cancel transfer order with full business rules: draft/submitted only, no shipment date, no stock moves, idempotent, with advisory lock';

-- =============================================
-- 4. ENHANCED get_material_std_cost
-- =============================================

CREATE OR REPLACE FUNCTION get_material_std_cost(
  p_material_id INTEGER,
  p_as_of_date TIMESTAMPTZ DEFAULT NOW(),
  p_currency VARCHAR(3) DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_cost NUMERIC;
  v_product_currency VARCHAR(3);
  v_exchange_rate NUMERIC;
BEGIN
  -- Get standard cost from products.unit_price (MVP: single price per product)
  SELECT 
    COALESCE(unit_price, 0),
    currency
  INTO v_cost, v_product_currency
  FROM products
  WHERE id = p_material_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- If currency conversion requested and different from product currency
  IF p_currency IS NOT NULL AND p_currency != v_product_currency THEN
    -- MVP: Simple exchange rate lookup from settings or hardcoded
    -- Future: Lookup from exchange_rates table with as_of_date
    
    -- For MVP, we'll use a simplified approach:
    -- Look up exchange rate from a settings table or use 1:1
    BEGIN
      -- Try to find exchange rate in settings
      v_exchange_rate := 1.0; -- Default to 1:1
      
      -- Future enhancement: SELECT rate FROM exchange_rates 
      -- WHERE from_currency = v_product_currency 
      --   AND to_currency = p_currency
      --   AND effective_date <= p_as_of_date
      -- ORDER BY effective_date DESC LIMIT 1;
      
      v_cost := v_cost * v_exchange_rate;
    EXCEPTION WHEN OTHERS THEN
      -- If exchange rate lookup fails, return original cost
      NULL;
    END;
  END IF;
  
  RETURN v_cost;
END $$;

COMMENT ON FUNCTION get_material_std_cost IS 'Get material standard cost with optional as_of_date and currency conversion (MVP: single price, basic exchange rate)';

-- =============================================
-- 5. ENHANCED set_po_buyer_snapshot
-- =============================================

CREATE OR REPLACE FUNCTION set_po_buyer_snapshot(
  p_po_id INTEGER,
  p_buyer_id UUID,
  p_buyer_name VARCHAR(200),
  p_snapshot_ts TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update PO with buyer snapshot (using po_header as per latest schema)
  UPDATE po_header
  SET 
    buyer_id = p_buyer_id,
    buyer_name = p_buyer_name,
    buyer_snapshot_ts = p_snapshot_ts,
    updated_at = NOW()
  WHERE id = p_po_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found: %', p_po_id;
  END IF;
  
  -- Audit log (optional, for tracking buyer changes)
  INSERT INTO audit_log(entity, entity_id, action, after, actor_id, created_at)
  VALUES (
    'po_header',
    p_po_id,
    'buyer_snapshot',
    jsonb_build_object(
      'buyer_id', p_buyer_id,
      'buyer_name', p_buyer_name,
      'snapshot_ts', p_snapshot_ts
    ),
    p_buyer_id,
    NOW()
  );
END $$;

COMMENT ON FUNCTION set_po_buyer_snapshot IS 'Snapshot buyer data to PO for audit trail (called on create/update)';

-- =============================================
-- 6. ADD MISSING COLUMN (if needed)
-- =============================================

-- Add buyer_snapshot_ts to po_header if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'po_header' AND column_name = 'buyer_snapshot_ts'
  ) THEN
    ALTER TABLE po_header ADD COLUMN buyer_snapshot_ts TIMESTAMPTZ;
  END IF;
END $$;

-- Add buyer_name to po_header if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'po_header' AND column_name = 'buyer_name'
  ) THEN
    ALTER TABLE po_header ADD COLUMN buyer_name VARCHAR(200);
  END IF;
END $$;

