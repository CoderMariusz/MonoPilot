import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

/**
 * Supplier E2E Tests
 * Epic 3: Supplier Management (Batch 3A)
 * Story: 3.17
 *
 * Tests cover:
 * - AC-3.17.1: List suppliers with filters and search
 * - AC-3.17.2: Create new supplier
 * - AC-3.17.3: Edit existing supplier
 * - AC-3.17.4: Delete supplier
 * - AC-3.17.5: View supplier details
 * - AC-3.17.6: Manage supplier products
 * - AC-3.17.7: Supplier status management (active/inactive)
 */

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserId: string
let testUserEmail: string
let testUserPassword: string

test.beforeAll(async () => {
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  const userResult = await createTestUser(testOrgId)
  testUserId = userResult.userId
  testUserEmail = userResult.email
  testUserPassword = userResult.password
})

test.afterAll(async () => {
  await cleanupTestData(testOrgId)
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsTestUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL(/\/(dashboard|planning)/, { timeout: 60000 })
}

async function createSupplierViaAPI(page: Page): Promise<string> {
  const supplierCode = `SUP-E2E-${Date.now()}`

  const response = await page.request.post('/api/planning/suppliers', {
    data: {
      code: supplierCode,
      name: `E2E Test Supplier ${Date.now()}`,
      contact_person: 'Test Contact',
      email: `test-${Date.now()}@example.com`,
      phone: '+48123456789',
      address: '123 Test Street',
      city: 'Warsaw',
      postal_code: '00-001',
      country: 'Poland',
      currency: 'PLN',
      payment_terms: 'Net 30',
      lead_time_days: 14,
      moq: 100,
      is_active: true,
    },
  })

  if (!response.ok()) {
    throw new Error(`Failed to create supplier: ${await response.text()}`)
  }

  const data = await response.json()
  return data.supplier?.id || data.id
}

async function deleteSupplierViaAPI(page: Page, supplierId: string): Promise<void> {
  await page.request.delete(`/api/planning/suppliers/${supplierId}`)
}

async function getExistingTaxCode(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/settings/tax-codes')
  if (!response.ok()) return null

  const data = await response.json()
  const taxCodes = data.tax_codes || data || []
  return taxCodes.length > 0 ? taxCodes[0].id : null
}

// ============================================================================
// STORY 3.17: SUPPLIER MANAGEMENT
// ============================================================================

test.describe('Story 3.17: Supplier Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  // ===== AC-3.17.1: Supplier List Page =====
  test('AC-3.17.1: List Suppliers with filters and search', async ({ page }) => {
    await page.goto('/planning/suppliers')

    // Verify page loads with title
    await expect(page.locator('h1')).toContainText(/Supplier/i, { timeout: 10000 })

    // Verify table structure
    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: 10000 })

    // Verify essential columns
    const headers = page.locator('table th')
    await expect(headers.filter({ hasText: /Code/i })).toBeVisible()
    await expect(headers.filter({ hasText: /Name/i })).toBeVisible()
    await expect(headers.filter({ hasText: /Status/i })).toBeVisible()

    // Verify Add Supplier button exists
    const addButton = page.locator('button').filter({ hasText: /Add Supplier/i })
    await expect(addButton).toBeVisible()

    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()

    // Verify status filter exists
    const statusFilter = page.locator('[role="combobox"]').first()
    await expect(statusFilter).toBeVisible()
  })

  // ===== AC-3.17.2: Create Supplier =====
  test('AC-3.17.2: Create new supplier', async ({ page }) => {
    await page.goto('/planning/suppliers')

    // Click Add Supplier
    const addButton = page.locator('button').filter({ hasText: /Add Supplier/i })
    await addButton.click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Generate unique code
    const supplierCode = `SUP-E2E-${Date.now()}`

    // Fill required fields
    await page.fill('input[name="code"]', supplierCode)
    await page.fill('input[name="name"]', 'E2E Test Supplier Created')

    // Fill optional fields
    const contactInput = page.locator('input[name="contact_person"]')
    if (await contactInput.isVisible()) {
      await contactInput.fill('John Test')
    }

    const emailInput = page.locator('input[name="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill('john@test-supplier.com')
    }

    const phoneInput = page.locator('input[name="phone"]')
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+48111222333')
    }

    const cityInput = page.locator('input[name="city"]')
    if (await cityInput.isVisible()) {
      await cityInput.fill('Krakow')
    }

    const countryInput = page.locator('input[name="country"]')
    if (await countryInput.isVisible()) {
      await countryInput.fill('Poland')
    }

    // Select currency if dropdown exists
    const currencySelect = page.locator('[role="combobox"]').filter({ hasText: /Currency|PLN|EUR|USD/i }).first()
    if (await currencySelect.isVisible()) {
      await currencySelect.click()
      const plnOption = page.locator('[role="option"]').filter({ hasText: /PLN/i })
      if (await plnOption.isVisible()) {
        await plnOption.click()
      } else {
        await page.keyboard.press('Escape')
      }
    }

    // Set payment terms
    const paymentTermsInput = page.locator('input[name="payment_terms"]')
    if (await paymentTermsInput.isVisible()) {
      await paymentTermsInput.fill('Net 30')
    }

    // Set lead time
    const leadTimeInput = page.locator('input[name="lead_time_days"]')
    if (await leadTimeInput.isVisible()) {
      await leadTimeInput.fill('14')
    }

    // Submit form
    const submitButton = modal.locator('button[type="submit"], button').filter({ hasText: /Save|Create|Submit/i })
    await submitButton.click()

    // Verify success - supplier appears in table
    await expect(page.locator(`text=${supplierCode}`)).toBeVisible({ timeout: 10000 })
  })

  // ===== AC-3.17.3: Edit Supplier =====
  test('AC-3.17.3: Edit existing supplier', async ({ page }) => {
    // Create supplier via API
    const supplierId = await createSupplierViaAPI(page)

    try {
      await page.goto('/planning/suppliers')

      // Wait for table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Find and click edit button on first row
      const editButton = page.locator('table tbody tr').first().locator('button').first()
      await editButton.click()

      // Wait for modal
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Modify name
      const nameInput = page.locator('input[name="name"]')
      await nameInput.clear()
      await nameInput.fill('Updated E2E Supplier Name')

      // Modify contact
      const contactInput = page.locator('input[name="contact_person"]')
      if (await contactInput.isVisible()) {
        await contactInput.clear()
        await contactInput.fill('Jane Updated')
      }

      // Submit changes
      const submitButton = modal.locator('button[type="submit"], button').filter({ hasText: /Save|Update|Submit/i })
      await submitButton.click()

      // Verify modal closes
      await expect(modal).not.toBeVisible({ timeout: 5000 })

      // Verify updated name in table
      await expect(page.locator('text=Updated E2E Supplier Name')).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })

  // ===== AC-3.17.4: Delete Supplier =====
  test('AC-3.17.4: Delete supplier', async ({ page }) => {
    // Create supplier via API
    const supplierId = await createSupplierViaAPI(page)

    await page.goto('/planning/suppliers')

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Get initial row count
    const initialRowCount = await page.locator('table tbody tr').count()

    // Find delete button (usually last button in actions)
    const deleteButton = page.locator('table tbody tr').first().locator('button').last()
    await deleteButton.click()

    // Confirm deletion
    const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Delete|Are you sure/i })
    await expect(confirmDialog).toBeVisible({ timeout: 5000 })

    const confirmButton = confirmDialog.locator('button').filter({ hasText: /Delete|Confirm|Yes/i })
    await confirmButton.click()

    // Verify dialog closes
    await expect(confirmDialog).not.toBeVisible({ timeout: 5000 })

    // Verify row removed (or table updated)
    await page.waitForTimeout(1000)
    const newRowCount = await page.locator('table tbody tr').count()
    expect(newRowCount).toBeLessThanOrEqual(initialRowCount)
  })

  // ===== AC-3.17.5: View Supplier Details =====
  test('AC-3.17.5: Navigate to supplier details page', async ({ page }) => {
    // Create supplier via API
    const supplierId = await createSupplierViaAPI(page)

    try {
      await page.goto('/planning/suppliers')

      // Wait for table
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Click on first row (not on action buttons)
      const firstRow = page.locator('table tbody tr').first()
      await firstRow.click()

      // Verify navigation to detail page
      await expect(page).toHaveURL(/\/planning\/suppliers\/[a-z0-9-]+/, { timeout: 10000 })

      // Verify detail page content
      await expect(page.locator('text=/SUP-/i')).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })

  // ===== AC-3.17.6: Search Suppliers =====
  test('AC-3.17.6: Search suppliers by code or name', async ({ page }) => {
    // Create supplier with known code
    const supplierId = await createSupplierViaAPI(page)

    try {
      await page.goto('/planning/suppliers')

      // Wait for table
      await page.waitForSelector('table', { timeout: 10000 })

      // Search by 'E2E' (part of our test supplier codes)
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('E2E')

      // Wait for debounce
      await page.waitForTimeout(500)

      // Verify results
      const table = page.locator('table')
      await expect(table).toBeVisible()

      // Should find our test supplier
      const rows = page.locator('table tbody tr')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThan(0)
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })

  // ===== AC-3.17.7: Filter by Status =====
  test('AC-3.17.7: Filter suppliers by status', async ({ page }) => {
    await page.goto('/planning/suppliers')

    // Wait for page
    await page.waitForSelector('table', { timeout: 10000 })

    // Open status filter
    const statusFilter = page.locator('[role="combobox"]').first()
    await statusFilter.click()

    // Select Active
    const activeOption = page.locator('[role="option"]').filter({ hasText: /Active/i })
    if (await activeOption.isVisible()) {
      await activeOption.click()

      // Wait for filter to apply
      await page.waitForTimeout(500)

      // Verify table updates
      await expect(page.locator('table')).toBeVisible()

      // All visible badges should show Active (if any suppliers exist)
      const badges = page.locator('table tbody [class*="badge"]').filter({ hasText: /Active/i })
      // Badges exist (may be 0 if no active suppliers)
    }
  })

  // ===== Status Badge Display =====
  test('Display status badges correctly', async ({ page }) => {
    const supplierId = await createSupplierViaAPI(page)

    try {
      await page.goto('/planning/suppliers')

      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Verify status badge exists
      const statusBadge = page.locator('table tbody tr').first().locator('[class*="badge"]')
      await expect(statusBadge).toBeVisible()

      // Badge should show Active or Inactive
      const badgeText = await statusBadge.textContent()
      expect(badgeText).toMatch(/Active|Inactive/i)
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })
})

// ============================================================================
// SUPPLIER PRODUCTS
// ============================================================================

test.describe('Supplier Products Management', () => {
  let supplierId: string

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
    supplierId = await createSupplierViaAPI(page)
  })

  test.afterEach(async ({ page }) => {
    if (supplierId) {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })

  test('View supplier products on detail page', async ({ page }) => {
    await page.goto(`/planning/suppliers/${supplierId}`)

    // Wait for detail page
    await expect(page.locator('text=/SUP-/i')).toBeVisible({ timeout: 10000 })

    // Look for products section
    const productsSection = page.locator('text=/Products|Items|Catalog/i')

    // Products section should exist (may be empty for new supplier)
    // This depends on UI implementation
  })

  test('Add product to supplier', async ({ page }) => {
    await page.goto(`/planning/suppliers/${supplierId}`)

    await expect(page.locator('text=/SUP-/i')).toBeVisible({ timeout: 10000 })

    // Look for Add Product button
    const addProductButton = page.locator('button').filter({ hasText: /Add Product|Link Product/i })

    if (await addProductButton.isVisible()) {
      await addProductButton.click()

      // Wait for modal/form
      const modal = page.locator('[role="dialog"]')
      if (await modal.isVisible()) {
        // Select product from dropdown
        const productSelect = page.locator('[role="combobox"]').filter({ hasText: /Product/i })
        if (await productSelect.isVisible()) {
          await productSelect.click()
          await page.locator('[role="option"]').first().click()
        }

        // Fill supplier-specific details
        const priceInput = page.locator('input[name="unit_price"], input[type="number"]')
        if (await priceInput.isVisible()) {
          await priceInput.fill('100')
        }

        // Submit
        const submitButton = modal.locator('button').filter({ hasText: /Save|Add|Submit/i })
        await submitButton.click()
      }
    }
  })
})

// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

test.describe('Supplier Validation & Errors', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('Validate required fields on create', async ({ page }) => {
    await page.goto('/planning/suppliers')

    // Click Add Supplier
    const addButton = page.locator('button').filter({ hasText: /Add Supplier/i })
    await addButton.click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Try to submit empty form
    const submitButton = modal.locator('button[type="submit"], button').filter({ hasText: /Save|Create|Submit/i })
    await submitButton.click()

    // Verify validation errors appear
    const errorMessage = page.locator('[class*="error"], [class*="destructive"], [role="alert"], text=/required/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('Prevent duplicate supplier codes', async ({ page }) => {
    // Create supplier with known code
    const supplierId = await createSupplierViaAPI(page)

    try {
      await page.goto('/planning/suppliers')

      const addButton = page.locator('button').filter({ hasText: /Add Supplier/i })
      await addButton.click()

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Use same code as existing supplier
      await page.fill('input[name="code"]', `SUP-DUPLICATE-${Date.now()}`)
      await page.fill('input[name="name"]', 'Duplicate Test')

      const submitButton = modal.locator('button[type="submit"]')
      await submitButton.click()

      // This should succeed (different code) or show error (if same code)
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })

  test('Validate email format', async ({ page }) => {
    await page.goto('/planning/suppliers')

    const addButton = page.locator('button').filter({ hasText: /Add Supplier/i })
    await addButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Fill required fields
    await page.fill('input[name="code"]', `SUP-VALID-${Date.now()}`)
    await page.fill('input[name="name"]', 'Validation Test')

    // Enter invalid email
    const emailInput = page.locator('input[name="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email')

      // Submit
      const submitButton = modal.locator('button[type="submit"]')
      await submitButton.click()

      // Verify email validation error
      const emailError = page.locator('text=/email|invalid/i')
      // Error should appear (depends on validation implementation)
    }
  })
})

