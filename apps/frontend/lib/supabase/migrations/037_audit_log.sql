-- Migration 037: Audit Log Table
-- Purpose: System-wide audit trail for changes
-- Date: 2025-01-11
-- Dependencies: 001_users

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Comments
COMMENT ON TABLE audit_log IS 'System-wide audit trail tracking all entity changes';
COMMENT ON COLUMN audit_log.action IS 'Action type: create, update, delete, archive, etc.';
COMMENT ON COLUMN audit_log.before IS 'JSONB snapshot of entity state before change';
COMMENT ON COLUMN audit_log.after IS 'JSONB snapshot of entity state after change';

