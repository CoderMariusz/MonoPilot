# Test Design: Batch 04B-2 & 04C-1 - Output Registration & Consumption Traceability

**Date:** 2025-11-29
**Author:** Mariusz
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Stories 4.12, 4.12a, 4.12b, 4.18, 4.19

**Stories Covered:**
- 4.12: Output Registration (Desktop)
- 4.12a: Output-Driven Sequential Consumption
- 4.12b: Over-Production Handling
- 4.18: LP Updates After Consumption
- 4.19: Genealogy Recording

**Risk Summary:**
- Total risks identified: 12
- High-priority risks (≥6): 4
- Critical categories: DATA, SEC, BUS

**Coverage Summary:**
- P0 scenarios: 15 (30 hours)
- P1 scenarios: 22 (22 hours)
- P2/P3 scenarios: 18 (9 hours)
- **Total effort**: 61 hours (~8 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Genealogy not created for output → traceability broken | 2 | 3 | 6 | Transaction atomicity, comprehensive E2E tests | QA | Sprint 4 |
| R-002 | DATA | LP quantity mismatch after consumption → inventory inaccurate | 3 | 3 | 9 | Unit tests for qty calculations, reconciliation check | DEV | Sprint 4 |
| R-003 | SEC | Consumption reversal without proper authorization | 2 | 3 | 6 | Role-based tests (Manager/Admin only), API guard | QA | Sprint 4 |
| R-004 | BUS | Over-production without parent LP → incomplete genealogy | 3 | 2 | 6 | Mandatory parent LP selection, validation tests | QA | Sprint 4 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | TECH | Sequential allocation algorithm incorrect order | 2 | 2 | 4 | Unit tests for allocation sequence | DEV |
| R-006 | DATA | wo_consumption status not updated on reversal | 2 | 2 | 4 | Integration tests for reversal flow | QA |
| R-007 | PERF | Slow output registration with many reservations | 1 | 3 | 3 | Performance test for 50+ reservations | QA |
| R-008 | BUS | Output qty exceeds planned without warning | 2 | 2 | 4 | Over-consumption warning tests | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-009 | OPS | Output modal doesn't show allocation preview | 1 | 2 | 2 | Monitor |
| R-010 | BUS | QA status not recorded on output LP | 1 | 2 | 2 | Monitor |
| R-011 | TECH | By-product prompting not triggered | 1 | 1 | 1 | Monitor (Story 4.14) |
| R-012 | OPS | Activity log not created on reversal | 1 | 1 | 1 | Monitor |

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-----------|-----------|------------|-------|-------|
| AC-4.12.2: Output LP creation | E2E | R-001 | 2 | QA | Verify LP created with correct product, batch, expiry |
| AC-4.12.3: Auto consumption via 4.12a | API | R-002 | 3 | QA | Sequential allocation, qty updates |
| AC-4.12.4: Genealogy linking | API | R-001 | 3 | QA | Parent-child LP relationship |
| AC-4.18.2: LP qty update after consumption | API | R-002 | 2 | QA | current_qty decremented correctly |
| AC-4.18.3: LP status change to 'consumed' | API | R-002 | 2 | QA | When qty=0, status='consumed' |
| AC-4.10/Reversal: Manager-only authorization | API | R-003 | 3 | QA | 403 for Operator, 200 for Manager/Admin |

**Total P0**: 15 tests, 30 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-----------|-----------|------------|-------|-------|
| AC-4.12a.1: Sequential LP allocation algorithm | Unit | R-005 | 5 | DEV | Order by sequence_number |
| AC-4.12a.3: Partial LP consumption | API | R-005 | 3 | QA | LP not fully consumed, remaining available |
| AC-4.12a.4: Over-consumption detection | API | R-008 | 3 | QA | Warning shown, operator confirms |
| AC-4.12b.1: Over-production dialog | E2E | R-004 | 2 | QA | Dialog with reserved LPs list |
| AC-4.12b.2: Parent LP selection | API | R-004 | 3 | QA | Required for over-production |
| AC-4.19.5: Genealogy reversal marking | API | R-006 | 3 | QA | status='reversed', never deleted |
| AC-4.12.5: Progress tracking | API | - | 3 | QA | output_qty / planned_qty % |

**Total P1**: 22 tests, 22 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|-----------|-----------|------------|-------|-------|
| AC-4.12.6: QA status recording | API | R-010 | 2 | QA | qa_status on output LP |
| AC-4.12.1: Output modal fields | Component | R-009 | 3 | DEV | qty, qa_status, location, notes |
| AC-4.12a.6: consume_whole_lp enforcement | Unit | - | 4 | DEV | Story 4.9 integration |
| AC-4.12b.4: Over-production tracking in WO | API | - | 2 | QA | is_over_produced, over_production_qty |
| AC-4.12b.6: Over-production in output history | E2E | - | 2 | QA | Flag on each output |
| AC-4.19.7: Genealogy display trace | E2E | - | 2 | QA | Forward/backward trace UI |
| Activity logs creation | API | R-012 | 3 | QA | Audit trail |

**Total P2**: 18 tests, 9 hours

### P3 (Low) - Run on-demand

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|-----------|------------|-------|-------|
| Performance: 50+ reservations | Perf | 2 | QA | Response time <3s |
| AC-4.12b.7: Scrap % not over-production | API | 2 | QA | Within scrap % boundary |
| Concurrent output registration | Perf | 2 | QA | Race condition check |

**Total P3**: 6 tests, 3 hours

---

## Test Scenarios by Story

### Story 4.12: Output Registration Desktop

#### E2E Tests (Playwright)

```typescript
// tests/e2e/output-registration.spec.ts

test.describe('Story 4.12: Output Registration', () => {

  // AC-4.12.1: Output Registration Modal
  test('AC-4.12.1: Modal opens with correct fields for WO in progress', async ({ page }) => {
    // 1. Navigate to WO detail (in_progress status)
    // 2. Click "Register Output" button
    // 3. Verify modal shows: qty (required), qa_status, location, notes
    // 4. Verify planned/actual qty display
  })

  // AC-4.12.2: Output LP Creation
  test('AC-4.12.2: Output LP created with correct attributes', async ({ page }) => {
    // 1. Open output modal
    // 2. Enter qty=100, qa_status=passed
    // 3. Submit
    // 4. Verify LP created with: product from WO, batch=WO.wo_number, status=available
  })

  // AC-4.12.8: Error - qty <= 0
  test('AC-4.12.8: Validation error for qty <= 0', async ({ page }) => {
    // 1. Open modal
    // 2. Enter qty=0 or qty=-1
    // 3. Verify error "Output quantity must be > 0"
  })

  // AC-4.12.8: Error - WO not in progress
  test('AC-4.12.8: Cannot register output for WO not in progress', async ({ page }) => {
    // 1. Navigate to WO with status=planned
    // 2. Verify "Register Output" button disabled or hidden
  })
})
```

#### API Tests

```typescript
// tests/api/output-registration.test.ts

describe('POST /api/production/work-orders/:id/outputs', () => {

  // AC-4.12.7: Successful output registration
  it('should register output and return LP details', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 100, qa_status: 'passed' })

    expect(response.status).toBe(200)
    expect(response.body.data.output.lp_number).toMatch(/^LP-/)
    expect(response.body.data.output.quantity).toBe(100)
  })

  // AC-4.12.3: Auto consumption via 4.12a
  it('should create wo_consumption records automatically', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 100 })

    expect(response.body.data.consumptionRecords.length).toBeGreaterThan(0)
  })

  // AC-4.12.4: Genealogy linking
  it('should create genealogy records for consumed LPs', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 100 })

    expect(response.body.data.genealogyRecords).toBeGreaterThan(0)
  })
})
```

### Story 4.12a: Sequential Consumption

#### Unit Tests

```typescript
// tests/unit/output-registration-service.test.ts

describe('calculateConsumptionAllocation', () => {

  // AC-4.12a.1: Sequential allocation
  it('should allocate LPs in sequence order', async () => {
    const reservations = [
      { lp_id: 'LP-A', reserved_qty: 80, sequence_number: 1 },
      { lp_id: 'LP-B', reserved_qty: 40, sequence_number: 2 },
      { lp_id: 'LP-C', reserved_qty: 80, sequence_number: 3 },
    ]

    const result = await calculateConsumptionAllocation(woId, 70)

    expect(result.allocations[0].lpId).toBe('LP-A')
    expect(result.allocations[0].qtyToConsume).toBe(70)
  })

  // AC-4.12a.3: Partial LP consumption
  it('should handle partial LP consumption', async () => {
    const result = await calculateConsumptionAllocation(woId, 50)

    expect(result.allocations[0].qtyToConsume).toBe(50)
    expect(result.cumulativeAfter).toBe(50)
    expect(result.isOverConsumption).toBe(false)
  })

  // AC-4.12a.4: Over-consumption detection
  it('should detect over-consumption', async () => {
    // totalReserved = 200
    const result = await calculateConsumptionAllocation(woId, 250)

    expect(result.isOverConsumption).toBe(true)
    expect(result.remainingUnallocated).toBe(50)
  })

  // AC-4.12a.6: consume_whole_lp enforcement
  it('should consume entire LP when consume_whole_lp=true', async () => {
    // LP-A has current_qty=80, consume_whole_lp=true
    const result = await calculateConsumptionAllocation(woId, 50)

    // Should consume 80, not 50
    expect(result.allocations[0].qtyToConsume).toBe(80)
  })
})
```

### Story 4.12b: Over-Production Handling

#### E2E Tests

```typescript
// tests/e2e/over-production.spec.ts

test.describe('Story 4.12b: Over-Production Handling', () => {

  // AC-4.12b.1: Over-production dialog
  test('AC-4.12b.1: Shows material source selection dialog', async ({ page }) => {
    // 1. Register outputs until all reserved consumed
    // 2. Try to register another output
    // 3. Verify over-production dialog appears
    // 4. Verify all reserved LPs listed
  })

  // AC-4.12b.2: Parent LP selection required
  test('AC-4.12b.2: Cannot proceed without parent LP selection', async ({ page }) => {
    // 1. Trigger over-production dialog
    // 2. Try to confirm without selecting LP
    // 3. Verify error "Must select parent LP for over-production"
  })

  // AC-4.12b.4: Over-production tracking in WO
  test('AC-4.12b.4: WO shows over-production status', async ({ page }) => {
    // 1. Register over-production output
    // 2. Navigate to WO detail
    // 3. Verify is_over_produced indicator
    // 4. Verify over_production_qty shown
  })
})
```

#### API Tests

```typescript
// tests/api/over-production.test.ts

describe('Over-Production API', () => {

  // AC-4.12b.9: API with over-production params
  it('should accept over-production with parent LP', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({
        qty: 30,
        is_over_production: true,
        over_production_parent_lp_id: lpAId,
      })

    expect(response.status).toBe(200)
  })

  // AC-4.12b.9: Missing parent LP error
  it('should reject over-production without parent LP', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({
        qty: 30,
        is_over_production: true,
        // missing over_production_parent_lp_id
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('MISSING_PARENT_LP')
  })

  // AC-4.12b.10: Genealogy for over-production
  it('should create genealogy with is_over_production flag', async () => {
    await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({
        qty: 30,
        is_over_production: true,
        over_production_parent_lp_id: lpAId,
      })

    const genealogy = await getGenealogy(outputLpId)
    expect(genealogy.is_over_production).toBe(true)
    expect(genealogy.over_production_source).toBe('operator_selected')
  })
})
```

### Story 4.18: LP Updates After Consumption

#### API Tests

```typescript
// tests/api/lp-updates-consumption.test.ts

describe('Story 4.18: LP Updates After Consumption', () => {

  // AC-4.18.2: LP quantity update
  it('should decrement LP current_qty after consumption', async () => {
    const lpBefore = await getLp(lpId)
    expect(lpBefore.current_qty).toBe(80)

    await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 50 })

    const lpAfter = await getLp(lpId)
    expect(lpAfter.current_qty).toBe(30)
  })

  // AC-4.18.3: LP status change to consumed
  it('should set LP status to consumed when qty=0', async () => {
    await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 80 }) // Consume entire LP

    const lp = await getLp(lpId)
    expect(lp.status).toBe('consumed')
    expect(lp.consumed_by_wo_id).toBe(woId)
    expect(lp.consumed_at).toBeTruthy()
  })

  // AC-4.18.5: lp_movements record
  it('should create lp_movements record for consumption', async () => {
    await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 50 })

    const movements = await getMovements(lpId)
    const consumptionMove = movements.find(m => m.movement_type === 'consumption')

    expect(consumptionMove).toBeTruthy()
    expect(consumptionMove.qty_change).toBe(-50)
    expect(consumptionMove.wo_id).toBe(woId)
  })
})
```

### Story 4.19: Genealogy Recording

#### API Tests

```typescript
// tests/api/genealogy-recording.test.ts

describe('Story 4.19: Genealogy Recording', () => {

  // AC-4.19.2: Genealogy creation on consumption
  it('should create genealogy record linking parent LP to output LP', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/outputs`)
      .send({ qty: 100 })

    const outputLpId = response.body.data.output.lp_id
    const genealogy = await getGenealogyByChild(outputLpId)

    expect(genealogy.length).toBeGreaterThan(0)
    expect(genealogy[0].relationship_type).toBe('production')
    expect(genealogy[0].child_lp_id).toBe(outputLpId)
  })

  // AC-4.19.5: Genealogy reversal (never deleted)
  it('should mark genealogy as reversed, not delete', async () => {
    // 1. Create consumption with genealogy
    const output = await registerOutput(woId, 100)
    const genealogyBefore = await getGenealogyByChild(output.lp_id)

    // 2. Reverse consumption
    await reverseConsumption(genealogyBefore[0].consumption_id, 'Test reversal')

    // 3. Verify genealogy still exists but status=reversed
    const genealogyAfter = await getGenealogyByChild(output.lp_id)
    expect(genealogyAfter[0].status).toBe('reversed')
    expect(genealogyAfter[0].reversed_at).toBeTruthy()
    expect(genealogyAfter[0].reverse_reason).toBe('Test reversal')
  })

  // AC-4.19.6: Forward trace query
  it('should return all descendants for forward trace', async () => {
    const trace = await traceForward(parentLpId)

    expect(trace.length).toBeGreaterThan(0)
    expect(trace.every(t => t.parent_lp_id === parentLpId)).toBe(true)
  })

  // AC-4.19.6: Backward trace query
  it('should return all ancestors for backward trace', async () => {
    const trace = await traceBackward(outputLpId)

    expect(trace.length).toBeGreaterThan(0)
    expect(trace.every(t => t.child_lp_id === outputLpId)).toBe(true)
  })
})
```

### Consumption Reversal (Story 4.10 Integration)

#### API Tests

```typescript
// tests/api/consumption-reversal.test.ts

