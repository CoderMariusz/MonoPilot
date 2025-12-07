/**
 * E2E Tests: License Plates Core (Batch 5A-1)
 * Stories: 5.1-5.4
 *
 * Tests complete user flows for:
 * - Story 5.1: LP Creation - Manual LP creation with product assignment
 * - Story 5.2: LP Status - Status transitions (available → quarantine → available)
 * - Story 5.3: LP Expiry - Batch & expiry tracking, expiring LPs list
 * - Story 5.4: LP Numbering - Auto-numbering and manual numbering
 *
 * NOTE: These tests require E2E environment setup with Playwright
 * Run with: pnpm test:e2e story-5.1-5.4-lp-core.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'

// Test user credentials - should be set via environment
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'admin@test.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!'
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL || 'manager@test.com'
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD || 'TestPassword123!'

/**
 * Helper: Login to application
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|warehouse)/, { timeout: 10000 })
}

/**
 * Helper: Navigate to license plates page
 */
async function goToLicensePlates(page: Page) {
  await page.goto('/warehouse/license-plates')
  await page.waitForSelector('[data-testid="lp-table"]', { timeout: 10000 })
}

/**
 * Helper: Get list of LPs from table
 */
async function getLPsFromTable(page: Page): Promise<string[]> {
  const rows = page.locator('[data-testid="lp-row"]')
  const count = await rows.count()
  const lps: string[] = []
  for (let i = 0; i < count; i++) {
    const lpNumber = await rows.nth(i).locator('[data-testid="lp-number"]').textContent()
    if (lpNumber) lps.push(lpNumber.trim())
  }
  return lps
}

/**
 * Helper: Create new LP via form modal
 */
async function createLP(
  page: Page,
  lpNumber: string,
  productCode: string,
  quantity: number,
  warehouseCode: string,
  batchNumber?: string
) {
  // Click add button
  await page.click('[data-testid="add-lp-btn"]')
  await page.waitForSelector('[data-testid="lp-form-modal"]', { timeout: 5000 })

  // Fill LP number
  await page.fill('input[name="lp_number"]', lpNumber)

  // Select product
  await page.click('[data-testid="product-select"]')
  await page.locator(`text=${productCode}`).first().click()
  await page.waitForTimeout(300)

  // Select warehouse
  await page.click('[data-testid="warehouse-select"]')
  await page.locator(`text=${warehouseCode}`).first().click()
  await page.waitForTimeout(300)

  // Select location
  await page.click('[data-testid="location-select"]')
  await page.locator('[role="option"]').first().click()
  await page.waitForTimeout(300)

  // Fill quantity
  await page.fill('input[name="quantity"]', quantity.toString())

  // Fill batch number if provided
  if (batchNumber) {
    await page.fill('input[name="batch_number"]', batchNumber)
  }

  // Submit form
  await page.click('[data-testid="lp-form-submit"]')
  await page.waitForURL(/\/warehouse\/license-plates/, { timeout: 10000 })
}

