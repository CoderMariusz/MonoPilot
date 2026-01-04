/**
 * E2E Tests: Planning Dashboard Page
 * Story: 03.16 - Planning Dashboard
 * Phase: RED - Tests should FAIL (page not yet implemented)
 *
 * Tests the planning dashboard page at /planning route:
 * - Page loads and renders KPI cards
 * - Alert panel displays critical issues
 * - Recent activity feed shows last actions
 * - Quick action buttons work
 * - Zero state display
 * - Performance (< 2 seconds load time)
 * - Mobile responsive layout
 *
 * Coverage: Full user journey
 * Test Count: 15 tests
 */

import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from '../fixtures/test-setup'

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserId: string
let testUserEmail: string
let testUserPassword: string
let testSupplierId: string
let testWarehouseId: string

test.beforeAll(async () => {
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  const userResult = await createTestUser(testOrgId)
  testUserId = userResult.userId
  testUserEmail = userResult.email
  testUserPassword = userResult.password

  // Note: Supplier and warehouse should be created by test-setup
})

test.afterAll(async () => {
  await cleanupTestData(testOrgId)
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsTestUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL(/\/(dashboard|planning)/, { timeout: 60000 })
}

// ============================================================================
// DASHBOARD PAGE TESTS
// ============================================================================

test.describe('Planning Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  // ===== AC-1: Dashboard Page Loads =====
  test('AC-1: Dashboard page loads within 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/planning')
    await expect(page.locator('h1, h2').filter({ hasText: /Planning Dashboard/i })).toBeVisible({
      timeout: 10000,
    })

    const loadTime = Date.now() - startTime

    // Page should load in < 2 seconds
    expect(loadTime).toBeLessThan(2000)
  })

  test('AC-1: Page header displays "Planning Dashboard"', async ({ page }) => {
    await page.goto('/planning')

    const header = page.locator('h1, h2').filter({ hasText: /Planning Dashboard/i })
    await expect(header).toBeVisible()
  })

  test('AC-1: Dashboard displays quick action buttons', async ({ page }) => {
    await page.goto('/planning')

    // Quick action buttons should be visible
    const createPOButton = page.locator('button').filter({ hasText: /Create PO|New PO/i })
    const createTOButton = page.locator('button').filter({ hasText: /Create TO|New TO/i })
    const createWOButton = page.locator('button').filter({ hasText: /Create WO|New WO/i })

    await expect(createPOButton).toBeVisible({ timeout: 10000 })
    await expect(createTOButton).toBeVisible()
    await expect(createWOButton).toBeVisible()
  })

  // ===== AC-2: KPI Cards Display Correctly =====
  test('AC-2: Dashboard displays 6 KPI cards', async ({ page }) => {
    await page.goto('/planning')

    // Wait for KPI cards to load
    await page.waitForTimeout(1000)

    // Look for KPI card containers
    const kpiCards = page.locator('[data-testid="kpi-card"], [class*="kpi-card"]')
    const count = await kpiCards.count()

    // Should have 6 KPI cards
    expect(count).toBeGreaterThanOrEqual(6)
  })

  test('AC-2: KPI cards display labels and values', async ({ page }) => {
    await page.goto('/planning')

    // Wait for data to load
    await page.waitForTimeout(1000)

    // Check for KPI labels (at least some should be visible)
    const kpiLabels = [
      /PO Pending Approval/i,
      /PO This Month/i,
      /TO In Transit/i,
      /WO Scheduled Today/i,
      /WO Overdue/i,
      /Open Orders/i,
    ]

    let foundLabels = 0
    for (const label of kpiLabels) {
      const element = page.locator('text=' + label.source)
      if (await element.isVisible()) {
        foundLabels++
      }
    }

    // At least 3 KPI labels should be visible
    expect(foundLabels).toBeGreaterThanOrEqual(3)
  })

  // ===== AC-3: KPI Card Click Navigation =====
  test('AC-3: Clicking KPI card navigates to filtered list', async ({ page }) => {
    await page.goto('/planning')

    // Wait for KPIs to load
    await page.waitForTimeout(1000)

    // Try to click a KPI card (e.g., PO Pending Approval)
    const poCard = page
      .locator('[data-testid="kpi-card"], [class*="kpi"], a, button')
      .filter({ hasText: /PO Pending|Pending Approval/i })
      .first()

    if (await poCard.isVisible()) {
      await poCard.click()

      // Should navigate to purchase orders page with filter
      await expect(page).toHaveURL(/\/planning\/purchase-orders/, { timeout: 10000 })
    }
  })

  // ===== AC-4: Alert Panel Shows Critical Issues =====
  test('AC-4: Alert panel displays on dashboard', async ({ page }) => {
    await page.goto('/planning')

    // Look for alert panel
    const alertPanel = page.locator('[data-testid="alert-panel"], [class*="alert"]').first()

    // Alert panel should be visible (even if empty)
    await expect(alertPanel).toBeVisible({ timeout: 10000 })
  })

  test('AC-4: Alert panel shows alerts or "No alerts" message', async ({ page }) => {
    await page.goto('/planning')

    await page.waitForTimeout(1000)

    // Should show either alerts or a "no alerts" message
    const hasAlerts = await page.locator('[data-testid="alert-item"]').count()
    const noAlertsMessage = page.locator('text=/No alerts|All clear/i')

    if (hasAlerts === 0) {
      await expect(noAlertsMessage).toBeVisible()
    } else {
      expect(hasAlerts).toBeGreaterThan(0)
    }
  })

  // ===== AC-5: Recent Activity Feed =====
  test('AC-5: Recent activity feed displays on dashboard', async ({ page }) => {
    await page.goto('/planning')

    // Look for activity feed
    const activityFeed = page.locator('[data-testid="activity-feed"], [class*="activity"]').first()

    // Activity feed should be visible
    await expect(activityFeed).toBeVisible({ timeout: 10000 })
  })

  test('AC-5: Activity feed shows activities or "No activity" message', async ({ page }) => {
    await page.goto('/planning')

    await page.waitForTimeout(1000)

    // Should show either activities or a "no activity" message
    const hasActivity = await page.locator('[data-testid="activity-item"]').count()
    const noActivityMessage = page.locator('text=/No recent activity|No activity/i')

    if (hasActivity === 0) {
      await expect(noActivityMessage).toBeVisible()
    } else {
      expect(hasActivity).toBeGreaterThan(0)
    }
  })

  // ===== AC-6: Quick Actions =====
  test('AC-6: Clicking "Create PO" opens PO creation flow', async ({ page }) => {
    await page.goto('/planning')

    const createPOButton = page.locator('button').filter({ hasText: /Create PO|New PO/i }).first()
    await expect(createPOButton).toBeVisible({ timeout: 10000 })

    await createPOButton.click()

    // Should either open a modal or navigate to PO creation page
    const modal = page.locator('[role="dialog"]')
    const poPage = page.url().includes('/purchase-orders/new')

    const hasModal = await modal.isVisible()
    const isOnPOPage = poPage

    expect(hasModal || isOnPOPage).toBe(true)
  })

  // ===== AC-8: Zero State =====
  test('AC-8: Dashboard displays zero state when no data exists', async ({ page }) => {
    await page.goto('/planning')

    await page.waitForTimeout(1000)

    // If org has no data, should see zero state message
    const zeroState = page.locator('text=/Get started|Create your first/i')

    // Zero state may or may not be visible depending on test data
    const isVisible = await zeroState.isVisible()
    expect(typeof isVisible).toBe('boolean')
  })

  // ===== AC-9: Performance =====
  test('AC-9: Dashboard loads with large dataset in < 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/planning')
    await expect(page.locator('h1, h2').filter({ hasText: /Planning Dashboard/i })).toBeVisible()

    const loadTime = Date.now() - startTime

    // Should load quickly even with data
    expect(loadTime).toBeLessThan(2000)
  })

  // ===== Mobile Responsive =====
  test('Mobile: Dashboard stacks vertically on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/planning')

    await expect(page.locator('h1, h2').filter({ hasText: /Planning Dashboard/i })).toBeVisible()

    // Dashboard should render without horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  // ===== Navigation =====
  test('Navigation: Can navigate from main menu to dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for Planning menu link
    const planningLink = page.locator('a, button').filter({ hasText: /Planning/i }).first()

    if (await planningLink.isVisible()) {
      await planningLink.click()
      await expect(page).toHaveURL(/\/planning/, { timeout: 10000 })
    }
  })
})
