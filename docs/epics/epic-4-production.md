# Epic 4: Production Execution

**Goal:** Execute work orders - start, consume materials, register outputs, track yield.

**Dependencies:** Epic 3 (Planning)
**Required by:** None (end of production flow)

**FRs Covered:** 15 (FR-PROD-001 to FR-PROD-015)
**Stories:** 20
**Effort Estimate:** 3-4 weeks

**UX Design Reference:** [ux-design-production-module.md](../ux-design-production-module.md)

---

## Story 4.1: Production Dashboard

As a **Production Manager**,
I want to see real-time production KPIs,
So that I can monitor operations.

**Acceptance Criteria:**

**Given** the user navigates to /production/dashboard
**Then** they see KPI cards:
- Orders Today: count WO completed today
- Units Produced: sum output qty today
- Avg Yield: avg (actual/planned × 100)
- Active WOs: count in progress
- Material Shortages: count with < 100% availability

**And** Active WOs table with progress
**And** Alerts panel (shortages, delays, quality holds)
**And** auto-refresh (configurable, default 30s)

**Prerequisites:** Epic 3

**Technical Notes:**
- API: GET /api/production/dashboard/kpis, /active-wos, /alerts
- Settings: dashboard_refresh_seconds

---

## Story 4.2: WO Start

As an **Operator**,
I want to start a released work order,
So that I can begin production.

**Acceptance Criteria:**

**Given** WO is in Released status
**When** clicking "Start Production"
**Then** modal shows:
- WO summary
- Confirm line/machine
- Material availability (warning only)

**When** confirming
**Then** status → In Progress
**And** started_at timestamp set
**And** WO appears in Active list

**Prerequisites:** Story 3.10

**Technical Notes:**
- API: POST /api/production/work-orders/:id/start

---

## Story 4.3: WO Pause/Resume

As an **Operator**,
I want to pause a WO when there's an issue,
So that we can track downtime.

**Acceptance Criteria:**

**Given** pause enabled in Settings
**And** WO is In Progress
**When** clicking "Pause"
**Then** modal asks for:
- Pause reason (Breakdown, Break, Material Wait, Other)
- Notes

**And** status → Paused
**And** wo_pauses record created

**When** clicking "Resume"
**Then** status → In Progress
**And** pause duration calculated

**Prerequisites:** Story 4.2

**Technical Notes:**
- Toggle in production_settings.allow_pause_wo
- API: POST /api/production/work-orders/:id/pause, /resume

---

## Story 4.4: Operation Start

As an **Operator**,
I want to start a WO operation,
So that I can track step progress.

**Acceptance Criteria:**

**Given** WO has operations from routing
**When** clicking "Start" on operation
**Then** operation status → In Progress
**And** started_at timestamp set
**And** operator_id recorded

**If** sequence enforcement enabled
**Then** can only start operation N if N-1 is completed

**Prerequisites:** Story 3.14, Story 4.2

**Technical Notes:**
- Toggle in production_settings.require_operation_sequence
- API: POST /api/production/work-orders/:id/operations/:opId/start

---

## Story 4.5: Operation Complete

As an **Operator**,
I want to complete a WO operation,
So that I can move to next step.

**Acceptance Criteria:**

**Given** operation is In Progress
**When** clicking "Complete"
**Then** modal asks for:
- actual_duration_minutes (default: calculated from started_at)
- actual_yield_percent (default: 100)
- notes

**When** confirming
**Then** operation status → Completed
**And** completed_at timestamp set

**Prerequisites:** Story 4.4

**Technical Notes:**
- API: POST /api/production/work-orders/:id/operations/:opId/complete

---

## Story 4.6: WO Complete

As an **Operator**,
I want to complete a work order,
So that I can finish production.

**Acceptance Criteria:**

**Given** WO is In Progress
**When** clicking "Complete WO"
**Then** system validates:
- All operations completed (if required)
- At least one output registered
- By-products registered (if in BOM)

