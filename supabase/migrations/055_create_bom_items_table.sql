-- ============================================================================
-- Migration: 055_create_bom_items_table.sql
-- Story: 02.5a - BOM Items Core (MVP)
-- Purpose: Create bom_items table for BOM component/ingredient management
-- Author: Backend Dev Agent
-- Date: 2025-12-28
-- Related: ADR-013 (RLS Pattern), FR-2.21, FR-2.31, FR-2.38, FR-2.39
-- ============================================================================

-- ============================================================================
-- PURPOSE
-- ============================================================================
-- Create the bom_items table to store BOM line items (ingredients/components):
-- - Links components to BOMs with quantity and UoM
-- - Sequence ordering for production steps
-- - Optional operation assignment (for routing integration)
-- - Scrap percentage for material loss estimation
-- - Notes for production instructions

BEGIN;

-- ============================================================================
-- CREATE TABLE: bom_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS bom_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to parent BOM (CASCADE delete - when BOM deleted, items deleted)
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,

  -- Foreign key to component product (RESTRICT delete - cannot delete product used in BOM)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Sequence number for ordering (auto-increment by 10 in service layer)
  sequence INTEGER NOT NULL DEFAULT 0,

  -- Quantity and unit of measure
  quantity DECIMAL(15,6) NOT NULL,
  uom TEXT NOT NULL,

  -- Optional operation assignment (INTEGER reference to routing_operations.sequence)
  -- No FK constraint for MVP - just stores the sequence number
  operation_seq INTEGER,

  -- Scrap allowance percentage (0-100)
  scrap_percent DECIMAL(5,2) DEFAULT 0,

  -- Production notes (max 500 characters)
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Quantity must be positive (FR-2.39)
ALTER TABLE bom_items
ADD CONSTRAINT bom_items_quantity_positive
CHECK (quantity > 0);

-- Sequence must be non-negative
ALTER TABLE bom_items
ADD CONSTRAINT bom_items_sequence_non_negative
CHECK (sequence >= 0);

-- Scrap percent must be 0-100
ALTER TABLE bom_items
ADD CONSTRAINT bom_items_scrap_percent_range
CHECK (scrap_percent >= 0 AND scrap_percent <= 100);

-- Notes max length (500 characters)
ALTER TABLE bom_items
ADD CONSTRAINT bom_items_notes_max_length
CHECK (notes IS NULL OR char_length(notes) <= 500);

-- Unique sequence per BOM (optional - allows duplicates for flexibility)
-- Note: If strict uniqueness needed, uncomment below:
-- ALTER TABLE bom_items ADD CONSTRAINT bom_items_unique_sequence UNIQUE(bom_id, sequence);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup: items by BOM
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_id
ON bom_items(bom_id);

-- Component lookup (for "which BOMs use this product" queries)
CREATE INDEX IF NOT EXISTS idx_bom_items_product_id
ON bom_items(product_id);

-- Sequence ordering within BOM
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_seq
ON bom_items(bom_id, sequence);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_bom_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_bom_items_updated_at ON bom_items;
CREATE TRIGGER trigger_bom_items_updated_at
BEFORE UPDATE ON bom_items
FOR EACH ROW
EXECUTE FUNCTION update_bom_items_updated_at();

-- ============================================================================
-- TRIGGER: UoM Validation (Warning only - FR-2.38)
-- ============================================================================
-- Validates that item UoM matches component's base_uom
-- Raises WARNING if mismatch (does NOT block save)

CREATE OR REPLACE FUNCTION validate_bom_item_uom()
RETURNS TRIGGER AS $$
DECLARE
  v_component_base_uom TEXT;
  v_component_code TEXT;
BEGIN
  -- Get component's base UoM
  SELECT base_uom, code INTO v_component_base_uom, v_component_code
  FROM products
  WHERE id = NEW.product_id;

  -- Warn if UoM mismatch (non-blocking)
  IF NEW.uom IS DISTINCT FROM v_component_base_uom THEN
    RAISE WARNING 'UoM mismatch: BOM item UoM (%) does not match component % base UoM (%). Unit conversion may be required.',
      NEW.uom, v_component_code, v_component_base_uom;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_bom_item_uom_validation ON bom_items;
CREATE TRIGGER trigger_bom_item_uom_validation
BEFORE INSERT OR UPDATE ON bom_items
FOR EACH ROW
EXECUTE FUNCTION validate_bom_item_uom();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner
ALTER TABLE bom_items FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICY: SELECT - Users can read items for BOMs in their org
-- ============================================================================

