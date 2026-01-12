-- Migration 027: Add Organization Profile Fields (TD-001, Story 01.4)
-- Description: Adds 8 missing fields to organizations table for complete profile
-- Date: 2025-12-23

-- Add address fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country CHAR(2);

-- Add contact fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add date format field
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'YYYY-MM-DD' NOT NULL;

-- Add constraints
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_country_length_check
    CHECK (country IS NULL OR length(country) = 2);

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_contact_email_format_check
    CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_date_format_check
    CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'));

-- Add index for country lookups
CREATE INDEX IF NOT EXISTS idx_organizations_country ON public.organizations(country);

-- Add comments
COMMENT ON COLUMN public.organizations.address_line1 IS 'Primary address line';
COMMENT ON COLUMN public.organizations.address_line2 IS 'Secondary address line (building, suite, etc.)';
COMMENT ON COLUMN public.organizations.city IS 'City name';
COMMENT ON COLUMN public.organizations.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN public.organizations.country IS 'ISO 3166-1 alpha-2 country code (2 characters, e.g., PL, US, GB)';
COMMENT ON COLUMN public.organizations.contact_email IS 'Primary contact email for organization';
COMMENT ON COLUMN public.organizations.contact_phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.organizations.date_format IS 'Preferred date format: MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD';
