/**
 * E2E Tests: Material Consumption Desktop (Story 04.6a)
 *
 * Tests user journeys for material consumption:
 * - Operator consumes material from LP
 * - Manager reverses incorrect consumption
 * - LP validation error handling
 * - Full LP Required behavior
 *
 * RED PHASE - Tests will fail until UI is implemented
 */

import { test, expect } from '@playwright/test'

test.describe('Material Consumption E2E (Story 04.6a)', () => {
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
  // Scenario 1: Operator consumes material from LP
  // ============================================================================
  test.describe('Operator consumes material from LP', () => {
    test('should complete full consumption flow', async ({ page }) => {
      // Step 1: Navigate to consumption page
      await page.goto('/production/consumption/wo-test-001')
      await expect(page.locator('[data-testid="consumption-page"]')).toBeVisible()

      // Step 2: Verify materials table loads
      const materialsTable = page.locator('[data-testid="materials-table"]')
      await expect(materialsTable).toBeVisible()

      // Step 3: Click [+] on Flour material row to open consumption modal
      const flourRow = page.locator('tr:has-text("Flour")')
      await expect(flourRow).toBeVisible()
      const addButton = flourRow.locator('button[data-testid="add-consumption"]')
      await addButton.click()

      // Step 4: Verify consumption modal opens
      const modal = page.locator('[data-testid="consumption-modal"]')
      await expect(modal).toBeVisible()

      // Step 5: Enter LP barcode
      const lpInput = modal.locator('input[data-testid="lp-barcode-input"]')
      await lpInput.fill('LP-2025-08877')
      await lpInput.press('Enter')

      // Step 6: Verify LP validated (green check, details displayed)
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible({
        timeout: 500,
      })
      await expect(modal.locator('[data-testid="lp-details"]')).toBeVisible()
      await expect(modal.locator('text=Available: 100 kg')).toBeVisible()

      // Step 7: Enter quantity
      const qtyInput = modal.locator('input[data-testid="consume-qty-input"]')
      await qtyInput.fill('250')

      // Step 8: Click [Confirm Consumption]
      await modal.locator('button:has-text("Confirm Consumption")').click()

      // Step 9: Verify success toast displays
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('text=Consumption recorded')).toBeVisible()

      // Step 10: Verify MaterialsTable progress updated
      await expect(flourRow.locator('[data-testid="consumed-qty"]')).toContainText('250')

      // Step 11: Verify ConsumptionHistoryTable shows new entry
      const historyTable = page.locator('[data-testid="consumption-history-table"]')
      await expect(historyTable.locator('tr').first()).toContainText('LP-2025-08877')
      await expect(historyTable.locator('tr').first()).toContainText('250')
    })

    test('should show LP available quantity and batch info', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      // Open consumption modal
      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Enter LP barcode
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-2025-08877')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')

      // Verify LP details displayed
      await expect(modal.locator('[data-testid="lp-batch-number"]')).toContainText('BATCH-001')
      await expect(modal.locator('[data-testid="lp-expiry-date"]')).toBeVisible()
      await expect(modal.locator('[data-testid="lp-available-qty"]')).toContainText('100')
    })
  })

  // ============================================================================
  // Scenario 2: Manager reverses incorrect consumption
  // ============================================================================
  test.describe('Manager reverses incorrect consumption', () => {
    test.beforeEach(async ({ page }) => {
      // Re-login as production manager for reversal tests
      await page.goto('/login')
      await page.fill('input[name="email"]', 'production_manager@test.com')
      await page.fill('input[name="password"]', 'password')
      await page.click('button[type="submit"]')
      await page.waitForURL('/dashboard')
    })

    test('should complete reversal flow', async ({ page }) => {
      // Step 1: Navigate to consumption page
      await page.goto('/production/consumption/wo-test-001')

      // Step 2: Find consumption in history table
      const historyTable = page.locator('[data-testid="consumption-history-table"]')
      const consumptionRow = historyTable.locator('tr:has-text("LP-2025-08877")').first()
      await expect(consumptionRow).toBeVisible()

      // Step 3: Click [Rev] button
      const reverseButton = consumptionRow.locator('button[data-testid="reverse-consumption"]')
      await reverseButton.click()

      // Step 4: Verify reversal modal opens
      const modal = page.locator('[data-testid="reversal-modal"]')
      await expect(modal).toBeVisible()

      // Step 5: Select reason
      await modal.locator('select[data-testid="reversal-reason"]').selectOption('wrong_lp')

      // Step 6: Enter notes
      await modal
        .locator('textarea[data-testid="reversal-notes"]')
        .fill('Operator scanned LP-08851 instead of LP-08852')

      // Step 7: Click [Confirm Reversal]
      await modal.locator('button:has-text("Confirm Reversal")').click()

      // Step 8: Verify success toast displays
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('text=Consumption reversed')).toBeVisible()

      // Step 9: Verify consumption status shows 'Reversed'
      await expect(consumptionRow.locator('[data-testid="consumption-status"]')).toContainText(
        'Reversed'
      )

      // Step 10: Verify LP quantity restored (optional - may need separate check)
    })

    test('should show reversal reason options', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      // Find and click reverse button
      const historyTable = page.locator('[data-testid="consumption-history-table"]')
      const consumptionRow = historyTable.locator('tr').first()
      await consumptionRow.locator('button[data-testid="reverse-consumption"]').click()

      // Verify reason dropdown options
      const modal = page.locator('[data-testid="reversal-modal"]')
      const reasonSelect = modal.locator('select[data-testid="reversal-reason"]')

      await expect(reasonSelect.locator('option:has-text("Scanned wrong LP")')).toBeVisible()
      await expect(reasonSelect.locator('option:has-text("Incorrect quantity")')).toBeVisible()
      await expect(reasonSelect.locator('option:has-text("Quality issue")')).toBeVisible()
      await expect(reasonSelect.locator('option:has-text("Other")')).toBeVisible()
    })

    test('should not show reverse button for operators', async ({ page }) => {
      // Re-login as operator
      await page.goto('/login')
      await page.fill('input[name="email"]', 'production_operator@test.com')
      await page.fill('input[name="password"]', 'password')
      await page.click('button[type="submit"]')
      await page.waitForURL('/dashboard')

      await page.goto('/production/consumption/wo-test-001')

      // Verify reverse button is not visible for operators
      const historyTable = page.locator('[data-testid="consumption-history-table"]')
      const consumptionRow = historyTable.locator('tr').first()
      await expect(
        consumptionRow.locator('button[data-testid="reverse-consumption"]')
      ).not.toBeVisible()
    })
  })

  // ============================================================================
  // Scenario 3: Validation error displays when LP product mismatch
  // ============================================================================
  test.describe('Validation error handling', () => {
    test('should display error when LP product mismatches', async ({ page }) => {
      // Step 1: Navigate to consumption page
      await page.goto('/production/consumption/wo-test-001')

      // Step 2: Click [+] on Flour material row
      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Step 3: Enter LP barcode for Water LP (product mismatch)
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-WATER-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')

      // Step 4: Verify error displays within 500ms
      await expect(modal.locator('[data-testid="lp-validation-error"]')).toBeVisible({
        timeout: 500,
      })
      await expect(modal.locator('text=Product mismatch')).toBeVisible()

      // Step 5: Verify LP selection cleared
      await expect(modal.locator('[data-testid="lp-details"]')).not.toBeVisible()
    })

    test('should display error when LP not found', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Enter non-existent LP
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-NOT-EXIST-999')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')

      // Verify error displays
      await expect(modal.locator('[data-testid="lp-validation-error"]')).toBeVisible()
      await expect(modal.locator('text=LP not found')).toBeVisible()
    })

    test('should display error when LP is consumed', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Enter consumed LP
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-CONSUMED-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')

      // Verify error displays
      await expect(modal.locator('[data-testid="lp-validation-error"]')).toBeVisible()
      await expect(modal.locator('text=LP not available')).toBeVisible()
    })

    test('should display error when insufficient quantity', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Enter valid LP
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-2025-08877')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()

      // Enter quantity exceeding available
      await modal.locator('input[data-testid="consume-qty-input"]').fill('9999')
      await modal.locator('button:has-text("Confirm Consumption")').click()

      // Verify error displays
      await expect(modal.locator('[data-testid="qty-validation-error"]')).toBeVisible()
      await expect(modal.locator('text=Insufficient quantity')).toBeVisible()
    })
  })

  // ============================================================================
  // Scenario 4: Full LP Required badge displays for 1:1 materials
  // ============================================================================
  test.describe('Full LP Required behavior', () => {
    test('should display Full LP Required badge for whole LP materials', async ({ page }) => {
      // Step 1: Navigate to consumption page
      await page.goto('/production/consumption/wo-test-001')

      // Step 2: Find material with consume_whole_lp = true
      const wholeLP_Row = page.locator('tr:has-text("Packaging Film")')

      // Step 3: Verify 'Full LP Required' badge with lock icon displays
      await expect(wholeLP_Row.locator('[data-testid="full-lp-badge"]')).toBeVisible()
      await expect(wholeLP_Row.locator('[data-testid="lock-icon"]')).toBeVisible()
    })

    test('should pre-fill and lock quantity for Full LP Required materials', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      // Click [+] to open modal for whole LP material
      const wholeLP_Row = page.locator('tr:has-text("Packaging Film")')
      await wholeLP_Row.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Select LP
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-FILM-001')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()

      // Verify qty input is pre-filled with LP.qty
      const qtyInput = modal.locator('input[data-testid="consume-qty-input"]')
      await expect(qtyInput).toHaveValue('50') // Assuming LP has 50 units

      // Verify qty input is read-only
      await expect(qtyInput).toHaveAttribute('readonly')

      // Verify helper text explains full LP requirement
      await expect(modal.locator('text=Full LP consumption required')).toBeVisible()
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================
  test.describe('Performance', () => {
    test('LP validation should respond within 500ms', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Measure validation time
      const startTime = Date.now()
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-2025-08877')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()
      const validationTime = Date.now() - startTime

      expect(validationTime).toBeLessThan(500)
    })

    test('Consumption recording should complete within 2s', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      const flourRow = page.locator('tr:has-text("Flour")')
      await flourRow.locator('button[data-testid="add-consumption"]').click()

      const modal = page.locator('[data-testid="consumption-modal"]')

      // Select LP and enter quantity
      await modal.locator('input[data-testid="lp-barcode-input"]').fill('LP-2025-08877')
      await modal.locator('input[data-testid="lp-barcode-input"]').press('Enter')
      await expect(modal.locator('[data-testid="lp-validation-success"]')).toBeVisible()
      await modal.locator('input[data-testid="consume-qty-input"]').fill('50')

      // Measure consumption time
      const startTime = Date.now()
      await modal.locator('button:has-text("Confirm Consumption")').click()
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      const consumptionTime = Date.now() - startTime

      expect(consumptionTime).toBeLessThan(2000)
    })

    test('Materials table should load within 1s', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/production/consumption/wo-test-001')
      await expect(page.locator('[data-testid="materials-table"]')).toBeVisible()
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(1000)
    })
  })

  // ============================================================================
  // Navigation Tests
  // ============================================================================
  test.describe('Navigation', () => {
    test('should navigate from WO list to consumption page', async ({ page }) => {
      await page.goto('/production/work-orders')

      // Click on a WO row or consume action
      const woRow = page.locator('tr:has-text("WO-20250120-0001")')
      await woRow.locator('a:has-text("Consume")').click()

      // Verify navigation to consumption page
      await expect(page).toHaveURL(/\/production\/consumption\//)
      await expect(page.locator('[data-testid="consumption-page"]')).toBeVisible()
    })

    test('should show breadcrumb navigation', async ({ page }) => {
      await page.goto('/production/consumption/wo-test-001')

      // Verify breadcrumb
      const breadcrumb = page.locator('[data-testid="breadcrumb"]')
      await expect(breadcrumb.locator('a:has-text("Production")')).toBeVisible()
      await expect(breadcrumb.locator('a:has-text("Work Orders")')).toBeVisible()
      await expect(breadcrumb.locator('text=WO-20250120-0001')).toBeVisible()
    })
  })
})
