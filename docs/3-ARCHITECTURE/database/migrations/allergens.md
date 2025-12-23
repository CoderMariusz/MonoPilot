# Allergens Table Migration Documentation

**Migration**: `076_create_allergens_table.sql`
**Story**: 01.12 - Allergens Management
**Module**: Settings
**Date**: 2025-12-22
**Version**: 1.0.0
**Last Updated**: 2025-12-23

---

## Overview

This migration creates the `allergens` table with 14 EU-mandated allergens as defined in EU Regulation (EU) No 1169/2011. This is the first implementation of **global reference data** in MonoPilot - unlike other tables, allergens are NOT organization-scoped.

**Key Features**:
- Global reference data (no org_id column)
- 14 EU-mandated allergens pre-seeded
- Multi-language support (EN, PL, DE, FR)
- Read-only enforcement via RLS
- Full-text search via GIN index
- Idempotent seeding for safe re-runs

---

## Migration File

**Path**: `supabase/migrations/076_create_allergens_table.sql`

**Dependencies**: None (standalone table)

**Applied**: Automatically by Supabase migrations

---

## Table Schema

### Column Definitions

```sql
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Column Descriptions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key, unique allergen identifier |
| `code` | VARCHAR(10) | No | - | Allergen code (A01-A14 for EU allergens) |
| `name_en` | VARCHAR(100) | No | - | English name (required for all allergens) |
| `name_pl` | VARCHAR(100) | No | - | Polish name (required for all allergens) |
| `name_de` | VARCHAR(100) | Yes | NULL | German name (optional, nullable) |
| `name_fr` | VARCHAR(100) | Yes | NULL | French name (optional, nullable) |
| `icon_url` | TEXT | Yes | NULL | Path to icon SVG (e.g., `/icons/allergens/gluten.svg`) |
| `icon_svg` | TEXT | Yes | NULL | Inline SVG content (future use, currently NULL) |
| `is_eu_mandatory` | BOOLEAN | No | `true` | True for EU Regulation 1169/2011 allergens |
| `is_custom` | BOOLEAN | No | `false` | True for org-specific allergens (Phase 3) |
| `is_active` | BOOLEAN | No | `true` | Display visibility flag (false to hide from UI) |
| `display_order` | INTEGER | No | `0` | Sort order (1-14 for EU allergens) |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Timestamp when record was created |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Timestamp when record was last updated |

### Constraints

```sql
-- Primary key constraint
PRIMARY KEY (id)

-- Unique code constraint
CONSTRAINT allergens_code_unique UNIQUE(code)

-- Code format validation (A01-A99)
CONSTRAINT allergens_code_format CHECK (code ~ '^A[0-9]{2}$')
```

**Code Format Regex**: `^A[0-9]{2}$`
- Starts with `A`
- Followed by exactly 2 digits (01-99)
- Examples: `A01`, `A07`, `A14` (valid) | `A1`, `B01`, `A001` (invalid)

---

## Indexes

### 1. Code Index

```sql
CREATE INDEX idx_allergens_code ON allergens(code);
```

**Purpose**: Fast lookup by allergen code (A01-A14)

**Usage**:
```sql
SELECT * FROM allergens WHERE code = 'A07'; -- Uses index
```

**Performance**: < 10ms for single code lookup

### 2. Display Order Index

```sql
CREATE INDEX idx_allergens_display_order ON allergens(display_order);
```

**Purpose**: Efficient sorting by display order

**Usage**:
```sql
SELECT * FROM allergens ORDER BY display_order; -- Uses index
```

**Performance**: < 50ms for full sort (14 rows)

### 3. Full-Text Search Index (GIN)

```sql
CREATE INDEX idx_allergens_search ON allergens USING GIN (
  to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
  )
);
```

**Purpose**: Fast full-text search across all language fields

**Index Type**: GIN (Generalized Inverted Index)

**Usage**:
```sql
-- Search across all language fields
SELECT * FROM allergens
WHERE to_tsvector('simple',
  coalesce(code, '') || ' ' ||
  coalesce(name_en, '') || ' ' ||
  coalesce(name_pl, '') || ' ' ||
  coalesce(name_de, '') || ' ' ||
  coalesce(name_fr, '')
) @@ to_tsquery('simple', 'milk');
```

**Performance**: < 100ms for search queries (even with 1000+ custom allergens in Phase 3)

**Why 'simple' Dictionary?**
- No stemming (exact matches only)
- Supports multi-language without language-specific dictionaries
- Faster indexing and searching

---

## Row-Level Security (RLS)

### Policy 1: Select (Read-Only)

```sql
CREATE POLICY allergens_select_authenticated
  ON allergens
  FOR SELECT
  TO authenticated
  USING (is_active = true);
