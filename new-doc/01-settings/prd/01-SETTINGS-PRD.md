# PRD 01-Settings — MonoPilot MES
**Wersja**: 3.2 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Moduł Settings (M01) to fundament całego systemu MonoPilot MES. Zarządza konfiguracją organizacji, użytkownikami, rolami, uprawnieniami, infrastrukturą produkcyjną (magazyny, lokalizacje, maszyny, linie), danymi podstawowymi (alergeny, kody podatkowe) oraz bezpieczeństwem i audytem.

**Kluczowy differentiator**: Onboarding wizard < 15 minut — od rejestracji do pierwszego zlecenia produkcyjnego. Konkurencja (SAP, D365) wymaga tygodni konsultacji.

**Status implementacji**: Phase 1A-1B ~80% gotowe (Stories 01.1–01.17 zrealizowane). Phase 2 i 3 zaplanowane.

**Zakres dokumentu**: 99 wymagań funkcjonalnych (FR-SET-001 do FR-SET-188) + 7 nowych wymagań z PRD-UPDATE-LIST [1.1–1.7]. Łącznie 106 wymagań.

---

## 2. Objectives

### Cel główny
Dostarczyć kompletną warstwę administracyjną MonoPilot, zapewniającą bezpieczny multi-tenant, szybki onboarding i elastyczną konfigurację dla SMB food manufacturing.

### Cele szczegółowe
1. **Onboarding < 15 min** — wizard prowadzi od rejestracji do pierwszego WO
2. **10 ról systemowych** — granularne uprawnienia CRUD per moduł, bez konfiguracji per klient
3. **Infrastruktura produkcyjna** — magazyny, lokalizacje (4-level hierarchy), maszyny, linie
4. **Compliance** — audit trail (FDA 21 CFR Part 11), trasowalność, alergeny EU-14
5. **Modularność** — toggles per organizację, zależności walidowane automatycznie

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Czas onboardingu | < 15 min | Analytics wizard |
| Aktywacja modułów | ≥ 3 moduły / org w 7 dni | organization_modules |
| Adopcja ról | 100% użytkowników ma przypisaną rolę | users.role_id NOT NULL |
| Audit trail coverage | 100% tabel krytycznych | Trigger presence check |
| Uptime Settings API | 99.5%+ | APM |
| Page load P95 | < 2 s | Lighthouse |

---

## 3. Personas

| Persona | Interakcja z Settings | Kluczowe akcje |
|---------|----------------------|----------------|
| **Administrator** | Główny użytkownik | Org profile, users, roles, modules, warehouses, machines, allergens, tax codes, security, billing |
| **Owner** | Pełne uprawnienia | Jak Admin + billing, subscription, IP whitelist, GDPR |
| **Kierownik produkcji** | Read-only Settings | Podgląd maszyn, linii, ról (nie edytuje) |
| **Operator** | Brak dostępu | Settings ukryte w nawigacji |
| **Nowy klient** | Onboarding wizard | Wizard: org → warehouse → location → link do product → link do WO |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Obszar | Wymagania | Priorytet |
|--------|-----------|-----------|
| Organizacja (profil, timezone, locale, waluta) | FR-SET-001–005 | Must Have |
| Użytkownicy CRUD + zaproszenia email | FR-SET-010–018 | Must Have |
| 10 ról systemowych (JSONB permissions) | FR-SET-020–031 | Must Have |
| Module toggles z walidacją zależności | FR-SET-090–097 | Must Have |
| Onboarding wizard (6 kroków, < 15 min) | FR-SET-180–188 | Must Have |
| Magazyny CRUD (5 typów) | FR-SET-040–046 | Must Have |
| Lokalizacje hierarchiczne (zone/aisle/rack/bin) | FR-SET-042–044 | Must Have |
| Maszyny CRUD (typ, status, capacity) | FR-SET-050–056 | Must Have |
| Linie produkcyjne CRUD + przypisanie maszyn | FR-SET-060–065 | Must Have |
| Alergeny EU-14 (multi-language) | FR-SET-070–073 | Must Have |
| Kody podatkowe CRUD (basic) | FR-SET-080–084 | Must Have |
| Audit trail (PG triggers + app context) | FR-SET-140–144 | Must Have |
| Session management + password policies | FR-SET-013–014, 171–173 | Must Have |
| Multi-language core (PL/EN) | FR-SET-110–116 | Should Have |

### 4.2 Out of Scope — Phase 2

