# Part 2: Analysis Results (7 Methods)

**Assessment Date:** 2025-11-20
**Project:** MonoPilot MES
**Part:** 2 of 4

> 💡 **Navigation:** [Index](./index.md) | [Part 1](./1-executive-summary.md) | **Part 2** | [Part 3: Gaps](./3-gaps-and-risks.md) | [Part 4: Action Plan](./4-action-plan.md)

---


*Scenario: Implementation failed after 3 months. What went wrong?*

#### Failure Scenario 1: "The Context Catastrophe"
**What happened:**
- Team loaded all 8 epics simultaneously into AI context
- Token limit exhaustion → AI hallucinated implementations
- Inconsistency between modules (different patterns for similar functions)
- 3 weeks wasted on refactoring

**Why possible:**
- Epic files: ~5,500 lines total (too much for one session)
- Index warns: "Never load multiple epic files simultaneously"
- Workflow status YAML has comments about modular context loading

**Mitigation:**
- ✅ Index already warns
- 🔴 **RECOMMENDATION:** Add explicit warning in Solutioning Gate Check for dev team

---

#### Failure Scenario 2: "The Genealogy Nightmare"
**What happened:**
- LP genealogy broke after 2 weeks in production
- Split/Merge operations didn't maintain `lp_genealogy` relationships
- Recall simulation returned incomplete results → compliance failure
- Rollback impossible (production data corrupted)

**Why possible:**
- ASR-004: Risk Score **9** (highest)
- Genealogy most critical for food manufacturing (FDA compliance)
- Test Design warns: "Genealogy must never have orphans"

**Mitigation:**
- 🔴 **RECOMMENDATION:**
  1. Story "Setup LP Genealogy Tests" BEFORE first LP creation story
  2. Database constraints on `lp_genealogy` (foreign keys cannot be null if LP has parent)
  3. E2E test: Create → Split → Merge → Trace (forward + backward) in Sprint 0

---

#### Failure Scenario 3: "The Multi-Tenant Meltdown"
**What happened:**
- Tenant A saw Tenant B's data in production
- RLS policy missing for new module (developer forgot)
- Regulatory violation → contract termination → reputational damage

**Why possible:**
- ASR-001: Risk Score **9**
- 40+ tables require RLS policies
- Easy to forget during rapid development

**Mitigation:**
- 🔴 **RECOMMENDATION:**
  1. Sprint 0 Story: "Create RLS Policy Test Suite" - SQL unit tests for EVERY table
  2. CI/CD: Fail build if new table lacks RLS policy test
  3. Database migration template with auto-generated RLS policy boilerplate

---

#### Failure Scenario 4: "The BOM Snapshot Surprise"
**What happened:**
- Production Manager updated BOM after WO started
- wo_materials remained old (snapshot), but UI showed new BOM
- Operator consumed wrong materials → batch rejected → $50k loss

**Why possible:**
- ASR-005: BOM Snapshot Immutability (Risk Score 6)
- Confusion between "live BOM" vs "WO snapshot"
- UI may not clearly distinguish snapshot vs current BOM

**Mitigation:**
- 🔴 **RECOMMENDATION:**
  1. Story "WO BOM Snapshot UI Indicator" - Visual indicator WO uses snapshot
  2. E2E test: Update BOM → Verify WO materials unchanged
  3. UX: Show BOM version + date on WO execution screen

---

#### Failure Scenario 5: "The Scanner Offline Orphan"
**What happened:**
- Scanner operator worked offline 4 hours
- Service worker cache exceeded quota
- Sync failed → 200 LP creation records lost
- Manual re-entry for 2 days

**Why possible:**
- ASR-003: Scanner Offline Reliability (Risk Score 6)
- PWA cache limits (Chrome: 6% disk, ~60MB typical)
- Architecture doesn't specify max offline queue size

**Mitigation:**
- 🔴 **RECOMMENDATION:**
  1. Story "Scanner Offline Queue Management" - Max 100 operations, warning at 80
  2. UI: Show offline queue size + sync status
  3. E2E test: Simulate 100 offline operations → sync → verify all saved

---

#### Pre-Mortem Risk Register

