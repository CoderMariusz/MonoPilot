-- Migration 005: Settings Tax Codes Table
-- Purpose: Tax codes and VAT rates
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tax_codes_code ON settings_tax_codes(code);
CREATE INDEX idx_tax_codes_active ON settings_tax_codes(is_active);

-- Comments
COMMENT ON TABLE settings_tax_codes IS 'Tax codes and VAT rates for products and transactions';
COMMENT ON COLUMN settings_tax_codes.rate IS 'Tax rate as decimal (e.g., 0.2300 for 23%)';