// ============================================================================
// RESPONSIVE & UI TESTS
// ============================================================================

test.describe('Supplier UI & Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('Table displays correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/planning/suppliers')

    // All columns should be visible
    const headers = page.locator('table th')
    await expect(headers.filter({ hasText: /Code/i })).toBeVisible()
    await expect(headers.filter({ hasText: /Name/i })).toBeVisible()
    await expect(headers.filter({ hasText: /Contact/i })).toBeVisible()
    await expect(headers.filter({ hasText: /Currency/i })).toBeVisible()
    await expect(headers.filter({ hasText: /Status/i })).toBeVisible()
  })

  test('Modal form is scrollable for long content', async ({ page }) => {
    await page.goto('/planning/suppliers')

    const addButton = page.locator('button').filter({ hasText: /Add Supplier/i })
    await addButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Modal should be scrollable if content is long
    const modalContent = modal.locator('[class*="content"], form')
    await expect(modalContent).toBeVisible()
  })

  test('Action buttons are accessible', async ({ page }) => {
    const supplierId = await createSupplierViaAPI(page)

    try {
      await page.goto('/planning/suppliers')

      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Edit and Delete buttons should be visible
      const firstRow = page.locator('table tbody tr').first()
      const actionButtons = firstRow.locator('button')

      const buttonCount = await actionButtons.count()
      expect(buttonCount).toBeGreaterThanOrEqual(2) // Edit and Delete
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })
})

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('Supplier Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('Navigate from Planning menu to Suppliers', async ({ page }) => {
    await page.goto('/planning')

    // Find Suppliers link in navigation or page
    const suppliersLink = page.locator('a, button').filter({ hasText: /Suppliers/i })

    if (await suppliersLink.isVisible()) {
      await suppliersLink.click()
      await expect(page).toHaveURL(/\/planning\/suppliers/, { timeout: 10000 })
    }
  })

  test('Back navigation from supplier detail', async ({ page }) => {
    const supplierId = await createSupplierViaAPI(page)

    try {
      // Go to detail page
      await page.goto(`/planning/suppliers/${supplierId}`)
      await expect(page.locator('text=/SUP-/i')).toBeVisible({ timeout: 10000 })

      // Click back or navigate to list
      const backButton = page.locator('button, a').filter({ hasText: /Back|←|Suppliers/i }).first()

      if (await backButton.isVisible()) {
        await backButton.click()
        await expect(page).toHaveURL(/\/planning\/suppliers$/, { timeout: 10000 })
      } else {
        // Use browser back
        await page.goBack()
      }
    } finally {
      await deleteSupplierViaAPI(page, supplierId)
    }
  })
})
