# Settings Module - Epic Breakdown

**Moduł:** Settings (Foundation)
**Priorytet:** P0 - Musi być pierwszy
**FRs:** 11 (10 MVP + 1 Growth)
**Szacowany czas:** 2-3 tygodnie

---

## Podsumowanie Epików

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| SET-1 | Organization & Business Settings | 1 | 2 | P0 | 2d |
| SET-2 | Users, Roles & Access | 2 | 5 | P0 | 4d |
| SET-3 | Warehouse & Location Config | 2 | 4 | P0 | 3d |
| SET-4 | Production Settings | 4 | 6 | P0 | 4d |
| SET-5 | Modules & Subscription | 2 | 3 | P1 | 2d |
| **Total** | | **11** | **20** | | **15d** |

---

## Epic SET-1: Organization & Business Settings

**Cel:** Podstawowa konfiguracja organizacji
**FRs:** FR-SET-001
**Priorytet:** P0 MVP
**Effort:** 2 dni

### Stories

#### SET-1-1: Organization Basic Data Form
**Jako** Admin **chcę** skonfigurować dane firmy **aby** system wyświetlał poprawne informacje

**Acceptance Criteria:**
- [ ] Formularz z polami: company_name, logo, street_address, city, postal_code, country, nip_vat_number
- [ ] Upload logo (max 2MB, image only)
- [ ] Walidacja na blur
- [ ] Save button z toast confirmation
- [ ] Country jako dropdown z listą krajów

**Technical Tasks:**
- API: GET/PUT `/api/settings/organization`
- UI: OrganizationSettingsForm component
- Zod schema dla walidacji

---

#### SET-1-2: Business & Regional Settings
**Jako** Admin **chcę** ustawić preferencje biznesowe **aby** system używał odpowiednich formatów

**Acceptance Criteria:**
- [ ] Timezone selector (Europe/Warsaw, UTC, etc.)
- [ ] Default currency (PLN, EUR, USD, GBP)
- [ ] Default language (PL, EN)
- [ ] Fiscal year start (January, April, July, October)
- [ ] Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- [ ] Number format (1 000,00 vs 1,000.00)
- [ ] Unit system (Metric/Imperial)

**Technical Tasks:**
- Enum values w bazie
- Formatowanie dat/liczb w UI based on settings
- i18n integration

---

## Epic SET-2: Users, Roles & Access

**Cel:** Zarządzanie użytkownikami i uprawnieniami
**FRs:** FR-SET-002, FR-SET-003
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### SET-2-1: User List & CRUD
**Jako** Admin **chcę** zarządzać użytkownikami **aby** kontrolować dostęp do systemu

**Acceptance Criteria:**
- [ ] Tabela użytkowników z search i filtrami (role, status)
- [ ] Create User modal z email, first_name, last_name, role
- [ ] Edit User drawer (slide-in)
- [ ] Deactivate user (soft delete, nie usuwa danych)
- [ ] Email musi być unikalny

**Technical Tasks:**
- API: CRUD `/api/settings/users`
- UI: UsersTable, AddUserModal, EditUserDrawer
- Zod validation

---

#### SET-2-2: Role Assignment & Permissions
**Jako** Admin **chcę** przypisać role użytkownikom **aby** ograniczyć ich dostęp

**Acceptance Criteria:**
- [ ] 10 ról: Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing, Warehouse, QC, Finance
- [ ] Role dropdown w formularzu użytkownika
- [ ] Tooltip z opisem uprawnień każdej roli
- [ ] Middleware sprawdzający role na backendzie

**Technical Tasks:**
- Role enum w bazie
- RBAC middleware
- Permission matrix dokumentacja

---

#### SET-2-3: Session Management
**Jako** User **chcę** widzieć moje aktywne sesje **aby** kontrolować bezpieczeństwo

**Acceptance Criteria:**
- [ ] Lista aktywnych sesji z device_info, ip_address, login_time
- [ ] "Logout from all devices" button
- [ ] Last login time displayed
- [ ] Admin może terminować sesje dowolnego usera

**Technical Tasks:**
- API: GET/DELETE `/api/settings/users/:id/sessions`
- user_sessions table
- JWT invalidation logic

---

#### SET-2-4: Email Invitations
**Jako** Admin **chcę** zapraszać użytkowników przez email **aby** onboardować nowych pracowników

