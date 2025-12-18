# Production Module - PRD

**Status:** In Progress (Track A DONE, Track B/C IN PROGRESS)
**Priority:** P0 Core Module
**Version:** 2.1 (with OEE tracking and testable AC)

---

## Overview

Production module manages work order execution from start to completion, including material consumption, output registration, operations tracking, OEE monitoring, and production analytics.

**Scope:**
- Work Order lifecycle (start, pause, resume, complete)
- Material consumption (LP-based with reservations)
- Output registration (main + by-products)
- Operations tracking (sequence, yield, duration)
- Production Dashboard (KPIs, active WOs, alerts)
- OEE tracking (Availability, Performance, Quality)
- Downtime management and machine integration

**Dependencies:**
- Settings (lines, machines)
- Technical (products, BOMs)
- Planning (work orders)
- Warehouse (LPs, locations)
- Quality (QA statuses)

---

## UI Routes

| Route | Purpose |
|-------|---------|
| `/production/dashboard` | KPIs, active WOs, OEE metrics, alerts |
| `/production/execution` | WO execution, operations tracking |
| `/production/consumption` | Material consumption (desktop) |
| `/production/outputs` | Output registration (desktop) |
| `/production/oee` | OEE analytics and downtime analysis |
| `/scanner/consume` | Material consumption (mobile) |
| `/scanner/output` | Output registration (mobile) |

---

## Functional Requirements

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| FR-PROD-001 | Production Dashboard | P0 | MVP |
| FR-PROD-002 | WO Start | P0 | MVP |
| FR-PROD-003 | WO Pause/Resume | P0 | MVP |
| FR-PROD-004 | Operation Start/Complete | P0 | MVP |
| FR-PROD-005 | WO Complete | P0 | MVP |
| FR-PROD-006 | Material Consumption (Desktop) | P0 | MVP |
| FR-PROD-007 | Material Consumption (Scanner) | P0 | MVP |
| FR-PROD-008 | 1:1 Consumption Enforcement | P0 | MVP |
| FR-PROD-009 | Consumption Correction | P0 | MVP |
| FR-PROD-010 | Over-Consumption Control | P0 | MVP |
| FR-PROD-011 | Output Registration (Desktop) | P0 | MVP |
| FR-PROD-012 | Output Registration (Scanner) | P0 | MVP |
| FR-PROD-013 | By-Product Registration | P0 | MVP |
| FR-PROD-014 | Yield Tracking | P0 | MVP |
| FR-PROD-015 | Multiple Outputs per WO | P0 | MVP |
| FR-PROD-016 | Material Reservations | P0 | MVP |
| FR-PROD-017 | Production Settings | P0 | MVP |
| FR-PROD-018 | OEE Calculation | P1 | Phase 2 |
| FR-PROD-019 | Downtime Tracking | P1 | Phase 2 |
| FR-PROD-020 | Machine Integration | P1 | Phase 2 |
| FR-PROD-021 | Shift Management | P1 | Phase 2 |
| FR-PROD-022a | OEE Summary Report | P1 | Phase 2 |
| FR-PROD-022b | Downtime Analysis Report | P1 | Phase 2 |
| FR-PROD-022c | Yield Analysis Report | P1 | Phase 2 |
| FR-PROD-022d | Production Output Report | P1 | Phase 2 |
| FR-PROD-022e | Material Consumption Report | P1 | Phase 2 |
| FR-PROD-022f | Quality Rate Report | P1 | Phase 2 |
| FR-PROD-022g | WO Completion Report | P1 | Phase 2 |

---

## FR Details

### FR-PROD-001: Production Dashboard

**Description:** Real-time production monitoring with KPIs, active WOs, and alerts

**KPI Cards:**
| KPI | Calculation | Refresh |
|-----|-------------|---------|
| Orders Today | COUNT(wo WHERE status=Completed AND completed_at=today) | Real-time |
| Units Produced | SUM(output.qty WHERE created_at=today) | Real-time |
| Avg Yield | AVG(actual_qty / planned_qty * 100) for today | Real-time |
| Active WOs | COUNT(wo WHERE status='In Progress') | Real-time |
| Material Shortages | COUNT(wo WHERE material_availability < 100%) | Real-time |
| OEE Today | AVG(oee_percent) for today's shifts | Real-time |

**Active WOs Table:**
- Columns: WO Number, Product, Qty (Planned/Completed), Progress %, Status, Line/Machine, Started At
- Actions: View detail, Pause (if enabled), Complete
- Filters: Line, Product, Status
- Sort: Started At DESC

**Alerts Panel:**
| Alert Type | Condition | Priority |
|------------|-----------|----------|
| Material Shortage | material_availability < 80% | High |
| WO Delayed | scheduled_date < today AND status != Completed | Medium |
| Quality Hold | output LP in QA Hold | Medium |
| Machine Down | machine_status = Down | High |
| Low Yield | actual_yield < 80% expected | Medium |
| OEE Below Target | oee < target_oee | Medium |

**Components:**
- Auto-refresh (configurable interval)
- Manual refresh button
- Export WO list to CSV
- Quick actions: Start WO, View Queue

**AC:**
- GIVEN user navigates to `/production/dashboard`, WHEN page loads, THEN all 6 KPI cards display within 2 seconds
- GIVEN dashboard auto-refresh is set to 30 seconds, WHEN 30 seconds elapse, THEN all KPIs update without page reload
- GIVEN user clicks "Manual Refresh" button, WHEN clicked, THEN KPIs update within 500ms
- GIVEN 5 WOs are in "In Progress" status, WHEN user views Active WOs table, THEN all 5 WOs display with correct columns (WO Number, Product, Qty, Progress %, Status, Line, Started At)
- GIVEN WO has material_availability < 80%, WHEN dashboard loads, THEN "Material Shortage" alert displays in High priority section
- GIVEN WO has scheduled_date < today AND status != Completed, WHEN dashboard loads, THEN "WO Delayed" alert displays
- GIVEN user clicks "Export CSV", WHEN export completes, THEN CSV file downloads with all visible WO columns
- GIVEN user applies filter "Line = Line A", WHEN filter applied, THEN only WOs assigned to Line A display
- GIVEN no active WOs exist, WHEN dashboard loads, THEN "No active work orders" message displays

---

### FR-PROD-002: WO Start

**Description:** Transition WO from Released to In Progress

**Workflow:**
1. Select WO from Released list
2. Confirm/assign line and machine
3. Material availability check (warning if < 100%)
4. Click "Start Production"
5. System sets status = 'In Progress', started_at = now
6. Create material reservations (if enabled)

**Validation:**
- WO status must be 'Released'
- Line/machine must be available
- Material availability checked (warning only)

**UI:** Start WO modal with WO summary, materials, and line assignment

**AC:**
- GIVEN WO has status "Released", WHEN user clicks "Start Production", THEN WO status changes to "In Progress" within 1 second
- GIVEN WO has status "Released", WHEN user clicks "Start Production", THEN started_at timestamp is set to current time (+/- 1 second)
- GIVEN WO has status "Draft", WHEN user attempts to start WO, THEN error message "WO must be Released to start" displays
- GIVEN WO has status "In Progress", WHEN user attempts to start WO, THEN "Start" button is disabled
- GIVEN material availability is 80%, WHEN user clicks "Start Production", THEN warning message "Material availability is 80%" displays but start proceeds
- GIVEN material availability is 100%, WHEN user clicks "Start Production", THEN no warning message displays
- GIVEN production line is already running another WO, WHEN user selects that line, THEN error message "Line already in use by WO-XXX" displays
- GIVEN enable_material_reservations = true, WHEN WO starts, THEN material reservations are created for all required materials
- GIVEN enable_material_reservations = false, WHEN WO starts, THEN no material reservations are created

---

### FR-PROD-003: WO Pause/Resume

**Description:** Pause active WO with reason tracking

**Pause Workflow:**
1. Click "Pause" on In Progress WO
2. Select pause reason (required)
3. Add notes (optional)
4. Confirm → status = 'Paused', paused_at = now

**Pause Reasons:**
- Machine Breakdown
- Material Shortage
- Break/Lunch
- Quality Issue
- Other (specify)

**Resume Workflow:**
1. Click "Resume" on Paused WO
2. Confirm → status = 'In Progress', resumed_at = now
3. Calculate pause duration (resumed_at - paused_at)

**Settings:**
- `allow_pause_wo` toggle (default: OFF)
- Only show Pause button if enabled

