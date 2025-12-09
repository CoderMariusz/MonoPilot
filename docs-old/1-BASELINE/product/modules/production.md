# Production Module - PRD Specification

**Status:** 🚧 IN PROGRESS (Track A DONE, Track B/C IN PROGRESS)
**Priority:** P0 - Core Module
**Implementation:** Batch 04A-04C (2025-11-28 to present)

---

## Overview

Production module obsługuje wykonanie zleceń produkcyjnych - od startu WO, przez konsumpcję materiałów, do rejestracji outputu i by-products. **Epic 4 w trakcie** - zaimplementowano Track A (5 stories DONE):

**Track A - WO Lifecycle (DONE):**
- **04A-1:** WO Lifecycle (3 stories - WO start 4.2, pause/resume 4.3, complete 4.6)
- **04A-2:** Production Settings (1 story - settings 4.17)
- **04A-3:** Production Dashboard (1 story - dashboard 4.1)

**Track B - Material & Output (IN PROGRESS - 13 stories):**
- **04A-2:** Material Reservation (2 stories - desktop 4.7, scanner 4.8)
- **04B-1:** Consumption (4 stories - enforcement 4.9, correction 4.10, over-consumption 4.11, scanner workflows)
- **04B-2:** Output Registration (5 stories - desktop 4.12, scanner 4.13, by-product 4.14, yield 4.15, multiple outputs 4.16)
- **04C-1:** Config & Traceability (2 stories - LP updates on consumption 4.18, genealogy creation 4.19)

**Track C - Operations (IN PROGRESS - 6 stories):**
- Operation start 4.4, complete 4.5, timeline 4.20

**Test Coverage:** 50+ unit tests, 30+ integration tests, 40+ E2E tests (Track A)

## Dependencies

- **Requires:** Settings (lines, machines), Technical (products, BOMs), Planning (work orders)
- **Required by:** Warehouse (output LPs), Quality (QA status)
- **Shared services:** RLS (org_id)

---

## UI Structure

```
/production
├── /dashboard             → KPIs, active WOs, alerts
├── /execution             → WO execution, operations
├── /consumption           → Material consumption (desktop + scanner)
└── /outputs               → Register outputs, by-products
```

---

## Production Settings (in /settings/production-execution)

### Feature Toggles

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `allow_pause_wo` | toggle | Off | Czy można pauzować WO |
| `auto_complete_wo` | toggle | Off | Auto-complete WO gdy output = 100% |
| `require_operation_sequence` | toggle | On | Operacje muszą być w kolejności |
| `allow_over_consumption` | toggle | Off | Czy można skonsumować więcej niż BOM |
| `allow_partial_lp_consumption` | toggle | On | Czy można częściowo konsumować LP |
| `require_qa_on_output` | toggle | On | Output wymaga przypisania QA status |
| `auto_create_by_product_lp` | toggle | On | Auto-twórz LP dla by-products |

### Dashboard Settings

| Setting | Type | Description |
|---------|------|-------------|
| `dashboard_refresh_seconds` | number | Częstotliwość odświeżania (default: 30s) |
| `show_material_alerts` | toggle | Pokaż alerty o brakach materiałowych |
| `show_delay_alerts` | toggle | Pokaż alerty o opóźnieniach |
| `show_quality_alerts` | toggle | Pokaż alerty o quality holds |

---

## Sekcja 1: Production Dashboard

**Route:** `/production/dashboard`

### 1.1 KPI Cards

| KPI | Calculation | Description |
|-----|-------------|-------------|
| Orders Today | Count WO where status=Completed AND completed_at=today | Ukończone dziś |
| Units Produced | Sum output qty where created_at=today | Wyprodukowane jednostki |
| Avg Yield | Avg (actual_qty / planned_qty × 100) for today's WOs | Średni yield % |
| Active WOs | Count WO where status=In Progress | Aktywne zlecenia |
| Material Shortages | Count WO with material availability < 100% | Braki materiałowe |

### 1.2 Active WOs Table

| Column | Description |
|--------|-------------|
| WO Number | Link to WO detail |
| Product | Co produkujemy |
| Qty | Planned / Completed |
| Progress | % completion (output / planned) |
| Status | Current status |
| Line/Machine | Gdzie produkujemy |
| Started At | Kiedy rozpoczęte |
| Actions | View, Pause (if enabled) |

