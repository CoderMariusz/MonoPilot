# PRD 00-Foundation — MonoPilot MES
**Wersja**: 2.3 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

MonoPilot to cloud-native Manufacturing Execution System (MES) zaprojektowany dla małych i średnich producentów żywności (5–100 pracowników). System wypełnia lukę rynkową między arkuszami kalkulacyjnymi a rozwiązaniami enterprise (SAP, D365), oferując wdrożenie w tygodniach zamiast miesięcy, w cenie ułamka kosztu ERP.

**Pozycjonowanie**: Chmurowy, szybko wdrażalny MES — pomiędzy Excelem a enterprise ERP.
**Model cenowy**: Freemium + 50 USD/użytkownik/miesiąc.
**Rynek docelowy**: Brytyjscy producenci żywności SMB (80%), z ekspansją na PL i DACH po walidacji rynku.

**Kluczowa decyzja biznesowa**: MonoPilot NIE jest pełnym ERP. Nie budujemy modułu księgowości (GL/AR/AP), HR ani CRM — integrujemy się z zewnętrznymi systemami (Comarch Optima, Sage, wFirma).

---

## 2. Objectives

### Cel główny
Zdobycie niedostatecznie obsłużonego brytyjskiego rynku producentów żywności SMB poprzez dostarczenie przystępnego cenowo, szybko wdrażalnego MES spełniającego wymagania regulacyjne bez złożoności enterprise.

### Cele drugorzędne
1. **Ekspansja UE** — rozszerzenie na region DACH po walidacji na rynku polskim
2. **Głębokość wertykalna** — pozycja lidera MES dla SMB food manufacturing (alergeny, trasowalność, HACCP)
3. **Przychody platformowe** — model SaaS z wysoką retencją dzięki integracyjnej „klejowości"

### Metryki sukcesu (12 miesięcy)

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Płacący klienci | 100 | CRM |
| MRR | 25 000 USD | Stripe |
| CAC | < 500 USD | Marketing / nowi klienci |
| NPS | > 40 | Kwartalne ankiety |
| Uptime | 99,5%+ | Monitoring |
| Czas zapytania trasowalności | < 30 s | APM |
| Czas onboardingu | < 2 tygodnie | Customer Success |
| Churn | < 5% miesięcznie | Analityka subskrypcji |

---

## 3. Personas

### Persony główne

**1. Operator produkcji** — pracownik hali, obsługa linii. Skanery Zebra/Honeywell. Kryterium: operacja skanerem < 30 s.
**2. Kierownik produkcji** — nadzór operacji, monitoring WO, yield, zatwierdzenia, raporty zmianowe. Dashboard real-time + tablet.
**3. Kierownik jakości** — bezpieczeństwo żywności, audyty, QA holds, NCR, trasowalność < 30 s.
**4. Operator magazynu** — GRN, ruchy, FIFO/FEFO picking, wysyłka. 100% dokładność stanów przez LP tracking.

### Persony drugorzędne

| Rola | Główne moduły |
|------|---------------|
| Dyrektor zakładu | Wszystkie (read-only), dashboardy KPI |
| Planista | Planning |
| Kupiec | Planning, Warehouse |
| Administrator | Settings |
| Lider zmiany | Production, Reporting |
| Technik utrzymania ruchu | Maintenance, Settings (maszyny) |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Moduł | Priorytet |
|-------|-----------|
| Settings — organizacja, użytkownicy (10 ról), magazyny, maszyny, linie, alergeny, kody VAT | Must Have |
| Technical — produkty, BOM basic, alergeny EU-14, pola wagowe, shelf life, catch weight | Must Have |
| Planning — PO (3-krokowe), TO, WO, release to warehouse | Must Have |
| Production — WO execution, zużycie LP-level, yield, waste tracking, shifts | Must Have |
| Warehouse — LP, GRN z walidacją, stock status, FIFO/FEFO basic, GS1-128 scan | Must Have |
| Quality — QA holds, NCR basic, inspekcje, podstawowe HACCP checklisty | Should Have |
| Shipping — SO basic, pick list, packing, delivery address | Should Have |
| Scanner — dedykowane strony: receive, move, pick, produce, QA | Must Have |
| Reporting — Factory Overview Dashboard, Yield by Line/SKU | Should Have |

### 4.2 Out of Scope — Phase 2

