# Batch 2D Code Review - Senior Developer Review (AI)

**Projekt:** MonoPilot
**Reviewer:** Mariusz
**Data:** 2025-11-25
**Review Type:** Ad-Hoc Code Review
**Stories:** 2.18-2.24 (Traceability & Dashboard)

---

## 1. Summary

Batch 2D implementuje funkcjonalność śledzenia genealogii produktów (forward/backward traceability), symulacji recall oraz dashboardów produktowych z matrycą alergenów. Implementacja jest **funkcjonalnie kompletna** ale posiada **krytyczne braki w zakresie bezpieczeństwa, testów i niektórych funkcji**.

---

## 2. Outcome

### 🟡 **CHANGES REQUESTED**

**Uzasadnienie:**
- 4 HIGH severity issues (bezpieczeństwo, brakujące implementacje)
- 6 MEDIUM severity issues (typy, placeholder code)
- ZERO testów jednostkowych/integracyjnych
- Kilka TODO comments wskazujących na niekompletne funkcje

---

## 3. Key Findings

### 🔴 HIGH Severity

| # | Finding | File | Line | Action |
|---|---------|------|------|--------|
| H-1 | **Mock org_id we wszystkich API routes** - Krytyczny problem bezpieczeństwa. Używany hardcoded `'mock-org-id'` zamiast pobrania z sesji auth | `app/api/technical/tracing/forward/route.ts` | 8-9 | Implementacja pobierania org_id z Supabase auth session |
| H-2 | **Mock org_id** (duplicate) | `app/api/technical/tracing/backward/route.ts` | 8-9 | j.w. |
| H-3 | **Mock org_id** (duplicate) | `app/api/technical/tracing/recall/route.ts` | 9 | j.w. |
| H-4 | **Mock org_id** (duplicate) | `app/api/technical/dashboard/products/route.ts` | 8 | j.w. |
| H-5 | **Mock org_id** (duplicate) | `app/api/technical/dashboard/allergen-matrix/route.ts` | 8 | j.w. |
| H-6 | **Batch number lookup nie zaimplementowany** - TODO comment, funkcja rzuca błąd | `forward/route.ts`, `backward/route.ts` | 14-15 | Implementacja query LP by batch_number |
| H-7 | **ZERO testów jednostkowych** dla wszystkich plików Batch 2D | - | - | Dodanie test suite |

### 🟠 MEDIUM Severity

| # | Finding | File | Line | Action |
|---|---------|------|------|--------|
| M-1 | **`error: any` pattern** we wszystkich catch blocks - brak type safety | Wszystkie route.ts | - | Użycie `unknown` i type guard |
| M-2 | **`saveSimulation(supabase: any, data: any)`** - brak typowania parametrów | `recall-service.ts` | 350 | Dodanie interfejsów |
| M-3 | **Placeholder calculateCustomerImpact** - zwraca mockowane dane zamiast rzeczywistych shipments | `recall-service.ts` | 282-297 | Implementacja join z shipments table |
| M-4 | **Placeholder calculateFinancialImpact** - hardcoded costs ($10/unit, $50/customer) | `recall-service.ts` | 299-318 | Integracja z product costs |
| M-5 | **Uproszczona buildTree funkcja** - zwraca tylko depth=1, nie buduje pełnego drzewa | `genealogy-service.ts` | 64-72 | Implementacja rekursywnego budowania drzewa |
| M-6 | **`n: any` w map callbacks** | `genealogy-service.ts` | 31, 59 | Dodanie typów dla node |

### 🟢 LOW Severity

| # | Finding | File | Line | Action |
|---|---------|------|------|--------|
| L-1 | **console.error w production code** | `recall/route.ts` | 18 | Użycie proper logging service |
| L-2 | **Brak error boundary w UI** | `tracing/page.tsx` | - | Dodanie error boundary component |
| L-3 | **Brak loading states dla tree visualization** | `GenealogyTree.tsx` | - | Dodanie skeleton loader |

---

## 4. Files Reviewed

