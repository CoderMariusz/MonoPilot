-- Test QA Gate Enforcement and Overrides
-- Tests the QA gate system for blocking operations with failed QA status

-- Test 1: QA Gate with Passed status
-- Create LP with Passed QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-TEST-PASSED', 1, 100.0, 'kg', 1, 'Passed');

-- Get LP ID
SELECT id INTO @qa_passed_id FROM license_plates WHERE lp_number = 'QA-TEST-PASSED';

-- Create work order
INSERT INTO work_orders (wo_number, product_id, quantity, uom, status, kpi_scope)
VALUES ('WO-QA-TEST-001', 1, 100.0, 'kg', 'in_progress', 'PR');

-- Get work order ID
SELECT id INTO @wo_id FROM work_orders WHERE wo_number = 'WO-QA-TEST-001';

-- Test WO_ISSUE with Passed QA status (should succeed)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-PASSED-001', @qa_passed_id, 1, 1, 1, 50.0, 'kg', 'WO_ISSUE', 'completed', @wo_id);

-- Verify the move was created
SELECT 
    move_number,
    lp_id,
    move_type,
    status,
    quantity
FROM stock_moves 
WHERE move_number = 'SM-QA-PASSED-001';

-- Test 2: QA Gate with Failed status
-- Create LP with Failed QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-TEST-FAILED', 2, 100.0, 'kg', 1, 'Failed');

-- Get LP ID
SELECT id INTO @qa_failed_id FROM license_plates WHERE lp_number = 'QA-TEST-FAILED';

-- Test WO_ISSUE with Failed QA status (should be blocked by trigger)
-- This should fail due to QA gate enforcement
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-FAILED-001', @qa_failed_id, 2, 1, 1, 50.0, 'kg', 'WO_ISSUE', 'completed', @wo_id);

-- Verify the move was NOT created (should be 0 rows)
SELECT COUNT(*) as failed_move_count
FROM stock_moves 
WHERE move_number = 'SM-QA-FAILED-001';

-- Test 3: QA Gate with Quarantine status
-- Create LP with Quarantine QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-TEST-QUARANTINE', 3, 100.0, 'kg', 1, 'Quarantine');

-- Get LP ID
SELECT id INTO @qa_quarantine_id FROM license_plates WHERE lp_number = 'QA-TEST-QUARANTINE';

-- Test WO_ISSUE with Quarantine QA status (should be blocked)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-QUARANTINE-001', @qa_quarantine_id, 3, 1, 1, 50.0, 'kg', 'WO_ISSUE', 'completed', @wo_id);

-- Verify the move was NOT created
SELECT COUNT(*) as quarantine_move_count
FROM stock_moves 
WHERE move_number = 'SM-QA-QUARANTINE-001';

-- Test 4: QA Gate with Pending status
-- Create LP with Pending QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-TEST-PENDING', 4, 100.0, 'kg', 1, 'Pending');

-- Get LP ID
SELECT id INTO @qa_pending_id FROM license_plates WHERE lp_number = 'QA-TEST-PENDING';

-- Test WO_ISSUE with Pending QA status (should be blocked)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-PENDING-001', @qa_pending_id, 4, 1, 1, 50.0, 'kg', 'WO_ISSUE', 'completed', @wo_id);

-- Verify the move was NOT created
SELECT COUNT(*) as pending_move_count
FROM stock_moves 
WHERE move_number = 'SM-QA-PENDING-001';

-- Test 5: QA Gate with WO_OUTPUT
-- Create output LP with Failed QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-OUTPUT-FAILED', 5, 80.0, 'kg', 1, 'Failed');

-- Get output LP ID
SELECT id INTO @qa_output_failed_id FROM license_plates WHERE lp_number = 'QA-OUTPUT-FAILED';

-- Test WO_OUTPUT with Failed QA status (should be blocked)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-OUTPUT-FAILED-001', @qa_output_failed_id, 5, 1, 1, 80.0, 'kg', 'WO_OUTPUT', 'completed', @wo_id);

-- Verify the move was NOT created
SELECT COUNT(*) as output_failed_move_count
FROM stock_moves 
WHERE move_number = 'SM-QA-OUTPUT-FAILED-001';

-- Test 6: QA Override with supervisor PIN
-- Create LP for override test
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-OVERRIDE-TEST', 6, 100.0, 'kg', 1, 'Failed');

-- Get LP ID
SELECT id INTO @qa_override_id FROM license_plates WHERE lp_number = 'QA-OVERRIDE-TEST';

-- Simulate QA override (update QA status to Passed)
UPDATE license_plates 
SET qa_status = 'Passed' 
WHERE id = @qa_override_id;

-- Verify QA status was updated
SELECT 
    lp_number,
    qa_status
FROM license_plates 
WHERE lp_number = 'QA-OVERRIDE-TEST';

-- Test WO_ISSUE after override (should now succeed)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-OVERRIDE-001', @qa_override_id, 6, 1, 1, 50.0, 'kg', 'WO_ISSUE', 'completed', @wo_id);

-- Verify the move was created after override
SELECT 
    move_number,
    lp_id,
    move_type,
    status,
    quantity
