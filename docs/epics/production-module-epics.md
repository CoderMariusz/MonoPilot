# Production Module - Epic Breakdown

**Modul:** Production (Dashboard, Execution, Consumption, Outputs)
**Priorytet:** P0 - Core Module
**FRs:** 15 (wszystkie MVP)
**Szacowany czas:** 2-3 tygodnie

---

## Podsumowanie Epikow

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| PROD-1 | Production Dashboard | 1 | 4 | P0 | 2d |
| PROD-2 | WO Execution & Operations | 4 | 7 | P0 | 4d |
| PROD-3 | Material Consumption | 5 | 8 | P0 | 4d |
| PROD-4 | Output & By-Products | 5 | 7 | P0 | 4d |
| **Total** | | **15** | **26** | | **14d** |

---

## Epic PROD-1: Production Dashboard

**Cel:** Real-time monitoring produkcji z KPIs i alertami
**FRs:** FR-PROD-001
**Priorytet:** P0 MVP
**Effort:** 2 dni

### Stories

#### PROD-1-1: KPI Cards
**Jako** Production Manager **chce** widziec KPI **aby** monitorowac wydajnosc

**Acceptance Criteria:**
- [ ] KPI: Orders Today (completed WOs today)
- [ ] KPI: Units Produced (sum output qty today)
- [ ] KPI: Avg Yield (actual/planned %)
- [ ] KPI: Active WOs (status=In Progress)
- [ ] KPI: Material Shortages (availability < 100%)
- [ ] Auto-refresh with countdown

**Technical Tasks:**
- API: GET `/api/production/dashboard/kpis`
- KPI calculation queries
- UI: KPICardsGrid component

---

#### PROD-1-2: Active WOs Table
**Jako** Supervisor **chce** widziec aktywne WO **aby** sledzic postep

**Acceptance Criteria:**
- [ ] Table: WO Number, Product, Qty (planned/completed), Progress %
- [ ] Columns: Status, Line/Machine, Started At
- [ ] Sortable and filterable
- [ ] Click to view WO detail
- [ ] Pause button (if enabled)

**Technical Tasks:**
- API: GET `/api/production/dashboard/active-wos`
- UI: ActiveWOsTable component
- Link to execution page

---

#### PROD-1-3: Alerts Panel
**Jako** Manager **chce** widziec alerty **aby** reagowac na problemy

**Acceptance Criteria:**
- [ ] Alert: Material Shortage (availability < 80%)
- [ ] Alert: WO Delayed (past scheduled date)
- [ ] Alert: Quality Hold (output in QA Hold)
- [ ] Alert: Machine Down
- [ ] Alert: Low Yield (< 80% expected)
- [ ] Priority colors (red/yellow)
- [ ] Collapsible panel

**Technical Tasks:**
- API: GET `/api/production/dashboard/alerts`
- Alert calculation logic
- UI: AlertsPanel component

---

#### PROD-1-4: Dashboard Settings
**Jako** Admin **chce** konfigurowac dashboard **aby** dostosowac do potrzeb

**Acceptance Criteria:**
- [ ] Setting: dashboard_refresh_seconds (default 30)
- [ ] Toggle: show_material_alerts
- [ ] Toggle: show_delay_alerts
- [ ] Toggle: show_quality_alerts
- [ ] Settings saved per org

**Technical Tasks:**
- production_settings table
- API: GET/PUT `/api/production/settings`
- Settings UI section

---

## Epic PROD-2: WO Execution & Operations

**Cel:** Wykonanie WO z operacjami i sledzeniem czasu
**FRs:** FR-PROD-002, FR-PROD-003, FR-PROD-004, FR-PROD-005
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### PROD-2-1: Start WO
**Jako** Operator **chce** startowac WO **aby** rozpoczac produkcje

