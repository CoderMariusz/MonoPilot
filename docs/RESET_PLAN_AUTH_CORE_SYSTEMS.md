# RESET PLAN: Authentication & Core Systems Rebuild

**Status:** Planning Phase
**Created:** 2025-11-16
**Priority:** P0 - CRITICAL
**Reason:** Auth system padł, tabele nie działają - full reset needed

---

## Problem Statement

### Current Issues
1. **Authentication System Down** - System auth całkowicie nie działa
2. **Tables Not Working** - Wszystkie tabele broken
3. **API Payloads Missing** - Ryzyko że niektóre API endpoints missing

### Root Cause Analysis
- Previous incremental changes created cascading failures
- Auth middleware conflicts
- Session management broken
- API payload validation issues
- Type mismatches across layers

### Decision: Full Reset Strategy
✅ **Rebuild from scratch** - Similar to Story 0.8 database reset
✅ **Systematic approach** - Document every step
✅ **No skipping** - Ensure all API payloads covered
✅ **Test-driven** - E2E tests for each rebuilt component

---

## Reset Scope

### Phase 1: Authentication System (CRITICAL - Day 1)
**Goal:** Working login/logout/session management

#### Tasks:
- [ ] **Task 1.1:** Audit current auth flow (Supabase Auth + middleware)
- [ ] **Task 1.2:** Clean up auth middleware (`apps/frontend/middleware.ts`)
- [ ] **Task 1.3:** Rebuild login page (`app/login/page.tsx`)
- [ ] **Task 1.4:** Rebuild signup page (`app/signup/page.tsx`)
- [ ] **Task 1.5:** Fix session management (cookies, JWT refresh)
- [ ] **Task 1.6:** Test auth flow (E2E: login → protected route → logout)
- [ ] **Task 1.7:** Fix protected routes (redirect logic)

**Acceptance Criteria:**
- ✅ User can login with email/password
- ✅ Session persists across page refreshes
- ✅ Protected routes redirect to /login when not authenticated
- ✅ Logout clears session and redirects
- ✅ E2E test passes: `e2e/01-auth.spec.ts`

**Files to Rebuild:**
```
apps/frontend/
├── middleware.ts                    # Auth middleware (session refresh)
├── app/(auth)/login/page.tsx        # Login page
├── app/(auth)/signup/page.tsx       # Signup page
├── lib/auth/
│   ├── supabase-client.ts          # Browser client
│   ├── supabase-server.ts          # Server client
│   └── session.ts                  # Session helpers
└── e2e/01-auth.spec.ts             # Auth E2E tests
```

---

### Phase 2: Core API Layer Rebuild (Day 2-3)
**Goal:** All 28 API classes working with proper types

#### Systematic Approach:
1. **Inventory all API classes** - List all 28 APIs
2. **Define payload schemas** - Zod schemas for each API
3. **Rebuild one API at a time** - Test each before moving to next
4. **Document API contracts** - Update API_REFERENCE.md automatically

#### Priority Order (Based on Dependencies):
```
Tier 1 (Foundation - No dependencies):
  1. OrganizationsAPI
  2. UsersAPI
  3. WarehousesAPI
  4. LocationsAPI
  5. SuppliersAPI
  6. MachinesAPI
  7. ProductionLinesAPI
  8. AllergensAPI
  9. TaxCodesAPI

Tier 2 (Product & Technical):
  10. ProductsAPI
  11. BomsAPI
  12. BomItemsAPI
  13. RoutingsAPI
  14. RoutingOperationsAPI

Tier 3 (Planning):
  15. PurchaseOrdersAPI
  16. POLineAPI
  17. TransferOrdersAPI
  18. TOLineAPI
  19. WorkOrdersAPI
  20. WOMaterialsAPI
  21. WOOperationsAPI

Tier 4 (Warehouse & Production):
  22. ASNsAPI
  23. GRNsAPI
  24. LicensePlatesAPI
  25. ProductionOutputsAPI
  26. StockMovesAPI

Tier 5 (Support):
  27. AuditAPI
  28. TraceabilityAPI
```

#### Template for Each API Rebuild:

**Example: ProductsAPI**

