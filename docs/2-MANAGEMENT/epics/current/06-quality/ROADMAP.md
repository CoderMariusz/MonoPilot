# Epic 06: Quality Module - Implementation Roadmap

**Date:** 2025-12-16
**Status:** PLANNING (Stories pending creation)
**Timeline:** Week 9-10 Start (After Epic 05 Phase 0)
**Total Effort:** 45 stories, 60-78 days (1 dev), 30-39 days (2 devs)

---

## Executive Summary

Epic 06 Quality Module is the **last operational epic** in the core system (after Epics 05, 04, 03). It consolidates all quality, compliance, and traceability requirements into 4 phases:

| Phase | Focus | Stories | Days | Dependencies |
|-------|-------|---------|------|--------------|
| **1 (MVP)** | Inspections, Holds, Specs | 11 | 14-18 | Epic 05.1, 05.4, 02.1 |
| **2 (NCR)** | NCR workflow, Batch release | 12 | 16-20 | Phase 1, Epic 04 |
| **3 (HACCP)** | HACCP Plans, CCP monitoring | 12 | 16-20 | Phase 2, Epic 04 |
| **4 (CAPA)** | CAPA, Supplier quality, CoA | 10 | 14-18 | Phase 3, all upstream |

**TOTAL:** 45 stories across 4 implementation phases

---

## Why Epic 06 Comes LAST

### 1. LP Dependency (Critical Blocker)

Epic 06 inspections reference **License Plates (LPs)** from Epic 05:
- Incoming inspections hold LPs via `qc_hold_lps` table
- Each LP has `qc_status` (pending, pass, hold, reject)
- Batch release updates LP status

**Unblocked by:** Epic 05 Phase 0 completion (Day 12)

### 2. Production History Needed

Quality features reference production data from Epic 04:
- In-process inspection needs WO operations (`work_orders`)
- CCP monitoring needs operation recordings
- Downtime tracking during production

**Unblocked by:** Epic 04 Phase 0-1 (Week 3-4)

### 3. Product & Supplier Context (Epic 03)

Quality requirements reference master data:
- Product specs linked to `products` table (Epic 02.1)
- PO inspection requirements from `purchase_orders` (Epic 03.3)
- Supplier quality ratings (`suppliers` table)

**Unblocked by:** Epic 03 Phase 1 (Week 5-8)

### 4. Compliance is "Last Mile"

Food manufacturing quality flow:
1. **Receipt** → Incoming inspection (data available after GRN)
2. **Production** → In-process inspection (data available after WO start)
3. **Release** → Batch release (data available after all ops complete)
4. **Tracking** → HACCP/CCP monitoring (long-term operational tracking)
5. **Improvement** → CAPA (learns from operational issues)

Epic 06 layers compliance ON TOP of stable operational modules.

---

## Timeline - Critical Path to Week 9

### Week 1-2: Foundation Phase

**Epic 05 Phase 0 (Dev 1)** - LP Foundation CRITICAL BLOCKER
- 05.0 Warehouse Settings (2-3 days)
- 05.1 LP Table + CRUD (3-4 days) **← Day 4 Milestone**
- 05.2 Genealogy (3-4 days)
- 05.3 Reservations + FIFO/FEFO (3-4 days) **← Day 12 Milestone**
- 05.4-05.7 LP Status, Search, Detail, Dashboard (4-5 days)
- **Total:** 8-12 days
- **Unblocks:** Epic 04.6, 04.7, 04.8 + Epic 06 Phase 1 ready

**Epic 04 Phase 0 (Dev 2)** - WO Lifecycle
- 04.1 Production Dashboard (3-4 days)
- 04.2a/b/c WO Start/Pause/Complete (7-9 days)
- 04.3 Operation Start/Complete (3-4 days)
- 04.4 Yield Tracking (2-3 days)
- 04.5 Production Settings (1-2 days)
- **Total:** 10-14 days

### Week 3-4: Production Core

**Epic 04 Phase 1 (Both Devs)** - Material Flow with LPs
- 04.6a/b Material Consumption (Desktop + Scanner) (10-14 days)
- 04.7a/b Output Registration (Desktop + Scanner) (10-14 days)
- 04.8 Material Reservations (5-7 days)
- **Total:** 18-24 days (9-12 days with 2 devs)
- **Unblocks:** Epic 06 Phase 1 full integration testing

