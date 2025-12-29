-- Migration: 058_create_product_costs.sql
-- Description: Create product_costs table for storing calculated BOM costs (Story 02.9)
-- Date: 2025-12-29
-- Author: Backend Dev Agent
-- Related: Story 02.9, ADR-009 (Routing-Level Costs), database.yaml

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Store calculated BOM costs with effective dates:
-- - material_cost: Sum of ingredient costs
-- - labor_cost: Sum of operation labor costs
-- - overhead_cost: Overhead percentage applied to subtotal
-- - total_cost: Full cost including overhead
-- - calculation_method: How cost was calculated (bom_routing, actual_production, manual)

BEGIN;

-- =============================================================================
-- CREATE TABLE: product_costs
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_costs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization (multi-tenancy)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Product reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Cost type
  cost_type TEXT NOT NULL DEFAULT 'standard' CHECK (cost_type IN ('standard', 'actual', 'planned')),

  -- Cost components
  material_cost DECIMAL(15,4),
  labor_cost DECIMAL(15,4),
  overhead_cost DECIMAL(15,4),
  total_cost DECIMAL(15,4),

  -- Effective date range
  effective_from DATE NOT NULL,
  effective_to DATE, -- NULL means currently active

  -- Calculation metadata
  calculation_method TEXT CHECK (calculation_method IN ('bom_routing', 'actual_production', 'manual')),

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: current cost for product
CREATE INDEX IF NOT EXISTS idx_product_costs_product_effective
ON product_costs(product_id, effective_from, effective_to);

-- Organization filter
CREATE INDEX IF NOT EXISTS idx_product_costs_org
ON product_costs(org_id);

-- Find active costs (effective_to IS NULL)
CREATE INDEX IF NOT EXISTS idx_product_costs_active
ON product_costs(org_id, product_id) WHERE effective_to IS NULL;

-- =============================================================================
-- TRIGGER: Auto-update timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_product_costs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_costs_timestamp ON product_costs;
CREATE TRIGGER trigger_product_costs_timestamp
BEFORE UPDATE ON product_costs
FOR EACH ROW EXECUTE FUNCTION update_product_costs_timestamp();

-- =============================================================================
-- RLS POLICIES (ADR-013: Users Table Lookup Pattern)
-- =============================================================================

-- Enable RLS
ALTER TABLE product_costs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read costs from their organization
CREATE POLICY product_costs_org_isolation_select
  ON product_costs
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Users can only create costs in their organization
CREATE POLICY product_costs_org_isolation_insert
  ON product_costs
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- UPDATE: Users can only update costs in their organization
CREATE POLICY product_costs_org_isolation_update
  ON product_costs
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE: Users can only delete costs in their organization
CREATE POLICY product_costs_org_isolation_delete
  ON product_costs
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON product_costs TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE product_costs IS 'Calculated product costs with effective dates (Story 02.9)';

COMMENT ON COLUMN product_costs.id IS 'Primary key UUID';
COMMENT ON COLUMN product_costs.org_id IS 'Organization ID for multi-tenancy';
COMMENT ON COLUMN product_costs.product_id IS 'Reference to product being costed';
COMMENT ON COLUMN product_costs.cost_type IS 'Cost type: standard, actual, planned';
COMMENT ON COLUMN product_costs.material_cost IS 'Sum of ingredient costs from BOM';
COMMENT ON COLUMN product_costs.labor_cost IS 'Sum of operation labor costs from routing';
COMMENT ON COLUMN product_costs.overhead_cost IS 'Overhead cost (percentage of subtotal)';
COMMENT ON COLUMN product_costs.total_cost IS 'Total cost including overhead';
COMMENT ON COLUMN product_costs.effective_from IS 'Start date when cost applies';
COMMENT ON COLUMN product_costs.effective_to IS 'End date when cost expires, NULL = current';
COMMENT ON COLUMN product_costs.calculation_method IS 'How cost was calculated: bom_routing, actual_production, manual';
COMMENT ON COLUMN product_costs.created_at IS 'Creation timestamp';
COMMENT ON COLUMN product_costs.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN product_costs.created_by IS 'User who created the cost record';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'product_costs';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'product_costs'
-- ORDER BY ordinal_position;
--
-- Check RLS policies:
-- SELECT policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'product_costs';
