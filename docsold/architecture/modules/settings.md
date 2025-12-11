# Settings Module Architecture

## Overview

Foundation module that provides organization configuration, feature toggles, and system-wide settings. All other modules depend on Settings.

## Dependencies

- None (foundation module)

## Consumed By

- All modules

## Database Schema

### Core Tables

```sql
-- Organization
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization Settings (flat structure)
CREATE TABLE org_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),

  -- General
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  language TEXT DEFAULT 'en', -- 'en', 'pl'

  -- Industry Feature Toggles
  enable_allergens BOOLEAN DEFAULT true,
  enable_hazmat BOOLEAN DEFAULT false,
  enable_lot_tracking BOOLEAN DEFAULT true,
  enable_serial_tracking BOOLEAN DEFAULT false,
  enable_coa_requirement BOOLEAN DEFAULT false,

  -- Module Toggles
  enable_quality_module BOOLEAN DEFAULT true,
  enable_shipping_module BOOLEAN DEFAULT true,
  enable_npd_module BOOLEAN DEFAULT false,
  enable_finance_module BOOLEAN DEFAULT false,

  -- Offline Mode
  enable_offline_scanner BOOLEAN DEFAULT false,
  offline_sync_interval INTEGER DEFAULT 5, -- minutes

  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Warehouses
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  default_receiving_location_id UUID,
  transit_location_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id, code)
);

-- Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL, -- 'storage', 'receiving', 'shipping', 'production', 'qa', 'transit'
  zone TEXT,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  bin TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (org_id, warehouse_id, code)
);

-- Machines
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  machine_type TEXT,
  production_line_id UUID,
  location_id UUID REFERENCES locations(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE (org_id, code)
);

-- Production Lines
CREATE TABLE production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE (org_id, code)
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  default_currency TEXT DEFAULT 'PLN',
  default_tax_code_id UUID,
  lead_time_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (org_id, code)
);

-- Tax Codes
CREATE TABLE tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (org_id, code)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  custom_role_id UUID,
  language TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom Roles
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  UNIQUE (org_id, name)
);

-- Sequence Numbers
CREATE TABLE org_sequences (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  po_seq INTEGER DEFAULT 0,
  to_seq INTEGER DEFAULT 0,
  wo_seq INTEGER DEFAULT 0,
  lp_seq INTEGER DEFAULT 0,
  asn_seq INTEGER DEFAULT 0,
  grn_seq INTEGER DEFAULT 0
);
```

### Indexes

```sql
CREATE INDEX idx_warehouses_org ON warehouses(org_id);
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_type ON locations(org_id, location_type);
CREATE INDEX idx_machines_line ON machines(production_line_id);
CREATE INDEX idx_suppliers_org ON suppliers(org_id);
CREATE INDEX idx_users_org ON users(org_id);
```

## API Layer

### Settings API Class
```typescript
// lib/api/SettingsAPI.ts
export class SettingsAPI {
  // Organization
  static async getOrganization(): Promise<Organization>
  static async updateOrganization(data: UpdateOrgInput): Promise<Organization>

  // Settings
  static async getSettings(): Promise<OrgSettings>
  static async updateSettings(data: UpdateSettingsInput): Promise<OrgSettings>

  // Warehouses
  static async getWarehouses(): Promise<Warehouse[]>
  static async getWarehouse(id: string): Promise<Warehouse>
  static async createWarehouse(data: CreateWarehouseInput): Promise<Warehouse>
  static async updateWarehouse(id: string, data: UpdateWarehouseInput): Promise<Warehouse>

  // Locations
  static async getLocations(warehouseId?: string): Promise<Location[]>
  static async createLocation(data: CreateLocationInput): Promise<Location>
  static async updateLocation(id: string, data: UpdateLocationInput): Promise<Location>

  // Machines
  static async getMachines(): Promise<Machine[]>
  static async createMachine(data: CreateMachineInput): Promise<Machine>
  static async updateMachine(id: string, data: UpdateMachineInput): Promise<Machine>

  // Production Lines
  static async getProductionLines(): Promise<ProductionLine[]>
  static async createProductionLine(data: CreateLineInput): Promise<ProductionLine>

  // Suppliers
  static async getSuppliers(): Promise<Supplier[]>
  static async createSupplier(data: CreateSupplierInput): Promise<Supplier>
  static async updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier>

  // Tax Codes
  static async getTaxCodes(): Promise<TaxCode[]>
  static async createTaxCode(data: CreateTaxCodeInput): Promise<TaxCode>

  // Users
  static async getUsers(): Promise<User[]>
  static async createUser(data: CreateUserInput): Promise<User>
  static async updateUser(id: string, data: UpdateUserInput): Promise<User>
  static async updateUserRole(id: string, role: string): Promise<User>

  // Custom Roles
  static async getCustomRoles(): Promise<CustomRole[]>
  static async createCustomRole(data: CreateRoleInput): Promise<CustomRole>
  static async updateCustomRole(id: string, data: UpdateRoleInput): Promise<CustomRole>
}
```

