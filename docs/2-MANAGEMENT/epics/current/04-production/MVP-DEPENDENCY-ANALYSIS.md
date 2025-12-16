# Epic 04 Production - MVP Dependency Analysis

**Date:** 2025-12-16
**Status:** CRITICAL DEPENDENCY IDENTIFIED
**Conclusion:** Epic 04 has HARD dependency on Epic 05 (License Plates) for core production functionality. Recommend Phase Split strategy (Option B).

---

## Executive Summary

Analysis of Epic 04 (Production Module) reveals a **fundamental dependency on Epic 05 (Warehouse/License Plates)** that affects 10 of 28 total stories. Material consumption and output registration - the core production transactions - cannot function without the License Plate infrastructure.

**Key Finding:** Epic 04 CANNOT deliver full production functionality without Epic 05. However, 7 stories (Phase 0) can proceed immediately to provide WO lifecycle visibility and operations tracking.

**Recommendation:** Implement **Phase Split Strategy (Option B)** - Parallel development with clear phase boundaries:
- **Phase 0 (Epic 04a)**: 7 stories, no LP dependency, delivers WO lifecycle
- **Phase 1 (Epic 04b)**: 10 stories, requires Epic 05 LPs, delivers consumption/output
- **Phase 2**: 11 stories, OEE and analytics

---

## Module Dependency Matrix

```
+-----------------------------------------------------------------------------+
|              PRODUCTION MODULE REQUIRES FROM OTHER EPICS                     |
+-------------+-------------+-------------+-------------+---------------------+
| Production  | Settings    | Technical   | Planning    | Warehouse           |
| Needs       | Epic 01     | Epic 02     | Epic 03     | Epic 05             |
+-------------+-------------+-------------+-------------+---------------------+
| Org + RLS   | HARD        | -           | -           | -                   |
| Users       | HARD        | -           | -           | -                   |
| Roles       | HARD        | -           | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| Lines       | HARD        | -           | -           | -                   |
| Machines    | OPTIONAL    | -           | -           | -                   |
| Locations   | OPTIONAL    | -           | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| Products    | -           | HARD        | -           | -                   |
| BOMs        | -           | SOFT        | -           | -                   |
| BOM Items   | -           | SOFT        | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| Work Orders | -           | -           | HARD        | -                   |
| wo_materials| -           | -           | HARD        | -                   |
| wo_operations| -          | -           | HARD        | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| License Plates | -        | -           | -           | **HARD (Phase 1)**  |
| LP Genealogy| -           | -           | -           | **HARD (Phase 1)**  |
| LP Services | -           | -           | -           | **HARD (Phase 1)**  |
+-------------+-------------+-------------+-------------+---------------------+

+-----------------------------------------------------------------------------+
|              PRODUCTION MODULE PROVIDES TO DOWNSTREAM EPICS                  |
+-------------+-------------+-------------+-------------+---------------------+
| Production  | Quality     | Shipping    | Finance     | OEE                 |
| Provides    | Epic 06     | Epic 07     | Epic 09     | Epic 10             |
+-------------+-------------+-------------+-------------+---------------------+
| Output LPs  | HARD        | HARD        | -           | -                   |
| Genealogy   | HARD        | SOFT        | -           | -                   |
| WO Status   | SOFT        | -           | SOFT        | -                   |
| Yield Data  | -           | -           | HARD        | SOFT                |
| OEE Metrics | -           | -           | SOFT        | HARD (if separate)  |
+-------------+-------------+-------------+-------------+---------------------+

Legend:
- HARD = System breaks without it
- SOFT = Works but limited functionality
- OPTIONAL = Feature works if present, gracefully handles absence
```

---

## License Plate Dependency Analysis

### Why LPs Are Critical

The Production Module's core value proposition is:
1. **Consume materials from LPs** (traceability)
2. **Create output LPs** (finished goods inventory)
3. **Link consumed LPs to output LPs** (genealogy)

Without License Plates, production cannot:
- Track which materials were used
- Create inventory for finished goods
- Provide forward/backward traceability

### LP-Dependent Stories (10 Stories)

| Story | Feature | LP Usage |
|-------|---------|----------|
| 04.6a | Consumption Desktop | Reads/updates license_plates.qty |
| 04.6b | Consumption Scanner | Scans LP barcodes, validates LP |
| 04.6c | 1:1 Consumption | Consumes full LP qty |
| 04.6d | Consumption Correction | Reverses LP qty changes |
| 04.6e | Over-Consumption | Tracks LP usage vs requirements |
| 04.7a | Output Desktop | Creates new license_plates record |
| 04.7b | Output Scanner | Creates LP + prints label |
| 04.7c | By-Product | Creates by-product LPs |
| 04.7d | Multiple Outputs | Creates multiple LPs per WO |
| 04.8 | Reservations | Reserves specific LPs (FIFO/FEFO) |

