/**
 * E2E Tests: SO Allergen Validation
 * Story: 07.6 - SO Allergen Validation
 * Phase: TDD RED - All tests should FAIL (no implementation yet)
 *
 * Tests the complete allergen validation workflow:
 * - SO confirmation blocked when allergen conflicts exist
 * - AllergenAlert displays conflict details
 * - Manager override flow with reason capture
 * - SO confirmation unblocked after override
 * - Customer order history display
 * - Validation reset when line changes
 *
 * Coverage Target: Critical user journeys
 * Test Count: 18 tests
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Allergen Validation on SO Confirmation
 * - AC-5: Manager Override with Reason
 * - AC-9: Customer Order History Pagination
 */

import { test, expect } from '@playwright/test'

test.describe('07.6 SO Allergen Validation - E2E Tests', () => {
  // ==========================================================================
  // Test Setup
  // ==========================================================================
  test.beforeEach(async ({ page }) => {
    // Setup: Login and navigate to shipping module
    await page.goto('/login')
    await page.fill('input[name="email"]', 'manager@company.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('/dashboard')
  })

  // ==========================================================================
  // AC-1: Allergen Validation on SO Confirmation
  // ==========================================================================
  test.describe('AC-1: Allergen Validation on SO Confirmation', () => {
    test('E2E-01: SO confirmation blocked when allergen conflicts exist', async ({ page }) => {
      // Navigate to SO with allergen conflicts
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Click confirm button
      await page.click('button:has-text("Confirm Order")')

      // Verify allergen validation runs and blocks
      await expect(page.locator('[data-testid="allergen-alert"]')).toBeVisible()
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Allergen Conflict Detected')

      // Verify SO status remains draft
      await expect(page.locator('[data-testid="so-status-badge"]')).toContainText('draft')
    })

    test('E2E-02: AllergenAlert displays conflict details correctly', async ({ page }) => {
      // Navigate to SO with peanut conflict
      await page.goto('/shipping/sales-orders/so-peanut-conflict')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Trigger validation
      await page.click('button:has-text("Validate Allergens")')
      await expect(page.locator('[data-testid="allergen-alert"]')).toBeVisible()

      // Verify conflict details
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Peanut Brittle')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Peanuts')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Line 1')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('SKU-1234')
    })

    test('E2E-03: Multiple allergen conflicts displayed in list', async ({ page }) => {
      // Navigate to SO with multiple conflicts
      await page.goto('/shipping/sales-orders/so-multiple-conflicts')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Trigger validation
      await page.click('button:has-text("Validate Allergens")')
      await expect(page.locator('[data-testid="allergen-alert"]')).toBeVisible()

      // Verify multiple conflicts listed
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('2 allergen conflicts')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Peanuts')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Milk')
    })

    test('E2E-04: SO confirmation succeeds when no allergen conflicts', async ({ page }) => {
      // Navigate to SO without conflicts
      await page.goto('/shipping/sales-orders/so-no-conflicts')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Click confirm button
      await page.click('button:has-text("Confirm Order")')

      // Verify success - no allergen alert, SO confirmed
      await expect(page.locator('[data-testid="allergen-alert"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="so-status-badge"]')).toContainText('confirmed')
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Order confirmed')
    })

    test('E2E-05: Customer without restrictions allows confirmation', async ({ page }) => {
      // Navigate to SO with customer that has no allergen restrictions
      await page.goto('/shipping/sales-orders/so-customer-no-restrictions')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Click confirm button
      await page.click('button:has-text("Confirm Order")')

      // Verify success
      await expect(page.locator('[data-testid="allergen-alert"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="so-status-badge"]')).toContainText('confirmed')
    })
  })

  // ==========================================================================
  // AC-5: Manager Override with Reason
  // ==========================================================================
  test.describe('AC-5: Manager Override with Reason', () => {
    test('E2E-06: Manager sees override button in AllergenAlert', async ({ page }) => {
      // Login as manager (already done in beforeEach)
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.click('button:has-text("Validate Allergens")')
      await expect(page.locator('[data-testid="allergen-alert"]')).toBeVisible()

      // Verify override button visible for manager
      await expect(page.locator('button:has-text("Override")')).toBeVisible()
    })

    test('E2E-07: Non-manager sees "Contact manager" text instead of override button', async ({ page }) => {
      // Login as sales clerk
      await page.goto('/login')
      await page.fill('input[name="email"]', 'clerk@company.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/dashboard')

      // Navigate to SO with conflicts
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.click('button:has-text("Validate Allergens")')
      await expect(page.locator('[data-testid="allergen-alert"]')).toBeVisible()

      // Verify no override button, shows info text instead
      await expect(page.locator('button:has-text("Override")')).not.toBeVisible()
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Contact manager to override')
    })

    test('E2E-08: Override modal opens when override button clicked', async ({ page }) => {
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.click('button:has-text("Validate Allergens")')
      await expect(page.locator('[data-testid="allergen-alert"]')).toBeVisible()

      // Click override button
      await page.click('button:has-text("Override")')

      // Verify modal opens
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('[role="dialog"]')).toContainText('Override Allergen Block')
      await expect(page.locator('[role="dialog"]')).toContainText('food safety')
    })

    test('E2E-09: Override modal validates reason minimum length (20 chars)', async ({ page }) => {
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.click('button:has-text("Validate Allergens")')
      await page.click('button:has-text("Override")')

      // Enter short reason
      await page.fill('textarea[name="reason"]', 'Too short')
      await page.click('[type="checkbox"]')
      await page.click('button:has-text("Confirm")')

      // Verify validation error
      await expect(page.locator('[role="dialog"]')).toContainText('at least 20 characters')
    })

    test('E2E-10: Override modal requires confirmation checkbox', async ({ page }) => {
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.click('button:has-text("Validate Allergens")')
      await page.click('button:has-text("Override")')

      // Enter valid reason but don't check checkbox
      await page.fill('textarea[name="reason"]', 'Customer confirmed they can accept milk products for this order')
      await page.click('button:has-text("Confirm")')

      // Verify checkbox required
      await expect(page.locator('button:has-text("Confirm")')).toBeDisabled()
    })

    test('E2E-11: Complete override flow allows SO confirmation', async ({ page }) => {
      await page.goto('/shipping/sales-orders/so-with-conflicts')
      await page.click('button:has-text("Validate Allergens")')
      await page.click('button:has-text("Override")')

      // Complete override form
      const reason = 'Customer confirmed they can accept milk products for this order per phone call on 2025-12-16'
      await page.fill('textarea[name="reason"]', reason)
      await page.click('[type="checkbox"]')
      await page.click('button:has-text("Confirm")')

      // Wait for modal to close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })

      // Verify allergen alert shows override approved
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Override Approved')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('manager@company.com')

      // Confirm order should now work
      await page.click('button:has-text("Confirm Order")')
      await expect(page.locator('[data-testid="so-status-badge"]')).toContainText('confirmed')
    })

    test('E2E-12: Override reason is displayed after approval', async ({ page }) => {
      // Navigate to SO that already has override approved
      await page.goto('/shipping/sales-orders/so-override-approved')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Verify override details displayed
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Override Approved')
      await expect(page.locator('[data-testid="allergen-alert"]')).toContainText('Customer confirmed')
    })
  })

  // ==========================================================================
  // Validation Reset on Line Change
  // ==========================================================================
  test.describe('Validation Reset on Line Change', () => {
    test('E2E-13: Adding line resets allergen_validated flag', async ({ page }) => {
      // Navigate to SO that passed validation
      await page.goto('/shipping/sales-orders/so-validated')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Verify validation indicator shows passed
      await expect(page.locator('[data-testid="validation-status"]')).toContainText('Validated')

      // Add a new line
      await page.click('button:has-text("Add Line")')
      await page.fill('input[name="product"]', 'New Product')
      await page.fill('input[name="quantity"]', '100')
      await page.click('button:has-text("Save Line")')

      // Verify validation reset
      await expect(page.locator('[data-testid="validation-status"]')).toContainText('Needs Validation')
    })

    test('E2E-14: Editing line resets allergen_validated flag', async ({ page }) => {
      await page.goto('/shipping/sales-orders/so-validated')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Edit existing line
      await page.click('[data-testid="line-1-edit"]')
      await page.fill('input[name="quantity"]', '200')
      await page.click('button:has-text("Save")')

      // Verify validation reset
      await expect(page.locator('[data-testid="validation-status"]')).toContainText('Needs Validation')
    })
  })

  // ==========================================================================
  // AC-9: Customer Order History
  // ==========================================================================
  test.describe('AC-9: Customer Order History', () => {
    test('E2E-15: Customer order history displays in customer detail', async ({ page }) => {
      // Navigate to customer detail page
      await page.goto('/shipping/customers/cust-001')
      await page.waitForSelector('[data-testid="customer-detail-page"]')

      // Click Order History tab
      await page.click('[data-testid="tab-order-history"]')

      // Verify order history table
      await expect(page.locator('[data-testid="order-history-table"]')).toBeVisible()
      await expect(page.locator('text=SO-2025-')).toBeVisible()
    })

    test('E2E-16: Order history pagination works correctly', async ({ page }) => {
      // Navigate to customer with many orders
      await page.goto('/shipping/customers/cust-many-orders')
      await page.click('[data-testid="tab-order-history"]')

      // Verify pagination info
      await expect(page.locator('[data-testid="pagination-info"]')).toContainText('Showing 1-20')

      // Click next page
      await page.click('button:has-text("Next")')

      // Verify page 2 loaded
      await expect(page.locator('[data-testid="pagination-info"]')).toContainText('Showing 21-40')
    })

    test('E2E-17: Clicking View navigates to SO detail', async ({ page }) => {
      await page.goto('/shipping/customers/cust-001')
      await page.click('[data-testid="tab-order-history"]')

      // Click View on first order
      await page.click('[data-testid="view-order-0"]')

      // Verify navigation to SO detail
      await expect(page).toHaveURL(/\/shipping\/sales-orders\/so-/)
      await expect(page.locator('[data-testid="so-detail-page"]')).toBeVisible()
    })

    test('E2E-18: Empty state shows when customer has no orders', async ({ page }) => {
      // Navigate to customer with no orders
      await page.goto('/shipping/customers/cust-no-orders')
      await page.click('[data-testid="tab-order-history"]')

      // Verify empty state
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
      await expect(page.locator('[data-testid="empty-state"]')).toContainText('No orders yet')
    })
  })

  // ==========================================================================
  // Performance Tests
  // ==========================================================================
  test.describe('Performance', () => {
    test('E2E-19: Allergen validation completes within 1 second', async ({ page }) => {
      await page.goto('/shipping/sales-orders/so-50-lines')
      await page.waitForSelector('[data-testid="so-detail-page"]')

      // Measure validation time
      const startTime = Date.now()
      await page.click('button:has-text("Validate Allergens")')
      await page.waitForSelector('[data-testid="validation-complete"]')
      const endTime = Date.now()

      // Verify performance
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('E2E-20: Order history loads within 300ms', async ({ page }) => {
      await page.goto('/shipping/customers/cust-001')

      // Measure order history load time
      const startTime = Date.now()
      await page.click('[data-testid="tab-order-history"]')
      await page.waitForSelector('[data-testid="order-history-table"]')
      const endTime = Date.now()

      // Verify performance
      expect(endTime - startTime).toBeLessThan(300)
    })
  })
})

