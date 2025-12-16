# Epic 05 Warehouse: Execution Roadmap

**Date:** 2025-12-16
**Status:** FINAL - Implementation Plan
**Duration:** 12-14 weeks (2 developers)
**Target:** Complete operational warehouse system by Week 14

---

## Executive Summary

Epic 05 spans 12-14 weeks of development organized across 4 parallel streams:
1. **Epic 05 Development** (Warehouse module implementation)
2. **Epic 04 Integration** (Production operations using LPs)
3. **Epic 03 Deferred** (Planning features using LP reservations)
4. **System Integration** (Cross-module flows)

### Timeline at a Glance

| Week | Epic 05 | Epic 04 | Epic 03 | Integration |
|------|---------|---------|---------|-------------|
| **1-2** | Phase 0 | Phase 0 | Prep | Foundation |
| **3-4** | Phase 1 | Phase 1 start | Prep | Consumption/Output |
| **5-6** | Phase 1 end | Phase 1 mid | Phase 0 start | Reservations |
| **7-8** | Phase 2 | Phase 2 start | Phase 0 mid | Genealogy |
| **9-10** | Phase 2 end | Phase 2 mid | Phase 0 end | Scanner flows |
| **11-12** | Phase 3 | Phase 2 end | Deferred | Pallets |
| **13-14** | Phase 3 end | Polish | Polish | End-to-end |

**Total:** 16-20 weeks to full operational system
**To MVP:** 8-10 weeks to Phase 1 MVP (Phases 0-1 complete)

---

## Week 1-2: Foundation (Critical Path Week)

### Focus: LP Infrastructure Kickoff

**Goal:** Establish foundation that unblocks everything else

### Dev 1: Epic 05 Phase 0 (Days 1-12)

#### Day 1-2: Story 05.0 - Warehouse Settings
**Objective:** Basic warehouse configuration ready
**Activities:**
- Create warehouse settings table + schema migration
- Build settings UI (warehouse name, LP strategy, FIFO/FEFO toggle)
- Create test fixtures
- Write unit tests

**Deliverable:** Warehouse settings CRUD working, UI displays config

**Acceptance:**
- [ ] Warehouse master data creation/update working
- [ ] FIFO/FEFO strategy selectable
- [ ] Settings persist to database
- [ ] Test coverage >= 80%

#### Day 3-6: Story 05.1 - LP Table + CRUD ← **DAY 4 MILESTONE**
**Objective:** License plate foundation operational

**Activities (Days 3-4):**
- Design LP table schema (critical review)
- Create migration files
- Implement LP service (create, read, update methods)
- Write integration tests

**Activities (Days 5-6):**
- Build LP list page (filters, search)
- Implement basic CRUD UI
- Add RLS policies (org_id enforcement)
- End-to-end testing

**Deliverable:** Full CRUD operations for LPs, searchable list

**Acceptance (Day 4 Checkpoint):**
- [ ] LP table created with correct schema
- [ ] Create LP operation tested (positive + error cases)
- [ ] Read/update operations functional
- [ ] Search by product/supplier working
- [ ] RLS policies prevent cross-org queries
- [ ] Epic 04.6a can call LP service (mock WO data)
- [ ] Test coverage >= 80%

**Day 4 Signal:** Message to Epic 04 team: "LP service ready, can start 04.6a"

#### Day 7-8: Story 05.2 - LP Genealogy
**Objective:** Parent-child tracking active

**Activities:**
- Create LP genealogy table
- Implement genealogy queries (find all children, find all parents)
- Build genealogy visualization on LP detail
- Test traceability chains

**Deliverable:** Genealogy tracking + queries fast (< 100ms for 1000 LPs)

**Acceptance:**
- [ ] Genealogy queries working (parent ← → child)
- [ ] Consumption path traceable (WO → Output LP → Final Product)
- [ ] Performance tested (< 100ms query time)
- [ ] No N+1 query problems
- [ ] Test coverage >= 80%

