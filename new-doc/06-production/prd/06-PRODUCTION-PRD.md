# PRD 06-Production — MonoPilot MES
**Wersja**: 3.0 | **Data**: 2026-02-17 | **Status**: Draft

---

## 1. Executive Summary

Production (M06) to moduł wykonawczy MonoPilot odpowiedzialny za realizację zleceń produkcyjnych (Work Orders) od startu do zakończenia. Obejmuje zużycie materiałów (LP-based), rejestrację outputu (głównego + by-products), śledzenie operacji i yield, zarządzanie rezerwacjami materiałów, kontrolę nadmiernego zużycia, tracking waste i downtime, oraz dashboard produkcji z KPI.

**Kluczowe decyzje architektoniczne**:
- Każde zużycie materiału operuje na atomowych License Plates (ADR-001). Brak „luźnych ilości".
- WO pracuje na kopii BOM (ADR-002 — BOM Snapshot), nie na żywym BOM.
- Genealogia LP (consumed → output) zapewnia pełną trasowalność (FSMA 204, EU 178/2002).
- Scanner-first UX (ADR-006) — operatorzy hali wykonują consume/output przez skaner; desktop jako alternative.

**Model budowy**: M06 zależy od M02 Technical (produkty, BOM, routing), M04 Planning (WO creation, BOM snapshot), M03 Warehouse (LP, lokalizacje). Scanner workflows (consume, output) są częścią M05 Scanner, ale korzystają ze wspólnych serwisów M06.

**Podział na fazy**: 6 epików Phase 1 (MVP), 4 epiki Phase 2. Backend-first — dla każdego epiku najpierw model danych, API i walidacje, potem frontend/UX.

---

## 2. Objectives

### Cel główny
Umożliwić kierownikom i operatorom produkcji pełne zarządzanie cyklem życia WO: start → zużycie materiałów (LP-level) → rejestracja outputu (+ by-products) → zakończenie — z pełną trasowalnością, kontrolą yield i audytem każdej operacji.

### Cele drugorzędne
1. **Trasowalność end-to-end** — genealogia LP: consumed LPs → output LP, forward/backward < 30 s
2. **Kontrola odpadów** — waste categories (fat, floor, giveaway), weight-based yield, target vs actual
3. **OEE monitoring** — Availability × Performance × Quality, downtime analysis (People/Process/Plant)
4. **Scanner-first** — operatorzy hali wykonują consume/output przez skaner (M05), desktop jako alternative

### Metryki sukcesu (moduł)

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Yield % (weight-based) | ≥ 95% (target per product) | WO output vs consumed |
| WO completion on time | > 85% | Scheduled vs actual end |
| Over-consumption rate | < 5% WO | Approval logs |
| Downtime minutes / shift | < 30 min (unplanned) | Downtime records |
| OEE % | ≥ 85% (target) | A × P × Q |
| Scanner adoption (consume) | > 70% vs desktop | Usage analytics |
| Waste % | < 3% (target) | Waste records |

---

## 3. Personas

### Persony główne (Production)

**1. Operator produkcji** — zużywa materiały (scan LP), rejestruje output (scan WO → qty), raportuje downtime. Skaner lub tablet na stanowisku. Kryterium: consume + output < 45 s.

**2. Kierownik produkcji** — nadzoruje WO, monitoruje yield/OEE, zatwierdza over-consumption, zarządza zmianami. Dashboard real-time. Kryterium: pełen obraz produkcji w < 5 s.

**3. Lider zmiany** — startuje/pauzuje/kończy WO, raportuje downtime i waste, monitoruje efektywność godzinową. Tablet na hali.

### Persony drugorzędne

| Rola | Główne interakcje z M06 |
|------|-------------------------|
| Planista | Widzi status WO (read-only), planuje WO w M04 |
| Inspektor QA | Ustawia QA status na output LP, tworzy NCR z produkcji |
| Administrator | Konfiguracja production_settings, downtime reasons, shifty |
| Dyrektor zakładu | Dashboard KPI, raporty yield/OEE (read-only) |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Epik | Opis |
|------|------|
| M06-E1: WO Execution Core | Start/pause/resume/complete WO, state machine (ADR-007), operations tracking |
| M06-E2: Material Consumption & Reservations | LP-based consumption, 1:1 enforcement, reversal, over-consumption control, reservations |
| M06-E3: Output & By-Products | Output registration (LP creation + genealogy), by-products, multiple outputs, auto-complete |
| M06-E4: Dashboard & Settings | Production dashboard (KPI, active WOs, alerts), org-level settings (15+ flags) |
| M06-E5: Waste & Basic Yield | [5.1] Waste categories, [5.2] weight-based yield, [5.6] LP-level consumption tracking |
| M06-E6: Downtime & Shifts | [5.12] Downtime tracking (People/Process/Plant + min), [5.13] Shift AM/PM |

### 4.2 Out of Scope — Phase 2

| Epik | Uzasadnienie |
|------|-------------|
| M06-E7: Advanced Yield & Quality | [5.3] meat_yield_pct, [5.4] target_yield per product, [5.15] QC holds z produkcji |
| M06-E8: Co-Products & Routes | [5.7] Co-product output, [5.8] route per product-line, [5.9] route versioning |
| M06-E9: OEE | Real-time OEE (A×P×Q), OEE dashboard, trend analysis, machine integration |
| M06-E10: Advanced Analytics | [5.5] rework_batch, [5.10] consumption by item_group, [5.11] CW qty, [5.14] hourly efficiency |

### 4.3 Exclusions (Nigdy w M06)

- **MRP / planowanie** — to M04 Planning
- **BOM editing** — to M02 Technical; M06 operuje na BOM Snapshot
- **LP CRUD / stock moves** — to M03 Warehouse
- **Scanner UI** — to M05 Scanner; M06 dostarcza serwisy i API
- **Pełne OEE z integracją maszyn (PLC/IoT)** — Phase 3+
- **Kalkulacja kosztów produkcji** — to M10 Finance

---

## 5. Constraints

