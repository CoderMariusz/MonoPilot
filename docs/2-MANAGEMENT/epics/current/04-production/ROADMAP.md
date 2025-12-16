# Epic 04 Production Module - Implementation Roadmap

**Date:** 2025-12-16
**Status:** Phase 0 READY | Phase 1 BLOCKED | Phase 2 TEMPLATES
**Critical Blocker:** Epic 05 License Plate Infrastructure
**Unblock Milestones:** Day 4 (05.1) | Day 12 (05 Phase 0 complete)

---

## Executive Summary

Epic 04 Production consists of **28 stories across 3 phases**. However, the module has a **critical dependency on Epic 05 License Plates** that determines the implementation sequence and timeline.

### The Blocker Story

**Phase 0 (WO Lifecycle): 7 stories - READY NOW**
- No LP dependency
- Can start immediately
- 10-14 days with 1 developer
- Foundation for all production workflows

**Phase 1 (Material Flow): 10 stories - BLOCKED by Epic 05**
- Requires LP infrastructure
- 18-24 days to implement (once unblocked)
- Represents 36% of Epic 04 functionality
- Unblocks at Day 12 (when Epic 05 Phase 0 complete)

**Phase 2 (OEE Analytics): 11 stories - TEMPLATES ONLY**
- No critical dependencies
- Can start after Phase 0 stable
- Optional for MVP
- 14-18 days to implement

---

## Phase 0: Pre-LP Work Order Lifecycle (READY NOW)

### Stories (7 total)

| ID | Title | Complexity | Est. Days | Status |
|----|-------|-----------|-----------|--------|
| 04.1 | Production Dashboard | M | 3-4 | ✅ READY |
| 04.2a | WO Start | M | 3-4 | ✅ READY |
| 04.2b | WO Pause/Resume | S | 1-2 | ✅ READY |
| 04.2c | WO Complete | M | 3-4 | ✅ READY |
| 04.3 | Operation Start/Complete | M | 3-4 | ✅ READY |
| 04.4 | Yield Tracking (Manual) | M | 2-3 | ✅ READY |
| 04.5 | Production Settings | S | 1-2 | ✅ READY |

**Total:** 7 stories, 10-14 days (1 dev) | 5-7 days (2 devs)

### What Gets Built

- Work Order state machine (Start → In Progress → Pause ↔ Resume → Complete)
- Operation-level execution tracking
- Manual yield entry for first phase
- Production settings (lines, machines, shifts)
- Dashboard showing active/completed work orders
- No material consumption yet (requires LPs)
- No output registration (requires LPs)

### Key Artifacts

**Database:**
- `work_orders` - Status updates (released → in_progress → paused → completed)
- `operations` - Start/complete timestamps
- `production_settings` - Line/machine/shift configuration
- `work_order_yields` - Manual yield entries (temp before WO Phase 1)

**API Endpoints:**
- `PATCH /api/production/work-orders/{id}/start`
- `PATCH /api/production/work-orders/{id}/pause`
- `PATCH /api/production/work-orders/{id}/resume`
- `PATCH /api/production/work-orders/{id}/complete`
- `POST /api/production/operations/{id}/start`
- `PATCH /api/production/operations/{id}/complete`

**Services:**
- ProductionService.startWorkOrder()
- ProductionService.pauseWorkOrder()
- ProductionService.resumeWorkOrder()
- ProductionService.completeWorkOrder()
- OperationService.executeOperation()

**UI Pages:**
- Production Dashboard (active WOs, operations queue)
- Production Settings
- Operation execution interface

### Can Run In Parallel With

- Epic 05 Phase 0 (LP Foundation) - highest priority
- Epic 03 Phase 0 (Planning) - if resources available

### NOT Included in Phase 0

- Material consumption (needs LP inventory)
- Output registration (needs LP creation)
- Material reservations (needs LP pick suggestions)
- Scanner workflows
- OEE tracking
- Downtime recording

---

## Phase 1: Material Flow with License Plates (BLOCKED → UNBLOCKS AT DAY 12)

### Critical Dependency

**BLOCKED BY:** Epic 05 Phase 0 (Stories 05.0-05.7)
- Specifically needs: 05.1 (LP Table), 05.2 (LP Genealogy), 05.3 (LP Reservations)