### 1.3 Alerts Panel

| Alert Type | Condition | Priority |
|------------|-----------|----------|
| Material Shortage | WO material availability < 80% | 🔴 High |
| WO Delayed | scheduled_date < today AND status != Completed | 🟡 Medium |
| Quality Hold | Output LP in QA Hold status | 🟡 Medium |
| Machine Down | Machine status = Down | 🔴 High |
| Low Yield | Actual yield < 80% expected | 🟡 Medium |

### 1.4 Quick Actions

- Start WO (select from Released WOs)
- View WO Queue (upcoming scheduled)
- View Material Shortages (detail)

### 1.5 UI Components

- KPI cards grid (4-5 cards)
- Active WOs table (sortable, filterable)
- Alerts sidebar (collapsible)
- Auto-refresh with countdown indicator
- Manual refresh button

---

## Sekcja 2: WO Execution

**Route:** `/production/execution`

### 2.1 WO Lifecycle

```
Released → In Progress → [Paused] → Completed → Closed
```

**Status Transitions:**

| From | To | Action | Validation |
|------|-----|--------|------------|
| Released | In Progress | Start WO | Materials available (warning only) |
| In Progress | Paused | Pause WO | Toggle enabled |
| Paused | In Progress | Resume WO | - |
| In Progress | Completed | Complete WO | Output registered |
| Completed | Closed | Close WO | - |

### 2.2 Start WO

**Action:** Release → In Progress

**Steps:**
1. Select WO from Released list
2. Confirm line/machine assignment
3. Review materials (availability check)
4. Click "Start Production"
5. WO status → In Progress
6. started_at timestamp set

**UI:** Start WO modal with summary

### 2.3 Pause WO (if enabled)

**Action:** In Progress → Paused

**Fields:**
- Pause reason (Breakdown, Break, Material Wait, Other)
- Notes

**Resume:** Paused → In Progress (clears pause reason)

### 2.4 Operation Execution

**For each operation in wo_operations:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | Not Started → In Progress → Completed |
| `started_at` | datetime | When started |
| `completed_at` | datetime | When finished |
| `actual_duration_minutes` | number | Actual time |
| `actual_yield_percent` | decimal | Actual yield |
| `operator_id` | FK | Who executed |
| `notes` | text | Notes |

**Sequence Enforcement:**
- If setting enabled, operation N must complete before N+1 can start
- If disabled, operations can run in any order / parallel

### 2.5 Complete WO

**Action:** In Progress → Completed

**Validation:**
- All operations completed (if required)
- Output registered (at least one)
- By-products registered (if defined in BOM)

**Optional:** Auto-complete when output_qty >= planned_qty

### 2.6 UI Components

- WO execution page (full detail)
- Operations timeline (visual progress)
- Start operation button
- Complete operation modal (actual time, yield, notes)
- Pause WO modal (if enabled)
- Complete WO button

---

## Sekcja 3: Material Consumption

**Routes:** `/production/consumption` (desktop) + `/scanner/consume` (mobile)

### 3.1 Consumption Flow

**Desktop:**
1. Select WO
2. View required materials (wo_materials)
3. For each material:
   - Search/scan LP
   - Enter qty to consume
   - Confirm

**Scanner:**
1. Scan WO barcode
2. Scan LP barcode
3. Enter qty (or full LP)
4. Confirm

### 3.2 Consumption Fields

| Field | Type | Description |
|-------|------|-------------|
| `wo_material_id` | FK | Which BOM item |
| `lp_id` | FK | Which LP consumed |
| `quantity` | decimal | Qty consumed |
| `uom` | enum | Unit of measure |
| `consumed_at` | datetime | When consumed |
| `consumed_by` | FK | Who consumed |

### 3.3 Validation Rules

| Rule | Condition | Action |
|------|-----------|--------|
| LP exists | LP not found | ❌ Block |
| LP available | LP status = available | ❌ Block if not |
| Product matches | LP product = material product | ❌ Block if not |
| UoM matches | LP UoM = material UoM | ❌ Block if not |
| Qty available | LP qty >= consume qty | ❌ Block if not |
| Consume whole LP | consume_whole_lp = true | ⚠️ Force full qty |
| Over consumption | consumed > required | ⚠️ Warn (block if setting) |

