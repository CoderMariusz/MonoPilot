-- Migration: Create organizations table (Story 01.1)
-- Description: Core tenant table with onboarding state
-- Date: 2025-12-16

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'PLN',
  logo_url TEXT,

  -- Onboarding state (Story 01.3)
  onboarding_step INTEGER DEFAULT 0,
  onboarding_started_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE organizations IS 'Core tenant table - each organization is isolated';
COMMENT ON COLUMN organizations.slug IS 'Unique URL-safe identifier';
COMMENT ON COLUMN organizations.onboarding_step IS 'Current step in onboarding wizard (0-6)';