**PARTIAL UNBLOCK:** Day 4 (05.1 complete)
- Can start 04.6a, 04.7a (Desktop workflows only)
- Limited functionality (no genealogy, no reservations)

**FULL UNBLOCK:** Day 12 (05 Phase 0 complete)
- All 10 Phase 1 stories can proceed
- Complete LP infrastructure available
- FIFO/FEFO algorithms ready

### Stories (10 total)

| ID | Title | Complexity | Est. Days | Depends On | Unblock Date |
|----|-------|-----------|-----------|-----------|-------------|
| 04.6a | Material Consumption (Desktop) | L | 5-7 | 05.1 | Day 4 (partial) |
| 04.6b | Material Consumption (Scanner) | M | 3-4 | 05.1 + 04.6a | Day 4+ |
| 04.6c | 1:1 LP Consumption | S | 2-3 | 05.1, 05.3 | Day 12 |
| 04.6d | Consumption Correction/Reversal | M | 3-4 | 04.6a | Day 12+ |
| 04.6e | Over-Consumption Approval | M | 3-4 | 04.6a | Day 12+ |
| 04.7a | Output Registration (Desktop) | L | 5-7 | 05.1, 05.2 | Day 4 (partial) |
| 04.7b | Output Registration (Scanner) | M | 3-4 | 05.1, 05.2 + 04.7a | Day 4+ |
| 04.7c | By-Product Output | S | 2-3 | 04.7a | Day 12+ |
| 04.7d | Multiple Output Batches | M | 3-4 | 04.7a | Day 12+ |
| 04.8 | Material Reservations (FIFO/FEFO) | L | 5-7 | 05.3, 03.11b | Day 12 |

**Total:** 10 stories, 18-24 days (1 dev) | 9-12 days (2 devs)

### What Gets Built

**Material Consumption (04.6a-e):**
- Operator selects material for work order
- Picks LP (license plate) from available inventory
- System deducts quantity from LP
- Tracks genealogy (which LP used for which output)
- Supports correction and over-consumption approval

**Output Registration (04.7a-d):**
- Operator records finished product
- System creates new LP for output
- Traces genealogy back to consumed materials
- Supports by-products and multiple batches
- Prints LP label (integration with 05.14)

**Material Reservations (04.8):**
- Reserves LPs for future WO execution
- Uses FIFO/FEFO picking suggestions from 05.3
- Blocks reserved LPs from being used elsewhere
- Integrates with 03.11b (WO material reservations in Planning)

### Key Artifacts

**Database:**
- `work_order_consumptions` - Material usage per WO
- `work_order_outputs` - Finished goods per WO
- `consumption_genealogy` - Traceability (input LP → consumption → output LP)
- `work_order_reservations` - Reserved LPs for future use

**API Endpoints:**
- `POST /api/production/work-orders/{id}/consume` - Add material
- `PATCH /api/production/work-orders/{id}/consume/{consumptionId}` - Correct
- `DELETE /api/production/work-orders/{id}/consume/{consumptionId}` - Reverse
- `POST /api/production/work-orders/{id}/consume/approval` - Over-consume
- `POST /api/production/work-orders/{id}/output` - Register output
- `POST /api/production/work-orders/{id}/output/batch` - Multiple batches
- `GET /api/production/work-orders/{id}/reservations` - Get suggestions
- `POST /api/production/work-orders/{id}/reserve` - Lock LPs

**Services:**
- ConsumptionService.consumeMaterial()
- ConsumptionService.correctConsumption()
- ConsumptionService.approveOverConsumption()
- OutputService.registerOutput()
- OutputService.generateGenealogy()
- ReservationService.reserveMaterial() (FIFO/FEFO)
- IntegrationService.consumptionToLpService()

**UI Pages:**
- Material Consumption (show available LPs, pick by location/expiry)
- Output Registration (register quantity, print LP)
- Genealogy Viewer (trace consumed → produced)
- Reservations Dashboard

**Integration Points:**
- Epic 05 LP Service (get available LPs, create output LPs)
- Epic 05 FIFO/FEFO (get pick suggestions)
- Epic 05 Label Printing (print LP, SSCC)
- Epic 03 WO Reservations (notify when reserved)

### Timeline to Unblock

