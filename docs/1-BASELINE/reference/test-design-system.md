# System-Level Test Design - MonoPilot MES

**Project**: MonoPilot
**Phase**: Solutioning (Phase 2)
**Mode**: System-Level Testability Review
**Generated**: 2025-11-20
**Author**: TEA (Test Engineering Agent)

---

## Executive Summary

This document assesses the testability of MonoPilot's architecture before proceeding to solutioning gate check. MonoPilot is an enterprise MES for food manufacturing with 8 epics (237 stories), built on Next.js 15, TypeScript, and Supabase (PostgreSQL).

**Overall Assessment**: ✅ **PASS** with recommendations for Sprint 0 setup.

---

## Testability Assessment

### Controllability: ✅ PASS

**Can we control system state for testing?**

✅ **Strengths:**
- Supabase provides programmatic database seeding via SQL migrations
- API classes structured for dependency injection (can mock Supabase client)
- Multi-tenant architecture with `org_id` isolation enables parallel test execution
- Optimistic UI updates are testable (can assert both optimistic and confirmed states)

✅ **Evidence:**
- 85+ SQL migrations demonstrate schema version control
- Class-based API pattern (28 API classes) enables mocking
- E2E tests exist (100+ Playwright tests)

⚠️ **Recommendations:**
- Implement test database reset utility (e.g., `pnpm test:db:reset`)
- Create test data factories for common entities (LP, WO, PO, Products)
- Document test user setup (different roles: Admin, Manager, Operator, QC)

---

### Observability: ✅ PASS

**Can we inspect system state and validate results?**

✅ **Strengths:**
- PostgreSQL audit trail (`created_by`, `updated_by`, `created_at`, `updated_at`) on all tables
- Audit log table for quality/compliance actions
- Status lifecycles with timestamps (PO, WO, LP qa_status transitions)
- Genealogy tracking (`lp_genealogy` table) for traceability validation

✅ **Evidence:**
- Database schema includes comprehensive audit fields
- 40+ tables with consistent audit patterns
- Traceability design enables forward/backward trace validation

⚠️ **Recommendations:**
- Add structured logging for API operations (request/response logging)
- Implement test assertions library for common validations (status transitions, genealogy)
- Consider test data visibility tools (e.g., test dashboard showing LP/WO state)

---

### Reliability: ✅ PASS with CONCERNS

**Are tests isolated, reproducible, and maintainable?**

✅ **Strengths:**
- Multi-tenant isolation (`org_id` RLS) enables parallel test execution per tenant
- Stateless API design (REST) supports test isolation
- TypeScript strict mode reduces runtime errors in tests

⚠️ **Concerns:**
- **Real-time Supabase subscriptions**: May cause race conditions in tests (websocket state)
- **Optimistic updates**: Requires careful timing assertions (optimistic → confirmed state)
- **Scanner PWA offline mode**: Offline/online state transitions need careful test design
- **Caching (Upstash Redis)**: Cache invalidation during tests may cause flakiness

⚠️ **Recommendations:**
- Disable real-time subscriptions in test mode (use polling fallback)
- Create test utilities for waiting on optimistic confirmations
- Mock Redis cache in unit/API tests; test cache behavior separately
- Implement deterministic wait strategies (avoid arbitrary `sleep()`)

---

## Architecturally Significant Requirements (ASRs)

NFRs that drive architecture and testing strategy:

| ASR ID | Requirement | Testability Impact | Risk Score | Mitigation Strategy |
|--------|-------------|-------------------|------------|---------------------|
| ASR-001 | Multi-Tenant Data Isolation | RLS policies must be testable | 🔴 **9** (3×3) | E2E tests per tenant, validate cross-tenant data leakage |
| ASR-002 | Sub-Second API Response (<1s) | Performance testing required | 🟠 **6** (2×3) | k6 load tests, monitor SLO in staging |
| ASR-003 | Scanner Offline Reliability (PWA) | Service worker, cache, sync testing | 🟠 **6** (2×3) | Playwright offline mode tests, sync conflict scenarios |
| ASR-004 | License Plate Genealogy Integrity | Forward/backward trace must never break | 🔴 **9** (3×3) | E2E traceability tests, genealogy invariant checks |
| ASR-005 | BOM Snapshot Immutability | WO must not change when BOM updates | 🟠 **6** (2×3) | Snapshot versioning tests, compare BOM vs wo_materials |
| ASR-006 | 1:1 Consumption Enforcement | Partial LP consumption blocked when flagged | 🟡 **4** (2×2) | E2E scanner tests, API validation tests |
| ASR-007 | Optimistic UI Updates | UI feedback before server confirmation | 🟡 **4** (2×2) | Flakiness risk—implement wait utilities |

