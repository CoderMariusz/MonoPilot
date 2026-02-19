# Maintenance/CMMS Module (14-Maintenance) Analysis

**Date**: 2026-02-16
**Status**: NEW MODULE - Planning Phase
**Priority**: P1 (Enables preventive maintenance strategy)

---

## Executive Summary

The **Maintenance/CMMS module (14-Maintenance)** is a NEW module planned as **Epic 14** in the MonoPilot roadmap. This analysis consolidates all existing references to maintenance across the codebase and defines what a comprehensive CMMS module would require.

Currently, maintenance is mentioned in three contexts:
1. **Machine status field** in Settings (MAINTENANCE status)
2. **Downtime tracking** in OEE/Production (reactive tracking)
3. **MTBF/MTTR metrics** in OEE (reliability indicators)

**None of these address proactive maintenance planning, scheduling, or spare parts management.**

This module bridges the gap between downtime tracking (reactive) and true maintenance management (proactive).

---

## 1. EXISTING REFERENCES: Where Maintenance Is Mentioned

### 1.1 Settings Module (01-Settings)

**File**: `/workspaces/MonoPilot/new-doc/01-settings/other/machines.md`

**Current State**:
- Machine status enum includes `MAINTENANCE` status
- **No maintenance scheduling configuration**
- **No preventive maintenance plan storage**
- **No maintenance history tracking**

**Relevant Code**:
```typescript
// Machine Status Enum (4 statuses)
type MachineStatus =
  | 'ACTIVE'
  | 'MAINTENANCE'      // ← Exists but unused
  | 'OFFLINE'
  | 'DECOMMISSIONED'
```

**PRD Reference**: FR-SET-052 "Machine status (active/maintenance/offline)" and FR-SET-054 "Maintenance schedule configuration" (Phase 2, not yet implemented)

---

### 1.2 Production Module (06-Production)

**File**: `/workspaces/MonoPilot/new-doc/06-production/prd/production.md`

**Downtime Categories**:
Story 04.9b (Downtime Tracking) defines these downtime categories:
- Planned: `maintenance` (automatic is_planned = true)
- Unplanned: `breakdown`, `quality_issue`, etc.

**Maintenance References**:
```typescript
// From downtime category defaults
{
  code: 'maintenance',
  label: 'Maintenance',
  is_planned: true
}

// Default reason codes for maintenance category
{
  code: 'SCHEDULED_PM',
  label: 'Scheduled PM'
},
{
  code: 'CALIBRATION',
  label: 'Calibration'
},
{
  code: 'LUBRICATION',
  label: 'Lubrication'
},
{
  code: 'INSPECTION',
  label: 'Inspection'
}
```

**Machine Status Integration** (FR-PROD-020):
When downtime logged with category "maintenance" → machine status set to `MAINTENANCE`

**Limitation**: Only allows logging that maintenance happened (reactive). Does NOT plan when maintenance should occur.

---

### 1.3 OEE Module (12-OEE)

**File**: `/workspaces/MonoPilot/new-doc/12-oee/stories/10.16.mtbf-mttr-calculation.md`

**MTBF/MTTR Calculation** (Story 10.16):
- Calculates Mean Time Between Failures (MTBF)
- Calculates Mean Time To Repair (MTTR)
- Tracks failure frequency and repair times
- Identifies unreliable machines for **preventive maintenance prioritization**

**User Story**:
> "As a **Maintenance Manager**, I want to **track MTBF and MTTR for each machine** so that **I can prioritize preventive maintenance and reduce unplanned downtime**."

**Key Insight**: OEE module recognizes need for preventive maintenance but doesn't implement the scheduling/task management layer.

**Scope**: Calculate metrics only, NOT manage maintenance schedules.

---

### 1.4 OEE Downtime Tracking

**File**: `/workspaces/MonoPilot/new-doc/12-oee/ux/OEE-002-downtime-event-tracking.md`

**Maintenance Workflow Hints** (in corrective action field):
```
Corrective Action Taken:
"Replaced conveyor motor (Part #: MOT-2024-456). Tested new motor at
full load for 5 minutes. Scheduled preventive maintenance check for
remaining motors on this line."

[ ] Create maintenance task for preventive check   ← CHECKBOX EXISTS
[ ] Notify maintenance manager
```