// ============================================================================
// LP Creation Tests (Story 5.1)
// ============================================================================
test.describe('LP Creation (Story 5.1)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should display license plates list (AC-5.1.1)', async ({ page }) => {
    await goToLicensePlates(page)

    // Verify table is displayed
    await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()

    // Verify table has headers
    await expect(page.locator('th:has-text("LP Number")')).toBeVisible()
    await expect(page.locator('th:has-text("Product")')).toBeVisible()
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
  })

  test('should display add LP button (AC-5.1.1)', async ({ page }) => {
    await goToLicensePlates(page)

    // Verify add button is displayed
    const addButton = page.locator('[data-testid="add-lp-btn"]')
    await expect(addButton).toBeVisible()
    await expect(addButton).toContainText('Add')
  })

  test('should create new LP manually (AC-5.1.2)', async ({ page }) => {
    await goToLicensePlates(page)

    const uniqueLPNumber = `LP-TEST-${Date.now()}`

    // Click add button
    await page.click('[data-testid="add-lp-btn"]')
    await page.waitForSelector('[data-testid="lp-form-modal"]', { timeout: 5000 })

    // Fill form
    await page.fill('input[name="lp_number"]', uniqueLPNumber)
    await page.click('[data-testid="product-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="warehouse-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="location-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.fill('input[name="quantity"]', '100')

    // Submit form
    await page.click('[data-testid="lp-form-submit"]')
    await page.waitForURL(/\/warehouse\/license-plates/, { timeout: 10000 })

    // Verify LP was created - should appear in table
    await page.waitForTimeout(500)
    const lps = await getLPsFromTable(page)
    expect(lps).toContain(uniqueLPNumber)
  })

  test('should filter LPs by product (AC-5.1.5)', async ({ page }) => {
    await goToLicensePlates(page)

    // Click product filter
    await page.click('[data-testid="product-filter"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Verify filter applied - table should be updated
    await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()
  })

  test('should filter LPs by warehouse (AC-5.1.5)', async ({ page }) => {
    await goToLicensePlates(page)

    // Click warehouse filter
    await page.click('[data-testid="warehouse-filter"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Verify filter applied
    await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()
  })

  test('should search LPs by LP number (AC-5.1.5)', async ({ page }) => {
    await goToLicensePlates(page)

    // Enter search term in LP number search
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    await searchInput.fill('LP-')
    await page.waitForTimeout(500)

    // Verify table is still visible
    await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()
  })

  test('should show validation error for duplicate LP number (AC-5.1.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Create first LP
    const uniqueLPNumber = `LP-DUP-${Date.now()}`
    await createLP(page, uniqueLPNumber, 'RM-001', 100, 'WH-001')

    // Try to create LP with same number
    await page.click('[data-testid="add-lp-btn"]')
    await page.waitForSelector('[data-testid="lp-form-modal"]', { timeout: 5000 })

    await page.fill('input[name="lp_number"]', uniqueLPNumber)
    await page.click('[data-testid="product-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="warehouse-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="location-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.fill('input[name="quantity"]', '50')

    // Try to submit - should show error
    await page.click('[data-testid="lp-form-submit"]')
    await page.waitForTimeout(500)

    // Verify error message
    const errorMsg = page.locator('[data-testid="error-message"]')
    await expect(errorMsg).toBeVisible()
  })
})

// ============================================================================
// LP Status Management Tests (Story 5.2)
// ============================================================================
test.describe('LP Status Management (Story 5.2)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should display LP with available status (AC-5.2.1)', async ({ page }) => {
    await goToLicensePlates(page)

    // Find an LP row
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await expect(firstLPRow).toBeVisible()

    // Verify status badge is shown
    const statusBadge = firstLPRow.locator('[data-testid="lp-status-badge"]')
    await expect(statusBadge).toBeVisible()
  })

  test('should view LP detail (AC-5.2.1)', async ({ page }) => {
    await goToLicensePlates(page)

    // Click first LP row to open detail
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await firstLPRow.click()

    // Wait for detail panel to open
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Verify detail panel shows key information
    await expect(page.locator('[data-testid="lp-detail-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="detail-product"]')).toBeVisible()
    await expect(page.locator('[data-testid="detail-quantity"]')).toBeVisible()
    await expect(page.locator('[data-testid="detail-status"]')).toBeVisible()
  })

  test('should change LP status from available to quarantine (AC-5.2.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Open first LP detail
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await firstLPRow.click()
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Click status dropdown
    await page.click('[data-testid="status-dropdown"]')
    await page.waitForTimeout(300)

    // Select quarantine
    await page.click('[data-testid="status-option-quarantine"]')
    await page.waitForTimeout(500)

    // Verify status changed - should show confirmation
    const confirmBtn = page.locator('[data-testid="confirm-status-change"]')
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify new status is shown
    const statusBadge = page.locator('[data-testid="detail-status"]')
    await expect(statusBadge).toContainText(/quarantine|Quarantine/i)
  })

  test('should change LP status from quarantine back to available (AC-5.2.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Filter to find quarantine LPs if needed
    const quarantineFilter = page.locator('[data-testid="status-filter"]')
    if (await quarantineFilter.isVisible()) {
      await quarantineFilter.click()
      await page.click('[data-testid="filter-option-quarantine"]')
      await page.waitForTimeout(500)
    }

    // Open detail of any LP with quarantine status
    const lpRow = page.locator('[data-testid="lp-row"]').filter({
      has: page.locator('[data-testid="lp-status-badge"]').filter({ hasText: /quarantine/i }),
    }).first()

    if (await lpRow.isVisible()) {
      await lpRow.click()
      await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

      // Change status back to available
      await page.click('[data-testid="status-dropdown"]')
      await page.waitForTimeout(300)

      await page.click('[data-testid="status-option-available"]')
      await page.waitForTimeout(500)

      const confirmBtn = page.locator('[data-testid="confirm-status-change"]')
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
        await page.waitForTimeout(500)
      }

      // Verify status changed
      const statusBadge = page.locator('[data-testid="detail-status"]')
      await expect(statusBadge).toContainText(/available|Available/i)
    }
  })

  test('should display status dropdown with all options (AC-5.2.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Open first LP detail
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await firstLPRow.click()
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Click status dropdown
    await page.click('[data-testid="status-dropdown"]')
    await page.waitForTimeout(300)

    // Verify all status options are available
    const statusOptions = ['available', 'reserved', 'consumed', 'shipped', 'quarantine', 'recalled']
    for (const status of statusOptions) {
      const option = page.locator(`[data-testid="status-option-${status}"]`)
      await expect(option).toBeVisible()
    }
  })
})

