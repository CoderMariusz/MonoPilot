# Settings Module Architecture

## Overview

The Settings Module provides centralized configuration and administration for MonoPilot Food MES. It manages organization setup, user access, infrastructure configuration, master data, and system preferences.

**Module Purpose:**
- Multi-tenant organization management
- User management with 10-role permission system
- Infrastructure setup (warehouses, locations, machines, production lines)
- Master data management (allergens, tax codes)
- Module activation/deactivation
- Multi-language support (PL/EN/DE/FR)

**Key Entities:**
- Organizations (tenants)
- Users and Roles
- Warehouses and Locations
- Machines and Production Lines
- Allergens and Tax Codes
- Module Settings

---

## Database Schema

### Core Tables

#### organizations
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
logo_url        TEXT
contact_email   TEXT
contact_phone   TEXT
website         TEXT
timezone        TEXT DEFAULT 'UTC'
locale          TEXT DEFAULT 'en-US'
currency        TEXT DEFAULT 'PLN'
business_hours  JSONB
gs1_prefix      TEXT                    -- GS1 company prefix for SSCC
next_sscc_seq   BIGINT DEFAULT 1
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### users
```sql
id              UUID PRIMARY KEY REFERENCES auth.users(id)
org_id          UUID NOT NULL REFERENCES organizations(id)
email           TEXT NOT NULL
name            TEXT NOT NULL
role            TEXT NOT NULL           -- enum: super_admin, admin, production_manager, etc.
language        TEXT DEFAULT 'en'
is_active       BOOLEAN DEFAULT true
last_login_at   TIMESTAMPTZ
invited_at      TIMESTAMPTZ
invite_token    TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, email)
```

#### warehouses
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
warehouse_type  TEXT NOT NULL           -- raw, wip, finished, quarantine, general
address         TEXT
city            TEXT
postal_code     TEXT
country         TEXT
is_default      BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
created_by      UUID REFERENCES users(id)

UNIQUE(org_id, code)
```

#### locations
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
warehouse_id    UUID NOT NULL REFERENCES warehouses(id)
parent_id       UUID REFERENCES locations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
location_type   TEXT NOT NULL           -- zone, aisle, rack, bin
level           INTEGER DEFAULT 0
path            TEXT                    -- materialized path for hierarchy
max_capacity    DECIMAL(15,4)
current_capacity DECIMAL(15,4) DEFAULT 0
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

#### machines
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
machine_type    TEXT NOT NULL           -- mixer, oven, filler, packaging, etc.
status          TEXT DEFAULT 'active'   -- active, maintenance, offline
capacity_per_hour DECIMAL(15,4)
location_id     UUID REFERENCES locations(id)
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
created_by      UUID REFERENCES users(id)

UNIQUE(org_id, code)
```

#### production_lines
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
status          TEXT DEFAULT 'active'
default_location_id UUID REFERENCES locations(id)
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

#### line_machines
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
line_id         UUID NOT NULL REFERENCES production_lines(id)
machine_id      UUID NOT NULL REFERENCES machines(id)
sequence        INTEGER NOT NULL

UNIQUE(line_id, machine_id)
```

#### allergens
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL           -- A01-A14 (EU standard)
name            TEXT NOT NULL
name_pl         TEXT
name_de         TEXT
name_fr         TEXT
icon_url        TEXT
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

#### tax_codes
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
code            TEXT NOT NULL
name            TEXT NOT NULL
rate            DECIMAL(5,4) NOT NULL   -- 0.23 = 23%
jurisdiction    TEXT
effective_from  DATE
effective_to    DATE
is_default      BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

#### module_settings
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id) UNIQUE
planning_enabled    BOOLEAN DEFAULT true
production_enabled  BOOLEAN DEFAULT true
quality_enabled     BOOLEAN DEFAULT false
warehouse_enabled   BOOLEAN DEFAULT true
shipping_enabled    BOOLEAN DEFAULT false
technical_enabled   BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_org_email ON users(org_id, email);
CREATE INDEX idx_users_org_active ON users(org_id, is_active);
CREATE INDEX idx_warehouses_org_type ON warehouses(org_id, warehouse_type);
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_parent ON locations(parent_id);
CREATE INDEX idx_machines_org_type ON machines(org_id, machine_type);
CREATE INDEX idx_machines_status ON machines(org_id, status);
CREATE INDEX idx_production_lines_org ON production_lines(org_id);
```

