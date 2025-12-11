# ✅ BATCH 2 - TODO SUMMARY
**Data:** 2025-11-25
**Wygenerowano na podstawie:** Batch 2A-E Code Review Updates

---

## 📊 OVERVIEW - Co zostało zrobione vs co trzeba zrobić

| Batch | Story | Implementation | Tests | Pozostało |
|-------|-------|----------------|-------|-----------|
| **2A** | 2.1-2.5 (Products) | 95% ✅ | 0% ❌ | Unit/E2E testy, bugfixy |
| **2B** | 2.6-2.14 (BOMs) | 95% ✅ | 0% ❌ | Unit/E2E testy, bugfixy |
| **2C** | 2.15-2.17 (Routing) | 85% ⚠️ | 0% ❌ | **Brakujące testy, FK constraint** |
| **2D** | 2.18-2.24 (Traceability) | 70% ⚠️ | 0% ❌ | **Mock org_id (CRITICAL), testy** |
| **2E** | 2.23-2.24 (Dashboard) | 70% ⚠️ | 0% ❌ | **Mock org_id (CRITICAL), export** |

---

## 🔴 CRITICAL ISSUES (Blocker do Production)

### 1. **Mock org_id w API Routes - SECURITY ISSUE**
**Dotyczy:** Batch 2D, 2E
**Wpływ:** RLS Bypass, cross-org data leakage
**Pliki do naprawy:**
- `app/api/technical/tracing/forward/route.ts:8-9`
- `app/api/technical/tracing/backward/route.ts:8-9`
- `app/api/technical/tracing/recall/route.ts:9`
- `app/api/technical/dashboard/products/route.ts:8`
- `app/api/technical/dashboard/allergen-matrix/route.ts:8`

**Fix:**
```typescript
// ❌ TERAZ:
const orgId = request.headers.get('x-org-id') || 'mock-org-id'

// ✅ POWINNO BYĆ:
import { getServerSession } from '@/lib/auth/session'
const session = await getServerSession()
if (!session?.user?.org_id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const orgId = session.user.org_id
```

---

## ⚠️ HIGH PRIORITY ISSUES

### BATCH 2C - Missing FK Constraint
**Issue:** `product_routings` table brak FK do `products` tabeli
**File:** `lib/supabase/migrations/022_create_product_routings_table.sql:17`
**Action:** Dodać migration:
```sql
ALTER TABLE public.product_routings
  ADD CONSTRAINT product_routings_product_fk
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
```

### BATCH 2C - Sequence Gap After Delete
**Issue:** Usunięcie operacji 2 zostawia gap (1, 3, 4) zamiast resequencja
**Action:** Implementować `resequenceOperations(routingId)` po delete

### BATCH 2D - Batch Number Lookup TODO
**Issue:** Batch lookup w forward/backward trace nie zaimplementowany
**Files:**
- `app/api/technical/tracing/forward/route.ts:14-15`
- `app/api/technical/tracing/backward/route.ts:12-14`
**Action:** Implementować query LP by `batch_number`

### BATCH 2D - Placeholder Implementations
1. **buildTree** - zwraca tylko depth=1, brakuje rekursji
   File: `lib/services/genealogy-service.ts:64-72`

2. **calculateCustomerImpact** - mockowane dane
   File: `lib/services/recall-service.ts:282-297`
   Action: Join z `shipments` table

3. **calculateFinancialImpact** - hardcoded costs
   File: `lib/services/recall-service.ts:299-318`
   Action: Integracja z product costs

### BATCH 2E - Export Feature NOT IMPLEMENTED
**Issue:** AC-2.24.7 (Export to Excel/CSV/PDF) pokazuje placeholder
**File:** `app/(authenticated)/technical/products/allergens/page.tsx:157-166`
**Action:** Implementować prawdziwy export (3+ godziny pracy)

### BATCH 2E - Recent Activity Empty
**Issue:** AC-2.23.6 - `recent_changes` w dashboard zawsze puste
**File:** `lib/services/dashboard-service.ts:96`
**Action:** Populate z `/api/technical/dashboard/recent-activity` lub update ACs

---

## 📋 BATCH 2A - TODO (Products CRUD)

### ✅ Co jest DONE
- Lista produktów z tabelą, search, filtry, sortowanie, paginacja
- Product CRUD (Create, Detail, Edit, Delete)
- Product Version History z timeline & compare
- Allergen Assignment z validation
- Product Types Configuration

### ❌ Co trzeba zrobić
- [ ] **Unit testy** dla ProductFormModal validation (~15 testów)
- [ ] **E2E testy** - Create → View → Edit → Delete flow
- [ ] Dodać aria-labels dla accessibility
- [ ] Refactor: Extract ProductTable jako osobny komponent
- [ ] Dodać Storybook stories
- [ ] i18n support (hardcoded English strings)
- [ ] Bulk operations (multi-select delete)
- [ ] Export to CSV

