-- =============================================================================
-- Migration 107: Create Split License Plate Function
-- Story: 05.17 - LP Split Workflow
-- Purpose: Atomic LP split operation with transaction safety
-- =============================================================================

-- =============================================================================
-- Split License Plate Function
-- Splits one LP into two with proper genealogy tracking
-- =============================================================================

CREATE OR REPLACE FUNCTION split_license_plate(
  p_source_lp_id UUID,
  p_org_id UUID,
  p_split_qty DECIMAL(15,4),
  p_destination_location_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_lp license_plates%ROWTYPE;
  v_new_lp_id UUID;
  v_new_lp_number TEXT;
  v_genealogy_id UUID;
  v_dest_location_id UUID;
  v_dest_location_name TEXT;
  v_source_location_name TEXT;
BEGIN
  -- Lock and fetch source LP
  SELECT * INTO v_source_lp
  FROM license_plates
  WHERE id = p_source_lp_id AND org_id = p_org_id
  FOR UPDATE;

  -- Validate LP exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'License Plate not found';
  END IF;

  -- Validate LP status
  IF v_source_lp.status != 'available' THEN
    RAISE EXCEPTION 'LP status must be available, current: %', v_source_lp.status;
  END IF;

  -- Validate split quantity
  IF p_split_qty <= 0 THEN
    RAISE EXCEPTION 'Split quantity must be greater than 0';
  END IF;

  IF p_split_qty >= v_source_lp.quantity THEN
    RAISE EXCEPTION 'Split quantity must be less than LP quantity';
  END IF;

  -- Determine destination location
  v_dest_location_id := COALESCE(p_destination_location_id, v_source_lp.location_id);

  -- Get location names for response
  SELECT name INTO v_source_location_name
  FROM locations
  WHERE id = v_source_lp.location_id;

  SELECT name INTO v_dest_location_name
  FROM locations
  WHERE id = v_dest_location_id;

  -- Generate new LP number
  v_new_lp_number := generate_lp_number(p_org_id);

  -- Create new LP (inherit from source)
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
    parent_lp_id,
    source,
    created_by
  ) VALUES (
    p_org_id,
    v_new_lp_number,
    v_source_lp.product_id,
    p_split_qty,
    v_source_lp.uom,
    v_dest_location_id,
    v_source_lp.warehouse_id,
    'available',
    v_source_lp.qa_status,
    v_source_lp.batch_number,
    v_source_lp.supplier_batch_number,
    v_source_lp.expiry_date,
    v_source_lp.manufacture_date,
    p_source_lp_id,
    'split',
    p_user_id
  ) RETURNING id INTO v_new_lp_id;

  -- Update source LP quantity
  UPDATE license_plates
  SET quantity = quantity - p_split_qty,
      updated_at = NOW()
  WHERE id = p_source_lp_id;

  -- Create genealogy record
  INSERT INTO lp_genealogy (
    org_id,
    parent_lp_id,
    child_lp_id,
    operation_type,
    quantity,
    operation_date,
    created_by
  ) VALUES (
    p_org_id,
    p_source_lp_id,
    v_new_lp_id,
    'split',
    p_split_qty,
    NOW(),
    p_user_id
  ) RETURNING id INTO v_genealogy_id;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'sourceLp', json_build_object(
      'id', p_source_lp_id,
      'lpNumber', v_source_lp.lp_number,
      'quantity', v_source_lp.quantity - p_split_qty,
      'location', json_build_object(
        'id', v_source_lp.location_id,
        'name', v_source_location_name
      )
    ),
    'newLp', json_build_object(
      'id', v_new_lp_id,
      'lpNumber', v_new_lp_number,
      'quantity', p_split_qty,
      'location', json_build_object(
        'id', v_dest_location_id,
        'name', v_dest_location_name
      )
    ),
    'genealogyId', v_genealogy_id
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION split_license_plate(UUID, UUID, DECIMAL, UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION split_license_plate IS 'Atomically split a License Plate into two with genealogy tracking. Story 05.17';