/**
 * Test Summary for SO Allergen Validation E2E Tests
 * ==================================================
 *
 * Test Coverage:
 * - AC-1 Allergen Validation: 5 tests
 * - AC-5 Manager Override: 7 tests
 * - Validation Reset: 2 tests
 * - AC-9 Customer Order History: 4 tests
 * - Performance: 2 tests
 * - Total: 20 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - Pages not implemented
 * - Components not implemented
 * - API endpoints not implemented
 *
 * Next Steps for DEV Team:
 * 1. Implement /api/shipping/sales-orders/:id/validate-allergens endpoint
 * 2. Implement /api/shipping/sales-orders/:id/override-allergen endpoint
 * 3. Implement /api/shipping/customers/:id/orders endpoint
 * 4. Create AllergenAlert component
 * 5. Create AllergenOverrideModal component
 * 6. Create CustomerOrderHistory component
 * 7. Update SO detail page with allergen validation UI
 * 8. Update Customer detail page with order history tab
 * 9. Run tests - should transition from RED to GREEN
 *
 * Files to Create/Modify:
 * - apps/frontend/app/(authenticated)/shipping/sales-orders/[id]/page.tsx
 * - apps/frontend/app/(authenticated)/shipping/customers/[id]/page.tsx
 * - apps/frontend/app/api/shipping/sales-orders/[id]/validate-allergens/route.ts
 * - apps/frontend/app/api/shipping/sales-orders/[id]/override-allergen/route.ts
 * - apps/frontend/app/api/shipping/customers/[id]/orders/route.ts
 * - apps/frontend/components/shipping/AllergenAlert.tsx
 * - apps/frontend/components/shipping/AllergenOverrideModal.tsx
 * - apps/frontend/components/shipping/CustomerOrderHistory.tsx
 * - apps/frontend/lib/services/so-allergen-validation-service.ts
 *
 * Coverage Target: Critical user journeys
 */