**UI:** Pause modal with reason dropdown and notes field

**AC:**
- GIVEN allow_pause_wo = true AND WO status = "In Progress", WHEN user views WO, THEN "Pause" button is visible
- GIVEN allow_pause_wo = false AND WO status = "In Progress", WHEN user views WO, THEN "Pause" button is NOT visible
- GIVEN WO status = "In Progress", WHEN user clicks "Pause" and selects reason "Machine Breakdown", THEN WO status changes to "Paused" and paused_at is set
- GIVEN user clicks "Pause", WHEN no reason is selected and user clicks "Confirm", THEN validation error "Pause reason is required" displays
- GIVEN WO status = "Paused", WHEN user clicks "Resume", THEN WO status changes to "In Progress" and resumed_at is set
- GIVEN WO was paused for 15 minutes, WHEN WO is resumed, THEN wo_pauses.duration_minutes = 15 (+/- 1 minute)
- GIVEN WO status = "Completed", WHEN user attempts to pause WO, THEN "Pause" button is disabled
- GIVEN WO status = "Paused", WHEN user clicks "Resume", THEN resume confirmation modal displays

---

### FR-PROD-004: Operation Start/Complete

**Description:** Track operation execution with actual time and yield

**Operation Fields:**
| Field | Type | Description |
|-------|------|-------------|
| status | enum | Not Started / In Progress / Completed |
| started_at | timestamp | Operation start time |
| completed_at | timestamp | Operation completion time |
| actual_duration_minutes | integer | Calculated on complete |
| actual_yield_percent | decimal | Actual yield |
| operator_id | uuid | Who executed |
| notes | text | Notes |

**Start Operation:**
- Validate sequence (if required): previous operation must be completed
- Set status = 'In Progress', started_at = now
- Assign operator (current user)

**Complete Operation:**
- Enter actual yield % (default: 100%)
- Add notes (optional)
- Set status = 'Completed', completed_at = now
- Calculate duration: (completed_at - started_at) in minutes

**Sequence Enforcement:**
- If `require_operation_sequence` = true: operations must complete in order
- If false: operations can run in parallel

**UI:** Operations timeline with start/complete buttons, yield input modal

**AC:**
- GIVEN operation status = "Not Started", WHEN user clicks "Start Operation", THEN status changes to "In Progress" and started_at is set
- GIVEN operation status = "In Progress", WHEN user clicks "Complete" with yield = 95%, THEN status changes to "Completed" and actual_yield_percent = 95
- GIVEN operation ran for 45 minutes, WHEN operation completes, THEN actual_duration_minutes = 45 (+/- 1 minute)
- GIVEN require_operation_sequence = true AND Operation 1 status = "Not Started", WHEN user attempts to start Operation 2, THEN error "Previous operation must be completed first" displays
- GIVEN require_operation_sequence = false AND Operation 1 status = "Not Started", WHEN user starts Operation 2, THEN Operation 2 starts successfully
- GIVEN operation completes, WHEN completion recorded, THEN operator_id is set to current user's ID
- GIVEN user enters yield = 150%, WHEN submitting, THEN validation error "Yield cannot exceed 100%" displays
- GIVEN user enters yield = -5%, WHEN submitting, THEN validation error "Yield must be positive" displays
- GIVEN operation status = "Completed", WHEN user views operation, THEN "Start" and "Complete" buttons are disabled

---

### FR-PROD-005: WO Complete

**Description:** Complete WO with validation

**Validation:**
- At least one output registered
- All required operations completed (if sequence enforced)
- By-products registered (if defined in BOM)

**Auto-Complete:**
- If `auto_complete_wo` = true AND total_output_qty >= planned_qty
- System auto-completes WO

**Manual Complete:**
1. Click "Complete WO"
2. System validates requirements
3. Confirm → status = 'Completed', completed_at = now

**Post-Completion:**
- Calculate final yield
- Update OEE metrics
- Release unused material reservations
- Close genealogy records

**UI:** Complete WO button with validation summary modal

**AC:**
- GIVEN WO has at least 1 output AND all operations completed, WHEN user clicks "Complete WO", THEN WO status changes to "Completed" within 1 second
- GIVEN WO has 0 outputs registered, WHEN user clicks "Complete WO", THEN error "At least one output must be registered" displays
- GIVEN require_operation_sequence = true AND Operation 2 status = "Not Started", WHEN user clicks "Complete WO", THEN error "All operations must be completed" displays
- GIVEN BOM defines by-product AND by-product not registered, WHEN user clicks "Complete WO", THEN warning "By-product not registered. Continue?" displays
- GIVEN auto_complete_wo = true AND output_qty >= planned_qty, WHEN output is registered, THEN WO auto-completes without user action
- GIVEN auto_complete_wo = false AND output_qty >= planned_qty, WHEN output is registered, THEN WO remains "In Progress"
- GIVEN WO completes with unused reservations, WHEN completion recorded, THEN all reservations for this WO are released
- GIVEN WO completes, WHEN completion recorded, THEN completed_at timestamp is set to current time
- GIVEN WO status = "Completed", WHEN user views WO, THEN "Complete WO" button is disabled

---

### FR-PROD-006: Material Consumption (Desktop)

**Description:** Consume materials from desktop interface

**Workflow:**
1. Select WO
2. View required materials (wo_materials table)
3. For each material:
   - Click "Consume"
   - Search or scan LP barcode
   - Enter qty to consume
   - Validate and confirm

**Validation:**
| Rule | Check | Action |
|------|-------|--------|
| LP exists | LP found in system | Block if not found |
| LP available | status = 'available' | Block if not available |
| Product match | LP.product_id = material.product_id | Block if mismatch |
| UoM match | LP.uom = material.uom | Block if mismatch |
| Qty available | LP.qty >= consume_qty | Block if insufficient |
| Over-consumption | consumed > required | Warn or block (setting) |
| 1:1 consumption | consume_whole_lp = true | Force full LP qty |

**LP Updates:**
- Decrease LP.qty by consumed amount
- If LP.qty = 0: set status = 'consumed'
- Set consumed_by_wo_id = current WO

**Genealogy:**
- Create lp_genealogy record (parent_lp = consumed LP, wo_id = current WO)
- child_lp_id filled when output registered

**UI:**
- Materials table with required vs consumed progress
- Add consumption modal with LP search
- Consumption history table

**AC:**
- GIVEN LP-001 has qty = 100 kg, WHEN user consumes 40 kg, THEN LP-001.qty = 60 kg
- GIVEN LP-001 has qty = 50 kg, WHEN user consumes 50 kg, THEN LP-001.status = "consumed"
- GIVEN LP does not exist in system, WHEN user enters LP barcode, THEN error "LP not found" displays within 500ms
- GIVEN LP status = "consumed", WHEN user attempts to consume from LP, THEN error "LP is not available (status: consumed)" displays
- GIVEN LP has product_id = PROD-A AND material requires PROD-B, WHEN user attempts consumption, THEN error "Product mismatch: LP contains PROD-A, material requires PROD-B" displays
- GIVEN LP has UoM = "kg" AND material has UoM = "L", WHEN user attempts consumption, THEN error "Unit of measure mismatch: LP is kg, material requires L" displays
- GIVEN LP.qty = 30 AND user enters consume_qty = 50, WHEN user submits, THEN error "Insufficient quantity: LP has 30, requested 50" displays
- GIVEN consumption completes, WHEN recorded, THEN lp_genealogy record created with parent_lp_id = consumed LP ID
- GIVEN material shows "Required: 100 kg, Consumed: 60 kg", WHEN user views materials table, THEN progress bar shows 60%

---

### FR-PROD-007: Material Consumption (Scanner)

**Description:** Mobile scanner workflow for fast consumption

**Workflow:**
1. Scan WO barcode
2. System shows required materials
3. Scan LP barcode
4. System validates (same as desktop)
5. Enter qty or tap "Full LP"
6. Confirm → consumption recorded
7. Repeat for next material

**Scanner-Specific:**
- Large touch targets
- Number pad for qty input
- Visual feedback (green check, red X)
- Audio feedback on scan success/error
- "Full LP" quick action for 1:1 consumption

**UI:**
- WO scan screen
- LP scan screen
- Qty input screen (number pad)
- Confirmation screen with material summary

