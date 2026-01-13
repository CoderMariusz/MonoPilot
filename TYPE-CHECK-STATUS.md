# TypeScript Type Checking - Status Report

**Date**: 2026-01-13
**Total Errors**: 499
**Baseline**: 298 (as of 2024-12-30)
**Regression**: +201 errors (67% increase)

---

## 🚨 Sytuacja Krytyczna

Projekt przekroczył baseline o **201 błędów** TypeScript!

### Statystyki

| Metryka | Wartość |
|---------|---------|
| **Błędy aktualne** | 499 |
| **Błędy baseline** | 298 |
| **Regresja** | +201 (↑ 67%) |
| **Tryb enforcement** | `warn` (nie blokuje) |
| **Próg strict mode** | 50 errors |
| **Dystans do strict** | 449 errors |

---

## 📊 Kategorie Błędów (Top 10)

Według pierwszych 100 linii wyjścia z `tsc`:

### 1. **Next.js Route Handler Params Mismatch** (HIGH)
**Count**: ~50+
**Pattern**: `Type 'Promise<{ id: string; }>' is not assignable to type 'Promise<{ productId: string; }>'`
**Pliki**: `.next/types/validator.ts`
**Root Cause**: Niespójność nazw parametrów między definicją ścieżki `[id]` a użyciem `productId`

**Przykłady**:
- `/api/planning/products/[id]/default-supplier/route` (expects `id`, uses `productId`)
- `/api/planning/suppliers/[supplierId]/route` (expects `supplierId`, uses `id`)

### 2. **Test Data Type Mismatches** (HIGH)
**Count**: ~150+
**Pattern**: Test fixtures z nieprawidłowymi typami
**Pliki**:
- `app/(authenticated)/planning/work-orders/gantt/__tests__/GanttWOBar.test.tsx`
- `app/(authenticated)/settings/__tests__/page.test.tsx`

**Problemy**:
- `status: string` → powinno być `WOStatus`
- `material_status: string` → powinno być `MaterialStatus`
- Brak pola `onboarding_skipped` w test fixtures
- `null` zamiast `undefined` dla opcjonalnych pól

### 3. **Missing Props in Components** (MEDIUM)
**Count**: ~10
**Pattern**: `Property 'X' does not exist on type 'IntrinsicAttributes & Props'`

**Przykłady**:
- `POStatusTimelineProps` - brak property `history`
- `PODataTableProps` - brak property `selectable`
- `ProductFormModalProps` - brak property `open`

### 4. **Void Expression Truthiness Check** (MEDIUM)
**Count**: ~5
**Pattern**: `An expression of type 'void' cannot be tested for truthiness`
**Przykład**: `GanttWOBar.test.tsx:55`

### 5. **Missing Type Declarations** (HIGH)
**Count**: ~2
**Pattern**: `Cannot find module 'X' or its corresponding type declarations`

**Przykład**:
- `Cannot find module 'sonner'` w `GanttExportButton.tsx`

### 6. **Undefined Null Issues** (LOW)
**Count**: ~10
**Pattern**: `Type 'undefined' is not assignable to type 'X'`

**Przykłady**:
- `GanttDataResponse | undefined` → `GanttDataResponse`
- Nullable values w testach

### 7. **Wrong Argument Count** (MEDIUM)
**Count**: ~6
**Pattern**: `Expected 0 arguments, but got 1`
**Plik**: `app/api/planning/suppliers/[supplierId]/products/__tests__/route.test.ts`

### 8. **Unknown Properties** (HIGH)
**Count**: ~5
**Pattern**: `Object literal may only specify known properties`

**Przykłady**:
- `logo_url` nie istnieje w `Organization` type
- `type` nie istnieje w product type
- `name` nie istnieje w location type

### 9. **Missing Object Properties** (HIGH)
**Count**: ~3
**Pattern**: `Property 'X' does not exist on type 'Y'`

**Przykłady**:
- `toLowerCase()` nie istnieje na `{ code: any; }[]`
- `name` nie istnieje na location type

### 10. **Buffer Type Incompatibility** (MEDIUM)
**Count**: ~1
**Pattern**: `Type 'Buffer<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit'`
**Plik**: `app/api/planning/purchase-orders/export/route.ts`