describe('Consumption Reversal', () => {

  // AC-4.10: Manager/Admin only
  it('should reject reversal from Operator role', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/consume/reverse`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ consumption_id: consumptionId, reason: 'Test' })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN')
  })

  it('should allow reversal from Manager role', async () => {
    const response = await request.post(`/api/production/work-orders/${woId}/consume/reverse`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ consumption_id: consumptionId, reason: 'Test reversal' })

    expect(response.status).toBe(200)
  })

  // Reversal restores LP qty
  it('should restore LP quantity after reversal', async () => {
    const lpBefore = await getLp(lpId)
    expect(lpBefore.current_qty).toBe(0)
    expect(lpBefore.status).toBe('consumed')

    await request.post(`/api/production/work-orders/${woId}/consume/reverse`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ consumption_id: consumptionId, reason: 'Test' })

    const lpAfter = await getLp(lpId)
    expect(lpAfter.current_qty).toBe(80)
    expect(lpAfter.status).toBe('reserved')
  })

  // Reversal marks genealogy as reversed
  it('should mark genealogy as reversed', async () => {
    await request.post(`/api/production/work-orders/${woId}/consume/reverse`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ consumption_id: consumptionId, reason: 'Error correction' })

    const genealogy = await getGenealogyByConsumption(consumptionId)
    expect(genealogy.status).toBe('reversed')
  })
})
```

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Output registration modal opens (30s)
- [ ] Output LP created successfully (1min)
- [ ] WO output_qty increments (30s)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] Output LP creation with correct attributes (E2E)
- [ ] Sequential consumption creates wo_consumption records (API)
- [ ] Genealogy records created (API)
- [ ] LP qty decremented after consumption (API)
- [ ] LP status changes to 'consumed' when qty=0 (API)
- [ ] Reversal blocked for non-Manager roles (API)

**Total**: 15 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] Sequential allocation algorithm order (Unit)
- [ ] Partial LP consumption tracking (API)
- [ ] Over-consumption warning displayed (API)
- [ ] Over-production dialog with LP list (E2E)
- [ ] Genealogy reversal marking (API)
- [ ] Progress tracking calculation (API)

**Total**: 22 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] QA status recording on output LP (API)
- [ ] consume_whole_lp enforcement (Unit)
- [ ] Over-production tracking in WO detail (API)
- [ ] Forward/backward genealogy trace (E2E)
- [ ] Activity logs created (API)
- [ ] Performance: 50+ reservations (Perf)