**When** validation passes
**Then** status → Completed
**And** completed_at timestamp set

**Given** auto-complete enabled
**Then** WO completes when output_qty >= planned_qty

**AC: Transaction Atomicity (Sprint 0 Gap 6)**

WO completion is atomic (all-or-nothing guarantee):

**Transaction Flow:**
1. **START** database transaction
2. **VALIDATE** pre-conditions:
   - WO status = 'in_progress' or 'paused'
   - All required operations completed (if enforce_operations = true)
   - At least one output LP registered (output_qty > 0)
   - All by-products registered (if by_products exist in BOM)
   - No pending consumption corrections
3. **UPDATE** work_orders.status → 'completed'
4. **UPDATE** work_orders.completed_at → current_timestamp
5. **UPDATE** work_orders.completed_by_user_id → current_user
6. **UPDATE** all wo_operations.status → 'completed' (if any pending)
7. **UPDATE** license_plates.status → 'available' for all output LPs (from 'in_production')
8. **INSERT** genealogy_tree records linking output LPs to consumed input LPs (Story 4.19)
9. **COMMIT** transaction

**Rollback Scenarios:**

**If ANY step fails** (validation error, FK violation, update conflict):
- Transaction **ROLLBACK**
- **No partial updates** (WO status unchanged, operations unchanged, LP status unchanged, no genealogy records)
- **Error message** displayed to user with specific failure reason

**Error Examples:**

| Failure Point | Error Message |
|---------------|---------------|
| WO already completed | "Cannot complete WO: Work Order #1234 is already completed." |
| Operations not done | "Cannot complete WO: 2 operations are not completed (Cut, Mix). Complete all operations first." |
| No output registered | "Cannot complete WO: No output has been registered. Register at least one output LP before completing." |
| Missing by-products | "Cannot complete WO: By-product 'Scrap Metal' not registered. Register all by-products per BOM." |
| FK validation fails | "Cannot complete WO: Related operation no longer exists. Please refresh and try again." |
| Concurrent update | "Cannot complete WO: Another user modified this WO. Please refresh and try again." |

**Concurrency Handling:**
- Use row-level lock on work_orders during completion (SELECT ... FOR UPDATE)
- Prevent duplicate completion if multiple operators click "Complete" simultaneously
- If concurrent completion detected: "WO #1234 is already being completed. Please refresh."

**Data Integrity Guarantees:**
- ✅ WO completed → All required operations completed
- ✅ WO completed → At least one output LP exists
- ✅ WO completed → All by-products registered (if BOM requires)
- ✅ WO completed → Genealogy tree created linking outputs to inputs
- ❌ NEVER: WO completed without output LPs
- ❌ NEVER: WO completed with incomplete operations (if enforced)
- ❌ NEVER: Output LPs in 'in_production' status after WO completion

**Reference:** AC Template Checklist (.bmad/templates/ac-template-checklist.md § 6)

**Prerequisites:** Story 4.2

**Technical Notes:**
- Toggle in production_settings.auto_complete_wo
- API: POST /api/production/work-orders/:id/complete

---

## Story 4.7: Material Consumption (Desktop)

As an **Operator**,
I want to consume materials from desktop,
So that I can track what was used.

**Acceptance Criteria:**

**Given** the user views WO consumption page
**Then** they see materials table with: Product, Required Qty, Consumed Qty, Remaining

**When** clicking "Consume" on a material
**Then** modal opens:
- LP search/scan input
- System validates: product, UoM, qty available
- Enter qty to consume

**When** confirming
**Then** consumption recorded
**And** LP qty decreased
**And** genealogy record created

**Prerequisites:** Story 3.12, Epic 5

**Technical Notes:**
- API: POST /api/production/work-orders/:id/consume

---

## Story 4.8: Material Consumption (Scanner)

As an **Operator**,
I want to consume materials via scanner,
So that I can work efficiently on the floor.

**Acceptance Criteria:**