### API Routes
| File | Status | Notes |
|------|--------|-------|
| `app/api/technical/tracing/forward/route.ts` | ⚠️ Partial | Mock org_id, TODO batch lookup |
| `app/api/technical/tracing/backward/route.ts` | ⚠️ Partial | Mock org_id, TODO batch lookup |
| `app/api/technical/tracing/recall/route.ts` | ⚠️ Partial | Mock org_id |
| `app/api/technical/dashboard/products/route.ts` | ⚠️ Partial | Mock org_id |
| `app/api/technical/dashboard/allergen-matrix/route.ts` | ⚠️ Partial | Mock org_id |

### Services
| File | Status | Notes |
|------|--------|-------|
| `lib/services/genealogy-service.ts` | ⚠️ Partial | Uproszczona buildTree |
| `lib/services/recall-service.ts` | ⚠️ Partial | Placeholder implementations |
| `lib/services/dashboard-service.ts` | ✅ OK | Działa poprawnie |

### Types & Validation
| File | Status | Notes |
|------|--------|-------|
| `lib/types/traceability.ts` | ✅ OK | Kompletne typy |
| `lib/types/dashboard.ts` | ✅ OK | Kompletne typy |
| `lib/validation/tracing-schemas.ts` | ✅ OK | Poprawna walidacja Zod |
| `lib/validation/dashboard-schemas.ts` | ✅ OK | Poprawna walidacja Zod |

### UI Components
| File | Status | Notes |
|------|--------|-------|
| `app/(authenticated)/technical/tracing/page.tsx` | ✅ OK | Typy naprawione |
| `app/(authenticated)/technical/dashboard/page.tsx` | ✅ OK | Typy naprawione |
| `app/(authenticated)/technical/products/allergens/page.tsx` | ✅ OK | Typy naprawione |
| `components/technical/GenealogyTree.tsx` | ✅ OK | React Flow integration |
| `components/technical/LPNode.tsx` | ✅ OK | Custom node component |

---

## 5. Test Coverage and Gaps

### Current Coverage: **0%**

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| Forward Traceability API | ❌ None | ❌ None | ❌ None |
| Backward Traceability API | ❌ None | ❌ None | ❌ None |
| Recall Simulation API | ❌ None | ❌ None | ❌ None |
| Product Dashboard API | ❌ None | ❌ None | ❌ None |
| Allergen Matrix API | ❌ None | ❌ None | ❌ None |
| Genealogy Service | ❌ None | ❌ None | - |
| Recall Service | ❌ None | ❌ None | - |
| Dashboard Service | ❌ None | ❌ None | - |
| GenealogyTree Component | ❌ None | - | ❌ None |

### Required Test Cases (Priority Order)

1. **genealogy-service.test.ts** (~15 tests)
   - traceForward with valid LP
   - traceForward with invalid LP (error handling)
   - traceBackward with valid LP
   - buildTree with multiple depths
   - Edge case: circular references prevention

2. **recall-service.test.ts** (~20 tests)
   - simulateRecall with lp_id
   - simulateRecall with batch_number
   - calculateRecallSummary accuracy
   - analyzeLocations grouping
   - saveSimulation persistence
   - getSimulationHistory pagination

3. **dashboard-service.test.ts** (~10 tests)
   - getProductDashboard grouping by type
   - getAllergenMatrix with filters
   - Empty data handling

4. **API Route Integration Tests** (~15 tests)
   - Auth validation (org_id from session)
   - Input validation (Zod schemas)
   - Error responses

---

## 6. Architectural Alignment

### Tech Spec Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Forward trace via recursive CTE | ✅ | `supabase.rpc('trace_forward')` |
| Backward trace via recursive CTE | ✅ | `supabase.rpc('trace_backward')` |
| Recall simulation with financial impact | ⚠️ Partial | Placeholder costs |
| Product dashboard with grouping | ✅ | `getProductDashboard()` |
| Allergen matrix visualization | ✅ | `getAllergenMatrix()` |
| React Flow for genealogy tree | ✅ | `GenealogyTree.tsx` |

### Architecture Violations

| # | Violation | Severity | Recommendation |
|---|-----------|----------|----------------|
| AV-1 | Mock org_id bypasses RLS | HIGH | Use `getServerSession()` or Supabase auth |
| AV-2 | Admin client used without auth check | MEDIUM | Add auth middleware |

---

## 7. Security Notes

### 🔴 Critical Security Issues

