-- Migration 023: WO Operations Table
-- Purpose: Operation tracking for work orders
-- Date: 2025-01-11
-- Dependencies: 001_users, 014_routing_operations, 021_work_orders

CREATE TABLE wo_operations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id),
  routing_operation_id INTEGER REFERENCES routing_operations(id),
  seq_no INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  operator_id UUID REFERENCES users(id),
  device_id INTEGER,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
CREATE INDEX idx_wo_operations_status ON wo_operations(status);
CREATE INDEX idx_wo_operations_operator ON wo_operations(operator_id);

-- Comments
COMMENT ON TABLE wo_operations IS 'Operation tracking for work orders - progress through manufacturing steps';

