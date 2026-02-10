# Epic 2 Technical - Developer Quick Start Guide

**For**: Frontend & Backend Developers
**Purpose**: Implement E2E tests to GREEN in 8-10 weeks
**Status**: Tests ready, implementation pending

---

## What You Need to Know

### The Big Picture
- **155 E2E tests** are written and failing (RED phase)
- Tests cover **100% of functional requirements** (72 FRs)
- Your job: **Make tests GREEN** by implementing features
- This guide tells you **what to implement first**

### Test Results Today
```
✅ 18 tests passing (basic UI elements)
❌ 136 tests failing (waiting for your code)
⏭️ 6 tests skipped (conditional on data)
```

### Timeline Options
| Option | Duration | Team | Risk | Best For |
|--------|----------|------|------|----------|
| **Aggressive** | 8-10 weeks | 3-4 eng | Medium | Market timing critical |
| **Comfortable** | 12-14 weeks | 2-3 eng | Low | Sustainable pace |
| **MVP Only** | 4-5 weeks | 2 eng | Low | Early customer feedback |

---

## Module Implementation Order (STRICT ORDER!)

### Week 1-2: Product Types (8 tests) → Products (30 tests)

**Start**: Product Types FIRST (it blocks Products)

```bash
# Product Types
File: e2e/tests/technical/product-types.spec.ts
Tests: 8 (list, create, edit, navigate)
Effort: 2-3 days
Success: All 8 tests GREEN

# Products
File: e2e/tests/technical/products.spec.ts
Tests: 30 (list, create, edit, details, allergens)
Effort: 5-7 days
Success: All 30 tests GREEN
```

**Run tests**:
```bash
# Just Product Types tests
pnpm test:e2e e2e/tests/technical/product-types.spec.ts

# Just Products tests
pnpm test:e2e e2e/tests/technical/products.spec.ts

# Both
pnpm test:e2e e2e/tests/technical/product-types.spec.ts e2e/tests/technical/products.spec.ts
```

**Expected outcome**: 38/155 tests GREEN ✅

---

### Week 3-5: BOMs (36 tests) + Routings (27 tests)

**Can do in parallel** after Products are done

```bash
# BOMs
File: e2e/tests/technical/boms.spec.ts
Tests: 36 (list, create, items, alternatives, clone, costs)
Effort: 10-14 days
Star Features: Clone (FR-2.24), Cost Rollup (FR-2.36)
Success: All 36 tests GREEN

# Routings
File: e2e/tests/technical/routings.spec.ts
Tests: 27 (list, create, operations, costs)
Effort: 8-10 days
Star Feature: Routing Costs (ADR-009)
Success: All 27 tests GREEN
```

**Run tests**:
```bash
pnpm test:e2e e2e/tests/technical/boms.spec.ts
pnpm test:e2e e2e/tests/technical/routings.spec.ts
```

**Expected outcome**: 101/155 tests GREEN ✅

---

### Week 6-7: Costing (12 tests) + Dashboard (12 tests)

**Dashboard already 67% done!**

```bash
# Costing
File: e2e/tests/technical/costing.spec.ts
Tests: 12 (already 2 passing, 10 to fix)
Effort: 6-8 days
Note: Depends on BOM + Routing costs
Success: All 12 tests GREEN

# Dashboard
File: e2e/tests/technical/dashboard.spec.ts
Tests: 12 (already 8 passing, 4 to fix)
Effort: 3-4 days
Note: Mostly UI polish
Success: All 12 tests GREEN
```

**Expected outcome**: 125/155 tests GREEN ✅

---

### Week 8-10: Traceability (18 tests) + Integration (12 tests)

**Advanced features**, do last

```bash
# Traceability
File: e2e/tests/technical/traceability.spec.ts
Tests: 18 (search, forward, backward, genealogy, recall)
Effort: 10-12 days
Note: Requires work order data from Epic 4
Success: All 18 tests GREEN

# Integration
File: e2e/tests/technical/integration.spec.ts
Tests: 12 (cross-module scenarios)
Effort: 3-5 days (auto-resolve when others done)
Note: These tests pass automatically when modules correct
Success: All 12 tests GREEN
```

**Expected outcome**: 155/155 tests GREEN ✅ **100% COMPLETE**

---

## What Each Module Needs

### Product Types Module (2-3 days)