**Acceptance Criteria:**
- [ ] Invite by email form (email, role)
- [ ] Email wysyłany z linkiem aktywacyjnym
- [ ] Pending invitations list
- [ ] Resend invitation action
- [ ] Cancel invitation action
- [ ] Invitation expires after 7 days

**Technical Tasks:**
- API: CRUD `/api/settings/invitations`
- Email service (Resend/SendGrid)
- user_invitations table

---

#### SET-2-5: QR Code Invitation
**Jako** Admin **chcę** generować QR code zaproszenia **aby** ułatwić mobile onboarding

**Acceptance Criteria:**
- [ ] Generate QR code button
- [ ] QR code wyświetlany w modal
- [ ] QR code zawiera link do rejestracji
- [ ] QR code można wydrukować/pobrać

**Technical Tasks:**
- QR code generation library (qrcode.react)
- API: GET `/api/settings/invitations/:id/qr`

---

## Epic SET-3: Warehouse & Location Configuration

**Cel:** Definiowanie struktury magazynowej
**FRs:** FR-SET-004, FR-SET-005
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### SET-3-1: Warehouse CRUD
**Jako** Admin **chcę** definiować magazyny **aby** organizować inventory

**Acceptance Criteria:**
- [ ] Warehouse list (cards or table)
- [ ] Add Warehouse modal z code, name, address
- [ ] Edit Warehouse modal
- [ ] Activate/Deactivate warehouse
- [ ] Code musi być unikalny per org

**Technical Tasks:**
- API: CRUD `/api/settings/warehouses`
- UI: WarehouseList, WarehouseModal

---

#### SET-3-2: Location CRUD with Optional Fields
**Jako** Admin **chcę** definiować lokacje **aby** precyzyjnie śledzić inventory

**Acceptance Criteria:**
- [ ] Location list per warehouse (nested view)
- [ ] Add Location modal z code, name, type
- [ ] Type: Receiving, Production, Storage, Shipping, Transit, Quarantine
- [ ] Zone field z enable/disable toggle
- [ ] Capacity field z enable/disable toggle
- [ ] Barcode auto-generated (LOC-{code})
- [ ] Activate/Deactivate location

**Technical Tasks:**
- API: CRUD `/api/settings/locations`
- UI: LocationsTable per warehouse
- Barcode generation logic

---

#### SET-3-3: Default Locations per Warehouse
**Jako** Admin **chcę** ustawić domyślne lokacje **aby** operacje automatycznie wybierały właściwe miejsce

**Acceptance Criteria:**
- [ ] default_receiving_location_id (required)
- [ ] default_shipping_location_id (required)
- [ ] transit_location_id (required)
- [ ] default_production_output_location_id (optional)
- [ ] Dropdown z lokacjami danego warehouse
- [ ] Walidacja: location musi należeć do warehouse

**Technical Tasks:**
- Foreign keys w warehouses table
- Cascade validation

---

#### SET-3-4: Location Type Filtering
**Jako** User **chcę** widzieć lokacje odpowiedniego typu **aby** szybko wybrać właściwą

**Acceptance Criteria:**
- [ ] API filtruje lokacje po type
- [ ] W PO receiving pokazuje tylko type=Receiving
- [ ] W shipping pokazuje tylko type=Shipping
- [ ] W production output pokazuje type=Production/Storage

**Technical Tasks:**
- API query param: `?type=Receiving`
- UI: LocationSelector component z type prop

---

## Epic SET-4: Production Settings

**Cel:** Konfiguracja maszyn, linii, alergenów, podatków
**FRs:** FR-SET-006, FR-SET-007, FR-SET-008, FR-SET-009
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### SET-4-1: Machine CRUD
**Jako** Admin **chcę** definiować maszyny **aby** przypisywać je do linii

**Acceptance Criteria:**
- [ ] Machine table z code, name, status, capacity_per_hour
- [ ] Add/Edit Machine modal
- [ ] Status: Active, Down, Maintenance
- [ ] Optional capacity (units/hour)

**Technical Tasks:**
- API: CRUD `/api/settings/machines`
- machines table

---

#### SET-4-2: Production Line CRUD
**Jako** Admin **chcę** definiować linie produkcyjne **aby** planować WO

**Acceptance Criteria:**
- [ ] Line table z code, name, warehouse
- [ ] Add/Edit Line modal
- [ ] Warehouse selector (required)
- [ ] Default output location selector (optional)

**Technical Tasks:**
- API: CRUD `/api/settings/lines`
- production_lines table

---