---

## API Design

### Organization Endpoints
```
GET    /api/settings/organization
PUT    /api/settings/organization
POST   /api/settings/organization/logo
```

### User Management Endpoints
```
GET    /api/settings/users                    -- List users with filters
GET    /api/settings/users/:id                -- Get user details
POST   /api/settings/users                    -- Create user (send invite)
PUT    /api/settings/users/:id                -- Update user
DELETE /api/settings/users/:id                -- Deactivate user
POST   /api/settings/users/:id/resend-invite  -- Resend invitation
POST   /api/settings/users/:id/sessions/terminate -- Terminate all sessions
```

### Warehouse Endpoints
```
GET    /api/settings/warehouses
GET    /api/settings/warehouses/:id
POST   /api/settings/warehouses
PUT    /api/settings/warehouses/:id
DELETE /api/settings/warehouses/:id
```

### Location Endpoints
```
GET    /api/settings/locations                -- With tree structure
GET    /api/settings/locations/:id
POST   /api/settings/locations
PUT    /api/settings/locations/:id
DELETE /api/settings/locations/:id
GET    /api/settings/locations/tree/:warehouseId  -- Hierarchical tree
```

### Machine Endpoints
```
GET    /api/settings/machines
GET    /api/settings/machines/:id
POST   /api/settings/machines
PUT    /api/settings/machines/:id
DELETE /api/settings/machines/:id
PUT    /api/settings/machines/:id/status      -- Update status
```

### Production Line Endpoints
```
GET    /api/settings/production-lines
GET    /api/settings/production-lines/:id
POST   /api/settings/production-lines
PUT    /api/settings/production-lines/:id
DELETE /api/settings/production-lines/:id
PUT    /api/settings/production-lines/:id/machines  -- Assign machines
```

### Master Data Endpoints
```
GET    /api/settings/allergens
POST   /api/settings/allergens
PUT    /api/settings/allergens/:id

GET    /api/settings/tax-codes
POST   /api/settings/tax-codes
PUT    /api/settings/tax-codes/:id
DELETE /api/settings/tax-codes/:id
```

### Module Settings Endpoints
```
GET    /api/settings/modules
PUT    /api/settings/modules
```

### Request/Response Patterns

**Standard List Response:**
```typescript
interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

**Standard Error Response:**
```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
}
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/settings/
├── page.tsx                    -- Settings dashboard
├── organization/
│   └── page.tsx               -- Organization profile
├── users/
│   ├── page.tsx               -- User list
│   └── components/
│       ├── UserTable.tsx
│       ├── UserFormModal.tsx
│       ├── InviteUserModal.tsx
│       └── RoleSelector.tsx
├── warehouses/
│   ├── page.tsx               -- Warehouse list
│   └── [id]/page.tsx          -- Warehouse detail + locations
├── machines/
│   ├── page.tsx               -- Machine list
│   └── components/
│       ├── MachineTable.tsx
│       └── MachineFormModal.tsx
├── production-lines/
│   └── page.tsx               -- Production line management
├── allergens/
│   └── page.tsx               -- Allergen management
├── tax-codes/
│   └── page.tsx               -- Tax code management
└── modules/
    └── page.tsx               -- Module toggles
