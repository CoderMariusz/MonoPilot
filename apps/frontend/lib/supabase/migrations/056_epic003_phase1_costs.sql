-- Migration 056: EPIC-003 Phase 1 - Cost Calculation & Analysis
-- Purpose: Add cost tracking tables for material costs, BOM costs, product prices, and WO costs
-- Epic: EPIC-003 - Production Intelligence & Cost Optimization
-- Phase: Phase 1 - BOM Cost Calculation & Analysis
-- Date: 2025-11-12

-- ============================================================================
-- 1. MATERIAL COSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost information
  cost DECIMAL(15, 4) NOT NULL CHECK (cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  uom VARCHAR(10) NOT NULL,

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Source tracking
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'supplier', 'average', 'import')),
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT material_costs_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

-- Indexes for material_costs
CREATE INDEX idx_material_costs_product ON material_costs(product_id);
CREATE INDEX idx_material_costs_org ON material_costs(org_id);
CREATE INDEX idx_material_costs_effective_date ON material_costs(product_id, effective_from);
CREATE INDEX idx_material_costs_date_range ON material_costs(effective_from, effective_to);

-- RLS for material_costs
ALTER TABLE material_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY material_costs_org_isolation ON material_costs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- Trigger to prevent overlapping date ranges for same product
CREATE OR REPLACE FUNCTION validate_material_cost_date_range()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges for the same product
  IF EXISTS (
    SELECT 1 FROM material_costs
    WHERE product_id = NEW.product_id
      AND id != COALESCE(NEW.id, -1)
      AND org_id = NEW.org_id
      AND (
        -- New range overlaps with existing range
        (NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamp))
        OVERLAPS
        (effective_from, COALESCE(effective_to, 'infinity'::timestamp))
      )
  ) THEN
    RAISE EXCEPTION 'Material cost date range overlaps with existing range for this product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_material_cost_date_range_trigger
  BEFORE INSERT OR UPDATE ON material_costs
  FOR EACH ROW
  EXECUTE FUNCTION validate_material_cost_date_range();

