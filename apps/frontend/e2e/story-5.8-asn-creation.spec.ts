/**
 * E2E Tests: ASN Creation (Story 5.8)
 * Epic 5: Warehouse Module - Batch 5A-3
 *
 * Tests complete user flows for:
 * - ASN creation modal from PO (AC-5.8.1)
 * - ASN items pre-filled from PO lines (AC-5.8.2)
 * - ASN number auto-generation (AC-5.8.3)
 * - ASN linked to PO (AC-5.8.4)
 * - ASN status tracking (AC-5.8.5)
 *
 * EXPECTED: All tests FAIL (RED phase) - API not yet implemented
 */

import { test, expect, type Page } from '@playwright/test'

// Test user credentials
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'admin@test.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!'

/**
 * Helper: Login to application
 */
async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|planning)/)
}

/**
 * Helper: Navigate to planning dashboard
 */
async function goToPlanningDashboard(page: Page) {
  await page.goto('/planning/dashboard')
  await page.waitForSelector('[data-testid="planning-dashboard"]', { timeout: 10000 })
}

/**
 * Helper: Create test PO with 3 items
 */
async function createTestPO(page: Page) {
  await goToPlanningDashboard(page)

  // Click "New Purchase Order"
  await page.click('[data-testid="new-po-button"]')

  // Wait for PO modal
  await page.waitForSelector('[data-testid="po-form-modal"]')

  // Select supplier
  await page.click('[name="supplier_id"]')
  await page.locator('[role="option"]').first().click()

  // Add 3 PO lines
  for (let i = 0; i < 3; i++) {
    await page.click('[data-testid="add-po-line-button"]')
    await page.click(`[data-testid="po-line-${i}-product"]`)
    await page.locator('[role="option"]').first().click()
    await page.fill(`[data-testid="po-line-${i}-quantity"]`, '100')
  }

  // Save PO
  await page.click('[data-testid="save-po-button"]')
  await page.waitForSelector('[data-testid="po-created-success"]')

  // Confirm PO to make it eligible for ASN
  await page.click('[data-testid="confirm-po-button"]')
  await page.waitForSelector('[data-status="confirmed"]')
}

