# PRD 03-Warehouse — MonoPilot MES
**Wersja**: 2.1 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Moduł Warehouse zarządza fizycznym magazynem za pomocą License Plates (LP) — atomowych jednostek inwentaryzacyjnych zapewniających pełną trasowalność forward/backward. Obejmuje przyjęcia (ASN/GRN), ruchy magazynowe, FIFO/FEFO, catch weight, GS1 (GTIN-14/SSCC-18), zarządzanie paletami, cykle inwentaryzacyjne i dedykowane workflow skanerów mobilnych.

**Kluczowa zasada**: Brak luźnych ilości — każda jednostka inwentarzowa to LP. Żadna operacja nie omija LP.

**Pozycja w systemie**: M03 — zależy od Settings (M01), Technical (M02). Zasilany przez Planning (M04), Production (M06). Dostarcza dane do Quality (M08), Shipping (M07), Reporting (M15).

---

## 2. Objectives

### Cel główny
Zapewnienie 100% trasowalności inwentarza od przyjęcia surowców do wydania wyrobów gotowych, z dokładnością stanów magazynowych ≥99% i czasem operacji skanera <30 s.

### Cele drugorzędne
1. **Zgodność regulacyjna** — FSMA Section 204, EU Reg 178/2002, GS1 Global Traceability
2. **Minimalizacja strat** — FEFO domyślnie eliminuje przeterminowanie; FIFO fallback dla non-perishables
3. **Scanner-first** — operatorzy na hali pracują ze skanerem, desktop do zarządzania i korekt
4. **Catch weight** — pełne wsparcie produktów o zmiennej wadze (mięso, sery)

### Metryki sukcesu (moduł)

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Dokładność stanów | ≥99% | Cycle count variance |
| Czas przyjęcia GRN (scan-to-LP) | <30 s | APM |
| Czas operacji skanera | <30 s | APM |
| Zgodność FIFO/FEFO | ≥95% | Override rate |
| LP lookup by barcode | <200 ms | API P95 |
| FIFO/FEFO pick suggestion | <500 ms | API P95 |
| Traceability query (LP genealogy) | <30 s | APM |
| Uptime | ≥99,5% | Monitoring |

---

## 3. Personas

| Persona | Rola w Warehouse | Priorytet |
|---------|-----------------|-----------|
| **Operator magazynu** | GRN, ruchy, FIFO/FEFO picking, wysyłka. 100% dokładność stanów przez LP tracking. Skaner Zebra/Honeywell. | Główna |
| **Kierownik magazynu** | Nadzór stanów, zatwierdzanie korekt, cycle counts, konfiguracja | Główna |
| **Kierownik jakości** | QA status na LP (PASSED/FAILED/HOLD/QUARANTINED/RELEASED/COND_APPROVED), blokady, zwolnienia | Główna |
| **Operator produkcji** | Konsumpcja LP (pick for WO), output LP creation | Drugorzędna |
| **Planista** | Rezerwacje LP na WO/TO, FIFO/FEFO sugestie | Drugorzędna |
| **Administrator** | Warehouse settings, feature toggles | Drugorzędna |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Epik | Opis | Priorytet |
|------|------|-----------|
| M03-E01: LP Core | LP CRUD, auto-numbering, status lifecycle, QA status, genealogy, split/merge | Must Have |
| M03-E02: Receiving | GRN z PO, GRN z TO, over-receipt control, GRN validation (qty vs PO, tolerance) [3.3], stock status dimension [3.4], GS1-128 scanning na GRN [3.7] | Must Have |
| M03-E03: Stock Moves | Transfer, putaway, adjustment, audit trail | Must Have |
| M03-E04: Batch & Expiry | Batch tracking, expiry tracking, shelf life calc, expiry warnings | Must Have |
| M03-E05: Scanner Workflows | Receive, Move, Putaway, Pick, Split, Merge — dedicated `/scanner/*` routes | Must Have |
| M03-E06: LP Reservations & FIFO/FEFO | Rezerwacja LP na WO/TO, sugestie FIFO/FEFO, override z audit | Must Have |
| M03-E07: Label Printing | ZPL dla LP i palet, print-on-receipt | Should Have |
| M03-E08: Warehouse Dashboard | KPI cards, alerts, recent activity, expiry alerts | Should Have |

### 4.2 Out of Scope — Phase 2

| Epik | Opis | Priorytet |
|------|------|-----------|
| M03-E09: ASN | Advanced Shipping Notice — pre-fill GRN, śledzenie dostaw | HIGH |
| M03-E10: Transfer Orders rozszerzone | TO header+lines [3.1], CW na TO [3.2], ship/receipt dates [3.8] | HIGH |
| M03-E11: Palety & GS1 SSCC | Palety CRUD, SSCC-18, add/remove LP, pallet move | HIGH |
| M03-E12: Catch Weight | Wsparcie CW na LP, GRN, TO, konsumpcja weight-based | HIGH |
| M03-E13: Put-away Rules | Uproszczone reguły lokalizacji [3.5] | MEDIUM |
| M03-E14: Load Concept | Grupowanie wielu dostaw w jeden load [3.6] | MEDIUM |
| M03-E15: Cycle Counts | Full/partial/cycle, variance detection, approval | MEDIUM |
| M03-E16: Advanced Inventory | Location capacity, zone management, aging report, inventory browser | MEDIUM |
| M03-E17: Scanner Offline | IndexedDB queue, sync on reconnect (max 100 transakcji) | MEDIUM |

### 4.3 Exclusions (Nigdy)

- **WMS automation** — auto-replenishment, slotting optimization, wave picking → Phase 3+
- **RF picking** — voice-directed, pick-to-light → Phase 3+
- **Cross-docking** — direct PO → SO bez putaway → Phase 3+
- **Kitting** — assembly LP z wielu LP → Phase 3+
- **On-premise** — wyłącznie SaaS

---

## 5. Constraints

