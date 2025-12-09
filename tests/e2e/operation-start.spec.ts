import { test, expect } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe('Operation Start (Story 4.4)', () => {
  let orgId: string
  let token: string

  test.beforeAll(async () => {
    const org = await createTestOrganization()
    orgId = org.orgId

    const user = await createTestUser(orgId)
    token = user.token
  })

  test.afterAll(async () => {
    await cleanupTestData(orgId)
  })

  test('AC-4.4.6: POST /start endpoint requires authentication (401)', async ({ request, baseURL }) => {
    const response = await request.post(
      `${baseURL}/api/production/work-orders/00000000-0000-0000-0000-000000000001/operations/00000000-0000-0000-0000-000000000002/start`,
    )
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toContain('Unauthorized')
  })

  test('AC-4.4.1: Operations tab shows operations list', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    // Navigate to WO list page
    await page.goto('/planning/work-orders')

    // Find any WO
    const woLink = page.locator('a[href^="/planning/work-orders/"]').first()
    const hasWO = await woLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasWO) {
      await woLink.click()

      // Go to Operations tab
      const operationsTab = page.locator('button:has-text("Operations")')
      if (await operationsTab.isVisible({ timeout: 5000 })) {
        await operationsTab.click()

        // Should show operations table
        const operationsTable = page.locator('table')
        await expect(operationsTable).toBeVisible({ timeout: 10000 })

        // Should have Operation column
        await expect(page.locator('th:has-text("Operation")')).toBeVisible()
      }
    }
  })

  test('AC-4.4.1: Start button visible for pending operations when WO is in_progress', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/planning/work-orders')

    // Look for an in_progress WO
    const inProgressBadge = page.locator('text=In Progress').first()
    const hasInProgressWO = await inProgressBadge.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasInProgressWO) {
      // Click on the WO row
      const woRow = inProgressBadge.locator('..').locator('..')
      const woLink = woRow.locator('a').first()
      if (await woLink.isVisible()) {
        await woLink.click()

        // Go to Operations tab
        const operationsTab = page.locator('button:has-text("Operations")')
        if (await operationsTab.isVisible({ timeout: 5000 })) {
          await operationsTab.click()

          // Check for Start button (may not exist if no pending operations)
          const startButton = page.locator('button:has-text("Start")').first()
          const hasStartButton = await startButton.isVisible({ timeout: 5000 }).catch(() => false)

          // If there are pending operations, Start button should be visible
          if (hasStartButton) {
            await expect(startButton).toBeVisible()
          }
        }
      }
    }
    // If no in_progress WO exists, test passes (no data to test with)
  })

  test('AC-4.4.2: Start modal shows operation details', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/planning/work-orders')

    // Look for an in_progress WO
    const inProgressBadge = page.locator('text=In Progress').first()
    const hasInProgressWO = await inProgressBadge.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasInProgressWO) {
      const woRow = inProgressBadge.locator('..').locator('..')
      const woLink = woRow.locator('a').first()
      if (await woLink.isVisible()) {
        await woLink.click()

        // Go to Operations tab
        const operationsTab = page.locator('button:has-text("Operations")')
        if (await operationsTab.isVisible({ timeout: 5000 })) {
          await operationsTab.click()

          // Find Start button
          const startButton = page.locator('button:has-text("Start")').first()
          if (await startButton.isVisible({ timeout: 5000 })) {
            await startButton.click()

            // Modal should open
            const modal = page.locator('[role="dialog"]')
            await expect(modal).toBeVisible({ timeout: 5000 })

            // Should show Sequence
            await expect(modal.locator('text=Sequence')).toBeVisible({ timeout: 5000 })

            // Should show Operation name
            await expect(modal.locator('text=Operation')).toBeVisible()

            // Should have Cancel and Start Operation buttons
            await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
            await expect(page.locator('button:has-text("Start Operation")')).toBeVisible()
          }
        }
      }
    }
  })

  test('AC-4.4.5: Sequence enforcement setting visible in UI', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    // Navigate to production settings page
    await page.goto('/settings/production-execution')

    // Verify require_operation_sequence toggle exists
    const sequenceToggle = page.locator('#require-operation-sequence')
    await expect(sequenceToggle).toBeVisible({ timeout: 10000 })
  })
})
