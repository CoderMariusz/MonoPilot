# Epic 2 Technical Module - E2E Test Analysis & Recommendations

**Date**: 2026-01-24
**Status**: Analysis Complete ✅
**Test Suite**: 155 E2E Tests Across 8 Modules
**Phase**: RED → GREEN Implementation Roadmap

---

## Executive Summary

Epic 2 Technical Module has **comprehensive E2E test coverage** (155 tests, 100% FR coverage) in RED phase, ready for implementation. Tests are organized across 8 suites covering Products, BOMs, Routings, Traceability, Costing, and Dashboard. Key architectural patterns and validation rules are thoroughly tested.

**Current State**: 18 passing (basic UI), 136 failing (waiting for implementation), 6 skipped (conditional)
**Effort**: 4-6 weeks for full GREEN phase
**Highest Priority**: Products + Product Types (foundation)

---

## Test Execution Summary

### Overall Results

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tests Executed** | 160 | ✅ All run |
| **Passing** | 18 | ✅ Basic UI implemented |
| **Failing** | 136 | ✅ Expected (RED phase) |
| **Skipped** | 6 | ✅ Conditional |
| **Duration** | 6.5 min | ✅ Excellent |
| **Pass Rate** | 11% | 🟡 Expected at RED |
| **FR Coverage** | 72/72 (100%) | ✅ Complete |

### Pass Rate by Module

| Module | Pass Rate | Status | Notes |
|--------|-----------|--------|-------|
| Dashboard | 67% | 🟢 Highest | Basic layout exists |
| Costing | 17% | 🟡 Partial | Cost display UI present |
| Products | 0% | ❌ Critical | Foundation missing |
| Product Types | 0% | ❌ Critical | Foundation missing |
| BOMs | 0% | ❌ Critical | Complex, depends on Products |
| Routings | 0% | ❌ Blocked | Depends on Products |
| Traceability | 0% | ❌ Advanced | Requires full workflow |
| Integration | 0% | ❌ Last | Cross-module dependency |

---

## Module-by-Module Analysis

### 1. Products Module (30 Tests) - CRITICAL FOUNDATION

**Status**: ❌ RED (0/30 passing)
**Complexity**: Medium
**Estimate**: 5-7 days
**Dependencies**: None (foundation)

#### Test Breakdown
- **List View** (7 tests): Search, filter, pagination, headers
- **Create Product** (7 tests): Form validation, required fields, duplicate prevention
- **Edit Product** (6 tests): Updates, version increment, read-only fields
- **Product Details** (5 tests): Display, tabs, version history
- **Allergen Management** (5 tests): Add/remove allergens, inheritance

#### Key Features to Implement
```typescript
// Required Implementation:
1. Products list page (/technical/products)
   - DataTable with search/filter
   - Add/Edit buttons
   - Status badges

2. Product form (modal/drawer)
   - Code, Name, Type, UOM, Status
   - Perishable flag + shelf_life_days
   - Allergen tab with add/remove

3. Service layer (product-service.ts)
   - CRUD operations
   - Version auto-increment on edit
   - Duplicate code validation

4. API Endpoints:
   - GET /api/technical/products
   - POST /api/technical/products
   - PATCH /api/technical/products/[id]
   - GET /api/technical/products/[id]

5. Database (migrations exist - 046)
   - products table
   - product_versions table
   - product_allergens table
```

#### Critical FRs
- **FR-2.1**: Product CRUD
- **FR-2.2**: Auto version increment
- **FR-2.3**: Version history audit
- **FR-2.4**: Allergen declaration

#### Why Start Here
1. **Foundation**: Other modules depend on products
2. **Quick Win**: Medium complexity, clear AC
3. **Parallel Opportunity**: Can start while architecture refines BOMs

---

### 2. Product Types Module (8 Tests) - CRITICAL FOUNDATION

**Status**: ❌ RED (0/8 passing)
**Complexity**: Small
**Estimate**: 2-3 days
**Dependencies**: None (foundation)
**Blocker For**: Products module