### 3.4 1:1 Consumption (consume_whole_lp)

**When flag is true:**
- Must consume entire LP qty
- Cannot do partial consumption
- Scanner enforces this automatically
- Desktop shows warning and forces full qty

### 3.5 LP Updates After Consumption

| Field | Update |
|-------|--------|
| `qty` | Decrease by consumed amount |
| `status` | → 'consumed' if qty = 0 |
| `consumed_by_wo_id` | Set to current WO |

### 3.6 Genealogy Record

**Create lp_genealogy entry:**
```sql
- parent_lp_id: consumed LP
- child_lp_id: NULL (filled when output created)
- wo_id: current WO
- consumed_at: timestamp
```

### 3.7 Desktop Correction

**If operator makes mistake on scanner:**
- Manager can adjust on desktop
- Reverse consumption (add qty back to LP)
- Re-consume correct LP
- Audit trail for changes

### 3.8 UI Components

**Desktop:**
- WO consumption page
- Materials table with required vs consumed
- Add consumption modal
- LP search/scan input
- Reverse consumption button (Manager only)

**Scanner:**
- Scan WO screen
- Scan LP screen
- Qty input (number pad)
- Confirmation with material summary

---

## Sekcja 4: Output Registration

**Routes:** `/production/outputs` (desktop) + `/scanner/output` (mobile)

### 4.1 Output Flow

**Desktop:**
1. Select WO
2. Click "Register Output"
3. Enter qty produced
4. Assign QA status
5. Confirm → creates output LP

**Scanner:**
1. Scan WO barcode
2. Enter qty
3. Select QA status
4. Print LP label

### 4.2 Output Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wo_id` | FK | Yes | Work Order |
| `product_id` | FK | Yes | Output product (from WO) |
| `quantity` | decimal | Yes | Qty produced |
| `uom` | enum | Yes | Unit (from product) |
| `batch_number` | string | Yes | Batch (from WO or auto) |
| `qa_status` | enum | Configurable | Pending, Approved, Rejected, Hold |
| `location_id` | FK | Yes | Where to put output |
| `expiry_date` | date | No | Expiry (calculated from shelf_life) |
| `notes` | text | No | Notes |

### 4.3 Output LP Creation

**System creates LP:**
- `product_id` from WO
- `qty` from output
- `batch_number` from WO.wo_number or auto-generated
- `qa_status` as selected
- `location_id` from line default or selected
- `expiry_date` = today + product.shelf_life_days (if set)
- `source` = 'production'
- `wo_id` = current WO

### 4.4 Genealogy Completion

**Update lp_genealogy:**
- Set `child_lp_id` to output LP
- Links consumed materials to output

### 4.5 By-Products Registration

**For each by-product in wo_materials (is_by_product = true):**

1. Calculate expected qty: `wo_qty × yield_percent / 100`
2. Prompt to register by-product output
3. Create by-product LP (same as main output)

**Auto-create (if setting enabled):**
- System auto-creates by-product LPs with expected qty
- User can adjust if actual differs

### 4.6 Yield Calculation

| Metric | Formula |
|--------|---------|
| Output Yield | actual_output_qty / planned_qty × 100 |
| Material Yield | planned_material_qty / actual_consumed_qty × 100 |
| Operation Yield | actual_yield from each operation |

### 4.7 Multiple Outputs

- WO can have multiple output registrations
- Each creates separate LP
- Total tracked in WO: `output_qty = sum of all outputs`

### 4.8 UI Components

**Desktop:**
- WO output page
- Output history table
- Register output modal
- By-products section
- Yield summary card

**Scanner:**
- WO scan screen
- Output qty input
- QA status selector (large buttons)
- Print label button
- By-product prompts

---

## Functional Requirements

### Dashboard

**FR-PROD-001: Production Dashboard**
- **Priority:** MVP
- **Description:** Real-time KPIs and active WO monitoring
- **Acceptance Criteria:**
  - KPI cards: Orders today, units produced, avg yield, active WOs
  - Active WOs table with progress
  - Alerts panel (material shortages, delays, quality holds)
  - Auto-refresh configurable (default 30s)

### Execution

