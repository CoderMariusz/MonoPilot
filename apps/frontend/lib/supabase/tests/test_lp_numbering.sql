-- Test LP Numbering with 8-digit Core and Parent Relationships
-- Tests the LP numbering trigger and parent-child relationships

-- Test 1: Basic LP numbering
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES ('LP00000001', 1, 100.0, 'kg', 1, 'Passed');

-- Verify the LP was created with correct numbering
SELECT 
    lp_number,
    product_id,
    quantity,
    qa_status
FROM license_plates 
WHERE lp_number = 'LP00000001';

-- Test 2: Parent-child LP relationship
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status, parent_lp_id, parent_lp_number)
VALUES ('LP00000002', 2, 50.0, 'kg', 1, 'Passed', 1, 'LP00000001');

-- Verify parent-child relationship
SELECT 
    lp_number,
    parent_lp_number,
    product_id,
    quantity
FROM license_plates 
WHERE lp_number = 'LP00000002';

-- Test 3: Stage suffix with 2-letter codes
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status, stage_suffix)
VALUES ('LP00000003-RS', 3, 25.0, 'kg', 1, 'Passed', '-RS');

INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status, stage_suffix)
VALUES ('LP00000004-SM', 4, 30.0, 'kg', 1, 'Passed', '-SM');

-- Verify stage suffixes are valid
SELECT 
    lp_number,
    stage_suffix,
    qa_status
FROM license_plates 
WHERE stage_suffix IN ('-RS', '-SM');

-- Test 4: LP numbering sequence
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES 
    ('LP00000005', 5, 40.0, 'kg', 1, 'Passed'),
    ('LP00000006', 6, 35.0, 'kg', 1, 'Passed'),
    ('LP00000007', 7, 45.0, 'kg', 1, 'Passed');

-- Verify sequential numbering
SELECT 
    lp_number,
    product_id,
    quantity
FROM license_plates 
WHERE lp_number LIKE 'LP0000000%'
ORDER BY lp_number;

-- Test 5: Complex parent-child chain
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status, parent_lp_id, parent_lp_number)
VALUES ('LP00000008', 8, 20.0, 'kg', 1, 'Passed', 2, 'LP00000002');

-- Verify the chain: LP00000001 -> LP00000002 -> LP00000008
SELECT 
    l1.lp_number as root_lp,
    l2.lp_number as child_lp,
    l3.lp_number as grandchild_lp
FROM license_plates l1
LEFT JOIN license_plates l2 ON l1.id = l2.parent_lp_id
LEFT JOIN license_plates l3 ON l2.id = l3.parent_lp_id
WHERE l1.lp_number = 'LP00000001';

-- Test 6: LP numbering with different products
INSERT INTO license_plates (lp_number, product_id, quantity, uom, location_id, qa_status)
VALUES 
    ('LP00000009', 9, 60.0, 'kg', 1, 'Passed'),
    ('LP00000010', 10, 70.0, 'kg', 1, 'Passed');

-- Verify all LPs are numbered correctly
SELECT 
    COUNT(*) as total_lps,
    MIN(lp_number) as first_lp,
    MAX(lp_number) as last_lp
FROM license_plates 
WHERE lp_number LIKE 'LP%';

-- Test 7: LP numbering with QA status transitions
UPDATE license_plates 
SET qa_status = 'Failed' 
WHERE lp_number = 'LP00000003-RS';

UPDATE license_plates 
SET qa_status = 'Quarantine' 
WHERE lp_number = 'LP00000004-SM';

-- Verify QA status changes don't affect numbering
SELECT 
    lp_number,
    qa_status,
    stage_suffix
FROM license_plates 
WHERE lp_number IN ('LP00000003-RS', 'LP00000004-SM');

-- Test 8: LP numbering with location changes
UPDATE license_plates 
SET location_id = 2 
WHERE lp_number = 'LP00000005';

-- Verify location changes don't affect numbering
SELECT 
    lp_number,
    location_id,
    qa_status
FROM license_plates 
WHERE lp_number = 'LP00000005';

-- Test 9: LP numbering with quantity changes
UPDATE license_plates 
SET quantity = 75.0 
WHERE lp_number = 'LP00000006';

-- Verify quantity changes don't affect numbering
SELECT 
    lp_number,
    quantity,
    uom
FROM license_plates 
WHERE lp_number = 'LP00000006';

-- Test 10: LP numbering with composition relationships
INSERT INTO lp_compositions (parent_lp_id, child_lp_id, quantity, uom)
VALUES (1, 2, 50.0, 'kg');

-- Verify composition relationship
SELECT 
    p.lp_number as parent_lp,
    c.lp_number as child_lp,
    lc.quantity,
    lc.uom
FROM lp_compositions lc
JOIN license_plates p ON lc.parent_lp_id = p.id
JOIN license_plates c ON lc.child_lp_id = c.id;

-- Cleanup test data
DELETE FROM lp_compositions WHERE parent_lp_id IN (1, 2);
DELETE FROM license_plates WHERE lp_number LIKE 'LP000000%';