---

## 📋 BATCH 2B - TODO (BOMs)

### ✅ Co jest DONE
- BOM CRUD (List, Create, Detail, Edit, Delete)
- BOM Items Management (Add, Edit, Delete)
- Timeline Visualization z status colors
- Clone BOM z date validation
- Compare Versions z diff view
- Conditional Flags (AND/OR logic)
- By-Products w Items
- Allergen Inheritance Display

### ❌ Co trzeba zrobić
- [ ] **Unit testy** dla BOMItemFormModal validation (~20 testów)
- [ ] **Integration testy** dla BOM CRUD API
- [ ] **E2E testy** - Create → Add Items → Clone → Compare flow
- [ ] Dodać aria-labels dla accessibility
- [ ] Extract BOMItemsTable jako osobny komponent
- [ ] Dodać Storybook stories
- [ ] Drag-drop reordering dla items (sequence)
- [ ] i18n support
- [ ] Export BOM to PDF/Excel
- [ ] Bulk operations
- [ ] ⚠️ Implementować transakcje z `FOR UPDATE` lock dla concurrent reorder

---

## 📋 BATCH 2C - TODO (Routing Module)

### ✅ Co jest DONE
- Routing CRUD (List, Create, Detail, Edit, Delete)
- Routing Operations CRUD (Add, Edit, Delete, Drag-drop reorder)
- Product-Routing Assignment (Multiple products, Default routing trigger)
- RLS & role-based access (Admin/Technical)

### ❌ Co trzeba zrobić - CRITICAL
- [ ] **ADD FK CONSTRAINT** - product_routings → products (HIGH)
- [ ] **Unit testy** dla routings API (~15 testów)
- [ ] **Validation testy** dla routing-schemas (~15 testów)
- [ ] **Component testy** dla OperationsTable drag-drop

### Co trzeba zrobić - MEDIUM
- [ ] Implementować `resequenceOperations()` po delete
- [ ] Dodać pagination do routings list page (będzie problem z dużą liczbą)
- [ ] Dodać cross-org validation dla product assignments
- [ ] Dodać rate limiting do API routes
- [ ] Implementować structured logging zamiast console.error
- [ ] Dodać XSS sanitization dla description fields

### Co trzeba zrobić - LOW
- [ ] Transakcje z `FOR UPDATE` lock dla concurrent reorder
- [ ] Lepsze error messages dla UX
- [ ] Dodać aria-labels
- [ ] Storybook stories

---

## 📋 BATCH 2D - TODO (Traceability & Genealogy)

### ✅ Co jest DONE
- Forward Traceability (recursive CTE)
- Backward Traceability (recursive CTE)
- Recall Simulation core logic
- Genealogy Tree View z React Flow
- Product Dashboard (grouping, stats)
- Allergen Matrix Visualization

### ❌ Co trzeba zrobić - CRITICAL
- [ ] **Replace mock org_id with auth** (HIGH - SECURITY)
- [ ] **Implement batch_number lookup** (HIGH)
- [ ] **Unit testy** dla genealogy-service (~15 testów)
- [ ] **Unit testy** dla recall-service (~20 testów)
- [ ] **Unit testy** dla dashboard-service (~10 testów)
- [ ] **API integration testy** (~15 testów)

### Co trzeba zrobić - MEDIUM
- [ ] Implementować pełne buildTree z recursją (depth > 1)
- [ ] Implementować real calculateCustomerImpact (join shipments)
- [ ] Implementować real calculateFinancialImpact (product costs)
- [ ] Replace `error: any` z `unknown` + type guards
- [ ] Type `saveSimulation` parametry
- [ ] Dodać rate limiting do recall simulation
- [ ] Audit logging dla recall simulations (FDA compliance)

### Co trzeba zrobić - LOW
- [ ] Replace console.error z logging service
- [ ] Dodać error boundary do tracing page
- [ ] Dodać loading states dla GenealogyTree (skeleton loader)
- [ ] Redis caching dla product dashboard
- [ ] Query result caching
- [ ] Virtualization dla large trees

---

## 📋 BATCH 2E - TODO (Dashboard & Allergen Matrix)

### ✅ Co jest DONE
- Dashboard UI (95% complete) - cards, grouping, filters, search
- Allergen Matrix UI (90% complete) - color-coded, filterable, paginated
- Allergen Insights cards (top 5)
- EU mandatory allergen marking

### ❌ Co trzeba zrobić - CRITICAL
- [ ] **Replace mock org_id with auth** (HIGH - SECURITY)
- [ ] **Implement export feature** - Excel/CSV/PDF (AC-2.24.7)
- [ ] **Comprehensive test suite** (minimum 40 testów)