#### Day 9-10: Story 05.3 - LP Reservations + FIFO/FEFO ← **DAY 12 MILESTONE**
**Objective:** Material allocation logic operational

**Activities (Days 9-9.5):**
- Create LP reservations table
- Implement reservation logic (reserve, unreserve, adjust)
- Code FIFO algorithm (sort by receipt_date)
- Code FEFO algorithm (sort by expiry_date)

**Activities (Days 10-10):**
- Build reservation UI (show reserved quantities)
- Test reservation conflicts + deadlock prevention
- Add reservation history audit trail
- Validate FIFO/FEFO selection logic

**Deliverable:** Reservations working, FIFO/FEFO algorithms tested

**Acceptance (Day 12 Checkpoint):**
- [ ] LP reservations prevent over-consumption
- [ ] FIFO picks oldest LPs first (by receipt_date)
- [ ] FEFO picks LPs expiring soonest first
- [ ] Available qty = total - reserved accurately
- [ ] No deadlock scenarios (transaction isolation)
- [ ] Epic 04.8 can implement WO reservations
- [ ] Test coverage >= 80%

**Day 12 Signal:** Message to Epic 04 team: "All Phase 1 stories unblocked, proceed"

#### Day 11-12: Stories 05.4-05.7 (Parallel on remaining time)
**Objective:** Polish Phase 0, ship complete foundation

**Parallel Activities:**
- **05.4 Status Management:** LP status field + state machine + transitions
- **05.5 Search & Filters:** Advanced search page (compound filters)
- **05.6 Detail & History:** LP detail + genealogy + movement history
- **05.7 Dashboard:** Warehouse KPI dashboard (LP counts, aging, expiry)

**Deliverable:** Phase 0 complete, all 8 stories merged to main branch

**Acceptance (Merge to Main):**
- [ ] All Phase 0 ACs met
- [ ] Integration tests pass (Phase 0 → Phase 1 flow)
- [ ] Regression tests pass (no Phase 0 regressions)
- [ ] Average test coverage 82% across phase
- [ ] Ready for Phase 1 without changes

### Dev 2: Epic 04 Phase 0 (Days 1-12, Parallel)

#### Days 1-12: Stories 04.1-04.5 - WO Lifecycle (No LP needed)
**Objective:** Production operations ready (without LPs)

**Timeline (estimated):**
- Days 1-4: 04.1 Dashboard (3-4 days)
- Days 4-7: 04.2a WO Start (3-4 days)
- Days 7-9: 04.2b Pause/Resume (1-2 days)
- Days 9-12: 04.2c Complete + 04.3-04.5 (6-8 days)

**Key Coordination Points:**
- Day 4: Epic 05.1 complete → Can start testing 04.6a
- Day 12: Epic 05 Phase 0 complete → Epic 04 Phase 1 unblocked

**Deliverable:** WO lifecycle CRUD complete, ready for consumption/output

---

## Week 3-4: Parallel Execution (Core Operations)

### Goal: Production + Receiving flows operational

### Dev 1: Epic 05 Phase 1 (Stories 05.8-05.15)

#### Days 13-26: GRN/ASN Workflows (14 days estimated)

**Story Breakdown:**
- **05.8** ASN CRUD + Items (3-4 days)
- **05.9** ASN Receive Workflow (2-3 days)
- **05.10** GRN CRUD + Items (4-5 days)
- **05.11** GRN from PO → Create LPs (3-4 days)
- **05.12** GRN from TO (2-3 days)
- **05.13** Over-Receipt Control (2-3 days)
- **05.14** LP Label Printing ZPL (2-3 days)

**Key Activities:**
- PO integration: Read PO lines → Create GRN from template
- LP creation: Generate LP for each line item
- Label printing: ZPL template generation + printer integration
- Over-receipt: Approval workflow for quantities > ordered

**Acceptance (Week 3 end):**
- [ ] ASN receive process working
- [ ] GRN creation from PO functional
- [ ] LPs generated automatically with sequential IDs
- [ ] Label printing working (test to printer)
- [ ] Over-receipt approval queue functional