**AC:**
- GIVEN valid WO barcode scanned, WHEN barcode processed, THEN WO info displays within 500ms with required materials list
- GIVEN invalid WO barcode scanned, WHEN barcode processed, THEN red X displays with audio error beep and message "Invalid WO barcode"
- GIVEN valid LP barcode scanned, WHEN barcode processed, THEN green check displays with audio success tone
- GIVEN user taps "Full LP" button, WHEN LP.qty = 25, THEN qty input auto-fills with 25
- GIVEN touch target for "Confirm" button, WHEN rendered, THEN button is at least 48x48 pixels
- GIVEN consumption completes successfully, WHEN confirmed, THEN green check animation displays for 1 second
- GIVEN consumption fails validation, WHEN confirmed, THEN red X animation displays with error message
- GIVEN number pad displayed, WHEN user enters "50.5", THEN decimal input is accepted
- GIVEN material consumption completes, WHEN user views screen, THEN "Next Material" and "Done" buttons display

---

### FR-PROD-008: 1:1 Consumption Enforcement

**Description:** Enforce full LP consumption for allergen control

**BOM Flag:** `consume_whole_lp` (boolean on wo_materials)

**When true:**
- User MUST consume entire LP qty
- Cannot do partial consumption
- Scanner auto-fills full qty
- Desktop shows warning if user tries partial

**Use Case:**
- Allergen-sensitive materials
- Traceability requirements
- Prevent cross-contamination

**Validation:**
- If consume_whole_lp = true AND consume_qty != LP.qty: BLOCK

**AC:**
- GIVEN consume_whole_lp = true AND LP.qty = 100, WHEN user enters consume_qty = 50, THEN error "Full LP consumption required. LP quantity is 100" displays
- GIVEN consume_whole_lp = true AND LP.qty = 100, WHEN user enters consume_qty = 100, THEN consumption proceeds successfully
- GIVEN consume_whole_lp = true on scanner, WHEN LP scanned, THEN qty input is pre-filled with LP.qty and input field is read-only
- GIVEN consume_whole_lp = false AND LP.qty = 100, WHEN user enters consume_qty = 50, THEN partial consumption proceeds successfully
- GIVEN consume_whole_lp = true, WHEN material displays in list, THEN "Full LP Required" badge displays next to material name
- GIVEN consume_whole_lp = true on desktop, WHEN user attempts to edit qty, THEN warning "This material requires full LP consumption" displays

---

### FR-PROD-009: Consumption Correction

**Description:** Manager can reverse incorrect consumptions

**Use Case:**
- Scanner operator scanned wrong LP
- Wrong qty entered
- Need to re-consume from different LP

**Workflow:**
1. Manager views consumption history
2. Click "Reverse" on incorrect consumption
3. Confirm → system reverses
4. LP qty increased back
5. Genealogy record marked reversed
6. Audit trail created

**Permissions:** Manager/Admin only

**Audit Trail:**
- Record original consumption
- Record reversal action (by whom, when)
- Notes for why reversed

**UI:** Reverse button on consumption history, confirmation modal

**AC:**
- GIVEN user has role "Manager" or "Admin", WHEN viewing consumption history, THEN "Reverse" button is visible on each row
- GIVEN user has role "Operator", WHEN viewing consumption history, THEN "Reverse" button is NOT visible
- GIVEN consumption of 40 kg from LP-001 (now qty = 60), WHEN manager reverses consumption, THEN LP-001.qty = 100
- GIVEN consumption reversed, WHEN querying material_consumptions table, THEN record shows reversed = true, reversed_at = timestamp, reversed_by = manager user ID
- GIVEN consumption reversed, WHEN querying lp_genealogy table, THEN genealogy record shows is_reversed = true
- GIVEN manager clicks "Reverse", WHEN confirmation modal displays, THEN "Reason for reversal" is required field
- GIVEN reversal completes, WHEN recorded, THEN audit_log entry created with action = "consumption_reversal", user_id, timestamp, original_consumption_id
- GIVEN LP status was "consumed" before reversal, WHEN reversal completes for 50 kg, THEN LP status changes to "available" with qty = 50

---

### FR-PROD-010: Over-Consumption Control

**Description:** Control consumption exceeding BOM requirements

**Setting:** `allow_over_consumption` (boolean)

**Behavior:**
| Setting | Action |
|---------|--------|
| OFF (default) | Warn user, require manager approval |
| ON | Allow, track variance |

**Tracking:**
- Calculate variance: consumed - required
- Display variance % on materials table
- Flag WOs with high variance on dashboard

**Manager Approval (when OFF):**
- Over-consumption triggers approval request
- Manager receives notification
- Can approve or reject with reason

**UI:**
- Variance indicator on materials table
- Approval modal for managers
- Variance report in analytics

**AC:**
- GIVEN allow_over_consumption = false AND required = 100 AND consumed = 100, WHEN user attempts to consume additional 10, THEN approval request modal displays
- GIVEN allow_over_consumption = true AND required = 100 AND consumed = 100, WHEN user consumes additional 10, THEN consumption proceeds with variance = +10%
- GIVEN material has variance > 0%, WHEN displayed in materials table, THEN variance indicator shows in red with percentage (e.g., "+10%")
- GIVEN material has variance = 0%, WHEN displayed in materials table, THEN variance indicator shows in green with "0%"
- GIVEN over-consumption approval requested, WHEN manager approves, THEN consumption proceeds and audit trail records approval
- GIVEN over-consumption approval requested, WHEN manager rejects with reason "Investigate waste", THEN consumption is blocked and rejection reason is recorded
- GIVEN WO has any material with variance > 10%, WHEN dashboard loads, THEN WO is flagged in "High Variance" alert section
- GIVEN allow_over_consumption = false, WHEN approval is pending, THEN operator sees "Awaiting manager approval" status

---

### FR-PROD-011: Output Registration (Desktop)

**Description:** Register production output from desktop

**Workflow:**
1. Select WO
2. Click "Register Output"
3. Enter qty produced
4. Select QA status (if required)
5. Select location (or use default)
6. Add notes (optional)
7. Confirm → LP created

**Output Fields:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| quantity | decimal | Yes | - |
| uom | enum | Yes | From product |
| batch_number | string | Yes | From WO or auto |
| qa_status | enum | Configurable | Pending |
| location_id | uuid | Yes | Line default |
| expiry_date | date | No | today + shelf_life |
| notes | text | No | - |

**LP Creation:**
- product_id from WO.product_id
- qty from output
- batch_number from WO.wo_number or auto-generated
- qa_status as selected
- location_id from selection
- expiry_date = today + product.shelf_life_days
- source = 'production'
- wo_id = current WO

**Genealogy Update:**
- Set child_lp_id on all consumption genealogy records for this WO

**UI:**
- Register output modal
- Output history table
- Yield summary card

**AC:**
- GIVEN user enters qty = 500, QA status = "Approved", WHEN user clicks "Register", THEN new LP is created with qty = 500 and qa_status = "Approved"
- GIVEN product.shelf_life_days = 30 AND today = 2025-01-01, WHEN output registered, THEN LP.expiry_date = 2025-01-31
- GIVEN WO has wo_number = "WO-2025-001", WHEN output registered without custom batch, THEN LP.batch_number = "WO-2025-001"
- GIVEN require_qa_on_output = true, WHEN user submits without QA status, THEN validation error "QA status is required" displays
- GIVEN require_qa_on_output = false, WHEN user submits without QA status, THEN output registers with qa_status = null
- GIVEN output registered, WHEN LP created, THEN LP.source = "production" AND LP.wo_id = current WO ID
- GIVEN WO has consumed LP-001, LP-002, WHEN output registered creating LP-003, THEN lp_genealogy records for LP-001 and LP-002 have child_lp_id = LP-003 ID
- GIVEN production line has default_location_id = LOC-A, WHEN output modal opens, THEN location dropdown pre-selects LOC-A
- GIVEN user enters qty = 0, WHEN submitting, THEN validation error "Quantity must be greater than 0" displays

---

### FR-PROD-012: Output Registration (Scanner)

**Description:** Mobile scanner workflow for output registration

**Workflow:**
1. Scan WO barcode
2. Enter qty produced (number pad)
3. Select QA status (large buttons)
4. Confirm → LP created
5. Print LP label (ZPL to printer)
6. By-product prompt (if applicable)

**Scanner-Specific:**
- Pre-filled product, batch, location
- Large QA status buttons (Approved, Pending, Rejected)
- Auto-print label after creation
- Voice confirmation "LP created"

