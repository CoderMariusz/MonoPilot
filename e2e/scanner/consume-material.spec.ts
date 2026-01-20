/**
 * E2E Tests: Material Consumption Scanner
 * Story: 04.6b - Material Consumption Scanner
 * Phase: TDD RED - All tests should FAIL (no implementation yet)
 *
 * Tests the complete scanner consumption flow:
 * - 6-step consumption flow (scan WO -> scan LP -> enter qty -> review -> confirm -> next)
 * - Full Consumption button skips number pad
 * - Error handling (invalid WO, product mismatch)
 * - Number pad decimal input
 * - Touch targets meet 48dp minimum
 * - Mobile UX (375px viewport)
 *
 * Coverage Target: Critical user journeys
 * Test Count: 12 tests
 */

import { test, expect } from '@playwright/test'

test.describe('04.6b Material Consumption Scanner - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as production operator
    await page.goto('/login')
    await page.fill('input[name="email"]', 'operator@company.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('/dashboard')

    // Set mobile viewport for scanner tests
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test.describe('Complete Scanner Flow (6 Steps)', () => {
    test('E2E-01: Complete scanner consumption flow from WO scan to success', async ({ page }) => {
      // AC-04.6b-001 through AC-04.6b-008: Full critical path

      // Step 1: Navigate to scanner
      await page.goto('/scanner/consume')
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 1 of 6')
      await expect(page.locator('[data-testid="scan-input"]')).toBeFocused()

      // Step 1: Scan WO barcode
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')

      // Verify success feedback
      await expect(page.locator('[data-testid="success-check"]')).toBeVisible()
      await expect(page.locator('[data-testid="wo-info-card"]')).toBeVisible({ timeout: 500 })
      await expect(page.locator('[data-testid="materials-list"]')).toBeVisible()

      // Step 2: Advance to scan LP
      await page.click('button:has-text("Next: Scan Material LP")')
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 2 of 6')

      // Step 2: Scan LP barcode
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')

      // Verify LP success feedback
      await expect(page.locator('[data-testid="success-check"]')).toBeVisible()
      await expect(page.locator('[data-testid="lp-info-card"]')).toBeVisible()

      // Step 3: Advance to quantity entry
      await page.click('button:has-text("Next: Enter Quantity")')
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 3 of 6')

      // Step 3: Enter quantity using number pad
      await expect(page.locator('[data-testid="number-pad"]')).toBeVisible()
      await page.click('[data-testid="numpad-2"]')
      await page.click('[data-testid="numpad-5"]')
      await page.click('[data-testid="numpad-0"]')
      await expect(page.locator('[data-testid="qty-display"]')).toContainText('250')

      // Step 4: Advance to review
      await page.click('button:has-text("Next: Review")')
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 4 of 6')

      // Verify review screen content
      await expect(page.locator('[data-testid="review-material-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="review-lp-number"]')).toBeVisible()
      await expect(page.locator('[data-testid="review-qty"]')).toContainText('250')

      // Step 5: Confirm
      await page.click('button:has-text("Confirm")')
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 5 of 6')

      // Verify processing state
      await expect(page.locator('[data-testid="spinner"]')).toBeVisible()

      // Step 6: Success and next
      await expect(page.locator('[data-testid="success-check"]')).toBeVisible({ timeout: 2000 })
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 6 of 6')

      // Verify final buttons
      await expect(page.locator('button:has-text("Next Material")')).toBeVisible()
      await expect(page.locator('button:has-text("Done")')).toBeVisible()
    })

    test('E2E-02: Full Consumption button skips number pad', async ({ page }) => {
      // AC-04.6b-006: Full Consumption quick action

      await page.goto('/scanner/consume')

      // Scan valid WO
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')

      // Scan valid LP with qty = 500
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Enter Quantity")')

      // Verify Full Consumption button shows LP quantity
      const fullConsumptionBtn = page.locator('[data-testid="full-consumption-btn"]')
      await expect(fullConsumptionBtn).toBeVisible()
      await expect(fullConsumptionBtn).toContainText('Full Consumption (500 kg)')

      // Click Full Consumption - should skip directly to Review
      await fullConsumptionBtn.click()
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 4 of 6')
      await expect(page.locator('[data-testid="review-qty"]')).toContainText('500')
    })

    test('E2E-03: Next Material returns to LP scan with WO retained', async ({ page }) => {
      // AC-04.6b-008: Next Material flow

      await page.goto('/scanner/consume')

      // Complete full flow
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Enter Quantity")')
      await page.click('[data-testid="full-consumption-btn"]')
      await page.click('button:has-text("Confirm")')

      // Wait for success
      await expect(page.locator('[data-testid="success-check"]')).toBeVisible({ timeout: 2000 })

      // Click Next Material
      await page.click('button:has-text("Next Material")')

      // Should be back at Step 2 (scan LP), not Step 1 (scan WO)
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 2 of 6')
      await expect(page.locator('[data-testid="wo-info-card"]')).toBeVisible() // WO still displayed
    })
  })

  test.describe('Error Handling', () => {
    test('E2E-04: Invalid WO barcode shows error with recovery options', async ({ page }) => {
      // AC-04.6b-002: Error handling for invalid WO

      await page.goto('/scanner/consume')

      // Enter invalid WO barcode
      await page.fill('[data-testid="scan-input"]', 'WO-99999')
      await page.keyboard.press('Enter')

      // Verify error feedback
      await expect(page.locator('[data-testid="error-x"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid WO barcode')

      // Verify recovery buttons
      await expect(page.locator('button:has-text("Scan Again")')).toBeVisible()
      await expect(page.locator('button:has-text("Manual Entry")')).toBeVisible()

      // Stays on same step
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('Step 1 of 6')
    })

    test('E2E-05: Product mismatch shows detailed error', async ({ page }) => {
      // AC-04.6b-004: Product mismatch error

      await page.goto('/scanner/consume')

      // Scan valid WO
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')

      // Scan LP with wrong product
      await page.fill('[data-testid="scan-input"]', 'LP-WRONG-PRODUCT')
      await page.keyboard.press('Enter')

      // Verify error feedback
      await expect(page.locator('[data-testid="error-x"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Product mismatch')
      await expect(page.locator('[data-testid="error-message"]')).toContainText('LP contains')
      await expect(page.locator('[data-testid="error-message"]')).toContainText('material requires')
    })

    test('E2E-06: LP not available shows error', async ({ page }) => {
      await page.goto('/scanner/consume')

      // Scan valid WO
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')

      // Scan consumed LP
      await page.fill('[data-testid="scan-input"]', 'LP-CONSUMED')
      await page.keyboard.press('Enter')

      // Verify error
      await expect(page.locator('[data-testid="error-x"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('not available')
    })
  })

  test.describe('Number Pad Input', () => {
    test('E2E-07: Number pad accepts decimal input', async ({ page }) => {
      // AC-04.6b-005: Decimal quantity entry

      await page.goto('/scanner/consume')

      // Navigate to quantity entry
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Enter Quantity")')

      // Enter decimal: 50.5
      await page.click('[data-testid="numpad-5"]')
      await page.click('[data-testid="numpad-0"]')
      await page.click('[data-testid="numpad-dot"]')
      await page.click('[data-testid="numpad-5"]')

      // Verify decimal accepted
      await expect(page.locator('[data-testid="qty-display"]')).toContainText('50.5')
    })

    test('E2E-08: Number pad backspace and clear work', async ({ page }) => {
      await page.goto('/scanner/consume')

      // Navigate to quantity entry
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Enter Quantity")')

      // Enter digits
      await page.click('[data-testid="numpad-1"]')
      await page.click('[data-testid="numpad-2"]')
      await page.click('[data-testid="numpad-3"]')
      await expect(page.locator('[data-testid="qty-display"]')).toContainText('123')

      // Backspace
      await page.click('[data-testid="numpad-backspace"]')
      await expect(page.locator('[data-testid="qty-display"]')).toContainText('12')

      // Clear
      await page.click('[data-testid="numpad-clear"]')
      await expect(page.locator('[data-testid="qty-display"]')).toContainText('0')
    })
  })

  test.describe('Accessibility and Touch Targets', () => {
    test('E2E-09: All touch targets meet 48dp minimum', async ({ page }) => {
      await page.goto('/scanner/consume')

      // Check primary button
      const scanButton = page.locator('button:has-text("Scan")').first()
      if (await scanButton.isVisible()) {
        const buttonBox = await scanButton.boundingBox()
        expect(buttonBox?.height).toBeGreaterThanOrEqual(48)
      }

      // Navigate to number pad
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Enter Quantity")')

      // Check number pad keys (should be 64x64)
      const numpadKey = page.locator('[data-testid="numpad-5"]')
      const keyBox = await numpadKey.boundingBox()
      expect(keyBox?.width).toBeGreaterThanOrEqual(64)
      expect(keyBox?.height).toBeGreaterThanOrEqual(64)
    })

    test('E2E-10: Font sizes meet minimum requirements (18px)', async ({ page }) => {
      await page.goto('/scanner/consume')

      // Check body text size
      const instructionText = page.locator('[data-testid="scan-instruction"]')
      const fontSize = await instructionText.evaluate((el) => {
        return window.getComputedStyle(el).fontSize
      })
      const fontSizeNum = parseInt(fontSize)
      expect(fontSizeNum).toBeGreaterThanOrEqual(18)
    })
  })

  test.describe('Performance', () => {
    test('E2E-11: WO scan to info display under 500ms', async ({ page }) => {
      await page.goto('/scanner/consume')

      const startTime = Date.now()
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await expect(page.locator('[data-testid="wo-info-card"]')).toBeVisible()
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(500)
    })

    test('E2E-12: Consumption confirm to success feedback under 2s', async ({ page }) => {
      await page.goto('/scanner/consume')

      // Complete flow to confirm step
      await page.fill('[data-testid="scan-input"]', 'WO-2025-0156')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Scan Material LP")')
      await page.fill('[data-testid="scan-input"]', 'LP-2025-01234')
      await page.keyboard.press('Enter')
      await page.click('button:has-text("Next: Enter Quantity")')
      await page.click('[data-testid="full-consumption-btn"]')

      // Measure confirm to success
      const startTime = Date.now()
      await page.click('button:has-text("Confirm")')
      await expect(page.locator('[data-testid="success-check"]')).toBeVisible()
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(2000)
    })
  })
})

/**
 * Test Summary for Scanner E2E Tests
 * ===================================
 *
 * Test Coverage:
 * - Complete flow: 3 tests
 * - Error handling: 3 tests
 * - Number pad input: 2 tests
 * - Accessibility: 2 tests
 * - Performance: 2 tests
 * - Total: 12 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - Scanner page not implemented
 * - Components not implemented
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create apps/frontend/app/(authenticated)/scanner/consume/page.tsx
 * 2. Create ScannerLayout, ScanInput, NumberPad, etc. components
 * 3. Implement useScannerFlow hook
 * 4. Integrate with barcode APIs
 * 5. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/app/(authenticated)/scanner/consume/page.tsx
 * - apps/frontend/components/scanner/*.tsx (6-7 components)
 *
 * Coverage Target: Critical user journeys
 */
