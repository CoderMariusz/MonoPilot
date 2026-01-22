/**
 * E2E Tests: Sales Order Status Workflow
 * Story: 07.3 - SO Status Workflow (Hold/Cancel)
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests complete user workflows:
 * - Hold sales order workflow
 * - Cancel sales order workflow
 * - Status badge display
 * - Status timeline display
 * - Permission enforcement in UI
 *
 * Coverage: Full user journey tests
 * Test Count: 15+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-6: Status timeline component
 * - AC-7: Status badge component
 * - E2E flows from tests.yaml
 */

import { test, expect, Page } from '@playwright/test'

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserEmail: string
let testUserPassword: string
let testManagerEmail: string
let testManagerPassword: string
let testSalesEmail: string
let testSalesPassword: string

test.beforeAll(async () => {
  // Test credentials - will be set up in test environment
  // These will fail until proper test fixtures exist
  testOrgId = 'test-org-001'
  testUserEmail = 'admin@test.monopilot.com'
  testUserPassword = 'TestPassword123!'
  testManagerEmail = 'manager@test.monopilot.com'
  testManagerPassword = 'TestPassword123!'
  testSalesEmail = 'sales@test.monopilot.com'
  testSalesPassword = 'TestPassword123!'
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
  await page.waitForURL(/\/(dashboard|shipping)/, { timeout: 60000 })
}

async function createSalesOrderViaAPI(
  page: Page,
  customerId: string,
  status: string = 'draft'
): Promise<string> {
  const response = await page.request.post('/api/shipping/sales-orders', {
    data: {
      customer_id: customerId,
      requested_ship_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'E2E Test Sales Order',
    },
  })

  if (!response.ok()) {
    throw new Error(`Failed to create SO: ${await response.text()}`)
  }

  const data = await response.json()
  return data.sales_order?.id || data.id
}

async function getExistingCustomer(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/shipping/customers')
  if (!response.ok()) return null

  const data = await response.json()
  const customers = data.customers || data || []
  return customers.length > 0 ? customers[0].id : null
}

async function deleteSalesOrderViaAPI(page: Page, soId: string): Promise<void> {
  await page.request.delete(`/api/shipping/sales-orders/${soId}`)
}

// ============================================================================
// COMPLETE HOLD WORKFLOW (from tests.yaml e2e_tests)
// ============================================================================

test.describe('E2E: Complete Hold Workflow', () => {
  let customerId: string | null
  let soId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)

    if (!customerId) {
      test.skip()
      return
    }

    soId = await createSalesOrderViaAPI(page, customerId)
  })

  test.afterEach(async ({ page }) => {
    if (soId) {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Complete hold workflow with reason', async ({ page }) => {
    // Step 1: Navigate to sales order detail page
    await page.goto(`/shipping/sales-orders/${soId}`)
    await expect(page.locator('text=/SO-/i')).toBeVisible({ timeout: 10000 })

    // Step 2: Click 'Hold Order' button
    const holdButton = page.locator('button').filter({ hasText: /Hold Order|Place on Hold/i })
    await expect(holdButton).toBeVisible({ timeout: 5000 })
    await holdButton.click()

    // Step 3: Wait for Hold dialog to open
    const holdDialog = page.locator('[role="dialog"]')
    await expect(holdDialog).toBeVisible({ timeout: 5000 })

    // Step 4: Enter reason
    const reasonInput = holdDialog.locator('input[name="reason"], textarea[name="reason"]')
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Awaiting customer confirmation')
    }

    // Step 5: Click 'Confirm Hold'
    const confirmButton = holdDialog.locator('button').filter({ hasText: /Confirm|Hold|Submit/i })
    await confirmButton.click()

    // Expected: Success toast displayed
    const successToast = page.locator('[class*="toast"], [role="status"]').filter({ hasText: /success|held|on hold/i })
    await expect(successToast).toBeVisible({ timeout: 5000 })

    // Expected: Status badge updates to yellow 'On Hold'
    const statusBadge = page.locator('[data-testid="status-badge"], [class*="badge"]').filter({ hasText: /On Hold/i })
    await expect(statusBadge).toBeVisible({ timeout: 5000 })
    // Verify yellow color
    await expect(statusBadge).toHaveClass(/yellow|warning|amber/i)

    // Expected: Status timeline shows new entry
    const timeline = page.locator('[data-testid="status-timeline"]')
    if (await timeline.isVisible()) {
      await expect(timeline.locator('text=/on.?hold/i')).toBeVisible()
    }

    // This test will fail until implementation exists
    expect(true).toBe(false) // RED
  })

  test('Hold order without reason (optional)', async ({ page }) => {
    await page.goto(`/shipping/sales-orders/${soId}`)
    await expect(page.locator('text=/SO-/i')).toBeVisible({ timeout: 10000 })

    const holdButton = page.locator('button').filter({ hasText: /Hold Order|Place on Hold/i })
    await holdButton.click()

    const holdDialog = page.locator('[role="dialog"]')
    await expect(holdDialog).toBeVisible({ timeout: 5000 })

    // Submit without entering reason (should be allowed)
    const confirmButton = holdDialog.locator('button').filter({ hasText: /Confirm|Hold|Submit/i })
    await confirmButton.click()

    // Expected: Success - hold without reason should work
    const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /On Hold/i })
    await expect(statusBadge).toBeVisible({ timeout: 5000 })

    expect(true).toBe(false) // RED
  })

  test('Release hold (on_hold -> confirmed)', async ({ page }) => {
    // First put order on hold via API
    await page.request.post(`/api/shipping/sales-orders/${soId}/hold`, {
      data: { reason: 'Test hold' },
    })

    await page.goto(`/shipping/sales-orders/${soId}`)

    // Verify on_hold status
    const onHoldBadge = page.locator('[class*="badge"]').filter({ hasText: /On Hold/i })
    await expect(onHoldBadge).toBeVisible({ timeout: 5000 })

    // Click Release Hold / Confirm button
    const releaseButton = page.locator('button').filter({ hasText: /Release|Resume|Confirm/i })
    await expect(releaseButton).toBeVisible({ timeout: 5000 })
    await releaseButton.click()

    // Confirm if dialog appears
    const confirmDialog = page.locator('[role="dialog"]')
    if (await confirmDialog.isVisible()) {
      const confirmBtn = confirmDialog.locator('button').filter({ hasText: /Confirm|Yes|Release/i })
      await confirmBtn.click()
    }

    // Expected: Status changes to confirmed
    const confirmedBadge = page.locator('[class*="badge"]').filter({ hasText: /Confirmed/i })
    await expect(confirmedBadge).toBeVisible({ timeout: 5000 })

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// COMPLETE CANCEL WORKFLOW (from tests.yaml e2e_tests)
// ============================================================================

test.describe('E2E: Complete Cancel Workflow', () => {
  let customerId: string | null
  let soId: string

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)

    if (!customerId) {
      test.skip()
      return
    }

    soId = await createSalesOrderViaAPI(page, customerId)
  })

  test.afterEach(async ({ page }) => {
    if (soId) {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Complete cancel workflow with reason', async ({ page }) => {
    // Step 1: Navigate to sales order detail page
    await page.goto(`/shipping/sales-orders/${soId}`)
    await expect(page.locator('text=/SO-/i')).toBeVisible({ timeout: 10000 })

    // Step 2: Click 'Cancel Order' button
    const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })
    await expect(cancelButton).toBeVisible({ timeout: 5000 })
    await cancelButton.click()

    // Step 3: Wait for Cancel dialog (should show confirmation)
    const cancelDialog = page.locator('[role="dialog"], [role="alertdialog"]')
    await expect(cancelDialog).toBeVisible({ timeout: 5000 })

    // Expected: Confirmation modal shown ('Are you sure?')
    await expect(cancelDialog.locator('text=/Are you sure|Confirm/i')).toBeVisible()

    // Step 4: Enter reason (required)
    const reasonInput = cancelDialog.locator('input[name="reason"], textarea[name="reason"]')
    await expect(reasonInput).toBeVisible()
    await reasonInput.fill('Customer requested cancellation')

    // Step 5: Click 'Confirm Cancel'
    const confirmButton = cancelDialog.locator('button').filter({ hasText: /Confirm|Cancel Order|Yes/i }).last()
    await confirmButton.click()

    // Expected: Success toast after confirmation
    const successToast = page.locator('[class*="toast"], [role="status"]').filter({ hasText: /success|cancelled/i })
    await expect(successToast).toBeVisible({ timeout: 5000 })

    // Expected: Status badge updates to red 'Cancelled'
    const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /Cancelled/i })
    await expect(statusBadge).toBeVisible({ timeout: 5000 })
    // Verify red color
    await expect(statusBadge).toHaveClass(/red|destructive|error/i)

    // Expected: Status timeline shows cancellation entry
    const timeline = page.locator('[data-testid="status-timeline"]')
    if (await timeline.isVisible()) {
      await expect(timeline.locator('text=/cancelled/i')).toBeVisible()
    }

    expect(true).toBe(false) // RED
  })

  test('Cancel requires reason - validation error', async ({ page }) => {
    await page.goto(`/shipping/sales-orders/${soId}`)
    await expect(page.locator('text=/SO-/i')).toBeVisible({ timeout: 10000 })

    const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })
    await cancelButton.click()

    const cancelDialog = page.locator('[role="dialog"], [role="alertdialog"]')
    await expect(cancelDialog).toBeVisible({ timeout: 5000 })

    // Try to submit without reason
    const confirmButton = cancelDialog.locator('button').filter({ hasText: /Confirm|Cancel Order|Yes/i }).last()
    await confirmButton.click()

    // Expected: Validation error shown
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /reason|required/i })
    await expect(errorMessage).toBeVisible({ timeout: 3000 })

    expect(true).toBe(false) // RED
  })

  test('Cancel requires minimum 10 character reason', async ({ page }) => {
    await page.goto(`/shipping/sales-orders/${soId}`)

    const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })
    await cancelButton.click()

    const cancelDialog = page.locator('[role="dialog"], [role="alertdialog"]')
    await expect(cancelDialog).toBeVisible({ timeout: 5000 })

    // Enter short reason
    const reasonInput = cancelDialog.locator('input[name="reason"], textarea[name="reason"]')
    await reasonInput.fill('short')

    // Expected: Submit button disabled OR validation error
    const confirmButton = cancelDialog.locator('button').filter({ hasText: /Confirm|Cancel Order|Yes/i }).last()
    const isDisabled = await confirmButton.isDisabled()

    if (!isDisabled) {
      await confirmButton.click()
      // Validation error should show
      const errorMessage = page.locator('[class*="error"]').filter({ hasText: /10|characters/i })
      await expect(errorMessage).toBeVisible({ timeout: 3000 })
    }

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// INVALID ACTION PREVENTION (from tests.yaml e2e_tests)
// ============================================================================

