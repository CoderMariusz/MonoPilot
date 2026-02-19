# PRD 04-Planning — MonoPilot MES
**Wersja**: 3.2 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Moduł Planning (M04) to kręgosłup operacyjny MonoPilot MES, odpowiedzialny za zarządzanie dostawcami, zamówieniami zakupu (PO), transferami wewnętrznymi (TO), zleceniami produkcyjnymi (WO) oraz planowaniem popytu. Łączy to, co trzeba wyprodukować (popyt), z dostępnymi zasobami (podaż), umożliwiając małym i średnim producentom żywności planowanie bez złożoności enterprise ERP.

**Kluczowa decyzja biznesowa**: Planning jest prostszy niż ERP — 3-krokowe tworzenie PO, smart defaults z danych dostawcy, brak pełnego ERP (GL/AR/AP). Integracja z zewnętrznymi systemami finansowymi.

**Pozycja w build order**: M01 Settings → M02 Technical → M03 Warehouse → **M04 Planning** → M05 Scanner (inkr.) → M06 Production

---

## 2. Objectives

### Cel główny
Dostarczyć wydajne, intuicyjne narzędzie planistyczne, które eliminuje arkusze kalkulacyjne i pozwala zarządzać pełnym cyklem: zamówienie → transfer → zlecenie produkcyjne → release to warehouse.

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Czas tworzenia PO (20 linii) | < 5 min | UX stopwatch |
| % PO z auto-wypełnionymi danymi dostawcy | > 80% | Analityka |
| Czas utworzenia WO z BOM snapshot | < 1 s (P95) | APM |
| % WO z pełną rezerwacją materiałów | > 90% | Raport |
| Dokładność planu (planned vs actual qty) | > 95% | Porównanie WO |
| Zgodność terminów dostaw PO | > 85% | PO tracking |
| Dashboard load time | < 1 s (P95) | APM |

---

## 3. Personas

| Rola | Moduł Planning — główne zadania |
|------|----------------------------------|
| **Kupiec/Purchaser** | Tworzenie PO, zarządzanie dostawcami, negocjacje cen, monitoring dostaw |
| **Planista** | Tworzenie WO/TO, planowanie produkcji, harmonogramowanie, material check |
| **Kierownik produkcji** | Release WO, przegląd harmonogramu, zatwierdzanie priorytetów, dashboard |
| **Operator magazynu** | Odbiór PO (GRN w M03), realizacja TO (ship/receive w M03) |
| **Administrator** | Konfiguracja ustawień modułu (statusy, approval, numeracja) |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Obszar | Priorytet |
|--------|-----------|
| Supplier master data (CRUD, przypisania produktów, default supplier) | Must Have |
| PO — 3-krokowe tworzenie, smart defaults, bulk create, approval workflow | Must Have |
| PO — konfigurowalne statusy, linia lifecycle (draft→closed) | Must Have |
| TO — CRUD z liniami, LP pre-selection, partial shipments | Must Have |
| TO — state machine (ADR-019): draft→planned→shipped→received→closed | Must Have |
| WO — CRUD z BOM snapshot (ADR-002), routing copy, material scaling | Must Have |
| WO — state machine (ADR-007): draft→released→in_progress→on_hold→completed→closed | Must Have |
| WO — material availability check (green/yellow/red), hard reservation (LP lock) | Should Have |
| WO — **release to warehouse** (udostępnia pick work w Scanner M05) [4.3] | Must Have |
| PO — **smart defaults z supplier master** (auto currency, tax, price, lead time) [4.1] | Must Have |
| Planning Dashboard — KPI cards, alerty, upcoming orders | Should Have |
| Planning Settings — PO/TO/WO config, numeracja, approval rules | Must Have |
| Gantt chart — widok harmonogramu WO per linia/maszyna | Could Have |

### 4.2 Out of Scope — Phase 2

| Obszar | Uzasadnienie |
|--------|-------------|
| Demand forecasting (historical-based) | Wymaga danych z produkcji |
| MRP/MPS basic | Złożoność vs time-to-market |
| Auto-replenishment rules | Wymaga pełnego inventory |
| PO templates + blanket POs | Convenience feature |
| Safety stock management | Wymaga demand history |
| Reorder point alerts | Wymaga safety stock |
| Bulk CSV import (ADR-016) | Post-MVP |

### 4.3 Out of Scope — Phase 3 (Enterprise)

Supplier Quality Management (scorecards, audyty, ASL). Finite Capacity Planning. EDI Integration (EDIFACT). VMI Supplier Portal.

### 4.4 Exclusions (Nigdy)

