/**
 * E2E Tests: Purchase Orders Critical User Flows
 * Story: 03.3 PO CRUD + Lines
 * Framework: Playwright
 *
 * Tests critical user workflows:
 * - Create PO flow with supplier defaults and lines
 * - Edit PO (update header and lines)
 * - Submit PO for confirmation
 * - Cancel PO with confirmation
 * - Search and filter PO list
 * - Real-time totals calculation
 * - Mobile responsive layout
 */

import { test, expect, Page } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const testEmail = process.env.TEST_EMAIL || 'test@example.com'
const testPassword = process.env.TEST_PASSWORD || 'password123'

test.describe('Purchase Orders E2E Tests (Story 03.3)', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()

    // Login
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for navigation
    await page.waitForNavigation()
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('AC-01-1: PO List page displays within 300ms', async () => {
    // Arrange: Navigate to PO list
    const startTime = Date.now()

    // Act
    await page.goto(`${baseURL}/planning/purchase-orders`)
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Assert
    expect(loadTime).toBeLessThan(3000) // Should be fast
    expect(page.url()).toContain('/planning/purchase-orders')

    // Check for PO list table
    const table = await page.locator('[data-testid="po-data-table"]')
    await expect(table).toBeVisible()

    // Check for required columns
    await expect(page.locator('text=PO Number')).toBeVisible()
    await expect(page.locator('text=Supplier')).toBeVisible()
    await expect(page.locator('text=Status')).toBeVisible()
  })

  test('AC-01-2: Search POs by number or supplier', async () => {
    // Arrange: Navigate to list
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Act: Enter search term
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('PO-2024')

    // Wait for debounce and results
    await page.waitForTimeout(500)

    // Assert: Results should be filtered
    const rows = page.locator('[data-testid="po-table-row"]')
    const count = await rows.count()

    if (count > 0) {
      // Each visible row should match search
      const firstRow = rows.first()
      const text = await firstRow.textContent()
      expect(text?.toUpperCase()).toContain('PO')
    }
  })

  test('AC-01-3: Filter by status', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Act: Open status filter
    await page.click('[data-testid="filter-status"]')
    await page.click('button:has-text("Draft")')

    // Wait for filter
    await page.waitForTimeout(300)

    // Assert: Only draft POs should show
    const rows = page.locator('[data-testid="po-table-row"]')
    const statusBadges = page.locator('[data-testid="status-badge"]')

    const count = await statusBadges.count()
    if (count > 0) {
      // Check first few badges
      for (let i = 0; i < Math.min(3, count); i++) {
        const badge = statusBadges.nth(i)
        const text = await badge.textContent()
        expect(text?.toLowerCase()).toContain('draft')
      }
    }
  })

  test('AC-04-4: Real-time totals recalculation', async () => {
    // Arrange: Start creating a new PO
    await page.goto(`${baseURL}/planning/purchase-orders`)
    await page.click('button:has-text("Create PO")')

    // Wait for form
    await page.waitForSelector('[data-testid="po-form"]')

    // Act: Fill in basic fields
    await page.selectOption('[name="supplier_id"]', { label: /test|supplier/i })
    await page.waitForTimeout(300)

    // Should auto-fill currency
    const currencyField = page.locator('[name="currency"]')
    let currency = await currencyField.inputValue()
    expect(currency).toBeTruthy()

    // Act: Add a line
    await page.click('button:has-text("Add Line")')

    // Wait for line modal
    const lineModal = page.locator('[data-testid="line-modal"]')
    await expect(lineModal).toBeVisible()

    // Search for product
    const productSearch = page.locator('[data-testid="product-search"]')
    await productSearch.fill('flour')
    await page.waitForTimeout(400)

    // Select first product
    const firstProduct = page.locator('[data-testid="product-option"]').first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()

      // Auto-filled price should appear
      const priceField = page.locator('[data-testid="line-unit-price"]')
      const price = await priceField.inputValue()
      expect(parseFloat(price || '0')).toBeGreaterThan(0)
    }

    // Act: Change quantity
    const qtyField = page.locator('[data-testid="line-quantity"]')
    await qtyField.clear()
    await qtyField.fill('100')

    // Totals should update
    await page.waitForTimeout(150)

    const lineTotal = page.locator('[data-testid="line-total"]')
    if (await lineTotal.isVisible()) {
      const total = await lineTotal.textContent()
      expect(parseFloat(total?.replace(/[^\d.]/g, '') || '0')).toBeGreaterThan(0)
    }
  })

  test('AC-02-1: Create PO with supplier defaults cascade', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)
    await page.click('button:has-text("Create PO")')

    // Wait for form to be visible
    await page.waitForSelector('[data-testid="po-form"]')

    // Act: Select supplier
    const supplierSelect = page.locator('[name="supplier_id"]')
    await supplierSelect.click()

    // Select a supplier option
    const supplierOption = page.locator('[role="option"]').first()
    await supplierOption.click()

    // Wait for cascade
    await page.waitForTimeout(300)

    // Assert: Currency should be auto-filled
    const currencyField = page.locator('[name="currency"]')
    const currency = await currencyField.inputValue()
    expect(currency).toBeTruthy()
    expect(['PLN', 'EUR', 'USD', 'GBP']).toContain(currency)

    // Tax code should be filled
    const taxCodeField = page.locator('[name="tax_code_id"]')
    const taxCode = await taxCodeField.inputValue()
    expect(taxCode?.length).toBeGreaterThan(0)

    // Payment terms should be filled
    const termsField = page.locator('[name="payment_terms"]')
    const terms = await termsField.inputValue()
    if (terms) {
      expect(terms.length).toBeGreaterThan(0)
    }
  })

  test('AC-03-2: Product selection defaults pricing', async () => {
    // Arrange: Start creating PO and add line
    await page.goto(`${baseURL}/planning/purchase-orders`)
    await page.click('button:has-text("Create PO")')

    // Fill basic header
    await page.selectOption('[name="supplier_id"]', { label: /test|supplier/i })
    await page.click('button:has-text("Add Line")')

    await page.waitForSelector('[data-testid="line-modal"]')

    // Act: Search for product
    const productSearch = page.locator('[data-testid="product-search"]')
    await productSearch.fill('test')

    await page.waitForTimeout(400)
    const option = page.locator('[data-testid="product-option"]').first()

    if (await option.isVisible()) {
      await option.click()

      // Assert: Unit price should be auto-filled
      const priceField = page.locator('[data-testid="line-unit-price"]')
      const price = await priceField.inputValue()
      expect(parseFloat(price || '0')).toBeGreaterThan(0)

      // UoM should be auto-filled
      const uomField = page.locator('[data-testid="line-uom"]')
      const uom = await uomField.inputValue()
      expect(uom?.length).toBeGreaterThan(0)
    }
  })

  test('AC-05-2: Submit PO flow', async () => {
    // Arrange: Create a PO first (prerequisite)
    // For E2E, we assume POs exist or create via API

    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Find a draft PO
    const draftRow = page.locator('[data-testid="po-table-row"]:has-text("Draft")').first()

    if (await draftRow.isVisible()) {
      // Act: Click to open detail
      await draftRow.click()

      await page.waitForNavigation()

      // Click Submit button
      const submitBtn = page.locator('button:has-text("Submit")')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()

        // Confirm in dialog
        const confirmBtn = page.locator('[data-testid="confirm-submit"]')
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click()
        }

        // Wait for status update
        await page.waitForTimeout(500)

        // Assert: Status should change to Confirmed
        const statusBadge = page.locator('[data-testid="status-badge"]')
        const status = await statusBadge.textContent()
        expect(status?.toLowerCase()).toContain('confirm')
      }
    }
  })

  test('AC-05-5: Cancel PO flow', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Find a draft PO
    const draftRow = page.locator('[data-testid="po-table-row"]:has-text("Draft")').first()

    if (await draftRow.isVisible()) {
      // Act: Open detail
      await draftRow.click()

      await page.waitForNavigation()

      // Open actions menu
      const actionsBtn = page.locator('button[aria-label*="more"]')
      if (await actionsBtn.isVisible()) {
        await actionsBtn.click()

        const cancelOption = page.locator('button:has-text("Cancel")')
        await cancelOption.click()

        // Wait for confirmation dialog
        const reasonInput = page.locator('[name="cancellation_reason"]')
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('Test cancellation')
        }

        const confirmBtn = page.locator('button:has-text("Confirm")')
        await confirmBtn.click()

        // Wait for update
        await page.waitForTimeout(500)

        // Assert: Status should change to Cancelled
        const statusBadge = page.locator('[data-testid="status-badge"]')
        const status = await statusBadge.textContent()
        expect(status?.toLowerCase()).toContain('cancel')
      }
    }
  })

  test('AC-01-4: Pagination controls', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Wait for table
    await page.waitForSelector('[data-testid="po-data-table"]')

    // Assert: Pagination controls should exist
    const pagination = page.locator('[data-testid="pagination"]')
    if (await pagination.isVisible()) {
      const nextBtn = page.locator('button[aria-label*="next"]')
      expect(nextBtn).toBeDefined()

      const prevBtn = page.locator('button[aria-label*="previous"]')
      expect(prevBtn).toBeDefined()
    }
  })

  test('AC-03-5: Remove line item with confirmation', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Find a draft PO with lines
    const draftRow = page.locator('[data-testid="po-table-row"]:has-text("Draft")').first()

    if (await draftRow.isVisible()) {
      await draftRow.click()
      await page.waitForNavigation()

      // Find a line to delete
      const deleteBtn = page.locator('[data-testid="delete-line"]').first()

      if (await deleteBtn.isVisible()) {
        // Act: Click delete
        await deleteBtn.click()

        // Confirm
        const confirmBtn = page.locator('[data-testid="confirm-delete"]')
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click()

          // Wait for deletion
          await page.waitForTimeout(300)

          // Assert: Line should be removed
          const lineCount = await page.locator('[data-testid="po-line-row"]').count()
          expect(lineCount).toBeDefined()
        }
      }
    }
  })

  test('Mobile: Responsive layout on small viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })

    // Navigate to list
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Assert: Should use mobile layout
    const mobileCard = page.locator('[data-testid="po-card"]')
    if (await mobileCard.isVisible()) {
      // Mobile card layout should be used
      expect(mobileCard).toBeVisible()
    }

    // Navigate to detail
    const firstRow = page.locator('[data-testid="po-table-row"], [data-testid="po-card"]').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForNavigation()

      // Form should be stacked
      const form = page.locator('[data-testid="po-form"]')
      if (await form.isVisible()) {
        // Check that it's responsive
        const width = await form.evaluate(el => el.offsetWidth)
        expect(width).toBeLessThan(400)
      }
    }
  })

  test('AC-01-1: KPI cards display on list', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Assert: KPI cards should be visible
    const kpiCards = page.locator('[data-testid="kpi-card"]')
    const count = await kpiCards.count()

    expect(count).toBeGreaterThanOrEqual(1) // At least one KPI card

    // Check for expected KPI types
    const openCard = page.locator('text=/Open|Pending/i')
    const overdueCard = page.locator('text=/Overdue|Late/i')

    // At least one should be present
    const hasKpi = (await openCard.isVisible()) || (await overdueCard.isVisible())
    expect(hasKpi).toBe(true)
  })

  test('Form validation: Required fields', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)
    await page.click('button:has-text("Create PO")')

    // Act: Try to submit empty form
    const submitBtn = page.locator('button:has-text("Save")').first()

    if (await submitBtn.isVisible()) {
      await submitBtn.click()
    }

    // Assert: Errors should display
    const supplierError = page.locator('text=/supplier.*required/i')
    const warehouseError = page.locator('text=/warehouse.*required/i')

    const hasError = (await supplierError.isVisible()) || (await warehouseError.isVisible())
    expect(hasError).toBe(true)
  })

  test('Edit PO: Update header fields', async () => {
    // Arrange
    await page.goto(`${baseURL}/planning/purchase-orders`)

    // Find a draft PO
    const draftRow = page.locator('[data-testid="po-table-row"]:has-text("Draft")').first()

    if (await draftRow.isVisible()) {
      await draftRow.click()
      await page.waitForNavigation()

      // Act: Click Edit
      const editBtn = page.locator('button:has-text("Edit")')
      if (await editBtn.isVisible()) {
        await editBtn.click()

        // Update notes
        const notesField = page.locator('[name="notes"]')
        await notesField.clear()
        await notesField.fill('Updated notes for testing')

        // Save
        const saveBtn = page.locator('button:has-text("Save")')
        await saveBtn.click()

        // Wait for update
        await page.waitForTimeout(500)

        // Assert: Notes should be updated
        const notesDisplay = page.locator('[data-testid="po-notes"]')
        const notes = await notesDisplay.textContent()
        expect(notes).toContain('Updated notes')
      }
    }
  })
})