test.describe('E2E: Invalid Action Prevention', () => {
  let customerId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)

    if (!customerId) {
      test.skip()
    }
  })

  test('Cannot hold order in picking status', async ({ page }) => {
    // This requires a sales order in 'picking' status
    // We'll create one and advance it via API (or skip if not possible)
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      // Advance to picking status (requires Story 07.7, 07.8 implementation)
      // For now, we test the UI behavior when order is in picking status

      await page.goto(`/shipping/sales-orders/${soId}`)

      // Mock: Assume order is in picking status
      // Expected: 'Hold Order' button disabled with tooltip
      const holdButton = page.locator('button').filter({ hasText: /Hold Order/i })

      if (await holdButton.isVisible()) {
        // Should be disabled
        const isDisabled = await holdButton.isDisabled()
        expect(isDisabled).toBe(true)

        // Should have tooltip explaining why
        await holdButton.hover()
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).toContainText(/cannot hold|allocation/i)
      }

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Cannot cancel order in picking status', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      await page.goto(`/shipping/sales-orders/${soId}`)

      // Expected: 'Cancel Order' button disabled with tooltip
      const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })

      if (await cancelButton.isVisible()) {
        // Should be disabled for picking status
        const isDisabled = await cancelButton.isDisabled()
        expect(isDisabled).toBe(true)

        // Should have tooltip explaining why
        await cancelButton.hover()
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).toContainText(/cannot cancel|picking/i)
      }

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })
})

