# Epic 05 Warehouse: Critical Path Analysis

**Date:** 2025-12-16
**Status:** FINAL - Implementation Ready
**Priority:** CRITICAL
**Blocks:** Epic 04 Phase 1 (10 stories), Epic 03 Deferred (4 stories)
**Unblocks:** 14+ downstream stories
**Timeline:** 8-12 days to full unblock

---

## Executive Summary

Epic 05 Phase 0 (LP Foundation) is **THE critical blocker** for the entire operational system.

**8 stories → Unblocks 14 downstream stories → Enables 34-46 days of work**

### ROI Analysis
- **Investment:** 8 stories, 8-12 development days
- **Return:** Unblocks 14 stories across 2 epics
- **Total Unlocked Work:** 34-46 days of downstream development
- **ROI:** 3-4x return (1 day invested = 3-4 days unlocked)

---

## The Critical Dependency Chain

```
┌─────────────────────────────────────────────────────────────┐
│           EPIC 05 PHASE 0: LP FOUNDATION                    │
│                   (CRITICAL BLOCKER)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Story 05.0: Warehouse Settings                             │
│  Story 05.1: LP Table + CRUD ← DAY 4 MILESTONE             │
│  Story 05.2: LP Genealogy                                   │
│  Story 05.3: LP Reservations + FIFO/FEFO ← DAY 12 MILESTONE│
│  Story 05.4: LP Status Management                           │
│  Story 05.5: LP Search & Filters                            │
│  Story 05.6: LP Detail & History                            │
│  Story 05.7: Warehouse Dashboard                            │
│                                                              │
│  Duration: 8-12 days (1 developer)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         │ BLOCKS 14 STORIES
         │ 34-46 DAYS OF WORK
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
    Epic 04.6a      Epic 04.7a      Epic 04.8     Epic 03.9b
    (Consump)       (Output)        (Reserve)     (TO LP)
    3-5 days        3-5 days        3-5 days      3-4 days
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                        │
                        ▼
        PRODUCTION OPERATIONS ENABLED
        Full material tracking active
        FIFO/FEFO algorithms working
```

---

## Day 4 Milestone: First Unblock (Partial)

### What Completes
- **Story 05.1:** LP Table + CRUD operations
- Duration: Day 3-6 (completing on Day 4)

### What Gets Unblocked
**2 Epic 04 stories can START (partial):**
- **04.6a:** Material Consumption (Desktop) - Can begin consuming from LPs
- **04.7a:** Output Registration (Desktop) - Can begin creating output LPs

### Impact
- Consumption team can test basic LP lookup + quantity deduction
- Output team can test LP creation from production
- Integration testing begins (WO → LP data flow)
- Early validation of genealogy approach

### Timeline Implication
- **Development parallelization:** Epic 04.6a-7a can start while 05.2-05.3 still in progress
- **Risk reduction:** Begin LP integration testing on Day 4, not Day 12
- **Learning curve:** Team familiarizes with LP service APIs early

---

## Day 12 Milestone: Full Unblock (Complete)

### What Completes
- **All Phase 0 stories:** 05.0 through 05.7
- Duration: Day 1-12
- Includes all LP infrastructure

### What Gets Fully Unblocked
**10 Epic 04 Phase 1 stories FULLY ENABLED:**

#### Material Consumption (5 stories)
- **04.6a:** Desktop Material Consumption
- **04.6b:** Scanner Material Consumption
- **04.6c:** 1:1 LP Consumption
- **04.6d:** Consumption Correction/Reversal
- **04.6e:** Over-Consumption Approval

#### Output Registration (4 stories)
- **04.7a:** Desktop Output Registration
- **04.7b:** Scanner Output Registration
- **04.7c:** By-Product Output
- **04.7d:** Multiple Output Batches

#### Material Reservations (1 story)
- **04.8:** Reservations with FIFO/FEFO Logic

**4 Epic 03 Deferred stories ENABLED:**
- **03.9b:** TO LP Pre-selection (uses LP reservations)
- **03.11b:** WO Material Reservations (uses LP reservations)
- **03.13:** Material Availability Check (queries LP status)
- **03.14:** WO Scheduling (uses LP availability)

### Impact
- **Epic 04 Phase 1 can proceed at full speed** (no LP dependency bottleneck)
- **Epic 03 deferred features unblocked** (LP-dependent planning)
- **Complete production-to-warehouse integration active**
- **Traceability system operational** (genealogy + reservations working)

### Timeline Implication
- **Parallel execution enabled:** Epic 04 Phase 1 + Epic 05 Phase 1 run simultaneously Weeks 3-6
- **No further blocking:** Epic 04 proceeds without waiting for additional Epic 05 stories
- **Business flow complete:** PO → GRN → LP → WO → Consumption → Output cycle working

---

## What Each Phase 0 Story Enables

### 05.0: Warehouse Settings (2-3 days)
**Enables:** Basic warehouse infrastructure
**Unblocks:** All Phase 0 stories (prerequisite)
**Key Implementation:**
- Warehouse master data (name, code, default location)
- LP numbering scheme configuration
- FIFO/FEFO strategy selection
- Dimension/weight tracking toggles

