-- Migration 014: Routing Operations Table
-- Purpose: Individual operations within a routing
-- Date: 2025-01-11
-- Dependencies: 007_machines, 013_routings

CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER REFERENCES routings(id),
  operation_name VARCHAR(200) NOT NULL,
  sequence_number INTEGER NOT NULL,
  machine_id INTEGER REFERENCES machines(id),
  estimated_duration_minutes INTEGER,
  setup_time_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  requirements TEXT[] DEFAULT '{}',
  code VARCHAR(50),
  description TEXT,
  expected_yield_pct NUMERIC(5,2) DEFAULT 100.0 CHECK (expected_yield_pct >= 0 AND expected_yield_pct <= 100)
);

-- Indexes
CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);
CREATE INDEX idx_routing_operations_machine ON routing_operations(machine_id);
CREATE INDEX idx_routing_operations_sequence ON routing_operations(routing_id, sequence_number);

-- Comments
COMMENT ON TABLE routing_operations IS 'Individual operations within a routing with timing and resource requirements';
COMMENT ON COLUMN routing_operations.machine_id IS 'Optional machine assignment for this operation';
COMMENT ON COLUMN routing_operations.expected_yield_pct IS 'Expected yield percentage for this operation (0-100). Used for reporting and variance analysis.';

