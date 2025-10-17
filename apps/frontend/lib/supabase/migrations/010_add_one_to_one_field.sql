-- Migration 010: Add one_to_one field to bom_items table
-- This field indicates if a BOM component should consume the entire LP regardless of quantity

-- Add one_to_one field to bom_items table
ALTER TABLE bom_items 
ADD COLUMN one_to_one BOOLEAN DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN bom_items.one_to_one IS 'If true, consume entire LP regardless of quantity (1:1 LP relationship)';

-- Update existing records to have one_to_one = false by default
UPDATE bom_items SET one_to_one = false WHERE one_to_one IS NULL;