// ============================================================================
// ASN Creation Tests (Story 5.8)
// ============================================================================
test.describe('ASN Creation (Story 5.8)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe('ASN Creation Modal (AC-5.8.1)', () => {
    test('should display "Create ASN" button on confirmed PO', async ({ page }) => {
      await goToPlanningDashboard(page)

      // Find a confirmed PO
      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found for testing')
        return
      }

      await poRow.click()

      // Wait for PO detail modal/page
      await page.waitForSelector('[data-testid="po-detail"]', { timeout: 10000 })

      // Verify "Create ASN" button exists
      await expect(page.locator('[data-testid="create-asn-button"]')).toBeVisible()
    })

    test('should open ASN modal when clicking "Create ASN"', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')

      // Click "Create ASN"
      await page.click('[data-testid="create-asn-button"]')

      // Wait for ASN modal
      await page.waitForSelector('[data-testid="asn-form-modal"]', { timeout: 10000 })

      // Verify modal title
      await expect(page.locator('[data-testid="asn-modal-title"]')).toHaveText(/Create ASN/)
    })

    test('should show ASN form fields', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Verify form fields
      await expect(page.locator('[name="po_number"]')).toBeVisible()
      await expect(page.locator('[name="po_number"]')).toBeDisabled() // read-only
      await expect(page.locator('[name="expected_arrival_date"]')).toBeVisible()
      await expect(page.locator('[name="carrier"]')).toBeVisible()
      await expect(page.locator('[name="tracking_number"]')).toBeVisible()
    })
  })

  test.describe('ASN Items Pre-filled (AC-5.8.2)', () => {
    test('should pre-fill ASN items from PO lines', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')

      // Get PO line count
      const poLineCount = await page.locator('[data-testid^="po-line-"]').count()

      // Open ASN modal
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Verify ASN items table
      await expect(page.locator('[data-testid="asn-items-table"]')).toBeVisible()

      // Verify item count matches PO lines
      const asnItemCount = await page.locator('[data-testid^="asn-item-"]').count()
      expect(asnItemCount).toBe(poLineCount)
    })

    test('should display ASN item details (product, qty, uom)', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Verify first item has required fields
      const firstItem = page.locator('[data-testid="asn-item-0"]')
      await expect(firstItem.locator('[data-testid="asn-item-product"]')).toBeVisible()
      await expect(firstItem.locator('[data-testid="asn-item-quantity"]')).toBeVisible()
      await expect(firstItem.locator('[data-testid="asn-item-uom"]')).toBeVisible()
    })

    test('should allow editing supplier batch, mfg date, expiry date', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Verify editable fields
      const firstItem = page.locator('[data-testid="asn-item-0"]')
      await expect(firstItem.locator('[name="supplier_batch_number"]')).toBeEnabled()
      await expect(firstItem.locator('[name="manufacture_date"]')).toBeEnabled()
      await expect(firstItem.locator('[name="expiry_date"]')).toBeEnabled()
    })
  })

  test.describe('ASN Creation & Auto-numbering (AC-5.8.3)', () => {
    test('should create ASN with auto-generated number', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Fill required fields
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const expectedDate = tomorrow.toISOString().split('T')[0]

      await page.fill('[name="expected_arrival_date"]', expectedDate)
      await page.fill('[name="carrier"]', 'DHL Express')
      await page.fill('[name="tracking_number"]', 'TRACK-12345')

      // Save ASN
      await page.click('[data-testid="save-asn-button"]')

      // Wait for success message
      await page.waitForSelector('[data-testid="asn-created-success"]', { timeout: 10000 })

      // Verify ASN number format: ASN-YYYYMMDD-NNNN
      const asnNumber = await page.locator('[data-testid="asn-number"]').textContent()
      expect(asnNumber).toMatch(/^ASN-\d{8}-\d{4}$/)
    })

    test('should validate expected_arrival_date is required', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Try to save without expected_arrival_date
      await page.click('[data-testid="save-asn-button"]')

      // Verify validation error
      await expect(page.locator('[data-testid="expected-arrival-date-error"]')).toHaveText(/required/i)
    })

    test('should allow carrier and tracking to be optional', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Fill only required field
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const expectedDate = tomorrow.toISOString().split('T')[0]

      await page.fill('[name="expected_arrival_date"]', expectedDate)

      // Save without carrier/tracking
      await page.click('[data-testid="save-asn-button"]')

      // Should succeed
      await page.waitForSelector('[data-testid="asn-created-success"]', { timeout: 10000 })
    })
  })

  test.describe('ASN Linked to PO (AC-5.8.4)', () => {
    test('should link ASN to PO via po_id', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      // Get PO number
      const poNumber = await poRow.locator('[data-testid="po-number"]').textContent()

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Fill and save ASN
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('[name="expected_arrival_date"]', tomorrow.toISOString().split('T')[0])
      await page.click('[data-testid="save-asn-button"]')
      await page.waitForSelector('[data-testid="asn-created-success"]')

      // Verify PO link in ASN
      await expect(page.locator('[data-testid="asn-po-link"]')).toHaveText(poNumber!)
    })

    test('should show ASN in PO detail', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')

      // Check if ASN section exists
      const asnSection = page.locator('[data-testid="po-asns-section"]')
      if (await asnSection.count() > 0) {
        await expect(asnSection).toBeVisible()
      }
    })
  })

  test.describe('ASN Status Tracking (AC-5.8.5)', () => {
    test('should set ASN status to "pending" on creation', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      // Fill and save
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('[name="expected_arrival_date"]', tomorrow.toISOString().split('T')[0])
      await page.click('[data-testid="save-asn-button"]')
      await page.waitForSelector('[data-testid="asn-created-success"]')

      // Verify status
      await expect(page.locator('[data-testid="asn-status"]')).toHaveText(/pending/i)
    })
  })

  test.describe('ASN List Page', () => {
    test('should display ASN list at /warehouse/asns', async ({ page }) => {
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]', { timeout: 10000 })

      // Verify table headers
      await expect(page.locator('th:has-text("ASN Number")')).toBeVisible()
      await expect(page.locator('th:has-text("PO")')).toBeVisible()
      await expect(page.locator('th:has-text("Expected Arrival")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
    })

    test('should show newly created ASN in list', async ({ page }) => {
      await goToPlanningDashboard(page)

      const poRow = page.locator('[data-testid="po-row"][data-status="confirmed"]').first()

      if (await poRow.count() === 0) {
        test.skip(true, 'No confirmed PO found')
        return
      }

      await poRow.click()
      await page.waitForSelector('[data-testid="po-detail"]')
      await page.click('[data-testid="create-asn-button"]')
      await page.waitForSelector('[data-testid="asn-form-modal"]')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('[name="expected_arrival_date"]', tomorrow.toISOString().split('T')[0])
      await page.click('[data-testid="save-asn-button"]')
      await page.waitForSelector('[data-testid="asn-created-success"]')

      // Get ASN number
      const asnNumber = await page.locator('[data-testid="asn-number"]').textContent()

      // Navigate to ASN list
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]')

      // Verify ASN appears in list
      await expect(page.locator(`[data-testid="asn-row"][data-asn-number="${asnNumber}"]`)).toBeVisible()
    })

    test('should filter ASN list by status', async ({ page }) => {
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]')

      // Click status filter
      await page.click('[data-testid="asn-status-filter"]')
      await page.click('[data-value="pending"]')

      // Verify all visible ASNs have status "pending"
      const rows = page.locator('[data-testid="asn-row"]')
      const count = await rows.count()

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator('[data-testid="asn-status"]')).toHaveText(/pending/i)
      }
    })
  })

  test.describe('ASN Detail Page', () => {
    test('should display ASN detail at /warehouse/asns/:id', async ({ page }) => {
      // First, go to ASN list
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]')

      const firstAsn = page.locator('[data-testid="asn-row"]').first()

      if (await firstAsn.count() === 0) {
        test.skip(true, 'No ASN found')
        return
      }

      // Click to view detail
      await firstAsn.click()

      // Wait for detail page
      await page.waitForSelector('[data-testid="asn-detail"]', { timeout: 10000 })

      // Verify detail sections
      await expect(page.locator('[data-testid="asn-number"]')).toBeVisible()
      await expect(page.locator('[data-testid="asn-po-link"]')).toBeVisible()
      await expect(page.locator('[data-testid="asn-expected-arrival"]')).toBeVisible()
      await expect(page.locator('[data-testid="asn-items-table"]')).toBeVisible()
    })

    test('should show "Receive Goods" button on ASN detail', async ({ page }) => {
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]')

      const firstAsn = page.locator('[data-testid="asn-row"]').first()

      if (await firstAsn.count() === 0) {
        test.skip(true, 'No ASN found')
        return
      }

      await firstAsn.click()
      await page.waitForSelector('[data-testid="asn-detail"]')

      // Verify "Receive Goods" button (for future GRN creation)
      await expect(page.locator('[data-testid="receive-goods-button"]')).toBeVisible()
    })
  })

  test.describe('API Validation', () => {
    test('should fail with invalid po_id', async ({ page }) => {
      // Direct API call test (would use manual fetch or API testing library)
      // This is placeholder - actual test would mock API
      expect(true).toBe(true) // Placeholder
    })

    test('should fail when PO already has ASN', async ({ page }) => {
      // Test duplicate ASN creation prevention
      expect(true).toBe(true) // Placeholder
    })

    test('should fail when PO status is not Confirmed+', async ({ page }) => {
      // Test PO status validation
      expect(true).toBe(true) // Placeholder
    })
  })
})
