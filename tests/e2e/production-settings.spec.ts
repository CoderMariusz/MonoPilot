import { test, expect } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe('Production Settings (Story 4.17)', () => {
  let orgId: string
  let adminUserId: string
  let adminToken: string
  let operatorUserId: string
  let operatorToken: string

  test.beforeAll(async () => {
    const org = await createTestOrganization()
    orgId = org.id

    const admin = await createTestUser(orgId, 'admin')
    adminUserId = admin.id
    adminToken = admin.token

    const operator = await createTestUser(orgId, 'operator')
    operatorUserId = operator.id
    operatorToken = operator.token
  })

  test.afterAll(async () => {
    await cleanupTestData(orgId)
  })

  test('AC-4.17.1: Admin can view settings page with all toggles and inputs', async ({
    page,
    context,
    baseURL,
  }) => {
    // Set auth cookie
    await context.addCookies([
      {
        name: 'sb-auth',
        value: adminToken,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/settings/production-execution')

    // Verify page title
    await expect(page.locator('h1')).toContainText('Production Settings')

    // Verify all toggle switches are visible
    await expect(page.locator('#allow-pause-wo')).toBeVisible()
    await expect(page.locator('#auto-complete-wo')).toBeVisible()
    await expect(page.locator('#require-operation-sequence')).toBeVisible()
    await expect(page.locator('#require-qa-on-output')).toBeVisible()
    await expect(page.locator('#auto-create-by-product-lp')).toBeVisible()

    // Verify dashboard refresh input is visible
    await expect(page.locator('#dashboard-refresh-seconds')).toBeVisible()
  })

  test('AC-4.17.3: Default values are set correctly', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: adminToken,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/settings/production-execution')

    // Verify toggle defaults (all true except auto_create_by_product_lp which is false)
    const allowPauseToggle = page.locator('#allow-pause-wo')
    const autoCompleteToggle = page.locator('#auto-complete-wo')
    const requireSequenceToggle = page.locator('#require-operation-sequence')
    const requireQaToggle = page.locator('#require-qa-on-output')
    const autoCreateByProductToggle = page.locator('#auto-create-by-product-lp')

    // Note: Shadcn Switch uses data-state or aria-checked attribute
    await expect(allowPauseToggle).toHaveAttribute('data-state', 'checked')
    await expect(autoCompleteToggle).toHaveAttribute('data-state', 'checked')
    await expect(requireSequenceToggle).toHaveAttribute('data-state', 'checked')
    await expect(requireQaToggle).toHaveAttribute('data-state', 'checked')
    await expect(autoCreateByProductToggle).toHaveAttribute('data-state', 'unchecked')

    // Verify dashboard refresh default is 30
    const refreshInput = page.locator('#dashboard-refresh-seconds')
    await expect(refreshInput).toHaveValue('30')
  })

  test('AC-4.17.5: Admin can toggle settings and changes persist', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: adminToken,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/settings/production-execution')

    // Toggle "Allow Pause WO" to false
    const allowPauseToggle = page.locator('#allow-pause-wo')
    await allowPauseToggle.click()

    // Wait for success toast
    await expect(page.locator('text=Settings updated successfully')).toBeVisible()

    // Refresh page
    await page.reload()

    // Verify toggle is still false after refresh
    const refreshedToggle = page.locator('#allow-pause-wo')
    await expect(refreshedToggle).toHaveAttribute('data-state', 'unchecked')
  })

  test('AC-4.17.6: Dashboard refresh interval validation works', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: adminToken,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/settings/production-execution')

    const refreshInput = page.locator('#dashboard-refresh-seconds')

    // Test minimum value (30)
    await refreshInput.clear()
    await refreshInput.fill('30')
    // Wait for auto-save
    await page.waitForTimeout(500)
    await expect(refreshInput).toHaveValue('30')

    // Test maximum value (300)
    await refreshInput.clear()
    await refreshInput.fill('300')
    await page.waitForTimeout(500)
    await expect(refreshInput).toHaveValue('300')

    // Test below minimum (10) - should show error or be prevented
    await refreshInput.clear()
    await refreshInput.fill('10')
    // Verify error message appears or value is not saved
    await expect(page.locator('text=must be between 30 and 300')).toBeVisible({ timeout: 5000 })

    // Test above maximum (400) - should show error or be prevented
    await refreshInput.clear()
    await refreshInput.fill('400')
    await expect(page.locator('text=must be between 30 and 300')).toBeVisible({ timeout: 5000 })
  })

  test('AC-4.17.8: Non-admin cannot modify production settings', async ({
    page,
    context,
    baseURL,
  }) => {
    // Try with operator account
    await context.addCookies([
      {
        name: 'sb-auth',
        value: operatorToken,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    const response = await page.request.put(`${baseURL}/api/production/settings`, {
      data: {
        allow_pause_wo: false,
      },
    })

    // Should get 403 Forbidden
    expect(response.status()).toBe(403)
    const body = await response.json()
    expect(body.error).toContain('Admin')
  })

  test('AC-4.17.4: GET endpoint returns settings for authenticated user', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/production/settings`, {
      headers: {
        cookie: `sb-auth=${adminToken}`,
      },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body.settings).toBeDefined()
    expect(body.settings).toHaveProperty('allow_pause_wo')
    expect(body.settings).toHaveProperty('auto_complete_wo')
    expect(body.settings).toHaveProperty('dashboard_refresh_seconds')
  })

  test('AC-4.17.2: Settings are isolated by org_id', async ({ request, baseURL }) => {
    // Create another org with different admin
    const org2 = await createTestOrganization()
    const admin2 = await createTestUser(org2.id, 'admin')

    const response1 = await request.get(`${baseURL}/api/production/settings`, {
      headers: { cookie: `sb-auth=${adminToken}` },
    })

    const response2 = await request.get(`${baseURL}/api/production/settings`, {
      headers: { cookie: `sb-auth=${admin2.token}` },
    })

    const settings1 = (await response1.json()).settings
    const settings2 = (await response2.json()).settings

    // Both should exist but be different (different orgs)
    expect(settings1).toBeDefined()
    expect(settings2).toBeDefined()
    expect(settings1.id).not.toBe(settings2.id)

    // Cleanup
    await cleanupTestData(org2.id)
  })

  test('Real-time application: Settings change applies immediately', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: adminToken,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/settings/production-execution')

    // Change dashboard refresh to 60
    const refreshInput = page.locator('#dashboard-refresh-seconds')
    await refreshInput.clear()
    await refreshInput.fill('60')

    // Wait for success message
    await expect(page.locator('text=Dashboard refresh interval updated')).toBeVisible({ timeout: 5000 })

    // Value should be updated immediately without page reload
    await expect(refreshInput).toHaveValue('60')
  })
})
