-- Migration: Create tax_codes table with rate, jurisdiction, validity
-- Story: 01.13 - Tax Codes CRUD
-- Description: Multi-tenant tax codes (VAT, GST, etc.) with effective dates and default selection
-- Date: 2025-12-23

-- =============================================================================
-- 1. CREATE TAX_CODES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tax code details
  code VARCHAR(20) NOT NULL CHECK (code ~ '^[A-Z0-9-]{2,20}$'),
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  country_code CHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),

  -- Validity period
  valid_from DATE NOT NULL,
  valid_to DATE CHECK (valid_to IS NULL OR valid_to > valid_from),

  -- Default flag (one per org)
  is_default BOOLEAN DEFAULT false,

  -- Soft delete fields
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- =============================================================================
-- 2. CREATE INDEXES
-- =============================================================================

-- Unique constraint: one code+country per org (excluding deleted) - must be index with WHERE clause
CREATE UNIQUE INDEX unique_tax_code_per_country ON tax_codes(org_id, code, country_code) WHERE is_deleted = false;

-- Index on org_id for org-scoped queries (RLS)
CREATE INDEX idx_tax_codes_org_id ON tax_codes(org_id);

-- Index on org_id + country_code for filtering by country
CREATE INDEX idx_tax_codes_org_country ON tax_codes(org_id, country_code);

-- Index on active tax codes (excludes soft-deleted)
CREATE INDEX idx_tax_codes_org_active ON tax_codes(org_id, is_deleted) WHERE is_deleted = false;

-- Index on validity date range for status filtering (active/expired/scheduled)
CREATE INDEX idx_tax_codes_valid_dates ON tax_codes(org_id, valid_from, valid_to);

-- =============================================================================
-- 3. CREATE TRIGGERS
-- =============================================================================

-- Trigger function: Auto-uppercase code and country_code
CREATE OR REPLACE FUNCTION auto_uppercase_tax_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code = UPPER(NEW.code);
  NEW.country_code = UPPER(NEW.country_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tax_codes_auto_uppercase
  BEFORE INSERT OR UPDATE ON tax_codes
  FOR EACH ROW
  EXECUTE FUNCTION auto_uppercase_tax_code();

-- Trigger function: Ensure single default per org
CREATE OR REPLACE FUNCTION ensure_single_default_tax_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true AND NEW.is_deleted = false THEN
    UPDATE tax_codes
    SET is_default = false, updated_at = NOW()
    WHERE org_id = NEW.org_id
      AND id != NEW.id
      AND is_default = true
      AND is_deleted = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tax_codes_single_default
  BEFORE INSERT OR UPDATE OF is_default ON tax_codes
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_tax_code();

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES (ADR-013 - Users Table Lookup Pattern)
-- =============================================================================

-- SELECT POLICY: All authenticated users can read non-deleted org tax codes
CREATE POLICY tax_codes_select
ON tax_codes
FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_deleted = false
);

-- INSERT POLICY: Only admins can create tax codes
CREATE POLICY tax_codes_insert
ON tax_codes
FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- UPDATE POLICY: Only admins can update tax codes
CREATE POLICY tax_codes_update
ON tax_codes
FOR UPDATE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- DELETE POLICY: Only admins can delete tax codes
CREATE POLICY tax_codes_delete
ON tax_codes
FOR DELETE
TO authenticated
USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
        IN ('SUPER_ADMIN', 'ADMIN')
    )
);

-- =============================================================================
-- 6. ADD COMMENTS
-- =============================================================================

COMMENT ON TABLE tax_codes IS 'Tax codes (VAT, GST, etc.) with rates, jurisdictions, and effective dates. Multi-tenant, org-scoped.';
COMMENT ON COLUMN tax_codes.code IS 'Tax code identifier (e.g., VAT23, GST5). Uppercase alphanumeric with hyphens.';
COMMENT ON COLUMN tax_codes.name IS 'Human-readable tax code name (e.g., "VAT 23%", "GST 5%")';
COMMENT ON COLUMN tax_codes.rate IS 'Tax rate percentage (0-100). 0 allowed for exempt/zero-rated.';
COMMENT ON COLUMN tax_codes.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., PL, DE, US)';
COMMENT ON COLUMN tax_codes.valid_from IS 'Tax code valid from this date (inclusive)';
COMMENT ON COLUMN tax_codes.valid_to IS 'Tax code valid until this date (inclusive). NULL = no expiry.';
COMMENT ON COLUMN tax_codes.is_default IS 'Default tax code for the org. Only one default per org enforced by trigger.';
COMMENT ON COLUMN tax_codes.is_deleted IS 'Soft delete flag. Deleted tax codes hidden from queries.';

COMMENT ON POLICY tax_codes_select ON tax_codes IS 'All authenticated users can read non-deleted tax codes within their org';
COMMENT ON POLICY tax_codes_insert ON tax_codes IS 'Only admins can create tax codes';
COMMENT ON POLICY tax_codes_update ON tax_codes IS 'Only admins can update tax codes';
COMMENT ON POLICY tax_codes_delete ON tax_codes IS 'Only admins can delete tax codes (soft delete preferred)';

-- =============================================================================
-- Migration complete: 077_create_tax_codes_table.sql
-- =============================================================================
-- Table created: tax_codes (multi-tenant, org-scoped)
-- Indexes created: org_id, org_country, org_active, valid_dates
-- Triggers created: auto_uppercase, single_default
-- RLS enabled: authenticated users (org-filtered), admin-only write
-- Ready for seed data in 078_seed_polish_tax_codes.sql
