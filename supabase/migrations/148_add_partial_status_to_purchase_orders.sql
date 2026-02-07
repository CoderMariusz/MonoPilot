-- Migration: Add 'partial' status to purchase_orders
-- Story: BUG-082 - Fix Scanner/Receive 0 lines issue
-- Date: 2026-02-07
--
-- The scanner receive service uses 'partial' status for POs that have been
-- partially received, but this status was missing from the constraint.
-- This migration adds 'partial' to the allowed PO statuses.
--
-- See: apps/frontend/lib/services/scanner-receive-service.ts
-- RECEIVABLE_STATUSES = ['approved', 'confirmed', 'partial']

-- Update the status constraint to include 'partial'
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
  
  -- Add updated constraint with 'partial' status
  ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check
    CHECK (status IN (
      'draft',
      'submitted', 
      'pending_approval', 
      'approved', 
      'rejected', 
      'confirmed',
      'partial',      -- NEW: Added for partial receipt tracking
      'receiving', 
      'closed', 
      'cancelled'
    ));
END $$;

-- Comment for documentation
COMMENT ON COLUMN purchase_orders.status IS 
  'PO lifecycle status: draft → submitted → pending_approval → approved → confirmed → partial/receiving → closed | rejected/cancelled. partial = some lines fully received; receiving = active receipt in progress';