**Week 1-2 Parallel:**
```
Dev 1: Epic 05.0-05.3 (LP Foundation)
  Day 1-2: 05.0 Warehouse Settings
  Day 3-6: 05.1 LP Table + CRUD ← DAY 4 MILESTONE (PARTIAL UNBLOCK)
  Day 7-10: 05.2 LP Genealogy
  Day 11-12: 05.3 LP Reservations + FIFO/FEFO ← DAY 12 MILESTONE (FULL UNBLOCK)

Dev 2: Epic 04 Phase 0 (WO Lifecycle)
  Days 1-14: 04.1-04.5 (independent, no dependencies)
```

**Week 3-4 After Unblock (Sequential):**
```
Day 4 (After 05.1):
  - Start 04.6a design review
  - Start 04.7a design review
  - Integration testing setup

Day 12 (After 05 Phase 0 Complete):
  - Epic 04 Phase 1 FULLY ENABLED
  - Start all 10 stories
  - Both devs on Phase 1 if needed
```

---

## Phase 2: OEE Analytics (TEMPLATES - Can Plan Now)

### Stories (11 total)

| ID | Title | Complexity | Est. Days | Dependencies |
|----|-------|-----------|-----------|-------------|
| 04.9a | OEE Calculation Engine | L | 5-7 | Phase 1 |
| 04.9b | Downtime Recording | M | 3-4 | Phase 1 |
| 04.9c | Downtime Reasons CRUD | S | 1-2 | Phase 1 |
| 04.9d | Shifts CRUD | S | 1-2 | Phase 0 |
| 04.10a | OEE Dashboard | M | 3-4 | 04.9a |
| 04.10b | OEE Trend Charts | M | 3-4 | 04.9a |
| 04.10c | Downtime Pareto Analysis | M | 3-4 | 04.9b |
| 04.10d | Line/Machine OEE Comparison | M | 3-4 | 04.9a |
| 04.11a | Scanner UI Optimization | M | 3-4 | 04.6b, 04.7b |
| 04.11b | ZPL Label Printing | S | 2-3 | 05.14 |
| 04.11c | Scanner Offline Mode | M | 3-4 | 04.6b, 04.7b |

**Total:** 11 stories, 14-18 days (1 dev) | 7-9 days (2 devs)

### What Gets Built

- OEE calculations (Availability × Performance × Quality)
- Downtime tracking and reason categorization
- OEE dashboards and trend analysis
- Line/machine comparison reports
- Scanner optimization (touch targets, audio feedback)
- ZPL label printing integration
- Scanner offline operation mode

### When to Start

- **Earliest:** Week 7 (after Phase 1 stable)
- **Priority:** Medium (optional for MVP)
- **Full specs:** Create when Phase 1 50% complete

---

## Day-by-Day Execution Plan (With 2 Developers)

### Week 1: Foundation Phase

```
Day 1-2:
  Dev 1: Epic 05.0 Warehouse Settings
    - Warehouse CRUD
    - Location hierarchy
    - Rack/zone configuration

  Dev 2: Epic 04.1 Production Dashboard
    - Active WO list
    - Operation queue
    - Status indicators

Day 3-6 (CRITICAL - TARGETING DAY 4):
  Dev 1: Epic 05.1 LP Table + CRUD ← DAY 4 MILESTONE
    - License plate schema
    - Quantity tracking
    - Status management
    - CRUD operations

  Dev 2: Epic 04.2 WO Execution (Start/Pause/Complete)
    - 04.2a: Start (3-4 days)
    - Start 04.2b: Pause/Resume (1-2 days)

✅ DAY 4 MILESTONE: 05.1 COMPLETE
  → Partial unblock for 04.6a, 04.7a (can start design)
  → Announce to Epic 04 team

Day 7-10:
  Dev 1: Epic 05.2 LP Genealogy + Epic 05.3 Start
    - Input/output LP links
    - Traceability chain
    - FIFO/FEFO algorithms (start)

  Dev 2: Complete Epic 04 Phase 0
    - 04.3 Operation execution
    - 04.4 Yield tracking (manual)
    - 04.5 Production Settings

Day 11-12:
  Dev 1: Epic 05.3 Complete (Reservations + FIFO/FEFO)
    - LP reservation table
    - Pick suggestion algorithms
    - Reservation priority

✅ DAY 12 MILESTONE: Epic 05 Phase 0 COMPLETE
  → FULL UNBLOCK for all 10 Epic 04 Phase 1 stories
  → Epic 04 Phase 1 can proceed at full speed
  → Epic 03 can plan with confirmed WO capabilities
```

