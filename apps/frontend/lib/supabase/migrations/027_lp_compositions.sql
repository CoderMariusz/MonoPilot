-- Migration 027: LP Compositions Table
-- Purpose: Track input-output relationships between license plates
-- Date: 2025-01-11
-- Dependencies: 025_license_plates

CREATE TABLE lp_compositions (
  id SERIAL PRIMARY KEY,
  output_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  input_lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  qty NUMERIC(12,4) NOT NULL,
  uom VARCHAR(50) NOT NULL,
  op_seq INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lp_compositions_output ON lp_compositions(output_lp_id);
CREATE INDEX idx_lp_compositions_input ON lp_compositions(input_lp_id);
CREATE INDEX idx_lp_compositions_op_seq ON lp_compositions(op_seq);

-- Comments
COMMENT ON TABLE lp_compositions IS 'Track input-output relationships between license plates for full traceability';

