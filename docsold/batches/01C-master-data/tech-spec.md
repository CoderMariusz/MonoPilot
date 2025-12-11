# Technical Specification - Batch 01C-master-data

**Epic:** 1 - Foundation & Settings
**Batch:** 01C-master-data
**Stories:** 1.9 Allergen Management, 1.10 Tax Code Configuration, 1.11 Module Activation
**Status:** ready-for-dev
**Created:** 2025-11-27
**Last Updated:** 2025-11-27

---

## 1. Batch Overview

### 1.1 Purpose

Batch 01C-master-data dostarcza fundamentalne tabele master data dla MonoPilot: alergeny (14 EU + custom), kody VAT/Tax (per kraj organizacji), oraz aktywację modułów systemu.

### 1.2 Stories Covered

| Story ID | Title | Status | Priority |
|----------|-------|--------|----------|
| 1.9 | Allergen Management | done | P0 |
| 1.10 | Tax Code Configuration | ready-for-dev | P0 |
| 1.11 | Module Activation | ready-for-dev | P0 |

### 1.3 Batch Goals

1. **Allergen Management (1.9)**: 14 EU major allergens preloaded, custom allergens, non-deletable EU allergens
2. **Tax Code Configuration (1.10)**: Country-based tax codes (Poland: 4 VAT rates, UK: 3 rates), editable, deletable if not used
3. **Module Activation (1.11)**: Enable/disable 8 modules (Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance)

### 1.4 Success Criteria

- ✅ 14 EU allergens seeded on org creation (Story 1.9 DONE)
- ⏳ Tax codes seeded based on organization.country (Story 1.10)
- ⏳ Module activation toggles working with navigation rebuild (Story 1.11)
- ⏳ API middleware blocks disabled modules (Story 1.11)
- ⏳ Comprehensive E2E tests for all 3 stories

---

## 2. Database Schema

### 2.1 Tables

#### 2.1.1 `allergens` (Story 1.9 - IMPLEMENTED)

**Purpose:** Store 14 EU major allergens + custom allergens per organization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR(50) | NO | - | Code (e.g., MILK, EGGS, CUSTOM-01) |
| `name` | VARCHAR(100) | NO | - | Display name |
| `is_major` | BOOLEAN | NO | `false` | True for 14 EU major allergens |
| `is_custom` | BOOLEAN | NO | `true` | False for EU, true for custom |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- UNIQUE: `(org_id, code)`

**Indexes:**
- `allergens_org_id_idx` (org_id)
- `allergens_is_major_idx` (is_major)
- `allergens_is_custom_idx` (is_custom)

