# E2E Testing Setup - Transfer Orders (Batch 3B)

## ⚡ Quick Start (Production DB Strategy)

**Tests run on PRODUCTION database, isolated by test organization**
- No separate project needed
- Auto-cleanup after each test
- Isolated by `org_id`

---

## Prerequisites

Before running tests, setup in production:

### 1. Create Test Organization

Via Supabase Dashboard or API:
```bash
curl -X POST http://localhost:5000/api/settings/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E2E Test Org",
    "description": "Automated tests for Batch 3B"
  }'

# Save the returned org_id → .env.test TEST_ORG_ID
```

### 2. Create Test User

Via Supabase Auth Dashboard or API:
```bash
# Supabase Dashboard → Auth → Users → Add User
# Email: test-user@monopilot.test
# Password: test-password-123
# Auto confirm: YES
```

### 3. Create Test Warehouses (Minimum 2)

Go to `/settings/warehouses` in your app:
```
Warehouse 1: "Test Warehouse FROM"
Warehouse 2: "Test Warehouse TO"
```

### 4. Create Test Products (Minimum 1)

Go to `/settings/products` in your app:
```
Product: "Test Product A" (uom: kg)
```

---

## Configure .env.test

Already configured with production credentials in `.env.test`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pgroxddbtaevdegnidaz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

TEST_USER_EMAIL=test-user@monopilot.test
TEST_USER_PASSWORD=test-password-123
TEST_ORG_ID=[YOUR_ORG_UUID]  # ← Update this
```

---

## Run E2E Tests

```bash
# Install dependencies
pnpm install

# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e transfer-orders.spec.ts

# Run with UI (debug mode)
pnpm test:e2e -- --ui

# Run with headed browser (see what's happening)
pnpm test:e2e -- --headed

# Generate HTML report
pnpm test:e2e -- --reporter=html
# Open: playwright-report/index.html
```

---

## How Tests Work

✅ **Setup Phase**
```typescript
test.beforeAll(() => {
  // Creates test user in TEST_ORG_ID
  // Gets existing warehouses and products
})
```

✅ **Test Execution**
```typescript
// Each test:
// 1. Creates Transfer Orders/Lines in TEST_ORG_ID
// 2. Performs operations (ship, edit, delete)
// 3. Asserts results
```

✅ **Cleanup Phase**
```typescript
test.afterAll(() => {
  // Deletes all TO data for TEST_ORG_ID
  // Deletes test user
  // Leaves org empty for next test run
})
```

---

## Important Notes

⚠️ **Data Isolation**
- All tests use `TEST_ORG_ID` organization
- No interference with other organizations
- Tests can run in parallel safely
- Automatic cleanup after each test run

⚠️ **Prerequisites**
- Test org must exist
- At least 2 warehouses in test org
- At least 1 product in test org
- Test user must be created
- All data must be in TEST_ORG_ID

✅ **Benefits**
- No extra costs (uses production DB)
- Tests against real environment
- Easy to inspect failed test data in Supabase
- Can run on CI/CD without separate infrastructure

---

## Troubleshooting

**Error: "No warehouses found"**
```
→ Create 2+ warehouses in test organization
→ Go to http://localhost:5000/settings/warehouses
→ Add warehouses (any name/code)
```

**Error: "No products found"**
```
→ Create products in test organization
→ Go to http://localhost:5000/settings/products
→ Add products with UoM (kg, l, etc.)
```

**Error: "Unauthorized" on API calls**
```
→ Check TEST_ORG_ID in .env.test is correct
→ Verify test user exists in Supabase Auth
→ Verify user role is "admin" or has permissions
```

**Error: "Port already in use (5000)"**
```bash
# Kill existing process
lsof -ti :5000 | xargs kill -9
# Or change port in playwright.config.ts
```

**Tests leave data behind**
```bash
# Manual cleanup in Supabase SQL Editor:
DELETE FROM to_line_lps
WHERE to_line_id IN (
  SELECT id FROM to_lines
  WHERE transfer_order_id IN (
    SELECT id FROM transfer_orders
    WHERE org_id = '[TEST_ORG_ID]'
  )
);

DELETE FROM to_lines
WHERE transfer_order_id IN (
  SELECT id FROM transfer_orders
  WHERE org_id = '[TEST_ORG_ID]'
);

DELETE FROM transfer_orders WHERE org_id = '[TEST_ORG_ID]';
```

---

## Next Steps

1. ✅ Create test organization
2. ✅ Create test user
3. ✅ Create test warehouses (2+)
4. ✅ Create test products (1+)
5. ✅ Update `.env.test` with TEST_ORG_ID
6. → Run `pnpm test:e2e`
