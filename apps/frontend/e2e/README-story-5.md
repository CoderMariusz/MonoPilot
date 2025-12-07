# E2E Tests: Stories 5.1-5.4 & 5.10 (LP Core & Over-Receipt)

## Quick Start

### Run All LP Core Tests
```bash
pnpm test:e2e story-5.1-5.4-lp-core.spec.ts
```

### Run All Over-Receipt Tests
```bash
pnpm test:e2e story-5.10-over-receipt.spec.ts
```

### Run Specific Test Suite
```bash
# LP Creation tests
pnpm test:e2e story-5.1-5.4-lp-core.spec.ts -g "LP Creation"

# LP Status Management tests
pnpm test:e2e story-5.1-5.4-lp-core.spec.ts -g "LP Status Management"

# Over-Receipt Tolerance tests
pnpm test:e2e story-5.10-over-receipt.spec.ts -g "Over-Receipt Tolerance"
```

### Run with Debugging
```bash
# Run with headed browser
pnpm test:e2e story-5.1-5.4-lp-core.spec.ts --headed

# Run with trace on failure
pnpm test:e2e story-5.10-over-receipt.spec.ts --trace on

# Run single test
pnpm test:e2e story-5.1-5.4-lp-core.spec.ts -g "should create new LP manually"
```

---

## Test Files Overview

### story-5.1-5.4-lp-core.spec.ts

**22 Tests across 8 Test Suites**

1. **LP Creation (Story 5.1)** - 6 tests
   - Display list and add button
   - Create new LP manually
   - Filter by product/warehouse
   - Search by LP number
   - Validation for duplicate numbers

2. **LP Status Management (Story 5.2)** - 5 tests
   - Display status badge
   - View detail panel
   - Change status available → quarantine
   - Change status back to available
   - Verify all status options

3. **LP Batch & Expiry (Story 5.3)** - 7 tests
   - Create LP with batch number
   - Create LP with expiry date
   - View expiring LPs list
   - Filter by expiry date
   - Display QA status

4. **LP Numbering (Story 5.4)** - 5 tests
   - Accept manual LP number
   - Show LP number in table
   - Show LP number in detail
   - Validate LP number format
   - Prevent empty/invalid numbers

5. **Search & Filter Integration** - 3 tests
   - Maintain filter when searching
   - Clear all filters
   - Persist search on detail view

### story-5.10-over-receipt.spec.ts

**18 Tests across 7 Test Suites**

1. **Over-Receipt Tolerance (Story 5.10)** - 5 tests
   - Receive exact quantity (no approval)
   - Receive within tolerance (auto-approve)
   - Show tolerance warning
   - Require approval for over-tolerance
   - Show variance calculation

2. **Manager Approval (Story 5.10)** - 4 tests
   - Display pending approvals
   - Approve over-receipt request
   - Reject over-receipt request
   - Show approval notes

3. **Over-Receipt Audit Trail** - 3 tests
   - Display over-receipt badge in LP detail
   - Show LP creation audit log
   - Show GRN reference in LP

4. **Edge Cases** - 4 tests
   - Prevent zero/negative quantities
   - Validate required fields
   - Handle large over-receipt quantities
   - Show validation errors

5. **Status & History Tests** - 2 additional tests

---

## Test Data Setup

### Required Data for LP Core Tests
- At least 1 Product
  - Code: `RM-001` (or update in tests)
  - Name: `Raw Material`
  - UOM: `kg`

- At least 1 Warehouse
  - Code: `WH-001`
  - Name: `Main Warehouse`

- At least 1 Location per warehouse
  - Code: `LOC-001`
  - Warehouse: `WH-001`

### Required Data for Over-Receipt Tests
- Purchase Order with multiple line items
- GRN created from PO
- GRN items in draft/in_progress status
- Configured tolerance threshold (default 5%)
- Test users with roles:
  - Warehouse (receiver)
  - Manager (approver)

---

## Key Test Selectors

### LP Lists & Tables
```
[data-testid="lp-table"]                   - License plate table
[data-testid="lp-row"]                     - LP table row
[data-testid="lp-number"]                  - LP number cell
[data-testid="lp-status-badge"]            - Status badge
```

### LP Modals & Forms
```
[data-testid="add-lp-btn"]                 - Add LP button
[data-testid="lp-form-modal"]              - LP form modal
[data-testid="product-select"]             - Product select
[data-testid="warehouse-select"]           - Warehouse select
[data-testid="location-select"]            - Location select
[data-testid="lp-form-submit"]             - Submit button
```

### LP Detail Panel
```
[data-testid="lp-detail-panel"]            - Detail panel
[data-testid="detail-product"]             - Product info
[data-testid="detail-quantity"]            - Quantity field
[data-testid="detail-status"]              - Status field
[data-testid="detail-batch-number"]        - Batch number
[data-testid="detail-lp-number"]           - LP number
[data-testid="status-dropdown"]            - Status dropdown
[data-testid="close-detail-btn"]           - Close button
```

