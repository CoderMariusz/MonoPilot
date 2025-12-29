-- ============================================================================
-- Migration: 056_create_bom_alternatives_table.sql
-- Story: 02.6 - BOM Alternatives + Clone
-- Purpose: Create bom_alternatives table for alternative ingredient management
-- Author: Backend Dev Agent
-- Date: 2025-12-28
-- Related: ADR-013 (RLS Pattern), FR-2.30
-- ============================================================================

-- ============================================================================
-- PURPOSE
-- ============================================================================
-- Create the bom_alternatives table to store alternative ingredients for BOM items:
-- - Links alternative products to BOM items with quantity and UoM
-- - Preference ordering (2 = first alternative, 3 = second, etc.)
-- - Notes for substitution instructions
-- - Multi-tenant isolation via org_id and RLS

BEGIN;

-- ============================================================================
-- CREATE TABLE: bom_alternatives
-- ============================================================================

CREATE TABLE IF NOT EXISTS bom_alternatives (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to parent BOM item (CASCADE delete - when item deleted, alternatives deleted)
  bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,

  -- Organization for multi-tenancy (REQUIRED for RLS)
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Foreign key to alternative product (RESTRICT delete - cannot delete product used as alternative)
  alternative_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantity and unit of measure
  quantity DECIMAL(15,6) NOT NULL,
  uom TEXT NOT NULL,

  -- Preference order (1 = primary, 2+ = alternatives in order of preference)
  preference_order INTEGER NOT NULL DEFAULT 2,

  -- Substitution notes (max 500 characters)
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Quantity must be positive
ALTER TABLE bom_alternatives
ADD CONSTRAINT bom_alt_quantity_positive
CHECK (quantity > 0);

-- Preference order must be >= 2 (1 is reserved for primary)
ALTER TABLE bom_alternatives
ADD CONSTRAINT bom_alt_preference_order_check
CHECK (preference_order >= 2);

-- Notes max length (500 characters)
ALTER TABLE bom_alternatives
ADD CONSTRAINT bom_alt_notes_max_length
CHECK (notes IS NULL OR char_length(notes) <= 500);

-- Unique alternative per item (no duplicate alternatives)
ALTER TABLE bom_alternatives
ADD CONSTRAINT bom_alt_unique_per_item
UNIQUE (bom_item_id, alternative_product_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup: alternatives by BOM item
CREATE INDEX IF NOT EXISTS idx_bom_alternatives_bom_item_id
ON bom_alternatives(bom_item_id);

-- Ordered retrieval by preference
CREATE INDEX IF NOT EXISTS idx_bom_alternatives_preference
ON bom_alternatives(bom_item_id, preference_order);

-- RLS performance: org_id
CREATE INDEX IF NOT EXISTS idx_bom_alternatives_org_id
ON bom_alternatives(org_id);

-- Product lookup (for "which items use this product as alternative" queries)
CREATE INDEX IF NOT EXISTS idx_bom_alternatives_product_id
ON bom_alternatives(alternative_product_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE bom_alternatives ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner
ALTER TABLE bom_alternatives FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICY: SELECT - Users can read alternatives in their org
-- ============================================================================

CREATE POLICY bom_alternatives_select
ON bom_alternatives
FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- ============================================================================
-- RLS POLICY: INSERT - Users with technical.C permission can create alternatives
-- ============================================================================

CREATE POLICY bom_alternatives_insert
ON bom_alternatives
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    -- User must have Create permission on technical module
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager')
  )
);

-- ============================================================================
-- RLS POLICY: UPDATE - Users with technical.U permission can modify alternatives
-- ============================================================================

CREATE POLICY bom_alternatives_update
ON bom_alternatives
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    -- User must have Update permission on technical module
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager', 'quality_manager')
  )
);

-- ============================================================================
-- RLS POLICY: DELETE - Users with technical.D permission can delete alternatives
-- ============================================================================

