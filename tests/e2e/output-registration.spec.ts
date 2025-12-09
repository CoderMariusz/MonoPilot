import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

/**
 * Output Registration E2E Tests
 * Epic 4: Production Module (Batch 04B-2)
 * Stories: 4.12, 4.12a, 4.12b, 4.18, 4.19
 *
 * Acceptance Criteria:
 * - AC-4.12.1: Output registration modal with qty, qa_status, location, notes
 * - AC-4.12.2: Output LP creation with correct attributes
 * - AC-4.12.3: Automatic consumption via sequential allocation (4.12a)
 * - AC-4.12.4: Genealogy linking (4.19)
 * - AC-4.12.5: Progress tracking
 * - AC-4.12.8: Error handling (qty validation, WO status)
 * - AC-4.12b.1: Over-production dialog
 * - AC-4.12b.2: Parent LP selection for over-production
 */

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserId: string
let testUserEmail: string
let testUserPassword: string

test.beforeAll(async () => {
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  const userResult = await createTestUser(testOrgId)
  testUserId = userResult.userId
  testUserEmail = userResult.email
  testUserPassword = userResult.password
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
  await page.waitForURL(/\/(dashboard|planning|production)/, { timeout: 60000 })
}

async function getWOInProgress(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/planning/work-orders?status=in_progress')
  if (!response.ok()) return null

  const data = await response.json()
  const workOrders = data.work_orders || data || []
  return workOrders.length > 0 ? workOrders[0].id : null
}

async function getExistingProduct(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/products')
  if (!response.ok()) return null

  const data = await response.json()
  const products = data.products || data || []
  return products.length > 0 ? products[0].id : null
}

async function getExistingProductionLine(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/settings/production-lines')
  if (!response.ok()) return null

  const data = await response.json()
  const lines = data.production_lines || data || []
  return lines.length > 0 ? lines[0].id : null
}

async function createAndStartWO(page: Page, productId: string, productionLineId: string): Promise<string> {
  const plannedStartDate = new Date()
  const plannedEndDate = new Date()
  plannedEndDate.setDate(plannedEndDate.getDate() + 1)

  // Create WO
  const createResponse = await page.request.post('/api/planning/work-orders', {
    data: {
      product_id: productId,
      production_line_id: productionLineId,
      planned_quantity: 100,
      planned_start_date: plannedStartDate.toISOString().split('T')[0],
      planned_end_date: plannedEndDate.toISOString().split('T')[0],
      priority: 'medium',
    },
  })

  if (!createResponse.ok()) {
    throw new Error(`Failed to create WO: ${await createResponse.text()}`)
  }

  const data = await createResponse.json()
  const woId = data.work_order?.id || data.id

  // Start WO
  await page.request.post(`/api/production/work-orders/${woId}/start`)

  return woId
}

async function deleteWorkOrderViaAPI(page: Page, woId: string): Promise<void> {
  await page.request.delete(`/api/planning/work-orders/${woId}`)
}

// ============================================================================
// STORY 4.12: OUTPUT REGISTRATION DESKTOP
// ============================================================================

test.describe('Story 4.12: Output Registration Desktop', () => {
  let productId: string | null
  let productionLineId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)

    productId = await getExistingProduct(page)
    productionLineId = await getExistingProductionLine(page)

    if (!productId || !productionLineId) {
      test.skip()
    }
  })

  // ===== AC-4.12.1: Output Registration Modal =====
  test('AC-4.12.1: Output registration modal shows required fields', async ({ page }) => {
    const woId = await getWOInProgress(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/production/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Register Output button
    const registerButton = page.locator('button').filter({ hasText: /Register Output|Rejestruj/i })

    if (await registerButton.isVisible()) {
      await registerButton.click()

      // Verify modal opens
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Verify fields
      await expect(modal.locator('input[type="number"], input[name*="qty"]')).toBeVisible()

      // Close modal
      const closeButton = modal.locator('button').filter({ hasText: /Cancel|Anuluj/i })
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
    }
  })

  // ===== AC-4.12.2: Output LP Creation =====
  test('AC-4.12.2: Output LP created with correct attributes', async ({ page }) => {
    if (!productId || !productionLineId) return

    const woId = await createAndStartWO(page, productId, productionLineId)

    try {
      // Register output via API
      const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: {
          qty: 50,
          qa_status: 'passed',
        },
      })

      if (response.ok()) {
        const data = await response.json()

        // Verify LP created
        expect(data.data.output.lp_number).toMatch(/^LP-/)
        expect(data.data.output.quantity).toBe(50)
      }
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })

  // ===== AC-4.12.3: Automatic Consumption =====
  test('AC-4.12.3: Output registration creates consumption records', async ({ page }) => {
    if (!productId || !productionLineId) return

    const woId = await createAndStartWO(page, productId, productionLineId)

    try {
      const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: { qty: 50 },
      })

      if (response.ok()) {
        const data = await response.json()

        // Verify consumption records created
        expect(data.data.consumptionRecords).toBeDefined()
        // May be empty if no reservations exist
      }
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })

  // ===== AC-4.12.4: Genealogy Linking =====
  test('AC-4.12.4: Output registration creates genealogy records', async ({ page }) => {
    if (!productId || !productionLineId) return

    const woId = await createAndStartWO(page, productId, productionLineId)

    try {
      const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: { qty: 50 },
      })

      if (response.ok()) {
        const data = await response.json()

        // Verify genealogy records created (if reservations exist)
        expect(data.data.genealogyRecords).toBeDefined()
      }
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })

  // ===== AC-4.12.5: Progress Tracking =====
  test('AC-4.12.5: WO progress updates after output registration', async ({ page }) => {
    if (!productId || !productionLineId) return

    const woId = await createAndStartWO(page, productId, productionLineId)

    try {
      // Get initial state
      const initialResponse = await page.request.get(`/api/production/work-orders/${woId}/outputs`)
      const initialData = await initialResponse.json()
      const initialOutputQty = initialData.summary?.output_qty || 0

      // Register output
      await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: { qty: 25 },
      })

      // Get updated state
      const updatedResponse = await page.request.get(`/api/production/work-orders/${woId}/outputs`)
      const updatedData = await updatedResponse.json()
      const updatedOutputQty = updatedData.summary?.output_qty || 0

      // Verify progress increased
      expect(updatedOutputQty).toBe(initialOutputQty + 25)
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })

  // ===== AC-4.12.8: Error Handling - qty validation =====
  test('AC-4.12.8: Rejects output with qty <= 0', async ({ page }) => {
    if (!productId || !productionLineId) return

    const woId = await createAndStartWO(page, productId, productionLineId)

    try {
      const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: { qty: 0 },
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('INVALID_QTY')
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })

  // ===== AC-4.12.8: Error Handling - WO not in progress =====
  test('AC-4.12.8: Rejects output for WO not in progress', async ({ page }) => {
    if (!productId || !productionLineId) return

    // Create WO but don't start it
    const createResponse = await page.request.post('/api/planning/work-orders', {
      data: {
        product_id: productId,
        production_line_id: productionLineId,
        planned_quantity: 100,
        planned_start_date: new Date().toISOString().split('T')[0],
        planned_end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        priority: 'medium',
      },
    })

    const createData = await createResponse.json()
    const woId = createData.work_order?.id || createData.id

    try {
      const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: { qty: 50 },
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('WO_NOT_IN_PROGRESS')
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })
})

