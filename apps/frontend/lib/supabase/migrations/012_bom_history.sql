-- Migration 012: BOM History Table
-- Purpose: Audit trail for BOM changes
-- Date: 2025-01-11
-- Dependencies: 001_users, 010_boms

CREATE TABLE bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id),
  version VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_from VARCHAR(20),
  status_to VARCHAR(20),
  changes JSONB NOT NULL,
  description TEXT
);

-- Indexes
CREATE INDEX idx_bom_history_bom ON bom_history(bom_id);
CREATE INDEX idx_bom_history_changed_at ON bom_history(changed_at);
CREATE INDEX idx_bom_history_changed_by ON bom_history(changed_by);

-- Comments
COMMENT ON TABLE bom_history IS 'Audit trail for BOM changes and status transitions';
COMMENT ON COLUMN bom_history.changes IS 'JSONB containing detailed changes (added/removed/modified items)';

