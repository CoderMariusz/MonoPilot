-- Migration 054: Add Source Document Tracking to License Plates
-- Story 5.30: Source Document Linking
-- Date: 2025-12-07

-- ============================================
-- 1. Add source tracking columns to license_plates
-- ============================================

ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source_grn_id UUID REFERENCES goods_receipt_notes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_wo_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_to_id UUID REFERENCES transfer_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;

-- ============================================
-- 2. Add constraints
-- ============================================

ALTER TABLE license_plates
  ADD CONSTRAINT license_plates_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('receiving', 'production', 'transfer', 'manual'));

-- ============================================
-- 3. Add indexes for source lookups
-- ============================================

CREATE INDEX IF NOT EXISTS idx_license_plates_source_grn_id
  ON license_plates(source_grn_id) WHERE source_grn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_license_plates_source_wo_id
  ON license_plates(source_wo_id) WHERE source_wo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_license_plates_source_to_id
  ON license_plates(source_to_id) WHERE source_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_license_plates_source_po_id
  ON license_plates(source_po_id) WHERE source_po_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_license_plates_source_type
  ON license_plates(source_type) WHERE source_type IS NOT NULL;

-- ============================================
-- 4. Comments
-- ============================================

COMMENT ON COLUMN license_plates.source_type IS 'Source document type: receiving, production, transfer, manual';
COMMENT ON COLUMN license_plates.source_grn_id IS 'GRN that created this LP (if source_type=receiving)';
COMMENT ON COLUMN license_plates.source_wo_id IS 'Work Order that created this LP (if source_type=production)';
COMMENT ON COLUMN license_plates.source_to_id IS 'Transfer Order that created this LP (if source_type=transfer)';
COMMENT ON COLUMN license_plates.source_po_id IS 'Purchase Order reference (if source_type=receiving)';

-- ============================================
-- 5. Verification
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_plates'
      AND column_name IN ('source_type', 'source_grn_id', 'source_wo_id', 'source_to_id', 'source_po_id')
  ) THEN
    RAISE NOTICE '✓ SUCCESS: Source document tracking migration complete';
  ELSE
    RAISE EXCEPTION 'FAILED: Missing source tracking columns';
  END IF;
END $$;
