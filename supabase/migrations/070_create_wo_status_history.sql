-- Migration: Create wo_status_history table
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: Status transition audit trail for work orders
-- RLS: Derived from parent work_orders access

-- ============================================================================
-- TABLE: wo_status_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Comments
COMMENT ON TABLE wo_status_history IS 'Status transition history for work orders (Story 03.10)';
COMMENT ON COLUMN wo_status_history.from_status IS 'Previous status (NULL for initial creation)';
COMMENT ON COLUMN wo_status_history.to_status IS 'New status after transition';
COMMENT ON COLUMN wo_status_history.notes IS 'Optional reason/notes for status change';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wo_history_wo ON wo_status_history(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_history_changed_at ON wo_status_history(changed_at DESC);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE wo_status_history ENABLE ROW LEVEL SECURITY;
