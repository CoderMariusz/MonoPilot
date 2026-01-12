-- =============================================================================
-- Migration 104: Add block_reason Column to License Plates
-- Story: 05.6 - LP Detail + History
-- Purpose: Store reason when LP is blocked for display in unblock modal
-- =============================================================================

-- Add block_reason column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'license_plates' AND column_name = 'block_reason'
  ) THEN
    ALTER TABLE license_plates ADD COLUMN block_reason TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN license_plates.block_reason IS 'Reason for blocking LP, required when status=blocked';
