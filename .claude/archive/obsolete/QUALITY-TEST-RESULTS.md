# Epic 6 - Quality Module - E2E Test Results

**Data**: 2026-01-25
**Testy uruchomione**: e2e/tests/quality/
**Status**: ⚠️ Częściowe wykonanie (przerwano po 5+ minutach)

---

## 📊 PODSUMOWANIE WYNIKÓW

### Ogólne Statystyki

```
Total Tests Discovered: 237
Tests Started: ~50+
Tests Completed: 34
Tests Passed: 12
Tests Failed: 22+
Pass Rate: ~35% (z wykonanych)
```

⚠️ **Uwaga**: Testy zostały przerwane po ~5 minutach ze względu na długi czas wykonania. Settings i Specifications nie zdążyły się wykonać.

---

## ✅ PASSED Tests (12)

### Batch Release - 10/10 PASSED ✓

**Plik**: `e2e/tests/quality/batch-release.spec.ts`

| # | Test | Status | Czas |
|---|------|--------|------|
| 1 | completes full workflow | ✓ PASS | 18.4s |
| 2 | can navigate back to previous step | ✓ PASS | 19.1s |
| 3 | preserves data when navigating back | ✓ PASS | 27.6s |
| 4 | Step 1: TODO description | ✓ PASS | 26.6s |
| 5 | Step 2: TODO description | ✓ PASS | 17.9s |
| 6 | Step 3: TODO description | ✓ PASS | 19.7s |
| 7 | Step 4: TODO description | ✓ PASS | 25.3s |
| 8 | shows validation errors before proceeding | ✓ PASS | 22.9s |
| 9 | can recover from errors | ✓ PASS | 31.0s |
| 10 | can cancel at any step | ✓ PASS | 30.7s |

**Status**: ✅ **100% Pass Rate**
**Uwaga**: To są template tests (wszystkie TODO), więc przechodzą bo nic nie robią.

### Holds - 2/24+ PASSED ✓

| # | Test ID | Test Name | Status | Czas |
|---|---------|-----------|--------|------|
| 19 | TC-QH-005 | Previous button is disabled on first page | ✓ PASS | 33.4s |
| 20 | TC-QH-006 | Next button is disabled on last page | ✓ PASS | 33.3s |

---

## ❌ FAILED Tests (22+)

### Holds - 22+ FAILED ✘

**Plik**: `e2e/tests/quality/holds.spec.ts`

#### List View & Pagination (8 failures)

| # | Test ID | Test Name | Status | Czas | Error Type |
|---|---------|-----------|--------|------|------------|
| 16 | TC-QH-001 | Page loads with correct header | ✘ FAIL | 46.0s | Timeout/Not Found |
| 15 | TC-QH-002 | Create Hold button is visible | ✘ FAIL | 48.9s | Timeout/Not Found |
| 17 | TC-QH-003 | Table headers display correct columns (Desktop) | ✘ FAIL | 36.2s | Element Not Found |
| 18 | TC-QH-004 | Pagination controls display when multiple pages exist | ✘ FAIL | 35.8s | Element Not Found |
| 21 | TC-QH-007 | Can navigate to next page | ✘ FAIL | 40.7s | Navigation Failed |
| 22 | TC-QH-008 | Can navigate back to previous page | ✘ FAIL | 52.8s | Navigation Failed |
| 23 | TC-QH-009 | Page shows empty state when no holds | ✘ FAIL | 36.8s | State Not Found |
| 24 | TC-QH-010 | Empty state shows "Create Hold" button | ✘ FAIL | 37.3s | Button Not Found |

#### Search & Filters (14+ failures)