```typescript
// Step 1: Define Zod schema
const ProductSchema = z.object({
  id: z.number(),
  part_number: z.string(),
  description: z.string(),
  product_type: z.enum(['RM_MEAT', 'DG_WEB', 'FG', 'PR', ...]),
  uom: z.string(),
  allergens: z.array(z.string()).default([]),
  org_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Step 2: Define API class
export class ProductsAPI {
  static async getAll(filters?: ProductFilters): Promise<Product[]> {
    // Implementation
  }

  static async getById(id: number): Promise<Product | null> {
    // Implementation
  }

  static async create(data: CreateProductInput): Promise<Product> {
    // Validate with Zod before sending
    // Return validated response
  }

  static async update(id: number, data: UpdateProductInput): Promise<Product> {
    // Implementation
  }

  static async delete(id: number): Promise<void> {
    // Implementation
  }
}

// Step 3: Write unit tests
describe('ProductsAPI', () => {
  it('should fetch all products', async () => {
    const products = await ProductsAPI.getAll();
    expect(Array.isArray(products)).toBe(true);
  });

  it('should create product with valid data', async () => {
    const newProduct = await ProductsAPI.create({
      part_number: 'TEST-001',
      description: 'Test Product',
      product_type: 'FG',
      uom: 'KG',
    });
    expect(newProduct.id).toBeDefined();
  });
});

// Step 4: Write E2E tests
test('Products CRUD workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', TEST_USER_EMAIL);
  await page.fill('[name="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Navigate to products
  await page.goto('/technical/products');

  // Create product
  await page.click('button:has-text("Add Product")');
  await page.fill('[name="part_number"]', 'E2E-TEST-001');
  await page.fill('[name="description"]', 'E2E Test Product');
  await page.click('button:has-text("Save")');

  // Verify product appears in table
  await expect(page.getByText('E2E-TEST-001')).toBeVisible();
});
```

#### Tasks per API:
For **each of 28 APIs**, complete these steps:

- [ ] **Step 1:** Define Zod schema for all types
- [ ] **Step 2:** Rebuild API class with all methods
- [ ] **Step 3:** Write unit tests (vitest)
- [ ] **Step 4:** Write E2E tests (playwright)
- [ ] **Step 5:** Update API_REFERENCE.md (via `pnpm docs:update`)
- [ ] **Step 6:** Verify TypeScript types match database schema
- [ ] **Step 7:** Test in UI (manual smoke test)

---

### Phase 3: UI Layer Rebuild (Day 4-5)
**Goal:** All pages/tables working with proper data flow

#### Approach:
1. **Audit all pages** - Find all route files
2. **Test data fetching** - Ensure API calls work
3. **Fix table components** - AllergensTable, ProductsTable, etc.
4. **Verify forms** - Create/Edit modals

#### Page Inventory:
```
apps/frontend/app/
├── dashboard/page.tsx                    # Main dashboard
├── technical/
│   ├── products/page.tsx                 # Products list
│   ├── boms/page.tsx                     # BOMs list
│   ├── allergens/
│   │   ├── page.tsx                      # Allergens list
│   │   └── matrix/page.tsx               # Allergen matrix (Story 1.6.3)
│   └── routings/page.tsx                 # Routings list
├── planning/
│   ├── purchase-orders/page.tsx          # PO list
│   ├── transfer-orders/page.tsx          # TO list
│   └── work-orders/page.tsx              # WO list
├── production/
│   ├── work-orders/page.tsx              # WO execution
│   └── outputs/page.tsx                  # Production outputs
├── warehouse/
│   ├── license-plates/page.tsx           # LP list
│   ├── grn/page.tsx                      # GRN receiving
│   └── stock-moves/page.tsx              # Stock movements
├── scanner/
│   ├── consume/page.tsx                  # Material consumption
│   ├── output/page.tsx                   # Output registration
│   └── move/page.tsx                     # Stock movements
└── settings/
    ├── warehouses/page.tsx               # Warehouse settings
    ├── locations/page.tsx                # Location settings
    ├── machines/page.tsx                 # Machine settings
    ├── suppliers/page.tsx                # Supplier settings
    ├── users/page.tsx                    # User management
    ├── allergen-rules/page.tsx           # Allergen rules (Story 1.6.3)
    └── audit-logs/page.tsx               # Audit logs (Story 1.1)
```

#### Tasks per Page:
- [ ] **Verify page loads** (no white screen)
- [ ] **Test data fetching** (API call succeeds)
- [ ] **Check table displays** (rows render)
- [ ] **Test CRUD operations** (Create/Edit/Delete)
- [ ] **Verify navigation** (links work)

---

### Phase 4: E2E Test Suite (Day 6)
**Goal:** 100% test coverage for critical paths

#### Test Coverage Plan:
```
e2e/
├── 01-auth.spec.ts                       # Login/Logout/Session
├── 02-purchase-orders.spec.ts            # PO CRUD
├── 03-transfer-orders.spec.ts            # TO CRUD
├── 04-license-plates.spec.ts             # LP CRUD
├── 05-settings.spec.ts                   # Settings pages
├── 06-grn-receiving.spec.ts              # GRN workflow
├── 07-work-orders.spec.ts                # WO CRUD
├── 08-production-output.spec.ts          # Output registration
├── 09-traceability.spec.ts               # Forward/Backward trace
├── 10-allergen-matrix.spec.ts            # Story 1.6.3
└── 11-audit-logs.spec.ts                 # Story 1.1
```

#### Test Execution:
- [ ] Run all E2E tests: `pnpm test:e2e`
- [ ] Fix failures one by one
- [ ] Document known issues
- [ ] Create GitHub issues for deferred bugs

---

## Execution Plan