| Moduł | Uzasadnienie |
|-------|-------------|
| NPD — stage-gate, trial BOM | Feature enterprise |
| Finance — koszt produkcji, variance, marże (NIE pełne GL/AR/AP) | Integracja z ERP |
| OEE — real-time OEE, downtime analysis, efficiency | Wymaga integracji maszyn |
| Integrations — Comarch Optima, EDI EDIFACT (ORDERS, DESADV, INVOIC), portale | Post-MVP |
| Multi-Site — wiele zakładów, transfer międzyzakładowy | SMB = zwykle 1 zakład |
| Maintenance — PM scheduling, spare parts, calibration | Po OEE |
| Technical adv. — BOM versioning, co-products, formula audit | Rozszerzenie |
| Warehouse adv. — ASN, cycle counting, put-away rules | Rozszerzenie |
| Reporting adv. — Giveaway, Scorecard, Period Reports 4-4-5 | Rozszerzenie |
| Scanner adv. — offline mode (IndexedDB queue), split/merge LP | Rozszerzenie |

### 4.3 Exclusions (Nigdy)

- **On-premise** — wyłącznie SaaS
- **Pełna księgowość** (GL/AR/AP) — integracja z Comarch / Sage / wFirma
- **HR / Payroll** — osobna domena
- **CRM** — integracja z zewnętrznymi
- **Custom dev per klient** — product-led
- **AI/ML** na start — skupienie na solidnym MES

---

## 5. Constraints

### Techniczne
- **Cloud-only** — brak on-premise; wyklucza klientów z wymogiem danych lokalnych
- **Multi-tenant** — współdzielona infra, izolacja RLS; audyt bezpieczeństwa przed launch
- **Supabase** — PostgreSQL + Auth + Storage; vendor lock-in (mitigowalny — standard PG)
- **Service Role** — zapytania DB przez service role z filtrowaniem org_id; ryzyko przy pominięciu

### Biznesowe
- Freemium + 50 USD/user/mies. | Polski + angielski MVP | Zespół 3–5 dev | Bootstrapping

### Regulacyjne
- Trasowalność forward/backward < 30 s ✅ | Lot tracking ✅ | Alergeny EU-14 ✅ | Audit trail ✅
- HACCP/CCP — podstawowe w MVP, pełne Phase 2 | GS1 — częściowo | Catch weight — MVP

---

## 6. Decisions

Kluczowe decyzje obowiązujące w całym systemie. Każda udokumentowana jako ADR w `decisions/`.

**D1. License Plate (LP) — ADR-001**: Każda operacja na atomowych LP, NIE luźne ilości. Lifecycle: CREATE → AVAILABLE → CONSUMED/SHIPPED/MERGED. `lp_genealogy` = pełna trasowalność.

**D2. BOM Snapshot — ADR-002**: WO kopiuje BOM (materiały + routing) przy tworzeniu. Niezmienny w trakcie produkcji. Skalowanie: `required_qty = bom_item.qty × (planned_qty / output_qty)`.

**D3. Multi-Tenancy RLS — ADR-003, ADR-013**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Single source of truth z tabeli users (nie JWT).

**D4. GS1 Compliance — ADR-004**: GTIN-14 produkty, GS1-128 LP (lot/expiry), SSCC-18 palety. AI(01) GTIN, AI(10) Lot, AI(17) Expiry.

**D5. FIFO/FEFO — ADR-005**: FEFO domyślnie (najwcześniejsza data ważności); FIFO fallback. Enforcement: suggest/warn/block. Override z audit trail.

**D6. WO State Machine — ADR-007**: DRAFT → RELEASED → IN_PROGRESS → COMPLETED (+ CANCELLED). Guards: hasBOM, hasMaterials, outputRecorded. Override: supervisor z logowaniem.

**D7. Audit Trail — ADR-008**: Hybrydowy: PG triggery + app context. Tabela `audit_log` z old_data/new_data, user_id, ip_address, action_reason. Retencja per tabela. Zgodność: FDA 21 CFR Part 11, FSMA 204.

**D8. Scanner-First — ADR-006**: Dedykowane `/scanner/*`, 48px touch targets, scan-first input, liniowy flow. Offline Phase 2 (IndexedDB queue).

**D9. Service Layer + Zod — ADR-015, ADR-016, ADR-018**: Logika w `lib/services/*-service.ts`, walidacja Zod. API routes → serwisy, NIGDY bezpośrednio DB. Standaryzowany error handling: `handleApiError()`.