**High-Risk ASRs (Score ≥6):** 4 out of 7 require dedicated test design.

---

## Test Levels Strategy

Based on architecture (Next.js SSR/CSR + REST API + PostgreSQL):

### Recommended Split: **40% E2E / 30% API / 20% Component / 10% Unit**

**Rationale:**
- **High E2E focus (40%)**: Complex workflows (WO execution, scanner flows, traceability) require end-to-end validation
- **API tests (30%)**: Business logic in API classes (BOM auto-selection, material availability check, UoM validation)
- **Component tests (20%)**: React 19 components with complex state (Kanban boards, timeline views, modals)
- **Unit tests (10%)**: Pure utilities (date formatting, calculations, validation helpers)

### Test Levels by Epic

| Epic | E2E | API | Component | Unit | Rationale |
|------|-----|-----|-----------|------|-----------|
| Epic 1: Settings | 20% | 40% | 30% | 10% | Config-heavy, less UI complexity |
| Epic 2: Technical | 30% | 40% | 20% | 10% | BOM logic in API, versioning in E2E |
| Epic 3: Planning | 40% | 35% | 15% | 10% | Workflows (PO→GRN→LP) need E2E |
| Epic 4: Production | 50% | 30% | 10% | 10% | **Highest E2E**: WO consumption/output flows |
| Epic 5: Warehouse | 60% | 25% | 10% | 5% | **Highest E2E**: Scanner + LP genealogy |
| Epic 6: Quality | 35% | 40% | 15% | 10% | QA status logic, NCR workflows |
| Epic 7: Shipping | 45% | 35% | 15% | 5% | Picking/packing workflows E2E-heavy |
| Epic 8: NPD | 40% | 35% | 20% | 5% | Stage-gate workflow, formulation versioning |

---

## NFR Testing Approach

### Security (ASR-001: Multi-Tenant Isolation)

**Risk**: Highest priority (Score 9) - Data leakage between tenants

**Testing Strategy:**
- ✅ **RLS Policy Tests**: Create test for each table's RLS policy
  - Tenant A cannot read Tenant B's data
  - Ensure `org_id` filter enforced at DB level
- ✅ **E2E Multi-Tenant Tests**: Playwright with 2 browser contexts (2 tenants)
  - Parallel execution verifies isolation
- ✅ **Auth/Authz Tests**: Role-based access per module
  - 7 roles × 8 modules = 56 permission combinations (automated)
- ⚠️ **Tools**: Playwright (E2E), SQL unit tests (RLS policies), Supabase Auth testing

**Sprint 0 Actions:**
1. Create RLS policy test suite (SQL unit tests)
2. Add multi-tenant E2E test template
3. Document test user setup per role

---

### Performance (ASR-002: Sub-Second API Response)

**Risk**: Score 6 - SLA violation impacts UX

**Testing Strategy:**
- ✅ **Load Testing**: k6 scenarios for critical APIs
  - Product search, LP lookup, WO material check
  - Target: p95 < 500ms, p99 < 1s
- ✅ **Caching Validation**: Verify Upstash Redis cache hits
  - Product/BOM lookups should hit cache (90%+ hit rate)
- ✅ **Database Performance**: Monitor query times
  - Ensure indexes on `org_id`, `lp_number`, `product_code`, etc.
- ⚠️ **Tools**: k6 (load testing), Supabase query analyzer

**Sprint 0 Actions:**
1. Create k6 script template
2. Define SLO dashboard (Vercel Analytics or external)
3. Identify slow queries from migrations (add indexes)

---

### Reliability (ASR-004: LP Genealogy Integrity)

**Risk**: Score 9 - Broken traceability violates compliance

**Testing Strategy:**
- ✅ **E2E Genealogy Tests**: Validate forward/backward trace
  - PO → GRN → LP → Consume → WO → Output LP
  - Trace child LPs from parent
  - Trace parent LPs from child
- ✅ **Invariant Checks**: Genealogy must never have orphans
  - All consumed LPs must have `consumed_by_wo_id`
  - All output LPs must link to consumed LPs via `lp_genealogy`
- ✅ **Split/Merge Tests**: LP operations maintain genealogy
- ⚠️ **Tools**: Playwright E2E, SQL integrity checks

**Sprint 0 Actions:**
1. Create traceability test template (forward + backward)
2. Add database constraints for genealogy integrity
3. Implement genealogy validation utility