1. **RLS Bypass via Mock org_id**
   - All API routes use `x-org-id` header fallback to `'mock-org-id'`
   - This completely bypasses Row Level Security
   - Any user could access any organization's data
   - **Fix:** Get org_id from authenticated session:
   ```typescript
   import { getServerSession } from '@/lib/auth/session'

   const session = await getServerSession()
   if (!session?.user?.org_id) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   const orgId = session.user.org_id
   ```

2. **No Input Sanitization for batch_number**
   - When implemented, batch_number lookup must prevent SQL injection
   - Current Zod validation is good but DB query must use parameterized queries

### 🟡 Medium Security Issues

1. **Error Messages Expose Internal Details**
   - `error.message` returned directly to client
   - Could leak DB schema or internal paths
   - **Fix:** Generic error messages in production

---

## 8. Best-Practices and References

### Next.js 15 App Router
- [Server Components Auth](https://nextjs.org/docs/app/building-your-application/authentication)
- Recommendation: Use `cookies()` for session management

### Supabase RLS
- [Row Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security)
- All queries MUST respect org_id from authenticated user

### TypeScript Best Practices
- [Error Handling](https://typescript-eslint.io/rules/no-explicit-any/)
- Replace `error: any` with `error: unknown` and type guards

### React Flow
- [Custom Nodes](https://reactflow.dev/docs/api/nodes/custom-nodes/)
- LPNode implementation is correct

---

## 9. Action Items

### Code Changes Required

- [ ] **[High]** Replace mock org_id with auth session in all 5 API routes [file: `app/api/technical/tracing/*/route.ts`]
- [ ] **[High]** Implement batch_number lookup in forward/backward trace [file: `forward/route.ts:14-15`, `backward/route.ts:12-14`]
- [ ] **[High]** Add test suite for genealogy-service (~15 tests) [file: `__tests__/services/genealogy-service.test.ts`]
- [ ] **[High]** Add test suite for recall-service (~20 tests) [file: `__tests__/services/recall-service.test.ts`]
- [ ] **[High]** Add test suite for dashboard-service (~10 tests) [file: `__tests__/services/dashboard-service.test.ts`]
- [ ] **[Med]** Replace `error: any` with `unknown` and type guards in all routes [file: All route.ts files]
- [ ] **[Med]** Type `saveSimulation` parameters [file: `recall-service.ts:350`]
- [ ] **[Med]** Implement proper buildTree for nested hierarchy [file: `genealogy-service.ts:64-72`]
- [ ] **[Med]** Implement real calculateCustomerImpact with shipments join [file: `recall-service.ts:282-297`]
- [ ] **[Med]** Integrate product costs into calculateFinancialImpact [file: `recall-service.ts:299-318`]
- [ ] **[Low]** Replace console.error with logging service [file: `recall/route.ts:18`]
- [ ] **[Low]** Add error boundary to tracing page [file: `tracing/page.tsx`]

### Advisory Notes

- Note: Consider adding rate limiting for recall simulation (expensive operation)
- Note: Add audit logging for recall simulations (FDA compliance)
- Note: Consider caching product dashboard results (Redis)
- Note: GenealogyTree component could benefit from virtualization for large trees

---

## 10. Story Coverage Summary

| Story | Implementation | Tests | Overall |
|-------|----------------|-------|---------|
| 2.18 Forward Traceability | 80% (mock org_id, TODO batch) | 0% | ⚠️ Partial |
| 2.19 Backward Traceability | 80% (mock org_id, TODO batch) | 0% | ⚠️ Partial |
| 2.20 Recall Simulation | 70% (placeholder costs/customers) | 0% | ⚠️ Partial |
| 2.21 Genealogy Tree View | 90% (UI complete) | 0% | ⚠️ Partial |
| 2.22 Technical Settings | Not in scope | - | - |
| 2.23 Product Dashboard | 95% | 0% | ⚠️ Partial |
| 2.24 Allergen Matrix | 95% | 0% | ⚠️ Partial |

---

## 11. Conclusion

Batch 2D implementacja jest funkcjonalnie dobra, ale wymaga:

1. **Natychmiastowa naprawa** mock org_id (bezpieczeństwo)
2. **Dodanie testów** (~45+ test cases)
3. **Dokończenie placeholder implementations**

Po naprawie powyższych issues, stories mogą przejść do statusu "done".

---

**Review Completed:** 2025-11-25
**Next Review:** After action items addressed
