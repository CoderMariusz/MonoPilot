-- Migration 036: Work Order Pause/Resume functionality
-- Epic 4 Batch 04A-1: Work Order Lifecycle
-- Stories: 4.3
-- Date: 2025-01-29

-- ============================================================================
-- 1. WO_PAUSES Table (Story 4.3 - Pause/Resume with downtime tracking)
-- ============================================================================

CREATE TABLE wo_pauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Pause details
  pause_reason VARCHAR(100),  -- Optional: Breakdown, Break, Material Wait, Other
  notes TEXT,

  -- Timestamps
  paused_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paused_by_user_id UUID NOT NULL REFERENCES users(id),
  resumed_at TIMESTAMP WITH TIME ZONE,
  resumed_by_user_id UUID REFERENCES users(id),

  -- Calculated
  downtime_minutes INTEGER DEFAULT 0,  -- Duration in minutes (calculated on resume)

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT downtime_nonnegative CHECK (downtime_minutes >= 0)
);

-- Indexes
CREATE INDEX idx_wo_pauses_work_order ON wo_pauses(work_order_id);
CREATE INDEX idx_wo_pauses_user ON wo_pauses(paused_by_user_id);
CREATE INDEX idx_wo_pauses_org ON wo_pauses(org_id);

-- RLS
ALTER TABLE wo_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY wo_pauses_isolation ON wo_pauses
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE wo_pauses IS 'Work order pause/resume history with downtime tracking - Story 4.3';
COMMENT ON COLUMN wo_pauses.pause_reason IS 'Optional pause reason: Breakdown, Break, Material Wait, Other';
COMMENT ON COLUMN wo_pauses.downtime_minutes IS 'Duration in minutes, calculated when WO is resumed';

-- Trigger: Update updated_at
CREATE TRIGGER update_wo_pauses_updated_at
  BEFORE UPDATE ON wo_pauses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. UPDATE production_settings (Story 4.3 - Configuration)
-- ============================================================================

-- Add pause-related settings to existing production_settings table
ALTER TABLE production_settings ADD COLUMN IF NOT EXISTS allow_pause_wo BOOLEAN DEFAULT true;
ALTER TABLE production_settings ADD COLUMN IF NOT EXISTS pause_reasons JSONB DEFAULT '[
  {"code": "breakdown", "label": "Breakdown"},
  {"code": "break", "label": "Break"},
  {"code": "material_wait", "label": "Material Wait"},
  {"code": "other", "label": "Other"}
]'::jsonb;

COMMENT ON COLUMN production_settings.allow_pause_wo IS 'Allow operators to pause work orders (Story 4.3)';
COMMENT ON COLUMN production_settings.pause_reasons IS 'Configurable pause reason options';

-- ============================================================================
-- 3. UPDATE wo_operations (Story 4.4, 4.5 - Status lifecycle improvements)
-- ============================================================================

-- Update status enum comments and constraints for clarity
COMMENT ON COLUMN wo_operations.status IS 'Status: pending, in_progress (Story 4.4), completed (Story 4.5)';

-- Add columns for operation completion tracking (Story 4.5)
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS actual_duration_minutes DECIMAL(10,2);
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS actual_yield_percent DECIMAL(5,2);
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN wo_operations.actual_duration_minutes IS 'Actual duration operator provides or auto-calculated (Story 4.5)';
COMMENT ON COLUMN wo_operations.actual_yield_percent IS 'Calculated yield from BOM consumption (Story 4.5, read-only)';
COMMENT ON COLUMN wo_operations.notes IS 'Operator notes on completion (Story 4.5)';

-- Add column for sequence enforcement (Story 4.4)
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

COMMENT ON COLUMN wo_operations.sequence_number IS 'Operation sequence for enforcement (Story 4.4)';