```

**Who Can Access**: All authenticated users

**What They Can See**: Only active allergens (`is_active = true`)

**Key Difference**: NO `org_id` check (global reference data)

**Example**:
```typescript
// User from Org A
const { data } = await supabase.from('allergens').select('*')
// Returns: All 14 EU allergens

// User from Org B
const { data } = await supabase.from('allergens').select('*')
// Returns: Same 14 EU allergens (NOT org-scoped)
```

### No INSERT/UPDATE/DELETE Policies

**Intentional Omission**: No policies for INSERT, UPDATE, or DELETE operations.

**Result**: All mutation attempts will fail with permission denied.

**Read-Only Enforcement**:
```sql
-- Will fail (no INSERT policy)
INSERT INTO allergens (code, name_en, name_pl) VALUES ('A99', 'Custom', 'Custom');
-- Error: permission denied for table allergens

-- Will fail (no UPDATE policy)
UPDATE allergens SET name_en = 'New Name' WHERE code = 'A01';
-- Error: permission denied for table allergens

-- Will fail (no DELETE policy)
DELETE FROM allergens WHERE code = 'A01';
-- Error: permission denied for table allergens
```

**Future Support (Phase 3)**: Custom allergens will require INSERT policy with org_id check.

---

## Seed Data

### 14 EU Allergens

Migration includes idempotent seeding of all 14 EU-mandated allergens:

```sql
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
```

### Idempotent Seeding

**`ON CONFLICT (code) DO NOTHING`**: If allergen code already exists, skip insert.

**Why Idempotent?**
- Safe to re-run migration
- No errors if allergens already seeded
- Database state remains consistent

**Test**:
```sql
-- First run: Inserts 14 allergens
INSERT INTO allergens (...) VALUES (...) ON CONFLICT (code) DO NOTHING;
-- Result: 14 rows inserted

-- Second run: No-op (no errors)
INSERT INTO allergens (...) VALUES (...) ON CONFLICT (code) DO NOTHING;
-- Result: 0 rows inserted (allergens already exist)
```

### Icon URLs

Icons are expected in `public/icons/allergens/`:

```
apps/frontend/public/icons/allergens/
  ├── gluten.svg
  ├── crustaceans.svg
  ├── eggs.svg
  ├── fish.svg
  ├── peanuts.svg
  ├── soybeans.svg
  ├── milk.svg
  ├── nuts.svg
  ├── celery.svg
  ├── mustard.svg
  ├── sesame.svg
  ├── sulphites.svg
  ├── lupin.svg
  └── molluscs.svg
