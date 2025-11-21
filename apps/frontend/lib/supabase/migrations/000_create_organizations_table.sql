-- Migration 000: Create organizations table with RLS
-- Story: 1.1 Organization Configuration
-- Date: 2025-11-21

-- ============================================================================
-- CREATE ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Data
  company_name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2), -- ISO 3166-1 alpha-2
  nip_vat VARCHAR(50), -- Tax ID

  -- Business Settings
  fiscal_year_start DATE, -- e.g., 2024-01-01 (Jan 1) or 2024-04-01 (Apr 1)
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY', -- DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  number_format VARCHAR(20) DEFAULT '1,234.56', -- 1,234.56, 1.234,56, 1 234.56
  unit_system VARCHAR(10) DEFAULT 'metric', -- metric, imperial

  -- Regional Settings
  timezone VARCHAR(50) DEFAULT 'UTC', -- IANA timezone
  default_currency VARCHAR(3) DEFAULT 'EUR', -- ISO 4217
  default_language VARCHAR(2) DEFAULT 'EN', -- ISO 639-1

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT organizations_company_name_check CHECK (char_length(company_name) >= 2),
  CONSTRAINT organizations_date_format_check CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  CONSTRAINT organizations_number_format_check CHECK (number_format IN ('1,234.56', '1.234,56', '1 234.56')),
  CONSTRAINT organizations_unit_system_check CHECK (unit_system IN ('metric', 'imperial')),
  CONSTRAINT organizations_currency_check CHECK (default_currency IN ('PLN', 'EUR', 'USD', 'GBP')),
  CONSTRAINT organizations_language_check CHECK (default_language IN ('PL', 'EN'))
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_company_name ON public.organizations(company_name);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON public.organizations(country);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy 1: Users can only see their own organization
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT org_id
      FROM public.users
      WHERE users.id = auth.uid()
    )
  );

-- Policy 2: Only admins can update organization settings
CREATE POLICY "Only admins can update organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT org_id
      FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy 3: System/service role can insert (for first-time setup)
CREATE POLICY "Service role can insert organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.organizations IS 'Organization settings and configuration (Story 1.1)';
COMMENT ON COLUMN public.organizations.company_name IS 'Company name (2-100 chars, required)';
COMMENT ON COLUMN public.organizations.logo_url IS 'URL to company logo in Supabase Storage';
COMMENT ON COLUMN public.organizations.nip_vat IS 'Tax identification number (NIP/VAT/TIN)';
COMMENT ON COLUMN public.organizations.fiscal_year_start IS 'Start date of fiscal year (e.g., 2024-01-01)';
COMMENT ON COLUMN public.organizations.date_format IS 'Preferred date format for display';
COMMENT ON COLUMN public.organizations.number_format IS 'Preferred number format for display';
COMMENT ON COLUMN public.organizations.unit_system IS 'Measurement system: metric or imperial';
COMMENT ON COLUMN public.organizations.timezone IS 'IANA timezone identifier';
COMMENT ON COLUMN public.organizations.default_currency IS 'ISO 4217 currency code';
COMMENT ON COLUMN public.organizations.default_language IS 'ISO 639-1 language code';