```

### Service Dependencies

```
lib/services/
├── organization-service.ts     -- Organization CRUD
├── user-service.ts            -- User management + invitations
├── warehouse-service.ts       -- Warehouse + location CRUD
├── machine-service.ts         -- Machine management
├── production-line-service.ts -- Line + machine assignments
├── allergen-service.ts        -- Allergen CRUD
├── tax-code-service.ts        -- Tax code CRUD
└── module-settings-service.ts -- Module activation
```

---

## Data Flow

### User Invitation Flow
```
+-------------+     +----------------+     +----------------+
|   Admin     | --> |   User API     | --> |   Supabase     |
|   (UI)      |     |   Route        |     |   Auth         |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |                    v                      v
      |             +----------------+     +----------------+
      |             |   User         |     |   SendGrid     |
      |             |   Service      | --> |   (Email)      |
      |             +----------------+     +----------------+
      |                    |
      v                    v
+-------------+     +----------------+
|   UI Toast  |     |   users        |
|   "Sent"    |     |   table        |
+-------------+     +----------------+
```

### Module Activation Flow
```
+-------------+     +----------------+     +----------------+
|   Admin     | --> |  Modules API   | --> | module_settings|
|   Toggle    |     |   Route        |     |   table        |
+-------------+     +----------------+     +----------------+
      |                    |
      |                    v
      |             +----------------+
      |             |   Validate     |
      |             |  Dependencies  |
      |             +----------------+
      |                    |
      v                    v
+-------------+     +----------------+
|   Nav Update|     |   RLS Policy   |
|   (Real-time)|    |   Enforcement  |
+-------------+     +----------------+
```

---

## Security

### RLS Policies

```sql
-- organizations: Only own organization
CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- users: Only same organization
CREATE POLICY "Users can view users in their org"
ON users FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- users: Only admin can modify
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- All other tables: org_id filter
CREATE POLICY "Org isolation" ON warehouses FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /users | Any authenticated |
| POST /users | Admin, Super Admin |
| DELETE /users | Admin, Super Admin |
| PUT /organization | Admin, Super Admin |
| PUT /modules | Admin, Super Admin |
| * /warehouses | Admin, Warehouse Manager |
| * /machines | Admin, Production Manager |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Organizations | 1 | 1 |
| Users per org | 20-50 | 500 |
| Warehouses | 1-5 | 20 |
| Locations | 50-500 | 5,000 |
| Machines | 10-50 | 200 |
| Production Lines | 2-10 | 50 |

### Query Optimization

1. **Location Tree Loading:**
   - Use materialized path for fast hierarchy traversal
   - Lazy-load children on expand
   - Cache warehouse location trees (5 min TTL)

2. **User List:**
   - Paginate with limit 50
   - Index on (org_id, is_active, role)
   - Full-text search on name, email

3. **Settings Dashboard:**
   - Single query for all counts
   - Cache dashboard data (30 sec TTL)

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:settings'       // 5 min TTL
'org:{orgId}:modules'        // 5 min TTL
'org:{orgId}:locations:tree' // 5 min TTL
'user:{userId}:permissions'  // 1 min TTL
```

---

## Integration Points

### Module Dependencies

```
Settings Module
    |
    +---> Technical Module (Products reference allergens)
    +---> Planning Module (PO reference warehouses, suppliers)
    +---> Production Module (WO reference lines, machines)
    +---> Warehouse Module (LP reference locations)
    +---> Shipping Module (SO reference warehouses)
    +---> Quality Module (Inspections reference users)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `user.created` | User invitation accepted | Audit log |
| `user.deactivated` | User deactivated | Session manager |
| `warehouse.created` | Warehouse created | Warehouse module |
| `machine.status_changed` | Status update | Production dashboard |
| `module.enabled` | Module toggled | Navigation, RLS |

---

## Testing Requirements

### Unit Tests
- User service: CRUD, invitation flow, role validation
- Warehouse service: CRUD, location hierarchy
- Module settings: Dependency validation

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- Role-based access control

### E2E Tests
- User invitation flow (invite -> accept -> login)
- Warehouse + location creation
- Module toggle and navigation update
