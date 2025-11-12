-- Migration: 050_wo_order_flags.sql
-- Description: Add order_flags and context fields to work_orders for conditional BOM evaluation
-- Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: work_orders
-- Add order context fields for conditional material selection
-- ============================================================================

-- Add order_flags array (e.g., ['organic', 'gluten_free', 'vegan'])
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS order_flags TEXT[] DEFAULT '{}';

-- Add customer_id for customer-specific conditions
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS customer_id INTEGER;

-- Add order_type for type-based conditions (e.g., 'standard', 'export', 'premium')
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(50);

-- ============================================================================
-- INDEXES
-- Add indexes for efficient filtering
-- ============================================================================

-- GIN index for order_flags array queries
CREATE INDEX IF NOT EXISTS idx_work_orders_order_flags 
  ON work_orders USING GIN (order_flags)
  WHERE order_flags IS NOT NULL AND array_length(order_flags, 1) > 0;

-- B-tree index for customer_id
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id 
  ON work_orders (customer_id)
  WHERE customer_id IS NOT NULL;

-- B-tree index for order_type
CREATE INDEX IF NOT EXISTS idx_work_orders_order_type 
  ON work_orders (order_type)
  WHERE order_type IS NOT NULL;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN work_orders.order_flags IS 
'Array of order-specific flags used for conditional BOM material selection.
Example: [''organic'', ''gluten_free'', ''vegan'']
These flags are evaluated against bom_items.condition to determine which materials are required.';

COMMENT ON COLUMN work_orders.customer_id IS 
'Optional customer ID for customer-specific material conditions.
Can be used in bom_items.condition rules like {"field": "customer_id", "operator": "equals", "value": "123"}';

COMMENT ON COLUMN work_orders.order_type IS 
'Optional order type for type-based material conditions.
Examples: ''standard'', ''export'', ''premium'', ''sample''
Can be used in condition rules to select different packaging or materials.';

-- ============================================================================
-- EXAMPLE WORK ORDERS WITH FLAGS
-- ============================================================================

/*
Example 1: Organic product order
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, status)
VALUES ('WO-2025-001', 123, 100, ARRAY['organic'], 'planned');

Example 2: Gluten-free AND vegan order
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, status)
VALUES ('WO-2025-002', 123, 50, ARRAY['gluten_free', 'vegan'], 'planned');

Example 3: Customer-specific with custom packaging
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, customer_id, status)
VALUES ('WO-2025-003', 123, 200, ARRAY['custom_packaging'], 456, 'planned');

Example 4: Export order with premium packaging
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, order_type, status)
VALUES ('WO-2025-004', 123, 500, ARRAY['premium'], 'export', 'planned');

-- Query materials for a specific WO
SELECT * FROM evaluate_bom_materials(
  123,  -- BOM ID
  jsonb_build_object(
    'order_flags', ARRAY['organic', 'gluten_free'],
    'customer_id', 456,
    'order_type', 'export'
  )
);
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