FROM stock_moves 
WHERE move_number = 'SM-QA-OVERRIDE-001';

-- Test 7: QA Gate with different move types
-- Test ADJUST move (should not be blocked by QA gate)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-ADJUST-001', @qa_failed_id, 2, 1, 1, 10.0, 'kg', 'ADJUST', 'completed', @wo_id);

-- Verify ADJUST move was created (should not be blocked)
SELECT 
    move_number,
    lp_id,
    move_type,
    status,
    quantity
FROM stock_moves 
WHERE move_number = 'SM-QA-ADJUST-001';

-- Test TRANSFER move (should not be blocked by QA gate)
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES ('SM-QA-TRANSFER-001', @qa_failed_id, 2, 1, 2, 20.0, 'kg', 'TRANSFER', 'completed', @wo_id);

-- Verify TRANSFER move was created
SELECT 
    move_number,
    lp_id,
    move_type,
    status,
    quantity
FROM stock_moves 
WHERE move_number = 'SM-QA-TRANSFER-001';

-- Test 8: QA Gate with reservations
-- Create reservation for Failed QA LP (should be blocked)
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES (@qa_failed_id, @wo_id, 30.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- Verify reservation was NOT created (should be 0 rows)
SELECT COUNT(*) as failed_reservation_count
FROM lp_reservations 
WHERE lp_id = @qa_failed_id;

-- Test 9: QA Gate with Passed QA reservation
-- Create reservation for Passed QA LP (should succeed)
INSERT INTO lp_reservations (lp_id, wo_id, quantity_reserved, uom, status, reserved_by)
VALUES (@qa_passed_id, @wo_id, 25.0, 'kg', 'active', '00000000-0000-0000-0000-000000000000');

-- Verify reservation was created
SELECT 
    lp_id,
    wo_id,
    quantity_reserved,
    status
FROM lp_reservations 
WHERE lp_id = @qa_passed_id;

-- Test 10: QA Gate with compositions
-- Create parent LP with Failed QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-COMP-PARENT-FAILED', 7, 100.0, 'kg', 1, 'Failed');

-- Get parent LP ID
SELECT id INTO @qa_comp_parent_id FROM license_plates WHERE lp_number = 'QA-COMP-PARENT-FAILED';

-- Create child LP with Passed QA status
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('QA-COMP-CHILD-PASSED', 8, 80.0, 'kg', 1, 'Passed');

-- Get child LP ID
SELECT id INTO @qa_comp_child_id FROM license_plates WHERE lp_number = 'QA-COMP-CHILD-PASSED';

-- Test composition with Failed parent (should be blocked)
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES (@qa_comp_parent_id, @qa_comp_child_id, 80.0, 'kg');

-- Verify composition was NOT created
SELECT COUNT(*) as failed_composition_count
FROM lp_compositions 
WHERE parent_lp_id = @qa_comp_parent_id;

-- Test 11: QA Gate with pallets
-- Create pallet
INSERT INTO pallets (pallet_number, location_id, status)
VALUES ('PLT-QA-TEST-001', 1, 'packed');

-- Get pallet ID
SELECT id INTO @pallet_id FROM pallets WHERE pallet_number = 'PLT-QA-TEST-001';

-- Test pallet item with Failed QA LP (should be blocked)
INSERT INTO pallet_items (pallet_id, lp_id, quantity, uom)
VALUES (@pallet_id, @qa_failed_id, 40.0, 'kg');

-- Verify pallet item was NOT created
SELECT COUNT(*) as failed_pallet_item_count
FROM pallet_items 
WHERE pallet_id = @pallet_id AND lp_id = @qa_failed_id;

-- Test pallet item with Passed QA LP (should succeed)
INSERT INTO pallet_items (pallet_id, lp_id, quantity, uom)
VALUES (@pallet_id, @qa_passed_id, 30.0, 'kg');

-- Verify pallet item was created
SELECT 
    pallet_id,
    lp_id,
    quantity,
    uom
FROM pallet_items 
WHERE pallet_id = @pallet_id AND lp_id = @qa_passed_id;

-- Test 12: QA Gate summary
-- Get summary of QA statuses and blocked operations
SELECT 
    qa_status,
    COUNT(*) as lp_count,
    SUM(CASE WHEN qa_status = 'Passed' THEN 1 ELSE 0 END) as passed_count,
    SUM(CASE WHEN qa_status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
    SUM(CASE WHEN qa_status = 'Quarantine' THEN 1 ELSE 0 END) as quarantine_count,
    SUM(CASE WHEN qa_status = 'Pending' THEN 1 ELSE 0 END) as pending_count
FROM license_plates 
WHERE lp_number LIKE 'QA-%'
GROUP BY qa_status;

-- Cleanup test data
DELETE FROM pallet_items WHERE pallet_id = @pallet_id;
DELETE FROM pallets WHERE pallet_number = 'PLT-QA-TEST-001';
DELETE FROM lp_reservations WHERE lp_id = @qa_passed_id;
DELETE FROM stock_moves WHERE move_number LIKE 'SM-QA-%';
DELETE FROM license_plates WHERE lp_number LIKE 'QA-%';
DELETE FROM work_orders WHERE wo_number = 'WO-QA-TEST-001';

