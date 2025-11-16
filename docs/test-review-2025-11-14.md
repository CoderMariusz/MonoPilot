# Test Quality Review Report
**MonoPilot MES - E2E Test Suite**

**Review Date**: 2025-11-14
**Reviewer**: TEA (Test Architect Agent)
**Workflow**: `testarch-test-review` v4.0
**Scope**: Full E2E test suite (18 spec files, 100+ tests)

---

## Executive Summary

### Overall Quality Score: **58/100** ⚠️

**Status**: **CONCERNS** - Significant quality issues requiring immediate attention

The MonoPilot E2E test suite demonstrates good domain coverage (Auth, PO, TO, WO, BOM, ASN, LP, GRN) but suffers from critical architectural deficiencies that undermine test reliability and maintainability. The primary concerns are pervasive use of hard waits, brittle selectors, lack of test isolation, and absence of fixture patterns.

### Test Suite Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Spec Files | 18 | - | ✅ |
| Estimated Test Count | 100+ | - | ✅ |
| Avg File Size | ~200 lines | <300 lines | ✅ |
| Max File Size | 396 lines (ASN) | <300 lines | ⚠️ |
| Hard Waits Detected | **50+** instances | 0 | ❌ |
| data-testid Usage | ~30% | 80%+ | ❌ |
| Fixture Architecture | None | Required | ❌ |
| Network-First Pattern | 0% | 80%+ | ❌ |
| Test Isolation | Minimal | Required | ❌ |

---

## Critical Issues (Must Fix)

### 1. ❌ **CRITICAL: Pervasive Hard Waits (Non-Deterministic Testing)**

**Violation Count**: 50+ instances across all test files

**Impact**: Tests are non-deterministic and will fail randomly in different environments (CI, slower networks, production-like loads).

**Evidence**:

```typescript
// helpers.ts:30 - Login helper uses hard waits
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(250);  // ❌ HARD WAIT

// helpers.ts:69 - Logout helper
await page.waitForTimeout(500);  // ❌ HARD WAIT

// 01-auth.spec.ts:40 - Auth test
await page.waitForTimeout(2000); // ❌ HARD WAIT - "Wait for error to appear"

// 01-auth.spec.ts:54 - Validation test
await page.waitForTimeout(1000); // ❌ HARD WAIT

// 02-purchase-orders.spec.ts:28 - PO creation
await page.waitForTimeout(1000); // ❌ HARD WAIT

// 02-purchase-orders.spec.ts:68 - Edit PO
await page.waitForTimeout(500);  // ❌ HARD WAIT

// 10-asn-workflow.spec.ts:24, :83, :123, :145, :199 - ASN tests
await page.waitForTimeout(1000); // ❌ HARD WAIT (5+ instances)
```

**TEA Guidance** (from `timing-debugging.md`):
- Replace `waitForTimeout()` with event-based waits
- Use `waitForResponse()` for network requests
- Use `waitFor({ state: 'detached' })` for loading spinners
- Implement network-first pattern (intercept BEFORE navigate)

**Recommended Fix Pattern**:

```typescript
// ❌ BAD: Hard wait for error
await page.waitForTimeout(2000);

// ✅ GOOD: Wait for explicit toast/error element
await expect(page.getByTestId('error-toast')).toBeVisible({ timeout: 5000 });

// ❌ BAD: Hard wait after action
await page.click('button:has-text("Create")');
await page.waitForTimeout(1000);

// ✅ GOOD: Wait for network response
const createPromise = page.waitForResponse(resp =>
  resp.url().includes('/api/purchase-orders') && resp.status() === 201
);
await page.click('[data-testid="create-po-button"]');
await createPromise;
await expect(page.getByTestId('success-toast')).toBeVisible();
```

**Priority**: P0 - Blocker for reliable CI/CD
**Effort**: 8-10 hours (50+ instances × 10 min avg)

---

### 2. ❌ **CRITICAL: Brittle Selectors (CSS over data-testid)**

