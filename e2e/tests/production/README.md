# Production Module E2E Tests

**Epic 4 - Phase 0 (MVP Core) + Phase 1 (Full Production)**
**Test Coverage:** ~150 test cases across 17 stories
**Created:** 2026-01-25

## Overview

This test suite provides comprehensive end-to-end testing for the Production module (Epic 4), covering work order execution, material consumption, output registration, operations tracking, yield analysis, and production settings.

### Phases Covered

**Phase 0 - MVP Core (7 stories):**
- 04.1: Production Dashboard
- 04.2a: WO Start
- 04.2b: WO Pause/Resume
- 04.2c: WO Complete
- 04.3: Operation Start/Complete
- 04.4: Yield Tracking
- 04.5: Production Settings

**Phase 1 - Full Production (10 stories):**
- 04.6a: Material Consumption (Desktop)
- 04.6b: Material Consumption (Scanner)
- 04.6c: 1:1 Consumption Enforcement
- 04.6d: Consumption Correction
- 04.6e: Over-Consumption Control
- 04.7a: Output Registration (Desktop)
- 04.7b: Output Registration (Scanner)
- 04.7c: By-Product Registration
- 04.7d: Multiple Outputs per WO
- 04.8: Material Reservations

## Test Files

| File | FR Coverage | Test Cases | Description |
|------|-------------|------------|-------------|
| `dashboard.spec.ts` | FR-PROD-001 | TC-PROD-001 to TC-PROD-010 | Dashboard KPIs, active WOs, alerts, filters |
| `wo-lifecycle.spec.ts` | FR-PROD-002, 003, 005 | TC-PROD-011 to TC-PROD-030 | WO start, pause, resume, complete |
| `operations.spec.ts` | FR-PROD-004 | TC-PROD-031 to TC-PROD-045 | Operation tracking, sequence, yield |
| `consumption-desktop.spec.ts` | FR-PROD-006, 008, 009, 010 | TC-PROD-046 to TC-PROD-065 | Desktop consumption, validation, corrections |
| `consumption-scanner.spec.ts` | FR-PROD-007 | TC-PROD-066 to TC-PROD-075 | Scanner workflow, touch UI, barcode scanning |
| `output-registration.spec.ts` | FR-PROD-011, 012, 013, 015 | TC-PROD-076 to TC-PROD-105 | Desktop & scanner output, by-products, multiple outputs |
| `reservations-and-yield.spec.ts` | FR-PROD-014, 016 | TC-PROD-106 to TC-PROD-125 | Material reservations, FIFO/FEFO, yield calculations |
| `settings.spec.ts` | FR-PROD-017 | TC-PROD-141 to TC-PROD-150 | Production settings, validation, impact |

## Page Objects

Located in `e2e/pages/production/`:

| Page Object | Purpose |
|-------------|---------|
| `ProductionDashboardPage.ts` | Dashboard KPIs, active WOs, alerts, filters |
| `WorkOrderExecutionPage.ts` | WO lifecycle, operations tracking |
| `MaterialConsumptionPage.ts` | Desktop & scanner consumption, reservations, corrections |
| `OutputRegistrationPage.ts` | Desktop & scanner output, by-products, yield tracking |

## Running Tests

### Run All Production Tests
```bash
npx playwright test e2e/tests/production
```

### Run Specific Test File
```bash
npx playwright test e2e/tests/production/dashboard.spec.ts
npx playwright test e2e/tests/production/wo-lifecycle.spec.ts
npx playwright test e2e/tests/production/consumption-desktop.spec.ts
```

### Run by Tag
```bash
npx playwright test --grep "TC-PROD-001"  # Specific test case
npx playwright test --grep "Dashboard"    # All dashboard tests
npx playwright test --grep "Scanner"      # All scanner tests
```

### Run in Debug Mode
```bash
npx playwright test e2e/tests/production/dashboard.spec.ts --debug
```

