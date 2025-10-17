-- Test Work Order BOM Snapshot Creation and Versioning
-- Tests the BOM snapshot system for work orders

-- Test 1: Basic BOM snapshot creation
-- Create BOM
INSERT INTO boms (version, status, effective_from, effective_to)
VALUES ('1.0', 'active', NOW(), NULL);

-- Get BOM ID
SELECT id INTO @bom_id FROM boms WHERE version = '1.0';

-- Create BOM items
INSERT INTO bom_items (bom_id, material_id, sequence, quantity, uom, is_optional, one_to_one, substitution_group)
VALUES 
    (@bom_id, 1, 1, 100.0, 'kg', false, true, NULL),
    (@bom_id, 2, 2, 50.0, 'kg', false, false, NULL),
    (@bom_id, 3, 3, 25.0, 'kg', true, false, 'GROUP-A'),
    (@bom_id, 4, 4, 10.0, 'kg', true, false, 'GROUP-A');

-- Create work order
INSERT INTO work_orders (wo_number, product_id, bom_id, quantity, uom, status, kpi_scope)
VALUES ('WO-BOM-TEST-001', 1, @bom_id, 100.0, 'kg', 'in_progress', 'PR');

-- Get work order ID
SELECT id INTO @wo_id FROM work_orders WHERE wo_number = 'WO-BOM-TEST-001';

-- Verify BOM snapshot was created automatically by trigger
SELECT 
    wo_id,
    bom_id,
    material_id,
    sequence,
    quantity,
    uom,
    is_optional,
    one_to_one,
    substitution_group
FROM wo_materials 
WHERE wo_id = @wo_id
ORDER BY sequence;

-- Test 2: BOM snapshot with different material types
-- Create another BOM with different materials
INSERT INTO boms (version, status, effective_from, effective_to)
VALUES ('2.0', 'active', NOW(), NULL);

-- Get second BOM ID
SELECT id INTO @bom_id_2 FROM boms WHERE version = '2.0';

-- Create BOM items with different configurations
INSERT INTO bom_items (bom_id, material_id, sequence, quantity, uom, is_optional, one_to_one, substitution_group)
VALUES 
    (@bom_id_2, 5, 1, 200.0, 'kg', false, true, NULL),
    (@bom_id_2, 6, 2, 75.0, 'kg', false, false, NULL),
    (@bom_id_2, 7, 3, 30.0, 'kg', true, true, 'GROUP-B'),
    (@bom_id_2, 8, 4, 15.0, 'kg', true, false, 'GROUP-B');

-- Create work order with second BOM
INSERT INTO work_orders (wo_number, product_id, bom_id, quantity, uom, status, kpi_scope)
VALUES ('WO-BOM-TEST-002', 2, @bom_id_2, 200.0, 'kg', 'in_progress', 'FG');

-- Get second work order ID
SELECT id INTO @wo_id_2 FROM work_orders WHERE wo_number = 'WO-BOM-TEST-002';

-- Verify second BOM snapshot
SELECT 
    wo_id,
    bom_id,
    material_id,
    sequence,
    quantity,
    uom,
    is_optional,
    one_to_one,
    substitution_group
FROM wo_materials 
WHERE wo_id = @wo_id_2
ORDER BY sequence;

-- Test 3: BOM snapshot with substitution groups
-- Verify substitution groups are captured
SELECT 
    wo_id,
    material_id,
    substitution_group,
    is_optional,
    one_to_one
FROM wo_materials 
WHERE wo_id = @wo_id_2 AND substitution_group IS NOT NULL
ORDER BY substitution_group, material_id;

-- Test 4: BOM snapshot with one-to-one materials
-- Verify one-to-one materials are captured
SELECT 
    wo_id,
    material_id,
    one_to_one,
    is_optional
FROM wo_materials 
WHERE wo_id = @wo_id_2 AND one_to_one = true;

-- Test 5: BOM snapshot with optional materials
-- Verify optional materials are captured
SELECT 
    wo_id,
    material_id,
    is_optional,
    substitution_group
FROM wo_materials 
WHERE wo_id = @wo_id_2 AND is_optional = true
ORDER BY substitution_group;

-- Test 6: BOM snapshot versioning
-- Update original BOM
UPDATE bom_items 
SET quantity = 150.0 
WHERE bom_id = @bom_id AND material_id = 1;

