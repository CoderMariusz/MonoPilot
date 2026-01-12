-- Migration: Create atomic PO with lines RPC function
-- Story: 03.3 - PO CRUD + Lines
-- Fix: MAJOR-05 - Transaction Rollback
-- Date: 2026-01-02
--
-- Creates an RPC function for atomic PO + lines creation.
-- This ensures proper transaction handling - if lines fail to insert,
-- the entire operation rolls back (no orphaned PO headers).

-- ============================================================================
-- TYPE: PO Line input for RPC function
-- ============================================================================

DO $$
BEGIN
  -- Drop type if it exists (for idempotent migrations)
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_line_input') THEN
    DROP TYPE po_line_input CASCADE;
  END IF;
END $$;

CREATE TYPE po_line_input AS (
  product_id UUID,
  quantity DECIMAL(15,4),
  uom VARCHAR(20),
  unit_price DECIMAL(15,4),
  discount_percent DECIMAL(5,2),
  expected_delivery_date DATE,
  notes TEXT
);

-- ============================================================================
-- FUNCTION: Create PO with lines atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION create_po_with_lines(
  p_org_id UUID,
  p_supplier_id UUID,
  p_warehouse_id UUID,
  p_expected_delivery_date DATE,
  p_currency VARCHAR(3) DEFAULT 'PLN',
  p_tax_code_id UUID DEFAULT NULL,
  p_payment_terms VARCHAR(50) DEFAULT NULL,
  p_shipping_method VARCHAR(100) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_lines po_line_input[] DEFAULT ARRAY[]::po_line_input[]
)
RETURNS TABLE (
  success BOOLEAN,
  po_id UUID,
  po_number TEXT,
  error_message TEXT,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_po_number TEXT;
  v_line po_line_input;
  v_line_number INTEGER := 0;
  v_line_gross DECIMAL(15,4);
  v_discount_amount DECIMAL(15,4);
  v_line_total DECIMAL(15,4);
  v_subtotal DECIMAL(15,4) := 0;
  v_discount_total DECIMAL(15,4) := 0;
  v_tax_rate DECIMAL(5,2) := 0;
  v_tax_amount DECIMAL(15,4);
  v_total DECIMAL(15,4);
BEGIN
  -- Validate supplier exists and belongs to org
  IF NOT EXISTS (
    SELECT 1 FROM suppliers
    WHERE id = p_supplier_id AND org_id = p_org_id
  ) THEN
    RETURN QUERY SELECT
      FALSE,
      NULL::UUID,
      NULL::TEXT,
      'Supplier not found'::TEXT,
      'SUPPLIER_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- Validate warehouse exists and belongs to org
  IF NOT EXISTS (
    SELECT 1 FROM warehouses
    WHERE id = p_warehouse_id AND org_id = p_org_id
  ) THEN
    RETURN QUERY SELECT
      FALSE,
      NULL::UUID,
      NULL::TEXT,
      'Warehouse not found'::TEXT,
      'WAREHOUSE_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- Get tax rate if tax_code_id provided
  IF p_tax_code_id IS NOT NULL THEN
    SELECT rate INTO v_tax_rate
    FROM tax_codes
    WHERE id = p_tax_code_id;
  END IF;

  -- Calculate totals from lines (if any)
  IF array_length(p_lines, 1) > 0 THEN
    FOREACH v_line IN ARRAY p_lines
    LOOP
      v_line_gross := v_line.quantity * v_line.unit_price;
      v_discount_amount := v_line_gross * (COALESCE(v_line.discount_percent, 0) / 100);
      v_line_total := v_line_gross - v_discount_amount;

      v_subtotal := v_subtotal + v_line_total;
      v_discount_total := v_discount_total + v_discount_amount;
    END LOOP;
  END IF;

  v_tax_amount := ROUND(v_subtotal * (v_tax_rate / 100), 4);
  v_total := v_subtotal + v_tax_amount;

  -- Generate PO number
  v_po_number := generate_po_number(p_org_id);

  -- Insert PO header
  INSERT INTO purchase_orders (
    org_id,
    po_number,
    supplier_id,
    warehouse_id,
    expected_delivery_date,
    currency,
    tax_code_id,
    payment_terms,
    shipping_method,
    notes,
    internal_notes,
    status,
    subtotal,
    discount_total,
    tax_amount,
    total,
    created_by,
    updated_by
  ) VALUES (
    p_org_id,
    v_po_number,
    p_supplier_id,
    p_warehouse_id,
    p_expected_delivery_date,
    p_currency,
    p_tax_code_id,
    p_payment_terms,
    p_shipping_method,
    p_notes,
    p_internal_notes,
    'draft',
    ROUND(v_subtotal, 4),
    ROUND(v_discount_total, 4),
    v_tax_amount,
    ROUND(v_total, 4),
    p_created_by,
    p_created_by
  )
  RETURNING id INTO v_po_id;

  -- Insert lines (if any)
  IF array_length(p_lines, 1) > 0 THEN
    FOREACH v_line IN ARRAY p_lines
    LOOP
      v_line_number := v_line_number + 1;

      -- Validate product exists and belongs to org
      IF NOT EXISTS (
        SELECT 1 FROM products
        WHERE id = v_line.product_id AND org_id = p_org_id
      ) THEN
        -- Rollback happens automatically on exception
        RAISE EXCEPTION 'Product not found: %', v_line.product_id
          USING ERRCODE = 'P0001';
      END IF;

      -- Calculate line totals
      v_line_gross := v_line.quantity * v_line.unit_price;
      v_discount_amount := ROUND(v_line_gross * (COALESCE(v_line.discount_percent, 0) / 100), 4);
      v_line_total := ROUND(v_line_gross - v_discount_amount, 4);

      INSERT INTO purchase_order_lines (
        po_id,
        line_number,
        product_id,
        quantity,
        uom,
        unit_price,
        discount_percent,
        discount_amount,
        line_total,
        expected_delivery_date,
        notes,
        received_qty
      ) VALUES (
        v_po_id,
        v_line_number,
        v_line.product_id,
        v_line.quantity,
        v_line.uom,
        v_line.unit_price,
        COALESCE(v_line.discount_percent, 0),
        v_discount_amount,
        v_line_total,
        v_line.expected_delivery_date,
        v_line.notes,
        0
      );
    END LOOP;
  END IF;

  -- Record initial status in history
  INSERT INTO po_status_history (po_id, from_status, to_status, changed_by)
  VALUES (v_po_id, NULL, 'draft', p_created_by);

  -- Return success
  RETURN QUERY SELECT
    TRUE,
    v_po_id,
    v_po_number,
    NULL::TEXT,
    NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    -- Any error causes full rollback
    RETURN QUERY SELECT
      FALSE,
      NULL::UUID,
      NULL::TEXT,
      SQLERRM::TEXT,
      'DATABASE_ERROR'::TEXT;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_po_with_lines(
  UUID, UUID, UUID, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT, TEXT, UUID, po_line_input[]
) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TYPE po_line_input IS 'Input type for PO line items in create_po_with_lines RPC';
COMMENT ON FUNCTION create_po_with_lines IS 'Atomically create PO with lines. Full rollback on any failure (MAJOR-05 fix).';
