-- Migration 112: Add to_line_id to grn_items and create GRN from TO function (Story 05.12)
-- Purpose: Enable GRN creation from Transfer Orders with LP generation
-- Phase: GREEN
--
-- Changes:
-- 1. Add to_line_id FK column to grn_items table
-- 2. Create create_grn_from_to() RPC function for atomic TO receipt
-- 3. Add partial/received status support for TOs

-- =============================================================================
-- Add to_line_id column to grn_items
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'grn_items' AND column_name = 'to_line_id') THEN
    ALTER TABLE grn_items ADD COLUMN to_line_id UUID REFERENCES transfer_order_lines(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index on to_line_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_grn_items_to_line_id ON grn_items(to_line_id) WHERE to_line_id IS NOT NULL;

COMMENT ON COLUMN grn_items.to_line_id IS 'FK to transfer_order_lines for TO receipts (Story 05.12)';

-- =============================================================================
-- Update transfer_orders status constraint to include 'partial'
-- =============================================================================
-- Note: The constraint already includes 'received' from 063_create_transfer_orders.sql
-- Check if we need to add 'partial' status
DO $$
BEGIN
  -- Drop old constraint and add new one with 'partial' status
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'transfer_orders_status_check'
             AND table_name = 'transfer_orders') THEN
    ALTER TABLE transfer_orders DROP CONSTRAINT transfer_orders_status_check;
  END IF;

  -- Add updated constraint with partial status
  ALTER TABLE transfer_orders ADD CONSTRAINT transfer_orders_status_check
    CHECK (status IN ('draft', 'planned', 'shipped', 'partial', 'received', 'closed', 'cancelled'));
END $$;

-- =============================================================================
-- Type: TO GRN Item Input
-- =============================================================================
DROP TYPE IF EXISTS to_grn_item_input CASCADE;
CREATE TYPE to_grn_item_input AS (
  to_line_id UUID,
  received_qty DECIMAL(15,4),
  variance_reason TEXT,
  batch_number TEXT,
  supplier_batch_number TEXT,
  expiry_date DATE,
  manufacture_date DATE,
  location_id UUID,
  notes TEXT
);