### Week 2-3: Production Core (Phase 1 Unblocked)

```
Day 13-20:
  Dev 1: Epic 05.8-05.9 GRN/ASN Phase 1 Start
    - Advance shipment notices
    - Goods receipt workflows

  Dev 2: Epic 04.6a Material Consumption (Desktop)
    - LP selection UI
    - Consumption form
    - Genealogy tracking
    - Integration with LP service

Day 21-26:
  Dev 1: Epic 05 Phase 1 Continue
    - GRN from PO
    - Over-receipt control

  Dev 2: Epic 04.7a Output Registration (Desktop)
    - Output form
    - New LP creation
    - Genealogy completion
    - Label generation

Day 27-30:
  Dev 1: Start Epic 05 Phase 1 Remaining
  Dev 2: Epic 04.8 Material Reservations
    - FIFO/FEFO integration
    - Reservation approval
    - Block/release logic
```

### Week 4-6: Phase 1 Completion + Phase 2 Start

```
Dev 1: Epic 05 Phase 1 Complete (GRN, ASN)
Dev 2: Epic 04 Phase 1 Complete (Consumption, Output, Reservations)

Both: Start Epic 04 Phase 2 (OEE)
  - 04.9 OEE Calculation Engine
  - 04.10 OEE Dashboard
  - 04.11 Scanner Optimization
```

---

## Integration Points with Other Epics

### Epic 05 Warehouse (Critical Dependency)

| Epic 04 Story | Needs From Epic 05 | Phase | Day Unlocked |
|---|---|---|---|
| 04.6a-e (Consumption) | 05.1 (LP CRUD) | 1 | Day 4 |
| 04.7a-d (Output) | 05.1 (LP creation) + 05.2 (Genealogy) | 1 | Day 4 |
| 04.8 (Reservations) | 05.3 (FIFO/FEFO algorithms) | 1 | Day 12 |
| 04.6, 04.7 (Scanner) | 05.19 (Scanner scaffolding) | 2 | Week 7 |

**Action Items:**
- Define LP service interfaces now (pre-Day 4)
- Test Epic 04 → Epic 05 service calls early (Week 2)
- Create integration test suite (Week 2-3)

### Epic 03 Planning (Sequential Dependency)

| Epic 03 Story | Uses From Epic 04 | Unblocked | Days |
|---|---|---|---|
| 03.10 (WO CRUD) | 04.1 WO execution basic | Day 12 | Can plan WO + see execution |
| 03.11b (WO Reservations) | 04.8 Material reservations | Day 12 | Can reserve materials in Planning |
| 03.9b (TO LP Selection) | 04.6, 04.7 LP context | Day 12 | Can select specific LPs |

**Action Items:**
- 03.10 can start immediately (uses Phase 0)
- 03.11b must wait for Day 12 (needs 04.8)
- 03.9b must wait for Day 12 (needs LP context)

### Epic 06 Quality (Soft Dependencies)

| Epic 06 Story | Uses From Epic 04 | Phase | When Available |
|---|---|---|---|
| 06.3 (QA Holds) | 04.7 Output registration (LP reference) | Phase 1 | Week 3 |
| 06.5a (Incoming Inspection) | 04.7 Output LP (link to GRN) | Phase 1 | Week 3 |

**Action Items:**
- 06.1-06.4 can start Week 3 (after 04.7a ready)
- Full compliance testing Week 9+

---

## Success Criteria by Phase

### Phase 0 Completion

- [ ] Work Order state machine fully implemented
- [ ] Operation execution tracked per step
- [ ] Yield recorded (manual entry for now)
- [ ] Dashboard shows all active WOs
- [ ] All 7 stories deployed to staging
- [ ] E2E tests passing
- [ ] Ready for Phase 1 integration

### Phase 1 Completion

