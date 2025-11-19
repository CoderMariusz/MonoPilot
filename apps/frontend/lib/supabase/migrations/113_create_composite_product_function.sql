-- Migration: Create RPC function for composite product creation
-- Purpose: Atomically create product + BOM + BOM items in a single transaction

CREATE OR REPLACE FUNCTION create_composite_product(p JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id BIGINT;
  v_bom_id BIGINT;
  v_org_id INTEGER;
  v_user_id UUID;
  v_item JSONB;
  v_product JSONB;
  v_bom JSONB;
  v_items JSONB;
BEGIN
  -- Extract payload parts
  v_product := p->'product';
  v_bom := p->'bom';
  v_items := p->'items';

  -- Get user's org_id
  SELECT org_id INTO v_org_id FROM users WHERE id = auth.uid();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User organization not found';
  END IF;

  v_user_id := auth.uid();

  -- Insert product
  INSERT INTO products (
    org_id,
    part_number,
    sku,
    name,
    description,
    product_type,
    product_group,
    product_version,
    uom,
    expiry_policy,
    shelf_life_days,
    std_price,
    supplier_id,
    tax_code_id,
    lead_time_days,
    moq,
    production_lines,
    packs_per_box,
    boxes_per_pallet,
    default_routing_id,
    is_active,
    created_by,
    updated_by
  ) VALUES (
    v_org_id,
    v_product->>'part_number',
    v_product->>'part_number',  -- sku = part_number
    v_product->>'description',  -- name = description
    v_product->>'description',
    (v_product->>'product_type')::product_type,
    v_product->>'product_group',
    COALESCE(v_product->>'product_version', '1.0'),
    COALESCE(v_product->>'uom', 'KG'),
    v_product->>'expiry_policy',
    (v_product->>'shelf_life_days')::INTEGER,
    (v_product->>'std_price')::NUMERIC,
    (v_product->>'supplier_id')::BIGINT,
    (v_product->>'tax_code_id')::INTEGER,
    (v_product->>'lead_time_days')::INTEGER,
    (v_product->>'moq')::NUMERIC,
    COALESCE(v_product->'production_lines', '[]'::jsonb),  -- JSONB not ARRAY
    (v_product->>'packs_per_box')::INTEGER,
    (v_product->>'boxes_per_pallet')::INTEGER,
    (v_bom->>'default_routing_id')::INTEGER,
    TRUE,
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_product_id;

  -- Insert BOM
  INSERT INTO boms (
    org_id,
    product_id,
    version,
    status,
    default_routing_id,
    line_id,
    created_by,
    updated_by
  ) VALUES (
    v_org_id,
    v_product_id,
    COALESCE(v_bom->>'version', '1.0'),
    COALESCE(v_bom->>'status', 'draft')::bom_status,
    (v_bom->>'default_routing_id')::BIGINT,
    CASE
      WHEN v_bom->'line_id' IS NOT NULL AND jsonb_typeof(v_bom->'line_id') = 'array'
      THEN ARRAY(SELECT (jsonb_array_elements_text(v_bom->'line_id'))::INTEGER)
      ELSE NULL
    END,
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_bom_id;

  -- Insert BOM items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    INSERT INTO bom_items (
      org_id,
      bom_id,
      material_id,
      quantity,
      uom,
      sequence,
      priority,
      scrap_std_pct,
      is_optional,
      is_phantom,
      consume_whole_lp,
      unit_cost_std,
      lead_time_days,
      moq,
      line_id,
      production_lines,
      production_line_restrictions
    ) VALUES (
      v_org_id,
      v_bom_id,
      (v_item->>'material_id')::BIGINT,
      COALESCE((v_item->>'quantity')::NUMERIC, 1),
      COALESCE(v_item->>'uom', 'KG'),
      COALESCE((v_item->>'sequence')::INTEGER, 1),
      (v_item->>'priority')::INTEGER,
      (v_item->>'scrap_std_pct')::NUMERIC,
      COALESCE((v_item->>'is_optional')::BOOLEAN, FALSE),
      COALESCE((v_item->>'is_phantom')::BOOLEAN, FALSE),
      COALESCE((v_item->>'consume_whole_lp')::BOOLEAN, FALSE),
      (v_item->>'unit_cost_std')::NUMERIC,
      (v_item->>'lead_time_days')::INTEGER,
      (v_item->>'moq')::INTEGER,
      CASE
        WHEN v_item->'line_id' IS NOT NULL AND jsonb_typeof(v_item->'line_id') = 'array'
        THEN ARRAY(SELECT (jsonb_array_elements_text(v_item->'line_id'))::INTEGER)
        ELSE NULL
      END,
      CASE
        WHEN v_item->'production_lines' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(v_item->'production_lines'))
        ELSE NULL
      END,
      CASE
        WHEN v_item->'production_line_restrictions' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(v_item->'production_line_restrictions'))
        ELSE NULL
      END
    );
  END LOOP;

  -- Return created IDs
  RETURN jsonb_build_object(
    'product_id', v_product_id,
    'bom_id', v_bom_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_composite_product(JSONB) TO authenticated;

COMMENT ON FUNCTION create_composite_product IS 'Atomically creates a composite product with its BOM and BOM items';
