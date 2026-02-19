# E2E Test Setup Guide

**Story**: 03.5b - PO Approval Workflow
**Date**: 2026-01-02
**Status**: Active

## Overview

This guide covers setting up and running E2E tests for the MonoPilot application, specifically for the PO Approval Workflow feature. E2E tests use Playwright and connect to a real Supabase database with test data.

## Prerequisites

1. **Supabase Project**: Active Supabase project with all migrations applied
2. **Environment Variables**: `.env` file configured with Supabase credentials
3. **Dependencies**: All npm packages installed (`pnpm install`)

## Quick Start

### 1. Seed Test Data

Run the seed script to populate Supabase with test data:

```bash
# Using ts-node
npx ts-node scripts/seed-e2e-test-data.ts

# OR add to package.json and run
pnpm seed:e2e
```

**What it creates:**
- Test organization: "E2E Test Organization"
- 3 test users (planner, manager, admin)
- 3 suppliers (Mill Co., Sugar Inc., Small Supplier)
- 2 warehouses (Main Warehouse, Raw Materials Warehouse)
- 3 products (Flour Type A, White Sugar, Sea Salt)
- Planning settings with approval workflow enabled

### 2. Run E2E Tests

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run with browser UI visible
pnpm test:e2e:headed

# Run with Playwright UI (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# View last test report
pnpm test:e2e:report
```

## Test Data

### Test Users

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| planner@company.com | password123 | planner | Create/edit POs, submit for approval |
| manager@company.com | password123 | manager | Approve/reject POs |
| admin@company.com | password123 | admin | Full access, approve/reject POs |

### Test Organization

- **Name**: E2E Test Organization
- **Slug**: e2e-test-org
- **Currency**: PLN
- **Timezone**: Europe/Warsaw

### Suppliers

| Code | Name | Payment Terms |
|------|------|---------------|
| MILL-001 | Mill Co. | Net 30 |
| SUGAR-001 | Sugar Inc. | Net 45 |
| SMALL-001 | Small Supplier | Net 14 |

### Warehouses

| Code | Name | Type |
|------|------|------|
| MAIN-WH | Main Warehouse | finished_goods |
| RAW-WH | Raw Materials Warehouse | raw_materials |

### Products

| Code | Name | Type | UOM | Shelf Life |
|------|------|------|-----|------------|
| FLOUR-A | Flour Type A | raw_material | kg | 180 days |
| SUGAR-W | White Sugar | raw_material | kg | 365 days |
| SALT-S | Sea Salt | raw_material | kg | 730 days |

### Planning Settings

- **Approval Required**: Yes
- **Approval Threshold**: $10,000
- **Approval Roles**: manager, admin
- **PO Prefix**: PO-
- **Currency**: PLN

## Using Test Fixtures

### Import Fixtures

```typescript
import {
  loginAsPlanner,
  loginAsManager,
  loginAsAdmin,
  createUserContext,
  createPurchaseOrder,
  submitPOForApproval,
  approvePO,
  rejectPO,
  verifyPOStatus,
  TEST_DATA,
  TEST_CREDENTIALS,
  POTestDataBuilder
} from '../fixtures/test-setup';
```

### Login Examples

```typescript
// Simple login
test('example test', async ({ page }) => {
  await loginAsPlanner(page);
  // Test continues with planner logged in
});

// Multiple users in same test
test('approval workflow', async ({ page, context }) => {
  // Login as planner
  await loginAsPlanner(page);

  // Create PO and get URL
  const { poUrl } = await createPurchaseOrder(page, {
    supplier: TEST_DATA.suppliers[0].name,
    warehouse: TEST_DATA.warehouses[0].name,
    product: TEST_DATA.products[0].name,
    quantity: 500,
    unitPrice: 30
  });

  await submitPOForApproval(page);

  // Login as manager in new context
  const managerPage = await createUserContext(context, 'manager');
  await managerPage.goto(poUrl);

  // Approve PO
  await approvePO(managerPage, 'Approved for Q4 stock');

  // Verify in planner context
  await page.reload();
  await verifyPOStatus(page, 'Approved');
});
```

### Create Purchase Orders

```typescript
// Using helper function
const { poUrl, poNumber } = await createPurchaseOrder(page, {
  supplier: 'Mill Co.',
  warehouse: 'Main Warehouse',
  product: 'Flour Type A',
  quantity: 500,
  unitPrice: 30,
  expectedDelivery: '2024-12-20'
});

// Using builder pattern
const builder = new POTestDataBuilder();
const poData = builder
  .withSupplier('Sugar Inc.')
  .withQuantity(1000)
  .withUnitPrice(5)
  .requiringApproval() // Sets qty/price > threshold
  .build();

const { poUrl } = await createPurchaseOrder(page, poData);
```

### Approval Actions

```typescript
// Submit for approval
await submitPOForApproval(page);

// Approve with notes
await approvePO(page, 'Approved for Q4 stock replenishment');

// Reject with reason
await rejectPO(page, 'Quantity too high, please reduce to 500kg');

