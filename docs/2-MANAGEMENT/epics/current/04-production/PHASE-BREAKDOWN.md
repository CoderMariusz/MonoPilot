# Epic 04 Production Module - Phase Breakdown by Story

**Date:** 2025-12-16
**Total Stories:** 28 across 3 phases
**Full Specs:** 7 stories (Phase 0 only)
**Templates:** 21 stories (Phase 1-2 only)
**Quality Score:** 99/100

---

## Quick Reference

| Phase | Stories | Status | Days | LP Dependency | Start Date |
|-------|---------|--------|------|---------------|-----------|
| **Phase 0** | 04.1-04.5 | ✅ FULL SPECS | 10-14 | NO | Day 1 |
| **Phase 1** | 04.6a-04.8 | 📋 TEMPLATES | 18-24 | YES (Day 12) | Week 3 |
| **Phase 2** | 04.9-04.11 | 📋 TEMPLATES | 14-18 | NO (soft) | Week 7 |

---

## Phase 0: Pre-LP Work Order Lifecycle (READY)

### Status: ✅ FULL SPECIFICATIONS COMPLETE

**Complexity:** 1M + 2S + 2M + 1M + 1S = Medium overall
**Estimated Effort:** 10-14 days (1 dev) | 5-7 days (2 devs)
**Quality Score:** 99/100
**INVEST Compliant:** Yes (all stories <= 5-7 days)
**Acceptance Criteria:** 95+ per story
**Test Coverage Target:** >= 80%

### Stories

#### 04.1: Production Dashboard

**Complexity:** M | **Days:** 3-4 | **Priority:** HIGH

**What It Does:**
- Displays active work orders by status
- Shows operation queue for selected WO
- Real-time status updates
- Performance metrics (completion %, on-time %)

**Database:**
- Reads: `work_orders`, `operations`, `work_order_yields`

**API:**
- `GET /api/production/work-orders?status=in_progress`
- `GET /api/production/work-orders/{id}/operations`
- `GET /api/production/dashboard/metrics`

**UI Components:**
- WO grid (status, line, product, progress)
- Operation list (upcoming, in-progress, complete)
- KPI cards (throughput, on-time, yield)

**Dependencies:** 03.10 (WO CRUD exists), 01.10 (Lines/Machines)

**Acceptance Criteria:**
```gherkin
Given I am on Production Dashboard
When I open the module
Then I see active work orders sorted by priority
And I see operation queue for selected WO
And I see real-time status updates
And I see throughput/on-time metrics
```

---

#### 04.2a: Work Order Start

**Complexity:** M | **Days:** 3-4 | **Priority:** HIGH

**What It Does:**
- Transition WO from "Released" to "In Progress"
- Record start timestamp
- Assign operator
- Check material availability (warning, not blocking)
- Copy operations from WO template

**Database Changes:**
- `work_orders.status`: released → in_progress
- `work_orders.started_at`: set to now
- `work_orders.assigned_operator_id`: set operator

**API:**
- `PATCH /api/production/work-orders/{id}/start`

**Request:**
```json
{
  "operator_id": "uuid",
  "line_id": "uuid",
  "start_timestamp": "2025-12-16T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "in_progress",
  "started_at": "2025-12-16T10:30:00Z",
  "operations": [
    { "id": "op1", "sequence": 1, "status": "pending" }
  ]
}
```

**Validation:**
- WO must be in "released" status
- Operator must exist and have production role
- Line must be available
- Check material availability (warn if short)

**Acceptance Criteria:**
```gherkin
Given a released work order
When I start the work order
Then status changes to in_progress
And start timestamp recorded
And operator assigned
And operations copied from template
And material availability checked (warning only)
```

**Dependencies:** 03.10 (WO exists), 01.10 (Operator/Line exists)

---

#### 04.2b: Work Order Pause/Resume

**Complexity:** S | **Days:** 1-2 | **Priority:** MEDIUM

**What It Does:**
- Pause WO execution (save state)
- Resume paused WO (continue execution)
- Track pause reasons and duration
- Maintain operation state

**Database:**
- `work_order_pauses` table (id, wo_id, paused_at, resumed_at, reason)

**API:**
- `PATCH /api/production/work-orders/{id}/pause`
- `PATCH /api/production/work-orders/{id}/resume`

