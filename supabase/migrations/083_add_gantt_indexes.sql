-- Migration: Add indexes for Gantt chart performance
-- Story: 03.15 - WO Gantt Chart View
-- Created: 2026-01-02

-- Index for Gantt grouped by production line
CREATE INDEX IF NOT EXISTS idx_work_orders_gantt_line
  ON work_orders(org_id, production_line_id, planned_start_date, scheduled_start_time)
  WHERE status != 'completed';

-- Index for Gantt grouped by machine
CREATE INDEX IF NOT EXISTS idx_work_orders_gantt_machine
  ON work_orders(org_id, machine_id, planned_start_date, scheduled_start_time)
  WHERE status != 'completed';

-- Index for date range + status filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_gantt_date_status
  ON work_orders(org_id, planned_start_date, status)
  WHERE status != 'completed';

-- Comment for documentation
COMMENT ON INDEX idx_work_orders_gantt_line IS 'Optimizes Gantt chart queries grouped by production line (Story 03.15)';
COMMENT ON INDEX idx_work_orders_gantt_machine IS 'Optimizes Gantt chart queries grouped by machine (Story 03.15)';
COMMENT ON INDEX idx_work_orders_gantt_date_status IS 'Optimizes Gantt chart date range + status filter queries (Story 03.15)';
