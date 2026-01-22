/**
 * Migration: Create Customers Tables (Story 07.1)
 *
 * Creates:
 * - customers: Customer master records
 * - customer_contacts: Contact persons (1:N)
 * - customer_addresses: Shipping/billing addresses (1:N)
 * - RLS policies for multi-tenant isolation
 */

-- ============================================================================
-- customers table
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  credit_limit DECIMAL(15, 2),
  payment_terms_days INTEGER DEFAULT 30 NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('retail', 'wholesale', 'distributor')),
  allergen_restrictions JSONB,
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT ck_customers_payment_terms CHECK (payment_terms_days BETWEEN 1 AND 365),
  CONSTRAINT ck_customers_credit_limit CHECK (credit_limit IS NULL OR credit_limit > 0)
);

-- Case-insensitive unique index for customer_code per org
CREATE UNIQUE INDEX uq_customers_org_code ON customers (org_id, LOWER(customer_code));

-- Additional indexes for performance
CREATE INDEX idx_customers_org_active ON customers (org_id, is_active);
CREATE INDEX idx_customers_org_name ON customers (org_id, name);
CREATE INDEX idx_customers_org_category ON customers (org_id, category);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "customers_select_org" ON customers
  FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "customers_insert_org" ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

CREATE POLICY "customers_update_org" ON customers
  FOR UPDATE
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

CREATE POLICY "customers_delete_org" ON customers
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager')
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- ============================================================================
-- customer_contacts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique email per customer (null allowed)
CREATE UNIQUE INDEX uq_customer_contacts_email
  ON customer_contacts (customer_id, LOWER(email))
  WHERE email IS NOT NULL;

-- Indexes
CREATE INDEX idx_customer_contacts_customer ON customer_contacts (customer_id);
CREATE INDEX idx_customer_contacts_org ON customer_contacts (org_id);

-- Enable RLS
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "customer_contacts_select_org" ON customer_contacts
  FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "customer_contacts_insert_org" ON customer_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

CREATE POLICY "customer_contacts_update_org" ON customer_contacts
  FOR UPDATE
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

CREATE POLICY "customer_contacts_delete_org" ON customer_contacts
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

-- ============================================================================
-- customer_addresses table
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping')),
  is_default BOOLEAN DEFAULT false NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  dock_hours JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_customer_addresses_customer ON customer_addresses (customer_id);
CREATE INDEX idx_customer_addresses_org_type ON customer_addresses (org_id, address_type);
CREATE INDEX idx_customer_addresses_org_default ON customer_addresses (org_id, address_type, is_default);

-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "customer_addresses_select_org" ON customer_addresses
  FOR SELECT
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "customer_addresses_insert_org" ON customer_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

CREATE POLICY "customer_addresses_update_org" ON customer_addresses
  FOR UPDATE
  TO authenticated
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

CREATE POLICY "customer_addresses_delete_org" ON customer_addresses
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (SELECT code FROM roles WHERE id = (SELECT role_id FROM users WHERE id = auth.uid())) IN ('owner', 'admin', 'manager', 'sales')
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_addresses TO authenticated;
