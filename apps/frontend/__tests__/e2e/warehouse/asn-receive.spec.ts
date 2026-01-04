/**
 * ASN Receive E2E Tests (Story 05.9)
 * Purpose: End-to-end workflow testing for ASN receive functionality
 * Phase: RED - Tests will fail until implementation exists
 *
 * Coverage Target: Critical user flows
 * Test Count: 8+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1 to AC-12: Full workflow coverage
 * - Complete ASN receive workflow
 * - Partial receive with multiple sessions
 * - Variance tracking and display
 * - Over-receipt validation
 * - Required fields enforcement
 * - Performance verification
 */

import { test, expect } from '@playwright/test'

test.describe('ASN Receive Workflow (Story 05.9)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  /**
   * AC-1, AC-2, AC-5, AC-7: Complete ASN Receive Workflow
   */
  test('should complete full ASN receive workflow', async ({ page }) => {
    // Navigate to ASN list
    await page.goto('/warehouse/asns')
    await expect(page.locator('h1')).toContainText('Advanced Shipping Notices')

    // Find and click pending ASN
    const pendingASN = page.locator('tr', { hasText: 'ASN-2025-00001' })
    await expect(pendingASN.locator('[data-status="pending"]')).toBeVisible()
    await pendingASN.click()

    // Verify ASN detail page loads
    await expect(page.locator('h1')).toContainText('ASN-2025-00001')

    // Click Receive button
    await page.click('button:has-text("Receive")')

    // Verify modal opens with items list
    await expect(page.locator('[data-testid="receive-modal"]')).toBeVisible()
    await expect(page.locator('text=Supplier A')).toBeVisible()
    await expect(page.locator('text=PO-2025-0001')).toBeVisible()

    // Verify items displayed with expected quantities
    await expect(page.locator('text=Product A')).toBeVisible()
    await expect(page.locator('text=Product B')).toBeVisible()

    // Select warehouse and location
    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Verify pre-filled quantities (should default to expected)
    const qtyInput1 = page.locator('[data-item-id="item-001"] [name="received_qty"]')
    await expect(qtyInput1).toHaveValue('100')

    const qtyInput2 = page.locator('[data-item-id="item-002"] [name="received_qty"]')
    await expect(qtyInput2).toHaveValue('50')

    // Verify batch and expiry pre-populated from ASN
    const batchInput1 = page.locator('[data-item-id="item-001"] [name="batch_number"]')
    await expect(batchInput1).toHaveValue('SB-001')

    const expiryInput1 = page.locator('[data-item-id="item-001"] [name="expiry_date"]')
    await expect(expiryInput1).toHaveValue('2026-12-31')

    // Submit receive
    await page.click('button:has-text("Confirm Receive")')

    // Verify success summary
    await expect(page.locator('[data-testid="receive-success-summary"]')).toBeVisible()
    await expect(page.locator('text=GRN-2025-00001')).toBeVisible()
    await expect(page.locator('text=/2 license plates created/i')).toBeVisible()

    // Close modal
    await page.click('button:has-text("Close")')

    // Verify ASN status updated to "received"
    await expect(page.locator('[data-status="received"]')).toBeVisible()

    // Navigate to license plates to verify LPs created
    await page.goto('/warehouse/license-plates')
    await expect(page.locator('text=LP00000001')).toBeVisible()
    await expect(page.locator('text=LP00000002')).toBeVisible()
  })

  /**
   * AC-4, AC-8, AC-10: Partial ASN Receive Workflow
   */
  test('should handle partial ASN receive with multiple sessions', async ({ page }) => {
    await page.goto('/warehouse/asns')

    // Click on ASN with 3 items
    const asn = page.locator('tr', { hasText: 'ASN-2025-00002' })
    await asn.click()

    // === Session 1: Receive only 2 items ===
    await page.click('button:has-text("Receive")')

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Receive item 1 fully
    await page.fill('[data-item-id="item-001"] [name="received_qty"]', '100')

    // Receive item 2 partially
    await page.fill('[data-item-id="item-002"] [name="received_qty"]', '30')

    // Don't receive item 3 (set to 0)
    await page.fill('[data-item-id="item-003"] [name="received_qty"]', '0')

    await page.click('button:has-text("Confirm Receive")')

    await expect(page.locator('text=/GRN-2025-00002/i')).toBeVisible()
    await page.click('button:has-text("Close")')

    // Verify ASN status = "partial"
    await expect(page.locator('[data-status="partial"]')).toBeVisible()

    // === Session 2: Receive remaining items ===
    await page.click('button:has-text("Receive")')

    // Verify item 1 shows remaining_qty = 0 (already complete)
    await expect(
      page.locator('[data-item-id="item-001"] [data-remaining-qty="0"]')
    ).toBeVisible()

    // Verify item 2 shows remaining_qty = 20
    const remainingQty2 = page.locator('[data-item-id="item-002"] [name="received_qty"]')
    await expect(remainingQty2).toHaveValue('20') // 50 - 30 = 20

    // Verify item 3 shows full expected qty
    const remainingQty3 = page.locator('[data-item-id="item-003"] [name="received_qty"]')
    await expect(remainingQty3).toHaveValue('200')

    // Receive remaining quantities
    await page.fill('[data-item-id="item-002"] [name="received_qty"]', '20')
    await page.fill('[data-item-id="item-003"] [name="received_qty"]', '200')

    await page.click('button:has-text("Confirm Receive")')
    await page.click('button:has-text("Close")')

    // Verify ASN status = "received"
    await expect(page.locator('[data-status="received"]')).toBeVisible()
  })

  /**
   * AC-3, AC-6, AC-9: ASN Receive with Variance Tracking
   */
  test('should track variance with reason and notes', async ({ page }) => {
    await page.goto('/warehouse/asns')

    const asn = page.locator('tr', { hasText: 'ASN-2025-00003' })
    await asn.click()

    await page.click('button:has-text("Receive")')

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Enter under-received quantity
    await page.fill('[data-item-id="item-001"] [name="received_qty"]', '95')

    // Verify variance badge appears
    await expect(page.locator('[data-testid="variance-badge-under"]')).toBeVisible()
    await expect(page.locator('text=/-5 units/i')).toBeVisible()
    await expect(page.locator('text=/\\(-5%\\)/i')).toBeVisible()

    // Verify variance reason dropdown appears
    await expect(page.locator('[data-item-id="item-001"] [name="variance_reason"]')).toBeVisible()

    // Select variance reason
    await page.selectOption('[data-item-id="item-001"] [name="variance_reason"]', 'damaged')

    // Enter variance notes
    await page.fill(
      '[data-item-id="item-001"] [name="variance_notes"]',
      '5 units damaged in transit'
    )

    // Submit
    await page.click('button:has-text("Confirm Receive")')

    // Verify variance summary in success modal
    await expect(page.locator('[data-testid="variance-summary"]')).toBeVisible()
    await expect(page.locator('text=/1 item with variance/i')).toBeVisible()

    await page.click('button:has-text("Close")')

    // Verify variance tracked in ASN detail
    await expect(page.locator('text=/damaged/i')).toBeVisible()
    await expect(page.locator('text=/5 units damaged/i')).toBeVisible()
  })

  /**
   * AC-3 (continued): Over-Receipt Variance Display
   */
  test('should display yellow badge for over-receipt', async ({ page }) => {
    await page.goto('/warehouse/asns')

    const asn = page.locator('tr', { hasText: 'ASN-2025-00004' })
    await asn.click()

    await page.click('button:has-text("Receive")')

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Enter over-received quantity (within tolerance)
    await page.fill('[data-item-id="item-001"] [name="received_qty"]', '105')

    // Verify yellow over-receipt badge
    await expect(page.locator('[data-testid="variance-badge-over"]')).toBeVisible()
    await expect(page.locator('text=/\\+5 units/i')).toBeVisible()
    await expect(page.locator('text=/\\(\\+5%\\)/i')).toBeVisible()

    // Should allow submission (within tolerance)
    await page.click('button:has-text("Confirm Receive")')
    await expect(page.locator('[data-testid="receive-success-summary"]')).toBeVisible()
  })

  /**
   * AC-3 (continued): Over-Receipt Blocked Beyond Tolerance
   */
  test('should block over-receipt exceeding tolerance', async ({ page }) => {
    await page.goto('/warehouse/asns')

    const asn = page.locator('tr', { hasText: 'ASN-2025-00005' })
    await asn.click()

    await page.click('button:has-text("Receive")')

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Enter over-received quantity beyond tolerance (20% over, tolerance is 10%)
    await page.fill('[data-item-id="item-001"] [name="received_qty"]', '120')

    // Submit
    await page.click('button:has-text("Confirm Receive")')

    // Verify error message
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible()
    await expect(
      page.locator('text=/Over-receipt exceeds tolerance.*max: 110 units/i')
    ).toBeVisible()

    // Verify form not submitted (modal still open)
    await expect(page.locator('[data-testid="receive-modal"]')).toBeVisible()
  })

  /**
   * AC-11: Required Fields Enforcement
   */
  test('should enforce required batch and expiry fields', async ({ page }) => {
    // Set warehouse settings to require batch and expiry
    await page.goto('/settings/warehouse')
    await page.check('[name="require_batch_on_receipt"]')
    await page.check('[name="require_expiry_on_receipt"]')
    await page.click('button:has-text("Save Settings")')

    // Navigate to ASN
    await page.goto('/warehouse/asns')
    const asn = page.locator('tr', { hasText: 'ASN-2025-00006' })
    await asn.click()

    await page.click('button:has-text("Receive")')

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Clear batch and expiry fields
    await page.fill('[data-item-id="item-001"] [name="batch_number"]', '')
    await page.fill('[data-item-id="item-001"] [name="expiry_date"]', '')

    // Try to submit
    await page.click('button:has-text("Confirm Receive")')

    // Verify validation errors
    await expect(page.locator('text=/Batch number required/i')).toBeVisible()
    await expect(page.locator('text=/Expiry date required/i')).toBeVisible()

    // Fill required fields
    await page.fill('[data-item-id="item-001"] [name="batch_number"]', 'BATCH-001')
    await page.fill('[data-item-id="item-001"] [name="expiry_date"]', '2026-12-31')

    // Submit again
    await page.click('button:has-text("Confirm Receive")')

    // Should succeed
    await expect(page.locator('[data-testid="receive-success-summary"]')).toBeVisible()
  })

  /**
   * AC-9: Exact Match Green Badge
   */
  test('should display green badge for exact match', async ({ page }) => {
    await page.goto('/warehouse/asns')

    const asn = page.locator('tr', { hasText: 'ASN-2025-00007' })
    await asn.click()

    await page.click('button:has-text("Receive")')

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Keep default expected quantity (exact match)
    // Input should already have value=100

    // Verify green exact match badge
    await expect(page.locator('[data-testid="variance-badge-exact"]')).toBeVisible()
    await expect(page.locator('text=/Exact match/i')).toBeVisible()

    // Variance reason should NOT appear
    await expect(
      page.locator('[data-item-id="item-001"] [name="variance_reason"]')
    ).not.toBeVisible()
  })

  /**
   * AC-12: Performance Requirements
   */
  test('should load preview in < 300ms and complete receive in < 2s for 50 items', async ({
    page,
  }) => {
    await page.goto('/warehouse/asns')

    // ASN with 50 items
    const asn = page.locator('tr', { hasText: 'ASN-2025-LARGE' })
    await asn.click()

    // Measure preview load time
    const previewStartTime = Date.now()
    await page.click('button:has-text("Receive")')
    await page.waitForSelector('[data-testid="receive-modal"]')
    const previewDuration = Date.now() - previewStartTime

    expect(previewDuration).toBeLessThan(300)

    // Verify 50 items loaded
    const itemRows = page.locator('[data-item-row]')
    await expect(itemRows).toHaveCount(50)

    await page.selectOption('[name="warehouse_id"]', 'wh-001')
    await page.selectOption('[name="location_id"]', 'loc-001')

    // Measure submit time
    const submitStartTime = Date.now()
    await page.click('button:has-text("Confirm Receive")')
    await page.waitForSelector('[data-testid="receive-success-summary"]')
    const submitDuration = Date.now() - submitStartTime

    expect(submitDuration).toBeLessThan(2000)

    // Verify 50 LPs created
    await expect(page.locator('text=/50 license plates created/i')).toBeVisible()
  })

  /**
   * Cross-Tenant Isolation
   */
  test('should enforce RLS and prevent cross-tenant access', async ({ page }) => {
    // Try to access ASN from another org by direct URL
    await page.goto('/warehouse/asns/asn-from-org-B')

    // Should redirect to 404 or show error
    await expect(
      page.locator('text=/ASN not found|404|Not Found/i')
    ).toBeVisible()
  })
})
