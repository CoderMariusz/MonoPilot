-- Test LP Compositions and Composition Chains
-- Tests the composition system for forward/backward traceability

-- Test 1: Basic composition creation
-- Create parent LP
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('COMP-PARENT-001', 1, 100.0, 'kg', 1, 'Passed');

-- Create child LPs
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES 
    ('COMP-CHILD-001', 2, 50.0, 'kg', 1, 'Passed'),
    ('COMP-CHILD-002', 3, 30.0, 'kg', 1, 'Passed'),
    ('COMP-CHILD-003', 4, 20.0, 'kg', 1, 'Passed');

-- Get LP IDs
SELECT id INTO @parent_lp_id FROM license_plates WHERE lp_number = 'COMP-PARENT-001';
SELECT id INTO @child1_id FROM license_plates WHERE lp_number = 'COMP-CHILD-001';
SELECT id INTO @child2_id FROM license_plates WHERE lp_number = 'COMP-CHILD-002';
SELECT id INTO @child3_id FROM license_plates WHERE lp_number = 'COMP-CHILD-003';

-- Create compositions
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES 
    (@parent_lp_id, @child1_id, 50.0, 'kg'),
    (@parent_lp_id, @child2_id, 30.0, 'kg'),
    (@parent_lp_id, @child3_id, 20.0, 'kg');

-- Verify compositions were created
SELECT 
    p.lp_number as parent_lp,
    c.lp_number as child_lp,
    lc.quantity,
    lc.uom
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id
WHERE p.lp_number = 'COMP-PARENT-001';

-- Test 2: Multi-level composition chain
-- Create grandchild LPs
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES 
    ('COMP-GRANDCHILD-001', 5, 25.0, 'kg', 1, 'Passed'),
    ('COMP-GRANDCHILD-002', 6, 25.0, 'kg', 1, 'Passed');

-- Get grandchild IDs
SELECT id INTO @grandchild1_id FROM license_plates WHERE lp_number = 'COMP-GRANDCHILD-001';
SELECT id INTO @grandchild2_id FROM license_plates WHERE lp_number = 'COMP-GRANDCHILD-002';

-- Create second level compositions
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES 
    (@child1_id, @grandchild1_id, 25.0, 'kg'),
    (@child1_id, @grandchild2_id, 25.0, 'kg');

-- Verify multi-level composition
SELECT 
    p.lp_number as parent_lp,
    c.lp_number as child_lp,
    gc.lp_number as grandchild_lp,
    lc1.quantity as parent_child_qty,
    lc2.quantity as child_grandchild_qty
FROM lp_compositions lc1
JOIN license_plates p ON lc1.parent_lp_id = p.id
JOIN license_plates c ON lc1.child_lp_id = c.id
LEFT JOIN lp_compositions lc2 ON c.id = lc2.parent_lp_id
LEFT JOIN license_plates gc ON lc2.child_lp_id = gc.id
WHERE p.lp_number = 'COMP-PARENT-001'
ORDER BY c.lp_number, gc.lp_number;

-- Test 3: Composition with different UOMs
-- Create LP with different UOM
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('COMP-UOM-TEST', 7, 50.0, 'lbs', 1, 'Passed');

-- Get UOM test LP ID
SELECT id INTO @uom_lp_id FROM license_plates WHERE lp_number = 'COMP-UOM-TEST';

-- Create composition with different UOM
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES (@parent_lp_id, @uom_lp_id, 10.0, 'lbs');

-- Verify UOM is preserved
SELECT 
    p.lp_number as parent_lp,
    p.uom as parent_uom,
    c.lp_number as child_lp,
    c.uom as child_uom,
    lc.quantity,
    lc.uom as composition_uom
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id
WHERE p.lp_number = 'COMP-PARENT-001' AND c.lp_number = 'COMP-UOM-TEST';

-- Test 4: Composition with stage suffixes
-- Create LPs with stage suffixes
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status, stage_suffix)
VALUES 
    ('COMP-STAGE-001', 8, 40.0, 'kg', 1, 'Passed', '-RS'),
    ('COMP-STAGE-002', 9, 35.0, 'kg', 1, 'Passed', '-SM');

-- Get stage LP IDs
SELECT id INTO @stage1_id FROM license_plates WHERE lp_number = 'COMP-STAGE-001';
SELECT id INTO @stage2_id FROM license_plates WHERE lp_number = 'COMP-STAGE-002';

-- Create compositions with stage suffixes
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES 
    (@parent_lp_id, @stage1_id, 40.0, 'kg'),
    (@parent_lp_id, @stage2_id, 35.0, 'kg');

-- Verify stage suffixes in composition
SELECT 
    p.lp_number as parent_lp,
    c.lp_number as child_lp,
    c.stage_suffix,
    lc.quantity
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id
WHERE p.lp_number = 'COMP-PARENT-001' AND c.stage_suffix IS NOT NULL;

-- Test 5: Composition with QA status
-- Create LPs with different QA statuses
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES 
    ('COMP-QA-PASSED', 10, 30.0, 'kg', 1, 'Passed'),
    ('COMP-QA-FAILED', 11, 20.0, 'kg', 1, 'Failed'),
    ('COMP-QA-QUARANTINE', 12, 15.0, 'kg', 1, 'Quarantine');

-- Get QA test LP IDs
SELECT id INTO @qa_passed_id FROM license_plates WHERE lp_number = 'COMP-QA-PASSED';
SELECT id INTO @qa_failed_id FROM license_plates WHERE lp_number = 'COMP-QA-FAILED';
SELECT id INTO @qa_quarantine_id FROM license_plates WHERE lp_number = 'COMP-QA-QUARANTINE';