**Label Printing:**
- Generate ZPL barcode label
- Include: LP number, product, qty, batch, expiry
- Send to configured scanner printer

**UI:**
- WO scan screen
- Qty input screen
- QA status selector screen
- Confirmation with print button

**AC:**
- GIVEN valid WO barcode scanned, WHEN processed, THEN product name, planned qty, and registered qty display within 500ms
- GIVEN QA status buttons displayed, WHEN rendered, THEN each button is at least 64px height with clear color coding (green=Approved, yellow=Pending, red=Rejected)
- GIVEN output registered successfully, WHEN confirmed, THEN voice announcement "LP created" plays
- GIVEN printer is configured, WHEN output registered, THEN ZPL label sent to printer within 2 seconds
- GIVEN ZPL label generated, WHEN printed, THEN label contains: LP number (barcode), product name, qty with UoM, batch number, expiry date
- GIVEN printer is not configured, WHEN output registered, THEN "Print" button is disabled with tooltip "No printer configured"
- GIVEN BOM has by-products defined, WHEN main output registered, THEN prompt "Register by-products?" displays with Yes/No buttons
- GIVEN user taps "No" on by-product prompt, WHEN tapped, THEN scanner returns to main screen
- GIVEN network error during registration, WHEN confirmed, THEN error "Network error. Retry?" displays with Retry button

---

### FR-PROD-013: By-Product Registration

**Description:** Register by-products with auto-calculation

**BOM Configuration:**
- wo_materials with is_by_product = true
- yield_percent defines expected qty

**Auto-Calculation:**
- Expected by-product qty = WO.planned_qty * yield_percent / 100

**Workflow:**
1. After main output registered, system prompts for by-products
2. For each by-product:
   - Show expected qty (calculated)
   - User enters actual qty
   - Select QA status
   - Confirm → by-product LP created

**Auto-Create (Setting):**
- If `auto_create_by_product_lp` = true
- System auto-creates by-product LPs with expected qty
- User can adjust if actual differs

**Genealogy:**
- By-product LPs linked to same parent materials
- Separate child_lp_id entries

**UI:**
- By-products section on output page
- Auto-prompt after main output
- By-product history table

**AC:**
- GIVEN WO.planned_qty = 1000 AND by-product yield_percent = 5, WHEN by-product prompt displays, THEN expected qty shows as 50
- GIVEN auto_create_by_product_lp = true, WHEN main output registered, THEN by-product LPs auto-created with expected quantities
- GIVEN auto_create_by_product_lp = false, WHEN main output registered, THEN user manually enters by-product quantities
- GIVEN by-product expected = 50 AND user enters actual = 45, WHEN registered, THEN LP created with qty = 45
- GIVEN by-product registered, WHEN genealogy queried, THEN by-product LP has same parent_lp_ids as main output LP
- GIVEN BOM has 3 by-products defined, WHEN by-product registration starts, THEN all 3 by-products display in sequence
- GIVEN by-product qty entered = 0, WHEN user confirms, THEN warning "By-product quantity is 0. Continue?" displays
- GIVEN all by-products registered, WHEN complete, THEN "By-product registration complete" confirmation displays

---

### FR-PROD-014: Yield Tracking

**Description:** Calculate and display yield metrics

**Yield Types:**

| Type | Formula | Display |
|------|---------|---------|
| Output Yield | (actual_output_qty / planned_qty) * 100 | WO detail |
| Material Yield | (planned_material_qty / actual_consumed_qty) * 100 | Materials table |
| Operation Yield | From operation.actual_yield_percent | Operations timeline |
| Overall Yield | Composite of above | Dashboard |

**Tracking:**
- Per WO
- Per product
- Per line/machine
- Per shift
- Trend over time

**Alerts:**
- Low yield warning (< 80% expected)
- Displayed on dashboard
- Included in analytics

**UI:**
- Yield summary card on WO detail
- Yield trend chart on dashboard
- Yield analytics report

**AC:**
- GIVEN WO.planned_qty = 1000 AND actual_output_qty = 950, WHEN yield calculated, THEN output_yield = 95.0%
- GIVEN planned_material_qty = 100 AND actual_consumed_qty = 110, WHEN material yield calculated, THEN material_yield = 90.9%
- GIVEN WO output_yield < 80%, WHEN dashboard loads, THEN "Low Yield" alert displays for this WO
- GIVEN output_yield = 95%, WHEN displayed, THEN yield indicator shows in green
- GIVEN output_yield = 75%, WHEN displayed, THEN yield indicator shows in red
- GIVEN yield for product X over last 30 days, WHEN trend chart rendered, THEN chart shows daily yield points with trend line
- GIVEN yield calculation, WHEN computed, THEN result is rounded to 1 decimal place (e.g., 95.5%)
- GIVEN no outputs registered, WHEN yield displayed, THEN "N/A" shows instead of percentage

---

### FR-PROD-015: Multiple Outputs per WO

**Description:** Support multiple output registrations per WO

**Use Case:**
- Partial completion (output as produced)
- Multiple batches from one WO
- Split output across locations

**Tracking:**
- Each registration creates separate LP
- WO.output_qty = SUM of all outputs
- Progress % = output_qty / planned_qty * 100

**Completion:**
- WO completes when output_qty >= planned_qty (if auto-complete)
- Or manual complete regardless of output_qty

**UI:**
- Output history table shows all registrations
- Total qty displayed prominently
- Progress bar updates with each output

**AC:**
- GIVEN WO.planned_qty = 1000 AND first output = 400, WHEN output registered, THEN WO.output_qty = 400 AND progress = 40%
- GIVEN WO.output_qty = 400 AND second output = 300, WHEN second output registered, THEN WO.output_qty = 700 AND progress = 70%
- GIVEN 3 outputs registered (LP-001, LP-002, LP-003), WHEN output history viewed, THEN all 3 LPs display with individual quantities
- GIVEN each output creates separate LP, WHEN output registered, THEN new unique LP ID is generated
- GIVEN auto_complete_wo = true AND output_qty reaches 1000 (planned), WHEN output registered, THEN WO auto-completes
- GIVEN auto_complete_wo = false AND output_qty = 1200 (exceeds planned), WHEN output registered, THEN WO remains "In Progress"
- GIVEN WO has 5 outputs, WHEN output history table loaded, THEN all 5 outputs display within 1 second
- GIVEN progress bar displayed, WHEN output_qty = 750 of 1000 planned, THEN progress bar shows 75% filled

---

### FR-PROD-016: Material Reservations

**Description:** Reserve materials when WO starts to prevent allocation conflicts

**Workflow:**
1. When WO starts, create reservations for all required materials
2. System searches for available LPs matching material requirements
3. Mark LPs as reserved (not available for other WOs)
4. On consumption, release reservation and update LP
5. On WO complete/cancel, release unused reservations

**Reservation Fields:**
| Field | Type | Description |
|-------|------|-------------|
| wo_id | uuid | Work Order |
| wo_material_id | uuid | Material requirement |
| lp_id | uuid | Reserved LP |
| reserved_qty | decimal | Qty reserved |
| consumed_qty | decimal | Qty consumed so far |
| created_at | timestamp | When reserved |

**LP Selection Logic:**
- FIFO (oldest expiry first)
- Same batch preference
- Location proximity to production line

**UI:**
- Reservations table on WO detail
- Reserved qty shown on materials table
- Release reservation action (Manager)

**AC:**
- GIVEN WO requires Material A = 100 kg AND LP-001 has 150 kg available, WHEN WO starts, THEN reservation created for LP-001 with reserved_qty = 100
- GIVEN LP-001 has 50 kg AND LP-002 has 60 kg available, WHEN WO requires 100 kg, THEN reservations created for both LPs (50 + 60 = 110 kg reserved)
- GIVEN LP is reserved for WO-001, WHEN WO-002 attempts to consume from same LP, THEN error "LP is reserved for WO-001" displays
- GIVEN reservation exists with reserved_qty = 100 AND consumed_qty = 40, WHEN queried, THEN remaining_reserved = 60
- GIVEN WO completes with unused reservation of 30 kg, WHEN completion recorded, THEN reservation status = "released" and LP is available again
- GIVEN multiple LPs available, WHEN reservation created, THEN system selects LP with oldest expiry_date first (FEFO)
- GIVEN manager views reservations, WHEN clicks "Release" on reservation, THEN reservation is released and LP becomes available
- GIVEN enable_material_reservations = false, WHEN WO starts, THEN no reservations are created

---

