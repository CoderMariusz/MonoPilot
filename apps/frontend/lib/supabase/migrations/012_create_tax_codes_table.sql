-- Migration 012: Create tax_codes table with RLS and country-based seeding
-- Story: 1.10 Tax Code Configuration
-- Date: 2025-11-22

-- ============================================================================
-- CREATE TAX_CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Tax Code Data
  code VARCHAR(50) NOT NULL,
  description VARCHAR(200) NOT NULL,
  rate DECIMAL(5,2) NOT NULL, -- Stored as 23.00 for 23%, supports 0.00 to 999.99

  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT tax_codes_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT tax_codes_code_format_check CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT tax_codes_code_length_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT tax_codes_description_length_check CHECK (char_length(description) >= 1 AND char_length(description) <= 200),
  CONSTRAINT tax_codes_rate_positive_check CHECK (rate >= 0 AND rate <= 100)
);

-- ============================================================================
-- CREATE INDEXES FOR TAX_CODES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tax_codes_org_id ON public.tax_codes(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_codes_code ON public.tax_codes(org_id, code);
CREATE INDEX IF NOT EXISTS idx_tax_codes_rate ON public.tax_codes(org_id, rate);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY FOR TAX_CODES
-- ============================================================================

ALTER TABLE public.tax_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR TAX_CODES
-- ============================================================================

-- Policy: Users can only see tax codes from their own organization
DROP POLICY IF EXISTS tax_codes_select_policy ON public.tax_codes;
CREATE POLICY tax_codes_select_policy ON public.tax_codes
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can insert tax codes in their organization
DROP POLICY IF EXISTS tax_codes_insert_policy ON public.tax_codes;
CREATE POLICY tax_codes_insert_policy ON public.tax_codes
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Policy: Admin can update tax codes in their organization
DROP POLICY IF EXISTS tax_codes_update_policy ON public.tax_codes;
CREATE POLICY tax_codes_update_policy ON public.tax_codes
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admin can delete tax codes in their organization
-- Note: FK constraint from po_lines (Epic 3) prevents deletion if used
DROP POLICY IF EXISTS tax_codes_delete_policy ON public.tax_codes;
CREATE POLICY tax_codes_delete_policy ON public.tax_codes
  FOR DELETE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Trigger to call function on UPDATE (function already created in migration 000)
DROP TRIGGER IF EXISTS tax_codes_updated_at_trigger ON public.tax_codes;
CREATE TRIGGER tax_codes_updated_at_trigger
  BEFORE UPDATE ON public.tax_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (RLS enforces org isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_codes TO authenticated;
GRANT SELECT ON public.tax_codes TO anon;

-- ============================================================================
-- COMMENTS FOR TAX_CODES
-- ============================================================================

COMMENT ON TABLE public.tax_codes IS 'Tax codes for VAT/GST calculation on purchase orders (Story 1.10)';
COMMENT ON COLUMN public.tax_codes.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.tax_codes.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.tax_codes.code IS 'Unique tax code per org (uppercase alphanumeric + hyphens, e.g., VAT23, STD20)';
COMMENT ON COLUMN public.tax_codes.description IS 'Tax code display description (1-200 chars, e.g., "VAT 23%")';
COMMENT ON COLUMN public.tax_codes.rate IS 'Tax rate as decimal percentage (23.00 for 23%, range 0.00-100.00)';

-- ============================================================================
-- COUNTRY-BASED TAX CODE SEEDING FUNCTION
-- ============================================================================
--
-- AC-009.1, AC-009.6: Seed tax codes based on organization country
--
-- This function is called after organization creation to populate
-- default tax codes based on the country.
--
-- Countries supported:
-- - Poland (PL): VAT 23%, 8%, 5%, 0%
-- - United Kingdom (UK/GB): Standard 20%, Reduced 5%, Zero 0%
-- - Default (all others): VAT 0%
--
-- Idempotent: ON CONFLICT DO NOTHING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_tax_codes_for_organization(
  p_org_id UUID,
  p_country_code VARCHAR(2)
)
RETURNS INTEGER AS $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  -- Seed based on country code
  CASE UPPER(p_country_code)
    -- Poland: 4 VAT rates
    WHEN 'PL' THEN
      INSERT INTO public.tax_codes (org_id, code, description, rate)
      VALUES
        (p_org_id, 'VAT23', 'VAT 23%', 23.00),
        (p_org_id, 'VAT8', 'VAT 8%', 8.00),
        (p_org_id, 'VAT5', 'VAT 5%', 5.00),
        (p_org_id, 'VAT0', 'VAT 0%', 0.00)
      ON CONFLICT (org_id, code) DO NOTHING;
      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    -- United Kingdom: 3 rates
    WHEN 'UK', 'GB' THEN
      INSERT INTO public.tax_codes (org_id, code, description, rate)
      VALUES
        (p_org_id, 'STD20', 'Standard Rate 20%', 20.00),
        (p_org_id, 'RED5', 'Reduced Rate 5%', 5.00),
        (p_org_id, 'ZERO', 'Zero Rate 0%', 0.00)
      ON CONFLICT (org_id, code) DO NOTHING;
      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    -- Default: Zero VAT (for all other countries)
    ELSE
      INSERT INTO public.tax_codes (org_id, code, description, rate)
      VALUES
        (p_org_id, 'VAT0', 'Zero VAT', 0.00)
      ON CONFLICT (org_id, code) DO NOTHING;
      GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END CASE;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for function
COMMENT ON FUNCTION public.seed_tax_codes_for_organization IS 'Seeds default tax codes for an organization based on country code (Story 1.10, AC-009.6)';

-- ============================================================================
-- NOTE: Organization Creation Hook (AC-009.6)
-- ============================================================================
--
-- Future: When organization is created, call this function:
--   SELECT seed_tax_codes_for_organization(org_id, country_code);
--
-- Options for implementation:
-- 1. Database trigger on organizations INSERT
-- 2. Application code in organization creation service
-- 3. Post-creation hook in Story 1.12 (Wizard)
--
-- For MVP: Call from application code (organization-service.ts)
-- ============================================================================

-- ============================================================================
-- NOTE: Epic 3 Dependencies (AC-009.4)
-- ============================================================================
--
-- Future: Epic 3 will create po_lines table with:
--   tax_code_id UUID REFERENCES tax_codes(id) ON DELETE RESTRICT
--
-- This prevents deletion of tax codes in use:
-- - Check: SELECT COUNT(*) FROM po_lines WHERE tax_code_id = ?
-- - If count > 0: error "Cannot delete - used by X PO lines"
-- - Recommendation: Archive (is_active flag) instead of delete
-- ============================================================================