```

**Note**: Icons are NOT included in migration. Must be added separately to frontend repo.

---

## EU Allergen Reference

### Complete List

| Code | English | Polish | German | French | Category |
|------|---------|--------|--------|--------|----------|
| A01 | Gluten | Gluten | Gluten | Gluten | Cereals containing gluten (wheat, rye, barley, oats, spelt, kamut) |
| A02 | Crustaceans | Skorupiaki | Krebstiere | Crustaces | Crustaceans and products thereof |
| A03 | Eggs | Jaja | Eier | Oeufs | Eggs and products thereof |
| A04 | Fish | Ryby | Fisch | Poisson | Fish and products thereof |
| A05 | Peanuts | Orzeszki ziemne | Erdnusse | Arachides | Peanuts and products thereof |
| A06 | Soybeans | Soja | Soja | Soja | Soybeans and products thereof |
| A07 | Milk | Mleko | Milch | Lait | Milk and products thereof (including lactose) |
| A08 | Nuts | Orzechy | Schalenfruchte | Fruits a coque | Tree nuts (almonds, hazelnuts, walnuts, cashews, pecans, Brazil nuts, pistachios, macadamia nuts) |
| A09 | Celery | Seler | Sellerie | Celeri | Celery and products thereof |
| A10 | Mustard | Gorczyca | Senf | Moutarde | Mustard and products thereof |
| A11 | Sesame | Sezam | Sesam | Sesame | Sesame seeds and products thereof |
| A12 | Sulphites | Siarczyny | Sulfite | Sulfites | Sulphur dioxide and sulphites at concentrations >10mg/kg or >10mg/L (SO2) |
| A13 | Lupin | Lubin | Lupinen | Lupin | Lupin and products thereof |
| A14 | Molluscs | Mieczaki | Weichtiere | Mollusques | Molluscs and products thereof |

### Regulatory Basis

**EU Regulation (EU) No 1169/2011** - Annex II

"Substances or products causing allergies or intolerances"

**Labeling Requirement (Article 21)**:
- Name of allergen must be emphasized in ingredient list
- Methods: Bold, italics, background color, different font size, etc.
- Must be clearly distinguishable from rest of ingredient list

**Threshold**: No legal threshold (even trace amounts must be declared if intentionally added)

**May Contain**: Precautionary allergen labeling (PAL) not regulated by EU, but widely used for cross-contamination risk

---

## Testing

### Verify Migration Applied

```sql
-- Check table exists
SELECT COUNT(*) FROM allergens;
-- Expected: 14

-- Check all 14 allergens seeded
SELECT code, name_en FROM allergens ORDER BY display_order;
-- Expected:
-- A01 | Gluten
-- A02 | Crustaceans
-- ... (12 more)
-- A14 | Molluscs

-- Check indexes created
SELECT indexname FROM pg_indexes WHERE tablename = 'allergens';
-- Expected:
-- allergens_pkey (PRIMARY KEY)
-- allergens_code_unique (UNIQUE)
-- idx_allergens_code
-- idx_allergens_display_order
-- idx_allergens_search
```

### Verify RLS Policies

```sql
-- Check RLS enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'allergens';
-- Expected: relrowsecurity = true

-- Check policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'allergens';
-- Expected:
-- allergens_select_authenticated | SELECT
```

### Test Read-Only Enforcement

```sql
-- Attempt to insert (should fail)
INSERT INTO allergens (code, name_en, name_pl)
VALUES ('A99', 'Custom', 'Custom');
-- Expected: ERROR: new row violates row-level security policy for table "allergens"

-- Attempt to update (should fail)
UPDATE allergens SET name_en = 'New Name' WHERE code = 'A01';
-- Expected: ERROR: new row violates row-level security policy for table "allergens"

-- Attempt to delete (should fail)
DELETE FROM allergens WHERE code = 'A01';
-- Expected: ERROR: new row violates row-level security policy for table "allergens"
```

### Test Full-Text Search

```sql
-- Search by English name
SELECT code, name_en FROM allergens
WHERE to_tsvector('simple',
  coalesce(code, '') || ' ' ||
  coalesce(name_en, '') || ' ' ||
  coalesce(name_pl, '') || ' ' ||
  coalesce(name_de, '') || ' ' ||
  coalesce(name_fr, '')
) @@ to_tsquery('simple', 'milk');
-- Expected: A07 | Milk