```typescript
// 1. Database (migrations/046-product-types.sql already exists)
// ✅ product_types table ready

// 2. Service Layer (lib/services/product-type-service.ts)
export class ProductTypeService {
  static async list(orgId: string): Promise<ProductType[]>
  static async create(orgId: string, data: CreateProductTypeDto)
  static async update(orgId: string, id: string, data: UpdateProductTypeDto)
  static async getByCode(orgId: string, code: string)
  // Only 1 is_default per org
}

// 3. API Routes
GET    /api/technical/product-types
POST   /api/technical/product-types
PATCH  /api/technical/product-types/[id]

// 4. Page (app/(authenticated)/technical/product-types/page.tsx)
- DataTable with search
- Add button → modal
- Edit drawer
- Product count link

// 5. Validation (lib/validation/product-type.ts)
CreateProductTypeSchema
UpdateProductTypeSchema
```

**Tests to pass**: 8 tests in product-types.spec.ts

---

### Products Module (5-7 days)

```typescript
// 1. Database (migrations/046-products.sql already exists)
// ✅ products, product_versions, product_allergens tables ready

// 2. Service Layer (lib/services/product-service.ts)
export class ProductService {
  static async list(orgId: string, filters?: {type, status}): Promise<Product[]>
  static async create(orgId: string, data: CreateProductDto): Promise<Product>
  static async update(orgId: string, id: string, data: UpdateProductDto)
  // Auto-increment version on edit (FR-2.2)
  static async getHistory(orgId: string, id: string): Promise<ProductVersion[]>
  static async addAllergen(orgId: string, productId: string, allergenId: string)
  static async removeAllergen(orgId: string, productId: string, allergenId: string)
}

// 3. API Routes
GET    /api/technical/products
POST   /api/technical/products
PATCH  /api/technical/products/[id]
GET    /api/technical/products/[id]
GET    /api/technical/products/[id]/history
POST   /api/technical/products/[id]/allergens
DELETE /api/technical/products/[id]/allergens/[allergenId]

// 4. Pages
- List: app/(authenticated)/technical/products/page.tsx
  - Search, filter by type/status, pagination
  - Add Product button
  - Table with columns: Code, Name, Type, Status, Version
- Detail: app/(authenticated)/technical/products/[id]/page.tsx
  - Display all fields
  - Tabs: Details, Allergens, Shelf Life, Version History

// 5. Components
- ProductForm (modal)
- ProductTable (DataTable with ShadCN)
- AllergenList (with add/remove)
- VersionHistory (audit trail)

// 6. Validation (lib/validation/product.ts)
CreateProductSchema
UpdateProductSchema
```

**Tests to pass**: 30 tests in products.spec.ts

**Key Features**:
- ✅ Version auto-increment (FR-2.2)
- ✅ Duplicate code prevention
- ✅ Allergen management
- ✅ Shelf life validation

---

### BOMs Module (10-14 days)

```typescript
// 1. Database (migrations/044, 047 already exist)
// ✅ boms, bom_items, bom_alternatives, bom_by_products tables ready

// 2. Service Layer (lib/services/bom-service.ts)
export class BOMService {
  static async list(orgId: string, filters?: {product, status}): Promise<BOM[]>
  static async create(orgId: string, data: CreateBOMDto): Promise<BOM>
  // Prevent date overlap (FR-2.22)
  static async update(orgId: string, id: string, data: UpdateBOMDto)
  static async clone(orgId: string, id: string, targetProductId: string): Promise<BOM>
  static async addItem(orgId: string, bomId: string, item: BOMItemDto)
  static async updateItem(orgId: string, bomId: string, itemId: string, item: UpdateBOMItemDto)
  static async deleteItem(orgId: string, bomId: string, itemId: string)

  // Cost calculation (FR-2.36)
  static async calculateCost(orgId: string, bomId: string): Promise<CostBreakdown>
}

// 3. API Routes
GET    /api/technical/boms
POST   /api/technical/boms
GET    /api/technical/boms/[id]
PATCH  /api/technical/boms/[id]
DELETE /api/technical/boms/[id]

POST   /api/technical/boms/[id]/clone    // ⭐ FR-2.24
POST   /api/technical/boms/[id]/items
PATCH  /api/technical/boms/[id]/items/[itemId]
DELETE /api/technical/boms/[id]/items/[itemId]
POST   /api/technical/boms/[id]/calculate-cost  // ⭐ FR-2.36

// 4. Pages & Components
- BOM List page
  - Search by product
  - Filter by status
  - Clone button on each row ⭐
- BOM Detail page
  - BOM header (product, dates, status)
  - Items table with add/edit/delete
  - Alternatives modal
  - By-products section
  - Cost summary card ⭐
  - Version comparison (if multiple)

// 5. Validation (lib/validation/bom.ts)
CreateBOMSchema (with date overlap check)
CreateBOMItemSchema (with UoM validation)
```

