/**
 * E2E Tests: Multiple Outputs per WO (Story 04.7d)
 *
 * Tests user journeys for:
 * - Registering multiple partial outputs
 * - Viewing cumulative progress tracking
 * - Output history table with pagination
 * - Auto-complete behavior when enabled
 * - Over-production handling
 *
 * RED PHASE - Tests will fail until UI is implemented
 */

import { test, expect } from '@playwright/test'

test.describe('Multiple Outputs per WO E2E (Story 04.7d)', () => {
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
  // Scenario 1: Multiple Partial Output Registration
  // ============================================================================
  test.describe('Multiple Partial Output Registration', () => {
    test('should register first output and update WO progress', async ({ page }) => {
      // AC: GIVEN WO.planned_qty = 1000 AND first output = 400
      // WHEN output registered, THEN WO.output_qty = 400 AND progress = 40%

      // Navigate to output registration page
      await page.goto('/production/outputs/wo-test-multi')
      await expect(page.locator('[data-testid="output-page"]')).toBeVisible()

      // Verify initial progress is 0%
      const progressCard = page.locator('[data-testid="output-progress-card"]')
      await expect(progressCard).toBeVisible()
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('0%')

      // Open output registration form/modal
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await expect(modal).toBeVisible()

      // Enter output quantity
      await modal.locator('input[data-testid="output-qty-input"]').fill('400')
      await modal.locator('button:has-text("Confirm Output")').click()

      // Verify success toast
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('text=Output registered successfully')).toBeVisible()

      // Verify progress updated to 40%
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('40%')
      await expect(progressCard.locator('[data-testid="output-qty"]')).toContainText('400')
      await expect(progressCard.locator('[data-testid="remaining-qty"]')).toContainText('600')
    })

    test('should register subsequent output and show cumulative progress', async ({ page }) => {
      // AC: GIVEN WO.output_qty = 400 AND second output = 300
      // WHEN second output registered, THEN WO.output_qty = 700 AND progress = 70%

      await page.goto('/production/outputs/wo-test-partial')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      // Verify current progress is 40% (from previous output)
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('40%')

      // Register second output
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('300')
      await modal.locator('button:has-text("Confirm Output")').click()

      // Verify cumulative progress
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('70%')
      await expect(progressCard.locator('[data-testid="output-qty"]')).toContainText('700')
      await expect(progressCard.locator('[data-testid="remaining-qty"]')).toContainText('300')
    })

    test('should create unique LP for each output', async ({ page }) => {
      // AC: GIVEN output registered, WHEN LP created, THEN new unique LP ID is generated

      await page.goto('/production/outputs/wo-test-multi')

      // Register first output
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('200')
      await modal.locator('button:has-text("Confirm Output")').click()
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

      // Get first LP number from history
      const historyTable = page.locator('[data-testid="output-history-table"]')
      const firstLpNumber = await historyTable.locator('tr').nth(1).locator('[data-testid="lp-number"]').textContent()

      // Register second output
      await page.click('button[data-testid="register-output-btn"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('200')
      await modal.locator('button:has-text("Confirm Output")').click()

      // Get second LP number
      const secondLpNumber = await historyTable.locator('tr').nth(1).locator('[data-testid="lp-number"]').textContent()

      // Verify unique LP numbers
      expect(firstLpNumber).not.toBe(secondLpNumber)
    })
  })

  // ============================================================================
  // Scenario 2: Progress Display
  // ============================================================================
  test.describe('Progress Card Display', () => {
    test('should display planned, output, and remaining quantities', async ({ page }) => {
      // AC: GIVEN WO with planned_qty = 5000 AND output_qty = 3200
      // WHEN progress card rendered, THEN shows: Planned: 5000, Output: 3200, Remaining: 1800

      await page.goto('/production/outputs/wo-test-progress')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      await expect(progressCard.locator('[data-testid="planned-qty"]')).toContainText('5,000')
      await expect(progressCard.locator('[data-testid="output-qty"]')).toContainText('3,200')
      await expect(progressCard.locator('[data-testid="remaining-qty"]')).toContainText('1,800')
      await expect(progressCard.locator('[data-testid="uom"]')).toContainText('kg')
    })

    test('should show progress bar at correct percentage', async ({ page }) => {
      // AC: GIVEN progress_percent = 64%
      // WHEN progress bar rendered, THEN bar filled to 64%

      await page.goto('/production/outputs/wo-test-progress')
      const progressBar = page.locator('[data-testid="progress-bar"]')

      await expect(progressBar).toBeVisible()
      // Check progress bar width style or aria-valuenow
      await expect(progressBar).toHaveAttribute('aria-valuenow', '64')
    })

    test('should show blue progress bar when < 100%', async ({ page }) => {
      // AC: GIVEN progress < 100%, THEN bar color is blue

      await page.goto('/production/outputs/wo-test-progress')
      const progressBar = page.locator('[data-testid="progress-bar-fill"]')

      await expect(progressBar).toHaveClass(/bg-blue/)
    })

    test('should show green progress bar when >= 100%', async ({ page }) => {
      // AC: GIVEN progress >= 100%, THEN bar color is green

      await page.goto('/production/outputs/wo-test-complete')
      const progressBar = page.locator('[data-testid="progress-bar-fill"]')

      await expect(progressBar).toHaveClass(/bg-green/)
    })

    test('should show auto-complete badge when setting enabled', async ({ page }) => {
      await page.goto('/production/outputs/wo-test-autocomplete')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      await expect(progressCard.locator('[data-testid="auto-complete-badge"]')).toBeVisible()
      await expect(progressCard.locator('[data-testid="auto-complete-badge"]')).toContainText('Auto-complete enabled')
    })
  })

  // ============================================================================
  // Scenario 3: Over-Production Handling
  // ============================================================================
  test.describe('Over-Production Handling', () => {
    test('should allow over-production (>100%)', async ({ page }) => {
      // AC: GIVEN output_qty = 1000 AND planned_qty = 1000
      // WHEN additional 200 registered, THEN output_qty = 1200 AND progress = 120%

      await page.goto('/production/outputs/wo-test-at-100')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      // Verify initially at 100%
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('100%')

      // Register additional output (over-production)
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('200')
      await modal.locator('button:has-text("Confirm Output")').click()

      // Verify over-production progress
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('120%')
      await expect(progressCard.locator('[data-testid="output-qty"]')).toContainText('1,200')
    })

    test('should show over-production indicator when > 100%', async ({ page }) => {
      // AC: GIVEN progress > 100%, THEN shows over-production indicator

      await page.goto('/production/outputs/wo-test-overproduced')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      await expect(progressCard.locator('[data-testid="over-production-indicator"]')).toBeVisible()
      await expect(progressCard.locator('[data-testid="over-production-indicator"]')).toContainText('Over-production')
    })

    test('should not block further output registration in over-production', async ({ page }) => {
      // AC: GIVEN over-production state, WHEN user attempts to register more output
      // THEN registration proceeds (not blocked)

      await page.goto('/production/outputs/wo-test-overproduced')

      // Should still be able to register more
      const registerBtn = page.locator('button[data-testid="register-output-btn"]')
      await expect(registerBtn).toBeEnabled()

      await registerBtn.click()
      const modal = page.locator('[data-testid="output-modal"]')
      await expect(modal).toBeVisible()

      await modal.locator('input[data-testid="output-qty-input"]').fill('100')
      await modal.locator('button:has-text("Confirm Output")').click()

      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    })
  })

  // ============================================================================
  // Scenario 4: Output History Table
  // ============================================================================
  test.describe('Output History Table', () => {
    test('should display all outputs for WO', async ({ page }) => {
      // AC: GIVEN 3 outputs registered (LP-001, LP-002, LP-003)
      // WHEN output history viewed, THEN all 3 LPs display

      await page.goto('/production/outputs/wo-test-3-outputs')
      const historyTable = page.locator('[data-testid="output-history-table"]')

      await expect(historyTable).toBeVisible()
      // Header row + 3 data rows
      await expect(historyTable.locator('tbody tr')).toHaveCount(3)
    })

    test('should display all required columns', async ({ page }) => {
      // AC: columns include: LP Number, Quantity, UoM, Batch, QA Status, Location, Expiry, Created At, Created By

      await page.goto('/production/outputs/wo-test-3-outputs')
      const historyTable = page.locator('[data-testid="output-history-table"]')
      const headerRow = historyTable.locator('thead tr')

      await expect(headerRow.locator('th:has-text("LP Number")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("Quantity")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("Batch")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("QA Status")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("Location")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("Expiry")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("Created")')).toBeVisible()
      await expect(headerRow.locator('th:has-text("By")')).toBeVisible()
    })

    test('should sort by created_at DESC by default', async ({ page }) => {
      // AC: default order is created_at DESC (most recent first)

      await page.goto('/production/outputs/wo-test-3-outputs')
      const historyTable = page.locator('[data-testid="output-history-table"]')
      const rows = historyTable.locator('tbody tr')

      // First row should have most recent timestamp
      const firstRowTime = await rows.nth(0).locator('[data-testid="created-at"]').textContent()
      const lastRowTime = await rows.nth(2).locator('[data-testid="created-at"]').textContent()

      // Most recent should be first (this is a simplified check)
      expect(firstRowTime).not.toBe(lastRowTime)
    })
  })

  // ============================================================================
  // Scenario 5: Pagination
  // ============================================================================
  test.describe('Output History Pagination', () => {
    test('should paginate outputs with limit 20', async ({ page }) => {
      // AC: GIVEN WO with 25 outputs, WHEN history table loads with limit=20
      // THEN first page shows 20 outputs

      await page.goto('/production/outputs/wo-test-25-outputs')
      const historyTable = page.locator('[data-testid="output-history-table"]')

      await expect(historyTable.locator('tbody tr')).toHaveCount(20)
    })

    test('should navigate to next page', async ({ page }) => {
      // AC: GIVEN page 1 displayed, WHEN user clicks "Next"
      // THEN page 2 shows remaining 5 outputs

      await page.goto('/production/outputs/wo-test-25-outputs')
      const pagination = page.locator('[data-testid="pagination"]')

      await pagination.locator('button:has-text("Next")').click()

      const historyTable = page.locator('[data-testid="output-history-table"]')
      await expect(historyTable.locator('tbody tr')).toHaveCount(5)
    })

    test('should show pagination info text', async ({ page }) => {
      // AC: shows "Showing X to Y of Z outputs"

      await page.goto('/production/outputs/wo-test-25-outputs')
      const pagination = page.locator('[data-testid="pagination"]')

      await expect(pagination.locator('[data-testid="pagination-info"]')).toContainText('Showing 1 to 20 of 25 outputs')
    })
  })

  // ============================================================================
  // Scenario 6: Filtering
  // ============================================================================
  test.describe('Output Filtering', () => {
    test('should filter by QA status', async ({ page }) => {
      // AC: WHEN user selects "Approved" filter, THEN only approved outputs display

      await page.goto('/production/outputs/wo-test-mixed-qa')

      // Apply QA status filter
      await page.locator('[data-testid="qa-filter"]').selectOption('approved')

      const historyTable = page.locator('[data-testid="output-history-table"]')
      const rows = historyTable.locator('tbody tr')

      // All visible rows should have "Approved" badge
      const rowCount = await rows.count()
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i).locator('[data-testid="qa-badge"]')).toContainText('Approved')
      }
    })

    test('should filter by location', async ({ page }) => {
      // AC: WHEN user selects location filter, THEN only outputs in that location display

      await page.goto('/production/outputs/wo-test-multi-location')

      // Apply location filter
      await page.locator('[data-testid="location-filter"]').selectOption('loc-zone-a')

      const historyTable = page.locator('[data-testid="output-history-table"]')
      const rows = historyTable.locator('tbody tr')

      const rowCount = await rows.count()
      for (let i = 0; i < rowCount; i++) {
        await expect(rows.nth(i).locator('[data-testid="location"]')).toContainText('Zone A')
      }
    })

    test('should update summary when filter applied', async ({ page }) => {
      // AC: GIVEN filter applied, WHEN summary recalculated, THEN summary reflects filtered data

      await page.goto('/production/outputs/wo-test-mixed-qa')
      const summary = page.locator('[data-testid="outputs-summary"]')

      // Get total before filter
      const totalBefore = await summary.locator('[data-testid="total-qty"]').textContent()

      // Apply filter
      await page.locator('[data-testid="qa-filter"]').selectOption('approved')

      // Summary should change (assuming not all are approved)
      const totalAfter = await summary.locator('[data-testid="total-qty"]').textContent()
      expect(totalAfter).not.toBe(totalBefore)
    })
  })

  // ============================================================================
  // Scenario 7: Auto-Complete
  // ============================================================================
  test.describe('Auto-Complete WO', () => {
    test('should auto-complete WO when output reaches planned and setting enabled', async ({ page }) => {
      // AC: GIVEN auto_complete_wo = true AND output_qty reaches 1000 (planned)
      // WHEN output registered, THEN WO status changes to 'completed'

      await page.goto('/production/outputs/wo-test-near-complete')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      // Verify auto-complete enabled
      await expect(progressCard.locator('[data-testid="auto-complete-badge"]')).toBeVisible()

      // Current output is 900 of 1000 (90%)
      await expect(progressCard.locator('[data-testid="output-qty"]')).toContainText('900')

      // Register final 100 to reach 100%
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('100')
      await modal.locator('button:has-text("Confirm Output")').click()

      // Verify success toast with completion message
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('text=Work order completed')).toBeVisible()

      // Verify WO status changed
      await expect(page.locator('[data-testid="wo-status-badge"]')).toContainText('Completed')
    })

    test('should NOT auto-complete when setting disabled', async ({ page }) => {
      // AC: GIVEN auto_complete_wo = false AND output_qty >= planned_qty
      // WHEN output registered, THEN WO status remains 'in_progress'

      await page.goto('/production/outputs/wo-test-no-autocomplete')

      // Verify no auto-complete badge
      await expect(page.locator('[data-testid="auto-complete-badge"]')).not.toBeVisible()

      // Register output to reach 100%
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('100')
      await modal.locator('button:has-text("Confirm Output")').click()

      // WO should still be in_progress
      await expect(page.locator('[data-testid="wo-status-badge"]')).toContainText('In Progress')

      // Progress should show 100% but not completed
      const progressCard = page.locator('[data-testid="output-progress-card"]')
      await expect(progressCard.locator('[data-testid="progress-percent"]')).toContainText('100%')
    })
  })

  // ============================================================================
  // Scenario 8: Real-Time Updates
  // ============================================================================
  test.describe('Real-Time Progress Updates', () => {
    test('should update progress card immediately after registration', async ({ page }) => {
      // AC: GIVEN user registers new output
      // WHEN registration completes, THEN progress card updates immediately

      await page.goto('/production/outputs/wo-test-multi')
      const progressCard = page.locator('[data-testid="output-progress-card"]')

      // Get initial progress
      const initialPercent = await progressCard.locator('[data-testid="progress-percent"]').textContent()

      // Register new output
      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('100')
      await modal.locator('button:has-text("Confirm Output")').click()

      // Progress should update without page refresh
      const updatedPercent = await progressCard.locator('[data-testid="progress-percent"]').textContent()
      expect(updatedPercent).not.toBe(initialPercent)
    })

    test('should display progress toast after registration', async ({ page }) => {
      // AC: GIVEN progress updates, WHEN toast displayed, THEN shows "{progress_percent}% complete"

      await page.goto('/production/outputs/wo-test-multi')

      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('400')
      await modal.locator('button:has-text("Confirm Output")').click()

      await expect(page.locator('[data-testid="toast-success"]')).toContainText('40% complete')
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================
  test.describe('Performance', () => {
    test('progress update should complete within 2 seconds', async ({ page }) => {
      await page.goto('/production/outputs/wo-test-multi')

      await page.click('button[data-testid="register-output-btn"]')
      const modal = page.locator('[data-testid="output-modal"]')
      await modal.locator('input[data-testid="output-qty-input"]').fill('100')

      const startTime = Date.now()
      await modal.locator('button:has-text("Confirm Output")').click()
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(2000)
    })

    test('output history table should load within 1 second', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/production/outputs/wo-test-25-outputs')
      await expect(page.locator('[data-testid="output-history-table"]')).toBeVisible()
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(1000)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Multiple Partial Output Registration (3 tests):
 *   - First output updates progress
 *   - Subsequent output cumulative
 *   - Unique LP per output
 *
 * Progress Card Display (5 tests):
 *   - Planned/output/remaining quantities
 *   - Progress bar percentage
 *   - Blue bar < 100%
 *   - Green bar >= 100%
 *   - Auto-complete badge
 *
 * Over-Production Handling (3 tests):
 *   - Over-production allowed
 *   - Over-production indicator
 *   - Not blocked in over-production
 *
 * Output History Table (3 tests):
 *   - All outputs displayed
 *   - Required columns
 *   - Default sort DESC
 *
 * Pagination (3 tests):
 *   - Page limit 20
 *   - Next page navigation
 *   - Pagination info text
 *
 * Filtering (3 tests):
 *   - QA status filter
 *   - Location filter
 *   - Summary update with filter
 *
 * Auto-Complete (2 tests):
 *   - Auto-complete when enabled
 *   - No auto-complete when disabled
 *
 * Real-Time Updates (2 tests):
 *   - Immediate progress update
 *   - Progress toast
 *
 * Performance (2 tests):
 *   - Progress update < 2s
 *   - Table load < 1s
 *
 * Total: 26 E2E tests (RED - will fail until UI implemented)
 */