#### SET-4-3: Machine-Line Assignments
**Jako** Admin **chcę** przypisać maszyny do linii **aby** śledzić wykorzystanie

**Acceptance Criteria:**
- [ ] Machine może być na wielu liniach
- [ ] Line może mieć wiele maszyn
- [ ] UI: Multi-select lub drag-drop
- [ ] View: Lista maszyn per linia

**Technical Tasks:**
- API: PUT `/api/settings/lines/:id/machines`
- machine_line_assignments table (many-to-many)

---

#### SET-4-4: Allergen Management
**Jako** Admin **chcę** zarządzać alergenami **aby** śledzić zawartość produktów

**Acceptance Criteria:**
- [ ] Allergen table z code, name, is_major
- [ ] 14 EU major allergens preloaded
- [ ] User może dodać custom allergens (is_custom=true)
- [ ] Custom allergens można edytować/usuwać
- [ ] Preloaded allergens read-only

**Technical Tasks:**
- API: CRUD `/api/settings/allergens`
- Seed script dla 14 EU allergens
- allergens table

---

#### SET-4-5: Tax Code Configuration
**Jako** Admin **chcę** definiować kody podatkowe **aby** używać ich w PO

**Acceptance Criteria:**
- [ ] Tax code table z code, description, rate %
- [ ] Preload based on country (Poland: VAT 23%, 8%, 5%, 0%)
- [ ] User może dodać custom tax codes
- [ ] Rate jako decimal (np. 23.00)

**Technical Tasks:**
- API: CRUD `/api/settings/tax-codes`
- Seed script per country
- tax_codes table

---

#### SET-4-6: Production Settings Tab UI
**Jako** Admin **chcę** nawigować między ustawieniami produkcji **aby** szybko znajdować opcje

**Acceptance Criteria:**
- [ ] Tabs: Machines | Lines | Allergens | Tax Codes
- [ ] Each tab pokazuje odpowiednią tabelę
- [ ] URL updates with tab (deep linking)

**Technical Tasks:**
- UI: ProductionSettingsTabs component
- React Router tabs

---

## Epic SET-5: Modules & Subscription

**Cel:** Włączanie modułów i zarządzanie subskrypcją
**FRs:** FR-SET-010, FR-SET-011
**Priorytet:** P1 (Module toggle MVP, Subscription Growth)
**Effort:** 2 dni

### Stories

#### SET-5-1: Module Toggle
**Jako** Admin **chcę** włączać/wyłączać moduły **aby** dostosować system do potrzeb

**Acceptance Criteria:**
- [ ] Module grid z toggle switches
- [ ] Modules: Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance
- [ ] Disabled modules hidden from UI
- [ ] API returns 403 for disabled module endpoints
- [ ] Only Admin can change

**Technical Tasks:**
- API: GET/PUT `/api/settings/modules`
- modules_enabled array w organizations table
- Middleware checking module access

---

#### SET-5-2: Subscription Tier Display
**Jako** User **chcę** widzieć mój plan subskrypcji **aby** znać dostępne funkcje

**Acceptance Criteria:**
- [ ] Current tier card (Starter/Growth/Enterprise)
- [ ] Tier comparison table
- [ ] Renewal date
- [ ] Feature list per tier

**Technical Tasks:**
- UI: SubscriptionCard component
- subscription_tier w organizations table

---

#### SET-5-3: Subscription Management (Growth Phase)
**Jako** Admin **chcę** zarządzać subskrypcją **aby** upgradować plan

**Acceptance Criteria:**
- [ ] Upgrade/Downgrade modal
- [ ] Billing info form
- [ ] Payment history table z invoice download
- [ ] Cancel subscription flow

**Technical Tasks:**
- Stripe integration
- Billing tables
- Invoice PDF generation

---

## Zależności

```
SET-1 (Organization) → SET-2 (Users) → SET-3 (Warehouses)
                                    ↘ SET-4 (Production)
                                    ↘ SET-5 (Modules)
```

SET-1 musi być pierwszy (timezone, currency używane wszędzie)

---

## Definition of Done

- [ ] Wszystkie AC spełnione
- [ ] Unit tests (95% coverage)
- [ ] E2E tests dla happy path
- [ ] API documentation zaktualizowana
- [ ] Code review approved
- [ ] No TypeScript errors
- [ ] Deployed to staging

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Next:** Technical Module Epics

---

_Epic breakdown dla Settings Module - 11 FRs → 5 epików, 20 stories_