// ============================================================================
// PERMISSION ENFORCEMENT IN UI (from tests.yaml e2e_tests)
// ============================================================================

test.describe('E2E: Permission Enforcement', () => {
  let customerId: string | null
  let soId: string

  test.beforeAll(async ({ browser }) => {
    // Setup: Create a test SO as manager
    const page = await browser.newPage()
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)
    if (customerId) {
      soId = await createSalesOrderViaAPI(page, customerId)
    }
    await page.close()
  })

  test.afterAll(async ({ browser }) => {
    if (soId) {
      const page = await browser.newPage()
      await loginAsUser(page, testManagerEmail, testManagerPassword)
      await deleteSalesOrderViaAPI(page, soId)
      await page.close()
    }
  })

  test('Sales role can see and use Hold button', async ({ page }) => {
    if (!soId) {
      test.skip()
      return
    }

    await loginAsUser(page, testSalesEmail, testSalesPassword)
    await page.goto(`/shipping/sales-orders/${soId}`)

    // Expected: 'Hold Order' button visible and enabled for Sales role
    const holdButton = page.locator('button').filter({ hasText: /Hold Order/i })
    await expect(holdButton).toBeVisible({ timeout: 5000 })
    await expect(holdButton).toBeEnabled()

    expect(true).toBe(false) // RED
  })

  test('Sales role cannot see Cancel button (hidden)', async ({ page }) => {
    if (!soId) {
      test.skip()
      return
    }

    await loginAsUser(page, testSalesEmail, testSalesPassword)
    await page.goto(`/shipping/sales-orders/${soId}`)

    // Expected: 'Cancel Order' button hidden OR disabled for Sales role
    const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })

    // Should either not be visible or be disabled
    const isVisible = await cancelButton.isVisible()
    if (isVisible) {
      const isDisabled = await cancelButton.isDisabled()
      expect(isDisabled).toBe(true)
    } else {
      expect(isVisible).toBe(false)
    }

    expect(true).toBe(false) // RED
  })

  test('Manager role can see both Hold and Cancel buttons', async ({ page }) => {
    if (!soId) {
      test.skip()
      return
    }

    await loginAsUser(page, testManagerEmail, testManagerPassword)
    await page.goto(`/shipping/sales-orders/${soId}`)

    // Expected: Both buttons visible and enabled for Manager role
    const holdButton = page.locator('button').filter({ hasText: /Hold Order/i })
    const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })

    await expect(holdButton).toBeVisible({ timeout: 5000 })
    await expect(holdButton).toBeEnabled()

    await expect(cancelButton).toBeVisible({ timeout: 5000 })
    await expect(cancelButton).toBeEnabled()

    expect(true).toBe(false) // RED
  })
})

