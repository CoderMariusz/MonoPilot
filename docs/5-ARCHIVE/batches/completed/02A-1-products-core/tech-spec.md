# Technical Specification: Epic 2 Batch 2A - Products + Settings

**Created:** 2025-11-23
**Epic:** Epic 2 - Technical Core
**Batch:** 2A - Products + Settings
**Stories:** 2.1-2.5, 2.22 (6 stories)

---

## Overview

This technical specification defines the implementation details for the Products and Technical Settings modules, forming the foundation of the Technical Core (Epic 2). These components establish the master data catalog for products with comprehensive versioning, type management, allergen tracking, and configurable settings.

### Goals

1. **Product Master Data**: Create and manage products with immutable codes and versioned attributes
2. **Product Versioning**: Automatic version tracking (X.Y format) for all product changes
3. **Version History**: Complete audit trail with diff capabilities
4. **Allergen Management**: Track "Contains" and "May Contain" allergens per product
5. **Product Types**: Configurable product categorization (RM, WIP, FG, PKG, BP + custom)
6. **Technical Settings**: Centralized configuration for product fields and Technical module behavior

### Dependencies

- **Epic 1 (Settings)**: Completed
  - Organization settings (Story 1.1)
  - User management (Story 1.2)
  - Allergens master data (Story 1.9)
- **Architecture Patterns**: Multi-tenancy, audit trails, RLS policies

### Unlocks

- ✅ **Batch 2B**: BOM System (stories 2.6-2.14)
- ✅ **Batch 2C**: Routing System (stories 2.15-2.17)
- ✅ **Epic 3**: Planning Module (PO, TO, WO)

---

## Database Schema

### 1. Products Table

**Core master data table for all products (RM, WIP, FG, PKG, BP)**

```sql
CREATE TABLE products (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business fields
  code TEXT NOT NULL,                    -- Immutable product code (unique per org)
  name TEXT NOT NULL,
  type product_type NOT NULL,            -- Enum: RM, WIP, FG, PKG, BP, CUSTOM
  description TEXT,
  category TEXT,                         -- Optional grouping (Bakery, Dairy, etc)

  -- Units of Measure
  uom TEXT NOT NULL,                     -- kg, L, unit, etc

  -- Version tracking
  version NUMERIC(4,1) NOT NULL DEFAULT 1.0,  -- Format: X.Y (1.0, 1.1, ..., 1.9, 2.0)

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, obsolete

  -- Configurable fields (visibility controlled by technical_settings)
  shelf_life_days INTEGER,              -- Expiry duration
  min_stock_qty NUMERIC(10,2),          -- Safety stock
  max_stock_qty NUMERIC(10,2),          -- Maximum stock
  reorder_point NUMERIC(10,2),          -- Trigger for replenishment
  cost_per_unit NUMERIC(10,2),          -- Standard cost

  -- Multi-tenancy
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,                -- Soft delete

  -- Constraints
  UNIQUE (org_id, code),
  CHECK (version >= 1.0),
  CHECK (shelf_life_days IS NULL OR shelf_life_days > 0)
);

-- Indexes
CREATE INDEX idx_products_org_code ON products(org_id, code);
CREATE INDEX idx_products_org_type ON products(org_id, type);
CREATE INDEX idx_products_org_status ON products(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(org_id, category) WHERE category IS NOT NULL;

-- RLS Policy
CREATE POLICY "Tenant isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp trigger
CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 2. Product Types Enum

```sql
CREATE TYPE product_type AS ENUM (
  'RM',      -- Raw Material
  'WIP',     -- Work in Progress
  'FG',      -- Finished Good
  'PKG',     -- Packaging
  'BP',      -- By-Product
  'CUSTOM'   -- Custom types (extended by product_type_config)
);
```

### 3. Product Version History Table

**Tracks all changes to products with field-level granularity**

```sql
CREATE TABLE product_version_history (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Version info
  version NUMERIC(4,1) NOT NULL,         -- Version after this change

  -- Change tracking
  changed_fields JSONB NOT NULL,         -- { field: { old: X, new: Y }, ... }
  change_summary TEXT,                   -- Optional human-readable summary

  -- Audit
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  org_id UUID NOT NULL REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX idx_product_version_history_product ON product_version_history(product_id, changed_at DESC);
CREATE INDEX idx_product_version_history_org ON product_version_history(org_id, changed_at DESC);

-- RLS Policy
CREATE POLICY "Tenant isolation" ON product_version_history
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Example changed_fields JSONB:
-- {
--   "name": { "old": "Wheat Flour", "new": "Organic Wheat Flour" },
--   "shelf_life_days": { "old": 180, "new": 365 }
-- }
```

### 4. Product Allergens Table

**Many-to-many relationship between products and allergens with relation type**

```sql
CREATE TABLE product_allergens (
  -- Composite primary key
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,

  -- Relation type
  relation_type TEXT NOT NULL,           -- 'contains' or 'may_contain'

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),

  org_id UUID NOT NULL REFERENCES organizations(id),

  PRIMARY KEY (product_id, allergen_id, relation_type),
  CHECK (relation_type IN ('contains', 'may_contain'))
);

