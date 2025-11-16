# System-Level Test Design
**MonoPilot MES - Testability Architecture Review**

**Document Date**: 2025-11-14
**Author**: TEA (Test Architect Agent)
**Workflow**: `testarch-test-design` v4.0 (System-Level Mode - Phase 3 Solutioning)
**Status**: Phase 3 Testability Review - COMPLETE

---

## Executive Summary

### Testability Assessment: **72/100** ✅ PASS (with Recommendations)

The MonoPilot architecture demonstrates **good testability foundations** with clear module boundaries, class-based APIs, and extensive E2E coverage (100+ tests). However, architectural complexity in LP genealogy, BOM snapshot patterns, and multi-tenant RLS requires **enhanced test infrastructure** to achieve production-ready reliability.

### Key Findings:

| Dimension | Score | Status | Priority Recommendations |
|-----------|-------|--------|-------------------------|
| **Architecture Testability** | 85/100 | ✅ Excellent | Class-based APIs enable easy mocking |
| **Test Infrastructure** | 50/100 | ⚠️ Needs Work | Add fixtures, API helpers, network-first |
| **NFR Coverage** | 60/100 | ⚠️ Partial | Add security, performance, RLS tests |
| **CI/CD Integration** | 75/100 | ✅ Good | Add selective testing, burn-in jobs |
| **Domain Complexity** | 80/100 | ✅ Good | Complex genealogy testable via recursive CTEs |

### Critical Testability Concerns:

1. **LP Genealogy Depth** - Recursive CTE queries with 100+ LP trees require performance testing
2. **BOM Snapshot Immutability** - Must validate that WO material changes don't affect active WOs
3. **Multi-Tenant RLS** - Requires org_id isolation tests across all 40+ tables
4. **PWA Offline Mode** - Hybrid pessimistic/optimistic sync patterns need E2E validation
5. **UoM Strict Enforcement** - No automatic conversions requires boundary testing

### Gate Decision: **PASS** ✅ (Conditional)

**Rationale**: Architecture is testable, but test infrastructure (fixtures, NFR tests) must be implemented **during Epic 0** before Phase 4 implementation begins.

**Conditions**:
1. Implement fixture architecture with auto-cleanup (Phase 1 of test remediation)
2. Add RLS isolation tests for org_id across all business tables
3. Add performance tests for LP genealogy queries (100+ LP tree target: <1 min)
4. Implement network-first pattern in E2E tests to eliminate race conditions

---

## System Architecture Overview (Testability Lens)

### Technology Stack - Test Implications

| Layer | Technology | Testability Impact | Test Strategy |
|-------|-----------|-------------------|---------------|
| **Frontend** | Next.js 15 App Router | ✅ Good - Server/Client components testable separately | Unit (Vitest) + E2E (Playwright) |
| **API Layer** | 28 Class-based APIs | ✅ Excellent - Easy to mock, unit test | Unit tests (86% coverage achieved) + integration tests |
| **Database** | PostgreSQL + RLS | ⚠️ Complex - RLS requires org_id isolation tests | Integration tests with test org_id, RLS validation suite |
| **State** | React Context + SWR | ✅ Good - Testable with mock providers | Component tests with MSW network mocking |
| **Auth** | Supabase Auth + JWT | ✅ Good - Token-based, easy to mock | Integration tests + security NFR tests |
| **PWA/Offline** | IndexedDB + Service Worker | ⚠️ Complex - Requires offline E2E scenarios | E2E tests with network throttling, offline mode |
| **Deployment** | Vercel + Supabase | ✅ Good - Preview deployments enable testing | CI/CD with preview URLs, Playwright against staging |

### Architectural Patterns - Test Coverage Requirements

#### 1. **BOM Snapshot Pattern (Hybrid Immutability)**

**Architecture Decision #2**: Copy `bom_items` rows to `wo_materials` at WO creation for true immutability.

**Testability Concerns**:
- Must validate that BOM changes don't retroactively affect existing WOs
- Snapshot timing: WO creation → BOM copy → WO materials populated
- Data consistency: wo_materials must match BOM version at creation time

**Required Test Coverage**:

```yaml
test_scenario: BOM Snapshot Immutability
priority: P0
type: Integration
coverage:
  - Create WO with BOM v1.0 (10 materials)
  - Verify wo_materials table has 10 rows (snapshot created)
  - Update active BOM to v1.1 (add 11th material)
  - Reload WO → verify still shows 10 materials (immutability)
  - Create new WO → verify shows 11 materials (new snapshot)
assertions:
  - wo_materials.bom_version = "1.0" (original WO)
  - wo_materials.bom_version = "1.1" (new WO)
  - original WO unaffected by BOM edits
```

**Test Location**: `apps/frontend/e2e/08-bom-versioning.spec.ts` (expand existing)

---

#### 2. **LP Genealogy (Recursive CTE)**

**Architecture Decision #3**: Recursive PostgreSQL CTEs for <1 min traceability queries (100+ LP tree).

**Testability Concerns**:
- Performance degradation with deep genealogy trees (10+ levels)
- Recursive query correctness (forward and backward traceability)
- Edge cases: circular references (should be prevented), orphaned LPs

**Required Test Coverage**:

```yaml
test_scenario: LP Genealogy Performance
priority: P0
type: Integration + Performance
coverage:
  - Create 100 LP genealogy tree (10 levels deep, 10 children per node)
  - Execute forward traceability query (root → all children)
  - Execute backward traceability query (leaf → all parents)
  - Measure query execution time
assertions:
  - Query completes in <1 minute (p95)
  - Returns correct LP count (100 LPs)
  - No circular references detected
  - Parent-child relationships intact
monitoring:
  - Query execution time (log to CI artifacts)
  - Database EXPLAIN ANALYZE output
  - Fallback trigger: If >1 min, alert for Closure Table migration
```

**Test Location**: `apps/frontend/lib/api/__tests__/TraceabilityAPI.test.ts` (new integration test suite)

---

#### 3. **Multi-Tenant RLS (org_id Isolation)**

**Architecture Decision #5**: RLS + application-level filtering for org_id isolation across 40+ tables.

**Testability Concerns**:
- RLS policies must prevent cross-org data leaks
- Application-level filters must be consistent with RLS
- Edge case: Admin users with multi-org access

**Required Test Coverage**:

```yaml
test_scenario: RLS Org Isolation
priority: P0
type: Integration (Security NFR)
coverage:
  - Create Org A with User A, 10 POs
  - Create Org B with User B, 10 POs
  - User A attempts to query ALL purchase_orders (no org_id filter)
  - User A attempts to access User B's PO by ID (direct SQL)
assertions:
  - User A sees only 10 POs (Org A)
  - User A's query for Org B PO returns 0 rows (RLS blocks)
  - Database audit log shows RLS policy enforcement
test_tables:
  - po_header, po_line
  - to_header, to_line
  - work_orders, wo_materials
  - license_plates, lp_genealogy
  - asns, grns
  - products, boms, bom_items
  - warehouses, locations
  - (All 40+ business tables)
```

**Test Location**: `apps/frontend/lib/supabase/__tests__/rls-isolation.test.ts` (new security test suite)

---

#### 4. **Hybrid Offline Sync (Pessimistic + Optimistic)**

**Architecture Decision #4**: ASN/Output/QA = pessimistic queue, Movements/Consumption = optimistic immediate.

**Testability Concerns**:
- Pessimistic: Queue must persist failures and retry successfully
- Optimistic: Conflicts must resolve correctly (timestamp wins)
- Offline mode: IndexedDB cache must sync on reconnect

**Required Test Coverage**:

```yaml
test_scenario: Offline Sync - Pessimistic Queue
priority: P1
type: E2E
coverage:
  - Scanner user creates ASN while offline
  - Verify ASN queued in IndexedDB (pending status)
  - Simulate network reconnection
  - Verify ASN syncs to server (status → submitted)
  - Verify server record matches local data
assertions:
  - IndexedDB queue contains ASN (offline)
  - Server receives ASN with correct data (online)
  - Local cache cleared after successful sync
error_scenarios:
  - Network reconnects with 500 error → retry queue
  - Conflict: Server has newer ASN → merge or reject

test_scenario: Offline Sync - Optimistic Conflict
priority: P1
type: E2E
coverage:
  - User A moves LP-001 to Location A (offline)
  - User B moves LP-001 to Location B (offline, earlier timestamp)
  - Both reconnect simultaneously
assertions:
  - User B's move wins (earlier timestamp)
  - User A receives conflict notification
  - Final LP location = Location B
```

