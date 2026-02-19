# PRD M09-NPD — MonoPilot MES: New Product Development

**Wersja**: 1.1 | **Data**: 2026-02-18 | **Status**: Draft
**Moduł**: M09 — NPD (New Product Development)
**Typ**: Premium Add-on (+$30/użytkownik/miesiąc, Growth/Enterprise)
**Estymacja**: 18 stories, 50–66 dni, 11+ nowych tabel DB

---

## 1. Executive Summary

Moduł NPD (New Product Development) umożliwia strukturyzowane zarządzanie innowacjami produktowymi w branży spożywczej — od idei (G0) przez rozwój receptury, walidację kosztową i compliance, aż po handoff do produkcji (Product + BOM + Pilot WO). Oparty na metodologii **Stage-Gate** (G0→G1→G2→G3→G4→Launched), moduł zapewnia pełną trasowalność, kontrolę kosztów, zgodność regulacyjną (FDA 21 CFR Part 11, EU 1169/2011, HACCP) oraz immutable audit trail.

**Tryb dualny**: Zintegrowany z produkcją (handoff wizard) LUB standalone dla konsultingów R&D (NPD-only mode z eksportem PDF/Excel).

**Pozycjonowanie**: Premium add-on dla tier Growth/Enterprise. Nie jest dostępny w planie Free.

---

## 2. Objectives

### Cel główny
Dostarczyć kompletny cykl życia produktu od idei do produkcji, eliminując ręczne przekazywanie danych między R&D a produkcją i zapewniając zgodność regulacyjną na każdym etapie.

### Cele szczegółowe
1. **Strukturyzowana innowacja** — Stage-Gate z checklistami i zatwierdzeniami per gate
2. **Kontrola kosztów** — target costing z progami variance (warning 20%, blocker 50%)
3. **Compliance-first** — HACCP, alergeny EU-14, label proof wymagane przed handoff
4. **Seamless handoff** — Formulation → Product + BOM + Pilot WO w jednej transakcji
5. **NPD-only mode** — Standalone dla konsultingów R&D (eksport PDF/Excel)
6. **Immutable audit trail** — FDA 21 CFR Part 11 compliance

### Metryki sukcesu (6 miesięcy po launch)

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Adopcja NPD | 30% klientów Growth/Enterprise | Billing |
| Time-to-market | Redukcja o 25% | Średni czas G0→Launched |
| Handoff success rate | >95% bez rollback | npd_events |
| Cost variance accuracy | <15% odchylenie estimated vs actual | npd_costing |
| Gate velocity | <14 dni/gate średnio | npd_gate_transitions |

---

## 3. Personas

### Persony główne NPD

**1. NPD Lead** — Zarządza projektami NPD, tworzy projekty, zarządza gate'ami, inicjuje handoff. Pełny dostęp do własnych projektów. Zatwierdza G0-G1.

**2. R&D Specialist / Formulator** — Tworzy i iteruje receptury, zarządza wersjami formulations, dodaje składniki. Dostęp do przypisanych formulations.

**3. Finance Manager** — Ustawia target cost, zatwierdza costing, monitoruje variance. Widzi wszystkie projekty, zatwierdza costing.

**4. QA Manager / Quality Director** — Zatwierdza G3-G4, waliduje compliance docs, weryfikuje allergen declarations. Zatwierdza gate'y wymagające oversight.

**5. Regulatory Specialist** — Uploaduje compliance docs (HACCP, label proof, CoA, SDS), zarządza dokumentacją regulacyjną.

**6. Production Manager** — Odbiera handoff, widzi launched projects, wykonuje pilot WO. Dostęp read-only do launched projektów.

**7. Director / Executive** — Zatwierdza G3-G4, widok portfolio (Kanban/Timeline), oversight strategiczny.

**8. System Administrator** — Konfiguruje NPD settings, zarządza rolami, dostęp do audit trail.

**9. R&D Consultant (NPD-only mode)** — Rozwija formulations bez integracji z produkcją, eksportuje PDF/Excel dla klientów.

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP Core, 8 stories, 22-28 dni)

| Story | Nazwa | Priorytet |
|-------|-------|-----------|
| 09.1 | NPD Settings & Module Config | Must Have |
| 09.2 | NPD Projects CRUD & Kanban Dashboard | Must Have |
| 09.3 | Stage-Gate Workflow | Must Have |
| 09.4 | Formulations CRUD & Versioning | Must Have |
| 09.5 | Allergen Aggregation & Display | Must Have |
| 09.6 | Gate Approvals & History | Must Have |
| 09.7 | Formulation Costing | Must Have |
| 09.8 | Compliance Documents Upload | Must Have |

### 4.2 In Scope — Phase 2 (Advanced, 7 stories, 20-26 dni)

| Story | Nazwa | Priorytet |
|-------|-------|-----------|
| 09.9 | Formulation Compare & Clone | Should Have |
| 09.10 | Risk Management | Should Have |
| 09.11 | Handoff Wizard (8-step) | **P0 Critical** |
| 09.12 | Handoff: Formulation → BOM | **P0 Critical** |
| 09.13 | Handoff: Pilot WO Creation | **P0 Critical** |
| 09.14 | NPD-Only Mode & Export | Should Have |
| 09.15 | Event Sourcing & Notifications | Should Have |

### 4.3 In Scope — Phase 3 (Enterprise, 3 stories, 8-12 dni)

| Story | Nazwa | Priorytet |
|-------|-------|-----------|
| 09.16 | Timeline View & Reporting | Nice to Have |
| 09.17 | Finance Approval Workflow | Should Have |
| 09.18 | Access Control & Audit Trail | Must Have |

### 4.4 Exclusions (poza zakresem)

- Multi-formulation handoff (batch) — Phase 4+
- Custom report builder — Phase 4+
- Real-time event streaming (WebSockets) — Phase 4+
- SMS/Slack notifications — Phase 4+
- AI/ML cost optimization — nie planowane
- Cross-contamination warnings (production line history) — Phase 4+
- Drag-to-reschedule na timeline — Phase 4+
- Multi-level approval chains — Phase 4+
- Approval delegation (OOO) — Phase 4+
- Mobile signature capture — Phase 4+
- Document versioning — Phase 4+
- OCR full-text search w dokumentach — Phase 4+
- E-signature integration (external) — Phase 4+
- Custom notification templates — Phase 4+
- Risk templates/library — Phase 4+
- Automated risk detection — Phase 4+
- Three-way formulation comparison — Phase 4+
- Branded PDF z org logo — Phase 4+

---

## 5. Constraints

### Techniczne
- **Supabase** — PostgreSQL + Auth + Storage + Edge Functions; vendor lock-in mitigowalny (standard PG)
- **Next.js 16 + React 19** — App Router, Server Components
- **RLS** — `org_id` na KAŻDEJ tabeli NPD, KAŻDE zapytanie filtrowane przez org_id
- **site_id** — `site_id UUID NULL` na WSZYSTKICH 16 tabelach M09 NPD (przygotowanie na M11 Multi-Site). NULL = org-wide (brak przypisania do konkretnego zakładu). Dotyczy: `npd_settings`, `npd_projects`, `npd_project_number_sequences`, `npd_gate_checklists`, `npd_project_checklist_completion`, `npd_gate_transitions`, `npd_formulations`, `npd_formulation_items`, `npd_approvals`, `npd_costing`, `npd_compliance_docs`, `npd_risks`, `npd_events`, `notifications`, `user_notification_preferences`, `npd_audit_log`. Migration pattern: `ALTER TABLE {table} ADD COLUMN site_id UUID NULL;` (bez FK constraint na etapie M09 — FK do tabeli `sites` zostanie dodana w M11 Multi-Site).
- **Zod** — Walidacja wszystkich inputów API
- **Service Layer** — Logika w `lib/services/npd-*-service.ts`, NIGDY bezpośrednio DB z route
- **Supabase Storage** — Compliance docs, bucket `npd-compliance-docs`, signed URLs 1h expiry, limit 50MB/plik
- **Immutable tables** — `npd_gate_transitions`, `npd_approvals`, `npd_audit_log` — brak UPDATE/DELETE (RLS enforced)

### Biznesowe
- **Premium add-on** — +$30/użytkownik/miesiąc, dostępny tylko Growth/Enterprise
- **NPD-only mode** — Standalone dla R&D consultancies bez modułu Production
- **Pricing gate** — Free tier nie może włączyć NPD (`enable_npd_module` blokowane)

### Regulacyjne
- **FDA 21 CFR Part 11** — Immutable audit trail, e-signature support, timestamped approvals
- **EU 1169/2011** — 14 obowiązkowych alergenów, multi-language (EN/PL/DE/FR)
- **HACCP** — Wymagane dokumenty przed G4 (HACCP plan, label proof)
- **ISO 9001** — Dokumentacja quality management, audit trail

