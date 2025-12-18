-- 052_create_allergens_table.sql
-- Creates per-organization EU allergens reference table (seeded in 053).

BEGIN;

-- Generic updated_at trigger helper (local to this migration series).
-- Safe to re-run because it is CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- EU 14 allergens reference data per organization
CREATE TABLE IF NOT EXISTS allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- A01-A14 (EU standard codes)
  name_en TEXT NOT NULL,
  name_pl TEXT,
  name_de TEXT,
  name_fr TEXT,
  icon TEXT, -- Optional icon identifier (e.g., 'wheat', 'milk')
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_allergens_org_id ON allergens(org_id);
CREATE INDEX IF NOT EXISTS idx_allergens_code ON allergens(code);

-- updated_at maintenance
DROP TRIGGER IF EXISTS set_allergens_updated_at ON allergens;
CREATE TRIGGER set_allergens_updated_at
  BEFORE UPDATE ON allergens
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- RLS
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allergens_org_isolation ON allergens;
CREATE POLICY allergens_org_isolation
  ON allergens
  FOR ALL
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

COMMIT;