**Given** the user navigates to /scanner/consume
**When** scanning WO barcode
**Then** system shows required materials

**When** scanning LP barcode
**Then** system validates:
- LP exists and available
- Product matches material
- UoM matches

**When** entering qty (or "Full LP")
**Then** consumption confirmed
**And** moves to next material

**Prerequisites:** Story 4.7

**Technical Notes:**
- Same API as desktop
- Touch-optimized UI

---

## Story 4.9: 1:1 Consumption Enforcement

As a **System**,
I want to enforce full LP consumption when flagged,
So that allergen control is maintained.

**Acceptance Criteria:**

**Given** material has consume_whole_lp = true
**When** operator tries to consume partial
**Then** system blocks and shows error

**When** consuming via scanner
**Then** qty input disabled, shows "Full LP: X units"

**When** consuming via desktop
**Then** qty field shows full LP qty, cannot change

**Prerequisites:** Story 4.7, Story 4.8

**Technical Notes:**
- consume_whole_lp flag from wo_materials (copied from BOM)

---

## Story 4.10: Consumption Correction

As a **Manager**,
I want to correct consumption errors,
So that inventory stays accurate.

**Acceptance Criteria:**

**Given** a consumption was recorded incorrectly
**When** Manager clicks "Reverse"
**Then** modal confirms reversal

**When** confirming
**Then** consumption marked as reversed
**And** LP qty restored
**And** reversed_by and reversed_at recorded
**And** audit trail entry created

**Only** Manager role can reverse

**Prerequisites:** Story 4.7

**Technical Notes:**
- Don't delete record, mark reversed = true
- API: POST /api/production/work-orders/:id/consume/reverse

---

## Story 4.11: Over-Consumption Control

As an **Admin**,
I want to control over-consumption,
So that we don't waste materials.

**Acceptance Criteria:**

**Given** over-consumption control enabled
**When** consumed_qty > required_qty for a material
**Then** system shows warning (or blocks if configured)

**Given** control disabled
**Then** operator can consume unlimited

**And** variance tracked: consumed - required

**AC: Transaction Atomicity (Sprint 0 Gap 6)**

Material consumption (including over-consumption validation) is atomic:

**Transaction Flow:**
1. **START** database transaction
2. **VALIDATE** pre-conditions:
   - WO exists and status = 'in_progress'
   - Material exists in WO BOM snapshot
   - LP exists and has sufficient qty
   - LP qa_status allows consumption (not 'hold', optionally allow 'pending')
3. **CALCULATE** total consumed for material (SUM existing consumption + new qty)
4. **CHECK** over-consumption limit:
   - If allow_over_consumption = false AND total_consumed > required_qty:
     - **ROLLBACK** transaction
     - Error: "Cannot consume: Over-consumption not allowed. Required: {required}, Already consumed: {consumed}, Requested: {new_qty}."
   - If allow_over_consumption = true AND total_consumed > required_qty:
     - Log warning but continue
5. **INSERT** wo_consumption record (wo_id, material_id, lp_id, qty, user_id, timestamp)
6. **UPDATE** license_plates.current_qty -= consumed_qty
7. **UPDATE** license_plates.status → 'consumed' (if current_qty = 0)
8. **INSERT** lp_movements record (type = 'consumption', wo_id, lp_id, qty, from_location → WO location)
9. **UPDATE** wo_materials.consumed_qty += new_qty
10. **CALCULATE** variance: wo_materials.consumed_qty - wo_materials.required_qty
11. **COMMIT** transaction

**Rollback Scenarios:**

**If ANY step fails** (validation error, FK violation, insufficient stock):
- Transaction **ROLLBACK**
- **No partial updates** (no consumption record, LP qty unchanged, LP status unchanged, no movements, WO materials unchanged)
- **Error message** displayed to user with specific failure reason

**Error Examples:**