- Pełna księgowość (GL/AR/AP) — integracja z Comarch/Sage/wFirma
- Customer order management — moduł Shipping (M07)
- HR/workforce scheduling — osobna domena
- Transport management — ewentualnie 3PL integration

---

## 5. Constraints

### Techniczne
- **Supabase + RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach. RLS: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Zapytania przez service role z filtrowaniem org_id.
- **site_id NULL**: Pole na wszystkich tabelach (przygotowanie pod M11 Multi-Site), nullable.
- **BOM snapshot**: WO kopiuje BOM+routing przy tworzeniu — niezmienny po release (ADR-002).
- **LP-based inventory**: Brak luźnych ilości. Rezerwacje (hard lock) i zużycie na poziomie LP.
- **Service Layer + Zod**: Logika w `lib/services/*-service.ts`, walidacja Zod (ADR-015, ADR-016, ADR-018).

### Biznesowe
- PO creation = **3 kroki** (dostawca → produkty+qty → submit). Prostsze niż ERP.
- Lead time i MOQ na **produkcie** (ADR-010), z opcjonalnym override na supplier-product.
- Waluta startowa: GBP. Multi-currency Phase 2.
- WO zawsze wymaga BOM (guard `hasBOM` na release). Wyjątek: rework WO (`is_rework=true`) — bez BOM, materiały ręcznie.

### Regulacyjne
- Audit trail na wszystkich zmianach statusu (FDA 21 CFR Part 11, FSMA 204).
- Trasowalność: WO → wo_materials → LP → genealogy.

---

## 6. Decisions

### D1. Work Order State Machine — ADR-007
**Stany**: DRAFT → RELEASED → IN_PROGRESS → ON_HOLD ↔ IN_PROGRESS → COMPLETED → CLOSED (+ CANCELLED)
- **ON_HOLD**: WO wstrzymane z powodu awarii linii, braku materiałów itp. Nie jest obowiązkowym krokiem. Wymaga `pause_reason`. Powrót do IN_PROGRESS po usunięciu przyczyny.
- **COMPLETED**: Produkcja zakończona, output zarejestrowany. WO gotowe do rozliczenia.
- **CLOSED**: Zamknięte przez Finance/M10 po rozliczeniu kosztów. Stan terminalny.
**Guardy**: `hasBOM` (release), `hasMaterials` (release), `outputRecorded` (complete), `allOperationsComplete` (complete, overridable).
**Override**: supervisor z logowaniem powodu.
**Side effects**: auto-reserve on release, timestamps (started_at, completed_at), finalize output LPs.
**Tabela historii**: `wo_status_history` (from_status, to_status, action, user_id, override_reason, timestamp).

### D2. Transfer Order State Machine — ADR-019
**Stany**: draft → planned → partially_shipped → shipped → partially_received → received → closed (+ cancelled)
**Permission helpers**: `canEdit()`, `canShip()`, `canReceive()`, `canDelete()`, `canEditLines()`
**Modularyzacja**: Osobny plik `state-machine.ts` z walidacją przejść, type guards, utility functions.

### D3. BOM Snapshot — ADR-002
**Przy tworzeniu WO**: BOM items → `wo_materials` (scaled qty), Routing ops → `wo_operations`.
**Skalowanie**: `required_qty = bom_item.qty × (wo.planned_qty / bom.output_qty) × (1 + scrap_percent/100)`
**Selekcja BOM**: Auto na podstawie `effective_from/to` i `scheduled_date`. User może override.
**BOM → Routing**: `boms.routing_id` — WO dziedziczy routing z BOM, nie bezpośrednio z produktu.
**Immutability**: Po WO status = `released`, `wo_materials` i `wo_operations` niemodyfikowalne.

### D4. Konfigurowalne statusy — tylko nazwy i kolory
Workflow (przejścia między stanami) jest **stały** i zdefiniowany w state machine (ADR-007, ADR-019). Organizacja może konfigurować jedynie **nazwy wyświetlane** i **kolory** statusów, NIE może dodawać/usuwać stanów ani zmieniać transitions.

### D5. RLS / org_id — ADR-003, ADR-013
`org_id UUID NOT NULL` na: `suppliers`, `purchase_orders`, `transfer_orders`, `work_orders`, `planning_settings` + wszystkie tabele podrzędne (linie, materiały, operacje, rezerwacje).
RLS policy: `org_id = (SELECT org_id FROM users WHERE id = auth.uid())`.

### D6. Rezerwacje materiałów — HARD lock na LP
Rezerwacja LP na WO = **hard lock**. Ten sam LP NIE może być zarezerwowany na 2 WO jednocześnie. Próba rezerwacji zajętego LP → error. LP zwolniony dopiero po: consumption (zużycie) lub release (anulowanie rezerwacji/WO). Visibility: zarezerwowane LP oznaczone w inventory views.

