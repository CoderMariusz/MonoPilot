-- Phase 13: Stock Moves Enhancement Migration
-- This migration enhances stock moves with move type classification and metadata tracking

-- Add move type classification
ALTER TABLE stock_moves 
ADD COLUMN move_type move_type_enum NOT NULL DEFAULT 'TRANSFER';

-- Add move status lifecycle
ALTER TABLE stock_moves 
ADD COLUMN status move_status_enum NOT NULL DEFAULT 'draft';

-- Add work order reference
ALTER TABLE stock_moves 
ADD COLUMN wo_id INTEGER REFERENCES work_orders(id);

-- Add metadata storage
ALTER TABLE stock_moves 
ADD COLUMN meta JSONB NULL;

-- Add move source tracking
ALTER TABLE stock_moves 
ADD COLUMN source move_source_enum NOT NULL DEFAULT 'portal';

-- Add indexes for performance
CREATE INDEX idx_stock_moves_wo_id ON stock_moves(wo_id);
CREATE INDEX idx_stock_moves_lp_id ON stock_moves(lp_id);
CREATE INDEX idx_stock_moves_move_type_date ON stock_moves(move_type, move_date);
CREATE INDEX idx_stock_moves_status ON stock_moves(status);
CREATE INDEX idx_stock_moves_source ON stock_moves(source);

-- Add comments for documentation
COMMENT ON COLUMN stock_moves.move_type IS 'Classification of stock move type';
COMMENT ON COLUMN stock_moves.status IS 'Status lifecycle for stock moves';
COMMENT ON COLUMN stock_moves.wo_id IS 'Work order reference for production moves';
COMMENT ON COLUMN stock_moves.meta IS 'JSONB metadata for additional move information';
COMMENT ON COLUMN stock_moves.source IS 'Source of the stock move for audit trail';

-- Add check constraint for move type and status combinations
ALTER TABLE stock_moves 
ADD CONSTRAINT check_move_type_status 
CHECK (
    (move_type = 'GRN_IN' AND status IN ('draft', 'completed')) OR
    (move_type = 'WO_ISSUE' AND status IN ('draft', 'completed')) OR
    (move_type = 'TRANSFER' AND status IN ('draft', 'completed')) OR
    (move_type = 'ADJUST' AND status IN ('draft', 'completed')) OR
    (move_type = 'WO_OUTPUT' AND status IN ('draft', 'completed'))
);

-- Add check constraint for work order reference
ALTER TABLE stock_moves 
ADD CONSTRAINT check_wo_id_required_for_wo_moves 
CHECK (
    (move_type IN ('WO_ISSUE', 'WO_OUTPUT') AND wo_id IS NOT NULL) OR
    (move_type NOT IN ('WO_ISSUE', 'WO_OUTPUT'))
);