| Obszar | Wymagania | Uzasadnienie |
|--------|-----------|--------------|
| [1.1] Multi-country VAT (POL-*, RC+/-) | HIGH | Wymaga danych D365 |
| [1.2] Waste categories config | HIGH | Zależy od Production |
| [1.4] Fiscal calendar 4-4-5 | HIGH | Zależy od Reporting |
| [1.5] Target KPI per line/product | HIGH | Zależy od Reporting |
| [1.3] Grade thresholds A/B/C/D | MEDIUM | Zależy od Reporting |
| [1.6] Disposition codes | MEDIUM | Zależy od Warehouse |
| [1.7] Cost per KG setting | MEDIUM | Zależy od Finance |
| API Keys + Webhooks | FR-SET-120–135 | Post-MVP integracje |
| Notifications | FR-SET-160–163 | Post-MVP |
| MFA/2FA | FR-SET-015 | Post-MVP |
| Multi-language DE/FR | FR-SET-110 ext | Post-MVP |
| Audit retention + export | FR-SET-144–146 | Post-MVP |
| Security advanced (IP whitelist) | FR-SET-170, 174 | Post-MVP |

### 4.3 Out of Scope — Phase 3 (Enterprise)

| Obszar | Uzasadnienie |
|--------|--------------|
| Subscription & Billing (Stripe) | FR-SET-100–106; Enterprise |
| Import/Export CSV | FR-SET-150–155; Enterprise |
| IP Whitelist | FR-SET-170; Enterprise |
| GDPR compliance tools | FR-SET-174; Enterprise |
| Custom roles per org | Rozszerzenie ADR-012 |
| Custom allergens | FR-SET-074; Enterprise |
| Usage analytics | FR-SET-105; Enterprise |

### 4.4 Exclusions (Nigdy)

- **Custom development per klient** — product-led, identyczne dla wszystkich
- **Pełna księgowość** — integracja z Comarch/Sage
- **HR / Payroll** — poza domeną MES
- **On-premise deployment** — wyłącznie SaaS

---

## 5. Constraints

### Techniczne
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach (ADR-013)
- **Supabase Auth**: Users w auth.users, profil w public.users; auth.uid() = source of identity
- **Service Role**: API routes używają service role z filtrami org_id; ryzyko przy pominięciu
- **JSONB permissions**: Format `"module": "CRUD"` (ADR-012); nie relacyjne many-to-many

### Biznesowe
- Freemium + 50 USD/user/mies. | 10 ról fixed | ~500 users/org (orientacyjne, nie enforced) | Bootstrapping

### Regulacyjne
- Audit trail: FDA 21 CFR Part 11 (who/what/when/old/new) (ADR-008)
- Alergeny: EU Regulation 1169/2011 (14 obowiązkowych)
- Retencja danych: 3–7 lat zależnie od tabeli
- GDPR: prawo do usunięcia — soft delete + anonimizacja (Phase 3)

---

## 6. Decisions

Wszystkie decyzje obowiązujące w module Settings:

### D-SET-1. Multi-Tenancy RLS (ADR-003, ADR-013)
`org_id UUID NOT NULL` na WSZYSTKICH tabelach. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Single source of truth: tabela `users` (NIE JWT claims). Cross-tenant → 404 (nie 403).

### D-SET-2. Role & Permission Storage (ADR-012)
Tabela `roles` z JSONB `permissions`. 10 ról systemowych seedowanych. `users.role_id` UUID FK do `roles.id`. Custom roles Phase 3 (org_id NOT NULL, is_system=false). Wartości: `C`=Create, `R`=Read, `U`=Update, `D`=Delete, `-`=No access.

### D-SET-3. Module Toggles (ADR-011)
Tabela `modules` (seeded, immutable, 11+ modułów) + `organization_modules` (junction, per org). `settings` i `technical` → `can_disable=false`. Walidacja zależności: np. Production wymaga Planning wymaga Technical. Audit: `enabled_at`, `enabled_by`.

### D-SET-4. Audit Trail (ADR-008)
Hybrydowy: PG triggers (auto na INSERT/UPDATE/DELETE) + app context (`set_config()` → user_id, ip_address, action_reason). Tabela `audit_log` z `old_data`/`new_data` JSONB. Partycjonowanie monthly. Retencja per tabela (3–7 lat). Compliance: FDA 21 CFR Part 11, FSMA 204.

### D-SET-5. Onboarding SLA 15 min
Wizard 6 kroków: (1) Organization profile → (2) First warehouse → (3) First location → (4) Link do Technical (product creation) → (5) Link do Planning (WO creation) → (6) Completion celebration. Kroki 4–5 to **soft dependencies** (linki/przekierowania do innych modułów, NIE cross-module API calls). Skip na każdym kroku. Progress tracking w `organizations.onboarding_state`.

