-- Migration 054: Create warehouse_settings table
-- Epic 5: Warehouse Management
-- Story 5.31: Warehouse Settings Configuration
-- Date: 2025-12-07

-- ============================================================================
-- Warehouse Settings (Story 5.31)
-- ============================================================================

CREATE TABLE warehouse_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- LP Configuration
  lp_number_format VARCHAR(50) DEFAULT 'LP-{WH}-YYYYMMDD-NNNN',
  auto_print_labels BOOLEAN DEFAULT false,
  allow_over_receipt BOOLEAN DEFAULT false,
  over_receipt_tolerance_pct DECIMAL(5,2) DEFAULT 5.00,

  -- Scanner Configuration
  scanner_session_timeout_mins INT DEFAULT 30,
  scanner_warning_timeout_secs INT DEFAULT 30,
  max_offline_operations INT DEFAULT 100,
  offline_warning_threshold_pct INT DEFAULT 80,

  -- Barcode Configuration
  barcode_format_lp VARCHAR(20) DEFAULT 'EAN128',
  barcode_format_product VARCHAR(20) DEFAULT 'EAN128',
  barcode_format_location VARCHAR(20) DEFAULT 'CODE128',

  -- Printer Configuration (JSON)
  printer_config JSONB,

  -- ZPL Template
  zpl_label_template TEXT,

  -- Barcode validation patterns (JSON)
  barcode_patterns JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one row per org
  CONSTRAINT idx_warehouse_settings_org UNIQUE (org_id)
);

ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY warehouse_settings_isolation ON warehouse_settings
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

COMMENT ON TABLE warehouse_settings IS 'Warehouse module settings: LP format, scanner config, barcode config - Story 5.31';
COMMENT ON COLUMN warehouse_settings.lp_number_format IS 'LP number format template with placeholders: {WH}, YYYYMMDD, NNNN';
COMMENT ON COLUMN warehouse_settings.auto_print_labels IS 'Automatically print LP labels after creation';
COMMENT ON COLUMN warehouse_settings.allow_over_receipt IS 'Allow receiving more than ordered quantity';
COMMENT ON COLUMN warehouse_settings.over_receipt_tolerance_pct IS 'Percentage over PO quantity allowed (0-100)';
COMMENT ON COLUMN warehouse_settings.scanner_session_timeout_mins IS 'Scanner session timeout in minutes (1-60)';
COMMENT ON COLUMN warehouse_settings.scanner_warning_timeout_secs IS 'Warning timeout in seconds before session expires';
COMMENT ON COLUMN warehouse_settings.max_offline_operations IS 'Maximum offline operations to sync';
COMMENT ON COLUMN warehouse_settings.offline_warning_threshold_pct IS 'Warning threshold percentage (0-100)';
COMMENT ON COLUMN warehouse_settings.barcode_format_lp IS 'Barcode format for license plates';
COMMENT ON COLUMN warehouse_settings.barcode_format_product IS 'Barcode format for products';
COMMENT ON COLUMN warehouse_settings.barcode_format_location IS 'Barcode format for locations';
COMMENT ON COLUMN warehouse_settings.printer_config IS 'JSONB: printer configuration (IP, port, model, etc.)';
COMMENT ON COLUMN warehouse_settings.zpl_label_template IS 'ZPL template for label printing';
COMMENT ON COLUMN warehouse_settings.barcode_patterns IS 'JSONB: barcode validation patterns';

-- ============================================================================
-- Initialize warehouse_settings for existing orgs
-- ============================================================================

-- Insert default warehouse_settings for all existing organizations
INSERT INTO warehouse_settings (org_id)
SELECT id FROM organizations
ON CONFLICT (org_id) DO NOTHING;