#### Test Breakdown
- **List View** (2 tests): Table display, search
- **Create Type** (3 tests): Modal, form, duplicate prevention
- **Edit Type** (2 tests): Update, system type lock
- **Navigation** (1 test): Product count link navigation

#### Key Features
```typescript
1. Product Types list page (/technical/product-types)
   - Display system types (RAW, WIP, FIN, PKG) + custom
   - Search filter
   - "Add Product Type" button

2. Product Type form
   - Code (read-only for system types)
   - Name
   - is_default flag (one per org)

3. API Endpoints:
   - GET /api/technical/product-types
   - POST /api/technical/product-types
   - PATCH /api/technical/product-types/[id]

4. Integration with Products
   - Dropdown selector in product form
   - Count link to filtered products list
```

#### Why This Comes Before Products
- **Blocks Products form**: Product type is required field
- **Quick win**: Only 8 tests, simple CRUD
- **2-3 days max**: Should be done first

---

### 3. BOMs Module (36 Tests) - HIGH COMPLEXITY

**Status**: ❌ RED (0/36 passing)
**Complexity**: High
**Estimate**: 10-14 days
**Dependencies**: Products ✅, Routings (partial)

#### Test Breakdown
- **List View** (5 tests)
- **Create BOM** (7 tests): Date overlap validation ⭐
- **BOM Items** (8 tests): Quantity validation, UoM mismatch warning
- **Alternatives** (4 tests): Alternative ingredients
- **By-Products** (2 tests): Yield percentage
- **Clone** (3 tests): Copy BOM to new product ⭐ **FR-2.24**
- **Version Comparison** (2 tests)
- **Cost Summary** (2 tests): Cost rollup ⭐ **FR-2.36**
- **Allergen Inheritance** (2 tests)
- **Multi-Level Explosion** (1 test)

#### Critical Features (⭐ STARS)

##### Feature 1: BOM Clone (FR-2.24)
```typescript
// User clicks "Clone" on BOM
// Modal opens: select target product
// All items copied to new BOM
// Routing copied
// Success message + navigate to new BOM

Tests: TC-BOM-027 to TC-BOM-029 (3 tests)
Impact: High - enables product variants quickly
Effort: Medium
```

##### Feature 2: Cost Rollup (FR-2.36, ADR-009)
```typescript
// BOM cost = material + routing costs
// Triggered by "Calculate Cost" button
// Shows:
//   - Ingredient costs (qty * unit_cost)
//   - Routing setup cost (fixed)
//   - Routing working cost (qty * rate)
//   - Labor costs (per operation)
//   - Overhead calculation
//   - Total cost + cost per unit

Tests: TC-BOM-032 to TC-COST-009 (12 tests)
Impact: High - critical for pricing
Effort: High (requires routing integration)
```

##### Feature 3: Date Overlap Validation (FR-2.22)
```typescript
// When creating BOM, validate effective_from/effective_to
// Rule: No overlapping date ranges for same product
// Error message if overlap detected
// Prevents recipe conflicts

Tests: TC-BOM-008 (1 test)
Impact: Medium - data integrity
Effort: Low (database constraint)
```

#### Database Requirements
- **boms** table (migration 044)
- **bom_items** table (migration 044)
- **bom_alternative_items** table (migration 047)
- **bom_by_products** table (migration 047)

#### API Endpoints Required
```typescript
// BOM Management
GET    /api/technical/boms
POST   /api/technical/boms
GET    /api/technical/boms/[id]
PATCH  /api/technical/boms/[id]
DELETE /api/technical/boms/[id]

// BOM Clone
POST   /api/technical/boms/[id]/clone

// BOM Items
POST   /api/technical/boms/[id]/items
PATCH  /api/technical/boms/[id]/items/[itemId]
DELETE /api/technical/boms/[id]/items/[itemId]

// Cost Calculation
POST   /api/technical/boms/[id]/calculate-cost
```

