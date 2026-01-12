-- Migration: 027_create_routings_table.sql
-- Description: Create routings and routing_operations tables with RLS
-- Date: 2025-12-23
-- Author: BACKEND-DEV Agent
-- Story: 02.7 - Routings CRUD
-- Related: ADR-009, migrations 043 (costs), 044 (code fields)

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Create base routings and routing_operations tables for production workflow management.
-- A routing defines the sequence of manufacturing operations (e.g., Mixing → Baking → Cooling).
-- Routings can be reused across multiple BOMs (products).
--
-- Tables:
-- 1. routings - Header table for routing definitions
-- 2. routing_operations - Detail table for individual production steps
--
-- Note: Cost fields (setup_cost, working_cost_per_unit, overhead_percent, currency)
-- and code/is_reusable fields will be added by migrations 043 and 044.
-- =============================================================================

BEGIN;

-- =============================================================================
-- TABLE: routings
-- =============================================================================
CREATE TABLE IF NOT EXISTS routings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Routing identification
  name TEXT NOT NULL CHECK (length(trim(name)) >= 3 AND length(trim(name)) <= 100),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Versioning (auto-incremented on UPDATE via trigger)
  version INTEGER DEFAULT 1 NOT NULL CHECK (version >= 1),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add table comment
COMMENT ON TABLE routings IS 'Routing definitions - sequences of production operations that can be reused across multiple BOMs';

-- Add column comments
COMMENT ON COLUMN routings.id IS 'Unique routing identifier (UUID)';
COMMENT ON COLUMN routings.org_id IS 'Organization ID for multi-tenancy isolation';
COMMENT ON COLUMN routings.name IS 'Routing name (e.g., "Standard Bread Line"). Required, 3-100 characters.';
COMMENT ON COLUMN routings.description IS 'Optional description of routing workflow. Max 500 characters.';
COMMENT ON COLUMN routings.is_active IS 'Active status. Inactive routings cannot be assigned to new BOMs.';
COMMENT ON COLUMN routings.version IS 'Version number, auto-incremented on every UPDATE. Starts at 1.';
COMMENT ON COLUMN routings.created_at IS 'Timestamp when routing was created';
COMMENT ON COLUMN routings.updated_at IS 'Timestamp when routing was last updated (auto-updated by trigger)';
COMMENT ON COLUMN routings.created_by IS 'User ID who created the routing';
COMMENT ON COLUMN routings.updated_by IS 'User ID who last updated the routing';

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Index for org_id queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_routings_org_id ON routings(org_id);

-- Index for active status filter
CREATE INDEX IF NOT EXISTS idx_routings_org_active ON routings(org_id, is_active);

