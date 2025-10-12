-- Phase 14: RPC Functions for Business Logic
-- This migration creates RPC functions for cancel operations and pricing logic

-- Price resolver from BOM
CREATE OR REPLACE FUNCTION get_material_std_cost(p_material_id INTEGER)
RETURNS NUMERIC
LANGUAGE SQL
AS $$
  WITH latest_bom AS (
    SELECT b.id
    FROM boms b
    WHERE b.status = 'active'
    ORDER BY COALESCE(b.effective_from, NOW()) DESC
    LIMIT 1
  )
  SELECT COALESCE(bi.unit_cost_std, 0)
  FROM bom_items bi
  JOIN latest_bom lb ON lb.id = bi.bom_id
  WHERE bi.material_id = p_material_id
  LIMIT 1
$$;

-- Cancel work order with rules
CREATE OR REPLACE FUNCTION cancel_work_order(p_wo_id INTEGER, p_user_id INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS work_orders
LANGUAGE plpgsql
AS $$
DECLARE
  v_old work_orders;
BEGIN
  SELECT * INTO v_old FROM work_orders WHERE id = p_wo_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Work order not found'; END IF;

  IF v_old.status IN ('in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel work order in status %', v_old.status;
  END IF;

  UPDATE work_orders
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = p_wo_id
  RETURNING * INTO v_old;

  INSERT INTO audit_events(entity_type, entity_id, event_type, old_value, new_value, user_id, reason, timestamp)
  VALUES ('work_orders', p_wo_id, 'cancel', 
          jsonb_build_object('status', v_old.status), 
          jsonb_build_object('status', 'cancelled'), 
          p_user_id, p_reason, NOW());

  RETURN v_old;
END $$;

-- Cancel purchase order with rules
CREATE OR REPLACE FUNCTION cancel_purchase_order(p_po_id INTEGER, p_user_id INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS purchase_orders
LANGUAGE plpgsql
AS $$
DECLARE
  v_old purchase_orders;
BEGIN
  SELECT * INTO v_old FROM purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;

  IF v_old.status IN ('closed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel purchase order in status %', v_old.status;
  END IF;

  UPDATE purchase_orders
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = p_po_id
  RETURNING * INTO v_old;

  INSERT INTO audit_events(entity_type, entity_id, event_type, old_value, new_value, user_id, reason, timestamp)
  VALUES ('purchase_orders', p_po_id, 'cancel', 
          jsonb_build_object('status', v_old.status), 
          jsonb_build_object('status', 'cancelled'), 
          p_user_id, p_reason, NOW());

  RETURN v_old;
END $$;

-- Cancel transfer order with rules
CREATE OR REPLACE FUNCTION cancel_transfer_order(p_to_id INTEGER, p_user_id INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS transfer_orders
LANGUAGE plpgsql
AS $$
DECLARE
  v_old transfer_orders;
BEGIN
  SELECT * INTO v_old FROM transfer_orders WHERE id = p_to_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer order not found'; END IF;

  IF v_old.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel transfer order in status %', v_old.status;
  END IF;

  UPDATE transfer_orders
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = p_to_id
  RETURNING * INTO v_old;

  INSERT INTO audit_events(entity_type, entity_id, event_type, old_value, new_value, user_id, reason, timestamp)
  VALUES ('transfer_orders', p_to_id, 'cancel', 
          jsonb_build_object('status', v_old.status), 
          jsonb_build_object('status', 'cancelled'), 
          p_user_id, p_reason, NOW());

  RETURN v_old;
END $$;

-- Set PO buyer snapshot (for audit trail)
CREATE OR REPLACE FUNCTION set_po_buyer_snapshot(p_po_id INTEGER, p_buyer_id INTEGER, p_buyer_name VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE purchase_orders
     SET buyer_id = p_buyer_id, buyer_name = p_buyer_name, updated_at = NOW()
   WHERE id = p_po_id;
END $$;
