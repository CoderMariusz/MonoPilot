# Epic 04 Production Module - Blockers & Resolution Timeline

**Date:** 2025-12-16
**Status:** 1 CRITICAL BLOCKER | 4 MEDIUM ISSUES
**Impact:** 10 stories (36% of Epic 04) blocked until Day 12
**Blocked Work:** 18-24 days of production features
**Resolution:** When Epic 05 Phase 0 completes

---

## Critical Blocker Summary

### Blocker: Epic 05 License Plate Infrastructure Not Ready

**Severity:** 🔴 CRITICAL
**Status:** UNRESOLVED (depends on Epic 05)
**Impact:** 10 Epic 04 stories blocked
**Blocked Work:** 18-24 days of implementation
**Resolution Date:** Day 12 (2025-12-28) - when Epic 05 Phase 0 completes

---

## Blocker Details

### 1. Epic 05 Phase 0 Dependency (CRITICAL)

**What's Blocked:** All Phase 1 Production Stories (04.6a-e, 04.7a-d, 04.8)

**Why:** Material consumption and output registration require LP infrastructure

**What Epic 05 Must Deliver:**

| Story | Component | Required For | Unblock Date |
|-------|-----------|-------------|-------------|
| 05.1 | LP Table + CRUD | 04.6a, 04.7a (desktop) | Day 4 |
| 05.2 | LP Genealogy | 04.7 (output traceability) | Day 8 |
| 05.3 | LP Reservations + FIFO/FEFO | 04.8 (material picking) | Day 12 |

**Partial Unblock (Day 4):**
```
05.1 Complete (LP Table exists)
  ↓
Can start 04.6a (Consumption)
Can start 04.7a (Output)
⚠️ But cannot deploy yet (needs genealogy from 05.2)
```

**Full Unblock (Day 12):**
```
05 Phase 0 Complete (All LP infrastructure ready)
  ↓
Epic 04 Phase 1 FULLY ENABLED
All 10 stories can proceed
```

### 2. Material Consumption Blocked Until 05.1 (Day 4)

**Stories Affected:**
- 04.6a: Desktop Material Consumption (5-7 days)
- 04.6b: Scanner Material Consumption (3-4 days)
- 04.6c: 1:1 LP Consumption (2-3 days)
- 04.6d: Consumption Correction (3-4 days)
- 04.6e: Over-Consumption Approval (3-4 days)

**Total Blocked:** 16-23 days

**Why Blocked:**
- Need LP table schema to exist
- Need LP CRUD operations
- Need LP quantity tracking
- Need LP status management

**What Unblocks (Day 4):**
```
When 05.1 (LP Table + CRUD) is complete:
- LP table exists with all columns
- Basic LP create/read/update/delete works
- Quantity tracking functional
- Status management working

What Still Blocked (until Day 8):
- Genealogy queries (needs 05.2)
- Cannot link consumed LP → output LP yet

What Still Blocked (until Day 12):
- 1:1 consumption (needs FIFO/FEFO from 05.3)
- Picking suggestions (needs 05.3)
```