## Test Data Requirements

### Prerequisites
Tests require the following data setup:

1. **Organizations & Users**
   - Active organization with org_id
   - Users with roles: Admin, Manager, Operator
   - Active session/authentication

2. **Settings Module (Epic 01)**
   - Production lines configured
   - Machines configured (optional)
   - Locations configured

3. **Technical Module (Epic 02)**
   - Products created (RAW, WIP, FIN)
   - BOMs defined with components
   - BOMs with by-products (for FR-PROD-013)
   - Routings with operations

4. **Planning Module (Epic 03)**
   - Work Orders in various statuses:
     - Draft (for validation tests)
     - Released (for start tests)
     - In Progress (for pause/complete tests)
     - Paused (for resume tests)

5. **Warehouse Module (Epic 05)** - REQUIRED for Phase 1 tests
   - License Plates with various statuses:
     - Available (for consumption)
     - Consumed (for error tests)
     - Reserved (for reservation tests)
   - LPs with matching/mismatching products and UoMs
   - LPs with different expiry dates (for FIFO/FEFO)

### Test Data Fixtures

Create test fixtures in `e2e/fixtures/production/`:
- `work-orders.json` - Sample WOs in different states
- `license-plates.json` - Sample LPs for consumption tests
- `products.json` - Products with BOMs and by-products

## Test Categories

### Happy Path Tests
Tests that verify core functionality with valid data:
- WO Start → Consume Materials → Register Output → Complete WO
- Scanner workflows (barcode scanning, touch UI)
- Dashboard KPIs and real-time updates

### Validation Tests
Tests that verify error handling and business rules:
- LP not found, product mismatch, UoM mismatch
- Insufficient quantity, LP already consumed
- Over-consumption control
- 1:1 consumption enforcement

### Role-Based Tests
Tests that verify RBAC:
- Manager can reverse consumptions
- Operator cannot access settings
- Admin can modify production settings

### Performance Tests
Tests that verify response times:
- Dashboard KPIs load within 2 seconds
- Scanner barcode processing within 500ms
- Manual refresh within 500ms

### Integration Tests
Tests that verify cross-module integration:
- WO creation (Planning) → Execution (Production) → LP creation (Warehouse)
- Genealogy tracking across consumption and output
- Material reservations and FIFO/FEFO logic

## Known Limitations

### Tests Marked `.skip`
Most tests are marked with `.skip` because they require:

1. **Backend Implementation**: API endpoints for production module
2. **Database Schema**: Production tables (production_outputs, material_consumptions, etc.)
3. **Frontend UI**: Production pages and components
4. **Test Data**: Seeded database with WOs, LPs, products

### Remove `.skip` After Implementation
As Epic 4 stories are implemented, remove `.skip` from corresponding test cases:

```typescript
// Before implementation
test.skip('should start WO with status Released', async () => { ... });

// After implementation
test('should start WO with status Released', async () => { ... });
```

## Test Patterns

### Page Object Pattern
All tests use Page Object Model for maintainability:

```typescript
test('should consume material', async () => {
  await consumptionPage.gotoWOConsumption('wo-id-123');
  await consumptionPage.consumeMaterial('Flour', 'LP-001', 40);
  await consumptionPage.expectSuccessToast();
});
```

### Assertions Pattern
Use clear, descriptive assertions:

```typescript
// Good
await dashboardPage.expectKPIsLoaded(2000);
await consumptionPage.expectConsumptionProgress('Flour', 100, 40);

// Avoid
expect(await page.locator('.kpi').count()).toBeGreaterThan(0);
```

### Data-Driven Tests
Use test data objects for reusability:

```typescript
const outputData: OutputData = {
  quantity: 500,
  qaStatus: 'Approved',
  locationId: 'LOC-A',
};

await outputPage.registerOutput(outputData);
```

## Coverage Report

### Functional Requirements Coverage

