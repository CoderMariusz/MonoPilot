-- Migration: Protect immutable Transfer Order date fields
-- Story: 03.9a - TO Partial Shipments (Basic)
-- Issue: CRITICAL-BUG-01 - Race Condition on Immutable Dates
-- Date: 2025-01-01
--
-- Problem:
-- Concurrent requests can overwrite actual_ship_date/actual_receive_date
-- even though these should be immutable once set (on FIRST shipment/receipt only).
--
-- Solution:
-- Database trigger that prevents changing these fields once they are set.
-- This provides database-level protection against race conditions.

-- ============================================================================
-- TRIGGER FUNCTION: Protect immutable date fields
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_transfer_order_immutable_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect actual_ship_date: once set, cannot be changed
  IF OLD.actual_ship_date IS NOT NULL AND NEW.actual_ship_date IS DISTINCT FROM OLD.actual_ship_date THEN
    RAISE EXCEPTION 'Cannot modify actual_ship_date once it is set. Current value: %', OLD.actual_ship_date;
  END IF;

  -- Protect shipped_by: once set, cannot be changed
  IF OLD.shipped_by IS NOT NULL AND NEW.shipped_by IS DISTINCT FROM OLD.shipped_by THEN
    RAISE EXCEPTION 'Cannot modify shipped_by once it is set. Current value: %', OLD.shipped_by;
  END IF;

  -- Protect actual_receive_date: once set, cannot be changed
  IF OLD.actual_receive_date IS NOT NULL AND NEW.actual_receive_date IS DISTINCT FROM OLD.actual_receive_date THEN
    RAISE EXCEPTION 'Cannot modify actual_receive_date once it is set. Current value: %', OLD.actual_receive_date;
  END IF;

  -- Protect received_by: once set, cannot be changed
  IF OLD.received_by IS NOT NULL AND NEW.received_by IS DISTINCT FROM OLD.received_by THEN
    RAISE EXCEPTION 'Cannot modify received_by once it is set. Current value: %', OLD.received_by;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if any (for idempotency)
DROP TRIGGER IF EXISTS tr_transfer_orders_protect_immutable_dates ON transfer_orders;

-- Create the protection trigger
-- Runs BEFORE UPDATE to prevent the modification
CREATE TRIGGER tr_transfer_orders_protect_immutable_dates
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW
  EXECUTE FUNCTION protect_transfer_order_immutable_dates();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION protect_transfer_order_immutable_dates IS
'CRITICAL-BUG-01 fix: Prevents race condition by blocking changes to actual_ship_date, actual_receive_date, shipped_by, and received_by once they are set. These fields should only be set on FIRST shipment/receipt.';

COMMENT ON TRIGGER tr_transfer_orders_protect_immutable_dates ON transfer_orders IS
'Database-level protection for immutable date fields. Prevents concurrent requests from overwriting first-set values.';