**Tests to pass**: 36 tests in boms.spec.ts

**Star Features** ⭐:
1. **BOM Clone (FR-2.24)**: Copy entire BOM to new product
2. **Cost Rollup (FR-2.36)**: Calculate material + routing costs
3. **Date Validation (FR-2.22)**: Prevent overlapping effective dates

---

### Routings Module (8-10 days)

```typescript
// 1. Database (migrations/045 already exists)
// ✅ routings, routing_operations tables ready

// 2. Service Layer (lib/services/routing-service.ts)
export class RoutingService {
  static async list(orgId: string, filters?: {isReusable, status}): Promise<Routing[]>
  static async create(orgId: string, data: CreateRoutingDto): Promise<Routing>
  static async update(orgId: string, id: string, data: UpdateRoutingDto)
  static async addOperation(orgId: string, routingId: string, op: OperationDto)
  static async updateOperation(orgId: string, routingId: string, opId: string, op: UpdateOperationDto)
  static async deleteOperation(orgId: string, routingId: string, opId: string)

  // Cost calculation (ADR-009)
  static calculateCost(routing: Routing, operations: Operation[], outputQty: number): RoutingCost
}

// 3. API Routes
GET    /api/technical/routings
POST   /api/technical/routings
GET    /api/technical/routings/[id]
PATCH  /api/technical/routings/[id]

POST   /api/technical/routings/[id]/operations
PATCH  /api/technical/routings/[id]/operations/[opId]
DELETE /api/technical/routings/[id]/operations/[opId]

// 4. Pages
- Routing List
  - Search by code/name
  - Filter by is_reusable, status
  - Clone button
- Routing Detail
  - Cost config: setup_cost, working_cost_per_unit, overhead_percent ⭐
  - Operations table (sequence, machine, times, labor_cost) ⭐
  - Cost summary display

// 5. Validation (lib/validation/routing.ts)
CreateRoutingSchema (unique code)
CreateOperationSchema (unique sequence or parallel allowed)
```

**Tests to pass**: 27 tests in routings.spec.ts

**Star Feature** ⭐:
1. **Routing Costs (ADR-009)**: Setup + working + labor + overhead calculation
   - Setup cost (fixed per batch)
   - Working cost (per unit)
   - Overhead percentage (applied to total)
   - Operation labor costs (time × rate)

---

### Costing Module (6-8 days)

```typescript
// Mostly calculation + display, no new DB tables needed

// 1. Service (lib/services/costing-service.ts)
export class CostingService {
  // Material cost breakdown
  static calculateMaterialCost(bomItems: BOMItem[]): {
    items: Array<{component, qty, unitCost, total}>
    subtotal: number
  }

  // Routing cost (if BOM has routing)
  static calculateRoutingCost(routing: Routing, operations: Operation[], outputQty: number): {
    setupCost: number
    workingCost: number
    laborCost: number
    overhead: number
    total: number
  }

  // Total rollup
  static calculateBOMCost(bom: BOM, items: BOMItem[], routing?: Routing): {
    materialCost: number
    routingCost: number
    totalCost: number
    costPerUnit: number
  }

  // Multi-level rollup (for sub-assemblies)
  static calculateMultiLevelCost(bom: BOM): CostBreakdown
}

// 2. API Route
POST   /api/technical/boms/[id]/calculate-cost

// 3. Components
- CostSummaryCard (BOM detail)
  - Material cost section
  - Routing cost section (if applicable)
  - Total cost display
  - Cost per unit

// 4. Validation
CostCalculationSchema
```

**Tests to pass**: 12 tests in costing.spec.ts

**Note**: 2 tests already passing (cost display UI)
**Remaining**: Detailed breakdown calculations

---

### Dashboard Module (3-4 days)

```typescript
// Mostly quick fixes to already-working module

// 1. Stats Cards (already working)
✅ Total Products count
✅ Active BOMs count
✅ Active Routings count
✅ Products with Allergens

// 2. Fix Performance (TC-DASH-002)
- Optimize queries
- Profile slow operations
- Target: < 2 second load

// 3. Add PDF Export (TC-DASH-007)
- Allergen matrix → PDF
- Use library: jsPDF + html2canvas

// 4. Add Timeline (TC-DASH-008)
- BOM version history timeline
- Show effective date ranges
- Visual timeline component

// 5. Wire Quick Actions (TC-DASH-009)
- Add Product button
- Add BOM button
- Add Routing button
```