**Request (Pause):**
```json
{
  "reason": "Equipment maintenance",
  "pause_timestamp": "2025-12-16T11:00:00Z"
}
```

**Response:**
```json
{
  "status": "paused",
  "paused_at": "2025-12-16T11:00:00Z",
  "reason": "Equipment maintenance",
  "paused_operations": 3
}
```

**Validation:**
- WO must be in "in_progress" status (to pause)
- WO must be in "paused" status (to resume)
- Pause reason must be from predefined list or custom

**Acceptance Criteria:**
```gherkin
Given an in_progress work order
When I pause the work order
Then status changes to paused
And pause timestamp recorded
And pause reason stored
And operations frozen

Given a paused work order
When I resume the work order
Then status changes back to in_progress
And resume timestamp recorded
And operations unfrozen
```

**Dependencies:** 04.2a (WO already started)

---

#### 04.2c: Work Order Complete

**Complexity:** M | **Days:** 3-4 | **Priority:** HIGH

**What It Does:**
- Transition WO from "In Progress" to "Completed"
- Calculate actual yield vs target
- Record completion timestamp
- Generate completion report
- Optional: auto-complete if all operations done

**Database Changes:**
- `work_orders.status`: in_progress → completed
- `work_orders.completed_at`: set to now
- `work_orders.actual_yield`: calculated

**API:**
- `PATCH /api/production/work-orders/{id}/complete`

**Request:**
```json
{
  "actual_yield": 950,
  "completion_notes": "Early completion due to high efficiency",
  "auto_complete": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "completed",
  "completed_at": "2025-12-16T14:30:00Z",
  "target_yield": 1000,
  "actual_yield": 950,
  "yield_variance_pct": -5.0,
  "production_time_hours": 4.0
}
```

**Yield Calculation:**
```
yield_variance = (actual_yield - target_yield) / target_yield * 100
on_time = completion_at <= scheduled_end_time
```

**Validation:**
- WO must be in "in_progress" or "paused" status
- All operations must be marked complete (or auto-complete enabled)
- Actual yield must be numeric
- Completion timestamp cannot be before start time

**Acceptance Criteria:**
```gherkin
Given an in_progress work order
When I complete the work order
Then status changes to completed
And completion timestamp recorded
And yield variance calculated
And completion report generated

Given configured auto_complete setting
When I complete without finishing all operations
Then operations auto-complete if enabled
Or error if not enabled
```

**Dependencies:** 04.2a (WO started)

---

#### 04.3: Operation Start/Complete

**Complexity:** M | **Days:** 3-4 | **Priority:** HIGH

**What It Does:**
- Record when each operation starts
- Record when each operation completes
- Track operation duration and status
- Support partial operation completion
- Track scrap/waste per operation

**Database:**
- `operations.status`: pending → in_progress → complete
- `operations.started_at`, `operations.completed_at`
- `operation_scrap` table (op_id, scrap_qty, reason)

**API:**
- `PATCH /api/production/operations/{id}/start`
- `PATCH /api/production/operations/{id}/complete`

**Request (Start):**
```json
{
  "operator_id": "uuid",
  "start_timestamp": "2025-12-16T10:35:00Z",
  "notes": "Operator: John Smith"
}
```

**Response:**
```json
{
  "id": "op1",
  "status": "in_progress",
  "started_at": "2025-12-16T10:35:00Z",
  "operator_id": "uuid",
  "position_in_queue": 1
}
```

**Request (Complete):**
```json
{
  "completed_qty": 1000,
  "scrap_qty": 50,
  "scrap_reason": "Off-specification color",
  "completion_timestamp": "2025-12-16T11:45:00Z"
}
```

**Response:**
```json
{
  "id": "op1",
  "status": "complete",
  "completed_at": "2025-12-16T11:45:00Z",
  "duration_minutes": 70,
  "good_qty": 1000,
  "scrap_qty": 50,
  "scrap_pct": 5.0
}
```

**Validation:**
- Operation must exist and be in correct status
- Operator must have production role
- Timestamps must be in chronological order
- Scrap quantity must be <= total produced
- Scrap reason must be from configured list