#### Why High Complexity
1. **Multi-level management**: BOM items with alternatives
2. **Cost integration**: Requires routing service
3. **Date validation**: Complex business logic
4. **Clone feature**: Data duplication logic

---

### 4. Routings Module (27 Tests) - MEDIUM-HIGH COMPLEXITY

**Status**: ❌ RED (0/27 passing)
**Complexity**: Medium-High
**Estimate**: 8-10 days
**Dependencies**: Products ✅

#### Test Breakdown
- **List View** (4 tests)
- **Create Routing** (6 tests): Code uniqueness ⭐
- **Operations** (8 tests): Sequence, time fields, labor costs
- **BOM Assignment** (2 tests): Link routing to BOM
- **Clone** (1 test)
- **Versioning** (1 test): Auto-increment on edit
- **Cost Calculation** (2 tests): Setup + working + overhead ⭐ **ADR-009**
- **Parallel Operations** (1 test): Duplicate sequences
- **Reusability** (2 tests): Reusable vs exclusive

#### Critical Feature: Routing Costs (ADR-009)

**⭐ STAR FEATURE** - High business impact

```typescript
// Routing level costs for manufacturing:
routing:
  setup_cost: 50.00              // Fixed setup cost
  working_cost_per_unit: 0.50    // Per-unit variable cost
  overhead_percent: 15.00         // Overhead multiplier

operations[]:
  sequence: 1
  setup_time: 15 minutes
  duration: 60 minutes
  cleanup_time: 10 minutes
  labor_cost_per_hour: $25.00

// Cost calculation:
// = setup_cost
// + (working_cost_per_unit * output_qty)
// + sum(operation.setup_time + operation.duration + operation.cleanup_time) * labor_cost_per_hour / 60
// * (1 + overhead_percent)

Tests: TC-RTG-008, TC-RTG-023-24, TC-COST-004-7
Impact: CRITICAL - pricing engine depends on this
Effort: High (math validation)
```

#### Database Requirements
- **routings** table (migration 045)
- **routing_operations** table (migration 045)
- **bom_routings** junction table

#### Why Medium-High
1. **Parallel operations** allowed (same sequence number)
2. **Cost calculations** complex
3. **Reusable routing** can link to multiple BOMs
4. **Version management** like products

---

### 5. Traceability Module (18 Tests) - ADVANCED

**Status**: ❌ RED (0/18 passing)
**Complexity**: High
**Estimate**: 10-12 days
**Dependencies**: Products ✅, Production workflow (not in Epic 2)

#### Test Breakdown
- **Search Page** (2 tests)
- **Forward Trace** (4 tests): Where consumed
- **Backward Trace** (4 tests): Where sourced
- **Genealogy Tree** (3 tests): Interactive tree ⭐
- **Recall Simulation** (4 tests): Affected lots/customers ⭐ **FR-2.62**
- **Matrix Report** (1 test)

#### Critical Feature: Recall Simulation (FR-2.62)

```typescript
// User enters lot number and clicks "Recall"
// System traces:
// 1. All downstream lots (where consumed)
// 2. End products produced
// 3. Shipped lots (with customer/date)
// 4. Total quantity affected
//
// Display:
// - Affected lot tree
// - Customers impacted
// - Quantities at each stage
// - Export to CSV

Tests: TC-TRC-014 to TC-TRC-017
Impact: CRITICAL - food safety, regulatory
Effort: Very High (complex genealogy queries)
```

#### Why Late Priority
1. **Depends on production workflow**: Requires work orders + consumptions (Epic 4)
2. **Complex queries**: Multi-level genealogy traversal
3. **Advanced feature**: Can be incremental

---

### 6. Costing Module (12 Tests) - MEDIUM

**Status**: 🟡 PARTIAL (2/12 passing, 17% pass rate)
**Complexity**: Medium
**Estimate**: 6-8 days
**Dependencies**: BOMs ✅, Routings ✅

#### Already Passing Tests ✅
- **TC-COST-001**: BOM cost display (2 tests)
- **TC-COST-003**: Subtotal display