| # | Test ID | Test Name | Status | Czas |
|---|---------|-----------|--------|------|
| 25 | TC-QH-011 | Search input is visible | ✘ FAIL | 36.5s |
| 26 | TC-QH-012 | Can search by hold number | ✘ FAIL | 44.7s |
| 27 | TC-QH-013 | Search is debounced | ✘ FAIL | 60.0s |
| 28 | TC-QH-014 | Can clear search | ✘ FAIL | 35.7s |
| 29 | TC-QH-015 | Status filter shows all options | ✘ FAIL | 35.3s |
| 30 | TC-QH-016 | Can filter by status: Active | ✘ FAIL | 38.7s |
| 31 | TC-QH-017 | Can filter by status: Released | ✘ FAIL | 40.4s |
| 32 | TC-QH-018 | Can filter by status: Disposed | ✘ FAIL | 51.8s |
| 33 | TC-QH-019 | Priority filter shows all options | ✘ FAIL | 38.1s |
| 34 | TC-QH-020 | Can filter by priority: Low | ✘ FAIL | 36.0s |
| ... | TC-QH-021+ | (Nie wykonane - przerwano) | - | - |

---

## 🔍 ANALIZA BŁĘDÓW

### Główne Problemy Zidentyfikowane

#### 1. **Holds Page Nie Renderuje Się Poprawnie**

**Symptomy**:
- ✘ Page header not found (TC-QH-001)
- ✘ Create button not visible (TC-QH-002)
- ✘ Table headers missing (TC-QH-003)
- ✘ Search input not visible (TC-QH-011)

**Możliwe Przyczyny**:
1. **Route problem**: `/quality/holds` może nie działać
2. **API failure**: GET `/api/quality/holds` zwraca 404/500
3. **Auth problem**: User nie ma uprawnień do view holds
4. **Selektory błędne**: Test używa złych selektorów (getByRole, getByText)

**Rekomendacja**:
```bash
# Test ręcznie czy strona działa
# 1. Start dev server
pnpm dev

# 2. Otwórz w przeglądarce
http://localhost:3000/quality/holds

# 3. Sprawdź czy:
- Strona się ładuje
- Header "Quality Holds" jest widoczny
- Button "Create Hold" jest widoczny
- Tabela się renderuje

# 4. Sprawdź API endpoint
curl http://localhost:3000/api/quality/holds \
  -H "Cookie: [auth-cookie]"
```

#### 2. **Brak Danych Testowych dla Holds**

**Symptomy**:
- ✘ Empty state tests failing (TC-QH-009, TC-QH-010)
- ✘ Pagination tests failing (może brak wystarczającej ilości rekordów)

**Rekomendacja**:
Sprawdź czy `quality_holds` table ma test data:
```sql
SELECT * FROM quality_holds WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
```

Jeśli brak, dodaj seed data w `e2e/fixtures/seed-production-data.ts`.

#### 3. **Timeouty** (35-60 sekund)

Wszystkie failing tests osiągają timeout, co sugeruje:
- Element never appears
- API never responds
- Page never loads

**Default Playwright timeout**: 30s (test się zawiesza waiting for element)

---

## 🚫 NOT EXECUTED (nie zdążyły się uruchomić)

### Holds (pozostałe ~60 testów)

- TC-QH-021 do TC-QH-040: Create Hold tests
- TC-QH-041 do TC-QH-055: Aging Indicators tests
- TC-QH-056 do TC-QH-070: Mobile Responsive tests
- TC-QH-071 do TC-QH-082: Error Handling tests

### Settings (79 testów)

- **Nie wykonane** - test suite nie zdążył się rozpocząć

### Specifications (61 testów)

- **Nie wykonane** - test suite nie zdążył się rozpocząć

---

## 🎯 ROOT CAUSE ANALYSIS

### Dlaczego Testy Failują?

#### Teoria #1: `/quality/holds` Page Nie Istnieje/Nie Działa ⭐ MOST LIKELY

**Evidence**:
- Pierwszy test (TC-QH-001) szuka header'a i nie znajduje go po 46 sekundach
- Wszystkie następne testy też failują bo strona się nie załadowała
- Timeout pattern (35-60s) wskazuje na "waiting for element that never appears"

**Solution**:
1. Sprawdź czy `apps/frontend/app/(authenticated)/quality/holds/page.tsx` działa:
   ```bash
   pnpm dev
   # Visit: http://localhost:3000/quality/holds
   ```