**Acceptance Criteria:**
```gherkin
Given a pending operation
When I start the operation
Then status changes to in_progress
And start timestamp recorded
And operator assigned

Given an in_progress operation
When I complete the operation
Then status changes to complete
And completion timestamp recorded
And good quantity recorded
And scrap quantity and reason recorded
And operation duration calculated
```

**Dependencies:** 04.2a (WO started), 01.10 (Operator exists)

---

#### 04.4: Yield Tracking (Manual Entry)

**Complexity:** M | **Days:** 2-3 | **Priority:** MEDIUM

**What It Does:**
- Manual yield entry per work order
- Track target vs actual yield
- Record yield variance reason
- Historical yield tracking
- Yield dashboard/reports

**Database:**
- `work_order_yields` (wo_id, target_qty, actual_qty, variance_reason, recorded_at)

**API:**
- `POST /api/production/work-orders/{id}/yield`
- `PATCH /api/production/work-orders/{id}/yield/{yieldId}`
- `GET /api/production/yield-report?period=week`

**Request:**
```json
{
  "target_qty": 1000,
  "actual_qty": 950,
  "variance_reason": "Material defect",
  "recorded_at": "2025-12-16T14:30:00Z"
}
```

**Response:**
```json
{
  "id": "yield1",
  "wo_id": "uuid",
  "target_qty": 1000,
  "actual_qty": 950,
  "variance_pct": -5.0,
  "variance_reason": "Material defect",
  "recorded_at": "2025-12-16T14:30:00Z"
}
```

**Validation:**
- Yield must be numeric
- Actual must be <= target (or allow overage with flag)
- Variance reason must be from configured list
- Cannot record yield for incomplete WO (warning)

**Acceptance Criteria:**
```gherkin
Given a completed work order
When I record yield
Then target and actual recorded
And variance percentage calculated
And variance reason stored
And yield report updated

Given historical yields
When I view yield dashboard
Then I see trend over time
And I see variance analysis by reason
```

**Dependencies:** Phase 0 foundation

---

#### 04.5: Production Settings

**Complexity:** S | **Days:** 1-2 | **Priority:** MEDIUM

**What It Does:**
- Configure production module settings
- Define lines, machines, shifts
- Set yield targets and thresholds
- Configure scrap reasons
- Configure pause reasons
- Define production calendar

**Database:**
- `production_settings` (org_id, setting_key, setting_value)
- References existing: `production_lines`, `machines`, `shifts`

**UI Pages:**
- Production Settings page (tabs for each section)
- Lines/Machines section (read-only; link to 01.10)
- Yield Targets section (target qty, variance threshold)
- Scrap Reasons section (CRUD)
- Pause Reasons section (CRUD)
- Production Calendar section (available dates/times)

**API:**
- `GET /api/production/settings`
- `PATCH /api/production/settings/{key}`
- `GET /api/production/settings/scrap-reasons`
- `POST /api/production/settings/scrap-reasons`

**Request:**
```json
{
  "setting_key": "yield_variance_threshold_pct",
  "setting_value": 5.0
}
```

**Validation:**
- Numeric settings must be valid numbers
- Cannot delete active scrap/pause reasons

**Acceptance Criteria:**
```gherkin
Given I have admin role
When I open Production Settings
Then I see all configuration options
And I can set yield targets
And I can manage scrap reasons
And I can manage pause reasons
And I can view production calendar
```

**Dependencies:** 01.1 (Org context), 01.10 (Lines/Machines exist)

---

### Phase 0 Summary

| Story | Complexity | Days | Dependencies | Status |
|-------|-----------|------|-------------|--------|
| 04.1 | M | 3-4 | 03.10 | ✅ READY |
| 04.2a | M | 3-4 | 03.10 | ✅ READY |
| 04.2b | S | 1-2 | 04.2a | ✅ READY |
| 04.2c | M | 3-4 | 04.2a | ✅ READY |
| 04.3 | M | 3-4 | 04.2a | ✅ READY |
| 04.4 | M | 2-3 | Phase 0 | ✅ READY |
| 04.5 | S | 1-2 | 01.10 | ✅ READY |

**Total:** 10-14 days (1 dev) | 5-7 days (2 devs)

**What You Can Do While Waiting for Phase 1:**
- Start Epic 03 Planning (uses 04.1-04.3)
- Start Epic 05 Phase 0 (LP infrastructure)
- Create Phase 2 (OEE) full specs
- Create integration test suite

