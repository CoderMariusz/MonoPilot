# RED PHASE COMPLETION - Story 02.15

**Date**: 2025-12-29
**Story**: 02.15 - Cost History & Variance Analysis
**Phase**: RED (Test Writing) - COMPLETE
**Status**: All tests created and verified FAILING

---

## Summary

Successfully completed RED phase for Story 02.15 with 89 comprehensive test cases across 5 test files. All tests are currently FAILING as expected, since no implementation exists yet.

This document serves as the handoff to the DEV agent for the GREEN phase.

---

## Test Files Created

### 1. Unit Test: Cost History Service
**File**: `apps/frontend/lib/services/__tests__/cost-history-service.test.ts`
**Tests**: 16 cases
**Covers**:
- `calculateTrends()` - 30d, 90d, YTD trend calculations
- `getComponentBreakdown()` - Material, Labor, Overhead percentages
- `getCostDrivers()` - Top 5 ingredients by impact

**Key Test Scenarios**:
- 5% cost increase over 30 days (AC-03)
- Insufficient data returns 0 (AC-03)
- Negative trends when costs decrease (AC-03)
- Component breakdown percentages sum to 100% (AC-06)
- Cost drivers sorted by impact descending (AC-06)

---

### 2. Unit Test: Variance Analysis Service
**File**: `apps/frontend/lib/services/__tests__/variance-analysis-service.test.ts`
**Tests**: 13 cases
**Covers**:
- `calculateVariance()` - Material/labor/overhead variance calculation
- `identifySignificantVariances()` - Detect variances >5% threshold

**Key Test Scenarios**:
- Material variance: standard $185.50, actual $188.20 = +$2.70 (+1.46%) (AC-09)
- Significant variance identification for labor >5% (AC-10)
- Empty work orders returns null components (AC-11)
- Multiple work orders averaged correctly (AC-08)
- Threshold enforcement: 4.9% not flagged, 5.1% flagged (AC-10)
- Direction flagging: "over" for positive, "under" for negative (AC-10)

---

### 3. Integration Test: Cost History API
**File**: `apps/frontend/app/api/technical/costing/products/[id]/history/__tests__/route.test.ts`
**Endpoint**: `GET /api/technical/costing/products/:id/history`
**Tests**: 18 cases
**Covers**:
- Performance: Load within 1 second (AC-01)
- Cost summary with trends (AC-02)
- Pagination with page/limit (AC-19)
- Date range filtering: from/to query params (AC-12)
- Cost type filtering: standard/actual/planned/all (AC-12)
- Component breakdown data (AC-06)
- Cost drivers array (AC-06)
- Empty state for product with no history (AC-17)
- Error handling: 401, 403, 404, 400 (AC-18)
- RLS enforcement: Hide other orgs (AC-18)

**Query Parameters**:
```
?from=2025-01-01&to=2025-06-30&type=standard&page=1&limit=10
```

**Response Structure**:
```typescript
{
  product: { id, code, name },
  summary: {
    current_cost,
    previous_cost,
    change_amount,
    change_percentage,
    trend_30d,
    trend_90d,
    trend_ytd
  },
  history: CostHistoryItem[],
  pagination: { total, page, limit, total_pages },
  component_breakdown: { current, historical, changes },
  cost_drivers: CostDriver[]
}
```

---

### 4. Integration Test: Variance Report API
**File**: `apps/frontend/app/api/technical/costing/variance/report/__tests__/route.test.ts`
**Endpoint**: `GET /api/technical/costing/variance/report`
**Tests**: 19 cases
**Covers**:
- Work orders analyzed count (AC-08)
- Component variances: material, labor, overhead, total (AC-09)
- Significant variance identification (AC-10)
- No production data returns empty (AC-11)
- Period parameter: 7/30/90/365 days (API spec)
- Work order details array (AC-08)
- RLS enforcement (API spec)

**Query Parameters**:
```
?productId=prod-1&period=30
```

**Response Structure**:
```typescript
{
  product_id: string,
  period_days: number,
  work_orders_analyzed: number,
  components: {
    material: { standard, actual, variance, variance_percent },
    labor: { standard, actual, variance, variance_percent },
    overhead: { standard, actual, variance, variance_percent },
    total: { standard, actual, variance, variance_percent }
  },
  significant_variances: [{
    component: string,
    variance_percent: number,
    threshold: number,
    direction: 'over' | 'under'
  }],
  work_order_details: [{
    work_order_id,
    work_order_code,
    standard_cost,
    actual_cost,
    variance,
    variance_percent,
    completed_at
  }]
}
```

---