**Epic 05 Phase 1 (Dev 1 Parallel)**
- GRN/ASN workflows (10-14 days)

### Week 5-8: Planning Complete

**Epic 03 Phase 1 (Dev 2)** - All Planning Workflows
- 19 stories across suppliers, PO, TO, WO
- Ready for Epic 06 incoming inspection from PO

**Epic 05 Phase 2 (Dev 1 Parallel)** - Scanner Workflows
- LP movements, stock tracking

### Week 9-10: Quality MVP Ready ← **START HERE FOR EPIC 06**

**When Epic 05 Phase 0 is 100% stable** (verified in production):
- All LP infrastructure working
- QC holds can be created on LPs
- LP status transitions understood

**When Epic 04 Phase 0 is running** (some production operations in system):
- WO lifecycle complete
- Able to test quality hold scenarios

**Create Phase 1 Stories** (if not done earlier):
- 06.1-06.11: Inspections, Holds, Specs, Test Results (11 stories)
- Takes 1-2 weeks to create + test stories

**Start Epic 06 Phase 1 Implementation:**
- Quality Settings (1-2 days)
- Product Specs + Parameters (3-4 days)
- Holds CRUD + LP blocking (3-4 days)
- Incoming inspection with sampling (5-7 days)
- Test results recording (2-3 days)
- Dashboard (2-3 days)
- **Total:** 14-18 days for Phase 1

---

## Phase 1 MVP - What Gets Delivered (Week 9-12)

### Phase 1 Stories (11 Total)

**Quality Foundation (3 stories):**
- 06.1: Quality Settings (scope rules, test labs)
- 06.2: Product Specifications CRUD + parameters
- 06.3: Quality Hold Rules CRUD + blocking

**Inspection Workflows (4 stories):**
- 06.5a: Incoming Inspection (from GRN)
- 06.6: In-Process Inspection (from WO operations)
- 06.7: Final Inspection (before batch release)
- 06.8: Test Results Recording

**Sampling & Release (3 stories):**
- 06.9: Sampling Plans with AQL
- 06.10: Batch Release Workflow (LP status update)
- 06.11: Quality Dashboard (inspections, holds, passes)

**Basic Workflow (1 story):**
- 06.4: Basic NCR Creation (hold + notify)

### What MVP Enables

1. **Receive with Inspection**
   - GRN created → Can inspect batch
   - Pass → LP released for production
   - Hold → LP blocked, notifications sent

2. **Produce with Monitoring**
   - WO started → Can record in-process inspections
   - Monitor key parameters during production
   - Hold if parameters out of spec

3. **Release to Warehouse**
   - Final inspection required before batch release
   - LP status = "Released" → Available for picking
   - Traceability complete (Product → WO → LP → QC Status)

4. **Full Traceability**
   - Every LP has inspection history
   - Every hold has reason + resolution
   - Every test has results + approver

### What Phase 1 Skips (Deferred)

- NCR workflow (Phase 2) - Can create holds instead
- HACCP/CCP monitoring (Phase 3) - Can record manually
- CAPA tracking (Phase 4) - Document issues, track later
- Supplier audits (Phase 4) - Manual supplier communication
- E-signatures (Phase 4) - Admin review sufficient for MVP

---

## Phase 2: NCR Workflow (Week 13-16)

**After Phase 1 stable + 2+ weeks operational data**

12 stories covering:
- NCR creation, investigation, root cause analysis
- Batch disposition (scrap, rework, accept-as-is)
- Customer notification
- Regulatory reporting
- Root cause tools (5 Why, Fishbone)

**Dependencies:**
- Phase 1 complete (production data available)
- Epic 04 Phase 1 complete (operations for RCA)

---

## Phase 3: HACCP/CCP Monitoring (Week 17-20)

**After Phase 2 stable + HACCP guidelines documented**

12 stories covering:
- HACCP plan creation per product
- CCP definition + critical limits
- CCP monitoring during production
- Deviation alerts + corrective actions
- HACCP verification + documentation

**Dependencies:**
- Phase 2 complete
- Manufacturing process stable
- Regulatory guidance (FDA HACCP rules)

---

## Phase 4: CAPA & Supplier Quality (Week 21-26)

**After Phase 3 stable + 6+ months operational data**

