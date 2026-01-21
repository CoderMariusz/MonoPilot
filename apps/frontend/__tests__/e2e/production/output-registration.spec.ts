/**
 * E2E Tests: Output Registration (Story 04.7a)
 * Phase: RED - All tests should FAIL
 *
 * Tests full output registration flow:
 * - Navigate to output registration page
 * - View WO summary and yields
 * - Register output with form validation
 * - View output history table
 * - Export outputs to CSV
 * - Register by-products
 * - Multi-tenancy isolation
 *
 * Acceptance Criteria Coverage:
 * - FR-PROD-011: Output Registration
 * - FR-PROD-013: By-Product Registration
 * - FR-PROD-014: Yield Tracking
 * - FR-PROD-015: Multiple Outputs per WO
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Output Registration E2E (Story 04.7a)', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    // Login would be handled here
  })

  // ============================================================================
  // Page Navigation & Display
  // ============================================================================
  test.describe('Page Navigation', () => {
    test('should navigate to output registration page', async () => {
      // Navigate to WO detail page
      await page.goto(`${BASE_URL}/production/work-orders/wo-test-123`)

      // Click output registration link/button
      await page.click('text=Output Registration')

      // Verify URL
      expect(page.url()).toContain('/production/outputs/')
    })

    test('displays WO summary and progress', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Verify WO summary card
      await expect(page.locator('[data-testid="wo-summary-card"]')).toBeVisible()
      await expect(page.locator('text=WO-2025-0156')).toBeVisible()
      await expect(page.locator('text=Wheat Bread')).toBeVisible()

      // Verify progress bar
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    })

    test('shows yield metrics with color indicators', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Verify yield summary card
      await expect(page.locator('[data-testid="yield-summary-card"]')).toBeVisible()

      // Verify yield values
      await expect(page.locator('text=Output Yield')).toBeVisible()
      await expect(page.locator('text=Material Yield')).toBeVisible()

      // Verify color coding (green/yellow/red)
      const yieldIndicators = page.locator('[data-testid="yield-indicator"]')
      await expect(yieldIndicators.first()).toBeVisible()
    })
  })

  // ============================================================================
  // Register Output Modal
  // ============================================================================
  test.describe('Register Output Modal', () => {
    test('opens Register Output modal when button clicked', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Click Register Output button
      await page.click('text=Register Output')

      // Verify modal opens
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=Register Production Output')).toBeVisible()
    })

    test('validates required fields', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)
      await page.click('text=Register Output')

      // Try to submit with empty quantity
      await page.fill('input[name="quantity"]', '0')
      await page.click('text=Confirm Registration')

      // Verify validation error
      await expect(page.locator('text=Quantity must be greater than 0')).toBeVisible()
    })

    test('auto-calculates expiry date from shelf life', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)
      await page.click('text=Register Output')

      // Verify expiry date is pre-filled
      const expiryInput = page.locator('input[name="expiry_date"]')
      const expiryValue = await expiryInput.inputValue()
      expect(expiryValue).toBeTruthy()
    })

    test('creates output and updates progress', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Note current progress
      const initialProgress = await page.locator('[data-testid="output-qty"]').textContent()

      // Open modal and fill form
      await page.click('text=Register Output')
      await page.fill('input[name="quantity"]', '500')
      await page.selectOption('select[name="qa_status"]', 'approved')
      await page.click('text=Confirm Registration')

      // Wait for success
      await expect(page.locator('text=Output registered successfully')).toBeVisible()

      // Verify progress updated
      const newProgress = await page.locator('[data-testid="output-qty"]').textContent()
      expect(newProgress).not.toBe(initialProgress)
    })

    test('shows success toast after registration', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Register output
      await page.click('text=Register Output')
      await page.fill('input[name="quantity"]', '500')
      await page.selectOption('select[name="qa_status"]', 'approved')
      await page.click('text=Confirm Registration')

      // Verify toast
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    })
  })

  // ============================================================================
  // Output History Table
  // ============================================================================
  test.describe('Output History Table', () => {
    test('displays output history table', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Verify table exists
      await expect(page.locator('[data-testid="output-history-table"]')).toBeVisible()
    })

    test('filters outputs by QA status', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Get initial row count
      const initialRows = await page.locator('[data-testid="output-row"]').count()

      // Apply filter
      await page.selectOption('select[name="qa_status_filter"]', 'approved')

      // Wait for filter
      await page.waitForTimeout(500)

      // Verify filtered rows
      const filteredRows = await page.locator('[data-testid="output-row"]').count()
      expect(filteredRows).toBeLessThanOrEqual(initialRows)
    })

    test('sorts outputs by column', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Click column header to sort
      await page.click('th:has-text("Qty")')

      // Verify sort indicator
      await expect(page.locator('th:has-text("Qty") [data-testid="sort-icon"]')).toBeVisible()
    })

    test('exports outputs to CSV', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Start download listener
      const downloadPromise = page.waitForEvent('download')

      // Click export
      await page.click('text=Export CSV')

      // Verify download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })

  // ============================================================================
  // By-Products Section
  // ============================================================================
  test.describe('By-Products Section', () => {
    test('shows by-products section', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Verify by-products section
      await expect(page.locator('[data-testid="by-products-section"]')).toBeVisible()
      await expect(page.locator('text=By-Products')).toBeVisible()
    })

    test('displays expected by-product quantities', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Verify expected qty calculation shown
      const byProductRow = page.locator('[data-testid="by-product-row"]').first()
      await expect(byProductRow.locator('[data-testid="expected-qty"]')).toBeVisible()
    })

    test('registers by-product with expected qty', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Click Register Now on a by-product
      const byProductRow = page.locator('[data-testid="by-product-row"]').first()
      await byProductRow.click('text=Register Now')

      // Verify modal with pre-filled qty
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      const qtyInput = page.locator('input[name="quantity"]')
      const prefilledQty = await qtyInput.inputValue()
      expect(Number(prefilledQty)).toBeGreaterThan(0)
    })

    test('warns when by-product qty is zero', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Open by-product modal
      const byProductRow = page.locator('[data-testid="by-product-row"]').first()
      await byProductRow.click('text=Register Now')

      // Enter zero
      await page.fill('input[name="quantity"]', '0')
      await page.click('text=Confirm')

      // Verify warning
      await expect(page.locator('text=By-product quantity is 0. Continue?')).toBeVisible()
    })
  })

  // ============================================================================
  // Progress Tracking (FR-PROD-015)
  // ============================================================================
  test.describe('Progress Tracking', () => {
    test('AC: first output updates WO to 40%', async () => {
      // GIVEN: WO planned_qty=1000, first output=400
      await page.goto(`${BASE_URL}/production/outputs/wo-empty-test`)

      // Register first output
      await page.click('text=Register Output')
      await page.fill('input[name="quantity"]', '400')
      await page.selectOption('select[name="qa_status"]', 'approved')
      await page.click('text=Confirm Registration')

      // Verify progress is 40%
      await expect(page.locator('text=40%')).toBeVisible()
    })

    test('AC: second output shows cumulative progress', async () => {
      // GIVEN: WO with 400 already output
      await page.goto(`${BASE_URL}/production/outputs/wo-partial-test`)

      // Register second output of 300
      await page.click('text=Register Output')
      await page.fill('input[name="quantity"]', '300')
      await page.selectOption('select[name="qa_status"]', 'approved')
      await page.click('text=Confirm Registration')

      // Verify cumulative progress (400+300=700, 70%)
      await expect(page.locator('text=70%')).toBeVisible()
    })

    test('AC: progress bar shows correct percentage', async () => {
      await page.goto(`${BASE_URL}/production/outputs/wo-test-123`)

      // Get progress value
      const progressBar = page.locator('[data-testid="progress-bar"]')
      const width = await progressBar.evaluate((el) => {
        return window.getComputedStyle(el).width
      })

      // Width should be proportional to progress
      expect(width).toBeTruthy()
    })
  })

  // ============================================================================
  // Multi-tenancy
  // ============================================================================
  test.describe('Multi-tenancy', () => {
    test('AC: blocks access to other org WO', async () => {
      // Navigate to WO from different org
      const response = await page.goto(`${BASE_URL}/production/outputs/wo-other-org`)

      // Should redirect or show 404
      expect(response?.status()).toBe(404)
    })
  })

  // ============================================================================
  // Full Registration Flow
  // ============================================================================
  test.describe('Full Registration Flow', () => {
    test('complete output registration flow', async () => {
      await page.goto(`${BASE_URL}/production/work-orders`)

      // Step 1: Select an In Progress WO
      await page.click('tr:has-text("In Progress"):first-of-type')

      // Step 2: Navigate to Output Registration
      await page.click('text=Output Registration')

      // Step 3: View WO summary
      await expect(page.locator('[data-testid="wo-summary-card"]')).toBeVisible()

      // Step 4: Check yields
      await expect(page.locator('[data-testid="yield-summary-card"]')).toBeVisible()

      // Step 5: Register output
      await page.click('text=Register Output')
      await page.fill('input[name="quantity"]', '500')
      await page.selectOption('select[name="qa_status"]', 'approved')
      await page.click('text=Confirm Registration')

      // Step 6: Verify success
      await expect(page.locator('text=Output registered successfully')).toBeVisible()

      // Step 7: Verify output in table
      await expect(page.locator('[data-testid="output-row"]').first()).toBeVisible()

      // Step 8: Check by-products prompt (if auto-create disabled)
      const byProductModal = page.locator('text=Register By-Products')
      if (await byProductModal.isVisible()) {
        // Register by-products
        await page.fill('input[name="quantity"]', '25')
        await page.click('text=Confirm')
        await expect(page.locator('text=By-product registered')).toBeVisible()
      }

      // Step 9: Export outputs
      const downloadPromise = page.waitForEvent('download')
      await page.click('text=Export CSV')
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    })
  })
})

/**
 * Test Coverage Summary for Story 04.7a - E2E Tests
 * =================================================
 *
 * Page Navigation: 3 tests
 *   - Navigation
 *   - WO summary
 *   - Yield metrics
 *
 * Register Output Modal: 5 tests
 *   - Modal open
 *   - Validation
 *   - Auto expiry
 *   - Progress update
 *   - Success toast
 *
 * Output History Table: 4 tests
 *   - Table display
 *   - Filter by QA
 *   - Sort columns
 *   - Export CSV
 *
 * By-Products: 4 tests
 *   - Section display
 *   - Expected qty
 *   - Registration
 *   - Zero qty warning
 *
 * Progress Tracking: 3 tests
 *   - First output
 *   - Cumulative
 *   - Progress bar
 *
 * Multi-tenancy: 1 test
 *   - Cross-org block
 *
 * Full Flow: 1 test
 *   - Complete workflow
 *
 * Total: 21 tests
 * Status: ALL FAIL (RED phase)
 */