### D7. WO zawsze wymaga BOM (wyjątek: rework)
Regularne WO **musi** mieć BOM — na tej podstawie liczone są ilości materiałów i koszty. Guard `hasBOM` blokuje release. **Wyjątek**: rework WO (flaga `is_rework=true`) może być utworzone bez BOM, z ręcznym dodawaniem materiałów do `wo_materials`.

### D8. TO = transfer między magazynami w jednym site
TO w M04 obsługuje transfery między magazynami **w ramach jednego site'u** (jeden site może mieć wiele magazynów). Transfer międzyzakładowy (FORZ ↔ KOBE, site-to-site) to **osobna funkcjonalność w M11 Multi-Site** — może korzystać z rozszerzonego TO z polami `from_site_id`/`to_site_id`, ale to inna encja/flow.

### D9. Release to Warehouse = visibility dla Scanner
Release to warehouse na WO to moment, w którym praca staje się **widoczna dla operatora skanera** (M05). Analogicznie jak WO release udostępnia WO dla produkcji w Scanner. Nie tworzy osobnej tabeli `pick_lists` — Scanner M05 odpytuje WO w statusie `released` z flagą `released_to_warehouse=true` i wyświetla materiały do pobrania.

### D10. Lead Time i MOQ — ADR-010
Lead time i MOQ na **produkcie** (`products.lead_time_days`, `products.moq`), NIE na dostawcy.
`supplier_products` może mieć opcjonalne override: `lead_time_days`, `unit_price`, `moq`.
Expected delivery = `order_date + COALESCE(supplier_products.lead_time_days, products.lead_time_days)`.

### D11. PO 3-krokowe tworzenie
Krok 1: Wybór dostawcy → auto-fill currency, tax, payment_terms.
Krok 2: Dodanie produktów + qty → auto-fill price z supplier-product lub product.
Krok 3: Przegląd + submit.
Bulk: lista produktów → auto-group by default supplier → draft PO per dostawca.

### D12. Release to Warehouse [4.3]
Akcja `release_to_warehouse` na WO w statusie `released` ustawia flagę `released_to_warehouse=true`.
Od tego momentu operator skanera (M05) widzi WO i może pobrać materiały (pick workflow).
Scanner odpytuje WO z `released_to_warehouse=true` i wyświetla wo_materials z FIFO/FEFO suggestion.

---

## 7. Module Map

### Planning sub-areas

```
M04 Planning
├── E04-1: Suppliers & PO Core (Phase 1)
├── E04-2: Transfer Orders (Phase 1)
├── E04-3: Work Orders & BOM Snapshot (Phase 1)
├── E04-4: Dashboard & Settings (Phase 1)
├── E04-5: MRP & Demand Planning (Phase 2)
└── E04-6: Enterprise Planning (Phase 3)
```

### Zależności

```
M01 Settings (warehouses, lines, machines, tax codes)
M02 Technical (products, BOMs, routings, allergens)
     └── M04 Planning ──┬── M03 Warehouse (PO receiving/GRN, TO ship/receive, LP inventory)
                        ├── M06 Production (WO execution)
                        └── M08 Quality (supplier quality — Phase 3)
```

### Routing

```
/planning                        → Dashboard
├── /suppliers                   → Lista dostawców
│   └── /[id]                    → Szczegóły dostawcy + przypisane produkty
├── /purchase-orders             → Lista PO, bulk create
│   └── /[id]                    → Szczegóły PO z liniami
├── /transfer-orders             → Lista TO
│   └── /[id]                    → Szczegóły TO z liniami
├── /work-orders                 → Lista WO, widok arkuszowy
│   ├── /[id]                    → Szczegóły WO z materiałami/operacjami
│   └── /gantt                   → Gantt chart (Could Have)
└── /mrp                         → MRP dashboard (Phase 2)

/settings/planning               → Ustawienia modułu
```

---

## 8. Requirements

### E04-1: Suppliers & Purchase Orders (Phase 1 — MVP)

#### Backend

**FR-PLAN-001: Supplier CRUD**
- Tabela `suppliers`: id, org_id, code (UNIQUE per org), name, address, city, postal_code, country (ISO 3166-1), contact_name/email/phone, currency (GBP default), tax_code_id, payment_terms, notes, is_active.
- Soft delete (is_active=false). Audit: created_at/by, updated_at/by.
- API: GET/POST/PUT/DELETE `/api/planning/suppliers`.

**FR-PLAN-002: Supplier-Product Assignment**
- Tabela `supplier_products`: supplier_id, product_id, is_default (max 1 per product), supplier_product_code, lead_time_days (override), unit_price, currency, moq (override), order_multiple, last_purchase_date/price, notes.
- UNIQUE(supplier_id, product_id). Cascade delete on supplier removal.
- API: GET/POST/DELETE `/api/planning/suppliers/:id/products`.

