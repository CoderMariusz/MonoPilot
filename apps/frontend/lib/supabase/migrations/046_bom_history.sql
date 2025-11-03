-- Migration 046: BOM History Table
-- Purpose: Track BOM changes when status changes from draft to active
-- Date: 2025-01-22

-- BOM History table for tracking changes when status changes from draft to active
CREATE TABLE bom_history (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_from VARCHAR(20),
  status_to VARCHAR(20),
  changes JSONB NOT NULL,
  description TEXT,
  CONSTRAINT fk_bom_history_bom FOREIGN KEY (bom_id) REFERENCES boms(id)
);

CREATE INDEX idx_bom_history_bom_id ON bom_history(bom_id);
CREATE INDEX idx_bom_history_changed_at ON bom_history(changed_at DESC);

-- RLS Policy
ALTER TABLE bom_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_users_bom_history_read" ON bom_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_users_bom_history_insert" ON bom_history
  FOR INSERT TO authenticated WITH CHECK (true);


