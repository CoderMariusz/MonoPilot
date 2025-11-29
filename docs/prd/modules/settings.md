# Settings Module - PRD Specification

**Status:** To Be Implemented (Clean Slate)
**Priority:** P0 - Foundation Module (Must be first)
**Effort Estimate:** 2-3 weeks

---

## Overview

Settings module jest fundamentem systemu - konfiguruje organizację przed użyciem innych modułów. Podzielony na 5 logicznych sekcji dla lepszego UX (nie 70 opcji na jednym ekranie).

## Dependencies

- **Requires:** None (foundation module)
- **Required by:** All other modules
- **Shared services:** RLS (org_id), Auth (Supabase)

---

## UI Structure

```
/settings
├── /organization          → Dane firmy, units, formats
├── /users                  → Users, roles, sessions, invitations
├── /warehouses             → Warehouses, locations, defaults
├── /production             → Machines, lines, allergens, tax codes
└── /modules                → Enabled modules, subscription, billing
```

---

## Sekcja 1: Organization Settings

**Route:** `/settings/organization`

### 1.1 Basic Organization Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `company_name` | string | Yes | Nazwa firmy |
| `logo` | file (image) | No | Logo firmy (upload, max 2MB) |
| `street_address` | string | Yes | Ulica i numer |
| `city` | string | Yes | Miasto |
| `postal_code` | string | Yes | Kod pocztowy |
| `country` | enum | Yes | Kraj (wybór z listy) |
| `nip_vat_number` | string | No | NIP/VAT number |
| `timezone` | enum | Yes | Strefa czasowa (np. Europe/Warsaw) |
| `default_currency` | enum | Yes | Waluta (PLN, EUR, USD, GBP) |
| `default_language` | enum | Yes | Język (PL, EN) |