| Failure Scenario | Probability | Impact | Risk Score | Status |
|------------------|-------------|--------|------------|--------|
| Context Catastrophe | Medium (40%) | Medium (3) | 🟡 **5** | ⚠️ Add gate warning |
| Genealogy Nightmare | Low (20%) | Critical (5) | 🔴 **4** | ⚠️ Require Sprint 0 tests |
| Multi-Tenant Meltdown | Low (20%) | Critical (5) | 🔴 **4** | ⚠️ Require RLS test suite |
| BOM Snapshot Surprise | Medium (40%) | High (4) | 🟠 **6** | ⚠️ Add UI story + E2E |
| Scanner Offline Orphan | Medium (40%) | High (4) | 🟠 **6** | ⚠️ Add queue mgmt story |

**Critical Risks (Score ≥6): 2** → Require immediate attention

---

### Method 3: Traceability Matrix Deep Dive

Detailed mapping of requirement realization chains.

#### Chain 1: LP Genealogy (ASR-004)

```
FR-TECH-015 (Forward Traceability)
    ↓
Architecture: lp_genealogy table + parent_lp_id/child_lp_id
    ↓
Epic 5, Story 5-5: "LP Split Operation"
    - AC: Given LP with 100kg, split to 2×50kg
    - AC: lp_genealogy records created (parent → 2 children)
    ↓
Epic 5, Story 5-6: "LP Merge Operation"
    - AC: Given 2 LPs, merge to 100kg
    - AC: lp_genealogy records created (2 parents → 1 child)
    ↓
Epic 5, Story 5-?: "Forward/Backward Trace" (requires verification)
    - AC: Trace from ingredient LP → all finished goods LPs
    - AC: Trace from finished good → all ingredient LPs
```

**Status:** ⚠️ **PARTIAL** - FR → Architecture → Stories OK, but Epic 5 not fully loaded for verification

---

#### Chain 2: BOM Snapshot (ASR-005)

```
FR-TECH-007 (BOM Versioning)
    ↓
Architecture: wo_materials table (snapshot at WO creation)
    ↓
Epic 3, Story 3-10: "WO Creation with BOM Auto-Selection"
    - AC: WO selects latest BOM version effective on planned_start_date
    - AC: wo_materials populated from bom_items (snapshot)
    ↓
**MISSING STORY:** "BOM Update Does Not Affect Active WO"
    - Expected AC: Update BOM → Verify WO materials unchanged
```

**Status:** ⚠️ **PARTIAL** - Snapshot creation OK, immutability test story **MISSING**

**Recommendation:** 🔴 **CRITICAL GAP** - Add story: "Verify BOM Snapshot Immutability" to Epic 3

---

#### Chain 3: Multi-Tenant Isolation (ASR-001)

```
NFR: Multi-tenant data isolation (99.99% guarantee)
    ↓
Architecture: ADR-001 + RLS policies on all tables
    ↓
Epic 1, Story 1-1: "Organization Setup with RLS Enforcement"
    - AC: org_id on all business tables
    - AC: RLS policy: user can only see org_id matching JWT claim
    ↓
**MISSING STORY:** "Create RLS Policy Test Suite" (Sprint 0)
    - Expected: SQL unit tests for every table
```

**Status:** ⚠️ **PARTIAL** - Architecture + Epic 1 setup OK, test story **MISSING**

**Recommendation:** 🔴 **CRITICAL GAP** - Add Sprint 0 story: "RLS Policy Test Suite"

---

#### Chain 4: Scanner Offline Mode (ASR-003)

```
NFR: 50% of scanner operations offline
    ↓
Architecture: ADR-004 (PWA Scanner) + Service Worker
    ↓
UX Design: Scanner Module Variant B (Single-Screen) + Offline indicator
    ↓
**MISSING STORY:** "Scanner Offline Queue Management"
    - Expected AC: Max 100 operations in queue
    - Expected AC: Sync on reconnect within 2s
```

**Status:** ⚠️ **PARTIAL** - Architecture + UX OK, queue management story **MISSING**

**Recommendation:** 🟠 **HIGH PRIORITY GAP** - Add story: "Scanner Offline Queue Management" to Epic 5

---

#### Traceability Matrix Summary

