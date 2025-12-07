-- Migration 047: Fix lp_genealogy relationship_type constraint
-- Date: 2025-12-07
-- Priority: P0 CRITICAL
-- Issue: Code uses 'production' but constraint only allows ('split', 'combine', 'transform')

-- ============================================
-- 1. Drop old constraint
-- ============================================
ALTER TABLE lp_genealogy
  DROP CONSTRAINT IF EXISTS lp_genealogy_type_check;

-- ============================================
-- 2. Add updated constraint with 'production' type
-- ============================================
ALTER TABLE lp_genealogy
  ADD CONSTRAINT lp_genealogy_type_check CHECK (
    relationship_type IN ('split', 'combine', 'transform', 'production')
  );

-- ============================================
-- 3. Update comment
-- ============================================
COMMENT ON COLUMN lp_genealogy.relationship_type IS
  'Type: split (1→many), combine (many→1), transform (WO production), production (output registration)';

-- ============================================
-- 4. Verification
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'lp_genealogy_type_check'
  ) THEN
    RAISE NOTICE '✓ SUCCESS: lp_genealogy relationship_type constraint updated to include production';
  ELSE
    RAISE EXCEPTION 'FAILED: Constraint not created';
  END IF;
END $$;