**Test Location**: `apps/frontend/e2e/scanner/offline-sync.spec.ts` (new E2E test suite)

---

#### 5. **UoM Strict Enforcement (No Automatic Conversions)**

**Architecture Decision**: No automatic UoM conversions, BOM UoM must match LP UoM.

**Testability Concerns**:
- Scanner must validate UoM match before consumption
- Edge case: Operator selects LP with wrong UoM → reject
- BOM requires 10 kg, LP is 10 lbs → should fail

**Required Test Coverage**:

```yaml
test_scenario: UoM Strict Validation
priority: P1
type: E2E
coverage:
  - BOM requires Material A (10 kg)
  - Operator scans LP-001 (Material A, 10 lbs) ❌ Wrong UoM
  - Scanner shows error: "UoM mismatch: Expected kg, got lbs"
  - Operator scans LP-002 (Material A, 12 kg) ✅ Correct UoM
  - Consumption succeeds
assertions:
  - LP-001 consumption rejected (UoM mismatch)
  - LP-002 consumption succeeds (UoM match)
  - Error message clear to operator
```

**Test Location**: `apps/frontend/e2e/scanner/uom-validation.spec.ts` (new E2E test)

---

## Test Levels Strategy (MonoPilot-Specific)

Based on TEA `test-levels-framework.md` knowledge fragment, here's the recommended test pyramid for MonoPilot:

### Test Pyramid Targets

```
         /\
        /E2E\ ← 15% (Critical user workflows)
       /------\
      / INTEG \ ← 35% (API + Database)
     /----------\
    /    UNIT    \ ← 50% (Business logic)
   /--------------\
```

### 1. Unit Tests (50% of total test effort)

**Focus**: Pure business logic, calculations, validations

**Coverage Targets**:
- API Classes: **95%+ coverage** (24/28 APIs currently tested - 86%)
- Utility Functions: **100% coverage**
- Zod Schemas: **90% coverage**

**Example Scenarios**:

```typescript
// ✅ Unit Test - Business Logic
describe('BomsAPI.evaluateBOM', () => {
  it('should calculate material requirements with scrap factor', () => {
    const bom = { materials: [{ qty: 10, scrap_factor: 0.1 }] };
    const result = BomsAPI.evaluateBOM(bom, 100); // 100 units
    expect(result[0].requiredQty).toBe(1100); // 10 × 100 × 1.1
  });
});

// ✅ Unit Test - Validation
describe('LicensePlateSchema', () => {
  it('should reject invalid UoM', () => {
    const invalidLP = { uom: 'invalid_unit', ... };
    expect(() => LicensePlateSchema.parse(invalidLP)).toThrow('Invalid UoM');
  });
});
```

**Tools**: Vitest (fast, modern, Vite-native)

---

### 2. Integration Tests (35% of total test effort)

**Focus**: API routes, database operations, RLS enforcement, service interactions

**Coverage Targets**:
- API Routes: **80%+ coverage**
- Database Queries: **90% coverage** (all CRUD operations)
- RLS Policies: **100% coverage** (all 40+ business tables)

**Example Scenarios**:

```typescript
// ✅ Integration Test - API Route
describe('POST /api/work-orders', () => {
  it('should create WO with BOM snapshot', async () => {
    const response = await POST('/api/work-orders', {
      product_id: 'PROD-001',
      quantity: 100,
    });
    expect(response.status).toBe(201);

    // Verify wo_materials snapshot created
    const woMaterials = await db.query('SELECT * FROM wo_materials WHERE wo_id = ?');
    expect(woMaterials.length).toBe(5); // BOM has 5 materials
  });
});

// ✅ Integration Test - RLS Isolation
describe('RLS Org Isolation', () => {
  it('should prevent cross-org PO access', async () => {
    const orgA = await createTestOrg('Org A');
    const orgB = await createTestOrg('Org B');

    const poA = await createPO({ org_id: orgA.id });

    // User B cannot access Org A's PO
    const result = await supabaseClientB.from('po_header').select().eq('id', poA.id);
    expect(result.data).toHaveLength(0); // RLS blocks
  });
});
```