### Techniczne
- **LP-based consumption** — obowiązkowe; brak „luźnych ilości" (ADR-001)
- **BOM Snapshot** — WO operuje na kopii BOM z momentu tworzenia WO (ADR-002); BOM immutable po starcie WO
- **RLS** — `org_id` na każdej tabeli produkcyjnej; izolacja multi-tenant (ADR-013)
- **Supabase** — DB triggers dla auto-complete WO, genealogy integrity
- **Redis cache** — dashboard: 30s TTL, OEE: 5min TTL
- **Performance** — scanner APIs < 500ms, dashboard < 2s, consumption POST < 2s
- **Decimal precision** — `DECIMAL(15,6)` na wszystkich polach ilościowych

### Biznesowe
- **Shared services** — scanner i desktop używają tych samych serwisów (`lib/services/wo-*`)
- **Inkrementalna budowa** — M06-E6 (downtime/shifts) może być budowany równolegle z E1-E4
- **Settings-driven** — kluczowe zachowania (pause, auto-complete, over-consumption, reservations, QA on output) konfigurowane per org
- **Backend-first** — dla każdego epiku najpierw DB + API + walidacje, potem frontend/UX

### Regulacyjne
- **Trasowalność** — genealogia LP forward/backward < 30 s (FSMA 204, EU 178/2002)
- **Audit trail** — każda consumption, reversal, over-consumption approval logowana z user, timestamp, reason
- **Lot tracking** — batch_number na każdym output LP, dziedziczony z WO lub auto-generowany

---

## 6. Decisions

### D1. BOM Snapshot (ADR-002) — OBOWIĄZKOWE

WO kopiuje BOM (materiały → `wo_materials`, routing → `wo_operations`) przy tworzeniu. Skalowanie: `required_qty = bom_item.qty × (planned_qty / bom.output_qty)`. WO jest self-contained — zmiany w BOM po starcie WO nie wpływają na WO. Re-copy dozwolone TYLKO przed startem.

### D2. LP Inventory (ADR-001) — OBOWIĄZKOWE

Każde zużycie materiału operuje na atomowym LP. LP lifecycle: AVAILABLE → RESERVED → CONSUMED (lub partial: qty decremented). Genealogia: consumed LP (parent) → output LP (child) w tabeli `lp_genealogy`. Nie ma „luźnych ilości".

### D3. Scanner-First UX (ADR-006) — OBOWIĄZKOWE

Operatorzy hali wykonują consume/output przez skaner (M05). Desktop jako alternative. Scanner workflows korzystają ze wspólnych serwisów M06. Touch targets ≥ 48×48px, audio feedback (success/error), offline queue (Phase 2).

### D4. WO State Machine (ADR-007)

```
DRAFT → RELEASED → IN_PROGRESS → COMPLETED
                  ↕ ON_HOLD       → CANCELLED
```

Guards: RELEASED→IN_PROGRESS wymaga BOM snapshot; COMPLETED wymaga ≥1 output. Auto-complete: gdy `output_qty ≥ planned_qty` i `auto_complete_wo=true` (DB trigger).

### D5. Material Consumption Rules

| Reguła | Opis |
|--------|------|
| LP validation | Status AVAILABLE, product match, UoM match, qty sufficient, nie expired, nie QA Hold |
| 1:1 enforcement | Gdy `wo_materials.consume_whole_lp=true` → `consume_qty` MUSI = LP qty (±0.0001) |
| Over-consumption | Gdy `consumed + requested > required` i `allow_over_consumption=false` → blokada + approval flow |
| Reversal | Manager może cofnąć consumption z powodem; LP qty przywrócone, genealogia `is_reversed=true`, nigdy DELETE |
| FIFO/FEFO | Sugestie LP: FEFO (expiry_date ASC) lub FIFO (created_at ASC). Non-blocking — warning, nie blokada |

### D6. Reservations & Over-Consumption

- **Reservations**: Tworzone przy starcie WO (jeśli `enable_material_reservations=true`). FIFO/FEFO priority. LP status → RESERVED. Auto-release przy WO complete/cancel.
- **Over-consumption**: Approval flow (pending → approved/rejected). Variance % = `((consumed - required) / required) × 100`. Thresholds: 0% green, 1-10% amber, >10% red.

### D7. Output & Genealogy

- Output rejestracja tworzy nowy LP (`source='production'`), `expiry_date = today + shelf_life_days`
- Genealogia: wszystkie consumed LPs → parent; output LP → child. By-products dzielą tych samych parentów.
- `is_over_production=true` gdy output > planned (operator wybiera parent LP ręcznie)
- By-product batch: `{main_batch}-BP-{product_code}`

### D8. Waste Categories (z [5.1])

Customizable per org. Domyślne: fat, floor, giveaway, rework, other. Każdy output rejestruje opcjonalnie `waste_qty + waste_category_id`. Waste NIE jest wliczane do output_qty.

### D9. Weight-Based Yield (z [5.2])

Oprócz qty-based yield, system liczy: `wgt_yield_pct = (wgt_made / wgt_consumed) × 100`. Wymaga pól `net_weight` na produktach (M02). Wyświetlany obok qty yield na dashboardzie i w WO details.

### D10. Downtime Categories (z [5.12])

Trzy kategorie top-level: **People** (absencja, szkolenie), **Process** (changeover, cleaning, material wait), **Plant** (awaria mechaniczna, elektryczna). Każda ma sub-reasons (configurable per org w `downtime_reasons`). Rejestracja: start_time + end_time + reason + notes. Planned vs unplanned.

### D11. Shifts (z [5.13])

Shift = named time window (np. AM 06:00-14:00, PM 14:00-22:00). Configurable per org. Każdy WO/output/downtime powiązany z shift_id. Reporting per shift.

### Decyzje biznesowe (bez ADR)
- Scanner workflows (consume, output) = część M05, używają serwisów M06
- Production settings = 15+ flag per org, auto-created z defaults
- Dashboard auto-refresh = configurable (default 30s)
- Output label printing (ZPL) = trigger z desktop, Phase 2 z scanner
- Genealogy reversals = `is_reversed=true`, NIGDY delete
- Auto-complete WO = DB trigger, setting-gated
- By-product LPs = auto-create (setting) lub manual (sequential dialog per by-product)