**FR-PLAN-003: Default Supplier per Product**
- Constraint: max 1 `is_default=true` per product_id. Trigger/validation w serwisie.
- Przy tworzeniu PO line: auto-fill price/lead time z default supplier assignment.
- Warning jeśli produkt bez default supplier.

**FR-PLAN-004: Product Lead Time (ADR-010)**
- Lead time na `products.lead_time_days`. Override opcjonalny na `supplier_products.lead_time_days`.
- Expected delivery = `order_date + COALESCE(sp.lead_time_days, p.lead_time_days)`.

**FR-PLAN-005: PO CRUD [4.1 — Smart Defaults]**
- Tabela `purchase_orders`: org_id, po_number (auto: PO-YYYY-NNNNN), supplier_id, currency (inherited), tax_code_id (inherited), expected_delivery_date, warehouse_id, status, payment_terms (inherited), shipping_method, notes, internal_notes, approval_*, subtotal/tax_amount/total/discount_total (calculated), audit fields.
- **Smart defaults [4.1]**: Przy wyborze dostawcy auto-fill: currency, tax_code_id, payment_terms. Przy dodaniu produktu: unit_price z supplier-product lub product, lead_time do expected_delivery_date.
- API: GET/POST/PUT/DELETE `/api/planning/purchase-orders`.

**FR-PLAN-006: PO Line Management**
- Tabela `po_lines`: po_id, line_number (auto), product_id, quantity, uom (from product), unit_price (default z supplier-product), discount_percent, discount_amount (calc), line_total (calc), expected/confirmed_delivery_date, received_qty, notes.
- Calculated: `line_total = (qty * unit_price) - discount_amount`. Header totals recalc on line change.

**FR-PLAN-007: PO Status Lifecycle**
- Default: draft → submitted → [pending_approval] → confirmed → receiving → closed (+ cancelled).
- Przejścia: submit (lines > 0), approve (rola), confirm, first GRN → receiving, full receipt → closed.
- Blokady: brak edycji po receipt, brak usunięcia z receipts.

**FR-PLAN-008: Bulk PO Creation**
- Endpoint: POST `/api/planning/purchase-orders/bulk`.
- Input: lista produktów + qty. System grupuje by default supplier. Output: draft PO per supplier.
- Warning dla produktów bez default supplier.
- Opcjonalnie: Excel import (CSV parser ADR-016).

**FR-PLAN-009: PO Approval Workflow** (Should Have)
- Settings: `po_require_approval`, `po_approval_threshold`, `po_approval_roles`.
- Flow: submit → pending_approval (jeśli enabled i total > threshold) → approve/reject z notes → confirmed.
- Notyfikacja do approvers (email SendGrid Phase 2).

**FR-PLAN-010: PO Totals Calculation**
- subtotal = SUM(line_total), tax_amount = subtotal * tax_rate, total = subtotal + tax_amount.
- Recalc triggerowane na zmianach linii.

#### Frontend/UX

| Komponent | Opis |
|-----------|------|
| SupplierTable | Lista z search, filtr active/inactive |
| SupplierForm | Modal create/edit z walidacją |
| SupplierDetail | Strona szczegółów z listą przypisanych produktów |
| POTable | Lista PO z badge statusu, filtr po status/supplier/date |
| POFastFlow | 3-krokowy kreator: dostawca → produkty+qty → review+submit |
| PODetail | Strona z liniami, historią statusów, approval actions |
| POBulkImport | Modal z formularzem lub upload Excel |
| POApprovalModal | Approve/reject z notes |

#### Integracje/Zależności
- **M01 Settings**: warehouses, tax_codes, users (approval roles).
- **M02 Technical**: products (name, sku, uom, lead_time_days, moq, preferred_supplier_id).
- **M03 Warehouse**: PO → GRN (receiving), aktualizacja received_qty, status → receiving/closed.

---

### E04-2: Transfer Orders (Phase 1 — MVP)

#### Backend

**FR-PLAN-012: TO CRUD**
- Tabela `transfer_orders`: org_id, to_number (auto: TO-YYYY-NNNNN), from_warehouse_id, to_warehouse_id (≠ from), planned_ship/receive_date, actual_ship/receive_date, status, priority (low/normal/high/urgent), notes, shipped_by, received_by, audit fields.
- Walidacja: from ≠ to warehouse.

**FR-PLAN-013: TO Line Management**
- Tabela `to_lines`: to_id, line_number, product_id, quantity, uom, shipped_qty, received_qty, notes.
- Tabela `to_line_lps`: to_line_id, lp_id, quantity (opcjonalna LP pre-selection).

