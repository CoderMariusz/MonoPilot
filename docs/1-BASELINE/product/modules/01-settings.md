# Settings Module PRD

**Epic:** 1 - Settings
**Status:** DONE (19 stories)
**Ostatnia aktualizacja:** 2025-12-09

---

## 1. Overview

### Cel modulu
Settings Module stanowi fundament calego systemu MonoPilot. Odpowiada za:
- Konfiguracje organizacji (multi-tenant)
- Zarzadzanie uzytkownikami i uprawnieniami
- Definiowanie struktury magazynowej (warehouses, locations)
- Konfiguracje infrastruktury produkcyjnej (machines, production lines)
- Master data (allergens, tax codes)
- Aktywacje modulow

### Zaleznosci
- **Brak zaleznosci** - modul bazowy
- **Zalezne od Settings:**
  - Technical (Epic 2)
  - Planning (Epic 3)
  - Production (Epic 4)
  - Warehouse (Epic 5)
  - Quality (Epic 6)
  - Shipping (Epic 7)

### Kluczowe koncepty
- **Multi-tenancy:** Kazda organizacja ma izolowane dane (org_id)
- **Role-Based Access Control:** 10 predefiniowanych rol
- **Wizard onboarding:** Krok po kroku konfiguracja organizacji
- **Soft delete:** Archiwizacja zamiast usuwania

---

## 2. User Roles & Permissions

### Macierz rol

| Rola | Opis | Poziom dostepu |
|------|------|----------------|
| `admin` | Administrator systemu | Pelny dostep |
| `manager` | Kierownik/Supervisor | Zatwierdzanie, raporty |
| `operator` | Operator produkcji | Scanner, produkcja |
| `viewer` | Tylko odczyt | Dashboard, raporty |
| `planner` | Planista | Planning module |
| `technical` | Technolog | Technical module |
| `purchasing` | Zaopatrzenie | PO, dostawcy |
| `warehouse` | Magazynier | Warehouse module |
| `qc` | Kontrola jakosci | Quality module |
| `finance` | Finanse | Finance module (future) |

### Macierz uprawnien Settings

| Funkcja | admin | manager | operator | viewer |
|---------|-------|---------|----------|--------|
| Organization CRUD | RWD | R | - | R |
| User CRUD | RWD | R | - | - |
| Warehouse CRUD | RWD | RW | R | R |
| Location CRUD | RWD | RW | R | R |
| Machine CRUD | RWD | RW | R | R |
| Production Line CRUD | RWD | RW | R | R |
| Allergen CRUD | RWD | RW | - | R |
| Tax Code CRUD | RWD | RW | - | R |
| Module Activation | RWD | - | - | - |
| Dashboard | R | R | R | R |

*R = Read, W = Write, D = Delete*

---

## 3. Settings Configuration

### Organization Settings

```json
{
  "company_name": "string (required, min 2 chars)",
  "logo_url": "string (optional)",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "country": "string",
  "nip_vat": "string",
  "fiscal_year_start": "date",
  "date_format": "DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD",
  "number_format": "1,234.56 | 1.234,56",
  "unit_system": "metric | imperial",
  "timezone": "Europe/Warsaw",
  "default_currency": "PLN | EUR | USD | GBP",
  "default_language": "PL | EN",
  "modules_enabled": ["technical", "planning", "production", "warehouse"],
  "wizard_completed": "boolean",
  "wizard_progress": "jsonb"
}
```

### Module Activation Toggles

| Modul | Default | Opis |
|-------|---------|------|
| `technical` | ON | Produkty, BOM, Routingi |
| `planning` | ON | PO, TO, WO |
| `production` | ON | Wykonanie WO |
| `warehouse` | ON | LP, GRN, Movements |
| `quality` | OFF | QA, NCR, CoA |
| `shipping` | OFF | SO, Picking, Packing |
| `npd` | OFF | New Product Development |
| `finance` | OFF | Costing, Budgeting |

---

## 4. Core Entities

### 4.1 Organization