### D-SET-6. Waluta startowa
GBP domyślnie (rynek docelowy UK). PLN, EUR, USD, CHF obsługiwane. Multi-currency (jednoczesne) → Phase 2.

### D-SET-7. Password & Session
Min 8 znaków, uppercase+lowercase+number+special. History: 5 ostatnich. Session timeout: 24h default (konfigurowalne). Multi-device support. Zmiana hasła → termination all other sessions. Invitation link ważny **7 dni**.

### D-SET-8. Alergeny — globalna tabela + org extensions
Globalna tabela `allergens` (read-only, seeded EU-14, BEZ org_id) jako reference data. Organizacje mogą dodawać **org-specific allergens** w osobnej tabeli lub rozszerzeniu. Produkty linkują do allergen_id (global lub custom).

### D-SET-9. Waste categories — customizable per org
Tabela `waste_categories` z domyślnymi ogólnymi kategoriami (np. `waste_general`, `overproduction`, `spillage`). Organizacja może **dodawać własne** kategorie specyficzne dla branży (piekarnia: odparowanie; mięso: fat trim; metalurgia: strata wytapiania). Pole "Add category" w UI.

### D-SET-10. Fiscal calendar — wybór systemu
Organizacja wybiera schemat kalendarza fiskalnego: **4-4-5** / **4-5-4** / **5-4-4** / **calendar months** (standard). Pole `fiscal_calendar_type` w `organization_settings`. Auto-generacja periodów na podstawie wybranego schematu + daty startu roku fiskalnego.

### D-SET-11. cost_per_kg — per produkt (M02)
`cost_per_kg` to pole na tabeli `products` (M02 Technical), NIE w Settings. Każdy produkt ma inną wartość. Settings NIE zarządza tym polem — wymaganie [1.7] przeniesione do M02.

### D-SET-12. site_id — NA WSZYSTKICH tabelach (NULL)
`site_id UUID NULL REFERENCES sites(id)` dodajemy na WSZYSTKICH tabelach Settings (warehouses, machines, production_lines, locations, allergens, tax_codes itd.) już teraz. Wartość NULL do czasu implementacji M11 Multi-Site. Retroaktywna migration na istniejących tabelach. Uzasadnienie: spójne RLS policies, brak konieczności ALTER TABLE przy M14.

### D-SET-13. Rola Owner (nie Super Admin)
Kanoniczna nazwa najwyższej roli systemowej: **Owner** (code: `owner`). Termin "Super Admin" jest deprecated. Owner ma pełne uprawnienia CRUD na wszystkich modułach + billing + subscription.

### Decyzje biznesowe (bez ADR)
- NIE budujemy custom roles w Phase 1/2 — 10 systemowych wystarczy dla SMB (custom roles → Phase 3)
- Warehouse types: `raw`, `wip`, `finished`, `quarantine`, `general`
- Location hierarchy: max 4 poziomy (zone → aisle → rack → bin)
- Billing via Stripe — Phase 3 only
- Multi-language: PL/EN w Phase 1, DE/FR w Phase 2
- 500 users/org — wartość orientacyjna (performance), NIE twardy limit w API
- Invitation link: 7 dni expiry, resend resetuje timer

---

## 7. Module Map

```
Settings (M01)
├── E01.1 — Organizacja & Dostęp ← FUNDAMENT
│   ├── Org profile, timezone, locale, currency
│   ├── Users CRUD + invitations + deactivation
│   ├── 10 ról systemowych (ADR-012)
│   ├── Module toggles (ADR-011)
│   └── Session & password management
├── E01.2 — Onboarding Wizard
│   └── 6-step wizard (< 15 min)
├── E01.3 — Infrastruktura
│   ├── Warehouses (5 types)
│   ├── Locations (4-level hierarchy)
│   ├── Machines (type, status, capacity)
│   └── Production Lines (machine sequence)
├── E01.4 — Dane Podstawowe & Audit
│   ├── Allergens EU-14 (multi-language)
│   ├── Tax codes (rate, jurisdiction, effective dates)
│   └── Audit trail (ADR-008)
├── E01.5 — Bezpieczeństwo & Lokalizacja [MVP Stretch]
│   ├── Password policies
│   ├── Login attempt tracking
│   └── Multi-language PL/EN (next-intl)
├── E01.6 — Konfiguracja zaawansowana [Phase 2]
│   ├── [1.1] Multi-country VAT
│   ├── [1.2] Waste categories config
│   ├── [1.4] Fiscal calendar 4-4-5
│   ├── [1.5] Target KPI per line/product
│   ├── [1.3] Grade thresholds A/B/C/D
│   ├── [1.6] Disposition codes
│   └── [1.7] Cost per KG setting
├── E01.7 — Integracje & Powiadomienia [Phase 2]
│   ├── API keys (HMAC, scopes, rate limit)
│   ├── Webhooks (events, retry, delivery log)
│   ├── Notifications (email + in-app)
│   ├── MFA/2FA (TOTP)
│   └── Multi-language DE/FR
└── E01.8 — Enterprise [Phase 3]
    ├── Subscription & Billing (Stripe)
    ├── Import/Export CSV
    ├── IP Whitelist
    ├── GDPR compliance
    └── Custom roles per org
```

