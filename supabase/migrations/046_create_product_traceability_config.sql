-- ============================================================================
-- Migration: Create product_traceability_config table
-- Story: 02.10a - Traceability Configuration
-- Purpose: Per-product traceability and lot number configuration
-- ============================================================================

-- Create product_traceability_config table
CREATE TABLE IF NOT EXISTS product_traceability_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Lot Number Format Configuration
  lot_number_format TEXT NOT NULL DEFAULT 'LOT-{YYYY}-{SEQ:6}',
  lot_number_prefix TEXT NOT NULL DEFAULT 'LOT-',
  lot_number_sequence_length INTEGER NOT NULL DEFAULT 6,

  -- Traceability Level
  traceability_level TEXT NOT NULL DEFAULT 'lot',

  -- Batch Size Defaults
  standard_batch_size DECIMAL(15,4),
  min_batch_size DECIMAL(15,4),
  max_batch_size DECIMAL(15,4),

  -- Expiry Calculation
  expiry_calculation_method TEXT NOT NULL DEFAULT 'fixed_days',
  processing_buffer_days INTEGER DEFAULT 0,

  -- GS1 Encoding Settings
  gs1_lot_encoding_enabled BOOLEAN NOT NULL DEFAULT true,
  gs1_expiry_encoding_enabled BOOLEAN NOT NULL DEFAULT true,
  gs1_sscc_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT unique_product_traceability_config UNIQUE (product_id),
  CONSTRAINT traceability_level_check CHECK (traceability_level IN ('lot', 'batch', 'serial')),
  CONSTRAINT expiry_method_check CHECK (expiry_calculation_method IN ('fixed_days', 'rolling', 'manual')),
  CONSTRAINT sequence_length_check CHECK (lot_number_sequence_length >= 4 AND lot_number_sequence_length <= 10),
  CONSTRAINT processing_buffer_check CHECK (processing_buffer_days >= 0 AND processing_buffer_days <= 365),
  CONSTRAINT batch_size_min_max_check CHECK (
    min_batch_size IS NULL OR max_batch_size IS NULL OR min_batch_size <= max_batch_size
  ),
  CONSTRAINT batch_size_standard_check CHECK (
    standard_batch_size IS NULL OR
    ((min_batch_size IS NULL OR standard_batch_size >= min_batch_size) AND
     (max_batch_size IS NULL OR standard_batch_size <= max_batch_size))
  )
);

-- Enable RLS
ALTER TABLE product_traceability_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies (ADR-013 Pattern)
-- Using users table lookup for org_id
-- ============================================================================

-- SELECT policy - Users can read configs for their org only
CREATE POLICY "traceability_config_select_own" ON product_traceability_config
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy - Users can create configs for their org only
CREATE POLICY "traceability_config_insert_own" ON product_traceability_config
  FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- UPDATE policy - Users can update configs for their org only
CREATE POLICY "traceability_config_update_own" ON product_traceability_config
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE policy - Users can delete configs for their org only
CREATE POLICY "traceability_config_delete_own" ON product_traceability_config
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_traceability_config_product
  ON product_traceability_config(product_id);
CREATE INDEX IF NOT EXISTS idx_product_traceability_config_org
  ON product_traceability_config(org_id);
CREATE INDEX IF NOT EXISTS idx_product_traceability_config_level
  ON product_traceability_config(org_id, traceability_level);

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_traceability_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_traceability_config_timestamp
  BEFORE UPDATE ON product_traceability_config
  FOR EACH ROW
  EXECUTE FUNCTION update_traceability_config_timestamp();

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON product_traceability_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_traceability_config TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE product_traceability_config IS 'Per-product traceability configuration including lot format, batch defaults, and GS1 settings';
COMMENT ON COLUMN product_traceability_config.lot_number_format IS 'Lot format pattern with placeholders: {YYYY}, {YY}, {MM}, {DD}, {SEQ:N}, {JULIAN}, {PROD}, {LINE}';
COMMENT ON COLUMN product_traceability_config.traceability_level IS 'Tracking granularity: lot (multiple units), batch (production run), serial (unit level)';
COMMENT ON COLUMN product_traceability_config.expiry_calculation_method IS 'How expiry date is calculated: fixed_days (from production), rolling (from ingredients), manual';
COMMENT ON COLUMN product_traceability_config.gs1_lot_encoding_enabled IS 'Enable GS1-128 AI 10 encoding for lot numbers';
COMMENT ON COLUMN product_traceability_config.gs1_expiry_encoding_enabled IS 'Enable GS1-128 AI 17 encoding for expiry dates';
COMMENT ON COLUMN product_traceability_config.gs1_sscc_enabled IS 'Enable SSCC-18 encoding for pallet tracking';
