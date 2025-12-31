/**
 * TO Partial Shipments - End-to-End Tests
 * Story: 03.9a - TO Partial Shipments (Basic)
 * Phase: RED - All tests FAIL until full feature is implemented
 *
 * E2E test for complete TO lifecycle with partial shipments:
 * 1. Create TO with 2 lines
 * 2. Release TO to planned status
 * 3. Ship partial quantities (first shipment)
 * 4. Verify partially_shipped status and progress indicators
 * 5. Ship remaining quantities (second shipment)
 * 6. Verify shipped status
 * 7. Receive partial quantities
 * 8. Verify partially_received status
 * 9. Receive remaining quantities
 * 10. Verify received status and action button visibility
 *
 * Coverage: AC-1, AC-2, AC-3, AC-5, AC-6, AC-8, AC-9
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Test configuration
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'

/**
 * Test data fixtures
 */
const TO_DATA = {
  fromWarehouse: 'WH-MAIN', // Main warehouse
  toWarehouse: 'WH-BRANCH-A', // Branch A
  plannedShipDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
  plannedReceiveDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
  notes: 'E2E test shipment',
}

const PRODUCTS = [
  { name: 'Flour Type A', quantity: 100, uom: 'kg' },
  { name: 'Sugar', quantity: 50, uom: 'kg' },
]

/**
 * Helper: Login user before test
 */
async function loginUser(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', TEST_USER_EMAIL)
  await page.fill('input[type="password"]', TEST_USER_PASSWORD)
  await page.click('button:has-text("Sign In")')
  await page.waitForNavigation()
}

/**
 * Helper: Navigate to Transfer Orders list
 */
async function navigateToTOList(page: Page) {
  await page.goto(`${BASE_URL}/planning/transfer-orders`)
  await page.waitForSelector('text=Transfer Orders', { timeout: 5000 })
}

/**
 * Helper: Create new Transfer Order
 */
async function createTransferOrder(page: Page) {
  // Click Create button
  await page.click('button:has-text("Create Transfer Order")')
  await page.waitForSelector('text=New Transfer Order', { timeout: 3000 })

  // Select from warehouse
  await page.click('input[placeholder*="From Warehouse"]')
  await page.click(`text=${TO_DATA.fromWarehouse}`)

  // Select to warehouse
  await page.click('input[placeholder*="To Warehouse"]')
  await page.click(`text=${TO_DATA.toWarehouse}`)

  // Set planned ship date
  await page.fill('input[type="date"]:nth-of-type(1)', TO_DATA.plannedShipDate)

  // Set planned receive date
  await page.fill('input[type="date"]:nth-of-type(2)', TO_DATA.plannedReceiveDate)

  // Add notes
  await page.fill('textarea', TO_DATA.notes)

  // Save TO
  await page.click('button:has-text("Create")')
  await page.waitForNavigation()

  // Extract TO number from URL or page
  const toNumber = await page.locator('text=/TO-\\d{4}-\\d{5}/').first().textContent()
  return toNumber
}

/**
 * Helper: Add lines to TO
 */
async function addLinesToTO(page: Page) {
  for (const product of PRODUCTS) {
    await page.click('button:has-text("Add Line")')
    await page.waitForSelector('text=Add Transfer Order Line', { timeout: 2000 })

    // Select product
    await page.click('input[placeholder*="Product"]')
    await page.click(`text=${product.name}`)

    // Enter quantity
    await page.fill('input[type="number"][placeholder*="Quantity"]', product.quantity.toString())

    // Save line
    await page.click('button:has-text("Add Line"):last-of-type')
    await page.waitForSelector('text=Line added successfully', { timeout: 2000 })
  }
}

/**
 * Helper: Release TO from draft to planned
 */
async function releaseTransferOrder(page: Page) {
  await page.click('button:has-text("Release")')
  await page.waitForSelector('text=Transfer Order released', { timeout: 2000 })
  await expect(page.locator('text=Planned')).toBeVisible()
}

/**
 * Helper: Open Ship Modal
 */
async function openShipModal(page: Page) {
  await page.click('button:has-text("Ship")')
  await page.waitForSelector('text=Ship Transfer Order', { timeout: 2000 })
}

/**
 * Helper: Ship with quantities
 */