| Feature Area | FR → Arch | Arch → Stories | Stories → AC | Overall |
|--------------|-----------|----------------|--------------|---------|
| LP Genealogy | ✅ Complete | ⚠️ Unverified | ⚠️ Unverified | **90%** |
| BOM Snapshot | ✅ Complete | ⚠️ Missing immutability story | ⚠️ Missing test AC | **70%** |
| Multi-Tenant | ✅ Complete | ⚠️ Missing test story | ⚠️ Missing RLS suite | **75%** |
| Scanner Offline | ✅ Complete | ⚠️ Missing queue mgmt | ⚠️ Incomplete AC | **70%** |
| **Average** | **100%** | **75%** | **75%** | **76.3%** |

**Gaps Identified: 4 missing stories** (2 critical, 2 high priority)

---

### Method 4: Dependency Risk Assessment

Analysis of dependencies between stories and system components.

#### Epic Dependency Graph

```
Epic 1 (Settings) → FOUNDATION for all
    ↓
Epic 2 (Technical) → Required by Epic 3, 8
    ↓
Epic 3 (Planning) → Required by Epic 4
    ↓
Epic 5 (Warehouse) → Required by Epic 4, 6, 7 ⚠️ BOTTLENECK
    ↓
Epic 4 (Production) ← Dependencies: Epic 3, 5
    ↓
Epic 6 (Quality) ← Dependencies: Epic 1, 5
Epic 7 (Shipping) ← Dependencies: Epic 1, 5
Epic 8 (NPD) ← Dependencies: Epic 1, 2
```

**Critical Path:** Epic 1 → 2 → 3 → 5 → 4 (15-20 weeks)

**Bottleneck:** Epic 5 (Warehouse) is prerequisite for 3 epics (4, 6, 7)

---

#### Critical Dependency Risks

**Risk 1: Epic 5 (Warehouse) Delay Blocks 3 Epics**
- **Impact:** Epic 4, 6, 7 cannot start without LP creation
- **Probability:** Medium (30%) - Epic 5 has most stories (35) + Scanner PWA complexity
- **Mitigation:**
  - ✅ Already mitigated: Epic 5 estimated 4-5 weeks (longest buffer)
  - 🟠 **RECOMMENDATION:** Split Epic 5:
    - Epic 5A: LP Core (Stories 1-11) - MUST HAVE for Epic 4
    - Epic 5B: Scanner PWA (Stories 12-35) - CAN BE PARALLEL with Epic 6/7

**Risk 2: Epic 1 (Settings) Incomplete → All Epics Affected**
- **Impact:** Missing RLS → security risk, missing org_id → multi-tenancy broken
- **Probability:** Low (15%) - Epic 1 only 12 stories, well-defined
- **Mitigation:** ✅ Architecture clear, ⚠️ Epic 1 Story 1 should be "Database Foundation + RLS Template"

**Risk 3: BOM Auto-Selection (Epic 3) Fails → Production Blocked**
- **Impact:** Epic 4 "WO Material Consumption" requires wo_materials (populated from BOM)
- **Probability:** Low (20%) - BOM logic in Architecture, but edge cases possible
- **Mitigation:** 🟠 **RECOMMENDATION:** Epic 3 Story "BOM Auto-Selection" needs comprehensive E2E tests:
  - Multiple BOM versions with overlapping dates
  - Effective date edge cases
  - No BOM available (error handling)

**Risk 4: Scanner PWA Offline Sync Breaks → Warehouse Stops**
- **Impact:** 70% of warehouse operations are mobile - if offline breaks, operations halt
- **Probability:** Medium (30%) - Service Worker complexity
- **Mitigation:** 🟠 **RECOMMENDATION:** Epic 5 Sprint 0: "Scanner Offline Reliability Test Suite"

---

#### Story-Level Critical Dependencies

**Must Execute in Order:**

1. **Epic 1, Story 1.1** (Organization Setup) → ALL other stories
   - Risk: If RLS not setup, all future data insecure
   - ✅ Already Story 1

2. **Epic 2, Story 2.7** (BOM Versioning) → Epic 3, Story 3.10 (WO Creation)
   - Risk: WO cannot snapshot BOM if versioning broken
   - ⚠️ Verify Epic 2 Story 2.7 complete before Epic 3 starts

3. **Epic 5, Story 5.1** (LP CRUD) → Epic 4, Story 4.6 (Material Consumption)
   - Risk: Cannot consume what doesn't exist
   - ✅ Epic sequencing enforces this

