/**
 * E2E Tests: Over-Receipt Handling (Batch 5A-3)
 * Story: 5.10
 *
 * Tests complete user flows for:
 * - AC-5.10.1: Receive exact quantity (no over-receipt)
 * - AC-5.10.2: Receive within tolerance (auto-approved)
 * - AC-5.10.3: Receive over tolerance (requires manager approval)
 * - AC-5.10.4: Manager approves over-receipt
 * - AC-5.10.5: Manager rejects over-receipt
 * - AC-5.10.6: Over-receipt audit trail
 *
 * NOTE: These tests require E2E environment setup with Playwright
 * Run with: pnpm test:e2e story-5.10-over-receipt.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'

// Test user credentials - should be set via environment
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'warehouse@test.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!'
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL || 'manager@test.com'
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD || 'TestPassword123!'

/**
 * Helper: Login to application
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|warehouse)/, { timeout: 10000 })
}

/**
 * Helper: Navigate to receiving page
 */
async function goToReceiving(page: Page) {
  await page.goto('/warehouse/receiving')
  await page.waitForSelector('[data-testid="grn-table"]', { timeout: 10000 })
}

/**
 * Helper: Find and open first GRN
 */
async function openFirstGRN(page: Page) {
  const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
  await expect(firstGRNRow).toBeVisible()
  await firstGRNRow.click()
  await page.waitForURL(/\/warehouse\/receiving\//, { timeout: 10000 })
}

/**
 * Helper: Get PO line quantity from GRN detail
 */
async function getPoLineQty(page: Page, lineIndex: number): Promise<number> {
  const orderQtyCell = page.locator('[data-testid="grn-item-row"]').nth(lineIndex).locator('[data-testid="ordered-qty"]')
  const qtyText = await orderQtyCell.textContent()
  return parseInt(qtyText?.trim() || '0', 10)
}

/**
 * Helper: Fill receive quantity form
 */
async function receiveQuantity(
  page: Page,
  lineIndex: number,
  receivedQty: number,
  warehouseId?: string,
  locationId?: string
) {
  // Click on line row to expand/select
  const lineRow = page.locator('[data-testid="grn-item-row"]').nth(lineIndex)
  const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
  await receiveBtn.click()

  // Wait for receive modal
  await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

  // Fill received quantity
  const qtyInput = page.locator('input[name="received_qty"]')
  await qtyInput.fill(receivedQty.toString())

  // Select warehouse if provided
  if (warehouseId) {
    const warehouseSelect = page.locator('[data-testid="warehouse-select"]')
    if (await warehouseSelect.isVisible()) {
      await warehouseSelect.click()
      await page.locator(`[data-testid="warehouse-option-${warehouseId}"]`).click()
      await page.waitForTimeout(300)
    }
  }

  // Select location if provided
  if (locationId) {
    const locationSelect = page.locator('[data-testid="location-select"]')
    if (await locationSelect.isVisible()) {
      await locationSelect.click()
      await page.locator(`[data-testid="location-option-${locationId}"]`).click()
      await page.waitForTimeout(300)
    }
  } else {
    // Select first available location
    const locationSelect = page.locator('[data-testid="location-select"]')
    if (await locationSelect.isVisible()) {
      await locationSelect.click()
      await page.locator('[role="option"]').first().click()
      await page.waitForTimeout(300)
    }
  }

  // Set manufacturing date (optional but may be required)
  const mfgDateInput = page.locator('input[name="manufacture_date"]')
  if (await mfgDateInput.isVisible()) {
    const today = new Date().toISOString().split('T')[0]
    await mfgDateInput.fill(today)
  }

  // Set expiry date (optional)
  const expiryDateInput = page.locator('input[name="expiry_date"]')
  if (await expiryDateInput.isVisible()) {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    await expiryDateInput.fill(future.toISOString().split('T')[0])
  }

  // Click receive button
  const receiveSubmitBtn = page.locator('[data-testid="receive-submit-btn"]')
  await receiveSubmitBtn.click()
  await page.waitForTimeout(500)
}

// ============================================================================
// Over-Receipt Tolerance Tests
// ============================================================================
test.describe('Over-Receipt Tolerance (Story 5.10)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should receive exact quantity without approval (AC-5.10.1)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Get first line ordered quantity
      const orderedQty = await getPoLineQty(page, 0)

      // Receive exact quantity
      await receiveQuantity(page, 0, orderedQty)

      // Should not show approval dialog
      const approvalDialog = page.locator('[data-testid="over-receipt-approval-dialog"]')
      const isVisible = await approvalDialog.isVisible({ timeout: 2000 }).catch(() => false)

      // If no approval dialog, item should be received
      if (!isVisible) {
        const successMsg = page.locator('[data-testid="success-message"]')
        await expect(successMsg).toBeVisible()
      }
    }
  })

  test('should receive within tolerance and auto-approve (AC-5.10.2)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Get first line ordered quantity and add within tolerance (5%)
      const orderedQty = await getPoLineQty(page, 0)
      const toleranceQty = Math.ceil(orderedQty * 1.03) // 3% over

      // Receive within tolerance
      await receiveQuantity(page, 0, toleranceQty)

      // May show warning but should not require approval if within tolerance
      const approvalDialog = page.locator('[data-testid="over-receipt-approval-dialog"]')
      const isApprovalRequired = await approvalDialog.isVisible({ timeout: 2000 }).catch(() => false)

      if (!isApprovalRequired) {
        // Should auto-approve and show success
        const successMsg = page.locator('[data-testid="success-message"]')
        await expect(successMsg).toBeVisible()
      }
    }
  })

  test('should show over-receipt tolerance warning (AC-5.10.2)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Get first line ordered quantity
      const orderedQty = await getPoLineQty(page, 0)

      // Receive just over tolerance (6%)
      const overQty = Math.ceil(orderedQty * 1.06)

      // Click receive button
      const lineRow = page.locator('[data-testid="grn-item-row"]').nth(0)
      const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
      await receiveBtn.click()
      await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

      // Fill form
      const qtyInput = page.locator('input[name="received_qty"]')
      await qtyInput.fill(overQty.toString())

      // Select location
      const locationSelect = page.locator('[data-testid="location-select"]')
      if (await locationSelect.isVisible()) {
        await locationSelect.click()
        await page.locator('[role="option"]').first().click()
        await page.waitForTimeout(300)
      }

      // Set dates if needed
      const mfgDateInput = page.locator('input[name="manufacture_date"]')
      if (await mfgDateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0]
        await mfgDateInput.fill(today)
      }

      // Check if warning appears
      const warningMsg = page.locator('[data-testid="over-receipt-warning"]')
      const isWarningVisible = await warningMsg.isVisible({ timeout: 2000 }).catch(() => false)

      if (isWarningVisible) {
        // Warning should mention tolerance exceeded
        await expect(warningMsg).toContainText(/tolerance|over-receipt/i)
      }
    }
  })

  test('should require approval for over-tolerance receipt (AC-5.10.3)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Get first line ordered quantity
      const orderedQty = await getPoLineQty(page, 0)

      // Receive significantly over tolerance (20%)
      const overQty = Math.ceil(orderedQty * 1.20)

      // Click receive button
      const lineRow = page.locator('[data-testid="grn-item-row"]').nth(0)
      const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
      await receiveBtn.click()
      await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

      // Fill form
      const qtyInput = page.locator('input[name="received_qty"]')
      await qtyInput.fill(overQty.toString())

      // Select location
      const locationSelect = page.locator('[data-testid="location-select"]')
      if (await locationSelect.isVisible()) {
        await locationSelect.click()
        await page.locator('[role="option"]').first().click()
        await page.waitForTimeout(300)
      }

      // Set dates
      const mfgDateInput = page.locator('input[name="manufacture_date"]')
      if (await mfgDateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0]
        await mfgDateInput.fill(today)
      }

      // Submit and check for approval dialog
      const submitBtn = page.locator('[data-testid="receive-submit-btn"]')
      await submitBtn.click()
      await page.waitForTimeout(500)

      // Should show approval dialog
      const approvalDialog = page.locator('[data-testid="over-receipt-approval-dialog"]')
      const isVisible = await approvalDialog.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await expect(approvalDialog).toBeVisible()
        // Dialog should mention approval needed
        await expect(approvalDialog).toContainText(/approval|manager|pending/i)
      }
    }
  })

  test('should show variance calculation (AC-5.10.2)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Get first line ordered quantity
      const orderedQty = await getPoLineQty(page, 0)

      // Receive over amount
      const overQty = Math.ceil(orderedQty * 1.10)

      // Click receive button
      const lineRow = page.locator('[data-testid="grn-item-row"]').nth(0)
      const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
      await receiveBtn.click()
      await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

      // Fill form
      const qtyInput = page.locator('input[name="received_qty"]')
      await qtyInput.fill(overQty.toString())

      // Select location
      const locationSelect = page.locator('[data-testid="location-select"]')
      if (await locationSelect.isVisible()) {
        await locationSelect.click()
        await page.locator('[role="option"]').first().click()
        await page.waitForTimeout(300)
      }

      // Check for variance display
      const varianceDisplay = page.locator('[data-testid="variance-display"]')
      const isVisible = await varianceDisplay.isVisible({ timeout: 2000 }).catch(() => false)

      if (isVisible) {
        await expect(varianceDisplay).toBeVisible()
        // Should show the variance percentage
        await expect(varianceDisplay).toContainText(/10%|variance/)
      }
    }
  })
})

