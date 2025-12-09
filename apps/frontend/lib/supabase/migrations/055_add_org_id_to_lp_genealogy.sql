-- Migration 055: Add org_id to lp_genealogy
-- Story 5.29: Genealogy Recording
-- Add org_id for multi-tenancy and improved RLS

-- ============================================
-- 1. Add org_id column (nullable first)
-- ============================================
ALTER TABLE lp_genealogy
  ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================
-- 2. Backfill org_id from parent_lp_id
-- ============================================
UPDATE lp_genealogy
SET org_id = lp.org_id
FROM license_plates lp
WHERE lp_genealogy.parent_lp_id = lp.id
  AND lp_genealogy.org_id IS NULL;

-- ============================================
-- 3. Make org_id NOT NULL
-- ============================================
ALTER TABLE lp_genealogy
  ALTER COLUMN org_id SET NOT NULL;

-- ============================================
-- 4. Add index for multi-tenancy
-- ============================================
CREATE INDEX idx_lp_genealogy_org ON lp_genealogy(org_id);

-- ============================================
-- 5. Update RLS policies to use org_id directly
-- ============================================
-- Drop old policies
DROP POLICY IF EXISTS "Users can view genealogy in their org" ON lp_genealogy;
DROP POLICY IF EXISTS "Technical/Admin/QC can create genealogy" ON lp_genealogy;

-- SELECT: Users can view genealogy in their org
CREATE POLICY "Users can view genealogy in their org"
  ON lp_genealogy FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- INSERT: Warehouse/Production/Technical/Admin can create genealogy
CREATE POLICY "Authorized roles can create genealogy"
  ON lp_genealogy FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('warehouse', 'production', 'technical', 'admin', 'qc_manager')
  );

-- ============================================
-- 6. Update comments
-- ============================================
COMMENT ON COLUMN lp_genealogy.org_id IS 'Organization ID for multi-tenancy (Story 5.29)';

-- ============================================
-- 7. Verification
-- ============================================
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  -- Check no nulls
  SELECT COUNT(*) INTO v_null_count
  FROM lp_genealogy
  WHERE org_id IS NULL;

  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'FAILED: Found % rows with NULL org_id', v_null_count;
  END IF;

  -- Check index exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_lp_genealogy_org'
  ) THEN
    RAISE EXCEPTION 'FAILED: Index idx_lp_genealogy_org not created';
  END IF;

  RAISE NOTICE '✓ SUCCESS: lp_genealogy.org_id added and backfilled';
END $$;