### Dev 2: Epic 04 Phase 1 (Stories 04.6-04.8)

#### Days 13-32: Production Consumption + Output (18-24 days estimated)

**Story Breakdown:**
- **04.6a** Desktop Material Consumption (5-7 days)
- **04.6b** Scanner Material Consumption (5-7 days)
- **04.6c-e** Advanced consumption (5-7 days)
- **04.7a-d** Output Registration (Desktop + Scanner + variants) (5-7 days)
- **04.8** Material Reservations (5-7 days)

**Can START Day 4 (after 05.1):**
- Week 1: Begin UI development on mock LP service
- Week 2-3: Migrate to real LP service as 05.1 completes
- Week 3-4: Full implementation in production

**Key Integration Points:**
- WO starts → Check LP availability
- Select material LPs (from FIFO/FEFO suggestions)
- Consume LP qty → LP qty decreases
- Output registration → Create new LP with genealogy
- All operations tracked in lp_genealogy

**Acceptance (Week 4 end):**
- [ ] WO consumption reduces LP quantity
- [ ] Over-consumption prevented (reservation logic)
- [ ] Output creates new LP with parent genealogy
- [ ] Scanner flows tested
- [ ] FIFO/FEFO selection working

### Integration Checkpoint (Week 3-4)

**Cross-Module Tests:**
- [ ] PO → GRN flow end-to-end
- [ ] WO → Consumption → LP reduction
- [ ] Output registration → New LP with genealogy
- [ ] Reservation prevents over-consumption
- [ ] Scanner workflows tested on production LPs

---

## Week 5-6: Planning Integration

### Goal: All PO/TO/WO planning features working

### Dev 1: Epic 05 Phase 1 Completion (if needed) or Phase 2 start
### Dev 2: Epic 03 Phase 0-1 (Stories 03.1-03.17)

#### Days 29-44: Planning CRUD + Workflows (16 days, 2 devs)

**Story Breakdown:**
- **03.1-03.4** Foundation: Suppliers, Supplier-Products, PO CRUD, PO Calculations (10-15 days)
- **03.5a-03.7** PO Features: Approval, Bulk ops, Status (8-12 days)
- **03.8-03.10** TO + WO: CRUD + Lines, Operations (9-13 days)
- **03.11a-03.16** WO Materials + Dashboard (14-19 days)
- **03.17** Planning Settings (1-2 days)

**Can NOW use LP reservations:**
- **03.9b** TO LP Pre-selection (DEFERRED, now unblocked)
- **03.11b** WO Reservations (DEFERRED, now unblocked)
- **03.13** Material Availability Check (DEFERRED, now unblocked)
- **03.14** WO Scheduling (DEFERRED, now unblocked)

**Acceptance (Week 6 end):**
- [ ] Full PO lifecycle functional
- [ ] Transfer orders with LP selection working
- [ ] WO creation with BOM snapshot
- [ ] Material reservations preventing conflicts
- [ ] Planning dashboard showing schedules

### Integration Checkpoint (Week 5-6)

**Full PO → GRN → LP → WO → Consumption flow:**
- [ ] PO created → Status tracking
- [ ] GRN created from PO → LPs generated
- [ ] WO created from Plan → Material reserved
- [ ] WO material shows available qty
- [ ] Consumption reduces reserved qty
- [ ] Output creates new LP (genealogy complete)

---

## Week 7-8: Scanner & Advanced Warehouse

### Goal: Mobile warehouse operations

### Dev 1: Epic 05 Phase 2 (Stories 05.16-05.23)

#### Days 43-56: Scanner Workflows (14 days)

**Story Breakdown:**
- **05.16** Stock Moves CRUD (3-4 days)
- **05.17** LP Split Workflow (4-5 days)
- **05.18** LP Merge Workflow (4-5 days)
- **05.19** Scanner Receive (3-4 days)
- **05.20-23** Scanner Putaway/Move/Suggestions/Offline (8-10 days)