---

## 7. Module Map

### Production sub-areas

```
M06 Production
├── M06-E1: WO Execution Core (Phase 1)
│   ├── WO state machine (start/pause/resume/complete)
│   ├── Operations tracking (start/complete per operation)
│   ├── Operation sequence enforcement (configurable)
│   └── WO pause history
│
├── M06-E2: Material Consumption & Reservations (Phase 1)
│   ├── LP-based consumption (partial + full)
│   ├── 1:1 enforcement (consume_whole_lp)
│   ├── Consumption reversal (manager)
│   ├── Material reservations (FIFO/FEFO)
│   ├── Over-consumption control (approval flow)
│   └── Genealogy linking (consumed LP → output LP)
│
├── M06-E3: Output & By-Products (Phase 1)
│   ├── Output registration (LP creation)
│   ├── By-product registration (auto + manual)
│   ├── Multiple outputs per WO
│   ├── Auto-complete WO (DB trigger)
│   ├── LP genealogy (parent-child)
│   └── Label printing (ZPL trigger)
│
├── M06-E4: Dashboard & Settings (Phase 1)
│   ├── Production dashboard (KPI cards, active WOs, alerts)
│   ├── Production settings (15+ flags per org)
│   └── Alert types: material_shortage, wo_delayed, quality_hold
│
├── M06-E5: Waste & Basic Yield (Phase 1)
│   ├── [5.1] Waste categories (customizable per org)
│   ├── [5.2] Weight-based yield (wgt_consumed vs wgt_made)
│   └── [5.6] LP-level consumption tracking
│
├── M06-E6: Downtime & Shifts (Phase 1)
│   ├── [5.12] Downtime tracking (People/Process/Plant + minutes)
│   ├── [5.13] Shift concept (AM/PM, configurable)
│   └── Downtime reasons (configurable per org)
│
Phase 2:
├── M06-E7: Advanced Yield & Quality
│   ├── [5.3] meat_yield_pct / product-specific yield
│   ├── [5.4] target_yield per product (comparison)
│   └── [5.15] QC holds from production (line, code, boxes)
│
├── M06-E8: Co-Products & Routes
│   ├── [5.7] Co-product output tracking
│   ├── [5.8] Route per product-line combination
│   └── [5.9] Route versioning + approval workflow
│
├── M06-E9: OEE
│   ├── OEE calculation (A × P × Q)
│   ├── OEE dashboard (gauges, trend, line comparison)
│   ├── Machine counters (ideal cycle time)
│   └── OEE target tracking
│
└── M06-E10: Advanced Analytics
    ├── [5.5] rework_batch flag on WO
    ├── [5.10] Consumption by item_group breakdown
    ├── [5.11] CW quantity fields on batch order
    └── [5.14] Hourly efficiency tracking
```

### Zależności budowy

```
M02 Technical (BOM, routing, products) ──┐
M04 Planning (WO creation, BOM snapshot) ─┼── M06-E1 (WO Execution) = fundament
M03 Warehouse (LP, locations, FIFO/FEFO) ┘     ├── M06-E2 (Consumption)
M01 Settings (auth, roles, org_id) ─────────────├── M06-E3 (Output)
                                                ├── M06-E4 (Dashboard)
                                                ├── M06-E5 (Waste/Yield)
                                                └── M06-E6 (Downtime/Shifts)
M08 Quality (QA status, holds, NCR) ────────── M06-E7 (Advanced Yield + QC Holds)
M05 Scanner ── uses M06 services for consume/output workflows
```

---

## 8. Requirements

### M06-E1: WO Execution Core (Phase 1, MVP)

