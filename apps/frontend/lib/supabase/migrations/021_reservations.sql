-- Phase 21: Reservations System Migration
-- This migration creates LP reservations system to prevent double-allocation

-- Create lp_reservations table
CREATE TABLE lp_reservations (
    id SERIAL PRIMARY KEY,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    operation_id INTEGER REFERENCES wo_operations(id),
    quantity_reserved NUMERIC(10,4) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'cancelled')),
    reserved_by UUID NOT NULL REFERENCES users(id),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_lp_reservations_lp_id ON lp_reservations(lp_id);
CREATE INDEX idx_lp_reservations_wo_id ON lp_reservations(wo_id);
CREATE INDEX idx_lp_reservations_status ON lp_reservations(status);
CREATE INDEX idx_lp_reservations_expires_at ON lp_reservations(expires_at);
CREATE INDEX idx_lp_reservations_active ON lp_reservations(lp_id, status) WHERE status = 'active';

-- Add unique constraint to prevent duplicate active reservations for same LP+WO+Operation
CREATE UNIQUE INDEX idx_lp_reservations_unique_active 
ON lp_reservations(lp_id, wo_id, operation_id) 
WHERE status = 'active';

-- Add comments for documentation
COMMENT ON TABLE lp_reservations IS 'License plate reservations to prevent double-allocation in production';
COMMENT ON COLUMN lp_reservations.quantity_reserved IS 'Quantity reserved from the license plate';
COMMENT ON COLUMN lp_reservations.status IS 'Reservation status: active, consumed, or cancelled';
COMMENT ON COLUMN lp_reservations.expires_at IS 'Optional expiration time for the reservation';

-- Create function to get available quantity for a license plate
CREATE OR REPLACE FUNCTION get_available_quantity(lp_id_param INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    lp_quantity NUMERIC;
    reserved_quantity NUMERIC;
BEGIN
    -- Get total quantity of the license plate
    SELECT quantity INTO lp_quantity
    FROM license_plates
    WHERE id = lp_id_param;
    
    -- If LP not found, return 0
    IF lp_quantity IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get total reserved quantity (active reservations only)
    SELECT COALESCE(SUM(quantity_reserved), 0) INTO reserved_quantity
    FROM lp_reservations
    WHERE lp_id = lp_id_param AND status = 'active';
    
    -- Return available quantity
    RETURN lp_quantity - reserved_quantity;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if reservation is valid (no conflicts)
CREATE OR REPLACE FUNCTION validate_reservation(
    lp_id_param INTEGER,
    quantity_param NUMERIC,
    wo_id_param INTEGER,
    operation_id_param INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    available_qty NUMERIC;
BEGIN
    -- Get available quantity
    available_qty := get_available_quantity(lp_id_param);
    
    -- Check if requested quantity is available
    RETURN available_qty >= quantity_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically expire old reservations
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE lp_reservations
    SET status = 'cancelled',
        updated_at = NOW(),
        notes = COALESCE(notes, '') || ' Auto-expired at ' || NOW()::text
    WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lp_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lp_reservations_updated_at
    BEFORE UPDATE ON lp_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_lp_reservations_updated_at();

-- Add RLS policies
ALTER TABLE lp_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read lp_reservations" ON lp_reservations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert lp_reservations" ON lp_reservations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update lp_reservations" ON lp_reservations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add check constraints
ALTER TABLE lp_reservations 
ADD CONSTRAINT check_quantity_reserved_positive 
CHECK (quantity_reserved > 0);

ALTER TABLE lp_reservations 
ADD CONSTRAINT check_expires_at_future 
CHECK (expires_at IS NULL OR expires_at > reserved_at);

-- Create view for easy reservation status checking
CREATE VIEW lp_reservation_status AS
SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.quantity as total_quantity,
    get_available_quantity(lp.id) as available_quantity,
    COALESCE(SUM(CASE WHEN lr.status = 'active' THEN lr.quantity_reserved ELSE 0 END), 0) as reserved_quantity,
    COUNT(lr.id) as reservation_count
FROM license_plates lp
LEFT JOIN lp_reservations lr ON lr.lp_id = lp.id
GROUP BY lp.id, lp.lp_number, lp.quantity;

-- Add comment for the view
COMMENT ON VIEW lp_reservation_status IS 'View showing reservation status for all license plates';