**Key Implementation:**
- Scanner UI: Touch-optimized (48x48dp targets)
- Audio feedback: 4 tone patterns (success, error, confirm, alert)
- Barcode scanning: Camera + manual fallback
- Offline queue: Queue 100 operations, sync when online

**Acceptance (Week 8 end):**
- [ ] Scanner receive barcode scan working
- [ ] Putaway with location scan functional
- [ ] LP/location splits working
- [ ] Offline operations queued + synced
- [ ] Audio feedback working

### Dev 2: Epic 04 Phase 2 (Stories 04.9-04.11) or Epic 03 polish

---

## Week 9-10: Quality Integration Prep

### Goal: Prepare for Epic 06 Phase 1

### Dev 1: Epic 05 Phase 2 Polish or Phase 3 start

### Dev 2: Epic 03/04 Polish + Integration Testing

#### Cross-Module Integration Testing

**Test Scenarios:**
- [ ] End-to-end PO → Production → Shipment
- [ ] LP genealogy traceability (find all products using input LP)
- [ ] FIFO/FEFO enforcement in reservations
- [ ] Scanner offline scenarios
- [ ] Multi-org isolation (RLS verification)

---

## Week 11-12: Advanced Warehouse Features

### Goal: Pallets + GS1 compliance

### Dev 1: Epic 05 Phase 3 (Stories 05.24-05.33)

**14 days estimated:**
- **05.24-05.27** Pallet management (8-10 days)
- **05.28-05.31** Catch weight + GS1 (4-5 days)
- **05.32-05.33** Batch tracking + expiry (3-4 days)

**Acceptance:**
- [ ] Pallets created + LPs assigned
- [ ] SSCC-18 labels printed
- [ ] GS1 barcodes generated for products
- [ ] Catch weight handling working
- [ ] Expiry validation preventing expired shipments

---

## Week 13-14: Final Polish & End-to-End

### Goal: Production-ready system

### Both Developers: Final Integration

#### Epic 05 Phase 4 (Stories 05.34-05.39)

**10 days estimated:**
- Inventory browser + aging reports
- Expiry alerts
- Cycle count workflows

#### System-Wide Testing
- [ ] All acceptance criteria verified
- [ ] Regression testing: No Phase 0 regressions
- [ ] Performance testing: LP queries < 100ms
- [ ] Multi-tenancy verification
- [ ] RLS policy verification
- [ ] Backup/recovery tested

#### Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Runbooks for operations team
- [ ] Training materials for users

---

## Risk Management

### Risk #1: Day 4 Delay (LP Service Late)

**Impact:** Epic 04.6a-7a cannot start, 2-3 day cascade
**Mitigation:**
- LP service code review on Day 2 (checkpoint)
- Mock LP service in Epic 04 (parallel development)
- Fallback: Epic 04 uses test data until 05.1 complete
**Owner:** Dev 1

### Risk #2: FIFO/FEFO Algorithm Complexity

**Impact:** Day 12 delay (05.3 not ready)
**Mitigation:**
- Algorithm design review Day 7
- Unit tests for algorithm in isolation
- Benchmark with 10,000 LPs before final
**Owner:** Dev 1 (+ technical review)

### Risk #3: Multi-Tenancy Data Leak

**Impact:** Critical: Cross-org data visible
**Mitigation:**
- RLS policy code review on Day 2
- Multi-org test scenario on Day 4 + Day 12
- Automated test: 2 orgs, verify no cross-org leaks
**Owner:** Dev 1 (+ security review)

### Risk #4: Performance Degradation

**Impact:** LP queries > 1000ms, system unusable
**Mitigation:**
- Query performance testing Week 2 (baseline)
- Add indexes on commonly searched fields
- Load test with 5000+ LPs
**Owner:** Both devs

### Risk #5: Integration Rework

**Impact:** Epic 04 consumption doesn't work with LPs
**Mitigation:**
- Shared acceptance criteria (see Week 3 checkpoint)
- Weekly integration testing
- Shared test data fixtures
**Owner:** Both devs + QA

---

## Dependency Management

### External Dependencies