**Acceptance Criteria:**
- [ ] Select from Released WOs list
- [ ] Confirm line/machine assignment
- [ ] Material availability check (warning only)
- [ ] Status: Released -> In Progress
- [ ] started_at timestamp set
- [ ] Start WO modal with summary

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/start`
- Status transition validation
- UI: StartWOModal

---

#### PROD-2-2: Pause/Resume WO
**Jako** Operator **chce** pauzowac WO **aby** obsluzyc przerwe

**Acceptance Criteria:**
- [ ] Toggle in Settings: allow_pause_wo
- [ ] Pause reason required (Breakdown, Break, Material Wait, Other)
- [ ] Status: In Progress -> Paused
- [ ] Resume clears pause reason
- [ ] Track pause duration in wo_pauses table
- [ ] Notes optional

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/pause`
- API: POST `/api/production/work-orders/:id/resume`
- wo_pauses table
- UI: PauseWOModal

---

#### PROD-2-3: Operation Start/Complete
**Jako** Operator **chce** sledzic operacje **aby** rejestrowac postep

**Acceptance Criteria:**
- [ ] View wo_operations list
- [ ] Start operation: status -> In Progress
- [ ] Complete operation: status -> Completed
- [ ] Track: actual_duration_minutes, actual_yield_percent
- [ ] Operator assignment
- [ ] Notes field

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/operations/:opId/start`
- API: POST `/api/production/work-orders/:id/operations/:opId/complete`
- UI: OperationsTimeline, CompleteOperationModal

---

#### PROD-2-4: Operation Sequence Enforcement
**Jako** System **chce** wymuszac kolejnosc operacji **aby** zapewnic prawidlowy proces

**Acceptance Criteria:**
- [ ] Toggle: require_operation_sequence
- [ ] If enabled: operation N must complete before N+1
- [ ] If disabled: parallel execution allowed
- [ ] Visual indicator of sequence
- [ ] Block start if previous not complete

**Technical Tasks:**
- Sequence validation logic
- UI: sequence indicators, block messages

---

#### PROD-2-5: Complete WO
**Jako** Operator **chce** zakonczyc WO **aby** zamknac produkcje

**Acceptance Criteria:**
- [ ] Validate all operations completed (if required)
- [ ] Validate output registered (at least one)
- [ ] Status: In Progress -> Completed
- [ ] completed_at timestamp set
- [ ] Complete WO button

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/complete`
- Completion validation logic
- UI: CompleteWOButton

---

#### PROD-2-6: Auto-Complete WO
**Jako** System **chce** auto-complete WO **aby** automatyzowac proces

**Acceptance Criteria:**
- [ ] Toggle: auto_complete_wo
- [ ] Auto-complete when output_qty >= planned_qty
- [ ] Triggered on output registration
- [ ] Can be disabled for manual control

**Technical Tasks:**
- Auto-complete trigger in output API
- Setting check

---

#### PROD-2-7: WO Execution Page
**Jako** Operator **chce** widziec pelny widok WO **aby** miec kontekst

**Acceptance Criteria:**
- [ ] WO header (number, product, qty, status)
- [ ] Operations timeline with progress
- [ ] Materials summary (required vs consumed)
- [ ] Outputs summary
- [ ] Action buttons (Start, Pause, Complete)

**Technical Tasks:**
- UI: WOExecutionPage
- Aggregate data queries

---

## Epic PROD-3: Material Consumption

**Cel:** Konsumpcja materialow z desktop i scanner z walidacja
**FRs:** FR-PROD-006, FR-PROD-007, FR-PROD-008, FR-PROD-009, FR-PROD-010
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### PROD-3-1: Desktop Consumption
**Jako** Operator **chce** konsumowac materialy na desktop **aby** rejestrowac zuzycie

