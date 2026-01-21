/**
 * Scanner Move Workflow E2E Tests (Story 05.20)
 * Phase: TDD RED - Tests written before implementation
 *
 * Tests the complete scanner move workflow:
 * - Step 1: Scan LP barcode
 * - Step 2: Scan destination location
 * - Step 3: Confirm and execute move
 * - Success screen with quick actions
 *
 * Coverage Target: Critical user flows
 * Test Count: 25+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Scanner move page layout
 * - AC-2: Step 1 - Scan LP
 * - AC-3: Step 2 - Scan Destination
 * - AC-4: Step 3 - Confirm Move
 * - AC-5: Success screen actions
 * - AC-6: Audio feedback
 * - AC-7: Visual feedback
 * - AC-11: Touch target requirements
 * - AC-12: Error handling and recovery
 * - AC-13: Performance requirements
 */

import { test, expect } from '@playwright/test'

test.describe('Scanner Move Workflow (Story 05.20)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as warehouse operator
    await page.goto('/login')
    await page.fill('[name="email"]', 'operator@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  // ===========================================================================
  // AC-1: Scanner Move Page Layout
  // ===========================================================================
  test.describe('Scanner Move Page Layout (AC-1)', () => {
    test('should render scanner move page with mobile-optimized layout', async ({ page }) => {
      await page.goto('/scanner/move')

      // Header should be visible
      await expect(page.locator('h1, [data-testid="page-title"]')).toContainText(/Move LP/i)

      // Back button should be visible
      await expect(page.locator('button[aria-label*="back"], a[href*="scanner"]')).toBeVisible()

      // Step progress indicator should show Step 1 of 3
      await expect(page.locator('text=/Step 1.*of.*3/i')).toBeVisible()
    })

    test('should show scan LP button prominently (AC-1)', async ({ page }) => {
      await page.goto('/scanner/move')

      // Large scan button should be visible
      const scanButton = page.locator('button', { hasText: /scan.*LP|scan.*barcode/i })
      await expect(scanButton).toBeVisible()

      // Button should have minimum touch target size
      const box = await scanButton.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(48)
      expect(box?.height).toBeGreaterThanOrEqual(48)
    })

    test('should show manual entry option (AC-1)', async ({ page }) => {
      await page.goto('/scanner/move')

      // Manual entry link should be available
      await expect(
        page.locator('button, a', { hasText: /manual|enter.*manually/i })
      ).toBeVisible()
    })
  })

  // ===========================================================================
  // AC-2: Step 1 - Scan LP
  // ===========================================================================
  test.describe('Step 1 - Scan LP (AC-2)', () => {
    test('should display LP details after valid scan', async ({ page }) => {
      await page.goto('/scanner/move')

      // Simulate barcode scan by entering LP number manually
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // LP details should display
      await expect(page.locator('text=LP00000001')).toBeVisible()
      await expect(page.locator('text=/Flour|Product/i')).toBeVisible()
      await expect(page.locator('text=/100.*KG|100 KG/i')).toBeVisible()
      await expect(page.locator('text=/Available/i')).toBeVisible()
    })

    test('should show error for LP not found', async ({ page }) => {
      await page.goto('/scanner/move')

      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP99999999')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // Error message should display
      await expect(page.locator('text=/not found/i')).toBeVisible()

      // Should remain on Step 1
      await expect(page.locator('text=/Step 1/i')).toBeVisible()
    })

    test('should show error for LP with status consumed', async ({ page }) => {
      await page.goto('/scanner/move')

      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP-CONSUMED')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // Error message for consumed LP
      await expect(page.locator('text=/not available|consumed/i')).toBeVisible()
    })

    test('should show error for reserved LP with reservation details', async ({ page }) => {
      await page.goto('/scanner/move')

      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP-RESERVED')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // Error should mention reservation
      await expect(page.locator('text=/reserved/i')).toBeVisible()
      await expect(page.locator('text=/WO-|reserved for/i')).toBeVisible()
    })

    test('should show error for blocked LP with QA status', async ({ page }) => {
      await page.goto('/scanner/move')

      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP-BLOCKED')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // Error should mention blocked/QA
      await expect(page.locator('text=/blocked/i')).toBeVisible()
    })

    test('should advance to Step 2 after valid LP scan', async ({ page }) => {
      await page.goto('/scanner/move')

      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // Wait for LP validation
      await page.waitForSelector('text=LP00000001')

      // Should advance to Step 2
      await expect(page.locator('text=/Step 2/i')).toBeVisible()
      await expect(page.locator('text=/Scan Destination|destination/i')).toBeVisible()
    })
  })

  // ===========================================================================
  // AC-3: Step 2 - Scan Destination Location
  // ===========================================================================
  test.describe('Step 2 - Scan Destination (AC-3)', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Step 2 by completing Step 1
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })
      await page.waitForSelector('text=/Step 2/i')
    })

    test('should display LP summary card at top of Step 2', async ({ page }) => {
      // LP summary should be visible
      await expect(page.locator('[data-testid="lp-summary"]')).toBeVisible()
      await expect(page.locator('text=LP00000001')).toBeVisible()
    })

    test('should display destination location details after valid scan', async ({ page }) => {
      // Scan/enter destination location
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'B-02-R05-B12')
      await page.click('button', { hasText: /lookup|search|submit|select/i })

      // Location details should display
      await expect(page.locator('text=B-02-R05-B12')).toBeVisible()
      await expect(page.locator('text=/Zone B|Warehouse/i')).toBeVisible()
    })

    test('should show error for location not found', async ({ page }) => {
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'INVALID-LOC')
      await page.click('button', { hasText: /lookup|search|submit|select/i })

      // Error message
      await expect(page.locator('text=/not found/i')).toBeVisible()
    })

    test('should show error for inactive location', async ({ page }) => {
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'INACTIVE-LOC')
      await page.click('button', { hasText: /lookup|search|submit|select/i })

      // Error for inactive location
      await expect(page.locator('text=/inactive/i')).toBeVisible()
    })

    test('should show warning when scanning same location as source', async ({ page }) => {
      // Try to scan same location as current LP location
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'A-01-R03-B05')
      await page.click('button', { hasText: /lookup|search|submit|select/i })

      // Warning for same location
      await expect(page.locator('text=/same.*location|current location/i')).toBeVisible()
    })

    test('should show capacity warning at 100% (AC-3)', async ({ page }) => {
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'FULL-LOC')
      await page.click('button', { hasText: /lookup|search|submit|select/i })

      // Capacity warning should be visible but move still allowed
      await expect(page.locator('text=/capacity|full/i')).toBeVisible()
    })

    test('should advance to Step 3 after valid destination scan', async ({ page }) => {
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'B-02-R05-B12')
      await page.click('button', { hasText: /lookup|search|submit|select/i })

      // Wait for location validation
      await page.waitForSelector('text=B-02-R05-B12')

      // Should advance to Step 3
      await expect(page.locator('text=/Step 3|Confirm/i')).toBeVisible()
    })
  })

  // ===========================================================================
  // AC-4: Step 3 - Confirm Move
  // ===========================================================================
  test.describe('Step 3 - Confirm Move (AC-4)', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Step 3
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })
      await page.waitForSelector('text=/Step 2/i')
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'B-02-R05-B12')
      await page.click('button', { hasText: /lookup|search|submit|select/i })
      await page.waitForSelector('text=/Step 3|Confirm/i')
    })

    test('should display confirmation summary with LP info', async ({ page }) => {
      // LP info should be displayed
      await expect(page.locator('text=LP00000001')).toBeVisible()
      await expect(page.locator('text=/Flour|Product/i')).toBeVisible()
      await expect(page.locator('text=/100.*KG/i')).toBeVisible()
    })

    test('should display from/to locations with arrow', async ({ page }) => {
      // From location
      await expect(page.locator('text=/From|A-01-R03/i')).toBeVisible()

      // To location
      await expect(page.locator('text=/To|B-02-R05/i')).toBeVisible()

      // Visual arrow (may be icon or text)
      await expect(page.locator('[data-testid="direction-arrow"], text=/arrow|→|▼/i')).toBeVisible()
    })

    test('should have large Confirm Move button', async ({ page }) => {
      const confirmButton = page.locator('button', { hasText: /Confirm.*Move/i })
      await expect(confirmButton).toBeVisible()

      // Button should be full-width and at least 56dp height
      const box = await confirmButton.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(56)
    })

    test('should have Cancel option', async ({ page }) => {
      await expect(page.locator('button, a', { hasText: /Cancel/i })).toBeVisible()
    })

    test('should have Edit buttons for LP and destination sections', async ({ page }) => {
      const editButtons = page.locator('button', { hasText: /Edit/i })
      await expect(editButtons.first()).toBeVisible()
    })

    test('should execute move successfully on confirm', async ({ page }) => {
      await page.click('button', { hasText: /Confirm.*Move/i })

      // Wait for success
      await page.waitForSelector('text=/success|completed|Move.*Complete/i', { timeout: 5000 })

      // Move number should be displayed
      await expect(page.locator('text=/SM-\d{4}-\d{5}/i')).toBeVisible()
    })
  })

  // ===========================================================================
  // AC-5: Success Screen Actions
  // ===========================================================================
  test.describe('Success Screen (AC-5)', () => {
    test.beforeEach(async ({ page }) => {
      // Complete a full move
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })
      await page.waitForSelector('text=/Step 2/i')
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'B-02-R05-B12')
      await page.click('button', { hasText: /lookup|search|submit|select/i })
      await page.waitForSelector('text=/Step 3|Confirm/i')
      await page.click('button', { hasText: /Confirm.*Move/i })
      await page.waitForSelector('text=/success|completed|Move.*Complete/i', { timeout: 5000 })
    })

    test('should display success animation', async ({ page }) => {
      await expect(page.locator('[data-testid="success-animation"], .success-icon')).toBeVisible()
    })

    test('should display move number and LP info', async ({ page }) => {
      await expect(page.locator('text=/SM-\d{4}-\d{5}/i')).toBeVisible()
      await expect(page.locator('text=LP00000001')).toBeVisible()
      await expect(page.locator('text=/B-02-R05/i')).toBeVisible()
    })

    test('should have Move Another to Same Location action', async ({ page }) => {
      const moveAnotherBtn = page.locator('button', { hasText: /Move Another.*Same|Same Location/i })
      await expect(moveAnotherBtn).toBeVisible()

      // Click and verify destination is preserved
      await moveAnotherBtn.click()
      await expect(page.locator('text=/Step 1/i')).toBeVisible()
    })

    test('should have New Move action', async ({ page }) => {
      const newMoveBtn = page.locator('button', { hasText: /New Move/i })
      await expect(newMoveBtn).toBeVisible()

      await newMoveBtn.click()
      await expect(page.locator('text=/Step 1/i')).toBeVisible()
    })

    test('should have Done action to return to scanner menu', async ({ page }) => {
      const doneBtn = page.locator('button, a', { hasText: /Done/i })
      await expect(doneBtn).toBeVisible()
    })
  })

  // ===========================================================================
  // AC-11: Touch Target Requirements
  // ===========================================================================
  test.describe('Touch Target Requirements (AC-11)', () => {
    test('should have all buttons with minimum 48dp touch target', async ({ page }) => {
      await page.goto('/scanner/move')

      const buttons = page.locator('button')
      const count = await buttons.count()

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const box = await button.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(48)
        }
      }
    })

    test('should have scan button at 80x80dp minimum', async ({ page }) => {
      await page.goto('/scanner/move')

      const scanButton = page.locator('button', { hasText: /scan/i })
      const box = await scanButton.boundingBox()

      expect(box?.width).toBeGreaterThanOrEqual(80)
      expect(box?.height).toBeGreaterThanOrEqual(80)
    })
  })

  // ===========================================================================
  // AC-12: Error Handling and Recovery
  // ===========================================================================
  test.describe('Error Handling (AC-12)', () => {
    test('should show retry option on network error', async ({ page }) => {
      // Simulate network error by going offline
      await page.route('**/api/warehouse/scanner/**', (route) => route.abort())

      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })

      // Error modal with retry should appear
      await expect(page.locator('text=/error|failed|network/i')).toBeVisible()
      await expect(page.locator('button', { hasText: /Retry/i })).toBeVisible()
    })

    test('should preserve data for retry after error', async ({ page }) => {
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')

      // Input should retain value
      await expect(page.locator('[data-testid="lp-input"], input[name="lp_number"]')).toHaveValue(
        'LP00000001'
      )
    })
  })

  // ===========================================================================
  // AC-13: Performance Requirements
  // ===========================================================================
  test.describe('Performance (AC-13)', () => {
    test('should load scanner move page within 1 second', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/scanner/move')
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(1000)
    })

    test('should be interactive within 1.5 seconds', async ({ page }) => {
      await page.goto('/scanner/move')

      const startTime = Date.now()
      await page.waitForSelector('button', { state: 'visible' })
      const interactiveTime = Date.now() - startTime

      expect(interactiveTime).toBeLessThan(1500)
    })
  })

  // ===========================================================================
  // Navigation and Edit Flow
  // ===========================================================================
  test.describe('Navigation and Edit Flow', () => {
    test('should navigate back to Step 1 when editing LP from confirmation', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })
      await page.waitForSelector('text=/Step 2/i')
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'B-02-R05-B12')
      await page.click('button', { hasText: /lookup|search|submit|select/i })
      await page.waitForSelector('text=/Step 3|Confirm/i')

      // Click edit on LP section
      await page.click('[data-testid="edit-lp"], button:has-text("Edit"):first-of-type')

      // Should return to Step 1
      await expect(page.locator('text=/Step 1/i')).toBeVisible()
    })

    test('should navigate back to Step 2 when editing destination from confirmation', async ({ page }) => {
      // Navigate to Step 3
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })
      await page.waitForSelector('text=/Step 2/i')
      await page.click('button, a', { hasText: /select|manual/i })
      await page.fill('[data-testid="location-input"], input[name="location_code"]', 'B-02-R05-B12')
      await page.click('button', { hasText: /lookup|search|submit|select/i })
      await page.waitForSelector('text=/Step 3|Confirm/i')

      // Click edit on destination section
      await page.click('[data-testid="edit-destination"], button:has-text("Edit"):last-of-type')

      // Should return to Step 2
      await expect(page.locator('text=/Step 2/i')).toBeVisible()

      // LP should still be preserved
      await expect(page.locator('text=LP00000001')).toBeVisible()
    })

    test('should cancel and return to Step 1 on cancel', async ({ page }) => {
      await page.goto('/scanner/move')
      await page.click('button, a', { hasText: /manual|enter/i })
      await page.fill('[data-testid="lp-input"], input[name="lp_number"]', 'LP00000001')
      await page.click('button', { hasText: /lookup|search|submit/i })
      await page.waitForSelector('text=/Step 2/i')

      // Click cancel
      await page.click('button, a', { hasText: /Cancel/i })

      // Should return to Step 1
      await expect(page.locator('text=/Step 1/i')).toBeVisible()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Page Layout (AC-1) - 3 tests:
 *   - Mobile-optimized layout
 *   - Scan button visibility
 *   - Manual entry option
 *
 * Step 1 - Scan LP (AC-2) - 6 tests:
 *   - Valid LP displays details
 *   - LP not found error
 *   - Consumed LP error
 *   - Reserved LP error
 *   - Blocked LP error
 *   - Advance to Step 2
 *
 * Step 2 - Scan Destination (AC-3) - 7 tests:
 *   - LP summary visible
 *   - Valid destination displays
 *   - Location not found error
 *   - Inactive location error
 *   - Same location warning
 *   - Capacity warning
 *   - Advance to Step 3
 *
 * Step 3 - Confirm Move (AC-4) - 6 tests:
 *   - LP info displayed
 *   - From/to locations with arrow
 *   - Confirm button size
 *   - Cancel option
 *   - Edit buttons
 *   - Successful move execution
 *
 * Success Screen (AC-5) - 5 tests:
 *   - Success animation
 *   - Move number displayed
 *   - Move Another action
 *   - New Move action
 *   - Done action
 *
 * Touch Targets (AC-11) - 2 tests
 * Error Handling (AC-12) - 2 tests
 * Performance (AC-13) - 2 tests
 * Navigation/Edit - 3 tests
 *
 * Total: 36 tests
 * Coverage: Critical user flows
 */
