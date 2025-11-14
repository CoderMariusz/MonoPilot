-- Migration 057: Add warehouse_id to po_header table
-- Purpose: Fix PO Header warehouse_id (CRITICAL) - Required for GRN routing
-- Story: 0.1 - Fix PO Header warehouse_id
-- Epic: Epic 0 - P0 Modules Data Integrity Audit & Fix
-- Date: 2025-11-14

-- ============================================================================
-- PRECONDITION CHECK: Ensure warehouses table has data
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM warehouses LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot add warehouse_id: warehouses table is empty. Please seed warehouse data first.';
  END IF;
END $$;

-- ============================================================================
-- ALTER TABLE: po_header
-- Add warehouse_id column with foreign key constraint
-- ============================================================================

-- Add warehouse_id column (NULLABLE for migration safety)
ALTER TABLE po_header
  ADD COLUMN IF NOT EXISTS warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE RESTRICT;

-- ============================================================================
-- DATA MIGRATION: Set default warehouse_id for existing PO rows
-- ============================================================================

-- Set default warehouse_id for existing PO rows
-- Uses first available warehouse (ordered by ID)
UPDATE po_header
SET warehouse_id = (SELECT id FROM warehouses ORDER BY id LIMIT 1)
WHERE warehouse_id IS NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Create index CONCURRENTLY to avoid table locks during production deployment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_po_header_warehouse_id
  ON po_header(warehouse_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN po_header.warehouse_id IS
'Destination warehouse for this Purchase Order (required for GRN routing). Determines where materials will be received.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
