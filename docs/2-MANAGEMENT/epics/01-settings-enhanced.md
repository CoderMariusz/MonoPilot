# Epic 1: Settings Module - Enhanced

**Status:** Phase 1 DONE | Phase 2/3 PLANNED
**Owner:** Product Team
**Last Updated:** 2025-12-09

---

## Overview

Epic 1 Settings stanowi fundament systemu MonoPilot. Phase 1 (19 stories) zostal ukonczony.
Ten dokument zawiera pelna mape stories wlaczajac Phase 2/3 enhancements.

---

## Story Summary

| Phase | Stories | Status |
|-------|---------|--------|
| Phase 1 (MVP) | 1.1 - 1.19 | ALL DONE |
| Phase 2 (Post-MVP) | 1.20 - 1.27 | PLANNED |
| Phase 3 (Future) | 1.28 - 1.34 | FUTURE |

---

## Phase 1 Stories (DONE)

### 1.1 Organization CRUD + Wizard
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze skonfigurowac podstawowe dane organizacji.

**Acceptance Criteria:**
- [x] AC-001.1: Admin moze edytowac company_name
- [x] AC-001.2: Admin moze ustawic logo (upload)
- [x] AC-001.3: Admin moze ustawic adres, miasto, kod pocztowy
- [x] AC-001.4: Admin moze ustawic NIP/VAT
- [x] AC-001.5: Admin moze ustawic poczatek roku fiskalnego

**Implementation:**
- API: `PUT /api/settings/organization`
- Service: `apps/frontend/lib/services/wizard-service.ts`
- UI: `apps/frontend/app/(authenticated)/settings/organization/page.tsx`

---

### 1.2 User Listing and Management
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze przegladac i zarzadzac uzytkownikami organizacji.

**Acceptance Criteria:**
- [x] AC-002.1: Lista uzytkownikow z email, name, role, status
- [x] AC-002.2: Filtrowanie po roli
- [x] AC-002.3: Filtrowanie po statusie
- [x] AC-002.4: Wyszukiwanie po email/name
- [x] AC-002.5: Sortowanie po kolumnach

**Implementation:**
- API: `GET /api/settings/users`
- UI: `apps/frontend/app/(authenticated)/settings/users/page.tsx`

---

### 1.3 User Invitation System
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze zapraszac nowych uzytkownikow przez email.

**Acceptance Criteria:**
- [x] AC-003.1: Admin wpisuje email i wybiera role
- [x] AC-003.2: System generuje JWT token (7-day expiry)
- [x] AC-003.3: Email wysylany z linkiem rejestracyjnym
- [x] AC-003.4: Invited user status = 'invited'
- [x] AC-003.5: Po rejestracji status = 'active'
- [x] AC-003.6: Token one-time use

**Implementation:**
- Service: `apps/frontend/lib/services/invitation-service.ts`
- API: `POST /api/settings/invitations`

---

### 1.4 Session Management
**Status:** DONE
**Priority:** Should Have

**Description:**
System zarzadza sesjami uzytkownikow.

**Acceptance Criteria:**
- [x] AC-004.1: Session tracking w bazie
- [x] AC-004.2: Admin moze wylogowac uzytkownika
- [x] AC-004.3: Session expiry handling
- [x] AC-004.4: Multiple sessions per user

**Implementation:**
- Service: `apps/frontend/lib/services/session-service.ts`
- API: `GET/DELETE /api/settings/users/[id]/sessions`

---

### 1.5 Warehouse Configuration
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze CRUD warehouses.

**Acceptance Criteria:**
- [x] AC-005.1: Create warehouse (code, name, address)
- [x] AC-005.2: Code unique per org, uppercase A-Z0-9-
- [x] AC-005.3: Edit warehouse
- [x] AC-005.4: Archive warehouse (soft delete)
- [x] AC-005.5: List warehouses with filters
- [x] AC-005.6: Cache z 5-min TTL

**Implementation:**
- Service: `apps/frontend/lib/services/warehouse-service.ts`
- API: `CRUD /api/settings/warehouses`
- UI: `apps/frontend/app/(authenticated)/settings/warehouses/page.tsx`

---

### 1.6 Location Management
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze CRUD locations within warehouse.

**Acceptance Criteria:**
- [x] AC-006.1: Create location (code, name, type)
- [x] AC-006.2: 6 location types: receiving, production, storage, shipping, transit, quarantine
- [x] AC-006.3: Auto-generated barcode
- [x] AC-006.4: Zone support (optional)
- [x] AC-006.5: Capacity tracking (optional)

