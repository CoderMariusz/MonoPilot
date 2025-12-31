-- Migration: Create wo_daily_sequence table
-- Story: 03.10 - WO CRUD + BOM Auto-Select
-- Purpose: Daily WO number sequence per org (WO-YYYYMMDD-NNNN)
-- RLS: Per-organization isolation

-- ============================================================================
-- TABLE: wo_daily_sequence
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_daily_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_date DATE NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_seq_org_date_unique UNIQUE(org_id, sequence_date)
);

-- Comments
COMMENT ON TABLE wo_daily_sequence IS 'Daily WO number sequence per org (Story 03.10)';
COMMENT ON COLUMN wo_daily_sequence.sequence_date IS 'Date for sequence (resets daily)';
COMMENT ON COLUMN wo_daily_sequence.last_sequence IS 'Last used sequence number for the day';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wo_seq_org_date ON wo_daily_sequence(org_id, sequence_date);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE wo_daily_sequence ENABLE ROW LEVEL SECURITY;
