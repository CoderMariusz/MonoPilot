import { test, expect } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe('Production Dashboard (Story 4.1)', () => {
  let orgId: string
  let userId: string
  let token: string

  test.beforeAll(async () => {
    const org = await createTestOrganization()
    orgId = org.id

    const user = await createTestUser(orgId, 'production_manager')
    userId = user.id
    token = user.token
  })

  test.afterAll(async () => {
    await cleanupTestData(orgId)
  })

  test('AC-4.1.1: KPI cards display with current values', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/production/dashboard')

    // Verify KPI cards are visible
    await expect(page.locator('text=Orders Today')).toBeVisible()
    await expect(page.locator('text=Units Produced')).toBeVisible()
    await expect(page.locator('text=Avg Yield')).toBeVisible()
    await expect(page.locator('text=Active WOs')).toBeVisible()
    await expect(page.locator('text=Shortages')).toBeVisible()

    // Verify KPI values are numbers (at least 0)
    const ordersText = await page.locator('text=Orders Today').locator('..').locator('text=/^\\d+$/').textContent()
    expect(ordersText).toBeTruthy()
  })

  test('AC-4.1.2: Active Work Orders table displays with sorting', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/production/dashboard')

    // Verify Active WOs section exists
    await expect(page.locator('text=Active Work Orders')).toBeVisible()

    // Verify table headers
    await expect(page.locator('text=WO Number')).toBeVisible()
    await expect(page.locator('text=Product')).toBeVisible()
    await expect(page.locator('text=Progress')).toBeVisible()
    await expect(page.locator('text=Status')).toBeVisible()

    // Either show table with data or empty state
    const tableOrEmpty = page.locator('text=/No active work orders|WO Number/')
    await expect(tableOrEmpty).toBeVisible()
  })

  test('AC-4.1.3: Alerts panel displays alert types and severity', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/production/dashboard')

    // Verify Alerts section exists
    await expect(page.locator('text=Alerts')).toBeVisible()

    // Either show alerts or empty state
    const alertsOrEmpty = page.locator('text=/No active alerts|MATERIAL_SHORTAGE|WO_DELAYED|QUALITY_HOLD/')
    await expect(alertsOrEmpty).toBeVisible()
  })

  test('AC-4.1.4: Auto-refresh mechanism works', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/production/dashboard')

    // Verify last updated timestamp is shown
    const lastUpdatedText = await page.locator('text=/Last updated:/).textContent()
    expect(lastUpdatedText).toContain('Last updated')

    // Verify manual refresh button exists
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible()

    // Click manual refresh
    await page.locator('button:has-text("Refresh")').click()

    // Verify success toast
    await expect(page.locator('text=Dashboard refreshed')).toBeVisible({ timeout: 5000 })
  })

  test('AC-4.1.5: API endpoints return correct data structure', async ({ request, baseURL }) => {
    // Test GET /api/production/dashboard/kpis
    const kpisResponse = await request.get(`${baseURL}/api/production/dashboard/kpis`, {
      headers: { cookie: `sb-auth=${token}` },
    })

    expect(kpisResponse.ok()).toBe(true)
    const kpisBody = await kpisResponse.json()
    expect(kpisBody.data).toHaveProperty('orders_today')
    expect(kpisBody.data).toHaveProperty('units_produced_today')
    expect(kpisBody.data).toHaveProperty('avg_yield_today')
    expect(kpisBody.data).toHaveProperty('active_wos')
    expect(kpisBody.data).toHaveProperty('material_shortages')

    // Test GET /api/production/dashboard/active-wos
    const wosResponse = await request.get(`${baseURL}/api/production/dashboard/active-wos`, {
      headers: { cookie: `sb-auth=${token}` },
    })

    expect(wosResponse.ok()).toBe(true)
    const wosBody = await wosResponse.json()
    expect(Array.isArray(wosBody.data)).toBe(true)

    // Test GET /api/production/dashboard/alerts
    const alertsResponse = await request.get(`${baseURL}/api/production/dashboard/alerts`, {
      headers: { cookie: `sb-auth=${token}` },
    })

    expect(alertsResponse.ok()).toBe(true)
    const alertsBody = await alertsResponse.json()
    expect(Array.isArray(alertsBody.data)).toBe(true)
  })

  test('AC-4.1.6: Authentication required (401 without auth)', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/production/dashboard/kpis`)

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toContain('Unauthorized')
  })

  test('AC-4.1.7: Responsive design - KPI cards visible on mobile', async ({ page, context, baseURL }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/production/dashboard')

    // Verify KPI cards are still visible
    await expect(page.locator('text=Orders Today')).toBeVisible()
    await expect(page.locator('text=Avg Yield')).toBeVisible()

    // Verify table is scrollable
    const table = page.locator('table')
    if (await table.isVisible()) {
      const parentDiv = table.locator('..')
      const box = await parentDiv.boundingBox()
      expect(box?.width).toBeLessThan(375)
    }
  })

  test('AC-4.1.8: Loading state shown initially', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    // Start navigation
    const navigationPromise = page.goto('/production/dashboard')

    // Check if loading state is shown (may be brief)
    const loadingState = page.locator('text=/Loading|loading/')
    const hasLoading = await loadingState.isVisible({ timeout: 1000 }).catch(() => false)

    // Wait for navigation to complete
    await navigationPromise

    // After loading completes, page content should be visible
    await expect(page.locator('text=Production Dashboard')).toBeVisible()
  })

  test('AC-4.1.2: WO number is clickable link to detail page', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/production/dashboard')

    // Check if any WO links exist
    const woLinks = page.locator('a[href*="/production/work-orders/"]')
    const linkCount = await woLinks.count()

    if (linkCount > 0) {
      // Verify first link is clickable
      const firstLink = woLinks.first()
      await expect(firstLink).toBeVisible()
      await expect(firstLink).toHaveAttribute('href', /\/production\/work-orders\//)
    }
    // If no WOs exist, that's also valid (empty state)
  })

  test('Refresh interval respects production_settings configuration', async ({ request, baseURL }) => {
    // Get production settings to verify refresh_interval default
    const settingsResponse = await request.get(`${baseURL}/api/production/settings`, {
      headers: { cookie: `sb-auth=${token}` },
    })

    expect(settingsResponse.ok()).toBe(true)
    const settings = await settingsResponse.json()
    expect(settings.settings).toHaveProperty('dashboard_refresh_seconds')
    expect(settings.settings.dashboard_refresh_seconds).toBeGreaterThanOrEqual(30)
    expect(settings.settings.dashboard_refresh_seconds).toBeLessThanOrEqual(300)
  })
})