### LP-Independent Stories (7 Stories)

| Story | Feature | Why No LP Needed |
|-------|---------|------------------|
| 04.1 | Dashboard | Shows WO status from work_orders table |
| 04.2a | WO Start | Updates work_orders.status |
| 04.2b | WO Pause/Resume | Updates work_orders.status, wo_pauses |
| 04.2c | WO Complete | Updates work_orders.status |
| 04.3 | Operations | Updates wo_operations.status |
| 04.4 | Yield Tracking | Calculates from wo_materials, production_outputs |
| 04.5 | Settings | CRUD on production_settings |

### LP-Later Stories (11 Stories)

| Story | Feature | Notes |
|-------|---------|-------|
| 04.9a-d | OEE | Uses production data, not LP directly |
| 04.10a-g | Reports | Aggregates existing data |

---

## Dependency Resolution Options

### Option A: Sequential Execution (Epic 05 First)

```
Week 1-3:   Epic 03 WO CRUD (03.10, 03.11a, 03.12)
Week 4-7:   Epic 05 License Plates (05.1, 05.2, ...)
Week 8-14:  Epic 04 Production (full module)
```

**Pros:**
- Clean implementation, no workarounds
- LP services fully tested before production uses them
- No mock implementations

**Cons:**
- Production blocked for 4+ weeks
- Reduces parallelism
- WO visibility delayed

**Verdict:** Safe but slow. Not recommended.

### Option B: Phase Split (RECOMMENDED)

```
Week 1-3:   Epic 03 WO CRUD (03.10, 03.11a, 03.12)
Week 2-4:   Epic 04a Phase 0 (04.1-04.5, parallel with Epic 03 completion)
Week 4-7:   Epic 05 License Plates (parallel with Epic 04a)
Week 7-12:  Epic 04b Phase 1 (04.6a-04.8, after Epic 05)
Week 12-16: Epic 04 Phase 2 (04.9a-04.10g)
```

**Pros:**
- WO lifecycle visibility delivered early
- Operations tracking available immediately
- Dashboard shows production status
- Maximum parallelism

**Cons:**
- Two deployment phases for Production
- Some UI placeholders needed ("Coming in Phase 1")
- Users see partial functionality initially

**Verdict:** Best balance of speed and functionality. RECOMMENDED.

### Option C: Production Creates LP Tables (NOT RECOMMENDED)

```
Week 1-3:   Epic 03 WO CRUD
Week 2-5:   Epic 04 creates license_plates, lp_genealogy
Week 5-10:  Epic 04 continues with full production
Week 8-12:  Epic 05 extends LP tables (no creation needed)
```

**Pros:**
- Production unblocked
- Full functionality faster

**Cons:**
- **Module ownership confusion** - Who owns LP tables?
- **Migration conflicts** - Epic 05 expects to create tables
- **Testing complexity** - LP tests split across modules
- **Architectural debt** - Violates module boundaries

**Verdict:** Creates more problems than it solves. NOT RECOMMENDED.

---

## Recommended Implementation: Option B Details

### Phase 0 (Epic 04a) - MVP Core

**Timeline:** 10-14 days (after Epic 03.10-03.12)
**LP Dependency:** NONE
**Stories:** 7

| Story | Name | Days | Enables |
|-------|------|------|---------|
| 04.5 | Production Settings | 2 | All production features |
| 04.1 | Production Dashboard | 3 | WO visibility |
| 04.2a | WO Start | 2 | Begin production |
| 04.2b | WO Pause/Resume | 1 | Interruptions |
| 04.2c | WO Complete | 2 | Close production |
| 04.3 | Operation Start/Complete | 3 | Step tracking |
| 04.4 | Yield Tracking | 1 | Performance metrics |

**Deliverables:**
- Production dashboard with KPI cards
- WO list with status indicators
- WO lifecycle: Released -> In Progress -> Paused -> Completed
- Operations timeline with start/complete
- Yield calculations (without actual consumption data)
- Production settings configuration

**User Value:**
- Production supervisors see WO status
- Operators can mark WO started/completed
- Operations tracking provides time data
- Foundation for Phase 1 features

### Phase 1 (Epic 04b) - Full Production

**Timeline:** 18-24 days (after Epic 05 LP tables)
**LP Dependency:** HARD - requires license_plates, lp_genealogy
**Stories:** 10