4. **Epic 5, Story 5.11** (GRN + LP Creation) → Epic 4 (Consumption)
   - Risk: No inventory to consume if GRN not working
   - ⚠️ Recommend E2E test: PO → GRN → LP → Consume (cross-epic)

**Circular Dependency Check:** ✅ **NO CIRCULAR DEPENDENCIES** (DAG structure verified)

---

#### Dependency Risk Matrix

| Dependency | Type | Impact | Probability | Risk Score | Status |
|------------|------|--------|-------------|------------|--------|
| Epic 5 blocks 3 epics | Epic | High (4) | Medium (3) | 🟠 **12** | ⚠️ Split recommended |
| Epic 1 incomplete | Epic | Critical (5) | Low (2) | 🟡 **10** | ✅ Well-defined |
| BOM auto-select fails | Story | High (4) | Low (2) | 🟡 **8** | ⚠️ Add E2E tests |
| Scanner offline breaks | Story | High (4) | Medium (3) | 🟠 **12** | ⚠️ Add reliability tests |

**High-Risk Dependencies (Score ≥10): 3**

---

### Method 5: Sequencing Critical Path Analysis

#### Critical Path Timeline

```
Week 1-2:   [Epic 1: Foundation]
              ├─ 1.1 Org Setup (CRITICAL) ━━━━━━━━━━━━━┓
              ├─ 1.2 Users (CRITICAL) ━━━━━━━━━━━━━━━━━┫
              ├─ 1.5 Warehouses (CRITICAL) ━━━━━━━━━━━━┫
              └─ 1.3,1.4,1.6-1.10 (PARALLEL)           ┃
                                                        ┃
Week 3-6:   [Epic 2: Technical Core]                   ┃
              ├─ 2.1 Products (CRITICAL) ←──────────────┛
              ├─ 2.6 BOM Creation (CRITICAL) ━━━━━━━━━━┓
              ├─ 2.7 BOM Versioning (CRITICAL) ━━━━━━━━┫
              └─ 2.2-2.5, 2.8-2.18 (PARALLEL)          ┃
                                                        ┃
Week 7-10:  [Epic 3: Planning]                         ┃
              ├─ 3.13 Suppliers (CRITICAL) ←───────────┛
              ├─ 3.1, 3.2 PO CRUD (CRITICAL) ━━━━━━━━━━┓
              ├─ 3.10, 3.11 WO CRUD + BOM Select ━━━━━━┫
              └─ 3.3-3.9, 3.12-3.22 (PARALLEL)         ┃
                                                        ┃
Week 11-12: [Epic 5A: LP Core] ⚠️ BOTTLENECK           ┃
              ├─ 5.1 LP Creation (CRITICAL) ←──────────┛
              ├─ 5.7 LP Genealogy (CRITICAL) ━━━━━━━━━━┓
              ├─ 5.11 GRN + LP (CRITICAL) ━━━━━━━━━━━━━┫
              └─ 5.2-5.10 (DEPENDS ON 5.1)             ┃
                                                        ┃
Week 13-16: [Epic 4: Production] ←─────────────────────┛
              ├─ 4.2 WO Start (CRITICAL)
              ├─ 4.6 Material Consumption (CRITICAL)
              ├─ 4.11 Output Registration (CRITICAL)
              └─ 4.1, 4.3-4.10, 4.12-4.20 (PARALLEL)

Week 13-14: [Epic 5B: Scanner PWA] ← PARALLEL with Epic 4
Week 15-18: [Epic 6: Quality] ← PARALLEL with Epic 7
Week 15-18: [Epic 7: Shipping] ← PARALLEL with Epic 6
Week 7-22:  [Epic 8: NPD] ← Starts after Epic 2, runs parallel
```

#### Critical Path Metrics

| Phase | Critical Stories | Sequential Days | Buffer | Risk |
|-------|------------------|-----------------|--------|------|
| Epic 1 Foundation | 3 stories | 4 days | 6 days | 🟢 Low |
| Epic 2 Technical | 3 stories | 6 days | 14 days | 🟡 Medium |
| Epic 3 Planning | 4 stories | 8 days | 12 days | 🟡 Medium |
| Epic 5A LP Core | 3 stories | 7 days | 13 days | 🔴 High |
| Epic 4 Production | 3 stories | 8 days | 12 days | 🟠 Medium-High |