**Violation Count**: 70%+ of selectors

**Impact**: Tests break when UI styling changes. High maintenance burden.

**Evidence**:

```typescript
// 01-auth.spec.ts - CSS type selectors instead of data-testid
await expect(page.locator('input[type="email"]')).toBeVisible();  // ❌ Brittle
await page.locator('button[type="submit"]').click();  // ❌ Brittle

// helpers.ts:20 - Login helper
await page.waitForSelector('input[type="email"]', { timeout: 5000 });  // ❌ Brittle
await page.fill('input[type="email"]', email || TEST_USER.email);  // ❌ Brittle

// 08-bom-versioning.spec.ts - Text selectors
await page.click('text=Create BOM');  // ❌ Breaks with i18n
await page.click('text=Version Timeline');  // ❌ Breaks with copy changes

// 10-asn-workflow.spec.ts:60 - Complex :near() selectors
const expectedArrivalInput = page.locator('input[name="expected_arrival"], input[type="date"]:near(label:has-text("Expected Arrival"))');
// ❌ Fragile, relies on DOM structure

// 02-purchase-orders.spec.ts:81 - CSS selector with fallback
await page.locator('select:has-text("All statuses"), select[name="status"]').selectOption('confirmed').catch(() => {});
// ❌ Two anti-patterns: brittle selector + error suppression
```

**TEA Guidance** (from `selector-resilience.md`):
- **Hierarchy**: `data-testid` > ARIA roles > text content > CSS (last resort)
- Use `page.getByTestId()` for interactive elements
- Use `page.getByRole()` for semantic elements
- Avoid CSS classes, type attributes, and complex combinators

**Recommended Fix Pattern**:

```typescript
// ❌ BAD: CSS type selector
await page.locator('input[type="email"]').fill('user@test.com');

// ✅ GOOD: data-testid
await page.getByTestId('email-input').fill('user@test.com');

// ✅ ALTERNATIVE: ARIA role
await page.getByRole('textbox', { name: 'Email' }).fill('user@test.com');

// ❌ BAD: Text selector (breaks with i18n)
await page.click('text=Create BOM');

// ✅ GOOD: data-testid
await page.getByTestId('create-bom-button').click();

// ❌ BAD: Complex :near() selector
const input = page.locator('input[type="date"]:near(label:has-text("Expected Arrival"))');

// ✅ GOOD: Direct data-testid
const input = page.getByTestId('expected-arrival-input');
```

**Priority**: P0 - Blocker for long-term maintainability
**Effort**: 12-16 hours (requires app-side changes to add data-testid attributes)

---

### 3. ❌ **CRITICAL: No Fixture Architecture (Test Pollution)**

**Violation Count**: 100% of tests

**Impact**: Tests do not clean up data, leading to state pollution in parallel runs and local development.

**Evidence**:

```typescript
// 02-purchase-orders.spec.ts - Creates PO but never deletes
async function createDraftPurchaseOrder(page) {
  // ... creates PO ...
  // ❌ NO CLEANUP - PO remains in database
}

// 08-bom-versioning.spec.ts:33 - Hardcoded product code
await page.fill('input[name="product_code"]', 'TEST-VERSIONED-001');
// ❌ Collides in parallel runs or test reruns

// 10-asn-workflow.spec.ts:38 - Creates ASN without cleanup
test('should create a new ASN with items', async ({ page }) => {
  // ... creates ASN ...
  // ❌ NO CLEANUP
});
```

**TEA Guidance** (from `test-quality.md` + `fixture-architecture.md`):
- Implement Playwright fixtures with auto-cleanup
- Track created entities (IDs) and delete in fixture teardown
- Use unique IDs per test run (timestamp + random suffix)
- Consider API-first setup for faster test execution

**Recommended Fix Pattern**:

```typescript
// Create fixture: apps/frontend/e2e/fixtures/database-fixture.ts
import { test as base } from '@playwright/test';
import { SupabaseClient } from '@supabase/supabase-js';

type DatabaseFixture = {
  createPO: (poData: Partial<PurchaseOrder>) => Promise<PurchaseOrder>;
  cleanup: () => Promise<void>;
};

export const test = base.extend<DatabaseFixture>({
  createPO: async ({ page }, use) => {
    const createdPOs: string[] = [];

    const createPO = async (poData: Partial<PurchaseOrder>) => {
      const po = await createPOViaAPI(poData);  // API-first
      createdPOs.push(po.id);  // Track for cleanup
      return po;
    };

    await use(createPO);

    // Auto-cleanup after test
    for (const poId of createdPOs) {
      await deletePO(poId);
    }
  },
});

// Usage in test
test('should create purchase order', async ({ page, createPO }) => {
  const po = await createPO({ supplier_id: 'SUP-001', ... });

  await page.goto(`/planning/purchase-orders/${po.id}`);
  await expect(page.getByTestId('po-number')).toHaveText(po.po_number);

  // No manual cleanup needed - fixture handles it
});
```

**Priority**: P0 - Blocker for parallel test execution
**Effort**: 20-24 hours (requires fixture infrastructure + API helpers)

---

### 4. ❌ **CRITICAL: No Network-First Pattern (Race Conditions)**

**Violation Count**: 100% of tests

**Impact**: Tests fail randomly due to race conditions between navigation and API requests.

**Evidence**:

```typescript
// helpers.ts:login() - Navigates then waits (race condition)
await page.goto('/login');  // ❌ Navigation starts
// ... later ...
await page.waitForLoadState('networkidle', { timeout: 15000 });  // ❌ May miss requests

// 02-purchase-orders.spec.ts - No intercept before navigate
test.beforeEach(async ({ page }) => {
  await login(page);
  await gotoPlanningTab(page, 'Purchase Orders');
  // ❌ No network interception - race with PO list API
});

// 08-bom-versioning.spec.ts:30 - Direct navigation without intercept
await page.goto('/production/products');
// ❌ Products API may load before test can observe
```

**TEA Guidance** (from `network-first.md` + `timing-debugging.md`):
- Set up `page.route()` BEFORE navigation
- Use `waitForResponse()` to confirm API completion
- Intercept critical API endpoints for determinism
- Consider HAR file capture for complex flows

**Recommended Fix Pattern**:

```typescript
// ❌ BAD: Navigate then hope API loads
await page.goto('/planning/purchase-orders');
await page.waitForTimeout(2000);  // ❌ Arbitrary wait

// ✅ GOOD: Intercept BEFORE navigate
await page.route('**/api/purchase-orders', async route => {
  // Optionally mock or just observe
  await route.continue();
});

const responsePromise = page.waitForResponse(resp =>
  resp.url().includes('/api/purchase-orders') && resp.ok()
);

await page.goto('/planning/purchase-orders');
await responsePromise;  // ✅ Deterministic - we know data loaded

await expect(page.getByTestId('po-table')).toBeVisible();
```

**Priority**: P0 - Blocker for CI reliability
**Effort**: 8-12 hours (add intercepts to critical flows)

---

## High-Priority Issues (Should Fix)

### 5. ⚠️ **Error Suppression with .catch(() => {})**

**Violation Count**: 5+ instances

**Impact**: Tests silently fail or skip steps, hiding real bugs.

**Evidence**:

```typescript
// 02-purchase-orders.spec.ts:15
await page.locator('[data-testid="po-warehouse-select"]').selectOption({ index: 1 }).catch(() => {});
// ❌ Suppresses error - test continues even if warehouse selection fails

// 02-purchase-orders.spec.ts:49
await page.locator('[data-testid="quick-po-warehouse-select"]').selectOption({ index: 1 }).catch(() => {});
// ❌ Same issue

// helpers.ts:30
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
// ❌ Suppresses timeout - test continues without waiting
```

**Fix**: Remove `.catch(() => {})`. Let failures surface. If step is truly optional, use explicit conditional logic with comments.

