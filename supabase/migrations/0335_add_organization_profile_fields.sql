-- Migration 0335: Add Organization Profile Fields
-- BUG-002 FIX: "Could not find the 'address' column of 'organizations' in the schema cache"
-- Description: Adds missing organization profile columns for /settings/organization page
-- Date: 2026-02-07

-- Add company_name (alias/alternative to 'name' for forms)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add address field (single line address, not address_line1/2)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Add location fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Add business fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS nip_vat TEXT;

-- Add formatting preferences
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS number_format TEXT DEFAULT '1,234.56',
  ADD COLUMN IF NOT EXISTS unit_system TEXT DEFAULT 'metric';

-- Add regional/localization fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'EN';

-- Add fiscal year start (optional, used in API)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER;

-- Add constraints
ALTER TABLE public.organizations
  ADD CONSTRAINT IF NOT EXISTS organizations_country_check
    CHECK (country IS NULL OR length(country) <= 3);

ALTER TABLE public.organizations
  ADD CONSTRAINT IF NOT EXISTS organizations_date_format_check
    CHECK (date_format IS NULL OR date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'));

ALTER TABLE public.organizations
  ADD CONSTRAINT IF NOT EXISTS organizations_number_format_check
    CHECK (number_format IS NULL OR number_format IN ('1,234.56', '1.234,56', '1 234.56'));

ALTER TABLE public.organizations
  ADD CONSTRAINT IF NOT EXISTS organizations_unit_system_check
    CHECK (unit_system IS NULL OR unit_system IN ('metric', 'imperial'));

-- Sync company_name with existing 'name' for existing records
UPDATE public.organizations
SET company_name = name
WHERE company_name IS NULL AND name IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.organizations.company_name IS 'Full company name (display name)';
COMMENT ON COLUMN public.organizations.address IS 'Company address (street, building)';
COMMENT ON COLUMN public.organizations.city IS 'City name';
COMMENT ON COLUMN public.organizations.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN public.organizations.country IS 'Country code (ISO 2-3 letter)';
COMMENT ON COLUMN public.organizations.nip_vat IS 'Tax identification number (NIP/VAT)';
COMMENT ON COLUMN public.organizations.date_format IS 'Preferred date format: DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD';
COMMENT ON COLUMN public.organizations.number_format IS 'Preferred number format for display';
COMMENT ON COLUMN public.organizations.unit_system IS 'Unit system: metric or imperial';
COMMENT ON COLUMN public.organizations.default_currency IS 'Default currency code (PLN, EUR, USD, GBP)';
COMMENT ON COLUMN public.organizations.default_language IS 'Default UI language (PL, EN)';
COMMENT ON COLUMN public.organizations.fiscal_year_start IS 'Month when fiscal year starts (1-12)';