### FR-PROD-017: Production Settings

**Description:** Configurable production execution settings

**Settings:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| allow_pause_wo | toggle | OFF | Enable WO pause/resume |
| auto_complete_wo | toggle | OFF | Auto-complete when output >= planned |
| require_operation_sequence | toggle | ON | Operations must complete in order |
| allow_over_consumption | toggle | OFF | Allow consumption > BOM requirement |
| allow_partial_lp_consumption | toggle | ON | Allow partial LP consumption |
| require_qa_on_output | toggle | ON | Output requires QA status |
| auto_create_by_product_lp | toggle | ON | Auto-create by-product LPs |
| enable_material_reservations | toggle | ON | Reserve materials on WO start |
| dashboard_refresh_seconds | number | 30 | Dashboard auto-refresh interval |
| show_material_alerts | toggle | ON | Show material shortage alerts |
| show_delay_alerts | toggle | ON | Show WO delay alerts |
| show_quality_alerts | toggle | ON | Show quality hold alerts |
| enable_oee_tracking | toggle | OFF | Enable OEE calculation |
| target_oee_percent | number | 85 | Target OEE % |
| enable_downtime_tracking | toggle | OFF | Track machine downtime |

**UI:** `/settings/production-execution` with toggle switches and number inputs

**AC:**
- GIVEN user navigates to `/settings/production-execution`, WHEN page loads, THEN all 15 settings display with current values
- GIVEN user toggles allow_pause_wo from OFF to ON, WHEN saved, THEN setting persists and WO detail pages show "Pause" button
- GIVEN user enters dashboard_refresh_seconds = 15, WHEN saved, THEN dashboard refreshes every 15 seconds
- GIVEN user enters dashboard_refresh_seconds = 0, WHEN saving, THEN validation error "Refresh interval must be at least 5 seconds" displays
- GIVEN user enters dashboard_refresh_seconds = 5, WHEN saved, THEN setting saves successfully
- GIVEN user enters target_oee_percent = 110, WHEN saving, THEN validation error "Target OEE must be between 0 and 100" displays
- GIVEN user enters target_oee_percent = 85, WHEN saved, THEN OEE dashboard shows 85% as target line
- GIVEN user changes setting and clicks "Save", WHEN saved, THEN success toast "Settings saved" displays
- GIVEN user changes setting without saving and navigates away, WHEN navigating, THEN confirmation "Unsaved changes. Leave?" displays

---

### FR-PROD-018: OEE Calculation

**Description:** Calculate Overall Equipment Effectiveness (OEE) metrics

**OEE Formula:**
```
OEE = Availability x Performance x Quality

Availability = (Operating Time / Planned Production Time) x 100
Performance = (Actual Output / Theoretical Output) x 100
Quality = (Good Output / Total Output) x 100
```

**Metrics Tracked:**

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| Availability | (shift_duration - downtime) / shift_duration | Machine uptime |
| Performance | actual_output / (ideal_cycle_time x operating_time) | Speed efficiency |
| Quality | approved_output / total_output | Quality rate |
| OEE | Availability x Performance x Quality | Overall efficiency |

**Tracking Level:**
- Per shift
- Per machine
- Per production line
- Per product

**Data Sources:**
- Shift duration from shift management
- Downtime from downtime_logs
- Output from production_outputs
- Cycle time from products or BOMs
- QA status from outputs

**Calculation Frequency:**
- Real-time during shift
- Final calculation at shift end
- Aggregated for daily/weekly/monthly reports

**UI:**
- OEE dashboard with gauges for A/P/Q
- OEE trend chart
- Comparison vs target OEE
- Drilldown to shift details

**AC:**
- GIVEN shift_duration = 480 min AND downtime = 60 min, WHEN availability calculated, THEN availability = 87.5%
- GIVEN actual_output = 900 AND theoretical_output = 1000, WHEN performance calculated, THEN performance = 90.0%
- GIVEN total_output = 1000 AND approved_output = 950, WHEN quality calculated, THEN quality = 95.0%
- GIVEN availability = 87.5%, performance = 90%, quality = 95%, WHEN OEE calculated, THEN OEE = 74.8% (0.875 x 0.9 x 0.95 x 100)
- GIVEN enable_oee_tracking = false, WHEN dashboard loads, THEN OEE metrics section is hidden
- GIVEN enable_oee_tracking = true, WHEN dashboard loads, THEN OEE gauges display for A, P, Q, and overall OEE
- GIVEN target_oee_percent = 85% AND actual OEE = 74.8%, WHEN displayed, THEN OEE shows in red with "Below Target" indicator
- GIVEN target_oee_percent = 85% AND actual OEE = 88%, WHEN displayed, THEN OEE shows in green with "Above Target" indicator
- GIVEN shift ends, WHEN shift closes, THEN final OEE metrics saved to oee_metrics table within 5 minutes

---

### FR-PROD-019: Downtime Tracking

**Description:** Track and categorize machine downtime for OEE calculation

**Downtime Categories:**

| Category | Description | Planned |
|----------|-------------|---------|
| Breakdown | Equipment failure | No |
| Changeover | Product/tool change | Yes |
| Maintenance | Preventive maintenance | Yes |
| Material Wait | Waiting for materials | No |
| Quality Issue | Stopped for quality | No |
| Operator Absence | No operator available | No |
| Break | Scheduled break | Yes |
| No Schedule | No production planned | Yes |
| Other | Other reason | No |

**Downtime Fields:**
| Field | Type | Description |
|-------|------|-------------|
| machine_id | uuid | Affected machine |
| wo_id | uuid | Active WO (if any) |
| category | enum | Downtime category |
| reason_code | string | Specific reason |
| started_at | timestamp | Downtime start |
| ended_at | timestamp | Downtime end |
| duration_minutes | integer | Calculated |
| is_planned | boolean | Planned vs unplanned |
| notes | text | Additional details |
| logged_by | uuid | User who logged |

**Workflow:**
1. Operator detects downtime
2. Click "Log Downtime" or scan downtime barcode
3. Select category and reason code
4. Add notes (optional)
5. System records start time
6. When resolved, click "End Downtime"
7. System calculates duration

**Integration:**
- Auto-pause WO if machine down
- Update machine status
- Impact OEE availability calculation
- Alert if downtime exceeds threshold

**UI:**
- Downtime log modal
- Active downtime indicator on dashboard
- Downtime history table
- Downtime analytics (Pareto chart of reasons)

**AC:**
- GIVEN user clicks "Log Downtime", WHEN category "Breakdown" selected, THEN is_planned = false automatically
- GIVEN user clicks "Log Downtime", WHEN category "Changeover" selected, THEN is_planned = true automatically
- GIVEN downtime logged at 10:00, WHEN "End Downtime" clicked at 10:45, THEN duration_minutes = 45
- GIVEN active downtime exists for Machine A, WHEN dashboard loads, THEN "Machine Down" alert displays with duration counter
- GIVEN downtime duration > 30 minutes, WHEN threshold exceeded, THEN notification sent to manager
- GIVEN enable_downtime_tracking = false, WHEN user views production, THEN "Log Downtime" button is hidden
- GIVEN enable_downtime_tracking = true AND machine has active WO, WHEN downtime logged with category "Breakdown", THEN WO auto-pauses with reason "Machine Breakdown"
- GIVEN downtime ended, WHEN duration calculated, THEN downtime_minutes impacts availability calculation for current shift
- GIVEN user logs downtime without selecting category, WHEN submitting, THEN validation error "Category is required" displays

---

### FR-PROD-020: Machine Integration

**Description:** Basic integration with production machines for data collection

**Integration Types:**

| Type | Description | Data Collected |
|------|-------------|----------------|
| Manual | Operator input via scanner/desktop | All data manual |
| OPC-UA | Industrial protocol connection | Cycle counts, status, alarms |
| REST API | Machine exposes API | Production counts, parameters |
| PLC Direct | Direct PLC connection | Real-time signals |
| IoT Sensors | Sensor-based monitoring | Utilization, vibration, temp |

**MVP Scope (Manual + Basic):**
- Manual data entry (scanner/desktop)
- Machine status updates (running/stopped/down)
- Production counters (good/reject counts)
- Basic alarm/event logging

**Machine Data Points:**

| Data Point | Type | Update Frequency | Use |
|------------|------|------------------|-----|
| status | enum | On change | Availability |
| cycle_counter | integer | Per cycle | Performance |
| good_counter | integer | Per cycle | Quality |
| reject_counter | integer | Per cycle | Quality |
| current_wo_id | uuid | On WO start | Context |
| last_cycle_time | integer | Per cycle | Performance |
| alarm_active | boolean | On change | Downtime |

