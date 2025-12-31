/**
 * Supplier Management E2E Tests
 * Story: 03.1 - Suppliers CRUD + Master Data
 * Phase: RED - Tests will fail until implementation exists
 *
 * Playwright E2E tests for supplier CRUD flows and critical user scenarios.
 * Tests cover:
 * - List page with KPIs
 * - Create/Edit flows
 * - Search and filters
 * - Status changes (activate/deactivate)
 * - Delete operations
 * - Bulk actions
 * - Excel export
 * - Mobile responsive design
 *
 * Coverage Target: Critical path only
 * Test Count: 12+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: Supplier List Page with KPIs
 * - AC-02: Supplier Code Auto-Generation
 * - AC-03: Create Supplier with Required Fields
 * - AC-05: Edit Supplier with Code Locking
 * - AC-06: Filter Suppliers by Status
 * - AC-07: Search Suppliers
 * - AC-08: Deactivate Supplier (Success)
 * - AC-09: Block Deactivation if Open POs
 * - AC-10: Activate Inactive Supplier
 * - AC-11: Delete Supplier (Success)
 * - AC-14: Bulk Deactivate Mixed Results
 * - AC-15: Export Suppliers to Excel
 * - AC-17: Supplier Detail Page Navigation
 * - AC-18: Responsive Design
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Test Fixtures
 */
const BASE_URL = 'http://localhost:3000'
const SUPPLIERS_PAGE = `${BASE_URL}/planning/suppliers`

/**
 * Helper Functions
 */
async function loginAsPlanner(page: Page) {
  // Arrange - Login with test account
  await page.goto(`${BASE_URL}/login`)
  await page.fill('[data-testid="email-input"]', 'planner@example.com')
  await page.fill('[data-testid="password-input"]', 'TestPassword123!')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL(/\/planning|\/technical|\/settings/)
}

async function navigateToSuppliers(page: Page) {
  await page.goto(SUPPLIERS_PAGE)
  await page.waitForLoadState('networkidle')
}

