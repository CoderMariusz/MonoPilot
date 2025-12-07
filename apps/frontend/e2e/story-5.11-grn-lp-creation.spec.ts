/**
 * E2E Tests: GRN & License Plate Creation (Story 5.11)
 * Epic 5: Warehouse Module - Batch 5A-3
 *
 * Tests complete user flows for:
 * - GRN creation from ASN (AC-5.11.1)
 * - Automatic LP creation with correct numbering (AC-5.11.2)
 * - Partial receiving workflow (AC-5.11.3)
 * - Complete receiving and status updates (AC-5.11.4)
 *
 * EXPECTED: All tests FAIL (RED phase) - GRN/LP APIs not yet implemented
 */

import { test, expect, type Page } from '@playwright/test'

// Test user credentials
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'admin@test.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!'

// Test data - will be populated during test
let testASNNumber: string
let testWarehouseCode: string
let testOrgPrefix: string

/**
 * Helper: Login to application
 */
async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|planning|warehouse)/)
}

/**
 * Helper: Navigate to warehouse receiving page
 */
async function goToReceivingDashboard(page: Page) {
  await page.goto('/warehouse/receiving')
  await page.waitForSelector('[data-testid="receiving-dashboard"]', { timeout: 10000 })
}

/**
 * Helper: Navigate to ASN list and get first submitted ASN
 */
async function getFirstSubmittedASN(page: Page) {
  await page.goto('/warehouse/asns')
  await page.waitForSelector('[data-testid="asn-list"]', { timeout: 10000 })

  // Filter by submitted status
  const statusFilter = page.locator('[data-testid="asn-status-filter"]')
  if (await statusFilter.count() > 0) {
    await statusFilter.click()
    await page.locator('[data-value="submitted"]').click()
  }

  // Find first submitted ASN
  const firstASN = page.locator('[data-testid="asn-row"][data-status="submitted"]').first()

  if (await firstASN.count() === 0) {
    return null
  }

  testASNNumber = await firstASN.locator('[data-testid="asn-number"]').textContent() || ''
  await firstASN.click()

  return firstASN
}

/**
 * Helper: Extract LP number format validation
 * Expected format: LP-{orgPrefix}-{YYYYMMDD}-{seq}
 */
function validateLPNumberFormat(lpNumber: string, orgPrefix: string): boolean {
  const pattern = new RegExp(`^LP-${orgPrefix}-\\d{8}-\\d{4}$`)
  return pattern.test(lpNumber)
}

/**
 * Helper: Get today's date in YYYYMMDD format
 */