-- Indexes
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

-- RLS Policy
CREATE POLICY "Tenant isolation" ON product_allergens
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### 5. Product Type Configuration Table

**Allows organizations to define custom product types beyond default enums**

```sql
CREATE TABLE product_type_config (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type definition
  code TEXT NOT NULL,                    -- Short code (e.g., 'SFG' for Semi-Finished Good)
  name TEXT NOT NULL,                    -- Display name
  is_default BOOLEAN NOT NULL DEFAULT false,  -- True for RM, WIP, FG, PKG, BP
  is_active BOOLEAN NOT NULL DEFAULT true,    -- Can deactivate custom types

  -- Multi-tenancy
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX idx_product_type_config_org ON product_type_config(org_id) WHERE is_active = true;

-- RLS Policy
CREATE POLICY "Tenant isolation" ON product_type_config
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Seed default types
INSERT INTO product_type_config (code, name, is_default, org_id) VALUES
  ('RM', 'Raw Material', true, '<org_id>'),
  ('WIP', 'Work in Progress', true, '<org_id>'),
  ('FG', 'Finished Good', true, '<org_id>'),
  ('PKG', 'Packaging', true, '<org_id>'),
  ('BP', 'By-Product', true, '<org_id>');
```

### 6. Technical Settings Table

**Central configuration for Technical module behavior**

