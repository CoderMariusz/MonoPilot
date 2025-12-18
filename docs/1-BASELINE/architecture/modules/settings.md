# Settings Module Architecture

---

**Architecture Decision Records (ADRs):**
This baseline reflects the following ACCEPTED ADRs:
- [ADR-011: Module Toggle Storage](../../decisions/ADR-011-module-toggle-storage.md) - Junction table pattern for module toggles
- [ADR-012: Role Permission Storage](../../decisions/ADR-012-role-permission-storage.md) - UUID FK + JSONB permissions
- [ADR-013: RLS Org Isolation Pattern](../../decisions/ADR-013-rls-org-isolation-pattern.md) - Users table lookup pattern

For detailed rationale and alternatives, see individual ADR documents.

---

## Overview

The Settings Module provides centralized configuration and administration for MonoPilot Food MES. It manages organization setup, user access, infrastructure configuration, master data, and system preferences.

**Module Purpose:**
- Multi-tenant organization management
- User management with 10-role permission system
- Infrastructure setup (warehouses, locations, machines, production lines)
- Master data management (allergens, tax codes)
- Module activation/deactivation
- Multi-language support (PL/EN/DE/FR)
- API key management for external integrations
- Webhook configuration for event notifications
- Security policy management (password, session, MFA, IP whitelist)
- User notification preferences
- Subscription and billing management (Stripe integration)
- Data import/export functionality

**Key Entities:**
- Organizations (tenants)
- Users and Roles
- Warehouses and Locations
- Machines and Production Lines
- Allergens and Tax Codes
- Module Settings
- API Keys and Webhooks
- Security Policies (password, session, MFA, IP whitelist)
- Notification Preferences
- Subscriptions and Billing
- Data Import/Export

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
tax_id          VARCHAR(50)             -- Tax ID / NIP
timezone        TEXT DEFAULT 'UTC'
locale          TEXT DEFAULT 'en-US'
currency        TEXT DEFAULT 'PLN'
business_hours  JSONB
business_hours_start TIME DEFAULT '08:00'
business_hours_end TIME DEFAULT '17:00'
business_days   INT[] DEFAULT '{1,2,3,4,5}'  -- Mon-Fri (1=Mon, 7=Sun)
gs1_prefix      TEXT                    -- GS1 company prefix for SSCC
next_sscc_seq   BIGINT DEFAULT 1
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### roles
```sql
-- Roles table (ADR-012: Role Permission Storage)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT true,
  org_id UUID REFERENCES organizations(id), -- NULL for system roles
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions JSONB Structure (ADR-012):
-- {
--   "settings": "CRUD",
--   "users": "CRUD",
--   "technical": "R",
--   "planning": "CRU",
--   ...
-- }
-- Values: C=Create, R=Read, U=Update, D=Delete, "-"=No access

-- See ADR-012 for full 10 system roles seed data
```

#### users
```sql
id              UUID PRIMARY KEY REFERENCES auth.users(id)
org_id          UUID NOT NULL REFERENCES organizations(id)
email           TEXT NOT NULL
name            TEXT NOT NULL
role_id         UUID NOT NULL REFERENCES roles(id)  -- FK to roles table (ADR-012)
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
status          TEXT DEFAULT 'active'   -- active, empty, full, reserved, disabled
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
capacity_per_hour DECIMAL(10,2)         -- Units per hour
specs           JSONB                   -- Machine specifications
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

#### modules
```sql
-- Modules table (ADR-011: Module Toggle Storage)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  dependencies TEXT[],
  can_disable BOOLEAN DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for 11 modules (settings, technical always enabled)
-- See ADR-011 for full seed data
```

#### organization_modules
```sql
-- Organization-specific module state (ADR-011)
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  disabled_at TIMESTAMPTZ,
  disabled_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, module_id)
);