**FR-PROD-002: WO Start**
- **Priority:** MVP
- **Description:** Start production on released WO
- **Acceptance Criteria:**
  - Select from Released WOs
  - Confirm line/machine
  - Material availability check (warning)
  - Status → In Progress
  - started_at timestamp set

**FR-PROD-003: WO Pause/Resume**
- **Priority:** MVP (if toggle enabled)
- **Description:** Pause WO with reason
- **Acceptance Criteria:**
  - Toggle in Settings
  - Pause reason required
  - Resume clears pause
  - Track pause duration

**FR-PROD-004: Operation Execution**
- **Priority:** MVP
- **Description:** Track operation progress with actual time/yield
- **Acceptance Criteria:**
  - Start/complete operations
  - Track actual duration and yield
  - Sequence enforcement (optional)
  - Operator assignment

**FR-PROD-005: WO Complete**
- **Priority:** MVP
- **Description:** Complete WO with validation
- **Acceptance Criteria:**
  - Validate operations completed
  - Validate output registered
  - Auto-complete option (when output ≥ planned)
  - Status → Completed

### Consumption

**FR-PROD-006: Material Consumption (Desktop)**
- **Priority:** MVP
- **Description:** Consume materials for WO from desktop
- **Acceptance Criteria:**
  - Select WO and view required materials
  - Search/scan LP
  - Enter qty to consume
  - Validation (product, UoM, availability)
  - Update LP qty and status

**FR-PROD-007: Material Consumption (Scanner)**
- **Priority:** MVP
- **Description:** Mobile scanner workflow for consumption
- **Acceptance Criteria:**
  - Scan WO barcode
  - Scan LP barcode
  - Enter qty (or full LP)
  - Same validations as desktop

**FR-PROD-008: 1:1 Consumption Enforcement**
- **Priority:** MVP
- **Description:** Enforce full LP consumption when flag set
- **Acceptance Criteria:**
  - consume_whole_lp flag on BOM item
  - Force full LP qty consumption
  - Block partial on scanner
  - Warning on desktop

**FR-PROD-009: Consumption Correction**
- **Priority:** MVP
- **Description:** Manager can correct consumption errors
- **Acceptance Criteria:**
  - Reverse consumption (Manager only)
  - Add qty back to LP
  - Audit trail

**FR-PROD-010: Over-Consumption Control**
- **Priority:** MVP
- **Description:** Control consumption exceeding BOM requirements
- **Acceptance Criteria:**
  - Toggle in Settings
  - Warn or block over-consumption
  - Track variance

### Outputs

**FR-PROD-011: Output Registration (Desktop)**
- **Priority:** MVP
- **Description:** Register production output from desktop
- **Acceptance Criteria:**
  - Enter qty produced
  - Assign QA status
  - Create output LP
  - Update genealogy

**FR-PROD-012: Output Registration (Scanner)**
- **Priority:** MVP
- **Description:** Mobile scanner workflow for output
- **Acceptance Criteria:**
  - Scan WO barcode
  - Enter qty
  - Select QA status
  - Print LP label

**FR-PROD-013: By-Product Registration**
- **Priority:** MVP
- **Description:** Register by-products with auto-calculation
- **Acceptance Criteria:**
  - Calculate expected from yield_percent
  - Prompt to register
  - Auto-create LP option
  - Update genealogy

**FR-PROD-014: Yield Tracking**
- **Priority:** MVP
- **Description:** Calculate and display yield metrics
- **Acceptance Criteria:**
  - Output yield (actual/planned)
  - Material yield
  - Operation yield
  - Display on WO detail

**FR-PROD-015: Multiple Outputs per WO**
- **Priority:** MVP
- **Description:** Support multiple output registrations
- **Acceptance Criteria:**
  - Each registration creates LP
  - Total tracked on WO
  - History viewable

---

## Database Tables