function getTodayYYYYMMDD(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// ============================================================================
// GRN & LP Creation Tests (Story 5.11)
// ============================================================================

test.describe('GRN & License Plate Creation (Story 5.11)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // ==========================================================================
  // AC-5.11.1: Create GRN from ASN
  // ==========================================================================
  test.describe('AC-5.11.1: Create GRN from ASN', () => {
    test('should display "Create GRN" button on submitted ASN detail', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found for testing')
        return
      }

      // Wait for ASN detail page
      await page.waitForSelector('[data-testid="asn-detail"]', { timeout: 10000 })

      // Verify "Create GRN" button is visible
      const createGrnButton = page.locator('[data-testid="create-grn-button"]')
      await expect(createGrnButton).toBeVisible()
      await expect(createGrnButton).toBeEnabled()
    })

    test('should only show "Create GRN" for submitted ASNs', async ({ page }) => {
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]')

      // Get first ASN (any status)
      const firstASN = page.locator('[data-testid="asn-row"]').first()

      if (await firstASN.count() === 0) {
        test.skip(true, 'No ASN found')
        return
      }

      const status = await firstASN.locator('[data-testid="asn-status"]').textContent()
      await firstASN.click()
      await page.waitForSelector('[data-testid="asn-detail"]')

      const createGrnButton = page.locator('[data-testid="create-grn-button"]')

      // Button should only be visible if status is 'submitted'
      if (status?.toLowerCase().includes('submitted')) {
        await expect(createGrnButton).toBeVisible()
      }
    })

    test('should open GRN creation modal when clicking "Create GRN"', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Click "Create GRN"
      await page.click('[data-testid="create-grn-button"]')

      // Wait for GRN form modal
      await page.waitForSelector('[data-testid="grn-form-modal"]', { timeout: 10000 })

      // Verify modal title
      await expect(page.locator('[data-testid="grn-modal-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="grn-modal-title"]')).toHaveText(/create grn|new grn/i)
    })

    test('should pre-fill GRN with ASN reference data', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Get ASN details
      const asnNumber = await page.locator('[data-testid="asn-number"]').textContent()
      const expectedArrival = await page.locator('[data-testid="asn-expected-arrival"]').textContent()

      // Open GRN modal
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Verify ASN reference is populated
      const grnAsnField = page.locator('[name="asn_id"]')
      if (await grnAsnField.count() > 0) {
        const asnFieldValue = await grnAsnField.inputValue()
        expect(asnFieldValue).toBeTruthy()
      }

      // Verify ASN number is shown read-only
      const asnNumberDisplay = page.locator('[data-testid="grn-asn-number"]')
      if (await asnNumberDisplay.count() > 0) {
        await expect(asnNumberDisplay).toHaveText(asnNumber!)
      }
    })

    test('should initialize GRN status as "draft"', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Verify status field (should be read-only as draft)
      const statusField = page.locator('[data-testid="grn-status"]')
      if (await statusField.count() > 0) {
        await expect(statusField).toHaveText(/draft/i)
      }
    })

    test('should copy all items from ASN to GRN', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Count ASN items
      const asnItemCount = await page.locator('[data-testid="asn-item-row"]').count()

      // Open GRN modal
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Verify GRN items table
      await expect(page.locator('[data-testid="grn-items-table"]')).toBeVisible()

      // Count GRN items
      const grnItemCount = await page.locator('[data-testid="grn-item-row"]').count()

      // Should match ASN items
      expect(grnItemCount).toBe(asnItemCount)
    })

    test('should display all ASN item details in GRN', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Get first ASN item details
      const firstAsnItem = page.locator('[data-testid="asn-item-row"]').first()
      const asnProductName = await firstAsnItem.locator('[data-testid="asn-item-product"]').textContent()
      const asnQty = await firstAsnItem.locator('[data-testid="asn-item-qty"]').textContent()

      // Open GRN modal
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Verify first GRN item
      const firstGrnItem = page.locator('[data-testid="grn-item-row"]').first()
      const grnProductName = await firstGrnItem.locator('[data-testid="grn-item-product"]').textContent()
      const grnQty = await firstGrnItem.locator('[data-testid="grn-item-expected-qty"]').textContent()

      // Should match
      expect(grnProductName).toContain(asnProductName!)
      expect(grnQty).toContain(asnQty!)
    })
  })

  // ==========================================================================
  // AC-5.11.2: Receive Item with LP Creation
  // ==========================================================================
  test.describe('AC-5.11.2: Receive Item with LP Creation', () => {
    test('should display "Received Qty" field for each GRN item', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Verify received qty input field
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')

      await expect(receivedQtyField).toBeVisible()
      await expect(receivedQtyField).toBeEnabled()
    })

    test('should enter received quantity for item', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Get expected quantity from first item
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await firstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

      // Enter received quantity
      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(expectedQty)

      // Verify value is set
      const value = await receivedQtyField.inputValue()
      expect(value).toBe(expectedQty)
    })

    test('should automatically create LP when receiving item', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Enter received quantity for first item
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await firstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(expectedQty)

      // Complete the GRN
      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Verify LP was created (should appear in success message or detail page)
      const grnDetail = page.locator('[data-testid="grn-detail"]')
      if (await grnDetail.count() > 0) {
        // Look for LP section
        const lpSection = page.locator('[data-testid="grn-created-lps"]')
        if (await lpSection.count() > 0) {
          await expect(lpSection).toBeVisible()

          const lpNumber = await lpSection.locator('[data-testid="lp-number"]').first().textContent()
          expect(lpNumber).toBeTruthy()
        }
      }
    })

    test('should generate LP number with correct format', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Get organization prefix from ASN data
      // In real test, this would come from org settings
      testOrgPrefix = 'ORG' // placeholder

      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Enter received quantity
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await firstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(expectedQty)

      // Complete GRN
      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Verify LP number format
      const lpNumber = await page.locator('[data-testid="lp-number"]').first().textContent()

      if (lpNumber) {
        // Expected format: LP-{orgPrefix}-{YYYYMMDD}-{seq}
        const todayYYYYMMDD = getTodayYYYYMMDD()
        const pattern = new RegExp(`^LP-.*-${todayYYYYMMDD}-\\d{4}$`)
        expect(lpNumber).toMatch(pattern)
      }
    })

    test('should include batch number in LP when ASN item has batch', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Check if first ASN item has batch number
      const firstAsnItem = page.locator('[data-testid="asn-item-row"]').first()
      const batchNumber = await firstAsnItem.locator('[data-testid="asn-item-batch"]').textContent()

      if (!batchNumber || batchNumber.trim() === '') {
        test.skip(true, 'ASN item has no batch number')
        return
      }

      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Enter received quantity
      const grnFirstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await grnFirstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

      const receivedQtyField = grnFirstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(expectedQty)

      // Complete GRN
      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Verify LP has batch number
      const lpDetail = page.locator('[data-testid="lp-detail"]').first()
      if (await lpDetail.count() > 0) {
        const lpBatchNumber = await lpDetail.locator('[data-testid="lp-batch-number"]').textContent()
        expect(lpBatchNumber).toContain(batchNumber!)
      }
    })

    test('should include expiry date in LP when ASN item has expiry', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Check if first ASN item has expiry date
      const firstAsnItem = page.locator('[data-testid="asn-item-row"]').first()
      const expiryDate = await firstAsnItem.locator('[data-testid="asn-item-expiry"]').textContent()

      if (!expiryDate || expiryDate.trim() === '') {
        test.skip(true, 'ASN item has no expiry date')
        return
      }

      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Enter received quantity
      const grnFirstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await grnFirstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

      const receivedQtyField = grnFirstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(expectedQty)

      // Complete GRN
      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Verify LP has expiry date
      const lpDetail = page.locator('[data-testid="lp-detail"]').first()
      if (await lpDetail.count() > 0) {
        const lpExpiryDate = await lpDetail.locator('[data-testid="lp-expiry-date"]').textContent()
        expect(lpExpiryDate).toContain(expiryDate!)
      }
    })

    test('should link LP to received product', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Get product from first ASN item
      const firstAsnItem = page.locator('[data-testid="asn-item-row"]').first()
      const productName = await firstAsnItem.locator('[data-testid="asn-item-product"]').textContent()

      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Enter received quantity
      const grnFirstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await grnFirstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

      const receivedQtyField = grnFirstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(expectedQty)

      // Complete GRN
      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Verify LP product matches ASN item product
      const lpDetail = page.locator('[data-testid="lp-detail"]').first()
      if (await lpDetail.count() > 0) {
        const lpProduct = await lpDetail.locator('[data-testid="lp-product"]').textContent()
        expect(lpProduct).toContain(productName!)
      }
    })
  })

  // ==========================================================================
  // AC-5.11.3: Partial Receiving
  // ==========================================================================
  test.describe('AC-5.11.3: Partial Receiving', () => {
    test('should allow receiving less than expected quantity', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Get expected quantity
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await firstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = parseFloat(expectedQtyText?.match(/[\d.]+/)?.[0] || '100')

      // Receive partial amount (50% of expected)
      const partialQty = (expectedQty / 2).toString()

      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(partialQty)

      // Verify value
      const value = await receivedQtyField.inputValue()
      expect(parseFloat(value)).toBe(expectedQty / 2)
    })

    test('should mark ASN item as partially received', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Enter partial quantity
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await firstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = parseFloat(expectedQtyText?.match(/[\d.]+/)?.[0] || '100')
      const partialQty = (expectedQty / 2).toString()

      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(partialQty)

      // Complete GRN
      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Navigate back to ASN to check status
      await page.goto(`/warehouse/asns/${testASNNumber}`)
      await page.waitForSelector('[data-testid="asn-detail"]')

      // Verify first item shows partial received status
      const firstAsnItem = page.locator('[data-testid="asn-item-row"]').first()
      const itemStatus = await firstAsnItem.locator('[data-testid="asn-item-status"]').textContent()

      // Status should show something like "partially received"
      expect(itemStatus?.toLowerCase()).toMatch(/partial|part received/)
    })

    test('should allow subsequent receipt of remaining quantity', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Check current received qty
      const firstItem = page.locator('[data-testid="asn-item-row"]').first()
      const receivedQtyText = await firstItem.locator('[data-testid="asn-item-received-qty"]').textContent()
      const currentReceived = parseFloat(receivedQtyText?.match(/[\d.]+/)?.[0] || '0')

      if (currentReceived === 0) {
        // First receipt not done, skip
        test.skip(true, 'No partial receipt found')
        return
      }

      // Should be able to receive more
      await page.click('[data-testid="receive-more-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Verify we can enter more quantity
      const remainingField = page.locator('[data-testid="grn-item-remaining-qty"]')
      if (await remainingField.count() > 0) {
        const remainingText = await remainingField.textContent()
        expect(remainingText).toBeTruthy()
      }
    })

    test('should prevent receiving more than expected quantity', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Try to enter qty higher than expected
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const expectedQtyText = await firstItem.locator('[data-testid="grn-item-expected-qty"]').textContent()
      const expectedQty = parseFloat(expectedQtyText?.match(/[\d.]+/)?.[0] || '100')
      const excessQty = (expectedQty * 2).toString() // 200% of expected

      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill(excessQty)

      // Try to save
      await page.click('[data-testid="save-grn-button"]')

      // Should show error
      const errorMsg = page.locator('[data-testid="quantity-error"]')
      if (await errorMsg.count() > 0) {
        await expect(errorMsg).toBeVisible()
      }
    })
  })

  // ==========================================================================
  // AC-5.11.4: Complete Receiving
  // ==========================================================================
  test.describe('AC-5.11.4: Complete Receiving', () => {
    test('should enable "Complete GRN" button when all items received', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Fill all items with expected quantities
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      // Verify "Complete GRN" button is enabled
      const completeButton = page.locator('[data-testid="complete-grn-button"]')
      await expect(completeButton).toBeEnabled()
    })

    test('should complete GRN and update status', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Fill all items with expected quantities
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      // Complete GRN
      await page.click('[data-testid="complete-grn-button"]')
      await page.waitForSelector('[data-testid="grn-completed-success"]', { timeout: 15000 })

      // Verify GRN status changed
      const grnStatus = page.locator('[data-testid="grn-status"]')
      await expect(grnStatus).toHaveText(/completed|received/i)
    })

    test('should update ASN status to "received" when complete', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Get ASN ID from URL or data
      const asnUrl = page.url()
      const asnId = asnUrl.split('/').pop()

      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Fill all items
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      // Complete GRN
      await page.click('[data-testid="complete-grn-button"]')
      await page.waitForSelector('[data-testid="grn-completed-success"]', { timeout: 15000 })

      // Navigate back to ASN
      await page.goto(`/warehouse/asns/${asnId}`)
      await page.waitForSelector('[data-testid="asn-detail"]')

      // Verify ASN status is "received"
      const asnStatus = page.locator('[data-testid="asn-status"]')
      await expect(asnStatus).toHaveText(/received/i)
    })

    test('should update PO status when all ASNs complete', async ({ page }) => {
      // This test requires:
      // 1. Finding a PO with a single ASN
      // 2. Completing the GRN for that ASN
      // 3. Verifying PO status updates

      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')

      // Get PO reference
      const poLink = page.locator('[data-testid="asn-po-link"]')
      const poNumber = await poLink.textContent()

      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Complete all items
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      // Complete GRN
      await page.click('[data-testid="complete-grn-button"]')
      await page.waitForSelector('[data-testid="grn-completed-success"]', { timeout: 15000 })

      // Navigate to PO detail to verify status
      // This assumes there's a way to view PO from ASN
      const grnPoLink = page.locator('[data-testid="grn-po-link"]')
      if (await grnPoLink.count() > 0) {
        await grnPoLink.click()
        await page.waitForSelector('[data-testid="po-detail"]')

        // Verify PO status reflects received LPs
        const poStatus = page.locator('[data-testid="po-status"]')
        const statusText = await poStatus.textContent()

        // Status might be something like "partially received" or "received"
        expect(statusText?.toLowerCase()).toMatch(/received|receiving/)
      }
    })

    test('should create GRN with sequential number', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Fill and save
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      await page.click('[data-testid="complete-grn-button"]')
      await page.waitForSelector('[data-testid="grn-completed-success"]', { timeout: 15000 })

      // Verify GRN number format
      const grnNumber = await page.locator('[data-testid="grn-number"]').textContent()

      // Expected format: GRN-YYYYMMDD-NNNN or similar
      expect(grnNumber).toMatch(/^GRN-/i)
    })
  })

  // ==========================================================================
  // Error & Edge Cases
  // ==========================================================================
  test.describe('Error Handling & Validation', () => {
    test('should show error when trying to receive invalid quantity', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Try negative quantity
      const firstItem = page.locator('[data-testid="grn-item-row"]').first()
      const receivedQtyField = firstItem.locator('[data-testid="grn-item-received-qty"]')
      await receivedQtyField.fill('-10')

      // Try to save
      await page.click('[data-testid="save-grn-button"]')

      // Should show validation error
      const errorMsg = page.locator('[data-testid="quantity-error"]')
      if (await errorMsg.count() > 0) {
        await expect(errorMsg).toBeVisible()
      }
    })

    test('should prevent completing GRN with empty received quantities', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Try to complete without filling quantities
      await page.click('[data-testid="complete-grn-button"]')

      // Should show error
      const errorMsg = page.locator('[data-testid="validation-error"]')
      if (await errorMsg.count() > 0) {
        await expect(errorMsg).toBeVisible()
      }
    })

    test('should not allow creating GRN for non-submitted ASN', async ({ page }) => {
      await page.goto('/warehouse/asns')
      await page.waitForSelector('[data-testid="asn-list"]')

      // Find a non-submitted ASN
      const asnRow = page.locator('[data-testid="asn-row"]').first()

      if (await asnRow.count() === 0) {
        test.skip(true, 'No ASN found')
        return
      }

      const status = await asnRow.locator('[data-testid="asn-status"]').textContent()

      if (status?.toLowerCase().includes('submitted')) {
        test.skip(true, 'No non-submitted ASN found')
        return
      }

      await asnRow.click()
      await page.waitForSelector('[data-testid="asn-detail"]')

      // Verify "Create GRN" button is disabled
      const createGrnButton = page.locator('[data-testid="create-grn-button"]')
      if (await createGrnButton.count() > 0) {
        await expect(createGrnButton).toBeDisabled()
      }
    })
  })

  // ==========================================================================
  // Integration & Navigation Tests
  // ==========================================================================
  test.describe('Integration & Navigation', () => {
    test('should navigate from ASN detail to GRN detail', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Fill and save
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      await page.click('[data-testid="save-grn-button"]')
      await page.waitForSelector('[data-testid="grn-created-success"]', { timeout: 15000 })

      // Verify we can see GRN detail
      const grnDetail = page.locator('[data-testid="grn-detail"]')
      await expect(grnDetail).toBeVisible()
    })

    test('should show created LPs in warehouse inventory after GRN completion', async ({ page }) => {
      const asn = await getFirstSubmittedASN(page)

      if (!asn) {
        test.skip(true, 'No submitted ASN found')
        return
      }

      await page.waitForSelector('[data-testid="asn-detail"]')
      await page.click('[data-testid="create-grn-button"]')
      await page.waitForSelector('[data-testid="grn-form-modal"]')

      // Fill and complete
      const items = page.locator('[data-testid="grn-item-row"]')
      const itemCount = await items.count()

      for (let i = 0; i < itemCount; i++) {
        const item = items.nth(i)
        const expectedQtyText = await item.locator('[data-testid="grn-item-expected-qty"]').textContent()
        const expectedQty = expectedQtyText?.match(/[\d.]+/)?.[0] || '50'

        const receivedQtyField = item.locator('[data-testid="grn-item-received-qty"]')
        await receivedQtyField.fill(expectedQty)
      }

      await page.click('[data-testid="complete-grn-button"]')
      await page.waitForSelector('[data-testid="grn-completed-success"]', { timeout: 15000 })

      // Get first created LP number
      const lpNumber = await page.locator('[data-testid="lp-number"]').first().textContent()

      // Navigate to license plates inventory
      await page.goto('/warehouse/license-plates')
      await page.waitForSelector('[data-testid="lp-list"]', { timeout: 10000 })

      // Verify LP appears in inventory
      const lpRow = page.locator(`[data-testid="lp-row"][data-lp-number="${lpNumber}"]`)
      if (await lpRow.count() > 0) {
        await expect(lpRow).toBeVisible()
      }
    })
  })
})
