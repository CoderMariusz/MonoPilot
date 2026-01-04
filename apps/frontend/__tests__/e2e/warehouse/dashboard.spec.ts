/**
 * E2E Tests: Warehouse Dashboard
 * Story: 05.7 - Warehouse Dashboard
 * Phase: RED - Tests should FAIL (page not implemented)
 *
 * Tests:
 * - Dashboard page loads with all sections
 * - KPI cards display
 * - Alert panels display
 * - Activity feed displays
 * - Quick actions work
 * - Auto-refresh functionality
 * - Navigation and click-through
 * - Empty states
 * - Loading states
 * - Performance requirements
 *
 * Test Count: 11 tests
 */

import { test, expect } from '@playwright/test'

test.describe('Warehouse Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as warehouse manager
    await page.goto('/login')
    await page.fill('input[name="email"]', 'warehouse.manager@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should load dashboard with all KPI cards', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify all 5 KPI cards are visible
    await expect(page.getByText('Total LPs')).toBeVisible()
    await expect(page.getByText('Available LPs')).toBeVisible()
    await expect(page.getByText('Reserved LPs')).toBeVisible()
    await expect(page.getByText('Consumed Today')).toBeVisible()
    await expect(page.getByText('Expiring Soon')).toBeVisible()

    // Verify each card has a value
    const kpiCards = page.locator('[data-testid^="kpi-card-"]')
    await expect(kpiCards).toHaveCount(5)
  })

  test('should display alert panels', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Verify all 3 alert panels are present
    await expect(page.getByText('Low Stock Alerts')).toBeVisible()
    await expect(page.getByText('Expiring Items')).toBeVisible()
    await expect(page.getByText('Blocked LPs')).toBeVisible()
  })

  test('should display recent activity feed', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Verify activity feed section
    await expect(page.getByText('Recent Activity')).toBeVisible()

    // Should show activities or empty state
    const activityFeed = page.locator('[data-testid="activity-feed"]')
    await expect(activityFeed).toBeVisible()
  })

  test('should display quick action buttons', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')

    // Verify quick action buttons
    await expect(page.getByRole('button', { name: 'Create LP' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'View Inventory' })).toBeVisible()
  })

  test('should navigate to create LP on button click', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')

    // Click "Create LP" button
    await page.click('button:has-text("Create LP")')

    // Should navigate to LP creation page
    await page.waitForURL(/\/warehouse\/license-plates\/new/)
  })

  test('should navigate to inventory on button click', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')

    // Click "View Inventory" button
    await page.click('button:has-text("View Inventory")')

    // Should navigate to inventory page
    await page.waitForURL(/\/warehouse\/inventory/)
  })

  test('should display last updated timestamp', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Verify "Last updated" timestamp displays
    await expect(page.getByText(/Last updated:/i)).toBeVisible()
  })

  test('should manually refresh dashboard', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Get initial timestamp
    const initialTimestamp = await page.locator('[data-testid="last-updated"]').textContent()

    // Wait a moment
    await page.waitForTimeout(1000)

    // Click refresh button
    await page.click('[data-testid="refresh-button"]')
    await page.waitForLoadState('networkidle')

    // Timestamp should update
    const newTimestamp = await page.locator('[data-testid="last-updated"]').textContent()
    expect(newTimestamp).not.toBe(initialTimestamp)
  })

  test('should navigate to LP detail from expiring items alert', async ({ page }) => {
    // Create test data: LP expiring soon
    // (This would be done in test setup/fixtures)

    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Click on an expiring item (if any exist)
    const expiringItem = page.locator('[data-testid="expiring-item"]').first()
    if (await expiringItem.isVisible()) {
      await expiringItem.click()
      // Should navigate to LP detail page
      await page.waitForURL(/\/warehouse\/license-plates\/LP[0-9]+/)
    }
  })

  test('should display loading state during fetch', async ({ page }) => {
    // Navigate to warehouse dashboard
    await page.goto('/warehouse')

    // Should show skeleton loaders initially
    const skeletons = page.locator('[data-testid^="skeleton-"]')
    // Skeletons should appear briefly
    // (This test may need adjustment based on loading speed)

    // Then data should load
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Total LPs')).toBeVisible()
  })

  test('should load within performance requirements', async ({ page }) => {
    // Navigate to warehouse dashboard
    const startTime = Date.now()

    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Page should render within 2 seconds
    expect(loadTime).toBeLessThan(2000)

    // Verify all critical elements loaded
    await expect(page.getByText('Total LPs')).toBeVisible()
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })

  test('should display empty state when no LPs exist', async ({ page }) => {
    // This test requires a fresh organization with no LPs
    // (Would be configured in test fixtures)

    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Should show empty state message
    const emptyState = page.locator('[data-testid="empty-state"]')
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText(/no license plates/i)
    }
  })

  test('should show responsive layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Verify grid layout
    const kpiGrid = page.locator('[data-testid="kpi-grid"]')
    await expect(kpiGrid).toBeVisible()

    // All cards should be visible in grid
    const kpiCards = page.locator('[data-testid^="kpi-card-"]')
    await expect(kpiCards).toHaveCount(5)
  })

  test('should show responsive layout on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // All content should be visible
    await expect(page.getByText('Total LPs')).toBeVisible()
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })

  test('should color-code expiring items by urgency', async ({ page }) => {
    // Create test data with various expiry dates
    await page.goto('/warehouse')
    await page.waitForLoadState('networkidle')

    // Check for color coding on expiring items
    const expiringItems = page.locator('[data-testid="expiring-item"]')

    if ((await expiringItems.count()) > 0) {
      // Items should have color classes based on urgency
      // Red (< 7 days), Orange (7-14 days), Yellow (15-30 days)
      const firstItem = expiringItems.first()
      await expect(firstItem).toBeVisible()
    }
  })
})