| FR ID | Feature | Test Coverage | Status |
|-------|---------|---------------|--------|
| FR-PROD-001 | Production Dashboard | TC-PROD-001 to 010 | ✅ 10 tests |
| FR-PROD-002 | WO Start | TC-PROD-011 to 012 | ✅ 6 tests |
| FR-PROD-003 | WO Pause/Resume | TC-PROD-013 to 015 | ✅ 6 tests |
| FR-PROD-004 | Operation Start/Complete | TC-PROD-031 to 037 | ✅ 15 tests |
| FR-PROD-005 | WO Complete | TC-PROD-016 to 018 | ✅ 8 tests |
| FR-PROD-006 | Material Consumption (Desktop) | TC-PROD-046 to 050 | ✅ 20 tests |
| FR-PROD-007 | Material Consumption (Scanner) | TC-PROD-066 to 075 | ✅ 10 tests |
| FR-PROD-008 | 1:1 Consumption | TC-PROD-048 | ✅ 4 tests |
| FR-PROD-009 | Consumption Correction | TC-PROD-049 | ✅ 7 tests |
| FR-PROD-010 | Over-Consumption Control | TC-PROD-050 | ✅ 8 tests |
| FR-PROD-011 | Output Registration (Desktop) | TC-PROD-076 to 078 | ✅ 8 tests |
| FR-PROD-012 | Output Registration (Scanner) | TC-PROD-080 to 081 | ✅ 8 tests |
| FR-PROD-013 | By-Product Registration | TC-PROD-082 | ✅ 8 tests |
| FR-PROD-014 | Yield Tracking | TC-PROD-111 to 114 | ✅ 8 tests |
| FR-PROD-015 | Multiple Outputs per WO | TC-PROD-079 | ✅ 6 tests |
| FR-PROD-016 | Material Reservations | TC-PROD-106 to 110 | ✅ 7 tests |
| FR-PROD-017 | Production Settings | TC-PROD-141 to 150 | ✅ 10 tests |

**Total: ~150 test cases across 17 functional requirements**

### Acceptance Criteria Coverage

Each test case maps directly to acceptance criteria from the PRD:

```
AC: "GIVEN WO has status Released, WHEN user clicks Start Production,
     THEN WO status changes to In Progress within 1 second"

Test: TC-PROD-011 - should start WO with status Released
```

## Maintenance

### Updating Tests
When UI changes occur:
1. Update corresponding Page Object selectors
2. Run tests to verify no regressions
3. Update test assertions if expected behavior changed

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Use Page Objects for all UI interactions
3. Add test case ID (TC-PROD-XXX) to test description
4. Update this README with new test coverage

### Debugging Failed Tests
1. Run with `--debug` flag for step-by-step execution
2. Check Page Object selectors match current UI
3. Verify test data exists in database
4. Check browser console for errors

## Future Enhancements

**Phase 2 (OEE & Analytics)** - Not included in current test suite:
- FR-PROD-018: OEE Calculation
- FR-PROD-019: Downtime Tracking
- FR-PROD-020: Machine Integration
- FR-PROD-021: Shift Management
- FR-PROD-022a-g: 7 Analytics Reports

These will require ~50 additional test cases when implemented.

## Contact

For questions or issues with the test suite:
- Check existing test patterns in other modules (e.g., `e2e/tests/technical/boms.spec.ts`)
- Review Playwright documentation: https://playwright.dev
- See Epic 4 PRD: `docs/1-BASELINE/product/modules/production.md`

## References

- **PRD**: `docs/1-BASELINE/product/modules/production.md`
- **Epic Overview**: `docs/2-MANAGEMENT/epics/current/04-production/04.0.epic-overview.md`
- **Story Context**: `docs/2-MANAGEMENT/epics/current/04-production/context/`
- **Architecture**: `docs/1-BASELINE/architecture/modules/production.md`
- **Existing Tests**: `e2e/tests/technical/` (BOMs, Routings patterns)
