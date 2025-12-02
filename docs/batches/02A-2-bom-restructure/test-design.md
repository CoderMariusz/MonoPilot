# Test Design: Batch 02A-2 - BOM & Routing Restructure

**Date:** 2025-11-30
**Status:** Ready for Implementation
**Phase:** Implementation (Epic-Level, Phase 4)

---

## Executive Summary

**Scope:** Full test design for Batch 02A-2 (6 stories, 19 story points)

**Risk Summary:**
- Total risks identified: 8
- High-priority risks (≥6): 3
- Critical categories: TECH, SEC, DATA

**Coverage Summary:**
- P0 scenarios: 12 (24 hours)
- P1 scenarios: 18 (18 hours)
- P2 scenarios: 25 (12.5 hours)
- **Total effort**: 54.5 hours (~7 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation |
|---------|----------|-------------|------|--------|-------|-----------|
| R-001 | TECH | Breaking migration - DROP tables | 3 | 3 | 9 | Test in dev only, validate before migrate, E2E tests |
| R-002 | DATA | Cascade delete operations on routing delete | 2 | 3 | 6 | FK constraints ON DELETE CASCADE, unit tests verify |
| R-003 | SEC | org_id isolation not enforced service layer | 2 | 3 | 6 | Service validates org_id, RLS policies, unit tests |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Prob | Impact | Score |
|---------|----------|-------------|------|--------|-------|
| R-004 | TECH | Sequence uniqueness complex logic | 2 | 2 | 4 |
| R-005 | PERF | N+1 query on eager loading operations | 2 | 2 | 4 |
| R-006 | BUS | Breaking change affects Epic 4 features | 2 | 2 | 4 |

---

## Test Coverage Plan

### P0 (Critical) - 100% pass required

- Migration: DROP/CREATE schema validation (2 tests)
- Routing CRUD endpoints (5 tests)
- Operation cascade delete (3 tests)
- org_id isolation (2 tests)

**Total: 12 tests, 24 hours**

### P1 (High) - ≥95% pass required

- Sequence uniqueness (3 tests)
- labor_cost_per_hour validation (2 tests)
- Routing in-use check (2 tests)
- RoutingService methods (5 tests)
- BOM/Routing integration (3 tests)
- Zod schemas (3 tests)

**Total: 18 tests, 18 hours**

### P2 (Medium) - ≥90% pass required

- Optional fields handling (6 tests)
- Error codes & messages (8 tests)
- Performance benchmarks (1 test)
- TypeScript types (2 tests)
- Database constraints (8 tests)

**Total: 25 tests, 12.5 hours**

---

## Quality Gate Criteria

✅ **Must Pass Before Deployment:**
- All P0 tests: 100%
- P1 tests: ≥95%
- High-risk mitigations: 100% (R-001, R-002, R-003)
- Security tests: 100%
- Data integrity tests: 100%

---

## Test Framework Setup

**Framework:** Playwright + TypeScript
**Location:** `tests/e2e/` and `tests/support/`
**Environment:** `.env.test` with Supabase credentials

### Test Data Fixtures

```typescript
// tests/support/fixtures/factories/routing-factory.ts
class RoutingFactory {
  async createRouting(overrides = {}) { ... }
  async cleanup() { ... }
}

// tests/support/fixtures/factories/operation-factory.ts
class OperationFactory {
  async createOperation(routingId, overrides = {}) { ... }
  async cleanup() { ... }
}
```

### Required .env.test Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TEST_ORG_ID=...
BASE_URL=http://localhost:5000
```

---

## Test Execution Order

### Smoke Tests (<5 min)
1. Migration creates tables
2. RoutingService instantiates
3. API endpoints respond

### P0 Tests (<10 min)
1. DROP CASCADE removes old tables
2. New schema structure correct
3. All CRUD endpoints functional
4. Cascade delete works
5. org_id isolation enforced

### P1 Tests (<30 min)
1. Sequence uniqueness
2. labor_cost precision
3. In-use validation
4. Service layer methods
5. Zod validation

### P2/P3 Tests (<60 min)
1. Edge cases (nulls, defaults)
2. Error handling
3. Performance benchmarks
4. Type safety

---

## Approval Checklist

- [ ] Risk assessment reviewed
- [ ] Test scenarios approved
- [ ] Resource estimates accepted
- [ ] Quality gates defined
- [ ] Test data setup ready
- [ ] Framework verified (Playwright configured)
- [ ] Ready for implementation sprint

---

**Generated:** 2025-11-30
**Workflow:** `.bmad/bmm/testarch/test-design`
**Status:** Draft → Ready for Review
