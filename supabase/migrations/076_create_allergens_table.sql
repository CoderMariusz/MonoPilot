-- Migration: Create allergens table with 14 EU mandatory allergens
-- Story: 01.12 - Allergens Management
-- Description: Global reference data (NOT org-scoped) for EU Regulation (EU) No 1169/2011
-- Date: 2025-12-22

-- =====================================================
-- 1. Create allergens table
-- =====================================================
CREATE TABLE IF NOT EXISTS allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_pl VARCHAR(100) NOT NULL,
  name_de VARCHAR(100),
  name_fr VARCHAR(100),
  icon_url TEXT,
  icon_svg TEXT,
  is_eu_mandatory BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT allergens_code_unique UNIQUE(code),
  CONSTRAINT allergens_code_format CHECK (code ~ '^A[0-9]{2}$')
);

-- Add table comment
COMMENT ON TABLE allergens IS 'EU mandatory allergens (global reference data, NOT org-scoped)';
COMMENT ON COLUMN allergens.code IS 'Allergen code: A01-A14 for EU mandatory allergens';
COMMENT ON COLUMN allergens.is_eu_mandatory IS 'True for EU Regulation (EU) No 1169/2011 allergens';
COMMENT ON COLUMN allergens.is_custom IS 'True for organization-specific allergens (future phase)';
COMMENT ON COLUMN allergens.is_active IS 'False to hide allergen from UI';

-- =====================================================
-- 2. Create indexes
-- =====================================================

-- Index on code for quick lookup
CREATE INDEX idx_allergens_code ON allergens(code);

-- Index on display_order for sorting
CREATE INDEX idx_allergens_display_order ON allergens(display_order);

-- GIN index for full-text search across all language fields
CREATE INDEX idx_allergens_search ON allergens USING GIN (
  to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
  )
);

-- =====================================================
-- 3. Enable Row-Level Security (RLS)
-- =====================================================
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active allergens
CREATE POLICY allergens_select_authenticated
  ON allergens
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- NOTE: No INSERT/UPDATE/DELETE policies = read-only in MVP
-- Custom allergens and management deferred to Phase 3

-- =====================================================
-- 4. Seed 14 EU mandatory allergens
-- =====================================================

-- Use ON CONFLICT for idempotent seeding (safe for re-runs)
INSERT INTO allergens (code, name_en, name_pl, name_de, name_fr, icon_url, display_order, is_eu_mandatory, is_custom, is_active)
VALUES
  ('A01', 'Gluten', 'Gluten', 'Gluten', 'Gluten', '/icons/allergens/gluten.svg', 1, true, false, true),
  ('A02', 'Crustaceans', 'Skorupiaki', 'Krebstiere', 'Crustaces', '/icons/allergens/crustaceans.svg', 2, true, false, true),
  ('A03', 'Eggs', 'Jaja', 'Eier', 'Oeufs', '/icons/allergens/eggs.svg', 3, true, false, true),
  ('A04', 'Fish', 'Ryby', 'Fisch', 'Poisson', '/icons/allergens/fish.svg', 4, true, false, true),
  ('A05', 'Peanuts', 'Orzeszki ziemne', 'Erdnusse', 'Arachides', '/icons/allergens/peanuts.svg', 5, true, false, true),
  ('A06', 'Soybeans', 'Soja', 'Soja', 'Soja', '/icons/allergens/soybeans.svg', 6, true, false, true),
  ('A07', 'Milk', 'Mleko', 'Milch', 'Lait', '/icons/allergens/milk.svg', 7, true, false, true),
  ('A08', 'Nuts', 'Orzechy', 'Schalenfruchte', 'Fruits a coque', '/icons/allergens/nuts.svg', 8, true, false, true),
  ('A09', 'Celery', 'Seler', 'Sellerie', 'Celeri', '/icons/allergens/celery.svg', 9, true, false, true),
  ('A10', 'Mustard', 'Gorczyca', 'Senf', 'Moutarde', '/icons/allergens/mustard.svg', 10, true, false, true),
  ('A11', 'Sesame', 'Sezam', 'Sesam', 'Sesame', '/icons/allergens/sesame.svg', 11, true, false, true),
  ('A12', 'Sulphites', 'Siarczyny', 'Sulfite', 'Sulfites', '/icons/allergens/sulphites.svg', 12, true, false, true),
  ('A13', 'Lupin', 'Lubin', 'Lupinen', 'Lupin', '/icons/allergens/lupin.svg', 13, true, false, true),
  ('A14', 'Molluscs', 'Mieczaki', 'Weichtiere', 'Mollusques', '/icons/allergens/molluscs.svg', 14, true, false, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Migration complete
-- =====================================================
-- Table created: allergens (global reference data)
-- Indexes created: code, display_order, full-text search
-- RLS enabled: authenticated read-only access
-- Seed data: 14 EU mandatory allergens inserted