**RLS Policy:**
```sql
CREATE POLICY "allergens_tenant_isolation" ON allergens
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Seed Function (Migration 011):**
```sql
CREATE OR REPLACE FUNCTION seed_eu_allergens(p_org_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO allergens (org_id, code, name, is_major, is_custom)
  VALUES
    (p_org_id, 'MILK', 'Milk', true, false),
    (p_org_id, 'EGGS', 'Eggs', true, false),
    (p_org_id, 'FISH', 'Fish', true, false),
    (p_org_id, 'SHELLFISH', 'Crustaceans', true, false),
    (p_org_id, 'TREENUTS', 'Tree Nuts', true, false),
    (p_org_id, 'PEANUTS', 'Peanuts', true, false),
    (p_org_id, 'WHEAT', 'Gluten (Wheat)', true, false),
    (p_org_id, 'SOYBEANS', 'Soybeans', true, false),
    (p_org_id, 'SESAME', 'Sesame Seeds', true, false),
    (p_org_id, 'MUSTARD', 'Mustard', true, false),
    (p_org_id, 'CELERY', 'Celery', true, false),
    (p_org_id, 'LUPIN', 'Lupin', true, false),
    (p_org_id, 'SULPHITES', 'Sulphur Dioxide/Sulphites', true, false),
    (p_org_id, 'MOLLUSCS', 'Molluscs', true, false)
  ON CONFLICT (org_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
```

---

#### 2.1.2 `tax_codes` (Story 1.10 - TO IMPLEMENT)

**Purpose:** Store tax/VAT codes per organization, seeded based on country.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR(50) | NO | - | Unique code (A-Z0-9-) |
| `description` | VARCHAR(200) | NO | - | Description (1-200 chars) |
| `rate` | NUMERIC(5,2) | NO | - | Tax rate 0.00-100.00 (23.00 = 23%) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `char_length(description) >= 1 AND char_length(description) <= 200`
- CHECK: `rate >= 0 AND rate <= 100`
- UNIQUE: `(org_id, code)`

**Indexes:**
- `tax_codes_org_id_idx` (org_id)
- `tax_codes_rate_idx` (rate)

**RLS Policy:**
```sql
CREATE POLICY "tax_codes_tenant_isolation" ON tax_codes
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**Seed Function (To Create):**
```sql
CREATE OR REPLACE FUNCTION seed_tax_codes(p_org_id UUID, p_country VARCHAR)
RETURNS void AS $$
BEGIN
  IF p_country = 'PL' THEN
    INSERT INTO tax_codes (org_id, code, description, rate)
    VALUES
      (p_org_id, 'VAT23', 'VAT 23%', 23.00),
      (p_org_id, 'VAT8', 'VAT 8%', 8.00),
      (p_org_id, 'VAT5', 'VAT 5%', 5.00),
      (p_org_id, 'VAT0', 'VAT 0%', 0.00)
    ON CONFLICT (org_id, code) DO NOTHING;
  ELSIF p_country = 'UK' THEN
    INSERT INTO tax_codes (org_id, code, description, rate)
    VALUES
      (p_org_id, 'STD20', 'Standard Rate 20%', 20.00),
      (p_org_id, 'RED5', 'Reduced Rate 5%', 5.00),
      (p_org_id, 'ZERO', 'Zero Rate 0%', 0.00)
    ON CONFLICT (org_id, code) DO NOTHING;
  ELSE
    INSERT INTO tax_codes (org_id, code, description, rate)
    VALUES (p_org_id, 'VAT0', 'Zero VAT', 0.00)
    ON CONFLICT (org_id, code) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

#### 2.1.3 `organizations.modules_enabled` (Story 1.11 - TO IMPLEMENT)

**Purpose:** Array of enabled modules per organization.

**Column Addition to `organizations` table:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `modules_enabled` | TEXT[] | NO | `['technical', 'planning', 'production', 'warehouse']` | Array of module codes |

**Constraints:**
- CHECK: `array_length(modules_enabled, 1) > 0` (at least one module)

**Migration:**
```sql
ALTER TABLE organizations
ADD COLUMN modules_enabled TEXT[] NOT NULL DEFAULT ARRAY['technical', 'planning', 'production', 'warehouse'];

ALTER TABLE organizations
ADD CONSTRAINT organizations_modules_enabled_check CHECK (array_length(modules_enabled, 1) > 0);
```

**Module Configuration (lib/config/modules.ts):**
```typescript
export const MODULES = [
  { code: 'technical', name: 'Technical', description: 'Products, BOMs, Routings', defaultEnabled: true },
  { code: 'planning', name: 'Planning', description: 'POs, TOs, WOs', defaultEnabled: true },
  { code: 'production', name: 'Production', description: 'WO Execution', defaultEnabled: true },
  { code: 'warehouse', name: 'Warehouse', description: 'LPs, Moves, Pallets', defaultEnabled: true },
  { code: 'quality', name: 'Quality', description: 'QA Workflows', defaultEnabled: false },
  { code: 'shipping', name: 'Shipping', description: 'SOs, Pick Lists', defaultEnabled: false },
  { code: 'npd', name: 'NPD', description: 'Formulation', defaultEnabled: false },
  { code: 'finance', name: 'Finance', description: 'Costing, Margin Analysis', defaultEnabled: false }
] as const;
```

---

### 2.2 Relationships

```
organizations
  ├── allergens (1:N) [Story 1.9]
  ├── tax_codes (1:N) [Story 1.10]
  └── modules_enabled (column) [Story 1.11]

products (Epic 2)
  └── product_allergens (N:M → allergens) [Story 1.9, Epic 2]

purchase_orders (Epic 3)
  └── po_lines
      └── tax_code_id (FK → tax_codes) [Story 1.10, Epic 3]
```

---

## 3. API Endpoints

### 3.1 Allergen Endpoints (Story 1.9 - IMPLEMENTED)

#### GET /api/settings/allergens
**Purpose:** List all allergens with optional filters
**Auth:** Authenticated
**Query Params:**
- `is_major` (optional): boolean - filter major allergens
- `is_custom` (optional): boolean - filter custom allergens
- `search` (optional): string - search by code or name

**Response:**
```typescript
{
  allergens: Array<{
    id: string
    org_id: string
    code: string
    name: string
    is_major: boolean
    is_custom: boolean
    product_count: number  // Epic 2 JOIN
    created_at: string
    updated_at: string
  }>
}
```

**Cache:** 10 min TTL (Redis: `allergens:{org_id}`)

---

#### POST /api/settings/allergens
**Purpose:** Create custom allergen
**Auth:** Admin only
**Body:**
```typescript
{
  code: string       // A-Z0-9-, min 2, max 50
  name: string       // min 1, max 100
  is_major: boolean  // default false
}
```

**Response:**
```typescript
{
  allergen: {
    id: string
    org_id: string
    code: string
    name: string
    is_major: boolean
    is_custom: true
    created_at: string
    updated_at: string
  }
}
```

**Events:** Emit `allergen.created` (cache invalidation)

---

#### GET /api/settings/allergens/:id
**Purpose:** Get single allergen by ID
**Auth:** Authenticated
**Response:** Same as POST response

---

#### PUT /api/settings/allergens/:id
**Purpose:** Update allergen (all fields editable)
**Auth:** Admin only
**Body:** Same as POST
**Events:** Emit `allergen.updated`

---

#### DELETE /api/settings/allergens/:id
**Purpose:** Delete custom allergen
**Auth:** Admin only
**Validation:**
- Check `is_custom = true` (cannot delete EU allergens)
- Check not used in `product_allergens` (FK constraint)

**Response:**
```typescript
{
  success: true
  message: "Allergen deleted"
}
```

**Errors:**
- 403: "Cannot delete EU major allergen"
- 409: "Cannot delete - used by X products"

**Events:** Emit `allergen.deleted`

---

### 3.2 Tax Code Endpoints (Story 1.10 - TO IMPLEMENT)

#### GET /api/settings/tax-codes
**Purpose:** List all tax codes
**Auth:** Authenticated
**Query Params:**
- `search` (optional): string - search by code or description

**Response:**
```typescript
{
  tax_codes: Array<{
    id: string
    org_id: string
    code: string
    description: string
    rate: number  // 23.00 = 23%
    po_line_count: number  // Epic 3 JOIN
    created_at: string
    updated_at: string
  }>
}
```

**Cache:** 10 min TTL (Redis: `tax_codes:{org_id}`)

---

#### POST /api/settings/tax-codes
**Purpose:** Create custom tax code
**Auth:** Admin only
**Body:**
```typescript
{
  code: string         // A-Z0-9-, min 2, max 50
  description: string  // min 1, max 200
  rate: number         // 0-100, decimal
}
```

**Response:**
```typescript
{
  tax_code: {
    id: string
    org_id: string
    code: string
    description: string
    rate: number
    created_at: string
    updated_at: string
  }
}
```

**Events:** Emit `tax_code.created`

---

#### PUT /api/settings/tax-codes/:id
**Purpose:** Update tax code
**Auth:** Admin only
**Body:** Same as POST
**Warning:** If rate changes and PO usage exists, warn user
**Events:** Emit `tax_code.updated`

---

#### DELETE /api/settings/tax-codes/:id
**Purpose:** Delete tax code
**Auth:** Admin only
**Validation:** Check not used in `po_lines` (FK constraint)

**Errors:**
- 409: "Cannot delete - used by X PO lines"

**Events:** Emit `tax_code.deleted`

---

### 3.3 Module Endpoints (Story 1.11 - TO IMPLEMENT)

#### GET /api/settings/modules
**Purpose:** Get enabled modules for organization
**Auth:** Authenticated

**Response:**
```typescript
{
  modules_enabled: string[]  // ['technical', 'planning', ...]
  all_modules: Array<{
    code: string
    name: string
    description: string
    defaultEnabled: boolean
    enabled: boolean
  }>
}
```

---

#### PUT /api/settings/modules
**Purpose:** Update enabled modules
**Auth:** Admin only
**Body:**
```typescript
{
  modules: string[]  // Array of module codes
}
```

**Validation:** At least 1 module enabled

**Response:**
```typescript
{
  success: true
  modules_enabled: string[]
}
```

**Events:** Invalidate org cache, rebuild navigation

---

#### POST /api/settings/modules/toggle
**Purpose:** Toggle single module on/off
**Auth:** Admin only
**Body:**
```typescript
{
  module: string     // Module code
  enabled: boolean
}
```

**Response (when disabling):**
```typescript
{
  success: true
  affected_count: number  // Count of active entities
  affected_entities: {
    quality_checks?: number
    sales_orders?: number
    formulations?: number
  }
}
```

**Response (when enabling):**
```typescript
{
  success: true
}
```

**Events:** Invalidate org cache, rebuild navigation

---

## 4. Frontend Routes & Components

### 4.1 Allergen Management (Story 1.9 - IMPLEMENTED)

#### Route: /settings/allergens

**Page Component:** `apps/frontend/app/settings/allergens/page.tsx`

**Features:**
- Search by code/name (debounced)
- Filters: Major allergens, Custom allergens, Source (Standard/Custom)
- Dynamic sorting on Code, Name, Is Major
- Badges: Is Major (orange/gray), Is Custom (blue/gray)
- Product count column (ready for Epic 2)
- Delete protection for preloaded allergens
- Delete confirmation dialog

**Child Components:**
- `AllergenFormModal` (`apps/frontend/components/settings/AllergenFormModal.tsx`)
  - Create/Edit mode
  - Code field (uppercase, disabled for preloaded)
  - Name field (max 100 chars)
  - Is Major toggle
  - Zod validation with inline errors
  - Duplicate code error handling (409)
  - EU allergen info banner

---

### 4.2 Tax Code Configuration (Story 1.10 - TO IMPLEMENT)

#### Route: /settings/production (Tab: "Tax Codes")

**Page Component:** `apps/frontend/app/settings/production/page.tsx`

**Features:**
- Tab navigation: Allergens, Tax Codes (NEW)
- Table columns: Code, Description, Rate (%), POs (count), Actions
- Rate column: formatted as "23.00%"
- Search by code/description
- Sort by code, rate, description

**Components to Create:**
- `TaxCodesTable` (`apps/frontend/components/settings/TaxCodesTable.tsx`)
  - Similar to AllergensTable
  - Rate change warning modal (if PO usage exists)
  - Delete confirmation with PO usage check

- `TaxCodeFormModal` (`apps/frontend/components/settings/TaxCodeFormModal.tsx`)
  - Code, description, rate (number input with % suffix)
  - Form submission: POST or PUT
  - Zod validation (lib/validation/tax-code-schemas.ts)

---

### 4.3 Module Activation (Story 1.11 - TO IMPLEMENT)

#### Route: /settings/modules

**Page Component:** `apps/frontend/app/settings/modules/page.tsx`

**Features:**
- Grid layout (2x4 or 3x3)
- Each module card:
  - Icon (module-specific)
  - Name, description
  - Status badge (Active green, Inactive gray)
  - Toggle switch
- Toggle switch onClick → confirmation modal (if disabling)

**Components to Create:**
- `ModulesGrid` (`apps/frontend/components/settings/ModulesGrid.tsx`)
  - Module cards with toggle switches
  - Fetch: GET /api/settings/modules
  - Update: POST /api/settings/modules/toggle

- `ModuleToggleModal` (`apps/frontend/components/settings/ModuleToggleModal.tsx`)
  - Show when disabling module
  - Display affected entity count (e.g., "5 Quality Checks will be hidden")
  - Warning: "Data not deleted, only hidden. Re-enable anytime."
  - Actions: Cancel, Disable Module

**Navigation Update:**
- Create `useEnabledModules` hook (`apps/frontend/hooks/useEnabledModules.ts`)
  - Fetch organizations.modules_enabled
  - Return array of enabled module codes
  - Used in navigation component to filter links

**API Middleware (Story 1.11):**
- Create `moduleCheckMiddleware` (`apps/frontend/middleware/module-check.ts`)
  - Extract module from route path (e.g., `/api/quality/*` → 'quality')
  - Query organizations.modules_enabled
  - Return 403 if module not enabled
  - Exclude /api/settings/* from check

---

## 5. RLS Policies

### 5.1 Standard Tenant Isolation Pattern

All 3 tables use standard RLS:

```sql
CREATE POLICY "{table}_tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

**Tables:**
- `allergens`
- `tax_codes`
- `organizations` (modules_enabled column)

**Best Practice:**
- Use `createServerSupabaseAdmin()` in services (bypasses RLS with service role)
- Query `users` table for `org_id` (don't rely on JWT claim)

---

## 6. Dependencies

### 6.1 Prerequisites

**Story 1.1 - Organization Configuration:**
- `organizations` table exists
- `organizations.country` field for tax code seeding
- Org creation workflow for allergen/tax code seeding

**Story 1.2 - User Management:**
- `users` table exists
- Role-based access control (admin role for mutations)

---

### 6.2 Downstream Dependencies

**Epic 2 (Technical Module):**
- `product_allergens` table uses `allergens` table
- Product allergen assignment UI (Story 2.4)
- Allergen aggregation in BOM (Story 2.10)

**Epic 3 (Planning Module):**
- `po_lines.tax_code_id` uses `tax_codes` table
- PO tax calculation (Stories 3.2, 3.3)

**All Epics:**
- Module activation affects navigation (hide disabled modules)
- API middleware blocks requests to disabled modules

---

## 7. Validation Schemas

### 7.1 Allergen Schemas (Story 1.9 - IMPLEMENTED)

**File:** `apps/frontend/lib/validation/allergen-schemas.ts`

```typescript
import { z } from 'zod'

export const CreateAllergenSchema = z.object({
  code: z.string()
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens')
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  is_major: z.boolean().default(false)
})

export const UpdateAllergenSchema = CreateAllergenSchema

export type CreateAllergenInput = z.infer<typeof CreateAllergenSchema>
export type UpdateAllergenInput = z.infer<typeof UpdateAllergenSchema>
```

---

### 7.2 Tax Code Schemas (Story 1.10 - TO IMPLEMENT)

**File:** `apps/frontend/lib/validation/tax-code-schemas.ts`

```typescript
import { z } from 'zod'

export const CreateTaxCodeSchema = z.object({
  code: z.string()
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens')
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be at most 200 characters'),
  rate: z.number()
    .min(0, 'Rate must be at least 0')
    .max(100, 'Rate must be at most 100')
})

export const UpdateTaxCodeSchema = CreateTaxCodeSchema

export type CreateTaxCodeInput = z.infer<typeof CreateTaxCodeSchema>
export type UpdateTaxCodeInput = z.infer<typeof UpdateTaxCodeSchema>
```

---

### 7.3 Module Schemas (Story 1.11 - TO IMPLEMENT)

**File:** `apps/frontend/lib/validation/module-schemas.ts`

```typescript
import { z } from 'zod'

const MODULE_CODES = ['technical', 'planning', 'production', 'warehouse', 'quality', 'shipping', 'npd', 'finance'] as const

export const UpdateModulesSchema = z.object({
  modules: z.array(z.enum(MODULE_CODES))
    .min(1, 'At least one module must be enabled')
})

export const ToggleModuleSchema = z.object({
  module: z.enum(MODULE_CODES),
  enabled: z.boolean()
})

export type UpdateModulesInput = z.infer<typeof UpdateModulesSchema>
export type ToggleModuleInput = z.infer<typeof ToggleModuleSchema>
```

---

## 8. Testing Strategy

### 8.1 Story 1.9 (Allergen Management) - IMPLEMENTED

**Status:** Done (62 tests: 30 unit + 14 service + 18 E2E)

**Coverage:**
- ✅ Unit tests: Zod validation schemas
- ✅ Service tests: AllergenService CRUD operations
- ✅ E2E tests: Create/edit/delete allergen, preloaded protection

---

### 8.2 Story 1.10 (Tax Code Configuration) - TO IMPLEMENT

**Unit Tests (lib/validation/tax-code-schemas.test.ts):**
- Valid tax code creation
- Invalid code format (lowercase, spaces)
- Rate validation (negative, > 100)
- Description length validation

**Integration Tests (lib/services/tax-code-service.test.ts):**
- Seed tax codes for Poland org → 4 codes
- Seed tax codes for UK org → 3 codes
- Create custom tax code → saved
- Delete tax code in use → FK error
- Update rate → warning if PO usage
- RLS policy check (org isolation)

**E2E Tests (tests/e2e/tax-codes.spec.ts):**
- Navigate to /settings/production → Tax Codes tab
- Create custom tax code → appears in table
- Edit tax code → changes saved
- Delete unused tax code → success
- Delete tax code in use → error toast
- Search tax codes by code/description

---

### 8.3 Story 1.11 (Module Activation) - TO IMPLEMENT

**Unit Tests (lib/validation/module-schemas.test.ts):**
- Valid modules array
- Empty modules array → error
- Invalid module code → error

**Integration Tests (lib/services/module-service.test.ts):**
- Update modules_enabled → nav updated
- Toggle module off → affected entity count returned
- Toggle module on → module accessible
- API middleware blocks disabled module → 403

**E2E Tests (tests/e2e/modules.spec.ts):**
- Navigate to /settings/modules
- Toggle module off → confirmation modal
- Confirm disable → module hidden from nav
- Navigate to disabled module route → 403 error page
- Toggle module on → module appears in nav
- API request to disabled module → 403 toast

---

## 9. Migration Plan

### 9.1 Story 1.9 (Allergen Management) - DONE

**Migrations Applied:**
- `010_create_allergens_table.sql` - Allergens table schema
- `011_seed_eu_allergens_function.sql` - EU allergen seed function

**Status:** ✅ Complete

---

### 9.2 Story 1.10 (Tax Code Configuration) - TO CREATE

**Migrations to Create:**

1. **012_create_tax_codes_table.sql**
```sql
CREATE TABLE tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(200) NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tax_codes_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT tax_codes_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT tax_codes_description_length CHECK (char_length(description) >= 1 AND char_length(description) <= 200),
  CONSTRAINT tax_codes_rate_range CHECK (rate >= 0 AND rate <= 100)
);

CREATE INDEX tax_codes_org_id_idx ON tax_codes(org_id);
CREATE INDEX tax_codes_rate_idx ON tax_codes(rate);

ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_codes_tenant_isolation" ON tax_codes
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

2. **013_seed_tax_codes_function.sql**
```sql
-- See section 2.1.2 for full function
```

---

### 9.3 Story 1.11 (Module Activation) - TO CREATE

**Migrations to Create:**

1. **014_add_modules_enabled_to_organizations.sql**
```sql
ALTER TABLE organizations
ADD COLUMN modules_enabled TEXT[] NOT NULL DEFAULT ARRAY['technical', 'planning', 'production', 'warehouse'];

ALTER TABLE organizations
ADD CONSTRAINT organizations_modules_enabled_check CHECK (array_length(modules_enabled, 1) > 0);

COMMENT ON COLUMN organizations.modules_enabled IS 'Array of enabled module codes (technical, planning, production, warehouse, quality, shipping, npd, finance)';
```

---

## 10. Implementation Checklist

### Story 1.9 - Allergen Management ✅ DONE
- [x] Database schema (Migration 010)
- [x] Seed function (Migration 011)
- [x] AllergenService (CRUD + cache events)
- [x] Zod validation schemas
- [x] API endpoints (GET, POST, PUT, DELETE)
- [x] Frontend: Allergens list page
- [x] Frontend: AllergenFormModal
- [x] Tests (62 total)

### Story 1.10 - Tax Code Configuration ⏳ TO DO
- [ ] Database schema (Migration 012)
- [ ] Seed function (Migration 013)
- [ ] TaxCodeService (CRUD + cache events)
- [ ] Zod validation schemas
- [ ] API endpoints (GET, POST, PUT, DELETE)
- [ ] Frontend: Tax Codes tab in /settings/production
- [ ] Frontend: TaxCodeFormModal
- [ ] Tests (unit + integration + E2E)

### Story 1.11 - Module Activation ⏳ TO DO
- [ ] Database schema (Migration 014)
- [ ] Module configuration constants
- [ ] ModuleService (getEnabledModules, toggleModule)
- [ ] API middleware (moduleCheckMiddleware)
- [ ] API endpoints (GET, PUT, POST /toggle)
- [ ] Zod validation schemas
- [ ] Frontend: Modules page (/settings/modules)
- [ ] Frontend: ModulesGrid component
- [ ] Frontend: ModuleToggleModal
- [ ] Frontend: useEnabledModules hook
- [ ] Frontend: Navigation rebuild logic
- [ ] Tests (unit + integration + E2E)

---

## 11. File Structure

```
apps/frontend/
  lib/
    supabase/
      migrations/
        010_create_allergens_table.sql ✅
        011_seed_eu_allergens_function.sql ✅
        012_create_tax_codes_table.sql ⏳
        013_seed_tax_codes_function.sql ⏳
        014_add_modules_enabled_to_organizations.sql ⏳
    services/
      allergen-service.ts ✅
      tax-code-service.ts ⏳
      module-service.ts ⏳
    validation/
      allergen-schemas.ts ✅
      tax-code-schemas.ts ⏳
      module-schemas.ts ⏳
    config/
      modules.ts ⏳
  app/
    api/
      settings/
        allergens/
          route.ts ✅
          [id]/route.ts ✅
        tax-codes/
          route.ts ⏳
          [id]/route.ts ⏳
        modules/
          route.ts ⏳
          toggle/route.ts ⏳
    settings/
      allergens/
        page.tsx ✅
      production/
        page.tsx (add Tax Codes tab) ⏳
      modules/
        page.tsx ⏳
  components/
    settings/
      AllergenFormModal.tsx ✅
      TaxCodeFormModal.tsx ⏳
      TaxCodesTable.tsx ⏳
      ModulesGrid.tsx ⏳
      ModuleToggleModal.tsx ⏳
  hooks/
    useEnabledModules.ts ⏳
  middleware/
    module-check.ts ⏳

tests/
  e2e/
    allergens.spec.ts ✅
    tax-codes.spec.ts ⏳
    modules.spec.ts ⏳
```

---

## 12. Notes & Decisions

### 12.1 Allergen Management (Story 1.9)

**Decision:** EU allergens non-deletable
- Rationale: 14 EU allergens are mandatory for food regulation compliance
- Implementation: `is_custom = false` flag + UI disable + FK constraint check

**Decision:** Custom allergens deletable if not used
- Rationale: Organizations may add custom allergens for internal tracking
- Implementation: FK constraint check on `product_allergens` table

---

### 12.2 Tax Code Configuration (Story 1.10)

**Decision:** Country-based seeding
- Poland: 4 VAT rates (23%, 8%, 5%, 0%)
- UK: 3 rates (Standard 20%, Reduced 5%, Zero 0%)
- Other countries: default VAT 0%

**Decision:** Tax codes CAN be deleted (unlike allergens)
- Rationale: Tax rates are country-specific, not global standards
- Implementation: FK constraint check on `po_lines` table

**Decision:** Rate change warning
- Rationale: Changing rate affects historical PO data
- Recommendation: Create new tax code instead
- Implementation: Query `po_lines` count before update, show warning modal

---

### 12.3 Module Activation (Story 1.11)

**Decision:** Default modules enabled
- Technical, Planning, Production, Warehouse: ON
- Quality, Shipping, NPD, Finance: OFF
- Rationale: Core MES features enabled, advanced features opt-in

**Decision:** No hard dependencies (MVP)
- Example: Shipping → Warehouse (just warning, not enforced)
- Rationale: Complexity vs value trade-off
- Future: Add dependency validation in Phase 2

**Decision:** Data not deleted when module disabled
- Rationale: Allow re-enable without data loss
- Implementation: Hide UI, return 403 for API requests

---

## 13. References

- **Epic 1 Doc:** `docs/epics/01-settings.md`
- **Database Schema:** `docs/reference/database-schema.md`
- **Story 1.9:** `docs/batches/01C-master-data/stories/1.9-allergen-management.md`
- **Story 1.10:** `docs/batches/01C-master-data/stories/1.10-tax-code-configuration.md`
- **Story 1.11:** `docs/batches/01C-master-data/stories/1.11-module-activation.md`
- **RLS Best Practices:** `docs/RLS_AND_SUPABASE_CLIENTS.md`

---

**End of Technical Specification**

_Generated: 2025-11-27_
_Batch: 01C-master-data_
_Stories: 1.9 (done), 1.10 (ready-for-dev), 1.11 (ready-for-dev)_