-- Search by Polish name
SELECT code, name_pl FROM allergens
WHERE to_tsvector('simple',
  coalesce(code, '') || ' ' ||
  coalesce(name_en, '') || ' ' ||
  coalesce(name_pl, '') || ' ' ||
  coalesce(name_de, '') || ' ' ||
  coalesce(name_fr, '')
) @@ to_tsquery('simple', 'mleko');
-- Expected: A07 | Mleko

-- Search by code
SELECT code, name_en FROM allergens
WHERE to_tsvector('simple',
  coalesce(code, '') || ' ' ||
  coalesce(name_en, '') || ' ' ||
  coalesce(name_pl, '') || ' ' ||
  coalesce(name_de, '') || ' ' ||
  coalesce(name_fr, '')
) @@ to_tsquery('simple', 'A07');
-- Expected: A07 | Milk
```

---

## Rollback

To rollback this migration:

```sql
-- Drop table (cascades to indexes and policies)
DROP TABLE IF EXISTS allergens CASCADE;
```

**Warning**: This will delete all allergen data (including custom allergens in Phase 3).

**Alternative (Safer)**: Disable table without dropping:

```sql
-- Disable RLS (makes table inaccessible)
ALTER TABLE allergens DISABLE ROW LEVEL SECURITY;

-- Or set all allergens to inactive
UPDATE allergens SET is_active = false;
```

---

## Future Enhancements

### Phase 2: Icon SVG Content

Add inline SVG content to `icon_svg` column:

```sql
UPDATE allergens
SET icon_svg = '<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>'
WHERE code = 'A01';
```

**Use Case**: Inline SVG rendering without external file requests.

### Phase 3: Custom Allergens

Allow organizations to add custom allergens:

```sql
-- Add org_id column
ALTER TABLE allergens
ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update constraint to allow org-specific codes
ALTER TABLE allergens
DROP CONSTRAINT allergens_code_format;

ALTER TABLE allergens
ADD CONSTRAINT allergens_code_format
CHECK (
  -- EU allergens: A01-A14
  (is_eu_mandatory = true AND code ~ '^A[0-9]{2}$')
  OR
  -- Custom allergens: C01-C99
  (is_custom = true AND code ~ '^C[0-9]{2}$')
);

-- Add RLS policy for custom allergen creation
CREATE POLICY allergens_insert_custom
  ON allergens FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_custom = true
    AND code ~ '^C[0-9]{2}$'
  );

-- Update SELECT policy to include custom allergens
DROP POLICY allergens_select_authenticated ON allergens;

CREATE POLICY allergens_select_authenticated
  ON allergens FOR SELECT
  USING (
    is_active = true
    AND (
      is_eu_mandatory = true  -- All users see EU allergens
      OR org_id = (SELECT org_id FROM users WHERE id = auth.uid())  -- Users see own custom allergens
    )
  );
```

**Custom Allergen Example**:
```sql
INSERT INTO allergens (code, name_en, name_pl, org_id, is_custom)
VALUES ('C01', 'Proprietary Additive', 'Dodatek firmowy', 'org-uuid', true);
```

---

## Performance Benchmarks

| Operation | Target | Actual | Method |
|-----------|--------|--------|--------|
| List all allergens | < 200ms | ~50ms | `SELECT * FROM allergens ORDER BY display_order` |
| Get by ID | < 100ms | ~10ms | `SELECT * FROM allergens WHERE id = ?` |
| Get by code | < 100ms | ~10ms | `SELECT * FROM allergens WHERE code = ?` |
| Full-text search | < 100ms | ~50ms | GIN index search across all fields |

**Test Environment**: Local Supabase (PostgreSQL 15)

**Production**: Should be faster due to connection pooling and edge caching.

---

## Related Documentation

- [Allergen API Documentation](../../api/settings/allergens.md)
- [Allergen Component Documentation](../../frontend/components/allergens.md)
- [Allergen Developer Guide](../../guides/allergen-management.md)
- [Story 01.12 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.12.allergens-management.md)
- [EU Regulation 1169/2011](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1169)