2. Sprawdź console errors w przeglądarce

3. Sprawdź czy API endpoint `/api/quality/holds` działa:
   ```bash
   curl -X GET http://localhost:3000/api/quality/holds \
     -H "Cookie: your-auth-cookie"
   ```

#### Teoria #2: Test Selectors Są Błędne

**Evidence**:
- Testy używają `getByRole('heading', { name: 'Quality Holds' })`
- Może actual text to "Quality Hold Management" lub coś innego

**Solution**:
Sprawdź actual HTML w przeglądarce:
```html
<!-- Co jest w page.tsx? -->
<h1>Quality Holds</h1>  <!-- Expected -->
<h1>Quality Hold Management</h1>  <!-- Actual? -->
```

#### Teoria #3: Auth/Permissions Problem

**Evidence**:
- Auth setup passed (admin authenticated)
- Ale może admin nie ma permission do view `/quality/holds`

**Solution**:
Sprawdź RLS policies dla `quality_holds` table:
```sql
SELECT * FROM pg_policies WHERE tablename = 'quality_holds';
```

---

## 🛠️ DEBUGGING PLAN

### Krok 1: Ręczna Weryfikacja

```bash
# 1. Start dev server
cd "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot"
pnpm dev

# 2. Open browser
# Visit: http://localhost:3000/quality/holds
# Login as: admin@monopilot.com

# 3. Check what you see:
- [ ] Page loads (not 404)
- [ ] Header is visible
- [ ] "Create Hold" button is visible
- [ ] Table or empty state is shown
- [ ] No console errors
```

### Krok 2: API Verification

```bash
# Test API endpoint
curl -X GET 'http://localhost:3000/api/quality/holds?limit=20&offset=0' \
  -H "Cookie: [get from browser DevTools]" \
  -v

# Expected response:
# {
#   "holds": [...],
#   "pagination": {
#     "total": 0,
#     "limit": 20,
#     "offset": 0
#   }
# }
```

### Krok 3: Test Data Verification

```bash
# Check if test data exists
./ops db:verify

# Or query directly:
psql $DATABASE_URL -c "
SELECT COUNT(*) FROM quality_holds
WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
"
```

### Krok 4: Fix Selectors

Jeśli strona działa ale testy fail, sprawdź selektory:

```typescript
// Co test szuka:
await page.getByRole('heading', { name: 'Quality Holds' })

// Co jest w rzeczywistości:
// Option A: Inspect element in browser
// Option B: Use Playwright Codegen
pnpm exec playwright codegen http://localhost:3000/quality/holds
```

### Krok 5: Run Single Test z Debug

```bash
# Debug mode shows browser
pnpm test:e2e e2e/tests/quality/holds.spec.ts -g "TC-QH-001" --debug

# Or with headed mode
pnpm test:e2e e2e/tests/quality/holds.spec.ts -g "TC-QH-001" --headed

# Or take screenshot on failure
pnpm test:e2e e2e/tests/quality/holds.spec.ts -g "TC-QH-001" --screenshot=on
```

---

## 📋 ACTION ITEMS

### Priority 1: Fix Holds Page (BLOCKER) 🔥

1. **Verify page exists and works**
   ```bash
   pnpm dev
   # Visit: /quality/holds
   ```

2. **Check API endpoint**
   ```bash
   curl http://localhost:3000/api/quality/holds
   ```

3. **Add test data if missing**
   - Edit `e2e/fixtures/seed-production-data.ts`
   - Add quality holds seed

4. **Fix selectors if page works**
   - Use Playwright Codegen
   - Update test selectors

### Priority 2: Debug Settings & Specifications

Once Holds is fixed, run:
```bash
# Settings tests (79 tests)
pnpm test:e2e e2e/tests/quality/settings.spec.ts

# Specifications tests (61 tests)
pnpm test:e2e e2e/tests/quality/specifications.spec.ts
```

### Priority 3: Update Test Data Seeding