-- See ADR-011 for full schema with audit fields
```

### API & Integration Tables

#### api_keys
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
name            VARCHAR(100) NOT NULL
key_hash        VARCHAR(255) NOT NULL   -- bcrypt hash
key_last4       CHAR(4) NOT NULL
key_prefix      VARCHAR(10) DEFAULT 'pk_live_'
permissions     JSONB NOT NULL DEFAULT '{}'
status          TEXT DEFAULT 'active'   -- active, revoked
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
last_used_at    TIMESTAMPTZ
revoked_at      TIMESTAMPTZ
revoked_by      UUID REFERENCES users(id)

UNIQUE(org_id, name)
```

#### webhooks
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
name            VARCHAR(100) NOT NULL
url             VARCHAR(500) NOT NULL
secret          VARCHAR(64) NOT NULL    -- HMAC secret
events          TEXT[] NOT NULL         -- ['work_order.created', 'inventory.updated']
status          TEXT DEFAULT 'active'   -- active, disabled, error
retry_count     INT DEFAULT 0
last_triggered_at TIMESTAMPTZ
last_status_code INT
last_error      TEXT
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, name)
```

#### webhook_deliveries
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
webhook_id      UUID NOT NULL REFERENCES webhooks(id)
event           VARCHAR(50) NOT NULL
payload         JSONB NOT NULL
status_code     INT
response_body   TEXT
duration_ms     INT
attempt         INT DEFAULT 1
success         BOOLEAN
created_at      TIMESTAMPTZ DEFAULT now()
```

### Security Tables

#### org_security_policies
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID UNIQUE NOT NULL REFERENCES organizations(id)
password_min_length INT DEFAULT 12
password_require_uppercase BOOLEAN DEFAULT true
password_require_lowercase BOOLEAN DEFAULT true
password_require_number BOOLEAN DEFAULT true
password_require_symbol BOOLEAN DEFAULT true
password_expiry_days INT DEFAULT 90
password_reuse_prevention INT DEFAULT 5
session_timeout_minutes INT DEFAULT 30
session_max_duration_hours INT DEFAULT 8
max_concurrent_sessions INT DEFAULT 5
lockout_threshold INT DEFAULT 5
lockout_duration_minutes INT DEFAULT 15
mfa_required    TEXT DEFAULT 'optional' -- disabled, optional, required_admins, required_all
mfa_methods     TEXT[] DEFAULT '{totp}'
ip_whitelist_enabled BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### ip_whitelist
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
ip_address      INET NOT NULL
label           VARCHAR(100)
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, ip_address)
```

#### login_attempts
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
email           VARCHAR(255)
ip_address      INET NOT NULL
user_agent      TEXT
success         BOOLEAN NOT NULL
failure_reason  VARCHAR(50)
created_at      TIMESTAMPTZ DEFAULT now()
```

#### password_history
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
password_hash   VARCHAR(255) NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
```

### User Preferences Tables

#### notification_preferences
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
org_id          UUID NOT NULL REFERENCES organizations(id)
category        VARCHAR(50) NOT NULL    -- 'production', 'inventory', 'quality', 'system'
event           VARCHAR(50) NOT NULL    -- 'work_order_created', 'low_stock', etc.
channel_email   BOOLEAN DEFAULT true
channel_in_app  BOOLEAN DEFAULT true
channel_sms     BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(user_id, category, event)
```

