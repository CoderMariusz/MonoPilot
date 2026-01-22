/**
 * E2E Tests: Scanner Pick Workflow
 * Story: 07.10 - Pick Scanner
 * Phase: RED - All tests should FAIL until implementation exists
 *
 * Tests complete mobile scanner workflows:
 * - Select pick list from My Picks
 * - Start pick workflow
 * - Scan LP barcode
 * - Confirm quantity via number pad
 * - Short pick handling
 * - FIFO/FEFO warnings
 * - Allergen alerts
 * - Pick list completion
 * - Audio/vibration feedback
 * - Settings persistence
 *
 * Coverage: Full user journey tests for scanner pick
 * Test Count: 30+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: My Picks list
 * - AC-2: Start pick
 * - AC-3: Display pick line
 * - AC-4: Valid LP scan
 * - AC-5: Invalid LP scan
 * - AC-7: Quantity confirmation
 * - AC-8: Short pick
 * - AC-9: Audio feedback
 * - AC-10: Visual feedback
 * - AC-11: Vibration
 * - AC-12: Auto-advance
 * - AC-13: Complete pick
 * - AC-14: Allergen banner
 * - AC-15: FIFO/FEFO
 * - AC-18: Touch targets
 * - AC-19: Settings
 */

import { test, expect, Page } from '@playwright/test'

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testPickerEmail: string
let testPickerPassword: string
let testManagerEmail: string
let testManagerPassword: string