### Day 1: Authentication System
**Time:** 6-8 hours

1. Kill all running processes
2. Clean database (optional - depends on auth tables)
3. Rebuild auth middleware
4. Rebuild login/signup pages
5. Test auth flow E2E
6. Commit: `fix(auth): Rebuild authentication system from scratch`

**Deliverable:** Working login/logout

---

### Day 2-3: Core API Layer
**Time:** 12-16 hours (2 days)

**Day 2 Morning:** Tier 1 APIs (Foundation)
- OrganizationsAPI
- UsersAPI
- WarehousesAPI
- LocationsAPI
- SuppliersAPI
- MachinesAPI
- ProductionLinesAPI
- AllergensAPI
- TaxCodesAPI

**Day 2 Afternoon:** Tier 2 APIs (Product & Technical)
- ProductsAPI
- BomsAPI
- BomItemsAPI
- RoutingsAPI
- RoutingOperationsAPI

**Day 3 Morning:** Tier 3 APIs (Planning)
- PurchaseOrdersAPI
- POLineAPI
- TransferOrdersAPI
- TOLineAPI
- WorkOrdersAPI
- WOMaterialsAPI
- WOOperationsAPI

**Day 3 Afternoon:** Tier 4 APIs (Warehouse & Production)
- ASNsAPI
- GRNsAPI
- LicensePlatesAPI
- ProductionOutputsAPI
- StockMovesAPI

**Day 3 Evening:** Tier 5 APIs (Support)
- AuditAPI
- TraceabilityAPI

**Deliverable:** All 28 APIs working with tests

---

### Day 4-5: UI Layer
**Time:** 12-16 hours (2 days)

**Systematic Page Testing:**
1. Login → Dashboard (smoke test)
2. Technical module (Products, BOMs, Allergens, Routings)
3. Planning module (PO, TO, WO)
4. Production module (WO execution, Outputs)
5. Warehouse module (LP, GRN, Moves)
6. Scanner module (Consume, Output, Move)
7. Settings module (All settings pages)

**Deliverable:** All pages loading and functional

---

### Day 6: E2E Tests
**Time:** 6-8 hours

1. Run full E2E suite
2. Fix failures
3. Document issues
4. Create regression prevention plan

**Deliverable:** Green E2E test suite

---

## Validation Checklist

Before declaring reset complete:

### Authentication ✅
- [ ] Login works
- [ ] Logout works
- [ ] Session persists
- [ ] Protected routes redirect
- [ ] E2E auth test passes

### API Layer ✅
- [ ] All 28 APIs have Zod schemas
- [ ] All APIs have unit tests
- [ ] All APIs have TypeScript types
- [ ] `pnpm docs:update` succeeds
- [ ] `pnpm type-check` passes (0 errors)

### UI Layer ✅
- [ ] All pages load without errors
- [ ] All tables display data
- [ ] All forms submit successfully
- [ ] Navigation works

### Testing ✅
- [ ] `pnpm test:unit` passes (95%+ coverage)
- [ ] `pnpm test:e2e` passes (all critical paths)
- [ ] Manual smoke test complete

### Documentation ✅
- [ ] API_REFERENCE.md updated
- [ ] DATABASE_SCHEMA.md updated
- [ ] architecture.md reflects current state
- [ ] RESET_PLAN_AUTH_CORE_SYSTEMS.md updated with results

---

## Risk Mitigation

### Backup Strategy
1. **Git branch:** Create `feature/reset-auth-core-systems`
2. **Database backup:** `pg_dump` before any schema changes
3. **Incremental commits:** Commit after each phase
4. **Rollback plan:** Keep `main` branch untouched until validation complete

### Communication Plan
- Document all breaking changes
- Update team on progress daily
- Flag blockers immediately

---

## Success Criteria

**Definition of Done:**
1. ✅ Authentication system fully functional
2. ✅ All 28 APIs working with tests
3. ✅ All UI pages loading and functional
4. ✅ E2E test suite green
5. ✅ TypeScript compilation 0 errors
6. ✅ Documentation up-to-date

**Metrics:**
- Auth flow: <2s login time
- API response: <200ms p95
- Page load: <1s p95
- Test coverage: >95% unit, 100% E2E critical paths

---

## Next Steps

**IMMEDIATE (Now):**
1. Create feature branch: `git checkout -b feature/reset-auth-core-systems`
2. Start Phase 1: Authentication System
3. Use TodoWrite to track tasks

**AFTER RESET:**
1. Resume Story 1.6.3 verification
2. Continue Epic 1.6 (Settings UX Redesign)
3. Move to Epic 1.7 (Scanner Module)

---

## Notes

- This is a **systematic rebuild**, not a quick fix
- **No shortcuts** - we rebuild properly from scratch
- **Test everything** - no untested code
- **Document everything** - architecture.md is source of truth
- **Similar to Story 0.8** - database reset approach worked, apply same rigor here

**Remember:** Fast rebuild = slow long-term. Do it right once.
