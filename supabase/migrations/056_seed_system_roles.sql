-- Migration: Seed system roles (Story 01.6)
-- Description: Insert 10 system roles with JSONB permissions (ADR-012)
-- Date: 2025-12-18

-- Idempotent insert: ON CONFLICT DO NOTHING ensures safe re-runs
INSERT INTO roles (code, name, description, permissions, is_system, display_order)
VALUES
  -- Owner: Full system access, billing control
  ('owner', 'Owner', 'Full system access, billing control',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::jsonb,
   true, 1),

  -- Administrator: Full access except billing, cannot delete org settings
  ('admin', 'Administrator', 'Full access except billing, cannot delete org settings',
   '{"settings":"CRU","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::jsonb,
   true, 2),

  -- Production Manager: Full Production, Planning, Quality access
  ('production_manager', 'Production Manager', 'Full Production, Planning, Quality access',
   '{"settings":"R","users":"R","technical":"RU","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"RU","shipping":"R","npd":"R","finance":"R","oee":"CRUD","integrations":"R"}'::jsonb,
   true, 3),

  -- Quality Manager: Full Quality, read Production
  ('quality_manager', 'Quality Manager', 'Full Quality, read Production',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"RU","quality":"CRUD","warehouse":"R","shipping":"R","npd":"RU","finance":"-","oee":"R","integrations":"-"}'::jsonb,
   true, 4),

  -- Warehouse Manager: Full Warehouse and Shipping access
  ('warehouse_manager', 'Warehouse Manager', 'Full Warehouse and Shipping access',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"CRUD","shipping":"CRUD","npd":"-","finance":"-","oee":"-","integrations":"-"}'::jsonb,
   true, 5),

  -- Production Operator: Execute work orders, create quality checks
  ('production_operator', 'Production Operator', 'Execute work orders, create quality checks',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"RU","quality":"CR","warehouse":"R","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}'::jsonb,
   true, 6),

  -- Quality Inspector: Perform QC inspections, view production and warehouse
  ('quality_inspector', 'Quality Inspector', 'Perform QC inspections, view production and warehouse',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","quality":"CRU","warehouse":"R","shipping":"R","npd":"-","finance":"-","oee":"-","integrations":"-"}'::jsonb,
   true, 7),

  -- Warehouse Operator: Execute inventory and shipping tasks
  ('warehouse_operator', 'Warehouse Operator', 'Execute inventory and shipping tasks',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"-","quality":"R","warehouse":"CRU","shipping":"RU","npd":"-","finance":"-","oee":"-","integrations":"-"}'::jsonb,
   true, 8),

  -- Planner: Manage schedules and work orders
  ('planner', 'Planner', 'Manage schedules and work orders',
   '{"settings":"R","users":"R","technical":"R","planning":"CRUD","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"-"}'::jsonb,
   true, 9),

  -- Viewer: Read-only access to all modules
  ('viewer', 'Viewer', 'Read-only access to all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}'::jsonb,
   true, 10)

ON CONFLICT (code) DO NOTHING;

-- Comments
COMMENT ON TABLE roles IS 'System roles seeded with 10 default roles for multi-tenant orgs';
