-- ============================================================================
-- Migration: Extend product_shelf_life table for Story 02.11
-- Story: 02.11 - Shelf Life Calculation + Expiry Management
-- Purpose: Add extended shelf life fields including override reason, safety buffer,
--          storage conditions, FEFO settings, and recalculation flags
-- ============================================================================

-- First, ensure base table exists (from archive migration 047)
CREATE TABLE IF NOT EXISTS product_shelf_life (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  calculated_days INTEGER,
  override_days INTEGER,
  final_days INTEGER NOT NULL,
  calculation_method TEXT DEFAULT 'manual' CHECK (calculation_method IN ('manual', 'auto_min_ingredients')),
  shortest_ingredient_id UUID REFERENCES products(id),
  storage_conditions TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT product_shelf_life_org_product_unique UNIQUE(org_id, product_id),
  CHECK (calculated_days IS NULL OR calculated_days > 0),
  CHECK (override_days IS NULL OR override_days > 0),
  CHECK (final_days > 0)
);

-- Enable RLS if not already enabled
ALTER TABLE product_shelf_life ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Extend product_shelf_life with new columns for Story 02.11
-- ============================================================================

-- Override reason for audit trail
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- Processing impact and safety buffer
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS processing_impact_days INTEGER DEFAULT 0;

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS safety_buffer_percent DECIMAL(5,2) DEFAULT 20.00;

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS safety_buffer_days INTEGER;

-- Storage conditions (temperature)
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS storage_temp_min DECIMAL(5,2);

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS storage_temp_max DECIMAL(5,2);

-- Storage conditions (humidity)
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS storage_humidity_min DECIMAL(5,2);

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS storage_humidity_max DECIMAL(5,2);

-- Storage conditions (structured array)
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS storage_conditions_json JSONB DEFAULT '[]'::jsonb;

-- Storage instructions text
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS storage_instructions TEXT;

-- Shelf life mode (fixed = production date + days, rolling = min ingredient expiry - buffer)
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS shelf_life_mode TEXT DEFAULT 'fixed';

-- Label format for expiry date display
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS label_format TEXT DEFAULT 'best_before_day';

-- FEFO settings
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS picking_strategy TEXT DEFAULT 'FEFO';

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS min_remaining_for_shipment INTEGER;

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS enforcement_level TEXT DEFAULT 'warn';

-- Expiry warning thresholds
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS expiry_warning_days INTEGER DEFAULT 7;

ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS expiry_critical_days INTEGER DEFAULT 3;

-- Recalculation flag
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS needs_recalculation BOOLEAN DEFAULT false;

-- Updated by user tracking
ALTER TABLE product_shelf_life
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- Add constraints (wrapped in DO block to handle if they already exist)
-- ============================================================================

DO $$
BEGIN
  -- Shelf life mode check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shelf_life_mode_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT shelf_life_mode_check CHECK (shelf_life_mode IN ('fixed', 'rolling'));
  END IF;

  -- Label format check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'label_format_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT label_format_check CHECK (label_format IN ('best_before_day', 'best_before_month', 'use_by'));
  END IF;

  -- Picking strategy check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'picking_strategy_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT picking_strategy_check CHECK (picking_strategy IN ('FIFO', 'FEFO'));
  END IF;

  -- Enforcement level check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enforcement_level_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT enforcement_level_check CHECK (enforcement_level IN ('suggest', 'warn', 'block'));
  END IF;

  -- Temperature range check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'temp_range_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT temp_range_check CHECK (storage_temp_min IS NULL OR storage_temp_max IS NULL OR storage_temp_min <= storage_temp_max);
  END IF;

  -- Humidity range check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'humidity_range_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT humidity_range_check CHECK (storage_humidity_min IS NULL OR storage_humidity_max IS NULL OR storage_humidity_min <= storage_humidity_max);
  END IF;

  -- Expiry threshold check
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expiry_threshold_check'
  ) THEN
    ALTER TABLE product_shelf_life
    ADD CONSTRAINT expiry_threshold_check CHECK (expiry_critical_days IS NULL OR expiry_warning_days IS NULL OR expiry_critical_days <= expiry_warning_days);
  END IF;
END $$;

-- ============================================================================
-- Index for recalculation queue
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_shelf_life_needs_recalc
ON product_shelf_life(org_id, needs_recalculation) WHERE needs_recalculation = true;

CREATE INDEX IF NOT EXISTS idx_product_shelf_life_org_id
ON product_shelf_life(org_id);

CREATE INDEX IF NOT EXISTS idx_product_shelf_life_product_id
ON product_shelf_life(product_id);

-- ============================================================================
-- RLS Policies (ADR-013 Pattern with users table lookup)
-- Drop existing policies if they exist and recreate with proper pattern
-- ============================================================================

DROP POLICY IF EXISTS select_product_shelf_life ON product_shelf_life;
DROP POLICY IF EXISTS insert_product_shelf_life ON product_shelf_life;
DROP POLICY IF EXISTS update_product_shelf_life ON product_shelf_life;
DROP POLICY IF EXISTS delete_product_shelf_life ON product_shelf_life;
DROP POLICY IF EXISTS product_shelf_life_select_own ON product_shelf_life;
DROP POLICY IF EXISTS product_shelf_life_insert_own ON product_shelf_life;
DROP POLICY IF EXISTS product_shelf_life_update_own ON product_shelf_life;
DROP POLICY IF EXISTS product_shelf_life_delete_own ON product_shelf_life;

-- SELECT policy
CREATE POLICY "product_shelf_life_select_own" ON product_shelf_life
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy
CREATE POLICY "product_shelf_life_insert_own" ON product_shelf_life
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- UPDATE policy
CREATE POLICY "product_shelf_life_update_own" ON product_shelf_life
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE policy
CREATE POLICY "product_shelf_life_delete_own" ON product_shelf_life
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_shelf_life_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_shelf_life_timestamp ON product_shelf_life;

CREATE TRIGGER trg_update_shelf_life_timestamp
  BEFORE UPDATE ON product_shelf_life
  FOR EACH ROW
  EXECUTE FUNCTION update_shelf_life_timestamp();

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON product_shelf_life TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_shelf_life TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE product_shelf_life IS 'Extended shelf life configuration per product including calculation, override, storage, and FEFO settings';
COMMENT ON COLUMN product_shelf_life.override_reason IS 'Required reason when manually overriding calculated shelf life (audit trail)';
COMMENT ON COLUMN product_shelf_life.processing_impact_days IS 'Days to subtract from shelf life due to processing (e.g., heat treatment)';
COMMENT ON COLUMN product_shelf_life.safety_buffer_percent IS 'Safety buffer as percentage of calculated days (default 20%)';
COMMENT ON COLUMN product_shelf_life.safety_buffer_days IS 'Calculated safety buffer in days';
COMMENT ON COLUMN product_shelf_life.shelf_life_mode IS 'fixed = production date + final_days, rolling = min ingredient expiry - buffer';
COMMENT ON COLUMN product_shelf_life.label_format IS 'Expiry date label format: best_before_day, best_before_month, use_by';
COMMENT ON COLUMN product_shelf_life.picking_strategy IS 'Inventory picking strategy: FIFO (first in first out), FEFO (first expiry first out)';
COMMENT ON COLUMN product_shelf_life.min_remaining_for_shipment IS 'Minimum days remaining shelf life required for shipment';
COMMENT ON COLUMN product_shelf_life.enforcement_level IS 'FEFO enforcement: suggest (info only), warn (requires confirmation), block (prevents shipment)';
COMMENT ON COLUMN product_shelf_life.needs_recalculation IS 'Flag set by trigger when ingredient shelf life changes';