---

### Maintainability (Code Quality & Coverage)

**Testing Strategy:**
- ✅ **Code Coverage Targets**:
  - Critical paths (genealogy, multi-tenant): 90%+
  - API classes: 80%+
  - UI components: 70%+
  - Overall: 75%+
- ✅ **Test Quality Standards**:
  - All tests must have meaningful assertions (no empty tests)
  - P0 tests must be deterministic (no flakiness)
  - Tests must run <10 min for CI/CD
- ⚠️ **Tools**: Vitest (coverage), Playwright test runner

**Sprint 0 Actions:**
1. Configure coverage thresholds in `vitest.config.ts`
2. Add pre-commit hook for coverage check
3. Document test quality standards

---

## Test Environment Requirements

Based on deployment architecture (Vercel + Supabase):

| Environment | Purpose | Infrastructure | Data | Test Scope |
|-------------|---------|----------------|------|------------|
| **Local** | Dev + Unit tests | Docker (optional) | Factories | Unit, Component |
| **CI (GitHub Actions)** | PR validation | Ephemeral Supabase | Seeded per test | E2E (P0 only) |
| **Staging** | Integration + E2E | Persistent Supabase | Masked prod data | E2E (P0 + P1) |
| **Prod-like** | Performance + NFR | Scaled infrastructure | Synthetic load | Load, stress, spike |

**Recommendations:**
- Use Supabase local dev for unit/component tests
- Use Supabase test project for CI (ephemeral database per PR)
- Staging environment should mirror production (same Vercel plan, database size)

---

## Testability Concerns

### 🟡 Moderate Concerns (Addressable in Sprint 0)

1. **Real-Time Subscriptions Flakiness**
   - **Issue**: Supabase websockets may cause race conditions in tests
   - **Mitigation**: Disable subscriptions in test mode, use polling fallback
   - **Owner**: Dev team

2. **Optimistic Update Timing**
   - **Issue**: Tests may assert before server confirmation
   - **Mitigation**: Create `waitForConfirmed()` utility for optimistic updates
   - **Owner**: TEA (test framework)

3. **Scanner Offline/Online Sync**
   - **Issue**: Service worker cache and sync queue are stateful
   - **Mitigation**: Clear cache before each test, mock service worker in tests
   - **Owner**: TEA

4. **Redis Cache in Tests**
   - **Issue**: Cache state may leak between tests
   - **Mitigation**: Mock Redis in unit/API tests, flush cache in E2E setup
   - **Owner**: Dev team

### ✅ No Blockers

No architecture decisions fundamentally prevent testing. All concerns are addressable.

---

## Recommendations for Sprint 0

Before implementation begins, complete these test infrastructure tasks:

### 1. Test Framework Setup (2-3 days)

**Tasks:**
- ✅ Configure Playwright for multi-tenant testing (2 browser contexts)
- ✅ Set up Vitest with coverage thresholds
- ✅ Create test database reset utility (`pnpm test:db:reset`)
- ✅ Implement test data factories (ProductFactory, LPFactory, WOFactory)
- ✅ Add test user seeding script (7 roles × 2 tenants = 14 users)

**Workflow**: `/bmad:bmm:workflows:testarch:framework`

### 2. CI/CD Pipeline (1-2 days)

**Tasks:**
- ✅ GitHub Actions workflow for PR testing (P0 tests only, <10 min)
- ✅ Nightly E2E regression (P0 + P1, <30 min)
- ✅ Coverage reporting (Codecov or similar)
- ✅ Fail on flaky tests (retry logic with alerting)

**Workflow**: `/bmad:bmm:workflows:testarch:ci`

### 3. Test Quality Standards (1 day)

**Tasks:**
- ✅ Document test patterns (BDD, Page Object Model for scanner)
- ✅ Create test assertion library (status transitions, genealogy validation)
- ✅ Define P0/P1/P2/P3 tagging strategy
- ✅ Set up test data cleanup (after each test, org_id-scoped)

**Reference**: `.bmad/bmm/testarch/tea-knowledge/test-quality.md`

### 4. High-Risk ASR Tests (2-3 days)

**Priority ASRs to test immediately:**
- ✅ ASR-001: Multi-tenant isolation (RLS policy suite)
- ✅ ASR-004: LP genealogy integrity (E2E trace validation)
- ✅ ASR-002: Performance SLO (k6 baseline)

**Workflow**: `/bmad:bmm:workflows:testarch:nfr-assess`

---

## Test Effort Estimates (Per Epic)