---

## 6. Decisions

### D-NPD-01: Premium Add-on Model
NPD jest premium add-on (+$30/user/month) dla tierów Growth/Enterprise. Free tier nie ma dostępu. Toggle `enable_npd_module` w `npd_settings`. Middleware blokuje `/npd/*` dla nieaktywnych org.

### D-NPD-02: Stage-Gate Methodology (G0→G4→Launched)
Sekwencyjne przechodzenie gate'ów — **nie można pominąć gate'a**. G0→G1→G2→G3→G4→Launched. Move-back dozwolony z uzasadnieniem. Immutable audit trail w `npd_gate_transitions`.

### D-NPD-03: Formulation Immutability After Lock
Status flow: `draft → approved → locked`. Po lock formulation jest **immutable** — brak UPDATE/DELETE. Trigger DB blokuje zmiany. Nowa wersja wymaga clone.

### D-NPD-04: Transactional Handoff (Product + BOM + Pilot WO)
Handoff wykonywany w jednej transakcji DB. Sekwencja: lock formulation → create/update product → create BOM → copy items → create pilot WO → link routing → update project status → log event → COMMIT. Rollback na failure. Concurrent handoff prevention (optimistic locking).

### D-NPD-05: Finance Approval Gating
Costing musi być approved przez Finance przed handoff (konfigurowalny toggle `require_costing_approval`). Auto-approve jeśli variance < threshold (default 10%). Variance ≥20% = warning, ≥50% = blocker.

### D-NPD-06: NPD-Only Mode for R&D Consultancies
Toggle `npd_only_mode` w settings. Gdy aktywny: handoff wizard ukryty, eksport PDF/Excel dostępny. Formulation musi być locked przed eksportem. Audit logging eksportów.

### D-NPD-07: Allergen Aggregation (read-only z Epic 01)
Alergeny to **read-only reference data** z tabeli `allergens` (Epic 01). NPD agreguje alergeny z `product_allergens` junction table. 14 obowiązkowych alergenów EU. Multi-language names (EN/PL/DE/FR). Color-coded badge: 0=green, 1-5=yellow, >5=orange.

### D-NPD-08: Event Sourcing with Retry
Tabela `npd_events` loguje: gate_advanced, formulation_locked, costing_submitted, handoff_completed. Retry mechanism: max 3 retries, exponential backoff (1min, 2min, 4min). Admin manual retry z force flag.

### D-NPD-09: Immutable Audit Trail (FDA compliance)
Tabela `npd_audit_log` — append-only, brak UPDATE/DELETE (RLS policies blokują). Database triggers automatycznie logują INSERT/UPDATE/DELETE na wszystkich tabelach NPD. Pola: old_values, new_values, changed_fields, user_id, ip_address.

### D-NPD-10: RLS per NPD Role (6 ról)

| Rola | Dostęp |
|------|--------|
| NPD_LEAD | Full CRUD własne projekty |
| R&D | Assigned formulations only |
| FINANCE | View all + approve costing |
| REGULATORY | Upload/delete compliance docs |
| PRODUCTION | View launched only |
| ADMIN | Full access |

### Mapowanie ról NPD na role systemowe (ADR-012)

| Rola NPD | Rola systemowa (ADR-012) | Uzasadnienie |
|----------|--------------------------|--------------|
| NPD_LEAD | production_manager | Zarządza procesem NPD, decyzje operacyjne |
| R&D | quality_manager + custom NPD permission | Formulation, testy laboratoryjne |
| FINANCE | finance_manager | Cost analysis, pricing approval |
| REGULATORY | quality_manager | Compliance, etykietowanie, regulatory |
| PRODUCTION | production_manager (read-only NPD) | Pilot batch, feedback produkcyjny |
| ADMIN | admin | Pełne uprawnienia NPD |

**Uwaga**: Rola NPD to DODATKOWE uprawnienie nadawane w kontekście modułu NPD (M09). Nie zastępuje roli systemowej — uzupełnia ją o NPD-specific permissions. Użytkownik musi mieć ZARÓWNO odpowiednią rolę systemową (ADR-012) JAK I rolę NPD przypisaną w module, aby wykonywać operacje NPD-specific (np. approve gate, lock formulation, execute handoff). Rola systemowa kontroluje dostęp na poziomie CRUD ogólnosystemowym.

### D-NPD-11: org_id / Multi-tenancy
`org_id UUID NOT NULL` na KAŻDEJ tabeli NPD. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Nigdy nie ufaj client-provided org_id.

### D-NPD-12: site_id / Multi-Site (przygotowanie na M11)
`site_id UUID NULL` na WSZYSTKICH tabelach M09 (16 tabel NPD + notifications + user_notification_preferences). Przygotowanie na M11 Multi-Site. Wartość NULL = org-wide (brak przypisania do konkretnego zakładu). Nie jest to FK enforced na etapie M09 — referencja do tabeli `sites` zostanie dodana w M11. Tabela `npd_formulation_items` dziedziczy site_id przez FK do `npd_formulations`.

---

## 7. Module Map

### NPD Sub-areas & Dependency Graph

```
09.1 Settings
 └── 09.2 Projects CRUD & Kanban
      ├── 09.3 Stage-Gate Workflow
      │    └── 09.6 Gate Approvals & History
      │         └── 09.17 Finance Approval Workflow (Phase 3)
      ├── 09.4 Formulations CRUD & Versioning
      │    ├── 09.5 Allergen Aggregation & Display
      │    ├── 09.7 Formulation Costing
      │    │    ├── 09.11 Handoff Wizard (Phase 2, P0)
      │    │    │    ├── 09.12 Handoff: Formulation → BOM (Phase 2, P0)
      │    │    │    │    └── 09.13 Handoff: Pilot WO Creation (Phase 2, P0)
      │    │    ├── 09.15 Event Sourcing & Notifications (Phase 2)
      │    │    ├── 09.16 Timeline View & Reporting (Phase 3)
      │    │    └── 09.17 Finance Approval Workflow (Phase 3)
      │    ├── 09.9 Formulation Compare & Clone (Phase 2)
      │    └── 09.14 NPD-Only Mode & Export (Phase 2)
      ├── 09.8 Compliance Documents Upload
      ├── 09.10 Risk Management (Phase 2)
      └── 09.18 Access Control & Audit Trail (Phase 3)
```

### Wewnątrz-epicowe zależności (podsumowanie)

| Od | Do | Typ |
|----|-----|-----|
| 09.1 | 09.2 | HARD |
| 09.2 | 09.3, 09.4, 09.8, 09.10 | HARD |
| 09.3 | 09.6 | HARD |
| 09.4 | 09.5, 09.7, 09.9, 09.14 | HARD |
| 09.6 | 09.17 | HARD |
| 09.7 | 09.11, 09.15, 09.16, 09.17 | HARD |
| 09.11 | 09.12 | HARD |
| 09.12 | 09.13 | HARD |

### Cross-Epic Dependencies

| Zależność | Epic/Story | Typ | Co dostarcza |
|-----------|-----------|-----|-------------|
| Epic 01 (Settings) | 01.1, 01.12 | HARD | organizations, users, roles, RLS, allergens table |
| Epic 02 (Technical) | 02.1, 02.2/02.4 | HARD | products table, BOMs table |
| Epic 03 (Planning) | 03.2/03.10 | HARD | work_orders table |
| Epic 04 (Routings) | 04.1 | SOFT | routings table (pilot WO routing) |

### Nowe tabele DB (16 tabel)

| Tabela | Phase | Story | Opis |
|--------|-------|-------|------|
| `npd_settings` | 1 | 09.1 | Konfiguracja modułu per org |
| `npd_projects` | 1 | 09.2 | Projekty NPD z Stage-Gate |
| `npd_project_number_sequences` | 1 | 09.2 | Sekwencje numeracji NPD-YYYY-NNNNN |
| `npd_gate_checklists` | 1 | 09.3 | Domyślne checklisty per gate per org |
| `npd_project_checklist_completion` | 1 | 09.3 | Tracking completion per projekt |
| `npd_gate_transitions` | 1 | 09.3 | Immutable audit trail gate transitions |
| `npd_formulations` | 1 | 09.4 | Receptury z wersjonowaniem |
| `npd_formulation_items` | 1 | 09.4 | Składniki receptury |
| `npd_approvals` | 1 | 09.6 | Gate approvals (immutable) |
| `npd_costing` | 1 | 09.7 | Costing per formulation |
| `npd_compliance_docs` | 1 | 09.8 | Dokumenty compliance (soft delete) |
| `npd_risks` | 2 | 09.10 | Risk register |
| `npd_events` | 2 | 09.15 | Event sourcing log |
| `notifications` | 2 | 09.15 | Notification center (**shared** — globalna tabela systemowa, reużywana przez inne moduły) |
| `user_notification_preferences` | 2 | 09.15 | Preferencje notyfikacji (**shared** — globalna tabela systemowa) |
| `npd_audit_log` | 3 | 09.18 | Immutable audit trail (triggers) |