**Tools**: Vitest + Supabase Test Client, Testcontainers for PostgreSQL

---

### 3. E2E Tests (15% of total test effort)

**Focus**: Critical user workflows, cross-module interactions, UI regressions

**Coverage Targets**:
- P0 Critical Paths: **100% coverage** (Auth, PO creation, WO execution, LP consumption)
- P1 Core Features: **80% coverage** (BOM versioning, ASN receiving, GRN)
- P2 Secondary Features: **50% coverage** (Filters, sorting, reports)

**Example Scenarios**:

```typescript
// ✅ E2E Test - Critical Path
test('P0: Complete production workflow', async ({ page }) => {
  // 1. Create Work Order
  await createWorkOrder(page, { product: 'FG-001', qty: 100 });

  // 2. Reserve LPs for materials
  await reserveLicensePlates(page, woId);

  // 3. Execute WO (consume LPs, generate output)
  await executeWorkOrder(page, woId);

  // 4. Verify genealogy created
  await verifyLPGenealogy(page, { parent: 'LP-OUT-001', children: ['LP-001', 'LP-002'] });

  // 5. Complete WO
  await completeWorkOrder(page, woId);
});
```

**Tools**: Playwright (current), with improvements:
- Add fixtures for data cleanup
- Implement network-first pattern
- Replace hard waits with event-based waits

---

## Non-Functional Requirements (NFR) Test Strategy

Based on TEA `nfr-criteria.md` knowledge fragment, here's the NFR validation approach:

### 1. Security NFR Tests

| Requirement | Test Approach | Acceptance Criteria | Priority |
|-------------|--------------|---------------------|----------|
| **Authentication** | E2E test unauthenticated access redirects to login | All protected routes redirect | P0 |
| **Authorization (RBAC)** | Integration test role-based access to API endpoints | Operator cannot delete POs | P0 |
| **RLS Isolation** | Integration test org_id filtering across all tables | Zero cross-org data leaks | P0 |
| **Password Security** | E2E test password never logged/exposed in errors | No password in console/DOM | P0 |
| **JWT Expiration** | Integration test token expires after 15 min | 401 error after expiration | P1 |
| **OWASP Top 10** | Security scan (OWASP ZAP, Snyk) | Zero critical vulnerabilities | P1 |

**Implementation**:

```typescript
// apps/frontend/lib/api/__tests__/security-nfr.test.ts
describe('Security NFR: RLS Org Isolation', () => {
  it('should prevent cross-org PO access', async () => {
    const { orgA, userA } = await createTestOrgAndUser('Org A');
    const { orgB, userB } = await createTestOrgAndUser('Org B');

    const poA = await createPO({ org_id: orgA.id, user: userA });

    // User B attempts direct query (bypass application layer)
    const supabaseB = createSupabaseClient(userB.token);
    const { data } = await supabaseB.from('po_header').select().eq('id', poA.id);

    expect(data).toHaveLength(0); // RLS blocks access
  });
});
```

---

### 2. Performance NFR Tests

| Requirement | Test Approach | Acceptance Criteria | Priority |
|-------------|--------------|---------------------|----------|
| **API Response Time** | Load test with k6 or Artillery | p95 <200ms for CRUD operations | P0 |
| **LP Genealogy Query** | Integration test with 100+ LP tree | <1 min query execution | P0 |
| **Database Connection Pool** | Load test with 50 concurrent users | No connection exhaustion | P1 |
| **Page Load Time** | Lighthouse CI in Playwright | Performance score >90 | P1 |
| **PWA Offline Cache** | E2E test IndexedDB read latency | <50ms for cached data | P2 |

**Implementation**:

```typescript
// apps/frontend/lib/api/__tests__/performance-nfr.test.ts
describe('Performance NFR: LP Genealogy Query', () => {
  it('should execute 100+ LP tree query in <1 min', async () => {
    // Create deep genealogy tree
    const rootLP = await createLPTree({ depth: 10, childrenPerNode: 10 }); // 100+ LPs

    const startTime = performance.now();
    const genealogy = await TraceabilityAPI.getForwardGenealogy(rootLP.id);
    const executionTime = performance.now() - startTime;

    expect(genealogy.length).toBeGreaterThan(100);
    expect(executionTime).toBeLessThan(60000); // <1 min (60,000 ms)
  });
});
```

**Monitoring**: Log query execution times to CI artifacts, alert if p95 >50s (triggers Closure Table migration evaluation).

---

### 3. Reliability NFR Tests

| Requirement | Test Approach | Acceptance Criteria | Priority |
|-------------|--------------|---------------------|----------|
| **Offline Sync Retry** | E2E test pessimistic queue with network errors | 3 retries with exponential backoff | P0 |
| **Database Transaction Rollback** | Integration test concurrent updates with conflicts | Data integrity maintained | P0 |
| **Error Handling** | Unit test all catch blocks log errors | 100% error paths covered | P1 |
| **Health Check Endpoint** | Integration test `/api/health` returns 200 | Uptime monitoring integration | P1 |

---

### 4. Maintainability NFR Tests

| Requirement | Test Approach | Acceptance Criteria | Priority |
|-------------|--------------|---------------------|----------|
| **Code Coverage** | CI/CD coverage report (Vitest + Playwright) | >90% unit, >80% integration | P0 |
| **Test Quality Score** | TEA test-review workflow | >80/100 quality score | P0 |
| **API Documentation** | Auto-generate from TSDoc comments | 100% API methods documented | P1 |
| **Database Schema Docs** | Auto-generate from migrations | Up-to-date schema reference | P1 |

---

## Test Infrastructure Recommendations

### Phase 1: Fixture Architecture (Epic 0, Weeks 1-2)

**Goal**: Implement auto-cleanup fixtures to enable true parallel test execution.

**Implementation**:

```typescript
// apps/frontend/e2e/fixtures/database-fixture.ts
import { test as base } from '@playwright/test';
import { createSupabaseClient } from '../helpers/supabase-test-client';

type DatabaseFixture = {
  createPO: (poData: Partial<PurchaseOrder>) => Promise<PurchaseOrder>;
  createWO: (woData: Partial<WorkOrder>) => Promise<WorkOrder>;
  createLP: (lpData: Partial<LicensePlate>) => Promise<LicensePlate>;
  cleanup: () => Promise<void>;
};

export const test = base.extend<DatabaseFixture>({
  createPO: async ({}, use) => {
    const createdPOs: string[] = [];

    const createPO = async (poData: Partial<PurchaseOrder>) => {
      const po = await PurchaseOrdersAPI.create(poData);
      createdPOs.push(po.id);
      return po;
    };

    await use(createPO);

    // Auto-cleanup
    for (const poId of createdPOs) {
      await PurchaseOrdersAPI.delete(poId);
    }
  },

  createWO: async ({}, use) => {
    const createdWOs: string[] = [];

    const createWO = async (woData: Partial<WorkOrder>) => {
      const wo = await WorkOrdersAPI.create(woData);
      createdWOs.push(wo.id);
      return wo;
    };

    await use(createWO);

    // Auto-cleanup (cascade deletes wo_materials via FK)
    for (const woId of createdWOs) {
      await WorkOrdersAPI.delete(woId);
    }
  },

  createLP: async ({}, use) => {
    const createdLPs: string[] = [];

    const createLP = async (lpData: Partial<LicensePlate>) => {
      const lp = await LicensePlatesAPI.create(lpData);
      createdLPs.push(lp.id);
      return lp;
    };

    await use(createLP);

    // Auto-cleanup (cascade deletes lp_genealogy via FK)
    for (const lpId of createdLPs) {
      await LicensePlatesAPI.delete(lpId);
    }
  },
});

// Usage in test
import { test } from './fixtures/database-fixture';

test('should create PO with auto-cleanup', async ({ page, createPO }) => {
  const po = await createPO({ supplier_id: 'SUP-001', ... });

  await page.goto(`/planning/purchase-orders/${po.id}`);
  await expect(page.getByTestId('po-number')).toHaveText(po.po_number);

  // No manual cleanup needed - fixture handles it
});
```

