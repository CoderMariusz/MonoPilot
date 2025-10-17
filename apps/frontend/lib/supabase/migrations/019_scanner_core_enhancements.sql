-- Phase 19: Scanner Core Enhancements Migration
-- This migration adds core fields required for scanner module functionality

-- Add move_type enum to stock_moves for operation tracking
CREATE TYPE stock_move_type AS ENUM ('WO_ISSUE', 'WO_OUTPUT', 'ADJUST', 'TRANSFER', 'GRN_IN', 'MANUAL');

-- Add move_type column to stock_moves
ALTER TABLE stock_moves 
ADD COLUMN move_type stock_move_type DEFAULT 'MANUAL';

-- Add source field to stock_moves and production_outputs
ALTER TABLE stock_moves 
ADD COLUMN source TEXT DEFAULT 'scanner' CHECK (source IN ('scanner', 'manual', 'api', 'system'));

ALTER TABLE production_outputs 
ADD COLUMN source TEXT DEFAULT 'scanner' CHECK (source IN ('scanner', 'manual', 'api', 'system'));

-- Add meta JSONB field to stock_moves for operation tracking
ALTER TABLE stock_moves 
ADD COLUMN meta JSONB DEFAULT '{}';

-- Add kpi_scope field to work_orders for filtering pack vs process terminals
ALTER TABLE work_orders 
ADD COLUMN kpi_scope TEXT DEFAULT 'PR' CHECK (kpi_scope IN ('PR', 'FG'));

-- Update stage_suffix constraint to enforce 2-letter format
ALTER TABLE license_plates 
DROP CONSTRAINT IF EXISTS check_stage_suffix_format;

ALTER TABLE license_plates 
ADD CONSTRAINT check_stage_suffix_format 
CHECK (stage_suffix IS NULL OR stage_suffix ~ '^-[A-Z]{2}$');

-- Add indexes for performance
CREATE INDEX idx_stock_moves_move_type ON stock_moves(move_type);
CREATE INDEX idx_stock_moves_source ON stock_moves(source);
CREATE INDEX idx_stock_moves_meta ON stock_moves USING GIN(meta);
CREATE INDEX idx_work_orders_kpi_scope ON work_orders(kpi_scope);

-- Add comments for documentation
COMMENT ON COLUMN stock_moves.move_type IS 'Type of stock move for operation tracking';
COMMENT ON COLUMN stock_moves.source IS 'Source system that created the move';
COMMENT ON COLUMN stock_moves.meta IS 'JSONB metadata including operation_id and seq_no';
COMMENT ON COLUMN production_outputs.source IS 'Source system that recorded the output';
COMMENT ON COLUMN work_orders.kpi_scope IS 'KPI scope: PR for process terminal, FG for pack terminal';

-- Update existing stock moves to have proper source
UPDATE stock_moves SET source = 'manual' WHERE source IS NULL;
UPDATE production_outputs SET source = 'manual' WHERE source IS NULL;

-- Add check constraint for meta field structure
ALTER TABLE stock_moves 
ADD CONSTRAINT check_meta_structure 
CHECK (
    meta IS NULL OR 
    (jsonb_typeof(meta) = 'object' AND 
     (meta ? 'operation_id' = false OR jsonb_typeof(meta->'operation_id') = 'number') AND
     (meta ? 'seq_no' = false OR jsonb_typeof(meta->'seq_no') = 'number'))
);