// ============================================================================
// STATUS BADGE DISPLAY (AC-7, AC-20, AC-21)
// ============================================================================

test.describe('E2E: Status Badge Display', () => {
  let customerId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)

    if (!customerId) {
      test.skip()
    }
  })

  test('Draft status shows gray badge', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      await page.goto(`/shipping/sales-orders/${soId}`)

      const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /Draft/i })
      await expect(statusBadge).toBeVisible({ timeout: 5000 })
      await expect(statusBadge).toHaveClass(/gray|secondary|muted/i)

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('On Hold status shows yellow badge with PauseCircle icon', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      // Put on hold
      await page.request.post(`/api/shipping/sales-orders/${soId}/hold`)

      await page.goto(`/shipping/sales-orders/${soId}`)

      const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /On Hold/i })
      await expect(statusBadge).toBeVisible({ timeout: 5000 })
      await expect(statusBadge).toHaveClass(/yellow|warning|amber/i)

      // Check for pause icon
      const pauseIcon = statusBadge.locator('svg, [data-testid="pause-icon"]')
      await expect(pauseIcon).toBeVisible()

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Cancelled status shows red badge with XCircle icon', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      // Cancel the order
      await page.request.post(`/api/shipping/sales-orders/${soId}/cancel`, {
        data: { reason: 'Test cancellation for badge test' },
      })

      await page.goto(`/shipping/sales-orders/${soId}`)

      const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /Cancelled/i })
      await expect(statusBadge).toBeVisible({ timeout: 5000 })
      await expect(statusBadge).toHaveClass(/red|destructive|error/i)

      // Check for X icon
      const xIcon = statusBadge.locator('svg, [data-testid="x-icon"]')
      await expect(xIcon).toBeVisible()

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })
})