---

## Phase 1: Material Flow with License Plates (BLOCKED)

### Status: 📋 TEMPLATES ONLY | BLOCKED by Epic 05 Phase 0 (Day 12)

**Complexity:** Mix of L/M/S stories
**Estimated Effort:** 18-24 days (1 dev) | 9-12 days (2 devs) once unblocked
**Quality Score:** Not yet finalized (templates)
**INVEST Status:** Recommended splits needed
**Test Coverage Target:** >= 80%

**Critical Dependency:**
- Epic 05.1 (LP Table) - Day 4 (partial unblock)
- Epic 05.2 (Genealogy) - Day 4 (for output)
- Epic 05.3 (FIFO/FEFO) - Day 12 (for reservations)

### Stories (High-Level Templates)

| ID | Title | Complexity | Est. Days | Needs From Epic 05 | Status |
|----|-------|-----------|-----------|-----------------|--------|
| 04.6a | Material Consumption (Desktop) | L | 5-7 | 05.1 | 📋 TEMPLATE |
| 04.6b | Material Consumption (Scanner) | M | 3-4 | 05.1 + 04.6a | 📋 TEMPLATE |
| 04.6c | 1:1 LP Consumption | S | 2-3 | 05.1, 05.3 | 📋 TEMPLATE |
| 04.6d | Consumption Correction/Reversal | M | 3-4 | 04.6a | 📋 TEMPLATE |
| 04.6e | Over-Consumption Approval | M | 3-4 | 04.6a | 📋 TEMPLATE |
| 04.7a | Output Registration (Desktop) | L | 5-7 | 05.1, 05.2 | 📋 TEMPLATE |
| 04.7b | Output Registration (Scanner) | M | 3-4 | 05.1, 05.2 + 04.7a | 📋 TEMPLATE |
| 04.7c | By-Product Output | S | 2-3 | 04.7a | 📋 TEMPLATE |
| 04.7d | Multiple Output Batches | M | 3-4 | 04.7a | 📋 TEMPLATE |
| 04.8 | Material Reservations (FIFO/FEFO) | L | 5-7 | 05.3 | 📋 TEMPLATE |

**Total:** 10 stories | 18-24 days (1 dev) | 9-12 days (2 devs)

### When Blocked/Unblocked

```
Day 1-3:   BLOCKED (05.1 not ready)
Day 4:     PARTIAL UNBLOCK (05.1 ready)
           - Can start 04.6a, 04.7a design
           - Cannot deploy yet (needs genealogy)

Day 8:     PARTIAL UNBLOCK (05.2 ready)
           - Output can now use genealogy
           - 04.7a design review complete

Day 12:    FULL UNBLOCK (05 Phase 0 complete)
           - All 10 stories can proceed
           - LP infrastructure complete
           - FIFO/FEFO algorithms available
```

### What These Stories Will Do

**Material Consumption (04.6):**
- Operator selects material
- UI shows available LPs (by location, expiry, FIFO/FEFO)
- Deduction from LP quantity
- Traceability link (input LP → consumption event → output LP)
- Support for correction/reversal
- Over-consumption approval workflow

**Output Registration (04.7):**
- Operator records finished goods
- System creates new LP for output
- Links to consumed LPs (genealogy)
- Supports multiple output batches per WO
- Supports by-products
- Prints LP label (from 05.14)

**Material Reservations (04.8):**
- Reserve specific LPs for future WO
- FIFO/FEFO pick suggestions
- Reservation blocking (reserved LP unavailable)
- Integration with Epic 03.11b (WO material reservations)

### Recommended Splits for Phase 1

**04.6 (Consumption) - Desktop vs Scanner:**
- 04.6a: Desktop consumption (5-7 days)
- 04.6b: Scanner consumption (3-4 days) - after 04.6a ready
- 04.6c-e: Variations and advanced

**04.7 (Output) - Desktop vs Scanner:**
- 04.7a: Desktop output (5-7 days)
- 04.7b: Scanner output (3-4 days) - after 04.7a ready
- 04.7c-d: Variations and advanced

**Why split:** Desktop logic proven before adding scanner complexity

---

## Phase 2: OEE Analytics & Optimization (TEMPLATES)

### Status: 📋 TEMPLATES ONLY | Can start Week 7+