-- ============================================================================
-- 2. BOM COSTS TABLE (Snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bom_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost breakdown
  total_cost DECIMAL(15, 4) NOT NULL CHECK (total_cost >= 0),
  material_costs DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (material_costs >= 0),
  labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (overhead_cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Detailed breakdown (JSONB for flexibility)
  material_costs_json JSONB,

  -- Calculation metadata
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  calculated_by BIGINT REFERENCES users(id),
  calculation_method VARCHAR(50) DEFAULT 'standard',
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for bom_costs
CREATE INDEX idx_bom_costs_bom ON bom_costs(bom_id);
CREATE INDEX idx_bom_costs_org ON bom_costs(org_id);
CREATE INDEX idx_bom_costs_calculated_at ON bom_costs(calculated_at DESC);

-- RLS for bom_costs
ALTER TABLE bom_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bom_costs_org_isolation ON bom_costs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- ============================================================================
-- 3. PRODUCT PRICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_prices (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Price information
  price DECIMAL(15, 4) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Price type
  price_type VARCHAR(20) NOT NULL DEFAULT 'wholesale' CHECK (
    price_type IN ('wholesale', 'retail', 'export', 'internal', 'custom')
  ),
  customer_id BIGINT, -- Optional: for customer-specific pricing

  -- Additional info
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_prices_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

-- Indexes for product_prices
CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_prices_org ON product_prices(org_id);
CREATE INDEX idx_product_prices_effective_date ON product_prices(product_id, effective_from);
CREATE INDEX idx_product_prices_type ON product_prices(price_type);

-- RLS for product_prices
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_prices_org_isolation ON product_prices
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- Trigger to prevent overlapping date ranges for same product + price type
CREATE OR REPLACE FUNCTION validate_product_price_date_range()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges for the same product and price type
  IF EXISTS (
    SELECT 1 FROM product_prices
    WHERE product_id = NEW.product_id
      AND price_type = NEW.price_type
      AND COALESCE(customer_id, -1) = COALESCE(NEW.customer_id, -1)
      AND id != COALESCE(NEW.id, -1)
      AND org_id = NEW.org_id
      AND (
        -- New range overlaps with existing range
        (NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamp))
        OVERLAPS
        (effective_from, COALESCE(effective_to, 'infinity'::timestamp))
      )
  ) THEN
    RAISE EXCEPTION 'Product price date range overlaps with existing range for this product and price type';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_product_price_date_range_trigger
  BEFORE INSERT OR UPDATE ON product_prices
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_price_date_range();

-- ============================================================================
-- 4. WORK ORDER COSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Planned costs (from BOM at WO creation)
  planned_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (planned_cost >= 0),
  planned_material_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,

  -- Actual costs (from actual consumption)
  actual_cost DECIMAL(15, 4) DEFAULT 0 CHECK (actual_cost >= 0),
  actual_material_cost DECIMAL(15, 4) DEFAULT 0,
  actual_labor_cost DECIMAL(15, 4) DEFAULT 0,
  actual_overhead_cost DECIMAL(15, 4) DEFAULT 0,

  -- Variance
  cost_variance DECIMAL(15, 4) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
  variance_percent DECIMAL(8, 4) GENERATED ALWAYS AS (
    CASE
      WHEN planned_cost > 0 THEN ((actual_cost - planned_cost) / planned_cost * 100)
      ELSE 0
    END
  ) STORED,

  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Calculation metadata
  planned_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actual_calculated_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for wo_costs
CREATE INDEX idx_wo_costs_wo ON wo_costs(wo_id);
CREATE INDEX idx_wo_costs_org ON wo_costs(org_id);
CREATE INDEX idx_wo_costs_variance ON wo_costs(cost_variance);

-- RLS for wo_costs
ALTER TABLE wo_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY wo_costs_org_isolation ON wo_costs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- ============================================================================
-- 5. HELPER FUNCTIONS - Get Material Cost at Date
-- ============================================================================

CREATE OR REPLACE FUNCTION get_material_cost_at_date(
  p_product_id BIGINT,
  p_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS DECIMAL(15, 4) AS $$
DECLARE
  v_cost DECIMAL(15, 4);
BEGIN
  SELECT cost INTO v_cost
  FROM material_costs
  WHERE product_id = p_product_id
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to > p_date)
    AND org_id = current_setting('app.current_org_id')::bigint
  ORDER BY effective_from DESC
  LIMIT 1;

  RETURN COALESCE(v_cost, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CALCULATE BOM COST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_cost(
  p_bom_id BIGINT,
  p_as_of_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_cost DECIMAL(15, 4) := 0;
  v_materials JSONB := '[]'::jsonb;
  v_item RECORD;
  v_item_cost DECIMAL(15, 4);
  v_material_cost DECIMAL(15, 4);
BEGIN
  -- Calculate cost for each BOM item
  FOR v_item IN
    SELECT
      bi.id,
      bi.product_id,
      p.name as product_name,
      bi.quantity,
      bi.uom,
      bi.is_by_product
    FROM bom_items bi
    JOIN products p ON bi.product_id = p.id
    WHERE bi.bom_id = p_bom_id
      AND bi.is_by_product = FALSE
  LOOP
    -- Get material cost at the specified date
    v_material_cost := get_material_cost_at_date(v_item.product_id, p_as_of_date);
    v_item_cost := v_material_cost * v_item.quantity;
    v_total_cost := v_total_cost + v_item_cost;

    -- Add to materials array
    v_materials := v_materials || jsonb_build_object(
      'product_id', v_item.product_id,
      'product_name', v_item.product_name,
      'quantity', v_item.quantity,
      'uom', v_item.uom,
      'unit_cost', v_material_cost,
      'total_cost', v_item_cost
    );
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'bom_id', p_bom_id,
    'total_cost', v_total_cost,
    'material_cost', v_total_cost,
    'labor_cost', 0,
    'overhead_cost', 0,
    'currency', 'USD',
    'calculated_at', p_as_of_date,
    'materials', v_materials
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GET BOM COST BREAKDOWN FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bom_cost_breakdown(
  p_bom_id BIGINT
)
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  quantity DECIMAL,
  uom VARCHAR,
  unit_cost DECIMAL,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bi.product_id,
    p.name::TEXT as product_name,
    bi.quantity,
    bi.uom,
    COALESCE(get_material_cost_at_date(bi.product_id), 0) as unit_cost,
    COALESCE(get_material_cost_at_date(bi.product_id), 0) * bi.quantity as total_cost
  FROM bom_items bi
  JOIN products p ON bi.product_id = p.id
  WHERE bi.bom_id = p_bom_id
    AND bi.is_by_product = FALSE
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. COMPARE BOM COSTS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION compare_bom_costs(
  p_bom_id_1 BIGINT,
  p_bom_id_2 BIGINT,
  p_as_of_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_cost_1 JSONB;
  v_cost_2 JSONB;
  v_result JSONB;
  v_diff DECIMAL(15, 4);
  v_diff_percent DECIMAL(8, 4);
BEGIN
  -- Calculate costs for both BOMs
  v_cost_1 := calculate_bom_cost(p_bom_id_1, p_as_of_date);
  v_cost_2 := calculate_bom_cost(p_bom_id_2, p_as_of_date);

  -- Calculate difference
  v_diff := (v_cost_2->>'total_cost')::DECIMAL - (v_cost_1->>'total_cost')::DECIMAL;

  IF (v_cost_1->>'total_cost')::DECIMAL > 0 THEN
    v_diff_percent := (v_diff / (v_cost_1->>'total_cost')::DECIMAL) * 100;
  ELSE
    v_diff_percent := 0;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'bom_1', v_cost_1,
    'bom_2', v_cost_2,
    'cost_difference', v_diff,
    'cost_difference_percent', v_diff_percent,
    'comparison_date', p_as_of_date
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. GET PRODUCT COST TREND FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_cost_trend(
  p_product_id BIGINT,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  date TIMESTAMP WITH TIME ZONE,
  cost DECIMAL,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.effective_from as date,
    mc.cost,
    mc.source
  FROM material_costs mc
  WHERE mc.product_id = p_product_id
    AND mc.effective_from >= NOW() - (p_days || ' days')::INTERVAL
    AND mc.org_id = current_setting('app.current_org_id')::bigint
  ORDER BY mc.effective_from DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE material_costs IS 'Tracks material costs over time with effective date ranges';
COMMENT ON TABLE bom_costs IS 'Stores BOM cost calculation snapshots for historical tracking';
COMMENT ON TABLE product_prices IS 'Tracks product sell prices over time by price type';
COMMENT ON TABLE wo_costs IS 'Tracks planned vs actual costs for work orders with variance calculation';

COMMENT ON FUNCTION get_material_cost_at_date IS 'Returns the material cost for a product at a specific date';
COMMENT ON FUNCTION calculate_bom_cost IS 'Calculates total BOM cost with material breakdown at a specific date';
COMMENT ON FUNCTION get_bom_cost_breakdown IS 'Returns detailed breakdown of BOM costs by material';
COMMENT ON FUNCTION compare_bom_costs IS 'Compares costs between two BOM versions';
COMMENT ON FUNCTION get_product_cost_trend IS 'Returns cost history for a product over specified days';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 056 completed successfully!';
  RAISE NOTICE 'Created tables: material_costs, bom_costs, product_prices, wo_costs';
  RAISE NOTICE 'Created 5 cost calculation functions';
  RAISE NOTICE 'EPIC-003 Phase 1 database schema ready!';
END $$;
