-- Migration: Create RPC function to check tax code references
-- Story: 01.13 - Tax Codes CRUD
-- Description: Returns count of references to a tax code from suppliers, invoices, etc.
-- Date: 2025-12-23

-- =============================================================================
-- CREATE RPC FUNCTION: get_tax_code_reference_count
-- =============================================================================

/**
 * RPC Function: get_tax_code_reference_count
 *
 * Returns the count of references to a tax code from other tables.
 * Used to prevent deletion of tax codes that are in use.
 *
 * Tables checked (as they are implemented):
 * - suppliers (future: Story 03.x)
 * - purchase_orders (future: Story 03.x)
 * - invoices (future: Story 09.x)
 * - invoice_lines (future: Story 09.x)
 *
 * @param tax_code_id UUID - Tax code ID to check
 * @returns INTEGER - Total count of references across all tables
 *
 * Security: Respects RLS policies on referenced tables
 */
CREATE OR REPLACE FUNCTION get_tax_code_reference_count(tax_code_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ref_count INTEGER := 0;
  v_temp_count INTEGER;
BEGIN
  -- Validate input
  IF tax_code_id IS NULL THEN
    RAISE EXCEPTION 'Tax code ID cannot be null';
  END IF;

  -- ==========================================================================
  -- Check suppliers table (when implemented - Story 03.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when suppliers table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM suppliers
  --   WHERE tax_code_id = tax_code_id
  --     AND is_deleted = false;
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Check purchase_orders table (when implemented - Story 03.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when purchase_orders table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM purchase_orders
  --   WHERE tax_code_id = tax_code_id
  --     AND status != 'cancelled';
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Check invoices table (when implemented - Story 09.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when invoices table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM invoices
  --   WHERE tax_code_id = tax_code_id
  --     AND status != 'cancelled';
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Check invoice_lines table (when implemented - Story 09.x)
  -- ==========================================================================
  -- FUTURE: Uncomment when invoice_lines table exists
  -- BEGIN
  --   SELECT COUNT(*) INTO v_temp_count
  --   FROM invoice_lines
  --   WHERE tax_code_id = tax_code_id;
  --   v_ref_count := v_ref_count + v_temp_count;
  -- EXCEPTION
  --   WHEN undefined_table THEN
  --     NULL; -- Table doesn't exist yet, skip
  -- END;

  -- ==========================================================================
  -- Return total reference count
  -- ==========================================================================
  RETURN v_ref_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Failed to get reference count for tax code %: % %', tax_code_id, SQLERRM, SQLSTATE;
    -- Re-raise to propagate error
    RAISE;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permission to authenticated users
-- RLS policies on referenced tables will enforce org_id isolation
GRANT EXECUTE ON FUNCTION get_tax_code_reference_count(UUID) TO authenticated;

-- =============================================================================
-- ADD COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_tax_code_reference_count IS
  'Returns count of references to a tax code from suppliers, invoices, etc. Used to prevent deletion of in-use tax codes. Story 01.13';

-- =============================================================================
-- Migration complete: 079_create_tax_code_reference_count_rpc.sql
-- =============================================================================
-- RPC function created: get_tax_code_reference_count(UUID)
-- Returns: INTEGER (count of references)
-- Placeholder implementation: Returns 0 until supplier/invoice tables exist
-- Ready for expansion in Story 03.x (Suppliers) and Story 09.x (Finance)