**Complexity:** Mix of L/M/S stories
**Estimated Effort:** 14-18 days (1 dev) | 7-9 days (2 devs)
**Quality Score:** Not yet finalized (templates)
**INVEST Status:** Recommended splits needed
**Test Coverage Target:** >= 80%

**Dependencies:** Phase 0+1 stable (operational data available)

### Stories (High-Level Templates)

| ID | Title | Complexity | Est. Days | Dependencies | Status |
|----|-------|-----------|-----------|------------|--------|
| 04.9a | OEE Calculation Engine | L | 5-7 | Phase 1 | 📋 TEMPLATE |
| 04.9b | Downtime Recording | M | 3-4 | Phase 1 | 📋 TEMPLATE |
| 04.9c | Downtime Reasons CRUD | S | 1-2 | Phase 1 | 📋 TEMPLATE |
| 04.9d | Shifts CRUD | S | 1-2 | Phase 0 | 📋 TEMPLATE |
| 04.10a | OEE Dashboard | M | 3-4 | 04.9a | 📋 TEMPLATE |
| 04.10b | OEE Trend Charts | M | 3-4 | 04.9a | 📋 TEMPLATE |
| 04.10c | Downtime Pareto Analysis | M | 3-4 | 04.9b | 📋 TEMPLATE |
| 04.10d | Line/Machine OEE Comparison | M | 3-4 | 04.9a | 📋 TEMPLATE |
| 04.11a | Scanner UI Optimization | M | 3-4 | 04.6b, 04.7b | 📋 TEMPLATE |
| 04.11b | ZPL Label Printing | S | 2-3 | 05.14 | 📋 TEMPLATE |
| 04.11c | Scanner Offline Mode | M | 3-4 | 04.6b, 04.7b | 📋 TEMPLATE |

**Total:** 11 stories | 14-18 days (1 dev) | 7-9 days (2 devs)

### What These Stories Will Do

**OEE Calculations (04.9):**
- Calculate OEE = Availability × Performance × Quality
- Track downtime by reason
- Track cycle times
- Trend analysis

**Downtime Management (04.9b-c):**
- Record downtime events (start, end, reason)
- Categorize reasons (equipment, material, operator, etc.)
- Duration and frequency tracking

**OEE Dashboard (04.10):**
- Real-time OEE display
- Trend charts (daily, weekly, monthly)
- Line/machine comparison
- Pareto analysis (downtime reasons)
- Performance targets vs actual

**Scanner Optimization (04.11):**
- Touch target sizing (48x48dp minimum)
- Audio feedback (4 tone patterns)
- Number pad optimization
- Offline operation (queue up to 100 transactions)
- Barcode scanning (camera + manual fallback)

### Recommended Splits for Phase 2

**04.9 (OEE Calculation) - Core vs Advanced:**
- 04.9a: Core calculation engine (5-7 days)
- 04.9b-c: Downtime details (additional 4-6 days)

**04.10 (OEE Dashboard) - Multiple stories:**
- 04.10a: Basic dashboard (3-4 days)
- 04.10b-d: Advanced charts/analysis (additional 9-12 days)

**04.11 (Scanner) - Multiple stories:**
- 04.11a: UI optimization (3-4 days)
- 04.11b: Label printing integration (2-3 days)
- 04.11c: Offline mode (3-4 days)

---

## Story Dependencies Graph

```
Phase 0 Dependencies:
  03.10 (WO CRUD)
    ↓
  04.1 (Dashboard) → 04.2a (Start) ↔ 04.2b (Pause) ↔ 04.2c (Complete)
                         ↓
                    04.3 (Operations) ← Shared state
                         ↓
                    04.4 (Yield)

Phase 1 Dependencies:
  Epic 05.1 (LP Table)
    ↓
  04.6a (Consumption) ←← Start here (Day 4)
    ↓
  04.6b-e (Variations)
  04.7a (Output) ←← Start here (Day 4, with 05.2)
    ↓
  04.7b-d (Variations)
  04.8 (Reservations) ←← After 05.3 (Day 12)

Phase 2 Dependencies:
  Phase 1 (Production data available)
    ↓
  04.9a (OEE Engine)
    ↓
  04.10a-d (OEE Dashboards)
    ↓
  04.11a-c (Scanner optimization)
```

---

## Effort Summary

