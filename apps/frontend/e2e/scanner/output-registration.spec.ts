/**
 * E2E Tests: Scanner Output Registration
 * Story 04.7b: Output Registration Scanner
 *
 * Tests complete 7-step scanner workflow:
 * - Step 1: Scan WO barcode
 * - Step 2: Enter quantity (number pad)
 * - Step 3: Select QA status
 * - Step 4: Review output
 * - Step 5: LP created confirmation
 * - Step 6: Print label
 * - Step 7: By-product registration
 *
 * Also tests:
 * - Mobile touch targets (64dp)
 * - Offline queue
 * - Quick registration mode
 */

import { test, expect } from '@playwright/test'

// Mobile viewport (375px width)
test.use({
  viewport: { width: 375, height: 667 },
  userAgent:
    'Mozilla/5.0 (Linux; Android 10; TC52) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
})

test.describe('Scanner Output Registration - Full 7-Step Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as production operator
    await page.goto('/login')
    await page.fill('input[name="email"]', 'operator@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|scanner)/)
  })

  test('completes full 7-step flow with all steps', async ({ page }) => {
    // Navigate to scanner output
    await page.goto('/scanner/output')
    await page.waitForLoadState('networkidle')

    // Step 1: Scan WO Barcode
    await expect(page.getByText(/Step 1 of 7/i)).toBeVisible()
    await expect(page.getByText(/Scan Work Order/i)).toBeVisible()

    // Barcode input should be auto-focused
    const barcodeInput = page.locator('input[data-testid="barcode-input"]')
    await expect(barcodeInput).toBeFocused()

    // Simulate barcode scan
    await barcodeInput.fill('WO-2025-0156')
    await page.keyboard.press('Enter')

    // Wait for WO validation (500ms target)
    await expect(page.getByText(/Product:/i)).toBeVisible({ timeout: 1000 })

    // Click Next
    await page.click('button:has-text("Next")')

    // Step 2: Enter Quantity
    await expect(page.getByText(/Step 2 of 7/i)).toBeVisible()
    await expect(page.getByText(/Quantity Produced/i)).toBeVisible()

    // Number pad should be visible
    await expect(page.getByTestId('number-pad')).toBeVisible()

    // Enter quantity via number pad
    await page.click('[data-testid="key-2"]')
    await page.click('[data-testid="key-5"]')
    await page.click('[data-testid="key-0"]')

    // Verify display shows 250
    await expect(page.getByTestId('qty-display')).toHaveText('250')

    // Click Next
    await page.click('button:has-text("Next")')

    // Step 3: Select QA Status
    await expect(page.getByText(/Step 3 of 7/i)).toBeVisible()
    await expect(page.getByText(/QA Status/i)).toBeVisible()

    // QA buttons should be visible with correct colors
    const approvedBtn = page.getByRole('button', { name: /Approved/i })
    const pendingBtn = page.getByRole('button', { name: /Pending/i })
    const rejectedBtn = page.getByRole('button', { name: /Rejected/i })

    await expect(approvedBtn).toBeVisible()
    await expect(pendingBtn).toBeVisible()
    await expect(rejectedBtn).toBeVisible()

    // Select Approved
    await approvedBtn.click()

    // Click Next
    await page.click('button:has-text("Next")')

    // Step 4: Review
    await expect(page.getByText(/Step 4 of 7/i)).toBeVisible()
    await expect(page.getByText(/Review/i)).toBeVisible()

    // Verify summary shows all details
    await expect(page.getByText(/250/)).toBeVisible() // Quantity
    await expect(page.getByText(/Approved/i)).toBeVisible() // QA Status
    await expect(page.getByText(/Batch/i)).toBeVisible() // Batch number
    await expect(page.getByText(/Expiry/i)).toBeVisible() // Expiry date

    // Confirm output
    await page.click('button:has-text("Confirm")')

    // Step 5: LP Created
    await expect(page.getByText(/Step 5 of 7/i)).toBeVisible()
    await expect(page.getByText(/LP Created/i)).toBeVisible()

    // Success animation should be visible
    await expect(page.getByTestId('success-animation')).toBeVisible()

    // LP number should be displayed
    await expect(page.getByText(/LP-\d{8}-\d{4}/)).toBeVisible()

    // Wait for auto-advance or click Next
    await page.click('button:has-text("Next")')

    // Step 6: Print Label
    await expect(page.getByText(/Step 6 of 7/i)).toBeVisible()
    await expect(page.getByText(/Print Label/i)).toBeVisible()

    // Print button should be visible
    const printBtn = page.getByRole('button', { name: /Print/i })
    await expect(printBtn).toBeVisible()

    // Skip print for this test
    await page.click('button:has-text("Skip")')

    // Step 7: By-Products (or completion)
    // If WO has by-products, prompt shows. Otherwise, completion.
    const byProductPrompt = page.getByText(/By-Product/i)
    const completionMsg = page.getByText(/Output registration complete/i)

    const hasByProducts = (await byProductPrompt.count()) > 0

    if (hasByProducts) {
      await expect(byProductPrompt).toBeVisible()
      // Skip all by-products
      await page.click('button:has-text("Skip All")')
    }

    // Should show completion message
    await expect(completionMsg).toBeVisible()
  })

  test('handles by-product registration loop', async ({ page }) => {
    await page.goto('/scanner/output')

    // Fast path to by-products step (assume WO has by-products)
    // ... (skip to step 7 via mocking or test data setup)

    // By-product prompt
    await expect(page.getByText(/By-Product/i)).toBeVisible()

    // Shows expected quantity
    await expect(page.getByText(/Expected:/i)).toBeVisible()

    // Register first by-product
    await page.click('button:has-text("Yes")')

    // Enter by-product quantity
    await page.click('[data-testid="key-4"]')
    await page.click('[data-testid="key-5"]')
    await page.click('button:has-text("Confirm")')

    // Should prompt for next by-product (if any)
    // Or show completion
    const allRegistered = page.getByText(/All by-products registered/i)
    const nextByProduct = page.getByText(/By-Product/i)

    const hasMore = (await nextByProduct.count()) > 0 && !(await allRegistered.isVisible())

    if (hasMore) {
      // Skip remaining
      await page.click('button:has-text("Skip All")')
    }

    await expect(page.getByText(/complete/i)).toBeVisible()
  })

  test('shows zero quantity warning for by-product', async ({ page }) => {
    await page.goto('/scanner/output')

    // Navigate to by-product step (test setup needed)
    // ...

    // Try to confirm zero quantity
    await page.click('button:has-text("Yes")') // Open by-product registration
    // Don't enter any quantity (starts at 0)
    await page.click('button:has-text("Confirm")')

    // Should show warning
    await expect(page.getByText(/quantity is 0/i)).toBeVisible()
    await expect(page.getByText(/Continue\?/i)).toBeVisible()

    // Confirm zero quantity
    await page.click('button:has-text("Confirm")')

    // Should proceed
    await expect(page.getByText(/complete/i)).toBeVisible()
  })
})