**Effort**: 16-20 hours
**Impact**: 3x faster test suite (enables true parallel execution)

---

### Phase 2: Network-First Pattern (Epic 0, Week 3)

**Goal**: Eliminate race conditions by intercepting API requests before navigation.

**Implementation**:

```typescript
// apps/frontend/e2e/helpers/network-first.ts
export async function navigateWithNetworkFirst(
  page: Page,
  url: string,
  expectedAPIs: string[]
) {
  // Setup intercepts BEFORE navigation
  const responsePromises = expectedAPIs.map(apiPath =>
    page.waitForResponse(resp => resp.url().includes(apiPath) && resp.ok())
  );

  await page.goto(url);

  // Wait for all API responses
  await Promise.all(responsePromises);
}

// Usage in test
test('should load PO list deterministically', async ({ page }) => {
  await navigateWithNetworkFirst(page, '/planning/purchase-orders', [
    '/api/purchase-orders',
    '/api/suppliers',
  ]);

  // Data guaranteed loaded - no race conditions
  await expect(page.getByTestId('po-table')).toBeVisible();
});
```

**Effort**: 8-12 hours
**Impact**: 60-70% reduction in flakiness

---

### Phase 3: Selective Test Execution (Epic 0, Week 4)

**Goal**: Fast feedback loops by running only P0-P1 tests on PR, full suite nightly.

**Implementation**:

```yaml
# .github/workflows/ci.yml
name: CI Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # 2 AM daily (full suite)

jobs:
  test-pr:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run P0-P1 tests only (fast feedback)
        run: pnpm test:e2e --grep "@P0|@P1"

  test-nightly:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run full test suite
        run: pnpm test:e2e
      - name: Run burn-in (10 iterations for flaky detection)
        run: pnpm test:e2e:burn-in --repeat-each=10
```

**Effort**: 4 hours
**Impact**: PR feedback <5 min (was 15-20 min)

---

## Test Execution Strategy

### CI/CD Pipeline Structure