**Tabela:** `organizations`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| company_name | VARCHAR | YES | Min 2 znaki |
| logo_url | TEXT | NO | URL logo |
| address | TEXT | NO | Adres |
| city | VARCHAR | NO | Miasto |
| postal_code | VARCHAR | NO | Kod pocztowy |
| country | VARCHAR | NO | Kraj |
| nip_vat | VARCHAR | NO | NIP/VAT |
| fiscal_year_start | DATE | NO | Poczatek roku fiskalnego |
| date_format | VARCHAR | NO | Default: DD/MM/YYYY |
| number_format | VARCHAR | NO | Default: 1,234.56 |
| unit_system | VARCHAR | NO | Default: metric |
| timezone | VARCHAR | NO | Default: UTC |
| default_currency | VARCHAR | NO | Default: EUR |
| default_language | VARCHAR | NO | Default: EN |
| modules_enabled | TEXT[] | YES | Min 1 modul |
| wizard_completed | BOOLEAN | YES | Default: false |
| wizard_progress | JSONB | NO | Progress data |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

### 4.2 User

**Tabela:** `users`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Matches auth.users.id |
| org_id | UUID | FK | organizations.id |
| email | VARCHAR | YES | Email (regex validated) |
| first_name | VARCHAR | NO | Imie |
| last_name | VARCHAR | NO | Nazwisko |
| role | VARCHAR | YES | admin/manager/operator/... |
| status | VARCHAR | YES | invited/active/inactive |
| last_login_at | TIMESTAMPTZ | NO | Ostatnie logowanie |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

**Status Flow:**

```
invited → active
           ↓
       inactive
```

### 4.3 Warehouse

**Tabela:** `warehouses`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | VARCHAR | YES | Unique per org, A-Z0-9- |
| name | VARCHAR | YES | 1-100 chars |
| address | TEXT | NO | Adres magazynu |
| city | VARCHAR | NO | Miasto |
| postal_code | VARCHAR | NO | Kod pocztowy |
| country | VARCHAR | NO | Kraj |
| default_receiving_location_id | UUID | FK | locations.id |
| default_shipping_location_id | UUID | FK | locations.id |
| transit_location_id | UUID | FK | locations.id |
| is_active | BOOLEAN | YES | Default: true |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

### 4.4 Location

**Tabela:** `locations`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| warehouse_id | UUID | FK | warehouses.id |
| code | VARCHAR | YES | Unique per warehouse |
| name | VARCHAR | YES | Display name |
| type | VARCHAR | YES | receiving/production/storage/shipping/transit/quarantine |
| zone | VARCHAR | NO | Optional zone |
| zone_enabled | BOOLEAN | YES | Default: false |
| capacity | NUMERIC | NO | Storage capacity |
| capacity_enabled | BOOLEAN | YES | Default: false |
| barcode | VARCHAR | YES | Auto: LOC-{wh}-{seq} |
| is_active | BOOLEAN | YES | Default: true |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

**Location Types:**

| Type | Opis | Uzycie |
|------|------|--------|
| receiving | Przyjecia | GRN destination |
| production | Produkcja | WO input/output |
| storage | Magazyn | General storage |
| shipping | Wysylka | SO picking |
| transit | Tranzyt | TO in-progress |
| quarantine | Kwarantanna | QA holds |

### 4.5 Machine

**Tabela:** `machines`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | VARCHAR | YES | Unique per org, A-Z0-9- |
| name | VARCHAR | YES | 1-100 chars |
| status | VARCHAR | YES | active/down/maintenance |
| capacity_per_hour | NUMERIC | NO | Units/hour (> 0) |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

**Status Flow:**

```
active ↔ down ↔ maintenance
```

### 4.6 Production Line

**Tabela:** `production_lines`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | VARCHAR | YES | Unique per org, A-Z0-9- |
| name | VARCHAR | YES | 1-100 chars |
| warehouse_id | UUID | FK | warehouses.id |
| default_output_location_id | UUID | FK | locations.id |
| created_by | UUID | FK | users.id |
| updated_by | UUID | FK | users.id |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

### 4.7 Allergen

**Tabela:** `allergens`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | VARCHAR | YES | Unique per org |
| name | VARCHAR | YES | Display name |
| is_major | BOOLEAN | YES | True for EU14 |
| is_custom | BOOLEAN | YES | False for EU, true for custom |
| created_at | TIMESTAMPTZ | NO | Auto |
| updated_at | TIMESTAMPTZ | NO | Auto |

**EU14 Allergens (seeded):**
MILK, EGGS, FISH, CRUSTACEANS, TREE_NUTS, PEANUTS, WHEAT, SOY, CELERY, MUSTARD, SESAME, SULPHITES, LUPIN, MOLLUSCS

### 4.8 Tax Code

**Tabela:** `tax_codes`

