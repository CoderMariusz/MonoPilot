# MonoPilot Test Suite

Production-ready test framework for MonoPilot MES using Playwright with TypeScript.

## 📋 Table of Contents

- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Architecture Overview](#architecture-overview)
- [Best Practices](#best-practices)
- [CI Integration](#ci-integration)
- [Troubleshooting](#troubleshooting)

## 🚀 Setup Instructions

### Prerequisites

- Node.js 20.11.0+ (see `.nvmrc`)
- pnpm 8.15.0+

### Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Install Playwright browsers:**

   ```bash
   npx playwright install
   ```

3. **Configure environment:**

   ```bash
   cp .env.test.example .env.test
   ```

   Edit `.env.test` and fill in your test environment values:
   - `BASE_URL` - Your application URL (default: http://localhost:3000)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `TEST_USER_EMAIL` - Test user credentials
   - `TEST_USER_PASSWORD` - Test user password

## ▶️ Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/example.spec.ts

# Run tests matching a title
npx playwright test -g "should login"
```

### Advanced Commands

```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Update snapshots
npx playwright test --update-snapshots

# Show HTML report
npx playwright show-report test-results/html
```

## 🏗️ Architecture Overview

### Directory Structure

```
tests/
├── e2e/                          # Test files
│   └── example.spec.ts
├── support/                      # Test infrastructure (key pattern)
│   ├── fixtures/                 # Custom fixtures
│   │   ├── index.ts              # Fixture composition
│   │   └── factories/            # Data factories
│   │       └── user-factory.ts
│   ├── helpers/                  # Utility functions
│   │   └── auth-helper.ts
│   └── page-objects/             # Page Object Models (optional)
└── README.md
```

**Key Pattern**: The `support/` directory contains all test infrastructure (fixtures, factories, helpers) that is shared across test files.

### Fixture Architecture

Tests use **extended fixtures** for automatic setup and cleanup:

```typescript
import { test, expect } from '../support/fixtures';

test('example test', async ({ page, userFactory, authHelper }) => {
  // userFactory and authHelper are custom fixtures
  const user = await userFactory.createUser();
  await authHelper.login(page, user.email, user.password);
  // ... test continues ...
  // Auto-cleanup: userFactory.cleanup() called after test
});
```

**Pattern**: Pure function → fixture → `mergeTests` composition with auto-cleanup

**Benefits**:
- Automatic resource cleanup
- Reusable test utilities
- Type-safe fixture dependencies
- No manual cleanup in tests

### Data Factories

**UserFactory** creates test users with realistic fake data:

```typescript
const factory = new UserFactory();

// Create single user
const user = await factory.createUser({ role: 'admin' });

// Create multiple users
const users = await factory.createUsers(5);

// Create admin user
const admin = await factory.createAdmin();

// Cleanup happens automatically via fixture
```

**Features**:
- Uses `@faker-js/faker` for realistic data
- Tracks created entities for cleanup
- Supports field overrides
- Integrates with API/Supabase

**Pattern**: Faker-based factories with auto-cleanup

### Authentication Helper

**AuthHelper** provides login/logout utilities:

```typescript
const authHelper = new AuthHelper();

await authHelper.login(page, email, password);
await authHelper.logout(page);
const isLoggedIn = await authHelper.isLoggedIn(page);
```

## ✅ Best Practices

### 1. Selector Strategy

**Always use `data-testid` attributes:**

```typescript
// ❌ Bad: Brittle CSS selectors
await page.click('.btn-primary.login-btn');

// ✅ Good: Stable data-testid selectors
await page.click('[data-testid="login-button"]');
```

**Add to your components:**

```tsx
<button data-testid="login-button">Login</button>
<input data-testid="email-input" type="email" />
```

### 2. Test Isolation

**Each test must be independent:**

```typescript
// ✅ Good: Fresh data per test via factory
test('should update user', async ({ userFactory }) => {
  const user = await userFactory.createUser();
  // Test uses fresh user, cleanup automatic
});

// ❌ Bad: Shared state between tests
let sharedUser;
test.beforeAll(async () => {
  sharedUser = await createUser(); // Pollutes other tests
});
```

### 3. Given-When-Then Structure

```typescript
test('should login successfully', async ({ page, authHelper }) => {
  // Given: user navigates to login page
  await page.goto('/login');

  // When: user submits valid credentials
  await authHelper.login(page, 'user@test.com', 'password');

  // Then: user should see dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

### 4. Deterministic Waiting

**Use Playwright's built-in waiting:**

```typescript
// ❌ Bad: Hard-coded timeout
await page.waitForTimeout(5000);

// ✅ Good: Wait for specific condition
await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
await page.waitForURL('/dashboard');
await page.waitForLoadState('networkidle');
```

### 5. Network-First Testing

**Intercept network before navigation:**

```typescript
// ✅ Good: Route setup before goto
await page.route('**/api/users', route =>
  route.fulfill({ status: 200, body: JSON.stringify(mockUsers) })
);
await page.goto('/users'); // Now intercept is active

// ❌ Bad: goto before route
await page.goto('/users');
await page.route('**/api/users', ...); // Too late!
```

### 6. Failure Artifacts

**Configured to capture only on failure:**

- Screenshots: `only-on-failure`
- Videos: `retain-on-failure`
- Traces: `retain-on-failure`

This reduces storage while maintaining debugging capability.

### 7. Test Quality Standards

- **Length**: Max 50 lines per test
- **Time**: Max 60 seconds timeout
- **Assertions**: Explicit expectations (no implicit waits)
- **Cleanup**: Automatic via fixtures

## 🔄 CI Integration

### GitHub Actions Configuration

Tests run automatically on:
- Pull requests
- Pushes to `main`/`develop`

**Configuration** (`.github/workflows/test.yml`):

```yaml
- name: Run Playwright tests
  run: pnpm test:e2e
  env:
    CI: true
    BASE_URL: ${{ secrets.TEST_BASE_URL }}
```

**CI-specific settings** (from `playwright.config.ts`):
- Retries: 2 (only on CI)
- Workers: 1 (sequential execution)
- `forbidOnly: true` (prevents accidental `.only()`)

### Test Reports

- **HTML Report**: `test-results/html/index.html`
- **JUnit XML**: `test-results/junit.xml` (for CI dashboards)
- **Console**: Real-time output

## 🐛 Troubleshooting

### Common Issues

#### Issue: Tests fail with "Cannot find module"

**Solution**: Install dependencies and Playwright browsers

```bash
pnpm install
npx playwright install
```

#### Issue: Tests timeout waiting for app

**Solution**: Check `BASE_URL` in `.env.test` and ensure app is running

```bash
# Start app in separate terminal
pnpm dev

# Or enable webServer in playwright.config.ts
```

#### Issue: Fixture cleanup not working

**Solution**: Ensure fixture is used in test and cleanup logic is correct

```typescript
// ✅ Fixture is used (cleanup happens)
test('example', async ({ userFactory }) => {
  await userFactory.createUser();
});

// ❌ Fixture not used (no cleanup)
test('example', async ({ page }) => {
  const factory = new UserFactory(); // Manual creation, no auto-cleanup
});
```

#### Issue: Network interception not working

**Solution**: Setup route **before** navigation

```typescript
// ✅ Correct order
await page.route('**/api/**', ...);
await page.goto('/dashboard');

// ❌ Wrong order
await page.goto('/dashboard');
await page.route('**/api/**', ...); // Too late
```

### Debug Mode

**Run single test with debugger:**

```bash
npx playwright test example.spec.ts --debug
```

**Trace viewer for failed tests:**

```bash
npx playwright show-trace test-results/.../trace.zip
```

## 📚 Knowledge Base References

This framework follows patterns from:

- **Fixture Architecture** (`.bmad/bmm/testarch/knowledge/fixture-architecture.md`)
  - Pure function → fixture → mergeTests composition
  - Auto-cleanup pattern

- **Data Factories** (`.bmad/bmm/testarch/knowledge/data-factories.md`)
  - Faker-based with overrides
  - Nested factories and API seeding

- **Network-First Testing** (`.bmad/bmm/testarch/knowledge/network-first.md`)
  - Intercept before navigate
  - HAR capture and deterministic waiting

- **Playwright Config** (`.bmad/bmm/testarch/knowledge/playwright-config.md`)
  - Environment-based configuration
  - Timeout standards and parallelization

- **Test Quality** (`.bmad/bmm/testarch/knowledge/test-quality.md`)
  - Deterministic, isolated tests
  - Explicit assertions and length limits

## 📝 Next Steps

1. **Implement Real API Integration**
   - Replace mock API calls in `UserFactory`
   - Connect to Supabase for user creation/deletion

2. **Add Page Objects** (optional)
   - Create page objects for complex flows
   - Place in `tests/support/page-objects/`

3. **Expand Factories**
   - Create factories for other entities (Products, Orders, etc.)
   - Add nested factory support

4. **Add More Helpers**
   - API helper for direct API testing
   - Database helper for seeding/cleanup
   - Network helper for mocking

5. **Setup CI Pipeline**
   - Run `testarch:ci` workflow for GitHub Actions setup
   - Configure test reporting and artifacts

## 📞 Support

For questions or issues:
- Check `.bmad/bmm/testarch/knowledge/` for patterns
- Review Playwright docs: https://playwright.dev
- See `CLAUDE.md` for project-specific guidance

---

**Generated by**: BMAD Test Architect v6.0
**Framework**: Playwright + TypeScript
**Date**: 2025-11-20