---

## 🛠️ System Monitorowania

### Dostępne Skrypty

#### 1. **Sprawdź status**
```bash
pnpm type-check:status
# lub
bash scripts/type-check-status.sh
```

**Output**: Pokazuje aktualny stan, progress do strict mode, enforcement mode

#### 2. **Uruchom monitoring** (podstawowy)
```bash
pnpm type-check:monitor
# lub
bash scripts/type-check-monitor.sh summary
```

**Output**: Podsumowanie błędów po kategoriach i priorytetach

#### 3. **Pełne szczegóły**
```bash
pnpm type-check:full
# lub
bash scripts/type-check-monitor.sh full
```

**Output**: Kompletna lista błędów z plikami i liniami

#### 4. **Eksport JSON**
```bash
pnpm type-check:json > errors.json
# lub
bash scripts/type-check-monitor.sh json > errors.json
```

**Output**: JSON z błędami (dla automatyzacji)

#### 5. **Generuj raport HTML** (⚠️ wymaga poprawki)
```bash
pnpm type-check:report
# lub
bash scripts/type-check-report.sh
```

**Output**: Interaktywny HTML report z trendami

**Status**: Currently broken - parser ma problem z multiline errors

#### 6. **Watch mode** (ciągłe monitorowanie)
```bash
pnpm type-check:watch
# lub
bash scripts/type-check-watch.sh
```

**Output**: Auto-refresh co X sekund

---

## 🎯 Akcje Naprawcze

### Priorytet 1: HIGH (Fix immediately)

#### A. Fix Next.js Route Handler Param Names (~50 errors)

**Problem**: Niespójność między nazwą parametru w route path a usage

**Rozwiązanie**:
1. **Opcja A**: Zmień ścieżki w filesystem na spójne nazwy
   - `[id]` → `[productId]` w odpowiednich miejscach
   - Ale to wymaga zmiany struktury folderów

2. **Opcja B** (zalecane): Dostosuj handlers do Next.js naming
   ```typescript
   // Błąd:
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ productId: string }> }
   ) { ... }

   // Poprawka:
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id: productId } = await params; // rename locally
     ...
   }
   ```

**Pliki do naprawy**:
- `app/api/planning/products/[id]/default-supplier/route.ts`
- `app/api/planning/suppliers/[supplierId]/route.ts`
- ~20-30 innych route handlers

#### B. Fix Test Fixtures (~150 errors)

**Problem**: Test data używa `string` zamiast proper types

**Rozwiązanie**: Create test helpers
```typescript
// lib/test/factories.ts
import { WOStatus, MaterialStatus } from '@/lib/types';

export const createMockWO = (overrides?: Partial<GanttWorkOrder>): GanttWorkOrder => ({
  status: 'draft' as WOStatus, // proper type
  material_status: 'available' as MaterialStatus,
  ...mockDefaults,
  ...overrides
});
```

**Pliki do naprawy**:
- `app/(authenticated)/planning/work-orders/gantt/__tests__/GanttWOBar.test.tsx`
- `app/(authenticated)/settings/__tests__/page.test.tsx`

#### C. Fix Missing Type Declarations

**Problem**: `Cannot find module 'sonner'`

**Rozwiązanie**:
```bash
pnpm add sonner  # if used
# or remove import if not needed
```

### Priorytet 2: MEDIUM

#### D. Fix Component Props (~10 errors)

**Problem**: Missing props in component interfaces

**Rozwiązanie**: Update interfaces
```typescript
// Before:
interface POStatusTimelineProps {
  // missing history
}

// After:
interface POStatusTimelineProps {
  history: POStatusHistory[];
  isLoading: boolean;
}
```

#### E. Fix Void Expressions (~5 errors)

**Problem**: `void` expression tested for truthiness

**Rozwiązanie**:
```typescript
// Before:
if (someVoidFunction()) { ... }

// After:
someVoidFunction();
if (someCondition) { ... }
```

### Priorytet 3: LOW

#### F. Fix Nullable/Undefined (~10 errors)

**Problem**: Type narrowing needed

