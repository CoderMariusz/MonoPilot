-- Phase 23: Sequential Routing Enforcement Migration
-- This migration enforces sequential routing operations at database level

-- Create function to enforce sequential operations
CREATE OR REPLACE FUNCTION enforce_sequential_operations()
RETURNS TRIGGER AS $$
DECLARE
    previous_op_status TEXT;
    has_weights BOOLEAN := false;
BEGIN
    -- Only check when status is being set to 'IN_PROGRESS'
    IF NEW.status = 'IN_PROGRESS' THEN
        
        -- Check if previous operation exists and is completed
        IF NEW.seq_no > 1 THEN
            SELECT status INTO previous_op_status
            FROM wo_operations
            WHERE wo_id = NEW.wo_id 
            AND seq_no = NEW.seq_no - 1;
            
            -- If previous operation doesn't exist, raise error
            IF previous_op_status IS NULL THEN
                RAISE EXCEPTION 'Previous operation (seq_no %) does not exist for WO %', 
                    NEW.seq_no - 1, NEW.wo_id;
            END IF;
            
            -- If previous operation is not completed, raise error
            IF previous_op_status != 'COMPLETED' THEN
                RAISE EXCEPTION 'Cannot start operation % before operation % is completed (current status: %)', 
                    NEW.seq_no, NEW.seq_no - 1, previous_op_status;
            END IF;
        END IF;
    END IF;
    
    -- Check if operation can be completed (must have weights recorded)
    IF NEW.status = 'COMPLETED' THEN
        -- Check if both input and output weights are recorded
        IF NEW.actual_input_weight IS NULL OR NEW.actual_output_weight IS NULL THEN
            RAISE EXCEPTION 'Cannot complete operation % without recording both input and output weights', 
                NEW.seq_no;
        END IF;
        
        -- Check if weights are positive
        IF NEW.actual_input_weight <= 0 OR NEW.actual_output_weight <= 0 THEN
            RAISE EXCEPTION 'Cannot complete operation % with zero or negative weights (input: %, output: %)', 
                NEW.seq_no, NEW.actual_input_weight, NEW.actual_output_weight;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wo_operations table
CREATE TRIGGER trigger_enforce_sequential_operations
    BEFORE INSERT OR UPDATE ON wo_operations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_sequential_operations();

-- Create function to get current operation for a WO
CREATE OR REPLACE FUNCTION get_current_operation(wo_id_param INTEGER)
RETURNS TABLE (
    operation_id INTEGER,
    seq_no INTEGER,
    status TEXT,
    can_start BOOLEAN
) AS $$
DECLARE
    current_seq INTEGER;
    prev_status TEXT;
BEGIN
    -- Find the first operation that is not completed
    SELECT MIN(seq_no) INTO current_seq
    FROM wo_operations
    WHERE wo_id = wo_id_param
    AND status != 'COMPLETED';
    
    -- If no operation found, all operations are completed
    IF current_seq IS NULL THEN
        -- Return the last operation
        SELECT wo_id_param, MAX(seq_no), 'COMPLETED', false
        FROM wo_operations
        WHERE wo_id = wo_id_param;
        RETURN;
    END IF;
    
    -- Check if this operation can start
    prev_status := NULL;
    IF current_seq > 1 THEN
        SELECT status INTO prev_status
        FROM wo_operations
        WHERE wo_id = wo_id_param 
        AND seq_no = current_seq - 1;
    END IF;
    
    RETURN QUERY
    SELECT 
        wo.id as operation_id,
        wo.seq_no,
        wo.status,
        CASE 
            WHEN current_seq = 1 THEN true
            WHEN prev_status = 'COMPLETED' THEN true
            ELSE false
        END as can_start
    FROM wo_operations wo
    WHERE wo.wo_id = wo_id_param
    AND wo.seq_no = current_seq;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-stage output for next operation