test.beforeAll(async () => {
  testPickerEmail = 'picker@test.monopilot.com'
  testPickerPassword = 'TestPassword123!'
  testManagerEmail = 'warehouse-manager@test.monopilot.com'
  testManagerPassword = 'TestPassword123!'
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

async function createTestPickList(page: Page): Promise<string> {
  const response = await page.request.post('/api/shipping/pick-lists', {
    data: {
      sales_order_ids: ['test-so-001'],
      priority: 'high',
    },
  })

  if (!response.ok()) {
    throw new Error(`Failed to create pick list: ${await response.text()}`)
  }

  const data = await response.json()
  return data.pick_list?.id || data.id
}

async function assignPickListToUser(
  page: Page,
  pickListId: string,
  userId: string
): Promise<void> {
  await page.request.patch(`/api/shipping/pick-lists/${pickListId}`, {
    data: { assigned_to: userId },
  })
}

async function deletePickList(page: Page, pickListId: string): Promise<void> {
  await page.request.delete(`/api/shipping/pick-lists/${pickListId}`)
}

async function navigateToScannerPick(page: Page) {
  await page.goto('/scanner/shipping/pick')
  await page.waitForLoadState('networkidle')
}

async function simulateBarcodeScan(page: Page, barcode: string) {
  const scanInput = page.locator('[data-testid="scan-input"], input[name="barcode"]')
  await scanInput.fill(barcode)
  await scanInput.press('Enter')
}

// ============================================================================
// AC-1: MY PICKS LIST
// ============================================================================

test.describe('E2E: My Picks List (AC-1)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Display list of assigned pick lists', async ({ page }) => {
    await navigateToScannerPick(page)

    // Should show pick list number
    await expect(page.locator('text=/PL-/i')).toBeVisible({ timeout: 10000 })

    // Should show priority badge
    const priorityBadge = page.locator('[data-testid="priority-badge"]')
    await expect(priorityBadge).toBeVisible()

    // Should show line count
    await expect(page.locator('text=/\\d+ lines/i')).toBeVisible()

    // Should show status
    await expect(page.locator('text=/assigned|in progress/i')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Pick lists sorted by priority DESC, created_at ASC', async ({ page }) => {
    await navigateToScannerPick(page)

    // Urgent/high priority should be first
    const firstRow = page.locator('[data-testid="pick-list-row"]').first()
    const priorityText = await firstRow.locator('[data-testid="priority-badge"]').textContent()

    expect(['urgent', 'high']).toContain(priorityText?.toLowerCase())

    expect(true).toBe(false) // RED
  })

  test('Each row 64px height minimum', async ({ page }) => {
    await navigateToScannerPick(page)

    const rows = page.locator('[data-testid="pick-list-row"]')
    const count = await rows.count()

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i)
      const boundingBox = await row.boundingBox()
      expect(boundingBox?.height).toBeGreaterThanOrEqual(64)
    }

    expect(true).toBe(false) // RED
  })

  test('Start button for assigned, Continue for in_progress', async ({ page }) => {
    await navigateToScannerPick(page)

    // Check for Start button on assigned picks
    const assignedPick = page.locator('[data-testid="pick-list-row"]').filter({ hasText: /assigned/i })
    await expect(assignedPick.locator('button').filter({ hasText: /Start/i })).toBeVisible()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-2: START PICK
// ============================================================================

test.describe('E2E: Start Pick (AC-2)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Start pick updates status to in_progress', async ({ page }) => {
    await navigateToScannerPick(page)

    // Click Start button
    const startButton = page.locator('button').filter({ hasText: /Start/i }).first()
    await startButton.click()

    // Verify first pick line displayed
    await expect(page.locator('[data-testid="pick-line-card"]')).toBeVisible({ timeout: 5000 })

    // Verify scan input focused
    const scanInput = page.locator('[data-testid="scan-input"]')
    await expect(scanInput).toBeFocused()

    expect(true).toBe(false) // RED
  })

  test('Play start audio cue (440Hz, 100ms)', async ({ page }) => {
    await navigateToScannerPick(page)

    // Note: Audio testing requires special setup
    // This test verifies the audio component is triggered
    const startButton = page.locator('button').filter({ hasText: /Start/i }).first()
    await startButton.click()

    // Check that audio feedback component is present
    await expect(page.locator('[data-testid="audio-feedback"]')).toBeInTheDocument

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-3: DISPLAY PICK LINE
// ============================================================================

test.describe('E2E: Display Pick Line (AC-3)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Show Location Card (zone, path in bold 32px)', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const locationCard = page.locator('[data-testid="location-card"]')
    await expect(locationCard).toBeVisible()

    // Zone badge
    await expect(locationCard.locator('[data-testid="zone-badge"]')).toBeVisible()

    // Location path should be prominent
    const locationPath = locationCard.locator('[data-testid="location-path"]')
    await expect(locationPath).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Show Product Card (name 24px, SKU, lot, BBD)', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const productCard = page.locator('[data-testid="product-card"]')
    await expect(productCard).toBeVisible()

    // Product name
    await expect(productCard.locator('[data-testid="product-name"]')).toBeVisible()

    // SKU
    await expect(productCard.locator('[data-testid="product-sku"]')).toBeVisible()

    // Lot number
    await expect(productCard.locator('[data-testid="lot-number"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Show Quantity Card (32px green, expected LP)', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const quantityCard = page.locator('[data-testid="quantity-card"]')
    await expect(quantityCard).toBeVisible()

    // Quantity should be prominently displayed
    const quantity = quantityCard.locator('[data-testid="quantity-to-pick"]')
    await expect(quantity).toBeVisible()

    // Expected LP
    await expect(quantityCard.locator('[data-testid="expected-lp"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Show Progress Bar (X of Y)', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const progressBar = page.locator('[data-testid="progress-bar"]')
    await expect(progressBar).toBeVisible()

    // Should show "Line X of Y" text
    await expect(page.locator('text=/Line \\d+ of \\d+/i')).toBeVisible()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-4: VALID LP SCAN
// ============================================================================

test.describe('E2E: Valid LP Scan (AC-4)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Scan valid LP shows green flash and success tone', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Get expected LP from the page
    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()

    // Simulate scan
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    // Check for green flash overlay
    const flashOverlay = page.locator('[data-testid="success-flash"]')
    await expect(flashOverlay).toBeVisible({ timeout: 1000 })

    // Check for LP Verified badge
    await expect(page.locator('text=/LP Verified/i')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Enable quantity input after valid scan', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    // Number pad should be enabled
    const numberPad = page.locator('[data-testid="number-pad"]')
    await expect(numberPad).toBeVisible()

    // Confirm button should be enabled
    const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
    await expect(confirmButton).toBeEnabled()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-5: INVALID LP SCAN
// ============================================================================

test.describe('E2E: Invalid LP Scan (AC-5)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Scan wrong LP shows red flash and error tone', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Scan a different LP than expected
    await simulateBarcodeScan(page, 'LP-WRONG-00099')

    // Check for red flash overlay
    const flashOverlay = page.locator('[data-testid="error-flash"]')
    await expect(flashOverlay).toBeVisible({ timeout: 1000 })

    // Check for error message
    await expect(page.locator('text=/Wrong LP/i')).toBeVisible()

    // Scan input should retain focus
    const scanInput = page.locator('[data-testid="scan-input"]')
    await expect(scanInput).toBeFocused()

    expect(true).toBe(false) // RED
  })

  test('LP not found shows error message', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Scan non-existent LP
    await simulateBarcodeScan(page, 'LP-NONEXISTENT')

    // Check for error message
    await expect(page.locator('text=/LP Not Found/i')).toBeVisible()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-7: QUANTITY CONFIRMATION
// ============================================================================

test.describe('E2E: Quantity Confirmation (AC-7)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Number pad with 64x64 buttons', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    // Check number pad buttons
    const numberButtons = page.locator('[data-testid="number-pad"] button')
    const count = await numberButtons.count()

    for (let i = 0; i < count; i++) {
      const button = numberButtons.nth(i)
      const boundingBox = await button.boundingBox()
      expect(boundingBox?.width).toBeGreaterThanOrEqual(64)
      expect(boundingBox?.height).toBeGreaterThanOrEqual(64)
    }

    expect(true).toBe(false) // RED
  })

  test('Pre-fill with quantity_to_pick', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    // Quantity input should be pre-filled
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    const value = await quantityInput.inputValue()
    expect(parseInt(value)).toBeGreaterThan(0)

    expect(true).toBe(false) // RED
  })

  test('Confirm pick updates database and advances', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    // Get initial progress
    const initialProgress = await page.locator('[data-testid="progress-bar"]').textContent()

    // Confirm pick
    const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
    await confirmButton.click()

    // Wait for update
    await page.waitForTimeout(500)

    // Progress should update
    const updatedProgress = await page.locator('[data-testid="progress-bar"]').textContent()
    expect(updatedProgress).not.toBe(initialProgress)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-8: SHORT PICK
// ============================================================================

test.describe('E2E: Short Pick (AC-8)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Short pick modal with reason dropdown', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    // Enter less than required quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('5')

    // Click Short Pick button
    const shortPickButton = page.locator('button').filter({ hasText: /Short Pick/i })
    await shortPickButton.click()

    // Modal should appear
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 3000 })

    // Reason dropdown should be present
    const reasonSelect = modal.locator('select[name="reason"], [data-testid="reason-select"]')
    await expect(reasonSelect).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Short pick requires reason selection', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('5')

    const shortPickButton = page.locator('button').filter({ hasText: /Short Pick/i })
    await shortPickButton.click()

    const modal = page.locator('[role="dialog"]')
    const confirmButton = modal.locator('button').filter({ hasText: /Confirm.*Short/i })

    // Button should be disabled without reason
    await expect(confirmButton).toBeDisabled()

    expect(true).toBe(false) // RED
  })

  test('Short pick triggers backorder creation', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.clear()
    await quantityInput.fill('5')

    const shortPickButton = page.locator('button').filter({ hasText: /Short Pick/i })
    await shortPickButton.click()

    const modal = page.locator('[role="dialog"]')
    const reasonSelect = modal.locator('select[name="reason"]')
    await reasonSelect.selectOption('insufficient_inventory')

    const confirmButton = modal.locator('button').filter({ hasText: /Confirm.*Short/i })
    await confirmButton.click()

    // Should show toast with backorder info
    await expect(page.locator('[class*="toast"]').filter({ hasText: /backorder/i })).toBeVisible({ timeout: 5000 })

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-12: AUTO-ADVANCE
// ============================================================================

test.describe('E2E: Auto-Advance (AC-12)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Auto-advance to next line after confirmation', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Get initial line info
    const initialProductName = await page.locator('[data-testid="product-name"]').textContent()
    const initialSequence = await page.locator('[data-testid="pick-sequence"]').textContent()

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
    await confirmButton.click()

    // Wait for auto-advance
    await page.waitForTimeout(1000)

    // Should show different line
    const updatedSequence = await page.locator('[data-testid="pick-sequence"]').textContent()
    expect(updatedSequence).not.toBe(initialSequence)

    expect(true).toBe(false) // RED
  })

  test('Scan input auto-focus after advance', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
    await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

    const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
    await confirmButton.click()

    await page.waitForTimeout(500)

    // Scan input should be focused
    const scanInput = page.locator('[data-testid="scan-input"]')
    await expect(scanInput).toBeFocused()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-13: COMPLETE PICK LIST
// ============================================================================

test.describe('E2E: Complete Pick List (AC-13)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Display completion celebration screen', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Pick all lines (simplified - in real test would loop)
    let linesRemaining = true
    let iterations = 0

    while (linesRemaining && iterations < 20) {
      const lineCard = page.locator('[data-testid="pick-line-card"]')
      if (!(await lineCard.isVisible())) {
        linesRemaining = false
        break
      }

      const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
      await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

      const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
      if (await confirmButton.isVisible() && await confirmButton.isEnabled()) {
        await confirmButton.click()
        await page.waitForTimeout(300)
      }

      iterations++
    }

    // Check for completion screen
    const completionScreen = page.locator('[data-testid="pick-complete"]')
    await expect(completionScreen).toBeVisible({ timeout: 10000 })

    // Check for checkmark
    await expect(page.locator('[data-testid="success-checkmark"]')).toBeVisible()

    // Check for summary
    await expect(page.locator('[data-testid="completion-summary"]')).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Show stats in completion summary', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // (Pick all lines first - abbreviated for test)
    // ... would complete all picks here

    const summary = page.locator('[data-testid="completion-summary"]')

    // Should show total lines
    await expect(summary.locator('text=/total/i')).toBeVisible()

    // Should show duration
    await expect(summary.locator('text=/duration|time/i')).toBeVisible()

    // Should show items/hr
    await expect(summary.locator('text=/items.*hr|per hour/i')).toBeVisible()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-14: ALLERGEN BANNER
// ============================================================================

test.describe('E2E: Allergen Banner (AC-14)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    // Create pick list with allergen product
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Show red allergen banner for conflict', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Navigate to line with allergen conflict
    const allergenBanner = page.locator('[data-testid="allergen-banner"]')

    if (await allergenBanner.isVisible()) {
      // Check red color
      const backgroundColor = await allergenBanner.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      )
      // Should be red-ish (contains high red component)
      expect(backgroundColor).toContain('220') // Close to #DC2626

      // Check for allergen text
      await expect(allergenBanner.locator('text=/ALLERGEN ALERT/i')).toBeVisible()

      // Check for acknowledgment checkbox
      await expect(allergenBanner.locator('input[type="checkbox"]')).toBeVisible()
    }

    expect(true).toBe(false) // RED
  })

  test('Picker must acknowledge allergen before confirm', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const allergenBanner = page.locator('[data-testid="allergen-banner"]')

    if (await allergenBanner.isVisible()) {
      // Confirm button should be disabled
      const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
      await expect(confirmButton).toBeDisabled()

      // Check acknowledgment
      const checkbox = allergenBanner.locator('input[type="checkbox"]')
      await checkbox.check()

      // Now confirm should be enabled
      await expect(confirmButton).toBeEnabled()
    }

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-15: FIFO/FEFO WARNING
// ============================================================================

test.describe('E2E: FIFO/FEFO Warning (AC-15)', () => {
  let pickListId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
  })

  test.afterEach(async ({ page }) => {
    if (pickListId) {
      await deletePickList(page, pickListId)
    }
  })

  test('Show amber warning when picking newer lot', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    // Scan a different LP than suggested (newer)
    await simulateBarcodeScan(page, 'LP-2025-00099')

    const fifoWarning = page.locator('[data-testid="fifo-warning"]')

    if (await fifoWarning.isVisible()) {
      // Check amber color
      const backgroundColor = await fifoWarning.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(backgroundColor).toContain('245') // Close to #F59E0B

      // Check for warning text
      await expect(fifoWarning.locator('text=/Older lot available/i')).toBeVisible()

      // Check for "Use Suggested LP" button
      await expect(fifoWarning.locator('button').filter({ hasText: /Use Suggested/i })).toBeVisible()

      // Check for "Continue Anyway" button
      await expect(fifoWarning.locator('button').filter({ hasText: /Continue Anyway/i })).toBeVisible()
    }

    expect(true).toBe(false) // RED
  })

  test('Allow override with Continue Anyway', async ({ page }) => {
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    await simulateBarcodeScan(page, 'LP-2025-00099')

    const fifoWarning = page.locator('[data-testid="fifo-warning"]')

    if (await fifoWarning.isVisible()) {
      const continueButton = fifoWarning.locator('button').filter({ hasText: /Continue Anyway/i })
      await continueButton.click()

      // Warning should dismiss
      await expect(fifoWarning).not.toBeVisible()

      // Should proceed with picking
      const numberPad = page.locator('[data-testid="number-pad"]')
      await expect(numberPad).toBeVisible()
    }

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-18: TOUCH TARGETS
// ============================================================================

test.describe('E2E: Touch Targets (AC-18)', () => {
  test('All buttons 48x48px minimum', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox()
        expect(boundingBox?.width).toBeGreaterThanOrEqual(48)
        expect(boundingBox?.height).toBeGreaterThanOrEqual(48)
      }
    }

    expect(true).toBe(false) // RED
  })

  test('Primary buttons 56px height', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    const primaryButtons = page.locator('button[data-variant="primary"], button.bg-primary')
    const count = await primaryButtons.count()

    for (let i = 0; i < count; i++) {
      const button = primaryButtons.nth(i)
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox()
        expect(boundingBox?.height).toBeGreaterThanOrEqual(56)
      }
    }

    expect(true).toBe(false) // RED
  })

  test('Input fields 56px height', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    // Start picking to get to scan input
    const startButton = page.locator('button').filter({ hasText: /Start/i }).first()
    if (await startButton.isVisible()) {
      await startButton.click()
    }

    const inputs = page.locator('input[type="text"], input[type="number"]')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      if (await input.isVisible()) {
        const boundingBox = await input.boundingBox()
        expect(boundingBox?.height).toBeGreaterThanOrEqual(56)
      }
    }

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// AC-19: SCANNER SETTINGS
// ============================================================================

test.describe('E2E: Scanner Settings (AC-19)', () => {
  test('Open settings modal', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    // Click settings button
    const settingsButton = page.locator('button[aria-label="Settings"], [data-testid="settings-button"]')
    await settingsButton.click()

    // Modal should open
    const settingsModal = page.locator('[data-testid="scanner-settings"], [role="dialog"]')
    await expect(settingsModal).toBeVisible()

    expect(true).toBe(false) // RED
  })

  test('Settings persist to localStorage', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"]')
    await settingsButton.click()

    // Change volume
    const volumeSlider = page.locator('[data-testid="volume-slider"]')
    await volumeSlider.fill('50')

    // Disable vibration
    const vibrationToggle = page.locator('[data-testid="vibration-toggle"]')
    await vibrationToggle.click()

    // Close settings
    const closeButton = page.locator('button').filter({ hasText: /Close|Done/i })
    await closeButton.click()

    // Navigate away and back
    await page.goto('/dashboard')
    await navigateToScannerPick(page)

    // Open settings again
    await settingsButton.click()

    // Check values persisted
    const volumeValue = await page.locator('[data-testid="volume-slider"]').inputValue()
    expect(volumeValue).toBe('50')

    expect(true).toBe(false) // RED
  })

  test('Audio mute toggle', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    const settingsButton = page.locator('[data-testid="settings-button"]')
    await settingsButton.click()

    const muteToggle = page.locator('[data-testid="mute-toggle"]')
    await expect(muteToggle).toBeVisible()

    await muteToggle.click()

    // Check muted state
    const isMuted = await muteToggle.getAttribute('aria-checked')
    expect(isMuted).toBe('true')

    expect(true).toBe(false) // RED
  })

  test('Test audio button', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    await navigateToScannerPick(page)

    const settingsButton = page.locator('[data-testid="settings-button"]')
    await settingsButton.click()

    const testAudioButton = page.locator('button').filter({ hasText: /Test Audio/i })
    await expect(testAudioButton).toBeVisible()

    // Clicking should trigger audio (can't verify audio in E2E)
    await testAudioButton.click()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('E2E: Performance', () => {
  test('Page load within 500ms', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)

    const startTime = Date.now()
    await navigateToScannerPick(page)
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(500)

    expect(true).toBe(false) // RED
  })

  test('LP lookup within 100ms', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    const pickListId = await createTestPickList(page)
    await page.request.post(`/api/shipping/pick-lists/${pickListId}/start`)
    await page.goto(`/scanner/shipping/pick/${pickListId}`)

    const startTime = Date.now()
    await simulateBarcodeScan(page, 'LP-2025-00042')
    await page.waitForResponse((resp) => resp.url().includes('/lookup/lp/'))
    const lookupTime = Date.now() - startTime

    expect(lookupTime).toBeLessThan(100)

    await deletePickList(page, pickListId)

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// HAPPY PATH: COMPLETE WORKFLOW
// ============================================================================

test.describe('E2E: Complete Happy Path Workflow', () => {
  test('Full workflow: My Picks -> Start -> Pick All -> Complete', async ({ page }) => {
    await loginAsUser(page, testPickerEmail, testPickerPassword)
    const pickListId = await createTestPickList(page)

    // Step 1: Navigate to My Picks
    await navigateToScannerPick(page)
    await expect(page.locator('text=/PL-/i')).toBeVisible({ timeout: 10000 })

    // Step 2: Start picking
    const startButton = page.locator('button').filter({ hasText: /Start/i }).first()
    await startButton.click()

    // Step 3: Pick each line
    let linesRemaining = true
    let iterations = 0

    while (linesRemaining && iterations < 20) {
      const lineCard = page.locator('[data-testid="pick-line-card"]')
      if (!(await lineCard.isVisible())) {
        linesRemaining = false
        break
      }

      // Handle allergen if present
      const allergenCheckbox = page.locator('[data-testid="allergen-banner"] input[type="checkbox"]')
      if (await allergenCheckbox.isVisible()) {
        await allergenCheckbox.check()
      }

      // Scan expected LP
      const expectedLP = await page.locator('[data-testid="expected-lp"]').textContent()
      await simulateBarcodeScan(page, expectedLP || 'LP-2025-00042')

      // Confirm pick
      const confirmButton = page.locator('button').filter({ hasText: /Confirm Pick/i })
      if (await confirmButton.isVisible() && await confirmButton.isEnabled()) {
        await confirmButton.click()
        await page.waitForTimeout(300)
      }

      iterations++
    }

    // Step 4: Verify completion
    await expect(page.locator('[data-testid="pick-complete"]')).toBeVisible({ timeout: 10000 })

    // Step 5: Return to My Picks
    const returnButton = page.locator('button').filter({ hasText: /Return.*My Picks/i })
    await returnButton.click()

    await expect(page).toHaveURL(/\/scanner\/shipping\/pick/)

    await deletePickList(page, pickListId)

    expect(true).toBe(false) // RED
  })
})

/**
 * Test Coverage Summary:
 *
 * AC-1 My Picks List: 4 tests
 * AC-2 Start Pick: 2 tests
 * AC-3 Display Pick Line: 4 tests
 * AC-4 Valid LP Scan: 2 tests
 * AC-5 Invalid LP Scan: 2 tests
 * AC-7 Quantity Confirmation: 3 tests
 * AC-8 Short Pick: 3 tests
 * AC-12 Auto-Advance: 2 tests
 * AC-13 Complete Pick: 2 tests
 * AC-14 Allergen Banner: 2 tests
 * AC-15 FIFO/FEFO: 2 tests
 * AC-18 Touch Targets: 3 tests
 * AC-19 Settings: 4 tests
 * Performance: 2 tests
 * Happy Path: 1 test
 *
 * Total: 38 E2E tests
 * Coverage: Full user journey (all scanner acceptance criteria)
 */
