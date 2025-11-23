-- Migration 025: Create suppliers table for Story 3.17
-- Epic 3 Batch 3A: Purchase Orders & Suppliers
-- Date: 2025-01-23

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2), -- ISO 3166-1 alpha-2 (e.g., PL, UK, US)
  currency VARCHAR(3) NOT NULL, -- PLN, EUR, USD, GBP
  tax_code_id UUID NOT NULL REFERENCES tax_codes(id),
  payment_terms VARCHAR(100) NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  moq NUMERIC(15,3), -- Minimum Order Quantity
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: code unique per org
  CONSTRAINT idx_suppliers_org_code UNIQUE (org_id, code),

  -- Check constraints
  CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT currency_valid CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP')),
  CONSTRAINT email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT lead_time_positive CHECK (lead_time_days >= 0),
  CONSTRAINT moq_positive CHECK (moq IS NULL OR moq > 0)
);

-- Indexes
CREATE INDEX idx_suppliers_org ON suppliers(org_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_code ON suppliers(code);

-- RLS Policy
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_isolation ON suppliers
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Comments
COMMENT ON TABLE suppliers IS 'Suppliers for purchase orders - Story 3.17';
COMMENT ON COLUMN suppliers.code IS 'Unique supplier code per org (uppercase, numbers, hyphens, e.g., SUP-001)';
COMMENT ON COLUMN suppliers.currency IS 'Supplier currency (PLN, EUR, USD, GBP) - inherited by purchase orders';
COMMENT ON COLUMN suppliers.tax_code_id IS 'Tax code for PO line tax calculation';
COMMENT ON COLUMN suppliers.payment_terms IS 'Payment terms (e.g., Net 30, Net 60)';
COMMENT ON COLUMN suppliers.lead_time_days IS 'Default lead time in days';
COMMENT ON COLUMN suppliers.moq IS 'Minimum Order Quantity (optional)';
