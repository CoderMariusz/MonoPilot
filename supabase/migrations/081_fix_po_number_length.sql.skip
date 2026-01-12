-- Migration: Fix po_number column length
-- Story: 03.3 - PO CRUD + Lines (Bug Fix)
-- Date: 2025-12-31
--
-- Extends po_number from VARCHAR(20) to VARCHAR(50) to accommodate
-- longer test values and future extensions

ALTER TABLE purchase_orders
  ALTER COLUMN po_number TYPE VARCHAR(50);

-- Comment update
COMMENT ON COLUMN purchase_orders.po_number IS 'PO number - auto-generated as PO-YYYY-NNNNN or manually specified (max 50 chars)';