```sql
CREATE TABLE technical_settings (
  -- Primary key (one record per org)
  org_id UUID PRIMARY KEY REFERENCES organizations(id),

  -- Product field configuration
  product_field_config JSONB NOT NULL DEFAULT '{
    "shelf_life_days": {"visible": true, "mandatory": false},
    "min_stock_qty": {"visible": true, "mandatory": false},
    "max_stock_qty": {"visible": true, "mandatory": false},
    "reorder_point": {"visible": true, "mandatory": false},
    "cost_per_unit": {"visible": true, "mandatory": false},
    "category": {"visible": true, "mandatory": false}
  }',

  -- BOM settings
  max_bom_versions INTEGER,              -- NULL = unlimited
  use_conditional_flags BOOLEAN DEFAULT false,  -- Enable conditional BOM items
  conditional_flags JSONB DEFAULT '["organic", "gluten_free", "vegan", "kosher", "halal", "dairy_free", "nut_free", "soy_free"]',

  -- Audit
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Auto-update timestamp trigger
CREATE TRIGGER update_technical_settings_timestamp
  BEFORE UPDATE ON technical_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policy
CREATE POLICY "Tenant isolation" ON technical_settings
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Versioning Logic

### Product Version Format: X.Y

**Rules:**
- **Initial version**: 1.0 (on product creation)
- **Minor changes**: Increment Y by 0.1 (e.g., 1.0 → 1.1 → 1.2)
- **Major rollover**: When Y reaches 9, next version is X+1.0 (e.g., 1.9 → 2.0)

**Examples:**
```
1.0 (initial) → 1.1 → 1.2 → ... → 1.9 → 2.0 → 2.1 → ... → 9.9 → 10.0
```

### Version Increment Function

```sql
CREATE OR REPLACE FUNCTION increment_product_version(current_version NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  major_ver INTEGER;
  minor_ver INTEGER;
BEGIN
  -- Extract major and minor parts
  major_ver := floor(current_version);
  minor_ver := round((current_version - major_ver) * 10);

  -- Increment
  IF minor_ver >= 9 THEN
    -- Rollover to next major version
    RETURN (major_ver + 1.0);
  ELSE
    -- Increment minor version
    RETURN (major_ver + (minor_ver + 1) * 0.1);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage:
-- SELECT increment_product_version(1.0);  -- Returns 1.1
-- SELECT increment_product_version(1.9);  -- Returns 2.0
-- SELECT increment_product_version(2.5);  -- Returns 2.6
```

### Trigger: Automatic Versioning on Product Update

```sql
CREATE OR REPLACE FUNCTION track_product_version()
RETURNS TRIGGER AS $$
DECLARE
  changed JSONB := '{}';
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Skip if deleted_at is set (soft delete operation)
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Track changed fields (excluding audit columns)
  FOREACH field IN ARRAY ARRAY['code', 'name', 'type', 'description', 'category', 'uom',
                                 'shelf_life_days', 'min_stock_qty', 'max_stock_qty',
                                 'reorder_point', 'cost_per_unit', 'status']
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field, field)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      changed := changed || jsonb_build_object(field, jsonb_build_object('old', old_val, 'new', new_val));
    END IF;
  END LOOP;

  -- If any fields changed, increment version and log
  IF changed <> '{}' THEN
    -- Increment version
    NEW.version := increment_product_version(OLD.version);

    -- Insert version history
    INSERT INTO product_version_history (
      product_id, version, changed_fields, changed_by, org_id
    ) VALUES (
      NEW.id, NEW.version, changed, NEW.updated_by, NEW.org_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_product_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION track_product_version();
```

---

## API Endpoints

### Base URL
```
/api/technical/products
```

### 1. Product CRUD

#### GET /api/technical/products
**List all products with filtering and pagination**

**Query Parameters:**
```typescript
{
  search?: string;           // Search by code or name
  type?: string[];           // Filter by product type(s)
  status?: string[];         // Filter by status
  category?: string;         // Filter by category
  page?: number;             // Default: 1
  limit?: number;            // Default: 50
  sort?: string;             // Default: 'code'
  order?: 'asc' | 'desc';    // Default: 'asc'
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    category?: string;
    uom: string;
    version: number;
    status: string;
    shelf_life_days?: number;
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

#### POST /api/technical/products
**Create new product**

**Request Body:**
```typescript
{
  code: string;              // Required, immutable after creation
  name: string;              // Required
  type: string;              // Required (RM, WIP, FG, PKG, BP)
  description?: string;
  category?: string;
  uom: string;               // Required
  shelf_life_days?: number;
  min_stock_qty?: number;
  max_stock_qty?: number;
  reorder_point?: number;
  cost_per_unit?: number;
  status?: string;           // Default: 'active'
}
```

**Response:**
```typescript
{
  id: string;
  code: string;
  name: string;
  type: string;
  version: 1.0;              // Always starts at 1.0
  // ... all other fields
  created_at: string;
}
```

**Validations:**
- Code must be unique per organization
- Code format: alphanumeric + hyphens/underscores, 2-50 chars
- Name required, 1-200 chars
- Type must be valid product_type enum
- UoM required

#### GET /api/technical/products/:id
**Get single product details**

**Response:**
```typescript
{
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
  category?: string;
  uom: string;
  version: number;
  status: string;
  shelf_life_days?: number;
  min_stock_qty?: number;
  max_stock_qty?: number;
  reorder_point?: number;
  cost_per_unit?: number;
  allergens: {
    contains: Array<{ id: string; name: string; code: string }>;
    may_contain: Array<{ id: string; name: string; code: string }>;
  };
  created_at: string;
  updated_at: string;
  created_by: { id: string; name: string };
  updated_by: { id: string; name: string };
}
```

#### PUT /api/technical/products/:id
**Update product (auto-increments version)**

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  category?: string;
  uom?: string;
  shelf_life_days?: number;
  min_stock_qty?: number;
  max_stock_qty?: number;
  reorder_point?: number;
  cost_per_unit?: number;
  status?: string;
  // NOTE: code and type are NOT updatable
}
```

**Response:**
```typescript
{
  id: string;
  version: number;           // Auto-incremented
  // ... all updated fields
  updated_at: string;
}
```

**Side Effects:**
- Version incremented automatically (via trigger)
- Version history record created
- updated_at and updated_by set

#### DELETE /api/technical/products/:id
**Soft delete product**

**Response:**
```typescript
{
  success: true;
  message: "Product soft deleted";
}
```

**Business Rules:**
- Sets deleted_at timestamp
- Product remains in database for referential integrity
- Cannot delete if product is referenced in active BOMs or WOs

---

### 2. Product Version History

#### GET /api/technical/products/:id/history
**Get version history for a product**

**Query Parameters:**
```typescript
{
  page?: number;             // Default: 1
  limit?: number;            // Default: 20
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    version: number;
    changed_fields: Record<string, { old: any; new: any }>;
    change_summary?: string;
    changed_by: { id: string; name: string };
    changed_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

#### GET /api/technical/products/:id/history/compare
**Compare two versions**

**Query Parameters:**
```typescript
{
  v1: number;                // Version 1 (e.g., 1.0)
  v2: number;                // Version 2 (e.g., 1.5)
}
```

**Response:**
```typescript
{
  v1: number;
  v2: number;
  differences: Array<{
    field: string;
    v1_value: any;
    v2_value: any;
    status: 'added' | 'removed' | 'changed';
  }>;
}
```

---

### 3. Product Allergens

#### GET /api/technical/products/:id/allergens
**Get allergens for a product**

**Response:**
```typescript
{
  contains: Array<{
    id: string;
    code: string;
    name: string;
    icon?: string;
  }>;
  may_contain: Array<{
    id: string;
    code: string;
    name: string;
    icon?: string;
  }>;
}
```

#### PUT /api/technical/products/:id/allergens
**Update product allergens**

**Request Body:**
```typescript
{
  contains: string[];        // Array of allergen IDs
  may_contain: string[];     // Array of allergen IDs
}
```

**Response:**
```typescript
{
  success: true;
  allergens: {
    contains: Array<{id: string; name: string}>;
    may_contain: Array<{id: string; name: string}>;
  }
}
```

**Side Effects:**
- Existing allergen assignments replaced (not merged)
- Product version NOT incremented for allergen changes
- Audit trail created

---

### 4. Product Types

#### GET /api/technical/product-types
**Get all product types (default + custom)**

**Response:**
```typescript
{
  data: Array<{
    id: string;
    code: string;
    name: string;
    is_default: boolean;
    is_active: boolean;
  }>;
}
```

#### POST /api/technical/product-types
**Create custom product type**

**Request Body:**
```typescript
{
  code: string;              // Required, unique, 2-10 chars
  name: string;              // Required, 1-100 chars
}
```

**Response:**
```typescript
{
  id: string;
  code: string;
  name: string;
  is_default: false;
  is_active: true;
  created_at: string;
}
```

**Validations:**
- Code must not conflict with default types (RM, WIP, FG, PKG, BP)
- Code uppercase alphanumeric only

#### PUT /api/technical/product-types/:id
**Update or deactivate custom product type**

**Request Body:**
```typescript
{
  name?: string;
  is_active?: boolean;       // Can deactivate, not delete
}
```

**Response:**
```typescript
{
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}
```

**Business Rules:**
- Cannot edit default types (RM, WIP, FG, PKG, BP)
- Cannot delete types referenced by products
- Deactivation hides from UI but preserves data

---

### 5. Technical Settings

#### GET /api/technical/settings
**Get technical module settings**

**Response:**
```typescript
{
  product_field_config: Record<string, {
    visible: boolean;
    mandatory: boolean;
  }>;
  max_bom_versions?: number;
  use_conditional_flags: boolean;
  conditional_flags: string[];
  updated_at: string;
  updated_by: { id: string; name: string };
}
```

#### PUT /api/technical/settings
**Update technical settings**

**Request Body:**
```typescript
{
  product_field_config?: Record<string, {
    visible: boolean;
    mandatory: boolean;
  }>;
  max_bom_versions?: number;
  use_conditional_flags?: boolean;
  conditional_flags?: string[];
}
```

**Response:**
```typescript
{
  success: true;
  settings: {
    // ... updated settings
  };
}
```

**Validations:**
- Admin role required
- conditional_flags must be array of strings
- max_bom_versions must be > 0 or null

---

## Frontend Components

### Component Structure

```
apps/frontend/app/technical/
├── products/
│   ├── page.tsx                       # Product list view (Story 2.1)
│   ├── [id]/
│   │   ├── page.tsx                   # Product detail view (Story 2.1)
│   │   └── history/
│   │       └── page.tsx               # Version history view (Story 2.3)
│   └── components/
│       ├── ProductTable.tsx           # Data table (Story 2.1)
│       ├── ProductCreateModal.tsx     # Create dialog (Story 2.1)
│       ├── ProductEditDrawer.tsx      # Edit drawer (Story 2.2)
│       ├── ProductHistoryModal.tsx    # History timeline (Story 2.3)
│       ├── ProductAllergenSection.tsx # Allergen assignment (Story 2.4)
│       └── VersionCompareDialog.tsx   # Compare versions (Story 2.3)
│
├── settings/
│   └── page.tsx                       # Technical settings (Story 2.22)
│       └── components/
│           ├── ProductFieldConfig.tsx # Field visibility toggles
│           └── ConditionalFlagsConfig.tsx
│
└── product-types/
    └── page.tsx                       # Product type management (Story 2.5)
        └── components/
            └── ProductTypeTable.tsx
```

### Key UI Components

#### 1. ProductTable (Story 2.1)
- Server-side pagination
- Multi-column sorting
- Search (code, name)
- Filters (type, status, category)
- Bulk actions (future: export, delete)

#### 2. ProductCreateModal (Story 2.1)
- Form with all product fields
- Field visibility based on technical_settings
- Code validation (unique, format)
- UoM dropdown
- Type selection
- Auto-set version to 1.0

#### 3. ProductEditDrawer (Story 2.2)
- Right-side drawer (shadcn Sheet)
- Same fields as Create except code (immutable)
- Auto-save with version increment
- Show current version
- "Save" triggers PUT /api/technical/products/:id

#### 4. ProductHistoryModal (Story 2.3)
- Timeline view (vertical)
- Each entry shows:
  - Version number
  - Changed fields (old → new)
  - User, timestamp
- "Compare" button (opens VersionCompareDialog)
- Pagination (20 per page)

#### 5. ProductAllergenSection (Story 2.4)
- Two multi-select dropdowns:
  - "Contains" allergens
  - "May Contain" allergens
- Allergens from GET /api/settings/allergens
- Visual: badges/tags for selected allergens
- Update via PUT /api/technical/products/:id/allergens

#### 6. VersionCompareDialog (Story 2.3)
- Two version selectors (dropdown)
- Diff view with color coding:
  - Green: added
  - Red: removed
  - Yellow: changed (old → new)
- Side-by-side comparison

---

## Business Logic & Validation

### Product Creation Rules

1. **Code Validation:**
   - Required, 2-50 characters
   - Alphanumeric + hyphens/underscores only
   - Unique per organization
   - Immutable after creation

2. **Version Initialization:**
   - Always starts at 1.0
   - No manual override

3. **Mandatory Fields:**
   - code, name, type, uom

4. **Optional Fields:**
   - Visibility controlled by technical_settings.product_field_config
   - If mandatory flag set, enforce in Create form

### Product Update Rules

1. **Immutable Fields:**
   - code (cannot be changed after creation)
   - created_at, created_by
   - org_id

2. **Auto-Versioning:**
   - Any change to business fields triggers version increment
   - Trigger handles version logic automatically
   - Frontend displays "New version will be X.Y"

3. **Version History:**
   - Captured automatically via database trigger
   - Records only changed fields (not entire snapshot)
   - Includes user who made change

### Allergen Assignment Rules

1. **Allergen Source:**
   - Must come from org's allergen master data (Epic 1)
   - 14 EU allergens + custom allergens

2. **Relation Types:**
   - "Contains": Product definitively contains allergen
   - "May Contain": Cross-contamination risk

3. **Version Impact:**
   - Allergen changes do NOT increment product version
   - Separate audit trail in product_allergens table

### Product Type Rules

1. **Default Types:**
   - RM, WIP, FG, PKG, BP are system defaults
   - Cannot be edited or deleted
   - Always visible

2. **Custom Types:**
   - Admin can add custom types
   - Code must be unique (case-insensitive)
   - Can be deactivated (not deleted)
   - Deactivated types hidden from UI but preserved for existing products

---

## Testing Strategy

### Unit Tests

**Product Versioning Logic:**
```typescript
// Test: increment_product_version function
test('should increment minor version', () => {
  expect(incrementVersion(1.0)).toBe(1.1);
  expect(incrementVersion(1.5)).toBe(1.6);
});

test('should rollover at 1.9', () => {
  expect(incrementVersion(1.9)).toBe(2.0);
  expect(incrementVersion(5.9)).toBe(6.0);
});
```

**API Validation:**
```typescript
// Test: POST /api/technical/products
test('should reject duplicate product code', async () => {
  // Create product with code "FLOUR-001"
  // Attempt to create another with same code
  // Expect 400 error
});

test('should reject invalid code format', async () => {
  // Create product with code "FL@UR!"
  // Expect 400 error
});
```

### Integration Tests

**Product CRUD Flow:**
```typescript
test('should create, update, and version product', async () => {
  // 1. Create product (version 1.0)
  const product = await createProduct({ code: 'TEST-001', name: 'Test' });
  expect(product.version).toBe(1.0);

  // 2. Update name (version → 1.1)
  const updated = await updateProduct(product.id, { name: 'Test Updated' });
  expect(updated.version).toBe(1.1);

  // 3. Check history
  const history = await getProductHistory(product.id);
  expect(history.length).toBe(1);
  expect(history[0].changed_fields.name).toEqual({ old: 'Test', new: 'Test Updated' });
});
```

**Allergen Assignment:**
```typescript
test('should assign allergens to product', async () => {
  const product = await createProduct({ code: 'BREAD-001', name: 'Bread' });

  // Get allergen IDs
  const allergens = await getAllergens();
  const wheat = allergens.find(a => a.code === 'wheat');
  const milk = allergens.find(a => a.code === 'milk');

  // Assign allergens
  await updateProductAllergens(product.id, {
    contains: [wheat.id],
    may_contain: [milk.id]
  });

  // Verify
  const productWithAllergens = await getProduct(product.id);
  expect(productWithAllergens.allergens.contains).toHaveLength(1);
  expect(productWithAllergens.allergens.may_contain).toHaveLength(1);
});
```

### E2E Tests (Playwright)

**User Journey: Create and Edit Product**
```typescript
test('Admin creates and edits product', async ({ page }) => {
  // Navigate to products
  await page.goto('/technical/products');

  // Click "Add Product"
  await page.click('button:has-text("Add Product")');

  // Fill form
  await page.fill('input[name="code"]', 'FLOUR-001');
  await page.fill('input[name="name"]', 'Wheat Flour');
  await page.selectOption('select[name="type"]', 'RM');
  await page.fill('input[name="uom"]', 'kg');

  // Save
  await page.click('button:has-text("Save")');

  // Verify in table
  await expect(page.locator('table')).toContainText('FLOUR-001');
  await expect(page.locator('table')).toContainText('1.0'); // Version

  // Edit product
  await page.click('tr:has-text("FLOUR-001") button[aria-label="Edit"]');
  await page.fill('input[name="name"]', 'Organic Wheat Flour');
  await page.click('button:has-text("Save")');

  // Verify version incremented
  await expect(page.locator('table')).toContainText('1.1');
});
```

---

## Migration Scripts

### Migration 014: Create Products Tables

```sql
-- Migration: 014_create_products_tables.sql

-- Product types enum
CREATE TYPE product_type AS ENUM ('RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM');

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type product_type NOT NULL,
  description TEXT,
  category TEXT,
  uom TEXT NOT NULL,
  version NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active',
  shelf_life_days INTEGER,
  min_stock_qty NUMERIC(10,2),
  max_stock_qty NUMERIC(10,2),
  reorder_point NUMERIC(10,2),
  cost_per_unit NUMERIC(10,2),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  UNIQUE (org_id, code),
  CHECK (version >= 1.0)
);

-- Product version history
CREATE TABLE product_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version NUMERIC(4,1) NOT NULL,
  changed_fields JSONB NOT NULL,
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID NOT NULL REFERENCES organizations(id)
);

-- Product allergens
CREATE TABLE product_allergens (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  PRIMARY KEY (product_id, allergen_id, relation_type),
  CHECK (relation_type IN ('contains', 'may_contain'))
);

-- Product type configuration
CREATE TABLE product_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (org_id, code)
);

-- Technical settings
CREATE TABLE technical_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  product_field_config JSONB NOT NULL DEFAULT '{
    "shelf_life_days": {"visible": true, "mandatory": false},
    "min_stock_qty": {"visible": true, "mandatory": false},
    "max_stock_qty": {"visible": true, "mandatory": false},
    "reorder_point": {"visible": true, "mandatory": false},
    "cost_per_unit": {"visible": true, "mandatory": false},
    "category": {"visible": true, "mandatory": false}
  }',
  max_bom_versions INTEGER,
  use_conditional_flags BOOLEAN DEFAULT false,
  conditional_flags JSONB DEFAULT '["organic", "gluten_free", "vegan", "kosher", "halal", "dairy_free", "nut_free", "soy_free"]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_products_org_code ON products(org_id, code);
CREATE INDEX idx_products_org_type ON products(org_id, type);
CREATE INDEX idx_products_org_status ON products(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(org_id, category) WHERE category IS NOT NULL;
CREATE INDEX idx_product_version_history_product ON product_version_history(product_id, changed_at DESC);
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_type_config_org ON product_type_config(org_id) WHERE is_active = true;

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_type_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON products FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
CREATE POLICY "Tenant isolation" ON product_version_history FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
CREATE POLICY "Tenant isolation" ON product_allergens FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
CREATE POLICY "Tenant isolation" ON product_type_config FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
CREATE POLICY "Tenant isolation" ON technical_settings FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Triggers
CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_type_config_timestamp
  BEFORE UPDATE ON product_type_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_technical_settings_timestamp
  BEFORE UPDATE ON technical_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Version tracking trigger
CREATE TRIGGER trigger_track_product_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION track_product_version();
```

---

## Security & Permissions

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all products, types, settings |
| **Technical** | Create/edit products, view history, assign allergens |
| **Planner** | Read-only access to products |
| **Production** | Read-only access to products |
| **Warehouse** | Read-only access to products |
| **Viewer** | Read-only access to products |

### RLS Enforcement

- All queries automatically filtered by `org_id`
- User's `org_id` extracted from JWT token
- No cross-tenant data leakage possible

### Audit Logging

- All product changes logged in `product_version_history`
- User who made change tracked in `changed_by`
- Timestamp in `changed_at`
- Changed fields stored as JSONB for queryability

---

## Performance Considerations

### Indexing Strategy

**High-Priority Indexes:**
- `products(org_id, code)` - Product lookup by code
- `products(org_id, type)` - Filter by type
- `products(org_id, status)` - Active products
- `product_version_history(product_id, changed_at DESC)` - History queries

### Caching (Redis)

**Cache product lookups:**
```typescript
// Cache key: product:<org_id>:<code>
// TTL: 1 hour
// Invalidate on product update
```

**Cache product list by type:**
```typescript
// Cache key: products:<org_id>:type:<type>
// TTL: 30 minutes
// Invalidate on any product create/update/delete
```

### Query Optimization

- Always include `org_id` in WHERE clause
- Use pagination (LIMIT/OFFSET) for large datasets
- Avoid SELECT * in production code
- Use covering indexes for common queries

---

## Seed Data

### Default Product Types

```sql
-- Seed default product types for new organizations
INSERT INTO product_type_config (code, name, is_default, org_id, created_by) VALUES
  ('RM', 'Raw Material', true, :org_id, :user_id),
  ('WIP', 'Work in Progress', true, :org_id, :user_id),
  ('FG', 'Finished Good', true, :org_id, :user_id),
  ('PKG', 'Packaging', true, :org_id, :user_id),
  ('BP', 'By-Product', true, :org_id, :user_id);
```

### Technical Settings Defaults

```sql
-- Seed technical settings for new organizations
INSERT INTO technical_settings (org_id, updated_by) VALUES
  (:org_id, :user_id);
-- Uses default JSONB values from table definition
```

### Sample Products (for demo)

```sql
-- Sample products for testing
INSERT INTO products (code, name, type, uom, org_id, created_by) VALUES
  ('FLOUR-001', 'Wheat Flour', 'RM', 'kg', :org_id, :user_id),
  ('SUGAR-001', 'White Sugar', 'RM', 'kg', :org_id, :user_id),
  ('BREAD-001', 'White Bread 500g', 'FG', 'unit', :org_id, :user_id),
  ('BOX-001', 'Cardboard Box 30x30x30', 'PKG', 'unit', :org_id, :user_id);
```

---

## Error Handling

### Common Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| `PRODUCT_CODE_EXISTS` | "Product code already exists" | 400 |
| `PRODUCT_NOT_FOUND` | "Product not found" | 404 |
| `PRODUCT_CODE_IMMUTABLE` | "Product code cannot be changed" | 400 |
| `INVALID_PRODUCT_TYPE` | "Invalid product type" | 400 |
| `PRODUCT_IN_USE` | "Cannot delete product referenced in BOMs/WOs" | 409 |
| `VERSION_NOT_FOUND` | "Product version not found" | 404 |
| `ALLERGEN_NOT_FOUND` | "Allergen not found" | 404 |

### Example Error Response

```json
{
  "error": {
    "code": "PRODUCT_CODE_EXISTS",
    "message": "Product code 'FLOUR-001' already exists in your organization",
    "details": {
      "field": "code",
      "value": "FLOUR-001"
    }
  }
}
```

---

## Future Enhancements (Not in Batch 2A)

1. **Bulk Import**: CSV/Excel upload for products
2. **Product Images**: File upload and storage
3. **Product Templates**: Clone from template
4. **Advanced Search**: Full-text search, filters by custom fields
5. **Product Labels**: Generate barcode/QR labels
6. **Product Approval Workflow**: Draft → Review → Approved
7. **Custom Product Fields**: Extensible JSONB attributes
8. **Product Lifecycle**: Active → Obsolete → Archived
9. **Multi-UoM**: Support conversion (kg ↔ lb)
10. **Product Variants**: Size, color, packaging variants

---

## Dependencies on Other Batches

### Batch 2A Prerequisites

✅ **Epic 1 Complete:**
- Organizations table
- Users and roles
- Allergens master data (Story 1.9)
- RLS policies and functions

### Batch 2A Enables

🎯 **Batch 2B (BOM System):**
- BOMs reference products table
- BOM allergen inheritance uses product allergens
- BOM items reference products

🎯 **Batch 2C (Routing System):**
- Routing-product assignments reference products

🎯 **Epic 3 (Planning Module):**
- PO lines reference products
- TO lines reference products
- WO header references products

---

## Summary

This technical specification provides:

✅ **Complete database schema** for products, versioning, allergens, types, and settings
✅ **Versioning logic** with X.Y format and automatic increment
✅ **API endpoints** for all CRUD operations
✅ **Business rules** and validation logic
✅ **Frontend component structure** with shadcn/ui
✅ **Testing strategy** (unit, integration, E2E)
✅ **Migration scripts** with RLS and triggers
✅ **Security and permissions** with RBAC
✅ **Performance optimizations** (indexing, caching)
✅ **Seed data** for defaults and demo

**Ready for implementation!**

---

**Total Estimated Effort:** ~50-60k tokens across 2 sessions
- Session 1: Create tech spec + story files (15-20k tokens) ✅
- Session 2: Implement all 6 stories (30-40k tokens)