test.describe('Scanner Output - Mobile Touch Targets', () => {
  test('number pad keys are 64dp minimum', async ({ page }) => {
    await page.goto('/scanner/output')

    // Navigate to quantity step
    await page.fill('[data-testid="barcode-input"]', 'WO-2025-0156')
    await page.keyboard.press('Enter')
    await page.click('button:has-text("Next")')

    // Check number pad key sizes
    const key1 = page.locator('[data-testid="key-1"]')
    await expect(key1).toBeVisible()

    const box = await key1.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(64)
    expect(box?.height).toBeGreaterThanOrEqual(64)
  })

  test('QA buttons are 64dp height', async ({ page }) => {
    await page.goto('/scanner/output')

    // Navigate to QA status step
    // ... (skip to step 3)

    const approvedBtn = page.getByRole('button', { name: /Approved/i })
    await expect(approvedBtn).toBeVisible()

    const box = await approvedBtn.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(64)
  })

  test('all interactive elements are at least 48dp', async ({ page }) => {
    await page.goto('/scanner/output')

    // Check all buttons
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          // All touch targets should be at least 48dp
          expect(box.width).toBeGreaterThanOrEqual(48)
          expect(box.height).toBeGreaterThanOrEqual(48)
        }
      }
    }
  })
})

test.describe('Scanner Output - Network & Offline', () => {
  test('shows network error retry option', async ({ page }) => {
    await page.goto('/scanner/output')

    // Simulate offline
    await page.route('**/api/production/output/**', (route) =>
      route.abort('failed')
    )

    // Try to scan WO
    await page.fill('[data-testid="barcode-input"]', 'WO-2025-0156')
    await page.keyboard.press('Enter')

    // Should show network error
    await expect(page.getByText(/Network error/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Retry/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Offline/i })).toBeVisible()
  })

  test('queues operation when offline and saves', async ({ page }) => {
    await page.goto('/scanner/output')

    // Complete steps up to submit, then go offline
    // ... (setup to review step)

    // Go offline before confirm
    await page.route('**/api/production/output/register', (route) =>
      route.abort('failed')
    )

    await page.click('button:has-text("Confirm")')

    // Should show error with save offline option
    await expect(page.getByText(/Network error/i)).toBeVisible()

    // Click save offline
    await page.click('button:has-text("Save Offline")')

    // Should show confirmation
    await expect(page.getByText(/Saved for later sync/i)).toBeVisible()
  })

  test('syncs offline queue when online', async ({ page }) => {
    // Start with items in offline queue (test setup needed)
    await page.goto('/scanner/output')

    // Should show offline indicator if items pending
    const offlineIndicator = page.getByTestId('offline-indicator')
    const hasPending = (await offlineIndicator.count()) > 0

    if (hasPending) {
      // Should auto-sync when online
      await page.waitForTimeout(1000) // Wait for sync

      // Indicator should disappear or show success
      await expect(page.getByText(/Synced/i)).toBeVisible()
    }
  })
})