**Implementation:**
- Service: `apps/frontend/lib/services/location-service.ts`
- API: `CRUD /api/settings/locations`

---

### 1.7 Machine Configuration
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze CRUD machines.

**Acceptance Criteria:**
- [x] AC-007.1: Create machine (code, name, status)
- [x] AC-007.2: Status: active/down/maintenance
- [x] AC-007.3: Capacity per hour (optional)
- [x] AC-007.4: Archive machine

**Implementation:**
- Service: `apps/frontend/lib/services/machine-service.ts`
- API: `CRUD /api/settings/machines`

---

### 1.8 Production Line Setup
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze CRUD production lines.

**Acceptance Criteria:**
- [x] AC-008.1: Create line (code, name, warehouse)
- [x] AC-008.2: Default output location
- [x] AC-008.3: List with warehouse filter

**Implementation:**
- Service: `apps/frontend/lib/services/production-line-service.ts`
- API: `CRUD /api/settings/lines`

---

### 1.9 Allergen Management
**Status:** DONE
**Priority:** Must Have

**Description:**
System seeduje EU14 allergens i pozwala dodawac custom.

**Acceptance Criteria:**
- [x] AC-009.1: 14 EU allergens seeded per org
- [x] AC-009.2: Custom allergens (is_custom=true)
- [x] AC-009.3: is_major flag for EU14
- [x] AC-009.4: Edit/archive allergens

**Implementation:**
- Service: `apps/frontend/lib/services/allergen-service.ts`
- Migration: `011_seed_eu_allergens_function.sql`

---

### 1.10 Tax Code Configuration
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze CRUD tax codes.

**Acceptance Criteria:**
- [x] AC-010.1: Create tax code (code, description, rate)
- [x] AC-010.2: Rate 0.00-100.00
- [x] AC-010.3: Unique code per org

**Implementation:**
- Service: `apps/frontend/lib/services/tax-code-service.ts`
- API: `CRUD /api/settings/tax-codes`

---

### 1.11 Module Activation
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze wlaczac/wylaczac moduly.

**Acceptance Criteria:**
- [x] AC-011.1: Toggle technical, planning, production, warehouse
- [x] AC-011.2: Quality, shipping, NPD, finance (OFF by default)
- [x] AC-011.3: Min 1 module enabled
- [x] AC-011.4: Warning before disable

**Implementation:**
- Service: `apps/frontend/lib/services/module-service.ts`
- API: `GET/PUT /api/settings/modules`

---

### 1.12 Organization Settings (Regional)
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze ustawic regionalne preferencje.

**Acceptance Criteria:**
- [x] AC-012.1: Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- [x] AC-012.2: Number format (1,234.56 / 1.234,56)
- [x] AC-012.3: Unit system (metric/imperial)
- [x] AC-012.4: Timezone (IANA)
- [x] AC-012.5: Currency (PLN, EUR, USD, GBP)
- [x] AC-012.6: Language (PL, EN)

**Implementation:**
- API: `PUT /api/settings/organization`

---

### 1.13 Dashboard Layout
**Status:** DONE
**Priority:** Should Have

**Description:**
Settings dashboard z kafelkami do nawigacji.

**Acceptance Criteria:**
- [x] AC-013.1: Grid layout z settings categories
- [x] AC-013.2: Click navigates to section
- [x] AC-013.3: Stats cards (users, warehouses, locations)

**Implementation:**
- UI: `apps/frontend/app/(authenticated)/settings/page.tsx`
- Component: `apps/frontend/components/settings/SettingsStatsCards.tsx`

---

### 1.14 User Role Management
**Status:** DONE
**Priority:** Must Have

**Description:**
Admin moze zmieniac role uzytkownikow.

**Acceptance Criteria:**
- [x] AC-014.1: Edit user role
- [x] AC-014.2: Validate role in 10 predefined
- [x] AC-014.3: Cannot demote last admin

**Implementation:**
- API: `PUT /api/settings/users/[id]`

---

### 1.15 Activity Feed
**Status:** DONE
**Priority:** Should Have

**Description:**
Dashboard wyswietla ostatnia aktywnosc.

**Acceptance Criteria:**
- [x] AC-015.1: Activity logs table
- [x] AC-015.2: Last 10 activities
- [x] AC-015.3: User, action, timestamp

**Implementation:**
- Service: `apps/frontend/lib/services/dashboard-service.ts`

---

### 1.16 Warehouse Default Locations
**Status:** DONE
**Priority:** Should Have

**Description:**
Warehouse ma default locations dla receiving/shipping.

