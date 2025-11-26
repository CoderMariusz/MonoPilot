# E2E Testing Checklist - Before Running Tests

## ✅ Pre-Test Setup (One-Time)

- [ ] **1. Create Test Organization**
  - Go to Settings → Organizations
  - Create: "E2E Test Org"
  - Copy org UUID

- [ ] **2. Update .env.test**
  ```bash
  TEST_ORG_ID=[paste uuid from step 1]
  ```

- [ ] **3. Create Test User**
  - Supabase Dashboard → Auth → Users
  - Add User:
    - Email: `test-user@monopilot.test`
    - Password: `test-password-123`
    - Auto confirm: YES

- [ ] **4. Create Test Warehouses**
  - Go to http://localhost:5000/settings/warehouses
  - Login with test user
  - Add Warehouse 1:
    - Code: `WH-FROM-TEST`
    - Name: `Test Warehouse FROM`
  - Add Warehouse 2:
    - Code: `WH-TO-TEST`
    - Name: `Test Warehouse TO`

- [ ] **5. Create Test Products**
  - Go to http://localhost:5000/settings/products
  - Add Product 1:
    - Code: `PROD-TEST-A`
    - Name: `Test Product A`
    - UoM: `kg`
  - Add Product 2 (optional):
    - Code: `PROD-TEST-B`
    - Name: `Test Product B`
    - UoM: `l`

---

## 🚀 Run E2E Tests

```bash
# Make sure dev server is running
pnpm dev &

# Wait 10 seconds, then run tests
pnpm test:e2e transfer-orders.spec.ts

# Or run all E2E tests
pnpm test:e2e

# View HTML report
open playwright-report/index.html
```

---

## 📋 Test Organization

All tests use same organization (TEST_ORG_ID):
- ✅ Isolated from production data
- ✅ Can run multiple times
- ✅ Auto-cleanup after each test run

---

## 🐛 If Tests Fail

1. **Check error message** in terminal
2. **Open Playwright Inspector**:
   ```bash
   pnpm test:e2e -- --debug
   ```
3. **Verify prerequisites** above
4. **Check Supabase Logs**:
   - Dashboard → Logs → Auth
   - Dashboard → Logs → Database

---

## 🧹 Manual Cleanup (if needed)

If tests fail and leave data:

```sql
-- Run in Supabase SQL Editor
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

## ✨ Done!

Once all checkboxes are ✅, run tests:
```bash
pnpm test:e2e transfer-orders.spec.ts
```
