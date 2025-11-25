# Part 3: Gaps, Risks & Findings

**Assessment Date:** 2025-11-20
**Project:** MonoPilot MES
**Part:** 3 of 4

> 💡 **Navigation:** [Index](./index.md) | [Part 1](./1-executive-summary.md) | [Part 2: Analysis](./2-analysis-results.md) | **Part 3** | [Part 4: Action Plan](./4-action-plan.md)

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
**Issue:** Many stories lack ACs for database constraints, external service failures
**Impact:** Poor user experience, debugging difficulty
**All Epics**
**Fix Required:**
- Create AC Template Checklist for all stories
- Include: FK violations, duplicates, service failures, transaction rollback

---

#### Gap 8: FR → Story Traceability Matrix Not Documented
**Issue:** Epic files don't include FR coverage matrix
**Impact:** Cannot verify all FRs implemented
**All Epics**
**Fix Required:**
- Add FR Coverage Matrix section to each epic file
- Format: FR-XXX-YYY → Story Z.N

---

### High Priority Concerns (🟠 Should Address in Sprint 0)

#### Concern 1: Epic 5 (Warehouse) Bottleneck
**Issue:** Epic 5 blocks 3 other epics (4, 6, 7)
**Impact:** Delays cascade if Epic 5 slips
**Mitigation:**
- Split Epic 5: 5A (LP Core, Week 11-12) + 5B (Scanner PWA, Week 13-14)
- Epic 5A unblocks Epic 4, 6, 7
- Epic 5B runs parallel with Epic 4

---

#### Concern 2: Acceptance Criteria Incompleteness
**Issue:** Average AC completeness 77.5% (edge cases 68%, error handling 48%)
**Impact:** Stories require rework during development
**Mitigation:**
- Use AC Template Checklist for all future stories
- Review critical stories (5.7, 5.11, 4.6, 4.11) before Sprint 1

---

#### Concern 3: BOM Auto-Selection Edge Cases
**Issue:** Story 3.10 missing ACs for BOM selection failures
**Impact:** Production halts if no BOM available
**Mitigation:**
- Update Story 3.10 AC: Multiple versions, date overlaps, no BOM error
- E2E test: Edge cases for BOM selection

---

#### Concern 4: Context Management for Dev Team
**Issue:** Epic files total ~5,500 lines (risk of loading all at once)
**Impact:** AI context overflow → hallucinations
**Mitigation:**
- Add warning to Solutioning Gate Check report
- Document: "Load ONLY 1 epic file per session"
- Include in developer onboarding

---

### Medium Priority Observations (🟡 Consider During Implementation)

#### Observation 1: Redis Caching Setup Story Missing
**Issue:** Architecture mentions Upstash Redis, no dedicated setup story
**Impact:** Developers may forget to implement caching
**Mitigation:** Add Story to Epic 2: "Setup Redis Caching for Product/BOM Lookups"

---

#### Observation 2: Email Template Setup Story Missing
**Issue:** SendGrid mentioned, no email template story
**Impact:** Inconsistent email formatting
**Mitigation:** Add Story to Epic 1: "Email Template Setup (Invitations, Notifications)"

---

#### Observation 3: Subscription/Billing Patterns Not Detailed
**Issue:** FR-SET-011 (Subscription Management) in PRD, no Architecture details
**Impact:** Phase 2 feature, acceptable for P0
**Mitigation:** Add to Architecture during Phase 2 planning

---

### Low Priority Notes (🟢 Optional Enhancements)

#### Note 1: Voice Inspection (QA Module)
**Issue:** UX Design Variant D mentions voice inspection, no Architecture pattern
**Impact:** Future feature, not blocking
**Mitigation:** Add to Phase 3 roadmap

---

#### Note 2: Finance Module Placeholder
**Issue:** PRD has Finance placeholder, no Architecture
**Impact:** Phase 4 feature, not blocking
**Mitigation:** Design during Phase 3

---

## Positive Findings

### ✅ Well-Executed Areas

1. **Modular Documentation Structure**
   - PRD, Architecture, UX, Epics all use modular files
   - Optimized for AI context management (1 module at a time)
   - Prevents token exhaustion during development

2. **Multi-Tenancy Design**
   - org_id + RLS designed from foundation
   - ADR-001 clearly documents strategy
   - All epic stories include multi-tenant awareness

3. **Technology Stack Clarity**
   - All technologies have verified versions (Next.js 15, TypeScript 5.7, PostgreSQL 15)
   - Clear rationale for choices (ADRs)
   - No placeholder "TBD" technologies for P0