**Total**: 24 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 15 | 2.0 | 30 | Critical paths, security |
| P1 | 22 | 1.0 | 22 | Standard coverage |
| P2 | 18 | 0.5 | 9 | Simple scenarios |
| P3 | 6 | 0.5 | 3 | Performance/exploratory |
| **Total** | **61** | **-** | **64** | **~8 days** |

### Prerequisites

**Test Data:**
- `workOrderFactory` - Creates WO with product, BOM, reservations
- `licensePlateFactory` - Creates LP with qty, status, location
- `reservationFactory` - Creates wo_material_reservations records
- `userFactory` - Creates users with roles (Operator, Manager, Admin)

**Tooling:**
- Playwright for E2E tests
- Vitest for unit/API tests
- Supabase test client with service role key
- JWT token generation for role-based tests

**Environment:**
- Test database with isolated org
- Auth tokens for each role
- Cleanup after each test suite

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete

### Coverage Targets

- **Critical paths** (output registration): ≥80%
- **Security scenarios** (role-based): 100%
- **Business logic** (consumption algorithm): ≥70%
- **Edge cases** (over-production): ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] Role-based authorization tests pass 100%
- [ ] Genealogy traceability tests pass 100%

---

## Mitigation Plans

### R-001: Genealogy not created → traceability broken (Score: 6)

