-- Migration 047: Packaging Fields
-- Purpose: Add boxes_per_pallet and packs_per_box to products table
-- Date: 2025-01-22

-- Add packaging fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS boxes_per_pallet INTEGER,
  ADD COLUMN IF NOT EXISTS packs_per_box INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN products.boxes_per_pallet IS 'Number of boxes that fit on one pallet';
COMMENT ON COLUMN products.packs_per_box IS 'Number of packs (units) that fit in one box';


