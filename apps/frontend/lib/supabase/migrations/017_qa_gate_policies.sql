-- Phase 17: QA Gate Enforcement Migration
-- This migration enforces QA gate requirements for material movements

-- Create function to check QA gate requirements
CREATE OR REPLACE FUNCTION check_qa_gate_requirements()
RETURNS TRIGGER AS $$
DECLARE
    lp_qa_status TEXT;
    user_role TEXT;
BEGIN
    -- Only check for WO_ISSUE and WO_OUTPUT moves
    IF NEW.move_type IN ('WO_ISSUE', 'WO_OUTPUT') THEN
        -- Get LP QA status
        SELECT qa_status INTO lp_qa_status
        FROM license_plates
        WHERE id = NEW.lp_id;
        
        -- Check if LP exists and get QA status
        IF lp_qa_status IS NULL THEN
            RAISE EXCEPTION 'License plate not found for move';
        END IF;
        
        -- Check QA status
        IF lp_qa_status != 'Passed' THEN
            -- Get user role for override check
            SELECT role INTO user_role
            FROM users
            WHERE id = NEW.created_by;
            
            -- Allow override for Admin and QC roles
            IF user_role NOT IN ('Admin', 'QC') THEN
                RAISE EXCEPTION 'QA gate blocked: License plate % has QA status % (requires Passed)', 
                    (SELECT lp_number FROM license_plates WHERE id = NEW.lp_id), 
                    lp_qa_status;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for QA gate enforcement
CREATE TRIGGER trigger_qa_gate_enforcement
    BEFORE INSERT OR UPDATE ON stock_moves
    FOR EACH ROW
    EXECUTE FUNCTION check_qa_gate_requirements();

-- Create RLS policy for QA gate audit
CREATE POLICY "QA Gate Audit" ON stock_moves
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON FUNCTION check_qa_gate_requirements() IS 'Enforces QA gate requirements for WO_ISSUE and WO_OUTPUT moves';
COMMENT ON TRIGGER trigger_qa_gate_enforcement ON stock_moves IS 'Trigger to enforce QA gate before allowing material movements';

-- Create view for QA gate violations (for monitoring)
CREATE VIEW vw_qa_gate_violations AS
SELECT 
    sm.id as move_id,
    sm.move_number,
    sm.move_type,
    sm.status,
    sm.source,
    lp.lp_number,
    lp.qa_status,
    sm.created_at,
    sm.created_by,
    u.name as created_by_name,
    u.role as created_by_role
FROM stock_moves sm
JOIN license_plates lp ON sm.lp_id = lp.id
LEFT JOIN users u ON sm.created_by = u.id
WHERE sm.move_type IN ('WO_ISSUE', 'WO_OUTPUT')
  AND lp.qa_status != 'Passed'
  AND sm.status = 'completed';

-- Add comment for QA gate violations view
COMMENT ON VIEW vw_qa_gate_violations IS 'View to monitor QA gate violations for audit purposes';

-- Create function to get QA gate statistics
CREATE OR REPLACE FUNCTION get_qa_gate_stats(
    from_date TIMESTAMPTZ DEFAULT NULL,
    to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_moves BIGINT,
    qa_passed_moves BIGINT,
    qa_failed_moves BIGINT,
    qa_pending_moves BIGINT,
    qa_quarantine_moves BIGINT,
    violation_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_moves,
        COUNT(*) FILTER (WHERE lp.qa_status = 'Passed') as qa_passed_moves,
        COUNT(*) FILTER (WHERE lp.qa_status = 'Failed') as qa_failed_moves,
        COUNT(*) FILTER (WHERE lp.qa_status = 'Pending') as qa_pending_moves,
        COUNT(*) FILTER (WHERE lp.qa_status = 'Quarantine') as qa_quarantine_moves,
        ROUND(
            (COUNT(*) FILTER (WHERE lp.qa_status != 'Passed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) as violation_rate
    FROM stock_moves sm
    JOIN license_plates lp ON sm.lp_id = lp.id
    WHERE sm.move_type IN ('WO_ISSUE', 'WO_OUTPUT')
      AND (from_date IS NULL OR sm.created_at >= from_date)
      AND (to_date IS NULL OR sm.created_at <= to_date);
END;
$$ LANGUAGE plpgsql;

-- Add comment for QA gate statistics function
COMMENT ON FUNCTION get_qa_gate_stats(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Returns QA gate statistics for monitoring and reporting';
