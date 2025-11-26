-- Migration: 024_add_updated_by_to_lines.sql
-- Description: Add audit fields (created_by, updated_by) to to_lines table
-- Purpose: Complete audit trail for TO line creation and updates (shipments, edits)
-- Story: 3.8 - Partial Shipments (audit trail)
-- Date: 2025-11-26

-- Add created_by column to to_lines
ALTER TABLE to_lines
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add updated_by column to to_lines
ALTER TABLE to_lines
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add comments
COMMENT ON COLUMN to_lines.created_by IS 'User ID who created this line (audit trail)';
COMMENT ON COLUMN to_lines.updated_by IS 'User ID who last updated this line (audit trail for shipments, edits)';

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_to_lines_created_by ON to_lines(created_by);
CREATE INDEX IF NOT EXISTS idx_to_lines_updated_by ON to_lines(updated_by);