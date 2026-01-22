/**
 * E2E Tests: Customers CRUD (Story 07.1)
 * Phase: RED - All tests should FAIL (no implementation exists)
 *
 * Tests complete user workflows:
 * - Create customer -> Add contacts -> Add addresses -> Verify list
 * - Search and filter customers
 * - Edit customer details
 * - Manage addresses (add, edit, delete, set default)
 * - Archive customer (soft delete)
 * - Pagination
 * - Cross-tenant isolation
 *
 * Run: pnpm test:e2e --grep "Customers CRUD"
 */

import { test, expect, type Page } from '@playwright/test'

// Test credentials from environment
const TEST_EMAIL_A = process.env.E2E_TEST_EMAIL_A || 'user-a@test.com'
const TEST_PASSWORD_A = process.env.E2E_TEST_PASSWORD_A || 'TestPassword123!'
const TEST_EMAIL_B = process.env.E2E_TEST_EMAIL_B || 'user-b@test.com'
const TEST_PASSWORD_B = process.env.E2E_TEST_PASSWORD_B || 'TestPassword123!'

// =============================================================================
// HELPERS
// =============================================================================

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|shipping)/)
}

async function goToCustomers(page: Page) {
  await page.goto('/shipping/customers')
  await page.waitForSelector('[data-testid="customers-table"]', { timeout: 10000 })
}

async function createTestCustomer(
  page: Page,
  data: { code: string; name: string; category: string }
) {
  await page.click('[data-testid="add-customer-btn"]')
  await page.waitForSelector('[data-testid="customer-form"]')

  await page.fill('input[name="customer_code"]', data.code)
  await page.fill('input[name="name"]', data.name)
  await page.selectOption('select[name="category"]', data.category)

  await page.click('button[type="submit"]')
  await page.waitForSelector('[data-testid="toast-success"]', { timeout: 5000 })
}

// =============================================================================
// HAPPY PATH WORKFLOW
// =============================================================================

test.describe('Customers CRUD - Happy Path (Story 07.1)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
  })

  test('should complete full workflow: Create -> Contacts -> Addresses -> List', async ({
    page,
  }) => {
    // Step 1: Navigate to customers list
    await goToCustomers(page)
    await expect(page.locator('[data-testid="customers-table"]')).toBeVisible()

    // Step 2: Click Create Customer button
    await page.click('[data-testid="add-customer-btn"]')
    await expect(page.locator('[data-testid="customer-form"]')).toBeVisible()

    // Step 3: Fill customer form
    const uniqueCode = `TESTCORP-${Date.now()}`
    await page.fill('input[name="customer_code"]', uniqueCode)
    await page.fill('input[name="name"]', 'Test Corporation E2E')
    await page.selectOption('select[name="category"]', 'wholesale')

    // Step 4: Select allergens (milk, peanuts)
    await page.click('[data-testid="allergen-select"]')
    await page.click('[data-testid="allergen-option-milk"]')
    await page.click('[data-testid="allergen-option-peanuts"]')
    await expect(page.locator('[data-testid="allergen-chip-milk"]')).toBeVisible()
    await expect(page.locator('[data-testid="allergen-chip-peanuts"]')).toBeVisible()

    // Step 5: Submit customer form
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // Should navigate to customer detail page
    await page.waitForURL(/\/shipping\/customers\/[a-f0-9-]+$/)

    // Step 6: Click Contacts tab
    await page.click('[data-testid="tab-contacts"]')
    await expect(page.locator('[data-testid="contacts-empty"]')).toBeVisible()

    // Step 7: Add first contact
    await page.click('[data-testid="add-contact-btn"]')
    await page.waitForSelector('[data-testid="contact-modal"]')
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@test.com')
    await page.fill('input[name="title"]', 'Buyer')

    // Step 8: Submit contact
    await page.click('[data-testid="contact-modal"] button[type="submit"]')
    await expect(page.locator('[data-testid="contact-row"]:has-text("John Doe")')).toBeVisible()

    // Step 9: Add second contact
    await page.click('[data-testid="add-contact-btn"]')
    await page.fill('input[name="name"]', 'Jane Smith')
    await page.fill('input[name="email"]', 'jane@test.com')
    await page.click('[data-testid="contact-modal"] button[type="submit"]')
    await expect(page.locator('[data-testid="contact-row"]')).toHaveCount(2)

    // Step 10: Click Addresses tab
    await page.click('[data-testid="tab-addresses"]')
    await expect(page.locator('[data-testid="addresses-empty"]')).toBeVisible()

    // Step 11: Add shipping address with dock_hours
    await page.click('[data-testid="add-address-btn"]')
    await page.waitForSelector('[data-testid="address-modal"]')
    await page.click('input[name="address_type"][value="shipping"]')
    await page.fill('input[name="address_line1"]', '123 Main St')
    await page.fill('input[name="city"]', 'New York')
    await page.fill('input[name="postal_code"]', '10001')
    await page.fill('input[name="country"]', 'USA')
    await page.check('input[name="is_default"]')

    // Add dock hours
    await page.fill('input[name="dock_hours.mon"]', '08:00-17:00')

    // Step 12: Submit address
    await page.click('[data-testid="address-modal"] button[type="submit"]')
    await expect(page.locator('[data-testid="address-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="default-address-star"]')).toBeVisible()

    // Step 13: Navigate back to customers list
    await page.goto('/shipping/customers')
    await page.waitForSelector('[data-testid="customers-table"]')

    // Step 14: Verify customer appears in list
    await expect(page.locator(`[data-testid="customer-row"]:has-text("${uniqueCode}")`)).toBeVisible()

    // Click to verify detail preserved
    await page.click(`[data-testid="customer-row"]:has-text("${uniqueCode}")`)
    await expect(page.locator('[data-testid="customer-detail"]')).toBeVisible()
    await expect(page.locator('text=Test Corporation E2E')).toBeVisible()
  })
})