// ============================================================================
// STATUS TIMELINE DISPLAY (AC-6, AC-22, AC-23)
// ============================================================================

test.describe('E2E: Status Timeline Display', () => {
  let customerId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)

    if (!customerId) {
      test.skip()
    }
  })

  test('Timeline displays status history chronologically', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      // Create some status history
      await page.request.post(`/api/shipping/sales-orders/${soId}/confirm`)
      await page.request.post(`/api/shipping/sales-orders/${soId}/hold`, {
        data: { reason: 'Customer delay' },
      })
      await page.request.post(`/api/shipping/sales-orders/${soId}/confirm`) // Release

      await page.goto(`/shipping/sales-orders/${soId}`)

      // Find timeline component
      const timeline = page.locator('[data-testid="status-timeline"]')
      await expect(timeline).toBeVisible({ timeout: 5000 })

      // Verify chronological order (newest at top)
      const timelineItems = timeline.locator('[data-testid="timeline-item"]')
      const count = await timelineItems.count()
      expect(count).toBeGreaterThanOrEqual(3)

      // Check timestamps are in order
      // (Implementation would verify actual timestamps)

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Timeline shows user name for each status change', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      await page.request.post(`/api/shipping/sales-orders/${soId}/hold`, {
        data: { reason: 'Test hold' },
      })

      await page.goto(`/shipping/sales-orders/${soId}`)

      const timeline = page.locator('[data-testid="status-timeline"]')
      await expect(timeline).toBeVisible({ timeout: 5000 })

      // Check for user name in timeline entry
      const timelineEntry = timeline.locator('[data-testid="timeline-item"]').first()
      await expect(timelineEntry.locator('text=/Changed by|by/i')).toBeVisible()

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Cancelled status shown as endpoint in timeline', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      await page.request.post(`/api/shipping/sales-orders/${soId}/cancel`, {
        data: { reason: 'Timeline test cancellation' },
      })

      await page.goto(`/shipping/sales-orders/${soId}`)

      const timeline = page.locator('[data-testid="status-timeline"]')
      await expect(timeline).toBeVisible({ timeout: 5000 })

      // Cancelled should be at bottom with red badge
      const cancelledEntry = timeline.locator('[data-testid="timeline-item"]').last()
      await expect(cancelledEntry.locator('text=/cancelled/i')).toBeVisible()
      await expect(cancelledEntry.locator('[class*="badge"]')).toHaveClass(/red|destructive/i)

      // No entries should appear after cancelled
      const itemsAfterCancelled = await timeline.locator('[data-testid="timeline-item"]:has-text("Cancelled") ~ [data-testid="timeline-item"]').count()
      expect(itemsAfterCancelled).toBe(0)

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })
})

// ============================================================================
// DIALOG COMPONENT TESTS (AC-24, AC-25, AC-26, AC-27)
// ============================================================================

