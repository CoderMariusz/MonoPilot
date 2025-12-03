-- Migration 041: Extend production_outputs for Story 4.12
-- Epic 4 Batch 4B-2: Output Registration (Story 4.12, 4.12a, 4.12b)
-- Date: 2025-12-03
-- NOTE: production_outputs table already exists, this adds missing columns

-- ============================================
-- 1. Add missing columns to production_outputs
-- ============================================

ALTER TABLE production_outputs
  ADD COLUMN IF NOT EXISTS output_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS registered_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_outputs_wo ON production_outputs(wo_id);
CREATE INDEX IF NOT EXISTS idx_production_outputs_org ON production_outputs(organization_id);
CREATE INDEX IF NOT EXISTS idx_production_outputs_lp ON production_outputs(lp_id);
CREATE INDEX IF NOT EXISTS idx_production_outputs_registered ON production_outputs(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_outputs_over_production ON production_outputs(is_over_production) WHERE is_over_production = true;

-- ============================================
-- 2. Add output_id to wo_consumption (4.12a)
-- ============================================

ALTER TABLE wo_consumption
  ADD COLUMN IF NOT EXISTS output_id UUID REFERENCES production_outputs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_over_production BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_wo_consumption_output ON wo_consumption(output_id) WHERE output_id IS NOT NULL;

-- ============================================
-- 3. Add over-production tracking to work_orders (4.12b)
-- ============================================

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS is_over_produced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS over_production_qty DECIMAL(15,6) DEFAULT 0;

-- ============================================
-- 4. Add over-production fields to lp_genealogy (4.12b)
-- ============================================

ALTER TABLE lp_genealogy
  ADD COLUMN IF NOT EXISTS is_over_production BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS over_production_source VARCHAR(50);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE production_outputs IS 'Output registrations for Work Orders (Story 4.12)';
COMMENT ON COLUMN production_outputs.output_number IS 'Sequential output number per WO (1, 2, 3...)';
COMMENT ON COLUMN production_outputs.is_over_production IS 'True if output exceeds reserved materials';
COMMENT ON COLUMN production_outputs.over_production_parent_lp_id IS 'Operator-selected parent LP for over-production';
COMMENT ON COLUMN production_outputs.qa_status IS 'QA status: pass, fail, pending';

COMMENT ON COLUMN wo_consumption.output_id IS 'FK to production_outputs - links consumption to specific output';
COMMENT ON COLUMN wo_consumption.is_over_production IS 'True if this consumption is for over-production output';

COMMENT ON COLUMN work_orders.is_over_produced IS 'True if any output exceeded reserved materials';
COMMENT ON COLUMN work_orders.over_production_qty IS 'Total quantity of over-production';

COMMENT ON COLUMN lp_genealogy.is_over_production IS 'True if genealogy is from over-production output';
COMMENT ON COLUMN lp_genealogy.over_production_source IS 'operator_selected - operator chose this LP as parent';