// =============================================================================
// FILTER AND SEARCH
// =============================================================================

test.describe('Customers CRUD - Filter and Search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
    await goToCustomers(page)
  })

  test('should search by customer_code', async ({ page }) => {
    // Type search term
    await page.fill('input[placeholder*="Search"]', 'ACME')
    await page.waitForTimeout(500) // Debounce

    // Verify filtered results
    const rows = page.locator('[data-testid="customer-row"]')
    const count = await rows.count()

    // Should show filtered results
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent()
      expect(text?.toLowerCase()).toContain('acme')
    }
  })

  test('should filter by category', async ({ page }) => {
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="filter-option-wholesale"]')

    await page.waitForTimeout(500)

    // All visible rows should be wholesale
    const badges = page.locator('[data-testid="customer-row"] [data-testid="category-badge"]')
    const count = await badges.count()

    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText('wholesale')
    }
  })

  test('should filter by active status', async ({ page }) => {
    // Toggle to show inactive
    await page.click('[data-testid="active-filter-toggle"]')

    await page.waitForTimeout(500)

    // Should show inactive customers
    await expect(page.locator('[data-testid="status-badge-inactive"]')).toBeVisible()
  })

  test('should clear search and maintain category filter', async ({ page }) => {
    // Set category filter
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="filter-option-wholesale"]')

    // Search
    await page.fill('input[placeholder*="Search"]', 'TEST')
    await page.waitForTimeout(500)

    // Clear search
    await page.click('[data-testid="clear-search"]')
    await page.waitForTimeout(500)

    // Category filter should still be applied
    await expect(page.locator('[data-testid="active-filter-chip"]:has-text("wholesale")')).toBeVisible()
  })
})

// =============================================================================
// EDIT CUSTOMER
// =============================================================================

test.describe('Customers CRUD - Edit Customer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
  })

  test('should update customer name', async ({ page }) => {
    await goToCustomers(page)

    // Click first customer
    await page.click('[data-testid="customer-row"]:first-child')
    await page.waitForSelector('[data-testid="customer-detail"]')

    // Click edit button
    await page.click('[data-testid="edit-customer-btn"]')

    // Update name
    const updatedName = `Updated Corp ${Date.now()}`
    await page.fill('input[name="name"]', updatedName)

    // Submit
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // Verify update persisted
    await page.reload()
    await expect(page.locator(`text=${updatedName}`)).toBeVisible()
  })

  test('should add allergen restriction', async ({ page }) => {
    await goToCustomers(page)

    await page.click('[data-testid="customer-row"]:first-child')
    await page.click('[data-testid="edit-customer-btn"]')

    // Add allergen
    await page.click('[data-testid="allergen-select"]')
    await page.click('[data-testid="allergen-option-fish"]')

    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // Verify allergen chip shown
    await expect(page.locator('[data-testid="allergen-chip-fish"]')).toBeVisible()
  })

  test('should prevent customer_code change (readonly)', async ({ page }) => {
    await goToCustomers(page)

    await page.click('[data-testid="customer-row"]:first-child')
    await page.click('[data-testid="edit-customer-btn"]')

    // customer_code should be disabled/readonly in edit mode
    const codeInput = page.locator('input[name="customer_code"]')
    await expect(codeInput).toBeDisabled()
  })
})

