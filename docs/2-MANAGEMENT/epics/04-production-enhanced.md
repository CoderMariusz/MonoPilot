# Epic 4: Production Execution - Enhanced

**Status:** MVP DONE + Enhancements PLANNED
**Module:** Production
**PRD Reference:** `docs/1-BASELINE/product/modules/04-production.md`

---

## Overview

Epic 4 obejmuje pelna realizacje modulu Production - od podstawowego lifecycle WO (MVP) po zaawansowane funkcje jak OEE, digital SOP, i offline mode (Phase 2-3).

### MVP Scope (DONE)
- WO lifecycle (start, pause, resume, complete)
- Material consumption (desktop + scanner)
- Output registration (desktop + scanner)
- By-product handling
- Yield tracking
- Genealogy/traceability

### Enhancement Scope (PLANNED)
- WO management (split, merge, clone, hold)
- Advanced execution (SOP, photos, time tracking)
- Consumption enhancements (substitution, backflush)
- Output enhancements (rework, scrap, quality grades)
- Performance analytics (OEE, yield variance)
- Scanner improvements (voice, offline)

---

## Part 1: MVP Stories (DONE)

### Track A - WO Lifecycle

| Story | Tytul | Priority | Status | FR |
|-------|-------|----------|--------|-----|
| 4.1 | Production Dashboard | Must | DONE | FR-PROD-001 |
| 4.2 | WO Start | Must | DONE | FR-PROD-002 |
| 4.3 | WO Pause/Resume | Must | DONE | FR-PROD-003 |
| 4.4 | Operation Start | Must | DONE | FR-PROD-004 |
| 4.5 | Operation Complete | Must | DONE | FR-PROD-004 |
| 4.6 | WO Complete | Must | DONE | FR-PROD-005 |

### Track B - Consumption

| Story | Tytul | Priority | Status | FR |
|-------|-------|----------|--------|-----|
| 4.7 | Material Consumption (Desktop) | Must | DONE | FR-PROD-006 |
| 4.8 | Material Consumption (Scanner) | Must | DONE | FR-PROD-007 |
| 4.9 | 1:1 Consumption Enforcement | Must | DONE | FR-PROD-008 |
| 4.10 | Consumption Correction | Must | DONE | FR-PROD-009 |
| 4.11 | Over-Consumption Control | Must | DONE | FR-PROD-010 |

### Track C - Output & Genealogy

| Story | Tytul | Priority | Status | FR |
|-------|-------|----------|--------|-----|
| 4.12 | Output Registration (Desktop) | Must | DONE | FR-PROD-011 |
| 4.13 | Output Registration (Scanner) | Must | DONE | FR-PROD-012 |
| 4.14 | By-Product Registration | Must | DONE | FR-PROD-013 |
| 4.15 | Yield Tracking | Must | DONE | FR-PROD-014 |
| 4.16 | Multiple Outputs per WO | Must | DONE | FR-PROD-015 |
| 4.17 | Production Settings Configuration | Must | DONE | - |
| 4.18 | LP Updates After Consumption | Must | DONE | - |
| 4.19 | Genealogy Record Creation | Must | DONE | - |
| 4.20 | Operation Timeline View | Should | DONE | - |

**MVP Summary:** 21 stories, 100% DONE

---

## Part 2: Enhancement Stories (PLANNED)

### Phase 2A - WO Management Enhancements

#### Story 4.21: WO Hold/Release Workflow

**As a** Production Manager,
**I want to** place a WO on hold when there's a quality or operational issue,
**So that** production is paused until the issue is resolved.

**Acceptance Criteria:**
- Given: WO is in_progress or paused
- When: Manager clicks "Place on Hold"
- Then: Modal prompts for hold reason (Quality Issue, Material Problem, Equipment Failure, Other)
- And: Notes field required
- And: WO status -> on_hold
- And: held_at timestamp and held_by_user_id recorded
- And: Activity log created

