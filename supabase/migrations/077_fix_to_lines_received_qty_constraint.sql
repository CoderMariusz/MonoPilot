-- Migration: Fix transfer_order_lines received_qty constraint
-- Story: 03.9a - TO Partial Shipments (Basic)
-- Issue: CRITICAL-DB-01 - Wrong Database Constraint
-- Date: 2025-01-01
--
-- Problem:
-- Original constraint: received_qty <= quantity (incorrect)
-- Correct constraint: received_qty <= shipped_qty
--
-- Rationale:
-- You can only receive items that have been shipped. A line might have:
-- - quantity: 100 (originally requested)
-- - shipped_qty: 50 (partial shipment)
-- - received_qty: 50 (can only receive what was shipped)
--
-- The old constraint allowed receiving 100 even if only 50 were shipped.

-- ============================================================================
-- DROP OLD CONSTRAINT
-- ============================================================================

ALTER TABLE transfer_order_lines
DROP CONSTRAINT IF EXISTS transfer_order_lines_received_qty_limit;

-- ============================================================================
-- ADD CORRECTED CONSTRAINT
-- ============================================================================

-- New constraint: received_qty cannot exceed shipped_qty
-- This enforces the business rule that you can only receive what was shipped
ALTER TABLE transfer_order_lines
ADD CONSTRAINT transfer_order_lines_received_qty_limit
CHECK (received_qty <= shipped_qty);

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON CONSTRAINT transfer_order_lines_received_qty_limit ON transfer_order_lines IS
'CRITICAL-DB-01 fix: Ensures received_qty cannot exceed shipped_qty (not quantity). You can only receive what has been shipped.';