| Story | Name | Days | LP Operations |
|-------|------|------|---------------|
| 04.6a | Consumption Desktop | 5 | Read LP, decrement qty |
| 04.6b | Consumption Scanner | 4 | Scan LP barcode |
| 04.6c | 1:1 Consumption | 1 | Full LP consumption |
| 04.6d | Consumption Correction | 2 | Increment LP qty back |
| 04.6e | Over-Consumption | 2 | Validate LP usage |
| 04.7a | Output Desktop | 5 | Create new LP |
| 04.7b | Output Scanner | 4 | Create LP, print label |
| 04.7c | By-Product | 2 | Create by-product LP |
| 04.7d | Multiple Outputs | 1 | Create multiple LPs |
| 04.8 | Reservations | 4 | Reserve specific LPs |

**Deliverables:**
- Material consumption (desktop + scanner)
- Validation: LP exists, available, product match, qty available
- Output registration (desktop + scanner)
- LP creation with batch, expiry, QA status
- ZPL label printing
- Genealogy: consumed LPs -> output LP
- Material reservations (FIFO/FEFO)
- Consumption correction (reversal)
- Over-consumption approval workflow

**User Value:**
- Full LP-based traceability
- Scanner workflows for shop floor
- Genealogy for recalls
- FIFO/FEFO compliance

### Phase 2 - OEE & Analytics

**Timeline:** 14-18 days (after Phase 1)
**LP Dependency:** NONE (uses production data)
**Stories:** 11

**Deliverables:**
- Shift management
- Downtime tracking with categories
- OEE calculation (A x P x Q)
- Machine integration (manual counters)
- 7 analytics reports

---

## Story Index with Phases

### Phase 0 (MVP Core) - TO CREATE NOW

| Story | Name | PRD FRs | Complexity | LP Dependency | Status |
|------:|------|---------|------------|---------------|--------|
| 04.5 | Production Settings | FR-PROD-017 | M | NO | TO CREATE |
| 04.1 | Production Dashboard | FR-PROD-001 | M | NO | TO CREATE |
| 04.2a | WO Start | FR-PROD-002 | M | NO | TO CREATE |
| 04.2b | WO Pause/Resume | FR-PROD-003 | S | NO | TO CREATE |
| 04.2c | WO Complete | FR-PROD-005 | M | NO | TO CREATE |
| 04.3 | Operation Start/Complete | FR-PROD-004 | M | NO | TO CREATE |
| 04.4 | Yield Tracking | FR-PROD-014 | S | NO | TO CREATE |

**Total:** 7 stories, 10-14 days

### Phase 1 (Full Production) - DEFER TO EPIC 05

| Story | Name | PRD FRs | Complexity | LP Dependency | Status |
|------:|------|---------|------------|---------------|--------|
| 04.6a | Consumption Desktop | FR-PROD-006 | L | **YES** | DEFERRED |
| 04.6b | Consumption Scanner | FR-PROD-007 | L | **YES** | DEFERRED |
| 04.6c | 1:1 Consumption | FR-PROD-008 | S | **YES** | DEFERRED |
| 04.6d | Consumption Correction | FR-PROD-009 | M | **YES** | DEFERRED |
| 04.6e | Over-Consumption | FR-PROD-010 | M | **YES** | DEFERRED |
| 04.7a | Output Desktop | FR-PROD-011 | L | **YES** | DEFERRED |
| 04.7b | Output Scanner | FR-PROD-012 | L | **YES** | DEFERRED |
| 04.7c | By-Product Registration | FR-PROD-013 | M | **YES** | DEFERRED |
| 04.7d | Multiple Outputs | FR-PROD-015 | S | **YES** | DEFERRED |
| 04.8 | Material Reservations | FR-PROD-016 | L | **YES** | DEFERRED |

**Total:** 10 stories, 18-24 days
**Prerequisite:** Epic 05 license_plates + lp_genealogy tables

### Phase 2 (OEE & Analytics) - AFTER PHASE 1

| Story | Name | PRD FRs | Complexity | LP Dependency | Status |
|------:|------|---------|------------|---------------|--------|
| 04.9a | OEE Calculation | FR-PROD-018 | L | NO | TO CREATE |
| 04.9b | Downtime Tracking | FR-PROD-019 | M | NO | TO CREATE |
| 04.9c | Machine Integration | FR-PROD-020 | M | NO | TO CREATE |
| 04.9d | Shift Management | FR-PROD-021 | M | NO | TO CREATE |
| 04.10a | OEE Summary Report | FR-PROD-022a | M | NO | TO CREATE |
| 04.10b | Downtime Analysis | FR-PROD-022b | M | NO | TO CREATE |
| 04.10c | Yield Analysis | FR-PROD-022c | S | NO | TO CREATE |
| 04.10d | Production Output | FR-PROD-022d | S | NO | TO CREATE |
| 04.10e | Consumption Report | FR-PROD-022e | S | NO | TO CREATE |
| 04.10f | Quality Rate | FR-PROD-022f | S | NO | TO CREATE |
| 04.10g | WO Completion | FR-PROD-022g | S | NO | TO CREATE |