**FR-PLAN-014: TO Status Lifecycle (ADR-019)**
- State machine: draft → planned → partially_shipped → shipped → partially_received → received → closed (+ cancelled).
- Permission helpers: `canEdit(status)`, `canShip(status)`, `canReceive(status)`, `canDelete(status)`, `canEditLines(status)`.
- Type guards: `isValidStatus()`, `assertValidStatus()`.

**FR-PLAN-015: Partial Shipments** (Should Have)
- Toggle: `to_allow_partial_shipments` w settings.
- Shipped_qty tracked per line. Status → partially_shipped until all shipped.

**FR-PLAN-016: LP Selection for TO** (Should Have)
- Toggle: `to_require_lp_selection` w settings.
- Workflow z LP: user przypisuje LP → system waliduje availability.
- Workflow bez LP: przy shipment warehouse staff wybiera LP (FIFO/FEFO).

#### Frontend/UX

| Komponent | Opis |
|-----------|------|
| TOTable | Lista z badge statusu, filtr status/warehouse/date |
| TOForm | Modal z wyborem warehouse source/dest |
| TODetail | Strona z liniami, shipped/received qty, LP |
| TOLPSelector | Modal wyboru LP z FIFO/FEFO suggestion |
| ShipTOModal | Zapis shipment (qty per line) |
| ReceiveTOModal | Zapis receipt (qty per line) |

#### Integracje/Zależności
- **M01 Settings**: warehouses, locations.
- **M03 Warehouse**: LP inventory (dostępność), stock moves on ship/receive, transit locations.
- **M11 Multi-Site** (Phase 2): TO jako most między site'ami.

---

### E04-3: Work Orders & BOM Snapshot (Phase 1 — MVP)

#### Backend

**FR-PLAN-017: WO CRUD**
- Tabela `work_orders`: org_id, wo_number (auto: WO-YYYYMMDD-NNNN), product_id, bom_id, routing_id, planned_quantity, produced_quantity, uom, status, planned_start/end_date, scheduled_start/end_time, production_line_id, machine_id, priority (low/normal/high/critical), source_of_demand, source_reference, expiry_date, **is_rework** (BOOLEAN DEFAULT false), **released_to_warehouse** (BOOLEAN DEFAULT false), notes, started_at, completed_at, paused_at, pause_reason, actual_qty, yield_percent (calc), audit fields.
- **is_rework**: Rework WO może być utworzone bez BOM; materiały dodawane ręcznie.
- **released_to_warehouse**: Flaga ustawiana przez akcję release-to-warehouse; Scanner M05 filtruje po niej.

**FR-PLAN-018: BOM Auto-Selection (ADR-002)**
- Selekcja: aktywny BOM z `effective_from <= scheduled_date AND (effective_to IS NULL OR effective_to >= scheduled_date)`.
- Multiple match → najnowszy `effective_from`.
- User override dozwolony. Warning jeśli brak BOM.
- Toggle: `wo_auto_select_bom` w settings.

**FR-PLAN-019: BOM Snapshot → wo_materials**
- Tabela `wo_materials`: wo_id, organization_id, product_id, material_name, required_qty (scaled), consumed_qty, reserved_qty, uom, sequence, consume_whole_lp, is_by_product, yield_percent, scrap_percent, condition_flags (JSONB), bom_item_id, bom_version, notes.
- Scaling: `required_qty = bom_item.qty × (wo.planned_qty / bom.output_qty) × (1 + scrap_percent/100)`.
- Immutable po status `released`.

**FR-PLAN-020: Routing Copy → wo_operations** (Should Have)
- Tabela `wo_operations`: wo_id, organization_id, sequence, operation_name, machine_id, line_id, expected_duration_minutes, expected_yield_percent, actual_duration/yield, status (pending/in_progress/completed), started_at/by, completed_at/by, notes.
- Toggle: `wo_copy_routing` w settings.
- BOM → Routing: WO dziedziczy routing z `boms.routing_id`.

**FR-PLAN-021: Material Availability Check** (Should Have)
- Query: available LP qty per material (status=available, warehouse=WO warehouse).
- Indicators: Green (≥120% required), Yellow (100-120%), Red (<100%).
- Warning only — nie blokuje tworzenia WO.
- Toggle: `wo_material_check` w settings.

