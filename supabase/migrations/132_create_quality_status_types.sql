-- =============================================================================
-- Migration 132: Create Quality Status Types (Story 06.1)
-- Purpose: Quality status type enum, transitions table, and history tracking
-- =============================================================================

-- =============================================================================
-- Create quality_status_type Enum
-- =============================================================================

CREATE TYPE quality_status_type AS ENUM (
  'PENDING',         -- Awaiting inspection
  'PASSED',          -- Meets specifications
  'FAILED',          -- Does not meet specs
  'HOLD',            -- Investigation required
  'RELEASED',        -- Approved for use after hold
  'QUARANTINED',     -- Isolated pending review
  'COND_APPROVED'    -- Conditionally approved (limited use)
);

COMMENT ON TYPE quality_status_type IS 'Quality assurance status types for inventory and batches';

-- =============================================================================
-- Create quality_status_transitions Table
-- =============================================================================

CREATE TABLE quality_status_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_status quality_status_type NOT NULL,
  to_status quality_status_type NOT NULL,
  requires_inspection BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  requires_reason BOOLEAN DEFAULT true,
  is_allowed BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_status_transition UNIQUE(from_status, to_status)
);

COMMENT ON TABLE quality_status_transitions IS 'Valid quality status transitions with business rules';

-- Create indexes for transition lookups
CREATE INDEX idx_status_transitions_from ON quality_status_transitions(from_status);
CREATE INDEX idx_status_transitions_lookup ON quality_status_transitions(from_status, to_status);

-- =============================================================================
-- Seed valid transitions (20+ transitions)
-- =============================================================================

INSERT INTO quality_status_transitions (from_status, to_status, requires_inspection, requires_approval, requires_reason, is_allowed, description) VALUES
  -- From PENDING (4 transitions)
  ('PENDING', 'PASSED', true, false, true, true, 'Inspection passed, approved for use'),
  ('PENDING', 'FAILED', true, false, true, true, 'Inspection failed, rejected'),
  ('PENDING', 'HOLD', false, false, true, true, 'Investigation required before decision'),
  ('PENDING', 'QUARANTINED', false, true, true, true, 'Immediate quarantine required'),

  -- From PASSED (3 transitions)
  ('PASSED', 'HOLD', false, false, true, true, 'Post-approval issue identified'),
  ('PASSED', 'QUARANTINED', false, true, true, true, 'Critical issue found after approval'),
  ('PASSED', 'FAILED', false, true, true, true, 'Revoke approval due to new information'),

  -- From FAILED (2 transitions)
  ('FAILED', 'HOLD', false, false, true, true, 'Further investigation needed'),
  ('FAILED', 'QUARANTINED', false, false, true, true, 'Quarantine failed material'),

  -- From HOLD (5 transitions)
  ('HOLD', 'PASSED', true, true, true, true, 'Investigation complete, approved'),
  ('HOLD', 'FAILED', true, true, true, true, 'Investigation complete, rejected'),
  ('HOLD', 'RELEASED', true, true, true, true, 'Released for use after investigation'),
  ('HOLD', 'COND_APPROVED', true, true, true, true, 'Approved with conditions'),
  ('HOLD', 'QUARANTINED', false, false, true, true, 'Escalate to quarantine'),

  -- From QUARANTINED (3 transitions)
  ('QUARANTINED', 'HOLD', false, true, true, true, 'Downgrade to hold for investigation'),
  ('QUARANTINED', 'RELEASED', true, true, true, true, 'Released after quarantine review'),
  ('QUARANTINED', 'FAILED', true, true, true, true, 'Permanently rejected'),

  -- From COND_APPROVED (3 transitions)
  ('COND_APPROVED', 'PASSED', true, true, true, true, 'Conditions met, full approval'),
  ('COND_APPROVED', 'FAILED', true, true, true, true, 'Conditions not met, rejected'),
  ('COND_APPROVED', 'HOLD', false, false, true, true, 'Additional investigation needed'),

  -- From RELEASED (2 transitions)
  ('RELEASED', 'HOLD', false, false, true, true, 'New issue identified'),
  ('RELEASED', 'QUARANTINED', false, true, true, true, 'Critical issue after release');

-- =============================================================================
-- Create quality_status_history Table
-- =============================================================================

CREATE TABLE quality_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lp', 'batch', 'inspection')),
  entity_id UUID NOT NULL,
  from_status quality_status_type,
  to_status quality_status_type NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  requires_reversal BOOLEAN DEFAULT false,

  CONSTRAINT valid_status_change CHECK (from_status IS NULL OR from_status != to_status)
);

COMMENT ON TABLE quality_status_history IS 'Audit trail of all quality status changes';

-- Create indexes for history queries
CREATE INDEX idx_status_history_org ON quality_status_history(org_id);
CREATE INDEX idx_status_history_entity ON quality_status_history(entity_type, entity_id);
CREATE INDEX idx_status_history_date ON quality_status_history(changed_at DESC);

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- RLS for quality_status_history
ALTER TABLE quality_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status history org isolation"
ON quality_status_history FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS for quality_status_transitions (read-only for all authenticated users)
ALTER TABLE quality_status_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status transitions read for authenticated"
ON quality_status_transitions FOR SELECT
TO authenticated
USING (true);

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT SELECT ON quality_status_transitions TO authenticated;
GRANT SELECT, INSERT ON quality_status_history TO authenticated;