test.describe('Supplier Management E2E Tests', () => {
  test.describe('AC-01: Supplier List Page with KPIs', () => {
    test('should display list page with KPI cards', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act & Assert
      // Expected: 4 KPI cards visible
      const kpiCards = page.locator('[data-testid="kpi-card"]')
      expect(kpiCards).toHaveCount(4)

      // Total Suppliers card
      const totalCard = page.locator('[data-testid="kpi-card-total"]')
      await expect(totalCard).toContainText(/\d+/)

      // Active Suppliers card
      const activeCard = page.locator('[data-testid="kpi-card-active"]')
      await expect(activeCard).toContainText(/\d+/)

      // Inactive card
      const inactiveCard = page.locator('[data-testid="kpi-card-inactive"]')
      await expect(inactiveCard).toContainText(/\d+/)

      // This Month Added card
      const thisMonthCard = page.locator('[data-testid="kpi-card-this-month"]')
      await expect(thisMonthCard).toContainText(/\d+/)
    })

    test('should display suppliers table with required columns', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act & Assert
      // Expected: Table columns visible
      const requiredColumns = ['Code', 'Name', 'Contact Name', 'Email', 'Phone', 'Status', 'Products Count']

      for (const column of requiredColumns) {
        const columnHeader = page.locator(`text=${column}`)
        await expect(columnHeader).toBeVisible()
      }
    })

    test('should display Create Supplier button', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act & Assert
      // Expected: Create button visible and clickable
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await expect(createButton).toBeVisible()
      await expect(createButton).toContainText('Create Supplier')
    })

    test('should calculate active rate percentage correctly', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      // Get KPI values
      const totalText = await page.locator('[data-testid="kpi-card-total"]').textContent()
      const activeText = await page.locator('[data-testid="kpi-card-active"]').textContent()
      const rateText = await page.locator('[data-testid="kpi-card-active-rate"]').textContent()

      // Assert
      // Expected: Rate = (active / total) * 100
      const totalMatch = totalText?.match(/\d+/)
      const activeMatch = activeText?.match(/\d+/)
      const rateMatch = rateText?.match(/[\d.]+%/)

      if (totalMatch && activeMatch && rateMatch) {
        const total = parseInt(totalMatch[0])
        const active = parseInt(activeMatch[0])
        const expectedRate = total > 0 ? ((active / total) * 100).toFixed(2) : '0.00'
        const actualRate = parseFloat(rateMatch[0].replace('%', ''))
        expect(Math.abs(actualRate - parseFloat(expectedRate))).toBeLessThan(0.01)
      }
    })
  })

  test.describe('AC-02: Supplier Code Auto-Generation', () => {
    test('should pre-fill code on Create modal', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await createButton.click()
      await page.waitForSelector('[data-testid="modal-create-supplier"]')

      // Assert
      // Expected: Code field pre-filled with next available code
      const codeInput = page.locator('[data-testid="input-supplier-code"]')
      const codeValue = await codeInput.inputValue()
      expect(codeValue).toMatch(/^SUP-\d+$/)
    })

    test('should allow manual code entry', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await createButton.click()
      await page.waitForSelector('[data-testid="modal-create-supplier"]')

      // Act
      const manualCheckbox = page.locator('[data-testid="checkbox-manual-code"]')
      await manualCheckbox.check()

      const codeInput = page.locator('[data-testid="input-supplier-code"]')
      await codeInput.clear()
      await codeInput.fill('CUSTOM-001')

      // Assert
      // Expected: Code field now editable
      const newValue = await codeInput.inputValue()
      expect(newValue).toBe('CUSTOM-001')
    })

    test('should validate code uniqueness on blur', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await createButton.click()
      await page.waitForSelector('[data-testid="modal-create-supplier"]')

      // Act
      const codeInput = page.locator('[data-testid="input-supplier-code"]')
      await codeInput.clear()
      await codeInput.fill('SUP-001') // Assume exists
      await codeInput.blur()
      await page.waitForTimeout(600) // Debounce wait

      // Assert
      // Expected: Error shown
      const errorMessage = page.locator('[data-testid="error-code-exists"]')
      await expect(errorMessage).toBeVisible()
    })
  })

  test.describe('AC-03: Create Supplier with Required Fields', () => {
    test('should create supplier successfully with valid data', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await createButton.click()
      await page.waitForSelector('[data-testid="modal-create-supplier"]')

      // Fill required fields
      const codeInput = page.locator('[data-testid="input-supplier-code"]')
      const nameInput = page.locator('[data-testid="input-supplier-name"]')
      const currencySelect = page.locator('[data-testid="select-supplier-currency"]')
      const taxCodeSelect = page.locator('[data-testid="select-supplier-tax-code"]')
      const paymentTermsInput = page.locator('[data-testid="input-payment-terms"]')

      const code = await codeInput.inputValue()
      await nameInput.fill('Test Mill Co')
      await currencySelect.selectOption('PLN')
      await taxCodeSelect.selectOption('tc-001')
      await paymentTermsInput.fill('Net 30')

      // Submit
      const submitButton = page.locator('[data-testid="button-submit-create"]')
      await submitButton.click()

      // Assert
      // Expected: Success toast shown
      const successToast = page.locator('[data-testid="toast-success"]')
      await expect(successToast).toContainText(/created successfully|success/i)

      // Modal closes
      await expect(page.locator('[data-testid="modal-create-supplier"]')).not.toBeVisible({ timeout: 3000 })

      // New supplier in list
      const supplierRow = page.locator(`[data-testid="supplier-row-${code}"]`)
      await expect(supplierRow).toBeVisible()
    })

    test('should show validation errors for missing required fields', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await createButton.click()
      await page.waitForSelector('[data-testid="modal-create-supplier"]')

      // Act
      const submitButton = page.locator('[data-testid="button-submit-create"]')
      await submitButton.click()

      // Assert
      // Expected: Error banner and field errors
      const errorBanner = page.locator('[data-testid="alert-validation-errors"]')
      await expect(errorBanner).toBeVisible()
      await expect(errorBanner).toContainText(/fix the following errors/i)

      const nameError = page.locator('[data-testid="error-supplier-name"]')
      await expect(nameError).toBeVisible()
    })

    test('should set is_active=true by default', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)
      const createButton = page.locator('[data-testid="button-create-supplier"]')
      await createButton.click()
      await page.waitForSelector('[data-testid="modal-create-supplier"]')

      // Fill and submit
      const nameInput = page.locator('[data-testid="input-supplier-name"]')
      const currencySelect = page.locator('[data-testid="select-supplier-currency"]')
      const taxCodeSelect = page.locator('[data-testid="select-supplier-tax-code"]')
      const paymentTermsInput = page.locator('[data-testid="input-payment-terms"]')

      await nameInput.fill('Test Supplier')
      await currencySelect.selectOption('PLN')
      await taxCodeSelect.selectOption('tc-001')
      await paymentTermsInput.fill('Net 30')

      const submitButton = page.locator('[data-testid="button-submit-create"]')
      await submitButton.click()

      // Assert
      await page.waitForSelector('[data-testid="toast-success"]')

      // Check status in table
      const activeStatus = page.locator('text=Active').first()
      await expect(activeStatus).toBeVisible()
    })
  })

  test.describe('AC-05: Edit Supplier with Code Locking', () => {
    test('should lock code field if supplier has POs', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Find supplier with POs
      const editButton = page.locator('[data-testid="button-edit-supplier"]').first()
      await editButton.click()
      await page.waitForSelector('[data-testid="modal-edit-supplier"]')

      // Act & Assert
      // Expected: Code field disabled
      const codeInput = page.locator('[data-testid="input-supplier-code"]')
      await expect(codeInput).toBeDisabled()

      // Expected: Lock icon visible
      const lockIcon = page.locator('[data-testid="icon-code-locked"]')
      await expect(lockIcon).toBeVisible()

      // Expected: Tooltip visible on hover
      await lockIcon.hover()
      const tooltip = page.locator('[data-testid="tooltip-code-locked"]')
      await expect(tooltip).toContainText(/cannot change.*purchase orders/i)
    })

    test('should allow code change if no POs', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Find supplier without POs
      const editButton = page.locator('[data-testid="button-edit-supplier"]').nth(2)
      await editButton.click()
      await page.waitForSelector('[data-testid="modal-edit-supplier"]')

      // Act
      const codeInput = page.locator('[data-testid="input-supplier-code"]')
      await expect(codeInput).toBeEnabled()
      await codeInput.clear()
      await codeInput.fill('SUP-NEW')

      // Submit
      const submitButton = page.locator('[data-testid="button-submit-edit"]')
      await submitButton.click()

      // Assert
      const successToast = page.locator('[data-testid="toast-success"]')
      await expect(successToast).toContainText(/updated/i)
    })
  })

  test.describe('AC-06/AC-07: Filter and Search', () => {
    test('should filter suppliers by status', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const statusFilter = page.locator('[data-testid="filter-status"]')
      await statusFilter.selectOption('active')

      // Wait for filter to apply
      await page.waitForURL(/status=active/)

      // Assert
      const supplierRows = page.locator('[data-testid="supplier-row"]')
      const statusCells = page.locator('[data-testid="cell-status"]')

      // All visible statuses should be "Active"
      const count = await statusCells.count()
      for (let i = 0; i < count; i++) {
        const status = await statusCells.nth(i).textContent()
        expect(status).toContain('Active')
      }
    })

    test('should search suppliers by name', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const searchInput = page.locator('[data-testid="input-search-suppliers"]')
      await searchInput.fill('Mill')
      await page.waitForTimeout(300) // Debounce

      // Assert
      await page.waitForURL(/search=Mill/)

      const supplierRows = page.locator('[data-testid="supplier-row"]')
      const names = page.locator('[data-testid="cell-name"]')

      // All visible names should contain "Mill"
      const count = await names.count()
      for (let i = 0; i < count; i++) {
        const name = await names.nth(i).textContent()
        expect(name?.toUpperCase()).toContain('MILL')
      }
    })

    test('should persist filter on page refresh', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const statusFilter = page.locator('[data-testid="filter-status"]')
      await statusFilter.selectOption('inactive')
      await page.waitForURL(/status=inactive/)

      // Refresh page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Assert
      const selectedValue = await statusFilter.inputValue()
      expect(selectedValue).toBe('inactive')
    })
  })

  test.describe('AC-08/AC-09: Deactivate Supplier', () => {
    test('should deactivate supplier without open POs', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Select supplier without POs
      const checkbox = page.locator('[data-testid="checkbox-supplier"]').first()
      await checkbox.check()

      // Act
      const deactivateButton = page.locator('[data-testid="button-deactivate-selected"]')
      await deactivateButton.click()

      // Confirm
      const confirmButton = page.locator('[data-testid="button-confirm-deactivate"]')
      await confirmButton.click()

      // Assert
      const successToast = page.locator('[data-testid="toast-success"]')
      await expect(successToast).toContainText(/deactivated successfully/i)

      // Verify status changed
      const status = page.locator('[data-testid="cell-status"]').first()
      await expect(status).toContainText('Inactive')
    })

    test('should block deactivation if open POs exist', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Select supplier with open POs
      const checkbox = page.locator('[data-testid="checkbox-supplier-with-pos"]')
      await checkbox.check()

      // Act
      const deactivateButton = page.locator('[data-testid="button-deactivate-selected"]')
      await deactivateButton.click()

      // Assert
      const errorModal = page.locator('[data-testid="modal-error"]')
      await expect(errorModal).toBeVisible()
      await expect(errorModal).toContainText(/cannot deactivate.*open purchase orders/i)

      // Modal contains details
      const details = page.locator('[data-testid="error-details"]')
      await expect(details).toContainText(/\d+ open/)
    })
  })

  test.describe('AC-10: Activate Supplier', () => {
    test('should activate inactive supplier', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Filter by inactive
      const statusFilter = page.locator('[data-testid="filter-status"]')
      await statusFilter.selectOption('inactive')
      await page.waitForURL(/status=inactive/)

      // Select inactive supplier
      const checkbox = page.locator('[data-testid="checkbox-supplier"]').first()
      await checkbox.check()

      // Act
      const activateButton = page.locator('[data-testid="button-activate-selected"]')
      await activateButton.click()

      // Assert
      const successToast = page.locator('[data-testid="toast-success"]')
      await expect(successToast).toContainText(/activated successfully/i)
    })
  })

  test.describe('AC-11/AC-12: Delete Supplier', () => {
    test('should delete supplier without POs or products', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Find supplier without dependencies
      const deleteButton = page.locator('[data-testid="button-delete-supplier"]').first()
      await deleteButton.click()

      // Confirm in modal
      const confirmButton = page.locator('[data-testid="button-confirm-delete"]')
      await confirmButton.click()

      // Assert
      const successToast = page.locator('[data-testid="toast-success"]')
      await expect(successToast).toContainText(/deleted successfully/i)
    })

    test('should block delete if POs exist', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Find supplier with POs
      const deleteButton = page.locator('[data-testid="button-delete-supplier-with-pos"]')
      await deleteButton.click()

      // Assert
      const errorModal = page.locator('[data-testid="modal-error"]')
      await expect(errorModal).toBeVisible()
      await expect(errorModal).toContainText(/cannot delete.*purchase orders/i)
    })
  })

  test.describe('AC-14: Bulk Deactivate Mixed Results', () => {
    test('should handle bulk deactivation with mixed results', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Select 3 suppliers (1 with open POs, 2 without)
      const checkboxes = page.locator('[data-testid="checkbox-supplier"]').slice(0, 3)
      for (let i = 0; i < 3; i++) {
        await checkboxes.nth(i).check()
      }

      // Act
      const deactivateButton = page.locator('[data-testid="button-deactivate-selected"]')
      await deactivateButton.click()

      const confirmButton = page.locator('[data-testid="button-confirm-deactivate"]')
      await confirmButton.click()

      // Assert
      const resultToast = page.locator('[data-testid="toast-bulk-result"]')
      await expect(resultToast).toContainText(/2 deactivated.*1 failed/i)

      // Detailed results available
      const resultDetails = page.locator('[data-testid="bulk-result-details"]')
      await expect(resultDetails).toBeVisible()
    })
  })

  test.describe('AC-15: Export Suppliers to Excel', () => {
    test('should export suppliers to Excel', async ({ page, context }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Select 2 suppliers
      const checkboxes = page.locator('[data-testid="checkbox-supplier"]')
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Act - Download
      const downloadPromise = context.waitForEvent('download')
      const exportButton = page.locator('[data-testid="button-export"]')
      await exportButton.click()

      const download = await downloadPromise

      // Assert
      // Filename format: suppliers_export_YYYY-MM-DD.xlsx
      const filename = download.suggestedFilename()
      expect(filename).toMatch(/suppliers_export_\d{4}-\d{2}-\d{2}\.xlsx/)

      // File exists
      expect(download).toBeDefined()
    })
  })

  test.describe('AC-17: Supplier Detail Page', () => {
    test('should navigate to detail page', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const viewButton = page.locator('[data-testid="button-view-details"]').first()
      await viewButton.click()
      await page.waitForURL(/\/planning\/suppliers\/[a-f0-9-]+$/)

      // Assert
      // Detail page loaded
      const detailHeader = page.locator('[data-testid="heading-supplier-detail"]')
      await expect(detailHeader).toBeVisible()

      // Key sections visible
      const masterDataSection = page.locator('[data-testid="section-master-data"]')
      const productsSection = page.locator('[data-testid="section-products"]')
      const poHistorySection = page.locator('[data-testid="section-po-history"]')

      await expect(masterDataSection).toBeVisible()
      await expect(productsSection).toBeVisible()
      await expect(poHistorySection).toBeVisible()
    })
  })

  test.describe('AC-18: Responsive Design', () => {
    test('should display card layout on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 })
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Assert
      // KPI cards stacked
      const kpiCards = page.locator('[data-testid="kpi-card"]')
      const boundingBox1 = await kpiCards.nth(0).boundingBox()
      const boundingBox2 = await kpiCards.nth(1).boundingBox()

      // Cards should be vertically stacked (different Y positions)
      expect(boundingBox1?.y).toBeLessThan(boundingBox2?.y!)

      // Table should be card view (not table)
      const table = page.locator('table')
      await expect(table).not.toBeVisible()

      const cards = page.locator('[data-testid="supplier-card"]')
      await expect(cards).toHaveCount(1) // At least one card visible
    })

    test('should show Load More button on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 })
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Assert
      const loadMoreButton = page.locator('[data-testid="button-load-more"]')
      await expect(loadMoreButton).toBeVisible()

      // Act - Click Load More
      await loadMoreButton.click()

      // Assert
      // More suppliers loaded
      await page.waitForTimeout(500)
      const cards = page.locator('[data-testid="supplier-card"]')
      const count = await cards.count()
      expect(count).toBeGreaterThan(1)
    })

    test('should show filters in bottom sheet on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 })
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Act
      const filterButton = page.locator('[data-testid="button-filters"]')
      await filterButton.click()

      // Assert
      // Bottom sheet opens
      const filterSheet = page.locator('[data-testid="sheet-filters"]')
      await expect(filterSheet).toBeVisible()

      // Filters accessible
      const statusFilter = page.locator('[data-testid="filter-status"]')
      await expect(statusFilter).toBeVisible()
    })
  })

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Arrange
      await loginAsPlanner(page)
      await page.context().setOffline(true)
      await navigateToSuppliers(page)

      // Assert
      const errorMessage = page.locator('[data-testid="error-offline"]')
      await expect(errorMessage).toBeVisible()

      // Act - Go back online
      await page.context().setOffline(false)
      const retryButton = page.locator('[data-testid="button-retry"]')
      await retryButton.click()

      // Should reload
      await page.waitForLoadState('networkidle')
    })

    test('should handle empty supplier list', async ({ page }) => {
      // Arrange - Fresh organization with no suppliers
      await loginAsPlanner(page)
      await navigateToSuppliers(page)

      // Assuming empty state
      const emptyState = page.locator('[data-testid="empty-state-suppliers"]')
      if (await emptyState.isVisible()) {
        // Assert
        await expect(emptyState).toContainText(/no suppliers yet|create your first supplier/i)

        const createButton = page.locator('[data-testid="button-create-supplier"]')
        await expect(createButton).toBeVisible()
      }
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ Critical User Flows:
 *   - View list with KPIs
 *   - Create supplier
 *   - Edit supplier
 *   - Deactivate/Activate
 *   - Delete
 *   - Bulk operations
 *   - Export
 *   - Search/Filter
 *
 * ✅ Responsive Design:
 *   - Desktop view
 *   - Mobile view (375px)
 *   - Bottom sheet filters
 *   - Load More pagination
 *
 * ✅ Error Handling:
 *   - Validation errors
 *   - Business rule violations
 *   - Network errors
 *   - Empty states
 *
 * Acceptance Criteria Coverage:
 * - AC-01: List page with KPIs
 * - AC-02: Code auto-generation
 * - AC-03: Create supplier
 * - AC-05: Edit with code locking
 * - AC-06: Filter by status
 * - AC-07: Search
 * - AC-08: Deactivate
 * - AC-09: Block deactivation
 * - AC-10: Activate
 * - AC-11: Delete
 * - AC-12: Block deletion
 * - AC-14: Bulk deactivate
 * - AC-15: Export
 * - AC-17: Detail page
 * - AC-18: Mobile responsive
 *
 * Total: 20+ test cases
 * Expected Coverage: Critical path only
 */