- Given: WO is on_hold
- When: Manager clicks "Release from Hold"
- Then: Resolution notes required
- And: WO status -> in_progress
- And: released_at timestamp recorded
- And: Hold duration calculated

**Priority:** Must | **Phase:** 2A | **Effort:** 3 SP

---

#### Story 4.22: WO Priority Management

**As a** Production Planner,
**I want to** assign priorities to Work Orders,
**So that** operators know which orders to process first.

**Acceptance Criteria:**
- Given: Any WO in draft or released status
- When: User sets priority (1-5, where 1 is highest)
- Then: Priority displayed on WO card/row
- And: Dashboard Active WOs sorted by priority

- Given: Multiple WOs with same priority
- Then: Sort by scheduled_date (earliest first)

- Given: Priority changes on in_progress WO
- Then: Alert shown to current operator

**UI:**
- Priority badge (color-coded: 1=red, 2=orange, 3=yellow, 4=green, 5=blue)
- Quick-edit priority from list view

**Priority:** Should | **Phase:** 2A | **Effort:** 2 SP

---

#### Story 4.23: WO Splitting

**As a** Production Planner,
**I want to** split a Work Order into smaller batches,
**So that** we can run partial production on different lines or shifts.

**Acceptance Criteria:**
- Given: WO in draft or released status with qty > 1
- When: User clicks "Split WO"
- Then: Modal shows split options:
  - Split into N equal parts
  - Split by qty (manual allocation)

- When: Confirming split
- Then: Original WO qty reduced
- And: New child WOs created (WO-001-A, WO-001-B pattern)
- And: Parent-child relationship recorded
- And: Materials re-allocated proportionally
- And: Original WO linked as parent

- Given: Child WO completed
- Then: Parent WO shows aggregated progress

**Validation:**
- Cannot split in_progress WO
- Minimum split qty = 1
- Max 10 child WOs per parent

**Priority:** Should | **Phase:** 2A | **Effort:** 5 SP

---

#### Story 4.24: WO Cloning

**As a** Production Planner,
**I want to** clone an existing Work Order,
**So that** I can quickly create similar orders.

**Acceptance Criteria:**
- Given: Any WO exists
- When: User clicks "Clone WO"
- Then: New WO created with:
  - Same product, qty, production line
  - New WO number (next in sequence)
  - Status = draft
  - New planned dates (default: tomorrow)
  - BOM snapshot copied from original (current version)

- When: Clone dialog opens
- Then: User can modify:
  - Quantity
  - Planned dates
  - Production line
  - Priority

**Priority:** Should | **Phase:** 2A | **Effort:** 2 SP

---

### Phase 2B - Execution Enhancements

#### Story 4.25: Operator Notes on WO

**As an** Operator,
**I want to** add notes and comments to a Work Order,
**So that** important observations are recorded.

**Acceptance Criteria:**
- Given: WO is in_progress
- When: Operator clicks "Add Note"
- Then: Modal with text area (max 1000 chars)
- And: Optional category: Observation, Issue, Quality, Other

- When: Note saved
- Then: Displayed in WO timeline
- And: Timestamp and user recorded
- And: Notes visible on WO detail page

- Given: Multiple notes exist
- Then: Sorted chronologically (newest first)
- And: Filter by category available

**Priority:** Must | **Phase:** 2B | **Effort:** 2 SP

---

#### Story 4.26: Photo Capture During Production

**As an** Operator,
**I want to** capture photos during production,
**So that** there's visual evidence of quality or issues.

**Acceptance Criteria:**
- Given: WO is in_progress
- When: Operator clicks "Capture Photo" (desktop or scanner)
- Then: Camera access requested (browser API)
- And: Photo preview shown
- And: Optional caption/description

- When: Photo saved
- Then: Uploaded to storage (S3 or Supabase Storage)
- And: Thumbnail displayed in WO timeline
- And: Linked to WO and current operation (if any)

- Given: Multiple photos exist
- Then: Gallery view available on WO detail

**Scanner UX:**
- Large "Camera" button
- Quick capture mode (tap to capture)
- Swipe to retake