---

## 8. Requirements

### E01.1 — Organizacja & Dostęp (Phase 1 / MVP)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `organizations` | name, slug, logo_url, timezone, locale, currency, gs1_prefix, onboarding_state | Own org only | ADR-013 |
| `users` | org_id, email, name, role_id (FK), language, is_active, invite_token | Org-scoped; admin-only write | ADR-012, ADR-013 |
| `roles` | code, name, permissions (JSONB), is_system, org_id, display_order | System=public read; custom=org-scoped | ADR-012 |
| `modules` | code, name, dependencies[], can_disable, display_order | Read-only for all authenticated | ADR-011 |
| `organization_modules` | org_id, module_id, enabled, enabled_at, enabled_by | Org-scoped; admin-only toggle | ADR-011 |
| `user_warehouse_access` | user_id, warehouse_id, access_level | Admin-managed | Bypass for owner/admin |

**API Endpoints:**
- `GET /api/settings/context` — org context resolution (org, user, role, modules, permissions)
- `GET/PUT /api/settings/organization` — org profile CRUD
- `POST /api/settings/organization/logo` — logo upload (PNG/JPG, max 2MB)
- `GET/POST/PUT/DELETE /api/settings/users` — user lifecycle
- `POST /api/settings/users/:id/resend-invite` — resend invitation
- `POST /api/settings/users/:id/sessions/terminate` — kill all sessions
- `GET /api/settings/roles` — list 10 system roles
- `GET/PATCH /api/settings/modules` — list + toggle modules
- `GET/PUT /api/settings/users/:id/warehouse-access` — warehouse access

**Validation (Zod):**
- `organizationSchema`: name 2–100 chars, timezone IANA, locale enum, currency enum
- `userCreateSchema`: email valid, name 2–100 chars, role_id UUID
- `moduleToggleSchema`: module_id UUID, enabled boolean

**Frontend/UX:**
- SET-007: Organization Profile page
- SET-008: User List (sortable: name, email, role, status, last login)
- SET-009: User Create/Edit Modal (role dropdown, warehouse access multi-select)
- SET-010: Invitations tab (pending, resend, cancel)
- SET-011: Roles matrix view (read-only, 10 ról × 11 modułów)
- SET-022: Module Toggles page (switches + dependency warnings)

**Wymagania FR:** FR-SET-001–005 (org), FR-SET-010–018 (users), FR-SET-020–031 (roles), FR-SET-090–097 (modules)

**Status**: ✅ Stories 01.1–01.7 complete.

---

### E01.2 — Onboarding Wizard (Phase 1 / MVP)

**Backend:**
- `organizations.onboarding_state` JSONB tracks wizard progress
- `organizations.onboarding_completed_at` TIMESTAMPTZ
- Wizard steps reuse existing APIs (org, warehouse, location, product, WO)

**Frontend/UX:**
- SET-001: Wizard Launcher (auto-show for new orgs)
- SET-002: Organization Profile Step
- SET-003: First Warehouse Step (name, type, code)
- SET-004: First Location Step (zone/bin in created warehouse)
- SET-005: Link do Technical — "Create your first product" (soft dependency, przekierowanie)
- SET-006: Link do Planning — "Create your first work order" (soft dependency, przekierowanie)
- Completion Celebration (confetti + next steps)
- Skip button on every step
- Progress bar (6 dots)
- Resume capability (tracks last completed step)

**Wymagania FR:** FR-SET-180–188

**Status**: ✅ Stories 01.3, 01.4, 01.14 complete.

---

