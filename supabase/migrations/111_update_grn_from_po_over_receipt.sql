-- Migration 111: Update create_grn_from_po to Record Over-Receipt Tracking (Story 05.13)
-- Purpose: Enhance GRN creation to record over_receipt_flag and over_receipt_percentage
-- Phase: GREEN

-- Update the create_grn_from_po function to include over_receipt columns
CREATE OR REPLACE FUNCTION create_grn_from_po(
  p_org_id UUID,
  p_user_id UUID,
  p_po_id UUID,
  p_warehouse_id UUID,
  p_location_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_items grn_item_input[] DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grn_id UUID;
  v_grn_number TEXT;
  v_po RECORD;
  v_settings RECORD;
  v_item grn_item_input;
  v_po_line RECORD;
  v_lp_id UUID;
  v_lp_number TEXT;
  v_grn_item_id UUID;
  v_item_location_id UUID;
  v_qa_status TEXT;
  v_total_qty DECIMAL(15,4) := 0;
  v_total_items INTEGER := 0;
  v_lps_created INTEGER := 0;
  v_result JSONB;
  v_items_json JSONB := '[]'::jsonb;
  v_warnings JSONB := '[]'::jsonb;
  v_new_po_status TEXT;
  v_over_receipt_qty DECIMAL(15,4);
  v_over_receipt_pct DECIMAL(5,2);
  v_is_over_receipt BOOLEAN;
BEGIN
  -- =========================================================================
  -- 1. Validate PO exists and is receivable
  -- =========================================================================
  SELECT
    po.id,
    po.po_number,
    po.status,
    po.supplier_id,
    po.warehouse_id
  INTO v_po
  FROM purchase_orders po
  WHERE po.id = p_po_id
    AND po.org_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_po.status NOT IN ('approved', 'confirmed', 'partial') THEN
    RAISE EXCEPTION 'Cannot receive from PO with status: %', v_po.status USING ERRCODE = 'P0001';
  END IF;

  -- =========================================================================
  -- 2. Get warehouse settings
  -- =========================================================================
  SELECT
    COALESCE(ws.allow_over_receipt, false) as allow_over_receipt,
    COALESCE(ws.over_receipt_tolerance_pct, 0) as over_receipt_tolerance_pct,
    COALESCE(ws.require_batch_on_receipt, false) as require_batch_on_receipt,
    COALESCE(ws.require_expiry_on_receipt, false) as require_expiry_on_receipt,
    COALESCE(ws.require_qa_on_receipt, true) as require_qa_on_receipt,
    COALESCE(ws.default_qa_status, 'pending') as default_qa_status
  INTO v_settings
  FROM warehouse_settings ws
  WHERE ws.org_id = p_org_id;

  IF NOT FOUND THEN
    -- Use defaults
    v_settings := ROW(false, 0, false, false, true, 'pending');
  END IF;

  -- Set QA status based on settings
  v_qa_status := CASE
    WHEN v_settings.require_qa_on_receipt THEN v_settings.default_qa_status
    ELSE 'passed'
  END;

  -- =========================================================================
  -- 3. Generate GRN number and create GRN header
  -- =========================================================================
  v_grn_number := generate_grn_number(p_org_id);

  INSERT INTO grns (
    org_id,
    grn_number,
    source_type,
    po_id,
    supplier_id,
    warehouse_id,
    location_id,
    receipt_date,
    status,
    notes,
    created_by,
    received_by
  ) VALUES (
    p_org_id,
    v_grn_number,
    'po',
    p_po_id,
    v_po.supplier_id,
    p_warehouse_id,
    p_location_id,
    NOW(),
    'completed',
    p_notes,
    p_user_id,
    p_user_id
  )
  RETURNING id INTO v_grn_id;

  -- =========================================================================
  -- 4. Process each item
  -- =========================================================================
  FOREACH v_item IN ARRAY p_items
  LOOP
    -- Get PO line details
    SELECT
      pol.id,
      pol.product_id,
      pol.quantity,
      pol.received_qty,
      pol.uom,
      p.name as product_name
    INTO v_po_line
    FROM purchase_order_lines pol
    JOIN products p ON p.id = pol.product_id
    WHERE pol.id = v_item.po_line_id
      AND pol.po_id = p_po_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PO line not found: %', v_item.po_line_id USING ERRCODE = 'P0002';
    END IF;

    -- Validate batch if required
    IF v_settings.require_batch_on_receipt AND v_item.batch_number IS NULL THEN
      RAISE EXCEPTION 'Batch number required for receipt' USING ERRCODE = 'P0001';
    END IF;

    -- Validate expiry if required
    IF v_settings.require_expiry_on_receipt AND v_item.expiry_date IS NULL THEN
      RAISE EXCEPTION 'Expiry date required for receipt' USING ERRCODE = 'P0001';
    END IF;

    -- Calculate over-receipt metrics
    v_over_receipt_qty := (COALESCE(v_po_line.received_qty, 0) + v_item.received_qty) - v_po_line.quantity;
    v_is_over_receipt := v_over_receipt_qty > 0;

    IF v_po_line.quantity > 0 THEN
      v_over_receipt_pct := (v_over_receipt_qty / v_po_line.quantity) * 100;
    ELSE
      v_over_receipt_pct := 0;
    END IF;

    -- Validate over-receipt
    IF v_is_over_receipt THEN
      IF NOT v_settings.allow_over_receipt THEN
        RAISE EXCEPTION 'Over-receipt not allowed. Ordered: %, Already received: %, Attempting: %',
          v_po_line.quantity, COALESCE(v_po_line.received_qty, 0), v_item.received_qty
          USING ERRCODE = 'P0001';
      ELSIF v_over_receipt_pct > v_settings.over_receipt_tolerance_pct THEN
        RAISE EXCEPTION 'Over-receipt exceeds tolerance. Max allowed: % (tolerance: %), Attempting: %',
          v_po_line.quantity * (1 + v_settings.over_receipt_tolerance_pct / 100),
          v_settings.over_receipt_tolerance_pct,
          COALESCE(v_po_line.received_qty, 0) + v_item.received_qty
          USING ERRCODE = 'P0001';
      ELSE
        -- Add over-receipt warning
        v_warnings := v_warnings || jsonb_build_object(
          'po_line_id', v_item.po_line_id,
          'ordered_qty', v_po_line.quantity,
          'total_received', COALESCE(v_po_line.received_qty, 0) + v_item.received_qty,
          'over_receipt_pct', v_over_receipt_pct
        );
      END IF;
    END IF;

    -- Determine location (override or default)
    v_item_location_id := COALESCE(v_item.location_id, p_location_id);

    -- Generate LP number
    v_lp_number := generate_lp_number(p_org_id);

    -- Create License Plate
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
      po_number,
      created_by
    ) VALUES (
      p_org_id,
      v_lp_number,
      v_po_line.product_id,
      v_item.received_qty,
      v_po_line.uom,
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
      v_po.po_number,
      p_user_id
    )
    RETURNING id INTO v_lp_id;

    v_lps_created := v_lps_created + 1;

    -- Create GRN item with over-receipt tracking (Story 05.13)
    INSERT INTO grn_items (
      grn_id,
      product_id,
      po_line_id,
      ordered_qty,
      received_qty,
      uom,
      batch_number,
      supplier_batch_number,
      expiry_date,
      manufacture_date,
      lp_id,
      location_id,
      qa_status,
      over_receipt_flag,
      over_receipt_percentage,
      notes
    ) VALUES (
      v_grn_id,
      v_po_line.product_id,
      v_item.po_line_id,
      v_po_line.quantity,
      v_item.received_qty,
      v_po_line.uom,
      v_item.batch_number,
      v_item.supplier_batch_number,
      v_item.expiry_date,
      v_item.manufacture_date,
      v_lp_id,
      v_item_location_id,
      v_qa_status,
      v_is_over_receipt,
      v_over_receipt_pct,
      v_item.notes
    )
    RETURNING id INTO v_grn_item_id;

    v_total_items := v_total_items + 1;
    v_total_qty := v_total_qty + v_item.received_qty;

    -- Update PO line received_qty
    UPDATE purchase_order_lines
    SET received_qty = COALESCE(received_qty, 0) + v_item.received_qty,
        updated_at = NOW()
    WHERE id = v_item.po_line_id;

    -- Add item to result JSON
    v_items_json := v_items_json || jsonb_build_object(
      'id', v_grn_item_id,
      'product_id', v_po_line.product_id,
      'product_name', v_po_line.product_name,
      'ordered_qty', v_po_line.quantity,
      'received_qty', v_item.received_qty,
      'uom', v_po_line.uom,
      'lp_id', v_lp_id,
      'lp_number', v_lp_number,
      'batch_number', v_item.batch_number,
      'expiry_date', v_item.expiry_date,
      'location_id', v_item_location_id,
      'qa_status', v_qa_status,
      'over_receipt_flag', v_is_over_receipt,
      'over_receipt_percentage', v_over_receipt_pct
    );
  END LOOP;

  -- =========================================================================
  -- 5. Update GRN totals
  -- =========================================================================
  UPDATE grns
  SET total_items = v_total_items,
      total_qty = v_total_qty
  WHERE id = v_grn_id;

  -- =========================================================================
  -- 6. Update PO status based on receipt completion
  -- =========================================================================
  -- Check if all lines are fully received
  SELECT
    CASE
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE COALESCE(received_qty, 0) >= quantity)
      THEN 'closed'
      ELSE 'partial'
    END
  INTO v_new_po_status
  FROM purchase_order_lines
  WHERE po_id = p_po_id;

  UPDATE purchase_orders
  SET status = v_new_po_status,
      updated_at = NOW()
  WHERE id = p_po_id
    AND status != 'closed'; -- Don't update if already closed

  -- =========================================================================
  -- 7. Build and return result
  -- =========================================================================
  v_result := jsonb_build_object(
    'grn', jsonb_build_object(
      'id', v_grn_id,
      'grn_number', v_grn_number,
      'source_type', 'po',
      'po_id', p_po_id,
      'supplier_id', v_po.supplier_id,
      'receipt_date', NOW(),
      'warehouse_id', p_warehouse_id,
      'location_id', p_location_id,
      'status', 'completed',
      'notes', p_notes,
      'created_at', NOW(),
      'received_by', p_user_id,
      'total_items', v_total_items,
      'total_qty', v_total_qty
    ),
    'items', v_items_json,
    'po_status', v_new_po_status,
    'over_receipt_warnings', v_warnings,
    'lps_created', v_lps_created
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION create_grn_from_po IS 'Creates GRN with LPs from Purchase Order atomically. Records over-receipt tracking (Story 05.11, 05.13)';