**Longest Sequential Chain:** 33 days (critical path stories only)
**Total Duration with Buffer:** 15-20 weeks (includes parallel work)
**Bottleneck:** Epic 5 Story 5.1 (LP Creation) blocks 3 epics

---

#### Top 5 Blocker Stories (MUST NOT SLIP)

🔴 **Critical Blockers:**
1. **Epic 1, Story 1.1** (Org Setup + RLS) - Blocks EVERYTHING
2. **Epic 2, Story 2.7** (BOM Versioning) - Blocks WO creation
3. **Epic 5, Story 5.1** (LP Creation) - Blocks 3 epics (4, 6, 7)
4. **Epic 5, Story 5.7** (LP Genealogy) - Compliance requirement
5. **Epic 3, Story 3.10** (WO CRUD) - Blocks Epic 4

**Recommendation:**
- ⚠️ Assign senior developers to these 5 stories
- ⚠️ Add +50% time buffer
- ⚠️ Test immediately after completion

---

#### Parallelization Opportunities

**After Epic 5.1 complete (Week 11):**
- ✅ Epic 4 Production (3-4 weeks)
- ✅ Epic 5B Scanner (2 weeks)
- ✅ Epic 6 Quality (3-4 weeks)
- ✅ Epic 7 Shipping (3-4 weeks)
- 🎯 **4 epics in parallel - Maximum team utilization**

---

### Method 6: Acceptance Criteria Completeness Check

Sample analysis of critical stories:

#### Story 1.1: Organization Configuration
- **Given/When/Then:** ✅ PASS
- **Testable:** ✅ PASS
- **Happy Path:** ✅ PASS
- **Edge Cases:** ✅ PASS (validation, logo size)
- **Error Handling:** ✅ PASS
- **Completeness:** **95%** ✅
- **Minor Gap:** Missing AC for logo upload failure

---

#### Story 1.2: User Management
- **Given/When/Then:** ✅ PASS
- **Happy Path:** ✅ PASS
- **Edge Cases:** ⚠️ PARTIAL (missing duplicate email, never-activated user cleanup)
- **Error Handling:** ⚠️ PARTIAL (missing email service failure, cannot deactivate last admin)
- **Completeness:** **80%** ⚠️
- **Recommendations:**
  1. Add AC: "Given only 1 admin, cannot deactivate"
  2. Add AC: "Email service fails → queue for retry"
  3. Add AC: "Duplicate email → show error"

---

#### Story 5.7: LP Genealogy (CRITICAL)
- **Given/When/Then:** ✅ PASS
- **Testable:** ⚠️ NEEDS IMPROVEMENT (describes fields, not verification)
- **Happy Path:** ✅ PASS
- **Edge Cases:** 🔴 **CRITICAL GAPS** (orphan prevention, circular reference, FK validation)
- **Error Handling:** 🔴 **MISSING ENTIRELY**
- **Completeness:** **60%** 🔴 **CRITICAL**
- **CRITICAL Recommendations:**
  1. 🔴 Add AC: "Genealogy insert fails → rollback transaction"
  2. 🔴 Add AC: "Invalid parent_lp_id → FK constraint error"
  3. 🔴 Add AC: "Forward trace returns all descendants"
  4. 🔴 Add AC: "Backward trace returns all ancestors"
  5. 🔴 Add test story: "Verify LP Genealogy Integrity" (E2E)

---

#### Story 5.11: GRN and LP Creation (CRITICAL BLOCKER)
- **Given/When/Then:** ✅ PASS
- **Happy Path:** ✅ PASS
- **Edge Cases:** ⚠️ PARTIAL (missing ad-hoc receiving, partial failure)
- **Error Handling:** 🔴 **CRITICAL GAP** (no transaction handling)
- **Completeness:** **75%** ⚠️
- **CRITICAL Recommendations:**
  1. 🔴 Add AC: "LP creation fails on item 5 → rollback entire GRN"
  2. Add AC: "Ad-hoc receiving (no ASN) → manual entry"
  3. Add AC: "Location missing → use warehouse default"

---

#### Acceptance Criteria Completeness Summary