### 1.2 Business Settings

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fiscal_year_start` | enum | Yes | Początek roku fiskalnego (January, April, July, October) |
| `date_format` | enum | Yes | Format daty (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD) |
| `number_format` | enum | Yes | Format liczb (1 000,00 vs 1,000.00) |
| `unit_system` | enum | Yes | System jednostek (Metric: L/KG/M, Imperial: gal/lb/ft) |

### 1.3 UI Behavior

- Single form with sections (collapsible)
- Save button at bottom
- Validation on blur
- Success toast on save

---

## Sekcja 2: Users & Roles

**Route:** `/settings/users`

### 2.1 User Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | Email (login) |
| `first_name` | string | Yes | Imię |
| `last_name` | string | Yes | Nazwisko |
| `role` | enum | Yes | Rola (10 ról - patrz poniżej) |
| `status` | enum | Yes | Status: Active, Inactive, Invited |

### 2.2 Roles (10 total)

| Role | Code | Description |
|------|------|-------------|
| Admin | `admin` | Pełny dostęp do wszystkiego |
| Manager | `manager` | Dostęp do wszystkich modułów, bez zmian settings |
| Operator | `operator` | Wykonywanie produkcji, konsumpcja materiałów |
| Viewer | `viewer` | Tylko odczyt wszystkich modułów |
| Planner | `planner` | PO, TO, WO - tworzenie i edycja |
| Technical | `technical` | Products, BOMs, routings |
| Purchasing | `purchasing` | PO, suppliers, receiving |
| Warehouse | `warehouse` | Tylko operacje magazynowe (LP, moves, pallets) |
| QC | `qc` | Tylko quality (inspections, QA status, NCR) |
| Finance | `finance` | Koszty, margin analysis, billing |

### 2.3 Sessions Management

| Feature | Description |
|---------|-------------|
| Active sessions list | Lista urządzeń z aktywną sesją |
| Logout from all devices | Wyloguj ze wszystkich urządzeń |
| Last login time | Data i czas ostatniego logowania |

### 2.4 Invitations

| Feature | Description |
|---------|-------------|
| Invite by email | Wyślij zaproszenie na email |
| QR code invitation | Generuj QR code do zeskanowania (mobile onboarding) |
| Pending invitations | Lista oczekujących zaproszeń |
| Resend invitation | Wyślij ponownie |
| Cancel invitation | Anuluj zaproszenie |

### 2.5 UI Components

- Users table with search, filter by role/status
- Add User modal (form)
- Edit User drawer (slide-in)
- Sessions tab per user
- Invitation management tab

---

## Sekcja 3: Warehouses & Locations

**Route:** `/settings/warehouses`

### 3.1 Warehouse Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod magazynu (np. WH-01) |
| `name` | string | Yes | Nazwa (np. "Magazyn Główny") |
| `address` | string | No | Adres magazynu |
| `default_receiving_location_id` | FK | Yes | Domyślna lokacja przyjęć |
| `default_shipping_location_id` | FK | Yes | Domyślna lokacja wysyłek |
| `transit_location_id` | FK | Yes | Lokacja tranzytowa (dla TO) |
| `is_active` | boolean | Yes | Czy aktywny |

### 3.2 Location Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod lokacji (np. LOC-A01) |
| `name` | string | Yes | Nazwa (np. "Strefa przyjęć") |
| `warehouse_id` | FK | Yes | Magazyn nadrzędny |
| `type` | enum | Yes | Typ: Receiving, Production, Storage, Shipping, Transit, Quarantine |
| `type_enabled` | boolean | Yes | Flag: czy typ jest używany |
| `zone` | string | No | Strefa (np. "A", "B", "Cold") |
| `zone_enabled` | boolean | Yes | Flag: czy zone jest używany |
| `capacity` | number | No | Pojemność (units) |
| `capacity_enabled` | boolean | Yes | Flag: czy capacity jest używany |
| `barcode` | string | Yes | Kod kreskowy lokacji (auto-generated) |
| `is_active` | boolean | Yes | Czy aktywna |

### 3.3 Default Locations (per Warehouse)

| Operation | Setting | Description |
|-----------|---------|-------------|
| PO Receiving | `default_receiving_location_id` | Gdzie trafiają towary z PO |
| TO Receiving | `default_receiving_location_id` | Gdzie trafiają towary z TO |
| Production Output | `default_production_output_location_id` | Gdzie trafiają wyprodukowane LP |
| Shipping Staging | `default_shipping_location_id` | Skąd wysyłamy |

### 3.4 UI Components

- Warehouse list (cards or table)
- Locations table per warehouse (nested)
- Add/Edit Warehouse modal
- Add/Edit Location modal
- Drag-and-drop reorder locations (optional)

---

## Sekcja 4: Production Settings

**Route:** `/settings/production`

### 4.1 Machines

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod maszyny (np. MIX-01) |
| `name` | string | Yes | Nazwa (np. "Mikser główny") |
| `line_ids` | FK[] | No | Przypisane linie (jedna lub wiele) |
| `status` | enum | Yes | Status: Active, Down, Maintenance |
| `capacity_per_hour` | number | No | Wydajność (units/hour) |

### 4.2 Production Lines

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod linii (np. LINE-01) |
| `name` | string | Yes | Nazwa (np. "Linia piekarnicza") |
| `warehouse_id` | FK | Yes | Magazyn |
| `default_output_location_id` | FK | No | Domyślna lokacja outputu |
| `machine_ids` | FK[] | No | Przypisane maszyny |

### 4.3 Allergens

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod (np. MILK) |
| `name` | string | Yes | Nazwa (np. "Mleko") |
| `is_major` | boolean | Yes | Czy główny alergen (14 EU) |
| `is_custom` | boolean | Yes | Czy dodany przez usera |

**Preloaded:** 14 EU major allergens (Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame, Mustard, Celery, Lupin, Sulphites, Molluscs)

**Custom:** User może dodać własne alergeny

### 4.4 Tax Codes

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Kod (np. VAT23) |
| `description` | string | Yes | Opis (np. "VAT 23%") |
| `rate` | number | Yes | Stawka % (np. 23.00) |

**Preloaded by country:**

- **Poland:** VAT 23%, VAT 8%, VAT 5%, VAT 0%
- **UK:** Standard 20%, Reduced 5%, Zero 0%
- **Other countries:** User musi wpisać ręcznie

### 4.5 UI Components

- Tabs: Machines | Lines | Allergens | Tax Codes
- Tables with CRUD actions
- Line-Machine assignment (drag-drop or multi-select)

---

## Sekcja 5: Modules & Subscription

**Route:** `/settings/modules`

### 5.1 Module Activation

| Module | Code | Description | Default |
|--------|------|-------------|---------|
| Technical | `technical` | Products, BOMs, Routings | On |
| Planning | `planning` | PO, TO, WO | On |
| Production | `production` | WO execution, consumption | On |
| Warehouse | `warehouse` | Scanner, LP, Pallets | On |
| Quality | `quality` | Inspections, QA, NCR | Off |
| Shipping | `shipping` | Shipping orders, BOL | Off |
| NPD | `npd` | New Product Development | Off |
| Finance | `finance` | Costing, margins (Phase 4) | Off |

**UI:** Toggle switches per module, only Admin can change

### 5.2 Subscription Management

| Feature | Description |
|---------|-------------|
| Current tier | Starter / Growth / Enterprise |
| Tier comparison | What's included in each tier |
| Upgrade/Downgrade | Change subscription (instant upgrade, end-of-period downgrade) |
| Billing info | Payment method, billing address |
| Payment history | List of invoices with download |
| Cancel subscription | Cancel with data retention period |

### 5.3 UI Components

- Module grid with toggles
- Subscription card (current tier, renewal date)
- Upgrade modal with tier comparison
- Billing settings form
- Invoice history table

---

## Functional Requirements

### FR-SET-001: Organization Configuration
- **Priority:** MVP
- **Description:** Configure basic organization data, business settings, and unit system
- **Acceptance Criteria:**
  - User can set company name, logo, address, NIP/VAT
  - User can select timezone, currency, language
  - User can select unit system (Metric/Imperial)
  - User can set date/number formats
  - Changes saved immediately with validation

### FR-SET-002: User Management
- **Priority:** MVP
- **Description:** CRUD operations for users with 10 roles
- **Acceptance Criteria:**
  - Admin can create, edit, deactivate users
  - Admin can assign one of 10 roles
  - Users can be invited by email or QR code
  - Pending invitations can be resent or cancelled
  - Sessions can be viewed and terminated

### FR-SET-003: Session Management
- **Priority:** MVP
- **Description:** View and manage active user sessions
- **Acceptance Criteria:**
  - User can see list of active sessions
  - User can logout from all devices
  - Last login time displayed
  - Admin can terminate any user's sessions

### FR-SET-004: Warehouse Configuration
- **Priority:** MVP
- **Description:** Define warehouses with default locations
- **Acceptance Criteria:**
  - User can create warehouses with code, name, address
  - User must set default receiving/shipping/transit locations
  - Warehouses can be activated/deactivated

### FR-SET-005: Location Management
- **Priority:** MVP
- **Description:** Define locations within warehouses with optional features
- **Acceptance Criteria:**
  - User can create locations with code, name, type
  - Zone field with enable/disable flag
  - Capacity field with enable/disable flag
  - Barcode auto-generated
  - Locations can be activated/deactivated

### FR-SET-006: Machine Configuration
- **Priority:** MVP
- **Description:** Define production machines with line assignments
- **Acceptance Criteria:**
  - User can create machines with code, name
  - Machine can be assigned to one OR multiple lines
  - Machine status: Active, Down, Maintenance
  - Optional capacity (units/hour)

### FR-SET-007: Production Line Configuration
- **Priority:** MVP
- **Description:** Define production lines with machine assignments
- **Acceptance Criteria:**
  - User can create lines with code, name, warehouse
  - Lines can have machines assigned
  - Default output location per line

### FR-SET-008: Allergen Management
- **Priority:** MVP
- **Description:** Manage allergen library with custom additions
- **Acceptance Criteria:**
  - 14 EU major allergens preloaded
  - User can add custom allergens
  - Custom allergens marked as `is_custom`

### FR-SET-009: Tax Code Configuration
- **Priority:** MVP
- **Description:** Manage tax codes with country-based preloads
- **Acceptance Criteria:**
  - Tax codes preloaded based on country (Poland, UK)
  - User can add custom tax codes
  - Tax code has code, description, rate %

### FR-SET-010: Module Activation
- **Priority:** MVP
- **Description:** Toggle modules on/off per organization
- **Acceptance Criteria:**
  - Admin can enable/disable modules
  - UI hides disabled modules
  - API returns 403 for disabled module endpoints

### FR-SET-011: Subscription Management
- **Priority:** Growth (Phase 2-3)
- **Description:** Self-service subscription tier management
- **Acceptance Criteria:**
  - User can view current tier
  - User can upgrade/downgrade
  - User can manage billing info
  - User can view invoice history

---

## Database Tables

### organizations
```sql
- id UUID PK
- company_name TEXT NOT NULL
- logo_url TEXT
- street_address TEXT
- city TEXT
- postal_code TEXT
- country TEXT NOT NULL
- nip_vat_number TEXT
- timezone TEXT NOT NULL DEFAULT 'UTC'
- default_currency TEXT NOT NULL DEFAULT 'PLN'
- default_language TEXT NOT NULL DEFAULT 'PL'
- fiscal_year_start TEXT NOT NULL DEFAULT 'January'
- date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY'
- number_format TEXT NOT NULL DEFAULT '1 000,00'
- unit_system TEXT NOT NULL DEFAULT 'metric'
- modules_enabled TEXT[] DEFAULT '{technical,planning,production,warehouse}'
- subscription_tier TEXT DEFAULT 'starter'
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### users
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- email TEXT UNIQUE NOT NULL
- first_name TEXT NOT NULL
- last_name TEXT NOT NULL
- role TEXT NOT NULL
- status TEXT NOT NULL DEFAULT 'invited'
- last_login_at TIMESTAMPTZ
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### user_sessions
```sql
- id UUID PK
- user_id UUID FK NOT NULL
- device_info TEXT
- ip_address TEXT
- login_time TIMESTAMPTZ
- last_activity TIMESTAMPTZ
- is_active BOOLEAN DEFAULT true
```