```
┌─────────────────────────────────────────────────────────────┐
│ COMMIT TO BRANCH                                            │
└───────────────┬─────────────────────────────────────────────┘
                │
                v
┌─────────────────────────────────────────────────────────────┐
│ PRE-COMMIT HOOKS                                            │
│ • Type check (pnpm type-check)                              │
│ • Lint (pnpm lint)                                          │
│ • Unit tests (pnpm test:unit)                               │
│ Duration: <30 seconds                                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                v
┌─────────────────────────────────────────────────────────────┐
│ PULL REQUEST → CI (GitHub Actions)                          │
│ • Unit tests (all 28 APIs)                                  │
│ • Integration tests (RLS, API routes)                       │
│ • E2E tests (P0-P1 only, ~30 tests)                         │
│ • Type check, lint, build verification                      │
│ Duration: <5 minutes                                        │
└───────────────┬─────────────────────────────────────────────┘
                │
                v
┌─────────────────────────────────────────────────────────────┐
│ MERGE TO MAIN → Deployment Pipeline                         │
│ • Deploy to staging (Vercel preview)                        │
│ • Full E2E test suite against staging (100+ tests)          │
│ • Smoke tests (critical paths)                              │
│ Duration: ~15 minutes                                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                v (if all pass)
┌─────────────────────────────────────────────────────────────┐
│ DEPLOY TO PRODUCTION                                        │
│ • Production smoke tests                                    │
│ • Monitor uptime, error rates                               │
└─────────────────────────────────────────────────────────────┘

NIGHTLY (2 AM):
┌─────────────────────────────────────────────────────────────┐
│ NIGHTLY BUILD                                               │
│ • Full E2E test suite (all 100+ tests)                      │
│ • Burn-in tests (10 iterations for flaky detection)         │
│ • Performance tests (LP genealogy, API response times)      │
│ • Security scan (OWASP ZAP, Snyk)                           │
│ Duration: ~60 minutes                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Testability Risks and Mitigations

### Risk 1: LP Genealogy Query Performance Degradation

**Risk**: Recursive CTE queries degrade to >1 min with deep genealogy trees (10+ levels).

**Likelihood**: Medium (depends on customer usage patterns)
**Impact**: High (traceability is core feature, FDA compliance requirement)

**Mitigation**:
1. **Performance test in CI**: 100+ LP tree query must complete in <1 min (P0 test)
2. **Monitoring**: Log query execution times, alert if p95 >50s
3. **Fallback plan**: Migrate to Closure Table pattern if CTE performance degrades

**Test Coverage**:
- Integration test: 100 LP tree (10 levels deep)
- Load test: 1000 LP tree (stress test)

---

### Risk 2: RLS Policy Gaps (Cross-Org Data Leaks)

**Risk**: Missing RLS policy on new table allows cross-org data access.

**Likelihood**: Medium (40+ tables, easy to forget on new migrations)
**Impact**: Critical (security breach, GDPR violation)

**Mitigation**:
1. **RLS validation test suite**: Auto-discover all business tables, verify RLS policy exists
2. **Pre-commit hook**: Schema diff detects new table without RLS → block commit
3. **CI/CD gate**: RLS isolation tests must pass for all tables

**Test Coverage**:
- Integration test: RLS isolation for all 40+ business tables
- Security NFR test: Cross-org access attempts fail

---

### Risk 3: BOM Snapshot Mutation (Immutability Violation)

**Risk**: Code change allows retroactive BOM edits to affect existing WOs.

**Likelihood**: Low (good architecture, but regression possible)
**Impact**: High (production orders use wrong materials, safety risk)

**Mitigation**:
1. **Integration test**: Verify BOM edit doesn't change wo_materials snapshot
2. **Database constraint**: Foreign key wo_materials.bom_id references immutable snapshot

**Test Coverage**:
- Integration test: BOM immutability validation
- E2E test: Edit active BOM, verify WO unaffected

---

### Risk 4: PWA Offline Sync Conflicts (Data Loss)

**Risk**: Optimistic sync conflict resolution loses user data.

**Likelihood**: Medium (multi-user warehouse environment)
**Impact**: Medium (user frustration, need to re-enter data)

**Mitigation**:
1. **E2E test**: Simulate concurrent offline edits, verify conflict resolution
2. **User notification**: Losing user sees clear message about conflict
3. **Conflict log**: Audit trail of all conflicts (troubleshooting)

**Test Coverage**:
- E2E test: Offline sync conflict (timestamp wins)
- E2E test: Pessimistic queue retry on network failure

---

## Test Documentation Standards

### Test ID Format

All tests must follow this ID convention:

```
{EPIC}.{STORY}-{LEVEL}-{SEQ}
```

**Examples**:
- `0.1-UNIT-001` - Epic 0, Story 1, Unit test #1
- `0.3-INT-005` - Epic 0, Story 3, Integration test #5
- `1.2-E2E-010` - Epic 1, Story 2, E2E test #10

### Test Priority Annotations

All tests must have priority annotation:

```typescript
test('PO-001: should create purchase order @P0', async ({ page }) => {
  // Test ID: PO-001 (maps to PRD requirement)
  // Priority: P0 (critical path - revenue blocking)
});