### E01.3 — Infrastruktura (Phase 1 / MVP)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `warehouses` | org_id, code (unique/org), name, warehouse_type (enum), is_default, address | 5 typów: raw/wip/finished/quarantine/general |
| `locations` | org_id, warehouse_id, parent_id (self-ref), code, name, location_type, level, path (materialized), max_capacity | 4 poziomy: zone→aisle→rack→bin |
| `machines` | org_id, code, name, machine_type, status, capacity_per_hour, specs (JSONB), location_id | Status: active/maintenance/offline |
| `production_lines` | org_id, code, name, status, default_location_id | |
| `line_machines` | line_id, machine_id, sequence | Junction table |

**API Endpoints:**
- `GET/POST/PUT/DELETE /api/settings/warehouses`
- `GET/POST/PUT/DELETE /api/settings/locations` + `GET /locations/tree/:warehouseId`
- `GET/POST/PUT/DELETE /api/settings/machines` + `PUT /machines/:id/status`
- `GET/POST/PUT/DELETE /api/settings/production-lines` + `PUT /production-lines/:id/machines`

**Validation (Zod):**
- `warehouseSchema`: code 2–20 chars (alphanum+dash), warehouse_type enum, is_default boolean
- `locationSchema`: code unique/org, location_type enum, parent_id validates hierarchy level
- `machineSchema`: code unique/org, machine_type enum, capacity_per_hour optional numeric
- `lineSchema`: code unique/org, machines array of {machine_id, sequence}

**Frontend/UX:**
- SET-012/013: Warehouse list + create/edit
- SET-014/015: Location tree view + create/edit (drag & drop future)
- SET-016/017: Machine list + create/edit
- SET-018/019: Production Line list + create/edit (machine assignment with ordering)

**Wymagania FR:** FR-SET-040–046 (warehouses), FR-SET-042–044 (locations), FR-SET-050–056 (machines), FR-SET-060–065 (lines)

**Status**: ✅ Stories 01.8–01.11 complete.

---

### E01.4 — Dane Podstawowe & Audit (Phase 1 / MVP)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `allergens` | code (A01–A14), name, name_pl, name_de, name_fr, icon_url, is_active | **Globalna** tabela (BEZ org_id), read-only EU-14 reference data |
| `org_allergens` | org_id, code, name, is_active | Org-specific custom allergens (rozszerzenie globalne) |
| `tax_codes` | org_id, code, name, rate (decimal 5,4), jurisdiction, effective_from/to, is_default | Rate=0.23 → 23% |
| `audit_log` | org_id, table_name, record_id, action, old_data/new_data (JSONB), user_id, ip_address, action_reason | ADR-008; partycjonowana monthly |

**API Endpoints:**
- `GET/POST/PUT /api/settings/allergens` (no DELETE — soft disable)
- `GET/POST/PUT/DELETE /api/settings/tax-codes`
- `GET /api/settings/audit-logs` (filters: table, record, user, date range, action)

**Audit Trail Implementation (ADR-008):**
1. PG trigger `audit_trigger_func()` na WSZYSTKICH audytowanych tabelach
2. App context via `set_audit_context()` RPC (user_id, session_id, ip_address, user_agent, action_reason)
3. Middleware ustawia context przed każdą operacją
4. Changed fields computed automatycznie w triggerze

**Wymagania FR:** FR-SET-070–073 (allergens), FR-SET-080–084 (tax codes), FR-SET-140–144 (audit)

**Status**: ✅ Stories 01.12, 01.13, 01.17 complete.

---

### E01.5 — Bezpieczeństwo & Lokalizacja (Phase 1 / MVP Stretch)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `org_security_policies` | org_id (unique), password_min_length, session_timeout_minutes, lockout_threshold | 1 rekord per org |
| `login_attempts` | user_id, email, ip_address, success, failure_reason | Rate limiting |
| `password_history` | user_id, password_hash | Last 5 |

**Wymagania FR:** FR-SET-013–014 (session, password), FR-SET-171–173 (security), FR-SET-110–116 (multi-language)

**Multi-language:**
- next-intl z namespace per moduł
- PL/EN w Phase 1 (DE/FR Phase 2)
- Fallback: EN zawsze dostępny
- User-level preference nadpisuje org default

**Status**: ✅ Story 01.15 complete. Multi-language: zaplanowane (01.20a/b).

---

### E01.6 — Konfiguracja zaawansowana (Phase 2)

Nowe wymagania z PRD-UPDATE-LIST — wszystkie wynikają z analizy D365 i Raporting:

**[1.1] Multi-country VAT — HIGH**

