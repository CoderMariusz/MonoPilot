-- Migration 096: Add ASN Items Variance Columns (Story 05.9)
-- Purpose: Add variance tracking columns to asn_items table for receive workflow
-- Phase: GREEN

-- Add variance columns to asn_items
ALTER TABLE asn_items
  ADD COLUMN IF NOT EXISTS variance_reason TEXT,
  ADD COLUMN IF NOT EXISTS variance_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_received_at TIMESTAMPTZ;

-- Check constraint for variance_reason
ALTER TABLE asn_items
  DROP CONSTRAINT IF EXISTS asn_items_variance_reason_check;

ALTER TABLE asn_items
  ADD CONSTRAINT asn_items_variance_reason_check
  CHECK (variance_reason IS NULL OR variance_reason IN ('damaged', 'short-shipped', 'over-shipped', 'other'));

-- Index for variance tracking queries
CREATE INDEX IF NOT EXISTS idx_asn_items_variance
  ON asn_items(asn_id)
  WHERE received_qty != expected_qty;

-- Comments for documentation
COMMENT ON COLUMN asn_items.variance_reason IS 'Reason for qty variance: damaged, short-shipped, over-shipped, other';
COMMENT ON COLUMN asn_items.variance_notes IS 'Additional notes explaining variance';
COMMENT ON COLUMN asn_items.last_received_at IS 'Timestamp of last receive operation against this item';