**Machine Status Values:**
- Idle (no WO assigned)
- Running (active production)
- Stopped (temporary stop)
- Down (breakdown/maintenance)
- Changeover (setup)

**Data Sync:**
- For integrated machines: real-time sync via API/OPC-UA
- For manual: operator updates via scanner/desktop
- Fallback: all machines support manual entry

**UI:**
- Machine status dashboard
- Live production counters
- Alarm/event log
- Machine utilization chart

**AC:**
- GIVEN machine has status = "Idle", WHEN WO assigned and started, THEN machine status changes to "Running"
- GIVEN machine status changed to "Down", WHEN dashboard loads, THEN machine shows red "Down" indicator
- GIVEN operator enters good_counter = 500 AND reject_counter = 10, WHEN saved, THEN quality rate = 98.0% (500/510)
- GIVEN machine has cycle_counter = 1000 at shift start AND cycle_counter = 1500 at shift end, WHEN queried, THEN cycles_this_shift = 500
- GIVEN machine alarm activates, WHEN logged, THEN alarm_active = true AND notification sent
- GIVEN machine utilization over 8-hour shift, WHEN chart rendered, THEN utilization % displays per hour
- GIVEN manual machine entry, WHEN operator updates status, THEN timestamp and user_id recorded
- GIVEN machine integration type = "Manual", WHEN machine status viewed, THEN "Update Status" button displays
- GIVEN machine integration type = "OPC-UA", WHEN machine status viewed, THEN status updates automatically without manual entry

---

### FR-PROD-021: Shift Management

**Description:** Define shifts for OEE calculation and production planning

**Shift Fields:**
| Field | Type | Description |
|-------|------|-------------|
| name | string | Shift name (Day, Night, etc) |
| start_time | time | Shift start (e.g., 06:00) |
| end_time | time | Shift end (e.g., 14:00) |
| duration_minutes | integer | Net production time |
| break_minutes | integer | Scheduled break time |
| is_active | boolean | Active/inactive |
| days_of_week | array | Days this shift runs |

**Standard Shifts:**
- Day Shift: 06:00-14:00 (480 min, 30 min break = 450 min net)
- Afternoon: 14:00-22:00
- Night: 22:00-06:00

**Shift Assignment:**
- WO can be assigned to specific shift
- Machine operates on defined shifts
- OEE calculated per shift

**Shift Handover:**
- Active WOs transfer to next shift
- Operations can span shifts
- Downtime tracked per shift

**UI:**
- Shift configuration in Settings
- Shift selector on WO planning
- Current shift indicator on dashboard

**AC:**
- GIVEN shift "Day" starts at 06:00 AND current time = 09:00, WHEN dashboard loads, THEN "Current Shift: Day" indicator displays
- GIVEN shift has duration_minutes = 480 AND break_minutes = 30, WHEN OEE calculated, THEN planned_production_minutes = 450
- GIVEN shift "Day" has days_of_week = [1,2,3,4,5], WHEN current day = Saturday (6), THEN "Day" shift is not active
- GIVEN user creates shift with start_time = 14:00 AND end_time = 14:00, WHEN saving, THEN validation error "End time must differ from start time" displays
- GIVEN shift spans midnight (22:00-06:00), WHEN duration calculated, THEN duration_minutes = 480
- GIVEN active WO exists when shift ends, WHEN new shift starts, THEN WO continues and is visible in new shift
- GIVEN downtime occurs 10:00-10:30 during Day shift, WHEN shift ends, THEN downtime attributed to Day shift OEE
- GIVEN user deactivates shift, WHEN is_active = false saved, THEN shift no longer appears in WO assignment dropdown
- GIVEN no shifts defined, WHEN OEE calculation attempted, THEN error "No active shifts configured" displays

---

### FR-PROD-022a: OEE Summary Report

**Description:** OEE by machine/line/shift with trend analysis

**Filters:** Date range, machine, product, line, shift

**Metrics:**
- Availability, Performance, Quality, OEE per entity
- Target vs actual comparison
- Trend over selected period

**Visualizations:**
- OEE trend line chart
- A/P/Q breakdown bar chart
- Machine comparison table

**AC:**
- GIVEN date range = last 7 days AND machine = Machine A, WHEN report generated, THEN OEE metrics display for each day
- GIVEN OEE data for 5 machines, WHEN comparison view selected, THEN bar chart shows all 5 machines side-by-side
- GIVEN report generated, WHEN export clicked, THEN CSV downloads with columns: Date, Machine, Availability, Performance, Quality, OEE
- GIVEN no data exists for selected filters, WHEN report generated, THEN "No data for selected criteria" message displays
- GIVEN report loads, WHEN rendered, THEN data displays within 3 seconds for up to 30 days of data
- GIVEN target_oee = 85%, WHEN trend chart rendered, THEN horizontal target line displays at 85%

---

### FR-PROD-022b: Downtime Analysis Report

**Description:** Pareto analysis of downtime reasons

**Filters:** Date range, machine, category, shift

**Metrics:**
- Total downtime hours per category
- Frequency of downtime events
- Average duration per event
- Planned vs unplanned breakdown

**Visualizations:**
- Pareto chart (categories by duration)
- Downtime trend over time
- Top 10 reason codes table

**AC:**
- GIVEN downtime data exists, WHEN Pareto chart rendered, THEN categories sorted by total duration (highest first)
- GIVEN Pareto chart rendered, WHEN displayed, THEN cumulative percentage line overlays bars
- GIVEN filter = "Unplanned only", WHEN applied, THEN only is_planned = false records display
- GIVEN downtime events exist, WHEN top 10 table rendered, THEN reason codes sorted by frequency descending
- GIVEN date range = last 30 days, WHEN report generated, THEN all downtime events in range included
- GIVEN report exported, WHEN CSV downloaded, THEN columns include: Category, Reason Code, Count, Total Minutes, Avg Minutes

---

### FR-PROD-022c: Yield Analysis Report

**Description:** Yield trends and outliers by product/line

**Filters:** Product, line, date range, operator

**Metrics:**
- Average yield per product
- Yield variance (std deviation)
- Low yield outliers (< 80%)
- Yield by operator

**Visualizations:**
- Yield trend line chart
- Product comparison bar chart
- Outlier scatter plot

**AC:**
- GIVEN yield data for product X over 30 days, WHEN trend chart rendered, THEN daily yield points display with trend line
- GIVEN 3 products selected, WHEN comparison chart rendered, THEN bar chart shows average yield for each product
- GIVEN WO has yield < 80%, WHEN outlier report viewed, THEN WO displays in "Low Yield" section with details
- GIVEN yield data exists, WHEN statistics calculated, THEN average, min, max, std deviation display
- GIVEN operator filter applied, WHEN report generated, THEN only WOs with that operator's outputs included
- GIVEN report exported, WHEN CSV downloaded, THEN columns include: WO Number, Product, Planned Qty, Actual Qty, Yield %

---

### FR-PROD-022d: Production Output Report

**Description:** Units produced by product/line over time

**Filters:** Date range, product, line, shift

**Metrics:**
- Total units produced
- Output by product breakdown
- Output by line breakdown
- Daily/weekly/monthly trends

**Visualizations:**
- Stacked area chart (output over time by product)
- Line comparison bar chart
- Output summary table

**AC:**
- GIVEN date range = last 7 days, WHEN report generated, THEN total units produced displays per day
- GIVEN multiple products produced, WHEN stacked area chart rendered, THEN each product has distinct color
- GIVEN line filter = "Line A", WHEN applied, THEN only outputs from Line A display
- GIVEN shift filter = "Day", WHEN applied, THEN only outputs during Day shift display
- GIVEN report includes 1000+ outputs, WHEN loaded, THEN data displays within 5 seconds
- GIVEN report exported, WHEN CSV downloaded, THEN columns include: Date, Product, Line, Shift, Quantity, UoM

---

### FR-PROD-022e: Material Consumption Report

**Description:** Consumption vs plan variance analysis

**Filters:** Product, material, date range, WO

**Metrics:**
- Planned vs actual consumption
- Variance % per material
- High variance WOs
- Material usage trends

**Visualizations:**
- Variance scatter plot (planned vs actual)
- Top 10 high variance materials table
- Consumption trend line chart