### Techniczne
- **LP = atomowa jednostka** — brak luźnych ilości. Każda operacja działa na LP (ADR-001)
- **org_id + RLS** — na WSZYSTKICH tabelach Warehouse. Policy: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))` (ADR-003/013)
- **Service Layer** — logika w `lib/services/*-service.ts`, API routes nigdy bezpośrednio do DB (ADR-015/018)
- **Supabase PostgreSQL** — vendor lock-in mitigowalny (standard PG)
- **site_id** — przygotowanie na Multi-Site (M11), opcjonalny na wszystkich tabelach
- **LP archival** — partition `license_plates` by status przy 100K+ per warehouse. Active partition: available/reserved. Archive partition: consumed/shipped/blocked. Genealogy retained. Configurable retention period

### Biznesowe
- MVP: desktop + scanner receiving, LP management, stock moves, FIFO/FEFO
- Freemium: basic LP (auto-numbering, manual GRN); Premium: ASN, GS1, catch weight, advanced FIFO/FEFO
- Scanner: minimum Zebra TC21/TC26, Honeywell CT40/CT60

### Regulacyjne
- **Trasowalność** — forward/backward <30 s (FSMA 204, EU 178/2002) → `lp_genealogy`
- **Lot tracking** — batch_number + supplier_batch_number
- **Alergeny EU-14** — propagacja z produktu na LP (via product_id)
- **GS1** — GTIN-14 produkty, GS1-128 LP (lot/expiry), SSCC-18 palety (ADR-004)
- **Audit trail** — 100% modyfikacji LP logowane (old_data/new_data, user_id, timestamp)

---

## 6. Decisions

Kluczowe decyzje architektoniczne obowiązujące w module Warehouse:

### D1. License Plate Inventory (ADR-001)
LP = atomowa jednostka inwentarza. Lifecycle: `available → reserved → consumed/shipped/merged/blocked`. `lp_genealogy` zapewnia pełną trasowalność split/merge/consume/output. Brak „luźnych ilości" — każda operacja GRN, move, pick, consume, output tworzy lub modyfikuje LP.

### D2. GS1 Barcode Compliance (ADR-004)
- **GTIN-14** — identyfikacja produktów (14 cyfr, check digit)
- **GS1-128** — LP barcodes z Application Identifiers: AI(01) GTIN, AI(10) Lot, AI(17) Expiry, AI(11) Production Date, AI(37) Quantity
- **SSCC-18** — palety/kontenery (18 cyfr, extension + company prefix + serial + check)
- Parsing: dedykowany `barcode-parser-service.ts`, auto-detection GS1 vs internal

### D3. FIFO/FEFO Picking Strategy (ADR-005)
- **FEFO domyślnie** — `ORDER BY expiry_date ASC NULLS LAST, created_at ASC`
- **FIFO fallback** — dla produktów bez expiry: `ORDER BY created_at ASC`
- **Override** — dozwolony z audit trail (`pick_overrides` table)
- **Blocking** — expired LP wykluczony z sugestii; configurable hard block
- **NULL handling** — brak expiry = traktuj jako „nigdy nie wygasa" (NULLS LAST)

### D4. QA Status Gating (Synchronizacja z M08 Quality)
LP z `qa_status NOT IN ('PASSED', 'RELEASED', 'COND_APPROVED')` nie może być skonsumowany ani wydany. Status flow: `PENDING → PASSED/FAILED/HOLD`. `HOLD → PASSED/FAILED/RELEASED/COND_APPROVED` (wynik badań po wstrzymaniu). `FAILED → QUARANTINED` (auto-izolacja na LP fail). `QUARANTINED → HOLD/RELEASED/FAILED` (wynik przeglądu).

**Reguły gating dla inventory operations**:
- `PASSED` = dozwolony pick/consume/ship ✅
- `RELEASED` = dozwolony pick/consume/ship ✅ (post-hold approval)
- `COND_APPROVED` = ograniczony pick/consume, NO ship ⚠️ (wymaga business rules per org)
- `PENDING`, `HOLD`, `QUARANTINED`, `FAILED` = blokada pick/consume/ship ❌

Przy QA fail system **sugeruje** quarantine location, ale **NIE przenosi automatycznie** — LP zostaje w bieżącej lokalizacji fizycznej. Operator musi jawnie przenieść (stock_move).

### D5. Stock Status Dimension [3.4]
Pięć statusów wymiarowych inwentarza: **Available**, **QC Hold**, **Quarantined**, **Blocked**, **Expired**. Status = kombinacja `license_plates.status` + `license_plates.qa_status`. Mapping:
- **Available** = status='available' AND qa_status IN ('PASSED', 'RELEASED')
- **QC Hold** = qa_status IN ('PENDING', 'HOLD') — czeka na QA decision
- **Quarantined** = qa_status='QUARANTINED' — izolacja w oczekiwaniu na review
- **Blocked** = status='blocked' OR qa_status IN ('FAILED') — blokada pick/ship
- **Expired** = expiry_date < CURRENT_DATE → **auto-block** (daily cron/trigger zmienia status na 'blocked', alert na dashboard, wykluczenie z pick suggestions)

Nota: `COND_APPROVED` = Available z ograniczeniami (business rules per org)

### D6. GRN Validation [3.3]
Walidacja na przyjęciu:
- `received_qty` vs `ordered_qty` z PO line
- Tolerancja: `over_receipt_tolerance_pct` z warehouse_settings
- Hard block jeśli `allow_over_receipt = false`
- Soft block (z override) jeśli `received_qty > ordered_qty × (1 + tolerance/100)`
- Batch wymagany jeśli `require_batch_on_receipt = true`
- Expiry wymagany jeśli `require_expiry_on_receipt = true`
- Catch weight wymagany jeśli `product.is_catch_weight = true`

### D7. org_id / RLS (ADR-003, ADR-013)
`org_id UUID NOT NULL` na WSZYSTKICH tabelach Warehouse. RLS policy: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`. Single source z tabeli `users` (nie JWT). Zapytania przez service role z filtrowaniem org_id.

### D8. Scanner-First (ADR-006)
Dedykowane strony `/scanner/*`. Touch targets ≥48px. Scan-first input. Liniowy flow (krok po kroku). Audio/vibration feedback. Offline queue Phase 2 (IndexedDB, max 100 transakcji).

### D9. Quality Status Synchronization (M03 ↔ M08)
**7 QA statuses** (`PENDING`, `PASSED`, `FAILED`, `HOLD`, `RELEASED`, `QUARANTINED`, `COND_APPROVED`) — defined once in M08 Quality as PostgreSQL enum `quality_status_type`, used by M03 Warehouse LP (license_plates.qa_status).

**Ownership**: M08 Quality owns status definitions + transitions. M03 Warehouse applies gating rules (which statuses allow pick/consume/ship). Cross-module synchronization: `quality_status_history` table (entity_type='lp'|'batch'|'inspection') shared for audit trail. M08 will handle inspections → status changes; M03 will apply inventory gating + UI badges.

### D10. Transit Location
Transit location = **fizyczna lokalizacja** z `type='transit'` w tabeli `locations`. Widoczna w systemie, żeby było widać co gdzie jest w trakcie transferu. Nie jest lokalizacją wirtualną — LP w tranzycie mają przypisaną fizyczną lokalizację tranzytową.

### D11. LP Numbering Scope
LP numbering is **per warehouse** (nie per org). UNIQUE(org_id, warehouse_id, lp_number). Każdy magazyn ma własną sekwencję numerów LP, co umożliwia czytelne śledzenie LP w danym magazynie.

### D12. GRN Completion Flow
GRN completion = **zawsze manual complete**. Operator musi jawnie kliknąć „Complete" — brak auto-complete. Status flow: draft → (operator dodaje linie) → complete (explicit action) → LP tworzone dopiero przy complete. Zapobiega tworzeniu LP dla niezakończonych przyjęć.

### D13. Partial LP Reservation
Partial LP reservation = **tylko zarezerwowana ilość zablokowana**. Reszta LP (qty - reserved_qty) pozostaje dostępna dla innych rezerwacji i operacji. Pozwala na efektywne wykorzystanie LP bez blokowania całego LP przy częściowych rezerwacjach.

### D14. Catch Weight Merge
Catch weight na LP merge = **suma**. `catch_weight_kg` = suma catch_weight_kg wszystkich mergowanych LP. Zapewnia spójność danych wagowych przy łączeniu LP catch weight.

### D15. Expiry Auto-Block
Expired LP auto-block = **auto-block + alert + wykluczenie z pick**. Expired LP (expiry_date < CURRENT_DATE) automatycznie zmienia status na `blocked`. Pojawia się alert na dashboard. Wykluczony z pick suggestions. Wymaga daily cron job / DB trigger.

### D16. Multi-LP per GRN Line
Multi-LP per GRN line = **tak, operator może utworzyć wiele LP z jednej linii GRN**. Np. przyjęcie 100 kartonów = 10 LP po 10. UX: pole „ilość LP" lub „qty per LP" na formularzu GRN line. Każde LP ma pełne dane (batch, expiry, location).

### D17. Scanner Authentication
Scanner auth = **username + PIN**. Osobny mechanizm login dla skanerów — operator wpisuje username i PIN (nie email+password). Szybki login na hali. Session timeout configurable (`scanner_idle_timeout_sec`).

### D18. Quarantine Location Handling
Quarantine location = **auto-sugestia, nie auto-move**. Przy QA fail system sugeruje quarantine location, ale NIE przenosi automatycznie. LP zostaje w bieżącej lokalizacji — musimy zawsze wiedzieć gdzie co stoi. Operator decyduje o przeniesieniu (stock_move).

### D19. Inventory Value on Dashboard
Inventory value na dashboard = **tak**. Warehouse dashboard pokazuje inventory value (GBP). Wymaga cost na produkcie. Kalkulacja: SUM(LP.qty × product.cost) per warehouse. Wyświetlane jako KPI card z możliwością drill-down per warehouse.

### D20. Under-Receipt / PO Force Close
Under-receipt / PO force close = **tak, PO line może być zamknięta ręcznie**. Popup z polem „reason" (dlaczego zamykamy z partial receipt). Status PO line: partial → force_closed. Audit log z reason. Zabezpiecza przed wiszącymi liniami PO.

### D21. Dual UoM (Qty + Weight)
Dual UoM = **tak**. LP ma primary UoM (np. BOX) i secondary (np. KG) z conversion factor. Palety: operator podaje np. 120 BOX, system konwertuje → label: „120 BOX / 184 KG". Conversion na produkcie: `conversion_factor_kg` (kg per unit). Dotyczy wszystkich operacji: GRN, move, pick, label.

### D22. LP Archival Strategy
LP archival = **partition/archival przy 100K+ per warehouse**. Consumed/shipped LP archiwizowane po X miesięcy (configurable retention period). Partition `license_plates` by status: active partition (available/reserved), archive partition (consumed/shipped/blocked). Genealogy retained — trasowalność zachowana po archiwizacji.

### D23. Concurrent Scanner Locking
Concurrent scanner locking = **optimistic locking z user feedback**. Jeśli operator A zeskanuje LP i nie dokończy operacji, operator B dostaje popup: „LP {lp_number} jest aktualnie w użyciu przez {username} na {lokalizacja}". Kolumna `locked_by UUID` + `locked_at TIMESTAMPTZ` na LP. Auto-release po timeout (5 min).

---

## 7. Module Map

```
Warehouse (M03)
├── LP Core (M03-E01)
│   ├── license_plates table
│   ├── lp_genealogy table
│   ├── lp_reservations table
│   └── LP lifecycle + status management
├── Receiving (M03-E02)
│   ├── grns + grn_items tables
│   ├── asns + asn_items tables (Phase 2)
│   └── GRN from PO / TO / ASN
├── Stock Moves (M03-E03)
│   ├── stock_moves table
│   └── Transfer, putaway, adjustment, return, quarantine
├── Batch & Expiry (M03-E04)
│   └── Batch tracking, expiry tracking, shelf life calc
├── Scanner (M03-E05)
│   ├── /scanner/receive
│   ├── /scanner/move
│   ├── /scanner/putaway
│   ├── /scanner/pick
│   ├── /scanner/split
│   ├── /scanner/merge
│   └── /scanner/pack (Phase 2)
├── FIFO/FEFO & Reservations (M03-E06)
│   ├── Pick suggestion algorithm
│   ├── shelf_life_rules table
│   └── pick_overrides table
├── Label Printing (M03-E07)
│   └── ZPL generation + printer integration
├── Dashboard (M03-E08)
│   └── KPIs, alerts, recent activity
├── Palety & GS1 SSCC (M03-E11, Phase 2)
│   ├── pallets + pallet_items tables
│   └── SSCC-18 generation
├── Cycle Counts (M03-E15, Phase 2)
│   ├── cycle_counts + cycle_count_items tables
│   └── Variance detection + approval
└── warehouse_settings table (config)
```

**Zależności upstream**: M01 (warehouses, locations), M02 (products), M04 (PO, TO, WO)
**Zależności downstream**: M06 (LP consumption/output), M08 (QA holds), M07 (picking/shipping), M15 (reporting)

---

## 8. Requirements

### M03-E01: LP Core (Phase 1 — Must Have)

#### Backend

**Tabela `license_plates`** — 25+ kolumn (id, org_id, lp_number, product_id, quantity, uom, location_id, warehouse_id, status, qa_status, batch_number, supplier_batch_number, expiry_date, manufacture_date, gtin, catch_weight_kg, po_number, grn_id, wo_id, parent_lp_id, consumed_by_wo_id, pallet_id, source, created_at, created_by, updated_at). **UNIQUE(org_id, warehouse_id, lp_number)** — numeracja per warehouse. RLS: org_id isolation.

**Tabela `lp_genealogy`** — parent_lp_id, child_lp_id, operation_type (split/merge/consume/output), quantity, operation_date, wo_id, is_reversed.

**Tabela `lp_reservations`** — lp_id, wo_id/to_id, reserved_qty, status (active/released/consumed).

**LP Lifecycle (status)**:
- `available` → `reserved` (rezerwacja na WO/TO)
- `available` → `blocked` (QA fail, manual block)
- `reserved` → `consumed` (produkcja)
- `available` → `consumed` (merge — LPs wchodzące)
- `available`/`reserved` → `shipped` (wysyłka)

**LP QA Status** (7 statusów — synchronizacja z M08 Quality):
- `PENDING` — oczekuje na kontrolę jakości
- `PASSED` — zatwierdzone (spełnia specyfikacje)
- `FAILED` — odrzucone (nie spełnia specyfikacji)
- `HOLD` — wstrzymane (wymagane badania)
- `RELEASED` — zwolnione po wstrzymaniu (zatwierdzone do użytku)
- `QUARANTINED` — kwarantanna (izolacja w oczekiwaniu na przegląd)
- `COND_APPROVED` — warunkowo zatwierdzone (ograniczone użycie)

**Przepływy statusów**:
- `PENDING` → `PASSED` (QA OK)
- `PENDING` → `FAILED` (QA NOK)
- `PENDING` → `HOLD` (wymagane dodatkowe badania)
- `PENDING`/`PASSED` → `QUARANTINED` (auto-blokada, izolacja)
- `FAILED` → `QUARANTINED` (przeniesienie do kwarantanny)
- `HOLD` → `PASSED`, `FAILED`, `RELEASED`, `COND_APPROVED` (wynik badań po wstrzymaniu)
- `QUARANTINED` → `HOLD`, `RELEASED`, `FAILED` (wynik przeglądu kwarantanny)
- `COND_APPROVED` → `PASSED`, `FAILED`, `HOLD` (walidacja warunków)
- **Auto-block expired**: Daily cron/trigger: `expiry_date < CURRENT_DATE` → `status='blocked'` automatycznie + alert na dashboard + wykluczenie z pick

**LP Numbering**: Auto-generate: `{lp_number_prefix}{zero-padded sequence}` — **sekwencja per warehouse** (nie per org). UNIQUE(org_id, warehouse_id, lp_number). Manual: walidacja unikalności per warehouse.

**Dual UoM**: LP ma primary UoM (np. BOX) + secondary weight (KG). Conversion via `product.conversion_factor_kg` (kg per unit). Przykład: LP = 120 BOX, conversion = 1.533 kg/box → 184 KG. Label: „120 BOX / 184 KG". Palety: operator podaje ilość w primary UoM, system konwertuje na weight.

**LP Locking**: Kolumny `locked_by UUID` + `locked_at TIMESTAMPTZ`. Operator skanuje LP → lock. Inny operator → popup „LP w użyciu przez {user}". Auto-release po 5 min timeout.

**API Endpoints**:
```
GET    /api/warehouse/license-plates              — lista z filtrami
GET    /api/warehouse/license-plates/:id           — detail
POST   /api/warehouse/license-plates               — create (zwykle via GRN)
PUT    /api/warehouse/license-plates/:id           — update (limited fields)
POST   /api/warehouse/license-plates/:id/split     — split LP
POST   /api/warehouse/license-plates/merge         — merge LPs
PUT    /api/warehouse/license-plates/:id/block     — block
PUT    /api/warehouse/license-plates/:id/unblock   — unblock
PUT    /api/warehouse/license-plates/:id/qa-status — zmiana QA status
GET    /api/warehouse/license-plates/:id/genealogy — drzewo genealogii
GET    /api/warehouse/license-plates/:id/history   — historia ruchów
POST   /api/warehouse/license-plates/:id/print-label — druk ZPL
```

**Serwisy**: `license-plate-service.ts` (CRUD, split, merge, block, unblock, qa-status-change), `quality-status-service.ts` (status transition validation, history tracking — shared z M08 Quality).

**Walidacje (Zod)**:
- Split: `split_qty > 0 AND split_qty < LP.qty`
- Merge: same product_id, uom, batch_number (or both null), expiry_date (or within 1 day), qa_status
- Block/unblock: rola Manager/Admin
- QA change: `PENDING→PASSED`, `PENDING→FAILED`, `PENDING→HOLD`, `PENDING/PASSED→QUARANTINED`, `FAILED→QUARANTINED`, `HOLD→PASSED/FAILED/RELEASED/COND_APPROVED`, `QUARANTINED→HOLD/RELEASED/FAILED`, `COND_APPROVED→PASSED/FAILED/HOLD`. Rola: QA Manager wymagany dla transitions requiring approval. Reason wymagany dla każdej zmiany statusu (enum reason_code + reason_text)

**WH-FR-001 (LP Creation)**: Auto/manual numbering. Status=available, qa_status z default_qa_status. <200ms.
**WH-FR-002 (LP Tracking)**: Qty, location, status, QA, batch, expiry. Audit trail na każdą zmianę. <100ms detail, <500ms lista.
**WH-FR-006 (LP Split)**: Nowy LP dziedziczy product_id, uom, batch, expiry, qa_status. Genealogy record (split). <300ms.
**WH-FR-007 (LP Merge)**: Primary LP += suma qty. Merged LPs → status=consumed. Genealogy records (merge). Walidacja: same product, batch, expiry, qa_status, location.
**WH-FR-008 (QA Status)**: Gating: qa_status NOT IN (PASSED, RELEASED, COND_APPROVED) → blokada konsumpcji/pick/ship. Quarantine: przy QA fail system **sugeruje** quarantine location, ale **NIE przenosi automatycznie** — LP zostaje w bieżącej lokalizacji, operator decyduje o przeniesieniu. Musimy zawsze wiedzieć gdzie co fizycznie stoi. Status transitions recorded w quality_status_history (entity_type='lp', entity_id=lp_id, from_status, to_status, reason, changed_by, changed_at).
**WH-FR-028 (Genealogy Tree)**: Hierarchical tree structure. Recursive CTE z depth limit 10. <500ms dla complex history.

#### Frontend/UX

- **LP List page** (`/warehouse/license-plates`): DataTable z filtrami (warehouse, location, product, status, qa_status, expiry range). Paginacja 50/page. Sortowanie. Quick actions: split, merge, block, print.
- **LP Detail page** (`/warehouse/license-plates/[id]`): Tabs: Details, Movement History, Genealogy Tree. QA status badge. Expiry warning indicator (yellow <30d, red expired).
- **LP Split Modal**: Source LP info → split qty input → destination location (optional) → confirm → print label.
- **LP Merge Modal**: Scan primary LP → scan additional LPs (walidacja) → running total → confirm.
- **LP Genealogy Tree**: Visual tree z LP nodes, operation types, quantities, dates. Expand/collapse.
- **QA Status Change Modal**: Current status → new status dropdown → reason → confirm.

#### Dependencies
- M01 Settings: warehouses, locations
- M02 Technical: products (product_id, gtin, is_catch_weight, shelf_life_days)

---

### M03-E02: Receiving (Phase 1 — Must Have)

#### Backend

**Tabela `grns`** — grn_number (auto: GRN-YYYY-NNNNN), source_type (po/to/return), po_id, to_id, asn_id, supplier_id, receipt_date, warehouse_id, location_id, status (draft/completed/cancelled). **Zawsze manual complete** — operator musi jawnie kliknąć „Complete" (brak auto-complete). LP tworzone dopiero przy complete.

**Tabela `grn_items`** — grn_id, product_id, po_line_id, to_line_id, ordered_qty, received_qty, uom, lp_id (created LP), batch_number, supplier_batch_number, gtin, catch_weight_kg, expiry_date, manufacture_date, location_id, qa_status.

**[3.3] GRN Validation Rules**:
- Over-receipt: `allow_over_receipt` + `over_receipt_tolerance_pct`
- Qty matching: `received_qty` vs `po_lines.ordered_qty - po_lines.received_qty`
- UoM matching: `grn_item.uom == source.uom`
- Required fields: batch (if `require_batch_on_receipt`), expiry (if `require_expiry_on_receipt`), catch weight (if `product.is_catch_weight`)
- Tolerancja: `(received_total / ordered_qty - 1) × 100 ≤ over_receipt_tolerance_pct`

**[3.4] Stock Status Dimension**: Implementacja jako computed view/function na bazie `status` + `qa_status` + `expiry_date`.

**[3.7] GS1-128 Scanning na GRN**: Parser GS1 barcode → auto-fill: product (via GTIN), batch (AI 10), expiry (AI 17), production date (AI 11). Service: `barcode-parser-service.ts`.

**API Endpoints**:
```
GET    /api/warehouse/grns                    — lista
GET    /api/warehouse/grns/:id                — detail
POST   /api/warehouse/grns                    — create GRN + LPs
PUT    /api/warehouse/grns/:id                — update (draft only)
POST   /api/warehouse/grns/:id/complete       — complete → creates LPs
POST   /api/warehouse/grns/:id/cancel         — cancel
POST   /api/warehouse/scanner/parse-gs1       — parse GS1 barcode
```

**Serwisy**: `grn-service.ts` (create, complete, cancel, LP creation per line). `barcode-parser-service.ts` (GS1 parsing).

**WH-FR-003 (GRN from PO)**: PO status approved/partial → display lines → receive → create GRN + LPs → update po_lines.received_qty → update PO status. <500ms. **Multi-LP per line**: operator może utworzyć wiele LP z jednej linii (np. 100 kartonów = 10 LP × 10). UX: pole „ilość LP" lub „qty per LP".
**WH-FR-004 (GRN from TO)**: TO status shipped/partial → receive at destination → create GRN + LPs → transit LP → destination location → update to_lines.received_qty → update TO status. **Transit location = fizyczna lokalizacja** z `type='transit'` w tabeli locations — widoczna w systemie.
**WH-FR-029 (Over-Receipt Control)**: Block/allow z tolerance. Audit log per over-receipt. Manager override option.
**Under-receipt / PO force close**: PO line z partial receipt może być zamknięta ręcznie. Popup z polem „reason" (dlaczego zamykamy). Status: partial → force_closed. Audit log z reason.
**WH-FR-009 (Batch Tracking)**: Internal + supplier batch. Required/optional per settings. Format validation (optional pattern).
**WH-FR-010 (Expiry Tracking)**: Manufacture date + expiry date. Auto-calc: expiry = manufacture + shelf_life_days. Warning indicator.

#### Frontend/UX

- **GRN List page** (`/warehouse/receiving`): DataTable z filtrami (status, source_type, date range). Quick create from PO/TO.
- **GRN from PO Modal**: Select PO → display lines (ordered, received, pending) → enter qty per line → batch/expiry → confirm → create LPs → print labels.
- **GRN from TO Modal**: Select TO → similar flow → transit location handling.
- **GS1 Scan Field**: Barcode input → auto-parse → auto-fill fields. Visual feedback (green = parsed OK, red = error).

#### Dependencies
- M04 Planning: purchase_orders, purchase_order_lines, transfer_orders, transfer_order_lines

---

### M03-E03: Stock Moves (Phase 1 — Must Have)

#### Backend

**Tabela `stock_moves`** — move_number (auto: SM-YYYY-NNNNN), lp_id, move_type (transfer/issue/receipt/adjustment/return/quarantine/putaway), from_location_id, to_location_id, quantity, move_date, status (completed/cancelled), reason, reason_code, wo_id, reference_type, reference_id.

**Move Types**:
- `transfer` — LP z lokalizacji A do B
- `putaway` — LP z strefy przyjęć do lokalizacji docelowej (guided)
- `issue` — LP wydany na produkcję/wysyłkę
- `receipt` — LP przyjęty (GRN)
- `adjustment` — korekta qty (cycle count, damage)
- `return` — LP zwrócony
- `quarantine` — LP przeniesiony do/z kwarantanny

**Walidacje**:
- LP.status = 'available' (lub 'reserved' dla issue)
- move_qty ≤ LP.qty (partial → trigger split)
- Destination location active
- Location capacity (if enabled) — warn/block

**API Endpoints**:
```
GET    /api/warehouse/stock-moves              — lista z filtrami
GET    /api/warehouse/stock-moves/:id          — detail
POST   /api/warehouse/stock-moves              — create movement
POST   /api/warehouse/stock-moves/:id/cancel   — cancel
POST   /api/warehouse/inventory/adjust         — create adjustment (z reason code)
```

**Serwisy**: `stock-move-service.ts` (create, cancel, validate).

**WH-FR-005 (Stock Moves)**: Full move (LP.location_id update) <300ms. Partial move → LP split + move. Walidacja: LP available, qty, location active, capacity.
**WH-FR-024 (Stock Adjustment)**: Reason codes: damage, theft, counting_error, quality_issue, expired, other. Manager approval if increase >10%. Qty=0 → LP consumed.

#### Frontend/UX

- **Movements List** (`/warehouse/movements`): DataTable z filtrami (type, date, LP, location).
- **Create Move Modal**: Scan/select LP → display info → select destination → enter qty (default full) → confirm.
- **Adjustment Form**: Select LP → new qty → reason code → notes → submit (manager approval if needed).

---

### M03-E04: Batch & Expiry (Phase 1 — Must Have)

Zintegrowane z M03-E01 (LP) i M03-E02 (Receiving). Osobne wymagania:

**WH-FR-022 (Shelf Life Calculation)**: `expiry_date = manufacture_date + product.shelf_life_days` (auto-calc jeśli expiry nie podano). Indicator „(calculated)".

**WH-FR-030 (Expiry Alerts)**: Dashboard widget „Expiring Soon" (expiry ≤ today + `expiry_warning_days`). Sorted by expiry ASC. Tiers: 7 days = red, 30 days = yellow. **Daily cron job**: (1) auto-block expired LP (status→blocked), (2) alert na dashboard, (3) notification do warehouse manager.

**API**: `GET /api/warehouse/inventory/expiring` — lista expiring LPs z days_remaining. <300ms.

---

### M03-E05: Scanner Workflows (Phase 1 — Must Have)

#### Backend

**Scanner Auth**: Login przez **username + PIN** (nie email+password). Szybki login na hali. Endpoint: `POST /api/warehouse/scanner/login` (username, pin) → session token. Session timeout configurable.

**LP Locking (concurrent access)**: Kolumny `locked_by UUID` + `locked_at TIMESTAMPTZ` na `license_plates`. Gdy operator A skanuje LP i rozpoczyna operację → LP locked. Operator B próbuje skanować ten sam LP → popup: „LP {lp_number} jest w użyciu przez {username} na {lokalizacja}". Auto-release po timeout (5 min).

Dedykowane endpointy scanner (uproszczone, szybkie):
```
POST   /api/warehouse/scanner/login              — login (username + PIN)
POST   /api/warehouse/scanner/receive            — quick receive (GRN + LP)
POST   /api/warehouse/scanner/move               — quick move
POST   /api/warehouse/scanner/putaway            — guided putaway
POST   /api/warehouse/scanner/pick               — guided pick (FIFO/FEFO)
POST   /api/warehouse/scanner/split              — quick split
POST   /api/warehouse/scanner/merge              — quick merge
GET    /api/warehouse/scanner/lookup/lp/:barcode  — LP lookup
GET    /api/warehouse/scanner/lookup/location/:barcode — location lookup
GET    /api/warehouse/scanner/suggest-putaway/:lpId — putaway suggestion
GET    /api/warehouse/scanner/pending-receipts    — pending POs/TOs
POST   /api/warehouse/scanner/validate-barcode    — validate any barcode
```

#### Frontend/UX

Wszystkie scanner pages w `/scanner/*`. Wymagania UX:
- Touch targets ≥48px
- Scan-first input (barcode field auto-focus)
- Liniowy flow krok po kroku
- Audio feedback (success tone / error beep)
- Vibration on mobile
- Large text, high contrast
- Session timeout: `scanner_idle_timeout_sec` (default 300s)

**WH-FR-011 (Scanner Receive)**: Scan PO/TO → select line → scan product (GTIN or internal) → enter qty/batch/expiry → validate → confirm → create GRN + LP → print label. <500ms per operation.

**WH-FR-012 (Scanner Move)**: Scan LP → display details → scan destination → enter qty (default full) → confirm → stock_move + LP update. <300ms.

**WH-FR-013 (Scanner Putaway)**: Scan LP → system suggests location (FIFO/FEFO zone, capacity, product zone) → scan suggested location → if match: green ✓; if different: yellow warning, allow override → confirm. <300ms.

**Scanner Pick (for TO/WO)**: Scan TO/WO → display pick list → system suggests LP (FIFO/FEFO) → navigate to location → scan LP → enter pick qty → confirm → reserve/issue. <500ms.

**Scanner Split**: Scan LP → enter split qty → select destination → confirm → new LP + genealogy + print label.

**Scanner Merge**: Scan primary LP → scan additional LPs (validate same product/batch/expiry/qa) → running total → confirm → merge.

**Scanner Workflows (szczegółowe flow charts)**:

1. **Receive**: Select Source → Select Line → Scan Product → Enter Details → GS1 Parse (if enabled) → Validate → Confirm & Print
2. **Move**: Scan LP → Scan Destination → Enter Qty → Confirm
3. **Putaway**: Scan LP → System Suggests → Scan Location → Confirm
4. **Pick**: Scan TO/WO → System Suggests LP → Navigate → Scan LP → Enter Qty → Confirm
5. **Split**: Scan LP → Enter Qty → Select Location → Confirm
6. **Merge**: Scan Primary → Scan Additional → Confirm

---

### M03-E06: LP Reservations & FIFO/FEFO (Phase 1 — Must Have)

#### Backend

**WH-FR-027 (LP Reservation)**: Tabela `lp_reservations`. LP z rezerwacją → status='reserved'. Rezerwacja na WO lub TO. **Partial reservation**: tylko zarezerwowana ilość zablokowana — reszta LP (qty - reserved_qty) pozostaje dostępna dla innych operacji. Release on cancel. Consume on production.

**WH-FR-019 (FIFO)**: `ORDER BY created_at ASC`. Warning on violation. Override z audit log. `fifo_violation_count` metric.

**WH-FR-020 (FEFO)**: `ORDER BY expiry_date ASC NULLS LAST, created_at ASC`. FEFO takes precedence over FIFO. Expired LP wykluczony. Override z audit log.

**Tabele dodatkowe**: `shelf_life_rules` (customer/product min shelf life), `pick_overrides` (audit log overrides).

**Pick Suggestion Query**:
```sql
SELECT lp.* FROM license_plates lp
WHERE lp.product_id = $1
  AND lp.warehouse_id = $2
  AND lp.status = 'available'
  AND lp.qa_status = 'passed'
  AND lp.quantity > 0
  AND (lp.expiry_date IS NULL OR lp.expiry_date > CURRENT_DATE)
ORDER BY
  CASE WHEN lp.expiry_date IS NULL THEN 1 ELSE 0 END,
  lp.expiry_date ASC,
  lp.created_at ASC
LIMIT 20;
```

**Serwisy**: `pick-suggestion-service.ts`, `lp-reservation-service.ts`.

#### Frontend/UX

- **LP Picker** (reusable component): Tabela z sugerowanymi LP, sorted FIFO/FEFO. Highlight suggested. Warning na override.
- **Reservation Panel** (w WO detail): Lista reserved LPs, status, qty.

---

### M03-E07: Label Printing (Phase 1 — Should Have)

#### Backend

**WH-FR-014 (Label Print)**: ZPL generation. LP label: barcode (Code 128), product name, qty, batch, expiry, location, QR code. Pallet label: SSCC-18 barcode, pallet number, LP count, weight, pack date.

**API**:
```
POST   /api/warehouse/license-plates/:id/print-label  — print LP label
POST   /api/warehouse/pallets/:id/print-label          — print pallet label (Phase 2)
```

**Label Templates**: ZPL 4×6 inch (LP), 4×6 inch (pallet). Configurable: label_copies_default, label size. Printer config: IP/hostname, port 9100 (ZPL over TCP).

**Print-on-receipt**: Jeśli `print_label_on_receipt = true`, auto-queue print job po GRN completion.

#### Frontend/UX

- **Print Modal**: Preview (rendered ZPL), copies selector, printer selector, print button.
- **Auto-print**: Transparent — po GRN confirm, label automatycznie w kolejce.

---

### M03-E08: Warehouse Dashboard (Phase 1 — Should Have)

#### Backend

**API**:
```
GET /api/warehouse/dashboard                  — KPIs
GET /api/warehouse/dashboard/alerts           — alerts (expiry, low stock)
GET /api/warehouse/dashboard/recent-activity  — recent movements
```

**KPI Cards**: Total LPs (by status), Total SKUs, Inventory Value (if cost available), Expiring Soon count, QC Hold count.

#### Frontend/UX

- **Dashboard page** (`/warehouse/dashboard`): 5 KPI cards + Expiring Alerts widget + Recent Activity feed + Warehouse Capacity (if enabled).
- Design: Zgodnie z DESIGN-GUIDELINES.md — Tidio-style KPI cards z % change badges, dense layout (16px padding, 12px gaps).

---

### M03-E09: ASN (Phase 2 — HIGH)

**WH-FR-015 (ASN Processing)**: Tabele `asns` + `asn_items`. ASN linked to PO. Pre-fill GRN z ASN data. Status: pending → partial → received → cancelled. Expected today widget.

---

### M03-E10: Transfer Orders rozszerzone (Phase 2 — HIGH)

**[3.1] TO header+lines model**: Transfer order z header (from_warehouse, to_warehouse, status, ship_date, receipt_date) + lines (product_id, qty, uom, shipped_qty, received_qty). State machine: draft → planned → partially_shipped → shipped → partially_received → received → closed (+ cancelled). ADR-019.

**[3.2] CW na TO lines**: `cw_transfer_qty NUMERIC(10,3)` na `transfer_order_lines`. Walidacja CW jeśli `product.is_catch_weight`.

**[3.8] Ship/receipt dates na transferach**: `ship_date DATE`, `expected_receipt_date DATE`, `actual_receipt_date DATE` na TO header. In-transit tracking.

---

### M03-E11: Palety & GS1 SSCC (Phase 2 — HIGH)

**WH-FR-016 (Pallet Management)**: Tabele `pallets` + `pallet_items`. Status: open → closed → shipped. SSCC-18 auto-generate (if GS1 enabled). Add/remove LP via scan. Pallet move = move all LPs. Weight = sum of LP weights (via dual UoM conversion). **Label**: operator podaje np. 120 BOX → system konwertuje → label: „120 BOX / 184 KG".

**WH-FR-017 (GS1 GTIN)**: Parse GTIN-14 on scan. Product lookup by GTIN. Combined barcode parsing (01)(10)(17)(21).

**WH-FR-018 (GS1 SSCC)**: Generate SSCC-18 (extension + company prefix + serial + check digit). Scan SSCC → pallet lookup. Print SSCC label.

---

### M03-E12: Catch Weight (Phase 2 — HIGH)

**WH-FR-021 (Catch Weight)**: `product.is_catch_weight = true` → prompt for `catch_weight_kg` na receipt. Walidacja: weight within `target_weight_kg ± weight_tolerance_pct`. Display: qty (units) + catch_weight_kg. Consumption: weight-based calc (pieces = needed_weight / avg_weight_per_piece). **Merge CW LP**: catch_weight_kg = suma catch_weight_kg wszystkich mergowanych LP.

---

### M03-E13: Put-away Rules (Phase 2 — MEDIUM)

**[3.5] Basic put-away rules**: Uproszczone „location directives". Tabela `putaway_rules` (org_id, product_id/product_category, zone_id, priority). Algorytm: (1) product zone → (2) category zone → (3) default zone → (4) any available. Capacity check.

---

### M03-E14: Load Concept (Phase 2 — MEDIUM)

**[3.6] Load**: Tabela `loads` (org_id, load_number, status, vehicle, arrival_date). Grupowanie wielu PO/ASN w jeden load. GRN linkowany do load_id. Dashboard: „Today's Loads".

---

### M03-E15: Cycle Counts (Phase 2 — MEDIUM)

**WH-FR-023 (Cycle Count)**: Tabele `cycle_counts` + `cycle_count_items`. Types: full, partial, cycle (ABC). Status: planned → in_progress → completed → cancelled. Variance = counted - expected. Manager approval. Auto-create stock_moves for variances.

**WH-FR-025 (Location Capacity)**: `location.max_capacity`. Current occupancy = sum LP qty. 90% = yellow, 100% = red + block. <200ms query.

**WH-FR-026 (Zone Management)**: Zone types: receiving, storage, shipping, quarantine. Product preferred_zone_id. Zone-based reporting.

---

### M03-E16: Advanced Inventory (Phase 2 — MEDIUM)

- **Inventory Browser**: Advanced filters (product, location, warehouse, status, batch, expiry range). Grouping (by product, location, warehouse).
- **Aging Report**: FIFO/FEFO aging analysis. Days in stock.
- **Expiry Report**: Detailed expiring/expired LP list.

---

### Warehouse Settings

**Tabela `warehouse_settings`** — org_id (UNIQUE). Toggles:

| Setting | Default | Opis |
|---------|---------|------|
| auto_generate_lp_number | true | Auto-numbering LP |
| lp_number_prefix | 'LP' | Prefix LP |
| lp_number_sequence_length | 8 | Długość sekwencji |
| enable_asn | false | ASN (Phase 2) |
| require_qa_on_receipt | true | QA gating na przyjęciu |
| default_qa_status | 'pending' | Domyślny QA |
| allow_over_receipt | false | Over-receipt |
| over_receipt_tolerance_pct | 0 | Tolerancja % |
| enable_batch_tracking | true | Batch tracking |
| require_batch_on_receipt | false | Wymóg batch |
| enable_supplier_batch | true | Supplier batch |
| enable_expiry_tracking | true | Expiry tracking |
| require_expiry_on_receipt | false | Wymóg expiry |
| expiry_warning_days | 30 | Próg alertu expiry |
| enable_location_zones | false | Zone management |
| enable_location_capacity | false | Capacity tracking |
| enable_transit_location | true | Transit location |
| enable_fifo | true | FIFO |
| enable_fefo | false | FEFO |
| enable_pallets | false | Palety |
| enable_split_merge | true | Split/merge LP |
| enable_gs1_barcodes | false | GS1 barcodes |
| enable_catch_weight | false | Catch weight |
| scanner_idle_timeout_sec | 300 | Timeout skanera |
| scanner_sound_feedback | true | Audio feedback |
| print_label_on_receipt | true | Auto-print po GRN |
| label_copies_default | 1 | Kopie etykiet |

---

## 9. KPIs

### Warehouse Operations
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Dokładność stanów | ≥99% | Cycle count variance % |
| Czas przyjęcia GRN (scan-to-LP) | <30 s | APM timer |
| Czas operacji skanera (avg) | <30 s | APM timer |
| Zgodność FIFO/FEFO | ≥95% picks | 1 - (override_count / total_picks) |
| FIFO/FEFO override rate | <5% | pick_overrides / total_picks |
| LP per magazyn | monitoring | COUNT(license_plates) |
| GRN per dzień | monitoring | COUNT(grns) per day |
| Stock moves per dzień | monitoring | COUNT(stock_moves) per day |

### Inventory Health
| KPI | Cel | Pomiar |
|-----|-----|--------|
| Expiring soon (≤30d) | monitoring | COUNT(LP where expiry ≤ today+30) |
| Expired LP count | 0 (target) | COUNT(LP where expiry < today AND status=available) |
| QC Hold count | monitoring | COUNT(LP where qa_status IN (pending, failed)) |
| QC Hold duration (avg) | <48h | AVG(time from pending to passed/failed) |

### System Performance
| KPI | Cel | Pomiar |
|-----|-----|--------|
| LP lookup | <200 ms | API P95 |
| FIFO/FEFO suggestion | <500 ms | API P95 |
| Page load | <2 s | FE P95 |
| Scanner scan-to-confirm | <1 s | APM |
| Inventory summary query | <3 s (100K LP) | API P95 |
| GS1 barcode parsing | <100 ms | API P95 |
| Label print success rate | >99% | Print queue success rate |

---

## 10. Risks

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Złożoność LP split/merge (genealogy integrity) | Średnie | Wysoki | Stored procedures / transakcje DB, testy na 10+ levels |
| Błędy GS1 parsing (różne formaty FNC1/parentheses) | Średnie | Średni | Dedykowany parser z test suite, fallback do manual input |
| Błędne FEFO sugestie (NULL expiry, edge cases) | Średnie | Wysoki | NULLS LAST, expired exclusion, comprehensive tests |
| Problemy z drukiem ZPL (kompatybilność drukarek) | Średnie | Średni | ZPL library, test 3+ modeli Zebra, preview przed drukiem |
| Niska adopcja skanerów (UX friction) | Średnie | Wysoki | Scanner-first design, 48px targets, audio feedback, user testing |
| Over-receipt bez kontroli | Niskie | Wysoki | Hard block domyślnie, tolerance configurable, audit log |
| RLS luka na tabelach Warehouse | Niskie | Krytyczny | Automatyczne testy org_id isolation, audyt bezpieczeństwa |
| Wydajność przy 100K+ LP | Niskie | Średni | Indeksy composite, paginacja, cache (Redis 1min TTL) |
| Catch weight — cross-cutting complexity | Wysokie | Średni | Opt-in per org, is_catch_weight per product, shared util |
| Scanner offline data loss | Średnie | Średni | IndexedDB queue (Phase 2), max 100 transactions, sync indicator |
| Multi-site schema propagation (site_id) | Średnie | Średni | site_id opcjonalny, backward-compatible, feature flag |

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] LP CRUD działa end-to-end (create, split, merge, block, unblock)
- [ ] GRN z PO tworzy LP z prawidłowym statusem i QA (initial qa_status='PENDING')
- [ ] GRN z TO tworzy LP i aktualizuje TO status
- [ ] GRN validation (qty vs PO, over-receipt control) działa [3.3]
- [ ] Stock status dimension (Available/QC Hold/Quarantined/Blocked/Expired) [3.4]
- [ ] QA Status: 7 statusów (PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED) z prawidłowymi przepływami
- [ ] QA Status gating: PENDING/HOLD/QUARANTINED/FAILED = blokada pick/consume/ship; PASSED/RELEASED = ok; COND_APPROVED = ograniczenia per org
- [ ] GS1-128 scanning na GRN auto-fills pola [3.7]
- [ ] Stock moves (full/partial) z audit trail
- [ ] FIFO/FEFO pick suggestions działają poprawnie
- [ ] LP reservation na WO/TO
- [ ] LP genealogy (split/merge/consume) zachowuje spójność
- [ ] Batch + expiry tracking z walidacją
- [ ] Scanner workflows: receive, move, putaway, pick, split, merge
- [ ] Label printing ZPL → Zebra działa
- [ ] Warehouse dashboard z KPIs i expiry alerts
- [ ] Traceability LP <30 s end-to-end

### Niefunkcjonalne
- [ ] LP lookup <200 ms
- [ ] Scanner operation <30 s
- [ ] Page load P95 <2 s
- [ ] FIFO/FEFO suggestion <500 ms
- [ ] RLS 100% — brak cross-org data leaks
- [ ] Audit trail 100% — każda zmiana LP zalogowana
- [ ] UX skanera zwalidowany z 3+ użytkownikami
- [ ] 20 concurrent scanner users per org
- [ ] 100K LP per warehouse (scalability test)

### Biznesowe
- [ ] Operator magazynu wykonuje przyjęcie (GRN) w <2 min (scan to done)
- [ ] Onboarding warehouse w <3 dni (settings → first GRN → first move)
- [ ] FIFO/FEFO override <5%

---

## 12. References

### Dokumenty źródłowe
- Foundation PRD → `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Warehouse PRD (legacy) → `new-doc/03-warehouse/prd/warehouse.md`
- Warehouse Architecture → `new-doc/03-warehouse/decisions/warehouse-arch.md`
- Warehouse Analysis → `new-doc/03-warehouse/ANALYSIS.md`
- **Quality Status Types (M08.06.1)** → `new-doc/08-quality/stories/06.1.quality-status-types.md` — 7 QA statuses with transition rules
- PRD Update List (77 items) → `new-doc/_meta/PRD-UPDATE-LIST.md`
- Design Guidelines → `new-doc/_meta/DESIGN-GUIDELINES.md`
- D365 Analysis → `new-doc/_meta/D365-ANALYSIS.md`

### ADR (Warehouse)
- ADR-001: License Plate Inventory → `new-doc/03-warehouse/decisions/ADR-001-license-plate-inventory.md`
- ADR-004: GS1 Barcode Compliance → `new-doc/03-warehouse/decisions/ADR-004-gs1-barcode-compliance.md`
- ADR-005: FIFO/FEFO Picking Strategy → `new-doc/03-warehouse/decisions/ADR-005-fifo-fefo-picking-strategy.md`

### ADR (Foundation — obowiązujące w Warehouse)
- ADR-003: Multi-Tenancy RLS
- ADR-006: Scanner-First
- ADR-008: Audit Trail
- ADR-013: RLS Pattern
- ADR-015: Service Layer
- ADR-018: API Errors
- ADR-019: TO State Machine

### Guides
- `new-doc/03-warehouse/guides/fifo-fefo-picking.md`
- `new-doc/03-warehouse/guides/lp-genealogy-service.md`
- `new-doc/03-warehouse/guides/scanner-move-workflow.md`
- `new-doc/03-warehouse/guides/scanner-putaway-workflow.md`

### PRD-UPDATE-LIST items (Warehouse 3.1–3.8)
| # | Item | Phase | Priority | Status w PRD |
|---|------|-------|----------|-------------|
| 3.1 | TO header+lines, multi-status | Phase 2 (M03-E10) | HIGH | ✅ Uwzględniony |
| 3.2 | CW na TO lines | Phase 2 (M03-E10) | HIGH | ✅ Uwzględniony |
| 3.3 | GRN validation (qty vs PO, tolerance) | Phase 1 (M03-E02) | HIGH | ✅ Uwzględniony |
| 3.4 | Stock status dimension | Phase 1 (M03-E02) | HIGH | ✅ Uwzględniony |
| 3.5 | Put-away rules | Phase 2 (M03-E13) | MEDIUM | ✅ Uwzględniony |
| 3.6 | Load concept | Phase 2 (M03-E14) | MEDIUM | ✅ Uwzględniony |
| 3.7 | GS1-128 scanning na GRN | Phase 1 (M03-E02) | HIGH | ✅ Uwzględniony |
| 3.8 | Ship/receipt dates na transferach | Phase 2 (M03-E10) | MEDIUM | ✅ Uwzględniony |

### Database Tables (12)
`license_plates`, `lp_genealogy`, `lp_reservations`, `grns`, `grn_items`, `stock_moves`, `asns`, `asn_items`, `pallets`, `pallet_items`, `cycle_counts`, `cycle_count_items`, `warehouse_settings` + Phase 2: `shelf_life_rules`, `pick_overrides`, `putaway_rules`, `loads`

### API Endpoints (50+)
Pełna lista w sekcji Requirements per epik.

---

_PRD 03-Warehouse v2.1 — 17 epików (8 Phase 1 + 9 Phase 2), 30 FR, 12+ tabel DB, 50+ API endpoints. Wszystkie pozycje 3.1–3.8 z PRD-UPDATE-LIST uwzględnione. QA Status synchronized z M08 Quality (7 statusów + transition rules). 23 decyzji architektonicznych (D1–D23, v2.1: +D9 Quality Status Sync, +D10–D23 z doprecyzowań 2026-02-16)._
_Data: 2026-02-18_