**Priority:** Should | **Phase:** 2B | **Effort:** 5 SP

---

#### Story 4.27: Time Tracking per Operation

**As a** Production Manager,
**I want to** track detailed time for each operation,
**So that** I can analyze efficiency and plan better.

**Acceptance Criteria:**
- Given: Operation started
- Then: Timer starts automatically

- When: Operation paused (break, issue)
- Then: Track pause separately:
  - Setup time
  - Run time
  - Wait time
  - Cleanup time

- When: Operation completed
- Then: Total time = setup + run + cleanup
- And: Efficiency = planned_duration / actual_duration * 100%

- Given: Manager views operation details
- Then: Time breakdown pie chart shown

**Priority:** Should | **Phase:** 2B | **Effort:** 3 SP

---

### Phase 2C - Consumption Enhancements

#### Story 4.28: Material Substitution

**As an** Operator,
**I want to** substitute a material with an approved alternative,
**So that** production continues when primary material is unavailable.

**Acceptance Criteria:**
- Given: BOM item has alternative materials defined (is_alternative = true)
- And: Primary material LP not available
- When: Operator selects "Use Alternative"
- Then: List of approved alternatives shown

- When: Alternative selected
- Then: Consumption recorded with:
  - substitute_for_material_id reference
  - substitution_reason (Out of Stock, Quality Issue, Other)
  - substitution_approved_by (if setting requires)

- Given: Setting allow_material_substitution = false
- Then: Substitution option hidden

**Validation:**
- Alternative must be defined in BOM
- UoM conversion applied if different
- Audit trail for all substitutions

**Priority:** Must | **Phase:** 2C | **Effort:** 5 SP

---

#### Story 4.29: Backflush Consumption

**As a** Production Manager,
**I want to** enable backflush consumption,
**So that** materials are auto-consumed proportionally when output is registered.

**Acceptance Criteria:**
- Given: Setting backflush_consumption = true
- When: Output registered
- Then: System calculates: output_qty / planned_qty * material_required_qty
- And: Auto-consumes from reserved LPs (FIFO)
- And: Creates consumption records automatically

- Given: Not enough reserved material
- Then: Warning shown, partial backflush executed
- And: Manager alerted for manual consumption

- Given: Setting backflush_consumption = false
- Then: Standard manual consumption workflow

**Configuration:**
- Per-organization toggle
- Optional per-BOM item override (manual_consumption_required)

**Priority:** Should | **Phase:** 2C | **Effort:** 5 SP

---

#### Story 4.30: Under-Consumption Alert

**As a** Production Manager,
**I want to** be alerted when consumption is significantly below expected,
**So that** potential waste or theft can be investigated.

**Acceptance Criteria:**
- Given: WO completed
- When: actual_consumed < (expected * 0.9) for any material
- Then: Alert created: "Under-consumption detected: {material} - {variance}%"
- And: Alert visible on dashboard
- And: Email notification to manager (if configured)

- Given: Manager reviews alert
- Then: Can mark as: Acknowledged, Investigated, Resolved
- And: Resolution notes required

**Threshold:** Configurable per organization (default: 10% variance)

**Priority:** Should | **Phase:** 2C | **Effort:** 3 SP

---

### Phase 2D - Output Enhancements

#### Story 4.31: Scrap Recording with Reason Codes

**As an** Operator,
**I want to** record scrap during production,
**So that** waste is tracked and analyzed.

**Acceptance Criteria:**
- Given: WO is in_progress
- When: Operator clicks "Record Scrap"
- Then: Modal with:
  - Quantity scrapped
  - Reason code (dropdown): Machine Error, Material Defect, Operator Error, Quality Reject, Other
  - Notes (optional)
  - Operation reference (if applicable)

- When: Scrap recorded
- Then: WO.scrap_qty updated
- And: Scrap record linked to WO
- And: Yield recalculated: (output - scrap) / planned

- Given: Manager views WO
- Then: Scrap summary shown with cost impact