### user_invitations
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- email TEXT NOT NULL
- role TEXT NOT NULL
- invited_by UUID FK
- qr_code TEXT
- status TEXT DEFAULT 'pending'
- expires_at TIMESTAMPTZ
- created_at TIMESTAMPTZ
```

### warehouses
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- address TEXT
- default_receiving_location_id UUID FK
- default_shipping_location_id UUID FK
- transit_location_id UUID FK
- default_production_output_location_id UUID FK
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### locations
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- warehouse_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- type TEXT NOT NULL
- type_enabled BOOLEAN DEFAULT true
- zone TEXT
- zone_enabled BOOLEAN DEFAULT false
- capacity NUMERIC
- capacity_enabled BOOLEAN DEFAULT false
- barcode TEXT UNIQUE
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### machines
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- status TEXT NOT NULL DEFAULT 'active'
- capacity_per_hour NUMERIC
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### production_lines
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- warehouse_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- default_output_location_id UUID FK
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### machine_line_assignments
```sql
- id UUID PK
- machine_id UUID FK NOT NULL
- line_id UUID FK NOT NULL
- created_at TIMESTAMPTZ
```

### allergens
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- name TEXT NOT NULL
- is_major BOOLEAN DEFAULT false
- is_custom BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ
```

### tax_codes
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- code TEXT NOT NULL
- description TEXT NOT NULL
- rate NUMERIC NOT NULL
- created_at TIMESTAMPTZ
```

---

## API Endpoints

### Organization
- `GET /api/settings/organization` - Get org settings
- `PUT /api/settings/organization` - Update org settings
- `POST /api/settings/organization/logo` - Upload logo

### Users
- `GET /api/settings/users` - List users
- `POST /api/settings/users` - Create user
- `PUT /api/settings/users/:id` - Update user
- `DELETE /api/settings/users/:id` - Deactivate user
- `GET /api/settings/users/:id/sessions` - Get user sessions
- `DELETE /api/settings/users/:id/sessions` - Terminate all sessions

### Invitations
- `GET /api/settings/invitations` - List pending invitations
- `POST /api/settings/invitations` - Send invitation
- `POST /api/settings/invitations/:id/resend` - Resend invitation
- `DELETE /api/settings/invitations/:id` - Cancel invitation
- `GET /api/settings/invitations/:id/qr` - Get QR code

### Warehouses
- `GET /api/settings/warehouses` - List warehouses
- `POST /api/settings/warehouses` - Create warehouse
- `PUT /api/settings/warehouses/:id` - Update warehouse
- `DELETE /api/settings/warehouses/:id` - Delete warehouse

### Locations
- `GET /api/settings/locations` - List locations (filter by warehouse)
- `POST /api/settings/locations` - Create location
- `PUT /api/settings/locations/:id` - Update location
- `DELETE /api/settings/locations/:id` - Delete location

### Machines
- `GET /api/settings/machines` - List machines
- `POST /api/settings/machines` - Create machine
- `PUT /api/settings/machines/:id` - Update machine
- `DELETE /api/settings/machines/:id` - Delete machine

### Production Lines
- `GET /api/settings/lines` - List lines
- `POST /api/settings/lines` - Create line
- `PUT /api/settings/lines/:id` - Update line
- `DELETE /api/settings/lines/:id` - Delete line
- `PUT /api/settings/lines/:id/machines` - Assign machines to line

### Allergens
- `GET /api/settings/allergens` - List allergens
- `POST /api/settings/allergens` - Create custom allergen
- `PUT /api/settings/allergens/:id` - Update allergen
- `DELETE /api/settings/allergens/:id` - Delete custom allergen

### Tax Codes
- `GET /api/settings/tax-codes` - List tax codes
- `POST /api/settings/tax-codes` - Create tax code
- `PUT /api/settings/tax-codes/:id` - Update tax code
- `DELETE /api/settings/tax-codes/:id` - Delete tax code

### Modules
- `GET /api/settings/modules` - Get enabled modules
- `PUT /api/settings/modules` - Update enabled modules

---

## Notes

- **Suppliers:** Moved to Planning/MRP section (not in Settings)
- **Audit trail:** Not needed for Settings - this is configured once by IT/head business, changes only by authorized person
- **Permissions:** Only Admin role can access Settings (except viewing own profile)
