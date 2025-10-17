-- Enhanced Seed Data for Production Module
-- This script creates comprehensive test data for all production module features

-- Insert enhanced work orders with new fields
INSERT INTO work_orders (
  id, wo_number, product_id, quantity_planned, quantity_actual, 
  status, priority, kpi_scope, planned_start, planned_end, 
  actual_start, actual_end, created_by, updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'WO-2024-001',
    (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1),
    500,
    485,
    'completed',
    'high',
    'both',
    '2024-02-14T08:00:00Z',
    '2024-02-14T16:00:00Z',
    '2024-02-14T08:15:00Z',
    '2024-02-14T15:45:00Z',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'WO-2024-002',
    (SELECT id FROM products WHERE part_number = 'FG-001' LIMIT 1),
    1000,
    920,
    'in_progress',
    'normal',
    'fg',
    '2024-02-19T09:00:00Z',
    '2024-02-19T17:00:00Z',
    '2024-02-19T09:10:00Z',
    NULL,
    (SELECT id FROM users WHERE email = 'sarah.planner@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sarah.planner@example.com' LIMIT 1)
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'WO-2024-003',
    (SELECT id FROM products WHERE part_number = 'PR-002' LIMIT 1),
    750,
    NULL,
    'planned',
    'low',
    'pr',
    '2024-02-25T10:00:00Z',
    '2024-02-25T18:00:00Z',
    NULL,
    NULL,
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Insert enhanced license plates with parent relationships and stage suffixes
INSERT INTO license_plates (
  id, lp_number, product_id, quantity, unit_of_measure, location_id,
  status, stage_suffix, parent_lp_id, parent_lp_number, origin_type, 
  origin_ref, qa_status, created_by
) VALUES 
  -- Raw material LPs (GRN origin)
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'LP00000001',
    (SELECT id FROM products WHERE part_number = 'MT-001' LIMIT 1),
    500.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'RM',
    NULL,
    NULL,
    'grn',
    'GRN-2024-001',
    'passed',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'LP00000002',
    (SELECT id FROM products WHERE part_number = 'MT-002' LIMIT 1),
    300.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-02' LIMIT 1),
    'active',
    'RM',
    NULL,
    NULL,
    'grn',
    'GRN-2024-002',
    'passed',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  -- Process LPs (from operations)
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'LP00000003',
    (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1),
    485.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'PR',
    NULL,
    NULL,
    'production',
    'WO-2024-001',
    'passed',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  -- Finished goods LPs
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'LP00000004',
    (SELECT id FROM products WHERE part_number = 'FG-001' LIMIT 1),
    920.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'FG',
    NULL,
    NULL,
    'production',
    'WO-2024-002',
    'passed',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  -- Child LPs with parent relationships
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'LP00000005',
    (SELECT id FROM products WHERE part_number = 'MT-001' LIMIT 1),
    100.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'RM',
    '660e8400-e29b-41d4-a716-446655440001',
    'LP00000001',
    'split',
    'SPLIT-001',
    'passed',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Insert WO materials (BOM snapshots)
INSERT INTO wo_materials (
  wo_id, bom_id, bom_item_id, product_id, quantity_required, 
  unit_of_measure, one_to_one, is_optional, substitution_group
) VALUES 
  -- WO-2024-001 materials
  (
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM boms WHERE product_id = (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1) LIMIT 1),
    (SELECT id FROM bom_items WHERE bom_id = (SELECT id FROM boms WHERE product_id = (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1) LIMIT 1) AND material_id = (SELECT id FROM products WHERE part_number = 'MT-001' LIMIT 1) LIMIT 1),
    (SELECT id FROM products WHERE part_number = 'MT-001' LIMIT 1),
    1250.0,
    'KG',
    true,
    false,
    NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM boms WHERE product_id = (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1) LIMIT 1),
    (SELECT id FROM bom_items WHERE bom_id = (SELECT id FROM boms WHERE product_id = (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1) LIMIT 1) AND material_id = (SELECT id FROM products WHERE part_number = 'MT-002' LIMIT 1) LIMIT 1),
    (SELECT id FROM products WHERE part_number = 'MT-002' LIMIT 1),
    50.0,
    'KG',
    false,
    false,
    'SPICE-GROUP'
  ),
  -- WO-2024-002 materials
  (
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM boms WHERE product_id = (SELECT id FROM products WHERE part_number = 'FG-001' LIMIT 1) LIMIT 1),
    (SELECT id FROM bom_items WHERE bom_id = (SELECT id FROM boms WHERE product_id = (SELECT id FROM products WHERE part_number = 'FG-001' LIMIT 1) LIMIT 1) AND material_id = (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1) LIMIT 1),
    (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1),
    1000.0,
    'KG',
    true,
    false,
    NULL
  );