CREATE POLICY bom_alternatives_delete
ON bom_alternatives
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    -- User must have Delete permission on technical module
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin')
  )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users (RLS controls row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON bom_alternatives TO authenticated;

-- Grant full access to service_role
GRANT ALL ON bom_alternatives TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bom_alternatives IS 'Alternative ingredients for BOM items with preference ordering. Story 02.6.';

COMMENT ON COLUMN bom_alternatives.id IS 'Primary key UUID';
COMMENT ON COLUMN bom_alternatives.bom_item_id IS 'Foreign key to parent BOM item (CASCADE delete)';
COMMENT ON COLUMN bom_alternatives.org_id IS 'Organization ID for multi-tenancy (RLS enforcement)';
COMMENT ON COLUMN bom_alternatives.alternative_product_id IS 'Foreign key to alternative product (RESTRICT delete)';
COMMENT ON COLUMN bom_alternatives.quantity IS 'Amount of alternative to use. Must be > 0. Max 6 decimal places.';
COMMENT ON COLUMN bom_alternatives.uom IS 'Unit of measure for alternative quantity.';
COMMENT ON COLUMN bom_alternatives.preference_order IS 'Order of preference: 2 = first alternative, 3 = second, etc. Must be >= 2.';
COMMENT ON COLUMN bom_alternatives.notes IS 'Substitution instructions. Max 500 characters.';
COMMENT ON COLUMN bom_alternatives.created_at IS 'Creation timestamp';

COMMENT ON POLICY bom_alternatives_select ON bom_alternatives IS
  'All authenticated users can read alternatives within their organization';

COMMENT ON POLICY bom_alternatives_insert ON bom_alternatives IS
  'Only owner, admin, and production_manager can create alternatives';

COMMENT ON POLICY bom_alternatives_update ON bom_alternatives IS
  'Only owner, admin, production_manager, and quality_manager can update alternatives';

COMMENT ON POLICY bom_alternatives_delete ON bom_alternatives IS
  'Only owner and admin can delete alternatives';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'bom_alternatives';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bom_alternatives'
-- ORDER BY ordinal_position;
--
-- Check constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'bom_alternatives';
--
-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'bom_alternatives';
--
-- Check RLS policies:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'bom_alternatives';
--
-- Check RLS is enabled:
-- SELECT rowsecurity FROM pg_tables WHERE tablename = 'bom_alternatives';
--
-- Test preference_order constraint (should fail):
-- INSERT INTO bom_alternatives (bom_item_id, org_id, alternative_product_id, quantity, uom, preference_order)
-- VALUES ('some-uuid', 'some-org', 'some-product', 10, 'kg', 1);
-- ERROR: violates check constraint "bom_alt_preference_order_check"
--
-- Test quantity constraint (should fail):
-- INSERT INTO bom_alternatives (bom_item_id, org_id, alternative_product_id, quantity, uom, preference_order)
-- VALUES ('some-uuid', 'some-org', 'some-product', 0, 'kg', 2);
-- ERROR: violates check constraint "bom_alt_quantity_positive"
--
-- Test unique constraint (should fail on duplicate):
-- INSERT INTO bom_alternatives (bom_item_id, org_id, alternative_product_id, quantity, uom, preference_order)
-- VALUES ('item-uuid', 'org-uuid', 'product-uuid', 10, 'kg', 2);
-- INSERT INTO bom_alternatives (bom_item_id, org_id, alternative_product_id, quantity, uom, preference_order)
-- VALUES ('item-uuid', 'org-uuid', 'product-uuid', 20, 'kg', 3);
-- ERROR: duplicate key value violates unique constraint "bom_alt_unique_per_item"

-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================
--
-- BEGIN;
-- DROP POLICY IF EXISTS bom_alternatives_select ON bom_alternatives;
-- DROP POLICY IF EXISTS bom_alternatives_insert ON bom_alternatives;
-- DROP POLICY IF EXISTS bom_alternatives_update ON bom_alternatives;
-- DROP POLICY IF EXISTS bom_alternatives_delete ON bom_alternatives;
-- DROP TABLE IF EXISTS bom_alternatives;
-- COMMIT;