-- Add new material to BOM
INSERT INTO bom_items (bom_id, material_id, sequence, quantity, uom, is_optional, one_to_one, substitution_group)
VALUES (@bom_id, 9, 5, 20.0, 'kg', true, false, 'GROUP-C');

-- Create new work order with updated BOM
INSERT INTO work_orders (wo_number, product_id, bom_id, quantity, uom, status, kpi_scope)
VALUES ('WO-BOM-TEST-003', 1, @bom_id, 150.0, 'kg', 'in_progress', 'PR');

-- Get third work order ID
SELECT id INTO @wo_id_3 FROM work_orders WHERE wo_number = 'WO-BOM-TEST-003';

-- Verify new BOM snapshot reflects updated BOM
SELECT 
    wo_id,
    material_id,
    sequence,
    quantity,
    uom,
    is_optional,
    one_to_one,
    substitution_group
FROM wo_materials 
WHERE wo_id = @wo_id_3
ORDER BY sequence;

-- Test 7: BOM snapshot with different UOMs
-- Create BOM with different UOMs
INSERT INTO boms (version, status, effective_from, effective_to)
VALUES ('3.0', 'active', NOW(), NULL);

-- Get third BOM ID
SELECT id INTO @bom_id_3 FROM boms WHERE version = '3.0';

-- Create BOM items with different UOMs
INSERT INTO bom_items (bom_id, material_id, sequence, quantity, uom, is_optional, one_to_one, substitution_group)
VALUES 
    (@bom_id_3, 10, 1, 100.0, 'kg', false, true, NULL),
    (@bom_id_3, 11, 2, 50.0, 'lbs', false, false, NULL),
    (@bom_id_3, 12, 3, 25.0, 'g', true, false, 'GROUP-D'),
    (@bom_id_3, 13, 4, 10.0, 'oz', true, false, 'GROUP-D');

-- Create work order with third BOM
INSERT INTO work_orders (wo_number, product_id, bom_id, quantity, uom, status, kpi_scope)
VALUES ('WO-BOM-TEST-004', 3, @bom_id_3, 100.0, 'kg', 'in_progress', 'PR');

-- Get fourth work order ID
SELECT id INTO @wo_id_4 FROM work_orders WHERE wo_number = 'WO-BOM-TEST-004';

-- Verify UOMs are preserved in snapshot
SELECT 
    wo_id,
    material_id,
    quantity,
    uom
FROM wo_materials 
WHERE wo_id = @wo_id_4
ORDER BY sequence;

-- Test 8: BOM snapshot with complex substitution groups
-- Create BOM with complex substitution groups
INSERT INTO boms (version, status, effective_from, effective_to)
VALUES ('4.0', 'active', NOW(), NULL);

-- Get fourth BOM ID
SELECT id INTO @bom_id_4 FROM boms WHERE version = '4.0';

-- Create BOM items with complex substitution groups
INSERT INTO bom_items (bom_id, material_id, sequence, quantity, uom, is_optional, one_to_one, substitution_group)
VALUES 
    (@bom_id_4, 14, 1, 100.0, 'kg', false, true, NULL),
    (@bom_id_4, 15, 2, 50.0, 'kg', false, false, NULL),
    (@bom_id_4, 16, 3, 30.0, 'kg', true, false, 'GROUP-E'),
    (@bom_id_4, 17, 4, 25.0, 'kg', true, false, 'GROUP-E'),
    (@bom_id_4, 18, 5, 20.0, 'kg', true, false, 'GROUP-E'),
    (@bom_id_4, 19, 6, 15.0, 'kg', true, false, 'GROUP-F'),
    (@bom_id_4, 20, 7, 10.0, 'kg', true, false, 'GROUP-F');

-- Create work order with fourth BOM
INSERT INTO work_orders (wo_number, product_id, bom_id, quantity, uom, status, kpi_scope)
VALUES ('WO-BOM-TEST-005', 4, @bom_id_4, 100.0, 'kg', 'in_progress', 'FG');

-- Get fifth work order ID
SELECT id INTO @wo_id_5 FROM work_orders WHERE wo_number = 'WO-BOM-TEST-005';

-- Verify complex substitution groups
SELECT 
    wo_id,
    material_id,
    substitution_group,
    is_optional,
    one_to_one