| Pole | Typ | Required | Opis |
|------|-----|----------|------|
| id | UUID | PK | Primary key |
| org_id | UUID | FK | organizations.id |
| code | VARCHAR | YES | Unique per org, A-Z0-9- |
| description | VARCHAR | YES | 1-200 chars |
| rate | NUMERIC | YES | 0.00-100.00 |
| created_at | TIMESTAMPTZ | YES | Auto |
| updated_at | TIMESTAMPTZ | YES | Auto |

---

## 5. Workflows

### 5.1 Desktop Workflows

#### Onboarding Wizard

```
Step 1: Company Info
    → company_name, address, country, timezone
    ↓
Step 2: Default Settings
    → currency, date_format, number_format
    ↓
Step 3: First Warehouse
    → warehouse code, name, address
    ↓
Step 4: Invite Users
    → email, role selection
    ↓
Complete → wizard_completed = true
```

#### User Invitation Flow

```
Admin creates invitation
    ↓
Email sent to user
    ↓
User clicks link
    ↓
User sets password
    ↓
User status: invited → active
    ↓
User can login
```

### 5.2 Scanner Workflows

**Brak scanner workflows w Settings Module**

---

## 6. Database Tables

### Schema Summary

| Tabela | Rows | RLS | Opis |
|--------|------|-----|------|
| organizations | 4 | YES | Multi-tenant root |
| users | 5 | YES | User accounts |
| user_invitations | 0 | YES | Pending invitations |
| user_sessions | 0 | NO | Session management |
| warehouses | 3 | YES | Storage locations |
| locations | 9 | YES | Warehouse sub-locations |
| machines | 3 | YES | Production machines |
| production_lines | 3 | YES | Production lines |
| allergens | 1 | YES | EU14 + custom |
| tax_codes | 4 | YES | VAT/tax rates |
| activity_logs | 2 | YES | Dashboard feed |

### Indexes

```sql
-- Organizations
CREATE INDEX organizations_pkey ON organizations(id);

-- Users
CREATE INDEX users_pkey ON users(id);
CREATE INDEX users_org_id_idx ON users(org_id);
CREATE INDEX users_email_idx ON users(email);

-- Warehouses
CREATE INDEX warehouses_pkey ON warehouses(id);
CREATE INDEX warehouses_org_id_idx ON warehouses(org_id);
CREATE UNIQUE INDEX warehouses_org_code_unique ON warehouses(org_id, code);

-- Locations
CREATE INDEX locations_pkey ON locations(id);
CREATE UNIQUE INDEX locations_org_warehouse_code_unique ON locations(org_id, warehouse_id, code);
CREATE UNIQUE INDEX locations_barcode_unique ON locations(barcode);
```

### RLS Policies