### API Routes

```
GET    /api/settings                    # Get all settings
PATCH  /api/settings                    # Update settings

GET    /api/warehouses                  # List warehouses
POST   /api/warehouses                  # Create warehouse
GET    /api/warehouses/:id              # Get warehouse
PATCH  /api/warehouses/:id              # Update warehouse

GET    /api/locations                   # List locations
POST   /api/locations                   # Create location
PATCH  /api/locations/:id               # Update location

GET    /api/machines                    # List machines
POST   /api/machines                    # Create machine
PATCH  /api/machines/:id                # Update machine

GET    /api/production-lines            # List production lines
POST   /api/production-lines            # Create production line

GET    /api/suppliers                   # List suppliers
POST   /api/suppliers                   # Create supplier
PATCH  /api/suppliers/:id               # Update supplier

GET    /api/tax-codes                   # List tax codes
POST   /api/tax-codes                   # Create tax code

GET    /api/users                       # List users
POST   /api/users                       # Create user
PATCH  /api/users/:id                   # Update user

GET    /api/roles                       # List custom roles
POST   /api/roles                       # Create custom role
PATCH  /api/roles/:id                   # Update custom role
```

## Frontend Components

### Pages

```
app/(dashboard)/settings/
├── page.tsx              # Settings overview/dashboard
├── organization/
│   └── page.tsx         # Organization settings
├── warehouses/
│   ├── page.tsx         # Warehouse list
│   └── [id]/page.tsx    # Warehouse detail with locations
├── machines/
│   └── page.tsx         # Machines list
├── production-lines/
│   └── page.tsx         # Production lines list
├── suppliers/
│   ├── page.tsx         # Suppliers list
│   └── [id]/page.tsx    # Supplier detail
├── tax-codes/
│   └── page.tsx         # Tax codes list
├── users/
│   ├── page.tsx         # Users list
│   └── [id]/page.tsx    # User detail
└── roles/
    └── page.tsx         # Custom roles management
```

### Key Components

```typescript
// Settings components
components/settings/
├── SettingsForm.tsx           # Main settings form
├── FeatureToggles.tsx         # Industry feature toggles
├── OnboardingWizard.tsx       # Step-by-step setup
├── WarehouseForm.tsx          # Warehouse CRUD
├── LocationsTree.tsx          # Location hierarchy
├── MachineForm.tsx            # Machine CRUD
├── SupplierForm.tsx           # Supplier CRUD
├── TaxCodeForm.tsx            # Tax code CRUD
├── UserForm.tsx               # User CRUD
├── RolePermissions.tsx        # Permission matrix
└── CustomRoleEditor.tsx       # Custom role builder
```

## Onboarding Wizard