| Failure Point | Error Message |
|---------------|---------------|
| WO not in progress | "Cannot consume: Work Order #1234 is not in progress (status: Completed)." |
| Material not in BOM | "Cannot consume: Material 'Flour 50kg' is not part of WO #1234 BOM. Verify BOM snapshot." |
| LP insufficient qty | "Cannot consume: License Plate LP-001234 has 10 kg available, requested 15 kg. Reduce quantity or select different LP." |
| LP on QA hold | "Cannot consume: License Plate LP-001234 is on QA Hold. Release from hold before consuming." |
| Over-consumption blocked | "Cannot consume: Over-consumption not allowed. Required: 100 kg, Already consumed: 95 kg, Requested: 10 kg (total would be 105 kg). Maximum allowed: 5 kg more." |
| Concurrent consumption | "Cannot consume: License Plate LP-001234 was modified by another user. Please refresh and try again." |
| FK validation fails | "Cannot consume: Work Order no longer exists. Please refresh page." |

**Concurrency Handling:**
- Use row-level locks on license_plates, wo_materials during consumption (SELECT ... FOR UPDATE)
- Prevent negative LP quantities (CHECK constraint: current_qty >= 0)
- Prevent duplicate consumption if multiple operators consume same LP simultaneously
- If concurrent update detected: "LP qty changed by another user. Please refresh."

**Data Integrity Guarantees:**
- ✅ Consumption recorded → LP qty decreased
- ✅ Consumption recorded → WO materials consumed_qty updated
- ✅ Consumption recorded → LP movement logged
- ✅ Over-consumption blocked → No consumption record created
- ✅ LP qty = 0 → LP status = 'consumed'
- ❌ NEVER: Consumption record without LP qty decrease
- ❌ NEVER: LP qty < 0 (negative stock)
- ❌ NEVER: Over-consumption when blocked in settings
- ❌ NEVER: Consumption from QA Hold LP (unless explicitly allowed)

**Over-Consumption Warning (when allowed):**
- If allow_over_consumption = true AND total_consumed > required_qty:
  - Display warning banner: "⚠️ Over-consumption detected: +{variance} kg over required amount."
  - Log variance to wo_materials.variance field
  - Continue with transaction (do not block)
  - Notify supervisor via dashboard alert

**Reference:** AC Template Checklist (.bmad/templates/ac-template-checklist.md § 6)

**Prerequisites:** Story 4.7

**Technical Notes:**
- Toggle in production_settings.allow_over_consumption
- Track variance for reporting

---

## Story 4.12: Output Registration (Desktop)

As an **Operator**,
I want to register production output,
So that finished goods are tracked.

**Acceptance Criteria:**

**Given** WO is In Progress
**When** clicking "Register Output"
**Then** modal opens with:
- quantity (required)
- qa_status (if required in Settings)
- location_id (default from line)
- notes

**When** confirming
**Then** output LP created:
- product from WO
- batch_number from WO.wo_number
- expiry_date calculated from shelf_life

**And** wo.output_qty updated
**And** genealogy completed (consumed LPs → output LP)

**Prerequisites:** Story 4.6

**Technical Notes:**
- API: POST /api/production/work-orders/:id/outputs

---

## Story 4.13: Output Registration (Scanner)

As an **Operator**,
I want to register output via scanner,
So that I can work efficiently.

**Acceptance Criteria:**

**Given** the user navigates to /scanner/output
**When** scanning WO barcode
**Then** shows WO summary

**When** entering qty
**And** selecting QA status (large buttons)
**Then** output registered
**And** LP label printed (ZPL to printer)

**When** by-products exist
**Then** prompts to register each

**Prerequisites:** Story 4.12

**Technical Notes:**
- Same API as desktop
- ZPL label format defined in Settings

---

## Story 4.14: By-Product Registration

As an **Operator**,
I want to register by-products,
So that all outputs are tracked.

**Acceptance Criteria:**

**Given** WO has by-products in wo_materials
**When** registering main output
**Then** system prompts for each by-product