### production_outputs
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- wo_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- lp_id UUID FK NOT NULL -- created LP
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- batch_number TEXT NOT NULL
- qa_status TEXT
- location_id UUID FK NOT NULL
- expiry_date DATE
- notes TEXT
- created_at TIMESTAMPTZ
- created_by UUID FK NOT NULL
```

### material_consumptions
```sql
- id UUID PK
- org_id UUID FK NOT NULL
- wo_id UUID FK NOT NULL
- wo_material_id UUID FK NOT NULL
- lp_id UUID FK NOT NULL
- quantity NUMERIC NOT NULL
- uom TEXT NOT NULL
- consumed_at TIMESTAMPTZ NOT NULL
- consumed_by UUID FK NOT NULL
- reversed BOOLEAN DEFAULT false
- reversed_at TIMESTAMPTZ
- reversed_by UUID FK
- notes TEXT
```

### wo_pauses
```sql
- id UUID PK
- wo_id UUID FK NOT NULL
- pause_reason TEXT NOT NULL
- paused_at TIMESTAMPTZ NOT NULL
- paused_by UUID FK NOT NULL
- resumed_at TIMESTAMPTZ
- resumed_by UUID FK
- duration_minutes INTEGER -- calculated on resume
- notes TEXT
```

### production_settings
```sql
- id UUID PK
- org_id UUID FK NOT NULL UNIQUE
- allow_pause_wo BOOLEAN DEFAULT false
- auto_complete_wo BOOLEAN DEFAULT false
- require_operation_sequence BOOLEAN DEFAULT true
- allow_over_consumption BOOLEAN DEFAULT false
- allow_partial_lp_consumption BOOLEAN DEFAULT true
- require_qa_on_output BOOLEAN DEFAULT true
- auto_create_by_product_lp BOOLEAN DEFAULT true
- dashboard_refresh_seconds INTEGER DEFAULT 30
- show_material_alerts BOOLEAN DEFAULT true
- show_delay_alerts BOOLEAN DEFAULT true
- show_quality_alerts BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

---

## API Endpoints

### Dashboard
- `GET /api/production/dashboard/kpis` - Get KPI values
- `GET /api/production/dashboard/active-wos` - Get active WOs
- `GET /api/production/dashboard/alerts` - Get alerts

### Execution
- `POST /api/production/work-orders/:id/start` - Start WO
- `POST /api/production/work-orders/:id/pause` - Pause WO
- `POST /api/production/work-orders/:id/resume` - Resume WO
- `POST /api/production/work-orders/:id/complete` - Complete WO
- `POST /api/production/work-orders/:id/operations/:opId/start` - Start operation
- `POST /api/production/work-orders/:id/operations/:opId/complete` - Complete operation

### Consumption
- `GET /api/production/work-orders/:id/materials` - Get materials with consumption status
- `POST /api/production/work-orders/:id/consume` - Consume material
- `POST /api/production/work-orders/:id/consume/reverse` - Reverse consumption
- `GET /api/production/work-orders/:id/consumption-history` - Get consumption history

### Outputs
- `GET /api/production/work-orders/:id/outputs` - Get outputs
- `POST /api/production/work-orders/:id/outputs` - Register output
- `GET /api/production/work-orders/:id/by-products` - Get by-products
- `POST /api/production/work-orders/:id/by-products` - Register by-product
- `GET /api/production/work-orders/:id/yield` - Get yield summary

### Settings
- `GET /api/production/settings` - Get production settings
- `PUT /api/production/settings` - Update production settings

---

## Scanner Workflows

### Consume Material

```
Step 1: Scan WO barcode
        ↓
Step 2: System shows required materials
        ↓
Step 3: Scan LP barcode
        ↓
Step 4: System validates (product, UoM, qty)
        ↓
Step 5: Enter qty (or tap "Full LP")
        ↓
Step 6: Confirm → consumption recorded
        ↓
Step 7: Next material or done
```

### Register Output

```
Step 1: Scan WO barcode
        ↓
Step 2: Enter qty produced
        ↓
Step 3: Select QA status (large buttons)
        ↓
Step 4: Confirm → LP created
        ↓
Step 5: Print LP label (ZPL)
        ↓
Step 6: By-product prompt (if applicable)
```

---

## Notes

- **Desktop + Scanner:** Both interfaces for consumption and output - scanner for speed, desktop for corrections
- **Pause WO:** Not standard feature - toggle in Settings for orgs that need it
- **1:1 Consumption:** Critical for allergen control - must be strictly enforced
- **Genealogy:** Every consumption and output updates lp_genealogy for traceability
- **Auto-complete:** Optional - some orgs want manual control, others want automation
- **Multiple Outputs:** Supports partial completion - output as you produce, not all at once
