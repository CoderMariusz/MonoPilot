/**
 * E2E Tests: Story 04.6e - Over-Consumption Control
 * Tests the over-consumption approval workflow end-to-end
 *
 * Covers:
 * - Over-consumption detection and modal display
 * - Approval workflow (Operator request, Manager approve/reject)
 * - Variance indicator display and color coding
 * - Dashboard high variance alerts
 * - Settings integration (allow_over_consumption toggle)
 *
 * RED PHASE: All tests should FAIL until feature is implemented.
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Test Fixtures
 */
const TEST_WO_NUMBER = 'WO-E2E-TEST-001'
const TEST_MATERIAL = 'RM-FLOUR-01'
const TEST_LP_NUMBER = 'LP-E2E-TEST-001'

/**
 * Helper: Login as specific role
 */
async function loginAs(page: Page, role: 'operator' | 'manager' | 'admin') {
  const emails: Record<string, string> = {
    operator: 'operator@test.com',
    manager: 'manager@test.com',
    admin: 'admin@test.com',
  }

  await page.goto('/login')
  await page.fill('input[name="email"]', emails[role])
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**')
}

/**
 * Helper: Navigate to WO consumption page
 */
async function navigateToConsumption(page: Page, woId: string = 'test-wo-id') {
  await page.goto(`/production/consumption/${woId}`)
  await page.waitForSelector('[data-testid="materials-table"]')
}

/**
 * Helper: Trigger over-consumption scenario
 */
async function triggerOverConsumption(page: Page) {
  // Select material that's already at 100% consumption
  await page.click('[data-testid="material-row-0"]')

  // Enter LP number
  await page.fill('[data-testid="lp-input"]', TEST_LP_NUMBER)
  await page.keyboard.press('Enter')
  await page.waitForSelector('[data-testid="lp-details"]')

  // Enter quantity that exceeds BOM requirement
  await page.fill('[data-testid="qty-input"]', '10')

  // Click consume - should trigger over-consumption detection
  await page.click('[data-testid="consume-button"]')
}