### Rozszerzenia istniejących tabel

```sql
-- work_orders
ADD COLUMN type VARCHAR(20) DEFAULT 'production';
ADD COLUMN npd_project_id INTEGER;

-- products
ADD COLUMN npd_project_id INTEGER;
ADD COLUMN source VARCHAR(30);
ADD COLUMN npd_origin BOOLEAN DEFAULT false;

-- boms
ADD COLUMN npd_formulation_id INTEGER;
ADD COLUMN source VARCHAR(30);
```

---

## 8. Requirements

### Phase 1 — MVP Core (8 stories, 22-28 dni)

---

#### 09.1 NPD Settings & Module Config
**Rozmiar**: S (1-2 dni) | **Typ**: Backend | **Zależności**: 01.1 (HARD), 04.1 (SOFT)

**Backend**:
- Tabela `npd_settings` z polami: `org_id` (UUID FK), `site_id` (UUID NULL — przygotowanie na M11 Multi-Site), `enable_npd_module`, `npd_only_mode`, `enable_pilot_wo`, `default_pilot_routing`, `require_costing_approval`, `cost_variance_warning_pct` (default 20), `cost_variance_blocker_pct` (default 50), `require_compliance_docs`, `max_formulation_versions` (default 10), `enable_formulation_export`, `event_retention_days` (default 90), `enable_e_signature` (BOOLEAN DEFAULT false — włącza potwierdzenie hasłem przy gate approvals)
- Constraint: `cost_variance_warning_pct <= cost_variance_blocker_pct`
- Constraint: `npd_settings_org_unique UNIQUE (org_id)`
- Auto-create defaults on org creation
- RLS: read own org, update only ADMIN/SUPER_ADMIN
- API: `GET /api/npd/settings` (creates defaults if not exist), `PUT /api/npd/settings` (admin only)
- Service: `npd-settings-service.ts` z metodami: `getSettings()`, `updateSettings()`, `createDefaultSettings()`, `isNPDEnabled()`, `isNPDOnlyMode()`, `canEnableNPD()`, `getCostVarianceThresholds()`, `evaluateCostVariance()`, `validateHandoffEligibility()`
- Zod schema: `npd-settings.ts` z `.refine()` dla warning <= blocker
- Rozszerzenia tabel: work_orders (type, npd_project_id), products (npd_project_id, source, npd_origin), boms (npd_formulation_id, source)
- Feature flag middleware: blokuje `/npd/*` gdy `enable_npd_module = false` → 403

**Frontend/UX**: Backend-only story. UI settings page planowane w ramach 09.2 lub Settings module.

**Integracje**: 01.1 (org_id context), 04.1 (routings FK — soft dependency)

---

#### 09.2 NPD Projects CRUD & Kanban Dashboard
**Rozmiar**: L (4-5 dni) | **Typ**: Fullstack | **Zależności**: 09.1 (HARD), 01.1 (HARD)

**Backend**:
- Tabela `npd_projects`: id (UUID PK), org_id (UUID FK), site_id (UUID NULL), project_number (TEXT, auto-gen), project_name (TEXT NOT NULL), description (TEXT), portfolio_category (TEXT), current_gate (TEXT CHECK G0/G1/G2/G3/G4/Launched), status (TEXT CHECK idea/feasibility/business_case/development/testing/launched/cancelled), priority (TEXT CHECK low/medium/high DEFAULT medium), owner_id (UUID FK users), target_launch_date (DATE), actual_launch_date (DATE), created_at, created_by, updated_at, updated_by
- UNIQUE constraint: (org_id, project_number)
- Tabela `npd_project_number_sequences`: org_id, site_id (UUID NULL), year, current_value (BIGINT). UNIQUE(org_id, year)
- Funkcja PG: `generate_npd_project_number(p_org_id)` → NPD-YYYY-NNNNN (UPSERT + increment)
- RLS: SELECT/INSERT/UPDATE per org, DELETE only cancelled/idea status
- Indeksy: org_status, org_gate, gate_status, owner, category, priority, target_date, created
- API: `GET /api/npd/projects` (list z filters: category, priority, owner, status, search), `GET /api/npd/projects/:id`, `POST /api/npd/projects`, `PUT /api/npd/projects/:id`, `POST /api/npd/projects/:id/advance-gate`, `DELETE /api/npd/projects/:id` (archive)