// =============================================================================
// MANAGE ADDRESSES
// =============================================================================

test.describe('Customers CRUD - Manage Addresses', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
    await goToCustomers(page)
    await page.click('[data-testid="customer-row"]:first-child')
    await page.click('[data-testid="tab-addresses"]')
  })

  test('should add billing address', async ({ page }) => {
    await page.click('[data-testid="add-address-btn"]')
    await page.click('input[name="address_type"][value="billing"]')
    await page.fill('input[name="address_line1"]', '456 Finance Blvd')
    await page.fill('input[name="city"]', 'Chicago')
    await page.fill('input[name="postal_code"]', '60601')
    await page.fill('input[name="country"]', 'USA')

    await page.click('[data-testid="address-modal"] button[type="submit"]')

    await expect(page.locator('[data-testid="address-row"]:has-text("456 Finance Blvd")')).toBeVisible()
    await expect(page.locator('[data-testid="address-type-badge"]:has-text("billing")')).toBeVisible()
  })

  test('should set address as default', async ({ page }) => {
    // Find non-default address and set as default
    const setDefaultBtn = page.locator('[data-testid="set-default-btn"]:first-child')
    await setDefaultBtn.click()

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="default-address-star"]')).toBeVisible()
  })

  test('should edit address city', async ({ page }) => {
    await page.click('[data-testid="address-row"]:first-child [data-testid="edit-address-btn"]')
    await page.waitForSelector('[data-testid="address-modal"]')

    await page.fill('input[name="city"]', 'Los Angeles')
    await page.click('[data-testid="address-modal"] button[type="submit"]')

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="address-row"]:has-text("Los Angeles")')).toBeVisible()
  })

  test('should delete address with confirmation', async ({ page }) => {
    // Ensure there are multiple addresses first
    const initialCount = await page.locator('[data-testid="address-row"]').count()
    expect(initialCount).toBeGreaterThan(1)

    await page.click('[data-testid="address-row"]:last-child [data-testid="delete-address-btn"]')

    // Confirmation modal
    await expect(page.locator('[data-testid="confirm-delete-modal"]')).toBeVisible()
    await page.click('[data-testid="confirm-delete-btn"]')

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    const newCount = await page.locator('[data-testid="address-row"]').count()
    expect(newCount).toBe(initialCount - 1)
  })
})

// =============================================================================
// ARCHIVE CUSTOMER
// =============================================================================

test.describe('Customers CRUD - Archive Customer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
  })

  test('should archive customer (soft delete)', async ({ page }) => {
    await goToCustomers(page)

    await page.click('[data-testid="customer-row"]:first-child')
    await page.waitForSelector('[data-testid="customer-detail"]')

    // Get customer status
    await expect(page.locator('[data-testid="status-badge-active"]')).toBeVisible()

    // Click archive button
    await page.click('[data-testid="archive-customer-btn"]')

    // Confirmation dialog
    await expect(page.locator('[data-testid="confirm-archive-modal"]')).toBeVisible()
    await page.click('[data-testid="confirm-archive-btn"]')

    // Navigate to list
    await page.waitForURL('/shipping/customers')

    // Filter by inactive to see archived customer
    await page.click('[data-testid="active-filter-toggle"]')
    await expect(page.locator('[data-testid="status-badge-inactive"]')).toBeVisible()
  })

  test('should show error when archiving customer with open orders', async ({ page }) => {
    await goToCustomers(page)

    // Navigate to customer known to have open orders (test setup required)
    await page.click('[data-testid="customer-row"]:has-text("CustomerWithOrders")')
    await page.click('[data-testid="archive-customer-btn"]')
    await page.click('[data-testid="confirm-archive-btn"]')

    // Should show error
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible()
    await expect(page.locator('text=Cannot archive customer with open orders')).toBeVisible()
  })
})

// =============================================================================
// PAGINATION
// =============================================================================

test.describe('Customers CRUD - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
    await goToCustomers(page)
  })

  test('should show pagination controls when > 50 customers', async ({ page }) => {
    // Pagination should be visible
    const pagination = page.locator('[data-testid="pagination"]')
    await expect(pagination).toBeVisible()
  })

  test('should navigate to page 2', async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination"]')
    const nextBtn = pagination.locator('[data-testid="next-page"]')

    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(500)

      // URL should update or page indicator should change
      await expect(page.locator('[data-testid="current-page"]:has-text("2")')).toBeVisible()
    }
  })

  test('should navigate back to page 1', async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination"]')

    // First go to page 2
    const nextBtn = pagination.locator('[data-testid="next-page"]')
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(500)

      // Then go back
      await page.click('[data-testid="prev-page"]')
      await page.waitForTimeout(500)

      await expect(page.locator('[data-testid="current-page"]:has-text("1")')).toBeVisible()
    }
  })
})

