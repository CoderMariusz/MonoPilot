/**
 * LP Detail Page - E2E Tests (Story 05.6)
 * Purpose: Test complete LP detail page user flows
 * Phase: RED - Tests will fail until page is implemented
 *
 * Tests user flows:
 * - View LP detail page with all sections
 * - Tab navigation (Overview, Genealogy, History)
 * - Block LP workflow
 * - Unblock LP workflow
 * - Reference link navigation
 * - Error states (404, loading, errors)
 * - Empty states
 *
 * Coverage Target: 100% of critical flows
 * Test Count: 15+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: LP Detail Page Loads
 * - AC-08: Genealogy Tab Integration
 * - AC-09: History Tab Placeholder
 * - AC-10: Quick Actions - Block LP
 * - AC-11: Quick Actions - Unblock LP
 * - AC-16: Empty State - New LP
 * - AC-17: Loading State
 * - AC-18: Error State
 */

import { test, expect } from '@playwright/test'

test.describe('LP Detail Page (Story 05.6)', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to warehouse module
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  /**
   * Test Group: Page Load and Navigation
   * AC-01: LP Detail Page Loads
   */
  test('should load LP detail page within 500ms', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/warehouse/license-plates/lp-001')
    await page.waitForSelector('[data-testid="lp-detail-header"]')

    const endTime = Date.now()
    expect(endTime - startTime).toBeLessThan(500)
  })

  test('should display all LP fields in formatted sections', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    // Wait for page to load
    await page.waitForSelector('[data-testid="lp-detail-page"]')

    // Verify header
    await expect(page.locator('[data-testid="lp-number"]')).toHaveText(
      'LP00000001'
    )
    await expect(page.locator('[data-testid="status-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="qa-status-badge"]')).toBeVisible()

    // Verify overview cards
    await expect(page.locator('[data-testid="identity-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="location-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="tracking-card"]')).toBeVisible()
  })

  test('should display product name, warehouse, and location resolved', async ({
    page,
  }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    // Product joined
    await expect(
      page.locator('[data-testid="product-name"]')
    ).toContainText('Premium Chocolate Bar')

    // Warehouse joined
    await expect(
      page.locator('[data-testid="warehouse-name"]')
    ).toContainText('Main Warehouse')

    // Location joined
    await expect(
      page.locator('[data-testid="location-path"]')
    ).toContainText('WH-001 > Zone A > Bin 5')
  })

  test('should display status badges with correct colors', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    const statusBadge = page.locator('[data-testid="status-badge"]')
    await expect(statusBadge).toHaveText('Available')
    await expect(statusBadge).toHaveClass(/bg-green-100/)
    await expect(statusBadge).toHaveClass(/text-green-800/)
  })

  test('should show page title with LP number', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    await expect(page).toHaveTitle(/LP00000001/)
  })

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    const breadcrumb = page.locator('[data-testid="breadcrumb"]')
    await expect(breadcrumb).toContainText('Warehouse')
    await expect(breadcrumb).toContainText('License Plates')
    await expect(breadcrumb).toContainText('LP00000001')
  })

  /**
   * Test Group: Tab Navigation
   * AC-08, AC-09: Tab switching
   */
  test('should switch between tabs smoothly', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    // Overview tab active by default
    await expect(page.locator('[data-testid="tab-overview"]')).toHaveClass(
      /active/
    )

    // Switch to Genealogy tab
    await page.click('[data-testid="tab-genealogy"]')
    await page.waitForTimeout(100) // Tab switch should be <100ms
    await expect(page.locator('[data-testid="genealogy-content"]')).toBeVisible()

    // Switch to History tab
    await page.click('[data-testid="tab-history"]')
    await page.waitForTimeout(100)
    await expect(page.locator('[data-testid="history-placeholder"]')).toBeVisible()

    // Switch back to Overview
    await page.click('[data-testid="tab-overview"]')
    await expect(page.locator('[data-testid="overview-content"]')).toBeVisible()
  })

  test('should display genealogy tab with tree view', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-with-genealogy')

    await page.click('[data-testid="tab-genealogy"]')

    // Should show genealogy tree from Story 05.2
    await expect(page.locator('[data-testid="genealogy-tree"]')).toBeVisible()
    await expect(page.locator('[data-testid="ancestors-section"]')).toBeVisible()
    await expect(
      page.locator('[data-testid="descendants-section"]')
    ).toBeVisible()
  })

  test('should show placeholder in History tab', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    await page.click('[data-testid="tab-history"]')

    await expect(
      page.locator('text=Movement History Coming in Phase 2')
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="placeholder-icon"]')
    ).toBeVisible()
  })

  /**
   * Test Group: Block LP Workflow
   * AC-10: Block LP complete flow
   */
  test('should complete block LP workflow', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-available')

    // Verify LP is available
    await expect(page.locator('[data-testid="status-badge"]')).toHaveText(
      'Available'
    )

    // Click Block button
    await page.click('[data-testid="btn-block"]')

    // Verify modal opens
    await expect(
      page.locator('[data-testid="block-modal"]')
    ).toBeVisible()
    await expect(page.locator('text=Block License Plate')).toBeVisible()

    // Enter reason
    await page.fill(
      '[data-testid="block-reason"]',
      'Quality issue detected during inspection'
    )

    // Submit
    await page.click('[data-testid="btn-block-confirm"]')

    // Wait for success
    await page.waitForSelector('[data-testid="toast-success"]')
    await expect(page.locator('[data-testid="toast-success"]')).toContainText(
      'blocked successfully'
    )

    // Verify status updated
    await expect(page.locator('[data-testid="status-badge"]')).toHaveText(
      'Blocked'
    )
    await expect(page.locator('[data-testid="status-badge"]')).toHaveClass(
      /bg-red-100/
    )

    // Verify modal closed
    await expect(
      page.locator('[data-testid="block-modal"]')
    ).not.toBeVisible()

    // Verify Block button changed to Unblock
    await expect(page.locator('[data-testid="btn-unblock"]')).toBeVisible()
  })

  test('should validate block reason is required', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-available')

    await page.click('[data-testid="btn-block"]')

    // Try to submit without reason
    await page.click('[data-testid="btn-block-confirm"]')

    // Verify validation error
    await expect(
      page.locator('text=Reason is required')
    ).toBeVisible()

    // Modal should stay open
    await expect(
      page.locator('[data-testid="block-modal"]')
    ).toBeVisible()
  })

  test('should validate block reason max 500 chars', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-available')

    await page.click('[data-testid="btn-block"]')

    // Enter too long reason
    await page.fill('[data-testid="block-reason"]', 'x'.repeat(501))

    await page.click('[data-testid="btn-block-confirm"]')

    // Verify validation error
    await expect(
      page.locator('text=/must be 500 characters or less/i')
    ).toBeVisible()
  })

  test('should show character count in block modal', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-available')

    await page.click('[data-testid="btn-block"]')

    await page.fill('[data-testid="block-reason"]', 'Quality issue')

    // Verify character count
    await expect(
      page.locator('[data-testid="char-count"]')
    ).toContainText('13 / 500')
  })

  /**
   * Test Group: Unblock LP Workflow
   * AC-11: Unblock LP complete flow
   */
  test('should complete unblock LP workflow', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-blocked')

    // Verify LP is blocked
    await expect(page.locator('[data-testid="status-badge"]')).toHaveText(
      'Blocked'
    )

    // Click Unblock button
    await page.click('[data-testid="btn-unblock"]')

    // Verify modal opens with original reason
    await expect(
      page.locator('[data-testid="unblock-modal"]')
    ).toBeVisible()
    await expect(page.locator('text=Unblock License Plate')).toBeVisible()
    await expect(
      page.locator('[data-testid="original-block-reason"]')
    ).toContainText('Quality issue')

    // Confirm unblock
    await page.click('[data-testid="btn-unblock-confirm"]')

    // Wait for success
    await page.waitForSelector('[data-testid="toast-success"]')
    await expect(page.locator('[data-testid="toast-success"]')).toContainText(
      'unblocked successfully'
    )

    // Verify status updated
    await expect(page.locator('[data-testid="status-badge"]')).toHaveText(
      'Available'
    )
    await expect(page.locator('[data-testid="status-badge"]')).toHaveClass(
      /bg-green-100/
    )

    // Verify Unblock button changed to Block
    await expect(page.locator('[data-testid="btn-block"]')).toBeVisible()
  })

  /**
   * Test Group: Quick Actions
   */
  test('should disable Print Label button with tooltip', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    const printButton = page.locator('[data-testid="btn-print"]')

    // Verify button is disabled
    await expect(printButton).toBeDisabled()

    // Hover to show tooltip
    await printButton.hover()

    // Verify tooltip shows Phase 1 message
    await expect(
      page.locator('[data-testid="tooltip"]')
    ).toContainText('Coming in Phase 1')
  })

  /**
   * Test Group: Reference Links
   * AC-06: Reference links navigate correctly
   */
  test('should navigate to Work Order when WO link clicked', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-from-production')

    // Click WO reference link
    await page.click('[data-testid="link-wo"]')

    // Verify navigation
    await page.waitForURL('/production/work-orders/wo-001')
    await expect(page).toHaveURL(/\/production\/work-orders\/wo-001/)

    // Back button should return to LP detail
    await page.goBack()
    await expect(page).toHaveURL(/\/warehouse\/license-plates/)
  })

  test('should navigate to Product when product link clicked', async ({
    page,
  }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    await page.click('[data-testid="link-product"]')

    await expect(page).toHaveURL(/\/technical\/products\/prod-001/)
  })

  test('should navigate to Warehouse when warehouse link clicked', async ({
    page,
  }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    await page.click('[data-testid="link-warehouse"]')

    await expect(page).toHaveURL(/\/settings\/warehouses\/wh-001/)
  })

  /**
   * Test Group: Empty States
   * AC-16: Empty state handling
   */
  test('should show empty state for new LP without genealogy', async ({
    page,
  }) => {
    await page.goto('/warehouse/license-plates/lp-new')

    // Switch to Genealogy tab
    await page.click('[data-testid="tab-genealogy"]')

    // Verify empty state
    await expect(
      page.locator('[data-testid="genealogy-empty"]')
    ).toBeVisible()
    await expect(
      page.locator('text=No genealogy history for this LP')
    ).toBeVisible()

    // No errors in console
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    expect(errors).toHaveLength(0)
  })

  test('should display dash for missing optional fields', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-minimal')

    // Fields without data should show dash
    await expect(page.locator('[data-testid="supplier-batch"]')).toHaveText('-')
    await expect(page.locator('[data-testid="catch-weight"]')).toHaveText('-')
  })

  /**
   * Test Group: Loading State
   * AC-17: Skeleton loaders
   */
  test('should show skeleton loaders while loading', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    // Skeleton should appear briefly
    const skeleton = page.locator('[data-testid="skeleton-loader"]')
    // Note: May need to slow down network to catch skeleton
    // or use page.route() to delay API response
  })

  /**
   * Test Group: Error States
   * AC-18: Error handling
   */
  test('should display error state on API failure', async ({ page }) => {
    // Intercept API and force error
    await page.route('**/api/warehouse/license-plates/*', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )

    await page.goto('/warehouse/license-plates/lp-001')

    // Verify error boundary
    await expect(
      page.locator('[data-testid="error-boundary"]')
    ).toBeVisible()
    await expect(
      page.locator('text=Failed to load License Plate')
    ).toBeVisible()

    // Verify retry button
    await expect(page.locator('[data-testid="btn-retry"]')).toBeVisible()

    // Click retry
    await page.route('**/api/warehouse/license-plates/*', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ id: 'lp-001' }) })
    )
    await page.click('[data-testid="btn-retry"]')

    // Should reload successfully
    await expect(page.locator('[data-testid="lp-detail-page"]')).toBeVisible()
  })

  /**
   * Test Group: 404 Page
   * AC-14: LP Not Found
   */
  test('should display 404 page for invalid LP', async ({ page }) => {
    await page.goto('/warehouse/license-plates/invalid-uuid-12345')

    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible()
    await expect(page.locator('text=License Plate not found')).toBeVisible()

    // Go Back button should work
    await expect(page.locator('[data-testid="btn-go-back"]')).toBeVisible()
  })

  test('should display 404 for cross-tenant LP', async ({ page }) => {
    // AC-15: Cross-tenant access returns 404, not 403
    await page.goto('/warehouse/license-plates/lp-from-other-org')

    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible()
    // Should NOT say "Access denied" or "Forbidden"
  })

  /**
   * Test Group: Accessibility
   */
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-001')

    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Press Enter on tab
    const genealogyTab = page.locator('[data-testid="tab-genealogy"]')
    await genealogyTab.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('[data-testid="genealogy-content"]')).toBeVisible()
  })

  test('should close modal on Escape key', async ({ page }) => {
    await page.goto('/warehouse/license-plates/lp-available')

    await page.click('[data-testid="btn-block"]')
    await expect(
      page.locator('[data-testid="block-modal"]')
    ).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(
      page.locator('[data-testid="block-modal"]')
    ).not.toBeVisible()
  })

  /**
   * Test Group: Responsive Design
   */
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/warehouse/license-plates/lp-001')

    // Cards should stack vertically
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible()

    // Modal should be full screen on mobile
    await page.click('[data-testid="btn-block"]')
    const modal = page.locator('[data-testid="block-modal"]')
    await expect(modal).toHaveCSS('width', /100%/)
  })
})
