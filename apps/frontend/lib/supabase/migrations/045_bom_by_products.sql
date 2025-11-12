-- Migration: 045_bom_by_products.sql
-- Description: Enhance bom_items table to support by-products
-- Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
-- Created: 2025-01-11

-- ============================================================================
-- ALTER TABLE: bom_items
-- Add columns to distinguish between input materials and output by-products
-- ============================================================================

-- Add by-product flag (default FALSE = input material)
ALTER TABLE bom_items 
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT FALSE;

-- Add yield percentage for by-products (e.g., 15% bones from 100kg meat)
ALTER TABLE bom_items 
  ADD COLUMN IF NOT EXISTS yield_percentage NUMERIC(5,2);

-- Add constraint: yield_percentage only valid for by-products
ALTER TABLE bom_items 
  ADD CONSTRAINT bom_items_yield_percentage_check 
  CHECK (
    (is_by_product = FALSE AND yield_percentage IS NULL) OR
    (is_by_product = TRUE AND yield_percentage > 0 AND yield_percentage <= 100)
  );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN bom_items.is_by_product IS 'True if this item is an OUTPUT (by-product), false if INPUT (material). By-products are created when WO completes, materials are consumed.';

COMMENT ON COLUMN bom_items.yield_percentage IS 'Expected yield % for by-products (e.g., 15.00 means 15% of main output quantity). Only applies when is_by_product = TRUE. NULL for input materials.';

-- ============================================================================
-- DATA MIGRATION
-- Existing bom_items are inputs (materials), not by-products
-- ============================================================================

-- Ensure all existing rows have is_by_product = FALSE
UPDATE bom_items 
SET is_by_product = FALSE 
WHERE is_by_product IS NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

