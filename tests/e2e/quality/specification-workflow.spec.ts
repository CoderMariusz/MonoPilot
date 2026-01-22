/**
 * Specifications E2E Tests
 * Story: 06.3 - Product Specifications
 * Phase: RED - Tests will fail until implementation exists
 *
 * End-to-end tests for complete specification workflows:
 * - Create draft -> approve -> supersede flow
 * - Search and filter specifications
 * - Review date warning display
 * - Permission checks via UI
 *
 * Test Framework: Playwright
 * Coverage Target: Core user workflows
 * Test Count: 8+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: Specifications list display
 * - AC-02: Filter specifications
 * - AC-03: Create specification
 * - AC-05: Read-only for non-draft
 * - AC-06: Approve workflow
 * - AC-08: Clone as new version
 * - AC-11: Review date warning badge
 */

import { test, expect } from '@playwright/test'

/**
 * Test Configuration
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const QUALITY_PATH = '/quality/specifications'

/**
 * Helper: Login as QA_MANAGER
 */
async function loginAsQAManager(page) {
  // Will fail - login flow not yet mocked in test
  await page.goto(`${BASE_URL}/login`)
  await page.fill('[data-testid="email-input"]', 'qa@test.com')
  await page.fill('[data-testid="password-input"]', 'password123')
  await page.click('[data-testid="login-button"]')
  await page.waitForNavigation()
}

/**
 * Helper: Login as QA_INSPECTOR (no approval permissions)
 */
async function loginAsQAInspector(page) {
  // Will fail - login flow not yet mocked in test
  await page.goto(`${BASE_URL}/login`)
  await page.fill('[data-testid="email-input"]', 'inspector@test.com')
  await page.fill('[data-testid="password-input"]', 'password123')
  await page.click('[data-testid="login-button"]')
  await page.waitForNavigation()
}

/**
 * Helper: Navigate to specifications list
 */
async function navigateToSpecifications(page) {
  // Will fail - navigation not yet implemented
  await page.goto(`${BASE_URL}${QUALITY_PATH}`)
  await page.waitForLoadState('networkidle')
}

