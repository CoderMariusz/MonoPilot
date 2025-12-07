-- Migration 051: Add Over-Receipt Handling
-- Epic 5 Batch 05A-3: Receiving
-- Story 5.10: Over-Receipt Handling
-- Date: 2025-12-07

-- ============================================
-- 1. Add over-receipt columns to grn_items
-- ============================================

ALTER TABLE grn_items
  ADD COLUMN IF NOT EXISTS is_over_receipt BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE grn_items
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

ALTER TABLE grn_items
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ============================================
-- 2. Update warehouse_settings (already has over_receipt columns from migration 048)
-- ============================================
-- Columns already exist:
-- - allow_over_receipt BOOLEAN DEFAULT false
-- - over_receipt_tolerance_percent DECIMAL(5,2) DEFAULT 0

-- ============================================
-- 3. Add indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_grn_items_over_receipt
  ON grn_items(grn_id) WHERE is_over_receipt = true;

CREATE INDEX IF NOT EXISTS idx_grn_items_approved_by
  ON grn_items(approved_by) WHERE approved_by IS NOT NULL;

-- ============================================
-- 4. Comments
-- ============================================

COMMENT ON COLUMN grn_items.is_over_receipt IS 'Flag indicating received qty exceeds expected qty beyond tolerance';
COMMENT ON COLUMN grn_items.approved_by IS 'Manager who approved over-receipt';
COMMENT ON COLUMN grn_items.approved_at IS 'Timestamp of over-receipt approval';

-- ============================================
-- 5. Verification
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grn_items' AND column_name = 'is_over_receipt')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grn_items' AND column_name = 'approved_by')
  THEN
    RAISE NOTICE '✓ SUCCESS: Over-receipt handling migration complete';
  ELSE
    RAISE EXCEPTION 'FAILED: Missing over-receipt columns';
  END IF;
END $$;