Based on 237 stories across 8 epics:

| Epic | Stories | Est. P0 Tests | Est. P1 Tests | Est. P2/P3 Tests | Total Test Effort |
|------|---------|---------------|---------------|------------------|-------------------|
| Epic 1: Settings | 12 | 15 (2h ea) | 20 (1h ea) | 15 (0.5h ea) | **58 hours** |
| Epic 2: Technical | 24 | 30 (2h ea) | 40 (1h ea) | 30 (0.5h ea) | **115 hours** |
| Epic 3: Planning | 22 | 28 (2h ea) | 35 (1h ea) | 25 (0.5h ea) | **104 hours** |
| Epic 4: Production | 20 | 35 (3h ea) | 30 (1.5h ea) | 20 (0.5h ea) | **160 hours** (WO flows complex) |
| Epic 5: Warehouse | 35 | 50 (3h ea) | 45 (1.5h ea) | 35 (0.5h ea) | **235 hours** (Scanner + LP) |
| Epic 6: Quality | 28 | 30 (2h ea) | 35 (1h ea) | 30 (0.5h ea) | **110 hours** |
| Epic 7: Shipping | 28 | 35 (2.5h ea) | 35 (1h ea) | 25 (0.5h ea) | **135 hours** |
| Epic 8: NPD | 68 | 50 (2h ea) | 70 (1h ea) | 50 (0.5h ea) | **195 hours** (Stage-gate complexity) |
| **TOTAL** | **237** | **273** | **310** | **230** | **1,112 hours (~139 days)** |

**Test-to-Dev Ratio**: ~40% (industry standard for complex enterprise apps)

**Recommendation**: Allocate 1 QA engineer per 3 dev engineers, or embed testing in dev workflow (TDD/BDD).

---

## Quality Gate Criteria

Before proceeding from Solutioning to Implementation:

### ✅ Gate Criteria (Must Pass)

1. **Test Infrastructure Ready**:
   - [ ] Playwright configured for multi-tenant E2E
   - [ ] Vitest configured with coverage thresholds
   - [ ] Test database reset utility implemented
   - [ ] Test data factories created (Product, LP, WO, PO)

2. **High-Risk ASRs Validated**:
   - [ ] Multi-tenant isolation (ASR-001) test suite passing
   - [ ] LP genealogy integrity (ASR-004) test template created
   - [ ] Performance baseline (ASR-002) established with k6

3. **CI/CD Pipeline Active**:
   - [ ] GitHub Actions running P0 tests on every PR
   - [ ] Nightly regression configured
   - [ ] Coverage reporting enabled

4. **Testability Concerns Mitigated**:
   - [ ] Real-time subscriptions disabled in test mode
   - [ ] Optimistic update utilities created
   - [ ] Redis cache mocking implemented

### 📊 Success Metrics

- **P0 Test Pass Rate**: 100% (no flakes)
- **P1 Test Pass Rate**: ≥95%
- **Coverage**: ≥75% overall, ≥90% for critical paths
- **Test Execution Time**: <10 min for P0, <30 min for P0+P1

---

## Output Summary

### Testability Verdict: ✅ PASS

MonoPilot's architecture is testable with no fundamental blockers. The system uses well-supported technologies (Playwright, Vitest, PostgreSQL) and follows testable patterns (REST API, stateless design, audit trails).

### Risks Identified: 4 High-Priority ASRs (Score ≥6)

1. ASR-001: Multi-tenant isolation (Score 9)
2. ASR-004: LP genealogy integrity (Score 9)
3. ASR-002: API performance SLO (Score 6)
4. ASR-003: Scanner offline reliability (Score 6)

### Sprint 0 Workload: ~8-10 days

- Test framework setup: 2-3 days
- CI/CD pipeline: 1-2 days
- Test quality standards: 1 day
- High-risk ASR tests: 2-3 days
- Buffer: 1-2 days

### Next Steps

1. **Review this document** with dev team and product owner
2. **Run Sprint 0 workflows**:
   - `/bmad:bmm:workflows:testarch:framework` (test setup)
   - `/bmad:bmm:workflows:testarch:ci` (pipeline)
   - `/bmad:bmm:workflows:testarch:nfr-assess` (high-risk ASRs)
3. **Proceed to solutioning-gate-check** after Sprint 0 completion
4. **Begin epic implementation** with test-first approach (ATDD workflow per epic)

---

**Document Version**: 1.0
**Next Review**: After Sprint 0 completion
**Owner**: TEA (Test Engineering Agent)