CREATE POLICY bom_items_select
ON bom_items
FOR SELECT
TO authenticated
USING (
  -- User can select items for BOMs that belong to their org
  bom_id IN (
    SELECT b.id
    FROM boms b
    WHERE b.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

-- ============================================================================
-- RLS POLICY: INSERT - Users with technical.C permission can create items
-- ============================================================================

CREATE POLICY bom_items_insert
ON bom_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- BOM must belong to user's org
  bom_id IN (
    SELECT b.id
    FROM boms b
    WHERE b.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND (
    -- User must have Create permission on technical module
    -- Role codes with technical.C: owner, admin, production_manager
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager')
  )
);

-- ============================================================================
-- RLS POLICY: UPDATE - Users with technical.U permission can modify items
-- ============================================================================

CREATE POLICY bom_items_update
ON bom_items
FOR UPDATE
TO authenticated
USING (
  -- BOM must belong to user's org
  bom_id IN (
    SELECT b.id
    FROM boms b
    WHERE b.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND (
    -- User must have Update permission on technical module
    -- Role codes with technical.U: owner, admin, production_manager, quality_manager
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager', 'quality_manager')
  )
);

-- ============================================================================
-- RLS POLICY: DELETE - Users with technical.D permission can delete items
-- ============================================================================

CREATE POLICY bom_items_delete
ON bom_items
FOR DELETE
TO authenticated
USING (
  -- BOM must belong to user's org
  bom_id IN (
    SELECT b.id
    FROM boms b
    WHERE b.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
  AND (
    -- User must have Delete permission on technical module
    -- Role codes with technical.D: owner, admin
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin')
  )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users (RLS controls row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON bom_items TO authenticated;

-- Grant full access to service_role
GRANT ALL ON bom_items TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bom_items IS 'BOM line items (ingredients/components) for Bills of Materials. Story 02.5a MVP.';

COMMENT ON COLUMN bom_items.id IS 'Primary key UUID';
COMMENT ON COLUMN bom_items.bom_id IS 'Foreign key to parent BOM (CASCADE delete)';
COMMENT ON COLUMN bom_items.product_id IS 'Foreign key to component product (RESTRICT delete)';
COMMENT ON COLUMN bom_items.sequence IS 'Order in production (auto: max+10). Default: 0';
COMMENT ON COLUMN bom_items.quantity IS 'Amount needed per batch. Must be > 0. Max 6 decimal places.';
COMMENT ON COLUMN bom_items.uom IS 'Unit of measure. Should match product base_uom (warning if mismatch).';
COMMENT ON COLUMN bom_items.operation_seq IS 'Optional routing operation sequence number (INTEGER reference).';
COMMENT ON COLUMN bom_items.scrap_percent IS 'Expected material loss percentage (0-100). Default: 0';
COMMENT ON COLUMN bom_items.notes IS 'Production notes. Max 500 characters.';
COMMENT ON COLUMN bom_items.created_at IS 'Creation timestamp';
COMMENT ON COLUMN bom_items.updated_at IS 'Last update timestamp (auto-updated via trigger)';
COMMENT ON COLUMN bom_items.created_by IS 'User who created the record';
COMMENT ON COLUMN bom_items.updated_by IS 'User who last updated the record';

COMMENT ON POLICY bom_items_select ON bom_items IS
  'All authenticated users can read items for BOMs within their organization';

COMMENT ON POLICY bom_items_insert ON bom_items IS
  'Only owner, admin, and production_manager can create BOM items';

COMMENT ON POLICY bom_items_update ON bom_items IS
  'Only owner, admin, production_manager, and quality_manager can update BOM items';

COMMENT ON POLICY bom_items_delete ON bom_items IS
  'Only owner and admin can delete BOM items';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'bom_items';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bom_items'
-- ORDER BY ordinal_position;
--
-- Check constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'bom_items';
--
-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'bom_items';
--
-- Check RLS policies:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'bom_items';
--
-- Test quantity constraint (should fail):
-- INSERT INTO bom_items (bom_id, product_id, quantity, uom)
-- VALUES ('some-bom-uuid', 'some-product-uuid', 0, 'kg');
-- ERROR: violates check constraint "bom_items_quantity_positive"
--
-- Test scrap range (should fail):
-- INSERT INTO bom_items (bom_id, product_id, quantity, uom, scrap_percent)
-- VALUES ('some-bom-uuid', 'some-product-uuid', 10, 'kg', 150);
-- ERROR: violates check constraint "bom_items_scrap_percent_range"
--
-- Test notes length (should fail):
-- INSERT INTO bom_items (bom_id, product_id, quantity, uom, notes)
-- VALUES ('some-bom-uuid', 'some-product-uuid', 10, 'kg', repeat('a', 501));
-- ERROR: violates check constraint "bom_items_notes_max_length"
--
-- Test cascade delete:
-- DELETE FROM boms WHERE id = 'some-bom-uuid';
-- (All bom_items with that bom_id should be deleted)
--
-- Test restrict delete on product:
-- DELETE FROM products WHERE id = 'product-used-in-bom';
-- ERROR: cannot delete because bom_items references it

-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_bom_item_uom_validation ON bom_items;
-- DROP TRIGGER IF EXISTS trigger_bom_items_updated_at ON bom_items;
-- DROP FUNCTION IF EXISTS validate_bom_item_uom();
-- DROP FUNCTION IF EXISTS update_bom_items_updated_at();
-- DROP POLICY IF EXISTS bom_items_select ON bom_items;
-- DROP POLICY IF EXISTS bom_items_insert ON bom_items;
-- DROP POLICY IF EXISTS bom_items_update ON bom_items;
-- DROP POLICY IF EXISTS bom_items_delete ON bom_items;
-- DROP TABLE IF EXISTS bom_items;
-- COMMIT;