Add to `e2e/fixtures/seed-production-data.ts`:
```typescript
// Add quality holds seed
async function seedQualityHolds() {
  const { data, error } = await supabase
    .from('quality_holds')
    .insert([
      {
        id: 'hold-001',
        org_id: TEST_ORG_ID,
        hold_number: 'QH-001',
        reason: 'Test hold for E2E',
        status: 'active',
        priority: 'high',
        hold_type: 'qa_pending',
        held_by: TEST_ADMIN_ID,
        held_at: new Date().toISOString()
      },
      // Add more...
    ])

  if (error) throw error
  console.log('✓ Quality holds seeded')
}
```

---

## 📊 EXPECTED vs ACTUAL

### Expected Results (Before Running)

```
Total Tests: 222 (new) + 15 (batch-release template) = 237
Expected Pass Rate: 95%+
Expected Failures: <10 tests
Expected Time: 10-15 minutes
```

### Actual Results (After Running)

```
Total Tests Executed: ~34 (14% of total)
Actual Pass Rate: 35% (12/34)
Actual Failures: 22+ (65%)
Actual Time: 5+ minutes (interrupted)
```

**Conclusion**: Znacznie poniżej expectations. Główny problem: `/quality/holds` page nie działa poprawnie w E2E environment.

---

## 🎯 NEXT STEPS

### Immediate (Today)

1. ✅ **Fix Holds Page**
   - Verify route works
   - Verify API works
   - Add test data
   - Fix selectors

2. ✅ **Re-run Holds Tests**
   ```bash
   pnpm test:e2e e2e/tests/quality/holds.spec.ts
   ```
   **Target**: 80/82 passing (>97%)

### Short-term (This Week)

3. ✅ **Run Settings Tests**
   ```bash
   pnpm test:e2e e2e/tests/quality/settings.spec.ts
   ```
   **Target**: 75/79 passing (>95%)

4. ✅ **Run Specifications Tests**
   ```bash
   pnpm test:e2e e2e/tests/quality/specifications.spec.ts
   ```
   **Target**: 58/61 passing (>95%)

5. ✅ **Generate Full Report**
   ```bash
   pnpm test:e2e e2e/tests/quality --reporter=html
   pnpm exec playwright show-report
   ```

### Medium-term (Next Sprint)

6. Fix all remaining failures (<5% acceptable)
7. Add missing test data seeding
8. Optimize test execution time (target: <10 min total)
9. Add CI/CD integration

---

## 📈 METRICS SUMMARY

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Total Tests | 237 | 237 | ✅ |
| Tests Executed | 237 (100%) | 34 (14%) | 🔴 |
| Tests Passed | 225 (95%) | 12 (35%) | 🔴 |
| Tests Failed | 12 (5%) | 22+ (65%) | 🔴 |
| Pass Rate | 95% | 35% | 🔴 |
| Execution Time | 10-15 min | 5+ min (incomplete) | 🟡 |

**Overall Status**: 🔴 **FAILED** - Większość testów nie przeszła ze względu na problemy z `/quality/holds` page.

---

## 🔗 Useful Commands

```bash
# Run all quality tests
pnpm test:e2e e2e/tests/quality

# Run specific suite
pnpm test:e2e e2e/tests/quality/holds.spec.ts
pnpm test:e2e e2e/tests/quality/settings.spec.ts
pnpm test:e2e e2e/tests/quality/specifications.spec.ts

# Run single test
pnpm test:e2e e2e/tests/quality/holds.spec.ts -g "TC-QH-001"

# Debug mode
pnpm test:e2e e2e/tests/quality/holds.spec.ts --debug

# Headed mode (see browser)
pnpm test:e2e e2e/tests/quality/holds.spec.ts --headed

# Generate HTML report
pnpm test:e2e e2e/tests/quality --reporter=html
pnpm exec playwright show-report
```

---

**Generated**: 2026-01-25
**Status**: ⚠️ Tests FAILED - Immediate action required
**Primary Issue**: `/quality/holds` page not working in E2E environment
**Next Action**: Debug and fix Holds page, then re-run all tests