**Acceptance Criteria:**
- [x] AC-016.1: default_receiving_location_id
- [x] AC-016.2: default_shipping_location_id
- [x] AC-016.3: transit_location_id
- [x] AC-016.4: Circular dependency resolved

**Implementation:**
- Migration: `018_add_warehouse_location_foreign_keys.sql`

---

### 1.17 Location Barcode Generation
**Status:** DONE
**Priority:** Must Have

**Description:**
Locations maja auto-generated barcodes.

**Acceptance Criteria:**
- [x] AC-017.1: Barcode format: LOC-{WH}-{SEQ}
- [x] AC-017.2: Unique per org
- [x] AC-017.3: Generated on create

**Implementation:**
- Service: `apps/frontend/lib/services/barcode-generator-service.ts`

---

### 1.18 Cache Implementation
**Status:** DONE
**Priority:** Should Have

**Description:**
Redis cache dla warehouse list.

**Acceptance Criteria:**
- [x] AC-018.1: Upstash Redis integration
- [x] AC-018.2: 5-min TTL
- [x] AC-018.3: Invalidation on CRUD

**Implementation:**
- Cache: `apps/frontend/lib/cache/warehouse-cache.ts`

---

### 1.19 Multi-tenant RLS Policies
**Status:** DONE
**Priority:** Must Have

**Description:**
Row Level Security dla wszystkich tabel.

**Acceptance Criteria:**
- [x] AC-019.1: org_id isolation
- [x] AC-019.2: Service role bypass
- [x] AC-019.3: JWT claims based access

**Implementation:**
- Migrations: `016_comprehensive_rls_fix_all_settings_tables.sql`

---

## Phase 2 Stories (PLANNED)

### 1.20 User Preferences
**Status:** PLANNED
**Priority:** Should Have
**Effort:** M (3-5 days)

**Description:**
Uzytkownicy moga ustawiac swoje preferencje (theme, language, notifications).

**Acceptance Criteria:**
- [ ] AC-020.1: User moze wybrac theme (dark/light/system)
- [ ] AC-020.2: User moze wybrac language (override org default)
- [ ] AC-020.3: User moze ustawic timezone (override org default)
- [ ] AC-020.4: Preferences stored w user_preferences table
- [ ] AC-020.5: UI respects user preferences

**Technical Notes:**
- New table: `user_preferences` (istnieje - migration 004)
- Extend with theme, language columns
- React context for theme provider

---

### 1.21 Notification Preferences
**Status:** PLANNED
**Priority:** Should Have
**Effort:** M (3-5 days)

**Description:**
Uzytkownicy moga kontrolowac jakie notyfikacje otrzymuja.

**Acceptance Criteria:**
- [ ] AC-021.1: Email notifications toggle (PO approved, WO completed, etc.)
- [ ] AC-021.2: In-app notifications toggle
- [ ] AC-021.3: Notification frequency (immediate/daily digest)
- [ ] AC-021.4: Category-based settings (planning, production, warehouse)

**Technical Notes:**
- New table: `notification_preferences`
- Integration with email service (SendGrid)
- Future: push notifications

---

### 1.22 Audit Log Viewer
**Status:** PLANNED
**Priority:** Should Have
**Effort:** L (1-2 weeks)

**Description:**
Admin moze przegladac historyczne zmiany w systemie.

**Acceptance Criteria:**
- [ ] AC-022.1: Lista zmian z: user, action, entity, timestamp
- [ ] AC-022.2: Filtrowanie po: user, entity type, date range
- [ ] AC-022.3: Detail view: old value vs new value (JSON diff)
- [ ] AC-022.4: Export do CSV
- [ ] AC-022.5: Retencja: 90 dni default

**Technical Notes:**
- Extend `activity_logs` table
- Add JSON columns: old_value, new_value
- Triggers na glownych tabelach

**Competitive Justification:**
AVEVA i Plex maja full audit trail - to gap ktory warto zamknac.

---

### 1.23 API Keys Management
**Status:** PLANNED
**Priority:** Should Have
**Effort:** M (3-5 days)

**Description:**
Admin moze generowac API keys dla zewnetrznych integracji.

**Acceptance Criteria:**
- [ ] AC-023.1: Generate API key (name, scopes)
- [ ] AC-023.2: View active keys (masked)
- [ ] AC-023.3: Revoke key
- [ ] AC-023.4: Key expiry (optional)
- [ ] AC-023.5: Rate limiting per key
- [ ] AC-023.6: Audit log of API key usage

**Technical Notes:**
- New table: `api_keys`
- Middleware for API key auth
- Scopes: read-only, read-write, admin

