-- Migration 151: Fix Sales Orders Schema
-- Bug: BUG-007 - GET /api/shipping/sales-orders fails with "Failed to fetch sales orders"
-- Root cause: Missing line_count column + shipping_address_id should be nullable
-- Date: 2025-02-08

-- =============================================================================
-- 1. Add missing line_count column
-- =============================================================================

ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS line_count INTEGER DEFAULT 0;

COMMENT ON COLUMN sales_orders.line_count IS 'Number of lines in the order (denormalized for performance)';

-- =============================================================================
-- 2. Make shipping_address_id nullable (code allows null values)
-- =============================================================================

ALTER TABLE sales_orders 
ALTER COLUMN shipping_address_id DROP NOT NULL;

-- =============================================================================
-- 3. Remove created_by NOT NULL constraint for existing orders without it
-- (this column was added but may not always have a value during import)
-- =============================================================================

ALTER TABLE sales_orders 
ALTER COLUMN created_by DROP NOT NULL;

-- =============================================================================
-- Verification
-- =============================================================================

DO $$
BEGIN
  -- Check line_count exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_orders' AND column_name = 'line_count'
  ) THEN
    RAISE NOTICE '✅ line_count column added to sales_orders';
  ELSE
    RAISE EXCEPTION 'Failed to add line_count column!';
  END IF;

  -- Check shipping_address_id is nullable
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_orders' 
    AND column_name = 'shipping_address_id' 
    AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'Failed to make shipping_address_id nullable!';
  ELSE
    RAISE NOTICE '✅ shipping_address_id is now nullable';
  END IF;

  RAISE NOTICE '✅ Migration 151 completed successfully!';
END $$;