#### user_warehouse_access
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
warehouse_id    UUID NOT NULL REFERENCES warehouses(id)
access_level    TEXT DEFAULT 'write'    -- read, write, admin
created_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(user_id, warehouse_id)
```

### Billing & Subscription Tables

#### org_subscriptions
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID UNIQUE NOT NULL REFERENCES organizations(id)
plan            TEXT DEFAULT 'free'     -- free, premium, enterprise
stripe_customer_id VARCHAR(50)
stripe_subscription_id VARCHAR(50)
status          TEXT DEFAULT 'active'   -- active, past_due, canceled, trialing
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
cancel_at_period_end BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### invoices
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
stripe_invoice_id VARCHAR(50) UNIQUE
amount_cents    INT NOT NULL
currency        CHAR(3) DEFAULT 'USD'
status          TEXT DEFAULT 'draft'    -- draft, open, paid, void, uncollectible
period_start    TIMESTAMPTZ
period_end      TIMESTAMPTZ
issued_at       TIMESTAMPTZ
paid_at         TIMESTAMPTZ
pdf_url         TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

#### payment_methods
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
stripe_payment_method_id VARCHAR(50) UNIQUE
type            VARCHAR(20) DEFAULT 'card'
brand           VARCHAR(20)
last4           CHAR(4)
exp_month       INT
exp_year        INT
is_default      BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

### Data Import Tables

#### import_history
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id          UUID NOT NULL REFERENCES organizations(id)
data_type       VARCHAR(50) NOT NULL    -- 'products', 'materials', 'locations', etc.
file_name       VARCHAR(255)
file_size_bytes INT
status          TEXT DEFAULT 'pending'  -- pending, processing, completed, failed
total_rows      INT
imported_rows   INT DEFAULT 0
skipped_rows    INT DEFAULT 0
error_rows      INT DEFAULT 0
errors          JSONB
started_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
-- Core tables indexes
CREATE INDEX idx_users_org_email ON users(org_id, email);
CREATE INDEX idx_users_org_active ON users(org_id, is_active);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_warehouses_org_type ON warehouses(org_id, warehouse_type);
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_parent ON locations(parent_id);
CREATE INDEX idx_locations_status ON locations(org_id, status);
CREATE INDEX idx_machines_org_type ON machines(org_id, machine_type);
CREATE INDEX idx_machines_status ON machines(org_id, status);
CREATE INDEX idx_production_lines_org ON production_lines(org_id);

-- Module tables indexes (ADR-011)
CREATE INDEX idx_modules_code ON modules(code);
CREATE INDEX idx_organization_modules_org ON organization_modules(org_id);
CREATE INDEX idx_organization_modules_module ON organization_modules(module_id);
CREATE INDEX idx_organization_modules_enabled ON organization_modules(org_id, enabled);

-- Role tables indexes (ADR-012)
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_org ON roles(org_id);
CREATE INDEX idx_roles_system ON roles(is_system);

-- API & Integration indexes
CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_status ON api_keys(org_id, status);
CREATE INDEX idx_webhooks_org ON webhooks(org_id);
CREATE INDEX idx_webhooks_status ON webhooks(org_id, status);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at);

-- Security indexes
CREATE INDEX idx_login_attempts_user ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created ON login_attempts(created_at);
CREATE INDEX idx_password_history_user ON password_history(user_id);
CREATE INDEX idx_ip_whitelist_org ON ip_whitelist(org_id);

-- User preferences indexes
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_org ON notification_preferences(org_id);
CREATE INDEX idx_user_warehouse_access_user ON user_warehouse_access(user_id);
CREATE INDEX idx_user_warehouse_access_warehouse ON user_warehouse_access(warehouse_id);

-- Billing indexes
CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_invoices_status ON invoices(org_id, status);
CREATE INDEX idx_payment_methods_org ON payment_methods(org_id);

-- Import indexes
CREATE INDEX idx_import_history_org ON import_history(org_id);
CREATE INDEX idx_import_history_status ON import_history(org_id, status);
CREATE INDEX idx_import_history_created ON import_history(created_at);
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

### Roles API (ADR-012)
```
GET    /api/settings/roles                    -- List all roles (system + custom)
GET    /api/settings/roles/:id                -- Get role details
POST   /api/settings/roles                    -- Create custom role (future)
PUT    /api/settings/roles/:id                -- Update custom role (future)
DELETE /api/settings/roles/:id                -- Delete custom role (future)
```

### Modules API (ADR-011)
```
GET    /api/settings/modules                  -- List all modules with enabled status
GET    /api/settings/modules/:id              -- Get module details
PATCH  /api/settings/modules/:id/toggle       -- Enable/disable module
```

### API Keys Endpoints (SET-023)
```
GET    /api/settings/api-keys                -- List API keys
POST   /api/settings/api-keys                -- Create API key (returns full key once)
DELETE /api/settings/api-keys/:id            -- Revoke API key
PUT    /api/settings/api-keys/:id/regenerate -- Regenerate key
```

### Webhooks Endpoints (SET-024)
```
GET    /api/settings/webhooks                -- List webhooks
GET    /api/settings/webhooks/:id            -- Get webhook details
POST   /api/settings/webhooks                -- Create webhook
PUT    /api/settings/webhooks/:id            -- Update webhook
DELETE /api/settings/webhooks/:id            -- Delete webhook
POST   /api/settings/webhooks/:id/test       -- Send test payload
GET    /api/settings/webhooks/:id/deliveries -- Get delivery history
```

### Security Policy Endpoints (SET-026)
```
GET    /api/settings/security                -- Get security policies
PUT    /api/settings/security                -- Update security policies
GET    /api/settings/security/ip-whitelist   -- Get IP whitelist
POST   /api/settings/security/ip-whitelist   -- Add IP to whitelist
DELETE /api/settings/security/ip-whitelist/:id -- Remove IP from whitelist
GET    /api/settings/security/login-history  -- Get login attempts
```

### Notification Preferences Endpoints (SET-027)
```
GET    /api/settings/notifications           -- Get notification preferences
PUT    /api/settings/notifications           -- Update notification preferences
GET    /api/settings/notifications/events    -- List available events
```

### Subscription & Billing Endpoints (SET-028)
```
GET    /api/settings/subscription            -- Get current subscription
POST   /api/settings/subscription/upgrade    -- Upgrade to premium/enterprise
POST   /api/settings/subscription/cancel     -- Cancel subscription
GET    /api/settings/billing/invoices        -- List invoices
GET    /api/settings/billing/invoices/:id    -- Get invoice PDF
GET    /api/settings/billing/payment-methods -- List payment methods
POST   /api/settings/billing/payment-methods -- Add payment method
DELETE /api/settings/billing/payment-methods/:id -- Remove payment method
PUT    /api/settings/billing/payment-methods/:id/default -- Set as default
```

### Data Import/Export Endpoints (SET-029)
```
POST   /api/settings/import                  -- Upload import file
GET    /api/settings/import/templates/:type  -- Download template (CSV)
GET    /api/settings/import/history          -- Get import history
GET    /api/settings/import/:id/status       -- Get import status
GET    /api/settings/import/:id/errors       -- Get import errors
POST   /api/settings/export                  -- Request data export
GET    /api/settings/export/:id              -- Download export file
```

### User Warehouse Access Endpoints (SET-009)
```
GET    /api/settings/users/:id/warehouse-access  -- Get user's warehouse access
PUT    /api/settings/users/:id/warehouse-access  -- Update user's warehouse access
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

