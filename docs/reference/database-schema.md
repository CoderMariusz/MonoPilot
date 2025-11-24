# MonoPilot Database Schema Documentation

**Ostatnia aktualizacja:** 2025-01-23 (automatycznie wygenerowano z Supabase via MCP)
**Cel:** Kompletna dokumentacja schematu bazy danych PostgreSQL

---

## 📋 Spis Treści

1. [Przegląd Schematu](#przegląd-schematu)
2. [Core Tables - Foundation](#core-tables---foundation)
3. [Settings Module - Epic 1](#settings-module---epic-1)
4. [Technical Module - Epic 2](#technical-module---epic-2)
5. [Planning Module - Epic 3](#planning-module---epic-3)
6. [Warehouse & Traceability](#warehouse--traceability)
7. [Enums](#enums)
8. [RLS Policies](#rls-policies)
9. [Indexes Strategy](#indexes-strategy)
10. [Foreign Key Relationships](#foreign-key-relationships)

---

## Przegląd Schematu

### Statystyki
- **Całkowita liczba tabel**: 47+ (public schema)
- **Auth tables**: 15+ (Supabase Auth schema)
- **Migracje zastosowane**: 51 plików SQL
- **Multi-tenancy**: Wszystkie tabele biznesowe z `org_id`
- **RLS**: Włączone na wszystkich tabelach public

### Konwencje
- **Primary Keys**: UUID (`gen_random_uuid()`)
- **Timestamps**: `created_at`, `updated_at` (automatyczne triggery)
- **Audit Trail**: `created_by`, `updated_by` (FK do users)
- **Soft Delete**: `deleted_at` (selected tables only)
- **Naming**: snake_case dla kolumn, PascalCase dla enums

---

## Core Tables - Foundation

### `organizations`
**Opis:** Główna tabela organizacji (multi-tenant root)
**Rows:** 4
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `company_name` | VARCHAR | NO | - | Nazwa firmy (≥2 chars) |
| `logo_url` | TEXT | YES | - | URL logo (Supabase Storage) |
| `address` | TEXT | YES | - | Adres |
| `city` | VARCHAR | YES | - | Miasto |
| `postal_code` | VARCHAR | YES | - | Kod pocztowy |
| `country` | VARCHAR | YES | - | Kraj |
| `nip_vat` | VARCHAR | YES | - | NIP/VAT number |
| `fiscal_year_start` | DATE | YES | - | Początek roku fiskalnego |
| `date_format` | VARCHAR | YES | 'DD/MM/YYYY' | Format daty (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD) |
| `number_format` | VARCHAR | YES | '1,234.56' | Format liczb |
| `unit_system` | VARCHAR | YES | 'metric' | System miar (metric, imperial) |
| `timezone` | VARCHAR | YES | 'UTC' | IANA timezone |
| `default_currency` | VARCHAR | YES | 'EUR' | Waluta (PLN, EUR, USD, GBP) |
| `default_language` | VARCHAR | YES | 'EN' | Język (PL, EN) |
| `modules_enabled` | TEXT[] | NO | `['technical', 'planning', 'production', 'warehouse']` | Włączone moduły |
| `wizard_completed` | BOOLEAN | NO | `false` | Status setup wizard |
| `wizard_progress` | JSONB | YES | - | Postęp wizard (step + data) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Data aktualizacji |

**Constraints:**
- CHECK: `char_length(company_name) >= 2`
- CHECK: `array_length(modules_enabled, 1) > 0` (co najmniej 1 moduł)

**Relationships:**
- Referenced by: `users`, `warehouses`, `products`, `boms`, `work_orders`, `purchase_orders` + 20 more

---

### `users`
**Opis:** Użytkownicy aplikacji (sync z auth.users)
**Rows:** 5
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | - | Matches auth.users.id |
| `org_id` | UUID | NO | - | FK → organizations |
| `email` | VARCHAR | NO | - | Email (regex validated) |
| `first_name` | VARCHAR | YES | - | Imię |
| `last_name` | VARCHAR | YES | - | Nazwisko |
| `role` | VARCHAR | NO | 'user' | Role: admin, manager, operator, viewer, planner, technical, purchasing, warehouse, qc, finance |
| `status` | VARCHAR | NO | 'active' | Status: invited, active, inactive |
| `last_login_at` | TIMESTAMPTZ | YES | - | Ostatnie logowanie |
| `created_by` | UUID | YES | - | FK → users (audit) |
| `updated_by` | UUID | YES | - | FK → users (audit) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Data aktualizacji |

**Constraints:**
- CHECK: `email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'` (email format)
- CHECK: `role IN ('admin', 'manager', 'operator', 'viewer', 'planner', 'technical', 'purchasing', 'warehouse', 'qc', 'finance')`
- CHECK: `status IN ('invited', 'active', 'inactive')`

**Relationships:**
- FK: `org_id` → `organizations.id`
- FK: `created_by` → `users.id`
- FK: `updated_by` → `users.id`
- Referenced by: 30+ tables (created_by, updated_by audit trail)

---

## Settings Module - Epic 1

### `warehouses`
**Opis:** Magazyny (Story 1.5)
**Rows:** 3
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Unique code per org (A-Z0-9-) |
| `name` | VARCHAR | NO | - | Display name (1-100 chars) |
| `address` | TEXT | YES | - | Adres magazynu |
| `city` | VARCHAR | YES | - | Miasto |
| `postal_code` | VARCHAR | YES | - | Kod pocztowy |
| `country` | VARCHAR | YES | - | Kraj |
| `default_receiving_location_id` | UUID | YES | - | FK → locations (receiving default) |
| `default_shipping_location_id` | UUID | YES | - | FK → locations (shipping default) |
| `transit_location_id` | UUID | YES | - | FK → locations (transit) |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `char_length(name) >= 1 AND char_length(name) <= 100`
- UNIQUE: `(org_id, code)`

---

### `locations`
**Opis:** Lokacje w magazynach (Story 1.6)
**Rows:** 9
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `warehouse_id` | UUID | NO | - | FK → warehouses |
| `code` | VARCHAR | NO | - | Code unique within warehouse |
| `name` | VARCHAR | NO | - | Display name |
| `type` | VARCHAR | NO | - | receiving, production, storage, shipping, transit, quarantine |
| `zone` | VARCHAR | YES | - | Optional zone (enabled by zone_enabled) |
| `zone_enabled` | BOOLEAN | NO | `false` | Enable zone tracking |
| `capacity` | NUMERIC | YES | - | Storage capacity (enabled by capacity_enabled) |
| `capacity_enabled` | BOOLEAN | NO | `false` | Enable capacity tracking |
| `barcode` | VARCHAR | NO | - | Auto-generated: LOC-{wh_code}-{seq} (UNIQUE) |
| `is_active` | BOOLEAN | NO | `true` | Soft delete flag |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `type IN ('receiving', 'production', 'storage', 'shipping', 'transit', 'quarantine')`
- UNIQUE: `(org_id, warehouse_id, code)`
- UNIQUE: `barcode` (global)

---

### `machines`
**Opis:** Maszyny produkcyjne (Story 1.7)
**Rows:** 3
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Unique code (A-Z0-9-) |
| `name` | VARCHAR | NO | - | Display name (1-100 chars) |
| `status` | VARCHAR | NO | 'active' | active, down, maintenance |
| `capacity_per_hour` | NUMERIC | YES | - | Units/hour (> 0 if set) |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `status IN ('active', 'down', 'maintenance')`
- CHECK: `capacity_per_hour IS NULL OR capacity_per_hour > 0`
- UNIQUE: `(org_id, code)`

---

### `production_lines`
**Opis:** Linie produkcyjne (Story 1.8)
**Rows:** 3
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Unique code (A-Z0-9-) |
| `name` | VARCHAR | NO | - | Display name (1-100 chars) |
| `warehouse_id` | UUID | NO | - | FK → warehouses (ON DELETE RESTRICT) |
| `default_output_location_id` | UUID | YES | - | FK → locations (ON DELETE SET NULL) |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `char_length(name) >= 1 AND char_length(name) <= 100`
- UNIQUE: `(org_id, code)`

---

### `allergens`
**Opis:** Alergeny (14 EU + custom) - Story 1.9
**Rows:** 1 (seeded with EU allergens)
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Code (e.g., MILK, EGGS, CUSTOM-01) |
| `name` | VARCHAR | NO | - | Display name |
| `is_major` | BOOLEAN | NO | `false` | True for 14 EU major allergens |
| `is_custom` | BOOLEAN | NO | `true` | False for EU, true for custom |
| `created_at` | TIMESTAMPTZ | YES | `now()` | - |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | - |

**Constraints:**
- UNIQUE: `(org_id, code)`

**Seed Function:** `seed_eu_allergens()` (Migration 011)

---

### `tax_codes`
**Opis:** Kody VAT/Tax (Story 1.10)
**Rows:** 4
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Unique code (A-Z0-9-) |
| `description` | VARCHAR | NO | - | Description (1-200 chars) |
| `rate` | NUMERIC | NO | - | Tax rate 0.00-100.00 (23.00 = 23%) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `char_length(description) >= 1 AND char_length(description) <= 200`
- CHECK: `rate >= 0 AND rate <= 100`
- UNIQUE: `(org_id, code)`

---

### `user_invitations`
**Opis:** Zaproszenia użytkowników (Story 1.3)
**Rows:** (brak danych)
**RLS:** Enabled

---

### `user_sessions`
**Opis:** Sesje użytkowników (Story 1.4)
**Rows:** 0
**RLS:** Disabled (managed server-side)

---

### `activity_logs`
**Opis:** Activity feed dla dashboard (Story 1.13)
**Rows:** 2
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `user_id` | UUID | NO | - | FK → users |
| `activity_type` | VARCHAR | NO | - | wo_status_change, po_approved, lp_received, etc. |
| `entity_type` | VARCHAR | NO | - | work_order, purchase_order, license_plate, etc. |
| `entity_id` | UUID | NO | - | UUID of entity (polymorphic) |
| `entity_code` | VARCHAR | NO | - | Human-readable code (WO-2024-001, PO-2024-042) |
| `description` | TEXT | NO | - | Human-readable description |
| `metadata` | JSONB | YES | - | Additional context |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `activity_type IN ('wo_status_change', 'po_created', 'lp_created', 'ncr_created', ...)`
- CHECK: `entity_type IN ('work_order', 'purchase_order', 'license_plate', ...)`

---

## Technical Module - Epic 2

### `products`
**Opis:** Katalog produktów (Stories 2.1, 2.2, 2.4)
**Rows:** (implementacja w toku)
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | TEXT | NO | - | Product code (IMMUTABLE after creation) |
| `name` | TEXT | NO | - | Product name |
| `type` | product_type | NO | - | RM, WIP, FG, PKG, BP, CUSTOM |
| `description` | TEXT | YES | - | Description |
| `category` | TEXT | YES | - | Optional category |
| `version` | NUMERIC | NO | `1.0` | Version number (auto-increment on edit) |
| `uom` | TEXT | NO | - | Unit of measure |
| `shelf_life_days` | INTEGER | YES | - | Shelf life in days |
| `min_stock_qty` | NUMERIC | YES | - | Min stock level |
| `max_stock_qty` | NUMERIC | YES | - | Max stock level |
| `reorder_point` | NUMERIC | YES | - | Reorder threshold |
| `cost_per_unit` | NUMERIC | YES | - | Unit cost |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- UNIQUE: `(org_id, code)`
- Field visibility controlled by `technical_settings.product_field_config`

---

### `product_version_history`
**Opis:** Historia wersji produktów (Story 2.3)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `product_id` | UUID | NO | - | FK → products |
| `version` | NUMERIC | NO | - | Version snapshot (1.0, 1.1, 2.0) |
| `changed_fields` | JSONB | NO | - | {"name": {"old": "X", "new": "Y"}} |
| `changed_by` | UUID | NO | - | FK → users |
| `changed_at` | TIMESTAMPTZ | NO | `now()` | Timestamp of change |

**Indexes:**
- `(product_id, version)` for history queries

---

### `product_allergens`
**Opis:** Alergeny przypisane do produktów (Story 2.4)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `product_id` | UUID | NO | - | FK → products |
| `allergen_id` | UUID | NO | - | FK → allergens |
| `relation_type` | VARCHAR | NO | - | 'contains' or 'may_contain' |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `relation_type IN ('contains', 'may_contain')`
- UNIQUE: `(product_id, allergen_id, relation_type)`

---

### `product_type_config`
**Opis:** Konfiguracja typów produktów (Story 2.5)
**Rows:** 10 (5 default + custom)
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | TEXT | NO | - | Code (RM, WIP, FG, PKG, BP, CUSTOM-XX) |
| `name` | TEXT | NO | - | Display name |
| `is_default` | BOOLEAN | NO | `false` | True for built-in 5 types |
| `is_active` | BOOLEAN | NO | `true` | Active flag |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- UNIQUE: `(org_id, code)`

---

### `boms`
**Opis:** Bills of Materials - receptury (Stories 2.6, 2.8, 2.9)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `product_id` | UUID | NO | - | FK → products |
| `version` | VARCHAR | NO | - | X.Y format (1.0, 1.1, 2.0) |
| `effective_from` | DATE | NO | - | Start date of validity |
| `effective_to` | DATE | YES | - | End date (NULL = no end) |
| `status` | bom_status | NO | 'Draft' | Draft, Active, Phased Out, Inactive |
| `output_qty` | NUMERIC | NO | `1.0` | Output quantity (> 0) |
| `output_uom` | VARCHAR | NO | - | UoM for output |
| `notes` | TEXT | YES | - | Optional notes |
| `created_by` | UUID | NO | - | FK → users |
| `updated_by` | UUID | NO | - | FK → users |
| `created_at` | TIMESTAMP | NO | `now()` | - |
| `updated_at` | TIMESTAMP | NO | `now()` | - |

**Constraints:**
- CHECK: `output_qty > 0`
- UNIQUE: `(org_id, product_id, version)`
- Trigger: `check_bom_date_overlap()` (prevents overlapping dates)

---

### `bom_items`
**Opis:** Składniki BOM (Stories 2.7, 2.12, 2.13)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `bom_id` | UUID | NO | - | FK → boms (CASCADE) |
| `product_id` | UUID | NO | - | FK → products (component) |
| `quantity` | NUMERIC | NO | - | Quantity (> 0) |
| `uom` | TEXT | NO | - | Unit of measure |
| `scrap_percent` | NUMERIC | NO | `0` | Scrap % (0-100) |
| `sequence` | INTEGER | NO | - | Display order (drag-drop) |
| `consume_whole_lp` | BOOLEAN | NO | `false` | Consume entire license plate |
| `is_by_product` | BOOLEAN | NO | `false` | True if output by-product |
| `yield_percent` | NUMERIC | YES | - | By-product yield % (if is_by_product) |
| `condition_flags` | TEXT[] | YES | - | Conditional flags ['organic', 'vegan'] |
| `condition_logic` | TEXT | YES | - | AND or OR |
| `notes` | TEXT | YES | - | Optional notes |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `quantity > 0`
- CHECK: `scrap_percent >= 0 AND scrap_percent <= 100`
- CHECK: `sequence > 0`
- CHECK: `condition_logic IN ('AND', 'OR')`

---

### `routings`
**Opis:** Procesy produkcyjne (Story 2.15)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Unique code (A-Z0-9-) |
| `name` | VARCHAR | NO | - | Display name (1-100 chars) |
| `description` | TEXT | YES | - | Optional description |
| `status` | VARCHAR | NO | 'active' | active, inactive |
| `is_reusable` | BOOLEAN | NO | `true` | If true, can assign to multiple products |
| `created_by` | UUID | YES | - | FK → users |
| `updated_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `char_length(name) >= 1 AND char_length(name) <= 100`
- CHECK: `status IN ('active', 'inactive')`
- UNIQUE: `(org_id, code)`

---

### `routing_operations`
**Opis:** Operacje w routingu (Story 2.16)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `routing_id` | UUID | NO | - | FK → routings (CASCADE) |
| `sequence` | INTEGER | NO | - | Execution order (1, 2, 3...) |
| `operation_name` | VARCHAR | NO | - | Operation name (1-100 chars) |
| `machine_id` | UUID | YES | - | FK → machines (SET NULL) |
| `line_id` | UUID | YES | - | FK → production_lines (SET NULL) |
| `expected_duration_minutes` | INTEGER | NO | - | Duration in minutes (> 0) |
| `expected_yield_percent` | NUMERIC | NO | `100.00` | Yield % (0.01-100.00) |
| `setup_time_minutes` | INTEGER | YES | `0` | Setup time in minutes (≥ 0) |
| `labor_cost` | NUMERIC | YES | - | Optional labor cost (≥ 0) |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `sequence > 0`
- CHECK: `char_length(operation_name) >= 1 AND char_length(operation_name) <= 100`
- CHECK: `expected_duration_minutes > 0`
- CHECK: `expected_yield_percent > 0 AND expected_yield_percent <= 100`
- CHECK: `setup_time_minutes >= 0`
- CHECK: `labor_cost IS NULL OR labor_cost >= 0`
- UNIQUE: `(routing_id, sequence)`

---

### `product_routings`
**Opis:** Many-to-many routings ↔ products (Story 2.17)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `product_id` | UUID | NO | - | FK → products |
| `routing_id` | UUID | NO | - | FK → routings (CASCADE) |
| `is_default` | BOOLEAN | NO | `false` | Default routing for product (1 per product) |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- UNIQUE: `(product_id, routing_id)`
- Business logic: Only one `is_default=true` per product

---

### `technical_settings`
**Opis:** Ustawienia modułu Technical (Story 2.22)
**Rows:** 2
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `org_id` | UUID | NO | - | Primary key + FK → organizations |
| `product_field_config` | JSONB | NO | `{...}` | Field visibility/mandatory toggles |
| `max_bom_versions` | INTEGER | YES | - | Max BOM versions per product |
| `use_conditional_flags` | BOOLEAN | YES | `false` | Enable conditional BOM items |
| `conditional_flags` | JSONB | YES | `[...]` | List of conditional flags |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_by` | UUID | YES | - | FK → users |

**Default product_field_config:**
```json
{
  "category": {"visible": true, "mandatory": false},
  "cost_per_unit": {"visible": true, "mandatory": false},
  "max_stock_qty": {"visible": true, "mandatory": false},
  "min_stock_qty": {"visible": true, "mandatory": false},
  "reorder_point": {"visible": true, "mandatory": false},
  "shelf_life_days": {"visible": true, "mandatory": false}
}
```

**Default conditional_flags:**
```json
["organic", "gluten_free", "vegan", "kosher", "halal", "dairy_free", "nut_free", "soy_free"]
```

---

## Planning Module - Epic 3

### `suppliers`
**Opis:** Dostawcy (Story 3.17)
**Rows:** 4
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `code` | VARCHAR | NO | - | Unique code (A-Z0-9-) |
| `name` | VARCHAR | NO | - | Supplier name |
| `contact_person` | VARCHAR | YES | - | Contact person |
| `email` | VARCHAR | YES | - | Email (regex validated) |
| `phone` | VARCHAR | YES | - | Phone |
| `address` | TEXT | YES | - | Address |
| `city` | VARCHAR | YES | - | City |
| `postal_code` | VARCHAR | YES | - | Postal code |
| `country` | VARCHAR | YES | - | Country |
| `currency` | VARCHAR | NO | - | PLN, EUR, USD, GBP |
| `tax_code_id` | UUID | NO | - | FK → tax_codes |
| `payment_terms` | VARCHAR | NO | - | Payment terms (e.g., Net 30) |
| `lead_time_days` | INTEGER | NO | `7` | Default lead time (≥ 0) |
| `moq` | NUMERIC | YES | - | Min Order Quantity (> 0 if set) |
| `is_active` | BOOLEAN | NO | `true` | Active flag |
| `created_by` | UUID | NO | - | FK → users |
| `updated_by` | UUID | NO | - | FK → users |
| `created_at` | TIMESTAMPTZ | YES | `now()` | - |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | - |

**Constraints:**
- CHECK: `code ~ '^[A-Z0-9-]+$'`
- CHECK: `email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
- CHECK: `currency IN ('PLN', 'EUR', 'USD', 'GBP')`
- CHECK: `lead_time_days >= 0`
- CHECK: `moq IS NULL OR moq > 0`
- UNIQUE: `(org_id, code)`

---

### `supplier_products`
**Opis:** Produkty dostawcy + default supplier (Story 3.17)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `supplier_id` | UUID | NO | - | FK → suppliers |
| `product_id` | UUID | NO | - | FK → products |
| `is_default` | BOOLEAN | NO | `false` | Default supplier for this product |
| `supplier_product_code` | VARCHAR | YES | - | Supplier's code for this product |
| `unit_price` | NUMERIC | YES | - | Price per unit (≥ 0) |
| `lead_time_days` | INTEGER | YES | - | Lead time (≥ 0) |
| `moq` | NUMERIC | YES | - | MOQ (> 0 if set) |
| `created_at` | TIMESTAMPTZ | YES | `now()` | - |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | - |

**Constraints:**
- CHECK: `unit_price IS NULL OR unit_price >= 0`
- CHECK: `lead_time_days IS NULL OR lead_time_days >= 0`
- CHECK: `moq IS NULL OR moq > 0`
- UNIQUE: `(supplier_id, product_id)`
- Business logic: Only one `is_default=true` per product

---

### `purchase_orders`
**Opis:** Zamówienia zakupu (Stories 3.1-3.5)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `po_number` | VARCHAR | NO | - | Unique PO identifier |
| `supplier_id` | UUID | NO | - | FK → suppliers |
| `warehouse_id` | UUID | NO | - | FK → warehouses |
| `status` | VARCHAR | NO | - | draft, submitted, approved, receiving, closed, cancelled |
| `expected_delivery_date` | DATE | NO | - | Expected delivery |
| `actual_delivery_date` | DATE | YES | - | Actual delivery |
| `payment_terms` | VARCHAR | YES | - | Payment terms |
| `shipping_method` | VARCHAR | YES | - | Shipping method |
| `notes` | TEXT | YES | - | Notes |
| `currency` | VARCHAR | NO | - | PLN, EUR, USD, GBP |
| `subtotal` | NUMERIC | NO | - | Sum of line totals (≥ 0) |
| `tax_total` | NUMERIC | NO | - | Total tax (≥ 0) |
| `total` | NUMERIC | NO | - | Grand total (≥ 0) |
| `approved_by` | UUID | YES | - | FK → users (approver) |
| `approved_at` | TIMESTAMPTZ | YES | - | Approval timestamp |
| `created_by` | UUID | NO | - | FK → users |
| `updated_by` | UUID | NO | - | FK → users |
| `created_at` | TIMESTAMPTZ | YES | `now()` | - |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | - |

**Constraints:**
- CHECK: `currency IN ('PLN', 'EUR', 'USD', 'GBP')`
- CHECK: `subtotal >= 0`, `tax_total >= 0`, `total >= 0`
- UNIQUE: `(org_id, po_number)`

---

### `po_lines`
**Opis:** Linie zamówień zakupu (Story 3.2)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `po_id` | UUID | NO | - | FK → purchase_orders |
| `product_id` | UUID | NO | - | FK → products |
| `sequence` | INTEGER | NO | - | Line order |
| `quantity` | NUMERIC | NO | - | Quantity (> 0) |
| `uom` | VARCHAR | NO | - | Unit of measure |
| `unit_price` | NUMERIC | NO | - | Price per unit (≥ 0) |
| `discount_percent` | NUMERIC | YES | `0` | Discount % (0-100) |
| `line_subtotal` | NUMERIC | NO | - | Qty × Price (≥ 0) |
| `discount_amount` | NUMERIC | NO | `0` | Discount in currency |
| `line_total` | NUMERIC | NO | - | Subtotal - discount (≥ 0) |
| `tax_amount` | NUMERIC | NO | `0` | Tax amount (≥ 0) |
| `line_total_with_tax` | NUMERIC | NO | - | Line total + tax |
| `expected_delivery_date` | DATE | YES | - | Expected delivery |
| `received_qty` | NUMERIC | YES | `0` | Received quantity (≥ 0) |
| `created_at` | TIMESTAMPTZ | YES | `now()` | - |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | - |

**Constraints:**
- CHECK: `quantity > 0`
- CHECK: `unit_price >= 0`
- CHECK: `discount_percent >= 0 AND discount_percent <= 100`
- CHECK: `line_subtotal >= 0`, `line_total >= 0`, `tax_amount >= 0`
- CHECK: `received_qty >= 0`

---

### `po_approvals`
**Opis:** Approvals dla PO (Story 3.4)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `po_id` | UUID | NO | - | FK → purchase_orders |
| `status` | VARCHAR | NO | - | pending, approved, rejected |
| `approved_by` | UUID | YES | - | FK → users (approver) |
| `approved_at` | TIMESTAMPTZ | YES | `now()` | Approval timestamp |
| `rejection_reason` | TEXT | YES | - | Reason if rejected |
| `comments` | TEXT | YES | - | Comments |
| `created_at` | TIMESTAMPTZ | YES | `now()` | - |

**Constraints:**
- CHECK: `status IN ('pending', 'approved', 'rejected')`

---

### `planning_settings`
**Opis:** Ustawienia modułu Planning (Story 3.17+)
**Rows:** (brak danych - w implementacji)
**RLS:** Enabled

---

## Warehouse & Traceability

### `license_plates`
**Opis:** License Plates (LP) - STUB dla Epic 2, pełna implementacja w Epic 5
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `lp_number` | VARCHAR | NO | - | Unique LP identifier (e.g., LP-2024-001) |
| `batch_number` | VARCHAR | YES | - | Batch number for traceability |
| `product_id` | UUID | NO | - | FK → products |
| `quantity` | NUMERIC | NO | - | Quantity (> 0) |
| `uom` | VARCHAR | NO | - | Unit of measure |
| `status` | VARCHAR | NO | 'available' | available, consumed, shipped, quarantine, recalled |
| `location_id` | UUID | YES | - | FK → locations |
| `manufacturing_date` | DATE | YES | - | Manufacturing date |
| `expiry_date` | DATE | YES | - | Expiry date |
| `received_date` | DATE | YES | - | Received date |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `quantity > 0`
- CHECK: `status IN ('available', 'consumed', 'shipped', 'quarantine', 'recalled')`
- UNIQUE: `lp_number` (global)

---

### `lp_genealogy`
**Opis:** LP genealogy for traceability (Story 2.18-2.21)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `parent_lp_id` | UUID | YES | - | FK → license_plates (source LP) |
| `child_lp_id` | UUID | YES | - | FK → license_plates (output LP) |
| `work_order_id` | UUID | YES | - | FK → work_orders |
| `transfer_order_id` | UUID | YES | - | FK → transfer_orders |
| `relationship_type` | VARCHAR | NO | - | consumption, production, split, merge |
| `quantity_consumed` | NUMERIC | YES | - | Quantity consumed (if applicable) |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `relationship_type IN ('consumption', 'production', 'split', 'merge')`

---

### `traceability_links`
**Opis:** Links between LPs and WO/TO (immutable audit trail)
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `lp_id` | UUID | NO | - | FK → license_plates |
| `link_type` | VARCHAR | NO | - | consumption, production |
| `work_order_id` | UUID | YES | - | FK → work_orders |
| `transfer_order_id` | UUID | YES | - | FK → transfer_orders |
| `quantity` | NUMERIC | NO | - | Quantity (> 0) |
| `uom` | VARCHAR | NO | - | Unit of measure |
| `transaction_date` | TIMESTAMPTZ | NO | `now()` | Transaction timestamp |
| `location_id` | UUID | YES | - | FK → locations |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `link_type IN ('consumption', 'production')`
- CHECK: `quantity > 0`

---

### `recall_simulations`
**Opis:** Recall simulation results (Story 2.20) - immutable audit trail
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `lp_id` | UUID | YES | - | FK → license_plates |
| `batch_number` | VARCHAR | YES | - | Batch number to simulate |
| `include_shipped` | BOOLEAN | NO | `true` | Include shipped LPs |
| `include_notifications` | BOOLEAN | NO | `true` | Include customer notifications |
| `summary` | JSONB | NO | - | Summary stats (affected LPs, qty, costs, locations) |
| `forward_trace` | JSONB | NO | - | Forward trace tree |
| `backward_trace` | JSONB | NO | - | Backward trace tree |
| `regulatory_info` | JSONB | YES | - | FDA/EU compliance data |
| `execution_time_ms` | INTEGER | NO | - | Performance tracking |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |

---

### `work_orders`
**Opis:** Work Orders - STUB dla Epic 2, pełna implementacja w Epic 4
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `wo_number` | VARCHAR | NO | - | Unique WO identifier (e.g., WO-2024-001) |
| `product_id` | UUID | NO | - | FK → products |
| `planned_quantity` | NUMERIC | NO | - | Planned qty (> 0) |
| `produced_quantity` | NUMERIC | YES | `0` | Produced qty (≥ 0) |
| `uom` | VARCHAR | NO | - | Unit of measure |
| `status` | VARCHAR | NO | 'draft' | draft, released, in_progress, completed, closed, cancelled |
| `planned_start_date` | DATE | YES | - | Planned start |
| `planned_end_date` | DATE | YES | - | Planned end |
| `actual_start_date` | DATE | YES | - | Actual start |
| `actual_end_date` | DATE | YES | - | Actual end |
| `production_line_id` | UUID | YES | - | FK → machines |
| `routing_id` | UUID | YES | - | FK → routings |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `planned_quantity > 0`
- CHECK: `produced_quantity >= 0`
- CHECK: `status IN ('draft', 'released', 'in_progress', 'completed', 'closed', 'cancelled')`
- UNIQUE: `(org_id, wo_number)`

---

### `transfer_orders`
**Opis:** Transfer Orders - STUB dla Epic 2, pełna implementacja w Epic 5
**Rows:** 0
**RLS:** Enabled

#### Kolumny:
| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `org_id` | UUID | NO | - | FK → organizations |
| `to_number` | VARCHAR | NO | - | Unique TO identifier (e.g., TO-2024-001) |
| `from_location_id` | UUID | YES | - | FK → locations |
| `to_location_id` | UUID | YES | - | FK → locations |
| `status` | VARCHAR | NO | 'draft' | draft, released, in_transit, completed, cancelled |
| `planned_transfer_date` | DATE | YES | - | Planned transfer |
| `actual_transfer_date` | DATE | YES | - | Actual transfer |
| `created_by` | UUID | YES | - | FK → users |
| `created_at` | TIMESTAMPTZ | NO | `now()` | - |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | - |

**Constraints:**
- CHECK: `status IN ('draft', 'released', 'in_transit', 'completed', 'cancelled')`
- UNIQUE: `to_number` (global)

---

### `to_lines`
**Opis:** Linie transfer orders (Story 3.7)
**Rows:** 0
**RLS:** Enabled

---

### `to_line_lps`
**Opis:** License Plates assigned to TO lines (Story 3.9)
**Rows:** 0
**RLS:** Enabled

---

## Enums

### `bom_status`
```sql
CREATE TYPE bom_status AS ENUM ('Draft', 'Active', 'Phased Out', 'Inactive');
```

### `product_type`
```sql
CREATE TYPE product_type AS ENUM ('RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM');
```

**Znaczenie:**
- **RM**: Raw Material (surowiec)
- **WIP**: Work in Progress (półprodukt)
- **FG**: Finished Good (produkt gotowy)
- **PKG**: Packaging (opakowanie)
- **BP**: By-Product (produkt uboczny)
- **CUSTOM**: Custom type (typ niestandardowy)

---

## RLS Policies

**Wszystkie tabele `public` mają RLS ENABLED.**

### Standardowa polityka tenant isolation:
```sql
CREATE POLICY "{table}_tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
```

**Mechanizm:**
1. **Service role** (`SUPABASE_SERVICE_ROLE_KEY`) - bypasuje RLS
2. **Authenticated user** - wymaga `org_id` w JWT lub używa service role

**Best Practice:**
- Zawsze używaj `createServerSupabaseAdmin()` w services (service role)
- Nie polegaj na JWT `org_id` - query `public.users` table dla org_id

**Więcej:** Zobacz `docs/RLS_AND_SUPABASE_CLIENTS.md`

---

## Indexes Strategy

### High-Priority Indexes (automatycznie utworzone):

**Organizations:**
- `organizations_pkey` (id)

**Users:**
- `users_pkey` (id)
- `users_org_id_idx` (org_id)
- `users_email_idx` (email)

**Warehouses:**
- `warehouses_pkey` (id)
- `warehouses_org_id_idx` (org_id)
- `warehouses_org_code_unique` (org_id, code)

**Locations:**
- `locations_pkey` (id)
- `locations_org_warehouse_code_unique` (org_id, warehouse_id, code)
- `locations_barcode_unique` (barcode)

**Products:**
- `products_pkey` (id)
- `products_org_code_unique` (org_id, code)

**BOMs:**
- `boms_pkey` (id)
- `boms_org_product_version_unique` (org_id, product_id, version)
- `boms_product_id_idx` (product_id)
- `boms_status_idx` (status) - partial index for active BOMs

**License Plates:**
- `license_plates_pkey` (id)
- `license_plates_lp_number_unique` (lp_number)
- `license_plates_org_status_idx` (org_id, status)
- `license_plates_product_expiry_idx` (product_id, expiry_date)

**Purchase Orders:**
- `purchase_orders_pkey` (id)
- `purchase_orders_org_po_number_unique` (org_id, po_number)
- `purchase_orders_supplier_idx` (supplier_id)
- `purchase_orders_status_idx` (status)

---

## Foreign Key Relationships

### Organizations → Referenced by (26 tables):
- users, warehouses, locations, machines, production_lines
- allergens, tax_codes, products, boms, routings
- work_orders, license_plates, transfer_orders, purchase_orders
- suppliers, activity_logs, technical_settings, planning_settings
- ... and more

### Users → Referenced by (30+ tables):
**Audit trail (created_by, updated_by):**
- Wszystkie tabele biznesowe używają users.id dla audit trail

### Products → Referenced by:
- product_version_history, product_allergens, product_routings
- bom_items, work_orders, license_plates, supplier_products
- po_lines

### BOMs → Referenced by:
- bom_items (CASCADE on delete)

### Routings → Referenced by:
- routing_operations (CASCADE on delete)
- product_routings (CASCADE on delete)

### Warehouses → Referenced by:
- locations, production_lines, purchase_orders

### Locations → Referenced by:
- warehouses (default_receiving, default_shipping, transit)
- production_lines (default_output_location)
- license_plates, transfer_orders (from/to)

---

## Migracje Zastosowane

**Całkowita liczba:** 51 plików SQL

### Kluczowe migracje:
- **000-002**: Organizations + Users (foundation)
- **003-009**: Settings module (warehouses, locations, machines, lines, allergens)
- **010-012**: Tax codes, EU allergens seed
- **013-019**: User management (invitations, sessions, org_id sync to JWT)
- **020-022**: Routings + product routings
- **023-026**: BOMs + validation
- **027-033**: License Plates + Traceability (STUB)
- **024**: Products tables (Epic 2 Batch 2A)
- **025-029**: Suppliers + Purchase Orders (Epic 3 Batch 3A)

**Więcej:** Zobacz `apps/frontend/lib/supabase/migrations/`

---

## Wzorce Bazy Danych

### 1. Multi-Tenancy
✅ Wszystkie tabele biznesowe mają `org_id`
✅ RLS policies enforce tenant isolation
✅ Unique constraints: `(org_id, code)` pattern

### 2. Audit Trail
✅ `created_at`, `updated_at` (auto-trigger)
✅ `created_by`, `updated_by` (FK → users)
✅ Activity logs dla user actions

### 3. Soft Delete
✅ Używane selektywnie: `deleted_at` column
✅ Indexes exclude soft-deleted: `WHERE deleted_at IS NULL`

### 4. Versioning
✅ BOMs: date-based with overlap validation
✅ Products: version history tracking
✅ Routings: future phase

### 5. Code Generation
✅ Auto-generated codes: `LOC-{WH}-{SEQ}`, `PO-YYYY-{SEQ}`
✅ Triggers maintain uniqueness

---

## Następne Kroki

**Epic 4 (Production):**
- Work Orders full implementation
- WO materials consumption
- Production outputs
- Real-time production tracking

**Epic 5 (Warehouse):**
- License Plates full implementation
- Stock moves
- Inventory management
- Traceability complete

**Epic 6 (Quality):**
- Non-conformance reports (NCRs)
- Quality holds
- Inspections
- Certificates of Analysis (CoA)

---

**Koniec dokumentacji**

_Automatycznie wygenerowano: 2025-01-23 via Supabase MCP_
_Źródło: MonoPilot production database (pgroxddbtaevdegnidaz)_