**Must complete before Phase 0 start:**
- [ ] Epic 01.1: Organization + RLS ✅ (assumed complete)
- [ ] Epic 01.8: Warehouses ✅
- [ ] Epic 01.9: Locations ✅
- [ ] Epic 02.1: Products ✅

**Must complete before Phase 2 start:**
- [ ] Scanner design system (UX guidelines)
- [ ] Printer drivers (label printing)

**Must complete before Phase 3 start:**
- [ ] GS1 compliance guide
- [ ] SSCC-18 check digit algorithm

### Internal Dependencies

```
Phase 0 (Day 12)
  ↓
Phase 1 (Week 3-4)
  ↓
Phase 2 (Week 7-8)
  ↓
Phase 3 (Week 11-12)
  ↓
Phase 4 (Week 13-14)
```

**Parallel (No blocking):**
- Epic 04 Phase 1 proceeds after Epic 05 Phase 0 (Week 3)
- Epic 03 proceeds after Epic 05 Phase 0 (Week 5)

---

## Success Metrics

### Week 2 (Phase 0 Complete)
- [ ] 8 stories merged, 0 regressions
- [ ] All Phase 0 ACs met
- [ ] LP service tested, Epic 04 team confirms API usable
- [ ] Database performance: LP query < 50ms

### Week 4 (Phase 1 + Epic 04 Integration)
- [ ] GRN/ASN workflows operational
- [ ] WO consumption working with real LPs
- [ ] Genealogy traceability confirmed
- [ ] 10 Epic 04 stories unblocked

### Week 6 (Full Planning)
- [ ] PO → GRN → LP → WO → Consumption complete
- [ ] Material reservations preventing conflicts
- [ ] FIFO/FEFO selection working correctly

### Week 8 (Scanner Operational)
- [ ] Mobile warehouse operations functional
- [ ] Offline queue working + syncing
- [ ] Scanner UI performance acceptable

### Week 14 (Full System)
- [ ] All 40 Epic 05 stories complete
- [ ] Integration with Epic 04 + Epic 03 working
- [ ] Performance baseline: LP queries < 100ms
- [ ] Multi-tenancy: 0 data leaks
- [ ] Test coverage: >= 80% average

---

## Communication Plan

### Weekly Sync (Team Meeting)

**Every Monday 10am:**
- Review previous week progress
- Identify blockers
- Confirm milestone dates
- Discuss integration issues

### Day 4 Milestone (Dev 1 → Dev 2)

"Story 05.1 complete - LP service ready. Begin 04.6a-7a desktop testing with this endpoint: POST /api/warehouse/lps/consume"

### Day 12 Milestone (Dev 1 → Dev 2)

"Epic 05 Phase 0 complete - All Phase 1 stories unblocked. Phase 1 implementation can proceed at full speed."

### Integration Checkpoint (Both Devs)

Weekly confirmation:
- "Epic 04 + 05 integration: consumption/output/genealogy working?"
- "Epic 03 + 05 integration: reservations preventing conflicts?"

---

## Conclusion

Epic 05 execution follows a clear path:

1. **Weeks 1-2:** LP Foundation (critical blocker)
2. **Weeks 3-4:** Parallel Epic 04 + Epic 05 Phase 1
3. **Weeks 5-6:** Epic 03 Planning integration
4. **Weeks 7-8:** Scanner operations
5. **Weeks 11-14:** Advanced features + final polish

**Key success factors:**
- Day 4 and Day 12 milestones must be met
- Multi-tenancy RLS must be correct (no delays)
- FIFO/FEFO algorithm must be tested thoroughly
- Weekly integration testing between epics

**Result:** Production-ready warehouse system by Week 14 (12-14 weeks total)

---

**Version:** 1.0
**Date:** 2025-12-16
**Author:** TECH-WRITER
**Status:** FINAL - READY FOR EXECUTION

Start date: Day 1, Week 1
Dev 1 assignment: Epic 05 Phase 0 (critical path)
Dev 2 assignment: Epic 04 Phase 0 (parallel)