-- =============================================================================
-- Function: Create GRN from TO (Atomic Transaction)
-- =============================================================================
CREATE OR REPLACE FUNCTION create_grn_from_to(
  p_org_id UUID,
  p_user_id UUID,
  p_to_id UUID,
  p_warehouse_id UUID,
  p_location_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_items to_grn_item_input[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_to RECORD;
  v_grn_number TEXT;
  v_grn_id UUID;
  v_item to_grn_item_input;
  v_to_line RECORD;
  v_product RECORD;
  v_lp_number TEXT;
  v_lp_id UUID;
  v_grn_item_id UUID;
  v_item_location_id UUID;
  v_total_items INTEGER := 0;
  v_lps_created INTEGER := 0;
  v_new_to_status TEXT;
  v_settings RECORD;
  v_qa_status TEXT;
  v_result JSONB;
  v_items_json JSONB := '[]'::JSONB;
  v_variances JSONB := '[]'::JSONB;
  v_remaining_qty DECIMAL(15,4);
  v_variance_qty DECIMAL(15,4);
BEGIN
  -- =========================================================================
  -- 1. Validate TO exists and is receivable
  -- =========================================================================
  SELECT
    t.*,
    fw.name as from_warehouse_name,
    tw.name as to_warehouse_name
  INTO v_to
  FROM transfer_orders t
  LEFT JOIN warehouses fw ON fw.id = t.from_warehouse_id
  LEFT JOIN warehouses tw ON tw.id = t.to_warehouse_id
  WHERE t.id = p_to_id
    AND t.org_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order not found' USING ERRCODE = 'P0002';
  END IF;

  -- Validate TO status is receivable
  IF v_to.status NOT IN ('shipped', 'partial') THEN
    RAISE EXCEPTION 'Cannot receive from TO with status ''%''. TO must be shipped or partial.', v_to.status
      USING ERRCODE = 'P0001';
  END IF;

  -- Validate receipt at correct warehouse (destination)
  IF p_warehouse_id != v_to.to_warehouse_id THEN
    RAISE EXCEPTION 'Receipt must occur at destination warehouse. Expected: %, Got: %',
      v_to.to_warehouse_id, p_warehouse_id
      USING ERRCODE = 'P0001';
  END IF;

  -- =========================================================================
  -- 2. Get warehouse settings
  -- =========================================================================
  SELECT
    COALESCE(ws.require_qa_on_receipt, true) as require_qa_on_receipt,
    COALESCE(ws.default_qa_status, 'pending') as default_qa_status,
    COALESCE(ws.require_batch_on_receipt, false) as require_batch_on_receipt,
    COALESCE(ws.require_expiry_on_receipt, false) as require_expiry_on_receipt
  INTO v_settings
  FROM warehouse_settings ws
  WHERE ws.org_id = p_org_id;

  -- Use defaults if no settings found
  IF NOT FOUND THEN
    v_settings := ROW(true, 'pending', false, false);
  END IF;

  -- Determine QA status
  IF v_settings.require_qa_on_receipt THEN
    v_qa_status := v_settings.default_qa_status;
  ELSE
    v_qa_status := 'passed';
  END IF;

  -- =========================================================================
  -- 3. Generate GRN number
  -- =========================================================================
  v_grn_number := generate_grn_number(p_org_id);

  -- =========================================================================
  -- 4. Create GRN header
  -- =========================================================================
  INSERT INTO grns (
    org_id,
    grn_number,
    source_type,
    to_id,
    warehouse_id,
    location_id,
    status,
    receipt_date,
    received_by,
    created_by,
    notes
  ) VALUES (
    p_org_id,
    v_grn_number,
    'to',
    p_to_id,
    p_warehouse_id,
    p_location_id,
    'completed',
    NOW(),
    p_user_id,
    p_user_id,
    p_notes
  )
  RETURNING id INTO v_grn_id;

  -- =========================================================================
  -- 5. Process each item
  -- =========================================================================
  FOREACH v_item IN ARRAY p_items
  LOOP
    -- Get TO line details
    SELECT
      tol.*,
      p.name as product_name,
      p.code as product_code,
      p.uom as product_uom
    INTO v_to_line
    FROM transfer_order_lines tol
    JOIN products p ON p.id = tol.product_id
    WHERE tol.id = v_item.to_line_id
      AND tol.to_id = p_to_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'TO line not found: %', v_item.to_line_id USING ERRCODE = 'P0002';
    END IF;

    -- Calculate remaining quantity
    v_remaining_qty := COALESCE(v_to_line.shipped_qty, 0) - COALESCE(v_to_line.received_qty, 0);

    -- Calculate variance (difference from remaining)
    v_variance_qty := v_item.received_qty - v_remaining_qty;

    -- Validate cannot receive more than shipped total
    IF (COALESCE(v_to_line.received_qty, 0) + v_item.received_qty) > v_to_line.shipped_qty THEN
      RAISE EXCEPTION 'Cannot receive more than shipped quantity. Shipped: %, Already received: %, Attempting: %',
        v_to_line.shipped_qty, COALESCE(v_to_line.received_qty, 0), v_item.received_qty
        USING ERRCODE = 'P0001';
    END IF;

    -- Validate batch if required
    IF v_settings.require_batch_on_receipt AND v_item.batch_number IS NULL THEN
      RAISE EXCEPTION 'Batch number required for receipt' USING ERRCODE = 'P0001';
    END IF;

    -- Validate expiry if required
    IF v_settings.require_expiry_on_receipt AND v_item.expiry_date IS NULL THEN
      RAISE EXCEPTION 'Expiry date required for receipt' USING ERRCODE = 'P0001';
    END IF;

    -- Determine location (override or default)
    v_item_location_id := COALESCE(v_item.location_id, p_location_id);

    -- Generate LP number
    v_lp_number := generate_lp_number(p_org_id);

    -- Create License Plate at destination warehouse
    INSERT INTO license_plates (
      org_id,
      lp_number,
      product_id,
      quantity,
      uom,
      location_id,
      warehouse_id,
      status,
      qa_status,
      batch_number,
      supplier_batch_number,
      expiry_date,
      manufacture_date,
      source,
      grn_id,
      created_by
    ) VALUES (
      p_org_id,
      v_lp_number,
      v_to_line.product_id,
      v_item.received_qty,
      COALESCE(v_to_line.uom, v_to_line.product_uom, 'EA'),
      v_item_location_id,
      p_warehouse_id,
      'available',
      v_qa_status,
      v_item.batch_number,
      v_item.supplier_batch_number,
      v_item.expiry_date,
      v_item.manufacture_date,
      'receipt',
      v_grn_id,
      p_user_id
    )
    RETURNING id INTO v_lp_id;

    v_lps_created := v_lps_created + 1;

    -- Create GRN item
    INSERT INTO grn_items (
      grn_id,
      product_id,
      to_line_id,
      received_qty,
      batch_number,
      supplier_batch_number,
      expiry_date,
      manufacture_date,
      lp_id,
      location_id,
      notes
    ) VALUES (
      v_grn_id,
      v_to_line.product_id,
      v_item.to_line_id,
      v_item.received_qty,
      v_item.batch_number,
      v_item.supplier_batch_number,
      v_item.expiry_date,
      v_item.manufacture_date,
      v_lp_id,
      v_item_location_id,
      COALESCE(v_item.notes, '') || CASE WHEN v_item.variance_reason IS NOT NULL THEN ' | Variance: ' || v_item.variance_reason ELSE '' END
    )
    RETURNING id INTO v_grn_item_id;

    v_total_items := v_total_items + 1;

    -- Update TO line received_qty
    UPDATE transfer_order_lines
    SET received_qty = COALESCE(received_qty, 0) + v_item.received_qty,
        updated_at = NOW()
    WHERE id = v_item.to_line_id;

    -- Track variance if received differs from remaining
    IF v_variance_qty != 0 THEN
      v_variances := v_variances || jsonb_build_object(
        'to_line_id', v_item.to_line_id,
        'product_name', v_to_line.product_name,
        'shipped_qty', v_to_line.shipped_qty,
        'received_qty', v_item.received_qty,
        'variance_qty', v_variance_qty,
        'variance_pct', CASE WHEN v_to_line.shipped_qty > 0
          THEN (v_variance_qty / v_to_line.shipped_qty) * 100
          ELSE 0 END,
        'variance_reason', v_item.variance_reason
      );
    END IF;

    -- Add item to result JSON
    v_items_json := v_items_json || jsonb_build_object(
      'id', v_grn_item_id,
      'product_id', v_to_line.product_id,
      'product_name', v_to_line.product_name,
      'shipped_qty', v_to_line.shipped_qty,
      'received_qty', v_item.received_qty,
      'variance_qty', v_variance_qty,
      'variance_reason', v_item.variance_reason,
      'uom', COALESCE(v_to_line.uom, v_to_line.product_uom, 'EA'),
      'lp_id', v_lp_id,
      'lp_number', v_lp_number,
      'batch_number', v_item.batch_number,
      'expiry_date', v_item.expiry_date,
      'location_id', v_item_location_id,
      'qa_status', v_qa_status
    );
  END LOOP;

  -- =========================================================================
  -- 6. Update TO status based on receipt completion
  -- =========================================================================
  -- Check if all lines are fully received
  SELECT
    CASE
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE COALESCE(received_qty, 0) >= COALESCE(shipped_qty, 0) AND shipped_qty > 0)
      THEN 'received'
      ELSE 'partial'
    END
  INTO v_new_to_status
  FROM transfer_order_lines
  WHERE to_id = p_to_id;

  UPDATE transfer_orders
  SET status = v_new_to_status,
      actual_receive_date = CASE WHEN v_new_to_status = 'received' THEN CURRENT_DATE ELSE actual_receive_date END,
      received_by = CASE WHEN v_new_to_status = 'received' THEN p_user_id ELSE received_by END,
      updated_at = NOW()
  WHERE id = p_to_id;

  -- =========================================================================
  -- 7. Build and return result
  -- =========================================================================
  v_result := jsonb_build_object(
    'grn', jsonb_build_object(
      'id', v_grn_id,
      'grn_number', v_grn_number,
      'source_type', 'to',
      'to_id', p_to_id,
      'from_warehouse_id', v_to.from_warehouse_id,
      'to_warehouse_id', v_to.to_warehouse_id,
      'receipt_date', NOW(),
      'warehouse_id', p_warehouse_id,
      'location_id', p_location_id,
      'status', 'completed',
      'notes', p_notes,
      'created_at', NOW(),
      'received_by', p_user_id
    ),
    'items', v_items_json,
    'to_status', v_new_to_status,
    'variances', v_variances,
    'lps_created', v_lps_created
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION create_grn_from_to IS 'Creates GRN with LPs from Transfer Order atomically (Story 05.12)';

-- =============================================================================
-- Grant execute permissions
-- =============================================================================
GRANT EXECUTE ON FUNCTION create_grn_from_to(UUID, UUID, UUID, UUID, UUID, TEXT, to_grn_item_input[]) TO authenticated;
