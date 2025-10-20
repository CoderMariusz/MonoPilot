-- Add default_routing_id to boms table
ALTER TABLE public.boms 
ADD COLUMN IF NOT EXISTS default_routing_id INTEGER REFERENCES public.routings(id);

-- Update create_composite_product RPC to handle default_routing_id
CREATE OR REPLACE FUNCTION public.create_composite_product(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id int;
  v_bom_id     int;
BEGIN
  -- 1) product
  INSERT INTO products (
    part_number, description, type, uom,
    product_group, product_type,
    expiry_policy, shelf_life_days, std_price,
    production_lines, preferred_supplier_id, tax_code_id, lead_time_days, moq
  )
  VALUES (
    p->'product'->>'part_number',
    p->'product'->>'description',
    p->'product'->>'type',                   -- 'PR' or 'FG'
    p->'product'->>'uom',
    p->'product'->>'product_group',
    p->'product'->>'product_type',
    p->'product'->>'expiry_policy',
    NULLIF(p->'product'->>'shelf_life_days','')::int,
    NULLIF(p->'product'->>'std_price','')::numeric,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'product'->'production_lines')), '{}')::text[],
    NULLIF(p->'product'->>'preferred_supplier_id','')::int,
    NULLIF(p->'product'->>'tax_code_id','')::int,
    NULLIF(p->'product'->>'lead_time_days','')::int,
    NULLIF(p->'product'->>'moq','')::numeric
  ) RETURNING id INTO v_product_id;

  -- 2) boms (PLURAL) - now includes default_routing_id
  INSERT INTO boms (product_id, version, status, default_routing_id)
  VALUES (
    v_product_id,
    COALESCE(p->'bom'->>'version','1.0'),
    COALESCE(p->'bom'->>'status','active'),
    NULLIF(p->'bom'->>'default_routing_id','')::int
  )
  RETURNING id INTO v_bom_id;

  -- 3) bom_items
  INSERT INTO bom_items (
    bom_id, material_id, quantity, uom, sequence, priority,
    production_line_restrictions, scrap_std_pct, is_optional, is_phantom, one_to_one, unit_cost_std
  )
  SELECT
    v_bom_id,
    (i->>'material_id')::int,
    (i->>'quantity')::numeric,
    i->>'uom',
    COALESCE((i->>'sequence')::int, ROW_NUMBER() OVER (ORDER BY 1)),
    NULLIF(i->>'priority','')::int,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(i->'production_line_restrictions')), '{}')::text[],
    COALESCE(NULLIF(i->>'scrap_std_pct','')::numeric, 0),
    COALESCE((i->>'is_optional')::boolean, false),
    COALESCE((i->>'is_phantom')::boolean, false),
    COALESCE((i->>'one_to_one')::boolean, false),
    NULLIF(i->>'unit_cost_std','')::numeric
  FROM jsonb_array_elements(p->'items') i;

  RETURN jsonb_build_object('product_id', v_product_id, 'bom_id', v_bom_id);

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'part_number_exists' USING ERRCODE = '23505';
END $$;

GRANT EXECUTE ON FUNCTION public.create_composite_product(jsonb) TO anon, authenticated;
