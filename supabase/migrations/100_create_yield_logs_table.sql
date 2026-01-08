-- Migration: Create yield_logs table
-- Story: 04.4 - Yield Tracking
-- Purpose: Audit trail for yield updates on work orders
--
-- Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)

-- Create yield_logs table for tracking yield update history
CREATE TABLE IF NOT EXISTS yield_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_id               UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  old_quantity        DECIMAL(15,4) NOT NULL,
  new_quantity        DECIMAL(15,4) NOT NULL,
  old_yield_percent   DECIMAL(5,2) NOT NULL,
  new_yield_percent   DECIMAL(5,2) NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES users(id)
);

-- Comments for documentation
COMMENT ON TABLE yield_logs IS 'Audit trail for work order yield updates (Story 04.4)';
COMMENT ON COLUMN yield_logs.org_id IS 'Organization ID for multi-tenant isolation';
COMMENT ON COLUMN yield_logs.wo_id IS 'Work order ID this log entry belongs to';
COMMENT ON COLUMN yield_logs.old_quantity IS 'Previous produced_quantity value';
COMMENT ON COLUMN yield_logs.new_quantity IS 'New produced_quantity value';
COMMENT ON COLUMN yield_logs.old_yield_percent IS 'Previous yield percentage';
COMMENT ON COLUMN yield_logs.new_yield_percent IS 'New yield percentage';
COMMENT ON COLUMN yield_logs.notes IS 'Optional notes for the update (max 1000 chars)';
COMMENT ON COLUMN yield_logs.created_by IS 'User who made the update';

-- Enable RLS
ALTER TABLE yield_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
-- Policy: Users can only view yield logs for their organization
CREATE POLICY "yield_logs_select_policy" ON yield_logs
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Policy: Users can only insert yield logs for their organization
CREATE POLICY "yield_logs_insert_policy" ON yield_logs
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Indexes for performance
-- Index on wo_id for quick lookup by work order
CREATE INDEX IF NOT EXISTS idx_yield_logs_wo_id ON yield_logs(wo_id);

-- Index on created_at DESC for history queries (newest first)
CREATE INDEX IF NOT EXISTS idx_yield_logs_created_at ON yield_logs(created_at DESC);

-- Composite index for org_id + wo_id for RLS-filtered queries
CREATE INDEX IF NOT EXISTS idx_yield_logs_org_wo ON yield_logs(org_id, wo_id);