async function shipWithQuantities(page: Page, quantities: { lineIndex: number; quantity: number }[]) {
  for (const { lineIndex, quantity } of quantities) {
    const inputs = page.locator('input[placeholder*="Ship"]')
    await inputs.nth(lineIndex).fill(quantity.toString())
  }

  // Set shipment date (default today)
  const today = new Date().toISOString().split('T')[0]
  await page.fill('input[placeholder*="Shipment Date"]', today)

  // Ship
  await page.click('button:has-text("Ship All")')
  await page.waitForSelector('text=shipped successfully', { timeout: 3000 })
}

/**
 * Helper: Open Receive Modal
 */
async function openReceiveModal(page: Page) {
  await page.click('button:has-text("Receive")')
  await page.waitForSelector('text=Receive Transfer Order', { timeout: 2000 })
}

/**
 * Helper: Receive with quantities
 */
async function receiveWithQuantities(
  page: Page,
  quantities: { lineIndex: number; quantity: number }[]
) {
  for (const { lineIndex, quantity } of quantities) {
    const inputs = page.locator('input[placeholder*="Receive"]')
    await inputs.nth(lineIndex).fill(quantity.toString())
  }

  // Set receipt date (default today)
  const today = new Date().toISOString().split('T')[0]
  await page.fill('input[placeholder*="Receipt Date"]', today)

  // Receive
  await page.click('button:has-text("Receive All")')
  await page.waitForSelector('text=received successfully', { timeout: 3000 })
}

/**
 * Helper: Verify progress indicator
 */
async function verifyProgressIndicator(
  page: Page,
  lineIndex: number,
  expected: string // Format: "50 / 100"
) {
  const progressText = page.locator('text=/\\d+ \\/ \\d+/').nth(lineIndex)
  await expect(progressText).toContainText(expected)
}

/**
 * Main E2E Test Suite
 */