10 stories covering:
- CAPA record creation + tracking
- Effectiveness checks (re-audit)
- Supplier quality ratings
- Supplier audits + findings
- Certificate of Analysis (CoA) generation
- FDA 21 CFR Part 11 e-signature support

**Dependencies:**
- Phase 3 complete
- Multiple CAPA cycles completed
- Supplier performance data available

---

## Story Creation Schedule

### CRITICAL: Stories Must Be Created Before Implementation

**Note:** Epic 06 has NO full story specifications yet (only analysis/templates).

| Phase | Stories | Creation Timeline | Start Implementation | Finish Implementation |
|-------|---------|------------------|----------------------|----------------------|
| **Phase 1** | 11 | Week 7-8 | Week 9-10 | Week 11-12 |
| **Phase 2** | 12 | Week 12-13 | Week 13 | Week 15-16 |
| **Phase 3** | 12 | Week 16-17 | Week 17 | Week 19-20 |
| **Phase 4** | 10 | Week 20-21 | Week 21 | Week 25-26 |

### Current Status

- Epic 06.0: Overview + brief summaries ✅ DONE
- Epic 06.1-06.11: Story descriptions (as .md files) ✅ DONE
- Epic 06: Full story specs (acceptance criteria, API design) ❌ **NEEDED WEEK 7-8**

---

## Key Dependencies - What Must Happen First

### HARD Dependencies (Epic 06 blocked without these)

| Upstream Epic | Required Table | When Available | Epic 06 Phase |
|---------------|----------------|-----------------|--------------|
| **Epic 05** | `license_plates` | Day 4 (05.1) | Phase 1 incoming |
| **Epic 05** | `lp_qc_status` | Day 12 (05.4) | Phase 1 holds |
| **Epic 05** | `qc_hold_lps` | Day 12 (05.4) | Phase 1 blocking |
| **Epic 04** | `work_orders` | Week 3 (04.1) | Phase 1 production |
| **Epic 04** | `operations` | Week 4 (04.3) | Phase 2 RCA |
| **Epic 03** | `purchase_orders` | Week 8 (03.3) | Phase 1 incoming |
| **Epic 02** | `products` | Week 4 (02.1) | Phase 1 specs |
| **Epic 02** | `product_specs` | Week 4 (02.1) | Phase 1 parameters |

### SOFT Dependencies (Can work around)

- Supplier quality data (Phase 4) - Can rate manually
- Historical inspection data (Phase 3) - Can build after going live
- Regulatory templates (Phase 4) - Can create generic first

---

## Integration Touch Points

### Phase 1: Incoming Inspection Flow

```
GRN Created (Epic 05)
    ↓
Create Batch for Inspection (06.5a)
    ↓
Record Test Results (06.8)
    ↓
Pass ✓
    └─→ LP qc_status = "pass" → Available for production
Fail ✗
    └─→ LP qc_status = "hold" → Create Hold Record (06.3)
        └─→ Create NCR (06.4 basic)
        └─→ Block LP from picking
```

### Phase 1: In-Process Inspection Flow

```
WO Operation Started (Epic 04)
    ↓
Record In-Process Inspection (06.6)
    ↓
Within Spec ✓
    └─→ Continue production
Out of Spec ✗
    └─→ Hold production → Create Hold Record
    └─→ Notify supervisor
```

### Phase 1: Batch Release Flow

```
Final Inspection (06.7)
    ↓
All Tests Pass?
    ├─ YES → Batch Release (06.10)
    │         └─→ LP qc_status = "released"
    │         └─→ Available in warehouse
    └─ NO → Hold batch
            └─→ Investigate (Phase 2 NCR)
```

---

## Critical Success Factors

### 1. LP Infrastructure Must Be Perfect

- If LP table missing columns → Incoming inspection blocked
- If LP status transitions wrong → Batch release fails
- If genealogy broken → Traceability incomplete

**Action:** Epic 05 Phase 0 acceptance tests include all LP QC scenarios

### 2. Production Data Must Be Flowing

- If WO operations not recorded → In-process inspection has no data
- If consumption incomplete → Traceability gap
- If output missing → Batch identification wrong

**Action:** Epic 04 Phase 0-1 integration tests with Epic 06

### 3. PO Data Available for Inspection

- If supplier PO data incomplete → Can't compare to spec
- If product specs missing → No pass/fail criteria
- If sampling plans undefined → AQL can't be applied

**Action:** Epic 03 Phase 1 + Epic 02.1 complete before Phase 1

