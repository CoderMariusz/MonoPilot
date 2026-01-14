-- Migration: 122_ensure_routing_operations_exists.sql
-- Description: Ensure routing_operations table exists before operation_attachments
-- Date: 2026-01-14
-- Author: Orchestrator
-- Note: routings table already exists in cloud, just need routing_operations

BEGIN;

-- Create routing_operations table if it doesn't exist (from migration 047)
CREATE TABLE IF NOT EXISTS routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  operation_name TEXT NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  expected_duration_minutes INTEGER NOT NULL CHECK (expected_duration_minutes >= 1),
  setup_time_minutes INTEGER DEFAULT 0 CHECK (setup_time_minutes >= 0),
  cleanup_time_minutes INTEGER DEFAULT 0 CHECK (cleanup_time_minutes >= 0),
  labor_cost DECIMAL(15,4) DEFAULT 0 CHECK (labor_cost >= 0),
  expected_yield_percent DECIMAL(5,2) DEFAULT 100.00 CHECK (expected_yield_percent >= 0 AND expected_yield_percent <= 100),
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_id ON routing_operations(routing_id);
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_seq ON routing_operations(routing_id, sequence);
CREATE INDEX IF NOT EXISTS idx_routing_operations_machine_id ON routing_operations(machine_id) WHERE machine_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_routing_operations_line_id ON routing_operations(line_id) WHERE line_id IS NOT NULL;

-- Enable RLS
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_operations FORCE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON routing_operations TO authenticated;

COMMIT;