#### Failed Tests (10)
- **TC-COST-002**: Ingredient costs detail
- **TC-COST-004-007**: Routing cost breakdown ⭐
- **TC-COST-008-009**: Total cost rollup
- **TC-COST-010**: Multi-level rollup
- **TC-COST-011-012**: Validation (missing prices)

#### Key Calculations Required
```typescript
// Material Cost
materialCost = sum(item.qty * component.cost_per_unit)

// Routing Cost (if BOM has routing)
routingCost = routing.setup_cost
            + (routing.working_cost_per_unit * output_qty)
            + sum(operation.labor for each operation)
            * (1 + routing.overhead_percent)

// Total BOM Cost
totalCost = materialCost + routingCost
costPerUnit = totalCost / output_qty
```

#### Why Partial Pass
Dashboard cost display UI exists but lacks:
- Detail breakdown calculations
- Routing integration
- Multi-level rollup

---

### 7. Dashboard Module (12 Tests) - GOOD PROGRESS

**Status**: 🟢 PARTIAL (8/12 passing, 67% pass rate)
**Complexity**: Low
**Estimate**: 3-4 days
**Dependencies**: Products ✅, BOMs, Routings

#### Already Passing Tests ✅
- **TC-DASH-001**: Page display
- **TC-DASH-003**: Stats cards display
- **TC-DASH-004**: Product type breakdown
- **TC-DASH-006**: Allergen matrix table
- Plus 4 more layout tests

#### Failed Tests (4)
- **TC-DASH-002**: Performance (< 2 sec)
- **TC-DASH-007**: PDF export button
- **TC-DASH-008**: BOM timeline visualization
- **TC-DASH-009**: Quick action buttons

#### Why High Pass Rate
1. Basic layout already implemented
2. Static card displays working
3. Table renders (even if empty)
4. Navigation functional

#### Quick Wins to Pass Remaining
1. Performance optimization (investigate slow queries)
2. PDF export library integration (simple)
3. Timeline component library (copy from planning)
4. Quick action button wiring (simple navigation)

---

### 8. Integration Tests (12 Tests) - CROSS-MODULE

**Status**: ❌ RED (0/12 passing)
**Complexity**: High
**Estimate**: Will resolve automatically with module implementation

#### Test Scenarios
- **TC-INT-001**: Product → BOM → Work Order flow
- **TC-INT-002**: BOM → Allergen inheritance
- **TC-INT-003**: Routing → BOM → Cost flow
- **TC-INT-004**: Multi-level BOM explosion
- **TC-INT-005**: Product type filtering integration
- **TC-INT-006**: Shelf life + expiry policy
- **TC-INT-007**: Alternative ingredients usage
- **TC-INT-008**: BOM cloning variants
- **TC-INT-009**: Reusable routing across BOMs
- **TC-INT-010**: Cost rollup to standard price
- **TC-INT-011**: Search + allergen filter
- **TC-INT-012**: Effective date BOM selection

#### Why These Are Last
These tests validate **cross-module interactions** that automatically pass when individual modules are implemented correctly. They serve as **integration sanity checks**.

**When to Run**: After modules 1-7 are GREEN

---

## Implementation Priority Roadmap

### Critical Path to First 50% GREEN (8 weeks)

```
Week 1-2: FOUNDATION (Products + Product Types)
├─ Product Types (8 tests) ..................... 2-3 days
├─ Products (30 tests) ......................... 5-7 days
└─ Result: 38/155 GREEN ........................ 25%

Week 3-5: CORE FUNCTIONALITY (BOMs + Routings)
├─ BOMs (36 tests) ............................. 10-14 days
│  └─ Include Clone feature (FR-2.24) [high value]
├─ Routings (27 tests) ......................... 8-10 days
│  └─ Include Cost config (ADR-009) [high value]
└─ Result: 101/155 GREEN ....................... 65%

Week 6-7: ANALYTICS (Costing + Dashboard)
├─ Costing (12 tests) .......................... 6-8 days
│  └─ Material + Routing cost integration
├─ Dashboard (12 tests) ........................ 3-4 days
│  └─ Already 67% done!
└─ Result: 125/155 GREEN ....................... 81%

Week 8-10: ADVANCED (Traceability + Integration)
├─ Traceability (18 tests) ..................... 10-12 days
├─ Integration (12 tests) ...................... 3-5 days (auto-resolve)
└─ Result: 155/155 GREEN ....................... 100%
```