### 4. Stories MUST Be Created Early

- Phase 1 stories needed by Week 7-8 (2 weeks before start)
- Phase 2-4 stories created just-in-time (2 weeks before start)
- Compliance review needed for HACCP/CAPA (Phase 3-4)

**Action:** Create Phase 1 stories during Epic 05 implementation

---

## Risk Mitigation

### Risk 1: LP Table Missing Columns

**Risk:** If `lp_qc_status` column missing, incoming inspection can't update LP state

**Mitigation:**
- Epic 05.4 (LP Status Management) explicitly creates this column
- Acceptance test: "Can set LP qc_status = hold/pass/reject"
- Validation: Enum constraint on qc_status values

### Risk 2: Genealogy Data Incomplete

**Risk:** If LP genealogy not recorded, traceability fails

**Mitigation:**
- Epic 05.2 (LP Genealogy) explicitly creates genealogy links
- Acceptance test: "Can trace LP back to GRN and forward to consumption"
- Validation: Every LP has parent or WO reference

### Risk 3: Production Operations Missing

**Risk:** If WO operations not recorded, CCP monitoring has nothing to check

**Mitigation:**
- Epic 04.3 (Operation Start/Complete) records all operations
- Acceptance test: "Each WO operation has timestamp + user"
- Validation: CCP monitoring can filter by operation type

### Risk 4: Supplier Data Stale

**Risk:** If PO supplier info outdated, incoming inspection references wrong supplier

**Mitigation:**
- PO immutable after creation (BOM snapshot pattern)
- Phase 1 uses PO supplier info as-is
- Phase 4 rates supplier based on inspection results

---

## What Makes Phase 1 MVP Sufficient

1. **Bare Minimum Compliance**
   - Incoming + in-process + final inspection
   - Hold capability for failed batches
   - Audit trail of all inspections

2. **Traceability Complete**
   - Every LP has inspection history
   - Every hold has reason + resolution
   - Genealogy from GRN through production

3. **Production Can Continue**
   - Good batches released
   - Bad batches held + notified
   - No compliance gaps for weeks 1-12

4. **Can Defer to Later**
   - NCR workflow (handle manually as holds first)
   - HACCP (manual process control initially)
   - CAPA (document issues, improve later)
   - Supplier ratings (manual feedback initially)

---

## When Can Phase 2-4 Start?

### Phase 2 (NCR) Start Conditions

- ✅ Phase 1 running for 2+ weeks
- ✅ 10+ holds created (have data to analyze)
- ✅ Phase 1 stories + acceptance tests passing
- ✅ Production stable (able to investigate root causes)

**Estimated Week:** Week 13 (after 3 weeks of Phase 1 operation)

### Phase 3 (HACCP) Start Conditions

- ✅ Phase 2 running for 2+ weeks
- ✅ 5+ NCRs completed (patterns emerging)
- ✅ Regulatory guidelines reviewed
- ✅ HACCP facilitator assigned

**Estimated Week:** Week 17 (after Phase 2 stable)

### Phase 4 (CAPA) Start Conditions

- ✅ Phase 3 running for 2+ weeks
- ✅ 10+ deviations detected (have issues to address)
- ✅ CAPA approval authority defined
- ✅ Supplier feedback loop established

**Estimated Week:** Week 21 (after Phase 3 stable)

---

## Final Recommendation

### Start Date: Week 9-10 (Mid-March)

**Prerequisite Checklist:**
- [ ] Epic 05 Phase 0 complete and stable (Day 12)
- [ ] Epic 04 Phase 0 complete (Week 2)
- [ ] Epic 04 Phase 1 running (Week 3-4)
- [ ] Epic 03 Phase 1 partially running (Week 5+)
- [ ] Epic 06 Phase 1 stories created (Week 7-8)
- [ ] Phase 1 testing infrastructure ready
- [ ] LP QC holds tested end-to-end

**Phase 1 Timeline:**
- Stories created + reviewed: Week 7-8 (1 week)
- Implementation + testing: Week 9-12 (4 weeks)
- UAT + fixes: Week 12 (1 week)
- Ready for production: Week 13

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2025-12-16 | DRAFT | Initial roadmap created from analysis |

---

**Status:** READY FOR APPROVAL
**Next Step:** Confirm Week 9-10 start date, assign Phase 1 story creation to Week 7-8