**AC:**
- GIVEN WO planned 100 kg AND consumed 110 kg, WHEN variance calculated, THEN variance = +10%
- GIVEN variance > 10%, WHEN displayed in table, THEN row highlighted in red
- GIVEN variance between -5% and +5%, WHEN displayed, THEN row highlighted in green
- GIVEN scatter plot rendered, WHEN data point hovered, THEN tooltip shows WO number, material, planned, actual, variance
- GIVEN material filter applied, WHEN report generated, THEN only that material's consumptions display
- GIVEN report exported, WHEN CSV downloaded, THEN columns include: WO Number, Material, Planned Qty, Actual Qty, Variance %, Variance Qty

---

### FR-PROD-022f: Quality Rate Report

**Description:** QA status distribution analysis

**Filters:** Product, date range, line, operator

**Metrics:**
- Quality rate (approved / total)
- Rejection rate by reason
- Quality trend over time
- Quality by operator

**Visualizations:**
- QA status pie chart (Approved/Pending/Rejected)
- Quality trend line chart
- Rejection reasons bar chart

**AC:**
- GIVEN outputs: 900 Approved, 50 Pending, 50 Rejected, WHEN quality rate calculated, THEN quality rate = 90% (Approved/Total)
- GIVEN pie chart rendered, WHEN displayed, THEN segments show Approved (green), Pending (yellow), Rejected (red)
- GIVEN rejection reasons logged, WHEN bar chart rendered, THEN reasons sorted by frequency (highest first)
- GIVEN date range = last 30 days, WHEN trend chart rendered, THEN daily quality rate displays
- GIVEN operator filter applied, WHEN report generated, THEN only outputs created by that operator included
- GIVEN report exported, WHEN CSV downloaded, THEN columns include: Date, Product, Total Output, Approved, Pending, Rejected, Quality Rate %

---

### FR-PROD-022g: WO Completion Report

**Description:** On-time vs delayed WO analysis

**Filters:** Date range, line, product, status

**Metrics:**
- On-time completion rate
- Average delay (hours)
- Delay reasons distribution
- Completion by line/product

**Visualizations:**
- On-time vs delayed pie chart
- Delay trend line chart
- Top delayed WOs table

**AC:**
- GIVEN WO scheduled for Jan 1 AND completed Jan 1, WHEN analyzed, THEN WO classified as "On-time"
- GIVEN WO scheduled for Jan 1 AND completed Jan 3, WHEN analyzed, THEN WO classified as "Delayed" with delay = 2 days
- GIVEN 100 WOs completed: 80 on-time, 20 delayed, WHEN on-time rate calculated, THEN rate = 80%
- GIVEN delayed WOs exist, WHEN top delayed table rendered, THEN WOs sorted by delay duration (longest first)
- GIVEN delay trend chart rendered, WHEN displayed, THEN shows weekly on-time rate over selected period
- GIVEN report exported, WHEN CSV downloaded, THEN columns include: WO Number, Product, Scheduled Date, Completed Date, Status, Delay Hours

---

## Database Tables

### production_outputs
```sql
id                UUID PK
org_id            UUID FK NOT NULL
wo_id             UUID FK NOT NULL
product_id        UUID FK NOT NULL
lp_id             UUID FK NOT NULL
quantity          NUMERIC NOT NULL
uom               TEXT NOT NULL
batch_number      TEXT NOT NULL
qa_status         TEXT
location_id       UUID FK NOT NULL
expiry_date       DATE
notes             TEXT
created_at        TIMESTAMPTZ DEFAULT now()
created_by        UUID FK NOT NULL
```

### material_consumptions
```sql
id                UUID PK
org_id            UUID FK NOT NULL
wo_id             UUID FK NOT NULL
wo_material_id    UUID FK NOT NULL
lp_id             UUID FK NOT NULL
quantity          NUMERIC NOT NULL
uom               TEXT NOT NULL
consumed_at       TIMESTAMPTZ NOT NULL
consumed_by       UUID FK NOT NULL
reversed          BOOLEAN DEFAULT false
reversed_at       TIMESTAMPTZ
reversed_by       UUID FK
notes             TEXT
```

### material_reservations
```sql
id                UUID PK
org_id            UUID FK NOT NULL
wo_id             UUID FK NOT NULL
wo_material_id    UUID FK NOT NULL
lp_id             UUID FK NOT NULL
reserved_qty      NUMERIC NOT NULL
consumed_qty      NUMERIC DEFAULT 0
status            TEXT DEFAULT 'active'
created_at        TIMESTAMPTZ DEFAULT now()
released_at       TIMESTAMPTZ
```

### wo_pauses
```sql
id                UUID PK
org_id            UUID FK NOT NULL
wo_id             UUID FK NOT NULL
pause_reason      TEXT NOT NULL
paused_at         TIMESTAMPTZ NOT NULL
paused_by         UUID FK NOT NULL
resumed_at        TIMESTAMPTZ
resumed_by        UUID FK
duration_minutes  INTEGER
notes             TEXT
```

### oee_metrics
```sql
id                      UUID PK
org_id                  UUID FK NOT NULL
machine_id              UUID FK NOT NULL
shift_id                UUID FK
shift_date              DATE NOT NULL
planned_production_minutes INTEGER NOT NULL
downtime_minutes        INTEGER DEFAULT 0
operating_minutes       INTEGER
theoretical_output      INTEGER
actual_output           INTEGER
good_output             INTEGER
reject_output           INTEGER
availability_percent    NUMERIC
performance_percent     NUMERIC
quality_percent         NUMERIC
oee_percent             NUMERIC
calculated_at           TIMESTAMPTZ
```

### downtime_logs
```sql
id                UUID PK
org_id            UUID FK NOT NULL
machine_id        UUID FK NOT NULL
wo_id             UUID FK
category          TEXT NOT NULL
reason_code       TEXT
started_at        TIMESTAMPTZ NOT NULL
ended_at          TIMESTAMPTZ
duration_minutes  INTEGER
is_planned        BOOLEAN DEFAULT false
notes             TEXT
logged_by         UUID FK NOT NULL
```

### machine_counters
```sql
id                UUID PK
org_id            UUID FK NOT NULL
machine_id        UUID FK NOT NULL
wo_id             UUID FK
timestamp         TIMESTAMPTZ NOT NULL
cycle_counter     INTEGER
good_counter      INTEGER
reject_counter    INTEGER
cycle_time_seconds INTEGER
status            TEXT
alarm_code        TEXT
```

### shifts
```sql
id                UUID PK
org_id            UUID FK NOT NULL
name              TEXT NOT NULL
start_time        TIME NOT NULL
end_time          TIME NOT NULL
duration_minutes  INTEGER NOT NULL
break_minutes     INTEGER DEFAULT 0
is_active         BOOLEAN DEFAULT true
days_of_week      INTEGER[] DEFAULT '{1,2,3,4,5}'
```

### production_settings
```sql
id                              UUID PK
org_id                          UUID FK NOT NULL UNIQUE
allow_pause_wo                  BOOLEAN DEFAULT false
auto_complete_wo                BOOLEAN DEFAULT false
require_operation_sequence      BOOLEAN DEFAULT true
allow_over_consumption          BOOLEAN DEFAULT false
allow_partial_lp_consumption    BOOLEAN DEFAULT true
require_qa_on_output            BOOLEAN DEFAULT true
auto_create_by_product_lp       BOOLEAN DEFAULT true
enable_material_reservations    BOOLEAN DEFAULT true
dashboard_refresh_seconds       INTEGER DEFAULT 30
show_material_alerts            BOOLEAN DEFAULT true
show_delay_alerts               BOOLEAN DEFAULT true
show_quality_alerts             BOOLEAN DEFAULT true
enable_oee_tracking             BOOLEAN DEFAULT false
target_oee_percent              NUMERIC DEFAULT 85
enable_downtime_tracking        BOOLEAN DEFAULT false
created_at                      TIMESTAMPTZ DEFAULT now()
updated_at                      TIMESTAMPTZ
```

---

## API Endpoints

### Dashboard
```
GET    /api/production/dashboard/kpis
GET    /api/production/dashboard/active-wos
GET    /api/production/dashboard/alerts
GET    /api/production/dashboard/oee-summary
```

### Work Order Execution
```
POST   /api/production/work-orders/:id/start
POST   /api/production/work-orders/:id/pause
POST   /api/production/work-orders/:id/resume
POST   /api/production/work-orders/:id/complete
GET    /api/production/work-orders/:id/timeline
```

