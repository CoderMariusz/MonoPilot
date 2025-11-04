-- Migration 051: Add payment due date to Purchase Orders
-- This migration adds payment_due_date field to po_header table for tracking payment deadlines
-- separate from delivery dates

-- Add payment due date (separate from delivery dates)
ALTER TABLE po_header
  ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ;

-- Index for payment tracking (only for active orders)
CREATE INDEX IF NOT EXISTS idx_po_payment_due 
  ON po_header(payment_due_date) 
  WHERE status NOT IN ('closed', 'cancelled');

-- Add comment for documentation
COMMENT ON COLUMN po_header.payment_due_date IS 'Payment deadline (e.g., Net 30 from invoice date)';

