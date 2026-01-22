/**
 * E2E Tests: Packing Scanner Mobile Workflow
 * Story: 07.12 - Packing Scanner Mobile UI
 * Phase: RED - All tests should FAIL until implementation exists
 *
 * Tests complete user workflows for mobile packing scanner:
 * - 6-step wizard navigation
 * - Shipment selection and barcode scanning
 * - Box management (create, switch, close)
 * - LP scanning and validation
 * - Quantity entry with number pad
 * - Allergen warning and confirmation
 * - Audio/haptic/visual feedback
 * - Touch target compliance (WCAG)
 * - High contrast accessibility
 *
 * Coverage: Full user journey tests
 * Test Count: 30+ scenarios
 * Viewport: 390x844 (iPhone 12 portrait)
 *
 * Acceptance Criteria Coverage:
 * - AC-1: 6-step wizard navigation
 * - AC-2: Shipment selection
 * - AC-3: Box management
 * - AC-4: LP scanning and validation
 * - AC-5: Quantity entry
 * - AC-6: Allergen warning display
 * - AC-7: Audio feedback
 * - AC-8: Touch target compliance
 * - AC-9: Multi-box workflow
 * - AC-10: Completion screen
 */

import { test, expect, Page } from '@playwright/test'

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testPackerEmail: string
let testPackerPassword: string
let testManagerEmail: string
let testManagerPassword: string

test.beforeAll(async () => {
  // Test credentials - will be set up in test environment
  testPackerEmail = 'packer@test.monopilot.com'
  testPackerPassword = 'TestPassword123!'
  testManagerEmail = 'warehouse-manager@test.monopilot.com'
  testManagerPassword = 'TestPassword123!'
})

// Mobile viewport for all tests
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL(/\/(dashboard|scanner)/, { timeout: 60000 })
}

async function createTestShipment(page: Page): Promise<string> {
  // Create a shipment via API for testing
  const response = await page.request.post('/api/shipping/shipments', {
    data: {
      sales_order_id: 'test-so-001',
      status: 'pending',
    },
  })

  if (!response.ok()) {
    throw new Error(`Failed to create shipment: ${await response.text()}`)
  }

  const data = await response.json()
  return data.shipment?.id || data.id
}

async function cleanupShipment(page: Page, shipmentId: string): Promise<void> {
  await page.request.delete(`/api/shipping/shipments/${shipmentId}`)
}

async function navigateToPackScanner(page: Page) {
  await page.goto('/scanner/shipping/pack')
  await page.waitForSelector('[data-testid="scanner-pack-wizard"]', { timeout: 10000 })
}

// ============================================================================
// STEP 1: SELECT SHIPMENT
// ============================================================================