**D10. Module Toggle + Roles — ADR-011, ADR-012**: Tabela `modules` (seeded) + `organization_modules`. 10 ról systemowych, JSONB permissions (CRUD per moduł).

**D11. TO State Machine — ADR-019**: draft → planned → partially_shipped → shipped → partially_received → received → closed (+ cancelled).

**D12. Routing Costs — ADR-009**: setup_cost, working_cost_per_unit, overhead_percent na routings. Kalkulacja: Material + Labor + Setup + Cleanup + Overhead.

**D13. Product Procurement — ADR-010**: `lead_time_days` i `moq` na produkcie (nie na dostawcy).

### Decyzje biznesowe (bez ADR)
- NIE budujemy pełnego ERP — integracja z zewnętrznym systemem finansowym
- Fazy: Phase 1 (MVP), Phase 2, Phase 3 (Enterprise — billing, import/export, GDPR, custom roles)
- PO creation = 3 kroki (dostawca → produkty+qty → submit)
- Multi-site potwierdzone (FORZ + KOBE = **jedna org, dwa site'y**, shared master data, site-level filtering) — M11
- Reporting = osobny moduł (M15), rośnie inkrementalnie po M06 Production
- Scanner = osobny moduł (M05), własny PRD, rośnie inkrementalnie: Move → Receive (po M03 Warehouse), Pick (po M04 Planning), Produce (po M06 Production), QA (po M08 Quality)
- Catch weight = cross-cutting, MVP
- `site_id UUID NULL` na WSZYSTKICH tabelach obok `org_id` (od początku, nawet jeśli NULL do M11 Multi-Site)
- Waluta startowa: GBP (rynek docelowy UK). Multi-currency PLN+EUR w Phase 2
- HACCP basic w MVP (checklisty), pełne w Phase 2
- Numeracja kanoniczna: M01–M15 (NIE Epic 1–15)
- Build order: M01→M02→M03→M04→M05(incr)→M06→M07→M08→M09→...→M15 (sequential, Scanner+Reporting inkrementalnie)
- Rola najwyższa: **Owner** (code: `owner`). Termin "Super Admin" deprecated
- Alergeny: globalna tabela (read-only EU-14) + org-specific extensions
- Waste categories: customizable per org (domyślne ogólne + pole Add)
- Fiscal calendar: wybór systemu (4-4-5 / 4-5-4 / 5-4-4 / calendar months)
- `cost_per_kg`: pole per produkt w `products` (M02), NIE w Settings
- Onboarding wizard: soft dependencies (linki do M02/M03, nie cross-module API)
- PRD per moduł: max ~18k tokenów; dzielić na części jeśli większy

---

## 7. Module Map (16 modułów: M00–M15)

### Build Order (sequential)
```
M00 Foundation (ten dokument)
 └── M01 Settings ─── FUNDAMENT
      └── M02 Technical
           └── M03 Warehouse
                ├── M04 Planning
                │    └── M06 Production ──→ M15 Reporting (inkrementalnie)
                │         └── M08 Quality
                └── M05 Scanner (inkrementalnie po: M03, M04, M06, M07, M08)
           └── M07 Shipping
      Phase 2:
      ├── M09 NPD
      ├── M10 Finance
      ├── M11 Multi-Site (site_id activation)
      ├── M12 OEE
      ├── M13 Integrations
      └── M14 Maintenance
```

### Scanner (M05) — epiki inkrementalne
| Epik Scanner | Odblokowany po | Workflows |
|-------------|----------------|-----------|
| M05-E1 | M03 Warehouse | Move (LP → location), Receive (GRN) |
| M05-E2 | M04 Planning | Pick (WO/SO → FIFO/FEFO → LP) |
| M05-E3 | M06 Production | Produce (WO → consume LP → output) |
| M05-E4 | M08 Quality | QA (LP → pass/fail/hold) |
| M05-E5 | Phase 2 | Split/Merge LP, Cycle count, Pack & Ship, Offline |

### Reporting (M15) — inkrementalnie
| Epik Reporting | Odblokowany po | Dashboardy |
|---------------|----------------|------------|
| M15-E1 | M06 Production | Factory Overview, Yield by Line/SKU |
| M15-E2 | M08 Quality | QC Holds, Yield Issues |
| M15-E3 | Phase 2 | Giveaway, Scorecard, Period Reports, Shift Performance |

### Tabela modułów

| # | Folder | Moduł | Phase 1 | Phase 2 | Zależności |
|---|--------|-------|---------|---------|------------|
| M01 | 01-settings | Settings | ✅ | ✅ rozszerzenie | — |
| M02 | 02-technical | Technical | ✅ basic | ✅ versioning, co-products | M01 |
| M03 | 03-warehouse | Warehouse | ✅ basic | ✅ ASN, cycle count | M01, M02 |
| M04 | 04-planning | Planning | ✅ | ✅ MRP advanced | M01, M02, M03 |
| M05 | 05-scanner | Scanner | ✅ inkrementalnie | ✅ offline | M03 (base), M04, M06, M07, M08 |
| M06 | 06-production | Production | ✅ | ✅ rozszerzenie | M02, M04 |
| M07 | 07-shipping | Shipping | ✅ basic | ✅ wave, carrier | M03, M08 |
| M08 | 08-quality | Quality | ✅ basic+HACCP | ✅ CAPA, supplier QA | M03, M06 |
| M09 | 09-npd | NPD | — | ✅ | M02 |
| M10 | 10-finance | Finance | — | ✅ | M06, M03 |
| M11 | 11-multi-site | Multi-Site | — | ✅ | M01, M03 |
| M12 | 12-oee | OEE | — | ✅ | M06 |
| M13 | 13-integrations | Integrations | — | ✅ | Wszystkie |
| M14 | 14-maintenance | Maintenance | — | ✅ | M01, M06, M12 |
| M15 | 15-reporting | Reporting | ✅ inkrementalnie | ✅ zaawansowane | M06, M03, M08 |

---

## 8. Requirements

Wszystkie 77 pozycji z PRD-UPDATE-LIST + wymagania Maintenance. Priorytet: HIGH / MEDIUM.

### M01 — Settings (01-settings)

**Phase 1**: Organizacja CRUD (org_id, branding). Użytkownicy (10 ról, zaproszenia email). Magazyny + lokalizacje (zone → row → bin). Maszyny i linie. Alergeny EU-14 (globalna tabela + org extensions). Module toggles (ADR-011). Kody VAT basic. Onboarding wizard < 15 min (soft deps do M02/M04).

**Phase 2**: [1.1] HIGH Multi-country VAT | [1.2] HIGH Waste categories (customizable per org) | [1.4] HIGH Kalendarz fiskalny (4-4-5/4-5-4/5-4-4/calendar) | [1.5] HIGH Target KPI per linia/produkt | [1.3] MEDIUM Progi ocen A/B/C/D | [1.6] MEDIUM Kody dyspozycji

**Phase 3**: Billing (Stripe), Import/Export, GDPR, Custom roles, IP Whitelist.

**Uwaga**: [1.7] cost_per_kg przeniesione do M02 (pole per produkt). Pełny PRD: `01-settings/prd/01-SETTINGS-PRD.md`.

### M02 — Technical / Products (02-technical)

**Phase 1**: Produkty CRUD (name, sku, gtin, unit, category). [2.1] HIGH Pola wagowe (net/tare/gross). [2.2] HIGH Shelf life. [2.3] HIGH Catch weight. [2.4] HIGH yield_percent. [2.5] HIGH preferred_supplier_id. [2.6] HIGH over/under delivery tolerance. [2.15] HIGH item_group. [1.7] HIGH cost_per_kg per produkt. BOM basic. Alergeny EU-14 z auto-propagacją.

**Phase 2**: [2.8] HIGH BOM versioning | [2.9] HIGH Co-products | [2.10] HIGH variable_scrap_pct | [2.11] HIGH flushing_principle | [2.14] HIGH Formula audit trail | [2.7] MEDIUM purchase price | [2.12] MEDIUM priority per BOM line | [2.13] MEDIUM valid_from/valid_to. Routings, trasowalność forward/backward.

### M03 — Warehouse (03-warehouse)

**Phase 1**: LP CRUD (create, split, merge, move, quarantine). GRN z PO. [3.3] HIGH GRN validation (qty vs PO, tolerance, manual complete). [3.4] HIGH Stock status (Available/QC Hold/Blocked/Expired — expired auto-block). [3.7] HIGH GS1-128 scanning na GRN. Basic moves + FIFO/FEFO. Transit locations (fizyczne). LP numbering per warehouse.

**Phase 2**: [3.1] HIGH TO header+lines, multi-status (ADR-019) | [3.2] HIGH CW na TO lines | [3.5] MEDIUM Put-away rules | [3.6] MEDIUM Load concept | [3.8] MEDIUM ship/receipt date. ASN, cycle counting, SSCC-18.

### M04 — Planning (04-planning)

**Phase 1**: PO 3-krokowe tworzenie. [4.1] HIGH Smart defaults z supplier master. TO z state machine (ADR-019). WO z state machine (ADR-007), BOM snapshot. [4.3] HIGH Release to warehouse (trigger pick list). Supplier management.

**Phase 2**: [4.2] MEDIUM planning_priority na WO. MRP basic → advanced. Demand forecasting. Capacity planning. Bulk import CSV (ADR-016).

### M05 — Scanner (05-scanner) — INKREMENTALNY

Osobny moduł, własny PRD. Budowany etapami po kolejnych modułach:

| Epik | Po module | Workflows Phase 1 |
|------|-----------|-------------------|
| M05-E1 | M03 Warehouse | Move (LP→location), Receive (GRN: LP→qty→accept) |
| M05-E2 | M04 Planning | Pick (WO/SO→FIFO/FEFO suggestion→LP→confirm) |
| M05-E3 | M06 Production | Produce (WO→start→consume LP→output) |
| M05-E4 | M08 Quality | QA (LP→pass/fail/hold) |
| M05-E5 | Phase 2 | Split/Merge LP, Cycle count, Pack & Ship, Offline (IndexedDB) |

Dedicated `/scanner/*` pages. 48px touch targets. Scan-first input. Linear flow (ADR-006).

### M06 — Production (06-production)

**Phase 1**: WO execution (start/pause/complete). Material consumption LP-level. Output registration (LP creation + genealogy). [5.1] HIGH Waste categories tracking (customizable per org). [5.2] HIGH Weight-based yield. [5.3] HIGH meat_yield_pct. [5.4] HIGH target_yield. [5.6] HIGH LP-level consumption tracking. [5.12] HIGH Downtime: People/Process/Plant + minuty. [5.13] HIGH Shift AM/PM.

**Phase 2**: [5.7] HIGH Co-product output | [5.8] HIGH Route per product-line | [5.11] HIGH CW qty na batch order | [5.15] HIGH QC holds z produkcji | [5.5] MEDIUM rework_batch flag | [5.9] MEDIUM Route versioning | [5.10] MEDIUM Consumption by item_group | [5.14] MEDIUM Hourly efficiency

### M07 — Shipping (07-shipping)

**Phase 1**: SO CRUD basic. Pick list generation. Basic packing. [7.3] HIGH Delivery address per order (ship-to).

**Phase 2**: [7.1] HIGH CW na SO lines | [7.2] HIGH pack_quantity | [7.4] MEDIUM mode_of_delivery | [7.5] MEDIUM Order charges | [7.6] MEDIUM delivery_type. Wave picking. Carrier integration. GS1 labels.

### M08 — Quality (08-quality)

**Phase 1**: QA Status (pass/fail/hold). Basic holds + release. NCR basic. Specyfikacje produktowe. Podstawowe HACCP checklisty (CCP monitoring points).

**Phase 2**: [6.1] HIGH QC Hold tracking → batch | [6.2] HIGH Yield issue tracking | [6.3] MEDIUM Accident/near miss. HACCP/CCP pełne. CAPA. Supplier Quality. CoA management.

### M09 — NPD (09-npd, Phase 2)
Stage-gate workflow (Concept → Feasibility → Development → Validation → Launch). Trial BOMs. Sample management. Cost estimation.

### M10 — Finance (10-finance, Phase 2)
[8.1] HIGH Variance £ tracking | [8.3] HIGH cost_per_kg analysis | [8.2] MEDIUM Savings calculator. Production costing. Margin analysis. Export do Comarch/Sage.

### M11 — Multi-Site (11-multi-site, Phase 2)
[11.1] HIGH TO jako most międzyzakładowy | [11.2] HIGH Multi-site (FORZ + KOBE = 1 org, 2 sites) | [11.3] HIGH Site-level filtering na raportach. Aktywacja `site_id` (już NULL na wszystkich tabelach). Shared master data (produkty, BOM) z site-specific inventory.

### M12 — OEE (12-oee, Phase 2)
[9.1] HIGH Downtime categories z produkcji | [9.2] HIGH Efficiency % per linia/godzina | [9.3] MEDIUM slow_running_pct, stops_pct | [9.4] MEDIUM engineering downtime %. Real-time OEE (A × P × Q). Machine dashboard. Energy monitoring.

### M13 — Integrations (13-integrations, Phase 2)
Comarch Optima (batch dzienny). EDI EDIFACT (ORDERS, DESADV, INVOIC). Supplier Portal. Customer Portal. Webhooks + External APIs.

### M14 — Maintenance (14-maintenance, Phase 2)

**Core**: 14.1 Maintenance Schedules (time/usage-based) | 14.2 Maintenance Work Orders (state machine) | 14.3 Spare Parts Inventory | 14.4 Maintenance History

**Integration**: 14.5 Auto-Generate WO from Downtime | 14.6 Calibration Tracking | 14.7 Maintenance Dashboards | 14.8 Technician Scheduling

**Food industry**: Sanitation PM (CIP), Calibration compliance (wagi, temp, pH), Allergen equipment maintenance.

**Zależności**: M01 Settings (maszyny), M06 Production (downtime), M12 OEE (MTBF/MTTR, TPM).

### M15 — Reporting (15-reporting) — INKREMENTALNY

Budowany etapami po kolejnych modułach. Dane źródłowe: `Raporting/` folder.

| Epik | Po module | Dashboardy |
|------|-----------|------------|
| M15-E1 (Phase 1) | M06 Production | [10.1] Factory Overview, [10.2] Yield by Line, [10.3] Yield by SKU |
| M15-E2 (Phase 1) | M08 Quality | QC Holds dashboard, Yield Issues |
| M15-E3 (Phase 2) | Phase 2 | [10.4] Giveaway, [10.5] Leader Scorecard, [10.8] Daily Issues, [10.9] Shift Performance |
| M15-E4 (Phase 2) | Phase 2 | [10.6] Supervisor Comparison, [10.7] Period Reports 4-4-5, [10.10] Multi-granularity time |

Latencja: materialized views (1–3 min) dla agregacji, real-time queries (< 10 s) dla statusów.

---

## 9. KPIs — Master KPI List

### Produkcja
Yield % (wgt) | Giveaway % | Efficiency % | KG Output | Cases/Packets | Variance £ | Meat Yield % | Downtime min (People/Process/Plant) | Slow Running % | Stops %

### Jakość
QC Holds (boxes/h) | Yield Issues (target vs actual, claim value) | Accidents/Near Misses

### Kadry
Leader Grade A/B/C/D | Team Comparison (supervisor ranking) | Staffing Variance (+/- FTE)

### Finanse
Cost per KG (GBP) | Variance £ per line/SKU | Potential Savings £

### Maintenance
MTBF (h) | MTTR (min) | PM Effectiveness % | Maintenance Cost per Unit | Schedule Adherence % | Spare Parts Turnover

### Porównania czasowe
W/W (tydzień) | P/P (4-4-5 fiskalny) | Y/Y (rok) | AM vs PM (zmiana) | vs Target

### System
Uptime ≥ 99,5% | Page Load P95 < 2 s | Traceability < 30 s | Scanner Op < 30 s | API P95 < 500 ms

---

## 10. Risks

### Istniejące
| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Luka RLS | Średnie | Wysoki | Testy automatyczne org_id, audyt bezpieczeństwa |
| Opóźnienia drukarek | Średnie | Wysoki | Lib ZPL, lab testowy |
| SMB nie chcą płacić | Średnie | Średni | Freemium, ROI calculator, piloty |
| Konkurent tier SMB | Niskie | Wysoki | First-mover, lock-in integracje |
| Single-dev risk | Średnie | Wysoki | Dokumentacja, code reviews, ADR |
| Supabase lock-in | Niskie | Średni | Standard PostgreSQL, migration path |

### Nowe moduły
| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Reporting — agregacje | Średnie | Średni | Materialized views, Redis cache |
| Multi-Site — schema propagation | Wysokie | Wysoki | site_id opcjonalny, backward-compatible, feature flag |
| Maintenance — domain expertise | Średnie | Średni | Konsultacja z klientami, MVP minimum |
| Scanner — kompatybilność urządzeń | Średnie | Średni | Testy 3+ modeli Zebra/Honeywell |
| Catch weight — cross-cutting | Wysokie | Wysoki | Per moduł z shared util, opt-in, is_catch_weight |
| OEE — integracja maszyn | Średnie | Wysoki | Manual input fallback, API do PLC Phase 2+ |
| Finance — formaty ERP | Średnie | Średni | Adapter pattern, start Comarch Optima |
| Maintenance WO complexity | Średnie | Średni | Prosty state machine, rozszerzanie iteracyjne |

### Tech Debt (17 items)
- **P0 (2)**: Brak transakcji DB, console.log w produkcji → rozwiązać PRZED launch MVP
- **P1 (5)**: Niespójny klient Supabase, brak indeksów, brak rate limiting → rozwiązać przed Phase 2
- **P2 (6)**: Duplikacja typów, brak paginacji, luki testów
- **P3 (4)**: Deprecated syntax, bundle size, brak API docs

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] M01–M04, M06–M08 działają (Settings, Technical, Warehouse, Planning, Production, Shipping, Quality)
- [ ] Quality basic + HACCP checklisty działają
- [ ] Shipping basic działa
- [ ] Print ZPL → Zebra działa
- [ ] Scanner (M05) workflows: move, receive, pick, produce, QA
- [ ] Trasowalność < 30 s end-to-end
- [ ] Brak bugów Critical/High
- [ ] Catch weight na produkcie i WO
- [ ] Waste tracking (fat, floor, giveaway)
- [ ] GRN validation (qty vs PO)
- [ ] Factory Overview Dashboard + Yield by Line/SKU