**Competitive Justification:**
Enterprise klienci wymagaja API dla integracji z ich systemami.

---

### 1.24 Import/Export Settings
**Status:** PLANNED
**Priority:** Should Have
**Effort:** M (3-5 days)

**Description:**
Admin moze eksportowac i importowac konfiguracje.

**Acceptance Criteria:**
- [ ] AC-024.1: Export: organization settings, warehouses, locations, users (sanitized)
- [ ] AC-024.2: Format: JSON
- [ ] AC-024.3: Import: validate, preview changes, apply
- [ ] AC-024.4: Conflict resolution UI
- [ ] AC-024.5: Backup przed importem

**Technical Notes:**
- Export endpoint: `GET /api/settings/export`
- Import endpoint: `POST /api/settings/import`
- Validation schema per entity type

**Use Cases:**
- Backup configuration
- Clone settings to new org
- Disaster recovery

---

### 1.25 User Groups
**Status:** PLANNED
**Priority:** Should Have
**Effort:** L (1-2 weeks)

**Description:**
Admin moze tworzyc grupy uzytkownikow z wspolnymi uprawnieniami.

**Acceptance Criteria:**
- [ ] AC-025.1: CRUD user groups
- [ ] AC-025.2: Assign users to groups
- [ ] AC-025.3: Group-based permissions (inherit from group role)
- [ ] AC-025.4: User can belong to multiple groups
- [ ] AC-025.5: Group dashboard filtering

**Technical Notes:**
- New tables: `user_groups`, `user_group_members`
- Permission resolution: user role OR group role (most permissive)

**Competitive Justification:**
Plex ma user groups - ulatwia zarzadzanie duzymi teamami.

---

### 1.26 Advanced Role Editor
**Status:** PLANNED
**Priority:** Could Have
**Effort:** L (1-2 weeks)

**Description:**
Admin moze tworzyc custom role z fine-grained permissions.

**Acceptance Criteria:**
- [ ] AC-026.1: Create custom role
- [ ] AC-026.2: Per-feature permissions matrix
- [ ] AC-026.3: Clone existing role
- [ ] AC-026.4: Delete custom role (reassign users first)
- [ ] AC-026.5: Built-in roles read-only

**Technical Notes:**
- New table: `custom_roles`
- Permission flags per module/feature
- Complex - deferrable to Phase 3 if needed

---

### 1.27 Organization Branding
**Status:** PLANNED
**Priority:** Could Have
**Effort:** S (1-2 days)

**Description:**
Admin moze customizowac branding organizacji.

**Acceptance Criteria:**
- [ ] AC-027.1: Primary color picker
- [ ] AC-027.2: Logo placement (header, login page)
- [ ] AC-027.3: Custom favicon
- [ ] AC-027.4: Email template branding

**Technical Notes:**
- CSS custom properties
- Store in organizations table (branding_config JSONB)

---

## Phase 3 Stories (FUTURE)

### 1.28 Multi-site Support
**Status:** FUTURE
**Priority:** Should Have (Phase 3)
**Effort:** XL (2-4 weeks)

**Description:**
Organizacje moga miec parent/child hierarchy dla multi-site operations.

**Acceptance Criteria:**
- [ ] AC-028.1: Create child organization (site)
- [ ] AC-028.2: Parent-level reports aggregating children
- [ ] AC-028.3: Cross-site user access
- [ ] AC-028.4: Cross-site transfers (TO between sites)
- [ ] AC-028.5: Centralized vs decentralized settings

**Technical Notes:**
- Add parent_org_id to organizations
- Complex RLS policies
- Cross-org data sharing

**Competitive Gap:**
AVEVA, Plex, CSB all have multi-site - critical for growth.

---

### 1.29 SSO/SAML Integration
**Status:** FUTURE
**Priority:** Should Have (Phase 3)
**Effort:** L (1-2 weeks)

**Description:**
Enterprise klienci moga uzywac swojego Identity Provider.

**Acceptance Criteria:**
- [ ] AC-029.1: SAML 2.0 support
- [ ] AC-029.2: Configure IdP metadata
- [ ] AC-029.3: Auto-provision users on first login
- [ ] AC-029.4: Role mapping from IdP claims
- [ ] AC-029.5: Fallback to email/password

**Technical Notes:**
- Supabase Auth with SAML provider
- Configuration per organization

**Competitive Gap:**
Enterprise segment expects SSO - table stakes for large deals.

---

### 1.30 Webhooks
**Status:** FUTURE
**Priority:** Could Have (Phase 3)
**Effort:** M (3-5 days)