### Parallel Opportunities

While Products are being built:
- **Set up Routings infrastructure** (database, service layer)
- **Design Cost calculation engine** (ADR-009 implementation)
- **Prepare Traceability queries** (genealogy algorithms)

---

## Top 10 Most Critical Failures & Quick Wins

### Quick Wins (1-2 days each)

| Feature | Impact | Effort | Start Date |
|---------|--------|--------|------------|
| 1. Dashboard performance tune | Medium | 1 day | Week 2 |
| 2. Product Types CRUD | Critical | 3 days | Week 1 - Day 1 |
| 3. Dashboard PDF export | Low | 2 hours | Week 7 |
| 4. Product search/filter | High | 2 days | Week 1 |
| 5. BOM date validation | Medium | 1 day | Week 3 |

### Critical Blockers (Must Implement First)

| Feature | Impact | Effort | Blocks |
|---------|--------|--------|--------|
| 1. Product Types | Critical | 3 days | Products, BOMs, Routings |
| 2. Products CRUD | Critical | 7 days | BOMs, Routings, Costing, Dashboard |
| 3. BOM Core CRUD | Critical | 10 days | Routing assignment, Cost calculation |
| 4. Routing Cost Config | Critical | 4 days | Costing integration |

### High-Value Features (Best ROI)

| Feature | ROI | Effort | Tests Unlocked |
|---------|-----|--------|---|
| **BOM Clone (FR-2.24)** | Very High | 3 days | 3 tests + user delight |
| **Routing Costs (ADR-009)** | Very High | 5 days | 8 tests + pricing engine |
| **Recall Simulation (FR-2.62)** | High | 6 days | 4 tests + regulatory |

---

## Recommendations & Action Items

### Immediate Actions (This Week)

1. **Approve Test Plan** ✅ (already done)
2. **Setup Development Branches**
   ```bash
   git checkout -b feature/02-product-types
   git checkout -b feature/02-products
   git checkout -b feature/02-boms
   git checkout -b feature/02-routings
   ```

3. **Assign Developers**
   - **Frontend Dev 1**: Product Types + Products (Weeks 1-2)
   - **Frontend Dev 2**: BOMs (Weeks 3-5)
   - **Frontend Dev 3**: Routings (Weeks 3-5)
   - **Backend Dev**: API endpoints + services

4. **Run Tests Weekly**
   ```bash
   # Every Friday, run full suite to track progress
   pnpm test:e2e e2e/tests/technical --reporter=html
   ```

### Test Execution Tips

```bash
# Run foundation tests only
pnpm test:e2e e2e/tests/technical/product-types.spec.ts
pnpm test:e2e e2e/tests/technical/products.spec.ts

# Run with debug output
pnpm test:e2e --debug e2e/tests/technical/products.spec.ts

# Run specific test
pnpm test:e2e -g "should create product with all required fields"

# Generate HTML report
pnpm test:e2e e2e/tests/technical --reporter=html

# Watch mode during development
pnpm test:e2e --ui e2e/tests/technical
```

### Implementation Checklist (Per Module)

**For each module, follow this order:**

1. ✅ **Database**: Verify migrations exist
2. ✅ **Validation**: Create Zod schemas (lib/validation/)
3. ✅ **Services**: Build service layer (lib/services/)
4. ✅ **API Routes**: Create endpoints (app/api/technical/)
5. ✅ **Components**: Build UI components
6. ✅ **Pages**: Create list + detail pages
7. ✅ **Run Tests**: Execute `pnpm test:e2e`
8. ✅ **Fix Failures**: One test at a time
9. ✅ **Refactor**: Extract DRY patterns
10. ✅ **Code Review**: PR review checklist

