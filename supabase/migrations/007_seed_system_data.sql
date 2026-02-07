-- Migration: Seed system data (Story 01.1)
-- Description: Seed 11 modules (roles seeded in 004_seed_system_roles.sql)
-- Date: 2025-12-16
-- Idempotent: Uses ON CONFLICT DO NOTHING
-- NOTE: Roles removed from this file - single source of truth is 004_seed_system_roles.sql

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

COMMENT ON CONSTRAINT modules_code_key ON modules IS 'Ensures idempotent seeding via ON CONFLICT';
