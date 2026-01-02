-- Migration: Create PO Approval History Table
-- Story: 03.5b - PO Approval Workflow
-- Date: 2026-01-02
--
-- This table tracks all PO approval workflow actions (submit, approve, reject).
-- It is append-only - records are never updated or deleted manually.
-- Uses ADR-013 RLS pattern for org_id isolation.

-- Create approval history table
CREATE TABLE IF NOT EXISTS po_approval_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  po_id             UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  action            TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected')),
  user_id           UUID NOT NULL REFERENCES users(id),
  user_name         TEXT NOT NULL,
  user_role         TEXT NOT NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique within org (for RLS optimization)
  CONSTRAINT po_approval_history_org_unique UNIQUE(org_id, id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_po_approval_history_po ON po_approval_history(po_id);
CREATE INDEX IF NOT EXISTS idx_po_approval_history_created ON po_approval_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_approval_history_org ON po_approval_history(org_id);

-- Enable RLS
ALTER TABLE po_approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (ADR-013 pattern)

-- SELECT: Users can read approval history for their org
CREATE POLICY "po_approval_history_select"
ON po_approval_history FOR SELECT
TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Users can create approval history for their org
CREATE POLICY "po_approval_history_insert"
ON po_approval_history FOR INSERT
TO authenticated
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Append-only: No updates allowed (immutable audit log)
CREATE POLICY "po_approval_history_no_update"
ON po_approval_history FOR UPDATE
TO authenticated
USING (false);

-- Append-only: No manual deletes allowed (CASCADE from PO deletion is OK)
CREATE POLICY "po_approval_history_no_delete"
ON po_approval_history FOR DELETE
TO authenticated
USING (false);

-- Comment for documentation
COMMENT ON TABLE po_approval_history IS 'Tracks PO approval workflow actions (submit, approve, reject) - Story 03.5b';
COMMENT ON COLUMN po_approval_history.action IS 'Workflow action: submitted, approved, or rejected';
COMMENT ON COLUMN po_approval_history.user_name IS 'Denormalized user name for historical accuracy';
COMMENT ON COLUMN po_approval_history.user_role IS 'Denormalized user role for historical accuracy';
COMMENT ON COLUMN po_approval_history.notes IS 'Approval notes or rejection reason';

-- Update purchase_orders status CHECK constraint to include approval statuses
-- First drop existing constraint if it exists, then recreate with new values
DO $$
BEGIN
  -- Check if status constraint exists and needs updating
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'purchase_orders_status_check'
  ) THEN
    -- The constraint already exists, check if it needs approval statuses
    -- Drop and recreate to ensure all statuses are included
    ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check
      CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'confirmed', 'receiving', 'closed', 'cancelled'));
  END IF;
END $$;
