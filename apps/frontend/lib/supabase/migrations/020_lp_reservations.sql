-- Phase 20: LP Reservations Migration
-- This migration creates the lp_reservations table for tracking reserved quantities

-- Create reservation status enum
CREATE TYPE reservation_status_enum AS ENUM (
    'active',      -- Active reservation
    'consumed',    -- Reservation consumed by operation
    'expired',     -- Reservation expired
    'cancelled'    -- Reservation cancelled
);

-- Create lp_reservations table
CREATE TABLE lp_reservations (
    id SERIAL PRIMARY KEY,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
    wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    qty NUMERIC(10,4) NOT NULL,
    status reservation_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    consumed_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_by UUID REFERENCES users(id),
    consumed_by UUID REFERENCES users(id),
    cancelled_by UUID REFERENCES users(id),
    reason TEXT NULL
);

-- Add indexes for performance
CREATE INDEX idx_lp_reservations_lp_id ON lp_reservations(lp_id);
CREATE INDEX idx_lp_reservations_wo_id ON lp_reservations(wo_id);
CREATE INDEX idx_lp_reservations_status ON lp_reservations(status);
CREATE INDEX idx_lp_reservations_active ON lp_reservations(lp_id, status) WHERE status = 'active';
CREATE INDEX idx_lp_reservations_expires ON lp_reservations(expires_at) WHERE expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE lp_reservations IS 'Tracks reserved quantities for work orders to prevent double-booking';
COMMENT ON COLUMN lp_reservations.lp_id IS 'License plate being reserved';
COMMENT ON COLUMN lp_reservations.wo_id IS 'Work order reserving the material';
COMMENT ON COLUMN lp_reservations.qty IS 'Quantity reserved';
COMMENT ON COLUMN lp_reservations.status IS 'Reservation status lifecycle';
COMMENT ON COLUMN lp_reservations.expires_at IS 'Reservation expiration time';
COMMENT ON COLUMN lp_reservations.reason IS 'Reason for reservation or cancellation';

-- Add check constraints
ALTER TABLE lp_reservations 
ADD CONSTRAINT check_qty_positive 
CHECK (qty > 0);

ALTER TABLE lp_reservations 
ADD CONSTRAINT check_expires_after_created 
CHECK (expires_at IS NULL OR expires_at > created_at);

-- Create function to calculate available quantity
CREATE OR REPLACE FUNCTION get_lp_available_qty(lp_id_param INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    total_qty NUMERIC;
    reserved_qty NUMERIC;
    available_qty NUMERIC;
BEGIN
    -- Get total quantity
    SELECT quantity INTO total_qty
    FROM license_plates
    WHERE id = lp_id_param;
    
    IF total_qty IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get reserved quantity (active reservations only)
    SELECT COALESCE(SUM(qty), 0) INTO reserved_qty
    FROM lp_reservations
    WHERE lp_id = lp_id_param 
      AND status = 'active';
    
    -- Calculate available quantity
    available_qty := total_qty - reserved_qty;
    
    RETURN GREATEST(available_qty, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to check if quantity can be reserved
CREATE OR REPLACE FUNCTION can_reserve_lp_qty(
    lp_id_param INTEGER,
    qty_to_reserve NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    available_qty NUMERIC;
BEGIN
    available_qty := get_lp_available_qty(lp_id_param);
    RETURN available_qty >= qty_to_reserve;
END;
$$ LANGUAGE plpgsql;

-- Add comments for functions
COMMENT ON FUNCTION get_lp_available_qty(INTEGER) IS 'Calculate available quantity for LP (total - active reservations)';
COMMENT ON FUNCTION can_reserve_lp_qty(INTEGER, NUMERIC) IS 'Check if specified quantity can be reserved for LP';

-- Create trigger to update reservation status on expiration
CREATE OR REPLACE FUNCTION update_expired_reservations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update expired reservations
    UPDATE lp_reservations 
    SET status = 'expired',
        cancelled_at = NOW()
    WHERE status = 'active' 
      AND expires_at IS NOT NULL 
      AND expires_at <= NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run on any reservation change
CREATE TRIGGER trigger_update_expired_reservations
    AFTER INSERT OR UPDATE OR DELETE ON lp_reservations
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_expired_reservations();
