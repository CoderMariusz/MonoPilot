# Settings & Configuration - Scope Definition

**Date:** 2025-11-04  
**Purpose:** Phase 1.1.7 - Define final scope of Settings module

## Overview

Settings module encompasses all master configuration data used across the MonoPilot MES system.

**UI Location:** `/settings` page with 7 main tabs

---

## Settings Categories

### 1. Locations
**Purpose:** Physical locations within warehouses for inventory management

**Table:** `locations`
**API:** `LocationsAPI` (`apps/frontend/lib/api/locations.ts`)

**Schema:**
```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  zone VARCHAR(50),
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- CRUD operations
- Soft delete (is_active flag)
- Warehouse hierarchy
- Zone-based organization

---

### 2. Machines
**Purpose:** Production machines and equipment configuration

**Table:** `machines`
**API:** `MachinesAPI` (`apps/frontend/lib/api/machines.ts`)

**Schema:**
```sql
CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50),
  location_id INTEGER REFERENCES locations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- CRUD operations
- Soft delete (is_active flag)
- Location assignment
- Machine type classification

**Related Tables:**
- `product_line_settings` - Machine-specific product settings
- `wo_operations` - Work order operations tracking per machine

---

### 3. Allergens
**Purpose:** Allergen tracking and labeling compliance

**Table:** `allergens`
**API:** `AllergensAPI` (`apps/frontend/lib/api/allergens.ts`)

**Schema:**
```sql
CREATE TABLE allergens (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- CRUD operations
- Code-based identification
- Product allergen associations (many-to-many)

**Related Tables:**
- `product_allergens` - Junction table linking products to allergens

---

### 4. Suppliers
**Purpose:** Supplier/vendor management for purchasing

**Table:** `suppliers`
**API:** `SuppliersAPI` (`apps/frontend/lib/api/suppliers.ts`)

**Schema:**
```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  vat_number VARCHAR(50),
  tax_number VARCHAR(50),
  country VARCHAR(3),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(100),
  incoterms VARCHAR(50),
  email VARCHAR(200),
  phone VARCHAR(50),
  address JSONB,
  default_tax_code_id INTEGER,
  lead_time_days INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- CRUD operations
- Soft delete (is_active flag)
- Currency and payment terms
- Tax code association
- Lead time tracking

**Related Tables:**
- `purchase_orders` / `po_header` - Purchase orders from suppliers

---

### 5. Warehouses
**Purpose:** Warehouse/facility configuration

**Table:** `warehouses`
**API:** `WarehousesAPI` (`apps/frontend/lib/api/warehouses.ts`)

**Schema:**
```sql
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- CRUD operations
- Soft delete (is_active flag)
- Code-based identification

**Related Tables:**
- `locations` - Physical locations within warehouses
- `po_header` - Purchase orders to warehouses
- `to_header` - Transfer orders between warehouses

---

### 6. Tax Codes
**Purpose:** Tax rate configuration for financial calculations

**Table:** `settings_tax_codes`
**API:** `TaxCodesAPI` (`apps/frontend/lib/api/taxCodes.ts`)

**Schema:**
```sql
CREATE TABLE settings_tax_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- CRUD operations
- Soft delete (is_active flag)
- Percentage-based rates (supports up to 99.9999%)

**Related Tables:**
- `suppliers` - Default tax code per supplier
- `po_line` - Tax codes on purchase order lines
- `products` - Product tax associations

---

### 7. Routings
**Purpose:** Production routing and operation sequences

**Table:** `routings` + `routing_operations`
**API:** `RoutingsAPI` (`apps/frontend/lib/api/routings.ts`)

**Schema:**
```sql
CREATE TABLE routings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  operation_name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routing_id, sequence_number)
);
```

**Features:**
- CRUD operations for routings
- Operation sequence management
- Multi-choice routing requirements (e.g., Smoke, Roast, Dice, Mix)
- Product association
- Audit trail (created_by, updated_by)

**Related Tables:**
- `boms` - BOMs can reference routings
- `wo_operations` - Work order operations track routing execution

---

## Settings Scope Summary

### ✅ Confirmed Settings Components

| Category | Table | API | UI Tab | Status |
|----------|-------|-----|--------|--------|
| Locations | `locations` | ✅ | ✅ | Complete |
| Machines | `machines` | ✅ | ✅ | Complete |
| Allergens | `allergens` | ✅ | ✅ | Complete |
| Suppliers | `suppliers` | ✅ | ✅ | Complete |
| Warehouses | `warehouses` | ✅ | ✅ | Complete |
| Tax Codes | `settings_tax_codes` | ✅ | ✅ | Complete |
| Routings | `routings`, `routing_operations` | ✅ | ✅ | Complete |

### Additional Settings (Future Consideration)

**Not currently in Settings UI but exist in system:**
- `users` - User management (in `/admin` page instead)
- `sessions` - Session management (in `/admin` page instead)
- General system settings - Currency, date formats, etc. (no dedicated table)