test.describe('Story 04.6e: Over-Consumption Control', () => {
  // ============================================================================
  // Over-Consumption Detection
  // ============================================================================
  test.describe('Over-Consumption Detection', () => {
    test.describe('When allow_over_consumption = false', () => {
      test.beforeEach(async ({ page }) => {
        await loginAs(page, 'operator')
        // Ensure setting is OFF
        await page.evaluate(async () => {
          await fetch('/api/production/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              allow_over_consumption: false,
            }),
          })
        })
      })

      test('should show approval modal when over-consumption detected', async ({ page }) => {
        await navigateToConsumption(page)
        await triggerOverConsumption(page)

        // Modal should appear
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText(/over-consumption approval required/i)).toBeVisible()
      })

      test('should display over-consumption summary in modal', async ({ page }) => {
        await navigateToConsumption(page)
        await triggerOverConsumption(page)

        // Check summary content
        await expect(page.getByText(/bom requirement/i)).toBeVisible()
        await expect(page.getByText(/already consumed/i)).toBeVisible()
        await expect(page.getByText(/attempting/i)).toBeVisible()
        await expect(page.getByText(/total after/i)).toBeVisible()
        await expect(page.getByText(/over-consumption/i)).toBeVisible()
      })

      test('should show "Awaiting manager approval" status for operator', async ({ page }) => {
        await navigateToConsumption(page)
        await triggerOverConsumption(page)

        // Submit approval request
        await page.click('[data-testid="request-approval-button"]')

        // Should show pending status
        await expect(page.getByText(/awaiting manager approval/i)).toBeVisible()
        await expect(page.getByTestId('clock-icon')).toBeVisible()
      })

      test('should generate request_id and set status to pending', async ({ page }) => {
        await navigateToConsumption(page)
        await triggerOverConsumption(page)

        // Submit request
        await page.click('[data-testid="request-approval-button"]')

        // Should show request ID
        await expect(page.getByTestId('request-id')).toBeVisible()
        await expect(page.getByText(/pending/i)).toBeVisible()
      })
    })

    test.describe('When allow_over_consumption = true', () => {
      test.beforeEach(async ({ page }) => {
        await loginAs(page, 'operator')
        // Enable over-consumption
        await page.evaluate(async () => {
          await fetch('/api/production/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              allow_over_consumption: true,
            }),
          })
        })
      })

      test('should proceed directly with variance tracking', async ({ page }) => {
        await navigateToConsumption(page)
        await triggerOverConsumption(page)

        // No modal should appear, consumption should proceed
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 })

        // Success toast should show
        await expect(page.getByText(/consumption recorded/i)).toBeVisible()
      })

      test('should show variance percentage in materials table', async ({ page }) => {
        await navigateToConsumption(page)
        await triggerOverConsumption(page)

        // Wait for page refresh
        await page.waitForTimeout(1000)

        // Variance should be displayed
        await expect(page.getByTestId('variance-indicator')).toBeVisible()
        await expect(page.getByText(/\+10%/)).toBeVisible()
      })
    })
  })

  // ============================================================================
  // Variance Indicator Display
  // ============================================================================
  test.describe('Variance Indicator Display', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'operator')
    })

    test('should show green indicator for 0% variance (exact match)', async ({ page }) => {
      await navigateToConsumption(page)

      // Find material with exact match
      const exactMatchRow = page.locator('[data-testid="material-row"]').filter({
        has: page.locator('[data-testid="variance-indicator"][data-status="exact"]'),
      })

      await expect(exactMatchRow.getByText('0%')).toBeVisible()
      await expect(exactMatchRow.locator('[data-testid="variance-indicator"]')).toHaveClass(/text-green/)
    })

    test('should show yellow indicator for 5% variance (acceptable)', async ({ page }) => {
      await navigateToConsumption(page)

      // Find material with acceptable variance
      const acceptableRow = page.locator('[data-testid="material-row"]').filter({
        has: page.locator('[data-testid="variance-indicator"][data-status="acceptable"]'),
      })

      await expect(acceptableRow.locator('[data-testid="variance-indicator"]')).toHaveClass(/text-yellow/)
    })

    test('should show red indicator for >10% variance (high)', async ({ page }) => {
      await navigateToConsumption(page)

      // Find material with high variance
      const highVarianceRow = page.locator('[data-testid="material-row"]').filter({
        has: page.locator('[data-testid="variance-indicator"][data-status="high"]'),
      })

      await expect(highVarianceRow.locator('[data-testid="variance-indicator"]')).toHaveClass(/text-red/)
    })

    test('should display correct icon for each variance level', async ({ page }) => {
      await navigateToConsumption(page)

      // Exact: CheckCircle
      await expect(page.locator('[data-status="exact"] [data-icon="check-circle"]')).toBeVisible()

      // Acceptable: AlertTriangle
      await expect(page.locator('[data-status="acceptable"] [data-icon="alert-triangle"]')).toBeVisible()

      // High: XCircle
      await expect(page.locator('[data-status="high"] [data-icon="x-circle"]')).toBeVisible()
    })
  })

  // ============================================================================
  // Manager Approval Workflow
  // ============================================================================
  test.describe('Manager Approval Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'manager')
    })

    test('should display Approve and Reject buttons for manager', async ({ page }) => {
      await page.goto('/production/approvals')
      await page.waitForSelector('[data-testid="pending-approvals-list"]')

      // Click on a pending approval
      await page.click('[data-testid="pending-approval-0"]')

      // Buttons should be visible
      await expect(page.getByRole('button', { name: /approve/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /reject/i })).toBeVisible()
    })

    test.describe('Approve Over-Consumption', () => {
      test('should show optional reason input on approve', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await expect(page.getByLabel(/reason for approval/i)).toBeVisible()
        await expect(page.getByText(/optional/i)).toBeVisible()
      })

      test('should approve without reason', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await page.click('button:has-text("Approve")')

        await expect(page.getByText(/approval successful/i)).toBeVisible()
      })

      test('should approve with reason', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await page.fill(
          '[data-testid="approval-reason-input"]',
          'Additional material needed due to higher moisture content'
        )
        await page.click('button:has-text("Approve")')

        await expect(page.getByText(/approval successful/i)).toBeVisible()
      })

      test('should decrease LP quantity after approval', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        // Note the LP number
        const lpNumber = await page.getByTestId('approval-lp-number').textContent()

        await page.click('button:has-text("Approve")')
        await page.waitForSelector('text=approval successful', { timeout: 5000 })

        // Navigate to LP detail
        await page.goto(`/warehouse/license-plates?search=${lpNumber}`)
        await page.click(`text=${lpNumber}`)

        // LP quantity should be reduced
        const qtyText = await page.getByTestId('lp-current-qty').textContent()
        expect(parseFloat(qtyText || '0')).toBeLessThan(100)
      })

      test('should create consumption record linked to approval', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')
        const requestId = await page.getByTestId('request-id').textContent()

        await page.click('button:has-text("Approve")')

        // Navigate to consumption history
        await page.goto('/production/consumption/test-wo-id/history')

        // Find consumption with approval link
        await expect(page.locator(`[data-approval-id="${requestId}"]`)).toBeVisible()
      })
    })

    test.describe('Reject Over-Consumption', () => {
      test('should show required reason input on reject', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await page.click('button:has-text("Reject")')

        await expect(page.getByLabel(/rejection reason/i)).toBeVisible()
        // Should be marked required
        await expect(page.locator('label:has-text("Rejection Reason")')).toHaveClass(/required/)
      })

      test('should show validation error when rejecting without reason', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await page.click('button:has-text("Reject")')
        await page.click('button:has-text("Confirm Reject")')

        await expect(page.getByText(/rejection reason is required/i)).toBeVisible()
      })

      test('should reject with reason', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await page.click('button:has-text("Reject")')
        await page.fill('[data-testid="rejection-reason-input"]', 'Investigate waste')
        await page.click('button:has-text("Confirm Reject")')

        await expect(page.getByText(/request rejected/i)).toBeVisible()
      })

      test('should block consumption on rejection', async ({ page }) => {
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')

        await page.click('button:has-text("Reject")')
        await page.fill('[data-testid="rejection-reason-input"]', 'Investigate waste')
        await page.click('button:has-text("Confirm Reject")')

        // No consumption record should be created
        await page.goto('/production/consumption/test-wo-id/history')
        await expect(page.getByTestId('no-consumption-message')).toBeVisible()
      })

      test('should display rejection details to operator', async ({ page }) => {
        // Manager rejects
        await page.goto('/production/approvals')
        await page.click('[data-testid="pending-approval-0"]')
        await page.click('button:has-text("Reject")')
        await page.fill('[data-testid="rejection-reason-input"]', 'Investigate waste')
        await page.click('button:has-text("Confirm Reject")')

        // Switch to operator
        await loginAs(page, 'operator')
        await navigateToConsumption(page)

        // View the rejected request
        await page.click('[data-testid="view-rejection-details"]')

        await expect(page.getByText('Investigate waste')).toBeVisible()
        await expect(page.getByText(/rejected by/i)).toBeVisible()
      })
    })
  })

  // ============================================================================
  // Permission Enforcement
  // ============================================================================
  test.describe('Permission Enforcement', () => {
    test('should hide approve/reject buttons for Operator', async ({ page }) => {
      await loginAs(page, 'operator')
      await navigateToConsumption(page)
      await triggerOverConsumption(page)

      // Operator should NOT see approve/reject
      await expect(page.getByRole('button', { name: /approve/i })).not.toBeVisible()
      await expect(page.getByRole('button', { name: /reject/i })).not.toBeVisible()
    })

    test('should return 403 when Operator attempts API approval', async ({ page }) => {
      await loginAs(page, 'operator')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/production/work-orders/wo-123/over-consumption/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: 'req-123' }),
        })
        return { status: res.status }
      })

      expect(response.status).toBe(403)
    })

    test('should show approve/reject buttons for Admin', async ({ page }) => {
      await loginAs(page, 'admin')
      await page.goto('/production/approvals')
      await page.click('[data-testid="pending-approval-0"]')

      await expect(page.getByRole('button', { name: /approve/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /reject/i })).toBeVisible()
    })
  })

  // ============================================================================
  // Pending Request Handling
  // ============================================================================
  test.describe('Pending Request Handling', () => {
    test('should show error when creating duplicate pending request', async ({ page }) => {
      await loginAs(page, 'operator')
      await navigateToConsumption(page)

      // First request
      await triggerOverConsumption(page)
      await page.click('[data-testid="request-approval-button"]')
      await page.waitForSelector('text=awaiting manager approval')

      // Close modal
      await page.click('button:has-text("Close")')

      // Try to create another request for same material
      await triggerOverConsumption(page)

      await expect(page.getByText(/pending approval request already exists/i)).toBeVisible()
    })

    test('should allow cancel and create new request', async ({ page }) => {
      await loginAs(page, 'operator')
      await navigateToConsumption(page)

      // Create request
      await triggerOverConsumption(page)
      await page.click('[data-testid="request-approval-button"]')

      // Cancel request
      await page.click('[data-testid="cancel-request-button"]')
      await expect(page.getByText(/request cancelled/i)).toBeVisible()

      // Should be able to create new request
      await triggerOverConsumption(page)
      await expect(page.getByRole('button', { name: /request approval/i })).toBeEnabled()
    })
  })

  // ============================================================================
  // Dashboard High Variance Alert
  // ============================================================================
  test.describe('Dashboard High Variance Alert', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'manager')
    })

    test('should flag WO with >10% variance on dashboard', async ({ page }) => {
      await page.goto('/production/dashboard')
      await page.waitForSelector('[data-testid="dashboard-alerts"]')

      // High variance section should exist
      await expect(page.getByText(/high variance/i)).toBeVisible()

      // Should list WOs with high variance
      const highVarianceList = page.locator('[data-testid="high-variance-wos"]')
      await expect(highVarianceList).toBeVisible()
    })

    test('should show variance percentage in alert', async ({ page }) => {
      await page.goto('/production/dashboard')
      await page.waitForSelector('[data-testid="high-variance-wos"]')

      // Should show actual variance
      await expect(page.locator('[data-testid="high-variance-wos"] text=/\\+\\d+%/')).toBeVisible()
    })

    test('should navigate to WO detail from alert', async ({ page }) => {
      await page.goto('/production/dashboard')
      await page.waitForSelector('[data-testid="high-variance-wos"]')

      // Click on WO in high variance list
      await page.click('[data-testid="high-variance-wo-0"]')

      // Should navigate to WO detail
      await expect(page).toHaveURL(/\/production\/work-orders\//)
    })
  })

  // ============================================================================
  // Multi-tenancy
  // ============================================================================
  test.describe('Multi-tenancy', () => {
    test('should only show approvals from own organization', async ({ page }) => {
      await loginAs(page, 'manager')
      await page.goto('/production/approvals')

      // All visible approvals should be from same org
      const approvals = await page.locator('[data-testid="pending-approval"]').all()

      for (const approval of approvals) {
        const orgId = await approval.getAttribute('data-org-id')
        expect(orgId).toBe('test-org-id')
      }
    })

    test('should return 404 when accessing other org approval', async ({ page }) => {
      await loginAs(page, 'manager')

      const response = await page.evaluate(async () => {
        const res = await fetch('/api/production/work-orders/other-org-wo/over-consumption/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: 'other-org-req' }),
        })
        return { status: res.status }
      })

      // Should be 404 (not 403 to not leak info)
      expect(response.status).toBe(404)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Over-Consumption Detection (6 tests):
 *   - Approval modal when setting OFF
 *   - Over-consumption summary display
 *   - Awaiting approval status
 *   - Request ID generation
 *   - Direct proceed when setting ON
 *   - Variance in materials table
 *
 * Variance Indicator Display (4 tests):
 *   - Green for 0% (exact match)
 *   - Yellow for acceptable (1-10%)
 *   - Red for high (>10%)
 *   - Correct icons per level
 *
 * Manager Approval Workflow:
 *   Approve (5 tests):
 *     - Buttons visible for manager
 *     - Optional reason input
 *     - Approve without reason
 *     - Approve with reason
 *     - LP quantity decrease
 *     - Consumption record linked
 *   Reject (5 tests):
 *     - Required reason input
 *     - Validation error no reason
 *     - Reject with reason
 *     - Block consumption
 *     - Rejection details to operator
 *
 * Permission Enforcement (3 tests):
 *   - Hidden buttons for Operator
 *   - 403 on Operator API call
 *   - Visible buttons for Admin
 *
 * Pending Request Handling (2 tests):
 *   - Error on duplicate request
 *   - Cancel and create new
 *
 * Dashboard High Variance Alert (3 tests):
 *   - Flag WO with >10% variance
 *   - Show variance percentage
 *   - Navigate to WO detail
 *
 * Multi-tenancy (2 tests):
 *   - Only own org approvals
 *   - 404 for other org access
 *
 * Total: 30 tests
 */
