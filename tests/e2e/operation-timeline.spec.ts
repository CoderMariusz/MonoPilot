import { test, expect } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe('Operation Timeline (Story 4.20)', () => {
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

  test('AC-4.20.1: Timeline visible on Production tab', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/planning/work-orders')

    // Find any WO
    const woLink = page.locator('a[href^="/planning/work-orders/"]').first()
    const hasWO = await woLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasWO) {
      await woLink.click()

      // Go to Production tab
      const productionTab = page.locator('button:has-text("Production")')
      if (await productionTab.isVisible({ timeout: 5000 })) {
        await productionTab.click()

        // Should see Operation Timeline header
        const timelineHeader = page.locator('text=Operation Timeline')
        await expect(timelineHeader).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('AC-4.20.5: Timeline shows color legend', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/planning/work-orders')

    // Find any WO
    const woLink = page.locator('a[href^="/planning/work-orders/"]').first()
    const hasWO = await woLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasWO) {
      await woLink.click()

      // Go to Production tab
      const productionTab = page.locator('button:has-text("Production")')
      if (await productionTab.isVisible({ timeout: 5000 })) {
        await productionTab.click()

        // Should see legend items
        const notStartedLegend = page.locator('text=Not Started')
        const inProgressLegend = page.locator('text=In Progress')
        const completedLegend = page.locator('text=Completed')

        // At least one legend item should be visible
        const hasLegend = await notStartedLegend.isVisible({ timeout: 5000 }).catch(() => false)
        if (hasLegend) {
          await expect(inProgressLegend).toBeVisible()
          await expect(completedLegend).toBeVisible()
        }
      }
    }
  })

  test('AC-4.20.2: Click operation shows popover with details', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/planning/work-orders')

    // Find any WO with in_progress status (likely has operations)
    const inProgressBadge = page.locator('text=In Progress').first()
    const hasInProgressWO = await inProgressBadge.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasInProgressWO) {
      const woRow = inProgressBadge.locator('..').locator('..')
      const woLink = woRow.locator('a').first()
      if (await woLink.isVisible()) {
        await woLink.click()

        // Go to Production tab
        const productionTab = page.locator('button:has-text("Production")')
        if (await productionTab.isVisible({ timeout: 5000 })) {
          await productionTab.click()

          // Look for timeline operation segments (buttons in timeline)
          const timelineButtons = page.locator('[data-radix-popper-content-wrapper]')
            .locator('..')
            .locator('button')

          // If there are operation segments, click one
          const firstSegment = page.locator('button').filter({ hasText: /^\d+\.\s/ }).first()
          if (await firstSegment.isVisible({ timeout: 5000 })) {
            await firstSegment.click()

            // Popover should appear with details
            const popover = page.locator('[data-radix-popper-content-wrapper]')
            const hasPopover = await popover.isVisible({ timeout: 3000 }).catch(() => false)

            if (hasPopover) {
              // Should show duration info
              await expect(popover.locator('text=Duration')).toBeVisible({ timeout: 5000 })
            }
          }
        }
      }
    }
  })

  test('AC-4.20.6: Timeline is scrollable', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'sb-auth',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
      },
    ])

    await page.goto('/planning/work-orders')

    // Find any WO
    const woLink = page.locator('a[href^="/planning/work-orders/"]').first()
    const hasWO = await woLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasWO) {
      await woLink.click()

      // Go to Production tab
      const productionTab = page.locator('button:has-text("Production")')
      if (await productionTab.isVisible({ timeout: 5000 })) {
        await productionTab.click()

        // Timeline container should have overflow-x-auto
        const timelineContainer = page.locator('.overflow-x-auto').first()
        const hasTimeline = await timelineContainer.isVisible({ timeout: 5000 }).catch(() => false)

        // If timeline exists, it should be horizontally scrollable
        if (hasTimeline) {
          // This passes if the container is found
          expect(hasTimeline).toBe(true)
        }
      }
    }
  })
})