-- Index for name search (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_routings_org_name ON routings(org_id, name);

-- =============================================================================
-- TABLE: routing_operations
-- =============================================================================
CREATE TABLE IF NOT EXISTS routing_operations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,

  -- Operation details
  sequence INTEGER NOT NULL CHECK (sequence >= 1),
  operation_name TEXT NOT NULL CHECK (length(trim(operation_name)) >= 3 AND length(trim(operation_name)) <= 100),

  -- Work centers (optional)
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,

  -- Time tracking (minutes)
  expected_duration INTEGER NOT NULL CHECK (expected_duration >= 1),
  setup_time INTEGER DEFAULT 0 CHECK (setup_time >= 0),

  -- Yield and cost
  expected_yield DECIMAL(5,2) DEFAULT 100.00 CHECK (expected_yield >= 0 AND expected_yield <= 100),
  labor_cost_per_hour DECIMAL(10,2) DEFAULT 0.00 CHECK (labor_cost_per_hour >= 0),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add table comment
COMMENT ON TABLE routing_operations IS 'Individual production operations within a routing (e.g., Mixing, Baking, Cooling)';

-- Add column comments
COMMENT ON COLUMN routing_operations.id IS 'Unique operation identifier (UUID)';
COMMENT ON COLUMN routing_operations.routing_id IS 'Parent routing ID (FK to routings table)';
COMMENT ON COLUMN routing_operations.sequence IS 'Operation sequence number. Determines execution order. Duplicate sequences allowed for parallel operations.';
COMMENT ON COLUMN routing_operations.operation_name IS 'Operation name (e.g., "Mixing", "Baking"). Required, 3-100 characters.';
COMMENT ON COLUMN routing_operations.machine_id IS 'Optional machine assignment (FK to machines table)';
COMMENT ON COLUMN routing_operations.production_line_id IS 'Optional production line assignment (FK to production_lines table)';
COMMENT ON COLUMN routing_operations.expected_duration IS 'Expected operation duration in minutes. Required, >= 1.';
COMMENT ON COLUMN routing_operations.setup_time IS 'Setup time in minutes before operation starts. Default: 0.';
COMMENT ON COLUMN routing_operations.expected_yield IS 'Expected yield percentage (0-100%). Default: 100%.';
COMMENT ON COLUMN routing_operations.labor_cost_per_hour IS 'Labor cost per hour for this operation. Default: 0.';
COMMENT ON COLUMN routing_operations.created_at IS 'Timestamp when operation was created';
COMMENT ON COLUMN routing_operations.updated_at IS 'Timestamp when operation was last updated';

-- =============================================================================
-- INDEXES FOR routing_operations
-- =============================================================================
-- Index for routing_id queries (most common JOIN)
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_id ON routing_operations(routing_id);

-- Index for sequence ordering
CREATE INDEX IF NOT EXISTS idx_routing_operations_routing_sequence ON routing_operations(routing_id, sequence);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for routings table
CREATE TRIGGER update_routings_updated_at
  BEFORE UPDATE ON routings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for routing_operations table
CREATE TRIGGER update_routing_operations_updated_at
  BEFORE UPDATE ON routing_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGERS: Auto-increment version on routing UPDATE
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_routing_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if data fields changed (not just updated_at or updated_by)
  -- Note: Additional fields (code, setup_cost, etc.) will be checked after migration 028
  IF (OLD.name IS DISTINCT FROM NEW.name OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_routings_version
  BEFORE UPDATE ON routings
  FOR EACH ROW
  EXECUTE FUNCTION increment_routing_version();

-- =============================================================================
-- RLS POLICIES: routings table
-- =============================================================================
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT routings from their own organization
CREATE POLICY routings_select_policy ON routings
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Policy: Users with PROD_MANAGER role can INSERT routings
CREATE POLICY routings_insert_policy ON routings
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('org_admin', 'prod_manager')
  );

-- Policy: Users with PROD_MANAGER role can UPDATE routings in their org
CREATE POLICY routings_update_policy ON routings
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('org_admin', 'prod_manager')
  );

-- Policy: Users with PROD_MANAGER role can DELETE routings in their org
CREATE POLICY routings_delete_policy ON routings
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('org_admin', 'prod_manager')
  );

-- =============================================================================
-- RLS POLICIES: routing_operations table
-- =============================================================================
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT operations for routings in their org
CREATE POLICY routing_operations_select_policy ON routing_operations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routings r
      WHERE r.id = routing_operations.routing_id
      AND r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- Policy: Users with PROD_MANAGER role can INSERT operations
CREATE POLICY routing_operations_insert_policy ON routing_operations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routings r
      WHERE r.id = routing_operations.routing_id
      AND r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND
    (SELECT ro.code FROM roles ro JOIN users u ON u.role_id = ro.id WHERE u.id = auth.uid())
    IN ('org_admin', 'prod_manager')
  );

-- Policy: Users with PROD_MANAGER role can UPDATE operations
CREATE POLICY routing_operations_update_policy ON routing_operations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routings r
      WHERE r.id = routing_operations.routing_id
      AND r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND
    (SELECT ro.code FROM roles ro JOIN users u ON u.role_id = ro.id WHERE u.id = auth.uid())
    IN ('org_admin', 'prod_manager')
  );

-- Policy: Users with PROD_MANAGER role can DELETE operations
CREATE POLICY routing_operations_delete_policy ON routing_operations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routings r
      WHERE r.id = routing_operations.routing_id
      AND r.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND
    (SELECT ro.code FROM roles ro JOIN users u ON u.role_id = ro.id WHERE u.id = auth.uid())
    IN ('org_admin', 'prod_manager')
  );

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('routings', 'routing_operations');
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routings'
-- ORDER BY ordinal_position;
--
-- Check RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('routings', 'routing_operations');
--
-- Check policies:
-- SELECT tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('routings', 'routing_operations');
--
-- Check triggers:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table IN ('routings', 'routing_operations');
