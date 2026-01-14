-- Migration: 102_create_cost_variances.sql
-- Description: Create cost_variances table for tracking standard vs actual cost variances (Story 02.15)
-- Date: 2026-01-08
-- Author: Backend Dev Agent
-- Related: Story 02.15, ADR-013 (RLS Pattern), variance-analysis-service.ts

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Store cost variance records comparing standard costs to actual production costs:
-- - material_variance: actual vs standard material cost difference
-- - labor_variance: actual vs standard labor cost difference
-- - overhead_variance: actual vs standard overhead cost difference
-- - total_variance: sum of all variances
-- - variance_percent: percentage change from standard
-- - variance_type: favorable (under budget) or unfavorable (over budget)

BEGIN;

-- =============================================================================
-- CREATE TABLE: cost_variances
-- =============================================================================

CREATE TABLE IF NOT EXISTS cost_variances (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization (multi-tenancy)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Product reference (required)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- BOM reference (optional - for tracking which BOM version)
  bom_id UUID REFERENCES boms(id) ON DELETE SET NULL,

  -- Variance date
  variance_date DATE NOT NULL,

  -- Standard vs Actual costs (matching variance-analysis-service.ts)
  -- Standard costs (from product_costs)
  standard_material DECIMAL(12,4),
  actual_material DECIMAL(12,4),
  standard_labor DECIMAL(12,4),
  actual_labor DECIMAL(12,4),
  standard_overhead DECIMAL(12,4),
  actual_overhead DECIMAL(12,4),
  standard_total DECIMAL(12,4),
  actual_total DECIMAL(12,4),

  -- Calculated variance amounts
  material_variance DECIMAL(12,4),
  labor_variance DECIMAL(12,4),
  overhead_variance DECIMAL(12,4),
  total_variance DECIMAL(12,4),

  -- Variance percentage (e.g., 5.25 = 5.25%)
  variance_percent DECIMAL(6,2),

  -- Variance classification: 'favorable' (under budget) or 'unfavorable' (over budget)
  variance_type TEXT CHECK (variance_type IS NULL OR variance_type IN ('favorable', 'unfavorable')),

  -- Analysis metadata (for linking to work orders via Production module)
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,

  -- Notes and explanation
  notes TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Organization filter (required for RLS performance)
CREATE INDEX IF NOT EXISTS idx_cost_variances_org
ON cost_variances(org_id);

-- Product lookup (for variance report API)
CREATE INDEX IF NOT EXISTS idx_cost_variances_product
ON cost_variances(product_id);

-- Date-based queries (for period filtering)
CREATE INDEX IF NOT EXISTS idx_cost_variances_date
ON cost_variances(variance_date DESC);

-- Composite index for product + date range queries (most common API query pattern)
CREATE INDEX IF NOT EXISTS idx_cost_variances_product_date
ON cost_variances(product_id, variance_date DESC);

-- Org + product + analyzed_at for variance report API query
CREATE INDEX IF NOT EXISTS idx_cost_variances_org_product_analyzed
ON cost_variances(org_id, product_id, analyzed_at DESC);

-- Work order lookup (for linking production data)
CREATE INDEX IF NOT EXISTS idx_cost_variances_work_order
ON cost_variances(work_order_id) WHERE work_order_id IS NOT NULL;

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE cost_variances ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (ADR-013: Users Table Lookup Pattern)
-- =============================================================================

-- SELECT: Users can only read variances from their organization
CREATE POLICY cost_variances_org_isolation_select
  ON cost_variances
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Users can only create variances in their organization
-- Restricted to users with finance_manager, technical_manager, or admin role
CREATE POLICY cost_variances_org_isolation_insert
  ON cost_variances
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin', 'finance_manager', 'technical_manager')
  );

-- UPDATE: Users can only update variances in their organization
-- Creator can update, or users with finance_manager/admin role
CREATE POLICY cost_variances_org_isolation_update
  ON cost_variances
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      created_by = auth.uid()
      OR (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
         IN ('owner', 'admin', 'finance_manager')
    )
  );

-- DELETE: Admin only within organization
CREATE POLICY cost_variances_org_isolation_delete
  ON cost_variances
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('owner', 'admin')
  );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON cost_variances TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE cost_variances IS 'Cost variance records comparing standard vs actual production costs (Story 02.15)';

COMMENT ON COLUMN cost_variances.id IS 'Primary key UUID';
COMMENT ON COLUMN cost_variances.org_id IS 'Organization ID for multi-tenancy';
COMMENT ON COLUMN cost_variances.product_id IS 'Reference to product being analyzed';
COMMENT ON COLUMN cost_variances.bom_id IS 'Reference to BOM version used in variance calculation';
COMMENT ON COLUMN cost_variances.variance_date IS 'Date when variance was recorded';
COMMENT ON COLUMN cost_variances.standard_material IS 'Standard material cost from product_costs';
COMMENT ON COLUMN cost_variances.actual_material IS 'Actual material cost from production';
COMMENT ON COLUMN cost_variances.standard_labor IS 'Standard labor cost from routing';
COMMENT ON COLUMN cost_variances.actual_labor IS 'Actual labor cost from production';
COMMENT ON COLUMN cost_variances.standard_overhead IS 'Standard overhead cost';
COMMENT ON COLUMN cost_variances.actual_overhead IS 'Actual overhead cost from production';
COMMENT ON COLUMN cost_variances.standard_total IS 'Total standard cost';
COMMENT ON COLUMN cost_variances.actual_total IS 'Total actual cost from production';
COMMENT ON COLUMN cost_variances.material_variance IS 'Material cost variance (actual - standard)';
COMMENT ON COLUMN cost_variances.labor_variance IS 'Labor cost variance (actual - standard)';
COMMENT ON COLUMN cost_variances.overhead_variance IS 'Overhead cost variance (actual - standard)';
COMMENT ON COLUMN cost_variances.total_variance IS 'Total cost variance (actual - standard)';
COMMENT ON COLUMN cost_variances.variance_percent IS 'Percentage variance from standard';
COMMENT ON COLUMN cost_variances.variance_type IS 'favorable (under budget) or unfavorable (over budget)';
COMMENT ON COLUMN cost_variances.analyzed_at IS 'Timestamp when variance was calculated';
COMMENT ON COLUMN cost_variances.work_order_id IS 'Reference to work order for actual cost source';
COMMENT ON COLUMN cost_variances.notes IS 'Additional notes about variance';
COMMENT ON COLUMN cost_variances.created_at IS 'Creation timestamp';
COMMENT ON COLUMN cost_variances.created_by IS 'User who created the variance record';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'cost_variances';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'cost_variances'
-- ORDER BY ordinal_position;
--
-- Check RLS policies:
-- SELECT policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'cost_variances';
--
-- Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'cost_variances';