### 05.1: LP Table + CRUD (3-4 days) ← **DAY 4 MILESTONE**
**Enables:** Basic LP creation + tracking
**Unblocks immediately:**
- **04.6a:** Desktop consumption (can consume from LP)
- **04.7a:** Desktop output (can create LP)

**Unblocks after Day 12:**
- 04.6b-e: All scanner + advanced consumption
- 04.7b-d: All scanner + advanced output

**Key Implementation:**
- `license_plates` table: ID, product, qty, uom, status, receipt_date, expiry
- CRUD operations (create, read, update, list)
- Basic search + filtering
- Owner org_id for multi-tenancy

### 05.2: LP Genealogy (3-4 days)
**Enables:** Parent-child LP tracking
**Unblocks:**
- **04.7a-d:** Output registration can track LP lineage
- **03.9b:** TO LP selection (knows LP source)
- Traceability reporting

**Key Implementation:**
- `lp_genealogy` table: parent_lp_id, child_lp_id, qty, reason (split/merge/output)
- Queries: "find all LPs created from this production run"
- Queries: "find all products that used this input LP"

### 05.3: LP Reservations + FIFO/FEFO (3-4 days) ← **DAY 12 MILESTONE**
**Enables:** Material allocation logic
**Unblocks immediately:**
- **04.8:** Material Reservations (implements FIFO/FEFO)
- **03.11b:** WO Reservations (can reserve LPs)
- **03.13:** Material Availability (checks reserved vs available)

**Key Implementation:**
- `lp_reservations` table: wo_id, lp_id, qty_reserved
- FIFO algorithm: Sort by receipt_date, oldest first
- FEFO algorithm: Sort by expiry_date, nearest expiry first
- Availability = total_qty - reserved_qty

### 05.4: LP Status Management (2-3 days)
**Enables:** LP state tracking (available, reserved, consumed, blocked, etc.)
**Unblocks:**
- Quality module LP holds (Epic 06.3)
- LP blocking workflows
- Status-based filtering in downstream

**Key Implementation:**
- LP status field: 'available', 'reserved', 'in_production', 'consumed', 'blocked', 'expired'
- Status transitions (valid state machine)
- Status history audit trail

### 05.5: LP Search & Filters (2-3 days)
**Enables:** User-friendly LP lookup
**Unblocks:**
- Production team finding LPs to consume
- Warehouse team picking LPs
- Reports + analytics

**Key Implementation:**
- Search by: product, supplier, receipt date, expiry, status, location
- Advanced filters (compound queries)
- Performance optimization (indexes on commonly searched fields)

### 05.6: LP Detail & History (2-3 days)
**Enables:** LP audit trail + genealogy visualization
**Unblocks:**
- Traceability reports (FDA compliance)
- LP movement tracking
- Quality investigation workflows

**Key Implementation:**
- LP detail page showing full history
- Status changes timeline
- Genealogy parent/child visualization
- Location movement history

### 05.7: Warehouse Dashboard (2-3 days)
**Enables:** Real-time warehouse visibility
**Unblocks:**
- Manager reporting
- Inventory snapshot
- KPI monitoring (turnover, age, utilization)

**Key Implementation:**
- Total LPs by status
- Inventory value by location
- Age distribution (FIFO/FEFO compliance check)
- Expiring soon alerts

---

## What Doesn't Get Unblocked Yet

### Phase 1 (GRN/ASN) - Still Development Work
- **05.8-05.15** (8 stories)
- Enables **Phase 2** scanner workflows
- No external dependencies (Phase 0 complete is sufficient)

### Phase 2 (Scanner) - Still Development Work
- **05.16-05.23** (8 stories)
- Requires Phase 1 complete first
- No external blocking

### Phase 3 (Pallets/GS1) - Advanced Features
- **05.24-05.33** (10 stories)
- Requires Phase 2 complete first
- No external blocking

### Phase 4 (Inventory/Reporting) - Advanced Features
- **05.34-05.39** (6 stories)
- Requires Phase 3 complete first
- No external blocking

**Key Point:** Phase 0 unblocks everything it CAN unblock. Phases 1-4 are internal Epic 05 work that doesn't block other epics.

---

## Resource Planning

### Dev 1: Epic 05 Phase 0 (Dedicated)

**Timeline:** Week 1-2 (Days 1-12)

| Day | Story | Focus | Deliverable |
|-----|-------|-------|-------------|
| 1-2 | 05.0 | Warehouse Settings | Settings page, config tables |
| 3-6 | 05.1 | LP Table + CRUD | LP creation, list, search | **DAY 4 MILESTONE** |
| 7-8 | 05.2 | LP Genealogy | Genealogy tracking + queries |
| 9-10 | 05.3 | LP Reservations | FIFO/FEFO algorithms |
| 11-12 | 05.4-05.7 | Status, Search, Detail, Dashboard | Full UI + reporting | **DAY 12 MILESTONE** |

**Dev 1 Output:** LP infrastructure ready for production use

### Dev 2: Epic 04 Phase 0 (Parallel)

**Timeline:** Week 1-2 (Days 1-12)

