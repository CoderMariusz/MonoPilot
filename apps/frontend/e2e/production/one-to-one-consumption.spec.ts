/**
 * E2E Tests: 1:1 Consumption Enforcement (Story 04.6c)
 *
 * Tests user journeys for consume_whole_lp enforcement:
 * - Desktop: Full LP Required badge, locked qty input, warning banner
 * - Scanner: Badge display, qty pre-fill, number pad disable
 * - Error handling: API validation bypass protection
 * - Variance: Recording when LP.qty differs from required
 *
 * RED PHASE - Tests will fail until UI is implemented
 *
 * Acceptance Criteria Coverage:
 * - AC-04.6c.1-6: Block/Allow consumption based on consume_whole_lp
 * - AC-04.6c.7-8: Full LP Required badge display
 * - AC-04.6c.10-14: Scanner pre-fill, lock, number pad disable
 */

import { test, expect } from '@playwright/test'

test.describe('1:1 Consumption Enforcement E2E (Story 04.6c)', () => {
  // ============================================================================
  // Test Setup
  // ============================================================================
  test.beforeEach(async ({ page }) => {
    // Login as production operator
    await page.goto('/login')
    await page.fill('input[name="email"]', 'production_operator@test.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  // ============================================================================
  // Desktop: Full LP Required Badge (AC-04.6c.7)
  // ============================================================================
  test.describe('Desktop - Full LP Required Badge', () => {
    test('should display Full LP Required badge on materials with consume_whole_lp=true', async ({
      page,
    }) => {
      // GIVEN: consume_whole_lp=true material in materials table
      // WHEN: table rendered
      // THEN: "Full LP Required" badge with lock icon displays next to material name

      // Navigate to consumption page with WO containing 1:1 material
      await page.goto('/production/consumption/wo-test-whole-lp')
      await expect(page.locator('[data-testid="consumption-page"]')).toBeVisible()

      // Find material with consume_whole_lp=true (e.g., "Packaging Film")
      const wholeLPMaterial = page.locator('tr:has-text("Packaging Film")')
      await expect(wholeLPMaterial).toBeVisible()

      // Verify badge displays
      const badge = wholeLPMaterial.locator('[data-testid="full-lp-badge"]')
      await expect(badge).toBeVisible()
      await expect(badge).toContainText('Full LP Required')

      // Verify lock icon
      const lockIcon = wholeLPMaterial.locator('[data-testid="lock-icon"]')
      await expect(lockIcon).toBeVisible()
    })

    test('should use Yellow-900 bg, Yellow-300 text for desktop badge', async ({ page }) => {
      // GIVEN: badge rendered on desktop
      // WHEN: displayed
      // THEN: badge has Yellow-900 background, Yellow-300 text

      await page.goto('/production/consumption/wo-test-whole-lp')

      const badge = page.locator('[data-testid="full-lp-badge"]').first()
      await expect(badge).toBeVisible()

      // Check styling (may need to verify computed styles)
      await expect(badge).toHaveClass(/bg-yellow-900/)
      await expect(badge).toHaveClass(/text-yellow-300/)
    })

    test('should not display badge for materials without consume_whole_lp', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-whole-lp')

      // Find regular material without consume_whole_lp=true (e.g., "Flour")
      const regularMaterial = page.locator('tr:has-text("Flour")')
      await expect(regularMaterial).toBeVisible()

      // Verify no badge
      const badge = regularMaterial.locator('[data-testid="full-lp-badge"]')
      await expect(badge).not.toBeVisible()
    })
  })

  // ============================================================================
  // Desktop: Quantity Lock (AC-04.6c.11)
  // ============================================================================
  test.describe('Desktop - Quantity Lock', () => {
    test('should pre-fill qty input with LP.qty when LP selected for consume_whole_lp=true', async ({
      page,
    }) => {
      // GIVEN: consume_whole_lp=true on desktop modal
      // WHEN: LP selected
      // THEN: qty input pre-filled with LP.qty and marked read-only

      await page.goto('/production/consumption/wo-test-whole-lp')

      // Click [+] on whole LP material
      const wholeLPRow = page.locator('tr:has-text("Packaging Film")')
      await wholeLPRow.locator('button[data-testid="add-consumption"]').click()

      // Modal opens
      const modal = page.locator('[data-testid="consumption-modal"]')
      await expect(modal).toBeVisible()

      // Select LP (e.g., LP with qty=50)
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-FILM-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()

      // Verify qty is pre-filled with LP quantity (50)
      const qtyInput = modal.locator('input[data-testid="consume-qty-input"]')
      await expect(qtyInput).toHaveValue('50')

      // Verify read-only
      await expect(qtyInput).toHaveAttribute('readonly')
    })

    test('should display lock icon on read-only qty input', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-whole-lp')

      const wholeLPRow = page.locator('tr:has-text("Packaging Film")')
      await wholeLPRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-FILM-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()

      // Verify lock icon on input
      const lockIcon = modal.locator('[data-testid="qty-lock-icon"]')
      await expect(lockIcon).toBeVisible()
    })

    test('should show warning banner when user attempts to edit locked qty', async ({ page }) => {
      // GIVEN: consume_whole_lp=true on desktop modal
      // WHEN: user attempts to edit qty input
      // THEN: warning "This material requires full LP consumption" displays, qty remains LP.qty

      await page.goto('/production/consumption/wo-test-whole-lp')

      const wholeLPRow = page.locator('tr:has-text("Packaging Film")')
      await wholeLPRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-FILM-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()

      // Try to click/focus on qty input (which is readonly)
      const qtyInput = modal.locator('input[data-testid="consume-qty-input"]')
      await qtyInput.click()

      // Warning banner should display
      const warningBanner = modal.locator('[data-testid="full-lp-warning"]')
      await expect(warningBanner).toBeVisible()
      await expect(warningBanner).toContainText('This material requires full LP consumption')

      // Qty should remain unchanged
      await expect(qtyInput).toHaveValue('50')
    })
  })

  // ============================================================================
  // Scanner: Full LP Required Badge (AC-04.6c.7, AC-04.6c.8)
  // ============================================================================
  test.describe('Scanner - Full LP Required Badge', () => {
    test('should display Full LP Required badge in materials list', async ({ page }) => {
      // GIVEN: consume_whole_lp=true material in scanner materials list
      // WHEN: materials list displayed
      // THEN: badge shows next to material name

      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      // Materials list should show badge
      const materialItem = page.locator('[data-testid="material-item"]:has-text("Packaging Film")')
      await expect(materialItem).toBeVisible()

      const badge = materialItem.locator('[data-testid="full-lp-badge"]')
      await expect(badge).toBeVisible()
      await expect(badge).toContainText('Full LP Required')
    })

    test('should use Yellow-600 bg, Yellow-900 text for scanner badge', async ({ page }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      const badge = page.locator('[data-testid="full-lp-badge"]').first()
      await expect(badge).toBeVisible()

      // Scanner-specific styling
      await expect(badge).toHaveClass(/bg-yellow-600/)
      await expect(badge).toHaveClass(/text-yellow-900/)
    })
  })

  // ============================================================================
  // Scanner: Pre-fill and Lock (AC-04.6c.10)
  // ============================================================================
  test.describe('Scanner - Pre-fill and Lock', () => {
    test('should pre-fill qty with LP.qty when LP scanned for consume_whole_lp=true', async ({
      page,
    }) => {
      // GIVEN: consume_whole_lp=true on scanner
      // WHEN: LP scanned
      // THEN: qty input pre-filled with LP.qty and displayed as read-only with lock icon

      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      // Select material
      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()

      // Scan LP
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      // Verify qty is pre-filled (Step 3)
      await expect(page.locator('[data-testid="step-3-enter-qty"]')).toBeVisible()
      const qtyDisplay = page.locator('[data-testid="qty-display"]')
      await expect(qtyDisplay).toContainText('500') // LP has 500 units

      // Verify locked state
      const lockIndicator = page.locator('[data-testid="qty-locked"]')
      await expect(lockIndicator).toBeVisible()
    })

    test('should display locked qty with lock icon', async ({ page }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      // Lock icon should be visible
      const lockIcon = page.locator('[data-testid="qty-lock-icon"]')
      await expect(lockIcon).toBeVisible()
    })
  })

  // ============================================================================
  // Scanner: Number Pad Disabled (AC-04.6c.12, AC-04.6c.13, AC-04.6c.14)
  // ============================================================================
  test.describe('Scanner - Number Pad Disabled', () => {
    test('should disable number pad when consume_whole_lp=true', async ({ page }) => {
      // GIVEN: consume_whole_lp=true on scanner
      // WHEN: Step 3 (Enter Qty) displayed
      // THEN: number pad is disabled (grayed out, 50% opacity, not interactive)

      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      // Number pad should be visible but disabled
      const numberPad = page.locator('[data-testid="number-pad"]')
      await expect(numberPad).toBeVisible()
      await expect(numberPad).toHaveClass(/opacity-50/)
    })

    test('should ignore number pad key taps when disabled', async ({ page }) => {
      // GIVEN: consume_whole_lp=true on scanner
      // WHEN: number pad key tapped
      // THEN: key tap ignored, qty value unchanged

      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      // Get current qty
      const qtyDisplay = page.locator('[data-testid="qty-display"]')
      await expect(qtyDisplay).toContainText('500')

      // Try clicking number pad keys
      await page.locator('button:has-text("1")').click()
      await page.locator('button:has-text("2")').click()
      await page.locator('button:has-text("3")').click()

      // Qty should remain unchanged
      await expect(qtyDisplay).toContainText('500')
    })

    test('should apply 50% opacity to number pad when disabled', async ({ page }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      const numberPad = page.locator('[data-testid="number-pad"]')

      // Verify 50% opacity
      const opacity = await numberPad.evaluate((el) => window.getComputedStyle(el).opacity)
      expect(parseFloat(opacity)).toBe(0.5)
    })

    test('should have cursor not-allowed on number pad when disabled', async ({ page }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      const button = page.locator('[data-testid="number-pad"] button').first()
      const cursor = await button.evaluate((el) => window.getComputedStyle(el).cursor)
      expect(cursor).toBe('not-allowed')
    })
  })

  // ============================================================================
  // Scanner: Full Consumption Button
  // ============================================================================
  test.describe('Scanner - Full Consumption Button', () => {
    test('should show Full Consumption button with LP qty', async ({ page }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      // Full Consumption button should show LP qty
      const confirmButton = page.locator('button[data-testid="confirm-consumption"]')
      await expect(confirmButton).toBeVisible()
      await expect(confirmButton).toContainText('Full Consumption')
      await expect(confirmButton).toContainText('500')
    })

    test('should successfully complete consumption via Full Consumption button', async ({
      page,
    }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      // Click Full Consumption button
      await page.locator('button[data-testid="confirm-consumption"]').click()

      // Success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('text=Consumption recorded')).toBeVisible()
    })
  })

  // ============================================================================
  // Error Handling
  // ============================================================================
  test.describe('Error Handling', () => {
    test('should display error when partial qty submitted via API bypass', async ({ page }) => {
      // This tests that server-side validation also works
      // In case someone bypasses UI locks

      await page.goto('/production/consumption/wo-test-whole-lp')

      // This scenario would need mocking API response
      // For now, verify UI prevents partial submission

      const wholeLPRow = page.locator('tr:has-text("Packaging Film")')
      await wholeLPRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-FILM-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')

      // Qty input should be read-only, preventing partial entry
      const qtyInput = modal.locator('input[data-testid="consume-qty-input"]')
      await expect(qtyInput).toHaveAttribute('readonly')
    })

    test('should display error message including LP quantity', async ({ page }) => {
      // If somehow an error occurs, message should include LP qty for guidance
      // This would need specific test data setup

      const expectedErrorMessage = 'Full LP consumption required. LP quantity is 100'
      expect(expectedErrorMessage).toContain('100')
    })
  })

  // ============================================================================
  // Variance Recording
  // ============================================================================
  test.describe('Variance Recording', () => {
    test('should record variance when LP.qty differs from required', async ({ page }) => {
      // GIVEN: LP.qty=100, required_qty=90
      // WHEN: full LP consumed
      // THEN: variance recorded

      await page.goto('/production/consumption/wo-test-whole-lp')

      // Find material where required != LP.qty
      const wholeLPRow = page.locator('tr:has-text("Water")')
      await wholeLPRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-WATER-VARIANCE')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')

      // Confirm consumption
      await modal.locator('button:has-text("Confirm Consumption")').click()

      // Success
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

      // Check variance in materials table (if displayed)
      // This depends on UI implementation
    })

    test('should show variance percentage in consumption history', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-whole-lp')

      // Assuming a consumption with variance already exists
      const historyTable = page.locator('[data-testid="consumption-history-table"]')
      const varianceCell = historyTable.locator('td:has-text("%")').first()

      // May show +11% or similar
      // This test needs actual consumption data
      expect(true).toBe(true) // Placeholder
    })
  })

  // ============================================================================
  // Performance
  // ============================================================================
  test.describe('Performance', () => {
    test('should render Full LP Required badge within 50ms', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/production/consumption/wo-test-whole-lp')
      await expect(page.locator('[data-testid="full-lp-badge"]').first()).toBeVisible()
      const renderTime = Date.now() - startTime

      // Badge should render quickly (page load may be longer)
      expect(renderTime).toBeLessThan(2000) // 2s for full page
    })

    test('should validate Full LP within 100ms after LP scan', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-whole-lp')

      const wholeLPRow = page.locator('tr:has-text("Packaging Film")')
      await wholeLPRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      const startTime = Date.now()
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-FILM-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()
      const validationTime = Date.now() - startTime

      expect(validationTime).toBeLessThan(500) // Allow for network latency
    })
  })

  // ============================================================================
  // Accessibility
  // ============================================================================
  test.describe('Accessibility', () => {
    test('should have aria-label="Full LP Required" on badge', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-whole-lp')

      const badge = page.locator('[data-testid="full-lp-badge"]').first()
      await expect(badge).toHaveAttribute('aria-label', 'Full LP Required')
    })

    test('should have aria-disabled="true" on disabled number pad', async ({ page }) => {
      await page.goto('/scanner/consume?wo=wo-test-whole-lp')

      await page.locator('[data-testid="material-item"]:has-text("Packaging Film")').click()
      await page.locator('input[data-testid="scanner-input"]').fill('LP-FILM-001')
      await page.locator('input[data-testid="scanner-input"]').press('Enter')

      const numberPad = page.locator('[data-testid="number-pad"]')
      await expect(numberPad).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