- [ ] Material consumption creates LP deductions
- [ ] Output registration creates new LPs
- [ ] Genealogy traceability complete
- [ ] Reservations work with FIFO/FEFO
- [ ] All 10 stories deployed to staging
- [ ] Integration tests with Epic 05 passing
- [ ] Scanner workflows tested (04.6b, 04.7b)
- [ ] Production operators can execute full workflow

### Phase 2 Completion

- [ ] OEE calculations accurate
- [ ] Downtime tracking complete
- [ ] Dashboards generating reports
- [ ] Scanner optimized for warehouse
- [ ] Label printing functional
- [ ] Offline mode tested
- [ ] All 11 stories deployed to production
- [ ] System fully operational

---

## Risk Mitigation

### Risk: Epic 05 Phase 0 Delayed Beyond Day 12

**Impact:** Epic 04 Phase 1 blocked, 10-12 day delay

**Mitigation:**
- Assign Dev 1 to Epic 05 Phase 0 immediately (Week 1)
- Daily standups to monitor progress
- If delayed, have backup: create Phase 1 stubs/mocks for testing
- Alternative: start Phase 2 (OEE) in parallel while waiting

### Risk: Integration Between Epic 04 and Epic 05 Breaks

**Impact:** Consumption/output queries fail in production

**Mitigation:**
- Define LP service interfaces before Day 4
- Create integration tests by Day 10
- Run E2E tests across both modules every day
- Have rollback plan for Epic 05 Phase 0 if integration fails

### Risk: Phase 1 Stories Exceed 18-24 Day Estimate

**Impact:** Timeline slips 2-5 days

**Mitigation:**
- Apply .Xa/.Xb splits to 04.6, 04.7 (already in templates)
- Desktop-first strategy (04.6a, 04.7a before scanner)
- Reuse patterns from Phase 0
- Have Phase 2 (OEE) ready to start if Phase 1 needs full 2 devs

---

## Resource Allocation

### Minimum (1 Developer)

**Timeline:** 42-56 days (~8-11 weeks)
- Week 1-2: Phase 0 (10-14 days)
- Week 3-5: Phase 1 (18-24 days)
- Week 6-8: Phase 2 (14-18 days)

**Problem:** Blocks other epics; Phase 1 waiting 12 days for Epic 05

### Recommended (2 Developers)

**Timeline:** 21-28 days (~4-6 weeks) for Phase 0+1, 7-9 days for Phase 2
- Week 1-2: Phase 0 (5-7 days) + Phase 1 setup
- Week 3-4: Phase 1 full (9-12 days)
- Week 5+: Phase 2 (7-9 days)

**Advantage:** Parallel with Epic 05; fast Phase 1 unblock

### Optimal (3 Developers)

**Timeline:** 14-19 days for Phase 0+1, 5-6 days for Phase 2
- Week 1: Phase 0 (5-7 days)
- Week 2-3: Phase 1 (9-12 days with 2 devs)
- Week 4: Phase 2 (5-6 days)

**Advantage:** Maximum parallelism; full system operational Week 4

---

## Next Steps

### Immediate (Day 1)

1. Assign Dev 1 to Epic 05 Phase 0 (05.0, 05.1, 05.2, 05.3)
2. Assign Dev 2 to Epic 04 Phase 0 (04.1-04.5)
3. Schedule design review for Phase 1 stories (04.6a, 04.7a)
4. Create integration test skeleton

### Week 1 Target

- [ ] Epic 04 Phase 0 foundation (04.1-04.3) deployed to dev
- [ ] Epic 05.0 + 05.1 deployed to dev (Day 4)
- [ ] Integration tests between 05.1 and 04 running

### Week 2 Target

- [ ] Epic 05 Phase 0 complete (Day 12)
- [ ] Epic 04 Phase 0 complete
- [ ] Phase 1 specs finalized
- [ ] Phase 1 development begins

### End of Week 4 Target

- [ ] Epic 04 Phase 0+1 complete (21-28 days)
- [ ] Production workflows operational
- [ ] Ready for Quality Module integration (Epic 06)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Epic 04 implementation roadmap | ARCHITECT |

---

**Status:** APPROVED
**Action:** START Epic 05 Phase 0 IMMEDIATELY (Day 1)
**Target:** Phase 1 unblock Day 12
**Timeline:** 21-28 days to operational (2 devs)