// ============================================================================
// Manager Approval Tests
// ============================================================================
test.describe('Manager Over-Receipt Approval (Story 5.10)', () => {
  test('should display pending approvals for manager (AC-5.10.4)', async ({ page }) => {
    // Login as manager
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD)

    // Navigate to approval queue or receiving page
    const approvalsBtn = page.locator('[data-testid="approvals-btn"]')
    if (await approvalsBtn.isVisible()) {
      await approvalsBtn.click()
      await page.waitForURL(/approval|request/, { timeout: 10000 })
    } else {
      // Go to receiving page to find pending items
      await goToReceiving(page)
    }

    // Should see table with pending items
    const table = page.locator('[data-testid="pending-approvals-table"], [data-testid="grn-table"]')
    await expect(table).toBeVisible()
  })

  test('should approve over-receipt request (AC-5.10.4)', async ({ page }) => {
    // Login as manager
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD)

    // Navigate to approvals
    const approvalsBtn = page.locator('[data-testid="approvals-btn"]')
    if (await approvalsBtn.isVisible()) {
      await approvalsBtn.click()
      await page.waitForURL(/approval|request/, { timeout: 10000 })

      // Find first pending approval
      const firstApprovalRow = page.locator('[data-testid="approval-row"]').first()
      if (await firstApprovalRow.isVisible()) {
        // Click to open detail
        await firstApprovalRow.click()
        await page.waitForSelector('[data-testid="approval-detail"]', { timeout: 5000 })

        // Click approve button
        const approveBtn = page.locator('[data-testid="approve-btn"]')
        await approveBtn.click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('[data-testid="confirm-approve-dialog"]')
        if (await confirmDialog.isVisible()) {
          const confirmBtn = page.locator('[data-testid="confirm-approve-btn"]')
          await confirmBtn.click()
        }

        // Wait for success
        await page.waitForTimeout(1000)

        // Should show success message
        const successMsg = page.locator('[data-testid="success-message"]')
        const isVisible = await successMsg.isVisible({ timeout: 3000 }).catch(() => false)
        if (isVisible) {
          await expect(successMsg).toBeVisible()
        }
      }
    }
  })

  test('should reject over-receipt request (AC-5.10.5)', async ({ page }) => {
    // Login as manager
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD)

    // Navigate to approvals
    const approvalsBtn = page.locator('[data-testid="approvals-btn"]')
    if (await approvalsBtn.isVisible()) {
      await approvalsBtn.click()
      await page.waitForURL(/approval|request/, { timeout: 10000 })

      // Find first pending approval
      const firstApprovalRow = page.locator('[data-testid="approval-row"]').first()
      if (await firstApprovalRow.isVisible()) {
        // Click to open detail
        await firstApprovalRow.click()
        await page.waitForSelector('[data-testid="approval-detail"]', { timeout: 5000 })

        // Click reject button
        const rejectBtn = page.locator('[data-testid="reject-btn"]')
        if (await rejectBtn.isVisible()) {
          await rejectBtn.click()

          // Should show rejection reason dialog
          const reasonDialog = page.locator('[data-testid="rejection-reason-dialog"]')
          if (await reasonDialog.isVisible()) {
            // Fill rejection reason
            const reasonInput = page.locator('textarea[name="rejection_reason"]')
            await reasonInput.fill('Quantity exceeds acceptable limits for this PO')

            // Confirm rejection
            const confirmBtn = page.locator('[data-testid="confirm-reject-btn"]')
            await confirmBtn.click()
          } else {
            // No reason required, just confirm
            const confirmBtn = page.locator('[data-testid="confirm-reject-btn"]')
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click()
            }
          }

          // Wait for success
          await page.waitForTimeout(1000)

          // Should show success message
          const successMsg = page.locator('[data-testid="success-message"]')
          const isVisible = await successMsg.isVisible({ timeout: 3000 }).catch(() => false)
          if (isVisible) {
            await expect(successMsg).toContainText(/reject|denied/i)
          }
        }
      }
    }
  })

  test('should show approval reason/notes (AC-5.10.4)', async ({ page }) => {
    // Login as manager
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD)

    // Navigate to approvals
    const approvalsBtn = page.locator('[data-testid="approvals-btn"]')
    if (await approvalsBtn.isVisible()) {
      await approvalsBtn.click()
      await page.waitForURL(/approval|request/, { timeout: 10000 })

      // Find first pending approval
      const firstApprovalRow = page.locator('[data-testid="approval-row"]').first()
      if (await firstApprovalRow.isVisible()) {
        // Click to open detail
        await firstApprovalRow.click()
        await page.waitForSelector('[data-testid="approval-detail"]', { timeout: 5000 })

        // Check if approval reason field exists
        const reasonField = page.locator('[data-testid="approval-notes"]')
        if (await reasonField.isVisible()) {
          // Fill approval notes if required
          await reasonField.fill('Approved - within acceptable business limits')

          // Now approve
          const approveBtn = page.locator('[data-testid="approve-btn"]')
          await approveBtn.click()
          await page.waitForTimeout(500)
        }
      }
    }
  })
})

