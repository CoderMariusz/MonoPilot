-- Migration 033: BOM Items PO Prefill Fields
-- This migration adds fields to bom_items for PO prefill functionality

-- Add PO prefill fields to bom_items table
ALTER TABLE bom_items
  ADD COLUMN IF NOT EXISTS tax_code_id integer NULL REFERENCES settings_tax_codes(id),
  ADD COLUMN IF NOT EXISTS lead_time_days integer NULL,
  ADD COLUMN IF NOT EXISTS moq numeric(12,4) NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bom_items_tax_code ON bom_items(tax_code_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_lead_time ON bom_items(lead_time_days);

-- Add check constraints for data validation
ALTER TABLE bom_items 
  ADD CONSTRAINT check_lead_time_positive 
  CHECK (lead_time_days IS NULL OR lead_time_days > 0);

ALTER TABLE bom_items 
  ADD CONSTRAINT check_moq_positive 
  CHECK (moq IS NULL OR moq > 0);

-- Add comments for documentation
COMMENT ON COLUMN bom_items.tax_code_id IS 'Tax code for PO prefill - references settings_tax_codes';
COMMENT ON COLUMN bom_items.lead_time_days IS 'Lead time in days for PO prefill';
COMMENT ON COLUMN bom_items.moq IS 'Minimum Order Quantity for PO prefill suggestion';
