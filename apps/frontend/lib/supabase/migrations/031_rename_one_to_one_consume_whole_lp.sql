-- Migration 031: Rename one_to_one to consume_whole_lp
-- This migration renames the one_to_one field to consume_whole_lp for better clarity

-- Rename column in bom_items table
ALTER TABLE bom_items 
  RENAME COLUMN one_to_one TO consume_whole_lp;

-- Add consume_whole_lp column to wo_materials if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wo_materials' AND column_name = 'consume_whole_lp'
    ) THEN
        ALTER TABLE wo_materials 
        ADD COLUMN consume_whole_lp BOOLEAN NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN wo_materials.consume_whole_lp IS 'Hard 1:1 rule for WO material consumption';
    END IF;
END $$;

-- Update comments for clarity
COMMENT ON COLUMN bom_items.consume_whole_lp IS 'Hard 1:1 rule - exactly one input LP to one output LP';
COMMENT ON COLUMN wo_materials.consume_whole_lp IS 'Hard 1:1 rule for WO material consumption';