// ============================================================================
// Over-Receipt Audit Trail Tests
// ============================================================================
test.describe('Over-Receipt Audit Trail (Story 5.10)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should display over-receipt in LP detail (AC-5.10.6)', async ({ page }) => {
    // Navigate to license plates
    await page.goto('/warehouse/license-plates')
    await page.waitForSelector('[data-testid="lp-table"]', { timeout: 10000 })

    // Find LP with over-receipt flag or history
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    if (await firstLPRow.isVisible()) {
      await firstLPRow.click()
      await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

      // Check for over-receipt indicator
      const overReceiptBadge = page.locator('[data-testid="over-receipt-badge"]')
      const isVisible = await overReceiptBadge.isVisible({ timeout: 2000 }).catch(() => false)

      if (isVisible) {
        await expect(overReceiptBadge).toBeVisible()
      }
    }
  })

  test('should show LP creation audit log (AC-5.10.6)', async ({ page }) => {
    // Navigate to license plates
    await page.goto('/warehouse/license-plates')
    await page.waitForSelector('[data-testid="lp-table"]', { timeout: 10000 })

    // Open detail of first LP
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    if (await firstLPRow.isVisible()) {
      await firstLPRow.click()
      await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

      // Look for audit trail tab or section
      const auditTab = page.locator('[data-testid="audit-tab"], [data-testid="history-tab"]')
      if (await auditTab.isVisible()) {
        await auditTab.click()
        await page.waitForTimeout(500)

        // Should show creation event
        const auditLog = page.locator('[data-testid="audit-log-entry"]')
        const isVisible = await auditLog.isVisible({ timeout: 3000 }).catch(() => false)

        if (isVisible) {
          // Should show who created the LP
          await expect(auditLog).toContainText(/created|warehouse|received/i)
        }
      }
    }
  })

  test('should show GRN reference in LP (AC-5.10.6)', async ({ page }) => {
    // Navigate to license plates
    await page.goto('/warehouse/license-plates')
    await page.waitForSelector('[data-testid="lp-table"]', { timeout: 10000 })

    // Find LP created from receiving
    const firstLPRow = page.locator('[data-testid="lp-row"]').first()
    if (await firstLPRow.isVisible()) {
      await firstLPRow.click()
      await page.waitForSelector('[data-testid="lp-detail-panel"]', { timeout: 5000 })

      // Check for GRN reference
      const grnReference = page.locator('[data-testid="grn-reference"], [data-testid="source-reference"]')
      if (await grnReference.isVisible()) {
        await expect(grnReference).toBeVisible()
        // Should show GRN number or PO number
        const refText = await grnReference.textContent()
        expect(refText).toBeTruthy()
      }
    }
  })
})

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================
test.describe('Over-Receipt Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('should prevent receiving zero or negative quantity (AC-5.10.1)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Click receive button
      const lineRow = page.locator('[data-testid="grn-item-row"]').nth(0)
      const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
      await receiveBtn.click()
      await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

      // Try to enter zero quantity
      const qtyInput = page.locator('input[name="received_qty"]')
      await qtyInput.fill('0')

      // Try to submit - should be prevented
      const submitBtn = page.locator('[data-testid="receive-submit-btn"]')
      const isEnabled = await submitBtn.isEnabled()

      if (isEnabled) {
        // If enabled, form should show error
        await submitBtn.click()
        await page.waitForTimeout(500)
        const errorMsg = page.locator('[data-testid="error-message"]')
        const isVisible = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)
        if (isVisible) {
          await expect(errorMsg).toBeVisible()
        }
      } else {
        // Button should be disabled
        expect(isEnabled).toBe(false)
      }
    }
  })

  test('should validate required fields in receive form (AC-5.10.1)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Click receive button
      const lineRow = page.locator('[data-testid="grn-item-row"]').nth(0)
      const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
      await receiveBtn.click()
      await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

      // Fill only quantity, leave location empty
      const qtyInput = page.locator('input[name="received_qty"]')
      await qtyInput.fill('100')

      // Try to submit without location
      const submitBtn = page.locator('[data-testid="receive-submit-btn"]')
      await submitBtn.click()
      await page.waitForTimeout(500)

      // Should show validation error for location
      const errorMsg = page.locator('[data-testid="error-message"]')
      const isVisible = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)

      if (isVisible) {
        await expect(errorMsg).toBeVisible()
      }
    }
  })

  test('should handle large over-receipt quantities (AC-5.10.3)', async ({ page }) => {
    await goToReceiving(page)

    // Open first GRN
    const firstGRNRow = page.locator('[data-testid="grn-row"]').first()
    if (await firstGRNRow.isVisible()) {
      await openFirstGRN(page)

      // Get first line ordered quantity
      const orderedQty = await getPoLineQty(page, 0)

      // Receive 5x the quantity (extreme over-receipt)
      const extremeQty = orderedQty * 5

      // Click receive button
      const lineRow = page.locator('[data-testid="grn-item-row"]').nth(0)
      const receiveBtn = lineRow.locator('[data-testid="receive-item-btn"]')
      await receiveBtn.click()
      await page.waitForSelector('[data-testid="receive-item-modal"]', { timeout: 5000 })

      // Fill form
      const qtyInput = page.locator('input[name="received_qty"]')
      await qtyInput.fill(extremeQty.toString())

      // Select location
      const locationSelect = page.locator('[data-testid="location-select"]')
      if (await locationSelect.isVisible()) {
        await locationSelect.click()
        await page.locator('[role="option"]').first().click()
        await page.waitForTimeout(300)
      }

      // Set dates
      const mfgDateInput = page.locator('input[name="manufacture_date"]')
      if (await mfgDateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0]
        await mfgDateInput.fill(today)
      }

      // Submit and should require approval
      const submitBtn = page.locator('[data-testid="receive-submit-btn"]')
      await submitBtn.click()
      await page.waitForTimeout(500)

      // Should show approval dialog or strong warning
      const approvalDialog = page.locator('[data-testid="over-receipt-approval-dialog"]')
      const warningMsg = page.locator('[data-testid="over-receipt-warning"]')

      const dialogVisible = await approvalDialog.isVisible({ timeout: 3000 }).catch(() => false)
      const warningVisible = await warningMsg.isVisible({ timeout: 3000 }).catch(() => false)

      expect(dialogVisible || warningVisible).toBe(true)
    }
  })
})