**Zależności**: M04 Planning (WO, BOM snapshot), M02 Technical (products, routing), M01 Settings

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-BE-001 | `POST /api/production/work-orders/:id/start` — WO status RELEASED→IN_PROGRESS. Guards: BOM snapshot exists, materials defined. Tworzy reservations jeśli enabled. Audit log. | HIGH |
| PR-BE-002 | `POST /api/production/work-orders/:id/pause` — IN_PROGRESS→ON_HOLD (jeśli `allow_pause_wo=true`). Tworzy `wo_pauses` record (start_time, reason). | HIGH |
| PR-BE-003 | `POST /api/production/work-orders/:id/resume` — ON_HOLD→IN_PROGRESS. Update `wo_pauses.end_time`. | HIGH |
| PR-BE-004 | `POST /api/production/work-orders/:id/complete` — IN_PROGRESS→COMPLETED. Guards: ≥1 output. Set `completed_at`, `actual_qty`, `yield_percent`. Release unused reservations. | HIGH |
| PR-BE-005 | Operations tracking: `POST /operations/:id/start`, `POST /operations/:id/complete`. Sequence enforcement (configurable). `operation_logs` z event_type + yield. | HIGH |
| PR-BE-006 | Auto-complete trigger: DB trigger `check_wo_auto_complete()` — gdy `output_qty ≥ planned_qty` i `auto_complete_wo=true`. | HIGH |
| PR-BE-007 | Zod validation schemas: `woStartSchema`, `woPauseSchema`, `woResumeSchema`, `woCompleteSchema`, `operationStartSchema`, `operationCompleteSchema`. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-FE-001 | WO Execution page (`/production/work-orders/[id]`): header (WO#, product, status badge), materials panel, operations timeline, outputs table, action buttons (Start/Pause/Resume/Complete). | HIGH |
| PR-FE-002 | WO Start/Pause/Resume/Complete modals z confirmation + reason field. | HIGH |
| PR-FE-003 | Operations Timeline: visual timeline z status per operation, start/complete modals, yield input. | HIGH |
| PR-FE-004 | Pause history panel: lista pauz z reason, duration. | MEDIUM |

#### Integracje / Dependencies

- M04 Planning: WO musi być w statusie RELEASED (z BOM snapshot)
- M02 Technical: products, routing (wo_operations)
- M01 Settings: `allow_pause_wo`, `auto_complete_wo`, `require_operation_sequence`

---

### M06-E2: Material Consumption & Reservations (Phase 1, MVP)

**Zależności**: M03 Warehouse (LP), M06-E1, ADR-001 (LP), ADR-005 (FIFO/FEFO)

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-BE-010 | `POST /work-orders/:id/consume` — LP-based consumption: `{ wo_material_id, lp_id, consume_qty, notes }`. Walidacja: LP available, product match, UoM match, qty ≤ available, nie expired, nie QA Hold. Update LP qty, create `wo_material_consumptions`, update `lp_genealogy`. | HIGH |
| PR-BE-011 | 1:1 enforcement: gdy `consume_whole_lp=true` → `consume_qty` = LP qty (±0.0001 tolerance). Error: `FULL_LP_REQUIRED`. | HIGH |
| PR-BE-012 | `POST /work-orders/:id/consume/reverse` — reversal: `{ consumption_id, reason, notes }`. LP qty restored, status restored, genealogy `is_reversed=true`, reservation restored. NIGDY delete. | HIGH |
| PR-BE-013 | `POST /work-orders/:id/over-consumption/request` — approval request: `{ wo_material_id, requested_qty, reason }`. Variance % calculated. | HIGH |
| PR-BE-014 | `POST /work-orders/:id/over-consumption/approve|reject` — manager decision. Approve → auto-create consumption. Reject → reason required. | HIGH |
| PR-BE-015 | `POST /work-orders/:id/materials/reserve` — FIFO/FEFO LP reservation: `{ material_id, lp_id, reserved_qty }`. LP status → RESERVED. Auto-release on WO complete/cancel. | HIGH |
| PR-BE-016 | `GET /work-orders/:id/materials/:materialId/available-lps` — FIFO/FEFO suggested LPs. FEFO: `ORDER BY expiry_date ASC NULLS LAST`. FIFO: `ORDER BY created_at ASC`. | HIGH |
| PR-BE-017 | Zod validation schemas: `consumeSchema`, `reverseConsumptionSchema`, `overConsumptionRequestSchema`, `overConsumptionDecisionSchema`, `reserveSchema`. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-FE-010 | Consumption page (`/production/consumption/[woId]`): materials table (required, consumed, remaining, progress %), LP search, consumption modal, history table. | HIGH |
| PR-FE-011 | AddConsumptionModal: LP search, qty input (default: remaining or LP qty — mniejsza), 1:1 badge, product match validation. | HIGH |
| PR-FE-012 | ReverseConsumptionModal: reason dropdown + notes, confirmation. | HIGH |
| PR-FE-013 | OverConsumptionApprovalModal: variance %, approval/rejection. | HIGH |
| PR-FE-014 | ReservationsPanel: reserved LPs per material, release button, FIFO/FEFO suggestions. | HIGH |

#### Error Codes (ustandaryzowane)

`WO_NOT_IN_PROGRESS`, `LP_NOT_FOUND`, `LP_NOT_AVAILABLE`, `LP_QA_HOLD`, `LP_EXPIRED`, `PRODUCT_MISMATCH`, `UOM_MISMATCH`, `INSUFFICIENT_QUANTITY`, `FULL_LP_REQUIRED`, `ALREADY_REVERSED`, `LP_ALREADY_RESERVED`, `CONSUME_WHOLE_LP_VIOLATION`, `CONCURRENCY_ERROR`, `PENDING_REQUEST_EXISTS`, `ALREADY_DECIDED`, `NOT_OVER_CONSUMPTION`

#### Integracje / Dependencies

- M03 Warehouse: LP status updates (AVAILABLE → RESERVED → CONSUMED), LP qty decrement
- ADR-001: LP-based consumption obowiązkowe
- ADR-005: FIFO/FEFO picking strategy

---

### M06-E3: Output & By-Products (Phase 1, MVP)

**Zależności**: M03 Warehouse (LP creation), M06-E2 (consumed LPs for genealogy), M02 Technical (shelf_life)

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-BE-020 | `POST /work-orders/:id/outputs` — output registration: `{ qty, qa_status, location_id, notes }`. Tworzy LP (`source='production'`), `expiry_date = today + shelf_life_days`, `batch_number` z WO. Genealogy: consumed LPs → output LP. Update `work_orders.output_qty`. | HIGH |
| PR-BE-021 | `POST /work-orders/:id/by-products` — by-product registration: `{ product_id, qty, location_id }`. LP z `is_by_product=true`, batch: `{main_batch}-BP-{code}`. Shared genealogy z main output. Zero qty wymaga `confirm_zero_qty=true`. | HIGH |
| PR-BE-022 | Multiple outputs per WO: `GET /work-orders/:id/outputs` (paginated, filterable). Progress: `progress_percent = output_qty / planned_qty × 100` (by-products excluded). | HIGH |
| PR-BE-023 | DB trigger `update_wo_output_qty()`: recalculates `work_orders.output_qty` on INSERT/UPDATE/DELETE of `production_outputs WHERE is_by_product=false`. | HIGH |
| PR-BE-024 | Label generation: `POST /output/:id/label` — ZPL format for Zebra printers. | MEDIUM |
| PR-BE-025 | Zod validation schemas: `outputRegistrationSchema`, `byProductRegistrationSchema`. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-FE-020 | RegisterOutputModal: qty input (default: remaining planned), QA status selector (jeśli `require_qa_on_output`), location picker, notes. | HIGH |
| PR-FE-021 | RegisterByProductModal: product name, expected qty (pre-filled), actual qty, zero-qty warning. | HIGH |
| PR-FE-022 | OutputProgressCard: planned vs actual, progress bar %, yield indicator (color-coded). | HIGH |
| PR-FE-023 | OutputHistoryTable: paginated, sortable, QA status badges, by-product flag. | HIGH |

#### Integracje / Dependencies

- M03 Warehouse: LP creation (`source='production'`), location assignment
- M02 Technical: `shelf_life_days` na produkcie, by-product definitions z BOM
- M08 Quality: QA status na output LP (jeśli `require_qa_on_output=true`)

---

### M06-E4: Dashboard & Settings (Phase 1, MVP)

**Zależności**: M06-E1 through E3, M01 Settings

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-BE-030 | `GET /api/production/dashboard/kpis` — KPI cards: orders_today, units_produced_today, avg_yield_today, active_wos, material_shortages. Redis cache 30s. | HIGH |
| PR-BE-031 | `GET /api/production/dashboard/active-wos` — active WO table: WO#, product, status, progress %, scheduled end. Paginated, filterable (line, product, status). | HIGH |
| PR-BE-032 | `GET /api/production/dashboard/alerts` — alert types: material_shortage (warning), wo_delayed >4h (warning), quality_hold (critical). | HIGH |
| PR-BE-033 | `GET/PUT /api/production/settings` — 15+ org-level settings. Auto-create defaults for new orgs. Admin-only PUT. | HIGH |
| PR-BE-034 | Zod validation schema: `productionSettingsSchema`. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-FE-030 | Production Dashboard page: KPI cards (top), active WOs table (center), alerts panel (right). Auto-refresh configurable (default 30s). | HIGH |
| PR-FE-031 | Production Settings page (w Settings module): 15+ toggles + numeric inputs. | HIGH |

#### Integracje / Dependencies

- M06-E1 through E3: dane do KPI (WO count, output qty, yield)
- M01 Settings: auth, roles (admin-only settings)
- Redis: cache 30s TTL

---

### M06-E5: Waste & Basic Yield (Phase 1, MVP) — z PRD-UPDATE-LIST [5.1], [5.2], [5.6]

**Zależności**: M06-E3 (output), M02 Technical (products.net_weight), M01 Settings

#### Backend

| ID | Wymaganie | Priorytet | Źródło |
|----|-----------|-----------|--------|
| PR-BE-040 | **Waste categories** — tabela `waste_categories`: `{ id, org_id, code, name, is_default, is_active }`. Domyślne: fat, floor, giveaway, rework, other. Configurable per org (Add/Edit/Deactivate). RLS: org_id. | HIGH | [5.1] |
| PR-BE-041 | **Waste tracking na output** — `production_outputs` rozszerzone o: `waste_qty DECIMAL(15,6)`, `waste_category_id UUID REFERENCES waste_categories(id)`. Walidacja: waste_qty ≥ 0, category musi być aktywna. Waste NIE wliczane do output_qty. | HIGH | [5.1] |
| PR-BE-042 | **Weight-based yield** — kalkulacja: `wgt_yield_pct = (wgt_made / wgt_consumed) × 100`. Wymaga `products.net_weight` (M02). Nowe pola na WO: `wgt_consumed DECIMAL(15,6)`, `wgt_made DECIMAL(15,6)`, `wgt_yield_pct DECIMAL(5,2)`. Aktualizowane przy każdym consume/output (trigger lub service). | HIGH | [5.2] |
| PR-BE-043 | **LP-level consumption tracking** — `GET /work-orders/:id/consumptions` zwraca per-LP breakdown: LP#, product, qty consumed, timestamp, operator. Filtrowanie po material_id. | HIGH | [5.6] |
| PR-BE-044 | **Waste categories CRUD API** — `GET/POST/PUT/DELETE /api/production/waste-categories`. Seed defaults przy pierwszym dostępie. | HIGH | [5.1] |
| PR-BE-045 | Zod validation schemas: `wasteCategorySchema`, `wasteTrackingSchema`. | HIGH | — |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-FE-040 | Waste input na output registration: dropdown waste category + qty field. Optional, ale tracked. | HIGH |
| PR-FE-041 | Weight-based yield display: obok qty yield na WO details i dashboardzie. Color-coded (green/amber/red). | HIGH |
| PR-FE-042 | Waste categories management page (w Settings): lista + add/edit/deactivate. | MEDIUM |

#### Integracje / Dependencies

- M02 Technical: `products.net_weight` wymagane do weight-based yield
- M06-E3: waste tracking rozszerza output registration

---

### M06-E6: Downtime & Shifts (Phase 1, MVP) — z PRD-UPDATE-LIST [5.12], [5.13]

**Zależności**: M01 Settings (machines, production_lines), M06-E1

#### Backend

| ID | Wymaganie | Priorytet | Źródło |
|----|-----------|-----------|--------|
| PR-BE-050 | **Downtime reasons** — tabela `downtime_reasons`: `{ id, org_id, code, name, category ('people'\|'process'\|'plant'), is_planned, is_active }`. Seed defaults per category. CRUD API: `GET/POST/PUT/DELETE /api/production/downtime-reasons`. | HIGH | [5.12] |
| PR-BE-051 | **Downtime records** — tabela `downtime_records`: `{ id, org_id, production_line_id, machine_id, wo_id, downtime_reason_id, start_time, end_time, duration_minutes (calculated), is_planned, notes, reported_by }`. RLS: org_id. Indeks: (production_line_id, start_time). | HIGH | [5.12] |
| PR-BE-052 | **Downtime API** — `POST /api/production/downtime` (start), `PUT /api/production/downtime/:id` (end/update), `GET /api/production/downtime` (list, filter by line/date/category), `GET /api/production/downtime/analysis` (summary by category). | HIGH | [5.12] |
| PR-BE-053 | **Shifts** — tabela `shifts`: `{ id, org_id, name, start_time TIME, end_time TIME, break_minutes, days_of_week INTEGER[], is_active }`. UNIQUE: (org_id, name). CRUD API: `GET/POST/PUT/DELETE /api/production/shifts`. | HIGH | [5.13] |
| PR-BE-054 | **Shift assignment** — `shift_id` column na: `production_outputs`, `downtime_records`, `wo_pauses`. Auto-detect shift based on timestamp vs shift time windows. | HIGH | [5.13] |
| PR-BE-055 | **Migracja DB** — `CREATE TABLE waste_categories`, `CREATE TABLE downtime_reasons`, `CREATE TABLE downtime_records`, `CREATE/ALTER TABLE shifts`, `ALTER TABLE production_outputs ADD waste_qty, waste_category_id`, `ALTER TABLE work_orders ADD wgt_consumed, wgt_made, wgt_yield_pct`. RLS na wszystkich nowych tabelach. | HIGH | — |
| PR-BE-056 | Zod validation schemas: `downtimeReasonSchema`, `downtimeRecordSchema`, `shiftSchema`. | HIGH | — |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-FE-050 | Downtime registration form: select reason (grouped by People/Process/Plant), start/end time, notes. Dostępne z WO execution page i production dashboard. | HIGH |
| PR-FE-051 | Downtime summary widget na dashboard: total minutes today per category (pie chart lub bars). | HIGH |
| PR-FE-052 | Shift management page (w Settings): lista shiftów, add/edit/deactivate. | MEDIUM |
| PR-FE-053 | Downtime reasons management page (w Settings): lista grouped by category, add/edit/deactivate. | MEDIUM |

#### Integracje / Dependencies

- M01 Settings: production_lines, machines (FK references)
- M06-E1: WO powiązanie z downtime records
- M06-E4: downtime widget na dashboardzie

---

### M06-E7: Advanced Yield & Quality (Phase 2)

**Zależności**: M06-E5, M08 Quality (QA holds, NCR), M02 Technical (target_yield per product)

| ID | Wymaganie | Priorytet | Źródło |
|----|-----------|-----------|--------|
| PR-BE-060 | **meat_yield_pct** — nowe pole na `products`: `meat_yield_target DECIMAL(5,2)`. Kalkulacja na WO: `meat_yield_pct = (meat_output / meat_input) × 100`. Filtrowanie produktów z `item_group='RawMeat'`. | HIGH | [5.3] |
| PR-BE-061 | **target_yield** — `products.target_yield_pct DECIMAL(5,2)`. Porównanie: actual vs target na dashboardzie i WO summary. Color: green (≥target), amber (target-5% to target), red (<target-5%). | HIGH | [5.4] |
| PR-BE-062 | **QC holds z produkcji** — `POST /api/production/work-orders/:id/qc-hold`: `{ line_id, hold_code, boxes_held, boxes_rejected, notes }`. Tworzy QA hold (M08) powiązany z WO. Alert na dashboardzie. | HIGH | [5.15] |

#### Integracje / Dependencies

- M08 Quality: QA holds, NCR creation
- M02 Technical: `products.target_yield_pct`, `products.item_group`

---

### M06-E8: Co-Products & Routes (Phase 2)

**Zależności**: M02 Technical (BOM co-products, routing), M06-E3

| ID | Wymaganie | Priorytet | Źródło |
|----|-----------|-----------|--------|
| PR-BE-070 | **Co-product output tracking** — rozszerzenie by-products: co-products = planned outputs (nie odpady). Osobna sekcja w WO execution. Yield per co-product. | HIGH | [5.7] |
| PR-BE-071 | **Route per product-line** — tabela `product_line_routes`: `{ product_id, production_line_id, route_id }`. WO snapshot kopiuje route matching product + line. | HIGH | [5.8] |
| PR-BE-072 | **Route versioning** — `routes.version INT`, `routes.status ('draft'\|'active'\|'archived')`. Approval workflow: draft → active (manager approval). BOM snapshot bierze najnowszą active version. | MEDIUM | [5.9] |

#### Integracje / Dependencies

- M02 Technical: BOM co-products, routing definitions
- M04 Planning: BOM snapshot musi kopiować co-products i route per line

---

### M06-E9: OEE (Phase 2)

**Zależności**: M06-E6 (downtime, shifts), M01 Settings (machines), M06-E1

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| PR-BE-080 | **OEE calculation** — `oee_records` table. A = operating_time / planned_time. P = (actual_output × ideal_cycle_time) / operating_time. Q = good_output / total_output. OEE = A × P × Q. Calculated hourly (cron) lub on-demand. | HIGH |
| PR-BE-081 | **OEE dashboard** — `GET /api/production/oee/summary`, `/by-line`, `/by-machine`, `/trend`. Redis cache 5min TTL. Gauges, trend charts, line comparison. | HIGH |
| PR-BE-082 | **Machine counters** — `machine_counters` table: ideal_cycle_time per machine per product. Manual input (Phase 2), PLC integration (Phase 3+). | MEDIUM |
| PR-BE-083 | **OEE target** — `production_settings.target_oee_percent` (default 85%). Comparison on dashboard. | MEDIUM |

#### Integracje / Dependencies

- M06-E6: downtime records (Availability calculation)
- M01 Settings: machines, production_lines
- Cron job: hourly OEE calculation

---

### M06-E10: Advanced Analytics (Phase 2)

**Zależności**: M06-E1 through E6, M02 Technical (item_groups)

| ID | Wymaganie | Priorytet | Źródło |
|----|-----------|-----------|--------|
| PR-BE-090 | **rework_batch flag** — `work_orders.is_rework BOOLEAN DEFAULT false`. Rework WO linked to original WO via `rework_of_wo_id`. Osobna sekcja na dashboardzie. | MEDIUM | [5.5] |
| PR-BE-091 | **Consumption by item_group** — breakdown: RawMeat, Packaging, Seasoning, etc. Group by `products.item_group` na consumption summary. | MEDIUM | [5.10] |
| PR-BE-092 | **CW qty on batch order** — catch weight fields na WO: `cw_planned_qty`, `cw_actual_qty`, `cw_uom`. Widoczne gdy produkt `is_catch_weight=true`. | HIGH | [5.11] |
| PR-BE-093 | **Hourly efficiency** — `GET /api/production/analytics/hourly-efficiency?line_id=&date=`. Output per hour / target per hour × 100%. Per line, per shift. | MEDIUM | [5.14] |

#### Integracje / Dependencies

- M02 Technical: `products.item_group`, `products.is_catch_weight`
- M06-E1: WO data (rework linking)
- M06-E6: shifts (hourly efficiency per shift)

---

## 9. KPIs

### Produkcja (operacyjne)

| KPI | Cel | Pomiar | Phase |
|-----|-----|--------|-------|
| Output Yield % (qty) | ≥ 95% | output_qty / planned_qty | 1 |
| Weight Yield % | ≥ 95% (per product target) | wgt_made / wgt_consumed | 1 |
| Waste % | < 3% | waste_qty / (output_qty + waste_qty) | 1 |
| WO completed on time | > 85% | Scheduled end vs actual | 1 |
| Over-consumption rate | < 5% WO | Approvals / total WO | 1 |
| Downtime minutes / shift | < 30 min (unplanned) | Downtime records | 1 |
| Meat Yield % | Per product target | meat_output / meat_input | 2 |

### OEE (Phase 2)

| KPI | Cel | Pomiar |
|-----|-----|--------|
| OEE % | ≥ 85% | A × P × Q |
| Availability % | ≥ 90% | Operating / Planned time |
| Performance % | ≥ 95% | Actual / Ideal output |
| Quality % | ≥ 99% | Good / Total output |

### Efektywność

| KPI | Cel | Pomiar | Phase |
|-----|-----|--------|-------|
| Hourly efficiency % | ≥ 90% | Output per hour / target | 2 |
| Shift variance | < 10% between shifts | AM vs PM comparison | 1 |
| Scanner adoption (consume) | > 70% vs desktop | Usage analytics | 1 |

### System

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Consumption API P95 | < 2 s | APM |
| Scanner consume flow | < 500 ms (lookup) | APM |
| Dashboard load P95 | < 2 s | APM |

---

## 10. Risks

### Phase 1

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Genealogy linking errors (missing parent LP) | Średnie | Wysoki | Walidacja at output registration; `MISSING_PARENT_LP` error; genealogy integrity checks |
| Over-consumption approval bottleneck | Średnie | Średni | Dashboard alert for pending approvals; optional `allow_over_consumption=true` |
| UoM mismatch between LP and BOM | Średnie | Wysoki | Strict validation at consumption; clear error messages; UoM conversion Phase 2 |
| Catch weight complexity cross-cutting | Wysokie | Wysoki | `is_catch_weight` flag; opt-in per product; weight fields nullable |
| Downtime reasons — brak standardu | Niskie | Średni | Seed defaults per category (People/Process/Plant); customizable per org |
| Weight yield bez net_weight na produkcie | Średnie | Średni | Dependency na M02 `products.net_weight`; graceful degradation (show qty yield only) |
| Concurrent consumption conflicts | Średnie | Średni | Optimistic locking on LP qty; `CONCURRENCY_ERROR`; retry |
| Brak rezerwacji materiałów przy dużej liczbie WO | Średnie | Wysoki | FIFO/FEFO auto-reservation; dashboard alert for material shortages |

### Phase 2

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| OEE — brak ideal_cycle_time | Wysokie | Wysoki | Manual input fallback; PLC integration Phase 3+ |
| Route versioning complexity | Średnie | Średni | Simple state machine (draft→active→archived); 1 active per product+line |
| Hourly efficiency — granularity vs noise | Średnie | Niski | Agregacja z smoothing; configurable threshold |
| Co-product vs by-product confusion | Niskie | Średni | Jasna definicja: co-product = planned output, by-product = incidental |
| Niekompletne dane z maszyn | Wysokie | Wysoki | Manual fallback; graceful degradation; PLC Phase 3+ |

---

## 11. Success Criteria

### MVP (Phase 1) — Production jest GOTOWY gdy:

#### Funkcjonalne
- [ ] WO Start/Pause/Resume/Complete działa end-to-end z state machine guards
- [ ] Material consumption LP-based z walidacją (product, UoM, qty, status, expiry)
- [ ] 1:1 consumption enforcement (`consume_whole_lp`) działa
- [ ] Consumption reversal z audit trail (reason + notes)
- [ ] Over-consumption approval flow (request → approve/reject)
- [ ] Material reservations (FIFO/FEFO) z auto-release
- [ ] Output registration z LP creation + genealogy linking
- [ ] By-product registration (auto + manual)
- [ ] Multiple outputs per WO z auto-complete trigger
- [ ] Production dashboard z KPIs, active WOs, alerts
- [ ] Production settings (15+ flags) configurable per org
- [ ] [5.1] Waste categories (customizable per org) + waste tracking na output
- [ ] [5.2] Weight-based yield (`wgt_yield_pct`) na WO i dashboardzie
- [ ] [5.6] LP-level consumption tracking (per-LP breakdown)
- [ ] [5.12] Downtime tracking z 3 kategoriami (People/Process/Plant) + minutes
- [ ] [5.13] Shift concept (AM/PM) z assignment na outputs/downtime

#### Niefunkcjonalne
- [ ] Consumption API P95 < 2 s
- [ ] Dashboard load P95 < 2 s
- [ ] Genealogy forward/backward query < 30 s
- [ ] RLS poprawne na wszystkich tabelach (nowych i istniejących)
- [ ] Testy unit: ≥ 80% coverage serwisów
- [ ] Zod validation na wszystkich API inputs
- [ ] Scanner consume/output flows zwalidowane na 3+ urządzeniach

#### Integracje
- [ ] M05 Scanner: consume + output workflows działają via shared services
- [ ] M03 Warehouse: LP status updates (CONSUMED, RESERVED) poprawne
- [ ] M04 Planning: WO state transitions z Planning widoczne w Production
- [ ] M02 Technical: products.net_weight dostępne dla weight-based yield

### Phase 2 — dodatkowe kryteria
- [ ] [5.3] meat_yield_pct per product
- [ ] [5.4] target_yield comparison na dashboardzie
- [ ] [5.7] Co-product output tracking
- [ ] [5.8] Route per product-line
- [ ] [5.9] Route versioning + approval
- [ ] [5.15] QC holds z produkcji
- [ ] OEE dashboard z gauges i trend
- [ ] [5.14] Hourly efficiency per line
- [ ] [5.5] Rework batch tracking
- [ ] [5.10] Consumption by item_group
- [ ] [5.11] CW qty on batch order

---

## 12. References

### Dokumenty modułowe
- Analysis → `new-doc/06-production/ANALYSIS.md`
- Architecture → `new-doc/06-production/decisions/production-arch.md`
- PRD-UPDATE-LIST (items 5.1-5.15) → `new-doc/_meta/PRD-UPDATE-LIST.md`

### API Documentation
- Material Consumption → `new-doc/06-production/api/material-consumption.md`
- Output Registration → `new-doc/06-production/api/output-registration.md`
- Material Reservations → `new-doc/06-production/api/material-reservations.md`
- Over-Consumption Control → `new-doc/06-production/api/over-consumption-control.md`
- Production Dashboard → `new-doc/06-production/api/production-dashboard.md`
- Production Settings → `new-doc/06-production/api/production-settings.md`
- Scanner Consumption → `new-doc/06-production/api/scanner-consumption-api.md`

### Guides
- Yield Calculation → `new-doc/06-production/guides/yield-calculation.md`
- Reservation Workflow → `new-doc/06-production/guides/reservation-workflow.md`
- Genealogy Linking → `new-doc/06-production/guides/genealogy-linking.md`
- By-Product Registration → `new-doc/06-production/guides/by-product-registration-guide.md`
- Multiple Outputs → `new-doc/06-production/guides/multiple-outputs-workflow.md`

### Foundation ADRs
- ADR-001 LP Inventory → `new-doc/00-foundation/decisions/ADR-001-license-plate-inventory.md`
- ADR-002 BOM Snapshot → `new-doc/00-foundation/decisions/ADR-002-bom-snapshot-pattern.md`
- ADR-005 FIFO/FEFO → `new-doc/00-foundation/decisions/ADR-005-fifo-fefo-picking-strategy.md`
- ADR-006 Scanner-First UX → `new-doc/00-foundation/decisions/ADR-006-scanner-first-mobile-ux.md`
- ADR-007 WO State Machine → `new-doc/00-foundation/decisions/ADR-007-work-order-state-machine.md`
- ADR-008 Audit Trail → `new-doc/00-foundation/decisions/ADR-008-audit-trail-strategy.md`

### Cross-module wireframes
- PROD-005 Scanner Consume → `new-doc/06-production/ux/PROD-005-scanner-consume-material.md`
- PROD-006 Scanner Output → `new-doc/06-production/ux/PROD-006-scanner-register-output.md`

### Design
- Design Guidelines → `new-doc/_meta/DESIGN-GUIDELINES.md`

---

## 13. Pytania doprecyzowujące

Poniższe kwestie wymagają decyzji przed rozpoczęciem implementacji:

### Pytania biznesowe

1. **Waste categories — czy lista domyślna (fat, floor, giveaway, rework, other) jest kompletna?** Czy klient ma dodatkowe kategorie waste specyficzne dla swojej branży (np. bone, skin, trim)?

2. **Shift model — czy wystarczą 2 shifty (AM/PM)?** Czy są zakłady z 3 zmianami (Morning/Afternoon/Night)? Czy shift może przekraczać midnight (np. Night 22:00-06:00)?

3. **Over-consumption approval — kto dokładnie zatwierdza?** Czy to zawsze Production Manager, czy może być delegowane do Shift Leader? Czy jest limit kwotowy/procentowy, powyżej którego eskalacja do wyższego poziomu?

4. **By-product vs Co-product — jak klient rozróżnia?** Czy co-product to zawsze planned output z BOM (np. mięso + kości), a by-product to incidental (np. tłuszcz)? Czy co-products mają własne target_qty w BOM?

5. **Downtime — czy „planned downtime" (changeover, cleaning) powinien być rejestrowany z WO, czy niezależnie od WO?** Np. cleaning między WO nie jest powiązany z żadnym konkretnym WO.

6. **Weight-based yield — czy `net_weight` na produkcie jest już wypełnione w M02 Technical?** Jeśli nie, to weight yield nie będzie działał do czasu uzupełnienia danych. Czy to blocker?

7. **Auto-complete WO — czy trigger powinien działać na `output_qty ≥ planned_qty` czy `output_qty ≥ planned_qty × (1 - tolerance%)`?** Np. jeśli planned = 100 i tolerance = 2%, to auto-complete przy 98?

### Pytania techniczne

8. **Genealogy linking — czy przy reversal consumption genealogia powinna być soft-deleted (`is_reversed=true`) czy fizycznie usunięta?** Obecna decyzja: soft-delete. Czy to potwierdzone?

9. **Concurrent consumption — czy optimistic locking (version column na LP) wystarczy, czy potrzebny pessimistic lock (SELECT FOR UPDATE)?** Przy dużej liczbie operatorów na jednej linii mogą być konflikty.

10. **Shift auto-detection — co jeśli timestamp wypada poza zdefiniowanymi shiftami?** Np. output zarejestrowany o 05:30, a AM zaczyna się o 06:00. Czy przypisać do poprzedniego shiftu, czy zostawić NULL?

11. **Dashboard cache invalidation — czy Redis cache (30s TTL) wystarczy, czy potrzebny event-driven invalidation?** Przy 30s TTL dashboard może pokazywać stale dane przez max 30s po zmianie.

12. **Label printing (ZPL) — czy w Phase 1 drukowanie etykiet jest wymagane, czy może być Phase 2?** Wymaga konfiguracji drukarek Zebra i testowania na fizycznym sprzęcie.

---

_PRD 06-Production v3.0 — 10 epików (6 Phase 1, 4 Phase 2), ~80 wymagań, 15 PRD-UPDATE-LIST items [5.1]-[5.15] w pełni zmapowane._
_Changelog v3.0: Pełna rewrite od zera. Usunięte statusy implementacji. Dodane Zod validation requirements. Dodana sekcja Integracje/Dependencies per epik. Dodana sekcja pytań doprecyzowujących. Backend-first ordering. Scanner-First UX jako D3._
_Data: 2026-02-17_