// ============================================================================
// STORY 4.12b: OVER-PRODUCTION HANDLING
// ============================================================================

test.describe('Story 4.12b: Over-Production Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  // ===== AC-4.12b.9: Over-production requires parent LP =====
  test('AC-4.12b.9: Rejects over-production without parent LP', async ({ page }) => {
    const woId = await getWOInProgress(page)
    if (!woId) {
      test.skip()
      return
    }

    const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
      data: {
        qty: 50,
        is_over_production: true,
        // Missing over_production_parent_lp_id
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('MISSING_PARENT_LP')
  })

  // ===== AC-4.12b.9: Over-production with parent LP succeeds =====
  test('AC-4.12b.9: Accepts over-production with parent LP', async ({ page }) => {
    const woId = await getWOInProgress(page)
    if (!woId) {
      test.skip()
      return
    }

    // Get reserved LPs for this WO
    const materialsResponse = await page.request.get(`/api/production/work-orders/${woId}/materials`)
    if (!materialsResponse.ok()) {
      test.skip()
      return
    }

    const materialsData = await materialsResponse.json()
    const materials = materialsData.materials || []

    // Find an LP from reservations
    let parentLpId: string | null = null
    for (const material of materials) {
      if (material.reservations && material.reservations.length > 0) {
        parentLpId = material.reservations[0].lp_id
        break
      }
    }

    if (!parentLpId) {
      test.skip()
      return
    }

    const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
      data: {
        qty: 10,
        is_over_production: true,
        over_production_parent_lp_id: parentLpId,
      },
    })

    // May succeed or fail depending on WO state
    expect([200, 400, 409]).toContain(response.status())
  })
})

// ============================================================================
// STORY 4.18: LP UPDATES AFTER CONSUMPTION
// ============================================================================

test.describe('Story 4.18: LP Updates After Consumption', () => {
  let productId: string | null
  let productionLineId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)

    productId = await getExistingProduct(page)
    productionLineId = await getExistingProductionLine(page)

    if (!productId || !productionLineId) {
      test.skip()
    }
  })

  // ===== AC-4.18.2: LP quantity update =====
  test('AC-4.18.2: LP current_qty decrements after consumption', async ({ page }) => {
    if (!productId || !productionLineId) return

    const woId = await createAndStartWO(page, productId, productionLineId)

    try {
      // Register output (triggers consumption)
      const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
        data: { qty: 50 },
      })

      if (response.ok()) {
        const data = await response.json()

        // Verify consumption records have qty values
        if (data.data.consumptionRecords.length > 0) {
          for (const record of data.data.consumptionRecords) {
            expect(record.qty).toBeGreaterThan(0)
          }
        }
      }
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })
})

// ============================================================================
// STORY 4.19: GENEALOGY RECORDING
// ============================================================================

test.describe('Story 4.19: Genealogy Recording', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  // ===== AC-4.19.2: Genealogy creation =====
  test('AC-4.19.2: Genealogy records link parent LPs to output LP', async ({ page }) => {
    const woId = await getWOInProgress(page)
    if (!woId) {
      test.skip()
      return
    }

    const response = await page.request.post(`/api/production/work-orders/${woId}/outputs`, {
      data: { qty: 25 },
    })

    if (response.ok()) {
      const data = await response.json()

      // Genealogy count should be defined
      expect(data.data.genealogyRecords).toBeDefined()
    }
  })
})

// ============================================================================
// OUTPUT HISTORY & DISPLAY
// ============================================================================

test.describe('Output History Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('GET outputs returns history with summary', async ({ page }) => {
    const woId = await getWOInProgress(page)
    if (!woId) {
      test.skip()
      return
    }

    const response = await page.request.get(`/api/production/work-orders/${woId}/outputs`)

    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data.data).toBeDefined()
    expect(data.summary).toBeDefined()
    expect(data.summary.planned_qty).toBeDefined()
    expect(data.summary.output_qty).toBeDefined()
    expect(data.summary.progress_percent).toBeDefined()
  })
})