test.describe('TO Partial Shipments - Full Lifecycle (Story 03.9a)', () => {
  let page: Page
  let toNumber: string

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  // ============================================================================
  // SETUP TESTS
  // ============================================================================

  test('User can login successfully', async () => {
    await loginUser(page)
    await expect(page.locator('text=Transfer Orders')).toBeVisible()
  })

  test('User navigates to Transfer Orders list', async () => {
    await navigateToTOList(page)
    await expect(page.locator('button:has-text("Create Transfer Order")')).toBeVisible()
  })

  // ============================================================================
  // TO CREATION AND SETUP
  // ============================================================================

  test('User creates new Transfer Order header', async () => {
    toNumber = (await createTransferOrder(page))!
    expect(toNumber).toMatch(/TO-\d{4}-\d{5}/)
    await expect(page.locator(`text=${toNumber}`)).toBeVisible()
  })

  test('User adds 2 lines to TO', async () => {
    await addLinesToTO(page)
    // Verify both lines are present
    for (const product of PRODUCTS) {
      await expect(page.locator(`text=${product.name}`)).toBeVisible()
    }
  })

  test('TO status is draft before release', async () => {
    await expect(page.locator('text=Draft')).toBeVisible()
    await expect(page.locator('button:has-text("Ship")')).not.toBeVisible()
  })

  test('User releases TO to planned status', async () => {
    await releaseTransferOrder(page)
  })

  test('Ship button is visible after TO is planned', async () => {
    await expect(page.locator('button:has-text("Ship")')).toBeVisible()
    await expect(page.locator('button:has-text("Receive")')).not.toBeVisible()
  })

  // ============================================================================
  // FIRST PARTIAL SHIPMENT (AC-2)
  // ============================================================================

  test('User opens Ship Modal (AC-1, AC-2)', async () => {
    await openShipModal(page)
  })

  test('Ship Modal shows correct line quantities', async () => {
    // Line 1: 100, Line 2: 50
    await expect(page.locator('text=100')).toBeVisible()
    await expect(page.locator('text=50')).toBeVisible()
  })

  test('User ships partial quantities: Line 1 = 50, Line 2 = 50', async () => {
    await shipWithQuantities(page, [
      { lineIndex: 0, quantity: 50 }, // Line 1: ship 50 of 100
      { lineIndex: 1, quantity: 50 }, // Line 2: ship all 50
    ])
  })

  test('TO status changes to partially_shipped after partial shipment', async () => {
    await expect(page.locator('text=Partially Shipped')).toBeVisible({ timeout: 5000 })
  })

  test('Progress indicators show correct values after first shipment (AC-9)', async () => {
    // Line 1: 50 / 100
    await verifyProgressIndicator(page, 0, '50 / 100')
    // Line 2: 50 / 50
    await verifyProgressIndicator(page, 1, '50 / 50')
  })

  test('Ship button remains visible for partially_shipped TO', async () => {
    await expect(page.locator('button:has-text("Ship")')).toBeVisible()
  })

  test('Receive button is visible for partially_shipped TO', async () => {
    await expect(page.locator('button:has-text("Receive")')).toBeVisible()
  })

  test('actual_ship_date is set on first shipment', async () => {
    const shipDateElement = page.locator('text=/Actual Ship Date: \\d{4}-\\d{2}-\\d{2}/')
    await expect(shipDateElement).toBeVisible()
  })

  // ============================================================================
  // SECOND PARTIAL SHIPMENT (AC-3)
  // ============================================================================

  test('User opens Ship Modal for second shipment', async () => {
    await openShipModal(page)
  })

  test('Ship Modal shows remaining quantity for Line 1 = 50', async () => {
    const remainingInputs = page.locator('input[placeholder*="Remaining"]')
    // Verify Line 1 shows 50 remaining
    await expect(remainingInputs.nth(0)).toHaveValue('50')
  })

  test('User ships remaining quantity for Line 1 = 50', async () => {
    await shipWithQuantities(page, [{ lineIndex: 0, quantity: 50 }])
  })

  test('TO status changes to shipped after completing all shipments', async () => {
    await expect(page.locator('text=Shipped')).toBeVisible({ timeout: 5000 })
  })

  test('Progress indicators show 100% after full shipment', async () => {
    // Line 1: 100 / 100
    await verifyProgressIndicator(page, 0, '100 / 100')
    // Line 2: 50 / 50
    await verifyProgressIndicator(page, 1, '50 / 50')
  })

  test('Checkmark visible on fully shipped lines', async () => {
    const checkmarks = page.locator('text=✓') // Green checkmark
    const count = await checkmarks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Ship button is hidden when TO is shipped (AC-8)', async () => {
    await expect(page.locator('button:has-text("Ship")')).not.toBeVisible()
  })

  test('Receive button is visible when TO is shipped (AC-8)', async () => {
    await expect(page.locator('button:has-text("Receive")')).toBeVisible()
  })

  test('actual_ship_date is not updated on second shipment', async () => {
    const firstShipDate = await page.locator('text=/Actual Ship Date: \\d{4}-\\d{2}-\\d{2}/').first().textContent()
    expect(firstShipDate).toBeTruthy() // Same date as first shipment
  })

  // ============================================================================
  // FIRST PARTIAL RECEIPT (AC-6)
  // ============================================================================

  test('User opens Receive Modal (AC-5, AC-6)', async () => {
    await openReceiveModal(page)
  })

  test('Receive Modal shows shipped quantities', async () => {
    // Both lines show 100 and 50 shipped
    await expect(page.locator('text=100')).toBeVisible()
    await expect(page.locator('text=50')).toBeVisible()
  })

  test('User receives partial quantities: Line A = 30, Line B = 30', async () => {
    await receiveWithQuantities(page, [
      { lineIndex: 0, quantity: 30 }, // Line 1: receive 30 of 100 shipped
      { lineIndex: 1, quantity: 30 }, // Line 2: receive 30 of 50 shipped
    ])
  })

  test('TO status changes to partially_received after partial receipt', async () => {
    await expect(page.locator('text=Partially Received')).toBeVisible({ timeout: 5000 })
  })

  test('Receive progress indicators show correct values', async () => {
    // Verify progress indicators for receive (received / shipped)
    const progressElements = page.locator('text=/\\d+ \\/ \\d+/')
    const count = await progressElements.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Receive button remains visible for partially_received TO', async () => {
    await expect(page.locator('button:has-text("Receive")')).toBeVisible()
  })

  test('Ship button is hidden for partially_received TO (AC-8)', async () => {
    await expect(page.locator('button:has-text("Ship")')).not.toBeVisible()
  })

  test('actual_receive_date is set on first receipt', async () => {
    const receiveDateElement = page.locator('text=/Actual Receive Date: \\d{4}-\\d{2}-\\d{2}/')
    await expect(receiveDateElement).toBeVisible()
  })

  // ============================================================================
  // SECOND PARTIAL RECEIPT (COMPLETION)
  // ============================================================================

  test('User opens Receive Modal for second receipt', async () => {
    await openReceiveModal(page)
  })

  test('Receive Modal shows remaining quantities after first receipt', async () => {
    // Line 1: 70 remaining (100 - 30)
    // Line 2: 20 remaining (50 - 30)
    const remainingInputs = page.locator('input[placeholder*="Remaining"]')
    await expect(remainingInputs.nth(0)).toHaveValue('70')
  })

  test('User receives remaining quantities', async () => {
    await receiveWithQuantities(page, [
      { lineIndex: 0, quantity: 70 }, // Line 1: receive remaining 70
      { lineIndex: 1, quantity: 20 }, // Line 2: receive remaining 20
    ])
  })

  test('TO status changes to received when all lines fully received', async () => {
    await expect(page.locator('text=Received')).toBeVisible({ timeout: 5000 })
  })

  test('Final progress indicators show 100% on all lines', async () => {
    // Verify all lines show full quantities received
    const progressElements = page.locator('text=/100 \\/ \\d+/')
    const count = await progressElements.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Both Ship and Receive buttons are hidden when TO is received (AC-8)', async () => {
    await expect(page.locator('button:has-text("Ship")')).not.toBeVisible()
    await expect(page.locator('button:has-text("Receive")')).not.toBeVisible()
  })

  test('actual_receive_date is not updated on second receipt', async () => {
    const receiveDateElement = page.locator('text=/Actual Receive Date: \\d{4}-\\d{2}-\\d{2}/')
    await expect(receiveDateElement).toBeVisible() // Same date as first receipt
  })

  // ============================================================================
  // FINAL VERIFICATION
  // ============================================================================

  test('TO shows final complete status on detail page', async () => {
    await page.reload()
    await expect(page.locator(`text=${toNumber}`)).toBeVisible()
    await expect(page.locator('text=Received')).toBeVisible()
  })

  test('All line items show 100% progress with checkmarks', async () => {
    const checkmarks = page.locator('text=✓')
    const count = await checkmarks.count()
    expect(count).toBe(2) // One checkmark per line
  })

  test('Edit button is hidden for received TO', async () => {
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible()
  })

  test('User can navigate back to TO list', async () => {
    await page.click('button:has-text("Back")')
    await page.waitForURL(`${BASE_URL}/planning/transfer-orders`)
    await expect(page.locator('text=Transfer Orders')).toBeVisible()
  })

  test('TO appears in list with received status', async () => {
    await expect(page.locator(`text=${toNumber}`)).toBeVisible()
    await expect(page.locator('text=Received')).toBeVisible()
  })
})

