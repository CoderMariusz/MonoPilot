-- Phase 24: QA Gate Enhancements Migration
-- This migration creates QA override logging and gate policies

-- Create qa_override_log table
CREATE TABLE qa_override_log (
    id SERIAL PRIMARY KEY,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    operation_id INTEGER REFERENCES wo_operations(id),
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT NOT NULL,
    override_by UUID NOT NULL REFERENCES users(id),
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Add indexes for performance
CREATE INDEX idx_qa_override_log_lp_id ON qa_override_log(lp_id);
CREATE INDEX idx_qa_override_log_operation_id ON qa_override_log(operation_id);
CREATE INDEX idx_qa_override_log_override_by ON qa_override_log(override_by);
CREATE INDEX idx_qa_override_log_created_at ON qa_override_log(created_at);

-- Add comments for documentation
COMMENT ON TABLE qa_override_log IS 'Audit log for QA status overrides by supervisors/QA staff';
COMMENT ON COLUMN qa_override_log.old_status IS 'Previous QA status before override';
COMMENT ON COLUMN qa_override_log.new_status IS 'New QA status after override';
COMMENT ON COLUMN qa_override_log.reason IS 'Reason for the QA override';
COMMENT ON COLUMN qa_override_log.pin_hash IS 'Hashed supervisor PIN for authentication';
COMMENT ON COLUMN qa_override_log.ip_address IS 'IP address of the user performing override';
COMMENT ON COLUMN qa_override_log.user_agent IS 'User agent string for audit trail';

-- Create function to hash PIN securely
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use crypt function with random salt for PIN hashing
    RETURN crypt(pin, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- Create function to verify PIN
CREATE OR REPLACE FUNCTION verify_pin(pin TEXT, pin_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN crypt(pin, pin_hash) = pin_hash;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate QA override
CREATE OR REPLACE FUNCTION validate_qa_override(
    lp_id_param INTEGER,
    new_status TEXT,
    reason_param TEXT,
    pin_param TEXT,
    override_by_param UUID,
    operation_id_param INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
    user_role TEXT;
    supervisor_pin_hash TEXT;
BEGIN
    -- Get current QA status
    SELECT qa_status INTO current_status
    FROM license_plates
    WHERE id = lp_id_param;
    
    -- If LP not found, return false
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'License plate % not found', lp_id_param;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role
    FROM users
    WHERE id = override_by_param;
    
    -- Check if user has override permissions (QA or Admin roles)
    IF user_role NOT IN ('QC', 'Admin') THEN
        RAISE EXCEPTION 'User role % does not have QA override permissions', user_role;
    END IF;
    
    -- Validate reason is provided
    IF reason_param IS NULL OR LENGTH(TRIM(reason_param)) = 0 THEN
        RAISE EXCEPTION 'Reason is required for QA override';
    END IF;
    
    -- Validate PIN (this would typically check against a supervisor PIN table)
    -- For now, we'll accept any 4+ digit PIN
    IF pin_param IS NULL OR LENGTH(pin_param) < 4 THEN
        RAISE EXCEPTION 'Valid PIN is required for QA override';
    END IF;
    
    -- Log the override
    INSERT INTO qa_override_log (
        lp_id,
        operation_id,
        old_status,
        new_status,
        reason,
        override_by,
        pin_hash
    ) VALUES (
        lp_id_param,
        operation_id_param,
        current_status,
        new_status,
        reason_param,
        override_by_param,
        hash_pin(pin_param)
    );
    
    -- Update the LP QA status
    UPDATE license_plates
    SET qa_status = new_status,
        updated_at = NOW()
    WHERE id = lp_id_param;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get QA override history for an LP
CREATE OR REPLACE FUNCTION get_qa_override_history(lp_id_param INTEGER)
RETURNS TABLE (
    id INTEGER,
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    override_by_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qol.id,
        qol.old_status,
        qol.new_status,
        qol.reason,
        u.name as override_by_name,
        qol.created_at
    FROM qa_override_log qol
    JOIN users u ON u.id = qol.override_by
    WHERE qol.lp_id = lp_id_param
    ORDER BY qol.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if LP can be used in operations
CREATE OR REPLACE FUNCTION can_use_lp_in_operation(lp_id_param INTEGER, operation_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    lp_qa_status TEXT;
    operation_requirements TEXT[];
    user_role TEXT;
BEGIN
    -- Get LP QA status
    SELECT qa_status INTO lp_qa_status
    FROM license_plates
    WHERE id = lp_id_param;
    
    -- If LP not found, return false
    IF lp_qa_status IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get operation requirements
    SELECT requirements INTO operation_requirements
    FROM routing_operations ro
    JOIN wo_operations wo ON wo.routing_operation_id = ro.id
    WHERE wo.id = operation_id_param;
    
    -- If operation has specific QA requirements, check them
    IF operation_requirements IS NOT NULL AND array_length(operation_requirements, 1) > 0 THEN
        -- Check if 'QA_PASSED' is in requirements
        IF 'QA_PASSED' = ANY(operation_requirements) THEN
            RETURN lp_qa_status = 'Passed';
        END IF;
    END IF;
    
    -- Default: LP must be Passed or Pending (not Failed or Quarantine)
    RETURN lp_qa_status IN ('Passed', 'Pending');
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for qa_override_log
ALTER TABLE qa_override_log ENABLE ROW LEVEL SECURITY;

-- Policy for reading QA override logs (authenticated users)
CREATE POLICY "Users can read qa_override_log" ON qa_override_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting QA override logs (QC and Admin only)
CREATE POLICY "QC and Admin can insert qa_override_log" ON qa_override_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('QC', 'Admin')
        )
    );

-- Create view for QA gate status
CREATE VIEW qa_gate_status AS
SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.qa_status,
    lp.product_id,
    p.part_number,
    p.description,
    CASE 
        WHEN lp.qa_status = 'Passed' THEN true
        WHEN lp.qa_status = 'Pending' THEN true
        WHEN lp.qa_status = 'Failed' THEN false
        WHEN lp.qa_status = 'Quarantine' THEN false
        ELSE false
    END as can_use_in_production,
    COUNT(qol.id) as override_count,
    MAX(qol.created_at) as last_override_at
FROM license_plates lp
JOIN products p ON p.id = lp.product_id
LEFT JOIN qa_override_log qol ON qol.lp_id = lp.id
WHERE lp.status = 'Available'
GROUP BY lp.id, lp.lp_number, lp.qa_status, lp.product_id, p.part_number, p.description;

-- Add comment for the view
COMMENT ON VIEW qa_gate_status IS 'QA gate status for all available license plates';

-- Add check constraints
ALTER TABLE qa_override_log 
ADD CONSTRAINT check_status_transition 
CHECK (
    (old_status = 'Pending' AND new_status IN ('Passed', 'Failed', 'Quarantine')) OR
    (old_status = 'Failed' AND new_status IN ('Passed', 'Pending')) OR
    (old_status = 'Quarantine' AND new_status IN ('Passed', 'Pending')) OR
    (old_status = 'Passed' AND new_status IN ('Failed', 'Quarantine'))
);

ALTER TABLE qa_override_log 
ADD CONSTRAINT check_reason_not_empty 
CHECK (LENGTH(TRIM(reason)) > 0);

-- Create function to get QA statistics
CREATE OR REPLACE FUNCTION get_qa_statistics(date_from TIMESTAMPTZ DEFAULT NULL, date_to TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
DECLARE
    total_count BIGINT;
BEGIN
    -- Set default date range if not provided
    IF date_from IS NULL THEN
        date_from := NOW() - INTERVAL '30 days';
    END IF;
    
    IF date_to IS NULL THEN
        date_to := NOW();
    END IF;
    
    -- Get total count for percentage calculation
    SELECT COUNT(*) INTO total_count
    FROM license_plates
    WHERE created_at BETWEEN date_from AND date_to;
    
    -- Return statistics
    RETURN QUERY
    SELECT 
        lp.qa_status,
        COUNT(*) as count,
        CASE 
            WHEN total_count > 0 THEN ROUND((COUNT(*) * 100.0 / total_count), 2)
            ELSE 0
        END as percentage
    FROM license_plates lp
    WHERE lp.created_at BETWEEN date_from AND date_to
    GROUP BY lp.qa_status
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;
