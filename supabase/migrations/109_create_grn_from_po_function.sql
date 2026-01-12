-- Migration 109: Create GRN from PO Function (Story 05.11)
-- Purpose: Atomic function to create GRN + items + LPs from Purchase Order
-- Phase: GREEN
--
-- This function performs all operations in a single transaction:
-- 1. Validates PO status (approved/confirmed/partial only)
-- 2. Generates GRN number
-- 3. Creates GRN header
-- 4. Creates GRN items with LP references
-- 5. Creates License Plates for each item
-- 6. Updates PO line received_qty
-- 7. Updates PO status based on receipt completion

-- =============================================================================
-- GRN Number Sequence Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS grn_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, year)
);

-- Enable RLS
ALTER TABLE grn_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY grn_seq_org ON grn_number_sequences
FOR ALL TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Function: Generate GRN Number
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_grn_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER;
  v_next_val BIGINT;
  v_grn_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Upsert sequence and get next value
  INSERT INTO grn_number_sequences (org_id, year, current_value)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET
    current_value = grn_number_sequences.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_next_val;

  -- Format GRN number as GRN-YYYY-NNNNN
  v_grn_number := 'GRN-' || v_year::TEXT || '-' || LPAD(v_next_val::TEXT, 5, '0');

  RETURN v_grn_number;
END;
$$;

COMMENT ON FUNCTION generate_grn_number IS 'Generates next GRN number as GRN-YYYY-NNNNN for org/year (Story 05.11)';

-- =============================================================================
-- Type: GRN Item Input
-- =============================================================================
DROP TYPE IF EXISTS grn_item_input CASCADE;
CREATE TYPE grn_item_input AS (
  po_line_id UUID,
  received_qty DECIMAL(15,4),
  batch_number TEXT,
  supplier_batch_number TEXT,
  expiry_date DATE,
  manufacture_date DATE,
  location_id UUID,
  notes TEXT
);

-- =============================================================================
-- Type: GRN Creation Result
-- =============================================================================
DROP TYPE IF EXISTS grn_creation_result CASCADE;
CREATE TYPE grn_creation_result AS (
  grn_id UUID,
  grn_number TEXT,
  grn_status TEXT,
  po_status TEXT,
  items_count INTEGER,
  lps_created INTEGER
);

-- =============================================================================
-- Function: Create GRN from PO (Atomic Transaction)
-- =============================================================================
CREATE OR REPLACE FUNCTION create_grn_from_po(
  p_org_id UUID,
  p_user_id UUID,
  p_po_id UUID,
  p_warehouse_id UUID,
  p_location_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_items grn_item_input[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po RECORD;
  v_grn_number TEXT;
  v_grn_id UUID;
  v_item grn_item_input;
  v_po_line RECORD;
  v_product RECORD;
  v_lp_number TEXT;
  v_lp_id UUID;
  v_grn_item_id UUID;
  v_item_location_id UUID;
  v_total_items INTEGER := 0;
  v_lps_created INTEGER := 0;
  v_new_po_status TEXT;
  v_settings RECORD;
  v_qa_status TEXT;
  v_result JSONB;
  v_items_json JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_over_receipt_qty DECIMAL(15,4);
  v_over_receipt_pct DECIMAL(5,2);
BEGIN
  -- =========================================================================
  -- 1. Validate PO exists and is receivable
  -- =========================================================================
  SELECT po.*, s.name as supplier_name
  INTO v_po
  FROM purchase_orders po
  LEFT JOIN suppliers s ON s.id = po.supplier_id
  WHERE po.id = p_po_id
    AND po.org_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_po.status NOT IN ('approved', 'confirmed', 'partial') THEN
    RAISE EXCEPTION 'Cannot receive from PO with status ''%''. PO must be approved, confirmed, or partial.', v_po.status
      USING ERRCODE = 'P0001';
  END IF;

  -- =========================================================================
  -- 2. Get warehouse settings
  -- =========================================================================
  SELECT
    COALESCE(ws.require_qa_on_receipt, true) as require_qa_on_receipt,
    COALESCE(ws.default_qa_status, 'pending') as default_qa_status,
    COALESCE(ws.allow_over_receipt, false) as allow_over_receipt,
    COALESCE(ws.over_receipt_tolerance_pct, 0) as over_receipt_tolerance_pct,
    COALESCE(ws.require_batch_on_receipt, false) as require_batch_on_receipt,
    COALESCE(ws.require_expiry_on_receipt, false) as require_expiry_on_receipt
  INTO v_settings
  FROM warehouse_settings ws
  WHERE ws.org_id = p_org_id;

  -- Use defaults if no settings found
  IF NOT FOUND THEN
    v_settings := ROW(true, 'pending', false, 0, false, false);
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
    po_id,
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
    'po',
    p_po_id,
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
    -- Get PO line details
    SELECT pol.*, p.name as product_name, p.code as product_code
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

    -- Check over-receipt
    v_over_receipt_qty := (COALESCE(v_po_line.received_qty, 0) + v_item.received_qty) - v_po_line.quantity;
    IF v_over_receipt_qty > 0 THEN
      v_over_receipt_pct := (v_over_receipt_qty / v_po_line.quantity) * 100;

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

    -- Create GRN item
    INSERT INTO grn_items (
      grn_id,
      product_id,
      po_line_id,
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
      v_po_line.product_id,
      v_item.po_line_id,
      v_item.received_qty,
      v_item.batch_number,
      v_item.supplier_batch_number,
      v_item.expiry_date,
      v_item.manufacture_date,
      v_lp_id,
      v_item_location_id,
      v_item.notes
    )
    RETURNING id INTO v_grn_item_id;

    v_total_items := v_total_items + 1;

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
      'qa_status', v_qa_status
    );
  END LOOP;

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
      'received_by', p_user_id
    ),
    'items', v_items_json,
    'po_status', v_new_po_status,
    'over_receipt_warnings', v_warnings
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION create_grn_from_po IS 'Creates GRN with LPs from Purchase Order atomically (Story 05.11)';

-- =============================================================================
-- Grant execute permissions
-- =============================================================================
GRANT EXECUTE ON FUNCTION generate_grn_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_grn_from_po(UUID, UUID, UUID, UUID, UUID, TEXT, grn_item_input[]) TO authenticated;

-- =============================================================================
-- Add missing columns to grn_items if not exists
-- =============================================================================
DO $$
BEGIN
  -- Add location_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'grn_items' AND column_name = 'location_id') THEN
    ALTER TABLE grn_items ADD COLUMN location_id UUID REFERENCES locations(id);
  END IF;

  -- Add qa_status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'grn_items' AND column_name = 'qa_status') THEN
    ALTER TABLE grn_items ADD COLUMN qa_status TEXT DEFAULT 'pending'
      CHECK (qa_status IN ('pending', 'passed', 'failed', 'quarantine'));
  END IF;

  -- Add uom if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'grn_items' AND column_name = 'uom') THEN
    ALTER TABLE grn_items ADD COLUMN uom TEXT;
  END IF;

  -- Add ordered_qty if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'grn_items' AND column_name = 'ordered_qty') THEN
    ALTER TABLE grn_items ADD COLUMN ordered_qty DECIMAL(15,4);
  END IF;
END $$;

-- =============================================================================
-- Add supplier_id to grns if not exists
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'grns' AND column_name = 'supplier_id') THEN
    ALTER TABLE grns ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
  END IF;
END $$;
