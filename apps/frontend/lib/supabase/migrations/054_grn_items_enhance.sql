-- Migration: 054_grn_items_enhance.sql
-- Description: Enhance grn_items to match ASN items structure
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: grn_items
-- Add UOM and notes to match ASN items
-- ============================================================================

ALTER TABLE grn_items
  ADD COLUMN IF NOT EXISTS uom VARCHAR(20),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Set default UOM from products for existing rows
UPDATE grn_items gi
SET uom = p.uom
FROM products p
WHERE gi.product_id = p.id
  AND gi.uom IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN grn_items.uom IS 
'Unit of measure for the received quantity. Should match product base UOM.';

COMMENT ON COLUMN grn_items.notes IS 
'Optional notes for this GRN item (copied from ASN item if received from ASN).';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