| Story | Happy Path | Edge Cases | Error Handling | Overall |
|-------|------------|------------|----------------|---------|
| 1.1 Org Config | ✅ 100% | ✅ 90% | ✅ 85% | **95%** ✅ |
| 1.2 User Mgmt | ✅ 100% | ⚠️ 70% | ⚠️ 60% | **80%** ⚠️ |
| 3.10 WO CRUD | ✅ 100% | ⚠️ 70% | ⚠️ 50% | **75%** ⚠️ |
| 5.1 LP Creation | ✅ 100% | ⚠️ 70% | ⚠️ 60% | **80%** ⚠️ |
| 5.7 LP Genealogy | ✅ 100% | 🔴 40% | 🔴 0% | **60%** 🔴 |
| 5.11 GRN + LP | ✅ 100% | ⚠️ 70% | 🔴 30% | **75%** ⚠️ |
| **Average** | **100%** | **68%** | **48%** | **77.5%** |

**Pattern:** Missing error handling for database constraints, external services, transactions

---

### Method 7: Integration Point Risk Analysis

#### Internal Integration Points (9 total)

**Integration 1: Planning → Warehouse (PO → GRN → LP)**
- **Flow:** PO → ASN → GRN → LP
- **Contract:** PO lines → GRN items → LPs created
- **Risks:**
  - 🟠 PO line deleted after ASN created (FK error)
  - 🟠 Over-receipt validation
  - 🟠 Currency/UoM mismatch
- **Test Required:** ✅ E2E: Create PO → ASN → GRN → Verify LP
- **Status:** ⚠️ Contract documented, no integration test story

---

**Integration 2: Planning → Production (WO → Consumption)**
- **Flow:** WO creation → BOM snapshot → Material consumption
- **Contract:** WO + wo_materials → Consume LPs → Genealogy
- **Risks:**
  - 🔴 BOM updated after WO → wo_materials out of sync
  - 🔴 LP consumed but genealogy fails → orphan
  - 🟠 Concurrent consumption (2 WOs, same LP)
- **Test Required:** ✅ E2E: Create WO → Consume → Genealogy → Output
- **Status:** 🔴 **CRITICAL - No integration test story**

---

**Integration 3: Warehouse → Production (LP → Consumption)**
- **Flow:** LP created → WO consumes → LP status updated → Genealogy
- **Contract:** LP available → consumed → genealogy record
- **Risks:**
  - 🔴 Quarantined LP allowed to consume
  - 🔴 Partial consumption without split
  - 🟠 Cross-location consumption
- **Test Required:** ✅ E2E: Create LP → Start WO → Consume → Verify
- **Status:** ⚠️ Integration assumed, not tested

---

**Integration 4: Warehouse → Quality (LP → QA Status)**
- **Flow:** LP created with qa_status → QA inspection → Status updated → Consumption check
- **Contract:** LP qa_status controls availability
- **Risks:**
  - 🟠 Consume before QA complete
  - 🟠 QA status change doesn't notify production
  - 🔴 Quarantined LP physically moved
- **Test Required:** ✅ E2E: LP → QA → Consume validation
- **Status:** ⚠️ Epic 6 not loaded, contract assumed

---

**Integration 5: Production → Warehouse (WO Output → LP + Genealogy)**
- **Flow:** WO output → New LP created → Genealogy linked
- **Contract:** Output → LP + genealogy (atomic)
- **Risks:**
  - 🔴 Output LP created but genealogy fails → untraceable
  - 🟠 Low yield warning missing
  - 🟠 Output location not specified
- **Test Required:** ✅ E2E: Output LP → Verify Genealogy
- **Status:** 🔴 **CRITICAL - No integration test**

---

#### External Integration Points (4 total)

**External 1: Supabase Auth**
- **Risks:** Service down, JWT expired, user sync
- **Test Required:** Resilience testing
- **Status:** ⚠️ External dependency

**External 2: Supabase Storage**
- **Risks:** Upload failure, signed URL expiry, broken references
- **Test Required:** Resilience testing
- **Status:** ⚠️ External dependency

**External 3: Upstash Redis**
- **Risks:** Cache unavailable, stale data, key collision
- **Test Required:** Cache strategy testing
- **Status:** ⚠️ No caching tests