### Permission Checks (ADR-012)

All protected endpoints use the role-based permission system:

```typescript
// Service layer permission check
async function hasPermission(userId: string, module: string, action: 'C' | 'R' | 'U' | 'D'): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role:roles(permissions)')
    .eq('id', userId)
    .single();

  const modulePerms = user?.role?.permissions?.[module] || '-';
  return modulePerms.includes(action);
}

// Usage in API route
if (!await hasPermission(userId, 'users', 'C')) {
  return { error: 'Forbidden', code: 'PERMISSION_DENIED' };
}
```

### Module Checks (ADR-011)

Check if a module is enabled for an organization:

```typescript
async function isModuleEnabled(orgId: string, moduleCode: string): Promise<boolean> {
  const { data } = await supabase
    .from('organization_modules')
    .select('enabled, module:modules(code)')
    .eq('org_id', orgId)
    .eq('module.code', moduleCode)
    .single();

  return data?.enabled ?? false;
}

// Usage in API route
if (!await isModuleEnabled(orgId, 'planning')) {
  return { error: 'Module not enabled', code: 'MODULE_DISABLED' };
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
│       ├── RoleSelector.tsx
│       └── WarehouseAccessModal.tsx
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
├── modules/
│   └── page.tsx               -- Module toggles
├── api-keys/
│   ├── page.tsx               -- API key management
│   └── components/
│       ├── ApiKeyTable.tsx
│       └── CreateApiKeyModal.tsx
├── webhooks/
│   ├── page.tsx               -- Webhook management
│   └── components/
│       ├── WebhookTable.tsx
│       ├── WebhookFormModal.tsx
│       └── DeliveryLogModal.tsx
├── security/
│   ├── page.tsx               -- Security policies
│   └── components/
│       ├── PasswordPolicyForm.tsx
│       ├── SessionPolicyForm.tsx
│       ├── MfaPolicyForm.tsx
│       ├── IpWhitelistTable.tsx
│       └── LoginHistoryTable.tsx
├── notifications/
│   └── page.tsx               -- Notification preferences
├── billing/
│   ├── page.tsx               -- Subscription & billing
│   └── components/
│       ├── PlanSelector.tsx
│       ├── PaymentMethodCard.tsx
│       └── InvoiceTable.tsx
└── import-export/
    ├── page.tsx               -- Data import/export
    └── components/
        ├── ImportUploader.tsx
        ├── ImportHistoryTable.tsx
        └── ExportSelector.tsx
```