### 5. Component Test: Cost Trend Chart
**File**: `apps/frontend/components/technical/costing/__tests__/CostTrendChart.test.tsx`
**Component**: `CostTrendChart`
**Tests**: 23 cases
**Covers**:
- Chart rendering with data points (AC-04)
- Toggle Material/Labor/Overhead/Total lines (AC-05)
- Tooltip display on hover with breakdown (AC-06)
- Clickable data points navigation (AC-07)
- 12-month data visualization (AC-04)
- Responsive sizing (AC-04)
- Empty data handling (AC-04)
- Reset to default display (AC-13)

**Props**:
```typescript
{
  data: CostHistoryItem[],
  toggles: {
    material: boolean,
    labor: boolean,
    overhead: boolean,
    total: boolean
  },
  onToggleChange: (component: string, value: boolean) => void,
  onPointClick: (item: CostHistoryItem) => void
}
```

**Features Tested**:
- LineChart rendering with Recharts
- Multi-line visualization
- Custom tooltips with percentages
- Checkbox toggles for each component
- Responsive container
- X/Y axes and legend
- Click handlers on data points

---

## Acceptance Criteria Mapping

| AC | Test Count | Test Files |
|-------|-----------|-----------|
| AC-01 | 1 | Integration (history API) |
| AC-02 | 1 | Integration (history API) |
| AC-03 | 9 | Unit (cost-history), Integration (history API) |
| AC-04 | 11 | Component (CostTrendChart) |
| AC-05 | 5 | Component (CostTrendChart) |
| AC-06 | 10 | Component (CostTrendChart), Unit (services), Integration (history API) |
| AC-07 | 2 | Component (CostTrendChart) |
| AC-08 | 6 | Unit (variance), Integration (variance API) |
| AC-09 | 6 | Unit (variance), Integration (variance API) |
| AC-10 | 9 | Unit (variance), Integration (variance API) |
| AC-11 | 3 | Unit (variance), Integration (variance API) |
| AC-12 | 2 | Integration (history API) |
| AC-13 | 1 | Component (CostTrendChart) |
| AC-14 | - | Export feature (Phase 2C-3) |
| AC-15 | - | Export feature (Phase 2C-3) |
| AC-16 | - | Component state handling |
| AC-17 | 1 | Integration (history API) |
| AC-18 | 2 | Integration (history API) |
| AC-19 | 5 | Integration (history API) |
| AC-20 | - | Column sorting (future) |

**Total Coverage**: 89 test cases

---

## Test Execution

### Run All Tests
```bash
npm test -- --testPathPattern="(cost-history|variance|CostTrendChart)"
```

### Run by Category

Unit tests only:
```bash
npm test -- apps/frontend/lib/services/__tests__/cost-history-service.test.ts
npm test -- apps/frontend/lib/services/__tests__/variance-analysis-service.test.ts
```

Integration tests only:
```bash
npm test -- apps/frontend/app/api/technical/costing/products/\[id\]/history/__tests__/
npm test -- apps/frontend/app/api/technical/costing/variance/report/__tests__/
```

Component tests only:
```bash
npm test -- apps/frontend/components/technical/costing/__tests__/CostTrendChart.test.tsx
```

With coverage:
```bash
npm test -- --coverage --testPathPattern="(cost-history|variance|CostTrendChart)"
```

---

## Current Test Status: ALL FAILING (Expected)

```
Expected test output pattern:
✗ calculateTrends returns correct 30d trend
  - TypeError: calculateTrends is not a function

✗ GET /api/technical/costing/products/[id]/history
  - ReferenceError: GET is not defined

✗ CostTrendChart renders LineChart
  - TypeError: CostTrendChart is not exported
```

This is correct for RED phase. Tests will PASS once implementation is complete.

---

## Implementation Requirements

To reach GREEN phase, implement:

### Services (apps/frontend/lib/services/)

1. **cost-history-service.ts**
   ```typescript
   export function calculateTrends(costHistory: ProductCost[]): TrendSummary
   export async function getComponentBreakdown(
     current: ComponentBreakdown,
     historical?: ComponentBreakdown
   ): Promise<ComponentBreakdownData>
   export async function getCostDrivers(
     productId: string,
     limit?: number
   ): Promise<CostDriver[]>
   ```

2. **variance-analysis-service.ts**
   ```typescript
   export function calculateVariance(
     standardCosts: ProductCost,
     actualCosts: WorkOrderCost[]
   ): VarianceReport
   export function identifySignificantVariances(
     components: VarianceComponents,
     threshold?: number
   ): SignificantVariance[]
   ```

### API Routes (apps/frontend/app/api/technical/costing/)

1. **products/[id]/history/route.ts**
   ```typescript
   export async function GET(
     request: Request,
     { params }: { params: { id: string } }
   ): Promise<NextResponse>
   ```
   - Pagination support (page, limit)
   - Date range filtering (from, to)
   - Cost type filtering (type)
   - Performance target: < 1 second