-- Create compositions with different QA statuses
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES 
    (@parent_lp_id, @qa_passed_id, 30.0, 'kg'),
    (@parent_lp_id, @qa_failed_id, 20.0, 'kg'),
    (@parent_lp_id, @qa_quarantine_id, 15.0, 'kg');

-- Verify QA statuses in composition
SELECT 
    p.lp_number as parent_lp,
    c.lp_number as child_lp,
    c.qa_status,
    lc.quantity
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id
WHERE p.lp_number = 'COMP-PARENT-001' AND c.lp_number LIKE 'COMP-QA-%';

-- Test 6: Composition with locations
-- Create LPs in different locations
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES 
    ('COMP-LOC-001', 13, 25.0, 'kg', 1, 'Passed'),
    ('COMP-LOC-002', 14, 20.0, 'kg', 2, 'Passed');

-- Get location test LP IDs
SELECT id INTO @loc1_id FROM license_plates WHERE lp_number = 'COMP-LOC-001';
SELECT id INTO @loc2_id FROM license_plates WHERE lp_number = 'COMP-LOC-002';

-- Create compositions with different locations
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES 
    (@parent_lp_id, @loc1_id, 25.0, 'kg'),
    (@parent_lp_id, @loc2_id, 20.0, 'kg');

-- Verify locations in composition
SELECT 
    p.lp_number as parent_lp,
    p.location_id as parent_location,
    c.lp_number as child_lp,
    c.location_id as child_location,
    lc.quantity
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id
WHERE p.lp_number = 'COMP-PARENT-001' AND c.lp_number LIKE 'COMP-LOC-%';

-- Test 7: Composition with work orders
-- Create work order
INSERT INTO work_orders (wo_number, product_id, quantity, uom, status, kpi_scope)
VALUES ('WO-COMP-TEST-001', 1, 100.0, 'kg', 'in_progress', 'PR');

-- Get work order ID
SELECT id INTO @wo_id FROM work_orders WHERE wo_number = 'WO-COMP-TEST-001';

-- Create LPs for work order
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status, origin_type, origin_ref)
VALUES 
    ('COMP-WO-INPUT', 15, 100.0, 'kg', 1, 'Passed', 'WO', @wo_id),
    ('COMP-WO-OUTPUT', 16, 80.0, 'kg', 1, 'Passed', 'WO', @wo_id);

-- Get WO LP IDs
SELECT id INTO @wo_input_id FROM license_plates WHERE lp_number = 'COMP-WO-INPUT';
SELECT id INTO @wo_output_id FROM license_plates WHERE lp_number = 'COMP-WO-OUTPUT';

-- Create composition for work order
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES (@wo_input_id, @wo_output_id, 80.0, 'kg');

-- Verify work order composition
SELECT 
    p.lp_number as input_lp,
    p.origin_ref as input_wo,
    c.lp_number as output_lp,
    c.origin_ref as output_wo,
    lc.quantity
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id
WHERE p.lp_number = 'COMP-WO-INPUT';

-- Test 8: Composition with pallets
-- Create pallet
INSERT INTO pallets (pallet_number, location_id, status)
VALUES ('PLT-COMP-TEST-001', 1, 'packed');

-- Get pallet ID
SELECT id INTO @pallet_id FROM pallets WHERE pallet_number = 'PLT-COMP-TEST-001';

-- Create pallet items
INSERT INTO pallet_items (pallet_id, lp_id, quantity, uom)
VALUES 
    (@pallet_id, @wo_output_id, 40.0, 'kg'),
    (@pallet_id, @child1_id, 30.0, 'kg');

-- Verify pallet composition
SELECT 
    p.pallet_number,
    l.lp_number,
    pi.quantity,
    pi.uom
FROM pallet_items pi
JOIN pallets p ON pi.pallet_id = p.id
JOIN license_plates l ON pi.lp_id = l.id
WHERE p.pallet_number = 'PLT-COMP-TEST-001';

-- Test 9: Composition with stock moves
-- Create stock moves for composition
INSERT INTO stock_moves (move_number, lp_id, product_id, from_location_id, to_location_id, quantity, uom, move_type, status, wo_id)
VALUES 
    ('SM-COMP-001', @wo_input_id, 15, 1, 1, 100.0, 'kg', 'WO_ISSUE', 'completed', @wo_id),
    ('SM-COMP-002', @wo_output_id, 16, 1, 1, 80.0, 'kg', 'WO_OUTPUT', 'completed', @wo_id);

-- Verify stock moves with composition
SELECT 
    sm.move_number,
    l.lp_number,
    sm.move_type,
    sm.quantity,
    sm.wo_id
FROM stock_moves sm
JOIN license_plates l ON sm.lp_id = l.id
WHERE sm.move_number LIKE 'SM-COMP-%';

-- Test 10: Composition summary
-- Get composition summary for parent LP
SELECT 
    p.lp_number as parent_lp,
    COUNT(lc.child_lp_id) as child_count,
    SUM(lc.quantity) as total_child_quantity,
    AVG(lc.quantity) as avg_child_quantity
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
WHERE p.lp_number = 'COMP-PARENT-001'
GROUP BY p.lp_number;

-- Cleanup test data
DELETE FROM stock_moves WHERE move_number LIKE 'SM-COMP-%';
DELETE FROM pallet_items WHERE pallet_id = @pallet_id;
DELETE FROM pallets WHERE pallet_number = 'PLT-COMP-TEST-001';
DELETE FROM lp_compositions WHERE parent_lp_id = @parent_lp_id;
DELETE FROM lp_compositions WHERE parent_lp_id = @child1_id;
DELETE FROM lp_compositions WHERE parent_lp_id = @wo_input_id;
DELETE FROM license_plates WHERE lp_number LIKE 'COMP-%';
DELETE FROM work_orders WHERE wo_number = 'WO-COMP-TEST-001';