---

## UI Implementation

**Page:** `apps/frontend/app/settings/page.tsx`

**Tab Structure:**
```typescript
type TabType = 'locations' | 'machines' | 'allergens' | 'suppliers' | 
               'warehouses' | 'tax-codes' | 'routings';
```

**Components Per Tab:**
- `LocationsTable` - Location management
- `MachinesTable` - Machine management  
- `AllergensTable` - Allergen management
- `SuppliersTable` - Supplier management
- `WarehousesTable` - Warehouse management
- `TaxCodesTable` - Tax code management
- `RoutingsTable` - Routing management

---

## API Endpoints

All Settings APIs follow standard CRUD pattern:

```typescript
class SettingsAPI {
  static async getAll(): Promise<T[]>
  static async getById(id: number): Promise<T | null>
  static async create(data: CreateT): Promise<T>
  static async update(id: number, data: UpdateT): Promise<T>
  static async delete(id: number): Promise<void> // Soft delete via is_active
}
```

**Naming Convention:**
- `{Entity}API` - e.g., `SuppliersAPI`, `MachinesAPI`
- Located in `apps/frontend/lib/api/{entity}.ts`

---

## Data Relationships

### Key Relationships:
1. **Locations → Warehouses** (many-to-one)
2. **Machines → Locations** (many-to-one)
3. **Suppliers → Tax Codes** (many-to-one, optional)
4. **Products → Allergens** (many-to-many via `product_allergens`)
5. **Products → Routings** (one-to-one, optional)
6. **Routings → Routing Operations** (one-to-many)

---

## Settings Dictionary Feature

**TODO Reference:** Section 2.3.3 - Routing Operations Dictionary

**Current State:** Routing operations use multi-choice requirements (TEXT array)

**Proposed Enhancement (P0):**
- Add Settings → Routing Operations Dictionary
- List of standard operation names and aliases
- RoutingBuilder uses dictionary for suggestions
- User can manually add/correct

**Starter Set:** Smoke, Roast, Dice, Mix

**Implementation:**
- Could use TEXT array in routing_operations.requirements
- Or create dedicated `settings_routing_dictionary` table

---

## Configuration Storage

### Two Storage Patterns:

#### 1. Dedicated Tables (Current Approach)
**Used for:** locations, machines, allergens, suppliers, warehouses, tax_codes, routings

**Advantages:**
- Type-safe
- Easy to query and join
- Enforced FK relationships
- Schema validation

#### 2. Key-Value Store (Future)
**Table:** `settings` (generic JSONB)

```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Potential Uses:**
- System-wide defaults (currency, timezone)
- Feature flags
- Display preferences
- Email templates

**Not currently implemented** but schema exists in `schema.sql`

---

## Validation Rules

### Common Validations Across Settings:

1. **Code Uniqueness:** Warehouses, Machines, Allergens, Tax Codes
2. **Soft Delete:** All entities use `is_active` flag
3. **Timestamps:** All have `created_at`, `updated_at`
4. **Required Fields:** Name/description required for all
5. **Referential Integrity:** FK constraints enforced

### Specific Validations:

**Tax Codes:**
- Rate must be between 0 and 99.9999%
- Code format validation (uppercase, no spaces)

**Suppliers:**
- Email format validation
- Country code (ISO 3166-1 alpha-3)
- Currency code (ISO 4217)

**Routings:**
- Sequence numbers must be unique per routing
- Operation names required
- Cannot delete routing used by active BOM

---

## Access Control

**Settings Management Access:**
- **Admin:** Full CRUD on all settings
- **Technical:** Read-only on most, CRUD on allergens and routings
- **Planner:** Read-only
- **Warehouse:** Read-only on locations, warehouses
- **Operator:** No access

**RLS Policies:** Currently basic authenticated-user policies (see migration `002_rls_policies.sql`)

---

## Recommendations

### ✅ Phase 1 Complete
Settings scope is well-defined and implemented:
- 7 core settings categories
- All have API layer
- All have UI tabs
- Schema is stable

### 🔄 Phase 2 Enhancements
1. **Routing Operations Dictionary** (P0 per TODO)
   - Add dedicated settings UI
   - Implement auto-suggest in RoutingBuilder
2. **Generic Settings Table**
   - Implement for system-wide configs
   - Currency, date formats, defaults
3. **Enhanced RLS**
   - Role-based access per settings category
   - Multi-tenant support

---

## Conclusion

**Status:** ✅ **CONFIRMED**

Settings & Configuration scope is finalized and functional:

✅ 7 core categories implemented  
✅ All have dedicated tables  
✅ All have API layer  
✅ All have UI tabs  
✅ Schema stable and documented  

**No blocking issues for Phase 1 completion.**

---

**Last Updated:** 2025-11-04  
**Documented By:** Phase 1 Implementation Team