2. **variance/report/route.ts**
   ```typescript
   export async function GET(request: Request): Promise<NextResponse>
   ```
   - Period parameter (7/30/90/365 days)
   - ProductId query parameter (required)
   - Period default: 30 days

### Components (apps/frontend/components/technical/costing/)

1. **CostTrendChart.tsx**
   - Renders Recharts LineChart
   - Multi-line visualization (Material, Labor, Overhead, Total)
   - Toggle controls for each line
   - Custom tooltip on hover
   - Click handler for data points
   - Responsive container

### Type Definitions (apps/frontend/lib/types/)

Ensure these types exist:
- `ProductCost`
- `CostHistoryItem`
- `ComponentBreakdown`
- `CostDriver`
- `VarianceComponent`
- `SignificantVariance`
- `WorkOrderCost`

---

## Test Data Fixtures

### Product with Cost History
- Product: "Bread Loaf White" (BREAD-001)
- Cost records: 47
- Date range: 2024-01-01 to 2025-12-11
- Cost types: standard, actual
- BOM versions: Multiple

### Material Cost Calculation Example
- Material: $185.50 (standard)
- Labor: $45.00
- Overhead: $20.00
- Total: $250.50
- Actual: $188.20 material = +$2.70 variance (+1.46%)

### Variance Data
- Work orders: 12 (30-day period)
- Labor variance: 7.9% (over threshold)
- Significant variances: flagged for display

---

## Performance Targets

- **Cost History API**: < 1 second response (AC-01)
- **Variance Report API**: < 2 seconds
- **Chart rendering**: < 500ms
- **Pagination**: Support 100+ records
- **Caching**: Redis with 5-minute TTL

---

## Database Indexes Required

On `product_costs` table:
- `(org_id, product_id, effective_from)` - for history queries
- `(org_id, product_id, cost_type)` - for type filtering

---

## Error Handling

All endpoints must handle:
- **401 Unauthorized**: No valid JWT token
- **403 Forbidden**: User lacks 'technical' read permission
- **404 Not Found**: Product doesn't exist or different org
- **400 Bad Request**: Invalid date range, invalid format

---

## Quality Gates for GREEN Phase

- [ ] All 89 tests passing
- [ ] Unit test coverage: 80% (cost-history, variance services)
- [ ] Integration test coverage: 70% (API routes)
- [ ] Component test coverage: 60% (CostTrendChart)
- [ ] Performance target met: History API < 1 second
- [ ] RLS properly enforced (no data leakage between orgs)
- [ ] All error codes tested and working
- [ ] Type safety: No TypeScript errors
- [ ] Code review approved
- [ ] Ready for REFACTOR phase

---

## Notes for DEV Agent

1. **Do not modify test files** - Tests are locked for RED phase
2. **Run tests frequently** - Use `npm test -- --watch` during development
3. **Type-first approach** - Define types before implementation
4. **Start with services** - Unit tests are easiest to pass first
5. **Then API routes** - Integration tests validate service integration
6. **Finally components** - React components integrate all pieces
7. **Verify coverage** - Use `--coverage` flag to track coverage %

---

## Files Summary

```
apps/frontend/lib/services/__tests__/
├── cost-history-service.test.ts         (16 tests)
└── variance-analysis-service.test.ts    (13 tests)

apps/frontend/app/api/technical/costing/
├── products/[id]/history/__tests__/
│   └── route.test.ts                    (18 tests)
└── variance/report/__tests__/
    └── route.test.ts                    (19 tests)

apps/frontend/components/technical/costing/__tests__/
└── CostTrendChart.test.tsx              (23 tests)

TOTAL: 5 files, 89 test cases
```

---

## What's NOT Tested (Phase 2C-3)

- Export to CSV/PDF/PNG/Excel (AC-14, AC-15)
- Cost export service functions
- Advanced filtering combinations
- Column sorting functionality (AC-20)
- Performance under 10k+ records

---

## Summary

RED phase is COMPLETE. All 89 tests are written, organized, and currently FAILING as expected. The test suite provides comprehensive coverage of:

- Trend calculations (30d, 90d, YTD)
- Variance analysis and significant variance detection
- Cost history API with filtering and pagination
- Variance report API with work order analysis
- CostTrendChart component with interactive features

The test suite is ready for the DEV agent to begin GREEN phase implementation.

**Estimated GREEN phase duration**: 2 days (per story estimate)
**Estimated REFACTOR phase duration**: 1 day

---

**Created by**: TEST-WRITER Agent
**Date**: 2025-12-29
**Status**: RED PHASE COMPLETE - Ready for GREEN

