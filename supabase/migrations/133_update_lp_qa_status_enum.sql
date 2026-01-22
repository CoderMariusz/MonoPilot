-- =============================================================================
-- Migration 133: Update License Plates QA Status to use Enum (Story 06.1)
-- Purpose: Convert license_plates.qa_status to quality_status_type enum
-- =============================================================================

-- Note: The license_plates table uses lowercase text values for qa_status
-- (pending, passed, failed, quarantine). We need to:
-- 1. Add new column with enum type
-- 2. Migrate existing data (mapping lowercase to uppercase enum)
-- 3. Drop old column and rename new one

-- Step 1: Add new column with enum type
ALTER TABLE license_plates ADD COLUMN IF NOT EXISTS qa_status_new quality_status_type DEFAULT 'PENDING';

-- Step 2: Migrate existing data (map old text values to enum)
UPDATE license_plates
SET qa_status_new = CASE
  WHEN UPPER(qa_status) = 'PENDING' THEN 'PENDING'::quality_status_type
  WHEN UPPER(qa_status) = 'PASSED' THEN 'PASSED'::quality_status_type
  WHEN UPPER(qa_status) = 'FAILED' THEN 'FAILED'::quality_status_type
  WHEN UPPER(qa_status) = 'QUARANTINE' THEN 'QUARANTINED'::quality_status_type
  WHEN UPPER(qa_status) = 'QUARANTINED' THEN 'QUARANTINED'::quality_status_type
  WHEN UPPER(qa_status) = 'HOLD' THEN 'HOLD'::quality_status_type
  WHEN UPPER(qa_status) = 'RELEASED' THEN 'RELEASED'::quality_status_type
  WHEN UPPER(qa_status) = 'COND_APPROVED' THEN 'COND_APPROVED'::quality_status_type
  ELSE 'PENDING'::quality_status_type
END;

-- Step 3: Drop old column
ALTER TABLE license_plates DROP COLUMN IF EXISTS qa_status;

-- Step 4: Rename new column
ALTER TABLE license_plates RENAME COLUMN qa_status_new TO qa_status;

-- Step 5: Set constraints
ALTER TABLE license_plates ALTER COLUMN qa_status SET NOT NULL;
ALTER TABLE license_plates ALTER COLUMN qa_status SET DEFAULT 'PENDING';

-- Step 6: Create index for QA status filtering
CREATE INDEX IF NOT EXISTS idx_lp_qa_status_enum ON license_plates(org_id, qa_status);

-- Drop old index if exists (using old CHECK constraint approach)
DROP INDEX IF EXISTS idx_lp_org_qa;