// Verify status
await verifyPOStatus(page, 'Pending Approval');
await verifyPOStatus(page, 'Approved');
await verifyPOStatus(page, 'Rejected');
```

## Test Scenarios Covered

### E2E-01: Full Approval Workflow
- Planner creates PO above threshold
- Planner submits for approval
- Manager approves PO
- Planner confirms PO
- **Expected**: Status progresses through pending_approval → approved → confirmed

### E2E-02: Rejection Workflow
- Planner creates and submits PO
- Manager rejects with reason
- Planner edits PO
- Planner resubmits for approval
- **Expected**: Status goes draft → pending_approval → rejected → pending_approval

### E2E-03: Below Threshold
- Planner creates PO below $10,000 threshold
- Planner submits directly
- **Expected**: Status goes draft → submitted (no approval required)

### E2E-04: Permission Denied
- Planner creates PO above threshold
- Planner submits for approval
- Planner attempts to approve own PO
- **Expected**: Approve button not visible, permission denied

### E2E-05: Approval History
- Multiple actions performed on PO
- View approval history
- **Expected**: All actions logged in reverse chronological order

### E2E-06: Mobile Responsive
- Same tests on mobile viewport (375x667)
- **Expected**: Modal and buttons accessible, min 48px touch targets

### E2E-07: Concurrent Approval Prevention
- Two managers attempt to approve same PO simultaneously
- **Expected**: First succeeds, second gets error message

### E2E-08: Email Notifications
- Manager approves PO
- Planner receives notification
- **Expected**: Notification in UI (and email if configured)

## Troubleshooting

### Seed Script Fails

**Problem**: Cannot connect to Supabase
```
❌ Missing Supabase credentials in .env file
```

**Solution**: Check `.env` file has:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Users Already Exist

**Problem**: Seed script shows "User already exists"

**Solution**: This is normal - seed script is idempotent. It will reuse existing data. To start fresh:
```sql
-- Run in Supabase SQL Editor (CAREFUL - DELETES DATA!)
DELETE FROM users WHERE email LIKE '%@company.com';
DELETE FROM organizations WHERE slug = 'e2e-test-org';
```

### Tests Fail with "Cannot find element"

**Problem**: Tests fail because UI elements not found

**Solution**:
1. Ensure frontend dev server is running (`pnpm dev`)
2. Check `playwright.config.ts` has correct `baseURL`
3. Run `pnpm test:e2e:headed` to see what's happening

### RLS Policy Errors

**Problem**: Database returns empty results even though data exists

**Solution**:
1. Verify all migrations applied: `npx supabase db push`
2. Check RLS policies allow authenticated users to read data
3. Test with service role key in seed script (bypasses RLS)

### Auth Rate Limiting

**Problem**: Tests fail with "Too many requests"

**Solution**:
1. Playwright config uses `workers: 1` to prevent parallel auth
2. Set `fullyParallel: false` in `playwright.config.ts`
3. Add delays between tests if needed

## Configuration Files

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Prevent auth rate limiting
  workers: 1, // Single worker for sequential tests
  timeout: 120 * 1000, // 2 minutes
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  }
});
```

### .env.test (optional)

Create for test-specific environment:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-key
```

Then update `playwright.config.ts`:
```typescript
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
```

## Best Practices

### 1. Use Test Fixtures

Always use provided fixtures instead of duplicating login/setup code:
```typescript
// ❌ Don't do this
await page.goto('/login');
await page.fill('input[name="email"]', 'planner@company.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button:has-text("Sign In")');

// ✅ Do this
await loginAsPlanner(page);
```

### 2. Verify State Changes

Always verify state transitions:
```typescript
await submitPOForApproval(page);
await verifyPOStatus(page, 'Pending Approval'); // Explicit verification
```

### 3. Clean Test Data

Use builder pattern for clear test intent:
```typescript
const poData = new POTestDataBuilder()
  .requiringApproval()
  .withSupplier('Mill Co.')
  .build();
```

### 4. Test Isolation

Each test should be independent:
```typescript
test('approval workflow', async ({ page }) => {
  await loginAsPlanner(page);
  // Create new PO for this test only
  const { poUrl } = await createPurchaseOrder(page, {...});
  // ... test logic
});
```

### 5. Meaningful Assertions

Use descriptive assertions:
```typescript
// ❌ Generic
await expect(page.locator('button')).toBeVisible();

// ✅ Specific
await expect(page.locator('button:has-text("Approve")')).toBeVisible();
await expect(page.locator('[data-testid="po-status"]')).toContainText('Approved');
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Seed test data
        run: npx ts-node scripts/seed-e2e-test-data.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Maintenance

### Re-seed Test Data

If test data becomes corrupted or outdated:
```bash
# 1. Delete existing test org (via Supabase dashboard or SQL)
DELETE FROM organizations WHERE slug = 'e2e-test-org';

# 2. Re-run seed script
npx ts-node scripts/seed-e2e-test-data.ts
```

### Update Test Users

To change passwords or add users:
1. Edit `scripts/seed-e2e-test-data.ts` → `TEST_USERS` array
2. Edit `e2e/fixtures/test-setup.ts` → `TEST_CREDENTIALS` object
3. Re-run seed script

### Update Test Data

To change suppliers, products, etc:
1. Edit `scripts/seed-e2e-test-data.ts` → respective constants
2. Edit `e2e/fixtures/test-setup.ts` → `TEST_DATA` object
3. Re-run seed script

## Resources

- **Playwright Docs**: https://playwright.dev/docs/intro
- **Supabase Docs**: https://supabase.com/docs
- **Test Files**: `e2e/planning/po-approval-workflow.spec.ts`
- **Fixtures**: `e2e/fixtures/test-setup.ts`
- **Seed Script**: `scripts/seed-e2e-test-data.ts`

## Support

For issues or questions:
1. Check Playwright traces: `pnpm test:e2e:report`
2. Run in debug mode: `pnpm test:e2e:debug`
3. Check Supabase logs in dashboard
4. Review migration files for schema changes