### Niefunkcjonalne
- [ ] Uptime > 99,5% / 30 dni
- [ ] Page load P95 < 2 s
- [ ] UX skanera zwalidowany z 3+ użytkownikami
- [ ] Audyt bezpieczeństwa (RLS, auth, izolacja)
- [ ] DR udokumentowane i przetestowane

### Biznesowe
- [ ] 3+ klientów pilotażowych
- [ ] Onboarding < 2 tygodnie per klient
- [ ] Self-service signup live
- [ ] Dokumentacja / help center

---

## 12. References

### Dokumenty źródłowe
PRD Index → `prd/prd.md` | Project Brief → `prd/project-brief.md` | PRD Update List (77 items) → `_meta/PRD-UPDATE-LIST.md` | D365 Analysis → `_meta/D365-ANALYSIS.md` | Design Guidelines → `_meta/DESIGN-GUIDELINES.md` | Maintenance Analysis → `14-maintenance/ANALYSIS.md` | Feature Gap Analysis → `other/discovery/FEATURE-GAP-ANALYSIS.md`

### ADR (18 decyzji)
ADR-001 LP Inventory | ADR-002 BOM Snapshot | ADR-003 Multi-Tenancy | ADR-004 GS1 | ADR-005 FIFO/FEFO | ADR-006 Scanner-First | ADR-007 WO State Machine | ADR-008 Audit Trail | ADR-009 Routing Costs | ADR-010 Product Procurement | ADR-011 Module Toggle | ADR-012 Role Permissions | ADR-013 RLS Pattern | ADR-015 Constants | ADR-016 CSV Parser | ADR-017 React.memo | ADR-018 API Errors | ADR-019 TO State Machine