**FR-PLAN-022: WO Status Lifecycle (ADR-007)**
- State machine: DRAFT → RELEASED → IN_PROGRESS ↔ ON_HOLD → COMPLETED → CLOSED (+ CANCELLED).
- **ON_HOLD**: opcjonalny stan wstrzymania (awaria linii, brak materiałów). Wymaga `pause_reason`. Powrót do IN_PROGRESS.
- **COMPLETED**: produkcja zakończona, output zarejestrowany. Gotowe do Finance.
- **CLOSED**: zamknięte przez Finance (M10) po rozliczeniu. Stan terminalny.
- Guards: `hasBOM` (release, wyjątek: is_rework=true), `hasMaterials` (release), `outputRecorded` (complete), `allOperationsComplete` (complete, overridable).
- Override: supervisor z powodu, logowane w `wo_status_history`.
- Side effects: reserve on release, timestamps, finalize outputs.

**FR-PLAN-025: Material Reservation — Hard Lock** (Should Have)
- Tabela `wo_material_reservations`: wo_id, wo_material_id, lp_id, quantity, reserved_at/by, released_at.
- **Hard lock**: Ten sam LP NIE może być zarezerwowany na 2 WO jednocześnie. Próba → error z info o istniejącej rezerwacji.
- LP zwolniony po: consumption (zużycie w produkcji) lub release (anulowanie rezerwacji/cancel WO).
- Zarezerwowane LP oznaczone w inventory views (badge "Reserved for WO-XXX").
- Auto-release on WO cancel, convert to consumption on use.

**FR-PLAN-026: Release to Warehouse [4.3]**
- Akcja POST `/api/planning/work-orders/:id/release-to-warehouse`.
- Warunki: WO status = `released`, materials defined.
- Efekt: ustawia `released_to_warehouse = true` na WO.
- Od tego momentu Scanner (M05) widzi WO w pick workflow i wyświetla materiały do pobrania.
- Scanner odpytuje: `WHERE status = 'released' AND released_to_warehouse = true`.
- FIFO/FEFO suggestion generowane dynamicznie przez Scanner przy wyborze LP.

#### Frontend/UX

| Komponent | Opis |
|-----------|------|
| WOTable | Lista z badge statusu, filtr status/line/date, sort by priority |
| WOSpreadsheet | Widok arkuszowy do szybkiej edycji (date, qty, line, priority) |
| WOForm | Modal z BOM preview, material availability panel |
| WODetail | Strona z materiałami, operacjami, historią statusów |
| WOMaterialsTable | Lista materiałów z availability indicators (G/Y/R) |
| WOOperationsTimeline | Sekwencja operacji ze statusem |
| WOAvailabilityPanel | Podsumowanie dostępności materiałów |
| WOGanttChart | Gantt po liniach/maszynach, kolor=status (Could Have) |
| ReleaseToWarehouseButton | Przycisk release z potwierdzeniem |

#### Integracje/Zależności
- **M02 Technical**: products, BOMs (bom_items, effective dates), routings (operations).
- **M03 Warehouse**: LP inventory (availability check), pick list generation [4.3], stock status.
- **M06 Production**: WO execution (start/pause/complete), material consumption, output recording.
- **M08 Quality**: QA holds na materiałach, quality_hold status (Phase 2).

---

### E04-4: Dashboard & Settings (Phase 1 — MVP)

#### Backend

**FR-PLAN-027: Planning Dashboard**
- Endpoint: GET `/api/planning/dashboard`.
- KPI cards: Open POs, POs Pending Approval, Overdue POs, Open TOs, WOs Scheduled Today, WOs In Progress.
- Alerty: overdue PO, pending approval > 2 days, material shortages, WO on hold > 24h, WO past scheduled date.
- Upcoming: PO calendar (expected deliveries), WO schedule (by date/line), TO timeline.
- Cache: Redis 1 min TTL.

**FR-PLAN-028: Planning Settings**
- Tabela `planning_settings`: org_id (UNIQUE), po_*/to_*/wo_* settings.
- PO: require_approval, approval_threshold, approval_roles, auto_number_prefix/format, field_visibility (JSONB).
- TO: allow_partial_shipments, require_lp_selection, auto_number_prefix/format.
- WO: auto_select_bom, copy_routing, material_check, require_bom, allow_overproduction, overproduction_limit, auto_number_prefix/format, status_expiry_days.
- API: GET/PUT `/api/planning/settings`.

### planning_settings — kolumny