**And** shows expected qty: wo_qty × yield_percent / 100
**And** operator can adjust actual qty

**When** confirming
**Then** by-product LP created
**And** linked to same genealogy

**Given** auto-create enabled
**Then** system creates by-product LPs automatically

**Prerequisites:** Story 4.12

**Technical Notes:**
- Toggle in production_settings.auto_create_by_product_lp
- API: POST /api/production/work-orders/:id/by-products

---

## Story 4.15: Yield Tracking

As a **Production Manager**,
I want to see yield metrics,
So that I can identify efficiency issues.

**Acceptance Criteria:**

**Given** viewing WO detail
**Then** see yield summary:
- Output Yield: actual_output / planned × 100%
- Material Yield: planned_material / consumed × 100%
- Operation Yields: from each operation

**And** color coding:
- 🟢 Green: >= 95%
- 🟡 Yellow: 80-95%
- 🔴 Red: < 80%

**Prerequisites:** Story 4.12

**Technical Notes:**
- API: GET /api/production/work-orders/:id/yield

---

## Story 4.16: Multiple Outputs per WO

As an **Operator**,
I want to register multiple outputs,
So that I can track partial production.

**Acceptance Criteria:**

**Given** WO allows multiple outputs
**When** registering output
**Then** each creates separate LP

**And** WO.output_qty = sum of all outputs
**And** output history shown in WO detail

**When** total output >= planned
**Then** system prompts to complete WO (or auto-completes)

**Prerequisites:** Story 4.12

**Technical Notes:**
- production_outputs table holds all outputs per WO

---

## Story 4.17: Production Settings Configuration

As an **Admin**,
I want to configure Production module settings,
So that execution matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/production-execution
**Then** can configure:
- allow_pause_wo
- auto_complete_wo
- require_operation_sequence
- allow_over_consumption
- allow_partial_lp_consumption
- require_qa_on_output
- auto_create_by_product_lp
- Dashboard: refresh_seconds, alert toggles

**Prerequisites:** Epic 1

**Technical Notes:**
- production_settings table
- API: GET/PUT /api/production/settings

---

## Story 4.18: LP Updates After Consumption

As a **System**,
I want to update LP after consumption,
So that inventory is accurate.

**Acceptance Criteria:**

**Given** LP is consumed
**When** consumption recorded
**Then** LP.qty decreased by consumed amount

**When** LP.qty = 0
**Then** LP.status → 'consumed'
**And** LP.consumed_by_wo_id = current WO

**Prerequisites:** Story 4.7

**Technical Notes:**
- Atomic transaction: consumption record + LP update

---

## Story 4.19: Genealogy Record Creation

As a **System**,
I want to record genealogy links,
So that traceability is maintained.

**Acceptance Criteria:**

**Given** material is consumed
**Then** lp_genealogy entry created:
- parent_lp_id = consumed LP
- child_lp_id = NULL
- wo_id = current WO
- consumed_at = timestamp

**Given** output is registered
**Then** update genealogy:
- child_lp_id = output LP

**Prerequisites:** Story 4.7, Story 4.12

**Technical Notes:**
- Links consumed materials to outputs
- Enables forward/backward tracing

---

## Story 4.20: Operation Timeline View

As a **Production Manager**,
I want to see operations as visual timeline,
So that I can track progress at a glance.

**Acceptance Criteria:**

**Given** viewing WO with operations
**Then** see timeline visualization:
- Each operation as segment
- Color by status (gray=not started, blue=in progress, green=completed)
- Actual vs expected duration

**And** can click segment for details

**Prerequisites:** Story 4.4, Story 4.5

**Technical Notes:**
- Use CSS/SVG for timeline
- No external library needed

---

## FR Coverage Matrix

This section maps all Functional Requirements from the Production Module (PRD) to their implementing stories, ensuring 100% traceability.

