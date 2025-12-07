-- Migration 052: Add sequence and updated_at to asn_items
-- Epic 5 Batch 05A-3 - Story 5.9: ASN Item Management
-- Date: 2025-12-07

-- ============================================
-- 1. Add sequence column for ordering
-- ============================================

ALTER TABLE asn_items
  ADD COLUMN IF NOT EXISTS sequence INTEGER NOT NULL DEFAULT 1;

ALTER TABLE asn_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 2. Add index for sequence ordering
-- ============================================

CREATE INDEX IF NOT EXISTS idx_asn_items_sequence
  ON asn_items(asn_id, sequence);

-- ============================================
-- 3. Auto-update updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_asn_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_asn_items_updated_at ON asn_items;
CREATE TRIGGER trigger_asn_items_updated_at
  BEFORE UPDATE ON asn_items
  FOR EACH ROW
  EXECUTE FUNCTION update_asn_items_updated_at();

-- ============================================
-- 4. Verification
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asn_items' AND column_name = 'sequence')
  THEN
    RAISE NOTICE '✓ SUCCESS: ASN items sequence migration complete';
  ELSE
    RAISE EXCEPTION 'FAILED: Missing sequence column';
  END IF;
END $$;