**Mitigation Strategy:** Implement transaction atomicity - genealogy creation must be in same transaction as consumption. Add comprehensive E2E tests that verify genealogy exists after every output registration.

**Owner:** QA
**Timeline:** Sprint 4
**Status:** Planned
**Verification:** E2E test verifies genealogy count > 0 after output

### R-002: LP quantity mismatch (Score: 9)

**Mitigation Strategy:** Unit tests for qty calculations. Integration tests verify LP.current_qty matches SUM(wo_consumption.consumed_qty). Add reconciliation check in service.

**Owner:** DEV
**Timeline:** Sprint 4
**Status:** Planned
**Verification:** Unit test: newQty = oldQty - consumedQty

### R-003: Unauthorized consumption reversal (Score: 6)

**Mitigation Strategy:** API guard tests for all roles. Test matrix: Operator=403, Manager=200, Admin=200.

**Owner:** QA
**Timeline:** Sprint 4
**Status:** Planned
**Verification:** API test with operatorToken returns 403

### R-004: Over-production without parent LP (Score: 6)

**Mitigation Strategy:** Frontend validation + API validation. Test that over-production request without parent_lp_id returns 400 error.

**Owner:** QA
**Timeline:** Sprint 4
**Status:** Planned
**Verification:** API test verifies MISSING_PARENT_LP error code

---

## Test File Structure

```
tests/
├── e2e/
│   ├── output-registration.spec.ts    # Story 4.12 E2E
│   ├── over-production.spec.ts        # Story 4.12b E2E
│   └── genealogy-trace.spec.ts        # Story 4.19 E2E
├── api/
│   ├── output-registration.test.ts    # Story 4.12 API
│   ├── sequential-consumption.test.ts # Story 4.12a API
│   ├── over-production.test.ts        # Story 4.12b API
│   ├── lp-updates-consumption.test.ts # Story 4.18 API
│   ├── genealogy-recording.test.ts    # Story 4.19 API
│   └── consumption-reversal.test.ts   # Story 4.10 API
└── unit/
    └── output-registration-service.test.ts # Unit tests
```

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `.bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