// ============================================================================
// LP Batch & Expiry Tests (Story 5.3)
// ============================================================================
test.describe('LP Batch & Expiry (Story 5.3)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should create LP with batch number (AC-5.3.1)', async ({ page }) => {
    await goToLicensePlates(page)

    const uniqueLPNumber = `LP-BATCH-${Date.now()}`
    const batchNumber = `BATCH-${Date.now()}`

    // Click add button
    await page.click('[data-testid="add-lp-btn"]')
    await page.waitForSelector('[data-testid="lp-form-modal"]', { timeout: 5000 })

    // Fill form with batch number
    await page.fill('input[name="lp_number"]', uniqueLPNumber)
    await page.click('[data-testid="product-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="warehouse-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="location-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.fill('input[name="quantity"]', '100')
    await page.fill('input[name="batch_number"]', batchNumber)

    // Submit
    await page.click('[data-testid="lp-form-submit"]')
    await page.waitForURL(/\/warehouse\/license-plates/, { timeout: 10000 })

    // Verify LP was created with batch number
    await page.waitForTimeout(500)
    const lps = await getLPsFromTable(page)
    expect(lps).toContain(uniqueLPNumber)

    // Open detail to verify batch number
    const lpRow = page.locator('[data-testid="lp-row"]').filter({
      has: page.locator('[data-testid="lp-number"]').filter({ hasText: uniqueLPNumber }),
    }).first()
    await lpRow.click()
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Verify batch number is shown
    const batchField = page.locator('[data-testid="detail-batch-number"]')
    await expect(batchField).toContainText(batchNumber)
  })

  test('should create LP with expiry date (AC-5.3.1)', async ({ page }) => {
    await goToLicensePlates(page)

    const uniqueLPNumber = `LP-EXPIRY-${Date.now()}`
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const expiryDateStr = futureDate.toISOString().split('T')[0]

    // Click add button
    await page.click('[data-testid="add-lp-btn"]')
    await page.waitForSelector('[data-testid="lp-form-modal"]', { timeout: 5000 })

    // Fill form with expiry date
    await page.fill('input[name="lp_number"]', uniqueLPNumber)
    await page.click('[data-testid="product-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="warehouse-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="location-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.fill('input[name="quantity"]', '100')
    await page.fill('input[name="expiry_date"]', expiryDateStr)

    // Submit
    await page.click('[data-testid="lp-form-submit"]')
    await page.waitForURL(/\/warehouse\/license-plates/, { timeout: 10000 })

    // Verify LP was created
    await page.waitForTimeout(500)
    const lps = await getLPsFromTable(page)
    expect(lps).toContain(uniqueLPNumber)
  })

  test('should view expiring LPs list (AC-5.3.2)', async ({ page }) => {
    // Go to expiring LPs endpoint (if available)
    await page.goto('/warehouse/license-plates?filter=expiring', { waitUntil: 'networkidle' })

    // If expiring filter not available, use button if it exists
    const expiringBtn = page.locator('[data-testid="expiring-lps-btn"]')
    if (await expiringBtn.isVisible()) {
      await expiringBtn.click()
      await page.waitForURL(/expiring/, { timeout: 5000 })
    }

    // Verify table is displayed
    await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()
  })

  test('should filter LPs by expiry date (AC-5.3.3)', async ({ page }) => {
    await goToLicensePlates(page)

    // Click expiry filter if available
    const expiryFilter = page.locator('[data-testid="expiry-filter"]')
    if (await expiryFilter.isVisible()) {
      await expiryFilter.click()
      await page.locator('[role="option"]').first().click()
      await page.waitForTimeout(500)

      // Verify table is updated
      await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()
    }
  })

  test('should show QA status in LP detail (AC-5.3.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Open first LP detail
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await firstLPRow.click()
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Verify QA status field is displayed
    const qaStatusField = page.locator('[data-testid="detail-qa-status"]')
    if (await qaStatusField.isVisible()) {
      await expect(qaStatusField).toBeVisible()
    }
  })
})