**Scrap LP:**
- Optional: Create scrap LP for disposal tracking
- Location: Scrap bin (configurable)

**Priority:** Must | **Phase:** 2D | **Effort:** 3 SP

---

#### Story 4.32: Rework Tracking

**As a** Production Manager,
**I want to** track rework of defective output,
**So that** rework costs and reasons are visible.

**Acceptance Criteria:**
- Given: Output LP with qa_status = 'failed' or 'hold'
- When: Manager selects "Send to Rework"
- Then: Options:
  - Create Rework WO (new WO linked to original)
  - Inline rework (same WO, additional operations)

- When: Rework WO created
- Then: is_rework = true flag
- And: original_wo_id reference
- And: BOM simplified (rework operations only)

- When: Rework completed
- Then: Output LP qa_status can be re-evaluated
- And: Total WO cost includes rework cost

**Priority:** Must | **Phase:** 2D | **Effort:** 5 SP

---

#### Story 4.33: Output Quality Grade

**As an** Operator,
**I want to** assign a quality grade to output,
**So that** different grades are tracked separately.

**Acceptance Criteria:**
- Given: Output registration
- When: Setting require_quality_grade = true
- Then: Grade selection required: A, B, C, Reject

- When: Grade assigned
- Then: Output LP tagged with grade
- And: Grade displayed on LP label

- Given: Product has grade-based pricing
- Then: Grade affects inventory valuation

**Reporting:**
- Grade distribution by product
- Grade trend over time

**Priority:** Should | **Phase:** 2D | **Effort:** 2 SP

---

### Phase 2E - Performance Analytics

#### Story 4.34: OEE Calculation

**As a** Production Manager,
**I want to** see real-time OEE metrics,
**So that** I can monitor and improve production efficiency.

**Acceptance Criteria:**
- **Availability** = (Planned - Downtime) / Planned * 100
  - Downtime = sum of pause durations + hold durations

- **Performance** = (Actual Output / Planned Output) * 100
  - Based on standard cycle time vs actual

- **Quality** = (Good Output / Total Output) * 100
  - Good = Total - Scrap - Rework

- **OEE** = Availability * Performance * Quality / 10000

- Given: Dashboard view
- When: OEE widget enabled
- Then: Display:
  - Current shift OEE
  - Today OEE
  - Week/Month trend
  - Drill-down to component metrics

**Visualization:**
- OEE gauge (0-100%)
- Component bar chart
- Trend line chart

**Priority:** Must | **Phase:** 2E | **Effort:** 8 SP

---

#### Story 4.35: Yield Variance Analysis

**As a** Production Manager,
**I want to** analyze yield variances with drill-down,
**So that** I can identify root causes of losses.

**Acceptance Criteria:**
- Given: WO completed
- Then: Calculate variances:
  - Output variance: actual - planned
  - Material variance: consumed - expected (per material)
  - Time variance: actual - planned duration

- When: Manager clicks "Analyze Variance"
- Then: Drill-down view shows:
  - Variance by material
  - Variance by operation
  - Variance by shift
  - Variance by operator

- Given: Variance > threshold (configurable)
- Then: Automatically flagged for review
- And: Supervisor notified

**Reporting:**
- Variance trend over time
- Top variance contributors
- Export to CSV/PDF

**Priority:** Must | **Phase:** 2E | **Effort:** 5 SP

---

#### Story 4.36: Loss Categorization

**As a** Production Manager,
**I want to** categorize production losses,
**So that** I can focus improvement efforts.

**Acceptance Criteria:**
- **Loss Categories:**
  - Process Loss: expected waste from process
  - Quality Loss: scrap, rework, rejects
  - Material Loss: over-consumption, damage
  - Time Loss: downtime, changeover, breaks
  - Other Loss: unexplained variance

- Given: WO completed
- When: Losses calculated
- Then: Auto-categorize based on data:
  - Scrap records -> Quality Loss
  - Pause records -> Time Loss
  - Over-consumption -> Material Loss