Wszystkie w: `new-doc/00-foundation/decisions/`

### Inne
System Overview → `decisions/system-overview.md` | Integration Map → `decisions/integration-map.md` | Tech Debt → `decisions/tech-debt.md` | Bug Tracker → `bugs/CONSOLIDATED-BUG-TRACKER.md`

### Zewnętrzne
D365 Analysis → `_meta/D365-ANALYSIS.md` | Design Guidelines → `_meta/DESIGN-GUIDELINES.md`

### Limit
PRD plik do 18k tokenow

---

_PRD 00-Foundation v2.3 — 16 modułów (M00–M15), 77+8 wymagań, 18 ADR._
_Changelog v2.3: REC-M1 — Ujednolicono standard EDI na EDIFACT (ORDERS=zamówienia, DESADV=ASN, INVOIC=faktury) we wszystkich sekcjach. Usunięto niejednoznaczne odniesienia do X12. Zgodność z M13 Integrations PRD._
_Changelog v2.2: Nowa numeracja M01–M15 zgodna z folderami. Warehouse=M03, Planning=M04, Scanner=M05, Production=M06, Quality=M08, NPD=M09, Finance=M10, Multi-Site=M11, OEE=M12, Integrations=M13, Maintenance=M14, Reporting=M15. Scanner i Reporting inkrementalne. site_id NULL retroaktywnie na wszystkich tabelach._
_Data: 2026-02-18_