-- Insert LP reservations
INSERT INTO lp_reservations (
  lp_id, wo_id, operation_seq, quantity, status, reserved_by, expires_at
) VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    100.0,
    'active',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1),
    NOW() + INTERVAL '2 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    25.0,
    'active',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1),
    NOW() + INTERVAL '2 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    1,
    200.0,
    'active',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1),
    NOW() + INTERVAL '4 hours'
  );

-- Insert LP compositions (parent-child relationships)
INSERT INTO lp_compositions (
  parent_lp_id, child_lp_id, quantity, operation_seq, wo_id
) VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440001',
    100.0,
    1,
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440002',
    25.0,
    1,
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440003',
    200.0,
    2,
    '550e8400-e29b-41d4-a716-446655440002'
  );

-- Insert pallets
INSERT INTO pallets (
  id, pallet_number, location_id, status, created_by
) VALUES 
  (
    '770e8400-e29b-41d4-a716-446655440001',
    'PAL-2024-001',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    'PAL-2024-002',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Insert pallet items
INSERT INTO pallet_items (
  pallet_id, lp_id, quantity, added_by
) VALUES 
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440004',
    920.0,
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440003',
    200.0,
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Insert enhanced stock moves
INSERT INTO stock_moves (
  id, lp_id, move_type, status, from_location_id, to_location_id, 
  quantity, wo_id, operation_seq, meta, source, created_by
) VALUES 
  (
    '880e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'issue',
    'completed',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    (SELECT id FROM locations WHERE code = 'PROD-01' LIMIT 1),
    100.0,
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    '{"operation": "mixing", "machine": "MIX-001"}',
    'scanner',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '880e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440003',
    'output',
    'completed',
    (SELECT id FROM locations WHERE code = 'PROD-01' LIMIT 1),
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    485.0,
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    '{"operation": "mixing", "machine": "MIX-001", "yield": 97.0}',
    'scanner',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '880e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    'issue',
    'completed',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    (SELECT id FROM locations WHERE code = 'PROD-02' LIMIT 1),
    200.0,
    '550e8400-e29b-41d4-a716-446655440002',
    2,
    '{"operation": "packing", "machine": "PACK-001"}',
    'scanner',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '880e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440004',
    'output',
    'completed',
    (SELECT id FROM locations WHERE code = 'PROD-02' LIMIT 1),
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    920.0,
    '550e8400-e29b-41d4-a716-446655440002',
    2,
    '{"operation": "packing", "machine": "PACK-001", "yield": 92.0}',
    'scanner',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Insert WO operations with weight tracking
INSERT INTO wo_operations (
  wo_id, seq, operation_name, input_weight, output_weight, 
  loss_weight, yield_percentage, status, started_at, completed_at
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    'Mixing Operation',
    125.0,
    121.25,
    3.75,
    97.0,
    'completed',
    '2024-02-14T08:15:00Z',
    '2024-02-14T10:30:00Z'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    1,
    'Packing Operation',
    200.0,
    184.0,
    16.0,
    92.0,
    'completed',
    '2024-02-19T09:10:00Z',
    '2024-02-19T11:45:00Z'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    2,
    'Quality Check',
    184.0,
    184.0,
    0.0,
    100.0,
    'in_progress',
    '2024-02-19T11:45:00Z',
    NULL
  );

-- Insert production outputs
INSERT INTO production_outputs (
  wo_id, lp_id, quantity, operation_seq, created_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440003',
    485.0,
    1,
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440004',
    920.0,
    2,
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Insert additional users for testing
INSERT INTO users (
  id, name, email, role, status, created_at, last_login
) VALUES 
  (
    '990e8400-e29b-41d4-a716-446655440001',
    'Mike Operator',
    'mike.operator@example.com',
    'Operator',
    'Active',
    '2024-01-10T00:00:00Z',
    '2024-02-10T10:30:00Z'
  ),
  (
    '990e8400-e29b-41d4-a716-446655440002',
    'Lisa QA',
    'lisa.qa@example.com',
    'QA Inspector',
    'Active',
    '2024-01-15T00:00:00Z',
    '2024-02-10T11:15:00Z'
  );

-- Insert additional products for comprehensive testing
INSERT INTO products (
  id, part_number, description, type, uom, is_active, category, 
  subtype, expiry_policy, shelf_life_days, std_price, created_by, updated_by
) VALUES 
  (
    'aa0e8400-e29b-41d4-a716-446655440001',
    'PR-002',
    'Spiced Pork Mix',
    'PR',
    'KG',
    true,
    'COMPOSITE',
    'PROCESS',
    'FROM_CREATION_DATE',
    2,
    16.50,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'aa0e8400-e29b-41d4-a716-446655440002',
    'FG-001',
    'Premium Sausages',
    'FG',
    'KG',
    true,
    'FINISHED_GOODS',
    'SAUSAGE',
    'FROM_MFG_DATE',
    7,
    25.00,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Insert additional locations for production areas
INSERT INTO locations (
  id, code, name, type, warehouse_id, zone, is_active, created_by, updated_by
) VALUES 
  (
    'bb0e8400-e29b-41d4-a716-446655440001',
    'PROD-01',
    'Production Area 1 - Mixing',
    'production',
    (SELECT id FROM warehouses WHERE code = 'WH-MAIN' LIMIT 1),
    'A',
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'bb0e8400-e29b-41d4-a716-446655440002',
    'PROD-02',
    'Production Area 2 - Packing',
    'production',
    (SELECT id FROM warehouses WHERE code = 'WH-MAIN' LIMIT 1),
    'B',
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Create BOMs for new products
INSERT INTO boms (
  id, product_id, version, status, is_active, requires_routing, created_by, updated_by
) VALUES 
  (
    'cc0e8400-e29b-41d4-a716-446655440001',
    'aa0e8400-e29b-41d4-a716-446655440001',
    '1.0',
    'active',
    true,
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'cc0e8400-e29b-41d4-a716-446655440002',
    'aa0e8400-e29b-41d4-a716-446655440002',
    '1.0',
    'active',
    true,
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Insert BOM items for new products
INSERT INTO bom_items (
  id, bom_id, material_id, quantity, uom, unit_cost_std, sequence, 
  priority, is_optional, is_phantom, one_to_one, substitution_group, 
  created_by, updated_by
) VALUES 
  -- PR-002 BOM items
  (
    'dd0e8400-e29b-41d4-a716-446655440001',
    'cc0e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM products WHERE part_number = 'MT-002' LIMIT 1),
    2.0,
    'KG',
    8.75,
    1,
    1,
    false,
    false,
    true,
    NULL,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'dd0e8400-e29b-41d4-a716-446655440002',
    'cc0e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM products WHERE part_number = 'MT-003' LIMIT 1),
    0.1,
    'KG',
    15.00,
    2,
    2,
    false,
    false,
    false,
    'SPICE-GROUP',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  -- FG-001 BOM items
  (
    'dd0e8400-e29b-41d4-a716-446655440003',
    'cc0e8400-e29b-41d4-a716-446655440002',
    'aa0e8400-e29b-41d4-a716-446655440001',
    1.0,
    'KG',
    16.50,
    1,
    1,
    false,
    false,
    true,
    NULL,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Insert additional material product
INSERT INTO products (
  id, part_number, description, type, uom, is_active, category, 
  subtype, expiry_policy, shelf_life_days, std_price, created_by, updated_by
) VALUES 
  (
    'aa0e8400-e29b-41d4-a716-446655440003',
    'MT-003',
    'Premium Spice Mix',
    'RM',
    'KG',
    true,
    'DRYGOODS',
    'SPICE',
    'FROM_DELIVERY_DATE',
    365,
    15.00,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Insert routing for new products
INSERT INTO routings (
  id, name, product_id, is_active, notes, created_by, updated_by
) VALUES 
  (
    'ee0e8400-e29b-41d4-a716-446655440001',
    'Spiced Pork Production',
    'aa0e8400-e29b-41d4-a716-446655440001',
    true,
    'Standard routing for spiced pork production',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'ee0e8400-e29b-41d4-a716-446655440002',
    'Sausage Packing',
    'aa0e8400-e29b-41d4-a716-446655440002',
    true,
    'Standard routing for sausage packing',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Insert routing operations
INSERT INTO routing_operations (
  id, routing_id, seq_no, name, code, description, requirements, 
  created_by, updated_by
) VALUES 
  (
    'ff0e8400-e29b-41d4-a716-446655440001',
    'ee0e8400-e29b-41d4-a716-446655440001',
    1,
    'Preparation',
    'PREP',
    'Prepare pork and spices',
    '{"machines": ["PREP-001"], "tools": ["KNIFE", "SCALE"]}',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'ff0e8400-e29b-41d4-a716-446655440002',
    'ee0e8400-e29b-41d4-a716-446655440001',
    2,
    'Mixing',
    'MIX',
    'Mix pork with spices',
    '{"machines": ["MIX-001"], "tools": ["MIXER"]}',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'ff0e8400-e29b-41d4-a716-446655440003',
    'ee0e8400-e29b-41d4-a716-446655440002',
    1,
    'Packing',
    'PACK',
    'Pack sausages into boxes',
    '{"machines": ["PACK-001"], "tools": ["BOX", "SEALER"]}',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Insert additional machines for production
INSERT INTO machines (
  id, code, name, type, is_active, created_by, updated_by
) VALUES 
  (
    'gg0e8400-e29b-41d4-a716-446655440001',
    'PREP-001',
    'Preparation Station 1',
    'Preparation',
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'gg0e8400-e29b-41d4-a716-446655440002',
    'MIX-001',
    'Industrial Mixer 1',
    'Mixer',
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'gg0e8400-e29b-41d4-a716-446655440003',
    'PACK-001',
    'Packing Line 1',
    'Packing',
    true,
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Create comprehensive test scenarios
-- Scenario 1: Cross-WO PR intake validation
INSERT INTO work_orders (
  id, wo_number, product_id, quantity_planned, status, 
  planned_start, planned_end, created_by, updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'WO-2024-004',
    'aa0e8400-e29b-41d4-a716-446655440001',
    300,
    'planned',
    '2024-02-28T08:00:00Z',
    '2024-02-28T16:00:00Z',
    (SELECT id FROM users WHERE email = 'sarah.planner@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sarah.planner@example.com' LIMIT 1)
  );

-- Scenario 2: Complex traceability chain
-- Create additional LPs for complex traceability testing
INSERT INTO license_plates (
  id, lp_number, product_id, quantity, unit_of_measure, location_id,
  status, stage_suffix, origin_type, origin_ref, qa_status, created_by
) VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'LP00000006',
    'aa0e8400-e29b-41d4-a716-446655440001',
    300.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'PR',
    'production',
    'WO-2024-004',
    'passed',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    'LP00000007',
    'aa0e8400-e29b-41d4-a716-446655440002',
    280.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'FG',
    'production',
    'WO-2024-005',
    'passed',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1)
  );

-- Create complex LP composition chain
INSERT INTO lp_compositions (
  parent_lp_id, child_lp_id, quantity, operation_seq, wo_id
) VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440006',
    '660e8400-e29b-41d4-a716-446655440002',
    50.0,
    1,
    '550e8400-e29b-41d4-a716-446655440004'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    '660e8400-e29b-41d4-a716-446655440006',
    300.0,
    1,
    '550e8400-e29b-41d4-a716-446655440005'
  );

-- Create additional work order for complex traceability
INSERT INTO work_orders (
  id, wo_number, product_id, quantity_planned, status, 
  planned_start, planned_end, created_by, updated_by
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'WO-2024-005',
    'aa0e8400-e29b-41d4-a716-446655440002',
    300,
    'completed',
    '2024-02-20T08:00:00Z',
    '2024-02-20T16:00:00Z',
    (SELECT id FROM users WHERE email = 'sarah.planner@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sarah.planner@example.com' LIMIT 1)
  );

-- Create QA override scenarios
INSERT INTO license_plates (
  id, lp_number, product_id, quantity, unit_of_measure, location_id,
  status, stage_suffix, origin_type, origin_ref, qa_status, created_by
) VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440008',
    'LP00000008',
    (SELECT id FROM products WHERE part_number = 'MT-001' LIMIT 1),
    100.0,
    'KG',
    (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1),
    'active',
    'RM',
    'grn',
    'GRN-2024-003',
    'failed',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Create reservation conflict scenarios
INSERT INTO lp_reservations (
  lp_id, wo_id, operation_seq, quantity, status, reserved_by, expires_at
) VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    1,
    50.0,
    'active',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1),
    NOW() + INTERVAL '1 hour'
  );

-- Create performance test data (large datasets)
-- Insert 100 additional work orders for performance testing
INSERT INTO work_orders (
  wo_number, product_id, quantity_planned, status, 
  planned_start, planned_end, created_by, updated_by
)
SELECT 
  'WO-2024-' || LPAD((100 + s.id)::text, 3, '0'),
  CASE (s.id % 3)
    WHEN 0 THEN (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1)
    WHEN 1 THEN (SELECT id FROM products WHERE part_number = 'PR-002' LIMIT 1)
    ELSE (SELECT id FROM products WHERE part_number = 'FG-001' LIMIT 1)
  END,
  (100 + s.id) * 10,
  CASE (s.id % 4)
    WHEN 0 THEN 'planned'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'completed'
    ELSE 'cancelled'
  END,
  NOW() + (s.id * INTERVAL '1 day'),
  NOW() + (s.id * INTERVAL '1 day') + INTERVAL '8 hours',
  (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
FROM generate_series(1, 100) AS s(id);

-- Insert 500 additional license plates for performance testing
INSERT INTO license_plates (
  lp_number, product_id, quantity, unit_of_measure, location_id,
  status, stage_suffix, origin_type, qa_status, created_by
)
SELECT 
  'LP' || LPAD((500 + s.id)::text, 8, '0'),
  CASE (s.id % 5)
    WHEN 0 THEN (SELECT id FROM products WHERE part_number = 'MT-001' LIMIT 1)
    WHEN 1 THEN (SELECT id FROM products WHERE part_number = 'MT-002' LIMIT 1)
    WHEN 2 THEN (SELECT id FROM products WHERE part_number = 'PR-001' LIMIT 1)
    WHEN 3 THEN (SELECT id FROM products WHERE part_number = 'PR-002' LIMIT 1)
    ELSE (SELECT id FROM products WHERE part_number = 'FG-001' LIMIT 1)
  END,
  (500 + s.id) * 0.1,
  'KG',
  CASE (s.id % 3)
    WHEN 0 THEN (SELECT id FROM locations WHERE code = 'WH-01' LIMIT 1)
    WHEN 1 THEN (SELECT id FROM locations WHERE code = 'WH-02' LIMIT 1)
    ELSE (SELECT id FROM locations WHERE code = 'PROD-01' LIMIT 1)
  END,
  CASE (s.id % 3)
    WHEN 0 THEN 'active'
    WHEN 1 THEN 'reserved'
    ELSE 'inactive'
  END,
  CASE (s.id % 4)
    WHEN 0 THEN 'RM'
    WHEN 1 THEN 'PR'
    WHEN 2 THEN 'FG'
    ELSE 'WIP'
  END,
  CASE (s.id % 2)
    WHEN 0 THEN 'grn'
    ELSE 'production'
  END,
  CASE (s.id % 3)
    WHEN 0 THEN 'passed'
    WHEN 1 THEN 'pending'
    ELSE 'failed'
  END,
  (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
FROM generate_series(1, 500) AS s(id);

-- Create comprehensive audit trail
INSERT INTO audit_events (
  table_name, record_id, action, old_values, new_values, 
  user_id, ip_address, user_agent, created_at
) VALUES 
  (
    'work_orders',
    '550e8400-e29b-41d4-a716-446655440001',
    'UPDATE',
    '{"status": "in_progress"}',
    '{"status": "completed", "actual_end": "2024-02-14T15:45:00Z"}',
    (SELECT id FROM users WHERE email = 'mike.operator@example.com' LIMIT 1),
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '2024-02-14T15:45:00Z'
  ),
  (
    'license_plates',
    '660e8400-e29b-41d4-a716-446655440001',
    'UPDATE',
    '{"qa_status": "pending"}',
    '{"qa_status": "passed"}',
    (SELECT id FROM users WHERE email = 'lisa.qa@example.com' LIMIT 1),
    '192.168.1.101',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '2024-02-14T10:30:00Z'
  );

-- Create system settings for production module
INSERT INTO settings (
  key, value, description, created_by, updated_by
) VALUES 
  (
    'production.lp_number_format',
    'LP{8}',
    'License plate number format with 8-digit padding',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'production.wo_number_format',
    'WO-{YYYY}-{####}',
    'Work order number format',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'production.qa_required',
    'true',
    'QA approval required for all operations',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'production.reservation_timeout',
    '7200',
    'Reservation timeout in seconds (2 hours)',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  ),
  (
    'production.sequential_routing',
    'true',
    'Enforce sequential operation routing',
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'john.admin@example.com' LIMIT 1)
  );

-- Create comprehensive test data summary
-- This seed script creates:
-- - 3 enhanced work orders with KPI scope and timing
-- - 8 license plates with parent relationships and stage suffixes
-- - 3 WO materials (BOM snapshots) with 1:1 flags
-- - 3 LP reservations with expiration times
-- - 3 LP compositions for traceability
-- - 2 pallets with items
-- - 4 enhanced stock moves with metadata
-- - 3 WO operations with weight tracking
-- - 2 production outputs
-- - 2 additional users (Operator, QA Inspector)
-- - 2 additional products (PR-002, FG-001)
-- - 2 additional locations (Production areas)
-- - 2 BOMs with items including 1:1 and substitution groups
-- - 2 routings with operations
-- - 3 additional machines
-- - Complex traceability scenarios
-- - QA override scenarios
-- - Reservation conflict scenarios
-- - 100 additional work orders for performance testing
-- - 500 additional license plates for performance testing
-- - Comprehensive audit trail
-- - System settings for production module

-- All data is designed to test:
-- 1. Sequential routing enforcement
-- 2. Hard 1:1 component rule
-- 3. Cross-WO PR intake validation
-- 4. Reservation safety checks
-- 5. QA gate enforcement
-- 6. Complex traceability chains
-- 7. Performance with large datasets
-- 8. Business logic validation
-- 9. Error handling scenarios
-- 10. User permission testing