test('BOM-015: should sort BOM items by material code @P2', async ({ page }) => {
  // Test ID: BOM-015
  // Priority: P2 (nice-to-have, not blocking)
});
```

**Priority Definitions**:
- **P0**: Critical user workflows (auth, order creation, production execution) - MUST run on every PR
- **P1**: Core business logic (BOM versioning, LP genealogy, RLS isolation) - Run on merge to main
- **P2**: Secondary features (filters, sorting, reports) - Run nightly
- **P3**: Edge cases (error states, validation) - Run weekly

---

## Quality Gates for Epic 0 Completion

Before moving to Phase 4 (Implementation), the following test infrastructure must be in place:

### Gate 1: Test Infrastructure ✅

- [ ] Fixture architecture implemented (auto-cleanup for PO, WO, LP, ASN)
- [ ] Network-first pattern applied to all critical flows (login, PO list, WO list)
- [ ] All hard waits (`waitForTimeout`) removed from test suite
- [ ] Test suite runs successfully 10 consecutive times in CI (burn-in validation)

### Gate 2: NFR Test Coverage ✅

- [ ] RLS isolation tests for all 40+ business tables (100% coverage)
- [ ] Performance test for LP genealogy (100+ LP tree <1 min)
- [ ] Security test for unauthenticated access (all protected routes)
- [ ] Offline sync test (pessimistic queue + optimistic conflict)

### Gate 3: Test Quality Score ✅

- [ ] TEA test-review score >80/100 (currently 58/100)
- [ ] Zero hard waits in test suite
- [ ] 80%+ data-testid coverage for interactive elements
- [ ] All E2E tests have test IDs and priority annotations

### Gate 4: CI/CD Pipeline ✅

- [ ] Selective test execution configured (P0-P1 on PR, full suite nightly)
- [ ] Burn-in job configured (10 iterations for flaky detection)
- [ ] Performance monitoring integrated (query execution times logged)
- [ ] Security scan integrated (OWASP ZAP or Snyk)

---

## Appendix: Test Coverage Matrix

### Module Test Coverage (Current vs Target)

| Module | Unit Tests | Integration Tests | E2E Tests | Current | Target |
|--------|-----------|------------------|-----------|---------|--------|
| **Planning** | PurchaseOrdersAPI (✅), TransferOrdersAPI (✅), WorkOrdersAPI (✅) | API routes (⚠️ 50%), RLS (❌) | PO (✅), TO (✅), WO (⚠️ 40%) | 70% | 95% |
| **Production** | WorkOrdersAPI (✅), ConsumeAPI (✅), YieldAPI (✅) | WO creation + snapshot (✅), Consume logic (⚠️) | WO execution (⚠️ 40%), Yield (❌) | 65% | 95% |
| **Technical** | ProductsAPI (✅), BomsAPI (✅), RoutingsAPI (✅) | BOM versioning (✅), BOM immutability (❌) | BOM versioning (✅), Products (⚠️ 50%) | 75% | 95% |
| **Warehouse** | ASNsAPI (✅), LicensePlatesAPI (✅), PalletsAPI (✅) | LP genealogy (❌), Stock moves (⚠️) | ASN (✅), GRN (⚠️), LP (✅) | 70% | 95% |
| **Scanner** | N/A (UI-heavy) | Offline sync (❌) | Scanner flows (⚠️ 30%) | 30% | 85% |
| **Settings** | WarehousesAPI (✅), SuppliersAPI (✅), UsersAPI (✅) | RLS (❌), Feature flags (❌) | Settings pages (⚠️ 50%) | 60% | 90% |
| **Security** | AuthAPI (⚠️ 50%) | RLS isolation (❌), JWT validation (❌) | Auth (✅), RBAC (❌) | 50% | 100% |

**Legend**:
- ✅ Implemented and passing
- ⚠️ Partial coverage
- ❌ Not implemented (gap)

**Priority**: Close all ❌ gaps during Epic 0 (7 weeks)

---

## Next Steps

### Immediate Actions (Epic 0, Weeks 1-4)

1. **Week 1-2**: Implement fixture architecture (auto-cleanup)
2. **Week 3**: Apply network-first pattern (remove all hard waits)
3. **Week 4**: Add RLS isolation tests + selective test execution

### Phase 4 Preparation

1. Review this document before each epic planning session
2. Use test-design workflow (epic-level mode) for each epic
3. Maintain test coverage >90% for all new code

### Continuous Improvement

1. Run TEA test-review after each epic completion
2. Update test infrastructure as needed
3. Monitor test execution times, optimize slow tests

---

**Prepared by**: TEA (Test Architect Agent)
**Workflow**: `testarch-test-design` v4.0 (System-Level Mode)
**Next Workflow**: Execute `testarch-test-design` (epic-level mode) for Epic 0 → Epic 1 → Epic 2

**Questions?** Review the knowledge fragments in `.bmad/bmm/testarch/knowledge/` for detailed implementation guidance.