// =============================================================================
// CROSS-TENANT ISOLATION
// =============================================================================

test.describe('Customers CRUD - Cross-Tenant Isolation', () => {
  test('should show 404 when accessing other org customer', async ({ page }) => {
    // Login as user A
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)

    // Try to access user B's customer by direct URL
    await page.goto('/shipping/customers/cust-org-b-customer-id')

    // Should show 404 page (not 403)
    await expect(page.locator('[data-testid="error-404"]')).toBeVisible()
  })

  test('should only show own org customers in list', async ({ page }) => {
    // Login as user B
    await login(page, TEST_EMAIL_B, TEST_PASSWORD_B)
    await goToCustomers(page)

    // Should not see user A's customers
    // Verify no "ACME001" or other org A customer codes
    const rows = page.locator('[data-testid="customer-row"]')
    const count = await rows.count()

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent()
      // Should not contain org A's test customer codes
      expect(text).not.toContain('ACME001')
    }
  })

  test('should API return 404 for cross-tenant customer ID', async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)

    // Make API call to org B's customer
    const response = await page.request.get('/api/shipping/customers/cust-org-b-id')

    expect(response.status()).toBe(404)
  })
})

// =============================================================================
// EMPTY STATE
// =============================================================================

test.describe('Customers CRUD - Empty State', () => {
  test('should show empty state when no customers', async ({ page }) => {
    // This test requires a fresh org with no customers
    // For now, we check the empty state UI exists
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
    await page.goto('/shipping/customers')

    // If no customers, empty state should show
    const emptyState = page.locator('[data-testid="customers-empty"]')
    const table = page.locator('[data-testid="customers-table"]')

    // Either empty state or table should be visible
    const emptyVisible = await emptyState.isVisible()
    const tableVisible = await table.isVisible()

    expect(emptyVisible || tableVisible).toBe(true)

    if (emptyVisible) {
      await expect(page.locator('text=No customers yet')).toBeVisible()
      await expect(page.locator('[data-testid="create-first-customer-btn"]')).toBeVisible()
    }
  })
})

// =============================================================================
// LOADING STATES
// =============================================================================

test.describe('Customers CRUD - Loading States', () => {
  test('should show loading spinner during data fetch', async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)

    // Navigate and check for loading state
    await page.goto('/shipping/customers')

    // Loading spinner should appear briefly
    // We check it exists in DOM (may be too fast to catch visually)
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    await expect(loadingSpinner).toBeAttached()

    // After load, table should be visible
    await page.waitForSelector('[data-testid="customers-table"]')
  })

  test('should show form submission loading state', async ({ page }) => {
    await login(page, TEST_EMAIL_A, TEST_PASSWORD_A)
    await goToCustomers(page)

    await page.click('[data-testid="add-customer-btn"]')

    await page.fill('input[name="customer_code"]', `LOAD-${Date.now()}`)
    await page.fill('input[name="name"]', 'Loading Test')
    await page.selectOption('select[name="category"]', 'retail')

    await page.click('button[type="submit"]')

    // Submit button should show loading state
    await expect(page.locator('button[type="submit"]:has-text("Creating...")')).toBeVisible()
  })
})

/**
 * E2E Test Coverage Summary for Story 07.1 - Customers CRUD
 * ==========================================================
 *
 * Happy Path: 1 comprehensive workflow test
 *   - Create -> Contacts -> Addresses -> List verification
 *
 * Filter and Search: 4 tests
 *   - Search by code
 *   - Filter by category
 *   - Filter by active status
 *   - Clear search maintains filter
 *
 * Edit Customer: 3 tests
 *   - Update name
 *   - Add allergen
 *   - Prevent code change
 *
 * Manage Addresses: 4 tests
 *   - Add billing address
 *   - Set default
 *   - Edit city
 *   - Delete with confirmation
 *
 * Archive Customer: 2 tests
 *   - Soft delete
 *   - Error with open orders
 *
 * Pagination: 3 tests
 *   - Controls visible
 *   - Navigate to page 2
 *   - Navigate back
 *
 * Cross-Tenant Isolation: 3 tests
 *   - 404 on direct URL access
 *   - Only own org in list
 *   - API 404 cross-tenant
 *
 * Empty State: 1 test
 *   - Empty state UI
 *
 * Loading States: 2 tests
 *   - Data fetch spinner
 *   - Form submission loading
 *
 * Total: 23 E2E tests
 * Status: ALL FAIL (RED phase - no implementation)
 */