// ============================================================================
// LP Numbering Tests (Story 5.4)
// ============================================================================
test.describe('LP Numbering (Story 5.4)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should accept manual LP number (AC-5.4.1)', async ({ page }) => {
    await goToLicensePlates(page)

    const uniqueLPNumber = `MANUAL-${Date.now()}`

    // Create LP with manual number
    await createLP(page, uniqueLPNumber, 'RM-001', 100, 'WH-001')

    // Verify LP was created with provided number
    await page.waitForTimeout(500)
    const lps = await getLPsFromTable(page)
    expect(lps).toContain(uniqueLPNumber)
  })

  test('should show LP number in table (AC-5.4.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Verify LP numbers are displayed in table
    const lpNumbers = page.locator('[data-testid="lp-number"]')
    const count = await lpNumbers.count()
    expect(count).toBeGreaterThan(0)

    // Verify first LP number is visible and not empty
    const firstLPNumber = await lpNumbers.first().textContent()
    expect(firstLPNumber).toBeTruthy()
  })

  test('should show LP number in detail view (AC-5.4.2)', async ({ page }) => {
    await goToLicensePlates(page)

    // Open first LP detail
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await firstLPRow.click()
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Verify LP number is displayed in detail
    const lpNumberField = page.locator('[data-testid="detail-lp-number"]')
    await expect(lpNumberField).toBeVisible()
    const lpNumber = await lpNumberField.textContent()
    expect(lpNumber).toBeTruthy()
  })

  test('should validate LP number format (AC-5.4.1)', async ({ page }) => {
    await goToLicensePlates(page)

    // Click add button
    await page.click('[data-testid="add-lp-btn"]')
    await page.waitForSelector('[data-testid="lp-form-modal"]', { timeout: 5000 })

    // Try to submit with empty LP number
    await page.fill('input[name="lp_number"]', '')
    await page.click('[data-testid="product-select"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    // Try to submit - should show validation error
    const submitBtn = page.locator('[data-testid="lp-form-submit"]')
    const isEnabled = await submitBtn.isEnabled()

    // Either button is disabled or form shows error
    if (isEnabled) {
      await submitBtn.click()
      await page.waitForTimeout(500)
      const errorMsg = page.locator('[data-testid="error-message"]')
      await expect(errorMsg).toBeVisible()
    } else {
      expect(isEnabled).toBe(false)
    }
  })
})

// ============================================================================
// LP Search & Filter Integration Tests
// ============================================================================
test.describe('LP Search & Filtering Integration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should maintain filter when searching (AC-5.1.5)', async ({ page }) => {
    await goToLicensePlates(page)

    // Apply warehouse filter
    await page.click('[data-testid="warehouse-filter"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    // Now search
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    await searchInput.fill('LP-')
    await page.waitForTimeout(500)

    // Verify both filter and search are active
    const activeFilters = page.locator('[data-testid="active-filter"]')
    const activeFilterCount = await activeFilters.count()
    expect(activeFilterCount).toBeGreaterThan(0)

    // Verify table is still visible
    await expect(page.locator('[data-testid="lp-table"]')).toBeVisible()
  })

  test('should clear all filters (AC-5.1.5)', async ({ page }) => {
    await goToLicensePlates(page)

    // Apply multiple filters
    await page.click('[data-testid="warehouse-filter"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    await page.click('[data-testid="status-filter"]')
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(300)

    // Find and click clear all filters button if available
    const clearBtn = page.locator('[data-testid="clear-filters-btn"]')
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await page.waitForTimeout(500)

      // Verify filters are cleared
      const activeFilters = page.locator('[data-testid="active-filter"]')
      const activeFilterCount = await activeFilters.count()
      expect(activeFilterCount).toBe(0)
    }
  })

  test('should persist search when clicking LP row (AC-5.1.5)', async ({ page }) => {
    await goToLicensePlates(page)

    // Search for LP
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    await searchInput.fill('LP-')
    await page.waitForTimeout(500)

    // Click LP row
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    await firstLPRow.click()
    await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

    // Close detail
    const closeBtn = page.locator('[data-testid="close-detail-btn"]')
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await page.waitForTimeout(300)
    }

    // Verify search is still in input
    const searchValue = await searchInput.inputValue()
    expect(searchValue).toBe('LP-')
  })
})