**Frontend/UX**:
- Kanban dashboard: 6 kolumn (G0=Ideas, G1=Feasibility, G2=Business Case, G3=Development, G4=Testing, Launched)
- Drag-and-drop gate advancement z confirmation modal
- Sequential only: skip blocked z error "Cannot skip gates. Advance sequentially."
- Move-back dozwolony z warning modal
- Karty: project number (link), name, priority badge (high=red, medium=orange, low=gray), owner avatar+name, target date, category tag
- Sortowanie: priority DESC, created_at DESC
- Filtry: category, priority, owner, status + search (debounce 300ms, case-insensitive)
- Filter count badge, Clear Filters button, URL filter state
- List view toggle: DataTable z columns (Project#, Name, Category, Gate, Status, Priority, Owner, Target Date, Created)
- Project detail page, Create/Edit modals
- Empty state: "No projects in this gate" + [+ New Project] button

**Integracje**: 09.1 (npd_settings for module activation), 01.1 (org_id, users)

---

#### 09.3 Stage-Gate Workflow
**Rozmiar**: L (5-6 dni) | **Typ**: Fullstack | **Zależności**: 09.2 (HARD), 01.1 (HARD), 01.6 (HARD)

**Backend**:
- Rozszerzenie `npd_projects`: gate_entered_at (TIMESTAMPTZ), approved_by (UUID FK), approved_at (TIMESTAMPTZ), move_back_count (INT DEFAULT 0), last_moved_back_at, last_moved_back_by, move_back_reason (TEXT)
- Tabela `npd_gate_checklists`: id (UUID PK), org_id, site_id (UUID NULL), gate (TEXT CHECK G0-G4), item_description (TEXT NOT NULL), is_required (BOOLEAN DEFAULT true), sequence (INT), category (TEXT), is_active (BOOLEAN DEFAULT true). UNIQUE(org_id, gate, item_description)
- Seed function: `seed_npd_gate_checklists(p_org_id)` — 25 domyślnych items (G0: 3, G1: 4, G2: 5, G3: 6, G4: 7) z kategoriami Technical/Business/Compliance
- Tabela `npd_project_checklist_completion`: id (UUID PK), org_id, site_id (UUID NULL), project_id (FK), checklist_id (FK), is_completed (BOOLEAN), completed_by (UUID FK), completed_at, completion_notes, attachment_url. UNIQUE(project_id, checklist_id)
- Tabela `npd_gate_transitions`: **IMMUTABLE** (INSERT only, RLS blocks UPDATE/DELETE). Pola: id (UUID PK), org_id, site_id (UUID NULL), project_id (FK), from_gate, to_gate, transition_type (advance/move_back/cancel), transitioned_by (UUID FK NOT NULL), transitioned_at (TIMESTAMPTZ DEFAULT now()), requires_approval (BOOLEAN), approved_by, approved_at, approval_notes, transition_notes, checklist_completion_pct (DECIMAL), blocking_items (INT), created_at. **Brak updated_at** — records never change
- Gate transition validation: sequential only (G0→G1→G2→G3→G4→Launched), no skipping
- Entry criteria: all required checklist items must be complete before advancement
- Permission matrix:
  - G0→G1: NPD_LEAD, ADMIN (no formal approval)
  - G1→G2: NPD_LEAD, ADMIN (no formal approval)
  - G2→G3: NPD_LEAD, FINANCE, ADMIN (requires approval)
  - G3→G4: QA_MANAGER, DIRECTOR, ADMIN (requires Director approval)
  - G4→Launched: QA_MANAGER, DIRECTOR, ADMIN (requires Director approval)
  - Move-back: NPD_LEAD, DIRECTOR, ADMIN (requires justification)
- API: `POST /api/npd/projects/:id/advance-gate`, `GET /api/npd/projects/:id/checklist`, `POST /api/npd/projects/:id/checklist/:itemId/complete`, `GET /api/npd/projects/:id/gate-history`

**Frontend/UX**:
- Gate timeline component (horizontal stepper z current gate highlighted)
- Gate transition modal z notes + approval
- Checklist panel z completion tracking (✅/❌ per item)
- Move-back modal z required justification text
- Blocking items warning when advancement attempted with incomplete checklist

**Integracje**: 01.1 (org_id), 01.6 (role permissions), 09.2 (npd_projects)

**Compliance**: FDA 21 CFR Part 11 (immutable gate transitions), HACCP (G4 requires HACCP plan), ISO 9001 (documented approval trail)

---

#### 09.4 Formulations CRUD & Versioning
**Rozmiar**: L (5-6 dni) | **Typ**: Fullstack | **Zależności**: 09.2 (HARD), 02.1 (HARD), 01.1 (HARD)

**Backend**:
- Tabela `npd_formulations`: id (UUID PK DEFAULT gen_random_uuid()), org_id (UUID FK), site_id (UUID NULL), npd_project_id (UUID FK), formulation_number (VARCHAR(20) — v1.0/v1.1/v2.0), status (VARCHAR(20) CHECK draft/approved/locked DEFAULT draft), effective_from (DATE), effective_to (DATE), parent_formulation_id (UUID FK self-ref), total_qty (DECIMAL(15,4) CHECK >0), uom (VARCHAR(20)), notes (TEXT), approved_by (UUID FK), approved_at (TIMESTAMPTZ), created_at, updated_at, created_by, updated_by. UNIQUE(npd_project_id, formulation_number)
- Tabela `npd_formulation_items`: id (SERIAL PK), formulation_id (UUID FK CASCADE), product_id (UUID FK products), quantity (DECIMAL(15,4) CHECK >0), uom (VARCHAR(20)), percentage (DECIMAL(5,2) — auto-calculated), notes (TEXT), created_at, updated_at
- Trigger: `check_formulation_date_overlap()` — zapobiega nakładaniu dat effective_from/effective_to dla tego samego projektu. Reguły: daterange overlap check, max 1 formulation z effective_to=NULL per project
- Trigger: `auto_calculate_formulation_item_percentage()` — `NEW.percentage := (NEW.quantity / v_total_qty) * 100`
- Trigger: `prevent_locked_formulation_changes()` — blokuje UPDATE/DELETE na formulations z status='locked'. `RAISE EXCEPTION 'Cannot modify locked formulation'`
- Status flow: draft → approved → locked (**immutable after lock**)
- Version numbering: major.minor (v1.0, v1.1, v2.0)
- Lineage tracking: parent_formulation_id → source formulation
- API: `GET /api/npd/formulations` (list z filters: npd_project_id, status, effective_date, search, page, limit, sortBy, sortOrder), `POST /api/npd/formulations`, `PUT /api/npd/formulations/:id`, `DELETE /api/npd/formulations/:id` (blocked if locked or used in BOM), `POST /api/npd/formulations/:id/lock`, `GET /api/npd/formulations/:id/lineage`, `GET /api/npd/formulations/timeline/:projectId`

**Frontend/UX**:
- Formulation list page: `/npd/projects/:id/formulations` z DataTable (search, filter by status/date, pagination 20/page)
- Row display: Version (v1.0), Status badge, Eff. From, Eff. To, Items count, Total Qty
- Create/Edit formulation form: project selector (locked after creation), version auto-suggest, total_qty, uom, effective dates, notes
- Items table z auto-calculated percentages (recalculate on total_qty change)
- Version timeline visualization: horizontal bars, color-coded by status, clickable, hover tooltip, "Currently Active" highlight, gap/overlap indicators
- Lock confirmation dialog: "Lock formulation? This action cannot be undone."
- Lineage tree navigation (click parent version link)
- Permission enforcement: VIEWER=read-only, R&D=create/edit assigned, NPD_LEAD=delete draft

**Integracje**: 09.2 (npd_project_id), 02.1 (product_id for items)

---

#### 09.5 Allergen Aggregation & Display
**Rozmiar**: M (3-4 dni) | **Typ**: Backend + Frontend | **Zależności**: 09.4 (HARD), 01.12 (HARD), 02.1 (HARD)

**Backend**:
- Funkcja PG: `aggregate_formulation_allergens(p_formulation_id UUID)` — RETURNS TABLE (allergen_id, code, name_en, name_pl, name_de, name_fr, icon_url). DISTINCT allergens z formulation items via `npd_formulation_items → product_allergens → allergens`. Sorted by code ASC. STABLE function.
- API: `GET /api/npd/formulations/:id/allergens` z optional param `lang` (en/pl/de/fr)
- Response: `{ allergens: Allergen[], total: number }` (max 14)
- Service: `NPDFormulationService.getFormulationAllergens()`, `getAllergenCount()`, `getAllergenName(allergen, lang)` z fallback do EN
- EU 1169/2011: 14 mandatory allergens
- Read-only — NPD nie modyfikuje danych alergenów (reference data z Epic 01)
- RLS: 403 for different org
- Performance: query <200ms for 20 items

**Frontend/UX**:
- `FormulationAllergenPanel` — sekcja "Allergen Declaration" na formulation detail page
- `FormulationAllergenBadge` — color-coded count: 0=green "No Allergens", 1-5=yellow "{count} Allergens", >5=orange "{count} Allergens"
- `AllergenList` — sorted by code, z ikonami (24x24, fallback: warning triangle), localized names
- Auto-refresh przy zmianie formulation items (<300ms)
- Multi-language display based on user preference
- Empty state: "No allergens detected"

**Integracje**: 01.12 (allergens table, product_allergens), 02.1 (products), 09.4 (npd_formulation_items)

**Downstream**: 09.11 (handoff wizard validates allergen declaration), 09.12 (allergen data inherited by BOM), 09.3 (G3 checklist "Allergen declaration validated")

---

#### 09.6 Gate Approvals & History
**Rozmiar**: M (2-3 dni) | **Typ**: Fullstack | **Zależności**: 09.3 (HARD), 01.10 (HARD)

**Backend**:
- Tabela `npd_approvals`: id (SERIAL PK), org_id (UUID FK), site_id (UUID NULL), project_id (UUID FK npd_projects), gate (VARCHAR(10) CHECK G0-G4), target_gate (VARCHAR(10) CHECK G1-G4/Launched), result (VARCHAR(20) CHECK approved/rejected), approved_by (UUID FK NOT NULL), approved_at (TIMESTAMPTZ DEFAULT NOW()), notes (TEXT), e_signature (BOOLEAN DEFAULT false), created_at, updated_at. **Immutable** — no UPDATE/DELETE
- Role-based permissions: G0-G2 (NPD_LEAD), G3 (QA_MANAGER), G4 (DIRECTOR)
- E-signature: opcjonalne potwierdzenie hasłem (password verification via Supabase Auth)
- Rejection reason: required, min 10 chars, max 1000 chars
- Concurrent approval prevention: check current gate before save, return error if already approved
- Email notifications: approval → project owner, rejection → project owner z reason
- API: `GET /api/npd/projects/:id/approvals` (sorted by approved_at DESC), `POST /api/npd/projects/:id/gates/:gate/approve` (body: notes?, password?), `POST /api/npd/projects/:id/gates/:gate/reject` (body: reason required)
- Indeksy: project_id, org_id, gate+result, approved_by

**Frontend/UX**:
- Gate approval modal: project info, current/target gate, checklist completion status, notes field, Approve/Reject buttons
- Checklist validation before approval: "Cannot request approval - X required checklist items incomplete"
- Approval history timeline: chronological DESC, shows gate transition, result badge, approver name+role, notes, timestamp
- E-signature modal: password confirmation prompt, "E-signed" badge z lock icon in history
- Rejection reason validation: min 10 chars, max 1000 chars
- Concurrent approval error: "This gate has already been approved by [Name]"
- Mobile responsive: full-screen modal <768px, 48dp touch targets

**Integracje**: 09.3 (gate workflow, checklist completion), 01.10 (roles)

---

#### 09.7 Formulation Costing
**Rozmiar**: M (3-4 dni) | **Typ**: Fullstack | **Zależności**: 09.4 (HARD), 02.1 (HARD)

**Backend**:
- Tabela `npd_costing`: id (UUID PK DEFAULT gen_random_uuid()), org_id (UUID FK), site_id (UUID NULL), npd_project_id (UUID FK), formulation_id (UUID FK npd_formulations), target_cost (DECIMAL(15,4)), estimated_cost (DECIMAL(15,4)), actual_cost (DECIMAL(15,4)), variance_pct (DECIMAL(5,2)), status (VARCHAR(20) CHECK draft/submitted/approved/rejected DEFAULT draft), approved_by (UUID FK), approved_at (TIMESTAMPTZ), notes (TEXT), created_at, updated_at, created_by, updated_by
- Funkcja PG: `calculate_formulation_cost(p_formulation_id)` — `SUM(fi.quantity * p.cost_per_unit)` z products table
- Trigger: `auto_update_formulation_cost()` — recalculate estimated_cost on formulation_items INSERT/UPDATE/DELETE
- Trigger: `auto_calculate_cost_variance()` — `((actual - target) / target) * 100` on npd_costing INSERT/UPDATE
- Variance logic:
  - <0% = favorable (green badge "Under Target")
  - 0-20% = ok (green checkmark)
  - 20-50% = warning (yellow/orange alert, handoff allowed z Finance approval)
  - >50% = blocker (red alert, handoff blocked)
- Finance approval workflow: draft → submitted → approved/rejected
- Auto-recalculate on formulation change (if auto_recalc enabled)
- Cannot edit approved costing (must reject and resubmit)
- API: `GET /api/npd/formulations/:id/costing` (z breakdown + variance_alert + permissions), `PUT .../costing/target`, `POST .../costing/recalculate`, `POST .../costing/submit`, `POST .../costing/approve`, `POST .../costing/reject`, `GET .../costing/history`
- Indeksy: formulation_id, npd_project_id, org_id+status

**Frontend/UX**:
- Costing section na formulation detail page: Target Cost, Estimated Cost, Actual Cost (or "Pending Pilot"), Variance % (color-coded badge), Status badge, Approved By/At
- Cost breakdown table: Ingredient, Quantity, Unit Cost, Total Cost, % of Total
- Variance alerts: warning message (20-50%), blocker message (>50%)
- Action buttons: [Set Target Cost], [Recalculate], [Submit for Approval] (if draft), [Approve]/[Reject] (if submitted, Finance role)
- Warning when product cost_per_unit updated: "Cost data updated. Recalculate for latest estimate."
- Permission enforcement: VIEWER=hidden actions, R&D=set target+recalculate, Finance=approve/reject

**Integracje**: 09.4 (formulation_id), 02.1 (products.cost_per_unit), 09.1 (variance thresholds from npd_settings)

---

#### 09.8 Compliance Documents Upload
**Rozmiar**: M (3-4 dni) | **Typ**: Fullstack | **Zależności**: 09.2 (HARD), 01.1 (HARD)

**Backend**:
- Tabela `npd_compliance_docs`: id (UUID PK), org_id (UUID FK CASCADE), site_id (UUID NULL), npd_project_id (UUID FK CASCADE), doc_type (TEXT CHECK haccp_plan/label_proof/nutritional_info/allergen_declaration/coa/sds/trial_report/sensory_eval/shelf_life/other), file_name (TEXT NOT NULL), file_size_bytes (BIGINT NOT NULL), mime_type (TEXT NOT NULL), storage_path (TEXT NOT NULL), version (TEXT), description (TEXT), notes (TEXT), uploaded_by (UUID FK NOT NULL), uploaded_at (TIMESTAMPTZ DEFAULT now()), updated_at, **deleted_at** (TIMESTAMPTZ — soft delete), deleted_by (UUID FK)
- Supabase Storage: bucket `npd-compliance-docs`, path `{org_id}/{project_id}/{doc_type}/{file_id}_{filename}`
- Signed URL download: 1h expiry via `supabase.storage.createSignedUrl()`
- File validation: PDF, DOCX, XLSX, PNG, JPG, JPEG. Max 50MB per file
- Soft delete: sets deleted_at + deleted_by, RLS excludes deleted from SELECT
- Funkcja PG: `check_required_documents(p_project_id)` — waliduje wymagane docs per gate (G4: HACCP plan required). Returns JSONB `{is_valid, missing[]}`
- API: `GET /api/npd/projects/:id/documents` (excludes deleted), `POST /api/npd/projects/:id/documents` (multipart upload), `DELETE /api/npd/documents/:id` (soft delete), `GET /api/npd/documents/:id/download` (signed URL)
- Indeksy: org_id, project_id (WHERE deleted_at IS NULL), project_id+doc_type, uploaded_at DESC

**Frontend/UX**:
- Drag-and-drop upload z progress indicator (percentage + estimated time)
- Cancel button during upload
- Document list: thumbnail (PDF first page / image), file name, type badge, version, size, uploaded by, uploaded at, actions [Preview][Download][Delete]
- Sorted by uploaded_at DESC, deleted docs hidden
- Document preview modal: PDF inline viewer (PDF.js) z navigation/zoom/fullscreen, image viewer z zoom, unsupported types: "Preview not available" + download button
- Document download: signed URL, Content-Disposition header
- Soft delete: confirmation dialog "Delete '[filename]'? This document will be removed from the project."
- Required documents checklist (G4): HACCP Plan ✅/❌, missing docs highlighted red, warning banner
- Empty state: document icon + "No compliance documents yet" + [+ Upload Document]
- File type validation error: "Invalid file type. Allowed: PDF, DOCX, XLSX, PNG, JPG"
- File size validation error: "File size exceeds limit (50 MB)"
- Permission: owner or NPD_LEAD can delete

**Integracje**: 09.2 (npd_project_id), Supabase Storage

**Compliance**: HACCP (required docs before G4), FDA 21 CFR 101 (nutritional info, label proof), audit trail (upload history)

---

### Phase 2 — Advanced Features (7 stories, 20-26 dni)

---

#### 09.9 Formulation Compare & Clone
**Rozmiar**: M (2-3 dni) | **Typ**: Frontend | **Zależności**: 09.4 (HARD), 09.7 (SOFT)

**Backend**:
- API: `GET /api/npd/formulations/compare?v1=:id1&v2=:id2` — returns diff z added/removed/changed/unchanged items, summary counts, cost difference
- Diff algorithm: match by product_id across both versions. Added = in v2 not v1, Removed = in v1 not v2, Changed = in both but different qty/uom
- API: `POST /api/npd/formulations/:id/clone` — clone z lineage tracking
- Clone logic: copy all items, reset status to draft, set parent_formulation_id, validate version number unique per project
- Version number validation: format `vX.Y` (regex), unique per project
- Validation: both formulations must be from same project, both must exist

**Frontend/UX**:
- Version selection modal: dropdown for Version 1 and Version 2, [Compare] button
- Side-by-side comparison view: `/npd/formulations/compare?v1=:id1&v2=:id2`
- Header: "Comparing v1.0 vs v2.0 - Project NPD-001"
- Summary cards: Total Items v1/v2, Added (green), Removed (red), Changed (yellow), Cost Difference
- Version headers: version, status badge, effective dates, total qty, items count, created by
- Items table: Product, v1 Qty+%, Change indicator (↑/↓/=/+/-), v2 Qty+%. Sorted alphabetically by product name
- Diff highlighting: added items = green highlight in v2 column (gray in v1), removed = red in v1 (gray in v2), changed = yellow highlight, unchanged = white
- Cost difference display: v1 cost, v2 cost, difference $ and % (green if decrease, red if increase)
- Clone modal: source version (locked), new version number (auto-suggest next major), status=draft (locked), total_qty (editable), uom (editable), effective dates, notes
- Clone validation: duplicate version error, invalid format error
- Permission: VIEWER=read-only (clone hidden), R&D/NPD_LEAD=full access
- Performance: comparison load <500ms

**Integracje**: 09.4 (formulations, items), 09.7 (costing data — graceful degradation if unavailable)

---

#### 09.10 Risk Management
**Rozmiar**: M (3-4 dni) | **Typ**: Fullstack | **Zależności**: 09.2 (HARD)

**Backend**:
- Tabela `npd_risks`: id (SERIAL PK), org_id (UUID FK), site_id (UUID NULL), npd_project_id (UUID FK), risk_description (TEXT NOT NULL), likelihood (INT CHECK 1-5), impact (INT CHECK 1-5), risk_score (INT — calculated: likelihood × impact, range 1-25), mitigation_plan (TEXT), status (VARCHAR(20) CHECK open/mitigated/closed DEFAULT open), owner_id (UUID FK users), created_at, updated_at, created_by (UUID FK)
- Risk score color mapping: 1-5=green (Low), 6-11=yellow (Medium), 12-19=orange (High), 20-25=red (Critical)
- API: `GET /api/npd/projects/:id/risks` (z summary: total/open/mitigated/closed/critical/high counts), `POST /api/npd/risks`, `PUT /api/npd/risks/:id`, `DELETE /api/npd/risks/:id` (hard delete, returns 204)
- RLS: org_id isolation

**Frontend/UX**:
- Risk register list: sorted by risk_score DESC. Columns: Description (100 chars + ...), Likelihood badge, Impact badge, Risk Score (color-coded), Status badge, Owner, Actions
- Risk matrix 5×5 visualization: Y=Impact (1-5 bottom→top), X=Likelihood (1-5 left→right), cells show risk count badges, cell colors match score ranges, clickable cells show risk list
- Create/Edit risk modal: description (textarea), likelihood (select 1-5), impact (select 1-5), risk_score (auto-calculated, read-only), mitigation_plan (textarea), status (select), owner (user selector — NPD_LEAD/R&D roles)
- Filtering: status, owner, score threshold (≥12 for High+Critical)
- Sorting: default by score DESC, clickable column headers
- Risk detail modal: full description, scoring badges, status, owner, mitigation, audit info, [Edit][Delete][Close] actions
- Empty state: "No risks identified yet" + [+ Add Risk]
- Permission: NPD_LEAD=full CRUD, R&D=edit own risks, VIEWER=read-only

**Integracje**: 09.2 (npd_project_id), 01.1 (users for owner assignment)

---

#### 09.11 Handoff Wizard (P0 Critical)
**Rozmiar**: L (5-6 dni) | **Typ**: Fullstack | **Zależności**: 09.2, 09.4, 09.6, 09.7, 09.8, 02.2, 02.1, 03.2 (HARD), 04.1 (SOFT)

**Backend**:
- API: `POST /api/npd/projects/:id/handoff/validate` — pre-handoff validation (returns checklist z pass/fail per item)
- API: `POST /api/npd/projects/:id/handoff/execute` — transactional execution
- Validation checklist:
  1. Gate G4 Complete — all G4 checklist items marked complete
  2. Formulation Locked — active formulation status = 'locked'
  3. Costing Approved — costing status = 'approved' by Finance (skip if require_costing_approval=false)
  4. Compliance Docs Complete — required doc types uploaded (HACCP, Label)
  5. Allergen Declaration — allergens aggregated (if feature enabled)
- Handoff transaction sequence:
  1. Lock formulation (if not already locked)
  2. Create/update product (npd_origin=true, source='npd', npd_project_id)
  3. Create BOM (source='npd', npd_formulation_id, auto-generated number)
  4. Copy formulation_items → bom_items (1:1 mapping)
  5. Create pilot WO (if enabled: type='pilot', npd_project_id)
  6. Link routing to pilot WO (if routing selected)
  7. Update project status → 'launched', current_gate → 'Launched'
  8. Log handoff event (npd_events)
  9. COMMIT (or ROLLBACK on any failure)
- Concurrent handoff prevention: optimistic locking (check project status before execute)
- Dual mode: Integrated (creates Product+BOM+WO) vs NPD-Only (shows export buttons instead)

**Frontend/UX**:
- 8-step wizard UI: `/npd/projects/:id/handoff`
- Step 1: Validation Checklist — ✅/❌ per item, [Fix Issue] buttons, [Re-check Validation], [Next] disabled until all pass
- Step 2: Product Decision — radio: Create New Product / Update Existing Product. New: product_code, name, type, uom. Existing: product selector
- Step 3: BOM Preview — formulation items → bom_items mapping table, BOM number preview
- Step 4: Pilot WO Toggle — enable/disable pilot WO, quantity (default from formulation), scheduled date
- Step 5: Routing Selection — routing selector (from routings table), default from npd_settings
- Step 6: Summary Review — all handoff actions listed, confirmation
- Step 7: Execute — progress indicator, transactional execution, error handling z rollback message
- Step 8: Success — links to created Product, BOM, WO records
- Access blocked if not at G4, or already launched
- Performance: validation <2s, execution <5s

**Integracje**: 09.2 (project), 09.4 (formulation), 09.6 (gate approval), 09.7 (costing approval), 09.8 (compliance docs), 02.1 (products), 02.2 (BOMs), 03.2 (work_orders), 04.1 (routings — soft)

---

#### 09.12 Handoff: Formulation → BOM (P0 Critical)
**Rozmiar**: M (3-4 dni) | **Typ**: Backend | **Zależności**: 09.4, 02.2, 02.1 (HARD)

**Backend**:
- API: `POST /api/npd/projects/:id/handoff/create-bom`
- API: `POST /api/npd/projects/:id/handoff/create-product`
- Mapping 1:1: formulation_items → bom_items (same product_id, quantity, uom, percentage, notes). item_type = 'input'
- BOM number auto-generation: `BOM-{PRODUCT_CODE}-v{VERSION}` (auto-increment version for existing product)
- Traceability fields: `bom.source = 'npd'`, `bom.npd_formulation_id = formulation.id`
- Product fields: `product.npd_origin = true`, `product.npd_project_id`, `product.source = 'npd'`
- Validation: formulation must be locked (status='locked'), all items must have valid product_id
- BOM number uniqueness: 409 Conflict on duplicate
- Transactional execution z rollback on failure
- Support: create new product OR update existing product with new BOM version

**Integracje**: 09.4 (npd_formulations, npd_formulation_items), 02.1 (products), 02.2 (boms, bom_items)

---

#### 09.13 Handoff: Pilot WO Creation (P0 Critical)
**Rozmiar**: M (3-4 dni) | **Typ**: Backend | **Zależności**: 09.12, 03.2 (HARD), 04.1 (SOFT)

**Backend**:
- API: `POST /api/npd/projects/:id/handoff/create-pilot-wo`
- WO fields: `type = 'pilot'`, `npd_project_id`, `status = 'planned'`
- WO number auto-generation: `WO-PILOT-{PROJECT_NUMBER}-{SEQ}` (auto-increment SEQ per project)
- Default routing: `npd_settings.default_pilot_routing` (fallback: null, manual selection later)
- Default quantity: `formulation.total_qty` (editable)
- Default scheduled_date: +7 days from handoff (editable, past dates allowed with warning)
- Auto-assign to NPD Lead (owner_id from npd_projects)
- Actual cost feedback: pilot WO material consumption → npd_costing.actual_cost
- Validation: quantity > 0, BOM must belong to product, product must exist
- WO number uniqueness: 409 Conflict on duplicate

**Integracje**: 09.12 (BOM created in handoff), 03.2 (work_orders), 04.1 (routings — soft), 09.7 (actual cost feedback)

---

#### 09.14 NPD-Only Mode & Export
**Rozmiar**: M (2-3 dni) | **Typ**: Fullstack | **Zależności**: 09.2, 09.4 (HARD), 09.5, 09.7, 09.8 (SOFT)

**Backend**:
- NPD-only mode toggle: `npd_settings.npd_only_mode` (boolean)
- API: `GET /api/npd/formulations/:id/export/pdf` — PDF recipe card
  - Sections: Header (org name, formulation number, version), Project Info, Formulation Details, Ingredient List (15+ rows), Allergen Declaration, Costing Summary, Compliance Status, Footer (exported by, date)
  - A4 portrait, Arial font, table layout, page numbers
  - Content-Disposition: `attachment; filename="NPD-001_v2.0.pdf"`
- API: `GET /api/npd/formulations/:id/export/excel` — Excel ingredient list
  - Sheets: Formulation Info, Ingredients (Product Code, Name, Qty, UoM, %), Allergens, Costing
  - Header row bold + freeze pane, auto-sized columns, % formatting, currency formatting, borders
  - Content-Disposition: `attachment; filename="NPD-001_v2.0.xlsx"`
- Formulation must be locked before export (validation)
- Export audit logging: who exported, when, formulation_id (in npd_events or npd_audit_log)
- Graceful degradation: allergens/costing sections omitted if data unavailable

**Frontend/UX**:
- NPD-only mode: handoff wizard [Start Handoff] hidden, [Export Formulation] button shown instead
- [Export PDF] / [Export Excel] buttons na formulation detail page
- Browser download via Content-Disposition

**Integracje**: 09.1 (npd_only_mode setting), 09.4 (formulation data), 09.5 (allergens — optional), 09.7 (costing — optional), 09.8 (compliance status — optional)

---

#### 09.15 Event Sourcing & Notifications
**Rozmiar**: M (3-4 dni) | **Typ**: Backend | **Zależności**: 09.2, 09.3 (HARD), 09.7, 09.11 (SOFT)

**Backend**:
- Tabela `npd_events`: id (SERIAL PK), org_id (UUID FK), site_id (UUID NULL), event_type (VARCHAR(50) — NPD.GateAdvanced/FormulationLocked/CostingSubmitted/HandoffCompleted), entity_type (VARCHAR(50) — npd_project/npd_formulation/npd_costing), entity_id (UUID), payload (JSONB), status (VARCHAR(20) — pending/processing/completed/failed), retry_count (INT DEFAULT 0), error_message (TEXT), created_at (TIMESTAMPTZ), processed_at (TIMESTAMPTZ)
- RLS: org_id isolation, indeksy: (org_id, status), (event_type), (created_at)
- Retry mechanism: max 3 retries, exponential backoff (1min, 2min, 4min). After max retries: admin notification "Event {id} permanently failed"
- Admin: `GET /api/npd/events` (filter by status, event_type, date range), `POST /api/npd/events/:id/retry` (force flag resets retry_count)
- Tabela `notifications`: id, user_id, org_id, site_id (UUID NULL), type, title, body, read (boolean), link, created_at
- Tabela `user_notification_preferences`: user_id, org_id, site_id (UUID NULL), notification_type, email_enabled, in_app_enabled
- Notification routing:
  - Gate approval required → NPD Lead
  - Costing approval required → Finance
  - Cost variance alert → NPD Lead + Finance
  - Missing compliance docs → Regulatory
  - Handoff completed → Production
- Email via Supabase Edge Functions
- In-app notification center (badge count, mark as read)
- Event creation: <100ms, non-blocking (async)

**Integracje**: 09.2 (project events), 09.3 (gate events), 09.7 (costing events), 09.11 (handoff events), Supabase Edge Functions (email)

---

### Phase 3 — Enterprise Features (3 stories, 8-12 dni)

---

#### 09.16 Timeline View & Reporting
**Rozmiar**: M (3-4 dni) | **Typ**: Fullstack | **Zależności**: 09.2, 09.3, 09.7, 09.8 (HARD)

**Backend**:
- View PG: `npd_timeline_view` — project data z is_overdue flag (target_launch_date < today AND status != 'launched')
- API: `GET /api/npd/timeline` (project timeline data z filters)
- API: `GET /api/npd/export/projects` (CSV all projects — all fields)
- API: `GET /api/npd/export/cost-history` (CSV all formulation versions z costs)
- API: `POST /api/npd/export/compliance-checklist` (PDF compliance report — gate checklists + compliance docs)
- No new tables — reads from existing npd_projects, npd_formulations, npd_gate_checklists, npd_compliance_docs

**Frontend/UX**:
- Timeline view page: `/npd/timeline`
- Gantt-style visualization: horizontal bars created_at → target_launch_date
- Color by status: idea=gray, feasibility=blue, development=yellow, testing=orange, launched=green
- Overdue: red border (target_launch_date < today)
- Zoom controls: month/quarter/year view
- Filters: gate, category, owner, status
- CSV export buttons: [Export Projects CSV], [Export Cost History CSV]
- PDF export: [Export Compliance Checklist PDF]
- Performance: timeline load <500ms for 100 projects, CSV <3s for 200 projects, PDF <10s

**Integracje**: 09.2 (projects), 09.3 (gate data), 09.7 (cost history), 09.8 (compliance docs)

**Compliance**: FDA 21 CFR Part 11 (compliance checklist report), ISO 9001 (management review per clause 9.3)

---

#### 09.17 Finance Approval Workflow
**Rozmiar**: M (3-4 dni) | **Typ**: Fullstack | **Zależności**: 09.7 (HARD)

**Backend**:
- Rozszerzenie `npd_costing`: submitted_at (TIMESTAMPTZ), submitted_by_id (UUID FK), approved_at, approved_by_id, rejected_at, rejected_by_id, rejection_reason (TEXT), auto_approved (BOOLEAN DEFAULT false)
- Rozszerzenie `npd_settings`: `cost_variance_auto_approve_pct` (NUMERIC(5,2) DEFAULT 10.00, CHECK 0-100)
- Auto-approve logic: if abs(variance_pct) < auto_approve_pct → status = 'approved', auto_approved = true
- Rejection reason required (min 10 chars)
- Email notifications: submission → Finance users, approval → NPD Lead, rejection → NPD Lead z reason
- Approval blocks handoff (09.11 validates costing approved)
- API: `POST /api/npd/costing/:id/submit`, `POST .../approve`, `POST .../reject`, `GET /api/npd/costing/:id/approval`
- Index: npd_costing(status) WHERE status = 'submitted'

**Frontend/UX**:
- Finance approval dashboard: list of pending costing submissions
- Approval modal: costing data, variance %, target vs estimated vs actual, approve/reject buttons
- Auto-approve indicator: badge "Auto-approved" when variance < threshold
- Rejection reason textarea (required)
- Email notification templates

**Integracje**: 09.7 (npd_costing), 09.1 (npd_settings — auto_approve threshold), 09.11 (handoff validation)

---

#### 09.18 Access Control & Audit Trail
**Rozmiar**: M (3-5 dni) | **Typ**: Backend | **Zależności**: 09.2, 09.4, 09.7, 09.8 (HARD)

**Backend**:
- Tabela `npd_audit_log`: id (SERIAL PK), org_id (UUID FK), site_id (UUID NULL), user_id (UUID FK), event_type (VARCHAR(50)), entity_type (VARCHAR(50) — npd_project/npd_formulation/npd_costing/npd_compliance_docs), entity_id (UUID), entity_name (VARCHAR(200)), action (VARCHAR(20) CHECK INSERT/UPDATE/DELETE), old_values (JSONB), new_values (JSONB), changed_fields (TEXT[]), ip_address (INET), user_agent (TEXT), created_at (TIMESTAMPTZ DEFAULT now()). **IMMUTABLE** — append-only
- RLS: INSERT only (no UPDATE/DELETE policies). SELECT per org_id
- Database triggers na wszystkich tabelach NPD: automatic logging on INSERT/UPDATE/DELETE
  - npd_projects, npd_formulations, npd_formulation_items, npd_costing, npd_compliance_docs, npd_risks, npd_approvals, npd_gate_transitions
- RLS per role (6 ról):
  - NPD_LEAD: Full CRUD own projects (owner_id = auth.uid())
  - R&D: Read/Write assigned formulations only
  - FINANCE: View all projects + approve/reject costing
  - REGULATORY: Upload/delete compliance docs
  - PRODUCTION: View launched projects only (current_gate = 'Launched')
  - ADMIN: Full access to all NPD data
- API: `GET /api/npd/audit-trail` (filter by project_id, user_id, event_type, date_from, date_to)
- FDA 21 CFR Part 11 compliance: e-signatures (from 09.6), timestamped, immutable, user identification

**Integracje**: All NPD tables (triggers), 01.1 (users, roles)

**Compliance**: FDA 21 CFR Part 11, HACCP, ISO 9001 clause 7.5

---

## 9. KPIs

### Performance KPIs

| Operacja | Target | Pomiar |
|----------|--------|--------|
| Project creation | <300ms | API P95 |
| Kanban dashboard load (50 projects) | <500ms | Page load P95 |
| Allergen aggregation | <200ms | Query time |
| Gate advancement validation | <1s | API P95 |
| Handoff validation | <2s | API P95 |
| Handoff execution (Product+BOM+WO) | <5s | Transaction time |
| Formulation comparison | <500ms | API P95 |
| Timeline view load (100 projects) | <500ms | Page load P95 |
| CSV export (200 projects) | <3s | API P95 |
| Finance approval | <1s | API P95 |
| PDF export (formulation) | <2s | API P95 |
| PDF export (compliance checklist) | <10s | API P95 |
| Event creation | <100ms (non-blocking) | Async |
| Notification send (10 users) | <500ms | Edge Function |

### Business KPIs

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Time-to-market (idea → launch) | Tracking, redukcja 25% | npd_projects.created_at → actual_launch_date |
| Gate velocity (avg days/gate) | <14 dni/gate | npd_gate_transitions |
| Formulation iteration count | Tracking (versions/project) | npd_formulations count per project |
| Cost variance accuracy | <15% (estimated vs actual) | npd_costing |
| Handoff success rate | >95% bez rollback | npd_events (HandoffCompleted vs failed) |
| Compliance doc completeness at G4 | 100% | check_required_documents() |

---

## 10. Risks

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| **Handoff complexity** — transactional multi-table creation, rollback scenarios | Wysokie | Wysoki | Comprehensive transaction testing, rollback unit tests, idempotency checks |
| **Allergen aggregation accuracy** — zależność od jakości danych product_allergens | Średnie | Wysoki | Validation warnings when product_allergens incomplete, data quality checks |
| **NPD-only mode adoption** — market fit dla R&D consultancies | Średnie | Średni | Customer interviews, MVP validation, pricing flexibility |
| **Finance approval bottleneck** — SLA dla costing review | Średnie | Średni | Auto-approve threshold (default 10%), email reminders, escalation |
| **Event sourcing performance** — async processing, event batching | Niskie | Średni | Non-blocking event creation, retry mechanism, monitoring |
| **Stage-Gate rigidity** — users wanting to skip gates | Średnie | Średni | Move-back z justification, configurable checklists per org |
| **Formulation lock irreversibility** — no unlock mechanism | Niskie | Średni | Clone locked formulation to new version, clear UX warning before lock |
| **Cross-module dependency risk** — Products, BOMs, WOs must be stable | Średnie | Wysoki | Integration tests, feature flags, graceful degradation |
| **Concurrent handoff race conditions** | Niskie | Wysoki | Optimistic locking, transaction isolation, concurrent prevention check |
| **PDF/Excel export performance** — large formulations (100+ items) | Niskie | Średni | Streaming generation, pagination, async for large exports |
| **Compliance document storage costs** — Supabase Storage scaling | Niskie | Niski | 50MB limit per file, retention policies, monitoring |
| **Audit trail storage growth** — immutable, append-only | Średnie | Niski | Event retention policy (configurable), archival strategy |

---

## 11. Success Criteria

### Phase 1 (MVP Core)
- [ ] NPD project creation → Stage-Gate workflow → formulation CRUD z versioning → allergen aggregation → gate approvals → costing z variance → compliance docs upload — all working end-to-end
- [ ] Kanban dashboard z drag-and-drop gate advancement
- [ ] Sequential gate enforcement (no skipping)
- [ ] Formulation lock immutability enforced (DB trigger blocks changes)
- [ ] Allergen auto-aggregation z EU 1169/2011 compliance (14 mandatory allergens)
- [ ] Cost variance alerts (warning ≥20%, blocker ≥50%)
- [ ] Required compliance docs validation for G4
- [ ] RLS org_id isolation na wszystkich tabelach NPD Phase 1

### Phase 2 (Advanced)
- [ ] Formulation compare/clone → risk register → handoff wizard (8-step) → formulation→BOM conversion → pilot WO creation → NPD-only export → event sourcing z notifications — all working end-to-end
- [ ] **Full handoff flow**: G4 approved project → handoff wizard → Product + BOM + Pilot WO created transactionally
- [ ] **NPD-only mode**: formulation development → PDF/Excel export bez production integration
- [ ] Handoff rollback on failure (no partial data)
- [ ] Event retry mechanism (exponential backoff, max 3)
- [ ] Concurrent handoff prevention working

### Phase 3 (Enterprise)
- [ ] Timeline view → Finance approval workflow → RLS per role → audit trail z triggers — all working end-to-end
- [ ] **FDA 21 CFR Part 11**: immutable audit trail, e-signature support
- [ ] **Multi-tenancy**: org_id isolation na wszystkich 16 tabelach NPD via RLS
- [ ] Auto-approve costing if variance < threshold (default 10%)
- [ ] Database triggers for automatic audit logging on all NPD tables
- [ ] 6 NPD roles enforced via RLS (NPD_LEAD, R&D, REGULATORY, FINANCE, PRODUCTION, ADMIN)

### Cross-cutting
- [ ] Allergen compliance: auto-aggregation from ingredients, EU 1169/2011 compliant (14 mandatory allergens, multi-language)
- [ ] All 18 stories delivered i przetestowane
- [ ] Performance KPIs met (handoff <5s, dashboard <500ms, allergens <200ms)
- [ ] Zero Critical/High bugs at launch

---

## 12. References

> **UWAGA — numeracja plików stories**: Pliki stories w repozytorium używają prefiksu `08.x` (legacy numeracja z poprzedniej struktury epics). PRD używa poprawnej numeracji `09.x` (aktualny numer modułu NPD). Mapping: plik `08.1.xxx.md` = story 09.1 w PRD, `08.2.xxx.md` = story 09.2, itd. Przy tworzeniu nowych stories należy używać prefiksu `09.x`.

### Dokumenty źródłowe (stories)
- [08.1.npd-settings-module-config.md](docs/2-MANAGEMENT/epics/current/08-npd/08.1.npd-settings-module-config.md) ← story 09.1 w PRD
- [08.2.npd-projects-crud-kanban.md](docs/2-MANAGEMENT/epics/current/08-npd/08.2.npd-projects-crud-kanban.md) ← story 09.2 w PRD
- [08.3.stage-gate-workflow.md](docs/2-MANAGEMENT/epics/current/08-npd/08.3.stage-gate-workflow.md) ← story 09.3 w PRD
- [08.4.formulations-crud-versioning.md](docs/2-MANAGEMENT/epics/current/08-npd/08.4.formulations-crud-versioning.md) ← story 09.4 w PRD
- [08.5.allergen-aggregation-display.md](docs/2-MANAGEMENT/epics/current/08-npd/08.5.allergen-aggregation-display.md) ← story 09.5 w PRD
- [08.6.gate-approvals-history.md](docs/2-MANAGEMENT/epics/current/08-npd/08.6.gate-approvals-history.md) ← story 09.6 w PRD
- [08.7.formulation-costing.md](docs/2-MANAGEMENT/epics/current/08-npd/08.7.formulation-costing.md) ← story 09.7 w PRD
- [08.8.compliance-documents-upload.md](docs/2-MANAGEMENT/epics/current/08-npd/08.8.compliance-documents-upload.md) ← story 09.8 w PRD
- [08.9.formulation-compare-clone.md](docs/2-MANAGEMENT/epics/current/08-npd/08.9.formulation-compare-clone.md) ← story 09.9 w PRD
- [08.10.risk-management.md](docs/2-MANAGEMENT/epics/current/08-npd/08.10.risk-management.md) ← story 09.10 w PRD
- [08.11.handoff-wizard.md](docs/2-MANAGEMENT/epics/current/08-npd/08.11.handoff-wizard.md) ← story 09.11 w PRD
- [08.12.handoff-formulation-to-bom.md](docs/2-MANAGEMENT/epics/current/08-npd/08.12.handoff-formulation-to-bom.md) ← story 09.12 w PRD
- [08.13.handoff-pilot-wo-creation.md](docs/2-MANAGEMENT/epics/current/08-npd/08.13.handoff-pilot-wo-creation.md) ← story 09.13 w PRD
- [08.14.npd-only-mode-export.md](docs/2-MANAGEMENT/epics/current/08-npd/08.14.npd-only-mode-export.md) ← story 09.14 w PRD
- [08.15.event-sourcing-notifications.md](docs/2-MANAGEMENT/epics/current/08-npd/08.15.event-sourcing-notifications.md) ← story 09.15 w PRD
- [08.16.timeline-view-reporting.md](docs/2-MANAGEMENT/epics/current/08-npd/08.16.timeline-view-reporting.md) ← story 09.16 w PRD
- [08.17.finance-approval-workflow.md](docs/2-MANAGEMENT/epics/current/08-npd/08.17.finance-approval-workflow.md) ← story 09.17 w PRD
- [08.18.access-control-audit-trail.md](docs/2-MANAGEMENT/epics/current/08-npd/08.18.access-control-audit-trail.md) ← story 09.18 w PRD

### Plany implementacji
- [implementation-plan.md](docs/2-MANAGEMENT/epics/current/08-npd/implementation-plan.md)
- [IMPLEMENTATION-ROADMAP.yaml](docs/2-MANAGEMENT/epics/current/08-npd/IMPLEMENTATION-ROADMAP.yaml)

### Foundation PRD
- [00-FOUNDATION-PRD.md](new-doc/00-foundation/prd/00-FOUNDATION-PRD.md) — M09 NPD listed as Phase 2 module

### ADR (powiązane)
- ADR-001 LP Inventory | ADR-002 BOM Snapshot | ADR-003 Multi-Tenancy | ADR-007 WO State Machine | ADR-008 Audit Trail | ADR-009 Routing Costs | ADR-011 Module Toggle | ADR-012 Role Permissions | ADR-013 RLS Pattern | ADR-015 Constants | ADR-018 API Errors

Wszystkie w: `new-doc/00-foundation/decisions/`

### Regulacje
- FDA 21 CFR Part 11 (e-signatures, audit trail)
- EU 1169/2011 (14 mandatory allergens, multi-language labeling)
- HACCP (required documentation before G4)
- ISO 9001 (quality management documentation)

---

_PRD M09-NPD v1.1 — 18 stories, 3 phases, 50-66 dni, 16 nowych tabel DB, 6 ról NPD._
_Changelog v1.1: REC-M4: Rozszerzono opis site_id w Constraints — lista wszystkich 16 tabel NPD z migration pattern. REC-M7: Zaktualizowano tabelę mapowania ról NPD → role systemowe (ADR-012) z uzasadnieniami i uwagą o modelu DODATKOWYCH uprawnień. REC-L15: Dodano blok UWAGA o numeracji plików stories (prefiks 08.x = legacy, 09.x = PRD) w sekcji References + adnotacje ← story 09.X przy każdym pliku._
_Changelog v1.0: Initial PRD created from 18 story files + implementation plan + roadmap._
_Data: 2026-02-18_