Rozszerzenie tax_codes o pełne wsparcie multi-country:
- Kody D365: `POL-23%`, `POL-8%`, `POL-5%`, `POL-0%`, `RC+`, `RC-`, `Packing Duty`
- Nowe pole: `country_code` (ISO 3166-1 alpha-2)
- Nowe pole: `tax_type` enum: `standard`, `reduced`, `zero`, `reverse_charge`, `duty`
- Grupowanie per kraj w UI
- Backend: ALTER TABLE `tax_codes` ADD `country_code`, `tax_type`
- API: `GET /api/settings/tax-codes?country=PL`

**[1.2] Waste categories config — HIGH**

Konfigurowalne kategorie odpadu — organizacja dodaje własne kategorie specyficzne dla branży:
- Domyślne ogólne: `waste_general`, `overproduction`, `spillage`
- Custom per branża: piekarnia → `evaporation`; mięso → `fat_trim`, `floor`; metalurgia → `smelting_loss`
- UI: pole "Add category" pozwala dodawać dowolne kategorie
- Backend: CREATE TABLE `waste_categories` (org_id, code, name, is_default, is_active, display_order)
- API: `GET/POST/PUT/DELETE /api/settings/waste-categories`
- Dependency: M06 Production (wo_waste references waste_categories)
- **Ownership**: M01 Settings jest właścicielem tabeli `waste_categories`. Inne moduły (M06 Production, M15 Reporting) referencują tę tabelę przez FK `waste_category_id`. Konfiguracja (CRUD) waste categories odbywa się WYŁĄCZNIE przez M01 Settings UI i API.

**[1.3] Grade thresholds config — MEDIUM**

Progi ocen A/B/C/D dla wskaźników produkcyjnych:
- Per metryka (Yield%, Giveaway%, Efficiency%)
- Per linia (opcjonalne)
- Backend: CREATE TABLE `grade_thresholds` (org_id, metric_code, grade, min_value, max_value, line_id nullable)
- API: `GET/PUT /api/settings/grade-thresholds`
- Dependency: M15 Reporting (Leader Scorecard)

**[1.4] Fiscal calendar — HIGH**

Kalendarz fiskalny z wyborem systemu:
- **Typ kalendarza**: `4-4-5` / `4-5-4` / `5-4-4` / `calendar_months` (standard)
- Konfigurowalna data startu roku fiskalnego
- Auto-generacja periodów na podstawie wybranego schematu
- Backend: `fiscal_calendar_type` enum w `organization_settings`
- Backend: CREATE TABLE `fiscal_calendar` (org_id, year, period_number, start_date, end_date, weeks)
- Backend: `fiscal_year_start_month` w `organization_settings`
- API: `GET/PUT /api/settings/fiscal-calendar`
- Dependency: M15 Reporting (Period Reports)

**[1.5] Target KPI per line/product — HIGH**

Cele KPI konfigurowane per linia produkcyjna i/lub produkt:
- Metryki: yield_pct, giveaway_pct, efficiency_pct, kg_output
- Per line_id (opcjonalne) i product_id (opcjonalne)
- Effective from/to dates
- Backend: CREATE TABLE `target_kpis` (org_id, metric_code, target_value, line_id, product_id, effective_from, effective_to)
- API: `GET/POST/PUT/DELETE /api/settings/target-kpis`
- Dependency: M15 Reporting (Factory Overview, Yield by Line)

**[1.6] Disposition codes — MEDIUM**

Kody dyspozycji dla zwrotów i QA:
- Domyślne: `accept`, `reject`, `quarantine`, `scrap`, `rework`
- Custom per organizacja
- Backend: CREATE TABLE `disposition_codes` (org_id, code, name, action_type enum, is_default, is_active)
- API: `GET/POST/PUT/DELETE /api/settings/disposition-codes`
- Dependency: M03 Warehouse, M08 Quality

**[1.7] Cost per KG — PRZENIESIONE DO M02**

~~Konfiguracja kosztu per KG~~ → Przeniesione do M02 Technical (Products). Każdy produkt ma indywidualną wartość `cost_per_kg` — to atrybut produktu, nie ustawienie globalne Settings. Patrz: PRD M02 Technical, pole `products.cost_per_kg`.

---

### E01.7 — Integracje & Powiadomienia (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `api_keys` | org_id, name, key_hash (bcrypt), key_prefix, permissions (JSONB), status | Admin-only; key shown ONCE at creation |
| `webhooks` | org_id, name, url, secret (HMAC), events[], status, retry_count | Events: work_order.created, inventory.updated etc. |
| `webhook_deliveries` | webhook_id, event, payload, status_code, duration_ms, attempt | Retry: 3× exponential backoff |
| `notification_preferences` | user_id, org_id, category, event, channel_email, channel_in_app | Per user per event |