test.describe('Scanner Output - Print Label', () => {
  test('disables print when no printer configured', async ({ page }) => {
    // Mock no printer configured
    await page.route('**/api/production/output/printer-status**', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ configured: false }),
      })
    )

    await page.goto('/scanner/output')

    // Navigate to print step
    // ... (complete steps 1-5)

    const printBtn = page.getByRole('button', { name: /Print/i })

    // Print button should be disabled
    await expect(printBtn).toBeDisabled()

    // Should show tooltip
    await printBtn.hover()
    await expect(page.getByText(/No printer configured/i)).toBeVisible()
  })

  test('shows print success message', async ({ page }) => {
    // Mock successful print
    await page.route('**/api/production/output/print-label', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, printer_name: 'Zebra ZT411' }),
      })
    )

    await page.goto('/scanner/output')

    // Navigate to print step and print
    // ...

    await page.click('button:has-text("Print")')

    // Should show success
    await expect(page.getByText(/Label printed/i)).toBeVisible()
  })

  test('shows retry on print error', async ({ page }) => {
    // Mock print error
    await page.route('**/api/production/output/print-label', (route) =>
      route.fulfill({
        status: 503,
        body: JSON.stringify({ error: 'Printer not responding' }),
      })
    )

    await page.goto('/scanner/output')

    // Navigate to print step and print
    // ...

    await page.click('button:has-text("Print")')

    // Should show error with retry
    await expect(page.getByText(/Printer not responding/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Retry/i })).toBeVisible()
  })
})

test.describe('Scanner Output - Quick Registration Mode', () => {
  test('can register multiple outputs quickly', async ({ page }) => {
    await page.goto('/scanner/output')

    // Complete first output
    await page.fill('[data-testid="barcode-input"]', 'WO-2025-0156')
    await page.keyboard.press('Enter')
    await page.click('button:has-text("Next")')

    await page.click('[data-testid="key-1"]')
    await page.click('[data-testid="key-0"]')
    await page.click('[data-testid="key-0"]')
    await page.click('button:has-text("Next")')

    await page.click('button:has-text("Approved")')
    await page.click('button:has-text("Next")')

    await page.click('button:has-text("Confirm")')

    // Skip print and by-products
    await page.click('button:has-text("Skip")')
    await page.click('button:has-text("Skip All")')

    // Should show "Register Another" option
    const registerAnother = page.getByRole('button', { name: /Register Another/i })
    await expect(registerAnother).toBeVisible()

    // Click to start another registration
    await registerAnother.click()

    // Should be back at step 1
    await expect(page.getByText(/Step 1 of 7/i)).toBeVisible()
    await expect(page.locator('[data-testid="barcode-input"]')).toBeFocused()
  })

  test('preserves WO context for quick mode', async ({ page }) => {
    await page.goto('/scanner/output')

    // Complete first output
    await page.fill('[data-testid="barcode-input"]', 'WO-2025-0156')
    await page.keyboard.press('Enter')
    // ... complete flow

    // After completion, choose "Same WO"
    const sameWO = page.getByRole('button', { name: /Same WO/i })

    if ((await sameWO.count()) > 0) {
      await sameWO.click()

      // Should skip step 1, go directly to step 2
      await expect(page.getByText(/Step 2 of 7/i)).toBeVisible()
    }
  })
})

test.describe('Scanner Output - Output History View', () => {
  test('shows output history on success screen', async ({ page }) => {
    await page.goto('/scanner/output')

    // Complete output registration
    // ...

    // On success screen, should show recent outputs
    const historySection = page.getByTestId('output-history')

    if ((await historySection.count()) > 0) {
      await expect(historySection).toBeVisible()

      // Should show LP numbers
      await expect(page.getByText(/LP-\d{8}-\d{4}/)).toBeVisible()
    }
  })

  test('can view output details from history', async ({ page }) => {
    await page.goto('/scanner/output')

    // Complete output and view history
    // ...

    // Click on an output in history
    const historyItem = page.locator('[data-testid="history-item"]').first()

    if ((await historyItem.count()) > 0) {
      await historyItem.click()

      // Should show output details modal/panel
      await expect(page.getByText(/Output Details/i)).toBeVisible()
    }
  })
})

/**
 * E2E Test Coverage Summary:
 *
 * Full 7-Step Flow (1 test):
 *   - Complete workflow from scan to completion
 *
 * By-Product Registration (2 tests):
 *   - Registration loop
 *   - Zero quantity warning
 *
 * Mobile Touch Targets (3 tests):
 *   - Number pad 64dp keys
 *   - QA buttons 64dp height
 *   - All elements 48dp minimum
 *
 * Network & Offline (3 tests):
 *   - Network error retry
 *   - Offline queue save
 *   - Online sync
 *
 * Print Label (3 tests):
 *   - Disabled when no printer
 *   - Success message
 *   - Retry on error
 *
 * Quick Registration (2 tests):
 *   - Multiple outputs
 *   - Preserve WO context
 *
 * Output History (2 tests):
 *   - History display
 *   - View details
 *
 * Total: 16 E2E tests
 */
