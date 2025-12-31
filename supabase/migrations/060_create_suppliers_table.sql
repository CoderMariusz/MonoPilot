-- Migration: Create suppliers table
-- Story: 03.1 - Suppliers CRUD + Master Data
-- Date: 2025-12-30

-- Create suppliers table
CREATE TABLE suppliers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code                TEXT NOT NULL,
  name                TEXT NOT NULL,
  address             TEXT,
  city                TEXT,
  postal_code         TEXT,
  country             TEXT,  -- ISO 3166-1 alpha-2
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  currency            TEXT DEFAULT 'PLN' CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP')),
  tax_code_id         UUID REFERENCES tax_codes(id),
  payment_terms       TEXT NOT NULL,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT true,
  -- Phase 3 fields (nullable for now)
  approved_supplier   BOOLEAN DEFAULT false,
  supplier_rating     DECIMAL(3,2),  -- 1.00-5.00
  last_audit_date     DATE,
  next_audit_due      DATE,
  -- Audit fields
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID REFERENCES users(id),
  updated_by          UUID REFERENCES users(id),
  -- Constraints
  UNIQUE(org_id, code)
);

-- Indexes for performance
CREATE INDEX idx_suppliers_org_active ON suppliers(org_id, is_active, created_at DESC);
CREATE INDEX idx_suppliers_org_code ON suppliers(org_id, code);
CREATE INDEX idx_suppliers_org_name ON suppliers(org_id, name);
CREATE INDEX idx_suppliers_tax_code ON suppliers(tax_code_id);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access suppliers in their organization (ADR-013)
CREATE POLICY suppliers_org_isolation ON suppliers
  FOR ALL
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Trigger for updated_at auto-update
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE suppliers IS 'Supplier master data for procurement (Story 03.1)';
COMMENT ON COLUMN suppliers.code IS 'Unique supplier code per org (e.g., SUP-001). Format: 2-20 chars, uppercase alphanumeric + hyphen';
COMMENT ON COLUMN suppliers.country IS 'ISO 3166-1 alpha-2 country code (e.g., PL, DE, GB)';
COMMENT ON COLUMN suppliers.currency IS 'Default currency for purchase orders (PLN, EUR, USD, GBP)';
COMMENT ON COLUMN suppliers.payment_terms IS 'Payment terms (e.g., Net 30, 2/10 Net 30). REQUIRED field';
COMMENT ON COLUMN suppliers.is_active IS 'Active suppliers appear in PO dropdowns. Inactive are hidden but historical data preserved';
COMMENT ON COLUMN suppliers.approved_supplier IS 'Phase 3: Part of Approved Supplier List (ASL)';
COMMENT ON COLUMN suppliers.supplier_rating IS 'Phase 3: Quality rating 1.00-5.00';
COMMENT ON COLUMN suppliers.last_audit_date IS 'Phase 3: Date of last quality audit';
COMMENT ON COLUMN suppliers.next_audit_due IS 'Phase 3: Date when next audit is due';

-- RPC function to get supplier dependency counts (for canDelete/canDeactivate checks)
-- Uses SECURITY INVOKER to respect RLS policies (ADR-013 compliance)
CREATE OR REPLACE FUNCTION get_supplier_dependency_counts(p_supplier_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_org_id UUID;
  v_user_org_id UUID;
  v_po_count INTEGER := 0;
  v_open_po_count INTEGER := 0;
  v_product_count INTEGER := 0;
BEGIN
  -- Get caller's org_id first (for explicit RLS verification)
  SELECT org_id INTO v_user_org_id FROM users WHERE id = auth.uid();

  IF v_user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;

  -- Get supplier's org_id (RLS will filter based on caller's session)
  -- With SECURITY INVOKER, this query respects RLS automatically
  SELECT org_id INTO v_org_id
  FROM suppliers
  WHERE id = p_supplier_id AND org_id = v_user_org_id;

  -- If supplier not found (either doesn't exist or belongs to different org)
  IF v_org_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Supplier not found',
      'po_count', 0,
      'open_po_count', 0,
      'product_count', 0
    );
  END IF;

  -- Count total purchase orders (if table exists)
  -- NOTE: This will be updated in Story 03.3 when purchase_orders table is created
  -- For now, returns 0

  -- Count products assigned to supplier (if supplier_products table exists)
  -- NOTE: This will be updated in Story 03.2 when supplier_products table is created
  -- For now, returns 0

  RETURN json_build_object(
    'po_count', v_po_count,
    'open_po_count', v_open_po_count,
    'product_count', v_product_count
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_supplier_dependency_counts(UUID) TO authenticated;

-- RPC function to get next supplier code
-- Uses SECURITY INVOKER to respect RLS policies (ADR-013 compliance)
CREATE OR REPLACE FUNCTION get_next_supplier_code(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_org_id UUID;
  v_max_code TEXT;
  v_max_num INTEGER;
  v_next_num INTEGER;
BEGIN
  -- Get caller's org_id first (for explicit RLS verification)
  SELECT org_id INTO v_user_org_id FROM users WHERE id = auth.uid();

  IF v_user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;

  -- Verify caller has access to requested org
  IF p_org_id != v_user_org_id THEN
    RETURN NULL;
  END IF;

  -- Find the highest numbered SUP-XXX code
  -- With SECURITY INVOKER, RLS automatically filters to user's org
  SELECT code INTO v_max_code
  FROM suppliers
  WHERE org_id = p_org_id
    AND code ~ '^SUP-[0-9]+$'
  ORDER BY
    CAST(SUBSTRING(code FROM 5) AS INTEGER) DESC
  LIMIT 1;

  IF v_max_code IS NULL THEN
    -- No existing codes, start at 001
    RETURN 'SUP-001';
  END IF;

  -- Extract the number and increment
  v_max_num := CAST(SUBSTRING(v_max_code FROM 5) AS INTEGER);
  v_next_num := v_max_num + 1;

  -- Format with leading zeros (minimum 3 digits)
  RETURN 'SUP-' || LPAD(v_next_num::TEXT, 3, '0');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_next_supplier_code(UUID) TO authenticated;

-- RPC function to validate supplier code uniqueness
-- Uses SECURITY INVOKER to respect RLS policies (ADR-013 compliance)
CREATE OR REPLACE FUNCTION validate_supplier_code(
  p_org_id UUID,
  p_code TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_org_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Get caller's org_id first (for explicit RLS verification)
  SELECT org_id INTO v_user_org_id FROM users WHERE id = auth.uid();

  IF v_user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;

  -- Verify caller has access to requested org
  IF p_org_id != v_user_org_id THEN
    RETURN FALSE;
  END IF;

  -- Check if code exists (case-insensitive)
  -- With SECURITY INVOKER, RLS automatically filters to user's org
  SELECT EXISTS(
    SELECT 1 FROM suppliers
    WHERE org_id = p_org_id
      AND UPPER(code) = UPPER(p_code)
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) INTO v_exists;

  -- Return TRUE if code is available (does NOT exist)
  RETURN NOT v_exists;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION validate_supplier_code(UUID, TEXT, UUID) TO authenticated;