**API Endpoints:**
- `GET/POST/DELETE /api/settings/api-keys` + `PUT /api-keys/:id/regenerate`
- `GET/POST/PUT/DELETE /api/settings/webhooks` + `POST /webhooks/:id/test` + `GET /webhooks/:id/deliveries`
- `GET/PUT /api/settings/notifications`

**MFA/2FA:**
- TOTP (Google Authenticator, Authy)
- Konfiguracja: `disabled` | `optional` | `required_admins` | `required_all`
- Backend: Supabase Auth MFA integration

**Multi-language rozszerzenie:**
- Dodanie DE, FR do istniejącej infrastruktury next-intl

**Wymagania FR:** FR-SET-015 (MFA), FR-SET-120–125 (API keys), FR-SET-130–135 (webhooks), FR-SET-160–163 (notifications)

---

### E01.8 — Enterprise (Phase 3)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `org_subscriptions` | org_id, plan (free/premium/enterprise), stripe_customer_id, status | Stripe integration |
| `invoices` | org_id, stripe_invoice_id, amount_cents, currency, status | PDF URL from Stripe |
| `payment_methods` | org_id, stripe_payment_method_id, brand, last4, is_default | Card only for MVP billing |
| `import_history` | org_id, data_type, file_name, status, total_rows, imported/skipped/error_rows | CSV parsing + validation |
| `ip_whitelist` | org_id, ip_address (INET), label | Admin-only |

**API Endpoints:**
- `GET/POST /api/settings/subscription` + upgrade/cancel
- `GET /api/settings/billing/invoices` + payment-methods CRUD
- `POST /api/settings/import` + templates + history
- `POST /api/settings/export`
- `GET/POST/DELETE /api/settings/security/ip-whitelist`

**GDPR:**
- Data export (user's personal data)
- Data deletion (anonymize, not delete — preserve audit integrity)
- Consent tracking

**Custom Roles (ADR-012 rozszerzenie):**
- `is_system=false`, `org_id NOT NULL`
- Clone from system role + modify
- Max 50 custom roles per org

**Wymagania FR:** FR-SET-100–106 (billing), FR-SET-150–155 (import/export), FR-SET-170 (IP whitelist), FR-SET-174 (GDPR)

---

## 9. KPIs

### Operacyjne Settings
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Onboarding completion rate | > 70% | orgs with onboarding_completed_at / total orgs |
| Avg onboarding time | < 15 min | onboarding_completed_at - created_at |
| Modules activated per org | ≥ 3 w 7 dni | organization_modules |
| Users per org (avg) | > 5 | users count |
| Role distribution | ≥ 3 różne role per org | users group by role |
| Audit log coverage | 100% tabel krytycznych | Automated trigger check |

### Performance Settings
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Settings API P95 | < 500 ms | APM |
| Settings page load P95 | < 2 s | Lighthouse |
| User list load (500 users) | < 1 s | APM |
| Location tree load (5000 nodes) | < 2 s | APM |
| Permission check | < 10 ms | Redis cache hit |

### Phase 2 KPIs (z PRD-UPDATE-LIST)
| KPI | Cel | Moduł zależny |
|-----|-----|---------------|
| Waste categories configured | 100% orgs z Production | M04 |
| Target KPIs set per line | > 80% linii | M13 |
| Fiscal calendar configured | 100% orgs z Reporting | M13 |

---

## 10. Risks

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Luka RLS → cross-tenant data leak | Średnie | Krytyczny | Testy automatyczne org_id isolation; security audit przed launch |
| Permission bypass → unauthorized action | Średnie | Wysoki | Middleware check na KAŻDYM API route; unit testy permission matrix |
| Onboarding friction → drop-off | Średnie | Wysoki | Skip na każdym kroku; resume; telemetria per step |
| Audit trail gaps → regulatory non-compliance | Niskie | Krytyczny | CI check: missing triggers; automated test coverage |
| Module dependency error → broken state | Niskie | Średni | Dependency graph validation; rollback on failure |
| Password/session misconfiguration | Niskie | Średni | Sensowne defaults; admin-only config; validation |
| Phase 2 config complexity (7 nowych tabel) | Średnie | Średni | Incremental delivery; shared CRUD patterns |
| Billing integration (Stripe) failure | Niskie | Wysoki | Graceful degradation; manual override; Phase 3 only |

### Tech Debt (Settings-specific)
- **P0**: Brak transakcji DB w multi-step operations (np. user create + invite)
- **P1**: Brak paginacji w user list (ok do ~200, problem przy 500+)
- **P1**: Brak rate limiting na invite/login endpoints
- **P2**: Location tree nie ma lazy loading (problem przy 5000+ nodes)
- **P2**: Audit log query bez partycjonowania (ok do ~100K records)

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] Organization profile CRUD działa (logo upload, timezone, locale, currency)
- [ ] 10 ról z pełną matrycą uprawnień CRUD per moduł
- [ ] Module toggles z walidacją zależności
- [ ] User management: create, invite (email), deactivate, role assign
- [ ] Onboarding wizard: 6 kroków, < 15 min, skip + resume
- [ ] Warehouses CRUD (5 typów) z default assignment
- [ ] Locations: 4-level hierarchy (zone/aisle/rack/bin) z tree view
- [ ] Machines CRUD ze statusem i capacity
- [ ] Production Lines z machine sequence
- [ ] Allergens EU-14 seeded per org z multi-language labels
- [ ] Tax codes CRUD z effective dates
- [ ] Audit trail: PG triggers + app context na WSZYSTKICH krytycznych tabelach
- [ ] Session management + password policies
- [ ] Warehouse access restrictions per user