test.describe('E2E: Step 1 - Select Shipment', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
  })

  test('should display pending shipments list on page load', async ({ page }) => {
    // Step 1: Navigate to scanner pack page
    await navigateToPackScanner(page)

    // Expected: Step 1 is active
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 1/)

    // Expected: Shipments list visible
    const shipmentsList = page.locator('[data-testid="shipments-list"]')
    await expect(shipmentsList).toBeVisible({ timeout: 10000 })

    // Expected: At least one shipment row
    const shipmentRows = page.locator('[data-testid="shipment-row"]')
    await expect(shipmentRows.first()).toBeVisible()

    expect(true).toBe(false) // RED - will fail until implemented
  })

  test('should show shipment details (SO#, customer, lines, date)', async ({ page }) => {
    await navigateToPackScanner(page)

    const firstRow = page.locator('[data-testid="shipment-row"]').first()

    // Expected: Shipment details visible
    await expect(firstRow.locator('[data-testid="so-number"]')).toBeVisible()
    await expect(firstRow.locator('[data-testid="customer-name"]')).toBeVisible()
    await expect(firstRow.locator('[data-testid="lines-count"]')).toBeVisible()
    await expect(firstRow.locator('[data-testid="promised-date"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should display allergen alert indicator for customers with restrictions', async ({ page }) => {
    await navigateToPackScanner(page)

    // Find row with allergen alert
    const allergenRow = page.locator('[data-testid="shipment-row"]:has([data-testid="allergen-alert"])')

    if (await allergenRow.count() > 0) {
      // Expected: Yellow allergen indicator visible
      const allergenIcon = allergenRow.first().locator('[data-testid="allergen-alert"]')
      await expect(allergenIcon).toBeVisible()
      await expect(allergenIcon).toHaveClass(/yellow|amber|warning/)
    }

    expect(true).toBe(false) // RED
  })

  test('should sort shipments by promised_ship_date (soonest first)', async ({ page }) => {
    await navigateToPackScanner(page)

    const dates = await page.locator('[data-testid="promised-date"]').allTextContents()

    // Verify sorted ascending
    const parsedDates = dates.map(d => new Date(d).getTime())
    for (let i = 0; i < parsedDates.length - 1; i++) {
      expect(parsedDates[i]).toBeLessThanOrEqual(parsedDates[i + 1])
    }

    expect(true).toBe(false) // RED
  })

  test('should select shipment on tap and proceed to Step 2', async ({ page }) => {
    await navigateToPackScanner(page)

    // Tap first shipment
    await page.locator('[data-testid="shipment-row"]').first().tap()

    // Expected: Navigates to Step 2
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 2/)

    expect(true).toBe(false) // RED
  })

  test('should allow scanning SO barcode to select shipment', async ({ page }) => {
    await navigateToPackScanner(page)

    // Click scan button
    await page.locator('button:has-text("Scan SO")').tap()

    // Expected: Barcode input focused
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await expect(scanInput).toBeFocused()

    // Simulate barcode scan
    await scanInput.fill('SO-2025-00001')
    await scanInput.press('Enter')

    // Expected: Shipment selected, proceed to Step 2
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 2/)

    expect(true).toBe(false) // RED
  })

  test('should show error for invalid SO barcode', async ({ page }) => {
    await navigateToPackScanner(page)

    await page.locator('button:has-text("Scan SO")').tap()
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('INVALID-BARCODE')
    await scanInput.press('Enter')

    // Expected: Error message visible
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/not found|invalid/i)

    expect(true).toBe(false) // RED
  })

  test('should display shipment row height >= 64px for touch targets', async ({ page }) => {
    await navigateToPackScanner(page)

    const row = page.locator('[data-testid="shipment-row"]').first()
    const boundingBox = await row.boundingBox()

    expect(boundingBox?.height).toBeGreaterThanOrEqual(64)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// STEP 2: BOX MANAGEMENT
// ============================================================================

test.describe('E2E: Step 2 - Box Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    // Select first shipment to get to Step 2
    await page.locator('[data-testid="shipment-row"]').first().tap()
  })

  test('should auto-create first box when shipment selected', async ({ page }) => {
    // Expected: Box 1 created and displayed
    await expect(page.locator('[data-testid="current-box-indicator"]')).toContainText(/Box 1/)

    expect(true).toBe(false) // RED
  })

  test('should display shipment header with SO#, customer, progress', async ({ page }) => {
    // Expected: Shipment header visible
    await expect(page.locator('[data-testid="shipment-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="shipment-so-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="shipment-customer"]')).toBeVisible()
    await expect(page.locator('[data-testid="pack-progress"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should show box contents summary (item count, weight)', async ({ page }) => {
    // Expected: Box summary visible
    await expect(page.locator('[data-testid="box-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="box-item-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="box-weight-estimate"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should allow creating new box', async ({ page }) => {
    // Tap Create New Box button
    await page.locator('button:has-text("Create New Box")').tap()

    // Expected: Box 2 created
    await expect(page.locator('[data-testid="current-box-indicator"]')).toContainText(/Box 2/)

    expect(true).toBe(false) // RED
  })

  test('should allow switching between multiple open boxes', async ({ page }) => {
    // Create second box
    await page.locator('button:has-text("Create New Box")').tap()

    // Expected: Box selector visible
    const boxSelector = page.locator('[data-testid="box-selector"]')
    await expect(boxSelector).toBeVisible()

    // Tap Box 1 to switch back
    await boxSelector.locator('button:has-text("Box 1")').tap()

    // Expected: Box 1 is now active
    await expect(page.locator('[data-testid="current-box-indicator"]')).toContainText(/Box 1/)

    expect(true).toBe(false) // RED
  })

  test('should proceed to Step 3 when Scan Item tapped', async ({ page }) => {
    // Tap Scan Item button
    await page.locator('button:has-text("Scan Item")').tap()

    // Expected: Step 3 displayed
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 3/)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// STEP 3: SCAN LP
// ============================================================================

test.describe('E2E: Step 3 - Scan LP', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()
    await page.locator('button:has-text("Scan Item")').tap()
  })

  test('should auto-focus barcode input', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await expect(scanInput).toBeFocused()

    expect(true).toBe(false) // RED
  })

  test('should display instruction text "Scan License Plate"', async ({ page }) => {
    await expect(page.locator('text=/Scan.*License.*Plate/i')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should lookup LP on barcode scan and show product details', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('LP-2025-00001')
    await scanInput.press('Enter')

    // Expected: Product details card visible
    await expect(page.locator('[data-testid="lp-details-card"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="lot-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="available-qty"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should show success feedback on valid scan (green flash)', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('LP-2025-00001')
    await scanInput.press('Enter')

    // Expected: Success animation visible
    await expect(page.locator('[data-testid="success-animation"]')).toBeVisible({ timeout: 1000 })

    expect(true).toBe(false) // RED
  })

  test('should show error feedback on invalid LP (red flash)', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('LP-INVALID')
    await scanInput.press('Enter')

    // Expected: Error animation visible
    await expect(page.locator('[data-testid="error-animation"]')).toBeVisible({ timeout: 1000 })

    expect(true).toBe(false) // RED
  })

  test('should show error for LP not allocated to this shipment', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('LP-UNALLOCATED')
    await scanInput.press('Enter')

    // Expected: Error message about allocation
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/not allocated/i)

    expect(true).toBe(false) // RED
  })

  test('should proceed to Step 4 after valid LP scan', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('LP-2025-00001')
    await scanInput.press('Enter')

    // Expected: Step 4 displayed
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 4/, { timeout: 5000 })

    expect(true).toBe(false) // RED
  })

  test('should display allergen warning banner if product has allergens', async ({ page }) => {
    const scanInput = page.locator('[data-testid="barcode-input"]')
    await scanInput.fill('LP-ALLERGEN-PRODUCT')
    await scanInput.press('Enter')

    // Expected: Yellow allergen banner visible
    const allergenBanner = page.locator('[data-testid="allergen-warning-banner"]')
    await expect(allergenBanner).toBeVisible({ timeout: 5000 })
    await expect(allergenBanner).toHaveClass(/yellow|amber/)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// STEP 4: QUANTITY ENTRY
// ============================================================================

test.describe('E2E: Step 4 - Quantity Entry', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()
    await page.locator('button:has-text("Scan Item")').tap()
    await page.locator('[data-testid="barcode-input"]').fill('LP-2025-00001')
    await page.locator('[data-testid="barcode-input"]').press('Enter')
    await page.waitForSelector('[data-testid="number-pad"]', { timeout: 10000 })
  })

  test('should display number pad with digits 0-9', async ({ page }) => {
    const numberPad = page.locator('[data-testid="number-pad"]')
    await expect(numberPad).toBeVisible()

    // All digits present
    for (let i = 0; i <= 9; i++) {
      await expect(numberPad.locator(`button:has-text("${i}")`)).toBeVisible()
    }

    expect(true).toBe(false) // RED
  })

  test('should display quick adjust buttons (+1, -1, +10, -10)', async ({ page }) => {
    const numberPad = page.locator('[data-testid="number-pad"]')

    await expect(numberPad.locator('button:has-text("+1")')).toBeVisible()
    await expect(numberPad.locator('button:has-text("-1")')).toBeVisible()
    await expect(numberPad.locator('button:has-text("+10")')).toBeVisible()
    await expect(numberPad.locator('button:has-text("-10")')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should pre-fill quantity with available qty', async ({ page }) => {
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    const value = await quantityInput.inputValue()

    // Should be pre-filled (not empty)
    expect(value.length).toBeGreaterThan(0)

    expect(true).toBe(false) // RED
  })

  test('should update quantity on number pad tap', async ({ page }) => {
    const quantityInput = page.locator('[data-testid="quantity-input"]')

    // Clear and enter new value
    await page.locator('button[data-testid="clear-btn"]').tap()
    await page.locator('button:has-text("5")').tap()
    await page.locator('button:has-text("0")').tap()

    await expect(quantityInput).toHaveValue('50')

    expect(true).toBe(false) // RED
  })

  test('should increment quantity with +1 button', async ({ page }) => {
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    const initialValue = parseInt(await quantityInput.inputValue())

    await page.locator('button:has-text("+1")').tap()

    const newValue = parseInt(await quantityInput.inputValue())
    expect(newValue).toBe(initialValue + 1)

    expect(true).toBe(false) // RED
  })

  test('should show red border when quantity exceeds available', async ({ page }) => {
    const quantityInput = page.locator('[data-testid="quantity-input"]')

    // Enter huge quantity
    await page.locator('button[data-testid="clear-btn"]').tap()
    await page.locator('button:has-text("9")').tap()
    await page.locator('button:has-text("9")').tap()
    await page.locator('button:has-text("9")').tap()
    await page.locator('button:has-text("9")').tap()

    // Expected: Red border
    await expect(quantityInput).toHaveClass(/border-red|error|invalid/)

    expect(true).toBe(false) // RED
  })

  test('should disable Add to Box button when quantity exceeds available', async ({ page }) => {
    // Enter invalid quantity
    await page.locator('button[data-testid="clear-btn"]').tap()
    await page.locator('button:has-text("9")').tap()
    await page.locator('button:has-text("9")').tap()
    await page.locator('button:has-text("9")').tap()
    await page.locator('button:has-text("9")').tap()

    const addButton = page.locator('button:has-text("Add to Box")')
    await expect(addButton).toBeDisabled()

    expect(true).toBe(false) // RED
  })

  test('should proceed to Step 2 (box view) after Add to Box', async ({ page }) => {
    await page.locator('button:has-text("Add to Box")').tap()

    // Expected: Returns to Step 2 with updated box
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 2/, { timeout: 5000 })

    expect(true).toBe(false) // RED
  })

  test('should display number pad buttons >= 48px', async ({ page }) => {
    const buttons = page.locator('[data-testid="number-pad"] button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const boundingBox = await buttons.nth(i).boundingBox()
      expect(boundingBox?.width).toBeGreaterThanOrEqual(48)
      expect(boundingBox?.height).toBeGreaterThanOrEqual(48)
    }

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// STEP 5: CLOSE BOX
// ============================================================================

test.describe('E2E: Step 5 - Close Box', () => {
  test('should display weight entry modal when Close Box tapped', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()

    // Add item to box first
    await page.locator('button:has-text("Scan Item")').tap()
    await page.locator('[data-testid="barcode-input"]').fill('LP-2025-00001')
    await page.locator('[data-testid="barcode-input"]').press('Enter')
    await page.locator('button:has-text("Add to Box")').tap()

    // Now close box
    await page.locator('button:has-text("Close Box")').tap()

    // Expected: Weight modal visible
    await expect(page.locator('[data-testid="weight-entry-modal"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should allow closing box without weight (optional)', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()

    // Add item
    await page.locator('button:has-text("Scan Item")').tap()
    await page.locator('[data-testid="barcode-input"]').fill('LP-2025-00001')
    await page.locator('[data-testid="barcode-input"]').press('Enter')
    await page.locator('button:has-text("Add to Box")').tap()

    // Close without weight
    await page.locator('button:has-text("Close Box")').tap()
    await page.locator('button:has-text("Skip Weight")').tap()

    // Expected: Box closed successfully
    await expect(page.locator('[data-testid="success-message"]')).toContainText(/Box.*closed/i)

    expect(true).toBe(false) // RED
  })

  test('should close box with weight entry', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()

    // Add item
    await page.locator('button:has-text("Scan Item")').tap()
    await page.locator('[data-testid="barcode-input"]').fill('LP-2025-00001')
    await page.locator('[data-testid="barcode-input"]').press('Enter')
    await page.locator('button:has-text("Add to Box")').tap()

    // Close with weight
    await page.locator('button:has-text("Close Box")').tap()
    await page.locator('[data-testid="weight-input"]').fill('25.5')
    await page.locator('button:has-text("Confirm Close")').tap()

    // Expected: Success feedback
    await expect(page.locator('[data-testid="success-animation"]')).toBeVisible({ timeout: 2000 })

    expect(true).toBe(false) // RED
  })

  test('should prevent closing empty box', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()

    // Try to close empty box
    const closeButton = page.locator('button:has-text("Close Box")')

    // Expected: Button disabled or shows error
    const isDisabled = await closeButton.isDisabled()
    expect(isDisabled).toBe(true)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// STEP 6: COMPLETION
// ============================================================================

test.describe('E2E: Step 6 - Completion', () => {
  test('should display success screen after all boxes closed', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    // Note: This would require setting up a shipment with items and packing them
    // For now, placeholder test

    // Expected: Success screen visible
    // await expect(page.locator('[data-testid="completion-screen"]')).toBeVisible()
    // await expect(page.locator('[data-testid="success-checkmark"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should display shipment summary (boxes, weight)', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)

    // Expected: Summary visible
    // await expect(page.locator('[data-testid="total-boxes"]')).toBeVisible()
    // await expect(page.locator('[data-testid="total-weight"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('should allow starting new order from completion screen', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)

    // Expected: New Order button visible
    // await page.locator('button:has-text("New Order")').tap()
    // await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 1/)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// ALLERGEN WARNING
// ============================================================================

test.describe('E2E: Allergen Warning', () => {
  test('should display persistent yellow banner for allergen shipment', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)

    // Select allergen shipment
    await page.locator('[data-testid="shipment-row"]:has([data-testid="allergen-alert"])').first().tap()

    // Expected: Yellow banner visible
    const banner = page.locator('[data-testid="allergen-warning-banner"]')
    await expect(banner).toBeVisible()
    await expect(banner).toHaveClass(/yellow|amber/)

    expect(true).toBe(false) // RED
  })

  test('should require acknowledgment checkbox for allergen products', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)

    // Select allergen shipment and scan allergen product
    await page.locator('[data-testid="shipment-row"]:has([data-testid="allergen-alert"])').first().tap()
    await page.locator('button:has-text("Scan Item")').tap()
    await page.locator('[data-testid="barcode-input"]').fill('LP-ALLERGEN')
    await page.locator('[data-testid="barcode-input"]').press('Enter')

    // Expected: Acknowledgment checkbox visible
    const checkbox = page.locator('input[type="checkbox"][data-testid="allergen-acknowledge"]')
    await expect(checkbox).toBeVisible()

    // Add button disabled until acknowledged
    const addButton = page.locator('button:has-text("Add to Box")')
    await expect(addButton).toBeDisabled()

    // Check acknowledgment
    await checkbox.check()
    await expect(addButton).toBeEnabled()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AUDIO/HAPTIC/VISUAL FEEDBACK
// ============================================================================

test.describe('E2E: Feedback Systems', () => {
  test('should show green success animation on valid scan', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()
    await page.locator('button:has-text("Scan Item")').tap()

    await page.locator('[data-testid="barcode-input"]').fill('LP-2025-00001')
    await page.locator('[data-testid="barcode-input"]').press('Enter')

    // Expected: Green checkmark animation
    const successAnim = page.locator('[data-testid="success-animation"]')
    await expect(successAnim).toBeVisible({ timeout: 2000 })
    await expect(successAnim).toHaveClass(/green/)

    expect(true).toBe(false) // RED
  })

  test('should show red error animation on invalid scan', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)
    await page.locator('[data-testid="shipment-row"]').first().tap()
    await page.locator('button:has-text("Scan Item")').tap()

    await page.locator('[data-testid="barcode-input"]').fill('INVALID')
    await page.locator('[data-testid="barcode-input"]').press('Enter')

    // Expected: Red X animation
    const errorAnim = page.locator('[data-testid="error-animation"]')
    await expect(errorAnim).toBeVisible({ timeout: 2000 })
    await expect(errorAnim).toHaveClass(/red/)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// TOUCH TARGET COMPLIANCE
// ============================================================================

test.describe('E2E: Touch Target Compliance (WCAG)', () => {
  test('should have primary buttons >= 56px height', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)

    const primaryButtons = page.locator('button.primary, button[data-variant="primary"]')
    const count = await primaryButtons.count()

    for (let i = 0; i < count; i++) {
      const boundingBox = await primaryButtons.nth(i).boundingBox()
      expect(boundingBox?.height).toBeGreaterThanOrEqual(56)
    }

    expect(true).toBe(false) // RED
  })

  test('should have all interactive elements >= 48px', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)

    const interactiveElements = page.locator('button, a, input')
    const count = await interactiveElements.count()

    for (let i = 0; i < Math.min(count, 20); i++) {
      const el = interactiveElements.nth(i)
      if (await el.isVisible()) {
        const boundingBox = await el.boundingBox()
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(48)
          expect(boundingBox.height).toBeGreaterThanOrEqual(48)
        }
      }
    }

    expect(true).toBe(false) // RED
  })

  test('should have >= 8px spacing between touch targets', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)
    await navigateToPackScanner(page)

    // Note: Would need to check gap between adjacent buttons
    // This is a placeholder for actual spacing verification

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// HAPPY PATH: COMPLETE WORKFLOW
// ============================================================================

test.describe('E2E: Complete Happy Path Workflow', () => {
  test('Full workflow: Select -> Box -> Scan -> Qty -> Close -> Complete', async ({ page }) => {
    await loginAsUser(page, testPackerEmail, testPackerPassword)

    // Step 1: Navigate and select shipment
    await navigateToPackScanner(page)
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 1/)
    await page.locator('[data-testid="shipment-row"]').first().tap()

    // Step 2: Verify box created, proceed to scan
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 2/)
    await expect(page.locator('[data-testid="current-box-indicator"]')).toContainText(/Box 1/)
    await page.locator('button:has-text("Scan Item")').tap()

    // Step 3: Scan LP
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 3/)
    await page.locator('[data-testid="barcode-input"]').fill('LP-2025-00001')
    await page.locator('[data-testid="barcode-input"]').press('Enter')

    // Step 4: Confirm quantity
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 4/)
    await page.locator('button:has-text("Add to Box")').tap()

    // Back to Step 2, close box
    await expect(page.locator('[data-testid="step-progress"]')).toContainText(/Step 2/)
    await page.locator('button:has-text("Close Box")').tap()

    // Step 5: Weight entry
    await page.locator('button:has-text("Skip Weight")').tap()

    // Step 6: Complete
    // Note: May need to complete all required lines first
    // await page.locator('button:has-text("Complete Packing")').tap()
    // await expect(page.locator('[data-testid="completion-screen"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })
})

/**
 * Test Coverage Summary for Packing Scanner E2E (Story 07.12)
 * ===========================================================
 *
 * Step 1 - Select Shipment: 8 tests
 *   - Display pending shipments
 *   - Show shipment details
 *   - Allergen indicator
 *   - Sort by date
 *   - Select on tap
 *   - Scan SO barcode
 *   - Invalid barcode error
 *   - Touch target size
 *
 * Step 2 - Box Management: 6 tests
 *   - Auto-create first box
 *   - Display shipment header
 *   - Box contents summary
 *   - Create new box
 *   - Switch between boxes
 *   - Proceed to scan
 *
 * Step 3 - Scan LP: 8 tests
 *   - Auto-focus input
 *   - Instruction text
 *   - LP lookup and details
 *   - Success feedback
 *   - Error feedback
 *   - LP not allocated
 *   - Proceed to qty
 *   - Allergen warning
 *
 * Step 4 - Quantity Entry: 9 tests
 *   - Number pad display
 *   - Quick adjust buttons
 *   - Pre-fill quantity
 *   - Update on tap
 *   - Increment/decrement
 *   - Validation errors
 *   - Button disable
 *   - Proceed after add
 *   - Touch target size
 *
 * Step 5 - Close Box: 4 tests
 *   - Weight modal
 *   - Optional weight
 *   - Weight entry
 *   - Empty box prevention
 *
 * Step 6 - Completion: 3 tests
 *   - Success screen
 *   - Summary display
 *   - New order button
 *
 * Allergen Warning: 2 tests
 *   - Yellow banner
 *   - Acknowledgment checkbox
 *
 * Feedback Systems: 2 tests
 *   - Success animation
 *   - Error animation
 *
 * Touch Target Compliance: 3 tests
 *   - Primary buttons
 *   - All elements
 *   - Spacing
 *
 * Happy Path: 1 test
 *   - Complete workflow
 *
 * Total: 46 E2E tests
 * Viewport: 390x844 (iPhone 12)
 */
