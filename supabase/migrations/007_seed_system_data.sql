-- Migration: Seed system data (Story 01.1)
-- Description: Seed 10 system roles and 11 modules
-- Date: 2025-12-16
-- Idempotent: Uses ON CONFLICT DO NOTHING

-- ============================================================================
-- SEED ROLES (10 system roles per ADR-012)
-- ============================================================================

INSERT INTO roles (code, name, description, permissions, is_system, display_order) VALUES
  ('owner', 'Owner', 'Organization owner with full access',
   '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","warehouse":"CRUD","quality":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::JSONB,
   true, 1),

  ('admin', 'Administrator', 'Administrator with full module access',
   '{"settings":"CRU","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","warehouse":"CRUD","quality":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}'::JSONB,
   true, 2),

  ('production_manager', 'Production Manager', 'Manages production and planning',
   '{"settings":"R","users":"R","technical":"RU","planning":"CRUD","production":"CRUD","warehouse":"RU","quality":"CRUD","shipping":"R","npd":"R","finance":"R","oee":"CRUD","integrations":"R"}'::JSONB,
   true, 3),

  ('quality_manager', 'Quality Manager', 'Manages quality control',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"RU","warehouse":"R","quality":"CRUD","shipping":"R","npd":"RU","finance":"-","oee":"R","integrations":"-"}'::JSONB,
   true, 4),

  ('warehouse_manager', 'Warehouse Manager', 'Manages warehouse and shipping',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","warehouse":"CRUD","quality":"R","shipping":"CRUD","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 5),

  ('production_operator', 'Production Operator', 'Executes production operations',
   '{"settings":"-","users":"-","technical":"R","planning":"R","production":"RU","warehouse":"R","quality":"CR","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}'::JSONB,
   true, 6),

  ('warehouse_operator', 'Warehouse Operator', 'Handles warehouse operations',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"-","warehouse":"CRU","quality":"R","shipping":"RU","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 7),

  ('quality_inspector', 'Quality Inspector', 'Performs quality inspections',
   '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","warehouse":"R","quality":"CRU","shipping":"R","npd":"-","finance":"-","oee":"-","integrations":"-"}'::JSONB,
   true, 8),

  ('planner', 'Planner', 'Plans production and materials',
   '{"settings":"R","users":"R","technical":"R","planning":"CRUD","production":"R","warehouse":"R","quality":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"-"}'::JSONB,
   true, 9),

  ('viewer', 'Viewer', 'Read-only access to all modules',
   '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","warehouse":"R","quality":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}'::JSONB,
   true, 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED MODULES (11 modules per ADR-011)
-- ============================================================================

INSERT INTO modules (code, name, dependencies, can_disable, display_order) VALUES
  ('settings', 'Settings', '{}', false, 1),
  ('technical', 'Technical', '{}', false, 2),
  ('planning', 'Planning', '{technical}', true, 3),
  ('production', 'Production', '{planning}', true, 4),
  ('warehouse', 'Warehouse', '{technical}', true, 5),
  ('quality', 'Quality', '{production}', true, 6),
  ('shipping', 'Shipping', '{warehouse}', true, 7),
  ('npd', 'New Product Development', '{technical}', true, 8),
  ('finance', 'Finance', '{planning,shipping}', true, 9),
  ('oee', 'OEE', '{production}', true, 10),
  ('integrations', 'Integrations', '{}', true, 11)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT roles_code_key ON roles IS 'Ensures idempotent seeding via ON CONFLICT';
COMMENT ON CONSTRAINT modules_code_key ON modules IS 'Ensures idempotent seeding via ON CONFLICT';