### Niefunkcjonalne
- [ ] RLS: 0 cross-tenant leaks w automated tests
- [ ] Settings API P95 < 500 ms
- [ ] Settings pages P95 < 2 s
- [ ] Permission check < 10 ms (cached)
- [ ] Audit trail 100% coverage on critical tables

### Biznesowe
- [ ] Onboarding completion > 70%
- [ ] ≥ 3 moduły activated per org w 7 dni
- [ ] 0 bugów Critical/High w Settings

---

## 12. References

### Dokumenty źródłowe
- Foundation PRD → `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Poprzedni Settings PRD (v2.3) → `new-doc/01-settings/prd/settings.md`
- Settings Analysis → `new-doc/01-settings/ANALYSIS.md`
- PRD Update List (77 items) → `new-doc/_meta/PRD-UPDATE-LIST.md`
- Design Guidelines → `new-doc/_meta/DESIGN-GUIDELINES.md`

### ADR (Settings-relevant)
- ADR-003: Multi-Tenancy RLS
- ADR-008: Audit Trail Strategy → `new-doc/01-settings/decisions/ADR-008-audit-trail-strategy.md`
- ADR-011: Module Toggle Storage → `new-doc/01-settings/decisions/ADR-011-module-toggle-storage.md`
- ADR-012: Role Permission Storage → `new-doc/01-settings/decisions/ADR-012-role-permission-storage.md`
- ADR-013: RLS Org Isolation Pattern → `new-doc/00-foundation/decisions/ADR-013-rls-org-isolation-pattern.md`
- Settings Architecture → `new-doc/01-settings/decisions/settings-arch.md`

### Implementation artifacts
- Stories 01.1–01.17 → `new-doc/01-settings/stories/`
- UX Wireframes SET-000–SET-031 → `new-doc/01-settings/ux/`
- API docs → `new-doc/01-settings/api/`
- 314 plików dokumentacji (audit: ANALYSIS.md)

### Database schema
- Core: `organizations`, `users`, `roles`, `modules`, `organization_modules`
- Infrastructure: `warehouses`, `locations`, `machines`, `production_lines`, `line_machines`
- Master data: `allergens` (globalna, read-only), `org_allergens` (custom per org), `tax_codes`
- Security: `org_security_policies`, `login_attempts`, `password_history`, `ip_whitelist`
- Audit: `audit_log` (partitioned monthly)
- Phase 2: `waste_categories`, `grade_thresholds`, `fiscal_calendar`, `target_kpis`, `disposition_codes`
- Phase 2: `api_keys`, `webhooks`, `webhook_deliveries`, `notification_preferences`
- Phase 3: `org_subscriptions`, `invoices`, `payment_methods`, `import_history`

### FR Coverage Summary
- **Phase 1 complete**: ~75 FR (stories 01.1–01.17)
- **Phase 2 planned**: ~24 FR + 7 nowych [1.1–1.7]
- **Phase 3 planned**: ~13 FR
- **Total**: 106 wymagań

---

_PRD 01-Settings v3.1 — 8 epików (5 MVP + 2 Phase 2 + 1 Phase 3), 106 wymagań, 5 ADR, 13 decyzji Settings-specific._
_Wyjaśnienia: Owner (nie Super Admin), GBP default, alergeny globalne + org extensions, waste customizable, fiscal calendar choice, cost_per_kg → M02, site_id → M14, onboarding soft deps._
_Data: 2026-02-16_