---

## Risk Analysis & Mitigation

### High Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Cost calculation complexity** | High | High | Start with simple case, expand gradually |
| **Date overlap validation** | Medium | Medium | Use database constraint, test early |
| **Allergen inheritance conflicts** | Medium | High | Mock BOM-product relationship in tests |
| **Recall simulation performance** | Medium | High | Start with simple genealogy, optimize later |

### Testing Risks

| Risk | Mitigation |
|------|-----------|
| **Flaky tests** | Use fixed timestamps, not `Date.now()` |
| **Slow tests** | Profile each test, target < 5 sec |
| **Auth issues** | Use auth state from setup phase |
| **Database isolation** | Use unique org_ids per test |

---

## Success Metrics & Milestones

### Weekly Progress Targets

| Week | Module | Target | Milestone |
|------|--------|--------|-----------|
| W1 | Product Types | 8/8 GREEN | Foundation |
| W2 | Products | 30/30 GREEN | Foundation Complete |
| W3 | BOMs (part 1) | 18/36 GREEN | CRUD done |
| W4 | BOMs (part 2) | 36/36 GREEN | Clone + Cost done |
| W5 | Routings | 27/27 GREEN | Cost config done |
| W6 | Costing | 12/12 GREEN | Cost engine done |
| W7 | Dashboard | 12/12 GREEN | Analytics done |
| W8-10 | Traceability | 18/18 GREEN | Advanced features |
| W10 | Integration | 12/12 GREEN | **100% complete** |

### Key Success Indicators

- **Weekly green tests**: Increase by 15-25 per week
- **No regression**: Each module stays GREEN after completion
- **Code review cycle**: < 24 hours
- **Zero critical bugs**: Post-implementation production issues

---

## Decision Options for User

### Option A: Aggressive Timeline (Recommended)
- **Duration**: 8-10 weeks
- **Resource**: 3-4 engineers + 1 backend
- **Risk**: Medium (tight timeline)
- **Benefit**: MVP feature complete by end of Q1
- **Effort**: High pressure, daily standups

**Recommendation**: Choose this if market timing is critical

### Option B: Comfortable Timeline (Safer)
- **Duration**: 12-14 weeks
- **Resource**: 2-3 engineers
- **Risk**: Low (more breathing room)
- **Benefit**: Higher code quality, better testing
- **Effort**: Sustainable pace

**Recommendation**: Choose this for long-term sustainability

### Option C: Phased MVP (Focused)
- **Duration**: 4-5 weeks (Phase 1 only)
- **Resource**: 2 engineers
- **Scope**: Products + Product Types + Basic BOMs
- **Benefit**: Early customer validation
- **Gap**: No Routing costs or Traceability

**Recommendation**: Choose if you want early customer feedback

---

## Conclusion

Epic 2 Technical Module has **excellent test coverage** (155 tests, 100% FR) ready for GREEN phase implementation. The test suite covers:

✅ Core CRUD operations (Products, BOMs, Routings)
✅ Complex features (Cloning, Cost rollup, Recall simulation)
✅ Validation rules (Date overlap, UoM mismatch, Duplicate prevention)
✅ Cross-module integration scenarios

**Recommended approach**:
1. Start with Product Types (quick win, 2-3 days)
2. Follow with Products (foundation, 5-7 days)
3. Then parallel: BOMs + Routings (10-14 days each)
4. Finish with advanced features (Costing, Traceability)

**Expected timeline**: 8-10 weeks for 100% completion
**Quality metric**: 155/155 tests GREEN
**Business value**: Complete technical data management for food manufacturing

---

**Report Generated By**: TEST-ENGINEER
**Status**: READY FOR IMPLEMENTATION
**Next Steps**: Assign developers, setup branches, execute Phase 1

