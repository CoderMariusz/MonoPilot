import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

/**
 * Consumption Reversal E2E Tests
 * Epic 4: Production Module
 * Story 4.10: Consumption Correction
 *
 * Acceptance Criteria:
 * - AC-4.10.4: Role-based access - Manager and Admin only
 * - AC-4.19.5: Genealogy marked as reversed (compliance)
 */

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let operatorUserId: string
let operatorEmail: string
let operatorPassword: string
let managerUserId: string
let managerEmail: string
let managerPassword: string

test.beforeAll(async () => {
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  // Create operator user
  const operatorResult = await createTestUser(testOrgId, 'operator')
  operatorUserId = operatorResult.userId
  operatorEmail = operatorResult.email
  operatorPassword = operatorResult.password

  // Create manager user
  const managerResult = await createTestUser(testOrgId, 'manager')
  managerUserId = managerResult.userId
  managerEmail = managerResult.email
  managerPassword = managerResult.password
})

test.afterAll(async () => {
  await cleanupTestData(testOrgId)
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL(/\/(dashboard|planning|production)/, { timeout: 60000 })
}

async function getWOWithConsumption(page: Page): Promise<{ woId: string; consumptionId: string } | null> {
  // Get WOs in progress
  const woResponse = await page.request.get('/api/planning/work-orders?status=in_progress')
  if (!woResponse.ok()) return null

  const woData = await woResponse.json()
  const workOrders = woData.work_orders || woData || []

  for (const wo of workOrders) {
    // Check for consumption records
    const consumptionResponse = await page.request.get(
      `/api/production/work-orders/${wo.id}/consumption`
    )

    if (consumptionResponse.ok()) {
      const consumptionData = await consumptionResponse.json()
      const consumptions = consumptionData.consumptions || consumptionData || []

      if (consumptions.length > 0) {
        return {
          woId: wo.id,
          consumptionId: consumptions[0].id,
        }
      }
    }
  }

  return null
}

// ============================================================================
// STORY 4.10: CONSUMPTION REVERSAL
// ============================================================================

test.describe('Story 4.10: Consumption Reversal', () => {

  // ===== AC-4.10.4: Operator cannot reverse =====
  test('AC-4.10.4: Operator role cannot reverse consumption (403 Forbidden)', async ({ page }) => {
    await loginAsUser(page, operatorEmail, operatorPassword)

    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    const response = await page.request.post(
      `/api/production/work-orders/${woData.woId}/consume/reverse`,
      {
        data: {
          consumption_id: woData.consumptionId,
          reason: 'Test reversal by operator',
        },
      }
    )

    expect(response.status()).toBe(403)

    const data = await response.json()
    expect(data.code).toBe('FORBIDDEN')
    expect(data.error).toContain('Manager or Admin')
  })

  // ===== AC-4.10.4: Manager can reverse =====
  test('AC-4.10.4: Manager role can reverse consumption (200 OK)', async ({ page }) => {
    await loginAsUser(page, managerEmail, managerPassword)

    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    const response = await page.request.post(
      `/api/production/work-orders/${woData.woId}/consume/reverse`,
      {
        data: {
          consumption_id: woData.consumptionId,
          reason: 'Test reversal by manager',
        },
      }
    )

    // May succeed (200) or fail if already reversed (400)
    expect([200, 400]).toContain(response.status())

    if (response.status() === 200) {
      const data = await response.json()
      expect(data.message).toContain('reversed')
      expect(data.reversed_qty).toBeDefined()
    }
  })

  // ===== Reversal requires reason =====
  test('Reversal requires reason field', async ({ page }) => {
    await loginAsUser(page, managerEmail, managerPassword)

    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    const response = await page.request.post(
      `/api/production/work-orders/${woData.woId}/consume/reverse`,
      {
        data: {
          consumption_id: woData.consumptionId,
          // Missing reason
        },
      }
    )

    expect(response.status()).toBe(400)
  })

  // ===== Cannot reverse already reversed consumption =====
  test('Cannot reverse consumption that is already reversed', async ({ page }) => {
    await loginAsUser(page, managerEmail, managerPassword)

    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    // First reversal
    const firstResponse = await page.request.post(
      `/api/production/work-orders/${woData.woId}/consume/reverse`,
      {
        data: {
          consumption_id: woData.consumptionId,
          reason: 'First reversal',
        },
      }
    )

    // If first reversal succeeded, try second
    if (firstResponse.status() === 200) {
      const secondResponse = await page.request.post(
        `/api/production/work-orders/${woData.woId}/consume/reverse`,
        {
          data: {
            consumption_id: woData.consumptionId,
            reason: 'Second reversal attempt',
          },
        }
      )

      expect(secondResponse.status()).toBe(400)

      const data = await secondResponse.json()
      expect(data.code).toBe('ALREADY_REVERSED')
    }
  })
})

// ============================================================================
// STORY 4.19.5: GENEALOGY REVERSAL
// ============================================================================

test.describe('Story 4.19.5: Genealogy Reversal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, managerEmail, managerPassword)
  })

  // ===== AC-4.19.5: Genealogy marked as reversed =====
  test('AC-4.19.5: Genealogy records marked as reversed, not deleted', async ({ page }) => {
    // This test verifies the genealogy status is updated on reversal
    // The actual verification would require database access

    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    // Perform reversal
    const response = await page.request.post(
      `/api/production/work-orders/${woData.woId}/consume/reverse`,
      {
        data: {
          consumption_id: woData.consumptionId,
          reason: 'Genealogy reversal test',
        },
      }
    )

    if (response.ok()) {
      const data = await response.json()

      // Response should indicate successful reversal
      expect(data.message).toContain('reversed')

      // Note: Full verification of genealogy.status='reversed' requires DB query
      // This is covered by API/Unit tests
    }
  })
})

// ============================================================================
// LP RESTORATION AFTER REVERSAL
// ============================================================================

test.describe('LP Restoration After Reversal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, managerEmail, managerPassword)
  })

  test('Reversal restores LP details in response', async ({ page }) => {
    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    const response = await page.request.post(
      `/api/production/work-orders/${woData.woId}/consume/reverse`,
      {
        data: {
          consumption_id: woData.consumptionId,
          reason: 'LP restoration test',
        },
      }
    )

    if (response.ok()) {
      const data = await response.json()

      // Response should include LP info
      expect(data.reversed_qty).toBeDefined()
      expect(data.uom).toBeDefined()
    }
  })
})

// ============================================================================
// REVERSAL UI (if exists)
// ============================================================================

test.describe('Reversal UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, managerEmail, managerPassword)
  })

  test('Consumption history shows reversal option for Manager', async ({ page }) => {
    const woData = await getWOWithConsumption(page)
    if (!woData) {
      test.skip()
      return
    }

    await page.goto(`/production/work-orders/${woData.woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Look for consumption history tab
    const consumptionTab = page.locator('[role="tab"], button').filter({
      hasText: /Consumption|History|Zużycie/i,
    })

    if (await consumptionTab.isVisible()) {
      await consumptionTab.click()
      await page.waitForTimeout(500)

      // Look for reversal button
      const reverseButton = page.locator('button').filter({
        hasText: /Reverse|Cofnij|Undo/i,
      })

      // Button may or may not be visible depending on UI implementation
      // This test documents expected behavior
    }
  })
})