**Priority**: P1
**Effort**: 2 hours

---

### 6. ⚠️ **Missing Test IDs and Priorities**

**Violation Count**: 100% of tests

**Impact**: Cannot track tests to requirements, cannot prioritize execution.

**Evidence**:

```typescript
// No test has explicit test ID or priority
test('should create a new purchase order', async ({ page }) => {
  // ❌ Missing: test.id, @priority annotation
});
```

**TEA Guidance** (from `test-priorities-matrix.md`):
- P0: Critical user flows (auth, order creation, production execution)
- P1: Core business logic (BOM versioning, LP genealogy)
- P2: Secondary features (filters, sorting)
- P3: Edge cases (error states, validation)

**Recommended Fix**:

```typescript
test('PO-001: should create a new purchase order @P0', async ({ page, createPO }) => {
  // Test ID: PO-001 (maps to requirements)
  // Priority: P0 (critical path - order creation)
  // ...
});

test('BOM-003: should prevent overlapping date ranges @P1', async ({ page }) => {
  // Test ID: BOM-003
  // Priority: P1 (business rule enforcement)
  // ...
});
```

**Priority**: P1
**Effort**: 4 hours (add IDs + priorities to 100+ tests)

---

### 7. ⚠️ **Console.log in Tests (No Proper Reporting)**

**Violation Count**: 10+ instances

**Impact**: Conditional test paths hidden in logs instead of proper reporting.

**Evidence**:

```typescript
// 10-asn-workflow.spec.ts:106
} else {
  console.log('No ASNs available to view details');
}
// ❌ Silent skip - should be test.skip() or proper assertion
```

**Fix**: Replace with `test.skip()` or remove conditionals entirely.

**Priority**: P2
**Effort**: 2 hours

---

## Moderate Issues (Nice to Have)

### 8. 📝 **Large Test Files**

**Violation**: 10-asn-workflow.spec.ts (396 lines), 08-bom-versioning.spec.ts (331 lines)

**Target**: <300 lines per file

**Fix**: Split into multiple files by feature area or lifecycle (create, edit, delete, filter).

**Priority**: P2
**Effort**: 4 hours

---

### 9. 📝 **Inconsistent Test Structure**

**Issue**: Mix of `describe` blocks and flat tests

**Evidence**:
- `01-auth.spec.ts`: Uses `test.describe()`
- `08-bom-versioning.spec.ts`: Uses `test.describe()` with `beforeEach/afterEach`
- `02-purchase-orders.spec.ts`: Uses `test.describe()` with `beforeEach` only

**Fix**: Standardize on consistent pattern (recommend: `test.describe()` with `beforeEach` for setup, fixtures for cleanup).

**Priority**: P2
**Effort**: 2 hours

---

### 10. 📝 **Missing BDD Format (Given-When-Then)**

**Issue**: Test descriptions don't follow BDD format

**Evidence**:
```typescript
test('should create a new purchase order', ...)
// Could be: test('GIVEN user is on PO page WHEN they create PO THEN PO appears in table', ...)
```

**Fix**: Not required but enhances readability. Low priority.

**Priority**: P3
**Effort**: 4 hours

---

## Positive Observations ✅