### Operations
```
POST   /api/production/work-orders/:id/operations/:opId/start
POST   /api/production/work-orders/:id/operations/:opId/complete
GET    /api/production/work-orders/:id/operations
```

### Material Consumption
```
GET    /api/production/work-orders/:id/materials
POST   /api/production/work-orders/:id/consume
POST   /api/production/work-orders/:id/consume/reverse
GET    /api/production/work-orders/:id/consumption-history
POST   /api/production/work-orders/:id/reserve-materials
DELETE /api/production/work-orders/:id/reservations/:resId
```

### Output Registration
```
GET    /api/production/work-orders/:id/outputs
POST   /api/production/work-orders/:id/outputs
GET    /api/production/work-orders/:id/by-products
POST   /api/production/work-orders/:id/by-products
GET    /api/production/work-orders/:id/yield
```

### OEE & Downtime
```
GET    /api/production/oee/metrics
GET    /api/production/oee/by-machine/:machineId
GET    /api/production/oee/by-shift/:shiftId
POST   /api/production/downtime/log
PUT    /api/production/downtime/:id/end
GET    /api/production/downtime/active
GET    /api/production/downtime/history
GET    /api/production/downtime/analysis
```

### Machine Integration
```
GET    /api/production/machines/:id/status
POST   /api/production/machines/:id/counters
GET    /api/production/machines/:id/counters
POST   /api/production/machines/:id/status
GET    /api/production/machines/:id/alarms
```

### Shifts
```
GET    /api/production/shifts
POST   /api/production/shifts
PUT    /api/production/shifts/:id
DELETE /api/production/shifts/:id
GET    /api/production/shifts/current
```

### Analytics
```
GET    /api/production/analytics/oee-summary
GET    /api/production/analytics/downtime-analysis
GET    /api/production/analytics/yield-analysis
GET    /api/production/analytics/output-report
GET    /api/production/analytics/consumption-variance
GET    /api/production/analytics/quality-rate
GET    /api/production/analytics/wo-completion
POST   /api/production/analytics/export
```

### Settings
```
GET    /api/production/settings
PUT    /api/production/settings
```

---

## Scanner Workflows

### Consume Material
```
Step 1: Scan WO barcode
        Display WO info + required materials

Step 2: Scan LP barcode
        Validate: product match, UoM, availability

Step 3: Enter quantity
        Show number pad
        "Full LP" button for 1:1 consumption

Step 4: Review consumption
        Show: Material, LP, Qty, Remaining

Step 5: Confirm
        Record consumption, update LP
        Audio/visual feedback

Step 6: Next material or Done
        Return to Step 2 or complete
```

### Register Output
```
Step 1: Scan WO barcode
        Display WO info + product

Step 2: Enter quantity produced
        Number pad input
        Show planned vs registered

Step 3: Select QA status
        Large buttons: Approved / Pending / Rejected

Step 4: Review output
        Show: Product, Qty, QA, Batch, Location

Step 5: Confirm
        Create LP, update genealogy
        Generate LP barcode

Step 6: Print label
        Send ZPL to scanner printer
        Show print confirmation

Step 7: By-product prompt (if applicable)
        "Register by-products?" Yes/No
        If Yes → repeat for by-products
```

### Log Downtime (Scanner)
```
Step 1: Scan "Downtime" barcode
        Or tap "Log Downtime" on machine screen

Step 2: Select category
        Large buttons: Breakdown / Changeover / Maintenance / etc

Step 3: Select reason code
        Dropdown or scan reason barcode

Step 4: Add notes (optional)
        Voice input or text

Step 5: Confirm
        Record downtime start
        Update machine status

Step 6: End downtime (when resolved)
        Tap "End Downtime"
        Calculate duration, restore machine status
```

---

## Phase Roadmap

### MVP (Phase 1) - P0 Features
**Timeline:** 12 weeks
**Status:** In Progress (50% complete)

| Week | Focus | Stories |
|------|-------|---------|
| 1-2 | Dashboard & WO Lifecycle | FR-001, FR-002, FR-003, FR-005 |
| 3-4 | Operations Tracking | FR-004 |
| 5-7 | Material Consumption | FR-006, FR-007, FR-008, FR-009, FR-010 |
| 8-10 | Output Registration | FR-011, FR-012, FR-013, FR-014, FR-015 |
| 11 | Material Reservations | FR-016 |
| 12 | Settings & Polish | FR-017 |

**Deliverables:**
- Production dashboard with KPIs
- Full WO lifecycle (start to complete)
- Desktop + scanner consumption
- Desktop + scanner output registration
- Material reservations
- By-product handling
- Yield tracking
- Production settings

---

### Phase 2 - OEE & Analytics - P1 Features
**Timeline:** 8 weeks
**Prerequisites:** MVP complete

| Week | Focus | Stories |
|------|-------|---------|
| 1-2 | Shift Management | FR-021 |
| 3-4 | Downtime Tracking | FR-019 |
| 5-6 | OEE Calculation | FR-018 |
| 7 | Machine Integration (Basic) | FR-020 |
| 8 | Production Analytics | FR-022a-g |

**Deliverables:**
- Shift configuration and management
- Downtime logging (desktop + scanner)
- OEE calculation (A/P/Q)
- OEE dashboard and reports
- Manual machine status updates
- Downtime analysis (Pareto)
- Production analytics suite

---

### Phase 3 - Advanced Integration - P2 Features
**Timeline:** 6 weeks
**Prerequisites:** Phase 2 complete

**Features:**
- OPC-UA machine integration
- Real-time machine data sync
- Automated counter updates
- Alarm/event integration
- Advanced scheduling based on OEE
- Predictive maintenance alerts
- Mobile operator app enhancements

---

## Business Rules

### Material Consumption
- LP must be in 'available' status to consume
- Product and UoM must match material requirement
- Consumed qty cannot exceed LP qty
- Over-consumption blocked unless setting enabled
- 1:1 consumption strictly enforced when flagged
- Genealogy created for all consumptions
- Reversals require manager permission

### Output Registration
- At least one output required to complete WO
- QA status required if setting enabled
- Expiry date auto-calculated from shelf life
- Batch number from WO or auto-generated
- Multiple outputs allowed per WO
- By-products prompted if defined in BOM
- Genealogy updated with child LP

### Work Order Lifecycle
- WO must be 'Released' to start
- Pause requires setting enabled
- Resume only from 'Paused' status
- Complete requires output registered
- Auto-complete when output >= planned (if enabled)
- Operations sequence enforced (if enabled)

### OEE Calculation
- Availability = (operating_time / planned_time) x 100
- Performance = (actual / theoretical) x 100
- Quality = (good / total) x 100
- OEE = Availability x Performance x Quality
- Calculated per shift, per machine
- Downtime reduces availability
- Rejects reduce quality factor

### Downtime Tracking
- Planned downtime (changeover, maintenance) excluded from OEE loss
- Unplanned downtime impacts availability
- Active WO auto-paused during machine downtime
- Downtime must have category and reason
- Duration auto-calculated on end

---

## Integration Points

### With Planning Module
- WO creation and scheduling
- WO status updates
- Material requirements
- Capacity planning based on OEE

### With Warehouse Module
- LP consumption and creation
- Location management
- Inventory updates
- Genealogy tracking

### With Quality Module
- QA status on outputs
- Quality inspection triggers
- Reject tracking
- Quality holds

### With Technical Module
- Product and BOM data
- Routing and operations
- By-product definitions
- Cycle times for OEE

### With Settings Module
- Production lines and machines
- Shift definitions
- User permissions
- System settings

---

## Notes

**Design Principles:**
- Desktop for planning/management, scanner for execution
- Real-time data critical for OEE accuracy
- Genealogy for full traceability
- Flexible settings for different org needs
- Mobile-first scanner UI for operators

**Performance Considerations:**
- Dashboard auto-refresh configurable (avoid DB overload)
- OEE calculated asynchronously
- Machine counters buffered for high-frequency updates
- Analytics use materialized views

**Security:**
- RLS on all tables (org_id)
- Manager approval for reversals and over-consumption
- Audit trail for all material transactions
- Role-based access for settings

**Future Enhancements:**
- Advanced machine integration (OPC-UA, PLC)
- AI-based yield prediction
- Automated quality inspection
- Operator performance tracking
- Energy consumption monitoring
- Predictive maintenance