### Service Dependencies

```
lib/services/
├── organization-service.ts     -- Organization CRUD
├── user-service.ts            -- User management + invitations
├── role-service.ts            -- Role management (ADR-012)
├── warehouse-service.ts       -- Warehouse + location CRUD
├── machine-service.ts         -- Machine management
├── production-line-service.ts -- Line + machine assignments
├── allergen-service.ts        -- Allergen CRUD
├── tax-code-service.ts        -- Tax code CRUD
├── module-service.ts          -- Module activation (ADR-011)
├── api-key-service.ts         -- API key management + hashing
├── webhook-service.ts         -- Webhook CRUD + delivery
├── security-policy-service.ts -- Security policies + IP whitelist
├── notification-service.ts    -- Notification preferences
├── subscription-service.ts    -- Subscription management (Stripe)
├── billing-service.ts         -- Invoices + payment methods
└── import-service.ts          -- Data import/export
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

### Module Activation Flow (ADR-011)
```
+-------------+     +----------------+     +--------------------+
|   Admin     | --> |  Modules API   | --> | organization_      |
|   Toggle    |     |   Route        |     | modules table      |
+-------------+     +----------------+     +--------------------+
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

### Row Level Security (RLS) Policies

**Standard Pattern (ADR-013: Users Table Lookup):**

All RLS policies use the users table lookup pattern for org_id isolation:

```sql
-- Standard org isolation pattern (ADR-013)
CREATE POLICY "org_isolation" ON {table_name}
FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Note:** All RLS policies in this document use the Users Table Lookup pattern per ADR-013. This ensures:
- Single source of truth (users table is authoritative)
- Immediate effect when user org changes (no JWT refresh needed)
- Works without custom JWT claim configuration

---

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
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- roles: System roles visible to all, custom roles org-scoped (ADR-012)
CREATE POLICY "roles_select_system" ON roles FOR SELECT
USING (is_system = true);

CREATE POLICY "roles_select_custom" ON roles FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "roles_insert_custom" ON roles FOR INSERT
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND is_system = false
);

CREATE POLICY "roles_update_custom" ON roles FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND is_system = false
);

-- modules: Read-only for all authenticated (ADR-011)
CREATE POLICY "modules_select" ON modules FOR SELECT
USING (true);

-- organization_modules: Org-scoped (ADR-011)
CREATE POLICY "org_modules_select" ON organization_modules FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_modules_insert" ON organization_modules FOR INSERT
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_modules_update" ON organization_modules FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- All other tables: org_id filter (ADR-013 pattern)
CREATE POLICY "Org isolation" ON warehouses FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org isolation" ON locations FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org isolation" ON machines FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org isolation" ON production_lines FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org isolation" ON allergens FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Org isolation" ON tax_codes FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- API Keys: Admin only
CREATE POLICY "Admins can manage API keys"
ON api_keys FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Webhooks: Admin only
CREATE POLICY "Admins can manage webhooks"
ON webhooks FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Webhook deliveries: Via webhook org_id
CREATE POLICY "View deliveries for own webhooks"
ON webhook_deliveries FOR SELECT
USING (
  webhook_id IN (
    SELECT id FROM webhooks
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);

-- Security policies: Admin only
CREATE POLICY "Admins can manage security policies"
ON org_security_policies FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- IP whitelist: Admin only
CREATE POLICY "Admins can manage IP whitelist"
ON ip_whitelist FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Notification preferences: Own preferences only
CREATE POLICY "Users can manage own notification preferences"
ON notification_preferences FOR ALL
USING (user_id = auth.uid());

-- User warehouse access: Admin or self (read-only)
CREATE POLICY "View warehouse access"
ON user_warehouse_access FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can manage warehouse access"
ON user_warehouse_access FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Subscription: Admin only
CREATE POLICY "Admins can manage subscription"
ON org_subscriptions FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Invoices: Admin only
CREATE POLICY "Admins can view invoices"
ON invoices FOR SELECT
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Payment methods: Admin only
CREATE POLICY "Admins can manage payment methods"
ON payment_methods FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Import history: Admin only
CREATE POLICY "Admins can manage imports"
ON import_history FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Login attempts: User can see own, admin can see all
CREATE POLICY "View login attempts"
ON login_attempts FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Password history: User can see own only (for system use)
CREATE POLICY "System access to password history"
ON password_history FOR ALL
USING (user_id = auth.uid());
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /users | Any authenticated |
| POST /users | Admin, Owner |
| DELETE /users | Admin, Owner |
| PUT /organization | Admin, Owner |
| GET /roles | Any authenticated |
| GET /modules | Any authenticated |
| PATCH /modules/:id/toggle | Admin, Owner |
| * /warehouses | Admin, Warehouse Manager |
| * /machines | Admin, Production Manager |
| * /api-keys | Admin, Owner |
| * /webhooks | Admin, Owner |
| * /security | Admin, Owner |
| GET /notifications | Any authenticated (own) |
| PUT /notifications | Any authenticated (own) |
| * /subscription | Owner |
| * /billing | Owner |
| * /import | Admin, Owner |
| * /export | Admin, Owner |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Organizations | 1 | 1 |
| Users per org | 20-50 | 500 |
| Roles (system) | 10 | 10 |
| Roles (custom) | 0-5 | 50 |
| Modules | 11 | 20 |
| Warehouses | 1-5 | 20 |
| Locations | 50-500 | 5,000 |
| Machines | 10-50 | 200 |
| Production Lines | 2-10 | 50 |
| API Keys | 1-5 | 20 |
| Webhooks | 1-10 | 50 |
| Webhook Deliveries | 100-10K/month | 100K/month |
| Login Attempts | 100-1K/month | 50K/month |
| Import History | 1-50/month | 500/month |
| Invoices | 12/year | 120/year |

### Query Optimization

1. **Location Tree Loading:**
   - Use materialized path for fast hierarchy traversal
   - Lazy-load children on expand
   - Cache warehouse location trees (5 min TTL)

2. **User List:**
   - Paginate with limit 50
   - Index on (org_id, is_active, role_id)
   - Full-text search on name, email
   - JOIN roles table for permission display

3. **Settings Dashboard:**
   - Single query for all counts
   - Cache dashboard data (30 sec TTL)

4. **Module Status (ADR-011):**
   - Single JOIN between modules and organization_modules
   - Cache enabled modules per org (5 min TTL)

5. **Role Permissions (ADR-012):**
   - Cache user permissions in Redis (1 min TTL)
   - Load role permissions on user session init

6. **RLS Performance (ADR-013):**
   - Users table lookup adds <1ms overhead per query
   - Primary key index on users.id ensures fast lookup
   - PostgreSQL query planner optimizes repeated lookups

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:settings'         // 5 min TTL
'org:{orgId}:modules'          // 5 min TTL (ADR-011)
'org:{orgId}:locations:tree'   // 5 min TTL
'user:{userId}:permissions'    // 1 min TTL (ADR-012)
'user:{userId}:role'           // 1 min TTL (ADR-012)
'org:{orgId}:security-policy'  // 5 min TTL
'org:{orgId}:subscription'     // 5 min TTL
'user:{userId}:notifications'  // 5 min TTL
'api-key:{keyPrefix}'          // 1 min TTL (for validation)
'roles:system'                 // 1 hour TTL (ADR-012)
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
| `user.role_changed` | User role updated | Permission cache invalidation |
| `warehouse.created` | Warehouse created | Warehouse module |
| `machine.status_changed` | Status update | Production dashboard |
| `module.enabled` | Module toggled | Navigation, RLS |
| `module.disabled` | Module toggled | Navigation, RLS |
| `role.created` | Custom role created | Permission cache invalidation |
| `role.updated` | Role permissions changed | Permission cache invalidation |
| `api_key.created` | API key generated | Audit log |
| `api_key.revoked` | API key revoked | Audit log |
| `webhook.triggered` | Webhook event fired | Webhook delivery queue |
| `security.policy_updated` | Security settings changed | Session manager |
| `security.ip_blocked` | IP blocked by whitelist | Audit log |
| `subscription.changed` | Plan upgrade/downgrade | Billing, Feature gates |
| `import.completed` | Data import finished | Notifications |
| `import.failed` | Data import failed | Notifications, Audit log |

### External Integrations

| Integration | Purpose | Tables Affected |
|-------------|---------|-----------------|
| Stripe | Payment processing | org_subscriptions, invoices, payment_methods |
| SendGrid | Email notifications | notification_preferences |
| Supabase Auth | User authentication | users, login_attempts, password_history |

---

## Testing Requirements

### Unit Tests
- User service: CRUD, invitation flow, role validation
- Role service: CRUD, permission checks (ADR-012)
- Warehouse service: CRUD, location hierarchy
- Module service: Enable/disable, dependency validation (ADR-011)
- API key service: Key generation, hashing, validation
- Webhook service: HMAC signing, delivery retry logic
- Security policy service: Password validation, lockout logic
- Import service: CSV parsing, validation, error handling

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement (ADR-013)
- Role-based access control (ADR-012)
- Module toggle with dependencies (ADR-011)
- Stripe webhook handling
- API key authentication flow
- Webhook delivery and retry

### E2E Tests
- User invitation flow (invite -> accept -> login)
- Role assignment and permission enforcement
- Module enable/disable with navigation update
- Warehouse + location creation
- API key creation and API authentication
- Webhook configuration and test delivery
- Security policy enforcement (password, session, MFA)
- Data import with validation errors
- Subscription upgrade flow

---

## Migration from Legacy Schema

**Status:** In Progress
**Target Date:** Phase 1A completion

### Key Migrations

1. **ADR-011 (Modules):** Migrate flat columns to organization_modules junction table
   - Migration: `supabase/migrations/053_create_modules_tables.sql`
   - Deprecates: `module_settings` table (if exists)

2. **ADR-012 (Roles):** Migrate users.role TEXT to role_id UUID FK
   - Migration: `supabase/migrations/054_create_roles_table.sql`
   - Migration: `supabase/migrations/055_migrate_user_roles.sql`
   - Deprecates: `users.role` column (TEXT enum)

3. **ADR-013 (RLS):** Standardize all policies to users lookup pattern
   - Migration: `supabase/migrations/056_standardize_rls_policies.sql`
   - Replaces: JWT claim pattern `auth.jwt() ->> 'org_id'`
   - New pattern: `(SELECT org_id FROM users WHERE id = auth.uid())`

### Migration Checklist

- [ ] Backup production database before migration
- [ ] Run migrations on staging environment
- [ ] Verify all RLS policies use ADR-013 pattern
- [ ] Test user org reassignment (immediate effect)
- [ ] Verify module enable/disable with dependencies
- [ ] Test permission checks across all modules
- [ ] Update application code to use new schema
- [ ] Monitor performance after migration (<1ms RLS overhead)

---

## Document Version

**Version:** 2.0
**Last Updated:** 2025-12-15
**ADRs Reflected:** ADR-011, ADR-012, ADR-013

---

## Implementation Status

### Story 01.1 - Org Context + Base RLS

**Status:** ✅ COMPLETE (2025-12-16)
**Type:** Backend Foundation
**Phase:** MVP (Phase 1A)
**ADRs:** ADR-011, ADR-012, ADR-013

#### Implemented Features

**Database:**
- [x] Organizations table with onboarding state tracking
- [x] Users table with role_id FK and org_id scoping
- [x] Roles table with JSONB permissions (10 system roles)
- [x] Modules table (11 modules)
- [x] Organization_modules table for per-org module toggle state
- [x] RLS policies using ADR-013 pattern
- [x] 12 RLS policies for tenant isolation and admin enforcement

**API Endpoints:**
- [x] GET /api/v1/settings/context - Org context resolution

**Services:**
- [x] org-context-service.ts
- [x] permission-service.ts

**Security:**
- [x] Multi-tenant isolation via RLS (ADR-013)
- [x] Cross-tenant access returns 404 (not 403) to prevent enumeration
- [x] UUID validation prevents SQL injection

**Tests:**
- [x] 25/25 permission service tests passing (100% coverage)
- [x] 24 org context service tests designed
- [x] 15 SQL integration tests for RLS isolation

**Documentation:**
- [x] API documentation: `docs/3-ARCHITECTURE/api/settings/context.md`
- [x] Migration documentation: `docs/3-ARCHITECTURE/database/migrations/01.1-org-context-rls.md`
- [x] Developer guide: `docs/3-ARCHITECTURE/guides/using-org-context.md`
- [x] Services README: `apps/frontend/lib/services/README.md`
- [x] Changelog entry: `CHANGELOG.md`

**Code Review:** APPROVED (2025-12-16)
**QA Status:** CONDITIONALLY APPROVED (2025-12-16)

#### Dependencies Satisfied

**Blocks:** Stories 01.2, 01.3, 01.6, 01.8, 01.12, 01.13, and all Settings stories
**No blockers** - Foundation story

---

---

## Implementation Status

### Story 01.1 - Org Context + Base RLS

**Status:** ✅ COMPLETE (2025-12-16)
**Type:** Backend Foundation
**Phase:** MVP (Phase 1A)
**ADRs:** ADR-011, ADR-012, ADR-013

#### Implemented Features

**Database:**
- [x] Organizations table with onboarding state tracking
- [x] Users table with role_id FK and org_id scoping
- [x] Roles table with JSONB permissions (10 system roles)
- [x] Modules table (11 modules)
- [x] Organization_modules table for per-org module toggle state
- [x] RLS policies using ADR-013 pattern
- [x] 12 RLS policies for tenant isolation and admin enforcement

**API Endpoints:**
- [x] GET /api/v1/settings/context - Org context resolution

**Services:**
- [x] org-context-service.ts
- [x] permission-service.ts

**Security:**
- [x] Multi-tenant isolation via RLS (ADR-013)
- [x] Cross-tenant access returns 404 (not 403) to prevent enumeration
- [x] UUID validation prevents SQL injection

**Tests:**
- [x] 25/25 permission service tests passing (100% coverage)
- [x] 24 org context service tests designed
- [x] 15 SQL integration tests for RLS isolation

**Documentation:**
- [x] API documentation: `docs/3-ARCHITECTURE/api/settings/context.md`
- [x] Migration documentation: `docs/3-ARCHITECTURE/database/migrations/01.1-org-context-rls.md`
- [x] Developer guide: `docs/3-ARCHITECTURE/guides/using-org-context.md`
- [x] Services README: `apps/frontend/lib/services/README.md`
- [x] Changelog entry: `CHANGELOG.md`

**Code Review:** APPROVED (2025-12-16)
**QA Status:** CONDITIONALLY APPROVED (2025-12-16)

#### Dependencies Satisfied

**Blocks:** Stories 01.2, 01.3, 01.6, 01.8, 01.12, 01.13, and all Settings stories
**No blockers** - Foundation story

---
