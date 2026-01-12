-- Migration 110: Add Over-Receipt Columns to GRN Items (Story 05.13)
-- Purpose: Track over-receipt flag and percentage per GRN item for audit and reporting
-- Phase: GREEN

-- Add over_receipt tracking columns to grn_items
DO $$
BEGIN
    -- Add over_receipt_flag column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'grn_items' AND column_name = 'over_receipt_flag') THEN
        ALTER TABLE grn_items ADD COLUMN over_receipt_flag BOOLEAN DEFAULT false;
        COMMENT ON COLUMN grn_items.over_receipt_flag IS 'True if received quantity exceeds ordered quantity';
    END IF;

    -- Add over_receipt_percentage column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'grn_items' AND column_name = 'over_receipt_percentage') THEN
        ALTER TABLE grn_items ADD COLUMN over_receipt_percentage DECIMAL(5,2) DEFAULT 0.00;
        COMMENT ON COLUMN grn_items.over_receipt_percentage IS 'Percentage over/under ordered quantity. Positive = over, Negative = under';
    END IF;
END$$;

-- Add index for over_receipt_flag for reporting queries
CREATE INDEX IF NOT EXISTS idx_grn_items_over_receipt
    ON grn_items(over_receipt_flag)
    WHERE over_receipt_flag = true;

-- Comment for the story
COMMENT ON TABLE grn_items IS 'GRN line items - products received per GRN. Includes over-receipt tracking (Story 05.13)';