FROM wo_materials 
WHERE wo_id = @wo_id_5 AND substitution_group IS NOT NULL
ORDER BY substitution_group, material_id;

-- Test 9: BOM snapshot with work order operations
-- Create work order operations
INSERT INTO wo_operations (wo_id, seq_no, operation_name, status, planned_input_weight, planned_output_weight)
VALUES 
    (@wo_id_5, 1, 'Grind', 'pending', 100.0, 95.0),
    (@wo_id_5, 2, 'Mix', 'pending', 95.0, 90.0),
    (@wo_id_5, 3, 'Pack', 'pending', 90.0, 85.0);

-- Verify operations were created
SELECT 
    wo_id,
    seq_no,
    operation_name,
    status,
    planned_input_weight,
    planned_output_weight
FROM wo_operations 
WHERE wo_id = @wo_id_5
ORDER BY seq_no;

-- Test 10: BOM snapshot with production outputs
-- Create production outputs
INSERT INTO production_outputs (wo_id, lp_id, quantity, uom, boxes_count, box_weight_kg)
VALUES 
    (@wo_id_5, 1, 85.0, 'kg', 5, 17.0),
    (@wo_id_5, 2, 80.0, 'kg', 4, 20.0);

-- Verify production outputs
SELECT 
    wo_id,
    lp_id,
    quantity,
    uom,
    boxes_count,
    box_weight_kg
FROM production_outputs 
WHERE wo_id = @wo_id_5;

-- Test 11: BOM snapshot with different KPI scopes
-- Verify KPI scope is captured in work order
SELECT 
    wo_number,
    kpi_scope,
    status,
    quantity,
    uom
FROM work_orders 
WHERE wo_number LIKE 'WO-BOM-TEST-%'
ORDER BY wo_number;

-- Test 12: BOM snapshot summary
-- Get summary of BOM snapshots
SELECT 
    wo_id,
    COUNT(*) as material_count,
    SUM(CASE WHEN one_to_one = true THEN 1 ELSE 0 END) as one_to_one_count,
    SUM(CASE WHEN is_optional = true THEN 1 ELSE 0 END) as optional_count,
    COUNT(DISTINCT substitution_group) as substitution_group_count
FROM wo_materials 
WHERE wo_id IN (@wo_id, @wo_id_2, @wo_id_3, @wo_id_4, @wo_id_5)
GROUP BY wo_id
ORDER BY wo_id;

-- Test 13: BOM snapshot with material details
-- Get detailed material information
SELECT 
    wm.wo_id,
    wm.material_id,
    p.part_number,
    p.description,
    wm.quantity,
    wm.uom,
    wm.is_optional,
    wm.one_to_one,
    wm.substitution_group
FROM wo_materials wm
JOIN products p ON wm.material_id = p.id
WHERE wm.wo_id IN (@wo_id, @wo_id_2, @wo_id_3, @wo_id_4, @wo_id_5)
ORDER BY wm.wo_id, wm.sequence;

-- Test 14: BOM snapshot with work order details
-- Get work order details with BOM information
SELECT 
    wo.wo_number,
    wo.kpi_scope,
    wo.status,
    wo.quantity as wo_quantity,
    wo.uom as wo_uom,
    COUNT(wm.material_id) as material_count,
    SUM(wm.quantity) as total_material_quantity
FROM work_orders wo
LEFT JOIN wo_materials wm ON wo.id = wm.wo_id
WHERE wo.wo_number LIKE 'WO-BOM-TEST-%'
GROUP BY wo.id, wo.wo_number, wo.kpi_scope, wo.status, wo.quantity, wo.uom
ORDER BY wo.wo_number;

-- Cleanup test data
DELETE FROM production_outputs WHERE wo_id IN (@wo_id_5);
DELETE FROM wo_operations WHERE wo_id IN (@wo_id_5);
DELETE FROM wo_materials WHERE wo_id IN (@wo_id, @wo_id_2, @wo_id_3, @wo_id_4, @wo_id_5);
DELETE FROM work_orders WHERE wo_number LIKE 'WO-BOM-TEST-%';
DELETE FROM bom_items WHERE bom_id IN (@bom_id, @bom_id_2, @bom_id_3, @bom_id_4);
DELETE FROM boms WHERE version IN ('1.0', '2.0', '3.0', '4.0');

