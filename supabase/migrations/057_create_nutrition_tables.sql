-- Migration: 057_create_nutrition_tables.sql
-- Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
-- Description: Creates product_nutrition and ingredient_nutrition tables with RLS policies
-- Date: 2025-12-28

-- ============================================
-- PRODUCT NUTRITION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS product_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Serving information
  serving_size DECIMAL(10,2),
  serving_unit TEXT DEFAULT 'g' CHECK (serving_unit IN ('g', 'ml', 'oz', 'cup', 'tbsp', 'piece')),
  servings_per_container INTEGER,

  -- Override tracking
  is_manual_override BOOLEAN DEFAULT false,
  override_source TEXT CHECK (override_source IS NULL OR override_source IN ('lab_test', 'supplier_coa', 'database', 'calculated', 'manual')),
  override_reference TEXT,
  override_notes TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,

  -- Calculation metadata
  calculated_at TIMESTAMPTZ,
  bom_version_used INTEGER,
  bom_id_used UUID REFERENCES boms(id) ON DELETE SET NULL,

  -- Macronutrients (per 100g/100ml)
  energy_kcal DECIMAL(10,2),
  energy_kj DECIMAL(10,2),
  protein_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  saturated_fat_g DECIMAL(10,2),
  trans_fat_g DECIMAL(10,2),
  carbohydrate_g DECIMAL(10,2),
  sugar_g DECIMAL(10,2),
  added_sugar_g DECIMAL(10,2),
  fiber_g DECIMAL(10,2),
  sodium_mg DECIMAL(10,2),
  salt_g DECIMAL(10,4),
  cholesterol_mg DECIMAL(10,2),

  -- Micronutrients (FDA 2016 required)
  vitamin_d_mcg DECIMAL(10,4),
  calcium_mg DECIMAL(10,2),
  iron_mg DECIMAL(10,2),
  potassium_mg DECIMAL(10,2),

  -- Optional micronutrients
  vitamin_c_mg DECIMAL(10,2),
  vitamin_a_mcg DECIMAL(10,4),

  -- Serving calculation metadata
  serving_calculation_method TEXT,
  fda_racc_category TEXT,
  fda_racc_value_g DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT product_nutrition_org_product_unique UNIQUE(org_id, product_id),
  CONSTRAINT product_nutrition_serving_size_check CHECK (serving_size IS NULL OR serving_size > 0)
);

-- Indexes for product_nutrition
CREATE INDEX IF NOT EXISTS idx_product_nutrition_org_product ON product_nutrition(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_product ON product_nutrition(product_id);

-- ============================================
-- INGREDIENT NUTRITION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ingredient_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Per unit basis
  per_unit DECIMAL(10,2) DEFAULT 100 CHECK (per_unit > 0),
  unit TEXT DEFAULT 'g' CHECK (unit IN ('g', 'ml')),

  -- Data source
  source TEXT DEFAULT 'manual' CHECK (source IN ('usda', 'eurofir', 'supplier_coa', 'manual')),
  source_id TEXT,
  source_date DATE,
  verified_by UUID REFERENCES auth.users(id),
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  notes TEXT,

  -- Macronutrients (per 100g/100ml)
  energy_kcal DECIMAL(10,2),
  energy_kj DECIMAL(10,2),
  protein_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  saturated_fat_g DECIMAL(10,2),
  trans_fat_g DECIMAL(10,2),
  carbohydrate_g DECIMAL(10,2),
  sugar_g DECIMAL(10,2),
  added_sugar_g DECIMAL(10,2),
  fiber_g DECIMAL(10,2),
  sodium_mg DECIMAL(10,2),
  salt_g DECIMAL(10,4),
  cholesterol_mg DECIMAL(10,2),

  -- Micronutrients
  vitamin_d_mcg DECIMAL(10,4),
  calcium_mg DECIMAL(10,2),
  iron_mg DECIMAL(10,2),
  potassium_mg DECIMAL(10,2),
  vitamin_c_mg DECIMAL(10,2),
  vitamin_a_mcg DECIMAL(10,4),

  -- Moisture (for yield calculations)
  moisture_g DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT ingredient_nutrition_org_ingredient_unique UNIQUE(org_id, ingredient_id)
);

-- Indexes for ingredient_nutrition
CREATE INDEX IF NOT EXISTS idx_ingredient_nutrition_org ON ingredient_nutrition(org_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_nutrition_ingredient ON ingredient_nutrition(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_nutrition_source ON ingredient_nutrition(org_id, source);

-- ============================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_nutrition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to product_nutrition
DROP TRIGGER IF EXISTS update_product_nutrition_updated_at ON product_nutrition;
CREATE TRIGGER update_product_nutrition_updated_at
  BEFORE UPDATE ON product_nutrition
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_updated_at();

-- Apply to ingredient_nutrition
DROP TRIGGER IF EXISTS update_ingredient_nutrition_updated_at ON ingredient_nutrition;
CREATE TRIGGER update_ingredient_nutrition_updated_at
  BEFORE UPDATE ON ingredient_nutrition
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE product_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_nutrition ENABLE ROW LEVEL SECURITY;

-- Product Nutrition RLS Policies
CREATE POLICY "product_nutrition_org_isolation_select" ON product_nutrition
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "product_nutrition_org_isolation_insert" ON product_nutrition
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "product_nutrition_org_isolation_update" ON product_nutrition
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "product_nutrition_org_isolation_delete" ON product_nutrition
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Ingredient Nutrition RLS Policies
CREATE POLICY "ingredient_nutrition_org_isolation_select" ON ingredient_nutrition
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "ingredient_nutrition_org_isolation_insert" ON ingredient_nutrition
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "ingredient_nutrition_org_isolation_update" ON ingredient_nutrition
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "ingredient_nutrition_org_isolation_delete" ON ingredient_nutrition
  FOR DELETE USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON product_nutrition TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ingredient_nutrition TO authenticated;