- Given: Manager reviews losses
- Then: Can recategorize with reason
- And: Comments added for root cause

**Dashboard Widget:**
- Pareto chart of losses by category
- Trend over time

**Priority:** Should | **Phase:** 2E | **Effort:** 3 SP

---

### Phase 3 - Scanner Enhancements

#### Story 4.37: Offline Mode for Scanner

**As an** Operator,
**I want to** continue working when network is unreliable,
**So that** production is not stopped by connectivity issues.

**Acceptance Criteria:**
- Given: Network connection lost
- When: Operator performs action (consumption, output)
- Then: Action queued locally (IndexedDB)
- And: "Offline Mode" indicator shown
- And: Queue count displayed

- When: Connection restored
- Then: Queue automatically synced
- And: Conflicts detected and reported
- And: Sync progress shown

- Given: Conflict detected (LP already consumed elsewhere)
- Then: Operator prompted to resolve
- And: Options: Retry, Skip, Alert Supervisor

**Sync Strategy:**
- Sync every 5 seconds when online
- Full sync on reconnect
- Max queue size: 100 actions

**Priority:** Must | **Phase:** 3 | **Effort:** 8 SP

---

#### Story 4.38: Voice Commands (Experimental)

**As an** Operator,
**I want to** use voice commands for hands-free operation,
**So that** I can work more efficiently with gloves/gear.

**Acceptance Criteria:**
- Given: Voice mode enabled in settings
- When: Operator says "Hey MonoPilot"
- Then: Voice listening activated

**Commands:**
- "Consume full LP" - auto-consume scanned LP
- "Output [number]" - register output qty
- "Pause production" - pause current WO
- "Show materials" - read remaining materials

- When: Command recognized
- Then: Audio confirmation
- And: Action executed

- When: Command not recognized
- Then: "Please repeat" prompt
- And: Show command list

**Tech:** Web Speech API (Chrome/Edge)

**Priority:** Could | **Phase:** 3 | **Effort:** 8 SP

---

#### Story 4.39: Multi-WO Mode Scanner

**As an** Operator,
**I want to** switch between multiple WOs without returning to menu,
**So that** I can efficiently handle concurrent orders.

**Acceptance Criteria:**
- Given: Operator working on WO-A
- When: Scans WO-B barcode
- Then: Quick switch prompt: "Switch to WO-B?"

- When: Confirmed
- Then: WO-B loaded
- And: WO-A remains accessible via "Recent WOs" dropdown

- Given: Multiple WOs in progress
- Then: Sidebar shows up to 5 recent WOs
- And: One-tap switch

**UX:**
- Bottom nav: Current WO | Recent | Menu
- Color coding per WO status

**Priority:** Should | **Phase:** 3 | **Effort:** 3 SP

---

## Story Summary

### Phase Distribution

| Phase | Stories | Story Points | Priority |
|-------|---------|--------------|----------|
| **MVP (DONE)** | 21 | - | Must |
| **Phase 2A** | 4 | 12 SP | Mixed |
| **Phase 2B** | 3 | 10 SP | Mixed |
| **Phase 2C** | 3 | 13 SP | Mixed |
| **Phase 2D** | 3 | 10 SP | Mixed |
| **Phase 2E** | 3 | 16 SP | Must/Should |
| **Phase 3** | 3 | 19 SP | Mixed |
| **Total Enhanced** | 19 | 80 SP | - |

### Priority Summary (Enhancements)

| Priority | Count | Stories |
|----------|-------|---------|
| Must | 7 | 4.21, 4.28, 4.31, 4.32, 4.34, 4.35, 4.37 |
| Should | 8 | 4.22, 4.23, 4.24, 4.27, 4.29, 4.30, 4.36, 4.39 |
| Could | 4 | 4.25, 4.26, 4.33, 4.38 |

---

## Recommended Implementation Order

### Sprint 1-2: Phase 2A (WO Management)
1. 4.21 WO Hold/Release (Must)
2. 4.22 WO Priority (Should)
3. 4.24 WO Cloning (Should)
4. 4.25 Operator Notes (Must - foundational)