### Step-by-Step Setup
```typescript
const onboardingSteps = [
  {
    id: 'organization',
    title: 'Organization Info',
    fields: ['name', 'timezone', 'language', 'logo'],
  },
  {
    id: 'industry',
    title: 'Industry Settings',
    fields: ['enable_allergens', 'enable_lot_tracking', 'enable_coa_requirement'],
  },
  {
    id: 'warehouse',
    title: 'First Warehouse',
    fields: ['code', 'name', 'address'],
  },
  {
    id: 'locations',
    title: 'Key Locations',
    fields: ['receiving', 'shipping', 'production', 'storage'],
  },
  {
    id: 'users',
    title: 'Invite Users',
    fields: ['emails', 'roles'],
  },
]
```

## Caching Strategy

### Cached Data
```typescript
// Settings cached for 10 minutes
const SETTINGS_CACHE_TTL = 10 * 60 * 1000

// Warehouses/Locations cached for 5 minutes
const MASTER_DATA_CACHE_TTL = 5 * 60 * 1000

// Cache keys
const cacheKeys = {
  settings: (orgId: string) => `settings:${orgId}`,
  warehouses: (orgId: string) => `warehouses:${orgId}`,
  locations: (orgId: string, whId: string) => `locations:${orgId}:${whId}`,
  suppliers: (orgId: string) => `suppliers:${orgId}`,
}
```

### Invalidation
```typescript
// On settings update
await invalidateCache(cacheKeys.settings(orgId))

// On warehouse/location change
await invalidateCache(cacheKeys.warehouses(orgId))
await invalidateCache(cacheKeys.locations(orgId, '*'))
```

## Business Rules

### Validation Rules
1. **Warehouse codes** must be unique per org
2. **Location codes** must be unique per warehouse
3. **Default receiving location** required per warehouse
4. **Transit location** required for Transfer Orders
5. **At least one Admin** user required per org

### Inheritance Rules
```typescript
// Supplier defaults inherited by PO
interface SupplierDefaults {
  currency: string
  tax_code_id: string
  lead_time_days: number
}

// When creating PO, inherit from supplier
const po = {
  supplier_id: supplier.id,
  currency: supplier.default_currency,
  tax_code_id: supplier.default_tax_code_id,
  expected_date: addDays(today, supplier.lead_time_days),
}
```

## Security

### Module Permissions
```typescript
const settingsPermissions = {
  admin: ['read', 'create', 'update', 'delete'],
  manager: ['read', 'update'], // Limited settings
  viewer: ['read'],
}

// Sensitive operations require Admin
const adminOnlyOperations = [
  'update_industry_toggles',
  'manage_custom_roles',
  'delete_users',
  'update_org_settings',
]
```

### RLS Policies
```sql
-- Standard tenant isolation
CREATE POLICY "Tenant isolation" ON warehouses
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Admin-only for org settings
CREATE POLICY "Admin only" ON org_settings
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );
```

## Integration Points

### Consumed Data

Settings provides reference data to all modules:

| Module | Data Consumed |
|--------|---------------|
| Technical | UoM list, allergen settings |
| Planning | Suppliers, tax codes, warehouses |
| Production | Machines, production lines, locations |
| Warehouse | Warehouses, locations |
| Quality | Suppliers (for supplier quality) |
| Shipping | Carriers, warehouses |

### Events Emitted

```typescript
// Settings change events
type SettingsEvent =
  | 'settings.updated'
  | 'warehouse.created'
  | 'warehouse.updated'
  | 'location.created'
  | 'user.created'
  | 'user.role_changed'
```

## Testing

### Key Test Cases
```typescript
describe('SettingsAPI', () => {
  describe('updateSettings', () => {
    it('updates feature toggles')
    it('validates timezone format')
    it('requires admin role')
  })

  describe('warehouses', () => {
    it('enforces unique codes')
    it('requires default receiving location')
    it('cascades deactivation to locations')
  })

  describe('users', () => {
    it('prevents deleting last admin')
    it('validates email uniqueness')
    it('assigns correct default role')
  })
})
```

## Future Considerations

### Phase 3
- SSO/SAML integration
- Advanced audit settings
- Data retention configuration

### Phase 4
- Custom fields per entity
- Workflow automation rules
- White-labeling options