test.describe('E2E: Hold/Cancel Dialog Components', () => {
  let customerId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
    customerId = await getExistingCustomer(page)

    if (!customerId) {
      test.skip()
    }
  })

  test('Hold dialog shows enabled button for draft status', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      await page.goto(`/shipping/sales-orders/${soId}`)

      const holdButton = page.locator('button').filter({ hasText: /Hold Order/i })
      await holdButton.click()

      const holdDialog = page.locator('[role="dialog"]')
      await expect(holdDialog).toBeVisible({ timeout: 5000 })

      // Confirm button should be enabled
      const confirmButton = holdDialog.locator('button').filter({ hasText: /Confirm|Hold/i })
      await expect(confirmButton).toBeEnabled()

      // Optional reason input should be visible
      const reasonInput = holdDialog.locator('input, textarea').filter({ hasText: /reason/i })
      // (May or may not be visible depending on implementation)

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })

  test('Cancel dialog shows validation error for short reason', async ({ page }) => {
    const soId = await createSalesOrderViaAPI(page, customerId!)

    try {
      await page.goto(`/shipping/sales-orders/${soId}`)

      const cancelButton = page.locator('button').filter({ hasText: /Cancel Order/i })
      await cancelButton.click()

      const cancelDialog = page.locator('[role="dialog"]')
      await expect(cancelDialog).toBeVisible({ timeout: 5000 })

      // Enter short reason
      const reasonInput = cancelDialog.locator('input[name="reason"], textarea[name="reason"]')
      await reasonInput.fill('short')

      // Trigger validation (blur or submit)
      await reasonInput.blur()

      // Expected: Validation error shown
      const errorMessage = cancelDialog.locator('[class*="error"]')
      await expect(errorMessage).toBeVisible({ timeout: 2000 })

      // Submit button should be disabled
      const submitButton = cancelDialog.locator('button[type="submit"], button').filter({ hasText: /Confirm|Cancel/i }).last()
      await expect(submitButton).toBeDisabled()

      expect(true).toBe(false) // RED
    } finally {
      await deleteSalesOrderViaAPI(page, soId)
    }
  })
})

// ============================================================================
// NAVIGATION & LIST PAGE TESTS
// ============================================================================

test.describe('E2E: Sales Orders List - Status Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, testManagerEmail, testManagerPassword)
  })

  test('Status badge visible in sales orders list', async ({ page }) => {
    await page.goto('/shipping/sales-orders')

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })

    // Check status column exists
    const statusHeader = page.locator('th').filter({ hasText: /Status/i })
    await expect(statusHeader).toBeVisible()

    // Check status badges in rows
    const statusBadges = page.locator('table tbody tr [class*="badge"]')
    const count = await statusBadges.count()

    if (count > 0) {
      // At least one badge should be visible
      await expect(statusBadges.first()).toBeVisible()
    }

    expect(true).toBe(false) // RED
  })

  test('Can filter sales orders by status', async ({ page }) => {
    await page.goto('/shipping/sales-orders')

    await page.waitForSelector('table', { timeout: 10000 })

    // Find status filter
    const statusFilter = page.locator('[role="combobox"]').filter({ hasText: /Status|Filter/i })

    if (await statusFilter.isVisible()) {
      await statusFilter.click()

      // Select 'On Hold' option
      const onHoldOption = page.locator('[role="option"]').filter({ hasText: /On Hold/i })
      if (await onHoldOption.isVisible()) {
        await onHoldOption.click()

        // Wait for filter to apply
        await page.waitForTimeout(500)

        // Verify filtered results
        const visibleBadges = page.locator('table tbody tr [class*="badge"]')
        const count = await visibleBadges.count()

        // All visible badges should be 'On Hold'
        for (let i = 0; i < count; i++) {
          const badge = visibleBadges.nth(i)
          await expect(badge).toContainText(/On Hold/i)
        }
      }
    }

    expect(true).toBe(false) // RED
  })
})
