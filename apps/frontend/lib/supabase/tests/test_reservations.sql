-- Test LP Reservations and Available Quantity Calculations
-- Tests the reservation system and available quantity calculations

-- Test 1: Basic reservation creation
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES (1, 1, 25.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- Verify reservation was created
SELECT 
    lp_id,
    wo_id,
    quantity_reserved,
    status,
    reserved_at
FROM lp_reservations 
WHERE lp_id = 1 AND wo_id = 1;

-- Test 2: Available quantity calculation
-- Create a test LP with known quantity
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('TEST-LP-001', 1, 100.0, 'kg', 1, 'Passed');

-- Get the LP ID
SELECT id INTO @test_lp_id FROM license_plates WHERE lp_number = 'TEST-LP-001';

-- Create multiple reservations
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES 
    (@test_lp_id, 1, 30.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000'),
    (@test_lp_id, 2, 20.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000'),
    (@test_lp_id, 3, 15.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- Test available quantity calculation function
SELECT get_available_quantity(@test_lp_id) as available_qty;

-- Test 3: Reservation status transitions
-- Mark first reservation as consumed
UPDATE lp_reservations 
SET status = 'consumed', consumed_at = NOW() 
WHERE lp_id = @test_lp_id AND wo_id = 1;

-- Mark second reservation as expired
UPDATE lp_reservations 
SET status = 'expired', expires_at = NOW() 
WHERE lp_id = @test_lp_id AND wo_id = 2;

-- Mark third reservation as cancelled
UPDATE lp_reservations 
SET status = 'cancelled', cancelled_at = NOW() 
WHERE lp_id = @test_lp_id AND wo_id = 3;

-- Verify status transitions
SELECT 
    wo_id,
    status,
    consumed_at,
    expires_at,
    cancelled_at
FROM lp_reservations 
WHERE lp_id = @test_lp_id
ORDER BY wo_id;

-- Test 4: Available quantity after status changes
-- Should now show full quantity available (100kg)
SELECT get_available_quantity(@test_lp_id) as available_qty;

-- Test 5: Partial consumption
-- Create new reservations
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES 
    (@test_lp_id, 4, 40.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000'),
    (@test_lp_id, 5, 25.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- Available quantity should be 35kg (100 - 40 - 25)
SELECT get_available_quantity(@test_lp_id) as available_qty;

-- Test 6: Reservation conflicts
-- Try to create a reservation that exceeds available quantity
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES (@test_lp_id, 6, 50.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- This should fail due to insufficient quantity
-- Check if the reservation was created (it shouldn't be)
SELECT COUNT(*) as reservation_count
FROM lp_reservations 
WHERE lp_id = @test_lp_id AND wo_id = 6;

-- Test 7: Multiple LPs with reservations
-- Create another test LP
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('TEST-LP-002', 2, 200.0, 'kg', 1, 'Passed');

-- Get the second LP ID
SELECT id INTO @test_lp_id_2 FROM license_plates WHERE lp_number = 'TEST-LP-002';

-- Create reservations for second LP
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES 
    (@test_lp_id_2, 7, 50.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000'),
    (@test_lp_id_2, 8, 75.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- Test available quantities for both LPs
SELECT 
    lp_id,
    get_available_quantity(lp_id) as available_qty
FROM license_plates 
WHERE lp_number IN ('TEST-LP-001', 'TEST-LP-002');

-- Test 8: Reservation expiration
-- Create a reservation with expiration
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by, expires_at)
VALUES (@test_lp_id_2, 9, 30.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000', NOW() + INTERVAL 1 HOUR);

-- Check available quantity (should be 45kg: 200 - 50 - 75 - 30)
SELECT get_available_quantity(@test_lp_id_2) as available_qty;

-- Test 9: Reservation with different UOMs
-- Create reservation with different UOM
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES (@test_lp_id_2, 10, 25.0, 'lbs', 'active', '00000000-0000-0000-0000-000000000000');

-- Verify UOM is stored correctly
SELECT 
    wo_id,
    quantity_reserved,
    uom
FROM lp_reservations 
WHERE lp_id = @test_lp_id_2 AND wo_id = 10;

-- Test 10: Reservation audit trail
-- Check reservation history
SELECT 
    lp_id,
    wo_id,
    quantity_reserved,
    status,
    reserved_at,
    consumed_at,
    expires_at,
    cancelled_at
FROM lp_reservations 
WHERE lp_id = @test_lp_id_2
ORDER BY reserved_at;

-- Test 11: Reservation cleanup
-- Clean up expired reservations
UPDATE lp_reservations 
SET status = 'expired' 
WHERE expires_at < NOW() AND status = 'active';

-- Verify expired reservations
SELECT 
    wo_id,
    status,
    expires_at
FROM lp_reservations 
WHERE lp_id = @test_lp_id_2 AND status = 'expired';

-- Test 12: Reservation summary
-- Get reservation summary for a work order
SELECT 
    wo_id,
    COUNT(*) as total_reservations,
    SUM(quantity_reserved) as total_reserved,
    SUM(CASE WHEN status = 'active' THEN quantity_reserved ELSE 0 END) as active_reserved,
    SUM(CASE WHEN status = 'consumed' THEN quantity_reserved ELSE 0 END) as consumed_reserved
FROM lp_reservations 
WHERE wo_id IN (4, 5, 7, 8)
GROUP BY wo_id;

-- Cleanup test data
DELETE FROM lp_reservations WHERE lp_id IN (@test_lp_id, @test_lp_id_2);
DELETE FROM license_plates WHERE lp_number IN ('TEST-LP-001', 'TEST-LP-002');