| Kolumna | Typ | Domyślnie | Opis |
|---------|-----|-----------|------|
| id | UUID PK | gen_random_uuid() | |
| org_id | UUID NOT NULL FK | | Organizacja |
| default_po_currency | VARCHAR(3) | 'GBP' | Domyślna waluta PO |
| po_auto_number | BOOLEAN | true | Auto-numeracja PO |
| po_number_prefix | VARCHAR(10) | 'PO-' | Prefix numeru PO |
| po_approval_required | BOOLEAN | false | Wymagane zatwierdzenie PO |
| po_approval_threshold | DECIMAL(15,2) | NULL | Próg kwotowy zatwierdzenia |
| wo_auto_number | BOOLEAN | true | Auto-numeracja WO |
| wo_number_prefix | VARCHAR(10) | 'WO-' | Prefix numeru WO |
| to_auto_number | BOOLEAN | true | Auto-numeracja TO |
| to_number_prefix | VARCHAR(10) | 'TO-' | Prefix numeru TO |
| default_lead_time_days | INTEGER | 7 | Domyślny lead time |
| enable_mrp | BOOLEAN | false | Włącz MRP (Phase 2) |
| auto_create_wo_from_demand | BOOLEAN | false | Auto-tworzenie WO z popytu |
| default_wo_priority | VARCHAR(20) | 'normal' | Domyślny priorytet WO |
| site_id | UUID NULL | NULL | Multi-site (M11) |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

**FR-PLAN-029: Configurable Status Display** (Should Have)
- PO, TO, WO — każdy status ma konfigurowalne **nazwy wyświetlane** i **kolory** w settings.
- Workflow (transitions) jest **stały** — zdefiniowany w state machine (ADR-007, ADR-019). Org nie może dodawać/usuwać stanów ani zmieniać przejść.
- Default nazwy i kolory seedowane przy onboardingu.

#### Frontend/UX

| Komponent | Opis |
|-----------|------|
| PlanningDashboard | KPI cards + alerts + upcoming orders + quick actions |
| PlanningStatsCards | Tiles: Open POs, Pending Approval, Overdue, WOs Today |
| PlanningAlerts | Grouped alerts by type (PO/TO/WO) |
| QuickActions | Create PO/TO/WO, Bulk Import |
| PlanningSettings | Strona konfiguracji PO/TO/WO z sekcjami |

---

### E04-5: MRP & Demand Planning (Phase 2)

**FR-PLAN-030–040**: Demand forecasting (moving avg), safety stock, reorder points, MRP calculation engine, suggested PO/WO generation, auto-replenishment, PO templates, blanket POs.

Tabele Phase 2: `demand_history`, `demand_forecasts`, `replenishment_rules`, `mrp_suggestions`, `master_production_schedule`, `po_templates`, `po_template_lines`.

Settings Phase 2: `mrp_enabled`, `safety_stock_days`, `forecast_horizon_days`, `forecast_method`, `auto_po_enabled`, `auto_wo_enabled`.

**Zależności**: M03 Warehouse (inventory levels), M06 Production (consumption data), M07 Shipping (sales data).

---

### E04-6: Enterprise Planning (Phase 3)

**FR-PLAN-050–072**: Approved Supplier List (ASL), Supplier Scorecards, Supplier Audits, Resource Capacity Definition, Finite Capacity Scheduling, Capacity Analytics, EDI Import/Export (EDIFACT), VMI Supplier Portal.

Tabele Phase 3: `supplier_approvals`, `supplier_audits`, `resource_capacity`.

---

## 9. KPIs

### Operacyjne Planning

| KPI | Opis | Cel |
|-----|------|-----|
| PO Creation Time | Czas tworzenia PO z 20 liniami | < 5 min |
| PO Smart Default Rate | % PO z auto-wypełnionymi danymi | > 80% |
| WO BOM Snapshot Time | Czas utworzenia WO z kopią BOM | < 1 s P95 |
| Material Reservation Rate | % WO z pełną rezerwacją | > 90% |
| Plan Accuracy | planned_qty vs actual_qty na WO | > 95% |
| On-Time Delivery (PO) | % PO dostarczonych w terminie | > 85% |
| Overdue PO Count | Liczba przeterminowanych PO | < 5 |
| WO On-Hold Duration | Średni czas WO on hold | < 4 h |
| Dashboard Load | Czas ładowania Planning Dashboard | < 1 s P95 |

### System

| KPI | Cel |
|-----|-----|
| PO List API P95 | < 500 ms |
| WO Creation API P95 | < 1 s (z BOM snapshot) |
| Bulk PO (100 linii) | < 5 s |
| MRP Calculation (1000 produktów) | < 30 s (Phase 2) |

---

