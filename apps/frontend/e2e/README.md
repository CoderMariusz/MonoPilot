# E2E Tests - MonoPilot

## 📋 Overview

This directory contains end-to-end tests for the MonoPilot application using Playwright.

## 🚀 Quick Start

### 1. Install Playwright Browsers

```bash
pnpm playwright:install
```

### 2. Configure Environment Variables

Create `.env.local` file in `apps/frontend/` with your Supabase credentials:

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** The service role key is required for the seeding script to create test data.

### 3. Seed Test Data (First Time Setup)

Before running E2E tests, seed the database with test data:

```bash
# From apps/frontend directory
pnpm test:e2e:seed
```

**What gets seeded:**
- ✅ 3 Test Suppliers (SUP-001, SUP-002, SUP-003) with different currencies
- ✅ 5 Test Products (BXS-001, PKC-001, CHB-001, LBS-001, VCS-001)
- ✅ 3 Test Warehouses (WH-TEST-01, WH-TEST-02, WH-TEST-03)
- ✅ Multiple Locations per warehouse (RECEIVING, SHIPPING, storage)
- ✅ Product-Supplier links for PO creation

**Note:** Re-run this command anytime test data needs to be reset or corrupted.

### 4. Run Tests

```bash
# Run all tests
pnpm test:e2e

# Run with UI (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (watch browser)
pnpm test:e2e:headed

# Run specific test suites
pnpm test:e2e:auth          # Authentication tests
pnpm test:e2e:po            # Purchase Order tests
pnpm test:e2e:to            # Transfer Order tests
pnpm test:e2e:lp            # License Plate tests
pnpm test:e2e:settings      # Settings tests
pnpm test:e2e:grn           # GRN/Receiving tests

# Run only critical tests (CI/CD)
pnpm test:e2e:critical
```

## 📁 Test Structure

```
e2e/
├── helpers.ts                    # Shared helper functions
├── 01-auth.spec.ts               # Authentication flow tests
├── 02-purchase-orders.spec.ts    # PO creation, editing, deletion
├── 03-transfer-orders.spec.ts    # TO creation, shipping, receiving
├── 04-license-plates.spec.ts     # LP split, amend, QA status
├── 05-settings.spec.ts           # System settings updates
├── 06-grn-receiving.spec.ts      # GRN/receiving workflow
└── README.md                     # This file
```

## 🧪 Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Authentication | 3 | ✅ Login, Logout, Validation |
| Purchase Orders | 5 | ✅ CRUD, Quick Entry, Filtering |
| Transfer Orders | 5 | ✅ Create, Ship, Receive, Validation |
| License Plates | 5 | ✅ Split, QA Status, Amend, Search |
| Settings | 5 | ✅ Update, Persistence, Loading |
| GRN/Receiving | 4 | ✅ View, Complete, Filter, Search |

**Total**: 27 E2E tests covering 6 major workflows

## ⚙️ Configuration

### Test User Setup

Tests require a test user in your Supabase database. You can:

1. **Manually create** a test user via Supabase Dashboard
2. **Use seed script** (if available):
   ```bash
   pnpm seed:test-users
   ```

### Environment Variables

Set these in your environment or use `.env.test` (create from `.env.test.example`):

```bash
TEST_USER_EMAIL=test@monopilot.com
TEST_USER_PASSWORD=testpassword123
```

### Playwright Config

See `playwright.config.ts` for full configuration:
- Base URL: `http://localhost:5000`
- Browser: Chromium (fastest)
- Retry: 2x on CI, 0x locally
- Screenshots/Videos: On failure only

## 📝 Writing New Tests

### 1. Use Helper Functions

```typescript
import { login, navigateTo, waitForModal, waitForToast } from './helpers';

test('should do something', async ({ page }) => {
  await login(page);
  await navigateTo(page, 'planning');
  // ... your test
});
```

### 2. Follow Naming Convention

- File: `XX-module-name.spec.ts` (numbered for execution order)
- Test suite: `test.describe('Module Name', () => { ... })`
- Test case: `test('should do something specific', async ({ page }) => { ... })`

### 3. Use Assertions

```typescript
import { expect } from '@playwright/test';

// Visibility
await expect(page.locator('.modal')).toBeVisible();

// Text content
await expect(page.locator('.message')).toContainText('success');

// URL
await expect(page).toHaveURL('/dashboard');
```

### 4. Handle Async Operations

```typescript
// Wait for toast
await waitForToast(page, 'Successfully created');

// Wait for modal
await waitForModal(page, 'Create Purchase Order');

// Wait for table data
await page.waitForSelector('table tbody tr');
```

## 🐛 Debugging

### 1. Run in UI Mode

```bash
pnpm test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- Step through tests
- Inspect locators
- View screenshots/videos
- See network requests

### 2. Run in Headed Mode

```bash
pnpm test:e2e:headed
```

Watch the browser execute tests in real-time.

### 3. Use Console Logs

```typescript
console.log(await page.locator('.element').textContent());
```

### 4. Take Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install Playwright
  run: pnpm playwright:install

- name: Run E2E Tests
  run: pnpm test:e2e:critical
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### Critical Tests Only

For faster CI builds, run only critical tests:

```bash
pnpm test:e2e:critical
```

This runs:
- Authentication (login/logout)
- Purchase Orders (create, edit, delete)
- Transfer Orders (create, ship, receive)

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports include:
- Test results (pass/fail)
- Screenshots on failure
- Videos on failure
- Execution times
- Trace files for debugging

## 🔧 Common Issues

### Issue: "Test user not found"

**Solution**: Create a test user in Supabase with the credentials in `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`.

### Issue: "Cannot connect to http://localhost:5000"

**Solution**: Ensure the dev server is running. Playwright config includes `webServer` that should auto-start it, but you can also start it manually:

```bash
pnpm dev
```

### Issue: "Element not found"

**Solution**: Use more flexible selectors:

```typescript
// ❌ Too specific
await page.click('div.modal button.primary');

// ✅ More flexible
await page.click('button:has-text("Create")');
```

### Issue: "Test timeout"

**Solution**: Increase timeout for slow operations:

```typescript
await expect(element).toBeVisible({ timeout: 10000 }); // 10 seconds
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)

## 🎯 Next Steps

### Missing Test Coverage (Future)

1. **Work Orders** - Create, start, complete, cancel
2. **BOM Management** - Create, edit, activate BOMs
3. **Production Outputs** - Record production, scrap, downtime
4. **Stock Moves** - Create and execute stock movements
5. **User Management** - Create users, assign roles, permissions
6. **Supplier Management** - CRUD suppliers, contacts
7. **Product Catalog** - CRUD products, allergens, variants

### Test Improvements

1. **Data Fixtures** - Create reusable test data
2. **Page Objects** - Encapsulate page interactions
3. **Visual Regression** - Screenshot comparisons
4. **Performance Tests** - Measure load times
5. **Accessibility Tests** - ARIA, keyboard navigation

---

**Last Updated**: 2025-01-11  
**Test Count**: 27  
**Coverage**: ~30% of critical workflows  
**Status**: ✅ Initial E2E test suite complete
