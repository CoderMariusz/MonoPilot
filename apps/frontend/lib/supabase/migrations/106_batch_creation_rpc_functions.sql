-- Migration 106: Batch Creation RPC Functions for Spreadsheet Mode
-- Description: Atomic batch creation of Work Orders and Purchase Orders
-- Story: 1-4-1 Spreadsheet Mode Bulk Creation
-- Created: 2025-11-16

-- ============================================================================
-- Function: batch_create_work_orders
-- Description: Create multiple work orders atomically in a single transaction
-- ============================================================================

CREATE OR REPLACE FUNCTION batch_create_work_orders(
  p_work_orders JSONB
)
RETURNS TABLE (
  id BIGINT,
  number TEXT,
  product_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wo JSONB;
  v_wo_id BIGINT;
  v_wo_number TEXT;
  v_product_id BIGINT;
  v_org_id BIGINT;
  v_counter INT := 0;
BEGIN
  -- Get org_id from current user context (set by RLS)
  SELECT (current_setting('app.current_org_id', true))::BIGINT INTO v_org_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization context not set';
  END IF;

  -- Loop through each work order in the array
  FOR v_wo IN SELECT * FROM jsonb_array_elements(p_work_orders)
  LOOP
    v_counter := v_counter + 1;

    -- Extract product_id for validation
    v_product_id := (v_wo->>'product_id')::BIGINT;

    -- Validate product exists and is active
    IF NOT EXISTS (
      SELECT 1 FROM products
      WHERE id = v_product_id
        AND org_id = v_org_id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Product ID % not found or inactive (WO #%)', v_product_id, v_counter;
    END IF;

    -- Generate WO number (format: WO-YYYYMMDD-NNN)
    v_wo_number := 'WO-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                   lpad(nextval('wo_number_seq')::TEXT, 3, '0');

    -- Insert work order
    INSERT INTO work_orders (
      org_id,
      number,
      product_id,
      quantity,
      uom,
      line_id,
      scheduled_start,
      scheduled_end,
      due_date,
      shift,
      priority,
      notes,
      bom_id,
      status,
      created_by,
      created_at
    ) VALUES (
      v_org_id,
      v_wo_number,
      v_product_id,
      (v_wo->>'quantity')::NUMERIC,
      v_wo->>'uom',
      NULLIF(v_wo->>'line_id', '')::BIGINT,
      (v_wo->>'scheduled_start')::TIMESTAMPTZ,
      NULLIF(v_wo->>'scheduled_end', '')::TIMESTAMPTZ,
      NULLIF(v_wo->>'due_date', '')::DATE,
      COALESCE(v_wo->>'shift', 'day'),
      COALESCE((v_wo->>'priority')::INT, v_counter),
      v_wo->>'notes',
      NULLIF(v_wo->>'bom_id', '')::BIGINT,
      COALESCE(v_wo->>'status', 'planned'),
      (v_wo->>'created_by')::UUID,
      NOW()
    )
    RETURNING work_orders.id, work_orders.number, work_orders.product_id
    INTO v_wo_id, v_wo_number, v_product_id;

    -- Return created WO info
    id := v_wo_id;
    number := v_wo_number;
    product_id := v_product_id;
    RETURN NEXT;

  END LOOP;

  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION batch_create_work_orders(JSONB) TO authenticated;

-- ============================================================================
-- Function: batch_create_purchase_orders
-- Description: Create multiple purchase orders atomically, grouped by supplier
-- ============================================================================

CREATE OR REPLACE FUNCTION batch_create_purchase_orders(
  p_warehouse_id BIGINT,
  p_lines JSONB,
  p_created_by UUID
)
RETURNS TABLE (
  id BIGINT,
  number TEXT,
  supplier_id BIGINT,
  supplier_name TEXT,
  line_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id BIGINT;
  v_line JSONB;
  v_product RECORD;
  v_supplier_groups JSONB;
  v_supplier JSONB;
  v_po_id BIGINT;
  v_po_number TEXT;
  v_supplier_id BIGINT;
  v_supplier_name TEXT;
  v_line_count INT;
  v_currency TEXT;
BEGIN
  -- Get org_id from current user context
  SELECT (current_setting('app.current_org_id', true))::BIGINT INTO v_org_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization context not set';
  END IF;

  -- Validate warehouse exists
  IF NOT EXISTS (
    SELECT 1 FROM warehouses WHERE warehouses.id = p_warehouse_id AND warehouses.org_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Warehouse ID % not found', p_warehouse_id;
  END IF;

  -- Group lines by supplier_id
  -- First, enrich each line with product info (supplier_id, uom)
  WITH enriched_lines AS (
    SELECT
      line.value AS line_data,
      p.id AS product_id,
      p.supplier_id,
      p.uom,
      s.name AS supplier_name,
      s.currency AS supplier_currency
    FROM jsonb_array_elements(p_lines) AS line
    INNER JOIN products p ON p.id = (line.value->>'product_id')::BIGINT AND p.org_id = v_org_id
    LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.org_id = v_org_id
    WHERE p.is_active = true
  ),
  grouped AS (
    SELECT
      supplier_id,
      supplier_name,
      supplier_currency,
      jsonb_agg(
        jsonb_build_object(
          'product_id', product_id,
          'quantity', (line_data->>'quantity')::NUMERIC,
          'unit_price', NULLIF(line_data->>'unit_price', '')::NUMERIC,
          'currency', COALESCE(line_data->>'currency', supplier_currency, 'USD'),
          'requested_delivery_date', NULLIF(line_data->>'requested_delivery_date', '')::DATE,
          'notes', line_data->>'notes',
          'uom', uom
        )
      ) AS lines
    FROM enriched_lines
    WHERE supplier_id IS NOT NULL
    GROUP BY supplier_id, supplier_name, supplier_currency
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'supplier_id', supplier_id,
      'supplier_name', supplier_name,
      'currency', supplier_currency,
      'lines', lines
    )
  ) INTO v_supplier_groups
  FROM grouped;

  -- Check if any products have no supplier
  IF (SELECT COUNT(*) FROM jsonb_array_elements(p_lines) AS line
      INNER JOIN products p ON p.id = (line.value->>'product_id')::BIGINT AND p.org_id = v_org_id
      WHERE p.supplier_id IS NULL) > 0 THEN
    RAISE EXCEPTION 'One or more products have no supplier assigned';
  END IF;

  -- Create one PO per supplier
  FOR v_supplier IN SELECT * FROM jsonb_array_elements(v_supplier_groups)
  LOOP
    v_supplier_id := (v_supplier->>'supplier_id')::BIGINT;
    v_supplier_name := v_supplier->>'supplier_name';
    v_currency := COALESCE(v_supplier->>'currency', 'USD');

    -- Generate PO number (format: PO-YYYYMMDD-NNN)
    v_po_number := 'PO-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                   lpad(nextval('po_number_seq')::TEXT, 3, '0');

    -- Create PO header
    INSERT INTO po_header (
      org_id,
      number,
      supplier_id,
      warehouse_id,
      status,
      currency,
      order_date,
      created_by,
      created_at
    ) VALUES (
      v_org_id,
      v_po_number,
      v_supplier_id,
      p_warehouse_id,
      'draft',
      v_currency,
      CURRENT_DATE,
      p_created_by,
      NOW()
    )
    RETURNING po_header.id INTO v_po_id;

    -- Create PO lines
    v_line_count := 0;
    FOR v_line IN SELECT * FROM jsonb_array_elements(v_supplier->'lines')
    LOOP
      v_line_count := v_line_count + 1;

      INSERT INTO po_line (
        org_id,
        po_id,
        item_id,
        quantity,
        uom,
        unit_price,
        currency,
        requested_delivery_date,
        notes,
        line_number,
        created_at
      ) VALUES (
        v_org_id,
        v_po_id,
        (v_line->>'product_id')::BIGINT,
        (v_line->>'quantity')::NUMERIC,
        v_line->>'uom',
        NULLIF(v_line->>'unit_price', '')::NUMERIC,
        v_line->>'currency',
        NULLIF(v_line->>'requested_delivery_date', '')::DATE,
        v_line->>'notes',
        v_line_count,
        NOW()
      );
    END LOOP;

    -- Return created PO info
    id := v_po_id;
    number := v_po_number;
    supplier_id := v_supplier_id;
    supplier_name := v_supplier_name;
    line_count := v_line_count;
    RETURN NEXT;

  END LOOP;

  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION batch_create_purchase_orders(BIGINT, JSONB, UUID) TO authenticated;

-- ============================================================================
-- Create sequences for WO and PO numbers if they don't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'wo_number_seq') THEN
    CREATE SEQUENCE wo_number_seq START 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'po_number_seq') THEN
    CREATE SEQUENCE po_number_seq START 1;
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION batch_create_work_orders IS 'Create multiple work orders atomically. All succeed or all fail (rollback).';
COMMENT ON FUNCTION batch_create_purchase_orders IS 'Create multiple purchase orders atomically, grouped by supplier. All succeed or all fail (rollback).';