**Rozwiązanie**: Add guards
```typescript
// Before:
const data: GanttDataResponse | undefined = ...;
processData(data); // error

// After:
if (data) {
  processData(data);
}
```

---

## 📋 Plan Naprawy (Recommended)

### Faza 1: Quick Wins (1-2 dni)
1. Fix Next.js route handler param names (~50 errors) - **bulk rename pattern**
2. Install missing packages (`sonner`) - **5 min**
3. Fix test fixtures using factories - **create base helpers first**

**Result**: ~200 errors fixed

### Faza 2: Component Props (1 dzień)
1. Update component interfaces
2. Add missing props
3. Fix prop passing

**Result**: ~10 errors fixed

### Faza 3: Test Cleanup (1-2 dni)
1. Complete test fixture migration to factories
2. Fix void expressions
3. Fix nullable guards

**Result**: ~20 errors fixed

### Faza 4: Mop-up (1 dzień)
1. Fix remaining edge cases
2. Fix buffer types
3. Fix method call issues

**Result**: ALL errors fixed

**Total Duration**: 4-6 dni
**Target**: 0 errors → enable strict mode

---

## 🔧 Konfiguracja

### Config File
**Location**: `scripts/type-check-config.sh`

**Current Settings**:
```bash
ENFORCEMENT_MODE="warn"        # Nie blokuje pushes
BASELINE_ERRORS=298            # Outdated! (actual: 499)
STRICT_MODE_THRESHOLD=50       # Target for strict mode
```

**Zalecane zmiany**:
```bash
# 1. Update baseline
BASELINE_ERRORS=499  # current state

# 2. Po naprawie Phase 1-2 (target: ~200 errors):
ENFORCEMENT_MODE="prevent-regression"  # Block if errors increase

# 3. Po naprawie wszystkich:
ENFORCEMENT_MODE="strict"  # Block ANY errors
```

---

## 🎬 Next Steps

### Immediate
1. ✅ **Update BASELINE_ERRORS** w `scripts/type-check-config.sh` do `499`
2. ⏳ **Fix parser** w `type-check-monitor.sh` (multiline errors issue)
3. ⏳ **Create test factories** (`lib/test/factories.ts`)

### This Week
1. **Faza 1**: Fix route handlers + test fixtures (target: -200 errors)
2. **Enable prevent-regression mode** po pierwszej fazie
3. **Daily monitoring** używając `pnpm type-check:monitor`

### This Month
1. **Fazy 2-4**: Complete remaining fixes
2. **Enable strict mode** (0 errors)
3. **CI/CD integration**: Fail builds on type errors

---

## 📊 Tracking Progress

### Daily Command
```bash
pnpm type-check:monitor
```

**Expected Output**:
- Total errors
- Breakdown by category/priority
- Top files with errors
- Trend vs baseline

### Weekly Review
```bash
pnpm type-check:status
```

**Shows**:
- Progress bar to strict mode
- Errors fixed since baseline
- Current enforcement mode
- Phase roadmap

---

## ⚙️ Known Issues

### 1. Monitor JSON Parser
**Issue**: Multiline errors break JSON generation
**Workaround**: Use `pnpm type-check:monitor summary` instead
**Fix Needed**: Update regex in `type-check-monitor.sh:359`

### 2. HTML Report Generation
**Issue**: Depends on JSON output (currently broken)
**Workaround**: Manual review using `pnpm type-check:full`
**Fix Needed**: Fix JSON parser first

### 3. Baseline Outdated
**Issue**: Config shows 298, actual is 499
**Fix**: Update `scripts/type-check-config.sh`

---

## 🎯 Success Metrics

### Week 1
- [ ] Baseline updated to 499
- [ ] Route handlers fixed (~50 errors)
- [ ] Test factories created
- [ ] Down to ~250 errors

### Week 2
- [ ] Test fixtures migrated (~150 errors)
- [ ] Component props fixed (~10 errors)
- [ ] Down to ~100 errors

### Week 3-4
- [ ] All remaining errors fixed
- [ ] Strict mode enabled (0 errors)
- [ ] CI/CD enforcement active

---

**Status**: Ready for action
**Priority**: HIGH - regression needs immediate attention
**Owner**: Development team
