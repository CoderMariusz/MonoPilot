-- 061_convert_allergens_to_global.sql
-- Story 01.12: Convert allergens from org-scoped to global reference data
--
-- BREAKING CHANGE: This migration removes org_id from allergens table
-- Rationale: EU allergens are universal regulatory constants, not org-specific data
--
-- Migration Strategy:
-- 1. Drop existing org-scoped allergens table
-- 2. Create new global allergens table with multi-language support
-- 3. Seed 14 EU allergens globally
-- 4. Add RLS for authenticated read-only access

BEGIN;

-- ============================================================================
-- STEP 1: Drop existing org-scoped allergens table
-- ============================================================================

DROP TABLE IF EXISTS allergens CASCADE;
DROP FUNCTION IF EXISTS seed_allergens_for_org(UUID, UUID);

-- ============================================================================
-- STEP 2: Create global allergens table (NO org_id)
-- ============================================================================

CREATE TABLE allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Allergen identification
  code VARCHAR(10) UNIQUE NOT NULL,              -- A01-A14 (EU standard codes)

  -- Multi-language support (FR-SET-072)
  name_en VARCHAR(100) NOT NULL,                 -- English name (required)
  name_pl VARCHAR(100) NOT NULL,                 -- Polish name (required)
  name_de VARCHAR(100),                          -- German name (optional)
  name_fr VARCHAR(100),                          -- French name (optional)

  -- Icon support (FR-SET-073)
  icon_url TEXT,                                 -- URL to allergen icon (e.g., /icons/allergens/gluten.svg)

  -- Metadata
  is_eu_mandatory BOOLEAN NOT NULL DEFAULT true, -- EU Regulation 1169/2011
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,      -- Sort order (A01=1, A02=2, etc.)

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_code_format CHECK (code ~ '^A[0-9]{2}$')
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_allergens_code ON allergens(code);
CREATE INDEX idx_allergens_display_order ON allergens(display_order);
CREATE INDEX idx_allergens_active ON allergens(is_active);

-- Full-text search index across all language fields
CREATE INDEX idx_allergens_search ON allergens
USING gin (to_tsvector('simple',
  coalesce(code, '') || ' ' ||
  coalesce(name_en, '') || ' ' ||
  coalesce(name_pl, '') || ' ' ||
  coalesce(name_de, '') || ' ' ||
  coalesce(name_fr, '')
));

-- ============================================================================
-- STEP 4: Seed 14 EU allergens (FR-SET-070, FR-SET-071)
-- ============================================================================

-- Based on EU Regulation 1169/2011
INSERT INTO allergens (code, name_en, name_pl, name_de, name_fr, icon_url, is_eu_mandatory, display_order)
VALUES
  ('A01', 'Gluten', 'Gluten', 'Gluten', 'Gluten', '/icons/allergens/gluten.svg', true, 1),
  ('A02', 'Crustaceans', 'Skorupiaki', 'Krebstiere', 'Crustaces', '/icons/allergens/crustaceans.svg', true, 2),
  ('A03', 'Eggs', 'Jaja', 'Eier', 'Oeufs', '/icons/allergens/eggs.svg', true, 3),
  ('A04', 'Fish', 'Ryby', 'Fisch', 'Poisson', '/icons/allergens/fish.svg', true, 4),
  ('A05', 'Peanuts', 'Orzeszki ziemne', 'Erdnusse', 'Arachides', '/icons/allergens/peanuts.svg', true, 5),
  ('A06', 'Soybeans', 'Soja', 'Soja', 'Soja', '/icons/allergens/soybeans.svg', true, 6),
  ('A07', 'Milk', 'Mleko', 'Milch', 'Lait', '/icons/allergens/milk.svg', true, 7),
  ('A08', 'Nuts', 'Orzechy', 'Schalenfruchte', 'Fruits a coque', '/icons/allergens/nuts.svg', true, 8),
  ('A09', 'Celery', 'Seler', 'Sellerie', 'Celeri', '/icons/allergens/celery.svg', true, 9),
  ('A10', 'Mustard', 'Gorczyca', 'Senf', 'Moutarde', '/icons/allergens/mustard.svg', true, 10),
  ('A11', 'Sesame', 'Sezam', 'Sesam', 'Sesame', '/icons/allergens/sesame.svg', true, 11),
  ('A12', 'Sulphites', 'Siarczyny', 'Sulfite', 'Sulfites', '/icons/allergens/sulphites.svg', true, 12),
  ('A13', 'Lupin', 'Lubin', 'Lupinen', 'Lupin', '/icons/allergens/lupin.svg', true, 13),
  ('A14', 'Molluscs', 'Mieczaki', 'Weichtiere', 'Mollusques', '/icons/allergens/molluscs.svg', true, 14)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 5: Enable RLS (authenticated read-only access)
-- ============================================================================

ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read allergens (global reference data)
CREATE POLICY allergens_select_authenticated
  ON allergens
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE policies - read-only in MVP
-- Write operations will be blocked by absence of policies

-- ============================================================================
-- STEP 6: updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_allergens_timestamp
  BEFORE UPDATE ON allergens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

COMMIT;