### Sprint 3-4: Phase 2C + 2D (Consumption & Output)
1. 4.28 Material Substitution (Must)
2. 4.31 Scrap Recording (Must)
3. 4.32 Rework Tracking (Must)
4. 4.30 Under-Consumption Alert (Should)

### Sprint 5-6: Phase 2E (Analytics)
1. 4.34 OEE Calculation (Must)
2. 4.35 Yield Variance Analysis (Must)
3. 4.36 Loss Categorization (Should)

### Sprint 7-8: Phase 2B + Remaining
1. 4.26 Photo Capture (Should)
2. 4.27 Time Tracking (Should)
3. 4.23 WO Splitting (Should)
4. 4.29 Backflush Consumption (Should)

### Sprint 9-10: Phase 3 (Scanner)
1. 4.37 Offline Mode (Must)
2. 4.39 Multi-WO Mode (Should)
3. 4.33 Quality Grade (Should)

### Future: Experimental
- 4.38 Voice Commands (Could)

---

## Dependencies

```
MVP Stories
    |
    v
[4.21 WO Hold] ---------> [4.32 Rework] (needs hold status)
    |
    v
[4.25 Notes] -----------> [4.26 Photos] (same timeline system)
    |
    v
[4.31 Scrap] -----------> [4.34 OEE] (needs scrap data)
    |
    v
[4.28 Substitution] ----> [4.29 Backflush] (affects consumption flow)
    |
    v
[4.34 OEE] + [4.35 Variance] --> [4.36 Loss Categorization]
```

---

## Technical Considerations

### New Database Tables (Phase 2)

```sql
-- WO Notes
CREATE TABLE wo_notes (
    id UUID PRIMARY KEY,
    wo_id UUID REFERENCES work_orders(id),
    category TEXT, -- observation, issue, quality, other
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- WO Photos
CREATE TABLE wo_photos (
    id UUID PRIMARY KEY,
    wo_id UUID REFERENCES work_orders(id),
    operation_id UUID REFERENCES wo_operations(id),
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    caption TEXT,
    created_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- Scrap Records
CREATE TABLE scrap_records (
    id UUID PRIMARY KEY,
    wo_id UUID REFERENCES work_orders(id),
    operation_id UUID REFERENCES wo_operations(id),
    quantity NUMERIC NOT NULL,
    reason_code TEXT NOT NULL,
    notes TEXT,
    scrap_lp_id UUID REFERENCES license_plates(id),
    created_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- WO Holds
CREATE TABLE wo_holds (
    id UUID PRIMARY KEY,
    wo_id UUID REFERENCES work_orders(id),
    hold_reason TEXT NOT NULL,
    held_at TIMESTAMPTZ NOT NULL,
    held_by UUID REFERENCES auth.users(id),
    released_at TIMESTAMPTZ,
    released_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    duration_minutes INTEGER
);

-- OEE Metrics (materialized for performance)
CREATE TABLE oee_metrics (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    production_line_id UUID REFERENCES machines(id),
    metric_date DATE,
    shift TEXT,
    availability_pct NUMERIC,
    performance_pct NUMERIC,
    quality_pct NUMERIC,
    oee_pct NUMERIC,
    calculated_at TIMESTAMPTZ
);
```

### work_orders Table Extensions

```sql
ALTER TABLE work_orders ADD COLUMN priority INTEGER DEFAULT 3;
ALTER TABLE work_orders ADD COLUMN is_rework BOOLEAN DEFAULT false;
ALTER TABLE work_orders ADD COLUMN original_wo_id UUID REFERENCES work_orders(id);
ALTER TABLE work_orders ADD COLUMN parent_wo_id UUID REFERENCES work_orders(id);
ALTER TABLE work_orders ADD COLUMN scrap_qty NUMERIC DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN held_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN held_by_user_id UUID;
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial enhanced epic with 19 new stories |
