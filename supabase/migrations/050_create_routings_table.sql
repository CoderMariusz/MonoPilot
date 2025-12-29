-- Migration: 046_create_routings_table.sql
-- Description: Create routings table for production routing templates (Story 02.7)
-- Date: 2025-12-28
-- Author: Backend Dev Agent
-- Related: Story 02.7, ADR-009 (Routing-Level Costs), FR-2.40, FR-2.46, FR-2.54, FR-2.55

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Create the routings table to store production routing templates:
-- - Unique code per organization (FR-2.54)
-- - Version control with auto-increment on edit (FR-2.46)
-- - Reusability flag (FR-2.55)
-- - Cost configuration (ADR-009): setup_cost, working_cost_per_unit, overhead_percent, currency

BEGIN;

-- =============================================================================
-- CREATE TABLE: routings
-- =============================================================================

CREATE TABLE IF NOT EXISTS routings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization (multi-tenancy)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique code identifier (e.g., RTG-BREAD-01)
  code VARCHAR(50) NOT NULL,

  -- Descriptive name
  name TEXT NOT NULL,

  -- Optional description
  description TEXT,

  -- Version control (auto-increment on edit via trigger)
  version INTEGER NOT NULL DEFAULT 1,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Reusability flag (FR-2.55)
  -- true = can be assigned to multiple BOMs (reusable template)
  -- false = product-specific routing
  is_reusable BOOLEAN NOT NULL DEFAULT true,

  -- Cost configuration (ADR-009)
  setup_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  working_cost_per_unit DECIMAL(10,4) NOT NULL DEFAULT 0,
  overhead_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PLN',

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Unique code per organization
ALTER TABLE routings
ADD CONSTRAINT uq_routings_org_code UNIQUE(org_id, code);

-- Ensure setup_cost is non-negative
ALTER TABLE routings
ADD CONSTRAINT chk_routings_setup_cost_positive
CHECK (setup_cost >= 0);

-- Ensure working_cost_per_unit is non-negative
ALTER TABLE routings
ADD CONSTRAINT chk_routings_working_cost_positive
CHECK (working_cost_per_unit >= 0);

-- Ensure overhead_percent is between 0 and 100
ALTER TABLE routings
ADD CONSTRAINT chk_routings_overhead_percent_range
CHECK (overhead_percent >= 0 AND overhead_percent <= 100);

-- Ensure version is positive
ALTER TABLE routings
ADD CONSTRAINT chk_routings_version_positive
CHECK (version >= 1);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: by org and code
CREATE INDEX IF NOT EXISTS idx_routings_org_code
ON routings(org_id, code);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_routings_org_active
ON routings(org_id, is_active);

-- Search by name
CREATE INDEX IF NOT EXISTS idx_routings_org_name
ON routings(org_id, name);

-- =============================================================================
-- TRIGGER: Auto-increment version on edit
-- =============================================================================

-- Function: Increment version when key fields change
CREATE OR REPLACE FUNCTION increment_routing_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version if any editable field changes
  IF OLD.name IS DISTINCT FROM NEW.name
     OR OLD.description IS DISTINCT FROM NEW.description
     OR OLD.is_active IS DISTINCT FROM NEW.is_active
     OR OLD.is_reusable IS DISTINCT FROM NEW.is_reusable
     OR OLD.setup_cost IS DISTINCT FROM NEW.setup_cost
     OR OLD.working_cost_per_unit IS DISTINCT FROM NEW.working_cost_per_unit
     OR OLD.overhead_percent IS DISTINCT FROM NEW.overhead_percent
  THEN
    NEW.version = OLD.version + 1;
  END IF;

  -- Always update timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_routing_version_increment ON routings;
CREATE TRIGGER trigger_routing_version_increment
BEFORE UPDATE ON routings
FOR EACH ROW EXECUTE FUNCTION increment_routing_version();

-- =============================================================================
-- RLS POLICIES (ADR-013: Users Table Lookup Pattern)
-- =============================================================================

-- Enable RLS
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read routings from their organization
CREATE POLICY routings_org_isolation_select
  ON routings
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Users can only create routings in their organization
CREATE POLICY routings_org_isolation_insert
  ON routings
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- UPDATE: Users can only update routings in their organization
CREATE POLICY routings_org_isolation_update
  ON routings
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE: Users can only delete routings in their organization
CREATE POLICY routings_org_isolation_delete
  ON routings
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON routings TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE routings IS 'Production routing templates with versioning and cost configuration (Story 02.7, ADR-009)';

COMMENT ON COLUMN routings.id IS 'Primary key UUID';
COMMENT ON COLUMN routings.org_id IS 'Organization ID for multi-tenancy';
COMMENT ON COLUMN routings.code IS 'Unique routing code within organization (e.g., RTG-BREAD-01)';
COMMENT ON COLUMN routings.name IS 'Descriptive routing name';
COMMENT ON COLUMN routings.description IS 'Optional detailed description';
COMMENT ON COLUMN routings.version IS 'Version number, auto-incremented on edit via trigger';
COMMENT ON COLUMN routings.is_active IS 'Active routings can be assigned to new BOMs';
COMMENT ON COLUMN routings.is_reusable IS 'Reusable routings can be shared across multiple BOMs/products';
COMMENT ON COLUMN routings.setup_cost IS 'Fixed cost per routing run (tooling, changeover). Default: 0';
COMMENT ON COLUMN routings.working_cost_per_unit IS 'Variable cost per output unit (utilities, consumables). Default: 0';
COMMENT ON COLUMN routings.overhead_percent IS 'Factory overhead % applied to total (0-100). Default: 0';
COMMENT ON COLUMN routings.currency IS 'Currency code for cost fields. Default: PLN';
COMMENT ON COLUMN routings.created_at IS 'Creation timestamp';
COMMENT ON COLUMN routings.updated_at IS 'Last update timestamp (auto-updated via trigger)';
COMMENT ON COLUMN routings.created_by IS 'User who created the routing';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'routings';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routings'
-- ORDER BY ordinal_position;
--
-- Check constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'routings';
--
-- Check RLS policies:
-- SELECT policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'routings';
--
-- Test version increment:
-- INSERT INTO routings (org_id, code, name) VALUES ('some-org-uuid', 'TEST-01', 'Test');
-- UPDATE routings SET name = 'Test Updated' WHERE code = 'TEST-01';
-- SELECT version FROM routings WHERE code = 'TEST-01'; -- Should be 2

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_routing_version_increment ON routings;
-- DROP FUNCTION IF EXISTS increment_routing_version();
-- DROP TABLE IF EXISTS routings;
-- COMMIT;