**Acceptance Criteria:**
- [ ] Select WO
- [ ] View wo_materials with required vs consumed
- [ ] Search/scan LP
- [ ] Enter qty to consume
- [ ] Validation: product, UoM, availability
- [ ] Update LP qty and status
- [ ] Confirmation message

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/consume`
- API: GET `/api/production/work-orders/:id/materials`
- UI: ConsumptionPage, AddConsumptionModal

---

#### PROD-3-2: Scanner Consumption
**Jako** Operator **chce** skanowac materialy **aby** szybko rejestrowac

**Acceptance Criteria:**
- [ ] Scan WO barcode
- [ ] System shows required materials
- [ ] Scan LP barcode
- [ ] Enter qty or "Full LP" button
- [ ] Same validations as desktop
- [ ] Confirmation screen

**Technical Tasks:**
- Scanner consume flow
- Mobile-optimized UI
- Barcode handling

---

#### PROD-3-3: 1:1 Consumption Enforcement
**Jako** System **chce** wymuszac pelna konsumpcje LP **aby** zachowac traceability

**Acceptance Criteria:**
- [ ] consume_whole_lp flag on BOM item
- [ ] Force full LP qty when true
- [ ] Block partial on scanner
- [ ] Warning on desktop
- [ ] Cannot split LP

**Technical Tasks:**
- consume_whole_lp validation logic
- UI: warning/block messages

---

#### PROD-3-4: Consumption Validation Rules
**Jako** System **chce** walidowac konsumpcje **aby** zapobiec bledom

**Acceptance Criteria:**
- [ ] LP exists
- [ ] LP status = available
- [ ] Product matches material product
- [ ] UoM matches
- [ ] Qty available on LP
- [ ] Clear error messages

**Technical Tasks:**
- Validation layer in API
- Error response standardization

---

#### PROD-3-5: LP Updates After Consumption
**Jako** System **chce** aktualizowac LP **aby** sledzic stock

**Acceptance Criteria:**
- [ ] Decrease LP qty by consumed amount
- [ ] If qty = 0: status -> 'consumed'
- [ ] Set consumed_by_wo_id
- [ ] Create lp_genealogy entry

**Technical Tasks:**
- LP update transaction
- Genealogy record creation

---

#### PROD-3-6: Over-Consumption Control
**Jako** Manager **chce** kontrolowac nadmierna konsumpcje **aby** sledzic variance

**Acceptance Criteria:**
- [ ] Toggle: allow_over_consumption
- [ ] If off: block if consumed > required
- [ ] If on: warn but allow
- [ ] Track variance in reports

**Technical Tasks:**
- Over-consumption check in API
- Setting toggle
- Variance calculation

---

#### PROD-3-7: Consumption Correction
**Jako** Manager **chce** korygowac bledy **aby** naprawic pomylki

**Acceptance Criteria:**
- [ ] Reverse consumption (Manager/Admin only)
- [ ] Add qty back to LP
- [ ] Set reversed=true, reversed_at, reversed_by
- [ ] LP status back to 'available' if was consumed
- [ ] Audit trail

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/consume/reverse`
- Permission check
- LP restoration logic

---

#### PROD-3-8: Consumption History
**Jako** Manager **chce** widziec historie konsumpcji **aby** audytowac

**Acceptance Criteria:**
- [ ] List all consumptions for WO
- [ ] Show: LP, product, qty, timestamp, operator
- [ ] Show reversed status
- [ ] Filter by material

**Technical Tasks:**
- API: GET `/api/production/work-orders/:id/consumption-history`
- UI: ConsumptionHistoryTable

---

## Epic PROD-4: Output & By-Products

**Cel:** Rejestracja outputu i by-products z yield tracking
**FRs:** FR-PROD-011, FR-PROD-012, FR-PROD-013, FR-PROD-014, FR-PROD-015
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### PROD-4-1: Desktop Output Registration
**Jako** Operator **chce** rejestrowac output **aby** tworzyc LP produkcyjne