**Tests to pass**: 12 tests in dashboard.spec.ts

**Note**: 8 tests already passing!
**Quick wins**:
- PDF export (2 hours)
- Performance optimization (1 day)
- Timeline visualization (copy from Planning module)

---

## Development Workflow

### For Each Module

1. **Read the test file** to understand requirements
   ```bash
   less e2e/tests/technical/[module].spec.ts
   ```

2. **Create database tables** (already exist in migrations)
   ```bash
   # Verify migrations applied
   npx supabase db pull
   npx supabase db push
   ```

3. **Create Zod validation schemas**
   ```bash
   # Create: lib/validation/[module].ts
   # Define: CreateXyzSchema, UpdateXyzSchema
   ```

4. **Build service layer**
   ```bash
   # Create: lib/services/[module]-service.ts
   # Implement: CRUD, calculation logic, validation
   ```

5. **Create API routes**
   ```bash
   # Create: app/api/technical/[resource]/[method]
   # Implement: All endpoints in test plan
   ```

6. **Build components & pages**
   ```bash
   # Create: components/[module]/XyzTable.tsx
   # Create: components/[module]/XyzForm.tsx
   # Create: app/(authenticated)/technical/[module]/page.tsx
   ```

7. **Run tests**
   ```bash
   pnpm test:e2e e2e/tests/technical/[module].spec.ts --reporter=list
   ```

8. **Fix failures one by one**
   - Read test description
   - See what's missing
   - Implement that feature
   - Run test again

---

## Testing Tips

### Run Tests Locally

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run tests with UI (debugging)
pnpm test:e2e --ui e2e/tests/technical/products.spec.ts
```

### Debug Failed Test

```bash
# Run specific test with details
pnpm test:e2e -g "should create product" --reporter=list

# View trace
pnpm exec playwright show-trace test-results/[test-name]/trace.zip
```

### Check Test Structure

```bash
# See all tests in a file
pnpm test:e2e --reporter=list e2e/tests/technical/products.spec.ts
```

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] All tests in module GREEN
- [ ] No regressions (previous modules still GREEN)
- [ ] Code follows patterns (see `.claude/PATTERNS.md`)
- [ ] Database migrations applied
- [ ] RLS policies checked (multi-tenant isolation)
- [ ] Error handling implemented
- [ ] Loading states included
- [ ] Empty states handled
- [ ] 80%+ code coverage

---

## Common Issues & Fixes

### Tests Fail: "Page not found"
**Cause**: Route not created
**Fix**: Create page file in `app/(authenticated)/technical/[module]/page.tsx`

### Tests Fail: "API endpoint not found"
**Cause**: Route not created in app/api/
**Fix**: Create route file in `app/api/technical/[resource]/route.ts`

### Tests Fail: "Data not saved"
**Cause**: Service logic missing
**Fix**: Check service layer, verify API calls match test expectations

### Tests Fail: "Validation error"
**Cause**: Schema mismatch
**Fix**: Compare test data with Zod schema in lib/validation/

### Tests Timeout (> 10 seconds)
**Cause**: Slow queries or missing indexes
**Fix**: Profile with Supabase dashboard, add indexes

---

## Key References

### Test Plan
📄 `.claude/EPIC-02-E2E-TEST-PLAN.md` - Complete test specifications

### Architecture Decision Records
📄 `ADR-009` - Routing cost calculation methodology
📄 `ADR-013` - Multi-tenant RLS policies

### Database Schema
📄 `.claude/TABLES.md` - All table definitions

### Code Patterns
📄 `.claude/PATTERNS.md` - Service layer, API route, component patterns

### PRD
📄 `docs/1-BASELINE/product/modules/technical.md` - Product requirements

---

## Success Metrics

Track weekly progress:

```
Week 1: Product Types (8) → 8 tests GREEN ✅
Week 2: Products (30) → 38 total GREEN ✅
Week 3: BOMs (36) → 74 total GREEN ✅
Week 5: Routings (27) → 101 total GREEN ✅
Week 6: Costing (12) → 113 total GREEN ✅
Week 7: Dashboard (12) → 125 total GREEN ✅
Week 10: All modules → 155 tests GREEN ✅ DONE
```

---

## When You're Stuck

1. **Read the test** - It's your spec
2. **Check the test plan** - It explains what to build
3. **Look at similar modules** - Settings, Planning have examples
4. **Check the database** - Verify table structure
5. **Ask for help** - Blockers should be escalated quickly

---

**Remember**: Tests are your guide. If a test fails, it's telling you exactly what to implement.

**Good luck!** You've got this! 🚀