4. **Test Design Proactivity**
   - System-level testability review completed before implementation
   - 7 ASRs identified with risk scores
   - Sprint 0 recommendations included

5. **UX Design Thoroughness**
   - All 9 modules have UX specs
   - Hybrid approaches (default + expert modes)
   - Accessibility (WCAG AAA), mobile-first, offline-capable

6. **BDD Acceptance Criteria**
   - Stories use Given/When/Then format
   - Testable and clear
   - Prerequisites and technical notes included

7. **Dependency Awareness**
   - Epic dependencies clearly documented
   - No circular dependencies
   - Critical path identified

8. **Brownfield Context**
   - Existing codebase acknowledged (85+ migrations, 28 API classes, 100+ tests)
   - Integration with existing patterns
   - Architecture builds on proven foundation

---

## Recommendations

### Immediate Actions Required (Before Implementation)

#### 1. Add 5 Missing Integration Test Stories (Sprint 0)
**Effort:** 5-7 days
**Owner:** Test Engineer + Senior Dev
**Stories:**
- Story 0.1: PO → GRN → LP Integration Test
- Story 0.2: WO → Consumption → Genealogy Integration Test
- Story 0.3: QA Hold Blocks Consumption Test
- Story 0.4: External Service Resilience Tests
- Story 0.5: Redis Cache Fallback Test

---

#### 2. Update Story 5.7 (LP Genealogy) Acceptance Criteria
**Effort:** 1 day
**Owner:** Product Manager + Architect
**Changes:**
- Add AC: Transaction rollback if genealogy fails
- Add AC: FK validation for parent_lp_id
- Add AC: Forward/backward trace verification
- Add test story: "Verify LP Genealogy Integrity E2E"

---

#### 3. Add Story: "Verify BOM Snapshot Immutability" (Epic 3)
**Effort:** 2 days
**Owner:** Senior Dev
**Acceptance Criteria:**
- AC: Update BOM → Verify WO wo_materials unchanged
- AC: WO UI shows snapshot BOM version + effective date
- E2E test: Create WO → Update BOM → Verify immutability

---

#### 4. Add Story: "RLS Policy Test Suite" (Sprint 0)
**Effort:** 3-4 days
**Owner:** Senior Dev + Security
**Acceptance Criteria:**
- AC: SQL unit test for every table's RLS policy
- AC: Tenant A cannot read Tenant B data
- AC: CI/CD fails if new table lacks RLS test

---

#### 5. Add Story: "Scanner Offline Queue Management" (Epic 5)
**Effort:** 2-3 days
**Owner:** Frontend Dev
**Acceptance Criteria:**
- AC: Max 100 offline operations, warning at 80
- AC: UI shows queue size + sync status
- AC: Sync on reconnect within 2s
- E2E test: 100 offline ops → sync → verify all saved

---

#### 6. Update Transaction Atomicity ACs (Stories 4.6, 4.11, 5.11)
**Effort:** 1 day
**Owner:** Product Manager
**Changes:**
- Story 5.11: "GRN + LP creation atomic (rollback if any fails)"
- Story 4.6: "Consumption + genealogy atomic"
- Story 4.11: "Output LP + genealogy atomic"

---

#### 7. Create AC Template Checklist
**Effort:** 1 day
**Owner:** Product Manager
**Checklist Items:**
- [ ] Happy path (Given/When/Then)
- [ ] Required field validations
- [ ] Duplicate/conflict handling
- [ ] FK constraint violations
- [ ] External service failures
- [ ] Transaction rollback (if multi-record)
- [ ] Edge cases (empty state, max capacity)
- [ ] User-friendly error messages

---

#### 8. Add FR → Story Traceability Matrix to Epic Files
**Effort:** 2 days
**Owner:** Product Manager
**Format:**
```markdown
## FR Coverage Matrix

| FR ID | FR Title | Story IDs | Status |
|-------|----------|-----------|--------|
| FR-SET-001 | Org Config | 1.1 | ✅ Covered |
| FR-SET-002 | User Mgmt | 1.2, 1.3 | ✅ Covered |
...
```

---

### Suggested Improvements (Sprint 0)

#### 9. Split Epic 5 into 5A (LP Core) + 5B (Scanner PWA)
**Rationale:** Unblock Epics 4, 6, 7 earlier
**Effort:** 0 days (planning only)
**Change:**
- Epic 5A: Stories 5.1-5.11 (LP Core) - Week 11-12 - BLOCKING