**Acceptance Criteria:**
- [ ] Select WO
- [ ] Enter qty produced
- [ ] Assign QA status (Pending, Approved, Rejected, Hold)
- [ ] Select location (default from line)
- [ ] Create output LP
- [ ] Set batch_number from WO or auto
- [ ] Calculate expiry_date from shelf_life

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/outputs`
- LP creation logic
- UI: RegisterOutputModal

---

#### PROD-4-2: Scanner Output Registration
**Jako** Operator **chce** skanowac output **aby** szybko rejestrowac

**Acceptance Criteria:**
- [ ] Scan WO barcode
- [ ] Enter qty produced
- [ ] Select QA status (large buttons)
- [ ] Confirm -> LP created
- [ ] Print LP label (ZPL)

**Technical Tasks:**
- Scanner output flow
- ZPL label generation
- Mobile-optimized UI

---

#### PROD-4-3: Output LP Creation
**Jako** System **chce** tworzyc LP **aby** sledzic output

**Acceptance Criteria:**
- [ ] product_id from WO
- [ ] qty from output
- [ ] batch_number from WO.wo_number
- [ ] qa_status as selected
- [ ] location_id from line default
- [ ] expiry_date = today + shelf_life_days
- [ ] source = 'production'
- [ ] wo_id set

**Technical Tasks:**
- LP creation transaction
- Auto-calculation logic

---

#### PROD-4-4: Genealogy Completion
**Jako** System **chce** aktualizowac genealogie **aby** kompletowac traceability

**Acceptance Criteria:**
- [ ] Update lp_genealogy: set child_lp_id to output LP
- [ ] Links all consumed materials to output
- [ ] Full forward/backward trace enabled

**Technical Tasks:**
- Genealogy update on output
- Transaction integrity

---

#### PROD-4-5: By-Product Registration
**Jako** Operator **chce** rejestrowac by-products **aby** sledzic produkty uboczne

**Acceptance Criteria:**
- [ ] View by-products from wo_materials (is_by_product=true)
- [ ] Calculate expected: wo_qty x yield_percent / 100
- [ ] Register actual qty
- [ ] Create by-product LP
- [ ] Toggle: auto_create_by_product_lp

**Technical Tasks:**
- API: POST `/api/production/work-orders/:id/by-products`
- Expected calculation
- UI: ByProductsSection

---

#### PROD-4-6: Yield Tracking
**Jako** Manager **chce** widziec yield **aby** monitorowac efektywnosc

**Acceptance Criteria:**
- [ ] Output Yield: actual_output / planned x 100
- [ ] Material Yield: planned_material / actual_consumed x 100
- [ ] Operation Yield: from wo_operations
- [ ] Display on WO detail
- [ ] Historical comparison

**Technical Tasks:**
- API: GET `/api/production/work-orders/:id/yield`
- Yield calculation logic
- UI: YieldSummaryCard

---

#### PROD-4-7: Multiple Outputs per WO
**Jako** Operator **chce** rejestrowac wiele outputow **aby** produkowac partiami

**Acceptance Criteria:**
- [ ] Each registration creates separate LP
- [ ] Total: output_qty = sum of all outputs
- [ ] History viewable on WO
- [ ] Progress updates live

**Technical Tasks:**
- Output aggregation query
- UI: OutputHistoryTable
- Progress calculation

---

## Zaleznosci

```
PROD-1 (Dashboard) <- requires WO data from Planning
PROD-2 (Execution) <- requires WO from Planning, wo_operations from Technical
PROD-3 (Consumption) <- requires wo_materials (BOM snapshot), LP data
PROD-4 (Outputs) <- requires LP creation, genealogy
```

- Settings module complete (production_settings)
- Technical module complete (BOMs for wo_materials)
- Planning module complete (Work Orders)
- Warehouse module for LP operations

---

## Definition of Done

- [ ] Wszystkie AC spelnione
- [ ] Scanner flows work end-to-end
- [ ] 1:1 consumption enforced correctly
- [ ] Genealogy complete (consumption -> output)
- [ ] Yield calculations accurate
- [ ] Unit tests (95% coverage)
- [ ] E2E tests for critical paths
- [ ] API documentation updated

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Dependencies:** Settings, Technical, Planning complete

---

_Epic breakdown dla Production Module - 15 FRs -> 4 epiki, 26 stories_