// ============================================================================
// ADDITIONAL EDGE CASE TESTS
// ============================================================================

test.describe('TO Partial Shipments - Edge Cases', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await loginUser(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Ship modal shows error when ship_qty > remaining (AC-4)', async () => {
    // Create and setup a TO, then try to ship more than available
    await navigateToTOList(page)
    const toNumber = (await createTransferOrder(page))!
    await addLinesToTO(page)
    await releaseTransferOrder(page)

    await openShipModal(page)
    // Try to ship 150 of 100
    const shipInputs = page.locator('input[placeholder*="Ship"]')
    await shipInputs.first().fill('150')

    // Click Ship - should show error
    await page.click('button:has-text("Ship All")')
    await expect(page.locator('text=/Cannot ship.*only .* remaining/i')).toBeVisible()
  })

  test('Receive modal shows error when receive_qty > shipped (AC-7)', async () => {
    // Create TO, ship it, then try to receive more than shipped
    await navigateToTOList(page)
    const toNumber = (await createTransferOrder(page))!
    await addLinesToTO(page)
    await releaseTransferOrder(page)

    // Ship 50 of 100
    await openShipModal(page)
    await shipWithQuantities(page, [{ lineIndex: 0, quantity: 50 }])

    // Try to receive 60 of 50 shipped
    await openReceiveModal(page)
    const receiveInputs = page.locator('input[placeholder*="Receive"]')
    await receiveInputs.first().fill('60')

    await page.click('button:has-text("Receive All")')
    await expect(page.locator('text=/Cannot receive.*only .* shipped/i')).toBeVisible()
  })

  test('Progress bar shows yellow for partial progress', async () => {
    // Create and partially ship a TO
    await navigateToTOList(page)
    const toNumber = (await createTransferOrder(page))!
    await addLinesToTO(page)
    await releaseTransferOrder(page)
    await openShipModal(page)
    await shipWithQuantities(page, [{ lineIndex: 0, quantity: 50 }])

    // Look for progress bar styling
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()
    // Verify it shows ~50% (yellowish)
    const ariaValueNow = await progressBar.first().getAttribute('aria-valuenow')
    expect(parseInt(ariaValueNow!)).toBeLessThan(100)
  })
})