## 10. Risks

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Złożoność workflow PO/TO/WO | Średnie | Wysoki | State machine pattern (ADR-007, ADR-019) z jasnymi guards |
| Niespójne statusy po błędach | Średnie | Wysoki | Transition validation + status history audit trail |
| Brak BOM przy tworzeniu WO | Średnie | Średni | Warning (nie blokada), toggle `wo_require_bom` |
| Konflikt rezerwacji LP | Niskie | Średni | Hard lock — LP zablokowane na 1 WO, error przy próbie podwójnej rezerwacji |
| Błędne lead time / MOQ | Średnie | Średni | Walidacja na produkcie, warning jeśli brak danych |
| Release to warehouse bez materiałów | Niskie | Średni | Guard check + availability panel przed release |
| Performance Gantt chart z dużą liczbą WO | Średnie | Niski | Date range limit 30 dni, cache 1 min, pagination |
| PO approval bottleneck | Niskie | Średni | Alert na pending > 2 dni, opcjonalny threshold |

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] Supplier CRUD działa z przypisaniami produktów i default supplier
- [ ] PO 3-krokowe tworzenie z smart defaults [4.1]
- [ ] PO bulk create (grupa by supplier) działa
- [ ] PO status lifecycle end-to-end (draft → closed)
- [ ] PO approval workflow (opcjonalny) działa
- [ ] TO CRUD z state machine (ADR-019) end-to-end
- [ ] TO partial shipments (konfigurowalny) działają
- [ ] WO CRUD z BOM snapshot (ADR-002) działa
- [ ] WO state machine (ADR-007) end-to-end: draft→released→in_progress→on_hold→completed→closed
- [ ] WO material availability check (G/Y/R) działa
- [ ] WO hard reservation — LP locked na 1 WO, error przy podwójnej rezerwacji
- [ ] WO rework (is_rework=true) — tworzenie bez BOM z ręcznymi materiałami
- [ ] WO release to warehouse [4.3] — flaga released_to_warehouse widoczna w Scanner M05
- [ ] Planning Dashboard z KPI i alertami działa
- [ ] Planning Settings (PO/TO/WO config) działają

### Niefunkcjonalne
- [ ] RLS na wszystkich tabelach Planning — test izolacji org
- [ ] API P95 < 500 ms (listy), < 1 s (WO creation z BOM)
- [ ] Audit trail na zmianach statusu PO/TO/WO
- [ ] Zod walidacja na wszystkich endpointach

### Integracyjne
- [ ] PO → M03 Warehouse (GRN receiving) — connected
- [ ] WO → M06 Production (execution) — connected
- [ ] WO release to warehouse → Scanner M05 (pick visibility) — connected [4.3]
- [ ] TO → M03 Warehouse (ship/receive with LP) — connected

---

## 12. References

### Dokumenty źródłowe
- PRD Foundation: `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Planning PRD (legacy): `new-doc/04-planning/prd/planning.md`
- Planning Architecture: `new-doc/04-planning/decisions/planning-arch.md`
- PRD Update List: `new-doc/_meta/PRD-UPDATE-LIST.md` (pozycje 4.1–4.3)

### ADR
- ADR-002: BOM Snapshot Pattern — `new-doc/00-foundation/decisions/ADR-002-bom-snapshot-pattern.md`
- ADR-007: Work Order State Machine — `new-doc/04-planning/decisions/ADR-007-work-order-state-machine.md`
- ADR-010: Product Procurement (lead time/MOQ) — `new-doc/00-foundation/decisions/`
- ADR-019: Transfer Order State Machine — `new-doc/04-planning/decisions/ADR-019-transfer-order-state-machine.md`

### Powiązane moduły
- M01 Settings: `new-doc/01-settings/prd/01-SETTINGS-PRD.md`
- M02 Technical: `new-doc/02-technical/prd/`
- M03 Warehouse: `new-doc/03-warehouse/prd/`
- M06 Production: `new-doc/06-production/prd/`

### Limit
PRD plik do 20k tokenów.

---

_PRD 04-Planning v3.2 — 6 epików (4 Phase 1, 1 Phase 2, 1 Phase 3), 29+ wymagań, 4 ADR, 12 decyzji._
_Changelog v3.2: Dodana szczegółowa lista kolumn tabeli `planning_settings` (FR-PLAN-028) — 18 kolumn z typami, wartościami domyślnymi i opisami, analogicznie do definicji `production_settings` w M06._
_Changelog v3.1: WO state machine rozszerzony o ON_HOLD + CLOSED (6 stanów). Hard lock na rezerwacje LP (nie soft). Rework WO (is_rework) bez BOM. planning_priority usunięty (duplikat priority). Konfigurowalne statusy = tylko nazwy/kolory (workflow stały). Release to warehouse = flaga visibility dla Scanner M05. TO = intra-site only (multi-site w M11)._
_Changelog v3.0: Nowa numeracja M04. Sekcje ujednolicone z Foundation PRD. Dodane [4.1] smart defaults, [4.3] release to warehouse. Backend-first per epik. State machine ADR-007/ADR-019 zintegrowane. BOM snapshot ADR-002 z routing inheritance._
_Data: 2026-02-18_
