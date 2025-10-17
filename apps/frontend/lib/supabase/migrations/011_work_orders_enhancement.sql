-- Phase 11: Work Orders Enhancement Migration
-- This migration enhances work orders table with routing integration, KPI scope tracking, and completion details

-- Add routing integration
ALTER TABLE work_orders 
ADD COLUMN routing_id INTEGER REFERENCES routings(id);

-- Add KPI scope tracking
ALTER TABLE work_orders 
ADD COLUMN kpi_scope kpi_scope_enum NOT NULL DEFAULT 'PR';

-- Add box tracking for Finished Goods
ALTER TABLE work_orders 
ADD COLUMN planned_boxes INTEGER NULL,
ADD COLUMN actual_boxes INTEGER NULL,
ADD COLUMN box_weight_kg NUMERIC(10,4) NULL;

-- Add current operation tracking
ALTER TABLE work_orders 
ADD COLUMN current_operation_seq INTEGER NULL;

-- Add completion tracking
ALTER TABLE work_orders 
ADD COLUMN closed_by UUID REFERENCES users(id),
ADD COLUMN closed_at TIMESTAMPTZ NULL,
ADD COLUMN closed_source move_source_enum NULL;

-- Add actual production data
ALTER TABLE work_orders 
ADD COLUMN actual_start TIMESTAMPTZ NULL,
ADD COLUMN actual_end TIMESTAMPTZ NULL,
ADD COLUMN actual_output_qty NUMERIC(10,4) NULL;

-- Add indexes for performance
CREATE INDEX idx_work_orders_routing_id ON work_orders(routing_id);
CREATE INDEX idx_work_orders_kpi_scope ON work_orders(kpi_scope);
CREATE INDEX idx_work_orders_closed_at ON work_orders(closed_at);
CREATE INDEX idx_work_orders_actual_start ON work_orders(actual_start);

-- Add comments for documentation
COMMENT ON COLUMN work_orders.routing_id IS 'Production routing reference for work order';
COMMENT ON COLUMN work_orders.kpi_scope IS 'KPI calculation scope (PR or FG)';
COMMENT ON COLUMN work_orders.planned_boxes IS 'Planned box count for Finished Goods';
COMMENT ON COLUMN work_orders.actual_boxes IS 'Actual box count for Finished Goods';
COMMENT ON COLUMN work_orders.box_weight_kg IS 'Weight per box for Finished Goods';
COMMENT ON COLUMN work_orders.current_operation_seq IS 'Current operation sequence in routing';
COMMENT ON COLUMN work_orders.closed_by IS 'User who closed the work order';
COMMENT ON COLUMN work_orders.closed_at IS 'Timestamp when work order was closed';
COMMENT ON COLUMN work_orders.closed_source IS 'Source of work order closure';
COMMENT ON COLUMN work_orders.actual_start IS 'Actual work order start time';
COMMENT ON COLUMN work_orders.actual_end IS 'Actual work order end time';
COMMENT ON COLUMN work_orders.actual_output_qty IS 'Actual output quantity produced';