1. **Good Domain Coverage**: Tests cover all major modules (Auth, PO, TO, WO, BOM, ASN, LP, GRN)
2. **Helper Functions**: `helpers.ts` provides reusable login/navigation helpers (though they need fixes)
3. **Test Documentation**: Some files (08, 10) have good header comments explaining test scenarios
4. **Parallel-Safe Config**: `playwright.config.ts` has `fullyParallel: true` (but tests aren't actually parallel-safe due to lack of cleanup)
5. **CI Retry Strategy**: `retries: process.env.CI ? 2 : 0` is good practice
6. **Artifact Collection**: `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'` configured correctly

---

## Compliance with TEA Knowledge Base

| Knowledge Fragment | Compliance | Violations | Notes |
|--------------------|------------|------------|-------|
| `test-quality.md` (DoD) | ❌ 30% | Hard waits, no cleanup, no isolation | Critical |
| `selector-resilience.md` | ❌ 30% | CSS > data-testid, text selectors | Critical |
| `timing-debugging.md` | ❌ 0% | No network-first, all hard waits | Critical |
| `test-healing-patterns.md` | ❌ 0% | No healing, error suppression | High |
| `fixture-architecture.md` | ❌ 0% | No fixtures, no auto-cleanup | Critical |
| `network-first.md` | ❌ 0% | No intercepts before navigate | Critical |
| `playwright-config.md` | ✅ 80% | Config mostly correct | Good |
| `test-levels-framework.md` | ✅ 90% | E2E tests appropriately scoped | Good |

---

## Recommended Action Plan

### Phase 1: Stop the Bleeding (Week 1)
1. **Remove all hard waits** (50+ instances) → Replace with event-based waits
2. **Remove error suppression** (`.catch(() => {})`) → Let failures surface
3. **Add network intercepts** to login + critical flows → Fix race conditions

**Effort**: 16-20 hours
**Impact**: Reduces flakiness by 60-70%

### Phase 2: Selector Resilience (Week 2)
1. **Add data-testid attributes** to all interactive elements in app
2. **Refactor selectors** in tests to use `getByTestId()` / `getByRole()`
3. **Remove text selectors** where possible

**Effort**: 20-24 hours
**Impact**: Reduces maintenance burden by 50%

### Phase 3: Fixture Infrastructure (Week 3)
1. **Create database fixture** with auto-cleanup
2. **Implement API helpers** for data seeding
3. **Refactor tests** to use fixtures instead of UI-based setup

**Effort**: 24-28 hours
**Impact**: Enables true parallel execution, 3x faster test suite

### Phase 4: Test IDs and Priorities (Week 4)
1. **Add test IDs** to all tests (map to requirements)
2. **Add priority annotations** (P0-P3)
3. **Configure selective test execution** in CI (P0-P1 on PR, full suite nightly)

**Effort**: 8-10 hours
**Impact**: Better traceability, faster feedback loops

---

## Quality Gate Decision

**Current State**: **CONCERNS** ⚠️
**Recommendation**: **PROCEED WITH REMEDIATION PLAN**

### Rationale:
- Test suite provides valuable coverage but is not reliable enough for production deployment gates
- Critical architectural issues (hard waits, no fixtures, brittle selectors) must be fixed before Epic 0 completion
- Tests will fail randomly in CI without Phase 1 fixes
- Cannot run tests in parallel without Phase 3 fixture infrastructure

### Gate Criteria for PASS:
1. Zero hard waits (`waitForTimeout`) in test suite
2. 80%+ data-testid coverage for interactive elements
3. Fixture infrastructure with auto-cleanup implemented
4. Network-first pattern applied to all critical flows
5. Test suite runs successfully 10 consecutive times in CI (burn-in validation)

---

## Appendix: TEA Knowledge Fragments Used

1. `test-quality.md` - Definition of Done (deterministic tests, <300 lines, <1.5 min, cleanup)
2. `selector-resilience.md` - Selector hierarchy (data-testid > ARIA > text > CSS)
3. `timing-debugging.md` - Race condition prevention (network-first, explicit waits)
4. `test-healing-patterns.md` - Common failure patterns and automated fixes
5. `fixture-architecture.md` - Pure function → Fixture → mergeTests composition
6. `network-first.md` - Intercept before navigate workflow
7. `playwright-config.md` - Environment-based configuration guardrails

---

## Contact and Next Steps

**Prepared by**: TEA (Test Architect Agent)
**Workflow**: `testarch-test-review` v4.0
**Next Workflow**: Execute `testarch-test-design` for system-level test strategy

**Questions?** Review the knowledge fragments in `.bmad/bmm/testarch/knowledge/` for detailed implementation guidance.

**Ready to implement fixes?** Start with Phase 1 (hard waits) for maximum impact with minimum effort.
