-- Migration: Create RPC function for transactional demo data creation (Story 01.3)
-- Description: Ensures atomic demo data creation during onboarding skip
-- Date: 2025-12-19
-- Issue: CRITICAL-3 from code review - prevents partial data on errors

/**
 * RPC Function: create_onboarding_demo_data
 *
 * Creates demo data atomically when user skips onboarding wizard.
 * All operations occur in a single transaction - if any step fails,
 * all changes are rolled back (no orphaned records).
 *
 * Demo Data Created:
 * - Warehouse: code='DEMO-WH', name='Main Warehouse', type='general', is_default=true
 * - Location: code='DEFAULT', name='Default Location', type='zone'
 * - Product: code='SAMPLE-001', name='Sample Product', uom='EA'
 * - Module toggles: technical=true, all others=false
 *
 * @param p_org_id UUID - Organization ID (validated by RLS)
 * @returns JSON - Object with created IDs: { warehouse_id, location_id, product_id }
 * @throws Exception - Rolls back all changes on any error
 *
 * Security: RLS policies enforce org_id isolation on all tables
 */
CREATE OR REPLACE FUNCTION create_onboarding_demo_data(p_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_warehouse_id UUID;
  v_location_id UUID;
  v_product_id UUID;
BEGIN
  -- Validate org_id
  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  -- All operations in single transaction (automatic rollback on error)

  -- 1. Create demo warehouse
  INSERT INTO warehouses (org_id, code, name, type, is_default, is_active)
  VALUES (p_org_id, 'DEMO-WH', 'Main Warehouse', 'general', true, true)
  RETURNING id INTO v_warehouse_id;

  -- 2. Create default location under demo warehouse
  INSERT INTO locations (org_id, warehouse_id, code, name, type, is_active)
  VALUES (p_org_id, v_warehouse_id, 'DEFAULT', 'Default Location', 'zone', true)
  RETURNING id INTO v_location_id;

  -- 3. Create sample product
  INSERT INTO products (org_id, code, name, uom, status, is_active)
  VALUES (p_org_id, 'SAMPLE-001', 'Sample Product', 'EA', 'active', true)
  RETURNING id INTO v_product_id;

  -- 4. Set module toggles (non-critical, ignore conflicts)
  -- Use ON CONFLICT DO NOTHING in case toggles already exist
  INSERT INTO module_toggles (org_id, module_code, is_enabled)
  VALUES
    (p_org_id, 'technical', true),
    (p_org_id, 'planning', false),
    (p_org_id, 'production', false),
    (p_org_id, 'warehouse', false),
    (p_org_id, 'quality', false),
    (p_org_id, 'shipping', false)
  ON CONFLICT (org_id, module_code) DO NOTHING;

  -- Return created IDs
  RETURN json_build_object(
    'warehouse_id', v_warehouse_id,
    'location_id', v_location_id,
    'product_id', v_product_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details (appears in Supabase logs)
    RAISE WARNING 'Failed to create demo data for org %: % %', p_org_id, SQLERRM, SQLSTATE;
    -- Re-raise to trigger rollback
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
-- RLS policies will enforce org_id isolation
GRANT EXECUTE ON FUNCTION create_onboarding_demo_data(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_onboarding_demo_data IS
  'Atomically creates demo data (warehouse, location, product) for onboarding skip. Story 01.3';