**Description:**
System moze wysylac webhooks do zewnetrznych systemow.

**Acceptance Criteria:**
- [ ] AC-030.1: Configure webhook endpoints
- [ ] AC-030.2: Select events to trigger
- [ ] AC-030.3: Retry logic (3 attempts)
- [ ] AC-030.4: Webhook logs (success/failure)
- [ ] AC-030.5: Secret signing

**Technical Notes:**
- New table: `webhooks`, `webhook_logs`
- Background job for delivery
- Events: PO created, WO completed, LP moved, etc.

---

### 1.31 Feature Flags per Organization
**Status:** FUTURE
**Priority:** Could Have (Phase 3)
**Effort:** M (3-5 days)

**Description:**
Admin moze wlaczac beta features dla swojej organizacji.

**Acceptance Criteria:**
- [ ] AC-031.1: Feature flags list
- [ ] AC-031.2: Toggle per org
- [ ] AC-031.3: Feature description i docs link
- [ ] AC-031.4: Beta warning banner

**Technical Notes:**
- Table: `feature_flags`, `org_feature_flags`
- Middleware to check flags

---

### 1.32 Custom Fields Configuration
**Status:** FUTURE
**Priority:** Could Have (Phase 3)
**Effort:** L (1-2 weeks)

**Description:**
Admin moze definiowac custom fields dla roznych entity types.

**Acceptance Criteria:**
- [ ] AC-032.1: Define custom field (name, type, entity)
- [ ] AC-032.2: Field types: text, number, date, select, boolean
- [ ] AC-032.3: Required/optional
- [ ] AC-032.4: Show in forms and lists
- [ ] AC-032.5: Export includes custom fields

**Technical Notes:**
- JSONB column `custom_fields` per entity
- Schema validation

**Competitive Gap:**
CSB i Aptean maja extensive customization - important for niche needs.

---

### 1.33 Data Retention Policies
**Status:** FUTURE
**Priority:** Could Have (Phase 3)
**Effort:** M (3-5 days)

**Description:**
Admin moze ustawic automatyczne archiwizowanie starych danych.

**Acceptance Criteria:**
- [ ] AC-033.1: Configure retention per entity type
- [ ] AC-033.2: Auto-archive after X days
- [ ] AC-033.3: Archived data read-only
- [ ] AC-033.4: Export before archive (optional)
- [ ] AC-033.5: Restore from archive

**Technical Notes:**
- Archived tables lub cold storage
- Background job for archival
- GDPR compliance consideration

---

### 1.34 Advanced ABAC (Attribute-Based Access Control)
**Status:** WON'T HAVE (v1)
**Priority:** Won't Have
**Effort:** XL (2-4 weeks+)

**Description:**
System wspiera complex access rules oparte na atrybutach.

**Acceptance Criteria:**
- [ ] AC-034.1: Define access rules with conditions
- [ ] AC-034.2: Conditions: user attributes, resource attributes, context
- [ ] AC-034.3: Rule evaluation engine
- [ ] AC-034.4: Testing/simulation mode

**Rationale for Won't Have:**
- 10 predefined roles sufficient for MVP/Phase 2
- ABAC complexity high, value uncertain
- Revisit only if enterprise customers specifically request

---

## Traceability Matrix

| Story | Traces To | Business Value |
|-------|-----------|----------------|
| 1.20 | user-experience | Better UX, user satisfaction |
| 1.21 | user-experience | Reduced notification fatigue |
| 1.22 | compliance, trust | Audit requirements, debugging |
| 1.23 | integration | External system connectivity |
| 1.24 | operations | Backup/disaster recovery |
| 1.25 | scalability | Large team management |
| 1.26 | flexibility | Custom access control |
| 1.27 | branding | Customer customization |
| 1.28 | scalability | Multi-site enterprises |
| 1.29 | enterprise-sales | Enterprise requirements |
| 1.30 | integration | Real-time data sync |
| 1.31 | product-development | Beta testing capability |
| 1.32 | flexibility | Industry-specific needs |
| 1.33 | compliance | Data management |
| 1.34 | security | Complex access control |

---

## Risk Assessment

| Story | Risk | Mitigation |
|-------|------|------------|
| 1.22 Audit Log | Performance impact | Async logging, table partitioning |
| 1.25 User Groups | Permission conflicts | Clear precedence rules |
| 1.28 Multi-site | Data complexity | Careful schema design |
| 1.29 SSO/SAML | IdP compatibility | Test with major providers |
| 1.32 Custom Fields | Schema drift | Strict validation |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM Agent | Initial enhanced epic with Phase 2/3 stories |
