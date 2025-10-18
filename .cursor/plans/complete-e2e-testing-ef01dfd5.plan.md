<!-- ef01dfd5-c2bb-43e4-b9f4-7b78a8e10484 c4e83eaa-53d5-4329-b201-8615ca2ea2bc -->
# Fix E2E Testing Infrastructure and Run All Tests

## Phase 1: Verify and Fix Test Infrastructure

### 1.1 Verify Playwright Configuration

Check `playwright.config.ts` to ensure:

- `webServer` command is `pnpm dev`
- `baseURL` is `http://localhost:5000`
- `timeout` is sufficient (120 seconds for webServer startup)
- Test timeout is reasonable (default 30s, may need to increase to 60s)

Update if needed:

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000, // 60 seconds per test
  fullyParallel: false, // Run sequentially to avoid conflicts
  workers: 1, // Single worker to prevent port conflicts
  // ...
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
  },
});
```

### 1.2 Verify Test Users Exist

Check if `seed-test-users.ts` script works:

- Run `pnpm seed:test-users` from `apps/frontend`
- Verify all 7 test users are created in Supabase auth
- Check `.env` has correct `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Test Basic Login Flow Manually

Before running automated tests:

1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:5000/login`
3. Verify login page loads
4. Try logging in with `admin@forza.com` / `password123`
5. Check if redirect works

If this fails, fix the login page/auth flow before running tests.

### 1.4 Run Single Smoke Test

Create a minimal smoke test to verify infrastructure:

**File: `apps/frontend/e2e/smoke.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('smoke test - app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Forza/i);
});
```

Run: `pnpm test:e2e e2e/smoke.spec.ts`

If this passes, infrastructure is working. If it fails, debug the webServer startup.

## Phase 2: Fix Auth Module (Foundation)

### 2.1 Update Auth Test Login Helper

The current `login()` method waits for URL to NOT contain `/login`, but this might timeout if login fails. Update to be more defensive:

**File: `apps/frontend/e2e/utils/test-helpers.ts`**

```typescript
async login(email: string = 'test@forza.com', password: string = 'password') {
  await this.page.goto('/login');
  await this.page.waitForLoadState('networkidle');
  
  // Fill form
  await this.page.fill('input[name="email"]', email);
  await this.page.fill('input[name="password"]', password);
  
  // Submit and wait for navigation OR error
  await Promise.race([
    this.page.click('button[type="submit"]').then(() => 
      this.page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 })
    ),
    this.page.waitForSelector('.toast:has-text("error")', { timeout: 10000 })
      .then(() => { throw new Error('Login failed with error toast'); })
  ]);
}
```

### 2.2 Run Auth Tests

Execute: `pnpm test:e2e:auth --reporter=json | Out-File -FilePath test-results/auth-results.json -Encoding utf8`

### 2.3 Generate Auth Report

Run: `tsx scripts/generate-test-report.ts Auth test-results/auth-results.json`

Output: `test-reports/auth-module.md`

### 2.4 Fix Auth Issues Based on Report

Common fixes needed:

- Update selectors if form fields don't match
- Ensure test users exist (run seed script)
- Fix navigation URLs if redirects fail
- Increase timeout if operations are slow

## Phase 3: Run and Report All Modules

For each module, follow this pattern:

### 3.1 BOM Module

- Run: `pnpm test:e2e:bom --reporter=json | Out-File -FilePath test-results/bom-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts BOM test-results/bom-results.json`
- Fix issues found
- Re-run if needed

### 3.2 Planning Module

- Run: `pnpm test:e2e:planning --reporter=json | Out-File -FilePath test-results/planning-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts Planning test-results/planning-results.json`
- Fix issues found

### 3.3 Production Module

- Run: `pnpm test:e2e:production --reporter=json | Out-File -FilePath test-results/production-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts Production test-results/production-results.json`
- Fix issues found

### 3.4 Warehouse Module

- Run: `pnpm test:e2e:warehouse --reporter=json | Out-File -FilePath test-results/warehouse-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts Warehouse test-results/warehouse-results.json`
- Fix issues found

### 3.5 Scanner Module

- Run: `pnpm test:e2e:scanner --reporter=json | Out-File -FilePath test-results/scanner-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts Scanner test-results/scanner-results.json`
- Fix issues found

### 3.6 Settings Module

- Run: `pnpm test:e2e:settings --reporter=json | Out-File -FilePath test-results/settings-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts Settings test-results/settings-results.json`
- Fix issues found

### 3.7 Admin Module

- Run: `pnpm test:e2e:admin --reporter=json | Out-File -FilePath test-results/admin-results.json -Encoding utf8`
- Generate report: `tsx scripts/generate-test-report.ts Admin test-results/admin-results.json`
- Fix issues found

## Phase 4: Add Missing Test Categories

### 4.1 Create Performance Tests

**File: `apps/frontend/e2e/performance/load-times.spec.ts`**

- Test page load times (<3s for home, <5s for data pages)
- Test modal open time (<500ms)
- Test form submit time (<2s)

**File: `apps/frontend/e2e/performance/search.spec.ts`**

- Test search debouncing (300ms wait)
- Test search result time (<2s)
- Test filter/sort performance (<500ms)

Run and report: `pnpm test:e2e:performance --reporter=json | Out-File -FilePath test-results/performance-results.json -Encoding utf8`

### 4.2 Create Error Handling Tests

**File: `apps/frontend/e2e/error-handling/api-errors.spec.ts`**

- Mock network errors and verify toast messages
- Test 401/403/500 error handling

**File: `apps/frontend/e2e/error-handling/validation-errors.spec.ts`**

- Test required field validation
- Test format validation (email, numbers)

**File: `apps/frontend/e2e/error-handling/permission-errors.spec.ts`**

- Test role-based access control
- Verify operators can't access admin features

Run and report: `pnpm test:e2e:error-handling --reporter=json | Out-File -FilePath test-results/error-handling-results.json -Encoding utf8`

### 4.3 Create UI Component Tests

**File: `apps/frontend/e2e/components/modals.spec.ts`**

- Test modal open/close
- Test ESC key and outside click

**File: `apps/frontend/e2e/components/tables.spec.ts`**

- Test sorting, pagination, filtering
- Test row selection and bulk actions

**File: `apps/frontend/e2e/components/forms.spec.ts`**

- Test all form input types
- Test validation on blur and submit

**File: `apps/frontend/e2e/components/navigation.spec.ts`**

- Test sidebar navigation
- Test breadcrumbs and active states

Run and report: `pnpm test:e2e:components --reporter=json | Out-File -FilePath test-results/components-results.json -Encoding utf8`

## Phase 5: Create Master Report

### 5.1 Generate Master Report

**File: `apps/frontend/test-reports/00-MASTER-REPORT.md`**

Aggregate all module reports into a single comprehensive report showing:

- Total tests across all modules
- Pass/fail rates by module
- Common issues identified
- Performance metrics
- Links to individual module reports

### 5.2 Update All Module Reports

Ensure all module reports follow consistent format:

- Executive summary with stats
- Passed tests section
- Failed tests grouped by category
- Recommendations for fixes
- Links to test files

## Key Files

### Files to Verify/Update

1. `apps/frontend/playwright.config.ts` - Update timeout and worker settings
2. `apps/frontend/e2e/utils/test-helpers.ts` - Fix login method
3. `apps/frontend/scripts/generate-test-report.ts` - Already created, verify it works
4. `apps/frontend/scripts/seed-test-users.ts` - Already created, verify it works

### New Files to Create

1. `apps/frontend/e2e/smoke.spec.ts` - Basic infrastructure test
2. `apps/frontend/e2e/performance/load-times.spec.ts`
3. `apps/frontend/e2e/performance/search.spec.ts`
4. `apps/frontend/e2e/error-handling/api-errors.spec.ts`
5. `apps/frontend/e2e/error-handling/validation-errors.spec.ts`
6. `apps/frontend/e2e/error-handling/permission-errors.spec.ts`
7. `apps/frontend/e2e/components/modals.spec.ts`
8. `apps/frontend/e2e/components/tables.spec.ts`
9. `apps/frontend/e2e/components/forms.spec.ts`
10. `apps/frontend/e2e/components/navigation.spec.ts`
11. `apps/frontend/test-reports/00-MASTER-REPORT.md`

### Reports to Generate/Update

1. `apps/frontend/test-reports/auth-module.md` - Update with new results
2. `apps/frontend/test-reports/bom-module.md` - Create
3. `apps/frontend/test-reports/planning-module.md` - Create
4. `apps/frontend/test-reports/production-module.md` - Create
5. `apps/frontend/test-reports/warehouse-module.md` - Create
6. `apps/frontend/test-reports/scanner-module.md` - Create
7. `apps/frontend/test-reports/settings-module.md` - Create
8. `apps/frontend/test-reports/admin-module.md` - Create
9. `apps/frontend/test-reports/performance-module.md` - Create
10. `apps/frontend/test-reports/error-handling-module.md` - Create
11. `apps/frontend/test-reports/components-module.md` - Create

## Expected Outcome

- E2E test infrastructure verified and working
- Dev server starts automatically before tests
- All module tests run successfully with detailed reports
- 3 new test categories fully implemented
- Master report showing complete test coverage
- Clear documentation of any remaining issues

### To-dos

- [ ] Install Playwright, create config, setup test utilities and helpers
- [ ] Implement authentication tests (login, signup, auth state)
- [ ] Implement BOM module tests (create, edit, delete products, BOM components)
- [ ] Implement Planning module tests (work orders, POs, transfer orders)
- [ ] Implement Production module tests (work orders, yield, consume, operations, trace)
- [ ] Implement Warehouse module tests (GRN, stock moves, LP operations)
- [ ] Implement Scanner module tests (pack terminal, process terminal, workflows)
- [ ] Implement Settings module tests (locations, machines, suppliers, etc.)
- [ ] Implement Admin module tests (users, sessions, system settings)
- [ ] Implement cross-module integration tests and complete production flow
- [ ] Implement UI component tests (modals, tables, forms, navigation)
- [ ] Implement error handling tests (API errors, validation, permissions)
- [ ] Implement performance tests (load times, search performance)
- [ ] Implement accessibility tests (keyboard nav, ARIA labels)
- [ ] Setup GitHub Actions workflow for automated E2E testing
- [ ] Create comprehensive E2E testing documentation and update README
- [ ] Create test fixtures and cleanup strategies
- [ ] Update .gitignore and verify all tests run successfully