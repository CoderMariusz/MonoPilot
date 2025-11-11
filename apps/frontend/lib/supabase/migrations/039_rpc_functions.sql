-- Migration 039: RPC Functions
-- Purpose: Business logic functions for complex operations
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. GENERATE TO NUMBER
-- =============================================

CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence INTEGER;
  v_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 'TO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM to_header
  WHERE number LIKE 'TO-' || TO_CHAR(NOW(), 'YYYY') || '-%';
  
  v_number := 'TO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_number;
END;
$$;

COMMENT ON FUNCTION generate_to_number IS 'Generate next transfer order number in format TO-YYYY-NNN';

-- =============================================
-- 2. MARK TO SHIPPED
-- =============================================

CREATE OR REPLACE FUNCTION mark_to_shipped(
  p_to_id INTEGER,
  p_ship_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE to_header
  SET 
    actual_ship_date = p_ship_date,
    status = 'in_transit',
    updated_at = NOW()
  WHERE id = p_to_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order % not found', p_to_id;
  END IF;
  
  INSERT INTO audit_log (entity, entity_id, action, actor_id, created_at)
  VALUES ('to_header', p_to_id, 'mark_shipped', p_user_id, NOW());
  
  RETURN jsonb_build_object('success', true, 'to_id', p_to_id, 'status', 'in_transit');
END;
$$;

COMMENT ON FUNCTION mark_to_shipped IS 'Mark transfer order as shipped with actual ship date';

-- =============================================
-- 3. MARK TO RECEIVED
-- =============================================

CREATE OR REPLACE FUNCTION mark_to_received(
  p_to_id INTEGER,
  p_receive_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE to_header
  SET 
    actual_receive_date = p_receive_date,
    status = 'received',
    updated_at = NOW()
  WHERE id = p_to_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order % not found', p_to_id;
  END IF;
  
  INSERT INTO audit_log (entity, entity_id, action, actor_id, created_at)
  VALUES ('to_header', p_to_id, 'mark_received', p_user_id, NOW());
  
  RETURN jsonb_build_object('success', true, 'to_id', p_to_id, 'status', 'received');
END;
$$;

COMMENT ON FUNCTION mark_to_received IS 'Mark transfer order as received with actual receive date';

-- =============================================
-- 4. QUICK CREATE POS
-- =============================================

CREATE OR REPLACE FUNCTION quick_create_pos(
  p_product_entries JSONB,
  p_user_id UUID,
  p_warehouse_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry JSONB;
  v_product RECORD;
  v_supplier RECORD;
  v_supplier_groups JSONB := '[]'::JSONB;
  v_supplier_group JSONB;
  v_lines JSONB;
  v_line JSONB;
  v_group_index INTEGER;
  v_line_index INTEGER;
  v_qty NUMERIC;
  v_existing_qty NUMERIC;
  v_vat_rate NUMERIC := 0;
  v_po_header RECORD;
  v_po_number TEXT;
  v_line_no INTEGER;
  v_result JSONB := '[]'::JSONB;
  v_group_currency TEXT;
  v_net_total NUMERIC;
  v_vat_total NUMERIC;
  v_gross_total NUMERIC;
  v_line_qty NUMERIC;
  v_line_price NUMERIC;
  v_line_vat_rate NUMERIC;
BEGIN
  -- Check user permissions
  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_user_id
      AND u.role IN ('Admin', 'Planner', 'Purchasing')
  ) THEN
    RAISE EXCEPTION 'User does not have permission to create purchase orders';
  END IF;

  -- Process entries and group by supplier/currency
  FOR v_entry IN SELECT elem FROM jsonb_array_elements(p_product_entries) AS elem LOOP
    -- Validate entry
    IF NOT (v_entry ? 'product_code') THEN
      RAISE EXCEPTION 'Input entry missing product_code: %', v_entry::TEXT;
    END IF;
    IF NOT (v_entry ? 'quantity') THEN
      RAISE EXCEPTION 'Input entry missing quantity for product %', v_entry->>'product_code';
    END IF;

    v_qty := (v_entry->>'quantity')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0 for product %', v_entry->>'product_code';
    END IF;

    -- Get product details
    SELECT id, part_number, description, supplier_id, uom, std_price, tax_code_id, is_active
    INTO v_product
    FROM products
    WHERE part_number = v_entry->>'product_code'
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product code % not found or inactive', v_entry->>'product_code';
    END IF;

    IF v_product.supplier_id IS NULL THEN
      RAISE EXCEPTION 'Product % does not have a supplier assigned', v_product.part_number;
    END IF;

    -- Get supplier details
    SELECT s.id, s.name, s.currency, s.payment_terms
    INTO v_supplier
    FROM suppliers s
    WHERE s.id = v_product.supplier_id
      AND s.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Supplier for product % not found or inactive', v_product.part_number;
    END IF;

    IF v_supplier.currency IS NULL THEN
      RAISE EXCEPTION 'Supplier % does not have currency defined', v_supplier.name;
    END IF;

    -- Get VAT rate
    v_vat_rate := 0;
    IF v_product.tax_code_id IS NOT NULL THEN
      SELECT rate INTO v_vat_rate FROM settings_tax_codes WHERE id = v_product.tax_code_id;
    END IF;

    -- Find or create supplier group
    v_group_index := NULL;
    v_group_currency := v_supplier.currency;

    FOR i IN 0 .. COALESCE(jsonb_array_length(v_supplier_groups), 0) - 1 LOOP
      v_supplier_group := v_supplier_groups->i;
      IF (v_supplier_group->>'supplier_id')::INTEGER = v_supplier.id
         AND (v_supplier_group->>'currency') = v_group_currency THEN
        v_group_index := i;
        EXIT;
      END IF;
    END LOOP;

    -- Add to group or create new group
    IF v_group_index IS NULL THEN
      v_supplier_groups := v_supplier_groups || jsonb_build_array(
        jsonb_build_object(
          'supplier_id', v_supplier.id,
          'supplier_name', v_supplier.name,
          'currency', v_group_currency,
          'payment_terms', v_supplier.payment_terms,
          'lines', jsonb_build_array(
            jsonb_build_object(
              'item_id', v_product.id,
              'part_number', v_product.part_number,
              'description', v_product.description,
              'uom', v_product.uom,
              'qty_ordered', v_qty,
              'unit_price', COALESCE(v_product.std_price, 0),
              'vat_rate', COALESCE(v_vat_rate, 0)
            )
          )
        )
      );
    ELSE
      -- Aggregate quantities for same product
      v_supplier_group := v_supplier_groups->v_group_index;
      v_lines := COALESCE(v_supplier_group->'lines', '[]'::JSONB);

      v_line_index := NULL;
      FOR j IN 0 .. COALESCE(jsonb_array_length(v_lines), 0) - 1 LOOP
        v_line := v_lines->j;
        IF (v_line->>'item_id')::INTEGER = v_product.id THEN
          v_line_index := j;
          EXIT;
        END IF;
      END LOOP;

      IF v_line_index IS NULL THEN
        v_lines := v_lines || jsonb_build_array(
          jsonb_build_object(
            'item_id', v_product.id,
            'part_number', v_product.part_number,
            'description', v_product.description,
            'uom', v_product.uom,
            'qty_ordered', v_qty,
            'unit_price', COALESCE(v_product.std_price, 0),
            'vat_rate', COALESCE(v_vat_rate, 0)
          )
        );
      ELSE
        v_line := v_lines->v_line_index;
        v_existing_qty := (v_line->>'qty_ordered')::NUMERIC;
        v_line := jsonb_build_object(
          'item_id', v_product.id,
          'part_number', v_product.part_number,
          'description', v_product.description,
          'uom', v_product.uom,
          'qty_ordered', v_existing_qty + v_qty,
          'unit_price', COALESCE(v_product.std_price, 0),
          'vat_rate', COALESCE(v_vat_rate, 0)
        );
        v_lines := jsonb_set(v_lines, ARRAY[v_line_index::TEXT], v_line);
      END IF;

      v_supplier_group := jsonb_set(v_supplier_group, '{lines}', v_lines);
      v_supplier_groups := jsonb_set(v_supplier_groups, ARRAY[v_group_index::TEXT], v_supplier_group);
    END IF;
  END LOOP;

  -- Create PO for each supplier/currency group
  FOR v_supplier_group IN SELECT * FROM jsonb_array_elements(v_supplier_groups) LOOP
    -- Generate PO number
    SELECT 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
      (COALESCE(MAX(CAST(SUBSTRING(number FROM 'PO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1)::TEXT,
      3,
      '0'
    )
    INTO v_po_number
    FROM po_header
    WHERE number LIKE 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-%';

    -- Create PO header
    INSERT INTO po_header (
      number,
      supplier_id,
      status,
      currency,
      exchange_rate,
      order_date,
      created_by,
      net_total,
      vat_total,
      gross_total,
      warehouse_id
    )
    VALUES (
      v_po_number,
      (v_supplier_group->>'supplier_id')::INTEGER,
      'draft',
      v_supplier_group->>'currency',
      1.0,
      NOW(),
      p_user_id,
      0,
      0,
      0,
      p_warehouse_id
    )
    RETURNING * INTO v_po_header;

    -- Create PO lines and calculate totals
    v_line_no := 1;
    v_net_total := 0;
    v_vat_total := 0;
    v_gross_total := 0;

    FOR v_line IN SELECT * FROM jsonb_array_elements(v_supplier_group->'lines') LOOP
      v_line_qty := (v_line->>'qty_ordered')::NUMERIC;
      v_line_price := (v_line->>'unit_price')::NUMERIC;
      v_line_vat_rate := COALESCE((v_line->>'vat_rate')::NUMERIC, 0);

      INSERT INTO po_line (
        po_id,
        line_no,
        item_id,
        uom,
        qty_ordered,
        qty_received,
        unit_price,
        vat_rate
      )
      VALUES (
        v_po_header.id,
        v_line_no,
        (v_line->>'item_id')::INTEGER,
        v_line->>'uom',
        v_line_qty,
        0,
        v_line_price,
        v_line_vat_rate
      );

      v_net_total := v_net_total + v_line_qty * v_line_price;
      v_vat_total := v_vat_total + (v_line_qty * v_line_price * v_line_vat_rate / 100);
      v_line_no := v_line_no + 1;
    END LOOP;

    v_gross_total := v_net_total + v_vat_total;

    -- Update totals
    UPDATE po_header
    SET net_total = v_net_total::NUMERIC,
        vat_total = v_vat_total::NUMERIC,
        gross_total = v_gross_total::NUMERIC,
        updated_at = NOW()
    WHERE id = v_po_header.id;

    -- Add to result
    v_result := v_result || jsonb_build_object(
      'id', v_po_header.id,
      'number', v_po_header.number,
      'supplier_id', v_po_header.supplier_id,
      'supplier_name', v_supplier_group->>'supplier_name',
      'currency', v_po_header.currency,
      'total_lines', v_line_no - 1,
      'net_total', v_net_total,
      'vat_total', v_vat_total,
      'gross_total', v_gross_total
    );

    -- Audit log
    INSERT INTO audit_log (entity, entity_id, action, actor_id, created_at)
    VALUES (
      'po_header',
      v_po_header.id,
      'quick_create',
      p_user_id,
      NOW()
    );
  END LOOP;

  RETURN jsonb_build_object('purchase_orders', v_result);
END;
$$;

COMMENT ON FUNCTION quick_create_pos IS 'Quick PO creation from product codes - auto-splits by supplier and currency';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION generate_to_number TO authenticated;
GRANT EXECUTE ON FUNCTION mark_to_shipped TO authenticated;
GRANT EXECUTE ON FUNCTION mark_to_received TO authenticated;
GRANT EXECUTE ON FUNCTION quick_create_pos TO authenticated;