```sql
-- Standard tenant isolation
CREATE POLICY "{table}_tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

---

## 7. API Endpoints

### Organizations

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/organizations | Get current org |
| PUT | /api/organizations | Update org settings |
| POST | /api/organizations/wizard | Save wizard progress |

### Users

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/users | List org users |
| POST | /api/users/invite | Create invitation |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Deactivate user |

### Warehouses

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/settings/warehouses | List warehouses |
| GET | /api/settings/warehouses/:id | Get warehouse |
| POST | /api/settings/warehouses | Create warehouse |
| PUT | /api/settings/warehouses/:id | Update warehouse |
| DELETE | /api/settings/warehouses/:id | Archive warehouse |

### Locations

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/settings/locations | List locations |
| GET | /api/settings/locations/:id | Get location |
| POST | /api/settings/locations | Create location |
| PUT | /api/settings/locations/:id | Update location |
| DELETE | /api/settings/locations/:id | Archive location |

### Machines

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/settings/machines | List machines |
| POST | /api/settings/machines | Create machine |
| PUT | /api/settings/machines/:id | Update machine |
| DELETE | /api/settings/machines/:id | Archive machine |

### Production Lines

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/settings/production-lines | List lines |
| POST | /api/settings/production-lines | Create line |
| PUT | /api/settings/production-lines/:id | Update line |
| DELETE | /api/settings/production-lines/:id | Archive line |

### Allergens

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/settings/allergens | List allergens |
| POST | /api/settings/allergens | Create custom allergen |
| PUT | /api/settings/allergens/:id | Update allergen |

### Tax Codes

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | /api/settings/tax-codes | List tax codes |
| POST | /api/settings/tax-codes | Create tax code |
| PUT | /api/settings/tax-codes/:id | Update tax code |
| DELETE | /api/settings/tax-codes/:id | Archive tax code |

---

## 8. Functional Requirements

| ID | Opis | Priority | Status |
|----|------|----------|--------|
| FR-SET-01 | Admin moze skonfigurowac organizacje | Must Have | DONE |
| FR-SET-02 | System wspiera multi-tenancy z izolacja org_id | Must Have | DONE |
| FR-SET-03 | Admin moze zapraszac uzytkownikow przez email | Must Have | DONE |
| FR-SET-04 | System wspiera 10 predefiniowanych rol | Must Have | DONE |
| FR-SET-05 | Admin moze CRUD warehouses | Must Have | DONE |
| FR-SET-06 | Admin moze CRUD locations w warehouse | Must Have | DONE |
| FR-SET-07 | Admin moze CRUD machines | Must Have | DONE |
| FR-SET-08 | Admin moze CRUD production lines | Must Have | DONE |
| FR-SET-09 | System seeduje 14 EU allergens per org | Must Have | DONE |
| FR-SET-10 | Admin moze dodawac custom allergens | Should Have | DONE |
| FR-SET-11 | Admin moze CRUD tax codes | Must Have | DONE |
| FR-SET-12 | Admin moze wlaczac/wylaczac moduly | Must Have | DONE |
| FR-SET-13 | System wyswietla dashboard z activity feed | Should Have | DONE |
| FR-SET-14 | Warehouse ma default receiving/shipping locations | Should Have | DONE |
| FR-SET-15 | Location ma auto-generated barcode | Must Have | DONE |
| FR-SET-16 | System wspiera wizard onboarding | Should Have | DONE |
| FR-SET-17 | User invitation expires after 7 days | Should Have | DONE |
| FR-SET-18 | Cache warehouse list z 5-min TTL | Should Have | DONE |
| FR-SET-19 | System loguje user activity | Should Have | DONE |

---

## 9. Integration Points

### Internal Integrations

| Modul | Integracja | Opis |
|-------|------------|------|
| Technical | products → org_id | Produkty per organizacja |
| Planning | suppliers → org_id | Dostawcy per organizacja |
| Planning | purchase_orders → warehouse_id | PO target warehouse |
| Production | work_orders → production_line_id | WO execution line |
| Warehouse | license_plates → location_id | LP location tracking |
| All | activity_logs | Dashboard feed |

### External Integrations

| System | Typ | Status |
|--------|-----|--------|
| Supabase Auth | JWT-based auth | DONE |
| SendGrid | Email invitations | DONE |
| Upstash Redis | Caching | DONE |

---

## 10. Story Map

### Epic 1 Stories (19 total - ALL DONE)

| Story | Tytul | Status |
|-------|-------|--------|
| 1.1 | Organization CRUD + wizard | DONE |
| 1.2 | User listing and management | DONE |
| 1.3 | User invitation system | DONE |
| 1.4 | Session management | DONE |
| 1.5 | Warehouse configuration | DONE |
| 1.6 | Location management | DONE |
| 1.7 | Machine configuration | DONE |
| 1.8 | Production line setup | DONE |
| 1.9 | Allergen management | DONE |
| 1.10 | Tax code configuration | DONE |
| 1.11 | Module activation | DONE |
| 1.12 | Organization settings | DONE |
| 1.13 | Dashboard layout | DONE |
| 1.14 | User role management | DONE |
| 1.15 | Activity feed | DONE |
| 1.16 | Warehouse default locations | DONE |
| 1.17 | Location barcode generation | DONE |
| 1.18 | Cache implementation | DONE |
| 1.19 | Multi-tenant RLS policies | DONE |

---

## 11. Version History

| Wersja | Data | Opis |
|--------|------|------|
| 1.0 | 2025-12-09 | Initial PRD based on discovery |

---

## 12. Services Reference

**Key service files:**
- `apps/frontend/lib/services/warehouse-service.ts`
- `apps/frontend/lib/services/location-service.ts`
- `apps/frontend/lib/services/machine-service.ts`
- `apps/frontend/lib/services/production-line-service.ts`
- `apps/frontend/lib/services/allergen-service.ts`
- `apps/frontend/lib/services/tax-code-service.ts`
- `apps/frontend/lib/services/invitation-service.ts`
- `apps/frontend/lib/services/wizard-service.ts`
- `apps/frontend/lib/services/module-service.ts`
- `apps/frontend/lib/services/dashboard-service.ts`