test.describe('Specification Workflow - Complete Lifecycle', () => {
  test('should complete create -> approve -> supersede workflow', async ({ page }) => {
    // Will fail - UI components not yet implemented

    // Step 1: Login as QA Manager
    await loginAsQAManager(page)

    // Step 2: Navigate to specifications list
    await navigateToSpecifications(page)

    // Step 3: Click [+ New Specification]
    await page.click('[data-testid="new-specification-button"]')
    await page.waitForLoadState('networkidle')

    // Step 4: Fill create form
    // - Select product from dropdown
    await page.click('[data-testid="product-select"]')
    await page.click('text=Test Product')

    // - Enter spec name
    await page.fill('[data-testid="spec-name-input"]', 'Coffee Bean Roast Spec v1')

    // - Set effective date
    await page.fill('[data-testid="effective-date-input"]', '2025-01-01')

    // Step 5: Click [Save Draft]
    await page.click('[data-testid="save-draft-button"]')
    await page.waitForNavigation()

    // Step 6: Verify redirected to detail page
    expect(page.url()).toContain('/specifications/')
    expect(page.url()).not.toContain('/new')

    // Step 7: Verify status is 'draft'
    const statusBadge = await page.locator('[data-testid="spec-status-badge"]').textContent()
    expect(statusBadge).toContain('Draft')

    // Step 8: Get spec URL for later reference
    const specUrl = page.url()
    const specId = specUrl.split('/').pop()

    // Step 9: Click [Approve] button
    await page.click('[data-testid="approve-button"]')

    // Step 10: Confirm approval in modal
    const modal = page.locator('[data-testid="approve-modal"]')
    await expect(modal).toBeVisible()
    await page.click('[data-testid="confirm-approve-button"]')

    // Step 11: Wait for approval to complete
    await page.waitForLoadState('networkidle')

    // Step 12: Verify status changed to 'active'
    const newStatusBadge = await page.locator('[data-testid="spec-status-badge"]').textContent()
    expect(newStatusBadge).toContain('Active')

    // Step 13: Verify approved_by displayed
    const approvedByText = await page.locator('[data-testid="approved-by"]').textContent()
    expect(approvedByText).toContain('qa@test.com')

    // Step 14: Click [Clone as New Version]
    await page.click('[data-testid="clone-version-button"]')
    await page.waitForLoadState('networkidle')

    // Step 15: Verify new draft v2 created
    const versionBadge = await page.locator('[data-testid="spec-version-badge"]').textContent()
    expect(versionBadge).toContain('2')

    const newStatusBadge2 = await page.locator('[data-testid="spec-status-badge"]').textContent()
    expect(newStatusBadge2).toContain('Draft')

    // Step 16: Click [Approve] on v2
    await page.click('[data-testid="approve-button"]')
    const modal2 = page.locator('[data-testid="approve-modal"]')
    await expect(modal2).toBeVisible()
    await page.click('[data-testid="confirm-approve-button"]')
    await page.waitForLoadState('networkidle')

    // Step 17: Navigate back to v1 to verify superseded
    await page.goto(specUrl)
    const v1StatusBadge = await page.locator('[data-testid="spec-status-badge"]').textContent()
    expect(v1StatusBadge).toContain('Superseded')

    // Step 18: Verify version history shows both versions
    const versionHistory = page.locator('[data-testid="version-history"]')
    await expect(versionHistory).toBeVisible()
    const versions = await page.locator('[data-testid="version-history-item"]').count()
    expect(versions).toBeGreaterThanOrEqual(2)
  })

  test('should search and filter specifications', async ({ page }) => {
    // Will fail - search/filter not yet implemented

    // Step 1: Login and navigate
    await loginAsQAManager(page)
    await navigateToSpecifications(page)

    // Step 2: Verify list loads with multiple specs
    const specRows = page.locator('[data-testid="specification-table-row"]')
    const initialCount = await specRows.count()
    expect(initialCount).toBeGreaterThan(0)

    // Step 3: Enter search term
    await page.fill('[data-testid="search-input"]', 'Coffee')
    await page.waitForTimeout(500) // Wait for debounce

    // Step 4: Verify results filter in real-time
    const filteredRows = page.locator('[data-testid="specification-table-row"]')
    const filteredCount = await filteredRows.count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // Step 5: Verify filtered results contain search term
    const firstRowName = await filteredRows.first().locator('[data-testid="spec-name"]').textContent()
    expect(firstRowName?.toLowerCase()).toContain('coffee')

    // Step 6: Click status filter dropdown
    await page.click('[data-testid="status-filter"]')

    // Step 7: Select 'active' status
    await page.click('[data-testid="status-filter-active"]')
    await page.waitForTimeout(500)

    // Step 8: Verify only active specs shown
    const activeRows = page.locator('[data-testid="specification-table-row"]')
    const activeCount = await activeRows.count()

    // All visible specs should have 'Active' status
    for (let i = 0; i < activeCount; i++) {
      const row = activeRows.nth(i)
      const status = await row.locator('[data-testid="spec-status"]').textContent()
      expect(status).toContain('Active')
    }

    // Step 9: Verify URL reflects filter state
    const url = page.url()
    expect(url).toContain('status=active')

    // Step 10: Clear search filter
    await page.fill('[data-testid="search-input"]', '')
    await page.waitForTimeout(500)

    // Step 11: Verify combined filters still work
    const combinedRows = page.locator('[data-testid="specification-table-row"]')
    const combinedCount = await combinedRows.count()
    expect(combinedCount).toBeGreaterThan(0)
  })

  test('should display review date warning badges', async ({ page }) => {
    // Will fail - review date logic and UI not yet implemented

    // Step 1: Login and navigate
    await loginAsQAManager(page)
    await navigateToSpecifications(page)

    // Step 2: Create active spec with review due in 15 days
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 15)
    const reviewDate = futureDate.toISOString().split('T')[0]

    // Click new spec button
    await page.click('[data-testid="new-specification-button"]')
    await page.waitForLoadState('networkidle')

    // Fill form
    await page.click('[data-testid="product-select"]')
    await page.click('text=Test Product')
    await page.fill('[data-testid="spec-name-input"]', 'Review Warning Test')
    await page.fill('[data-testid="effective-date-input"]', '2024-01-01')
    await page.fill('[data-testid="review-frequency-input"]', '30') // 30 days

    // Save and approve
    await page.click('[data-testid="save-draft-button"]')
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="approve-button"]')
    const modal = page.locator('[data-testid="approve-modal"]')
    await expect(modal).toBeVisible()
    await page.click('[data-testid="confirm-approve-button"]')
    await page.waitForLoadState('networkidle')

    // Navigate back to list
    await navigateToSpecifications(page)

    // Step 3: Find spec row with warning badge
    const specs = page.locator('[data-testid="specification-table-row"]')
    const count = await specs.count()

    let foundWarning = false
    for (let i = 0; i < count; i++) {
      const row = specs.nth(i)
      const warningBadge = row.locator('[data-testid="review-warning-badge"]')
      const isVisible = await warningBadge.isVisible().catch(() => false)
      if (isVisible) {
        foundWarning = true
        const badgeText = await warningBadge.textContent()
        expect(badgeText).toContain('warning')
      }
    }

    // Warning badge should exist for due_soon specs
    expect(foundWarning).toBe(true)

    // Step 4: Hover over warning badge to see tooltip
    const warningBadges = page.locator('[data-testid="review-warning-badge"]')
    if ((await warningBadges.count()) > 0) {
      await warningBadges.first().hover()
      const tooltip = page.locator('[data-testid="review-tooltip"]')
      await expect(tooltip).toBeVisible()
      const tooltipText = await tooltip.textContent()
      expect(tooltipText).toContain('Review due in')
    }
  })

  test('should enforce read-only state for non-draft specs', async ({ page }) => {
    // Will fail - read-only UI state not yet implemented

    // Step 1: Login and navigate
    await loginAsQAManager(page)
    await navigateToSpecifications(page)

    // Step 2: Click on an active specification (not draft)
    const activeSpec = page.locator('[data-testid="specification-table-row"]').first()
    const specLink = activeSpec.locator('[data-testid="spec-name-link"]')
    await specLink.click()
    await page.waitForLoadState('networkidle')

    // Step 3: Verify all fields are read-only
    const nameInput = page.locator('[data-testid="spec-name-input"]')
    const descInput = page.locator('[data-testid="spec-description-input"]')

    // Both should have readonly attribute or be disabled
    const nameIsReadonly = await nameInput.evaluate((el: HTMLInputElement) => el.readOnly)
    const descIsReadonly = await descInput.evaluate((el: HTMLInputElement) => el.readOnly)

    expect(nameIsReadonly || (await nameInput.isDisabled())).toBe(true)
    expect(descIsReadonly || (await descInput.isDisabled())).toBe(true)

    // Step 4: Verify only [Clone as New Version] button visible
    const approveButton = page.locator('[data-testid="approve-button"]')
    const editButton = page.locator('[data-testid="edit-button"]')
    const deleteButton = page.locator('[data-testid="delete-button"]')
    const cloneButton = page.locator('[data-testid="clone-version-button"]')

    await expect(approveButton).not.toBeVisible()
    await expect(editButton).not.toBeVisible()
    await expect(deleteButton).not.toBeVisible()
    await expect(cloneButton).toBeVisible()
  })

  test('should hide approve button from QA_INSPECTOR role', async ({ page }) => {
    // Will fail - role-based UI hiding not yet implemented

    // Step 1: Login as QA_INSPECTOR
    await loginAsQAInspector(page)

    // Step 2: Navigate to specifications
    await navigateToSpecifications(page)

    // Step 3: Create a draft specification
    await page.click('[data-testid="new-specification-button"]')
    await page.waitForLoadState('networkidle')

    await page.click('[data-testid="product-select"]')
    await page.click('text=Test Product')
    await page.fill('[data-testid="spec-name-input"]', 'Inspector Test Spec')
    await page.fill('[data-testid="effective-date-input"]', '2025-01-01')

    await page.click('[data-testid="save-draft-button"]')
    await page.waitForLoadState('networkidle')

    // Step 4: Verify [Approve] button is hidden
    const approveButton = page.locator('[data-testid="approve-button"]')
    await expect(approveButton).not.toBeVisible()

    // Step 5: Verify other buttons still visible
    const editButton = page.locator('[data-testid="edit-button"]')
    const deleteButton = page.locator('[data-testid="delete-button"]')

    await expect(editButton).toBeVisible()
    await expect(deleteButton).toBeVisible()
  })

  test('should prevent approve via API without QA_MANAGER role', async ({ page }) => {
    // Will fail - role-based API protection not yet implemented

    // Step 1: Login as QA_INSPECTOR
    await loginAsQAInspector(page)

    // Step 2: Create a draft spec
    await navigateToSpecifications(page)
    await page.click('[data-testid="new-specification-button"]')
    await page.waitForLoadState('networkidle')

    await page.click('[data-testid="product-select"]')
    await page.click('text=Test Product')
    await page.fill('[data-testid="spec-name-input"]', 'API Test Spec')
    await page.fill('[data-testid="effective-date-input"]', '2025-01-01')

    await page.click('[data-testid="save-draft-button"]')
    await page.waitForLoadState('networkidle')

    // Step 3: Try to approve via API directly
    const specUrl = page.url()
    const specId = specUrl.split('/').pop()

    // Attempt approve via fetch
    const response = await page.evaluate(async (id) => {
      const res = await fetch(`/api/quality/specifications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      return { status: res.status, ok: res.ok }
    }, specId)

    // Step 4: Verify 403 Forbidden response
    expect(response.status).toBe(403)
  })

  test('should display spec list with correct columns and performance', async ({ page }) => {
    // Will fail - list display and performance not yet verified

    // Step 1: Login and navigate
    await loginAsQAManager(page)

    // Measure load time
    const startTime = Date.now()
    await navigateToSpecifications(page)
    const loadTime = Date.now() - startTime

    // Step 2: Verify list loads within 500ms
    expect(loadTime).toBeLessThan(500)

    // Step 3: Verify all required columns present
    const columnHeaders = [
      'spec_number',
      'name',
      'product',
      'version',
      'status',
      'effective_date',
      'next_review_date',
      'actions',
    ]

    for (const col of columnHeaders) {
      const header = page.locator(`[data-testid="col-header-${col}"]`)
      await expect(header).toBeVisible()
    }

    // Step 4: Verify pagination
    const paginationControls = page.locator('[data-testid="pagination-controls"]')
    await expect(paginationControls).toBeVisible()

    // Step 5: Verify column sorting works
    const specNumberHeader = page.locator('[data-testid="col-header-spec_number"]')
    await specNumberHeader.click()

    // After sorting, list should re-order
    await page.waitForLoadState('networkidle')
    const firstSpecAfterSort = await page.locator('[data-testid="spec-number"]').first().textContent()
    expect(firstSpecAfterSort).toBeDefined()
  })

  test('should prevent deletion of non-draft specifications', async ({ page }) => {
    // Will fail - delete protection not yet implemented

    // Step 1: Login and navigate
    await loginAsQAManager(page)
    await navigateToSpecifications(page)

    // Step 2: Find an active spec
    const activeSpec = page.locator(
      '[data-testid="specification-table-row"]:has([data-testid="spec-status"]:has-text("Active"))'
    )
    await activeSpec.locator('[data-testid="spec-name-link"]').click()
    await page.waitForLoadState('networkidle')

    // Step 3: Verify delete button is hidden or disabled
    const deleteButton = page.locator('[data-testid="delete-button"]')
    const isVisible = await deleteButton.isVisible().catch(() => false)
    const isDisabled = await deleteButton.isDisabled().catch(() => false)

    expect(isVisible || isDisabled).toBe(true)

    // Step 4: Create a draft spec
    await page.click('[data-testid="back-button"]')
    await page.click('[data-testid="new-specification-button"]')
    await page.waitForLoadState('networkidle')

    await page.click('[data-testid="product-select"]')
    await page.click('text=Test Product')
    await page.fill('[data-testid="spec-name-input"]', 'Delete Test Spec')
    await page.fill('[data-testid="effective-date-input"]', '2025-01-01')
    await page.click('[data-testid="save-draft-button"]')
    await page.waitForLoadState('networkidle')

    // Step 5: Verify delete button IS visible for draft
    const draftDeleteButton = page.locator('[data-testid="delete-button"]')
    await expect(draftDeleteButton).toBeVisible()
  })
})