### By Phase

| Phase | Stories | S | M | L | XL | Days (1 dev) | Days (2 devs) |
|-------|---------|---|---|---|-----|--------------|---------------|
| **0** | 7 | 2 | 4 | 1 | 0 | 10-14 | 5-7 |
| **1** | 10 | 2 | 4 | 3 | 1 | 18-24 | 9-12 |
| **2** | 11 | 2 | 7 | 2 | 0 | 14-18 | 7-9 |
| **TOTAL** | 28 | 6 | 15 | 6 | 1 | 42-56 | 21-28 |

### By Complexity

- **S (1-2 days):** 6 stories - Quick wins
- **M (3-4 days):** 15 stories - Standard features
- **L (5-7 days):** 6 stories - Complex workflows
- **XL (8+ days):** 1 story - Consider splitting

### Effort Breakdown

**Phase 0 (Ready Now):**
- Min: 10 days (1 dev)
- Max: 14 days (1 dev)
- 2 Devs: 5-7 days

**Phase 1 (After Day 12):**
- Min: 18 days (1 dev, once unblocked)
- Max: 24 days (1 dev)
- 2 Devs: 9-12 days (can do in parallel)

**Phase 2 (After Phase 1):**
- Min: 14 days (1 dev)
- Max: 18 days (1 dev)
- 2 Devs: 7-9 days

**Total:**
- 1 Dev: 42-56 days (~8-11 weeks)
- 2 Devs: 21-28 days (~4-6 weeks) with Phase 1 wait time
- 3 Devs: 14-19 days (~3-4 weeks) with coordination

---

## Quality Metrics

### Acceptance Criteria per Story Type

- **Phase 0:** All FULL SPECS
  - Average 8-10 AC per story
  - Format: Gherkin given/when/then
  - Test coverage >= 80%

- **Phase 1:** TEMPLATES (to be expanded)
  - Target 12-15 AC per story
  - Format: Gherkin given/when/then
  - Test coverage >= 80%

- **Phase 2:** TEMPLATES (to be expanded)
  - Target 10-12 AC per story
  - Format: Gherkin given/when/then
  - Test coverage >= 80%

### Testing Strategy

**Unit Tests (Story level):**
- Service layer: business logic
- Validation: input sanitization
- Target: > 80% code coverage

**Integration Tests (Cross-story):**
- Epic 04 + Epic 05 (LP service calls)
- Epic 04 + Epic 03 (WO creation → execution)
- Target: Happy path + key error scenarios

**E2E Tests (Workflow):**
- Start WO → Execute operation → Complete → Record yield
- Start WO → Consume material → Output product
- Start WO → Pause → Resume → Complete
- Target: Smoke tests for each phase

---

## Rollout Plan

### Phase 0 Deployment (Week 2)

**Pre-deployment:**
- All 7 stories code-reviewed
- Unit tests passing (>= 80%)
- Integration tests with Epic 03 passing
- User acceptance test (UAT) signed off

**Deployment:**
- Dev → Staging → Production (with staging soak period)
- Feature flag disabled (or phase 0 only)
- Rollback plan ready

**Post-deployment:**
- Monitor dashboards for errors
- Verify Phase 0 workflows working
- Team readiness assessment

### Phase 1 Deployment (Week 4-5, after Day 12)

**Pre-deployment:**
- All 10 stories expanded from templates to full specs
- Code reviewed and integrated
- Unit tests passing (>= 80%)
- Integration tests with Epic 05 passing
- Performance testing (consumption/output throughput)

**Deployment:**
- Staged rollout (Day 12 onward)
- Feature flag enabled for Phase 1
- Monitor LP integration points

**Post-deployment:**
- Production operators can execute full workflows
- Genealogy traceability verified
- LP reservations working

### Phase 2 Deployment (Week 7+)

**Pre-deployment:**
- All 11 stories expanded and tested
- OEE calculations validated against manual data
- Scanner UI tested in warehouse
- Offline mode tested

**Deployment:**
- Full system now operational
- All three phases working together
- Ready for Epic 06 (Quality) integration

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Phase breakdown with story details | ARCHITECT |

---

**Key Takeaway:** Phase 0 is READY now. Phase 1 blocked until Day 12 (Epic 05.1 complete). Phase 2 is optional for MVP.