| Phase | Stories | Status | Timeline |
|-------|---------|--------|----------|
| Phase 0 | 04.1-04.5 | Start immediately | 10-14 days |
| Phase 1 | 04.6-04.8 | Wait for Day 4 | Can start consumption on Day 4 |

**Dev 2 Output:** WO lifecycle ready, consuming material ready on Day 4

### Parallel Execution Timeline

```
Week 1-2: PARALLEL DEVELOPMENT
┌─────────────────────────────────────────┐
│ Dev 1: Epic 05 Phase 0                  │
│ ├─ Day 1-2: 05.0 Settings              │
│ ├─ Day 3-6: 05.1 LP CRUD ← MILESTONE  │
│ ├─ Day 7-8: 05.2 Genealogy             │
│ ├─ Day 9-10: 05.3 Reservations ← MI    │
│ └─ Day 11-12: 05.4-07 Status/Search    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Dev 2: Epic 04 Phase 0                  │
│ ├─ Day 1-4: 04.1 Dashboard              │
│ ├─ Day 4-6: 04.2a WO Start              │
│ ├─ Day 7-8: 04.2b Pause/Resume          │
│ ├─ Day 9-10: 04.2c Complete             │
│ └─ Day 11-12: 04.3-04.5 Operations     │
└─────────────────────────────────────────┘
        ↓ Day 4 Unblock Signal
        Dev 2 can START 04.6a consumption

Week 3-4: PARALLEL CONTINUATION
┌─────────────────────────────────────────┐
│ Dev 1: Epic 05 Phase 1 (GRN/ASN)        │
│ 05.8-05.15 (8 stories, 10-14 days)      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Dev 2: Epic 04 Phase 1 (Production)     │
│ 04.6a-04.8 (10 stories, 18-24 days)     │
│ Can proceed without waiting!             │
└─────────────────────────────────────────┘
```

---

## Risk Mitigation

### Risk #1: Day 4 Delay (05.1 Not Complete)

**Impact:** Epic 04.6a-7a cannot start, 2 story delay
**Mitigation:**
- Epic 04.6a can use mock LP service while waiting
- Stub LP table with test data
- Begin UI development while backend completes

### Risk #2: LP Service Performance Issues

**Impact:** Consumption/output operations slow, data corruption
**Mitigation:**
- Write intensive LP service tests (05.1 priority)
- Load testing with 1000+ LPs before Phase 1
- Database indexes on commonly searched fields

### Risk #3: FIFO/FEFO Algorithm Complexity

**Impact:** Day 12 delay, Epic 04.8 blocked
**Mitigation:**
- Document algorithm precisely in 05.3 spec
- Implement + test in isolation (not part of 05.3 story)
- Have algorithm review checkpoint Day 8

### Risk #4: Multi-Tenancy Issues

**Impact:** Org_id not properly isolated, data leak
**Mitigation:**
- RLS policies on all LP tables (CRITICAL)
- Test data isolation: create 2 orgs, verify queries don't cross
- LP queries must include `AND org_id = current_org_id`

---

## Success Criteria

### Day 4 Checkpoint (05.1 Complete)
- [ ] LP Table created in Supabase
- [ ] CRUD operations working (create, read, update, list)
- [ ] Basic search implemented
- [ ] RLS policies enforced
- [ ] Epic 04.6a can call LP service successfully
- [ ] Test coverage >= 80%

### Day 12 Checkpoint (Phase 0 Complete)
- [ ] All 8 Phase 0 stories merged to main
- [ ] FIFO/FEFO algorithms tested + working
- [ ] LP reservations preventing over-consumption
- [ ] Genealogy queries fast (< 100ms for 1000 LPs)
- [ ] Warehouse Dashboard shows real data
- [ ] All stories have >= 80% test coverage
- [ ] No critical RLS violations

### Integration Checkpoint (Epic 04.6a Integration)
- [ ] WO consumption calls LP service
- [ ] LP quantity decreases correctly
- [ ] Reservation logic prevents over-consumption
- [ ] Genealogy tracks consumption source
- [ ] Error handling for missing/expired LPs

---

## Critical Success Factor

**This is NOT a feature release. This is infrastructure.**

Epic 05 Phase 0 is the LP foundation that 10+ downstream stories depend on. Any delay here cascades to:
- Epic 04: Cannot proceed with consumption/output (2 week delay)
- Epic 03: Cannot implement LP-dependent planning (2 week delay)
- Epic 06: Cannot implement quality holds (2 week delay)

**Decision:** Start Epic 05 Phase 0 on Day 1. Assign best developer. Unblock on Day 4 and Day 12.

---

## Status

✅ **CRITICAL PATH IDENTIFIED**
✅ **DAY 4 & DAY 12 MILESTONES SET**
✅ **ROI: 3-4x RETURN ON INVESTMENT**
✅ **READY FOR IMPLEMENTATION**

**Next Action:** Assign Dev 1 to Epic 05 Phase 0 immediately. Begin Day 1.

---

**Version:** 1.0
**Date:** 2025-12-16
**Author:** TECH-WRITER
**Status:** FINAL