**External 4: SendGrid Email**
- **Risks:** Service down, bounced emails, rate limits
- **Test Required:** Resilience testing
- **Status:** ⚠️ External dependency

---

#### Integration Risk Matrix

| Integration | Type | Epics | Risk Score | Test Status |
|-------------|------|-------|------------|-------------|
| PO → GRN → LP | Internal | 3, 5 | 🟠 **6** | ⚠️ Need E2E |
| WO → Consumption | Internal | 3, 4, 5 | 🔴 **9** | 🔴 No test |
| LP → Consumption | Internal | 4, 5 | 🔴 **9** | ⚠️ Not tested |
| LP → QA → Consume | Internal | 4, 5, 6 | 🟠 **6** | ⚠️ Epic 6 TBD |
| WO Output → LP + Genealogy | Internal | 4, 5 | 🔴 **12** | 🔴 **CRITICAL** |
| Supabase Auth | External | 1 | 🟡 **4** | ⚠️ Resilience |
| Supabase Storage | External | 1, 5, 6 | 🟡 **4** | ⚠️ Resilience |
| Upstash Redis | External | 2, 4 | 🟠 **6** | ⚠️ No tests |
| SendGrid Email | External | 1, 6, 7 | 🟡 **4** | ⚠️ Resilience |

**High-Risk Integrations (Score ≥9): 3**

---

## Gap and Risk Analysis

### Critical Gaps (🔴 Must Fix Before Implementation)

#### Gap 1: Missing Integration Test Stories
**Issue:** 5 cross-epic integration points lack dedicated test stories
**Impact:** Integration failures discovered late in testing
**Epic:** Sprint 0
**Stories Required:**
1. Story 0.1: "PO → ASN → GRN → LP Integration Test"
2. Story 0.2: "WO → Consumption → Genealogy Integration Test"
3. Story 0.3: "QA Hold Blocks Consumption Integration Test"
4. Story 0.4: "External Service Resilience Tests"
5. Story 0.5: "Redis Cache Fallback Test"

---

#### Gap 2: LP Genealogy Integrity Not Fully Specified
**Issue:** Story 5.7 lacks error handling, transaction atomicity, and trace verification ACs
**Impact:** Compliance failure if genealogy breaks (FDA traceability)
**Epic:** Epic 5
**Fix Required:**
- Update Story 5.7 AC: Add transaction rollback, FK validation, trace verification
- Add Story: "Verify LP Genealogy Integrity E2E Test"
- Add database constraints: genealogy orphan prevention

---

#### Gap 3: BOM Snapshot Immutability Not Tested
**Issue:** No story verifies WO materials unchanged when BOM updated
**Impact:** Wrong materials consumed → batch rejection
**Epic:** Epic 3
**Fix Required:**
- Add Story: "Verify BOM Snapshot Immutability"
- AC: Update BOM → Verify WO wo_materials unchanged
- Add UI indicator: WO shows snapshot BOM version + date

---

#### Gap 4: RLS Policy Test Suite Missing
**Issue:** No automated tests for RLS policies on 40+ tables
**Impact:** Data leakage between tenants
**Epic:** Sprint 0
**Fix Required:**
- Add Story: "Create RLS Policy Test Suite"
- SQL unit tests for every table
- CI/CD: Fail build if new table lacks RLS test

---

#### Gap 5: Scanner Offline Queue Management Not Specified
**Issue:** No story defines max offline operations, sync strategy
**Impact:** Cache overflow → data loss
**Epic:** Epic 5
**Fix Required:**
- Add Story: "Scanner Offline Queue Management"
- AC: Max 100 operations, warning at 80
- AC: Show queue size + sync status in UI
- E2E test: 100 offline ops → sync → verify all saved

---

#### Gap 6: Transaction Atomicity Not Specified
**Issue:** Multi-record operations (GRN + LP, Consumption + Genealogy) lack rollback ACs
**Impact:** Partial success → data inconsistency
**Epics:** Epic 4, Epic 5
**Fix Required:**
- Update Story 5.11 AC: "GRN + LP creation atomic (rollback if any fails)"
- Update Story 4.6 AC: "Consumption + genealogy atomic"
- Update Story 4.11 AC: "Output LP + genealogy atomic"

---

#### Gap 7: Error Handling Pattern Missing
