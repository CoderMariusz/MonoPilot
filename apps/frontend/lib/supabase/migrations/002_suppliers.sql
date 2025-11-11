-- Migration 002: Suppliers Table
-- Purpose: Supplier master data for procurement
-- Date: 2025-01-11
-- Dependencies: None

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  vat_number VARCHAR(50),
  tax_number VARCHAR(50),
  country VARCHAR(3),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(100),
  incoterms VARCHAR(50),
  email VARCHAR(200),
  phone VARCHAR(50),
  address JSONB,
  default_tax_code_id INTEGER,
  lead_time_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- Comments
COMMENT ON TABLE suppliers IS 'Supplier master data for procurement and purchasing';
COMMENT ON COLUMN suppliers.address IS 'Supplier address stored as JSONB for flexibility';
COMMENT ON COLUMN suppliers.default_tax_code_id IS 'Default tax code for this supplier (FK set in later migration)';