| FR ID | FR Title | Story IDs | Status | Notes |
|-------|----------|-----------|--------|-------|
| FR-PROD-001 | Production Dashboard | 4.1 | ✅ Covered | Real-time WO status, OEE metrics |
| FR-PROD-002 | WO Start | 4.2 | ✅ Covered | Start production, assign operators |
| FR-PROD-003 | WO Pause/Resume | 4.3 | ✅ Covered | Pause/resume with reason codes |
| FR-PROD-004 | Operation Execution | 4.4, 4.5 | ✅ Covered | Start/complete operations |
| FR-PROD-005 | WO Complete | 4.6 | ✅ Covered | Complete WO (Sprint 0 Gap 6: Atomicity AC) |
| FR-PROD-006 | Material Consumption (Desktop) | 4.7 | ✅ Covered | Desktop UI for material consumption |
| FR-PROD-007 | Material Consumption (Scanner) | 4.8 | ✅ Covered | Scanner PWA for barcode scanning |
| FR-PROD-008 | 1:1 Consumption Enforcement | 4.9 | ✅ Covered | Enforce 1:1 LP consumption |
| FR-PROD-009 | Consumption Correction | 4.10 | ✅ Covered | Correct consumption errors |
| FR-PROD-010 | Over-Consumption Control | 4.11 | ✅ Covered | Prevent over-consumption (Sprint 0 Gap 6: Atomicity AC) |
| FR-PROD-011 | Output Registration (Desktop) | 4.12 | ✅ Covered | Desktop UI for output registration |
| FR-PROD-012 | Output Registration (Scanner) | 4.13 | ✅ Covered | Scanner PWA for output LPs |
| FR-PROD-013 | By-Product Registration | 4.14 | ✅ Covered | Register by-products |
| FR-PROD-014 | Yield Tracking | 4.15 | ✅ Covered | Calculate yield % |
| FR-PROD-015 | Multiple Outputs per WO | 4.16 | ✅ Covered | Multiple output LPs per WO |

**Coverage Summary:**
- **Total FRs:** 15 (all P0)
- **P0 FRs Covered:** 15/15 (100%)
- **Total Stories:** 20 (includes technical stories: 4.17-4.19, UX: 4.20)

**Validation:**
- ✅ All P0 functional requirements have at least one implementing story
- ✅ No orphaned stories (all stories trace back to FRs or technical requirements)
- ✅ FR-PROD-004 split into 2 stories (Operation Start vs Complete)
- ✅ Stories 4.6, 4.11 flagged for Sprint 0 Gap 6 (Transaction Atomicity ACs)
- ✅ Story 4.19 (Genealogy) critical for FDA compliance

**Reverse Traceability (Story → FR):**
- Story 4.1 → FR-PROD-001
- Story 4.2 → FR-PROD-002
- Story 4.3 → FR-PROD-003
- Story 4.4 → FR-PROD-004
- Story 4.5 → FR-PROD-004
- Story 4.6 → FR-PROD-005 (Sprint 0 Gap 6: Add Transaction Atomicity AC)
- Story 4.7 → FR-PROD-006
- Story 4.8 → FR-PROD-007
- Story 4.9 → FR-PROD-008
- Story 4.10 → FR-PROD-009
- Story 4.11 → FR-PROD-010 (Sprint 0 Gap 6: Add Transaction Atomicity AC)
- Story 4.12 → FR-PROD-011
- Story 4.13 → FR-PROD-012
- Story 4.14 → FR-PROD-013
- Story 4.15 → FR-PROD-014
- Story 4.16 → FR-PROD-015
- Story 4.17 → Technical (Production Settings Configuration)
- Story 4.18 → Technical (LP stock updates after consumption)
- Story 4.19 → Technical (Genealogy tree creation - FDA compliance)
- Story 4.20 → UX Design (Operation Timeline View)

**Sprint 0 Gap References:**
- **Gap 6 (Transaction Atomicity):** Stories 4.6, 4.11 require enhanced ACs for rollback handling

---