### Co trzeba zrobić - MEDIUM
- [ ] Poprawić recent activity integration (AC-2.23.6)
- [ ] Lepsze error handling w services i routes
- [ ] Input validation dla search parameters
- [ ] Database-level filtering (nie client-side)
- [ ] Inline editing dla allergen status (AC-2.24.8)
- [ ] Query parameter validation (limit, page)
- [ ] XSS protection dla search

### Co trzeba zrobić - LOW
- [ ] Remove `any` types (type safety)
- [ ] Redis caching dla dashboard
- [ ] API rate limiting
- [ ] Database query logging
- [ ] Allergen insights configurable (teraz max 5)
- [ ] Better pagination handling

---

## 🎯 DZIAŁANIA DO WYKONANIA - PRIORITY ORDER

### WEEK 1 - CRITICAL PATH (Musi być zrobione)

#### Day 1-2: Security Fixes (Batch 2D, 2E)
```bash
# 1. Fix mock org_id w Batch 2D
- app/api/technical/tracing/forward/route.ts
- app/api/technical/tracing/backward/route.ts
- app/api/technical/tracing/recall/route.ts

# 2. Fix mock org_id w Batch 2E
- app/api/technical/dashboard/products/route.ts
- app/api/technical/dashboard/allergen-matrix/route.ts

# 3. Add FK constraint w Batch 2C
- New migration: ALTER TABLE product_routings ADD FK
```

#### Day 2-3: Missing Implementations (Batch 2D, 2E)
```bash
# 1. Batch 2D - Implement batch_number lookup
- forward/route.ts
- backward/route.ts

# 2. Batch 2E - Implement export feature
- allergen-matrix/route.ts (new endpoint)
- allergens/page.tsx (export UI)

# 3. Batch 2D - Implement full buildTree recursion
- genealogy-service.ts
```

#### Day 3-5: Tests for CRITICAL Batch 2C
```bash
# 1. API tests dla routing CRUD
__tests__/api/technical/routings.test.ts

# 2. Validation tests
__tests__/lib/validation/routing-schemas.test.ts

# 3. Component tests
__tests__/components/routings/*.test.tsx
```

### WEEK 2 - QUALITY & TESTING (Should be done)

#### Day 6-8: Tests for Batch 2D
```bash
# 1. genealogy-service.test.ts (~15 tests)
# 2. recall-service.test.ts (~20 tests)
# 3. dashboard-service.test.ts (~10 tests)
# 4. API integration tests (~15 tests)
```

#### Day 9-10: Tests for Batch 2E
```bash
# Minimum 40 unit + integration + E2E tests
```

### WEEK 3 - REMAINING (Nice to have, można odkładać)

#### Batch 2A & 2B - Full test coverage + refactors
#### Batch 2C-2E - Error handling, accessibility, optimization

---

## 📌 QUICK CHECKLIST

### ✅ DONE
- [x] Batch 2A - Frontend 95% (Products)
- [x] Batch 2B - Frontend 95% (BOMs)
- [x] Batch 2C - Frontend/Backend 85% (Routing)
- [x] Batch 2D - Frontend 70%, Backend 70% (Traceability)
- [x] Batch 2E - Frontend 70%, Backend 70% (Dashboard)

### ❌ TODO - CRITICAL ONLY
- [ ] Replace mock org_id (Batch 2D, 2E) - **SECURITY**
- [ ] Add FK constraint (Batch 2C) - **DATA INTEGRITY**
- [ ] Implement batch_number lookup (Batch 2D) - **FEATURE**
- [ ] Implement export feature (Batch 2E) - **FEATURE**
- [ ] Full test suite (All batches) - **QUALITY GATE**

---

## 📈 Estimated Effort

| Task | Estimated Time | Priority |
|------|-----------------|----------|
| Fix mock org_id (security) | 4-6 hours | CRITICAL |
| Add FK constraint | 1 hour | CRITICAL |
| Batch lookup impl | 2 hours | HIGH |
| Export feature | 3-4 hours | HIGH |
| Batch 2C tests | 6-8 hours | HIGH |
| Batch 2D tests | 8-10 hours | HIGH |
| Batch 2E tests | 10-12 hours | HIGH |
| All other improvements | 20+ hours | MEDIUM/LOW |
| **TOTAL** | **~55-70 hours** | - |

---

## 🎯 PRODUCTION READINESS CHECKLIST

- [ ] All mock org_id replaced with real auth
- [ ] All FK constraints added
- [ ] All placeholder implementations done
- [ ] Minimum test coverage: 50% (all batches)
- [ ] All critical issues fixed
- [ ] Security audit passed
- [ ] Error handling improved (400/500 status codes)
- [ ] Input validation added
- [ ] Documentation updated
- [ ] Type safety improved (no `any` types)
- [ ] Storybook stories added (optional)

---

*Ostatnia aktualizacja: 2025-11-25*
*Na podstawie: BATCH-2A/B/C/D/E Code Review Updates*