**Discovery**: Downtime logging already has a checkbox "Create maintenance task for preventive check" but this feature is NOT implemented.

---

### 1.5 OEE TPM & Benchmarking

**File**: `/workspaces/MonoPilot/new-doc/12-oee/stories/10.19.tpm-benchmarking.md`

**TPM Integration Scope** (Story 10.19):
- Link maintenance schedule to machine availability
- Track planned vs unplanned maintenance
- Maintenance impact on OEE
- Preventive maintenance effectiveness score

**Key Quote**:
> "TPM Integration: Link maintenance schedule to machine availability"

**Status**: Story in "ready" phase, Phase 3, but NO implementation details beyond linking to availability.

---

### 1.6 Discovery Report

**File**: `/workspaces/MonoPilot/new-doc/00-foundation/other/discovery/DISCOVERY-REPORT-V4.md`

**Predictive Maintenance Gap**:
> "Predictive Maintenance & Anomaly Detection: Utilize machine-learning models to analyse sensor and production data. Predictive maintenance reduces unplanned downtime, a key benefit highlighted in industry reports. Start with pilot projects using available machine data and extend models across machines."

**Improvement Suggestion #4**: Energy & CO₂ Tracking (not maintenance-specific but related).

---

## 2. CURRENT STATE: What Exists Today

### 2.1 Database Schema

**Tables Involved**:

| Table | Fields | Use Case |
|-------|--------|----------|
| `machines` | `status` (enum: ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED) | Manual status tracking only |
| `downtime_logs` | `category`, `is_planned`, `started_at`, `ended_at` | Reactive downtime tracking (story 04.9b) |
| `oee_downtime_reasons` | Reason codes for downtime categorization | Categorize downtime causes |
| `oee_shift_metrics` | MTBF, MTTR calculations | Calculate reliability metrics (story 10.16) |

**Missing Tables**:
- `maintenance_schedules` - Preventive maintenance plans
- `maintenance_work_orders` - Tasks to be performed
- `maintenance_history` - Log of what was done
- `spare_parts_inventory` - Track spare parts stock
- `maintenance_kits` - Group parts for a maintenance task
- `calibration_records` - Track calibration dates and results
- `tpm_tasks` - Total Productive Maintenance tasks

### 2.2 API Endpoints

**Existing Endpoints** (related to maintenance):

| Endpoint | Purpose | Module |
|----------|---------|--------|
| `POST /api/production/downtime` | Log unplanned downtime | Production |
| `GET /api/oee/analytics/mtbf` | Calculate reliability metrics | OEE |
| `PATCH /api/machines/:id` | Update machine status (can set to MAINTENANCE) | Settings |

**Missing Endpoints**:
- No preventive maintenance scheduling API
- No maintenance work order management API
- No spare parts tracking API
- No maintenance calendar/history API

### 2.3 Frontend Features

**What's Possible**:
- Set machine status to "MAINTENANCE" manually
- Log downtime with "maintenance" category
- View MTBF/MTTR metrics on OEE dashboard

**What's Missing**:
- Maintenance schedule creation/editing UI
- Preventive maintenance calendar
- Work order assignment interface
- Spare parts inventory management
- Maintenance history timeline

### 2.4 Integration Points Needed

**Currently Can**:
→ Machine Status field signals maintenance needed (manual)
→ Downtime logging creates reactive record
→ MTBF/MTTR identifies unreliable machines

**Need to Add**:
→ Automated creation of maintenance WOs when MTBF threshold hit
→ Linking downtime → maintenance task creation
→ Scheduling future maintenance based on preventive plan
→ Tracking spare parts consumption

---

## 3. FEATURE REQUIREMENTS: What a CMMS Module Needs

A comprehensive Computerized Maintenance Management System (CMMS) module should provide:

### 3.1 Preventive Maintenance Scheduling

**Requirements**:
- **Time-Based PM**: Schedule by calendar interval (e.g., every 1000 hours, weekly, monthly)
- **Usage-Based PM**: Schedule by machine counter (e.g., every 5000 units produced)
- **Condition-Based PM**: Trigger by sensor threshold (e.g., temperature rise)
- **PM Templates**: Reusable maintenance plans for machine types
- **Escalation**: Auto-create urgent tasks when intervals exceeded