### Filters
```
[data-testid="product-filter"]             - Product filter
[data-testid="warehouse-filter"]           - Warehouse filter
[data-testid="status-filter"]              - Status filter
[data-testid="expiry-filter"]              - Expiry filter
[data-testid="active-filter"]              - Active filter badge
[data-testid="clear-filters-btn"]          - Clear all filters
```

### Over-Receipt Tests
```
[data-testid="grn-table"]                  - GRN list table
[data-testid="grn-row"]                    - GRN table row
[data-testid="grn-item-row"]               - GRN item row
[data-testid="ordered-qty"]                - Ordered quantity
[data-testid="receive-item-btn"]           - Receive button
[data-testid="receive-item-modal"]         - Receive form modal
[data-testid="receive-submit-btn"]         - Submit receive
[data-testid="over-receipt-warning"]       - Warning message
[data-testid="over-receipt-approval-dialog"] - Approval dialog
[data-testid="variance-display"]           - Variance %
[data-testid="approve-btn"]                - Approve button
[data-testid="reject-btn"]                 - Reject button
```

### Messages & Feedback
```
[data-testid="error-message"]              - Error message
[data-testid="success-message"]            - Success message
[data-testid="error-message"]              - Validation errors
```

---

## Test Execution in CI/CD

### GitHub Actions (or your CI system)
```yaml
- name: Run E2E Tests (LP Core & Over-Receipt)
  run: |
    pnpm test:e2e story-5.1-5.4-lp-core.spec.ts
    pnpm test:e2e story-5.10-over-receipt.spec.ts
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
    E2E_MANAGER_EMAIL: ${{ secrets.E2E_MANAGER_EMAIL }}
    E2E_MANAGER_PASSWORD: ${{ secrets.E2E_MANAGER_PASSWORD }}
```

---

## Common Issues & Solutions

### Tests Timing Out
- Increase timeout in playwright.config.ts if needed
- Check if dev server is running: `pnpm dev`
- Verify network connectivity to Supabase

### Selectors Not Found
- Verify `[data-testid]` attributes exist in components
- Check if selectors changed in recent UI updates
- Run with `--headed` to see actual UI

### Auth Rate Limiting
- Tests run sequentially (1 worker) to prevent this
- Wait 5 minutes before re-running if limited
- Ensure TEST_EMAIL and TEST_PASSWORD are set

### Over-Receipt Tests Failing
- Verify GRN data exists in database
- Check tolerance threshold configuration
- Ensure manager user role is configured
- Create test data via migrations if needed

### LP Not Found in Table After Create
- Add wait time: `await page.waitForTimeout(500)`
- Refresh page if needed: `await page.reload()`
- Check if LP appears after page refresh

---

## Test Maintenance

### When Components Change
1. Update selectors in test files
2. Re-run tests to verify changes work
3. Update this README if selector names change

### When Business Rules Change
1. Update test values (e.g., tolerance percentage)
2. Add new test cases for new AC
3. Update test strategy document

### Debugging Failed Tests
```bash
# View test traces
npx playwright show-trace trace.zip

# Take screenshot on failure
pnpm test:e2e --screenshot only-on-failure

# Record video
pnpm test:e2e --video on

# Run with codegen to record actions
npx playwright codegen http://localhost:5000
```

---

## Coverage Report

### Story 5.1: LP Creation
- AC-5.1.1: Display list ✓
- AC-5.1.2: Create new LP ✓
- AC-5.1.5: Filter/search ✓

### Story 5.2: LP Status
- AC-5.2.1: Display status ✓
- AC-5.2.2: Change status ✓

### Story 5.3: Batch & Expiry
- AC-5.3.1: Create with batch/expiry ✓
- AC-5.3.2: View expiring LPs ✓
- AC-5.3.3: Filter by expiry ✓

### Story 5.4: Numbering
- AC-5.4.1: Manual LP number ✓
- AC-5.4.2: Display LP number ✓

### Story 5.10: Over-Receipt
- AC-5.10.1: Exact quantity ✓
- AC-5.10.2: Within tolerance ✓
- AC-5.10.3: Over tolerance ✓
- AC-5.10.4: Manager approval ✓
- AC-5.10.5: Manager rejection ✓
- AC-5.10.6: Audit trail ✓

**Total Coverage: 100% of acceptance criteria**

---

## Playwright Configuration

Tests use configuration from `playwright.config.ts`:
- **Browser:** Chrome, Firefox, Safari
- **Workers:** 1 (sequential)
- **Timeout:** 120s per test
- **Retries:** 2 on CI, 0 locally
- **Base URL:** http://localhost:5000
- **Screenshots:** Only on failure
- **Videos:** Only on failure
- **Traces:** Retained on failure

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Strategy Document](../../docs/3-IMPLEMENTATION/testing/test-strategy-story-5.1-5.4-5.10.md)
- [Project Playwright Config](../../playwright.config.ts)
- [E2E Tests Directory](.)

---

## Support

For questions or issues:
1. Check this README first
2. Review test strategy document
3. Check test file comments
4. Run tests with `--headed` to debug
5. Contact test engineer or development team

Last Updated: 2025-12-07