**Total:** 11 stories, 14-18 days

---

## Effort Estimation

### By Phase (1 developer)

| Phase | Stories | Days | Cumulative |
|-------|---------|------|------------|
| Phase 0: MVP Core | 7 | 10-14 | 10-14 |
| Phase 1: Full Production | 10 | 18-24 | 28-38 |
| Phase 2: OEE & Analytics | 11 | 14-18 | 42-56 |

### By Priority

| Priority | Stories | Days | Notes |
|----------|---------|------|-------|
| P0 (Phase 0) | 7 | 10-14 | Can start immediately |
| P1 (Phase 1) | 10 | 18-24 | After Epic 05 |
| P2 (Phase 2) | 11 | 14-18 | After Phase 1 |
| **Total** | **28** | **42-56 days** | - |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation | Status |
|------|--------|------------|------------|--------|
| **LP tables delayed (Epic 05)** | HIGH | MEDIUM | Phase split, clear prerequisite | PLANNED |
| Phase 0 delivers limited value | MEDIUM | LOW | Dashboard + WO lifecycle still useful | MITIGATED |
| Users confused by partial features | MEDIUM | MEDIUM | Clear "Coming in Phase 1" UI indicators | PLANNED |
| Scanner UX issues | MEDIUM | MEDIUM | Large touch targets, audio feedback, testing | PLANNED |
| Genealogy complexity | HIGH | MEDIUM | Clear data model, integration tests | PLANNED |
| OEE calculation errors | MEDIUM | MEDIUM | Unit tests, reference OEE examples | PLANNED |

---

## Implementation Checklist

### Phase 0 Prerequisites
- [ ] Epic 03.10 (WO CRUD) complete
- [ ] Epic 03.11a (wo_materials) complete
- [ ] Epic 03.12 (wo_operations) complete
- [ ] Epic 01.11 (production_lines) complete

### Phase 0 Deliverables
- [ ] production_settings table + service
- [ ] Dashboard with KPIs, alerts, active WOs
- [ ] WO start/pause/resume/complete lifecycle
- [ ] Operation start/complete with duration
- [ ] Yield calculation (planned vs actual)

### Phase 1 Prerequisites
- [ ] **Epic 05.1 (license_plates table) complete** - CRITICAL
- [ ] **Epic 05.X (lp_genealogy table) complete** - CRITICAL
- [ ] LP services (CRUD, qty update) available

### Phase 1 Deliverables
- [ ] material_consumptions table + service
- [ ] production_outputs table + service
- [ ] material_reservations table + service
- [ ] Desktop consumption workflow
- [ ] Scanner consumption workflow
- [ ] Desktop output workflow
- [ ] Scanner output workflow + ZPL printing
- [ ] Genealogy linking (consumed -> output)
- [ ] Reservation creation on WO start

### Phase 2 Deliverables
- [ ] shifts table + service
- [ ] downtime_records table + service
- [ ] oee_records table + service
- [ ] OEE calculation service
- [ ] 7 analytics reports

---

## Conclusion

**Epic 04 Production Module is READY FOR PHASE 0 IMPLEMENTATION.**

### Key Decisions:

1. **Phase Split Strategy (Option B) Approved**
   - Phase 0: 7 stories, no LP dependency, 10-14 days
   - Phase 1: 10 stories, after Epic 05, 18-24 days
   - Phase 2: 11 stories, after Phase 1, 14-18 days

2. **LP Dependency Handled**
   - 10 stories explicitly deferred to Phase 1
   - Clear prerequisite: Epic 05 license_plates table

3. **Parallel Development Enabled**
   - Phase 0 can run parallel with Epic 05 development
   - Maximizes velocity while respecting dependencies

### Implementation Path:

```
Epic 03.10-03.12 (WO CRUD) --> Epic 04a Phase 0 (WO Lifecycle)
                                        |
                                        |  PARALLEL
                                        v
                              Epic 05 (License Plates)
                                        |
                                        v
                              Epic 04b Phase 1 (Consumption/Output)
                                        |
                                        v
                              Epic 04 Phase 2 (OEE)
```

### Next Steps:

1. Create Phase 0 stories (04.1-04.5, 04.2a-c, 04.3, 04.4)
2. Begin Phase 0 development after Epic 03 WO stories
3. Track Epic 05 progress as blocker for Phase 1
4. Create Phase 1 stories when Epic 05 nears completion

**Status: GREEN - Phase 0 can proceed immediately after Epic 03 WO stories**

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial LP dependency analysis with phase split recommendation | ARCHITECT-AGENT |