**Mitigation Before Day 12:**
- Create mock LP service (use stub data)
- Develop consumption UI without LP integration
- Create integration tests (will use real LP after Day 12)
- Have full specs ready for Day 4 (don't wait)

### 3. Output Registration Blocked Until 05.1 + 05.2 (Day 4 + Day 8)

**Stories Affected:**
- 04.7a: Desktop Output Registration (5-7 days)
- 04.7b: Scanner Output Registration (3-4 days)
- 04.7c: By-Product Output (2-3 days)
- 04.7d: Multiple Output Batches (3-4 days)

**Total Blocked:** 13-18 days

**Why Blocked:**
- Need LP creation (from 05.1)
- Need genealogy linking (from 05.2)
- Need output LP to be traceable back to inputs

**Timeline:**
```
Day 4: 05.1 complete
  - Can start 04.7a design
  - LP creation working
  ⚠️ But genealogy not linked yet

Day 8: 05.2 complete
  - Genealogy queries available
  - Can link consumed → produced
  - 04.7a design complete
  - 04.7a ready for implementation (Day 12)

Day 12: Full unblock
  - Complete genealogy chain
  - FIFO/FEFO for output picking
  - 04.7a-d can be deployed
```

**Mitigation Before Day 8:**
- Create mock genealogy service
- Design output UI and validation
- Create test data for genealogy scenarios
- Have full specs ready for Day 8

### 4. Material Reservations Blocked Until 05.3 (Day 12)

**Stories Affected:**
- 04.8: Material Reservations (FIFO/FEFO) (5-7 days)

**Total Blocked:** 5-7 days

**Why Blocked:**
- Need FIFO/FEFO picking algorithms from 05.3
- Need LP block/release mechanism
- Need reservation status tracking in LP service

**Timeline:**
```
Day 1-12: BLOCKED (no FIFO/FEFO algorithms)
Day 12: 05.3 complete
  - FIFO/FEFO algorithms available
  - LP block/release mechanism working
  - 04.8 can be implemented immediately

Day 13-19: Implementation (5-7 days)
  - Call FIFO/FEFO service
  - Block reserved LPs
  - Show pick suggestions to operator
```

**Mitigation Before Day 12:**
- Design reservation schema (can do now)
- Create mock FIFO/FEFO service
- Design picking suggestion UI
- Have full specs ready for Day 12

---

## Blocker Dependency Chain

```
┌──────────────────────────────────────────────────────┐
│                 CRITICAL PATH                         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Epic 05.1 (LP Table)          Day 4                 │
│       ↓                                               │
│  04.6a, 04.7a (Desktop)   PARTIAL UNBLOCK            │
│  (But no genealogy yet)                              │
│       ↓                                               │
│  Epic 05.2 (Genealogy)         Day 8                 │
│       ↓                                               │
│  04.7a (Output)           IMPLEMENTATION READY       │
│       ↓                                               │
│  Epic 05.3 (FIFO/FEFO)         Day 12                │
│       ↓                                               │
│  04.6a-e, 04.7a-d, 04.8  FULL UNBLOCK               │
│  (All Phase 1 stories)                               │
│       ↓                                               │
│  Epic 04 Phase 1         PRODUCTION READY            │
│  (18-24 days implementation)                         │
│                                                       │
└──────────────────────────────────────────────────────┘

CURRENT STATE:
  Phase 0 (04.1-04.5): ✅ READY NOW
  Phase 1 (04.6-04.8): ⏳ BLOCKED until Day 12
  Phase 2 (04.9-04.11): 📋 NOT DEPENDENT (can plan)
```

---

## Impact Analysis

### Work Blocked by Milestone

| Milestone | Date | Unblocks | Days Freed | Running Total |
|-----------|------|----------|-----------|---------------|
| Phase 0 ready | Day 1 | 04.1-04.5 | 10-14 | 10-14 |
| 05.1 complete | Day 4 | 04.6a, 04.7a (design) | 0 | 10-14 |
| 05.2 complete | Day 8 | 04.7a (impl ready) | 0 | 10-14 |
| 05.3 complete | Day 12 | 04.6a-e, 04.7a-d, 04.8 | 18-24 | 28-38 |

### Timeline Impact

**Without Optimization:**
```
Week 1-2:  Waiting for Epic 05 (no work to do)
Week 3-5:  Phase 1 implementation (after Day 12)
Total:     20-24 days idle + 18-24 days work = 38-48 days
```

**With Optimization:**
```
Week 1-2:  Phase 0 implementation (10-14 days)
           + Phase 1 design/specs (6-8 days)
           + Phase 2 planning (2-3 days)
Week 3-5:  Phase 1 implementation (9-12 days with 2 devs)
Total:     10-14 days useful + 9-12 days = 19-26 days
Savings:   19 days (50% faster)
```

---

## Action Items to Unblock

### Before Day 4 (Epic 05.1 Complete)

**Immediate Actions (Do Now):**
- [ ] Create 04.6a full specification (consumption UI)
- [ ] Create 04.7a full specification (output UI)
- [ ] Define LP service interface (what 04 needs to call)
- [ ] Create mock LP service for development
- [ ] Plan integration tests between 04 and 05

**Week 1 Deliverables:**
- [ ] Phase 0 (04.1-04.5) deployed to staging
- [ ] 04.6a, 04.7a specs ready for design review
- [ ] Mock LP service integrated in dev environment
- [ ] Integration test scaffolding created

**Contingency:**
- If 05.1 delayed past Day 4:
  - Continue Phase 0 hardening
  - Start Phase 2 (OEE) planning
  - Create comprehensive test suite for Phase 1

### Before Day 8 (Epic 05.2 Complete)

**Milestones to Achieve:**
- [ ] 05.1 deployed to staging
- [ ] 04.6a implementation started (using real LP service)
- [ ] 04.7a design finalized
- [ ] Genealogy schema review completed

**Contingency:**
- If 05.2 delayed past Day 8:
  - Continue 04.6a implementation
  - Start 04.7a design refinement
  - Plan scanner strategies (04.6b, 04.7b)

### Before Day 12 (Epic 05 Phase 0 Complete)

**Full Unblock Conditions:**
- [ ] 05.1, 05.2, 05.3 all deployed
- [ ] LP CRUD working
- [ ] Genealogy queries working
- [ ] FIFO/FEFO algorithms tested
- [ ] Integration tests passing

**When Unblocked (Day 12+):**
- [ ] Start 04.6b-e implementation (parallel)
- [ ] Start 04.7a-d implementation (parallel)
- [ ] Start 04.8 implementation (parallel)
- [ ] Deploy Phase 1 (9-12 days with 2 devs)

**Contingency:**
- If Epic 05 Phase 0 delayed past Day 12:
  - Switch to Phase 2 (OEE) - no dependencies
  - Build comprehensive test suite
  - Plan Phase 2 full specs
  - Reassess Epic 05 blocker (may need escalation)

---

## Medium Issues

### Issue 1: Phase 1 Full Specs Not Ready (Medium)

**Problem:** 10 Phase 1 stories are templates only

**Impact:** Cannot start development on Day 4/12 without full specs

**Resolution:** Expand templates to full specs during Week 1

**Action Items:**
- [ ] Create 04.6a-e full specifications (Week 1)
- [ ] Create 04.7a-d full specifications (Week 1)
- [ ] Create 04.8 full specification (Week 1)
- [ ] Add Gherkin acceptance criteria
- [ ] Add database schema details
- [ ] Add API endpoint specifications

**Timeline:**
- Start: Day 1
- Complete: End of Week 1 (Day 7)
- Benefit: Ready for Day 12 implementation

---

### Issue 2: Scanner Design System Missing (Medium)

**Problem:** Multiple stories reference scanner UI without unified standards

**Impact:** Risk of inconsistent UX, rework needed

**Stories Affected:**
- 04.6b: Scanner material consumption
- 04.7b: Scanner output registration
- 04.11a: Scanner UI optimization
- Plus stories from Epic 05, Epic 06

**Resolution:** Create scanner design system before Week 7

**What's Needed:**
- Touch target standards (48x48dp minimum)
- Audio feedback patterns (4 tone types with Hz/duration)
- Color scheme (high contrast for warehouse)
- Number pad layout and sizing
- Barcode scanning UI flow
- Offline queue management (up to 100 transactions)

**Action Items:**
- [ ] Define touch target standards (Week 5)
- [ ] Define audio patterns (Week 5)
- [ ] Create scanner UI kit (Week 6)
- [ ] Review with warehouse team (Week 6)
- [ ] Finalize before Phase 2 (Week 7)

**Impact:** Without this, Phase 2 (scanner stories) will have quality issues

---

### Issue 3: Integration Between Epic 04 and 05 Not Specified (Medium)

**Problem:** How 04 calls 05 LP service not defined

**Impact:** Cannot integrate until interfaces defined

**Stories Affected:**
- 04.6 (Material consumption)
- 04.7 (Output registration)
- 04.8 (Material reservations)

**Resolution:** Define service interfaces during Week 1

**What's Needed:**
```typescript
// What Epic 04 needs from Epic 05

interface LicensePlateService {
  // Get available LPs for consumption
  getAvailableLPs(orgId, warehouseId, filters?): Promise<LP[]>

  // Consume from LP
  consumeLP(lpId, quantity, woId, reason): Promise<Consumption>

  // Create output LP
  createOutputLP(orgId, warehouseId, product, quantity): Promise<LP>

  // Get genealogy
  getGenealogy(lpId): Promise<LPGenealogy>

  // Get FIFO/FEFO suggestions
  getPickSuggestions(product, quantity, strategy): Promise<LP[]>

  // Reserve LPs
  reserveLPs(lpIds, woId): Promise<Reservation>
}
```

**Action Items:**
- [ ] Define LP service interface (Week 1)
- [ ] Create TypeScript types/interfaces (Week 1)
- [ ] Implement in Epic 05 (Week 2-4)
- [ ] Test integration in Week 3-4

---

### Issue 4: Label Printing Integration Not Specified (Medium)

**Problem:** 04.7 (Output) references printing but 05.14 (ZPL) not ready

**Impact:** Cannot print LP labels after creating output LP

**Stories Affected:**
- 04.7: Output registration (needs to print label)
- 05.14: Label printing (dependency)

**Resolution:** Define label printing interface

**What's Needed:**
```typescript
interface LabelPrintingService {
  // Print LP label
  printLPLabel(lpId, quantity?, printerId?): Promise<PrintJob>

  // Print SSCC (pallet label)
  printPalletLabel(palletId, printerId?): Promise<PrintJob>

  // Get printer status
  getPrinterStatus(printerId?): Promise<PrinterStatus>
}
```

**Timeline:**
- Define interface (Week 1)
- Implement in 05.14 (Week 3-4)
- Integrate in 04.7 (Week 4+)

---

### Issue 5: Phase 2 (OEE) Specs Not Ready (Medium)

**Problem:** 11 Phase 2 stories are templates only

**Impact:** Cannot start Week 7 if specs not ready

**Resolution:** Expand templates to full specs during Week 3-5

**Action Items:**
- [ ] Create 04.9 OEE calculation specs (Week 3)
- [ ] Create 04.10 OEE dashboard specs (Week 3)
- [ ] Create 04.11 Scanner optimization specs (Week 3)
- [ ] All ready before Week 7

**Timeline:**
- Start: Week 3
- Complete: Week 5
- Ready for: Week 7 implementation

---

## Blocker Resolution Timeline

```
DAY 1:
  ✅ Phase 0 ready
  🔴 Phase 1 BLOCKED (10 stories)
  📋 Phase 2 can plan

DAYS 1-7 (Week 1):
  ✅ Phase 0 implementation (10-14 days)
  📋 Create Phase 1 full specs (04.6a-e, 04.7a-d, 04.8)
  📋 Create Phase 2 planning
  🔧 Define LP service interfaces
  🔧 Create mock LP service

DAY 4 (Milestone):
  ✅ Epic 05.1 (LP Table) complete
  🟡 04.6a, 04.7a PARTIAL UNBLOCK (can design)
  ⏳ Cannot deploy yet (needs genealogy)

DAY 8 (Milestone):
  ✅ Epic 05.2 (Genealogy) complete
  🟡 04.7a IMPLEMENTATION READY
  ⏳ 04.6a-e, 04.8 still blocked (need FIFO/FEFO)

DAY 12 (Milestone):
  ✅ Epic 05.3 (FIFO/FEFO) complete
  ✅ Phase 1 FULLY UNBLOCKED (all 10 stories)
  ✅ Begin Phase 1 implementation (9-12 days with 2 devs)

DAYS 13-25 (Weeks 3-4):
  ✅ Phase 1 implementation running full speed
  ✅ Deployment by end of Week 4

WEEK 7+:
  ✅ Phase 2 implementation (7-9 days with 2 devs)
```

---

## Dependency Matrix

### What Epic 04 Phase 1 Needs From Other Epics

| Epic 04 Story | Needs | Source | Available |
|---|---|---|---|
| 04.6a (Consumption) | LP CRUD | 05.1 | Day 4 |
| 04.6a (Consumption) | Genealogy queries | 05.2 | Day 8 |
| 04.6a (Consumption) | Full specs | Internal | Week 1 |
| 04.7a (Output) | LP creation | 05.1 | Day 4 |
| 04.7a (Output) | Genealogy links | 05.2 | Day 8 |
| 04.7a (Output) | Full specs | Internal | Week 1 |
| 04.8 (Reservations) | FIFO/FEFO algorithm | 05.3 | Day 12 |
| 04.8 (Reservations) | LP block/release | 05.3 | Day 12 |
| 04.8 (Reservations) | Full specs | Internal | Week 1 |

### What Epic 04 Phase 1 Provides to Other Epics

| Provides | Uses | When Available |
|---|---|---|
| Material consumption data | Epic 06 (Quality) | Day 13+ |
| Output LP data | Epic 06 (Quality) | Day 13+ |
| Genealogy traceability | Epic 03 (Deferred) | Day 13+ |
| Production history | Epic 03 Phase 2 (MRP) | Week 9+ |

---

## Risk Assessment

### Risk 1: Epic 05 Phase 0 Delayed Beyond Day 12

**Likelihood:** Medium (depends on Epic 05 team)
**Impact:** HIGH (10 stories, 18-24 days blocked)
**Mitigation:**
- [ ] Daily standups with Epic 05 team
- [ ] Monitor 05.1, 05.2, 05.3 progress weekly
- [ ] If delayed >1 day, escalate immediately
- [ ] Backup: Create mock LP service for testing

**Action If Delayed:**
- Switch team to Phase 2 (OEE) - no dependencies
- Build comprehensive unit test suite
- Plan Phase 1 implementation in detail
- Create detailed integration test scenarios

### Risk 2: Integration Between 04 and 05 Fails After Day 12

**Likelihood:** Medium (integration complexity)
**Impact:** HIGH (cannot proceed with Phase 1)
**Mitigation:**
- [ ] Define interfaces early (Week 1)
- [ ] Create integration test suite (Week 1)
- [ ] Test daily starting Day 4
- [ ] Have rollback plan

**Action If Integration Fails:**
- Debug service calls (expected 1-2 days)
- May need to delay Phase 1 deployment 2-3 days
- Continue Phase 2 planning

### Risk 3: Phase 1 Implementation Exceeds 18-24 Day Estimate

**Likelihood:** Medium (scope creep possible)
**Impact:** MEDIUM (adds 3-5 days)
**Mitigation:**
- [ ] Apply .Xa/.Xb splits (already in templates)
- [ ] Desktop-first strategy (04.6a, 04.7a before scanner)
- [ ] Freeze Phase 1 scope (no changes)
- [ ] Have Phase 2 ready to start

**Action If Exceeded:**
- Use second developer to accelerate
- Defer 04.6b, 04.7b (scanner) to later
- Deploy Phase 1 without scanner first

---

## Success Criteria

### Phase 1 Unblock Success

- [ ] Epic 05.1, 05.2, 05.3 all COMPLETE by Day 12
- [ ] LP service interface TESTED with 04 mock calls
- [ ] Integration tests PASSING
- [ ] Phase 1 full specs READY
- [ ] Team ready to execute Phase 1

### Phase 1 Implementation Success

- [ ] All 10 Phase 1 stories DEPLOYED by end of Week 4
- [ ] Material consumption WORKING with real LPs
- [ ] Output registration CREATING LPs correctly
- [ ] Genealogy TRACEABILITY validated
- [ ] Material reservations USING FIFO/FEFO
- [ ] Production operators CAN execute full workflow

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Epic 04 blockers and resolution timeline | ARCHITECT |

---

**Summary:**
- **Blocker:** Epic 05 Phase 0 (dependencies on LP infrastructure)
- **Impact:** 10 stories (18-24 days) blocked until Day 12
- **Unblock:** When Epic 05.1, 05.2, 05.3 complete
- **Mitigation:** Use Week 1-2 to finalize Phase 1 specs and prepare for Day 12 unblock
- **Status:** ACKNOWLEDGED - Ready for Day 12 implementation

**Escalation Path:** If Epic 05 delayed past Day 12, escalate to Project Manager