**Database Fields**:
```sql
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  name TEXT,                    -- "Annual Motor Inspection"
  description TEXT,

  -- Timing
  schedule_type TEXT CHECK (schedule_type IN ('time', 'usage', 'condition')),
  interval_value INTEGER,       -- e.g., 1000 (hours) or 365 (days)
  interval_unit TEXT,           -- 'hours', 'days', 'cycles', 'units_produced'

  -- Thresholds
  warning_threshold_pct INTEGER DEFAULT 80,  -- Alert at 80% of interval
  urgent_threshold_pct INTEGER DEFAULT 95,   -- Create task at 95%

  -- Details
  estimated_duration_minutes INTEGER,
  required_technician_level TEXT,  -- 'basic', 'advanced', 'specialist'
  spare_parts_kit_id UUID,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 3.2 Maintenance Work Orders

**Requirements**:
- Create work orders (WO for maintenance, separate from production WOs)
- Assign to technicians by skill level
- Track status: Scheduled → In Progress → Completed → Verified
- Link to spare parts consumption
- Capture labor hours

**Database Fields**:
```sql
CREATE TABLE maintenance_work_orders (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,
  schedule_id UUID REFERENCES maintenance_schedules,

  -- Identity
  wo_number TEXT UNIQUE,        -- MWO-2026-00001
  title TEXT,
  description TEXT,

  -- Planning
  scheduled_date DATE,
  estimated_duration_minutes INTEGER,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Assignment
  assigned_to_id UUID REFERENCES users,
  assigned_technician_level TEXT,

  -- Execution
  status TEXT DEFAULT 'scheduled',  -- scheduled, in_progress, completed, verified, canceled
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,

  -- Outcome
  result TEXT,                  -- success, partial, failed, deferred
  notes TEXT,

  -- Quality
  verified_by_id UUID,
  verified_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 3.3 Spare Parts Inventory

**Requirements**:
- Master spare parts catalog (name, SKU, cost, supplier)
- Current stock by location
- Reorder points and lead times
- Link parts to maintenance tasks
- Track consumption history

**Database Fields**:
```sql
CREATE TABLE spare_parts (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  code TEXT UNIQUE,             -- SP-MOTOR-001
  name TEXT,                    -- "3 HP Motor for Packaging Line"
  description TEXT,

  -- Identification
  manufacturer TEXT,
  part_number TEXT,
  supplier_id UUID,

  -- Economics
  cost DECIMAL(10,2),
  reorder_point INTEGER,
  reorder_qty INTEGER,
  lead_time_days INTEGER,

  is_active BOOLEAN DEFAULT true
);

CREATE TABLE spare_parts_stock (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  location_id UUID,             -- Warehouse location
  quantity INTEGER,
  last_counted_at TIMESTAMPTZ,

  UNIQUE(org_id, spare_part_id, location_id)
);

CREATE TABLE spare_parts_consumption (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  spare_part_id UUID NOT NULL,
  machine_id UUID,
  wo_id UUID,                   -- Maintenance WO that consumed it

  quantity_used INTEGER,
  date_used TIMESTAMPTZ,
  cost_actual DECIMAL(10,2),

  consumed_by_id UUID           -- Technician
);
```

### 3.4 Equipment History & Maintenance Log

**Requirements**:
- Complete maintenance history per machine
- Timeline view: PM scheduled → PM completed → downtime → repair
- Before/after notes and photos
- Cost accumulation per machine
- Trend analysis

**Database Fields**:
```sql
CREATE TABLE maintenance_history (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,

  -- Event
  event_type TEXT CHECK (event_type IN ('pm_scheduled', 'pm_completed', 'pm_skipped',
                                        'breakdown', 'repair', 'inspection', 'replacement')),
  title TEXT,
  description TEXT,

  -- Timing
  event_date TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Cost
  parts_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),

  -- Links
  wo_id UUID,
  downtime_log_id UUID,
  technician_id UUID,

  -- Quality
  before_photos TEXT[],         -- S3 URLs
  after_photos TEXT[],

  is_deleted BOOLEAN DEFAULT false
);
```

### 3.5 Calibration Tracking

**Requirements**:
- Calibration certificates and deadlines
- Calibration intervals (regulatory compliance)
- Calibration alerts when due
- Historical calibration records

**Database Fields**:
```sql
CREATE TABLE calibration_records (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  machine_id UUID NOT NULL,

  equipment_to_calibrate TEXT,  -- "Temperature Sensor", "Scale", "Pressure Gauge"
  standard_applied TEXT,        -- "ISO 9001", "NIST", etc.

  calibration_date DATE,
  next_due_date DATE,

  calibration_cert_url TEXT,    -- S3 URL
  performed_by TEXT,

  result TEXT CHECK (result IN ('pass', 'fail', 'out_of_spec')),

  is_active BOOLEAN DEFAULT true
);
```

### 3.6 Maintenance KPIs

**Requirements**:
- MTBF: Mean Time Between Failures (already in OEE)
- MTTR: Mean Time To Repair (already in OEE)
- **NEW**: PM effectiveness (% of failures prevented by scheduled PM)
- **NEW**: Maintenance cost per unit produced
- **NEW**: Schedule adherence (% of planned PM completed on time)
- **NEW**: Spare parts turnover ratio

**Calculations**:
```typescript
interface MaintenanceKPIs {
  // Existing (OEE)
  mtbf_hours: number;           // Hours between failures
  mttr_minutes: number;          // Average repair time

  // New
  pm_effectiveness_pct: number;  // % of failures prevented / total potential failures
  maintenance_cost_per_unit: number;  // Total maintenance cost / units produced
  schedule_adherence_pct: number;  // Completed on-time / scheduled count
  spare_parts_turnover: number;  // Usage rate per year

  unplanned_downtime_reduction: number;  // YoY improvement
}
```

---

## 4. DEPENDENCIES: Which Modules Need Changes

### 4.1 OEE Module (12-OEE) - HARD DEPENDENCY

**Current State**:
- Story 10.16 calculates MTBF/MTTR
- Story 10.19 mentions TPM integration

**Changes Needed**:
1. **Create automatic maintenance WO generation**:
   - When MTBF drops below threshold (e.g., last 10 failures in <500 hours)
   - Trigger auto-creation of preventive maintenance WO

2. **Link to maintenance schedules**:
   - OEE dashboard should show planned vs actual PM adherence
   - Maintenance effectiveness score

3. **Downtime analysis enhancement**:
   - Show which downtimes were preventable by scheduled PM
   - Calculate PM effectiveness % (failures prevented / potential)

**Database Changes**:
- Add foreign key: `downtime_logs.could_have_been_prevented` (bool)
- Add field: `oee_machine_metrics.last_pm_completion_date`

---

### 4.2 Settings Module (01-Settings) - SOFT DEPENDENCY

**Current State**:
- Machine status includes MAINTENANCE (unused)
- FR-SET-054 "Maintenance schedule configuration" (Phase 2, not done)

**Changes Needed**:
1. **Maintenance settings section** under `/settings/production`:
   - Default PM intervals for each machine type
   - Technician roles/skills configuration
   - Spare parts warehouse location
   - Alert thresholds

2. **Machine detail page enhancement**:
   - Add "Maintenance Plan" tab
   - Show upcoming PM schedule
   - Historical maintenance cost

3. **Integration with Settings API**:
   - GET/POST maintenance schedules (scoped by org/machine)
   - Validate technician skill levels exist

---

### 4.3 Production Module (06-Production) - SOFT DEPENDENCY

**Current State**:
- Story 04.9b logs downtime with category "maintenance"
- Machine status field exists

**Changes Needed**:
1. **Auto-create maintenance WO from downtime**:
   - When operator logs breakdown downtime
   - Checkbox "Create maintenance task" (already in UX wireframe OEE-002)
   - Auto-populate machine, reason, parts needed

2. **Production dashboard integration**:
   - Show "Next PM Due" date for each line
   - Highlight machines overdue for PM
   - Link to maintenance schedule

3. **Machine unavailability integration**:
   - When machine status = MAINTENANCE
   - Production dashboard should not schedule new WOs on that line
   - Capacity planning should exclude it

---

### 4.4 Warehouse Module (03-Warehouse) - OPTIONAL DEPENDENCY

**Current State**:
- Location management exists
- Spare parts inventory needs location tracking

**Changes Needed**:
1. **Spare parts location assignment**:
   - Allow assigning spare parts to warehouse locations
   - Track stock by location
   - Support bin/rack-level inventory

2. **Parts consumption from WO**:
   - Link maintenance WO to spare parts consumption
   - Auto-update location stock when parts used

---

## 5. COMPETITIVE ANALYSIS: What Competitors Offer

### 5.1 Enterprise CMMS Systems

| Feature | Maximo (IBM) | Infor | Aptean |
|---------|-------------|-------|--------|
| Preventive Maintenance Scheduling | ✓ Time/usage/condition-based | ✓ Extensive | ✓ Yes |
| Work Order Management | ✓ Advanced (complex workflows) | ✓ Yes | ✓ Yes |
| Spare Parts Inventory | ✓ Full supply chain | ✓ Yes | ✓ Yes |
| MTBF/MTTR Tracking | ✓ Yes | ✓ Yes | ✓ Yes |
| Mobile Work Instructions | ✓ iOS/Android | ✓ Yes | ✓ Yes |
| Predictive Maintenance | ✓ With IoT sensors | ⚠️ Limited | ✓ Growing |
| Cost Tracking | ✓ Detailed | ✓ Yes | ✓ Yes |
| **Pricing** | **$500K+** | **$200K-500K** | **$100K-300K** |
| **Target Market** | Enterprise | Large manufacturing | Mid-market |

**Key Insight**: MonoPilot targets SMBs (5-100 employees), where these systems are oversized and unaffordable.

### 5.2 SMB-Focused CMMS

| System | Key Feature | Pricing | Target |
|--------|------------|---------|--------|
| Fiix (Dude Solutions) | Cloud-based, mobile, IoT-ready | $50-150/user/mo | SMB/Mid-market |
| Maintenance Pro | Simple, spreadsheet alternative | $100-300/mo | Small manufacturing |
| Hippo CMMS | Time-based PM, basic WO tracking | $100-500/mo | Facilities, light manufacturing |
| **Market Gap** | **Integrated MES + CMMS** | **$50-100/user/mo** | **Food manufacturers 5-100 EEs** |

### 5.3 What MonoPilot Can Do Differently

**Competitive Advantages**:
1. **Integration with Production**: CMMS + Production WOs + Downtime in ONE system
2. **OEE-Driven**: Maintenance tied to OEE metrics and reliability goals
3. **Food Industry Focus**: Includes calibration tracking, sanitation PM, allergen verification
4. **Affordable**: $50/user/mo vs. $150+/user/mo for competitors
5. **Scanner-Ready**: Mobile maintenance task capture (already scanning infrastructure)

**Differentiators**:
- Downtime → Maintenance link (automatic task creation)
- Recipe-based PM (e.g., high-speed runs need more frequent PM)
- Spare parts linked to BOM (parts for specific product recipes)

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: MVP (P1 - Core Features)

**Stories**:
1. **14.1 Maintenance Schedules** - Time/usage-based PM
2. **14.2 Maintenance Work Orders** - Assign, track, complete
3. **14.3 Spare Parts Inventory** - Basic stock tracking
4. **14.4 Maintenance History** - View timeline per machine

**Estimated Effort**: 3-4 weeks (4 stories, ~12-15 story points)

**Dependencies**:
- OEE module (10.16 MTBF/MTTR) ✓ Ready
- Settings machine mgmt (01.10) ✓ Ready

---

### Phase 2: Enhancements (P2 - Integration)

**Stories**:
1. **14.5 Auto-Generate WOs** - From downtime breakdown → maintenance task
2. **14.6 Calibration Tracking** - Regulatory compliance
3. **14.7 Maintenance Dashboards** - KPIs, cost analysis
4. **14.8 Technician Scheduling** - Assign skills, schedule PM

**Estimated Effort**: 2-3 weeks (4 stories, ~10-12 story points)

**Dependencies**:
- Phase 1 complete
- OEE.TPM integration (10.19) ⚠️ Needs definition

---

### Phase 3: Advanced (P3 - Predictive)

**Stories**:
1. **14.9 Condition Monitoring** - Sensor-based PM triggers
2. **14.10 Predictive Maintenance** - ML-based failure prediction
3. **14.11 Spare Parts Forecasting** - Auto-replenishment

**Estimated Effort**: 3-4 weeks (3 stories, ~15-18 story points)

**Dependencies**:
- Phase 2 complete
- IIoT integration (Discovery recommendation)

---

## 7. RISK ASSESSMENT

### High Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Maintenance WO complexity** | Scope creep (workflow engine needed) | Start with simple status machine, extend later |
| **Spare parts integration** | Requires inventory management expertise | Link to Warehouse module (already has inventory) |
| **Technician skill matching** | Overengineering for small shops | Use simple skill levels: Basic, Advanced, Specialist |
| **OEE-CMMS coupling** | Changes in OEE break maintenance | Define clear API contracts between modules |

### Medium Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Calibration compliance** | Regulatory burden | Make optional per org, start with simple tracking |
| **Mobile UX for technicians** | Adoption if too complex | Reuse scanner patterns (already proven) |
| **Historical data migration** | Manual effort | Provide import template, not blocking for MVP |

---

## 8. SUCCESS CRITERIA

### MVP Launch (14.1-14.4)
- [ ] Create 10+ maintenance schedules per org
- [ ] Complete 50+ maintenance WOs per month
- [ ] Track spare parts consumption
- [ ] View machine maintenance timeline
- [ ] MTBF/MTTR improves by 10% over baseline

### Phase 2 Completion (14.5-14.8)
- [ ] Auto-create 80% of corrective PM from downtime
- [ ] Calibration alerts sent on schedule
- [ ] Maintenance cost per unit tracked
- [ ] Technicians can view assigned tasks on mobile

### Phase 3 (14.9-14.11)
- [ ] Predictive model trained on 6 months data
- [ ] Spare parts stock optimized (reduce stockouts by 30%)
- [ ] PM effectiveness score > 85%

---

## 9. RELATED DOCUMENTATION

### Links to Existing Code
- **Machine Status**: `/workspaces/MonoPilot/new-doc/01-settings/other/machines.md` (lines 314-335)
- **Downtime Tracking**: `/workspaces/MonoPilot/new-doc/06-production/stories/04.9b.downtime-tracking.md`
- **OEE MTBF/MTTR**: `/workspaces/MonoPilot/new-doc/12-oee/stories/10.16.mtbf-mttr-calculation.md`
- **OEE TPM**: `/workspaces/MonoPilot/new-doc/12-oee/stories/10.19.tpm-benchmarking.md`
- **OEE Downtime UX**: `/workspaces/MonoPilot/new-doc/12-oee/ux/OEE-002-downtime-event-tracking.md` (checkbox at line 167)

### PRD References
- **Settings PRD**: `docs/1-BASELINE/product/modules/settings.md` - FR-SET-050 through FR-SET-056 (Machines)
- **Production PRD**: `docs/1-BASELINE/product/modules/production.md` - FR-PROD-019, FR-PROD-020
- **OEE PRD**: `docs/1-BASELINE/product/modules/oee.md` - FR-OEE-022, FR-OEE-026, FR-OEE-027

### Discovery Report
- **Predictive Maintenance Gap**: `/workspaces/MonoPilot/new-doc/00-foundation/other/discovery/DISCOVERY-REPORT-V4.md` (lines 57-77)

---

## 10. QUESTIONS FOR PRODUCT

1. **Condition-Based PM**: Should MonoPilot support sensor-based triggers (Phase 3) from day one, or start with time/usage only?
2. **Technician Roles**: Do customers have specialized maintenance roles (electrician, mechanic) needing skill matching?
3. **Spare Parts Integration**: Should CMMS manage spare parts separately from production inventory, or unified?
4. **Regulatory Requirement**: Are calibration records mandatory for food manufacturing compliance (FSMA, BRC)?
5. **Mobile Priority**: Should maintenance WOs be scanner-first like production, or desktop-primary?

---

## Conclusion

The **Maintenance/CMMS module (14-Maintenance)** is critical to MonoPilot's competitive positioning. By closing the gap between reactive downtime tracking (OEE) and proactive maintenance planning (CMMS), MonoPilot enables customers to:

1. **Prevent breakdowns** before they happen (preventive maintenance)
2. **Optimize spare parts** inventory and costs
3. **Track equipment reliability** (MTBF/MTTR) with actionable plans
4. **Comply with regulations** (calibration, maintenance records)
5. **Reduce unplanned downtime** by 20-30%

With the OEE module foundations in place (10.16 MTBF/MTTR, 10.2 reason codes), the Maintenance module can be implemented in parallel or immediately after OEE Phase 1 without blocking dependencies.

---

**Document Status**: Analysis Complete - Ready for Epic Definition
**Last Updated**: 2026-02-16
**Next Step**: Create story structure (14.1 through 14.11) with formal acceptance criteria
