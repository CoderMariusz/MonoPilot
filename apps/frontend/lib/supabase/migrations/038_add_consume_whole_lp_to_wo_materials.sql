-- Migration 038: Add consume_whole_lp to wo_materials
-- Story 4.9: 1:1 Consumption Enforcement
-- Date: 2025-12-03
--
-- This column is snapshot from bom_items.consume_whole_lp when WO is created
-- Used to enforce that entire LP must be consumed for allergen control

-- Add consume_whole_lp column
ALTER TABLE wo_materials
  ADD COLUMN IF NOT EXISTS consume_whole_lp BOOLEAN NOT NULL DEFAULT false;

-- Add consumed_qty column if not exists (needed for tracking)
ALTER TABLE wo_materials
  ADD COLUMN IF NOT EXISTS consumed_qty DECIMAL(15,6) NOT NULL DEFAULT 0;

-- Add constraint
ALTER TABLE wo_materials
  ADD CONSTRAINT wo_materials_consumed_qty_non_negative CHECK (consumed_qty >= 0);

-- Comment
COMMENT ON COLUMN wo_materials.consume_whole_lp IS 'Snapshot from BOM - if true, entire LP must be consumed (allergen control) - Story 4.9';
COMMENT ON COLUMN wo_materials.consumed_qty IS 'Total quantity consumed from reservations';

-- Update existing wo_materials from bom_items where possible
UPDATE wo_materials wm
SET consume_whole_lp = COALESCE(bi.consume_whole_lp, false)
FROM bom_items bi
WHERE wm.bom_item_id = bi.id
  AND wm.consume_whole_lp = false;