CREATE OR REPLACE FUNCTION auto_stage_output_for_next_operation()
RETURNS TRIGGER AS $$
DECLARE
    next_operation_id INTEGER;
    output_lp_id INTEGER;
BEGIN
    -- Only trigger when operation is completed
    IF NEW.status = 'COMPLETED' THEN
        
        -- Find next operation
        SELECT id INTO next_operation_id
        FROM wo_operations
        WHERE wo_id = NEW.wo_id 
        AND seq_no = NEW.seq_no + 1
        AND status = 'PENDING';
        
        -- If next operation exists, we would auto-stage here
        -- This is a placeholder for future implementation
        -- The actual staging logic will be handled by the API layer
        
        -- For now, just log that this operation is ready for handover
        RAISE NOTICE 'Operation % completed for WO %, next operation % ready for handover', 
            NEW.seq_no, NEW.wo_id, next_operation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-staging (placeholder)
CREATE TRIGGER trigger_auto_stage_output
    AFTER UPDATE ON wo_operations
    FOR EACH ROW
    EXECUTE FUNCTION auto_stage_output_for_next_operation();

-- Create view for operation status overview
CREATE VIEW wo_operation_status AS
SELECT 
    wo.id as wo_id,
    wo.wo_number,
    wo.status as wo_status,
    wo.kpi_scope,
    op.id as operation_id,
    op.seq_no,
    op.status as operation_status,
    op.actual_input_weight,
    op.actual_output_weight,
    CASE 
        WHEN op.seq_no = 1 THEN true
        WHEN LAG(op.status) OVER (PARTITION BY wo.id ORDER BY op.seq_no) = 'COMPLETED' THEN true
        ELSE false
    END as can_start,
    CASE 
        WHEN op.actual_input_weight IS NOT NULL AND op.actual_output_weight IS NOT NULL THEN true
        ELSE false
    END as has_weights,
    CASE 
        WHEN op.status = 'COMPLETED' THEN true
        WHEN op.actual_input_weight IS NOT NULL AND op.actual_output_weight IS NOT NULL THEN true
        ELSE false
    END as can_complete
FROM work_orders wo
LEFT JOIN wo_operations op ON op.wo_id = wo.id
WHERE wo.status IN ('released', 'in_progress')
ORDER BY wo.id, op.seq_no;

-- Add comment for the view
COMMENT ON VIEW wo_operation_status IS 'Overview of work order operations and their sequential status';

-- Add check constraints for operation weights
ALTER TABLE wo_operations 
ADD CONSTRAINT check_weights_for_completion 
CHECK (
    status != 'COMPLETED' OR 
    (actual_input_weight IS NOT NULL AND actual_input_weight > 0 AND
     actual_output_weight IS NOT NULL AND actual_output_weight > 0)
);

-- Create function to validate operation sequence
CREATE OR REPLACE FUNCTION validate_operation_sequence(wo_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    op_count INTEGER;
    completed_count INTEGER;
    first_pending_seq INTEGER;
BEGIN
    -- Count total operations
    SELECT COUNT(*) INTO op_count
    FROM wo_operations
    WHERE wo_id = wo_id_param;
    
    -- Count completed operations
    SELECT COUNT(*) INTO completed_count
    FROM wo_operations
    WHERE wo_id = wo_id_param
    AND status = 'COMPLETED';
    
    -- Find first pending operation
    SELECT MIN(seq_no) INTO first_pending_seq
    FROM wo_operations
    WHERE wo_id = wo_id_param
    AND status IN ('PENDING', 'IN_PROGRESS');
    
    -- Validation: first pending operation should be exactly one more than completed count
    IF first_pending_seq IS NULL THEN
        -- All operations completed
        RETURN completed_count = op_count;
    ELSE
        -- Next operation should be the one after completed operations
        RETURN first_pending_seq = completed_count + 1;
    END IF;
END;
$$ LANGUAGE plpgsql;
