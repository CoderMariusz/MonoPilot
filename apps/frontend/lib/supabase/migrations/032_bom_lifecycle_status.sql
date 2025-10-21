-- Migration 032: BOM Status & Lifecycle Guards
-- This migration adds proper BOM status management with lifecycle guards

-- Create BOM status enum
DO $$ BEGIN
  CREATE TYPE bom_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add status and lifecycle columns to boms table
ALTER TABLE boms
  ADD COLUMN IF NOT EXISTS status bom_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

-- Create unique index for single active BOM per product
CREATE UNIQUE INDEX IF NOT EXISTS boms_single_active_idx
  ON boms(product_id) WHERE status = 'active';

-- Create function to guard hard delete
CREATE OR REPLACE FUNCTION guard_boms_hard_delete() RETURNS trigger AS $$
BEGIN
  -- Block hard delete if BOM is not in draft status
  IF OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'Cannot hard-delete non-draft BOM. Status: %', OLD.status;
  END IF;
  
  -- Block hard delete if BOM is referenced by work orders
  IF EXISTS (SELECT 1 FROM work_orders WHERE bom_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot hard-delete BOM referenced by Work Orders';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hard delete guard
DROP TRIGGER IF EXISTS trg_boms_guard_delete ON boms;
CREATE TRIGGER trg_boms_guard_delete
  BEFORE DELETE ON boms
  FOR EACH ROW EXECUTE FUNCTION guard_boms_hard_delete();

-- Add comments for documentation
COMMENT ON COLUMN boms.status IS 'BOM lifecycle status: draft, active, or archived';
COMMENT ON COLUMN boms.archived_at IS 'Timestamp when BOM was archived';
COMMENT ON COLUMN boms.deleted_at IS 'Timestamp when BOM was soft deleted';
COMMENT ON INDEX boms_single_active_idx IS 'Ensures only one active BOM per product';
